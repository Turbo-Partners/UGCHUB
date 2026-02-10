import { db } from "../db";
import { hashtagSearches, campaignHashtags, hashtagPosts } from "@shared/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";

const FACEBOOK_GRAPH_API_VERSION = "v21.0";
const GRAPH_URL = `https://graph.facebook.com/${FACEBOOK_GRAPH_API_VERSION}`;
const MAX_HASHTAG_SEARCHES_PER_WEEK = 30;

export class InstagramHashtagService {

  async getWeeklySearchCount(instagramUserId: string): Promise<{ used: number; limit: number; remaining: number }> {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const result = await db.select({
      count: sql<number>`count(DISTINCT ${hashtagSearches.hashtag})`
    })
    .from(hashtagSearches)
    .where(and(
      eq(hashtagSearches.instagramUserId, instagramUserId),
      gte(hashtagSearches.searchedAt, oneWeekAgo)
    ));

    const used = Number(result[0]?.count || 0);
    return { used, limit: MAX_HASHTAG_SEARCHES_PER_WEEK, remaining: Math.max(0, MAX_HASHTAG_SEARCHES_PER_WEEK - used) };
  }

  async searchHashtag(accessToken: string, instagramUserId: string, hashtag: string, companyId: number): Promise<{ hashtagId: string; name: string } | null> {
    const cleanHashtag = hashtag.replace(/^#/, '').toLowerCase().trim();

    const weeklyCount = await this.getWeeklySearchCount(instagramUserId);

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [existing] = await db.select()
      .from(hashtagSearches)
      .where(and(
        eq(hashtagSearches.instagramUserId, instagramUserId),
        eq(hashtagSearches.hashtag, cleanHashtag),
        gte(hashtagSearches.searchedAt, oneWeekAgo)
      ))
      .limit(1);

    if (existing?.hashtagId) {
      return { hashtagId: existing.hashtagId, name: cleanHashtag };
    }

    if (weeklyCount.remaining <= 0) {
      throw new Error(`Limite semanal de hashtags atingido (${MAX_HASHTAG_SEARCHES_PER_WEEK}/semana). Tente novamente na próxima semana.`);
    }

    const url = `${GRAPH_URL}/ig_hashtag_search?user_id=${instagramUserId}&q=${encodeURIComponent(cleanHashtag)}&access_token=${accessToken}`;
    const response = await fetch(url);
    const data: any = await response.json();

    if (data.error) {
      console.error("[Hashtag Search] API error:", data.error);
      throw new Error(data.error.message || "Erro ao buscar hashtag");
    }

    if (!data.data || data.data.length === 0) {
      return null;
    }

    const hashtagId = data.data[0].id;

    await db.insert(hashtagSearches).values({
      companyId,
      instagramUserId,
      hashtag: cleanHashtag,
      hashtagId,
    });

    return { hashtagId, name: cleanHashtag };
  }

  async getHashtagMedia(accessToken: string, instagramUserId: string, hashtagId: string, type: "top_media" | "recent_media" = "top_media"): Promise<any[]> {
    const fields = "id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count";
    const url = `${GRAPH_URL}/${hashtagId}/${type}?user_id=${instagramUserId}&fields=${fields}&access_token=${accessToken}`;

    const response = await fetch(url);
    const data: any = await response.json();

    if (data.error) {
      console.error(`[Hashtag ${type}] API error:`, data.error);
      throw new Error(data.error.message || `Erro ao buscar ${type}`);
    }

    return data.data || [];
  }

  async addCampaignHashtag(campaignId: number, companyId: number, hashtag: string, hashtagId?: string) {
    const cleanHashtag = hashtag.replace(/^#/, '').toLowerCase().trim();

    const [existing] = await db.select()
      .from(campaignHashtags)
      .where(and(
        eq(campaignHashtags.campaignId, campaignId),
        eq(campaignHashtags.hashtag, cleanHashtag)
      ))
      .limit(1);

    if (existing) {
      if (!existing.isActive) {
        await db.update(campaignHashtags)
          .set({ isActive: true })
          .where(eq(campaignHashtags.id, existing.id));
      }
      return existing;
    }

    const [inserted] = await db.insert(campaignHashtags)
      .values({ campaignId, companyId, hashtag: cleanHashtag, hashtagId })
      .returning();

    return inserted;
  }

  async removeCampaignHashtag(id: number, companyId: number) {
    await db.update(campaignHashtags)
      .set({ isActive: false })
      .where(and(
        eq(campaignHashtags.id, id),
        eq(campaignHashtags.companyId, companyId)
      ));
  }

  async getCampaignHashtags(campaignId: number) {
    return db.select()
      .from(campaignHashtags)
      .where(and(
        eq(campaignHashtags.campaignId, campaignId),
        eq(campaignHashtags.isActive, true)
      ))
      .orderBy(desc(campaignHashtags.createdAt));
  }

  async saveHashtagPosts(campaignHashtagId: number, companyId: number, posts: any[], source: "top" | "recent") {
    let saved = 0;
    for (const post of posts) {
      try {
        await db.insert(hashtagPosts)
          .values({
            campaignHashtagId,
            companyId,
            mediaId: post.id,
            mediaType: post.media_type,
            caption: post.caption || null,
            permalink: post.permalink || null,
            mediaUrl: post.media_url || null,
            thumbnailUrl: post.thumbnail_url || null,
            likeCount: post.like_count || null,
            commentsCount: post.comments_count || null,
            timestamp: post.timestamp ? new Date(post.timestamp) : null,
            username: post.username || null,
            source,
          })
          .onConflictDoUpdate({
            target: [hashtagPosts.campaignHashtagId, hashtagPosts.mediaId],
            set: {
              likeCount: post.like_count || null,
              commentsCount: post.comments_count || null,
              caption: post.caption || null,
            }
          });
        saved++;
      } catch (e) {
      }
    }

    const [count] = await db.select({
      total: sql<number>`count(*)`
    })
    .from(hashtagPosts)
    .where(eq(hashtagPosts.campaignHashtagId, campaignHashtagId));

    await db.update(campaignHashtags)
      .set({
        totalPostsFound: Number(count?.total || 0),
        lastCheckedAt: new Date()
      })
      .where(eq(campaignHashtags.id, campaignHashtagId));

    return saved;
  }

  async getHashtagPostsList(campaignHashtagId: number, limit: number = 50, offset: number = 0) {
    return db.select()
      .from(hashtagPosts)
      .where(eq(hashtagPosts.campaignHashtagId, campaignHashtagId))
      .orderBy(desc(hashtagPosts.timestamp))
      .limit(limit)
      .offset(offset);
  }

  async getCompanyHashtagStats(companyId: number) {
    const hashtags = await db.select()
      .from(campaignHashtags)
      .where(and(
        eq(campaignHashtags.companyId, companyId),
        eq(campaignHashtags.isActive, true)
      ))
      .orderBy(desc(campaignHashtags.createdAt));

    return hashtags;
  }
}

export const instagramHashtagService = new InstagramHashtagService();
