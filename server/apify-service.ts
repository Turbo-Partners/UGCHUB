import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
  token: process.env.APIFY_API_KEY,
});

export interface InstagramTopPost {
  id: string;
  url: string;
  imageUrl: string;
  caption: string;
  likes: number;
  comments: number;
  timestamp: string;
}

export interface InstagramMetrics {
  exists: boolean;
  username: string;
  fullName?: string;
  followers?: number;
  following?: number;
  postsCount?: number;
  engagementRate?: string;
  authenticityScore?: number;
  topHashtags?: string[];
  topPosts?: InstagramTopPost[];
  bio?: string;
  isPrivate?: boolean;
  isVerified?: boolean;
  profilePicUrl?: string;
}

export interface InstagramPost {
  likes?: number;
  comments?: number;
  caption?: string;
  hashtags?: string[];
  timestamp?: string;
}

// DISABLED: getInstagramProfilePicUrl has been removed to prevent accidental Apify costs.
// Profile pictures should only be sourced from local database data (users, instagramAccounts,
// instagramProfiles, instagramMessages, companies tables) via the findProfilePicInLocalDB
// function in server/services/instagram-profile-pic.ts.

function normalizeApiScraperProfile(raw: any): {
  username: string;
  fullName: string | undefined;
  biography: string | undefined;
  followersCount: number | undefined;
  followsCount: number | undefined;
  postsCount: number | undefined;
  profilePicUrl: string | undefined;
  isVerified: boolean | undefined;
  isPrivate: boolean | undefined;
  externalUrl: string | undefined;
  businessCategory: string | undefined;
} {
  return {
    username: raw.username || '',
    fullName: raw.full_name || raw.fullName,
    biography: raw.biography,
    followersCount: raw.edge_followed_by?.count ?? raw.followersCount,
    followsCount: raw.edge_follow?.count ?? raw.followsCount,
    postsCount: raw.edge_owner_to_timeline_media?.count ?? raw.postsCount,
    profilePicUrl: raw.profile_pic_url || raw.profilePicUrl || raw.profile_pic_url_hd,
    isVerified: raw.is_verified ?? raw.verified,
    isPrivate: raw.is_private ?? raw.private,
    externalUrl: raw.external_url || raw.externalUrl,
    businessCategory: raw.business_category_name || raw.businessCategory,
  };
}

export function estimateApifyApiScraperCost(resultCount: number = 1): string {
  const cost = (resultCount / 1000) * 0.50;
  return `~$${cost.toFixed(4)} (${resultCount} resultado${resultCount > 1 ? 's' : ''})`;
}

export function estimateApifyProfileCost(count: number = 1): string {
  const cost = (count / 1000) * 2.60;
  return `~$${cost.toFixed(4)} (${count} perfil${count > 1 ? 's' : ''})`;
}

export function estimateApifyPostCost(count: number = 12): string {
  const cost = (count / 1000) * 2.70;
  return `~$${cost.toFixed(4)} (${count} posts)`;
}

export async function validateInstagramProfile(username: string, options?: { skipPosts?: boolean }): Promise<InstagramMetrics> {
  try {
    const cleanUsername = username.replace('@', '').trim();
    
    if (options?.skipPosts) {
      const runInput = {
        directUrls: [`https://www.instagram.com/${cleanUsername}/`],
        resultsType: "details",
        resultsLimit: 1,
      };

      console.log(`[Apify] Calling instagram-api-scraper (details only, 1 call) - Cost: ${estimateApifyApiScraperCost(1)}`);
      const run = await client.actor("apify/instagram-api-scraper").call(runInput);
      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      
      if (!items || items.length === 0) {
        return { exists: false, username: cleanUsername };
      }

      const profile = normalizeApiScraperProfile(items[0]);
      return {
        exists: true,
        username: (profile.username || cleanUsername) as string,
        fullName: profile.fullName as string | undefined,
        followers: profile.followersCount as number | undefined,
        following: profile.followsCount as number | undefined,
        postsCount: profile.postsCount as number | undefined,
        engagementRate: '0%',
        authenticityScore: 50,
        topHashtags: [],
        topPosts: [],
        bio: profile.biography as string | undefined,
        isPrivate: profile.isPrivate as boolean | undefined,
        isVerified: profile.isVerified as boolean | undefined,
        profilePicUrl: profile.profilePicUrl as string | undefined,
      };
    }

    const resultsLimit = 12;
    const combinedInput = {
      directUrls: [`https://www.instagram.com/${cleanUsername}/`],
      resultsType: "posts",
      resultsLimit,
      scrapePostsUntilDate: "3 months",
      addParentData: true,
    };

    console.log(`[Apify] Calling instagram-api-scraper (posts+profile in 1 call) - Cost: ${estimateApifyApiScraperCost(resultsLimit)}`);
    const run = await client.actor("apify/instagram-api-scraper").call(combinedInput);
    const { items: postItems } = await client.dataset(run.defaultDatasetId).listItems();
    
    if (!postItems || postItems.length === 0) {
      const detailsInput = {
        directUrls: [`https://www.instagram.com/${cleanUsername}/`],
        resultsType: "details",
        resultsLimit: 1,
      };
      console.log(`[Apify] No posts found, fetching details only as fallback`);
      const detailsRun = await client.actor("apify/instagram-api-scraper").call(detailsInput);
      const { items } = await client.dataset(detailsRun.defaultDatasetId).listItems();
      
      if (!items || items.length === 0) {
        return { exists: false, username: cleanUsername };
      }
      const profile = normalizeApiScraperProfile(items[0]);
      return {
        exists: true,
        username: (profile.username || cleanUsername) as string,
        fullName: profile.fullName as string | undefined,
        followers: profile.followersCount as number | undefined,
        following: profile.followsCount as number | undefined,
        postsCount: profile.postsCount as number | undefined,
        engagementRate: '0%',
        authenticityScore: 50,
        topHashtags: [],
        topPosts: [],
        bio: profile.biography as string | undefined,
        isPrivate: profile.isPrivate as boolean | undefined,
        isVerified: profile.isVerified as boolean | undefined,
        profilePicUrl: profile.profilePicUrl as string | undefined,
      };
    }

    const firstItem = postItems[0] as any;
    const ownerData = firstItem?.ownerUsername ? firstItem : postItems.find((p: any) => p.ownerUsername);
    
    const profileData = {
      username: ownerData?.ownerUsername || cleanUsername,
      fullName: ownerData?.ownerFullName || firstItem?.ownerFullName || '',
      biography: ownerData?.ownerBiography || '',
      followersCount: ownerData?.ownerFollowersCount ?? firstItem?.ownerFollowersCount,
      followsCount: ownerData?.ownerFollowsCount ?? firstItem?.ownerFollowsCount,
      postsCount: ownerData?.ownerPostsCount ?? firstItem?.ownerPostsCount,
      profilePicUrl: ownerData?.ownerProfilePicUrl || firstItem?.ownerProfilePicUrl || '',
      isVerified: ownerData?.ownerIsVerified ?? false,
      isPrivate: ownerData?.ownerIsPrivate ?? false,
    };

    if (!profileData.followersCount && firstItem) {
      const rawProfile = normalizeApiScraperProfile(firstItem);
      profileData.followersCount = profileData.followersCount || rawProfile.followersCount;
      profileData.followsCount = profileData.followsCount || rawProfile.followsCount;
      profileData.postsCount = profileData.postsCount || rawProfile.postsCount;
      profileData.profilePicUrl = profileData.profilePicUrl || rawProfile.profilePicUrl || '';
      profileData.biography = profileData.biography || rawProfile.biography || '';
      profileData.fullName = profileData.fullName || rawProfile.fullName || '';
      profileData.isVerified = profileData.isVerified || rawProfile.isVerified || false;
      profileData.isPrivate = profileData.isPrivate || rawProfile.isPrivate || false;
    }

    console.log('[Apify] Profile extracted from posts data:', {
      username: profileData.username,
      followers: profileData.followersCount,
      postsReturned: postItems.length,
    });

    let engagementRate = '0%';
    let authenticityScore = 50;
    let topHashtags: string[] = [];
    let topPosts: InstagramTopPost[] = [];

    const posts: InstagramPost[] = postItems.map((post: any) => ({
      likes: post.likesCount || post.likeCount || post.likes || 0,
      comments: post.commentsCount || post.commentCount || post.comments || 0,
      caption: post.caption || post.text || '',
      hashtags: post.hashtags || [],
      timestamp: post.timestamp || post.takenAtTimestamp,
    }));

    if (posts.length > 0) {
      engagementRate = calculateEngagementRate(profileData.followersCount as number, posts);
      authenticityScore = calculateAuthenticityScore(profileData.followersCount as number, profileData.followsCount as number, posts);
      topHashtags = extractTopHashtags(posts);
      topPosts = extractTopPosts(postItems, 3);
    }
    
    return {
      exists: true,
      username: (profileData.username || cleanUsername) as string,
      fullName: profileData.fullName as string | undefined,
      followers: profileData.followersCount as number | undefined,
      following: profileData.followsCount as number | undefined,
      postsCount: profileData.postsCount as number | undefined,
      engagementRate,
      authenticityScore,
      topHashtags,
      topPosts,
      bio: profileData.biography as string | undefined,
      isPrivate: profileData.isPrivate as boolean | undefined,
      isVerified: profileData.isVerified as boolean | undefined,
      profilePicUrl: profileData.profilePicUrl as string | undefined,
    };
  } catch (error) {
    console.error('[Apify] Error validating Instagram profile:', error);
    throw new Error('Failed to validate Instagram profile');
  }
}

export interface InstagramProfileData {
  username: string;
  fullName?: string;
  bio?: string;
  followers?: number;
  following?: number;
  postsCount?: number;
  profilePicUrl?: string;
  isPrivate?: boolean;
  isVerified?: boolean;
  externalUrl?: string;
  error?: string;
  // Engagement metrics from last 30 posts
  totalLikes?: number;
  totalComments?: number;
  avgLikesPerPost?: number;
  avgCommentsPerPost?: number;
}

export async function getInstagramProfileData(username: string): Promise<InstagramProfileData | null> {
  try {
    const cleanUsername = username.replace('@', '').trim();
    
    console.log(`[Apify] Getting full profile data for: ${cleanUsername} (1 combined call)`);
    
    const resultsLimit = 12;
    const combinedInput = {
      directUrls: [`https://www.instagram.com/${cleanUsername}/`],
      resultsType: "posts",
      resultsLimit,
      scrapePostsUntilDate: "3 months",
      addParentData: true,
    };

    console.log(`[Apify] Calling instagram-api-scraper (posts+profile in 1 call) - Cost: ${estimateApifyApiScraperCost(resultsLimit)}`);
    const run = await client.actor("apify/instagram-api-scraper").call(combinedInput);
    const { items: postItems } = await client.dataset(run.defaultDatasetId).listItems();
    
    if (!postItems || postItems.length === 0) {
      const detailsInput = {
        directUrls: [`https://www.instagram.com/${cleanUsername}/`],
        resultsType: "details",
        resultsLimit: 1,
      };
      console.log(`[Apify] No posts found, fetching details only as fallback`);
      const detailsRun = await client.actor("apify/instagram-api-scraper").call(detailsInput);
      const { items } = await client.dataset(detailsRun.defaultDatasetId).listItems();
      
      if (!items || items.length === 0) {
        console.log(`[Apify] Profile not found for: ${cleanUsername}`);
        return null;
      }
      const profile = normalizeApiScraperProfile(items[0]);
      return {
        username: profile.username || cleanUsername,
        fullName: profile.fullName,
        bio: profile.biography,
        followers: profile.followersCount,
        following: profile.followsCount,
        postsCount: profile.postsCount,
        profilePicUrl: profile.profilePicUrl,
        isPrivate: profile.isPrivate,
        isVerified: profile.isVerified,
        externalUrl: profile.externalUrl,
      };
    }

    const firstItem = postItems[0] as any;
    const profileData: InstagramProfileData = {
      username: firstItem.ownerUsername || cleanUsername,
      fullName: firstItem.ownerFullName,
      bio: firstItem.ownerBiography,
      followers: firstItem.ownerFollowersCount ?? firstItem.followersCount,
      following: firstItem.ownerFollowsCount ?? firstItem.followsCount,
      postsCount: firstItem.ownerPostsCount ?? firstItem.postsCount,
      profilePicUrl: firstItem.ownerProfilePicUrl || firstItem.profilePicUrl,
      isPrivate: firstItem.ownerIsPrivate ?? false,
      isVerified: firstItem.ownerIsVerified ?? false,
      externalUrl: firstItem.ownerExternalUrl,
    };

    if (!profileData.followers) {
      const rawProfile = normalizeApiScraperProfile(firstItem);
      profileData.followers = rawProfile.followersCount;
      profileData.following = rawProfile.followsCount;
      profileData.postsCount = rawProfile.postsCount;
      profileData.profilePicUrl = profileData.profilePicUrl || rawProfile.profilePicUrl;
      profileData.bio = profileData.bio || rawProfile.biography;
      profileData.fullName = profileData.fullName || rawProfile.fullName;
    }

    let totalLikes = 0;
    let totalComments = 0;
    
    for (const post of postItems as any[]) {
      totalLikes += post.likesCount || post.likeCount || post.likes || 0;
      totalComments += post.commentsCount || post.commentCount || post.comments || 0;
    }
    
    profileData.totalLikes = totalLikes;
    profileData.totalComments = totalComments;
    profileData.avgLikesPerPost = postItems.length > 0 ? Math.round(totalLikes / postItems.length) : 0;
    profileData.avgCommentsPerPost = postItems.length > 0 ? Math.round(totalComments / postItems.length) : 0;
    
    console.log(`[Apify] Profile+engagement for ${cleanUsername}: ${totalLikes} likes, ${totalComments} comments from ${postItems.length} posts (1 call)`);
    
    return profileData;
  } catch (error) {
    console.error('[Apify] Error getting Instagram profile data:', error);
    return null;
  }
}

export async function getInstagramMetrics(username: string): Promise<InstagramMetrics> {
  try {
    const cleanUsername = username.replace('@', '').trim();
    
    const metricsResultsLimit = 12;
    const combinedInput = {
      directUrls: [`https://www.instagram.com/${cleanUsername}/`],
      resultsType: "posts",
      resultsLimit: metricsResultsLimit,
      scrapePostsUntilDate: "3 months",
      addParentData: true,
    };

    console.log(`[Apify] Calling instagram-api-scraper (metrics: posts+profile in 1 call) - Cost: ${estimateApifyApiScraperCost(metricsResultsLimit)}`);
    const run = await client.actor("apify/instagram-api-scraper").call(combinedInput);
    const { items: postItems } = await client.dataset(run.defaultDatasetId).listItems();
    
    if (!postItems || postItems.length === 0) {
      const detailsInput = {
        directUrls: [`https://www.instagram.com/${cleanUsername}/`],
        resultsType: "details",
        resultsLimit: 1,
      };
      console.log(`[Apify] No posts found, fetching details only as fallback`);
      const detailsRun = await client.actor("apify/instagram-api-scraper").call(detailsInput);
      const { items: profileItems } = await client.dataset(detailsRun.defaultDatasetId).listItems();
      if (!profileItems || profileItems.length === 0) {
        return { exists: false, username: cleanUsername };
      }
      const profile = normalizeApiScraperProfile(profileItems[0]);
      return {
        exists: true,
        username: (profile.username || cleanUsername) as string,
        fullName: profile.fullName as string | undefined,
        followers: profile.followersCount as number | undefined,
        following: profile.followsCount as number | undefined,
        postsCount: profile.postsCount as number | undefined,
        engagementRate: '0%',
        authenticityScore: 50,
        topHashtags: [],
        topPosts: [],
        bio: profile.biography as string | undefined,
        isPrivate: profile.isPrivate as boolean | undefined,
        isVerified: profile.isVerified as boolean | undefined,
        profilePicUrl: profile.profilePicUrl as string | undefined,
      };
    }

    const firstItem = postItems[0] as any;
    const profile = {
      username: firstItem.ownerUsername || cleanUsername,
      fullName: firstItem.ownerFullName || '',
      biography: firstItem.ownerBiography || '',
      followersCount: firstItem.ownerFollowersCount ?? firstItem.followersCount,
      followsCount: firstItem.ownerFollowsCount ?? firstItem.followsCount,
      postsCount: firstItem.ownerPostsCount ?? firstItem.postsCount,
      profilePicUrl: firstItem.ownerProfilePicUrl || firstItem.profilePicUrl || '',
      isVerified: firstItem.ownerIsVerified ?? false,
      isPrivate: firstItem.ownerIsPrivate ?? false,
    };

    if (!profile.followersCount) {
      const rawProfile = normalizeApiScraperProfile(firstItem);
      profile.followersCount = rawProfile.followersCount;
      profile.followsCount = rawProfile.followsCount;
      profile.postsCount = rawProfile.postsCount;
      profile.profilePicUrl = profile.profilePicUrl || rawProfile.profilePicUrl || '';
      profile.biography = profile.biography || rawProfile.biography || '';
      profile.fullName = profile.fullName || rawProfile.fullName || '';
    }

    let posts: InstagramPost[] = [];
    let engagementRate = '0%';
    let authenticityScore = 50;
    let topHashtags: string[] = [];
    let topPosts: InstagramTopPost[] = [];

    if (postItems.length > 0) {
      posts = postItems.map((post: any) => ({
        likes: post.likesCount || post.likeCount || post.likes || 0,
        comments: post.commentsCount || post.commentCount || post.comments || 0,
        caption: post.caption || post.text || '',
        hashtags: post.hashtags || [],
        timestamp: post.timestamp || post.takenAtTimestamp,
      }));

      engagementRate = calculateEngagementRate(profile.followersCount as number, posts);
      authenticityScore = calculateAuthenticityScore(profile.followersCount as number, profile.followsCount as number, posts);
      topHashtags = extractTopHashtags(posts);
      topPosts = extractTopPosts(postItems, 3);
    }

    return {
      exists: true,
      username: (profile.username || cleanUsername) as string,
      fullName: profile.fullName as string | undefined,
      followers: profile.followersCount as number | undefined,
      following: profile.followsCount as number | undefined,
      postsCount: profile.postsCount as number | undefined,
      engagementRate,
      authenticityScore,
      topHashtags,
      topPosts,
      bio: profile.biography as string | undefined,
      isPrivate: profile.isPrivate as boolean | undefined,
      isVerified: profile.isVerified as boolean | undefined,
      profilePicUrl: profile.profilePicUrl as string | undefined,
    };
  } catch (error) {
    console.error('[Apify] Error getting Instagram metrics:', error);
    throw new Error('Failed to get Instagram metrics');
  }
}

export function calculateEngagementRate(followers: number, posts: InstagramPost[]): string {
  if (!followers || followers === 0 || !posts || posts.length === 0) {
    return '0%';
  }

  const totalEngagement = posts.reduce((sum, post) => {
    return sum + (post.likes || 0) + (post.comments || 0);
  }, 0);

  const avgEngagement = totalEngagement / posts.length;
  const rate = (avgEngagement / followers) * 100;

  return rate.toFixed(2) + '%';
}

export function calculateAuthenticityScore(
  followers: number,
  following: number,
  posts: InstagramPost[]
): number {
  let score = 50;

  const followerFollowingRatio = following > 0 ? followers / following : 0;
  if (followerFollowingRatio > 2) {
    score += 15;
  } else if (followerFollowingRatio > 1) {
    score += 10;
  } else if (followerFollowingRatio < 0.1) {
    score -= 20;
  }

  if (posts && posts.length > 0) {
    const engagementRateNum = parseFloat(calculateEngagementRate(followers, posts));
    
    if (followers < 10000) {
      if (engagementRateNum > 3) score += 20;
      else if (engagementRateNum > 1.5) score += 10;
      else if (engagementRateNum < 0.5) score -= 15;
    } else if (followers < 100000) {
      if (engagementRateNum > 2) score += 20;
      else if (engagementRateNum > 1) score += 10;
      else if (engagementRateNum < 0.3) score -= 15;
    } else {
      if (engagementRateNum > 1) score += 20;
      else if (engagementRateNum > 0.5) score += 10;
      else if (engagementRateNum < 0.2) score -= 15;
    }

    const avgLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0) / posts.length;
    const avgComments = posts.reduce((sum, p) => sum + (p.comments || 0), 0) / posts.length;
    
    if (avgComments > 0) {
      const likeCommentRatio = avgLikes / avgComments;
      if (likeCommentRatio > 100) {
        score -= 10;
      } else if (likeCommentRatio > 50) {
        score -= 5;
      }
    }
  }

  return Math.max(0, Math.min(100, score));
}

export function extractTopHashtags(posts: InstagramPost[]): string[] {
  const hashtagCount: { [key: string]: number } = {};

  posts.forEach(post => {
    if (post.hashtags) {
      post.hashtags.forEach(tag => {
        const cleanTag = tag.replace('#', '').toLowerCase();
        hashtagCount[cleanTag] = (hashtagCount[cleanTag] || 0) + 1;
      });
    }
  });

  const sorted = Object.entries(hashtagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);

  return sorted;
}

export function extractTopPosts(rawPosts: any[], limit: number = 3): InstagramTopPost[] {
  if (!rawPosts || rawPosts.length === 0) {
    return [];
  }

  // Map raw posts to our format and calculate engagement
  const mappedPosts = rawPosts.map((post: any) => {
    const likes = Math.max(0, parseInt(post.likesCount || post.likeCount || post.likes) || 0);
    const comments = Math.max(0, parseInt(post.commentsCount || post.commentCount || post.comments) || 0);
    const shortCode = post.shortCode || post.id || '';
    
    return {
      id: String(shortCode).substring(0, 100),
      url: `https://www.instagram.com/p/${shortCode}/`,
      imageUrl: String(post.displayUrl || post.imageUrl || post.thumbnailUrl || ''),
      caption: String(post.caption || post.text || '')
        .replace(/<[^>]*>/g, '')
        .replace(/javascript:/gi, '')
        .substring(0, 200),
      likes,
      comments,
      timestamp: String(post.timestamp || post.takenAtTimestamp || new Date().toISOString()),
      engagement: likes + comments,
    };
  });

  // Sort by engagement (likes + comments) descending and take top N
  const sortedPosts = mappedPosts
    .filter(post => post.id && post.imageUrl)
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, limit);

  // Remove the engagement field we added for sorting
  return sortedPosts.map(({ engagement, ...rest }) => rest);
}

// ============================================
// TikTok Integration
// ============================================

export interface TikTokMetrics {
  exists: boolean;
  username: string;
  id?: string;
  fullName?: string;
  followers?: number;
  following?: number;
  likes?: number; // Total likes received
  videos?: number;
  engagementRate?: string;
  bio?: string;
  verified?: boolean;
  avatarUrl?: string;
  topHashtags?: string[];
}

export interface TikTokPost {
  id: string;
  url: string;
  thumbnailUrl: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  hashtags: string[];
  mentions: string[];
  timestamp: string;
  postType: 'video';
}

export async function getTikTokMetrics(username: string): Promise<TikTokMetrics> {
  try {
    const cleanUsername = username.replace('@', '').trim();
    
    console.log('[Apify TikTok] Fetching profile for:', cleanUsername);
    
    // Use TikTok Profile Scraper actor
    const runInput = {
      profiles: [`https://www.tiktok.com/@${cleanUsername}`],
      resultsPerPage: 1,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
    };

    const run = await client.actor("clockworks/free-tiktok-scraper").call(runInput);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    if (!items || items.length === 0) {
      console.log('[Apify TikTok] Profile not found for:', cleanUsername);
      return {
        exists: false,
        username: cleanUsername,
      };
    }

    const profile: any = items[0];
    
    console.log('[Apify TikTok] Profile data received:', {
      username: profile.authorMeta?.name || profile.author?.uniqueId,
      followers: profile.authorMeta?.fans || profile.author?.followerCount,
      likes: profile.authorMeta?.heart || profile.author?.heartCount,
    });

    // Extract profile data from different possible structures
    const authorMeta = profile.authorMeta || profile.author || {};
    
    const followers = authorMeta.fans || authorMeta.followerCount || 0;
    const following = authorMeta.following || authorMeta.followingCount || 0;
    const totalLikes = authorMeta.heart || authorMeta.heartCount || 0;
    const videos = authorMeta.video || authorMeta.videoCount || 0;
    
    // Calculate engagement rate (likes per video / followers * 100)
    let engagementRate = '0%';
    if (followers > 0 && videos > 0) {
      const avgLikesPerVideo = totalLikes / videos;
      const rate = (avgLikesPerVideo / followers) * 100;
      engagementRate = rate.toFixed(2) + '%';
    }

    return {
      exists: true,
      username: authorMeta.name || authorMeta.uniqueId || cleanUsername,
      id: authorMeta.id,
      fullName: authorMeta.nickName || authorMeta.nickname,
      followers,
      following,
      likes: totalLikes,
      videos,
      engagementRate,
      bio: authorMeta.signature || authorMeta.bio,
      verified: authorMeta.verified || false,
      avatarUrl: authorMeta.avatar || authorMeta.avatarLarger,
    };
  } catch (error) {
    console.error('[Apify TikTok] Error getting metrics:', error);
    throw new Error('Failed to get TikTok metrics');
  }
}

export async function getTikTokPosts(username: string, limit: number = 30): Promise<TikTokPost[]> {
  try {
    const cleanUsername = username.replace('@', '').trim();
    
    console.log('[Apify TikTok] Fetching posts for:', cleanUsername);
    
    const runInput = {
      profiles: [`https://www.tiktok.com/@${cleanUsername}`],
      resultsPerPage: limit,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
    };

    const run = await client.actor("clockworks/free-tiktok-scraper").call(runInput);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    if (!items || items.length === 0) {
      console.log('[Apify TikTok] No posts found for:', cleanUsername);
      return [];
    }

    console.log('[Apify TikTok] Posts fetched:', items.length);

    const posts: TikTokPost[] = items.map((item: any) => {
      const hashtags = extractHashtagsFromText(item.text || item.desc || '');
      const mentions = extractMentionsFromText(item.text || item.desc || '');
      
      return {
        id: item.id || item.videoId || String(Date.now()),
        url: item.webVideoUrl || `https://www.tiktok.com/@${cleanUsername}/video/${item.id}`,
        thumbnailUrl: item.covers?.default || item.videoMeta?.coverUrl || '',
        caption: (item.text || item.desc || '').substring(0, 500),
        likes: item.diggCount || item.stats?.diggCount || 0,
        comments: item.commentCount || item.stats?.commentCount || 0,
        shares: item.shareCount || item.stats?.shareCount || 0,
        views: item.playCount || item.stats?.playCount || 0,
        hashtags,
        mentions,
        timestamp: item.createTime ? new Date(item.createTime * 1000).toISOString() : new Date().toISOString(),
        postType: 'video' as const,
      };
    });

    return posts;
  } catch (error) {
    console.error('[Apify TikTok] Error getting posts:', error);
    return [];
  }
}

// ============================================
// Enhanced Instagram Posts Analysis
// ============================================

export interface DetailedInstagramPost {
  id: string;
  url: string;
  thumbnailUrl: string;
  caption: string;
  likes: number;
  comments: number;
  views?: number;
  saves?: number;
  shares?: number;
  hashtags: string[];
  mentions: string[];
  timestamp: string;
  postType: 'image' | 'video' | 'carousel' | 'reel';
  engagementRate: string;
}

export async function getInstagramDetailedPosts(username: string, limit: number = 30): Promise<DetailedInstagramPost[]> {
  try {
    const cleanUsername = username.replace('@', '').trim();
    
    console.log('[Apify Instagram] Fetching detailed posts for:', cleanUsername, '(1 combined call)');
    
    const combinedInput = {
      directUrls: [`https://www.instagram.com/${cleanUsername}/`],
      resultsType: "posts",
      resultsLimit: limit,
      scrapePostsUntilDate: "3 months",
      addParentData: true,
    };

    console.log(`[Apify] Calling instagram-api-scraper (detailed posts+profile in 1 call) - Cost: ${estimateApifyApiScraperCost(limit)}`);
    const run = await client.actor("apify/instagram-api-scraper").call(combinedInput);
    const { items: postItems } = await client.dataset(run.defaultDatasetId).listItems();
    
    if (!postItems || postItems.length === 0) {
      console.log('[Apify Instagram] No posts found for:', cleanUsername);
      return [];
    }

    const firstItem = postItems[0] as any;
    const followers = firstItem.ownerFollowersCount ?? firstItem.followersCount ?? 0;

    console.log('[Apify Instagram] Posts fetched:', postItems.length);

    const posts: DetailedInstagramPost[] = postItems.map((post: any) => {
      const likes = post.likesCount || post.likeCount || post.likes || 0;
      const comments = post.commentsCount || post.commentCount || post.comments || 0;
      const views = post.videoViewCount || post.viewCount || undefined;
      const shortCode = post.shortCode || post.id || '';
      
      // Determine post type
      let postType: 'image' | 'video' | 'carousel' | 'reel' = 'image';
      if (post.isVideo || post.type === 'Video') {
        postType = post.productType === 'clips' ? 'reel' : 'video';
      } else if (post.sidecarMediaCount > 1 || post.type === 'Sidecar') {
        postType = 'carousel';
      }
      
      // Calculate engagement rate for this post
      let engagementRate = '0%';
      if (followers > 0) {
        const rate = ((likes + comments) / followers) * 100;
        engagementRate = rate.toFixed(2) + '%';
      }
      
      const hashtags = post.hashtags || extractHashtagsFromText(post.caption || '');
      const mentions = post.mentions || extractMentionsFromText(post.caption || '');
      
      return {
        id: String(shortCode),
        url: `https://www.instagram.com/p/${shortCode}/`,
        thumbnailUrl: post.displayUrl || post.imageUrl || post.thumbnailUrl || '',
        caption: (post.caption || post.text || '').substring(0, 500),
        likes,
        comments,
        views,
        hashtags,
        mentions,
        timestamp: post.timestamp || post.takenAtTimestamp || new Date().toISOString(),
        postType,
        engagementRate,
      };
    });

    return posts;
  } catch (error) {
    console.error('[Apify Instagram] Error getting detailed posts:', error);
    return [];
  }
}

// ============================================
// Utility Functions
// ============================================

function extractHashtagsFromText(text: string): string[] {
  const regex = /#(\w+)/g;
  const hashtags: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    hashtags.push(match[1].toLowerCase());
  }
  return Array.from(new Set(hashtags)); // Remove duplicates
}

function extractMentionsFromText(text: string): string[] {
  const regex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    mentions.push(match[1].toLowerCase());
  }
  return Array.from(new Set(mentions)); // Remove duplicates
}

// Calculate hashtag analytics from posts
export function analyzeHashtags(posts: (DetailedInstagramPost | TikTokPost)[]): { hashtag: string; count: number; avgEngagement: string }[] {
  const hashtagStats: { [key: string]: { count: number; totalEngagement: number } } = {};
  
  posts.forEach(post => {
    const engagement = post.likes + post.comments + (post.shares || 0);
    
    post.hashtags.forEach(tag => {
      const cleanTag = tag.replace('#', '').toLowerCase();
      if (!hashtagStats[cleanTag]) {
        hashtagStats[cleanTag] = { count: 0, totalEngagement: 0 };
      }
      hashtagStats[cleanTag].count++;
      hashtagStats[cleanTag].totalEngagement += engagement;
    });
  });
  
  return Object.entries(hashtagStats)
    .map(([hashtag, stats]) => ({
      hashtag,
      count: stats.count,
      avgEngagement: (stats.totalEngagement / stats.count).toFixed(0),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

// ============================================
// Social Listening - Hashtag & Mention Search
// ============================================

export interface SocialListeningPost {
  platform: 'instagram' | 'tiktok';
  postUrl: string;
  thumbnailUrl: string;
  caption: string;
  authorUsername: string;
  authorFollowers?: number;
  likes: number;
  comments: number;
  shares?: number;
  views?: number;
  postType: 'reels' | 'story' | 'feed' | 'video';
  hashtags: string[];
  mentions: string[];
  timestamp: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

// Analyze sentiment based on caption content (simple rule-based)
function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = ['love', 'amazing', 'awesome', 'great', 'best', 'perfect', 'incredible', 'fantastic', 'beautiful', 'excellent', 'amo', 'incrível', 'perfeito', 'maravilhoso', 'lindo', 'ótimo', 'sensacional', 'excelente', 'top', 'melhor', 'recomendo', 'adorei', '💕', '❤️', '😍', '🔥', '✨', '💯'];
  const negativeWords = ['hate', 'terrible', 'awful', 'worst', 'horrible', 'bad', 'poor', 'disappointed', 'odeio', 'terrível', 'horrível', 'péssimo', 'ruim', 'decepção', 'decepciona', 'não recomendo', '😡', '👎', '😤', '💔'];
  
  const lowerText = text.toLowerCase();
  let positiveScore = 0;
  let negativeScore = 0;
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveScore++;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeScore++;
  });
  
  if (positiveScore > negativeScore) return 'positive';
  if (negativeScore > positiveScore) return 'negative';
  return 'neutral';
}

// Search Instagram posts by hashtag
export async function searchInstagramByHashtag(hashtag: string, limit: number = 50): Promise<SocialListeningPost[]> {
  try {
    const cleanHashtag = hashtag.replace('#', '').trim();
    
    console.log('[Apify Social Listening] Searching Instagram for hashtag:', cleanHashtag);
    
    const runInput = {
      hashtags: [cleanHashtag],
      resultsLimit: limit,
    };

    console.log(`[Apify] 💰 Calling instagram-hashtag-scraper - Cost: ${estimateApifyPostCost(limit)}`);
    const run = await client.actor("apify/instagram-hashtag-scraper").call(runInput);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    if (!items || items.length === 0) {
      console.log('[Apify Social Listening] No posts found for hashtag:', cleanHashtag);
      return [];
    }

    console.log('[Apify Social Listening] Posts found:', items.length);

    const posts: SocialListeningPost[] = items.map((post: any) => {
      const likes = post.likesCount || post.likeCount || post.likes || 0;
      const comments = post.commentsCount || post.commentCount || post.comments || 0;
      const shortCode = post.shortCode || post.id || '';
      const caption = post.caption || post.text || '';
      
      // Determine post type
      let postType: 'reels' | 'story' | 'feed' | 'video' = 'feed';
      if (post.isVideo || post.type === 'Video') {
        postType = post.productType === 'clips' ? 'reels' : 'video';
      }
      
      return {
        platform: 'instagram' as const,
        postUrl: `https://www.instagram.com/p/${shortCode}/`,
        thumbnailUrl: post.displayUrl || post.imageUrl || post.thumbnailUrl || '',
        caption: caption.substring(0, 500),
        authorUsername: post.ownerUsername || post.username || '',
        authorFollowers: post.ownerFollowersCount,
        likes,
        comments,
        views: post.videoViewCount,
        postType,
        hashtags: post.hashtags || extractHashtagsFromText(caption),
        mentions: post.mentions || extractMentionsFromText(caption),
        timestamp: post.timestamp || post.takenAtTimestamp || new Date().toISOString(),
        sentiment: analyzeSentiment(caption),
      };
    });

    return posts;
  } catch (error) {
    console.error('[Apify Social Listening] Error searching Instagram hashtag:', error);
    return [];
  }
}

// Search TikTok posts by hashtag
export async function searchTikTokByHashtag(hashtag: string, limit: number = 50): Promise<SocialListeningPost[]> {
  try {
    const cleanHashtag = hashtag.replace('#', '').trim();
    
    console.log('[Apify Social Listening] Searching TikTok for hashtag:', cleanHashtag);
    
    const runInput = {
      hashtags: [cleanHashtag],
      resultsPerPage: limit,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
    };

    const run = await client.actor("clockworks/free-tiktok-scraper").call(runInput);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    if (!items || items.length === 0) {
      console.log('[Apify Social Listening] No TikTok posts found for hashtag:', cleanHashtag);
      return [];
    }

    console.log('[Apify Social Listening] TikTok posts found:', items.length);

    const posts: SocialListeningPost[] = items.map((item: any) => {
      const caption = item.text || item.desc || '';
      const authorMeta = item.authorMeta || item.author || {};
      
      return {
        platform: 'tiktok' as const,
        postUrl: item.webVideoUrl || `https://www.tiktok.com/@${authorMeta.name || authorMeta.uniqueId}/video/${item.id}`,
        thumbnailUrl: item.covers?.default || item.videoMeta?.coverUrl || '',
        caption: caption.substring(0, 500),
        authorUsername: authorMeta.name || authorMeta.uniqueId || '',
        authorFollowers: authorMeta.fans || authorMeta.followerCount,
        likes: item.diggCount || item.stats?.diggCount || 0,
        comments: item.commentCount || item.stats?.commentCount || 0,
        shares: item.shareCount || item.stats?.shareCount || 0,
        views: item.playCount || item.stats?.playCount || 0,
        postType: 'video' as const,
        hashtags: extractHashtagsFromText(caption),
        mentions: extractMentionsFromText(caption),
        timestamp: item.createTime ? new Date(item.createTime * 1000).toISOString() : new Date().toISOString(),
        sentiment: analyzeSentiment(caption),
      };
    });

    return posts;
  } catch (error) {
    console.error('[Apify Social Listening] Error searching TikTok hashtag:', error);
    return [];
  }
}

// Combined search across platforms
export async function searchSocialMentions(
  keywords: string[], 
  platforms: ('instagram' | 'tiktok')[] = ['instagram', 'tiktok'],
  limit: number = 30
): Promise<SocialListeningPost[]> {
  const allPosts: SocialListeningPost[] = [];
  
  for (const keyword of keywords) {
    const cleanKeyword = keyword.replace(/[@#]/g, '').trim();
    
    if (platforms.includes('instagram')) {
      try {
        const instaPosts = await searchInstagramByHashtag(cleanKeyword, Math.floor(limit / keywords.length));
        allPosts.push(...instaPosts);
      } catch (error) {
        console.error('[Social Listening] Instagram search failed for:', cleanKeyword);
      }
    }
    
    if (platforms.includes('tiktok')) {
      try {
        const tiktokPosts = await searchTikTokByHashtag(cleanKeyword, Math.floor(limit / keywords.length));
        allPosts.push(...tiktokPosts);
      } catch (error) {
        console.error('[Social Listening] TikTok search failed for:', cleanKeyword);
      }
    }
  }
  
  // Sort by timestamp descending (newest first)
  return allPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
