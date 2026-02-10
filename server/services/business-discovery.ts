import { db } from '../db';
import { instagramAccounts } from '@shared/schema';
import { sql } from 'drizzle-orm';

export interface BusinessDiscoveryResult {
  exists: boolean;
  username: string;
  fullName?: string;
  followers?: number;
  following?: number;
  postsCount?: number;
  bio?: string;
  profilePicUrl?: string;
  isVerified?: boolean;
  isPrivate?: boolean;
  engagementRate?: string;
  authenticityScore?: number;
  topHashtags?: string[];
  topPosts?: any[];
  recentMedia?: any[];
}

export async function tryBusinessDiscoveryForProfile(targetUsername: string): Promise<BusinessDiscoveryResult | null> {
  try {
    const accounts = await db.select()
      .from(instagramAccounts)
      .where(sql`${instagramAccounts.accessToken} IS NOT NULL AND ${instagramAccounts.instagramUserId} IS NOT NULL`)
      .limit(1);

    if (!accounts.length) {
      return null;
    }

    const account = accounts[0];
    const cleanUsername = targetUsername.toLowerCase().replace('@', '').trim();

    if (account.username?.toLowerCase() === cleanUsername) {
      return null;
    }

    const FACEBOOK_GRAPH_API_VERSION = "v21.0";
    const apiUrl = `https://graph.instagram.com/${FACEBOOK_GRAPH_API_VERSION}/${account.instagramUserId}?fields=business_discovery.fields(username,name,biography,followers_count,follows_count,media_count,profile_picture_url,media.limit(12){id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count}).username(${cleanUsername})&access_token=${account.accessToken}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.error || !data.business_discovery) {
      console.log(`[Business Discovery] Failed for @${cleanUsername}: ${data.error?.message || 'No data'}`);
      return null;
    }

    const biz = data.business_discovery;
    const media = biz.media?.data || [];

    let engagementRate = '0%';
    let topHashtags: string[] = [];
    let topPosts: any[] = [];

    if (media.length > 0 && biz.followers_count > 0) {
      const totalEngagement = media.reduce((sum: number, post: any) =>
        sum + (post.like_count || 0) + (post.comments_count || 0), 0);
      const avgEngagement = totalEngagement / media.length;
      const rate = (avgEngagement / biz.followers_count) * 100;
      engagementRate = rate.toFixed(2) + '%';

      const hashtagCounts: Record<string, number> = {};
      media.forEach((post: any) => {
        const matches = (post.caption || '').match(/#(\w+)/g);
        if (matches) {
          matches.forEach((tag: string) => {
            const clean = tag.replace('#', '').toLowerCase();
            hashtagCounts[clean] = (hashtagCounts[clean] || 0) + 1;
          });
        }
      });
      topHashtags = Object.entries(hashtagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag]) => tag);

      topPosts = media
        .map((post: any) => ({
          id: post.id,
          url: post.permalink,
          imageUrl: post.media_url || post.thumbnail_url || '',
          caption: (post.caption || '').substring(0, 200),
          likes: post.like_count || 0,
          comments: post.comments_count || 0,
          timestamp: post.timestamp,
        }))
        .sort((a: any, b: any) => (b.likes + b.comments) - (a.likes + a.comments))
        .slice(0, 3);
    }

    console.log(`[Business Discovery] SUCCESS for @${cleanUsername} - $0 cost`);

    return {
      exists: true,
      username: cleanUsername,
      fullName: biz.name || undefined,
      followers: biz.followers_count || undefined,
      following: biz.follows_count || undefined,
      postsCount: biz.media_count || undefined,
      bio: biz.biography || undefined,
      profilePicUrl: biz.profile_picture_url || undefined,
      isVerified: false,
      isPrivate: false,
      engagementRate,
      authenticityScore: 50,
      topHashtags,
      topPosts,
      recentMedia: media,
    };
  } catch (error: any) {
    console.log(`[Business Discovery] Error: ${error.message}`);
    return null;
  }
}
