import { db } from '../db';
import { users, companies, instagramProfiles } from '@shared/schema';
import { eq, and, isNull, isNotNull, or, sql } from 'drizzle-orm';
import apifyService, { 
  ProfileScraperResult, 
  DetailedProfileResult,
  TikTokProfileResult,
  YouTubeChannelResult 
} from './apify';
import { tryBusinessDiscoveryForProfile } from './business-discovery';
import { getOrFetchProfilePic, downloadAndSaveToStorage, getPublicUrl } from './instagram-profile-pic';

export interface EnrichmentResult {
  success: boolean;
  enrichedFields: string[];
  errors: string[];
  costEstimate: number;
  source: string;
}

export interface CreatorEnrichmentData {
  instagram?: {
    followers: number;
    following: number;
    posts: number;
    engagementRate: string;
    verified: boolean;
    bio: string;
    profilePic: string;
    topPosts: any[];
    topHashtags: string[];
  };
  tiktok?: {
    followers: number;
    following: number;
    hearts: number;
    videos: number;
    engagementRate: string;
    verified: boolean;
    bio: string;
    profilePic: string;
    topVideos: any[];
  };
  youtube?: {
    subscribers: number;
    totalViews: number;
    videosCount: number;
    verified: boolean;
    channelId: string;
    description: string;
    thumbnail: string;
    topVideos: any[];
  };
}

export interface CompanyEnrichmentData {
  instagram?: {
    followers: number;
    following: number;
    posts: number;
    engagementRate: string;
    verified: boolean;
    bio: string;
    profilePic: string;
  };
  tiktok?: {
    followers: number;
    hearts: number;
    videos: number;
    verified: boolean;
    bio: string;
  };
  cnpj?: {
    razaoSocial: string;
    nomeFantasia: string;
    situacao: string;
    atividadePrincipal: string;
    dataAbertura: string;
    capitalSocial: string;
    naturezaJuridica: string;
    qsa: { nome: string; qual: string }[];
  };
  website?: {
    title: string;
    description: string;
    keywords: string[];
    content: string;
    about: string;
    pages: { url: string; title: string; summary: string }[];
    socialLinks: Record<string, string>;
    faq: { question: string; answer: string }[];
  };
  ecommerce?: {
    products: {
      name: string;
      price?: string;
      currency?: string;
      imageUrl?: string;
      url?: string;
      category?: string;
      description?: string;
    }[];
    productCount: number;
    categories: string[];
    platform: string;
  };
}

function calculateEngagementRate(
  followers: number,
  avgLikes: number,
  avgComments: number
): string {
  if (followers === 0) return '0%';
  const engagement = ((avgLikes + avgComments) / followers) * 100;
  return `${engagement.toFixed(2)}%`;
}

function calculateEnrichmentScore(data: CreatorEnrichmentData | CompanyEnrichmentData): number {
  let score = 0;
  let maxScore = 0;

  if ('instagram' in data && data.instagram) {
    maxScore += 40;
    score += 20;
    if (data.instagram.followers > 0) score += 10;
    if (data.instagram.bio) score += 5;
    if ('topPosts' in data.instagram && data.instagram.topPosts?.length) score += 5;
  }

  if ('tiktok' in data && data.tiktok) {
    maxScore += 30;
    score += 15;
    if (data.tiktok.followers > 0) score += 10;
    if (data.tiktok.bio) score += 5;
  }

  if ('youtube' in data && data.youtube) {
    maxScore += 30;
    score += 15;
    if (data.youtube.subscribers > 0) score += 10;
    if (data.youtube.topVideos?.length) score += 5;
  }

  if ('cnpj' in data && data.cnpj) {
    maxScore += 20;
    score += 10;
    if (data.cnpj.situacao === 'ATIVA') score += 10;
  }

  if ('website' in data && data.website) {
    maxScore += 20;
    score += 5;
    if (data.website.description) score += 5;
    if (data.website.content) score += 5;
    if (data.website.pages?.length > 1) score += 5;
  }

  if ('ecommerce' in data && data.ecommerce) {
    maxScore += 20;
    score += 10;
    if (data.ecommerce.productCount > 0) score += 5;
    if (data.ecommerce.categories?.length > 0) score += 5;
  }

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

/**
 * Light profile refresh - only updates basic info (followers, bio, profilePic)
 * Does NOT fetch posts, reels, or other expensive data
 * Cost: ~$0.002 per profile (very cheap)
 * Returns true if refresh was performed, false if skipped (data still fresh)
 */
export async function refreshCreatorProfileLight(
  creatorId: number,
  options: { forceRefresh?: boolean } = {}
): Promise<{ refreshed: boolean; error?: string }> {
  const { forceRefresh = false } = options;
  
  const [creator] = await db.select().from(users).where(eq(users.id, creatorId)).limit(1);
  if (!creator) {
    return { refreshed: false, error: 'Creator not found' };
  }
  
  // Only refresh if data is older than 7 days (or force)
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const lastUpdated = creator.instagramLastUpdated ? new Date(creator.instagramLastUpdated).getTime() : 0;
  
  if (!forceRefresh && lastUpdated > sevenDaysAgo) {
    return { refreshed: false }; // Data is still fresh
  }
  
  // Check if creator has Instagram username
  if (!creator.instagram) {
    return { refreshed: false, error: 'No Instagram username' };
  }
  
  const username = creator.instagram.replace('@', '').replace('https://instagram.com/', '').replace('https://www.instagram.com/', '').split('/')[0];
  if (!username) {
    return { refreshed: false, error: 'Invalid Instagram username' };
  }
  
  try {
    // Layer 2: Try Business Discovery API first ($0 cost)
    const bizData = await tryBusinessDiscoveryForProfile(username);
    if (bizData?.exists) {
      console.log(`[refreshCreatorProfileLight] Using Business Discovery for @${username} - $0 cost`);
      let profilePicUrl: string | null = null;
      if (bizData.profilePicUrl) {
        const storagePath = await downloadAndSaveToStorage(username, bizData.profilePicUrl);
        profilePicUrl = storagePath ? getPublicUrl(storagePath) : null;
      }
      await db.update(users)
        .set({
          instagramFollowers: bizData.followers || null,
          instagramFollowing: bizData.following || null,
          instagramPosts: bizData.postsCount || null,
          instagramVerified: bizData.isVerified || false,
          instagramBio: bizData.bio || null,
          instagramProfilePic: profilePicUrl,
          instagramLastUpdated: new Date(),
        })
        .where(eq(users.id, creatorId));
      return { refreshed: true };
    }

    // Layer 3: Apify (PAID - last resort, only on explicit user action)
    console.log(`[refreshCreatorProfileLight] Business Discovery failed, falling back to Apify for @${username}`);
    const profile = await apifyService.queueProfileScrape(username, { triggeredBy: 'on_demand' });
    
    if (!profile) {
      return { refreshed: false, error: 'Profile not found' };
    }
    
    let profilePicUrl: string | null = null;
    if (profile.profilePicUrl) {
      const storagePath = await downloadAndSaveToStorage(username, profile.profilePicUrl);
      profilePicUrl = storagePath ? getPublicUrl(storagePath) : null;
    }
    
    await db.update(users)
      .set({
        instagramFollowers: profile.followersCount,
        instagramFollowing: profile.followsCount,
        instagramPosts: profile.postsCount,
        instagramVerified: profile.verified,
        instagramBio: profile.biography,
        instagramProfilePic: profilePicUrl,
        instagramLastUpdated: new Date(),
      })
      .where(eq(users.id, creatorId));
    
    return { refreshed: true };
  } catch (error) {
    console.error(`[refreshCreatorProfileLight] Error for creator ${creatorId}:`, error);
    return { refreshed: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function enrichCreatorProfile(
  creatorId: number,
  options: {
    includeInstagram?: boolean;
    includeTikTok?: boolean;
    includeYouTube?: boolean;
    forceRefresh?: boolean;
  } = {}
): Promise<EnrichmentResult> {
  const {
    includeInstagram = true,
    includeTikTok = true,
    includeYouTube = false,
    forceRefresh = false,
  } = options;

  const enrichedFields: string[] = [];
  const errors: string[] = [];
  let totalCost = 0;

  const [creator] = await db.select().from(users).where(eq(users.id, creatorId)).limit(1);
  if (!creator) {
    return { success: false, enrichedFields: [], errors: ['Creator not found'], costEstimate: 0, source: 'apify' };
  }

  const enrichmentData: CreatorEnrichmentData = {};
  const updateData: any = {};

  if (includeInstagram && creator.instagram) {
    const username = creator.instagram.replace('@', '').replace('https://instagram.com/', '').replace('https://www.instagram.com/', '').split('/')[0];
    
    const shouldFetch = forceRefresh || 
      !creator.instagramLastUpdated || 
      (Date.now() - new Date(creator.instagramLastUpdated).getTime()) > 7 * 24 * 60 * 60 * 1000;

    if (shouldFetch && username) {
      try {
        // Layer 2: Try Business Discovery API first ($0 cost)
        const bizData = await tryBusinessDiscoveryForProfile(username);
        let profile: any = null;
        let apifyPosts: any[] = [];

        if (bizData?.exists) {
          console.log(`[enrichCreatorProfile] Using Business Discovery for @${username} - $0 cost`);
          profile = {
            followersCount: bizData.followers,
            followsCount: bizData.following,
            postsCount: bizData.postsCount,
            isVerified: bizData.isVerified || false,
            verified: bizData.isVerified || false,
            biography: bizData.bio,
            profilePicUrl: bizData.profilePicUrl,
          };
        } else {
          // Layer 3: Apify (PAID - last resort, 1 combined call for profile+posts)
          console.log(`[enrichCreatorProfile] Business Discovery failed, using Apify for @${username} (1 combined call)`);
          apifyPosts = await apifyService.scrapePosts(
            [`https://www.instagram.com/${username}/`],
            12,
            { addParentData: true, skipCacheCheck: true },
            { triggeredBy: 'on_demand' }
          );
          if (apifyPosts.length > 0) {
            const firstPost = apifyPosts[0] as any;
            profile = {
              followersCount: firstPost.ownerFollowersCount,
              followsCount: firstPost.ownerFollowsCount,
              postsCount: firstPost.ownerPostsCount,
              isVerified: firstPost.ownerIsVerified || false,
              verified: firstPost.ownerIsVerified || false,
              biography: firstPost.ownerBiography || '',
              profilePicUrl: firstPost.ownerProfilePicUrl || firstPost.profilePicUrl || '',
              username: firstPost.ownerUsername || username,
              fullName: firstPost.ownerFullName || '',
            };
          } else {
            profile = await apifyService.queueProfileScrape(username, { triggeredBy: 'on_demand' });
          }
        }

        if (profile) {
          let posts: any[] = [];
          if (bizData?.recentMedia?.length) {
            posts = bizData.recentMedia.map((m: any) => ({
              likesCount: m.likes || m.like_count || 0,
              commentsCount: m.comments || m.comments_count || 0,
              hashtags: ((m.caption || '').match(/#(\w+)/g) || []).map((t: string) => t.replace('#', '')),
              id: m.id,
              shortCode: '',
              displayUrl: m.imageUrl || m.media_url || '',
              caption: m.caption || '',
              timestamp: m.timestamp,
            }));
          } else if (apifyPosts && apifyPosts.length > 0) {
            posts = apifyPosts.map((p: any) => ({
              likesCount: p.likesCount || p.likeCount || p.likes || 0,
              commentsCount: p.commentsCount || p.commentCount || p.comments || 0,
              hashtags: p.hashtags || ((p.caption || '').match(/#(\w+)/g) || []).map((t: string) => t.replace('#', '')),
              id: p.id || p.shortCode || '',
              shortCode: p.shortCode || '',
              displayUrl: p.displayUrl || p.imageUrl || '',
              caption: p.caption || p.text || '',
              timestamp: p.timestamp || p.takenAtTimestamp || '',
            }));
          }

          const avgLikes = posts.length > 0 ? posts.reduce((sum: number, p: any) => sum + (p.likesCount || 0), 0) / posts.length : 0;
          const avgComments = posts.length > 0 ? posts.reduce((sum: number, p: any) => sum + (p.commentsCount || 0), 0) / posts.length : 0;
          const engagementRate = calculateEngagementRate(profile.followersCount || 0, avgLikes, avgComments);

          const allHashtags = posts.flatMap(p => p.hashtags || []);
          const topHashtags = Array.from(new Set(allHashtags)).slice(0, 10);
          const topPosts = posts.slice(0, 5).map(p => ({
            id: p.id,
            url: `https://www.instagram.com/p/${p.shortCode}/`,
            imageUrl: p.displayUrl || '',
            caption: (p.caption || '').slice(0, 200),
            likes: p.likesCount || 0,
            comments: p.commentsCount || 0,
            timestamp: p.timestamp || '',
          }));

          let savedProfilePic = profile.profilePicUrl || '';
          if (profile.profilePicUrl) {
            const storagePath = await downloadAndSaveToStorage(username, profile.profilePicUrl);
            if (storagePath) savedProfilePic = getPublicUrl(storagePath);
          }
          enrichmentData.instagram = {
            followers: profile.followersCount || 0,
            following: profile.followsCount || 0,
            posts: profile.postsCount || 0,
            engagementRate,
            verified: profile.isVerified || false,
            bio: profile.biography || '',
            profilePic: savedProfilePic,
            topPosts,
            topHashtags,
          };

          updateData.instagramFollowers = profile.followersCount;
          updateData.instagramFollowing = profile.followsCount;
          updateData.instagramPosts = profile.postsCount;
          updateData.instagramEngagementRate = engagementRate;
          updateData.instagramVerified = profile.isVerified;
          updateData.instagramBio = profile.biography;
          updateData.instagramProfilePic = savedProfilePic;
          updateData.instagramTopPosts = topPosts;
          updateData.instagramTopHashtags = topHashtags;
          updateData.instagramLastUpdated = new Date();

          enrichedFields.push('instagram');
          totalCost += 0.003 + (posts.length * 0.0027);
        }
      } catch (error: any) {
        errors.push(`Instagram: ${error.message}`);
      }
    }
  }

  if (includeTikTok && creator.tiktok) {
    const username = creator.tiktok.replace('@', '').replace('https://tiktok.com/', '').replace('https://www.tiktok.com/', '').split('/')[0];
    
    const shouldFetch = forceRefresh || 
      !creator.tiktokLastUpdated || 
      (Date.now() - new Date(creator.tiktokLastUpdated).getTime()) > 7 * 24 * 60 * 60 * 1000;

    if (shouldFetch && username) {
      try {
        const videoResults = await apifyService.scrapeTikTokProfiles(
          [username],
          { resultsPerProfile: 5 },
          { triggeredBy: 'on_demand' }
        );

        if (videoResults.length > 0) {
          const author = videoResults[0].author;
          const tiktokFollowers = author?.followers || 0;
          const tiktokFollowing = author?.following || 0;
          const tiktokHearts = author?.hearts || 0;
          const tiktokVideoCount = author?.videoCount || 0;
          const tiktokVerified = author?.verified || false;
          const tiktokBio = author?.signature || '';
          const tiktokProfilePic = author?.avatarLarger || '';

          const avgLikes = videoResults.length > 0 ?
            videoResults.reduce((sum: number, v: any) => sum + (v.stats?.diggCount || 0), 0) / videoResults.length : 0;
          const engagementRate = calculateEngagementRate(tiktokFollowers, avgLikes, 0);

          const topVideos = videoResults.slice(0, 5).map((v: any) => ({
            id: v.id,
            url: v.author?.uniqueId ? `https://www.tiktok.com/@${v.author.uniqueId}/video/${v.id}` : '',
            thumbnailUrl: v.video?.cover || '',
            description: (v.desc || '').slice(0, 200),
            plays: v.stats?.playCount || 0,
            likes: v.stats?.diggCount || 0,
            comments: v.stats?.commentCount || 0,
            shares: v.stats?.shareCount || 0,
            timestamp: v.createTime ? new Date(v.createTime * 1000).toISOString() : '',
          }));

          enrichmentData.tiktok = {
            followers: tiktokFollowers,
            following: tiktokFollowing,
            hearts: tiktokHearts,
            videos: tiktokVideoCount,
            engagementRate,
            verified: tiktokVerified,
            bio: tiktokBio,
            profilePic: tiktokProfilePic,
            topVideos,
          };

          updateData.tiktokFollowers = tiktokFollowers;
          updateData.tiktokFollowing = tiktokFollowing;
          updateData.tiktokHearts = tiktokHearts;
          updateData.tiktokVideos = tiktokVideoCount;
          updateData.tiktokEngagementRate = engagementRate;
          updateData.tiktokVerified = tiktokVerified;
          updateData.tiktokBio = tiktokBio;
          updateData.tiktokProfilePic = tiktokProfilePic;
          updateData.tiktokTopVideos = topVideos;
          updateData.tiktokLastUpdated = new Date();

          enrichedFields.push('tiktok');
          totalCost += 0.03 + (videoResults.length * 0.003);
        }
      } catch (error: any) {
        errors.push(`TikTok: ${error.message}`);
      }
    }
  }

  if (includeYouTube && creator.youtube) {
    const channelUrl = creator.youtube.startsWith('http') ? creator.youtube : `https://youtube.com/${creator.youtube}`;
    
    const shouldFetch = forceRefresh || 
      !creator.youtubeLastUpdated || 
      (Date.now() - new Date(creator.youtubeLastUpdated).getTime()) > 7 * 24 * 60 * 60 * 1000;

    if (shouldFetch) {
      try {
        const channels = await apifyService.scrapeYouTubeChannelInfo(
          [channelUrl],
          { includeRecentVideos: true, maxRecentVideos: 5 },
          { triggeredBy: 'on_demand' }
        );

        if (channels.length > 0) {
          const channel = channels[0];

          const topVideos = (channel.recentVideos || []).slice(0, 5).map((v: any) => ({
            id: v.videoId,
            url: `https://youtube.com/watch?v=${v.videoId}`,
            thumbnailUrl: '',
            title: v.title || '',
            views: v.views || 0,
            likes: 0,
            duration: '',
            publishedAt: v.publishedAt || '',
          }));

          enrichmentData.youtube = {
            subscribers: channel.subscribersCount || 0,
            totalViews: channel.viewsCount || 0,
            videosCount: channel.videosCount || 0,
            verified: false,
            channelId: channel.channelId,
            description: channel.description || '',
            thumbnail: channel.avatarUrl || '',
            topVideos,
          };

          updateData.youtubeSubscribers = channel.subscribersCount;
          updateData.youtubeTotalViews = channel.viewsCount;
          updateData.youtubeVideosCount = channel.videosCount;
          updateData.youtubeChannelId = channel.channelId;
          updateData.youtubeDescription = channel.description;
          updateData.youtubeThumbnail = channel.avatarUrl;
          updateData.youtubeTopVideos = topVideos;
          updateData.youtubeLastUpdated = new Date();

          enrichedFields.push('youtube');
          totalCost += 0.0025;
        }
      } catch (error: any) {
        errors.push(`YouTube: ${error.message}`);
      }
    }
  }

  if (enrichedFields.length > 0) {
    updateData.enrichmentScore = calculateEnrichmentScore(enrichmentData);
    updateData.lastEnrichedAt = new Date();
    updateData.enrichmentSource = 'apify';

    await db.update(users).set(updateData).where(eq(users.id, creatorId));
  }

  return {
    success: errors.length === 0,
    enrichedFields,
    errors,
    costEstimate: Math.round(totalCost * 1000) / 1000,
    source: 'apify',
  };
}

export async function enrichCompanyProfile(
  companyId: number,
  options: {
    includeInstagram?: boolean;
    includeTikTok?: boolean;
    includeCnpj?: boolean;
    includeWebsite?: boolean;
    forceRefresh?: boolean;
  } = {}
): Promise<EnrichmentResult> {
  const {
    includeInstagram = true,
    includeTikTok = true,
    includeCnpj = true,
    includeWebsite = true,
    forceRefresh = false,
  } = options;

  const enrichedFields: string[] = [];
  const errors: string[] = [];
  let totalCost = 0;

  const [company] = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
  if (!company) {
    return { success: false, enrichedFields: [], errors: ['Company not found'], costEstimate: 0, source: 'apify' };
  }

  const enrichmentData: CompanyEnrichmentData = {};
  const updateData: any = {};

  if (includeInstagram && company.instagram) {
    const username = company.instagram.replace('@', '').replace('https://instagram.com/', '').replace('https://www.instagram.com/', '').split('/')[0];
    
    const shouldFetch = forceRefresh || 
      !company.instagramLastUpdated || 
      (Date.now() - new Date(company.instagramLastUpdated).getTime()) > 30 * 24 * 60 * 60 * 1000;

    if (shouldFetch && username) {
      try {
        // Layer 2: Try Business Discovery API first ($0 cost)
        const bizData = await tryBusinessDiscoveryForProfile(username);
        let profileData: any = null;

        if (bizData?.exists) {
          console.log(`[enrichCompanyProfile] Using Business Discovery for @${username} - $0 cost`);
          profileData = {
            followersCount: bizData.followers,
            followsCount: bizData.following,
            postsCount: bizData.postsCount,
            isVerified: bizData.isVerified || false,
            biography: bizData.bio,
            profilePicUrl: bizData.profilePicUrl,
          };
        } else {
          // Layer 3: Apify (PAID - last resort)
          console.log(`[enrichCompanyProfile] Business Discovery failed, using Apify for @${username}`);
          const profileResult = await apifyService.queueProfileScrape(username, { triggeredBy: 'on_demand' });
          if (profileResult) {
            profileData = profileResult;
            totalCost += 0.0026;
          }
        }

        if (profileData) {
          enrichmentData.instagram = {
            followers: profileData.followersCount || 0,
            following: profileData.followsCount || 0,
            posts: profileData.postsCount || 0,
            engagementRate: '0%',
            verified: profileData.isVerified || false,
            bio: profileData.biography || '',
            profilePic: profileData.profilePicUrl || '',
          };

          updateData.instagramFollowers = profileData.followersCount;
          updateData.instagramFollowing = profileData.followsCount;
          updateData.instagramPosts = profileData.postsCount;
          updateData.instagramVerified = profileData.isVerified;
          updateData.instagramBio = profileData.biography;
          if (profileData.profilePicUrl) {
            const storagePath = await downloadAndSaveToStorage(username, profileData.profilePicUrl);
            if (storagePath) updateData.instagramProfilePic = getPublicUrl(storagePath);
          }
          updateData.instagramLastUpdated = new Date();

          enrichedFields.push('instagram');
        }
      } catch (error: any) {
        errors.push(`Instagram: ${error.message}`);
      }
    }
  }

  if (includeTikTok && company.tiktok) {
    const username = company.tiktok.replace('@', '').replace('https://tiktok.com/', '').replace('https://www.tiktok.com/', '').split('/')[0];
    
    const shouldFetch = forceRefresh || 
      !company.tiktokLastUpdated || 
      (Date.now() - new Date(company.tiktokLastUpdated).getTime()) > 30 * 24 * 60 * 60 * 1000;

    if (shouldFetch && username) {
      try {
        const videoResults = await apifyService.scrapeTikTokProfiles(
          [username],
          { resultsPerProfile: 3 },
          { triggeredBy: 'on_demand' }
        );

        if (videoResults.length > 0) {
          const author = videoResults[0].author;

          enrichmentData.tiktok = {
            followers: author?.followers || 0,
            hearts: author?.hearts || 0,
            videos: author?.videoCount || 0,
            verified: author?.verified || false,
            bio: author?.signature || '',
          };

          updateData.tiktokFollowers = author?.followers || 0;
          updateData.tiktokHearts = author?.hearts || 0;
          updateData.tiktokVideos = author?.videoCount || 0;
          updateData.tiktokVerified = author?.verified || false;
          updateData.tiktokBio = author?.signature || '';
          updateData.tiktokLastUpdated = new Date();

          enrichedFields.push('tiktok');
          totalCost += 0.03;
        }
      } catch (error: any) {
        errors.push(`TikTok: ${error.message}`);
      }
    }
  }

  if (includeCnpj && company.cnpj) {
    const cleanCnpj = company.cnpj.replace(/\D/g, '');
    
    const shouldFetch = forceRefresh || 
      !company.cnpjLastUpdated || 
      (Date.now() - new Date(company.cnpjLastUpdated).getTime()) > 30 * 24 * 60 * 60 * 1000;

    if (shouldFetch && cleanCnpj.length === 14) {
      try {
        const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCnpj}`);
        const data = await response.json();

        if (data.status === 'OK') {
          enrichmentData.cnpj = {
            razaoSocial: data.nome || '',
            nomeFantasia: data.fantasia || '',
            situacao: data.situacao || '',
            atividadePrincipal: data.atividade_principal?.[0]?.text || '',
            dataAbertura: data.abertura || '',
            capitalSocial: data.capital_social || '',
            naturezaJuridica: data.natureza_juridica || '',
            qsa: (data.qsa || []).map((q: any) => ({ nome: q.nome, qual: q.qual })),
          };

          updateData.cnpjRazaoSocial = data.nome;
          updateData.cnpjNomeFantasia = data.fantasia;
          updateData.cnpjSituacao = data.situacao;
          updateData.cnpjAtividadePrincipal = data.atividade_principal?.[0]?.text;
          updateData.cnpjDataAbertura = data.abertura;
          updateData.cnpjCapitalSocial = data.capital_social;
          updateData.cnpjNaturezaJuridica = data.natureza_juridica;
          updateData.cnpjQsa = enrichmentData.cnpj.qsa;
          updateData.cnpjLastUpdated = new Date();

          enrichedFields.push('cnpj');
        }
      } catch (error: any) {
        errors.push(`CNPJ: ${error.message}`);
      }
    }
  }

  if (includeWebsite && company.website) {
    const shouldFetch = forceRefresh || 
      !company.websiteLastUpdated || 
      (Date.now() - new Date(company.websiteLastUpdated).getTime()) > 30 * 24 * 60 * 60 * 1000;

    if (shouldFetch) {
      try {
        const results = await apifyService.crawlWebsiteContent(
          [company.website],
          10,
          { triggeredBy: 'on_demand' }
        );

        if (results.length > 0) {
          const mainPage = results[0];
          const allText = results.map((p: any) => (p.text || '').slice(0, 2000)).join('\n\n');
          const contentSummary = allText.slice(0, 8000);

          const aboutPage = results.find((p: any) => {
            const url = (p.url || '').toLowerCase();
            return url.includes('/sobre') || url.includes('/about') || url.includes('/quem-somos') || url.includes('/a-empresa');
          });

          const pages = results.map((p: any) => ({
            url: p.url || '',
            title: p.title || '',
            summary: (p.text || '').slice(0, 300),
          }));

          const socialLinks: Record<string, string> = {};
          const allLinks = results.flatMap((p: any) => {
            if (!p.text && !p.html) return [];
            const links: string[] = [];
            const urlRegex = /https?:\/\/(?:www\.)?(instagram|facebook|tiktok|youtube|twitter|linkedin|x)\.com\/[^\s"'<>)]+/gi;
            const fullText = (p.html || p.text || '');
            let match;
            while ((match = urlRegex.exec(fullText)) !== null) {
              links.push(match[0]);
            }
            return links;
          });
          for (const link of allLinks) {
            if (link.includes('instagram.com')) socialLinks.instagram = link;
            else if (link.includes('facebook.com')) socialLinks.facebook = link;
            else if (link.includes('tiktok.com')) socialLinks.tiktok = link;
            else if (link.includes('youtube.com')) socialLinks.youtube = link;
            else if (link.includes('twitter.com') || link.includes('x.com')) socialLinks.twitter = link;
            else if (link.includes('linkedin.com')) socialLinks.linkedin = link;
          }

          const allKeywords: string[] = [];
          for (const page of results) {
            if (page.metadata?.keywords) {
              const kw = typeof page.metadata.keywords === 'string'
                ? page.metadata.keywords.split(',').map((k: string) => k.trim())
                : page.metadata.keywords;
              allKeywords.push(...kw);
            }
          }
          const uniqueKeywords = Array.from(new Set(allKeywords.filter(Boolean))).slice(0, 30);

          const faq: { question: string; answer: string }[] = [];
          for (const page of results) {
            const text = page.text || '';
            const faqMatches = text.match(/(?:^|\n)([^\n]*\?)\s*\n([^\n?]+(?:\n[^\n?]+)*)/g);
            if (faqMatches) {
              for (const match of faqMatches.slice(0, 10)) {
                const lines = match.trim().split('\n');
                if (lines.length >= 2 && lines[0].includes('?')) {
                  faq.push({
                    question: lines[0].trim(),
                    answer: lines.slice(1).join(' ').trim().slice(0, 500),
                  });
                }
              }
            }
          }

          enrichmentData.website = {
            title: mainPage.title || '',
            description: mainPage.metadata?.description || mainPage.description || '',
            keywords: uniqueKeywords,
            content: contentSummary,
            about: aboutPage?.text?.slice(0, 3000) || '',
            pages,
            socialLinks,
            faq: faq.slice(0, 15),
          };

          updateData.websiteTitle = mainPage.title;
          updateData.websiteDescription = mainPage.metadata?.description || mainPage.description;
          updateData.websiteKeywords = uniqueKeywords;
          updateData.websiteContent = contentSummary;
          updateData.websiteAbout = aboutPage?.text?.slice(0, 3000) || null;
          updateData.websitePages = pages;
          updateData.websiteSocialLinks = Object.keys(socialLinks).length > 0 ? socialLinks : null;
          updateData.websiteFaq = faq.length > 0 ? faq.slice(0, 15) : null;
          updateData.websiteLastUpdated = new Date();

          enrichedFields.push('website');
          totalCost += 0.002 * results.length;
        }
      } catch (error: any) {
        errors.push(`Website: ${error.message}`);
      }
    }
  }

  if (enrichedFields.length > 0) {
    updateData.enrichmentScore = calculateEnrichmentScore(enrichmentData);
    updateData.lastEnrichedAt = new Date();

    await db.update(companies).set(updateData).where(eq(companies.id, companyId));
  }

  return {
    success: errors.length === 0,
    enrichedFields,
    errors,
    costEstimate: Math.round(totalCost * 1000) / 1000,
    source: 'apify+receitaws',
  };
}

export async function enrichCompanyEcommerce(
  companyId: number,
  options: { forceRefresh?: boolean } = {}
): Promise<EnrichmentResult> {
  const { forceRefresh = false } = options;
  const enrichedFields: string[] = [];
  const errors: string[] = [];
  let totalCost = 0;

  const [company] = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
  if (!company) {
    return { success: false, enrichedFields: [], errors: ['Company not found'], costEstimate: 0, source: 'apify' };
  }

  if (!company.website) {
    return { success: false, enrichedFields: [], errors: ['Company has no website configured'], costEstimate: 0, source: 'apify' };
  }

  const shouldFetch = forceRefresh ||
    !company.ecommerceLastUpdated ||
    (Date.now() - new Date(company.ecommerceLastUpdated).getTime()) > 30 * 24 * 60 * 60 * 1000;

  if (!shouldFetch) {
    return { success: true, enrichedFields: [], errors: ['Data is still fresh (< 30 days)'], costEstimate: 0, source: 'apify' };
  }

  try {
    console.log(`[Enrichment] Starting e-commerce scrape for company ${companyId}: ${company.website}`);

    const { items } = await apifyService.runActorPublic(
      'apify/e-commerce-scraping-tool',
      {
        startUrls: [{ url: company.website }],
        maxItems: 50,
        proxyConfiguration: { useApifyProxy: true },
      },
      { triggeredBy: 'on_demand' }
    );

    if (items.length > 0) {
      const products = items.map((item: any) => ({
        name: item.name || item.title || '',
        price: item.price?.toString() || item.currentPrice?.toString() || '',
        currency: item.currency || 'BRL',
        imageUrl: item.image || item.imageUrl || item.thumbnailUrl || '',
        url: item.url || item.productUrl || '',
        category: item.category || item.breadcrumb || '',
        description: (item.description || '').slice(0, 300),
      })).filter((p: any) => p.name);

      const categories = Array.from(new Set(products.map((p: any) => p.category).filter(Boolean)));

      let platform = '';
      const siteUrl = company.website.toLowerCase();
      if (siteUrl.includes('shopify') || items[0]?.source?.includes('shopify')) platform = 'Shopify';
      else if (siteUrl.includes('woocommerce') || siteUrl.includes('wordpress')) platform = 'WooCommerce';
      else if (siteUrl.includes('nuvemshop') || siteUrl.includes('lojaintegrada')) platform = 'NuvemShop';
      else if (siteUrl.includes('tray') || siteUrl.includes('traycorp')) platform = 'Tray';
      else if (siteUrl.includes('vtex')) platform = 'VTEX';
      else if (siteUrl.includes('magento')) platform = 'Magento';

      const updateData: any = {
        ecommerceProducts: products.slice(0, 50),
        ecommerceProductCount: products.length,
        ecommerceCategories: categories.slice(0, 20),
        ecommercePlatform: platform || null,
        ecommerceLastUpdated: new Date(),
        lastEnrichedAt: new Date(),
      };

      await db.update(companies).set(updateData).where(eq(companies.id, companyId));

      enrichedFields.push('ecommerce');
      totalCost += 0.005 * Math.ceil(products.length / 10);
      console.log(`[Enrichment] E-commerce scrape complete: ${products.length} products found`);
    } else {
      errors.push('No products found on the website');
    }
  } catch (error: any) {
    console.error(`[Enrichment] E-commerce scrape error for company ${companyId}:`, error);
    errors.push(`E-commerce: ${error.message}`);
  }

  return {
    success: errors.length === 0,
    enrichedFields,
    errors,
    costEstimate: Math.round(totalCost * 1000) / 1000,
    source: 'apify',
  };
}

export interface BatchEnrichResult {
  total: number;
  enriched: number;
  skipped: number;
  errors: string[];
  costEstimate: number;
}

export async function batchEnrichMissingProfilePics(
  limit: number = 1000
): Promise<BatchEnrichResult> {
  const creatorsWithInstagram = await db.select({
    id: users.id,
    name: users.name,
    instagram: users.instagram,
    avatar: users.avatar,
    instagramProfilePic: users.instagramProfilePic,
    instagramFollowers: users.instagramFollowers,
    instagramLastUpdated: users.instagramLastUpdated,
  })
    .from(users)
    .where(
      and(
        eq(users.role, 'creator'),
        isNotNull(users.instagram),
        or(
          isNull(users.instagramProfilePic),
          eq(users.instagramProfilePic, '')
        )
      )
    )
    .limit(limit);

  if (creatorsWithInstagram.length === 0) {
    return { total: 0, enriched: 0, skipped: 0, errors: [], costEstimate: 0 };
  }

  console.log(`[BatchEnrich] Found ${creatorsWithInstagram.length} creators missing profile pics`);

  let enriched = 0;
  let skipped = 0;
  const errors: string[] = [];
  let totalCost = 0;

  for (const c of creatorsWithInstagram) {
    if (c.avatar && c.avatar.startsWith('/api/storage/')) {
      await db.update(users).set({ instagramProfilePic: c.avatar }).where(eq(users.id, c.id));
      enriched++;
      console.log(`[BatchEnrich] Reused Object Storage avatar for user ${c.id} (${c.name})`);
      continue;
    }
  }
  const remaining = creatorsWithInstagram.filter(c => {
    if (c.avatar && c.avatar.startsWith('/api/storage/')) return false;
    if (c.instagramLastUpdated) return false;
    return true;
  });
  if (remaining.length === 0) {
    return { total: creatorsWithInstagram.length, enriched, skipped, errors, costEstimate: 0 };
  }

  const usernames = remaining.map(c => {
    const username = (c.instagram || '').replace('@', '').replace('https://instagram.com/', '').replace('https://www.instagram.com/', '').split('/')[0].toLowerCase();
    return { userId: c.id, username, hasFollowers: !!c.instagramFollowers };
  }).filter(u => u.username);

  const batchSize = 50;
  for (let i = 0; i < usernames.length; i += batchSize) {
    const batch = usernames.slice(i, i + batchSize);
    
    const promises = batch.map(async ({ userId, username, hasFollowers }) => {
      try {
        const picResult = await getOrFetchProfilePic(username);
        
        const updateData: any = {};
        if (picResult.publicUrl) {
          updateData.instagramProfilePic = picResult.publicUrl;
        }

        if (!hasFollowers) {
          const bizData = await tryBusinessDiscoveryForProfile(username);
          if (bizData?.exists) {
            if (bizData.followers) updateData.instagramFollowers = bizData.followers;
            if (bizData.following) updateData.instagramFollowing = bizData.following;
            if (bizData.postsCount) updateData.instagramPosts = bizData.postsCount;
            if (bizData.isVerified !== undefined) updateData.instagramVerified = bizData.isVerified;
            if (bizData.bio) updateData.instagramBio = bizData.bio;
            if (bizData.profilePicUrl && !updateData.instagramProfilePic) {
              const storagePath = await downloadAndSaveToStorage(username, bizData.profilePicUrl);
              if (storagePath) updateData.instagramProfilePic = getPublicUrl(storagePath);
            }
            updateData.instagramLastUpdated = new Date();
            totalCost += 0;
          } else {
            const profile = await apifyService.queueProfileScrape(username, { triggeredBy: 'on_demand' });
            if (profile) {
              if (profile.followersCount) updateData.instagramFollowers = profile.followersCount;
              if (profile.followsCount) updateData.instagramFollowing = profile.followsCount;
              if (profile.postsCount) updateData.instagramPosts = profile.postsCount;
              if (profile.isVerified !== undefined) updateData.instagramVerified = profile.isVerified;
              if (profile.biography) updateData.instagramBio = profile.biography;
              if (profile.profilePicUrl && !updateData.instagramProfilePic) {
                const storagePath = await downloadAndSaveToStorage(username, profile.profilePicUrl);
                if (storagePath) updateData.instagramProfilePic = getPublicUrl(storagePath);
              }
              updateData.instagramLastUpdated = new Date();
              totalCost += 0.002;
            }
          }
        } else if (!updateData.instagramProfilePic) {
          const profile = await apifyService.queueProfileScrape(username, { triggeredBy: 'on_demand' });
          if (profile?.profilePicUrl) {
            const storagePath = await downloadAndSaveToStorage(username, profile.profilePicUrl);
            if (storagePath) updateData.instagramProfilePic = getPublicUrl(storagePath);
            totalCost += 0.002;
          }
        }

        if (Object.keys(updateData).length > 0) {
          await db.update(users).set(updateData).where(eq(users.id, userId));
          enriched++;
          console.log(`[BatchEnrich] ✅ Enriched @${username} (user ${userId})`);
        } else {
          skipped++;
        }
      } catch (error: any) {
        errors.push(`@${username}: ${error.message}`);
        console.error(`[BatchEnrich] ❌ Error for @${username}:`, error.message);
      }
    });

    await Promise.all(promises);
    
    if (i + batchSize < usernames.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  return {
    total: creatorsWithInstagram.length,
    enriched,
    skipped,
    errors,
    costEstimate: Math.round(totalCost * 1000) / 1000,
  };
}

export async function batchEnrichMissingData(
  limit: number = 1000
): Promise<BatchEnrichResult> {
  const creatorsNeedingData = await db.select({
    id: users.id,
    name: users.name,
    instagram: users.instagram,
    instagramFollowers: users.instagramFollowers,
    instagramLastUpdated: users.instagramLastUpdated,
  })
    .from(users)
    .where(
      and(
        eq(users.role, 'creator'),
        isNotNull(users.instagram),
        or(
          isNull(users.instagramFollowers),
          isNull(users.instagramLastUpdated)
        )
      )
    )
    .limit(limit);

  if (creatorsNeedingData.length === 0) {
    return { total: 0, enriched: 0, skipped: 0, errors: [], costEstimate: 0 };
  }

  console.log(`[BatchEnrich] Found ${creatorsNeedingData.length} creators missing Instagram data`);

  let enriched = 0;
  let skipped = 0;
  const errors: string[] = [];
  let totalCost = 0;

  const usernames = creatorsNeedingData.map(c => {
    const username = (c.instagram || '').replace('@', '').replace('https://instagram.com/', '').replace('https://www.instagram.com/', '').split('/')[0].toLowerCase();
    return { userId: c.id, username };
  }).filter(u => u.username);

  const batchSize = 50;
  for (let i = 0; i < usernames.length; i += batchSize) {
    const batch = usernames.slice(i, i + batchSize);

    const promises = batch.map(async ({ userId, username }) => {
      try {
        const bizData = await tryBusinessDiscoveryForProfile(username);
        const updateData: any = {};

        if (bizData?.exists) {
          if (bizData.followers) updateData.instagramFollowers = bizData.followers;
          if (bizData.following) updateData.instagramFollowing = bizData.following;
          if (bizData.postsCount) updateData.instagramPosts = bizData.postsCount;
          if (bizData.isVerified !== undefined) updateData.instagramVerified = bizData.isVerified;
          if (bizData.bio) updateData.instagramBio = bizData.bio;
          if (bizData.profilePicUrl) {
            const storagePath = await downloadAndSaveToStorage(username, bizData.profilePicUrl);
            if (storagePath) updateData.instagramProfilePic = getPublicUrl(storagePath);
          }
          updateData.instagramLastUpdated = new Date();
        } else {
          const profile = await apifyService.queueProfileScrape(username, { triggeredBy: 'on_demand' });
          if (profile) {
            if (profile.followersCount) updateData.instagramFollowers = profile.followersCount;
            if (profile.followsCount) updateData.instagramFollowing = profile.followsCount;
            if (profile.postsCount) updateData.instagramPosts = profile.postsCount;
            if (profile.isVerified !== undefined) updateData.instagramVerified = profile.isVerified;
            if (profile.biography) updateData.instagramBio = profile.biography;
            if (profile.profilePicUrl) {
              const storagePath = await downloadAndSaveToStorage(username, profile.profilePicUrl);
              if (storagePath) updateData.instagramProfilePic = getPublicUrl(storagePath);
            }
            updateData.instagramLastUpdated = new Date();
            totalCost += 0.002;
          }
        }

        if (Object.keys(updateData).length > 0) {
          await db.update(users).set(updateData).where(eq(users.id, userId));
          enriched++;
        } else {
          skipped++;
        }
      } catch (error: any) {
        errors.push(`@${username}: ${error.message}`);
      }
    });

    await Promise.all(promises);
    if (i + batchSize < usernames.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  return {
    total: creatorsNeedingData.length,
    enriched,
    skipped,
    errors,
    costEstimate: Math.round(totalCost * 1000) / 1000,
  };
}

export async function deepEnrichCreator(
  creatorId: number,
  options: { forceRefresh?: boolean } = {}
): Promise<EnrichmentResult> {
  const { forceRefresh = false } = options;
  const enrichedFields: string[] = [];
  const errors: string[] = [];
  let totalCost = 0;

  const [creator] = await db.select().from(users).where(eq(users.id, creatorId)).limit(1);
  if (!creator) {
    return { success: false, enrichedFields: [], errors: ['Creator not found'], costEstimate: 0, source: 'apify' };
  }

  if (!creator.instagram) {
    return { success: false, enrichedFields: [], errors: ['No Instagram username'], costEstimate: 0, source: 'apify' };
  }

  const username = creator.instagram.replace('@', '').replace('https://instagram.com/', '').replace('https://www.instagram.com/', '').split('/')[0];

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const lastUpdated = creator.instagramLastUpdated ? new Date(creator.instagramLastUpdated).getTime() : 0;
  if (!forceRefresh && lastUpdated > sevenDaysAgo && creator.instagramFollowers && creator.instagramProfilePic) {
    return { success: true, enrichedFields: [], errors: ['Data still fresh (< 7 days)'], costEstimate: 0, source: 'cached' };
  }

  try {
    console.log(`[DeepEnrich] Starting detailed scrape for @${username} (user ${creatorId})`);
    const detailedProfiles = await apifyService.scrapeProfilesDetailed([username], { triggeredBy: 'on_demand' });

    if (detailedProfiles.length > 0) {
      const profile = detailedProfiles[0];
      const updateData: any = {};

      if (profile.followersCount) updateData.instagramFollowers = profile.followersCount;
      if (profile.followsCount) updateData.instagramFollowing = profile.followsCount;
      if (profile.postsCount) updateData.instagramPosts = profile.postsCount;
      if (profile.isVerified !== undefined) updateData.instagramVerified = profile.isVerified;
      if (profile.biography) updateData.instagramBio = profile.biography;
      if (profile.profilePicUrl) {
        const storagePath = await downloadAndSaveToStorage(username, profile.profilePicUrl);
        if (storagePath) updateData.instagramProfilePic = getPublicUrl(storagePath);
      }

      if (profile.engagementRate) {
        updateData.instagramEngagementRate = `${profile.engagementRate.toFixed(2)}%`;
      } else if (profile.avgLikes && profile.followersCount) {
        const engRate = ((profile.avgLikes + (profile.avgComments || 0)) / profile.followersCount) * 100;
        updateData.instagramEngagementRate = `${engRate.toFixed(2)}%`;
      }

      if (profile.recentPosts && profile.recentPosts.length > 0) {
        const topPosts = profile.recentPosts.slice(0, 5).map((p: any) => ({
          id: p.id || p.shortCode || '',
          url: p.shortCode ? `https://www.instagram.com/p/${p.shortCode}/` : '',
          imageUrl: p.displayUrl || p.imageUrl || p.url || '',
          caption: (p.caption || p.text || '').slice(0, 200),
          likes: p.likesCount || p.likes || 0,
          comments: p.commentsCount || p.comments || 0,
          timestamp: p.timestamp || '',
        }));
        updateData.instagramTopPosts = topPosts;

        const allHashtags = profile.recentPosts.flatMap((p: any) => {
          const caption = p.caption || p.text || '';
          return (caption.match(/#(\w+)/g) || []).map((t: string) => t.replace('#', ''));
        });
        updateData.instagramTopHashtags = Array.from(new Set(allHashtags)).slice(0, 10);
      }

      updateData.instagramLastUpdated = new Date();
      updateData.lastEnrichedAt = new Date();
      updateData.enrichmentSource = 'apify_detailed';

      await db.update(users).set(updateData).where(eq(users.id, creatorId));
      enrichedFields.push('instagram_detailed');
      totalCost += 0.01;
      console.log(`[DeepEnrich] ✅ Deep enrichment complete for @${username}`);
    }
  } catch (error: any) {
    errors.push(`Deep enrich: ${error.message}`);
    console.error(`[DeepEnrich] ❌ Error for @${username}:`, error.message);
  }

  return {
    success: errors.length === 0,
    enrichedFields,
    errors,
    costEstimate: Math.round(totalCost * 1000) / 1000,
    source: 'apify_detailed',
  };
}

export async function batchDeepEnrich(
  creatorIds: number[],
  options: { forceRefresh?: boolean } = {}
): Promise<BatchEnrichResult> {
  let enriched = 0;
  let skipped = 0;
  const errors: string[] = [];
  let totalCost = 0;

  for (const creatorId of creatorIds) {
    try {
      const result = await deepEnrichCreator(creatorId, options);
      if (result.enrichedFields.length > 0) {
        enriched++;
      } else {
        skipped++;
      }
      totalCost += result.costEstimate;
      if (result.errors.length > 0) {
        errors.push(...result.errors.map(e => `Creator ${creatorId}: ${e}`));
      }
    } catch (error: any) {
      errors.push(`Creator ${creatorId}: ${error.message}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }

  return {
    total: creatorIds.length,
    enriched,
    skipped,
    errors,
    costEstimate: Math.round(totalCost * 1000) / 1000,
  };
}

export async function getCreatorsNeedingEnrichment(limit: number = 50): Promise<number[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const creators = await db.select({ id: users.id })
    .from(users)
    .where(eq(users.role, 'creator'))
    .limit(limit);

  return creators
    .filter(c => true)
    .map(c => c.id);
}

export async function getCompaniesNeedingEnrichment(limit: number = 50): Promise<number[]> {
  const companies_list = await db.select({ id: companies.id })
    .from(companies)
    .limit(limit);

  return companies_list.map(c => c.id);
}

export default {
  enrichCreatorProfile,
  enrichCompanyProfile,
  enrichCompanyEcommerce,
  getCreatorsNeedingEnrichment,
  getCompaniesNeedingEnrichment,
  batchEnrichMissingProfilePics,
  batchEnrichMissingData,
  deepEnrichCreator,
  batchDeepEnrich,
  refreshCreatorProfileLight,
};
