import { ApifyClient } from 'apify-client';
import { db } from '../db';
import { 
  profileSnapshots, 
  dataSourceRegistry,
  tiktokProfiles,
  tiktokVideos,
  youtubeChannels,
  youtubeVideos,
  instagramProfiles,
  instagramPosts,
  instagramAccounts,
  type InsertTikTokProfile,
  type InsertTikTokVideo,
  type InsertYouTubeVideo,
} from '@shared/schema';
import { eq, desc, and, gte, sql } from 'drizzle-orm';

const APIFY_TOKEN = process.env.APIFY_API_KEY;

const client = APIFY_TOKEN ? new ApifyClient({ token: APIFY_TOKEN }) : null;

const ACTORS = {
  // Instagram
  PROFILE_SCRAPER: 'apify/instagram-profile-scraper',
  POST_SCRAPER: 'apify/instagram-post-scraper',
  REEL_SCRAPER: 'apify/instagram-reel-scraper',
  GENERAL_SCRAPER: 'apify/instagram-scraper',
  API_SCRAPER: 'apify/instagram-api-scraper',
  // TikTok
  TIKTOK_SCRAPER: 'clockworks/tiktok-scraper',
  TIKTOK_FREE: 'clockworks/free-tiktok-scraper',
  // Meta Ads
  FACEBOOK_ADS: 'apify/facebook-ads-scraper',
  FACEBOOK_ADS_LIBRARY: 'curious_coder/facebook-ads-library-scraper',
  FACEBOOK_ADS_PRO: 'dz_omar/facebook-ads-scraper-pro',
  // YouTube
  YOUTUBE_SCRAPER: 'streamers/youtube-scraper',
  YOUTUBE_SHORTS: 'streamers/youtube-shorts-scraper',
  // E-commerce
  ECOMMERCE_TOOL: 'apify/e-commerce-scraping-tool',
  WEBSITE_CRAWLER: 'apify/website-content-crawler',
  // Discovery
  INFLUENCER_DISCOVERY: 'apify/influencer-discovery-agent',
  GOOGLE_MAPS_EMAIL: 'lukaskrivka/google-maps-with-contact-details',
  GOOGLE_MAPS_EXTRACTOR: 'compass/google-maps-extractor',
  // SEO
  AHREFS_SCRAPER: 'radeance/ahrefs-scraper',
  // YouTube Channel
  YOUTUBE_CHANNEL: 'apidojo/youtube-channel-scraper',
};

interface ApifyRunOptions {
  triggeredBy?: 'scheduled' | 'on_demand' | 'webhook';
  triggeredByUserId?: number;
}

async function logApifyCall(
  actorId: string, 
  inputParams: any, 
  options: ApifyRunOptions = {}
): Promise<number> {
  console.log(`[Apify] Call logged: ${actorId}`);
  return 0;
}

async function updateApifyLog(
  logId: number, 
  updates: Record<string, any>
) {
}

async function runActor<T = any>(
  actorId: string, 
  input: any, 
  options: ApifyRunOptions = {}
): Promise<{ items: T[]; logId: number }> {
  if (!client) {
    throw new Error('Apify client not initialized. Please set APIFY_API_KEY environment variable.');
  }

  const logId = await logApifyCall(actorId, input, options);
  const startTime = Date.now();

  try {
    await updateApifyLog(logId, { status: 'running' });

    const run = await client.actor(actorId).call(input, {
      timeout: 120,
      waitSecs: 60,
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    const durationMs = Date.now() - startTime;
    const resultCount = items.length;

    await updateApifyLog(logId, {
      status: 'succeeded',
      runId: run.id,
      resultCount,
      durationMs,
      completedAt: new Date(),
    });

    return { items: items as T[], logId };
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    await updateApifyLog(logId, {
      status: 'failed',
      durationMs,
      errorMessage: error.message,
      completedAt: new Date(),
    });
    throw error;
  }
}

export interface ProfileScraperResult {
  username: string;
  fullName?: string;
  biography?: string;
  profilePicUrl?: string;
  profilePicUrlHD?: string;
  followersCount?: number;
  followsCount?: number;
  postsCount?: number;
  isVerified?: boolean;
  isPrivate?: boolean;
  isBusinessAccount?: boolean;
  externalUrl?: string;
  businessCategory?: string;
  igId?: string;
  [key: string]: any;
}

export interface PostScraperResult {
  id: string;
  shortCode?: string;
  type?: string;
  caption?: string;
  displayUrl?: string;
  videoUrl?: string;
  likesCount?: number;
  commentsCount?: number;
  videoViewCount?: number;
  videoPlayCount?: number;
  hashtags?: string[];
  mentions?: string[];
  url?: string;
  locationName?: string;
  locationId?: string;
  timestamp?: string;
  ownerUsername?: string;
  ownerId?: string;
  dimensionsHeight?: number;
  dimensionsWidth?: number;
  images?: string[];
  childPosts?: any[];
  taggedUsers?: string[];
  isSponsored?: boolean;
  topComments?: any[];
  [key: string]: any;
}

export interface ReelScraperResult {
  id: string;
  shortCode?: string;
  caption?: string;
  displayUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  likesCount?: number;
  commentsCount?: number;
  playCount?: number;
  sharesCount?: number;
  duration?: number;
  musicInfo?: { title?: string; artist?: string; coverUrl?: string };
  transcript?: string;
  hashtags?: string[];
  mentions?: string[];
  timestamp?: string;
  ownerUsername?: string;
  [key: string]: any;
}

export async function getCacheAge(username: string): Promise<number | null> {
  const [cached] = await db.select({ lastFetchedAt: instagramProfiles.lastFetchedAt })
    .from(instagramProfiles)
    .where(and(
      eq(instagramProfiles.username, username.toLowerCase()),
      eq(instagramProfiles.ownerType, 'external')
    ))
    .limit(1);

  if (!cached?.lastFetchedAt) return null;
  
  return (Date.now() - cached.lastFetchedAt.getTime()) / (1000 * 60 * 60);
}

export async function shouldFetchProfile(
  username: string, 
  cacheHours: number = 24
): Promise<boolean> {
  const cacheAge = await getCacheAge(username);
  if (cacheAge === null) return true;
  return cacheAge >= cacheHours;
}

export async function scrapeProfiles(
  usernames: string[],
  options: ApifyRunOptions = {}
): Promise<ProfileScraperResult[]> {
  if (usernames.length === 0) return [];

  const { items } = await runActor<any>(
    ACTORS.API_SCRAPER,
    {
      directUrls: usernames.map(u => `https://www.instagram.com/${u}/`),
      resultsType: "details",
      resultsLimit: usernames.length,
    },
    options
  );

  const normalizedItems: ProfileScraperResult[] = items.map((raw: any) => ({
    username: raw.username || '',
    fullName: raw.fullName || raw.full_name || '',
    biography: raw.biography || '',
    followersCount: raw.followersCount ?? raw.edge_followed_by?.count,
    followsCount: raw.followsCount ?? raw.edge_follow?.count,
    postsCount: raw.postsCount ?? raw.edge_owner_to_timeline_media?.count,
    profilePicUrl: raw.profilePicUrl || raw.profilePicUrlHD || raw.profile_pic_url_hd || raw.profile_pic_url || '',
    profilePicUrlHD: raw.profilePicUrlHD || raw.profile_pic_url_hd || '',
    isVerified: raw.verified ?? raw.is_verified ?? false,
    isPrivate: raw.private ?? raw.is_private ?? false,
    isBusinessAccount: raw.isBusinessAccount ?? raw.is_business_account ?? false,
    externalUrl: raw.externalUrl || raw.external_url || '',
    businessCategory: raw.businessCategoryName || raw.business_category_name || raw.businessCategory || '',
    igId: raw.igId || raw.id || '',
  }));

  for (const profile of normalizedItems) {
    if (!profile.username) continue;

    await db.insert(profileSnapshots).values({
      username: profile.username,
      followersCount: profile.followersCount,
      followsCount: profile.followsCount,
      postsCount: profile.postsCount,
      isVerified: profile.isVerified,
      isPrivate: profile.isPrivate,
      biography: profile.biography,
      fullName: profile.fullName,
      profilePicUrl: profile.profilePicUrl,
      externalUrl: profile.externalUrl,
      businessCategory: profile.businessCategory,
      rawData: profile,
    });

    await db.insert(instagramProfiles).values({
      username: profile.username.toLowerCase(),
      ownerType: 'external',
      source: 'apify',
      fullName: profile.fullName,
      bio: profile.biography,
      profilePicUrl: profile.profilePicUrl,
      followers: profile.followersCount,
      following: profile.followsCount,
      postsCount: profile.postsCount,
      isVerified: profile.isVerified,
      isPrivate: profile.isPrivate,
      externalUrl: profile.externalUrl,
      lastFetchedAt: new Date(),
    }).onConflictDoUpdate({
      target: [instagramProfiles.username, instagramProfiles.ownerType],
      set: {
        fullName: profile.fullName,
        bio: profile.biography,
        profilePicUrl: profile.profilePicUrl,
        followers: profile.followersCount,
        following: profile.followsCount,
        postsCount: profile.postsCount,
        isVerified: profile.isVerified,
        isPrivate: profile.isPrivate,
        externalUrl: profile.externalUrl,
        lastFetchedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  return normalizedItems;
}

// ==================== Detailed Profile Scraper ====================
// Uses apify/instagram-profile-scraper for richer data (engagement, category, etc.)

export interface DetailedProfileResult extends ProfileScraperResult {
  engagementRate?: number;
  avgLikes?: number;
  avgComments?: number;
  avgVideoViews?: number;
  categoryEnum?: string;
  contactPhoneNumber?: string;
  publicEmail?: string;
  addressStreet?: string;
  cityName?: string;
  recentPosts?: any[];
}

export async function scrapeProfilesDetailed(
  usernames: string[],
  options: ApifyRunOptions = {}
): Promise<DetailedProfileResult[]> {
  if (usernames.length === 0) return [];

  const { items } = await runActor<any>(
    ACTORS.PROFILE_SCRAPER,
    {
      usernames: usernames.map(u => u.replace('@', '').toLowerCase()),
    },
    options
  );

  const normalizedItems: DetailedProfileResult[] = items.map((raw: any) => ({
    username: raw.username || '',
    fullName: raw.fullName || raw.full_name || '',
    biography: raw.biography || raw.bio || '',
    followersCount: raw.followersCount ?? raw.followedByCount ?? raw.edge_followed_by?.count,
    followsCount: raw.followsCount ?? raw.followCount ?? raw.edge_follow?.count,
    postsCount: raw.postsCount ?? raw.mediaCount ?? raw.edge_owner_to_timeline_media?.count,
    profilePicUrl: raw.profilePicUrl || raw.profilePicUrlHD || raw.profile_pic_url_hd || raw.profile_pic_url || '',
    profilePicUrlHD: raw.profilePicUrlHD || raw.profile_pic_url_hd || '',
    isVerified: raw.verified ?? raw.is_verified ?? false,
    isPrivate: raw.private ?? raw.is_private ?? false,
    isBusinessAccount: raw.isBusinessAccount ?? raw.is_business_account ?? false,
    externalUrl: raw.externalUrl || raw.external_url || '',
    businessCategory: raw.businessCategoryName || raw.business_category_name || raw.businessCategory || raw.categoryEnum || '',
    igId: raw.igId || raw.id || raw.pk || '',
    engagementRate: raw.engagementRate,
    avgLikes: raw.avgLikes ?? raw.averageLikes,
    avgComments: raw.avgComments ?? raw.averageComments,
    avgVideoViews: raw.avgVideoViews ?? raw.averageVideoViews,
    categoryEnum: raw.categoryEnum || raw.category_enum || '',
    contactPhoneNumber: raw.contactPhoneNumber || raw.contact_phone_number || '',
    publicEmail: raw.publicEmail || raw.public_email || '',
    addressStreet: raw.addressStreet || raw.address_street || '',
    cityName: raw.cityName || raw.city_name || '',
    recentPosts: raw.latestPosts || raw.recentPosts || [],
  }));

  for (const profile of normalizedItems) {
    if (!profile.username) continue;

    await db.insert(profileSnapshots).values({
      username: profile.username,
      followersCount: profile.followersCount,
      followsCount: profile.followsCount,
      postsCount: profile.postsCount,
      isVerified: profile.isVerified,
      isPrivate: profile.isPrivate,
      biography: profile.biography,
      fullName: profile.fullName,
      profilePicUrl: profile.profilePicUrl,
      externalUrl: profile.externalUrl,
      businessCategory: profile.businessCategory,
      rawData: profile,
    });

    await db.insert(instagramProfiles).values({
      username: profile.username.toLowerCase(),
      ownerType: 'external',
      source: 'apify',
      fullName: profile.fullName,
      bio: profile.biography,
      profilePicUrl: profile.profilePicUrl,
      followers: profile.followersCount,
      following: profile.followsCount,
      postsCount: profile.postsCount,
      isVerified: profile.isVerified,
      isPrivate: profile.isPrivate,
      externalUrl: profile.externalUrl,
      lastFetchedAt: new Date(),
    }).onConflictDoUpdate({
      target: [instagramProfiles.username, instagramProfiles.ownerType],
      set: {
        fullName: profile.fullName,
        bio: profile.biography,
        profilePicUrl: profile.profilePicUrl,
        followers: profile.followersCount,
        following: profile.followsCount,
        postsCount: profile.postsCount,
        isVerified: profile.isVerified,
        isPrivate: profile.isPrivate,
        externalUrl: profile.externalUrl,
        lastFetchedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  return normalizedItems;
}

export async function getPostsCacheAge(username: string): Promise<number | null> {
  const [account] = await db.select({ id: instagramAccounts.id })
    .from(instagramAccounts)
    .where(eq(instagramAccounts.username, username))
    .limit(1);

  if (!account) return null;

  const [latestPost] = await db.select({ updatedAt: instagramPosts.updatedAt })
    .from(instagramPosts)
    .where(and(
      eq(instagramPosts.instagramAccountId, account.id),
      eq(instagramPosts.source, 'apify')
    ))
    .orderBy(desc(instagramPosts.updatedAt))
    .limit(1);

  if (!latestPost?.updatedAt) return null;
  return (Date.now() - latestPost.updatedAt.getTime()) / (1000 * 60 * 60);
}

export async function getReelsCacheAge(username: string): Promise<number | null> {
  const [account] = await db.select({ id: instagramAccounts.id })
    .from(instagramAccounts)
    .where(eq(instagramAccounts.username, username))
    .limit(1);

  if (!account) return null;

  const [latestReel] = await db.select({ updatedAt: instagramPosts.updatedAt })
    .from(instagramPosts)
    .where(and(
      eq(instagramPosts.instagramAccountId, account.id),
      eq(instagramPosts.source, 'apify'),
      eq(instagramPosts.mediaType, 'VIDEO')
    ))
    .orderBy(desc(instagramPosts.updatedAt))
    .limit(1);

  if (!latestReel?.updatedAt) return null;
  return (Date.now() - latestReel.updatedAt.getTime()) / (1000 * 60 * 60);
}

export interface PostScraperOptions {
  onlyPostsNewerThan?: string;
  addParentData?: boolean;
  skipCacheCheck?: boolean;
}

export async function scrapePosts(
  directUrls: string[],
  resultsLimit: number = 20,
  postOptions: PostScraperOptions = {},
  options: ApifyRunOptions = {}
): Promise<PostScraperResult[]> {
  if (directUrls.length === 0) return [];

  if (!postOptions.skipCacheCheck && directUrls.length === 1) {
    const username = directUrls[0].replace('https://www.instagram.com/', '').replace('/', '');
    const cacheAge = await getPostsCacheAge(username);
    if (cacheAge !== null && cacheAge < 24) {
      console.log(`[Apify] Posts for ${username} cached (${cacheAge.toFixed(1)}h old), skipping scrape`);
      return [];
    }
  }

  const input: any = { 
    directUrls, 
    resultsType: "posts",
    resultsLimit,
    scrapePostsUntilDate: postOptions.onlyPostsNewerThan || "3 months",
    ...(postOptions.addParentData ? { addParentData: true } : {}),
  };

  const { items } = await runActor<PostScraperResult>(
    ACTORS.API_SCRAPER,
    input,
    options
  );

  for (const post of items) {
    if (!post.id) continue;

    const username = post.ownerUsername || directUrls[0]?.replace('https://www.instagram.com/', '').replace('/', '');

    const [account] = await db.select({ id: instagramAccounts.id })
      .from(instagramAccounts)
      .where(eq(instagramAccounts.username, username || ''))
      .limit(1);

    if (account) {
      const permalink = post.url || (post.shortCode ? `https://www.instagram.com/p/${post.shortCode}/` : null);
      const mediaType = post.type || 'Image';
      const mediaUrl = post.videoUrl || post.displayUrl || null;
      const thumbnailUrl = (mediaType === 'Video' || mediaType === 'Reel') ? post.displayUrl : null;

      await db.insert(instagramPosts).values({
        instagramAccountId: account.id,
        instagramMediaId: post.id,
        mediaType,
        mediaUrl,
        thumbnailUrl,
        permalink,
        caption: post.caption || null,
        likeCount: post.likesCount || 0,
        commentsCount: post.commentsCount || 0,
        sharesCount: 0,
        hashtags: post.hashtags || [],
        mentionedAccounts: post.mentions || [],
        commentsData: post.topComments || null,
        timestamp: post.timestamp ? new Date(post.timestamp) : null,
        source: 'apify',
      }).onConflictDoUpdate({
        target: instagramPosts.instagramMediaId,
        set: {
          mediaType,
          mediaUrl,
          thumbnailUrl,
          permalink,
          caption: post.caption || null,
          likeCount: post.likesCount || 0,
          commentsCount: post.commentsCount || 0,
          hashtags: post.hashtags || [],
          mentionedAccounts: post.mentions || [],
          commentsData: post.topComments || null,
          updatedAt: new Date(),
        },
      });
    }
  }

  return items;
}

export async function scrapeReels(
  _directUrls: string[],
  _resultsLimit: number = 15,
  _options: ApifyRunOptions = {},
  _skipCacheCheck: boolean = false
): Promise<ReelScraperResult[]> {
  console.log('[Apify] scrapeReels DISABLED - use scrapePosts with resultsType "posts" instead (API Scraper handles reels)');
  throw new Error('Reel Scraper is disabled. Use scrapePosts() which handles reels via instagram-api-scraper.');
}

export interface DiscoveryOptions {
  search: string;
  searchType: 'hashtag' | 'user' | 'place';
  searchLimit?: number;
  resultsLimit?: number;
  resultsType?: 'posts' | 'comments' | 'details' | 'stories';
  onlyPostsNewerThan?: string;
  addParentData?: boolean;
}

export async function discoverCreators(
  options: DiscoveryOptions,
  runOptions: ApifyRunOptions = {}
): Promise<any[]> {
  const { items } = await runActor(
    ACTORS.GENERAL_SCRAPER,
    {
      search: options.search,
      searchType: options.searchType,
      searchLimit: options.searchLimit || 10,
      resultsLimit: options.resultsLimit || 20,
      resultsType: options.resultsType || 'posts',
      onlyPostsNewerThan: options.onlyPostsNewerThan,
      addParentData: options.addParentData ?? true,
    },
    runOptions
  );

  return items;
}

export async function getProfileGrowthHistory(
  username: string,
  days: number = 30
): Promise<{ date: Date; followers: number; following: number; posts: number }[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const snapshots = await db.select({
    snapshotDate: profileSnapshots.snapshotDate,
    followersCount: profileSnapshots.followersCount,
    followsCount: profileSnapshots.followsCount,
    postsCount: profileSnapshots.postsCount,
  })
    .from(profileSnapshots)
    .where(
      and(
        eq(profileSnapshots.username, username),
        gte(profileSnapshots.snapshotDate, since)
      )
    )
    .orderBy(profileSnapshots.snapshotDate);

  return snapshots.map(s => ({
    date: s.snapshotDate,
    followers: s.followersCount || 0,
    following: s.followsCount || 0,
    posts: s.postsCount || 0,
  }));
}

export async function getLatestProfileSnapshot(username: string) {
  const [snapshot] = await db.select()
    .from(profileSnapshots)
    .where(eq(profileSnapshots.username, username))
    .orderBy(desc(profileSnapshots.snapshotDate))
    .limit(1);

  return snapshot;
}

export async function getPostsForUser(username: string, limit: number = 20) {
  const [account] = await db.select({ id: instagramAccounts.id })
    .from(instagramAccounts)
    .where(eq(instagramAccounts.username, username))
    .limit(1);

  if (!account) return [];

  return db.select()
    .from(instagramPosts)
    .where(and(
      eq(instagramPosts.instagramAccountId, account.id),
      eq(instagramPosts.source, 'apify')
    ))
    .orderBy(desc(instagramPosts.timestamp))
    .limit(limit);
}

export async function getReelsForUser(username: string, limit: number = 20) {
  const [account] = await db.select({ id: instagramAccounts.id })
    .from(instagramAccounts)
    .where(eq(instagramAccounts.username, username))
    .limit(1);

  if (!account) return [];

  return db.select()
    .from(instagramPosts)
    .where(and(
      eq(instagramPosts.instagramAccountId, account.id),
      eq(instagramPosts.source, 'apify'),
      eq(instagramPosts.mediaType, 'VIDEO')
    ))
    .orderBy(desc(instagramPosts.timestamp))
    .limit(limit);
}

export async function getApifyCallStats() {
  return [];
}

export async function getProfilesNeedingUpdate(cacheHours: number = 24): Promise<string[]> {
  const cutoff = new Date(Date.now() - cacheHours * 60 * 60 * 1000);
  
  const staleProfiles = await db.select({ username: instagramProfiles.username })
    .from(instagramProfiles)
    .where(and(
      eq(instagramProfiles.ownerType, 'external'),
      sql`${instagramProfiles.lastFetchedAt} < ${cutoff} OR ${instagramProfiles.lastFetchedAt} IS NULL`
    ));

  return staleProfiles.map(p => p.username);
}

export async function checkProfileExists(username: string): Promise<boolean> {
  const [profile] = await db.select({ id: instagramProfiles.id })
    .from(instagramProfiles)
    .where(and(
      eq(instagramProfiles.username, username.toLowerCase()),
      eq(instagramProfiles.ownerType, 'external')
    ))
    .limit(1);

  return !!profile;
}

// ==================== Batch Queue System ====================
// Aggregates individual profile requests into a single Apify actor call

interface BatchQueueItem {
  username: string;
  resolve: (result: ProfileScraperResult | null) => void;
  reject: (error: Error) => void;
}

const BATCH_FLUSH_DELAY_MS = 5000;
const BATCH_MAX_SIZE = 50;

let batchQueue: BatchQueueItem[] = [];
let batchTimer: ReturnType<typeof setTimeout> | null = null;
let batchOptions: ApifyRunOptions = {};

async function flushBatchQueue() {
  if (batchQueue.length === 0) return;

  const currentBatch = [...batchQueue];
  const currentOptions = { ...batchOptions };
  batchQueue = [];
  batchOptions = {};
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }

  const usernameSet = new Set(currentBatch.map(item => item.username.toLowerCase()));
  const uniqueUsernames = Array.from(usernameSet);
  console.log(`[Apify Batch] Flushing ${currentBatch.length} requests → ${uniqueUsernames.length} unique usernames in SINGLE actor call`);

  try {
    const results = await scrapeProfiles(uniqueUsernames, currentOptions);

    const resultMap = new Map<string, ProfileScraperResult>();
    for (const r of results) {
      if (r.username) {
        resultMap.set(r.username.toLowerCase(), r);
      }
    }

    for (const item of currentBatch) {
      const result = resultMap.get(item.username.toLowerCase()) || null;
      item.resolve(result);
    }
  } catch (error: any) {
    for (const item of currentBatch) {
      item.reject(error);
    }
  }
}

export function queueProfileScrape(
  username: string,
  options: ApifyRunOptions = {}
): Promise<ProfileScraperResult | null> {
  return new Promise((resolve, reject) => {
    batchQueue.push({ username: username.toLowerCase(), resolve, reject });

    if (options.triggeredBy) batchOptions.triggeredBy = options.triggeredBy;
    if (options.triggeredByUserId) batchOptions.triggeredByUserId = options.triggeredByUserId;

    if (batchQueue.length >= BATCH_MAX_SIZE) {
      console.log(`[Apify Batch] Max size ${BATCH_MAX_SIZE} reached, flushing immediately`);
      flushBatchQueue();
      return;
    }

    if (batchTimer) clearTimeout(batchTimer);
    batchTimer = setTimeout(() => {
      console.log(`[Apify Batch] Timer expired (${BATCH_FLUSH_DELAY_MS}ms), flushing ${batchQueue.length} items`);
      flushBatchQueue();
    }, BATCH_FLUSH_DELAY_MS);
  });
}

export async function scrapeProfileIfNeeded(
  username: string,
  cacheHours: number = 24,
  options: ApifyRunOptions = {}
): Promise<ProfileScraperResult | null> {
  const shouldFetch = await shouldFetchProfile(username, cacheHours);
  
  if (!shouldFetch) {
    return null;
  }

  return queueProfileScrape(username, options);
}

export function isApifyConfigured(): boolean {
  return !!client;
}

// ==================== TikTok Scrapers ====================

export interface TikTokProfileResult {
  id: string;
  uniqueId: string;
  nickname?: string;
  avatarLarger?: string;
  signature?: string;
  verified?: boolean;
  followers?: number;
  following?: number;
  hearts?: number;
  videoCount?: number;
  [key: string]: any;
}

export interface TikTokVideoResult {
  id: string;
  desc?: string;
  createTime?: number;
  video?: { cover?: string; playAddr?: string; duration?: number };
  stats?: { diggCount?: number; shareCount?: number; commentCount?: number; playCount?: number };
  author?: TikTokProfileResult;
  music?: { title?: string; authorName?: string };
  hashtags?: { name: string }[];
  [key: string]: any;
}

// Helper to extract full profile data from author object
function extractTikTokProfileData(author: TikTokProfileResult | undefined): InsertTikTokProfile | null {
  if (!author?.uniqueId) return null;
  
  return {
    uniqueId: author.uniqueId,
    userId: author.id || null,
    nickname: author.nickname || null,
    avatarUrl: author.avatarLarger || null,
    signature: author.signature || null,
    verified: author.verified ?? false,
    followers: author.followers || 0,
    following: author.following || 0,
    hearts: author.hearts || 0,
    videoCount: author.videoCount || 0,
    rawData: author,
  };
}

export interface TikTokScraperOptions {
  totalResults?: number;
  resultsPerProfile?: number;
  shouldDownloadVideos?: boolean;
}

export async function scrapeTikTokProfiles(
  profiles: string[],
  scrapingOptions: TikTokScraperOptions = {},
  options: ApifyRunOptions & { saveToDb?: boolean } = {}
): Promise<TikTokVideoResult[]> {
  if (profiles.length === 0) return [];

  const profileCount = profiles.length;
  let resultsPerPage: number;
  
  if (scrapingOptions.resultsPerProfile) {
    resultsPerPage = scrapingOptions.resultsPerProfile * profileCount;
  } else if (scrapingOptions.totalResults) {
    resultsPerPage = scrapingOptions.totalResults;
  } else {
    resultsPerPage = 20 * profileCount;
  }

  const { items } = await runActor<TikTokVideoResult>(
    ACTORS.TIKTOK_SCRAPER,
    {
      profiles: profiles.map(p => p.startsWith('http') ? p : `https://www.tiktok.com/@${p}`),
      resultsPerPage,
      shouldDownloadVideos: scrapingOptions.shouldDownloadVideos ?? false,
    },
    options
  );

  // Persist TikTok videos and profiles to database
  if (options.saveToDb !== false && items.length > 0) {
    const profilesUpserted = new Set<string>();
    const videoDataBatch: InsertTikTokVideo[] = [];
    const profileDataMap = new Map<string, InsertTikTokProfile>();

    for (const item of items) {
      if (item.id) {
        videoDataBatch.push({
          videoId: item.id,
          authorUniqueId: item.author?.uniqueId || 'unknown',
          description: item.desc || null,
          coverUrl: item.video?.cover || null,
          videoUrl: item.video?.playAddr || null,
          duration: item.video?.duration || null,
          diggCount: item.stats?.diggCount || 0,
          shareCount: item.stats?.shareCount || 0,
          commentCount: item.stats?.commentCount || 0,
          playCount: item.stats?.playCount || 0,
          musicTitle: item.music?.title || null,
          musicAuthor: item.music?.authorName || null,
          hashtags: item.hashtags?.map(h => h.name) || [],
          postedAt: item.createTime ? new Date(item.createTime * 1000) : null,
          rawData: item,
        });
      }

      // Extract full profile data (dedupe by uniqueId)
      const profileData = extractTikTokProfileData(item.author);
      if (profileData && !profilesUpserted.has(profileData.uniqueId)) {
        profilesUpserted.add(profileData.uniqueId);
        profileDataMap.set(profileData.uniqueId, profileData);
      }
    }

    // Batch upsert videos
    if (videoDataBatch.length > 0) {
      await Promise.all(videoDataBatch.map(videoData =>
        db.insert(tiktokVideos)
          .values(videoData)
          .onConflictDoUpdate({
            target: tiktokVideos.videoId,
            set: { ...videoData, updatedAt: new Date() },
          })
      ));
    }

    // Batch upsert profiles with full data
    const profileDataBatch = Array.from(profileDataMap.values());
    if (profileDataBatch.length > 0) {
      await Promise.all(profileDataBatch.map(profileData =>
        db.insert(tiktokProfiles)
          .values(profileData)
          .onConflictDoUpdate({
            target: tiktokProfiles.uniqueId,
            set: { ...profileData, lastFetchedAt: new Date(), updatedAt: new Date() },
          })
      ));
    }
  }

  return items;
}

export interface TikTokHashtagOptions {
  totalResults?: number;
  resultsPerHashtag?: number;
  shouldDownloadVideos?: boolean;
}

export async function scrapeTikTokHashtags(
  hashtags: string[],
  scrapingOptions: TikTokHashtagOptions = {},
  options: ApifyRunOptions & { saveToDb?: boolean } = {}
): Promise<TikTokVideoResult[]> {
  if (hashtags.length === 0) return [];

  const hashtagCount = hashtags.length;
  let resultsPerPage: number;
  
  if (scrapingOptions.resultsPerHashtag) {
    resultsPerPage = scrapingOptions.resultsPerHashtag * hashtagCount;
  } else if (scrapingOptions.totalResults) {
    resultsPerPage = scrapingOptions.totalResults;
  } else {
    resultsPerPage = 50 * hashtagCount;
  }

  const { items } = await runActor<TikTokVideoResult>(
    ACTORS.TIKTOK_SCRAPER,
    {
      hashtags: hashtags.map(h => h.startsWith('#') ? h : `#${h}`),
      resultsPerPage,
      shouldDownloadVideos: scrapingOptions.shouldDownloadVideos ?? false,
    },
    options
  );

  // Persist TikTok videos and profiles to database
  if (options.saveToDb !== false && items.length > 0) {
    const profilesUpserted = new Set<string>();
    const videoDataBatch: InsertTikTokVideo[] = [];
    const profileDataMap = new Map<string, InsertTikTokProfile>();

    for (const item of items) {
      if (item.id) {
        videoDataBatch.push({
          videoId: item.id,
          authorUniqueId: item.author?.uniqueId || 'unknown',
          description: item.desc || null,
          coverUrl: item.video?.cover || null,
          videoUrl: item.video?.playAddr || null,
          duration: item.video?.duration || null,
          diggCount: item.stats?.diggCount || 0,
          shareCount: item.stats?.shareCount || 0,
          commentCount: item.stats?.commentCount || 0,
          playCount: item.stats?.playCount || 0,
          musicTitle: item.music?.title || null,
          musicAuthor: item.music?.authorName || null,
          hashtags: item.hashtags?.map(h => h.name) || [],
          postedAt: item.createTime ? new Date(item.createTime * 1000) : null,
          rawData: item,
        });
      }

      // Extract full profile data (dedupe by uniqueId)
      const profileData = extractTikTokProfileData(item.author);
      if (profileData && !profilesUpserted.has(profileData.uniqueId)) {
        profilesUpserted.add(profileData.uniqueId);
        profileDataMap.set(profileData.uniqueId, profileData);
      }
    }

    // Batch upsert videos using Promise.all
    if (videoDataBatch.length > 0) {
      await Promise.all(videoDataBatch.map(videoData =>
        db.insert(tiktokVideos)
          .values(videoData)
          .onConflictDoUpdate({
            target: tiktokVideos.videoId,
            set: { ...videoData, updatedAt: new Date() },
          })
      ));
    }

    // Batch upsert profiles with full data
    const profileDataBatch = Array.from(profileDataMap.values());
    if (profileDataBatch.length > 0) {
      await Promise.all(profileDataBatch.map(profileData =>
        db.insert(tiktokProfiles)
          .values(profileData)
          .onConflictDoUpdate({
            target: tiktokProfiles.uniqueId,
            set: { ...profileData, lastFetchedAt: new Date(), updatedAt: new Date() },
          })
      ));
    }
  }

  return items;
}

// ==================== Meta Ads Scrapers ====================

export interface FacebookAdResult {
  adId?: string;
  pageName?: string;
  pageId?: string;
  adCreativeBody?: string;
  adCreativeLinkCaption?: string;
  adCreativeLinkTitle?: string;
  publisherPlatforms?: string[];
  startDate?: string;
  endDate?: string;
  status?: string;
  mediaType?: string;
  mediaUrl?: string;
  impressionsByCountry?: Record<string, number>;
  spendByCountry?: Record<string, number>;
  [key: string]: any;
}

export interface FacebookAdsLibraryOptions {
  urls: string[];
  scrapeAdDetails?: boolean;
  limitPerInputUrl?: number;
  dateRange?: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'all';
  countryFilter?: string;
  activeStatus?: 'active' | 'inactive' | 'all';
  useResidentialProxy?: boolean;
}

export async function scrapeFacebookAdsLibrary(
  options: FacebookAdsLibraryOptions & { companyId?: number; saveToDb?: boolean },
  runOptions: ApifyRunOptions = {}
): Promise<FacebookAdResult[]> {
  if (options.urls.length === 0) return [];

  const { items } = await runActor<FacebookAdResult>(
    ACTORS.FACEBOOK_ADS_LIBRARY,
    {
      urls: options.urls,
      scrapeAdDetails: options.scrapeAdDetails ?? false,
      limitPerInputUrl: options.limitPerInputUrl ?? 100,
      dateRange: options.dateRange ?? 'last_30_days',
      countryFilter: options.countryFilter ?? 'BR',
      activeStatus: options.activeStatus ?? 'active',
      proxy: {
        useApifyProxy: true,
        apifyProxyGroups: options.useResidentialProxy ? ['RESIDENTIAL'] : undefined,
      },
    },
    runOptions
  );

  return items;
}

export async function scrapeFacebookPageAds(
  pageUrls: string[],
  limit: number = 50,
  options: ApifyRunOptions & { companyId?: number; saveToDb?: boolean; useResidentialProxy?: boolean } = {}
): Promise<FacebookAdResult[]> {
  if (pageUrls.length === 0) return [];

  const { items } = await runActor<FacebookAdResult>(
    ACTORS.FACEBOOK_ADS,
    {
      startUrls: pageUrls.map(url => ({ url })),
      maxResults: limit,
      proxy: {
        useApifyProxy: true,
        apifyProxyGroups: options.useResidentialProxy ? ['RESIDENTIAL'] : undefined,
      },
    },
    options
  );

  return items;
}

// ==================== YouTube Scrapers ====================

export interface YouTubeVideoResult {
  id: string;
  title?: string;
  description?: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  channelName?: string;
  channelId?: string;
  subscriberCount?: number;
  uploadDate?: string;
  duration?: string;
  thumbnailUrl?: string;
  [key: string]: any;
}

export interface YouTubeChannelOptions {
  scrapeVideos?: boolean;
  scrapeShorts?: boolean;
  scrapeStreams?: boolean;
  downloadSubtitles?: boolean;
  useProxy?: boolean;
}

export async function scrapeYouTubeChannel(
  channelUrls: string[],
  maxResults: number = 50,
  options: ApifyRunOptions & { saveToDb?: boolean } & YouTubeChannelOptions = {}
): Promise<YouTubeVideoResult[]> {
  if (channelUrls.length === 0) return [];

  const { items } = await runActor<YouTubeVideoResult>(
    ACTORS.YOUTUBE_SCRAPER,
    {
      startUrls: channelUrls.map(url => ({ url })),
      maxResults,
      scrapeComments: false,
      scrapeVideos: options.scrapeVideos ?? true,
      scrapeShorts: options.scrapeShorts ?? true,
      scrapeStreams: options.scrapeStreams ?? false,
      downloadSubtitles: options.downloadSubtitles ?? false,
      proxyConfiguration: options.useProxy ? { useApifyProxy: true } : undefined,
    },
    options
  );

  // Persist YouTube videos to database
  if (options.saveToDb !== false) {
    for (const item of items) {
      if (!item.id) continue;

      const videoData: InsertYouTubeVideo = {
        videoId: item.id,
        channelId: item.channelId || null,
        title: item.title || null,
        description: item.description || null,
        thumbnailUrl: item.thumbnailUrl || null,
        viewCount: item.viewCount || 0,
        likeCount: item.likeCount || 0,
        commentCount: item.commentCount || 0,
        duration: item.duration || null,
        publishedAt: item.uploadDate ? new Date(item.uploadDate) : null,
        isShort: false,
        rawData: item,
      };

      await db.insert(youtubeVideos)
        .values(videoData)
        .onConflictDoUpdate({
          target: youtubeVideos.videoId,
          set: {
            ...videoData,
            updatedAt: new Date(),
          },
        });

      // Also upsert channel info if available
      if (item.channelId && item.channelName) {
        await db.insert(youtubeChannels)
          .values({
            channelId: item.channelId,
            channelName: item.channelName,
            subscriberCount: item.subscriberCount || 0,
            rawData: { channelId: item.channelId, channelName: item.channelName },
          })
          .onConflictDoUpdate({
            target: youtubeChannels.channelId,
            set: {
              channelName: item.channelName,
              subscriberCount: item.subscriberCount || 0,
              lastFetchedAt: new Date(),
              updatedAt: new Date(),
            },
          });
      }
    }
  }

  return items;
}

export async function scrapeYouTubeShorts(
  channelUrls: string[],
  maxResults: number = 30,
  options: ApifyRunOptions & { saveToDb?: boolean } = {}
): Promise<YouTubeVideoResult[]> {
  if (channelUrls.length === 0) return [];

  const { items } = await runActor<YouTubeVideoResult>(
    ACTORS.YOUTUBE_SHORTS,
    {
      startUrls: channelUrls.map(url => ({ url: url.includes('/shorts') ? url : `${url}/shorts` })),
      maxResults,
    },
    options
  );

  // Persist YouTube shorts to database
  if (options.saveToDb !== false) {
    for (const item of items) {
      if (!item.id) continue;

      const videoData: InsertYouTubeVideo = {
        videoId: item.id,
        channelId: item.channelId || null,
        title: item.title || null,
        description: item.description || null,
        thumbnailUrl: item.thumbnailUrl || null,
        viewCount: item.viewCount || 0,
        likeCount: item.likeCount || 0,
        commentCount: item.commentCount || 0,
        duration: item.duration || null,
        publishedAt: item.uploadDate ? new Date(item.uploadDate) : null,
        isShort: true,
        rawData: item,
      };

      await db.insert(youtubeVideos)
        .values(videoData)
        .onConflictDoUpdate({
          target: youtubeVideos.videoId,
          set: {
            ...videoData,
            updatedAt: new Date(),
          },
        });
    }
  }

  return items;
}

export async function crawlWebsiteContent(
  urls: string[],
  maxPages: number = 50,
  options: ApifyRunOptions = {}
): Promise<any[]> {
  if (urls.length === 0) return [];

  const { items } = await runActor(
    ACTORS.WEBSITE_CRAWLER,
    {
      startUrls: urls.map(url => ({ url })),
      maxCrawlPages: maxPages,
      crawlerType: 'cheerio',
    },
    options
  );

  return items;
}

// ==================== Discovery Scrapers ====================

export interface InfluencerDiscoveryOptions {
  query: string;
  platforms?: ('instagram' | 'tiktok' | 'youtube')[];
  minFollowers?: number;
  maxFollowers?: number;
  country?: string;
}

export async function discoverInfluencers(
  options: InfluencerDiscoveryOptions,
  runOptions: ApifyRunOptions = {}
): Promise<any[]> {
  const { items } = await runActor(
    ACTORS.INFLUENCER_DISCOVERY,
    {
      query: options.query,
      platforms: options.platforms || ['instagram', 'tiktok'],
      minFollowers: options.minFollowers || 1000,
      maxFollowers: options.maxFollowers || 1000000,
      country: options.country || 'BR',
    },
    runOptions
  );

  return items;
}

export async function scrapeGoogleMapsLeads(
  searchQueries: string[],
  maxPerQuery: number = 100,
  language: string = 'pt-BR',
  options: ApifyRunOptions = {}
): Promise<any[]> {
  if (searchQueries.length === 0) return [];

  const { items } = await runActor(
    ACTORS.GOOGLE_MAPS_EMAIL,
    {
      searchStringsArray: searchQueries,
      maxCrawledPlacesPerSearch: maxPerQuery,
      language,
    },
    options
  );

  return items;
}

// ==================== Google Maps Extractor (Compass) ====================

export interface GoogleMapsExtractorResult {
  title: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  rating?: number;
  reviewsCount?: number;
  category?: string;
  coordinates?: { lat: number; lng: number };
  openingHours?: string[];
  priceLevel?: string;
  placeId?: string;
  url?: string;
  [key: string]: any;
}

export interface GoogleMapsExtractorOptions {
  maxResultsPerQuery?: number;
  language?: string;
  includePhotos?: boolean;
  includeReviews?: boolean;
  maxReviews?: number;
}

export async function scrapeGoogleMapsExtractor(
  searchQueries: string[],
  extractorOptions: GoogleMapsExtractorOptions = {},
  options: ApifyRunOptions = {}
): Promise<GoogleMapsExtractorResult[]> {
  if (searchQueries.length === 0) return [];

  const { items } = await runActor<GoogleMapsExtractorResult>(
    ACTORS.GOOGLE_MAPS_EXTRACTOR,
    {
      searchStringsArray: searchQueries,
      maxCrawledPlacesPerSearch: extractorOptions.maxResultsPerQuery ?? 20,
      language: extractorOptions.language ?? 'pt-BR',
      scrapeReviewerPhotos: false,
      scrapeReviews: extractorOptions.includeReviews ?? false,
      maxReviews: extractorOptions.maxReviews ?? 0,
      scrapePhotos: extractorOptions.includePhotos ?? false,
    },
    options
  );

  return items;
}

// ==================== Ahrefs Scraper ====================

export interface AhrefsResult {
  url: string;
  domainRating?: number;
  urlRating?: number;
  backlinks?: number;
  referringDomains?: number;
  organicTraffic?: number;
  organicKeywords?: number;
  topKeywords?: Array<{
    keyword: string;
    position: number;
    volume: number;
    traffic?: number;
  }>;
  [key: string]: any;
}

export interface AhrefsScraperOptions {
  includeBacklinks?: boolean;
  includeKeywords?: boolean;
  maxKeywords?: number;
}

export async function scrapeAhrefs(
  urls: string[],
  ahrefsOptions: AhrefsScraperOptions = {},
  options: ApifyRunOptions = {}
): Promise<AhrefsResult[]> {
  if (urls.length === 0) return [];

  const { items } = await runActor<AhrefsResult>(
    ACTORS.AHREFS_SCRAPER,
    {
      urls,
      scrapeBacklinks: ahrefsOptions.includeBacklinks ?? false,
      scrapeKeywords: ahrefsOptions.includeKeywords ?? true,
      maxKeywords: ahrefsOptions.maxKeywords ?? 10,
    },
    options
  );

  return items;
}

// ==================== YouTube Channel Scraper ====================

export interface YouTubeChannelResult {
  channelId: string;
  channelName: string;
  channelUrl?: string;
  subscribersCount?: number;
  videosCount?: number;
  viewsCount?: number;
  description?: string;
  bannerUrl?: string;
  avatarUrl?: string;
  country?: string;
  joinedDate?: string;
  recentVideos?: Array<{
    videoId: string;
    title: string;
    views: number;
    publishedAt: string;
  }>;
  [key: string]: any;
}

export interface YouTubeChannelOptions {
  includeRecentVideos?: boolean;
  maxRecentVideos?: number;
}

export async function scrapeYouTubeChannelInfo(
  channelUrls: string[],
  channelOptions: YouTubeChannelOptions = {},
  options: ApifyRunOptions = {}
): Promise<YouTubeChannelResult[]> {
  if (channelUrls.length === 0) return [];

  const { items } = await runActor<YouTubeChannelResult>(
    ACTORS.YOUTUBE_CHANNEL,
    {
      channelUrls,
      scrapeVideos: channelOptions.includeRecentVideos ?? true,
      maxVideos: channelOptions.maxRecentVideos ?? 10,
    },
    options
  );

  for (const channel of items) {
    if (!channel.channelId) continue;

    await db.insert(youtubeChannels).values({
      channelId: channel.channelId,
      channelName: channel.channelName,
      channelUrl: channel.channelUrl,
      subscriberCount: channel.subscribersCount,
      videoCount: channel.videosCount,
      viewCount: channel.viewsCount,
      description: channel.description,
      thumbnailUrl: channel.avatarUrl,
      rawData: channel,
    }).onConflictDoUpdate({
      target: youtubeChannels.channelId,
      set: {
        channelName: channel.channelName,
        subscriberCount: channel.subscribersCount,
        videoCount: channel.videosCount,
        viewCount: channel.viewsCount,
        description: channel.description,
        updatedAt: new Date(),
      },
    });
  }

  return items;
}

// ==================== Cost Estimation ====================

export interface CostEstimate {
  actor: string;
  estimatedItems: number;
  costPer1k: number;
  estimatedCost: number;
  pricingModel: 'ppr' | 'ppe' | 'cu';
  notes?: string;
}

const ACTOR_COSTS: Record<string, { costPer1k: number; pricingModel: 'ppr' | 'ppe' | 'cu'; startFee?: number; downloadCost?: number }> = {
  'instagram_api_scraper': { costPer1k: 2.30, pricingModel: 'ppe' },
  'instagram_profile': { costPer1k: 2.30, pricingModel: 'ppe' },
  'instagram_post': { costPer1k: 2.30, pricingModel: 'ppe' },
  'instagram_reel': { costPer1k: 2.30, pricingModel: 'ppe' },
  'instagram_general': { costPer1k: 2.50, pricingModel: 'ppr' },
  'tiktok_scraper': { costPer1k: 3.00, pricingModel: 'ppe', startFee: 0.03, downloadCost: 0.001 },
  'tiktok_free': { costPer1k: 5.00, pricingModel: 'ppr' },
  'facebook_ads': { costPer1k: 2.00, pricingModel: 'ppr' },
  'facebook_ads_library': { costPer1k: 0.75, pricingModel: 'ppr' },
  'youtube_scraper': { costPer1k: 2.50, pricingModel: 'ppr' },
  'youtube_shorts': { costPer1k: 2.00, pricingModel: 'ppr' },
  'youtube_channel': { costPer1k: 2.50, pricingModel: 'ppr' },
  'google_maps': { costPer1k: 3.00, pricingModel: 'ppr' },
  'google_maps_extractor': { costPer1k: 2.50, pricingModel: 'ppr' },
  'google_search': { costPer1k: 2.50, pricingModel: 'ppr' },
  'influencer_discovery': { costPer1k: 5.00, pricingModel: 'cu' },
  'ahrefs_scraper': { costPer1k: 5.00, pricingModel: 'ppr' },
};

export function estimateApifyCost(
  actorKey: string,
  estimatedItems: number,
  options: { includeStartFee?: boolean; includeDownloads?: boolean } = {}
): CostEstimate {
  const config = ACTOR_COSTS[actorKey];
  
  if (!config) {
    return {
      actor: actorKey,
      estimatedItems,
      costPer1k: 0,
      estimatedCost: 0,
      pricingModel: 'cu',
      notes: 'Ator não encontrado no registro de custos',
    };
  }

  let estimatedCost = (estimatedItems / 1000) * config.costPer1k;

  if (options.includeStartFee && config.startFee) {
    estimatedCost += config.startFee;
  }

  if (options.includeDownloads && config.downloadCost) {
    estimatedCost += estimatedItems * config.downloadCost;
  }

  return {
    actor: actorKey,
    estimatedItems,
    costPer1k: config.costPer1k,
    estimatedCost: Math.round(estimatedCost * 100) / 100,
    pricingModel: config.pricingModel,
  };
}

export function estimateBatchCost(
  batches: Array<{ actorKey: string; estimatedItems: number; options?: { includeStartFee?: boolean; includeDownloads?: boolean } }>
): { estimates: CostEstimate[]; totalCost: number } {
  const estimates = batches.map(b => estimateApifyCost(b.actorKey, b.estimatedItems, b.options || {}));
  const totalCost = estimates.reduce((sum, e) => sum + e.estimatedCost, 0);
  return { estimates, totalCost: Math.round(totalCost * 100) / 100 };
}

// ==================== Actor Registry Helpers ====================

export async function getActorFromRegistry(key: string): Promise<string | null> {
  const [actor] = await db.select({ actorId: dataSourceRegistry.actorId })
    .from(dataSourceRegistry)
    .where(and(
      eq(dataSourceRegistry.key, key),
      eq(dataSourceRegistry.isActive, true)
    ))
    .limit(1);

  return actor?.actorId || null;
}

export async function getActiveActors() {
  return db.select()
    .from(dataSourceRegistry)
    .where(eq(dataSourceRegistry.isActive, true))
    .orderBy(dataSourceRegistry.category, dataSourceRegistry.key);
}

export async function updateActorId(key: string, newActorId: string) {
  await db.update(dataSourceRegistry)
    .set({ 
      actorId: newActorId,
      updatedAt: new Date(),
    })
    .where(eq(dataSourceRegistry.key, key));
}

export default {
  // Instagram
  scrapeProfiles,
  scrapeProfilesDetailed,
  scrapePosts,
  scrapeReels,
  discoverCreators,
  getProfileGrowthHistory,
  getLatestProfileSnapshot,
  getPostsForUser,
  getReelsForUser,
  // TikTok
  scrapeTikTokProfiles,
  scrapeTikTokHashtags,
  // Meta Ads
  scrapeFacebookAdsLibrary,
  scrapeFacebookPageAds,
  // YouTube
  scrapeYouTubeChannel,
  scrapeYouTubeShorts,
  scrapeYouTubeChannelInfo,
  crawlWebsiteContent,
  runActorPublic: runActor,
  // Discovery & SEO
  discoverInfluencers,
  scrapeGoogleMapsLeads,
  scrapeGoogleMapsExtractor,
  scrapeAhrefs,
  // Registry
  getActorFromRegistry,
  getActiveActors,
  updateActorId,
  // Cost Estimation
  estimateApifyCost,
  estimateBatchCost,
  // Utils
  getApifyCallStats,
  getProfilesNeedingUpdate,
  checkProfileExists,
  scrapeProfileIfNeeded,
  queueProfileScrape,
  shouldFetchProfile,
  getCacheAge,
  getPostsCacheAge,
  getReelsCacheAge,
  isApifyConfigured,
};
