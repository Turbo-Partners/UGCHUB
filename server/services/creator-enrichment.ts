import { db } from '../db';
import { users, instagramAccounts, instagramProfiles, companies } from '@shared/schema';
import { eq, and, isNull, isNotNull, or, sql, lt, ne } from 'drizzle-orm';
import apifyService from './apify';
import { tryBusinessDiscoveryForProfile } from './business-discovery';
import { downloadAndSaveToStorage, getPublicUrl } from './instagram-profile-pic';

const APIFY_COST_PER_PROFILE = 0.0005;
const BD_COST = 0;

export async function findCreatorsNeedingEnrichment(limit: number = 10, forceRefresh: boolean = false) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const stalenessCondition = forceRefresh
    ? sql`TRUE`
    : or(
        isNull(instagramProfiles.id),
        lt(instagramProfiles.lastFetchedAt, sevenDaysAgo)
      );

  const creators = await db
    .select({
      id: users.id,
      name: users.name,
      instagram: users.instagram,
    })
    .from(users)
    .leftJoin(
      instagramAccounts,
      eq(users.id, instagramAccounts.userId)
    )
    .leftJoin(
      instagramProfiles,
      and(
        sql`LOWER(REPLACE(${users.instagram}, '@', '')) = LOWER(${instagramProfiles.username})`,
        eq(instagramProfiles.ownerType, 'creator' as any)
      )
    )
    .where(
      and(
        eq(users.role, 'creator'),
        isNotNull(users.instagram),
        ne(users.instagram, ''),
        isNull(instagramAccounts.id),
        stalenessCondition,
        or(
          isNull(instagramProfiles.id),
          sql`NOT (${instagramProfiles.bio} = 'INVALID_PROFILE' AND ${instagramProfiles.followers} IS NULL)`
        )
      )
    )
    .limit(limit);

  return creators.map(c => ({
    id: c.id,
    name: c.name,
    instagram: c.instagram!,
  }));
}

export async function enrichCreatorProfile(creatorId: number, username: string) {
  const cleanUsername = username.replace('@', '').replace('https://instagram.com/', '').replace('https://www.instagram.com/', '').split('/')[0].toLowerCase().trim();

  if (!cleanUsername) {
    return { success: false, source: 'failed' as const, costEstimate: 0, username };
  }

  try {
    const bizData = await tryBusinessDiscoveryForProfile(cleanUsername);

    if (bizData?.exists) {
      console.log(`[CreatorEnrichment] Business Discovery SUCCESS for @${cleanUsername} - $0 cost`);

      let profilePicUrl: string | null = null;
      let profilePicStoragePath: string | null = null;
      if (bizData.profilePicUrl) {
        profilePicStoragePath = await downloadAndSaveToStorage(cleanUsername, bizData.profilePicUrl);
        profilePicUrl = profilePicStoragePath ? getPublicUrl(profilePicStoragePath) : null;
      }

      await db.insert(instagramProfiles).values({
        username: cleanUsername,
        ownerType: 'creator' as any,
        userId: creatorId,
        source: 'business_discovery' as any,
        followers: bizData.followers || null,
        following: bizData.following || null,
        postsCount: bizData.postsCount || null,
        fullName: bizData.fullName || null,
        bio: bizData.bio || null,
        profilePicUrl: profilePicUrl || bizData.profilePicUrl || null,
        profilePicStoragePath,
        profilePicOriginalUrl: bizData.profilePicUrl || null,
        isVerified: bizData.isVerified || false,
        lastFetchedAt: new Date(),
      }).onConflictDoUpdate({
        target: [instagramProfiles.username, instagramProfiles.ownerType],
        set: {
          userId: creatorId,
          source: 'business_discovery' as any,
          followers: bizData.followers || null,
          following: bizData.following || null,
          postsCount: bizData.postsCount || null,
          fullName: bizData.fullName || null,
          bio: bizData.bio || null,
          profilePicUrl: profilePicUrl || bizData.profilePicUrl || null,
          profilePicStoragePath,
          profilePicOriginalUrl: bizData.profilePicUrl || null,
          isVerified: bizData.isVerified || false,
          lastFetchedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      await db.update(users).set({
        instagramFollowers: bizData.followers || null,
        instagramFollowing: bizData.following || null,
        instagramPosts: bizData.postsCount || null,
        instagramVerified: bizData.isVerified || false,
        instagramBio: bizData.bio || null,
        instagramProfilePic: profilePicUrl,
        instagramLastUpdated: new Date(),
      }).where(eq(users.id, creatorId));

      return { success: true, source: 'business_discovery' as const, costEstimate: BD_COST, username: cleanUsername };
    }

    console.log(`[CreatorEnrichment] Business Discovery failed for @${cleanUsername}, trying Apify...`);
    const apifyResult = await apifyService.queueProfileScrape(cleanUsername, { triggeredBy: 'enrichment' as any });

    if (apifyResult && apifyResult.username) {
      console.log(`[CreatorEnrichment] Apify SUCCESS for @${cleanUsername} - ~$${APIFY_COST_PER_PROFILE}`);

      let profilePicUrl: string | null = null;
      let profilePicStoragePath: string | null = null;
      const rawPicUrl = apifyResult.profilePicUrl || apifyResult.profilePicUrlHD || null;
      if (rawPicUrl) {
        profilePicStoragePath = await downloadAndSaveToStorage(cleanUsername, rawPicUrl);
        profilePicUrl = profilePicStoragePath ? getPublicUrl(profilePicStoragePath) : null;
      }

      await db.insert(instagramProfiles).values({
        username: cleanUsername,
        ownerType: 'creator' as any,
        userId: creatorId,
        source: 'apify',
        followers: apifyResult.followersCount || null,
        following: apifyResult.followsCount || null,
        postsCount: apifyResult.postsCount || null,
        fullName: apifyResult.fullName || null,
        bio: apifyResult.biography || null,
        profilePicUrl: profilePicUrl || rawPicUrl,
        profilePicStoragePath,
        profilePicOriginalUrl: rawPicUrl,
        isVerified: apifyResult.isVerified || false,
        lastFetchedAt: new Date(),
      }).onConflictDoUpdate({
        target: [instagramProfiles.username, instagramProfiles.ownerType],
        set: {
          userId: creatorId,
          source: 'apify',
          followers: apifyResult.followersCount || null,
          following: apifyResult.followsCount || null,
          postsCount: apifyResult.postsCount || null,
          fullName: apifyResult.fullName || null,
          bio: apifyResult.biography || null,
          profilePicUrl: profilePicUrl || rawPicUrl,
          profilePicStoragePath,
          profilePicOriginalUrl: rawPicUrl,
          isVerified: apifyResult.isVerified || false,
          lastFetchedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      await db.update(users).set({
        instagramFollowers: apifyResult.followersCount || null,
        instagramFollowing: apifyResult.followsCount || null,
        instagramPosts: apifyResult.postsCount || null,
        instagramVerified: apifyResult.isVerified || false,
        instagramBio: apifyResult.biography || null,
        instagramProfilePic: profilePicUrl,
        instagramLastUpdated: new Date(),
      }).where(eq(users.id, creatorId));

      return { success: true, source: 'apify' as const, costEstimate: APIFY_COST_PER_PROFILE, username: cleanUsername };
    }

    console.log(`[CreatorEnrichment] Both sources FAILED for @${cleanUsername}`);
    return { success: false, source: 'failed' as const, costEstimate: APIFY_COST_PER_PROFILE, username: cleanUsername };
  } catch (error: any) {
    console.error(`[CreatorEnrichment] Error enriching @${cleanUsername}:`, error.message);
    return { success: false, source: 'failed' as const, costEstimate: 0, username: cleanUsername };
  }
}

export async function runBatchEnrichment(options: { limit?: number; forceRefresh?: boolean } = {}) {
  const { limit = 10, forceRefresh = false } = options;

  console.log(`[CreatorEnrichment] Starting batch enrichment - limit: ${limit}, forceRefresh: ${forceRefresh}`);

  const creators = await findCreatorsNeedingEnrichment(limit, forceRefresh);

  console.log(`[CreatorEnrichment] Found ${creators.length} creators needing enrichment`);

  const results: Array<{ creatorId: number; username: string; source: string; success: boolean; costEstimate: number }> = [];
  let enriched = 0;
  let failed = 0;
  let skipped = 0;
  let totalCostEstimate = 0;

  for (let i = 0; i < creators.length; i++) {
    const creator = creators[i];
    const cleanUsername = creator.instagram.replace('@', '').replace('https://instagram.com/', '').replace('https://www.instagram.com/', '').split('/')[0].toLowerCase().trim();

    if (!cleanUsername) {
      console.log(`[CreatorEnrichment] Skipping creator ${creator.id} - invalid username`);
      skipped++;
      results.push({ creatorId: creator.id, username: creator.instagram, source: 'skipped', success: false, costEstimate: 0 });
      continue;
    }

    console.log(`[CreatorEnrichment] Processing ${i + 1}/${creators.length}: @${cleanUsername} (creator #${creator.id})`);

    const result = await enrichCreatorProfile(creator.id, cleanUsername);

    if (result.success) {
      enriched++;
    } else {
      failed++;
    }

    totalCostEstimate += result.costEstimate;
    results.push({
      creatorId: creator.id,
      username: result.username,
      source: result.source,
      success: result.success,
      costEstimate: result.costEstimate,
    });

    if (i < creators.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  const summary = {
    total: creators.length,
    enriched,
    failed,
    skipped,
    totalCostEstimate,
    results,
  };

  console.log(`[CreatorEnrichment] Batch complete: ${enriched} enriched, ${failed} failed, ${skipped} skipped. Cost: ~$${totalCostEstimate.toFixed(4)}`);

  return summary;
}

export async function getEnrichmentStats() {
  const [totalWithInstagram] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(
      and(
        eq(users.role, 'creator'),
        isNotNull(users.instagram),
        ne(users.instagram, '')
      )
    );

  const [withOAuth] = await db
    .select({ count: sql<number>`count(DISTINCT ${instagramAccounts.userId})` })
    .from(instagramAccounts)
    .innerJoin(users, eq(instagramAccounts.userId, users.id))
    .where(eq(users.role, 'creator'));

  const [enrichedCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(instagramProfiles)
    .where(
      and(
        eq(instagramProfiles.ownerType, 'creator' as any),
        isNotNull(instagramProfiles.followers)
      )
    );

  const enrichedBySource = await db
    .select({
      source: instagramProfiles.source,
      count: sql<number>`count(*)`,
    })
    .from(instagramProfiles)
    .where(
      and(
        eq(instagramProfiles.ownerType, 'creator' as any),
        isNotNull(instagramProfiles.followers)
      )
    )
    .groupBy(instagramProfiles.source);

  const sourceBreakdown: Record<string, number> = {};
  for (const row of enrichedBySource) {
    sourceBreakdown[row.source] = Number(row.count);
  }

  const apifyCount = sourceBreakdown['apify'] || 0;
  const estimatedTotalCost = apifyCount * APIFY_COST_PER_PROFILE;

  const totalCreators = Number(totalWithInstagram?.count || 0);
  const oauthCreators = Number(withOAuth?.count || 0);
  const enrichedCreators = Number(enrichedCount?.count || 0);
  const pendingEnrichment = Math.max(0, totalCreators - oauthCreators - enrichedCreators);

  const [lastRun] = await db
    .select({ lastFetchedAt: instagramProfiles.lastFetchedAt })
    .from(instagramProfiles)
    .where(eq(instagramProfiles.ownerType, 'creator' as any))
    .orderBy(sql`${instagramProfiles.lastFetchedAt} DESC NULLS LAST`)
    .limit(1);

  const [totalCompaniesWithInstagram] = await db
    .select({ count: sql<number>`count(*)` })
    .from(companies)
    .where(
      and(
        isNotNull(companies.instagram),
        ne(companies.instagram, '')
      )
    );

  const [enrichedCompanyCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(instagramProfiles)
    .where(
      and(
        eq(instagramProfiles.ownerType, 'company' as any),
        isNotNull(instagramProfiles.followers)
      )
    );

  const companyEnrichedBySource = await db
    .select({
      source: instagramProfiles.source,
      count: sql<number>`count(*)`,
    })
    .from(instagramProfiles)
    .where(
      and(
        eq(instagramProfiles.ownerType, 'company' as any),
        isNotNull(instagramProfiles.followers)
      )
    )
    .groupBy(instagramProfiles.source);

  const companySourceBreakdown: Record<string, number> = {};
  for (const row of companyEnrichedBySource) {
    companySourceBreakdown[row.source] = Number(row.count);
  }

  const totalCompanies = Number(totalCompaniesWithInstagram?.count || 0);
  const enrichedCompanies = Number(enrichedCompanyCount?.count || 0);
  const companiesPending = Math.max(0, totalCompanies - enrichedCompanies);

  const companyApifyCount = companySourceBreakdown['apify'] || 0;
  const totalApifyCost = (apifyCount + companyApifyCount) * APIFY_COST_PER_PROFILE;

  return {
    totalCreatorsWithInstagram: totalCreators,
    creatorsWithOAuth: oauthCreators,
    creatorsEnriched: enrichedCreators,
    creatorsPendingEnrichment: pendingEnrichment,
    lastEnrichmentRun: lastRun?.lastFetchedAt || null,
    sourceBreakdown,
    estimatedTotalCost: totalApifyCost,
    companies: {
      totalWithInstagram: totalCompanies,
      enriched: enrichedCompanies,
      pending: companiesPending,
      sourceBreakdown: companySourceBreakdown,
    },
  };
}

export async function findCompaniesNeedingEnrichment(limit: number = 10, forceRefresh: boolean = false) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const stalenessCondition = forceRefresh
    ? sql`TRUE`
    : or(
        isNull(instagramProfiles.id),
        lt(instagramProfiles.lastFetchedAt, sevenDaysAgo)
      );

  const result = await db
    .select({
      id: companies.id,
      name: companies.name,
      instagram: companies.instagram,
    })
    .from(companies)
    .leftJoin(
      instagramProfiles,
      and(
        sql`LOWER(REPLACE(${companies.instagram}, '@', '')) = LOWER(${instagramProfiles.username})`,
        eq(instagramProfiles.ownerType, 'company' as any)
      )
    )
    .where(
      and(
        isNotNull(companies.instagram),
        ne(companies.instagram, ''),
        stalenessCondition,
        or(
          isNull(instagramProfiles.id),
          sql`NOT (${instagramProfiles.bio} = 'INVALID_PROFILE' AND ${instagramProfiles.followers} IS NULL)`
        )
      )
    )
    .limit(limit);

  return result.map(c => ({
    id: c.id,
    name: c.name,
    instagram: c.instagram!,
  }));
}

export async function enrichCompanyProfile(companyId: number, username: string) {
  const cleanUsername = username.replace('@', '').replace('https://instagram.com/', '').replace('https://www.instagram.com/', '').split('/')[0].toLowerCase().trim();

  if (!cleanUsername) {
    return { success: false, source: 'failed' as const, costEstimate: 0, username };
  }

  try {
    const bizData = await tryBusinessDiscoveryForProfile(cleanUsername);

    if (bizData?.exists) {
      console.log(`[CompanyEnrichment] Business Discovery SUCCESS for @${cleanUsername} - $0 cost`);

      let profilePicUrl: string | null = null;
      let profilePicStoragePath: string | null = null;
      if (bizData.profilePicUrl) {
        profilePicStoragePath = await downloadAndSaveToStorage(cleanUsername, bizData.profilePicUrl);
        profilePicUrl = profilePicStoragePath ? getPublicUrl(profilePicStoragePath) : null;
      }

      await db.insert(instagramProfiles).values({
        username: cleanUsername,
        ownerType: 'company' as any,
        companyId,
        source: 'business_discovery' as any,
        followers: bizData.followers || null,
        following: bizData.following || null,
        postsCount: bizData.postsCount || null,
        fullName: bizData.fullName || null,
        bio: bizData.bio || null,
        profilePicUrl: profilePicUrl || bizData.profilePicUrl || null,
        profilePicStoragePath,
        profilePicOriginalUrl: bizData.profilePicUrl || null,
        isVerified: bizData.isVerified || false,
        lastFetchedAt: new Date(),
      }).onConflictDoUpdate({
        target: [instagramProfiles.username, instagramProfiles.ownerType],
        set: {
          companyId,
          source: 'business_discovery' as any,
          followers: bizData.followers || null,
          following: bizData.following || null,
          postsCount: bizData.postsCount || null,
          fullName: bizData.fullName || null,
          bio: bizData.bio || null,
          profilePicUrl: profilePicUrl || bizData.profilePicUrl || null,
          profilePicStoragePath,
          profilePicOriginalUrl: bizData.profilePicUrl || null,
          isVerified: bizData.isVerified || false,
          lastFetchedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      await db.update(companies).set({
        instagramFollowers: bizData.followers || null,
        instagramFollowing: bizData.following || null,
        instagramPosts: bizData.postsCount || null,
        instagramVerified: bizData.isVerified || false,
        instagramBio: bizData.bio || null,
        instagramProfilePic: profilePicUrl,
        instagramLastUpdated: new Date(),
      }).where(eq(companies.id, companyId));

      return { success: true, source: 'business_discovery' as const, costEstimate: BD_COST, username: cleanUsername };
    }

    console.log(`[CompanyEnrichment] Business Discovery failed for @${cleanUsername}, trying Apify...`);
    const apifyResult = await apifyService.queueProfileScrape(cleanUsername, { triggeredBy: 'enrichment' as any });

    if (apifyResult && apifyResult.username) {
      console.log(`[CompanyEnrichment] Apify SUCCESS for @${cleanUsername} - ~$${APIFY_COST_PER_PROFILE}`);

      let profilePicUrl: string | null = null;
      let profilePicStoragePath: string | null = null;
      const rawPicUrl = apifyResult.profilePicUrl || apifyResult.profilePicUrlHD || null;
      if (rawPicUrl) {
        profilePicStoragePath = await downloadAndSaveToStorage(cleanUsername, rawPicUrl);
        profilePicUrl = profilePicStoragePath ? getPublicUrl(profilePicStoragePath) : null;
      }

      await db.insert(instagramProfiles).values({
        username: cleanUsername,
        ownerType: 'company' as any,
        companyId,
        source: 'apify',
        followers: apifyResult.followersCount || null,
        following: apifyResult.followsCount || null,
        postsCount: apifyResult.postsCount || null,
        fullName: apifyResult.fullName || null,
        bio: apifyResult.biography || null,
        profilePicUrl: profilePicUrl || rawPicUrl,
        profilePicStoragePath,
        profilePicOriginalUrl: rawPicUrl,
        isVerified: apifyResult.isVerified || false,
        lastFetchedAt: new Date(),
      }).onConflictDoUpdate({
        target: [instagramProfiles.username, instagramProfiles.ownerType],
        set: {
          companyId,
          source: 'apify',
          followers: apifyResult.followersCount || null,
          following: apifyResult.followsCount || null,
          postsCount: apifyResult.postsCount || null,
          fullName: apifyResult.fullName || null,
          bio: apifyResult.biography || null,
          profilePicUrl: profilePicUrl || rawPicUrl,
          profilePicStoragePath,
          profilePicOriginalUrl: rawPicUrl,
          isVerified: apifyResult.isVerified || false,
          lastFetchedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      await db.update(companies).set({
        instagramFollowers: apifyResult.followersCount || null,
        instagramFollowing: apifyResult.followsCount || null,
        instagramPosts: apifyResult.postsCount || null,
        instagramVerified: apifyResult.isVerified || false,
        instagramBio: apifyResult.biography || null,
        instagramProfilePic: profilePicUrl,
        instagramLastUpdated: new Date(),
      }).where(eq(companies.id, companyId));

      return { success: true, source: 'apify' as const, costEstimate: APIFY_COST_PER_PROFILE, username: cleanUsername };
    }

    console.log(`[CompanyEnrichment] Both sources FAILED for @${cleanUsername}`);
    return { success: false, source: 'failed' as const, costEstimate: APIFY_COST_PER_PROFILE, username: cleanUsername };
  } catch (error: any) {
    console.error(`[CompanyEnrichment] Error enriching @${cleanUsername}:`, error.message);
    return { success: false, source: 'failed' as const, costEstimate: 0, username: cleanUsername };
  }
}

export async function runBatchCompanyEnrichment(options: { limit?: number; forceRefresh?: boolean } = {}) {
  const { limit = 10, forceRefresh = false } = options;

  console.log(`[CompanyEnrichment] Starting batch enrichment - limit: ${limit}, forceRefresh: ${forceRefresh}`);

  const companiesList = await findCompaniesNeedingEnrichment(limit, forceRefresh);

  console.log(`[CompanyEnrichment] Found ${companiesList.length} companies needing enrichment`);

  const results: Array<{ companyId: number; username: string; source: string; success: boolean; costEstimate: number }> = [];
  let enriched = 0;
  let failed = 0;
  let skipped = 0;
  let totalCostEstimate = 0;

  for (let i = 0; i < companiesList.length; i++) {
    const company = companiesList[i];
    const cleanUsername = company.instagram.replace('@', '').replace('https://instagram.com/', '').replace('https://www.instagram.com/', '').split('/')[0].toLowerCase().trim();

    if (!cleanUsername) {
      console.log(`[CompanyEnrichment] Skipping company ${company.id} - invalid username`);
      skipped++;
      results.push({ companyId: company.id, username: company.instagram, source: 'skipped', success: false, costEstimate: 0 });
      continue;
    }

    console.log(`[CompanyEnrichment] Processing ${i + 1}/${companiesList.length}: @${cleanUsername} (company #${company.id})`);

    const result = await enrichCompanyProfile(company.id, cleanUsername);

    if (result.success) {
      enriched++;
    } else {
      failed++;
    }

    totalCostEstimate += result.costEstimate;
    results.push({
      companyId: company.id,
      username: result.username,
      source: result.source,
      success: result.success,
      costEstimate: result.costEstimate,
    });

    if (i < companiesList.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  const summary = {
    total: companiesList.length,
    enriched,
    failed,
    skipped,
    totalCostEstimate,
    results,
  };

  console.log(`[CompanyEnrichment] Batch complete: ${enriched} enriched, ${failed} failed, ${skipped} skipped. Cost: ~$${totalCostEstimate.toFixed(4)}`);

  return summary;
}
