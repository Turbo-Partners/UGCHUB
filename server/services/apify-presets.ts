import {
  scrapeProfiles,
  queueProfileScrape,
  scrapePosts,
  scrapeTikTokProfiles,
  scrapeTikTokHashtags,
  scrapeYouTubeChannel,
  estimateBatchCost,
  isApifyConfigured,
  type ProfileScraperResult,
  type PostScraperResult,
  type ReelScraperResult,
  type TikTokProfileResult,
  type TikTokVideoResult,
  type YouTubeVideoResult,
  type CostEstimate,
} from './apify';

export interface PresetRunOptions {
  triggeredBy?: 'scheduled' | 'on_demand' | 'webhook';
  triggeredByUserId?: number;
  dryRun?: boolean;
  saveToDb?: boolean;
}

export interface PresetCostEstimate {
  estimates: CostEstimate[];
  totalCost: number;
}

export interface PresetResult<T> {
  success: boolean;
  data: T;
  costEstimate: PresetCostEstimate;
  executionTimeMs?: number;
  errors: string[];
}

type BatchInput = { actorKey: string; estimatedItems: number; options?: { includeStartFee?: boolean; includeDownloads?: boolean } };

export interface CreatorFullProfileInput {
  instagramUsername?: string;
  tiktokUsername?: string;
  includeRecentPosts?: boolean;
  postsLimit?: number;
  includeReels?: boolean;
  reelsLimit?: number;
}

export interface CreatorFullProfileData {
  instagram?: {
    profile: ProfileScraperResult | null;
    recentPosts: PostScraperResult[];
    recentReels: ReelScraperResult[];
  };
  tiktok?: {
    profile: TikTokProfileResult | null;
    recentVideos: TikTokVideoResult[];
  };
}

export async function creatorFullProfile(
  input: CreatorFullProfileInput,
  options: PresetRunOptions = {}
): Promise<PresetResult<CreatorFullProfileData>> {
  const startTime = Date.now();
  const errors: string[] = [];
  
  const costBatches: BatchInput[] = [];
  
  if (input.instagramUsername) {
    costBatches.push({ actorKey: 'instagram_profile', estimatedItems: 1 });
    if (input.includeRecentPosts) {
      costBatches.push({ actorKey: 'instagram_post', estimatedItems: input.postsLimit || 10 });
    }
  }
  
  if (input.tiktokUsername) {
    costBatches.push({ actorKey: 'tiktok_scraper', estimatedItems: 30, options: { includeStartFee: true } });
  }
  
  const totalCost = estimateBatchCost(costBatches);

  if (options.dryRun) {
    return {
      success: true,
      data: { instagram: undefined, tiktok: undefined },
      costEstimate: totalCost,
      errors: [],
    };
  }

  if (!isApifyConfigured()) {
    return {
      success: false,
      data: { instagram: undefined, tiktok: undefined },
      costEstimate: totalCost,
      errors: ['Apify não configurado. Defina APIFY_API_KEY.'],
    };
  }

  const data: CreatorFullProfileData = {};

  const promises: Promise<void>[] = [];

  if (input.instagramUsername) {
    const igPromise = (async () => {
      try {
        const profile = await queueProfileScrape(
          input.instagramUsername!,
          { triggeredBy: options.triggeredBy, triggeredByUserId: options.triggeredByUserId }
        );
        let recentPosts: PostScraperResult[] = [];
        let recentReels: ReelScraperResult[] = [];

        if (profile && input.includeRecentPosts) {
          const postUrls = [`https://instagram.com/${input.instagramUsername}`];
          recentPosts = await scrapePosts(
            postUrls,
            input.postsLimit || 10,
            { addParentData: true },
            { triggeredBy: options.triggeredBy, triggeredByUserId: options.triggeredByUserId }
          );
        }

        if (profile && input.includeReels) {
          console.log('[Apify Presets] Skipping reels scraping - disabled for cost control ($2.60/1k reels)');
        }

        data.instagram = { profile, recentPosts, recentReels };
      } catch (error: any) {
        errors.push(`Instagram: ${error.message}`);
        data.instagram = { profile: null, recentPosts: [], recentReels: [] };
      }
    })();
    promises.push(igPromise);
  }

  if (input.tiktokUsername) {
    const ttPromise = (async () => {
      try {
        const profiles = await scrapeTikTokProfiles(
          [input.tiktokUsername!],
          { resultsPerProfile: 20 },
          { 
            triggeredBy: options.triggeredBy, 
            triggeredByUserId: options.triggeredByUserId,
            saveToDb: options.saveToDb ?? true,
          }
        );
        
        const profile = profiles.find(p => 
          p.author?.uniqueId?.toLowerCase() === input.tiktokUsername!.toLowerCase().replace('@', '')
        ) as TikTokProfileResult | undefined;
        
        const authorProfile = profile?.author ? {
          id: profile.id || '',
          uniqueId: profile.author.uniqueId || '',
          nickname: profile.author.nickname,
          avatarUrl: profile.author.avatarMedium,
          signature: profile.author.signature,
          verified: profile.author.verified,
          secUid: profile.author.secUid,
          following: profile.authorStats?.followingCount,
          followers: profile.authorStats?.followerCount,
          likes: profile.authorStats?.heartCount,
          videoCount: profile.authorStats?.videoCount,
        } as unknown as TikTokProfileResult : null;

        data.tiktok = { 
          profile: authorProfile, 
          recentVideos: profiles.slice(0, 20),
        };
      } catch (error: any) {
        errors.push(`TikTok: ${error.message}`);
        data.tiktok = { profile: null, recentVideos: [] };
      }
    })();
    promises.push(ttPromise);
  }

  await Promise.all(promises);

  return {
    success: errors.length === 0,
    data,
    costEstimate: totalCost,
    executionTimeMs: Date.now() - startTime,
    errors,
  };
}

export interface CampaignDiscoveryInput {
  hashtags: string[];
  platforms?: ('instagram' | 'tiktok')[];
  resultsPerHashtag?: number;
}

export interface CampaignDiscoveryData {
  instagram?: {
    posts: PostScraperResult[];
    hashtagCounts: Record<string, number>;
  };
  tiktok?: {
    videos: TikTokVideoResult[];
    hashtagCounts: Record<string, number>;
  };
  topCreators: Array<{
    platform: 'instagram' | 'tiktok';
    username: string;
    engagementScore: number;
    postsFound: number;
  }>;
}

export async function campaignDiscovery(
  input: CampaignDiscoveryInput,
  options: PresetRunOptions = {}
): Promise<PresetResult<CampaignDiscoveryData>> {
  const startTime = Date.now();
  const errors: string[] = [];
  const platforms = input.platforms || ['instagram', 'tiktok'];
  const resultsPerHashtag = input.resultsPerHashtag || 30;
  
  const costBatches: BatchInput[] = [];
  
  if (platforms.includes('instagram')) {
    costBatches.push({ actorKey: 'instagram_post', estimatedItems: resultsPerHashtag * input.hashtags.length });
  }
  if (platforms.includes('tiktok')) {
    costBatches.push({ actorKey: 'tiktok_scraper', estimatedItems: resultsPerHashtag * input.hashtags.length, options: { includeStartFee: true } });
  }
  
  const totalCost = estimateBatchCost(costBatches);

  if (options.dryRun) {
    return {
      success: true,
      data: { instagram: undefined, tiktok: undefined, topCreators: [] },
      costEstimate: totalCost,
      errors: [],
    };
  }

  if (!isApifyConfigured()) {
    return {
      success: false,
      data: { instagram: undefined, tiktok: undefined, topCreators: [] },
      costEstimate: totalCost,
      errors: ['Apify não configurado. Defina APIFY_API_KEY.'],
    };
  }

  const data: CampaignDiscoveryData = { topCreators: [] };
  const creatorMap = new Map<string, { platform: 'instagram' | 'tiktok'; engagementScore: number; postsFound: number }>();

  const promises: Promise<void>[] = [];

  if (platforms.includes('instagram')) {
    const igPromise = (async () => {
      try {
        const hashtagUrls = input.hashtags.map(h => 
          `https://instagram.com/explore/tags/${h.replace('#', '')}`
        );
        
        const posts = await scrapePosts(
          hashtagUrls,
          resultsPerHashtag * input.hashtags.length,
          { addParentData: true },
          { triggeredBy: options.triggeredBy, triggeredByUserId: options.triggeredByUserId }
        );

        const hashtagCounts: Record<string, number> = {};
        for (const post of posts) {
          const postHashtags = post.hashtags || [];
          for (const tag of postHashtags) {
            const normalizedTag = tag.toLowerCase().replace('#', '');
            hashtagCounts[normalizedTag] = (hashtagCounts[normalizedTag] || 0) + 1;
          }

          if (post.ownerUsername) {
            const engagement = (post.likesCount || 0) + (post.commentsCount || 0) * 2;
            const existing = creatorMap.get(`ig:${post.ownerUsername}`);
            if (existing) {
              existing.engagementScore += engagement;
              existing.postsFound += 1;
            } else {
              creatorMap.set(`ig:${post.ownerUsername}`, {
                platform: 'instagram',
                engagementScore: engagement,
                postsFound: 1,
              });
            }
          }
        }

        data.instagram = { posts, hashtagCounts };
      } catch (error: any) {
        errors.push(`Instagram: ${error.message}`);
        data.instagram = { posts: [], hashtagCounts: {} };
      }
    })();
    promises.push(igPromise);
  }

  if (platforms.includes('tiktok')) {
    const ttPromise = (async () => {
      try {
        const videos = await scrapeTikTokHashtags(
          input.hashtags,
          { totalResults: resultsPerHashtag * input.hashtags.length },
          { 
            triggeredBy: options.triggeredBy, 
            triggeredByUserId: options.triggeredByUserId,
            saveToDb: options.saveToDb ?? true,
          }
        );

        const hashtagCounts: Record<string, number> = {};
        for (const video of videos) {
          const desc = video.desc || '';
          const tags = desc.match(/#\w+/g) || [];
          for (const tag of tags) {
            const normalizedTag = tag.toLowerCase().replace('#', '');
            hashtagCounts[normalizedTag] = (hashtagCounts[normalizedTag] || 0) + 1;
          }

          const username = video.author?.uniqueId;
          if (username) {
            const engagement = (video.stats?.diggCount || 0) + (video.stats?.commentCount || 0) * 2 + (video.stats?.shareCount || 0) * 3;
            const existing = creatorMap.get(`tt:${username}`);
            if (existing) {
              existing.engagementScore += engagement;
              existing.postsFound += 1;
            } else {
              creatorMap.set(`tt:${username}`, {
                platform: 'tiktok',
                engagementScore: engagement,
                postsFound: 1,
              });
            }
          }
        }

        data.tiktok = { videos, hashtagCounts };
      } catch (error: any) {
        errors.push(`TikTok: ${error.message}`);
        data.tiktok = { videos: [], hashtagCounts: {} };
      }
    })();
    promises.push(ttPromise);
  }

  await Promise.all(promises);

  data.topCreators = Array.from(creatorMap.entries())
    .map(([key, value]) => ({
      platform: value.platform,
      username: key.split(':')[1],
      engagementScore: value.engagementScore,
      postsFound: value.postsFound,
    }))
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, 20);

  return {
    success: errors.length === 0,
    data,
    costEstimate: totalCost,
    executionTimeMs: Date.now() - startTime,
    errors,
  };
}

export interface CompetitorAnalysisInput {
  instagramUsernames?: string[];
  youtubeChannels?: string[];
  includeRecentContent?: boolean;
  contentLimit?: number;
}

export interface CompetitorAnalysisData {
  instagram: Array<{
    profile: ProfileScraperResult;
    recentPosts: PostScraperResult[];
  }>;
  youtube: Array<{
    channelId: string;
    recentVideos: YouTubeVideoResult[];
    stats?: {
      subscribers?: number;
      totalViews?: number;
      videoCount?: number;
    };
  }>;
  comparison: {
    instagramFollowerRanking: Array<{ username: string; followers: number }>;
    youtubeVideoCountRanking: Array<{ channelId: string; videoCount: number; note: string }>;
  };
}

export async function competitorAnalysis(
  input: CompetitorAnalysisInput,
  options: PresetRunOptions = {}
): Promise<PresetResult<CompetitorAnalysisData>> {
  const startTime = Date.now();
  const errors: string[] = [];
  
  const costBatches: BatchInput[] = [];
  const igUsernames = input.instagramUsernames || [];
  const ytChannels = input.youtubeChannels || [];
  
  if (igUsernames.length > 0) {
    costBatches.push({ actorKey: 'instagram_profile', estimatedItems: igUsernames.length });
    if (input.includeRecentContent) {
      costBatches.push({ actorKey: 'instagram_post', estimatedItems: (input.contentLimit || 5) * igUsernames.length });
    }
  }
  
  if (ytChannels.length > 0) {
    costBatches.push({ actorKey: 'youtube_scraper', estimatedItems: (input.contentLimit || 10) * ytChannels.length });
  }
  
  const totalCost = estimateBatchCost(costBatches);

  if (options.dryRun) {
    return {
      success: true,
      data: { 
        instagram: [], 
        youtube: [], 
        comparison: { instagramFollowerRanking: [], youtubeVideoCountRanking: [] } 
      },
      costEstimate: totalCost,
      errors: [],
    };
  }

  if (!isApifyConfigured()) {
    return {
      success: false,
      data: { 
        instagram: [], 
        youtube: [], 
        comparison: { instagramFollowerRanking: [], youtubeVideoCountRanking: [] } 
      },
      costEstimate: totalCost,
      errors: ['Apify não configurado. Defina APIFY_API_KEY.'],
    };
  }

  const data: CompetitorAnalysisData = {
    instagram: [],
    youtube: [],
    comparison: {
      instagramFollowerRanking: [],
      youtubeVideoCountRanking: [],
    },
  };

  const promises: Promise<void>[] = [];

  if (igUsernames.length > 0) {
    const igPromise = (async () => {
      try {
        const profiles = await scrapeProfiles(
          igUsernames,
          { triggeredBy: options.triggeredBy, triggeredByUserId: options.triggeredByUserId }
        );

        for (const profile of profiles) {
          let recentPosts: PostScraperResult[] = [];
          
          if (input.includeRecentContent && profile.username) {
            const postUrls = [`https://instagram.com/${profile.username}`];
            recentPosts = await scrapePosts(
              postUrls,
              input.contentLimit || 5,
              { addParentData: true },
              { triggeredBy: options.triggeredBy, triggeredByUserId: options.triggeredByUserId }
            );
          }

          data.instagram.push({ profile, recentPosts });
        }

        data.comparison.instagramFollowerRanking = profiles
          .filter(p => p.followersCount !== undefined)
          .map(p => ({ username: p.username, followers: p.followersCount! }))
          .sort((a, b) => b.followers - a.followers);
      } catch (error: any) {
        errors.push(`Instagram: ${error.message}`);
      }
    })();
    promises.push(igPromise);
  }

  if (ytChannels.length > 0) {
    const ytPromise = (async () => {
      try {
        for (const channelUrl of ytChannels) {
          const videos = await scrapeYouTubeChannel(
            [channelUrl],
            input.contentLimit || 10,
            { 
              triggeredBy: options.triggeredBy, 
              triggeredByUserId: options.triggeredByUserId,
              scrapeVideos: true,
              scrapeShorts: false,
              scrapeStreams: false,
            }
          );

          const channelId = channelUrl.includes('@') 
            ? channelUrl.split('@')[1]?.split('/')[0] || channelUrl
            : channelUrl;

          const firstVideo = videos[0];
          const stats = firstVideo?.channelName ? {
            subscribers: undefined,
            totalViews: undefined,
            videoCount: videos.length,
          } : undefined;

          data.youtube.push({
            channelId,
            recentVideos: videos,
            stats,
          });
        }
      } catch (error: any) {
        errors.push(`YouTube: ${error.message}`);
      }
    })();
    promises.push(ytPromise);
  }

  await Promise.all(promises);

  // Populate YouTube ranking based on video count (subscribers not available from video scraper)
  data.comparison.youtubeVideoCountRanking = data.youtube
    .filter(yt => yt.stats?.videoCount !== undefined)
    .map(yt => ({ 
      channelId: yt.channelId, 
      videoCount: yt.stats?.videoCount || 0,
      note: 'Ranking por quantidade de vídeos (subscribers indisponível via video scraper)'
    }))
    .sort((a, b) => b.videoCount - a.videoCount);

  return {
    success: errors.length === 0,
    data,
    costEstimate: totalCost,
    executionTimeMs: Date.now() - startTime,
    errors,
  };
}

export interface BrandMentionsInput {
  brandName: string;
  hashtags?: string[];
  instagramMentions?: string[];
  platforms?: ('instagram' | 'tiktok')[];
  resultsLimit?: number;
}

export interface BrandMentionsData {
  mentions: Array<{
    platform: 'instagram' | 'tiktok';
    type: 'post' | 'video';
    id: string;
    authorUsername: string;
    content: string;
    engagement: number;
    timestamp?: string;
    url?: string;
  }>;
  summary: {
    totalMentions: number;
    byPlatform: Record<string, number>;
    topMentioners: Array<{ username: string; mentions: number; totalEngagement: number }>;
  };
}

export async function brandMentions(
  input: BrandMentionsInput,
  options: PresetRunOptions = {}
): Promise<PresetResult<BrandMentionsData>> {
  const startTime = Date.now();
  const errors: string[] = [];
  const platforms = input.platforms || ['instagram', 'tiktok'];
  const resultsLimit = input.resultsLimit || 50;
  
  const hashtagsToSearch = input.hashtags || [input.brandName.toLowerCase().replace(/\s+/g, '')];
  
  const costBatches: BatchInput[] = [];
  
  if (platforms.includes('instagram')) {
    costBatches.push({ actorKey: 'instagram_post', estimatedItems: resultsLimit });
  }
  if (platforms.includes('tiktok')) {
    costBatches.push({ actorKey: 'tiktok_scraper', estimatedItems: resultsLimit, options: { includeStartFee: true } });
  }
  
  const totalCost = estimateBatchCost(costBatches);

  if (options.dryRun) {
    return {
      success: true,
      data: { 
        mentions: [], 
        summary: { totalMentions: 0, byPlatform: {}, topMentioners: [] } 
      },
      costEstimate: totalCost,
      errors: [],
    };
  }

  if (!isApifyConfigured()) {
    return {
      success: false,
      data: { 
        mentions: [], 
        summary: { totalMentions: 0, byPlatform: {}, topMentioners: [] } 
      },
      costEstimate: totalCost,
      errors: ['Apify não configurado. Defina APIFY_API_KEY.'],
    };
  }

  const allMentions: BrandMentionsData['mentions'] = [];
  const mentionerMap = new Map<string, { mentions: number; totalEngagement: number }>();

  const promises: Promise<void>[] = [];

  if (platforms.includes('instagram')) {
    const igPromise = (async () => {
      try {
        const hashtagUrls = hashtagsToSearch.map(h => 
          `https://instagram.com/explore/tags/${h.replace('#', '')}`
        );
        
        const posts = await scrapePosts(
          hashtagUrls,
          resultsLimit,
          { addParentData: true },
          { triggeredBy: options.triggeredBy, triggeredByUserId: options.triggeredByUserId }
        );

        for (const post of posts) {
          const engagement = (post.likesCount || 0) + (post.commentsCount || 0) * 2;
          
          allMentions.push({
            platform: 'instagram',
            type: 'post',
            id: post.id,
            authorUsername: post.ownerUsername || 'unknown',
            content: post.caption || '',
            engagement,
            timestamp: post.timestamp,
            url: post.shortCode ? `https://instagram.com/p/${post.shortCode}` : undefined,
          });

          if (post.ownerUsername) {
            const existing = mentionerMap.get(post.ownerUsername);
            if (existing) {
              existing.mentions += 1;
              existing.totalEngagement += engagement;
            } else {
              mentionerMap.set(post.ownerUsername, { mentions: 1, totalEngagement: engagement });
            }
          }
        }
      } catch (error: any) {
        errors.push(`Instagram: ${error.message}`);
      }
    })();
    promises.push(igPromise);
  }

  if (platforms.includes('tiktok')) {
    const ttPromise = (async () => {
      try {
        const videos = await scrapeTikTokHashtags(
          hashtagsToSearch,
          { totalResults: resultsLimit },
          { 
            triggeredBy: options.triggeredBy, 
            triggeredByUserId: options.triggeredByUserId,
            saveToDb: options.saveToDb ?? true,
          }
        );

        for (const video of videos) {
          const engagement = (video.stats?.diggCount || 0) + (video.stats?.commentCount || 0) * 2 + (video.stats?.shareCount || 0) * 3;
          const username = video.author?.uniqueId || 'unknown';
          
          allMentions.push({
            platform: 'tiktok',
            type: 'video',
            id: video.id,
            authorUsername: username,
            content: video.desc || '',
            engagement,
            timestamp: undefined,
            url: video.id ? `https://tiktok.com/@${username}/video/${video.id}` : undefined,
          });

          if (username !== 'unknown') {
            const existing = mentionerMap.get(username);
            if (existing) {
              existing.mentions += 1;
              existing.totalEngagement += engagement;
            } else {
              mentionerMap.set(username, { mentions: 1, totalEngagement: engagement });
            }
          }
        }
      } catch (error: any) {
        errors.push(`TikTok: ${error.message}`);
      }
    })();
    promises.push(ttPromise);
  }

  await Promise.all(promises);

  const byPlatform: Record<string, number> = {};
  for (const mention of allMentions) {
    byPlatform[mention.platform] = (byPlatform[mention.platform] || 0) + 1;
  }

  const topMentioners = Array.from(mentionerMap.entries())
    .map(([username, data]) => ({ username, ...data }))
    .sort((a, b) => b.totalEngagement - a.totalEngagement)
    .slice(0, 10);

  return {
    success: errors.length === 0,
    data: {
      mentions: allMentions.sort((a, b) => b.engagement - a.engagement),
      summary: {
        totalMentions: allMentions.length,
        byPlatform,
        topMentioners,
      },
    },
    costEstimate: totalCost,
    executionTimeMs: Date.now() - startTime,
    errors,
  };
}

export const PRESETS = {
  creatorFullProfile: {
    name: 'Perfil Completo de Criador',
    description: 'Extrai perfil Instagram + TikTok com posts e reels recentes',
    estimatedCost: '$0.50 - $2.00',
    platforms: ['instagram', 'tiktok'],
  },
  campaignDiscovery: {
    name: 'Descoberta de Campanha',
    description: 'Busca conteúdo por hashtags em múltiplas plataformas e identifica top criadores',
    estimatedCost: '$1.00 - $5.00',
    platforms: ['instagram', 'tiktok'],
  },
  competitorAnalysis: {
    name: 'Análise de Concorrentes',
    description: 'Compara perfis Instagram e canais YouTube com ranking de métricas',
    estimatedCost: '$0.75 - $3.00',
    platforms: ['instagram', 'youtube'],
  },
  brandMentions: {
    name: 'Menções de Marca',
    description: 'Monitora menções da marca por hashtags e identifica influenciadores orgânicos',
    estimatedCost: '$0.50 - $2.50',
    platforms: ['instagram', 'tiktok'],
  },
} as const;

export type PresetName = keyof typeof PRESETS;
