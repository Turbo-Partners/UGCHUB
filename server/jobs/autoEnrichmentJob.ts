import { enrichCreatorProfile } from '../services/enrichment';
import { getOrFetchProfilePic } from '../services/instagram-profile-pic';
import { batchEnrichMissingProfilePics, batchEnrichMissingData } from '../services/enrichment';
import { runBatchCompanyEnrichment } from '../services/creator-enrichment';
import { storage } from '../storage';
import { db } from '../db';
import { users, companies } from '@shared/schema';
import { eq, and, isNotNull, sql } from 'drizzle-orm';

const pendingQueue: Array<{ userId: number; instagram: string }> = [];
let isProcessing = false;
let dailyJobStarted = false;

export async function triggerCreatorEnrichment(userId: number, instagramUsername: string) {
  const cleanUsername = instagramUsername.replace('@', '').trim().toLowerCase();
  if (!cleanUsername) return;

  const alreadyQueued = pendingQueue.some((item) => item.userId === userId);
  if (alreadyQueued) return;

  pendingQueue.push({ userId, instagram: cleanUsername });
  console.log(`[AutoEnrich] Queued enrichment for user ${userId} (@${cleanUsername})`);

  processQueue();
}

async function processQueue() {
  if (isProcessing || pendingQueue.length === 0) return;
  isProcessing = true;

  while (pendingQueue.length > 0) {
    const item = pendingQueue.shift()!;
    try {
      const picResult = await getOrFetchProfilePic(item.instagram);
      if (picResult.publicUrl) {
        await storage.updateUser(item.userId, { instagramProfilePic: picResult.publicUrl });
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const result = await enrichCreatorProfile(item.userId, {
        includeInstagram: true,
        includeTikTok: false,
      });
      if (result.success) {
        console.log(
          `[AutoEnrich] Enriched user ${item.userId} (@${item.instagram}): ${result.enrichedFields.join(', ')} [${result.source}, ~$${result.costEstimate.toFixed(4)}]`,
        );

        // Create analytics snapshot after successful enrichment
        if (result.enrichedFields.includes('instagram')) {
          try {
            const updatedUser = await storage.getUser(item.userId);
            if (updatedUser?.instagramFollowers) {
              await storage.createAnalyticsHistoryEntry({
                userId: item.userId,
                platform: 'instagram',
                followers: updatedUser.instagramFollowers,
                engagementRate: updatedUser.instagramEngagementRate || '0%',
              });
            }
          } catch (snapshotErr) {
            console.error(
              `[AutoEnrich] Snapshot creation error for user ${item.userId}:`,
              snapshotErr,
            );
          }
        }
      } else {
        console.log(
          `[AutoEnrich] Could not enrich user ${item.userId} (@${item.instagram}): ${result.errors.join(', ')}`,
        );
      }
    } catch (error) {
      console.error(`[AutoEnrich] Error enriching user ${item.userId}:`, error);
    }

    if (pendingQueue.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  isProcessing = false;
}

async function runDailyCatchUp() {
  console.log('[AutoEnrich] Running daily catch-up for missed profiles...');
  try {
    const picsResult = await batchEnrichMissingProfilePics(1000);
    if (picsResult.enriched > 0) {
      console.log(
        `[AutoEnrich] Daily catch-up pics: ${picsResult.enriched}/${picsResult.total} enriched (~$${picsResult.costEstimate.toFixed(4)})`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));

    const dataResult = await batchEnrichMissingData(1000);
    if (dataResult.enriched > 0) {
      console.log(
        `[AutoEnrich] Daily catch-up data: ${dataResult.enriched}/${dataResult.total} enriched (~$${dataResult.costEstimate.toFixed(4)})`,
      );
    }

    const total = picsResult.enriched + dataResult.enriched;
    if (total === 0) {
      console.log('[AutoEnrich] Daily catch-up creators: all profiles up to date.');
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));

    const companyResult = await runBatchCompanyEnrichment({ limit: 10 });
    if (companyResult.enriched > 0) {
      console.log(
        `[AutoEnrich] Daily catch-up companies: ${companyResult.enriched}/${companyResult.total} enriched (~$${companyResult.totalCostEstimate.toFixed(4)})`,
      );
    } else {
      console.log('[AutoEnrich] Daily catch-up companies: all profiles up to date.');
    }
  } catch (error) {
    console.error('[AutoEnrich] Daily catch-up error:', error);
  }
}

export function startDailyCatchUpJob() {
  if (dailyJobStarted) return;
  dailyJobStarted = true;

  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  setTimeout(async () => {
    console.log('[AutoEnrich] Running initial catch-up for existing profiles...');
    try {
      await migrateExpiredCdnUrls();
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const picsResult = await batchEnrichMissingProfilePics(1000);
      if (picsResult.enriched > 0) {
        console.log(
          `[AutoEnrich] Initial pics: ${picsResult.enriched}/${picsResult.total} enriched (~$${picsResult.costEstimate.toFixed(4)})`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const dataResult = await batchEnrichMissingData(1000);
      if (dataResult.enriched > 0) {
        console.log(
          `[AutoEnrich] Initial data: ${dataResult.enriched}/${dataResult.total} enriched (~$${dataResult.costEstimate.toFixed(4)})`,
        );
      }
      const total = picsResult.enriched + dataResult.enriched;
      if (total === 0) {
        console.log('[AutoEnrich] Initial catch-up creators: all profiles up to date.');
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));

      const companyResult = await runBatchCompanyEnrichment({ limit: 10 });
      if (companyResult.enriched > 0) {
        console.log(
          `[AutoEnrich] Initial companies: ${companyResult.enriched}/${companyResult.total} enriched (~$${companyResult.totalCostEstimate.toFixed(4)})`,
        );
      } else {
        console.log('[AutoEnrich] Initial catch-up companies: all profiles up to date.');
      }
    } catch (error) {
      console.error('[AutoEnrich] Initial catch-up error:', error);
    }
  }, 30000);

  setInterval(() => {
    runDailyCatchUp();
  }, TWENTY_FOUR_HOURS);

  console.log('[AutoEnrich] Daily catch-up job scheduled (initial run in 30s, then once per day)');
}

async function migrateExpiredCdnUrls() {
  try {
    const creatorsWithCdnUrls = await db
      .select({
        id: users.id,
        instagram: users.instagram,
        instagramProfilePic: users.instagramProfilePic,
      })
      .from(users)
      .where(
        and(
          eq(users.role, 'creator'),
          isNotNull(users.instagram),
          isNotNull(users.instagramProfilePic),
          sql`${users.instagramProfilePic} NOT LIKE '/api/storage/%'`,
        ),
      );

    if (creatorsWithCdnUrls.length === 0) {
      console.log('[AutoEnrich] No expired CDN URLs to migrate.');
      return;
    }

    console.log(
      `[AutoEnrich] Found ${creatorsWithCdnUrls.length} creators with non-storage profile pics, clearing...`,
    );
    for (const c of creatorsWithCdnUrls) {
      await db.update(users).set({ instagramProfilePic: null }).where(eq(users.id, c.id));
    }
    console.log(
      `[AutoEnrich] Cleared ${creatorsWithCdnUrls.length} creator expired CDN URLs (will re-fetch via free APIs on next enrichment)`,
    );

    const companiesWithCdnUrls = await db
      .select({
        id: companies.id,
        instagram: companies.instagram,
        instagramProfilePic: companies.instagramProfilePic,
      })
      .from(companies)
      .where(
        and(
          isNotNull(companies.instagram),
          isNotNull(companies.instagramProfilePic),
          sql`${companies.instagramProfilePic} NOT LIKE '/api/storage/%'`,
        ),
      );

    if (companiesWithCdnUrls.length > 0) {
      console.log(
        `[AutoEnrich] Found ${companiesWithCdnUrls.length} companies with non-storage profile pics, clearing...`,
      );
      for (const c of companiesWithCdnUrls) {
        await db.update(companies).set({ instagramProfilePic: null }).where(eq(companies.id, c.id));
      }
      console.log(`[AutoEnrich] Cleared ${companiesWithCdnUrls.length} company expired CDN URLs`);
    }
  } catch (error) {
    console.error('[AutoEnrich] CDN URL migration error:', error);
  }
}

export function getEnrichmentQueueStatus() {
  return {
    queueLength: pendingQueue.length,
    isProcessing,
  };
}
