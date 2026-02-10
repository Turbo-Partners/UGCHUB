import * as cron from "node-cron";
import { db } from "../db";
import apifyService from "../services/apify";
import { instagramAccounts, users, instagramProfiles, brandCreatorMemberships } from "@shared/schema";
import { eq, isNotNull, sql, or } from "drizzle-orm";

interface SyncJobStats {
  totalProfiles: number;
  updatedProfiles: number;
  skippedProfiles: number;
  errors: string[];
}

const BATCH_SIZE = 50; // Process 50 profiles per Apify run for efficiency
const BATCH_DELAY_MS = 3000; // Reduced delay between batches
const CACHE_DAYS = 7; // Cache for 7 days to control costs

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function getProfilesForSync(): Promise<string[]> {
  const allUsernames = new Set<string>();
  
  // 1. Connected Instagram accounts (companies)
  const connectedAccounts = await db
    .select({ username: instagramAccounts.username })
    .from(instagramAccounts)
    .where(eq(instagramAccounts.isActive, true));

  for (const account of connectedAccounts) {
    if (account.username) {
      allUsernames.add(account.username.toLowerCase().replace('@', ''));
    }
  }

  // 2. Registered creators with Instagram
  const creatorsWithInstagram = await db
    .select({ instagram: users.instagram })
    .from(users)
    .where(isNotNull(users.instagram));

  for (const creator of creatorsWithInstagram) {
    if (creator.instagram) {
      const username = creator.instagram.toLowerCase()
        .replace('@', '')
        .replace('https://instagram.com/', '')
        .replace('https://www.instagram.com/', '')
        .replace('/', '');
      if (username) {
        allUsernames.add(username);
      }
    }
  }

  // 3. Community members (creators in brand communities)
  const communityMembers = await db
    .select({ 
      instagram: users.instagram 
    })
    .from(brandCreatorMemberships)
    .innerJoin(users, eq(brandCreatorMemberships.creatorId, users.id))
    .where(eq(brandCreatorMemberships.status, 'active'));

  for (const member of communityMembers) {
    if (member.instagram) {
      const username = member.instagram.toLowerCase()
        .replace('@', '')
        .replace('https://instagram.com/', '')
        .replace('https://www.instagram.com/', '')
        .replace('/', '');
      if (username) {
        allUsernames.add(username);
      }
    }
  }

  console.log(`[ApifySyncJob] Found ${allUsernames.size} unique profiles (accounts: ${connectedAccounts.length}, creators: ${creatorsWithInstagram.length}, community: ${communityMembers.length})`);

  return Array.from(allUsernames);
}

async function filterProfilesNeedingUpdate(usernames: string[]): Promise<string[]> {
  if (usernames.length === 0) return [];
  
  const cutoff = new Date(Date.now() - CACHE_DAYS * 24 * 60 * 60 * 1000);
  
  const cachedProfiles = await db
    .select({ username: instagramProfiles.username })
    .from(instagramProfiles)
    .where(sql`${instagramProfiles.lastFetchedAt} >= ${cutoff}`);

  const cachedSet = new Set(cachedProfiles.map(p => p.username.toLowerCase()));
  
  return usernames.filter(username => !cachedSet.has(username.toLowerCase()));
}

async function syncProfiles(): Promise<SyncJobStats> {
  const stats: SyncJobStats = {
    totalProfiles: 0,
    updatedProfiles: 0,
    skippedProfiles: 0,
    errors: [],
  };

  if (!apifyService.isApifyConfigured()) {
    console.log("[ApifySyncJob] Apify not configured, skipping sync");
    return stats;
  }

  try {
    console.log("[ApifySyncJob] Fetching profiles for sync...");
    
    const allProfiles = await getProfilesForSync();
    stats.totalProfiles = allProfiles.length;
    
    console.log(`[ApifySyncJob] Found ${allProfiles.length} profiles total`);

    const profilesToUpdate = await filterProfilesNeedingUpdate(allProfiles);
    stats.skippedProfiles = allProfiles.length - profilesToUpdate.length;
    
    console.log(`[ApifySyncJob] ${profilesToUpdate.length} profiles need update, ${stats.skippedProfiles} skipped (cached)`);

    if (profilesToUpdate.length === 0) {
      console.log("[ApifySyncJob] No profiles need updating");
      return stats;
    }

    const batches = chunkArray(profilesToUpdate, BATCH_SIZE);
    console.log(`[ApifySyncJob] Processing ${batches.length} batches of ${BATCH_SIZE} profiles each`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`[ApifySyncJob] Processing batch ${i + 1}/${batches.length} (${batch.length} profiles)`);

      try {
        const results = await apifyService.scrapeProfiles(batch, {
          triggeredBy: 'scheduled',
        });

        stats.updatedProfiles += results.length;
        console.log(`[ApifySyncJob] Batch ${i + 1} completed: ${results.length} profiles updated`);

        if (i < batches.length - 1) {
          await delay(BATCH_DELAY_MS);
        }
      } catch (batchError: any) {
        const errorMsg = `Batch ${i + 1} error: ${batchError.message}`;
        stats.errors.push(errorMsg);
        console.error(`[ApifySyncJob] ${errorMsg}`);
      }
    }

    console.log(`[ApifySyncJob] Sync completed: ${stats.updatedProfiles} updated, ${stats.skippedProfiles} skipped, ${stats.errors.length} errors`);

  } catch (error: any) {
    console.error("[ApifySyncJob] Error during sync:", error);
    stats.errors.push(`General error: ${error.message}`);
  }

  return stats;
}

let cronTask: ReturnType<typeof cron.schedule> | null = null;

export function initApifySyncJob(): void {
  console.log("[ApifySyncJob] Initializing profile sync scheduler...");

  cronTask = cron.schedule('0 6 * * *', async () => {
    console.log("[ApifySyncJob] Starting daily profile sync...");

    try {
      const stats = await syncProfiles();
      console.log(`[ApifySyncJob] Daily sync completed: ${stats.updatedProfiles}/${stats.totalProfiles} profiles updated`);
    } catch (error) {
      console.error("[ApifySyncJob] Error during daily sync:", error);
    }
  }, {
    timezone: "America/Sao_Paulo"
  });

  console.log("[ApifySyncJob] Profile sync scheduled for 6:00 AM daily (Brasília time)");
}

export function stopApifySyncJob(): void {
  if (cronTask) {
    cronTask.stop();
    console.log("[ApifySyncJob] Profile sync job stopped");
  }
}

export async function runManualSync(): Promise<SyncJobStats> {
  console.log("[ApifySyncJob] Running manual sync...");
  return syncProfiles();
}

export { syncProfiles };
