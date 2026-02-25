import { db } from '../db';
import {
  instagramAccounts,
  instagramPosts,
  instagramMessages,
  instagramProfiles,
  users,
  type InsertInstagramAccount,
  type InsertInstagramPost,
  type InsertInstagramMessage,
  type InsertInstagramProfile,
} from '@shared/schema';
import { upsertContact, recordInteraction } from './instagram-contacts';
import { eq, and, desc, sql, ilike } from 'drizzle-orm';

async function getProfilePicFromLocalData(username: string): Promise<string | null> {
  const cleanUsername = username.toLowerCase().replace('@', '');

  const [creator] = await db
    .select({
      avatar: users.avatar,
      instagramProfilePic: users.instagramProfilePic,
    })
    .from(users)
    .where(ilike(users.instagram, cleanUsername))
    .limit(1);

  if (creator) {
    if (creator.instagramProfilePic?.startsWith('/api/storage/'))
      return creator.instagramProfilePic;
    if (creator.avatar?.startsWith('/api/storage/')) return creator.avatar;
  }

  const [cached] = await db
    .select({ storagePath: instagramProfiles.profilePicStoragePath })
    .from(instagramProfiles)
    .where(ilike(instagramProfiles.username, cleanUsername))
    .limit(1);

  if (cached?.storagePath) {
    return `/api/storage/public/${cached.storagePath}`;
  }

  return null;
}

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;

const INSTAGRAM_GRAPH_API_VERSION = 'v21.0';
const INSTAGRAM_GRAPH_BASE_URL = `https://graph.instagram.com/${INSTAGRAM_GRAPH_API_VERSION}`;
const FACEBOOK_GRAPH_BASE_URL = `https://graph.facebook.com/${INSTAGRAM_GRAPH_API_VERSION}`;

/**
 * Helper to determine if a message is incoming (from user) or outgoing (from business)
 * Uses username comparison as primary method (more reliable than IDs)
 * Falls back to ID comparison when username is not available
 */
export function isMessageIncoming(params: {
  senderUsername?: string | null;
  senderId?: string | null;
  accountUsername?: string | null;
  accountInstagramUserId?: string | null;
  accountFacebookUserId?: string | null;
}): boolean {
  const {
    senderUsername,
    senderId,
    accountUsername,
    accountInstagramUserId,
    accountFacebookUserId,
  } = params;

  // Primary: Compare by username (more reliable across different API contexts)
  if (senderUsername && accountUsername) {
    return senderUsername.toLowerCase() !== accountUsername.toLowerCase();
  }

  // Fallback: Compare by ID (may differ across API contexts)
  if (senderId) {
    if (senderId === accountInstagramUserId) return false;
    if (accountFacebookUserId && senderId === accountFacebookUserId) return false;
  }

  // Default to incoming if we can't determine
  return true;
}

export interface InstagramOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface InstagramTokenResponse {
  access_token: string;
  user_id: string;
  permissions?: string[];
}

export interface InstagramLongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface InstagramUserProfile {
  id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
  account_type?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
  biography?: string;
  website?: string;
}

export interface InstagramMedia {
  id: string;
  media_type: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
}

export class InstagramService {
  private getRedirectUri(type: 'creator' | 'business'): string {
    const baseUrl =
      process.env.PRODUCTION_URL ||
      (process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : 'https://localhost:5000');

    return type === 'creator'
      ? `${baseUrl}/api/auth/instagram/callback`
      : `${baseUrl}/api/auth/instagram/callback`;
  }

  getInstagramOAuthUrl(type: 'creator' | 'business', state: string): string {
    const redirectUri = this.getRedirectUri(type);

    const scopes = [
      'instagram_business_basic',
      'instagram_business_manage_messages',
      'instagram_business_manage_comments',
      'instagram_business_content_publish',
      'instagram_business_manage_insights',
    ].join(',');

    return (
      `https://www.instagram.com/oauth/authorize?` +
      `client_id=${INSTAGRAM_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${scopes}` +
      `&response_type=code` +
      `&state=${encodeURIComponent(state)}`
    );
  }

  async exchangeCodeForToken(
    code: string,
    type: 'creator' | 'business',
  ): Promise<InstagramTokenResponse> {
    const redirectUri = this.getRedirectUri(type);

    const response = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: INSTAGRAM_APP_ID!,
        client_secret: INSTAGRAM_APP_SECRET!,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Instagram] Token exchange failed:', error);
      throw new Error(`Failed to exchange code: ${error}`);
    }

    return response.json();
  }

  async exchangeForLongLivedToken(
    shortLivedToken: string,
  ): Promise<InstagramLongLivedTokenResponse> {
    const response = await fetch(
      `${INSTAGRAM_GRAPH_BASE_URL}/access_token?` +
        `grant_type=ig_exchange_token` +
        `&client_secret=${INSTAGRAM_APP_SECRET}` +
        `&access_token=${shortLivedToken}`,
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[Instagram] Long-lived token exchange failed:', error);
      throw new Error(`Failed to exchange for long-lived token: ${error}`);
    }

    return response.json();
  }

  async refreshLongLivedToken(token: string): Promise<InstagramLongLivedTokenResponse> {
    const response = await fetch(
      `${INSTAGRAM_GRAPH_BASE_URL}/refresh_access_token?` +
        `grant_type=ig_refresh_token` +
        `&access_token=${token}`,
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[Instagram] Token refresh failed:', error);
      throw new Error(`Failed to refresh token: ${error}`);
    }

    return response.json();
  }

  async getUserProfile(accessToken: string, userId?: string): Promise<InstagramUserProfile> {
    const id = userId || 'me';
    const fields = [
      'id',
      'username',
      'name',
      'profile_picture_url',
      'account_type',
      'followers_count',
      'follows_count',
      'media_count',
      'biography',
      'website',
    ].join(',');

    const response = await fetch(
      `${INSTAGRAM_GRAPH_BASE_URL}/${id}?fields=${fields}&access_token=${accessToken}`,
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[Instagram] Get profile failed:', error);
      throw new Error(`Failed to get profile: ${error}`);
    }

    return response.json();
  }

  async getUserMedia(accessToken: string, userId?: string, limit = 25): Promise<InstagramMedia[]> {
    const id = userId || 'me';
    const fields = [
      'id',
      'media_type',
      'media_url',
      'thumbnail_url',
      'permalink',
      'caption',
      'timestamp',
      'like_count',
      'comments_count',
    ].join(',');

    const response = await fetch(
      `${INSTAGRAM_GRAPH_BASE_URL}/${id}/media?fields=${fields}&limit=${limit}&access_token=${accessToken}`,
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[Instagram] Get media failed:', error);
      throw new Error(`Failed to get media: ${error}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  async getMentions(accessToken: string, userId: string): Promise<any[]> {
    const response = await fetch(
      `${INSTAGRAM_GRAPH_BASE_URL}/${userId}/tags?fields=id,username,media_type,media_url,permalink,timestamp,caption,like_count,comments_count&access_token=${accessToken}`,
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[Instagram] Get mentions failed:', error);
      return [];
    }

    const data = await response.json();
    return data.data || [];
  }

  async getMediaInsights(accessToken: string, mediaId: string): Promise<any> {
    try {
      const response = await fetch(
        `${INSTAGRAM_GRAPH_BASE_URL}/${mediaId}/insights?metric=impressions,reach,engagement,saved&access_token=${accessToken}`,
      );

      const data = await response.json();

      // Error subcode 33 = Cannot get insights for posts owned by other users (expected for mentions)
      if (data.error) {
        if (data.error.error_subcode === 33) {
          // This is expected for tagged/mention posts - silently return null
          return null;
        }
        console.error('[Instagram] Get media insights failed:', data.error.message);
        return null;
      }

      const insights: any = {};
      for (const metric of data.data || []) {
        insights[metric.name] = metric.values?.[0]?.value || 0;
      }
      return insights;
    } catch (error) {
      console.error('[Instagram] Get media insights error:', error);
      return null;
    }
  }

  async sendDirectMessage(accessToken: string, recipientId: string, message: string): Promise<any> {
    const response = await fetch(`${INSTAGRAM_GRAPH_BASE_URL}/me/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: message },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Instagram] Send DM failed:', error);
      throw new Error(`Failed to send DM: ${error}`);
    }

    return response.json();
  }

  async getConversations(
    accessToken: string,
    userId: string,
    onPageFetched?: (page: number, conversations: any[], hasMore: boolean) => void,
  ): Promise<any[]> {
    const allConversations: any[] = [];
    let nextUrl: string | null =
      `${INSTAGRAM_GRAPH_BASE_URL}/${userId}/conversations?` +
      `platform=instagram` +
      `&folder=inbox` +
      `&fields=id,participants,updated_time,messages.limit(50){id,message,from,created_time,attachments}` +
      `&limit=25` +
      `&access_token=${accessToken}`;

    let pageCount = 0;
    const maxPages = 10;

    while (nextUrl && pageCount < maxPages) {
      pageCount++;
      console.log(`[Instagram] Fetching conversations page ${pageCount}...`);

      const response: Response = await fetch(nextUrl);

      if (!response.ok) {
        const error = await response.text();
        console.error('[Instagram] Get conversations failed:', error);
        break;
      }

      const data: any = await response.json();
      const conversations = data.data || [];
      allConversations.push(...conversations);

      const hasMore: boolean = !!data.paging?.next;
      console.log(
        `[Instagram] Page ${pageCount}: Got ${conversations.length} conversations, total: ${allConversations.length}, hasMore: ${hasMore}`,
      );

      if (onPageFetched) {
        onPageFetched(pageCount, conversations, hasMore);
      }

      nextUrl = hasMore ? data.paging.next : null;
    }

    console.log(
      `[Instagram] Total fetched: ${allConversations.length} conversations from ${pageCount} pages`,
    );

    return allConversations;
  }

  // Fetch messages from Instagram API for a specific conversation
  async fetchConversationMessagesFromAPI(
    accessToken: string,
    conversationId: string,
    limit: number = 100,
  ): Promise<any[]> {
    try {
      const response = await fetch(
        `${INSTAGRAM_GRAPH_BASE_URL}/${conversationId}/messages?` +
          `fields=id,message,from,created_time,attachments` +
          `&limit=${limit}` +
          `&access_token=${accessToken}`,
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('[Instagram] Get conversation messages failed:', error);
        return [];
      }

      const data = await response.json();
      console.log(
        `[Instagram] Fetched ${data.data?.length || 0} messages from conversation ${conversationId.substring(0, 20)}...`,
      );
      return data.data || [];
    } catch (e) {
      console.error('[Instagram] Error fetching conversation messages:', e);
      return [];
    }
  }

  // Fetch user profile including profile picture using IG Scoped ID
  async getUserProfilePic(accessToken: string, igsid: string): Promise<string | null> {
    try {
      const response = await fetch(
        `${FACEBOOK_GRAPH_BASE_URL}/${igsid}?fields=name,username,profile_pic&access_token=${accessToken}`,
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.profile_pic || null;
    } catch (e) {
      console.error('[Instagram] Error fetching user profile pic:', e);
      return null;
    }
  }

  // Cache for profile pictures to avoid redundant API calls
  private profilePicCache: Map<string, string | null> = new Map();

  async getInstagramBusinessAccountFromPage(
    accessToken: string,
    pageId: string,
  ): Promise<string | null> {
    const response = await fetch(
      `${FACEBOOK_GRAPH_BASE_URL}/${pageId}?fields=instagram_business_account&access_token=${accessToken}`,
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.instagram_business_account?.id || null;
  }

  async saveInstagramAccount(data: InsertInstagramAccount): Promise<number> {
    const [result] = await db
      .insert(instagramAccounts)
      .values(data)
      .returning({ id: instagramAccounts.id });
    return result.id;
  }

  async getInstagramAccountByUserId(
    userId: number,
  ): Promise<typeof instagramAccounts.$inferSelect | null> {
    const [account] = await db
      .select()
      .from(instagramAccounts)
      .where(eq(instagramAccounts.userId, userId))
      .limit(1);
    return account || null;
  }

  async getInstagramAccountByCompanyId(
    companyId: number,
  ): Promise<typeof instagramAccounts.$inferSelect | null> {
    const [account] = await db
      .select()
      .from(instagramAccounts)
      .where(eq(instagramAccounts.companyId, companyId))
      .limit(1);
    return account || null;
  }

  async getInstagramAccountByInstagramUserId(
    instagramUserId: string,
  ): Promise<typeof instagramAccounts.$inferSelect | null> {
    const [account] = await db
      .select()
      .from(instagramAccounts)
      .where(eq(instagramAccounts.instagramUserId, instagramUserId))
      .limit(1);
    return account || null;
  }

  async updateInstagramAccount(id: number, data: Partial<InsertInstagramAccount>): Promise<void> {
    await db
      .update(instagramAccounts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(instagramAccounts.id, id));
  }

  async deleteInstagramAccount(id: number): Promise<void> {
    await db.delete(instagramAccounts).where(eq(instagramAccounts.id, id));
  }

  async saveMessage(data: InsertInstagramMessage): Promise<number> {
    const [result] = await db
      .insert(instagramMessages)
      .values(data)
      .returning({ id: instagramMessages.id });
    return result.id;
  }

  async savePost(data: InsertInstagramPost): Promise<number> {
    const [result] = await db
      .insert(instagramPosts)
      .values(data)
      .returning({ id: instagramPosts.id });
    return result.id;
  }

  // DM Inbox Methods
  async getMessagesForAccount(
    instagramAccountId: number,
  ): Promise<(typeof instagramMessages.$inferSelect)[]> {
    return db
      .select()
      .from(instagramMessages)
      .where(eq(instagramMessages.instagramAccountId, instagramAccountId))
      .orderBy(desc(instagramMessages.sentAt));
  }

  async getConversationsList(
    instagramAccountId: number,
    limit: number = 200,
    offset: number = 0,
  ): Promise<
    {
      conversationId: string;
      participantId: string;
      participantUsername: string | null;
      participantProfilePic: string | null;
      lastMessage: string | null;
      lastMessageAt: Date | null;
      lastIncomingMessageAt: Date | null;
      unreadCount: number;
      incomingMessageCount: number;
      isIncoming: boolean;
    }[]
  > {
    const [account] = await db
      .select({ username: instagramAccounts.username })
      .from(instagramAccounts)
      .where(eq(instagramAccounts.id, instagramAccountId))
      .limit(1);

    const accountUsername = account?.username?.toLowerCase() || '';

    const summaries = await db.execute<{
      conversation_id: string;
      total_messages: string;
      unread_count: string;
      incoming_count: string;
      last_message_at: Date | null;
      last_incoming_message_at: Date | null;
    }>(sql`
      SELECT 
        conversation_id,
        COUNT(*)::text as total_messages,
        COUNT(*) FILTER (WHERE is_incoming = true AND is_read = false)::text as unread_count,
        COUNT(*) FILTER (WHERE is_incoming = true)::text as incoming_count,
        MAX(sent_at) as last_message_at,
        MAX(sent_at) FILTER (WHERE is_incoming = true) as last_incoming_message_at
      FROM instagram_messages
      WHERE instagram_account_id = ${instagramAccountId}
      GROUP BY conversation_id
      ORDER BY MAX(sent_at) DESC NULLS LAST
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    if (!summaries.rows || summaries.rows.length === 0) {
      return [];
    }

    const conversationIds = summaries.rows.map((s) => s.conversation_id);

    if (conversationIds.length === 0) return [];

    const lastMessages = await db.execute<{
      conversation_id: string;
      message_text: string | null;
      sender_username: string | null;
      sender_id: string;
      sender_profile_pic: string | null;
      recipient_username: string | null;
      recipient_id: string;
      is_incoming: boolean | null;
      sent_at: Date | null;
    }>(sql`
      SELECT DISTINCT ON (conversation_id)
        conversation_id, message_text, sender_username, sender_id, sender_profile_pic,
        recipient_username, recipient_id, is_incoming, sent_at
      FROM instagram_messages
      WHERE instagram_account_id = ${instagramAccountId} 
        AND conversation_id IN (${sql.join(
          conversationIds.map((id) => sql`${id}`),
          sql`, `,
        )})
      ORDER BY conversation_id, sent_at DESC
    `);

    const participantInfo = await db.execute<{
      conversation_id: string;
      sender_username: string | null;
      sender_id: string;
      sender_profile_pic: string | null;
      recipient_username: string | null;
      recipient_id: string;
    }>(sql`
      SELECT DISTINCT ON (conversation_id)
        conversation_id, sender_username, sender_id, sender_profile_pic,
        recipient_username, recipient_id
      FROM instagram_messages
      WHERE instagram_account_id = ${instagramAccountId}
        AND conversation_id IN (${sql.join(
          conversationIds.map((id) => sql`${id}`),
          sql`, `,
        )})
        AND is_incoming = true
      ORDER BY conversation_id, sent_at DESC
    `);

    const conversationUsernames = new Set<string>();
    for (const row of participantInfo.rows) {
      if (row.sender_username) conversationUsernames.add(row.sender_username.toLowerCase());
    }
    for (const row of lastMessages.rows) {
      if (row.sender_username) conversationUsernames.add(row.sender_username.toLowerCase());
      if (row.recipient_username) conversationUsernames.add(row.recipient_username.toLowerCase());
    }

    const usernameList = Array.from(conversationUsernames).filter(Boolean);
    const profilePicMap = new Map<string, string>();

    if (usernameList.length > 0) {
      const profilePics = await db
        .select({
          username: instagramProfiles.username,
          profilePicStoragePath: instagramProfiles.profilePicStoragePath,
          profilePicUrl: instagramProfiles.profilePicUrl,
        })
        .from(instagramProfiles)
        .where(
          sql`LOWER(${instagramProfiles.username}) IN (${sql.join(
            usernameList.map((u) => sql`${u}`),
            sql`, `,
          )})`,
        );

      for (const pic of profilePics) {
        const key = pic.username.toLowerCase();
        if (pic.profilePicStoragePath) {
          profilePicMap.set(key, `/api/storage/public/${pic.profilePicStoragePath}`);
        } else if (pic.profilePicUrl) {
          profilePicMap.set(key, pic.profilePicUrl);
        }
      }
    }

    const lastMsgMap = new Map<string, (typeof lastMessages.rows)[number]>();
    for (const row of lastMessages.rows) {
      lastMsgMap.set(row.conversation_id, row);
    }

    const participantMap = new Map<string, (typeof participantInfo.rows)[number]>();
    for (const row of participantInfo.rows) {
      participantMap.set(row.conversation_id, row);
    }

    return summaries.rows.map((summary) => {
      const lastMsg = lastMsgMap.get(summary.conversation_id);
      const participant = participantMap.get(summary.conversation_id);

      let participantId = '';
      let participantUsername: string | null = null;
      let participantProfilePic: string | null = null;

      if (participant) {
        participantUsername = participant.sender_username;
        participantId = participant.sender_id;
        participantProfilePic = participant.sender_profile_pic;
      } else if (lastMsg) {
        const senderIsAccount =
          accountUsername && lastMsg.sender_username?.toLowerCase() === accountUsername;
        if (!senderIsAccount && lastMsg.sender_username) {
          participantUsername = lastMsg.sender_username;
          participantId = lastMsg.sender_id;
          participantProfilePic = lastMsg.sender_profile_pic;
        } else if (lastMsg.recipient_username) {
          participantUsername = lastMsg.recipient_username;
          participantId = lastMsg.recipient_id;
        }
      }

      if (!participantProfilePic && participantUsername) {
        participantProfilePic = profilePicMap.get(participantUsername.toLowerCase()) || null;
      }

      const isIncoming =
        lastMsg?.is_incoming ?? lastMsg?.sender_username?.toLowerCase() !== accountUsername;

      return {
        conversationId: summary.conversation_id,
        participantId,
        participantUsername,
        participantProfilePic,
        lastMessage: lastMsg?.message_text || null,
        lastMessageAt: summary.last_message_at,
        lastIncomingMessageAt: summary.last_incoming_message_at,
        unreadCount: parseInt(summary.unread_count) || 0,
        incomingMessageCount: parseInt(summary.incoming_count) || 0,
        isIncoming: !!isIncoming,
      };
    });
  }

  async getConversationMessages(
    instagramAccountId: number,
    conversationId: string,
  ): Promise<(typeof instagramMessages.$inferSelect)[]> {
    return db
      .select()
      .from(instagramMessages)
      .where(
        and(
          eq(instagramMessages.instagramAccountId, instagramAccountId),
          eq(instagramMessages.conversationId, conversationId),
        ),
      )
      .orderBy(instagramMessages.sentAt);
  }

  async markMessagesAsRead(instagramAccountId: number, conversationId: string): Promise<void> {
    await db
      .update(instagramMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(instagramMessages.instagramAccountId, instagramAccountId),
          eq(instagramMessages.conversationId, conversationId),
          eq(instagramMessages.isIncoming, true),
        ),
      );
  }

  async markAllMessagesAsRead(instagramAccountId: number): Promise<number> {
    const result = await db
      .update(instagramMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(instagramMessages.instagramAccountId, instagramAccountId),
          eq(instagramMessages.isIncoming, true),
          eq(instagramMessages.isRead, false),
        ),
      )
      .returning({ id: instagramMessages.id });

    return result.length;
  }

  async getUnreadConversationCount(instagramAccountId: number): Promise<number> {
    // Count CONVERSATIONS with unread messages, not individual messages
    const result = await db
      .select({ count: sql<number>`count(distinct ${instagramMessages.conversationId})::int` })
      .from(instagramMessages)
      .where(
        and(
          eq(instagramMessages.instagramAccountId, instagramAccountId),
          eq(instagramMessages.isIncoming, true),
          eq(instagramMessages.isRead, false),
        ),
      );
    return result[0]?.count || 0;
  }

  // Fetch conversations from Instagram API and sync to local DB
  async syncConversationsFromAPI(
    accessToken: string,
    instagramAccountId: number,
    instagramUserId: string,
    accountUsername?: string,
    companyId?: number,
    onProgress?: (page: number, totalConversations: number, synced: number, errors: number) => void,
  ): Promise<{ synced: number; errors: number }> {
    let synced = 0;
    let errors = 0;
    const startTime = Date.now();

    try {
      let totalFetched = 0;
      const conversations = await this.getConversations(
        accessToken,
        instagramUserId,
        (page, pageConvs, hasMore) => {
          totalFetched += pageConvs.length;
          if (onProgress) {
            onProgress(page, totalFetched, 0, 0);
          }
        },
      );

      const allMsgIds = conversations.flatMap((c) =>
        (c.messages?.data || []).map((m: any) => m.id),
      );
      const existingMsgIds = new Set<string>();
      if (allMsgIds.length > 0) {
        const chunkSize = 500;
        for (let i = 0; i < allMsgIds.length; i += chunkSize) {
          const chunk = allMsgIds.slice(i, i + chunkSize);
          const rows = await db
            .select({ messageId: instagramMessages.messageId })
            .from(instagramMessages)
            .where(
              sql`${instagramMessages.messageId} IN (${sql.join(
                chunk.map((id) => sql`${id}`),
                sql`, `,
              )})`,
            );
          for (const row of rows) {
            existingMsgIds.add(row.messageId);
          }
        }
      }
      console.log(
        `[Instagram DM Sync] Pre-loaded ${existingMsgIds.size} existing message IDs from ${allMsgIds.length} total`,
      );

      let processedCount = 0;
      for (const conv of conversations) {
        try {
          const messages = conv.messages?.data || [];
          const newMessages = messages.filter((m: any) => !existingMsgIds.has(m.id));

          if (newMessages.length === 0) {
            processedCount++;
            if (onProgress && processedCount % 10 === 0) {
              onProgress(0, conversations.length, synced, errors);
            }
            continue;
          }

          const participants = conv.participants?.data || [];
          const otherParticipant = participants.find((p: any) => {
            if (accountUsername && p.username) {
              return p.username.toLowerCase() !== accountUsername.toLowerCase();
            }
            return p.id !== instagramUserId;
          });

          let otherParticipantProfilePic: string | null = null;
          const otherParticipantUsername = otherParticipant?.username;

          if (otherParticipant?.id && otherParticipantUsername) {
            const cacheKey = `user:${otherParticipantUsername.toLowerCase().replace('@', '')}`;
            if (this.profilePicCache.has(cacheKey)) {
              otherParticipantProfilePic = this.profilePicCache.get(cacheKey) || null;
            } else {
              otherParticipantProfilePic =
                await getProfilePicFromLocalData(otherParticipantUsername);

              if (!otherParticipantProfilePic) {
                try {
                  otherParticipantProfilePic = await this.getUserProfilePic(
                    accessToken,
                    otherParticipant.id,
                  );
                  if (otherParticipantProfilePic) {
                    console.log(
                      `[Instagram DM Sync] Got pic via User Profile API for @${otherParticipantUsername}`,
                    );
                  }
                } catch {}
              }

              this.profilePicCache.set(cacheKey, otherParticipantProfilePic || '');
            }
          }

          let dmContact: any = null;
          if (companyId && otherParticipantUsername) {
            try {
              dmContact = await upsertContact(companyId, {
                username: otherParticipantUsername,
                instagramUserId: otherParticipant?.id,
                profilePicUrl: otherParticipantProfilePic || undefined,
              });
            } catch (contactErr) {
              console.error('[Contacts] Error upserting DM contact:', contactErr);
            }
          }

          for (const msg of newMessages) {
            try {
              const isIncoming = isMessageIncoming({
                senderUsername: msg.from?.username,
                senderId: msg.from?.id,
                accountUsername,
                accountInstagramUserId: instagramUserId,
              });

              const senderProfilePic = isIncoming ? otherParticipantProfilePic : null;

              let messageType:
                | 'text'
                | 'image'
                | 'video'
                | 'audio'
                | 'file'
                | 'share'
                | 'story_mention'
                | 'story_reply' = 'text';
              let attachments: any[] | null = null;

              if (msg.attachments?.data && msg.attachments.data.length > 0) {
                attachments = msg.attachments.data.map((att: any) => {
                  let attType = att.type || 'file';
                  const attUrl =
                    att.image_data?.url ||
                    att.video_data?.url ||
                    att.audio_data?.url ||
                    att.file_url ||
                    att.url;

                  if (att.image_data) attType = 'image';
                  else if (att.video_data) attType = 'video';
                  else if (att.audio_data) attType = 'audio';

                  return {
                    type: attType,
                    url: attUrl,
                    preview: att.image_data?.preview_url,
                    width: att.image_data?.width || att.video_data?.width,
                    height: att.image_data?.height || att.video_data?.height,
                  };
                });

                const firstAtt = msg.attachments.data[0];
                if (firstAtt.image_data || firstAtt.type === 'image') {
                  messageType = 'image';
                } else if (firstAtt.video_data || firstAtt.type === 'video') {
                  messageType = 'video';
                } else if (firstAtt.audio_data || firstAtt.type === 'audio') {
                  messageType = 'audio';
                } else if (firstAtt.type === 'share') {
                  messageType = 'share';
                } else if (firstAtt.type === 'story_mention') {
                  messageType = 'story_mention';
                } else {
                  messageType = 'file';
                }
              }

              const sentAt = msg.created_time ? new Date(msg.created_time) : new Date();

              await this.saveMessage({
                instagramAccountId,
                conversationId: conv.id,
                messageId: msg.id,
                senderId: msg.from?.id || '',
                senderUsername: msg.from?.username,
                senderProfilePic,
                recipientId: isIncoming ? instagramUserId : otherParticipant?.id || '',
                recipientUsername: isIncoming ? undefined : otherParticipant?.username,
                messageText: msg.message,
                messageType,
                attachments,
                isIncoming,
                sentAt,
              });
              synced++;

              if (dmContact && companyId) {
                try {
                  await recordInteraction({
                    contactId: dmContact.id,
                    companyId,
                    type: isIncoming ? 'dm_received' : 'dm_sent',
                    referenceId: msg.id,
                    contentPreview: msg.message ? msg.message.substring(0, 100) : undefined,
                    occurredAt: sentAt,
                  });
                } catch (interactionErr) {}
              }
            } catch (msgErr) {
              errors++;
            }
          }
        } catch (e) {
          console.error('[Instagram] Error syncing conversation:', e);
          errors++;
        }
        processedCount++;
        if (onProgress && processedCount % 5 === 0) {
          onProgress(0, conversations.length, synced, errors);
        }
      }
    } catch (e) {
      console.error('[Instagram] Error fetching conversations:', e);
      errors++;
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Instagram DM Sync] Completed in ${elapsed}s: ${synced} synced, ${errors} errors`);
    return { synced, errors };
  }

  // Get comments for a specific media post
  async getMediaComments(accessToken: string, mediaId: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${INSTAGRAM_GRAPH_BASE_URL}/${mediaId}/comments?fields=id,text,timestamp,username,like_count,replies{id,text,timestamp,username,like_count}&access_token=${accessToken}`,
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('[Instagram] Get media comments failed:', error);
        return [];
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('[Instagram] Get media comments error:', error);
      return [];
    }
  }

  // Sync all posts and their comments for an Instagram account
  async syncPostsAndComments(
    instagramAccountId: number,
    companyId?: number,
  ): Promise<{ postsSync: number; commentsSync: number; errors: number }> {
    let postsSync = 0;
    let commentsSync = 0;
    let errors = 0;

    try {
      // Get the account
      const [account] = await db
        .select()
        .from(instagramAccounts)
        .where(eq(instagramAccounts.id, instagramAccountId));

      if (!account || !account.accessToken) {
        console.error('[Instagram] Account not found or no access token');
        return { postsSync: 0, commentsSync: 0, errors: 1 };
      }

      // Fetch posts from Instagram API
      const posts = await this.getUserMedia(account.accessToken, account.instagramUserId, 50);

      for (const post of posts) {
        try {
          // Save or update post
          const existingPost = await db
            .select()
            .from(instagramPosts)
            .where(eq(instagramPosts.instagramMediaId, post.id))
            .limit(1);

          let postDbId: number;

          if (existingPost.length === 0) {
            // Insert new post
            const [newPost] = await db
              .insert(instagramPosts)
              .values({
                instagramAccountId,
                instagramMediaId: post.id,
                mediaType: post.media_type,
                mediaUrl: post.media_url,
                thumbnailUrl: post.thumbnail_url,
                permalink: post.permalink,
                caption: post.caption,
                timestamp: post.timestamp ? new Date(post.timestamp) : null,
                likeCount: post.like_count || 0,
                commentsCount: post.comments_count || 0,
              })
              .returning({ id: instagramPosts.id });
            postDbId = newPost.id;
            postsSync++;
          } else {
            // Update existing post metrics
            await db
              .update(instagramPosts)
              .set({
                likeCount: post.like_count || 0,
                commentsCount: post.comments_count || 0,
                updatedAt: new Date(),
              })
              .where(eq(instagramPosts.id, existingPost[0].id));
            postDbId = existingPost[0].id;
          }

          // Fetch comments for this post and store as JSON in instagram_posts.comments_data
          const comments = await this.getMediaComments(account.accessToken, post.id);

          if (comments.length > 0) {
            try {
              const commentsJson = comments.map((comment: any) => ({
                commentId: comment.id,
                username: comment.username,
                text: comment.text,
                likeCount: comment.like_count || 0,
                repliesCount: comment.replies?.data?.length || 0,
                timestamp: comment.timestamp,
                replies:
                  comment.replies?.data?.map((reply: any) => ({
                    commentId: reply.id,
                    username: reply.username,
                    text: reply.text,
                    likeCount: reply.like_count || 0,
                    timestamp: reply.timestamp,
                  })) || [],
              }));

              await db
                .update(instagramPosts)
                .set({ commentsData: commentsJson })
                .where(eq(instagramPosts.id, postDbId));

              commentsSync += comments.length;

              const resolvedCompanyId = companyId || account.companyId;
              if (resolvedCompanyId) {
                for (const comment of comments) {
                  try {
                    if (comment.username) {
                      const commentContact = await upsertContact(resolvedCompanyId, {
                        username: comment.username,
                      });
                      await recordInteraction({
                        contactId: commentContact.id,
                        companyId: resolvedCompanyId,
                        type: 'comment_on_post',
                        referenceId: comment.id,
                        contentPreview: comment.text ? comment.text.substring(0, 100) : undefined,
                        occurredAt: new Date(comment.timestamp),
                        metadata: { postId: post.id, permalink: post.permalink },
                      });
                    }

                    if (comment.replies?.data) {
                      for (const reply of comment.replies.data) {
                        if (reply.username) {
                          const replyContact = await upsertContact(resolvedCompanyId, {
                            username: reply.username,
                          });
                          await recordInteraction({
                            contactId: replyContact.id,
                            companyId: resolvedCompanyId,
                            type: 'comment_on_post',
                            referenceId: reply.id,
                            contentPreview: reply.text ? reply.text.substring(0, 100) : undefined,
                            occurredAt: new Date(reply.timestamp),
                            metadata: {
                              postId: post.id,
                              permalink: post.permalink,
                              parentCommentId: comment.id,
                            },
                          });
                        }
                      }
                    }
                  } catch (contactErr) {
                    console.error('[Contacts] Error tracking comment contact:', contactErr);
                  }
                }
              }
            } catch (commentErr) {
              console.error(`[Instagram] Error saving comments for post ${post.id}:`, commentErr);
              errors++;
            }
          }
        } catch (e) {
          console.error('[Instagram] Error syncing post:', e);
          errors++;
        }
      }
    } catch (e) {
      console.error('[Instagram] Error in syncPostsAndComments:', e);
      errors++;
    }

    console.log(
      `[Instagram] Synced ${postsSync} posts and ${commentsSync} comments with ${errors} errors`,
    );
    return { postsSync, commentsSync, errors };
  }

  async getEngagementByUsername(
    instagramAccountId: number,
    username: string,
  ): Promise<{ commentsCount: number; repliesCount: number }> {
    const result = await db.execute(sql`
      SELECT 
        COUNT(*) as comment_count,
        COALESCE(SUM((c->>'repliesCount')::int), 0) as total_replies
      FROM instagram_posts p,
        jsonb_array_elements(p.comments_data) AS c
      WHERE p.instagram_account_id = ${instagramAccountId}
        AND LOWER(c->>'username') = LOWER(${username})
    `);

    const row = result.rows?.[0];
    return {
      commentsCount: Number(row?.comment_count || 0),
      repliesCount: Number(row?.total_replies || 0),
    };
  }

  // Get cached profile data
  async getCachedProfile(username: string): Promise<typeof instagramProfiles.$inferSelect | null> {
    const cleanUsername = username.replace('@', '').toLowerCase().trim();
    const [cached] = await db
      .select()
      .from(instagramProfiles)
      .where(sql`LOWER(${instagramProfiles.username}) = ${cleanUsername}`)
      .limit(1);

    return cached || null;
  }

  // Save profile to cache
  async saveProfileToCache(data: {
    username: string;
    fullName?: string | null;
    bio?: string | null;
    profilePicUrl?: string | null;
    followers?: number | null;
    following?: number | null;
    postsCount?: number | null;
    isVerified?: boolean | null;
    isPrivate?: boolean | null;
    externalUrl?: string | null;
    totalLikes?: number | null;
    totalComments?: number | null;
    avgLikes?: number | null;
    avgComments?: number | null;
    ownerType?: 'user' | 'company' | 'external';
    source?: 'manual' | 'apify' | 'oauth' | 'api';
  }): Promise<void> {
    const cleanUsername = data.username.replace('@', '').toLowerCase().trim();
    const ownerType = data.ownerType || 'external';
    const source = data.source || 'api';

    // Use upsert - save as external profile by default
    await db
      .insert(instagramProfiles)
      .values({
        username: cleanUsername,
        ownerType,
        source,
        fullName: data.fullName,
        bio: data.bio,
        profilePicUrl: data.profilePicUrl,
        followers: data.followers,
        following: data.following,
        postsCount: data.postsCount,
        isVerified: data.isVerified,
        isPrivate: data.isPrivate,
        externalUrl: data.externalUrl,
        totalLikes: data.totalLikes,
        totalComments: data.totalComments,
        avgLikes: data.avgLikes,
        avgComments: data.avgComments,
        lastFetchedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [instagramProfiles.username, instagramProfiles.ownerType],
        set: {
          fullName: data.fullName,
          bio: data.bio,
          profilePicUrl: data.profilePicUrl,
          followers: data.followers,
          following: data.following,
          postsCount: data.postsCount,
          isVerified: data.isVerified,
          isPrivate: data.isPrivate,
          externalUrl: data.externalUrl,
          totalLikes: data.totalLikes,
          totalComments: data.totalComments,
          avgLikes: data.avgLikes,
          avgComments: data.avgComments,
          lastFetchedAt: new Date(),
          updatedAt: new Date(),
        },
      });
  }

  // Get message stats for a username in a company's DMs
  async getMessageStats(
    instagramAccountId: number,
    username: string,
  ): Promise<{
    totalIncoming: number;
    totalOutgoing: number;
    firstMessageAt: Date | null;
    lastMessageAt: Date | null;
  }> {
    const cleanUsername = username.replace('@', '').toLowerCase().trim();

    const result = await db
      .select({
        totalIncoming: sql<number>`COUNT(*) FILTER (WHERE ${instagramMessages.isIncoming} = true)`,
        totalOutgoing: sql<number>`COUNT(*) FILTER (WHERE ${instagramMessages.isIncoming} = false)`,
        firstMessageAt: sql<Date>`MIN(${instagramMessages.sentAt})`,
        lastMessageAt: sql<Date>`MAX(${instagramMessages.sentAt})`,
      })
      .from(instagramMessages)
      .where(
        and(
          eq(instagramMessages.instagramAccountId, instagramAccountId),
          sql`LOWER(${instagramMessages.senderUsername}) = ${cleanUsername} OR LOWER(${instagramMessages.recipientUsername}) = ${cleanUsername}`,
        ),
      );

    return {
      totalIncoming: Number(result[0]?.totalIncoming || 0),
      totalOutgoing: Number(result[0]?.totalOutgoing || 0),
      firstMessageAt: result[0]?.firstMessageAt || null,
      lastMessageAt: result[0]?.lastMessageAt || null,
    };
  }
  async syncFullHistory(
    instagramAccountId: number,
    onProgress?: (progress: { page: number; totalFetched: number; done: boolean }) => void,
  ): Promise<{ postsSync: number; commentsSync: number; errors: number; totalPages: number }> {
    let postsSync = 0;
    const commentsSync = 0;
    let errors = 0;
    let totalPages = 0;

    try {
      const [account] = await db
        .select()
        .from(instagramAccounts)
        .where(eq(instagramAccounts.id, instagramAccountId));

      if (!account || !account.accessToken) {
        console.error('[Instagram FullSync] Account not found or no access token');
        return { postsSync: 0, commentsSync: 0, errors: 1, totalPages: 0 };
      }

      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const fields =
        'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count';
      let nextCursor: string | null = null;
      let hasMore = true;
      const maxPages = 20;

      while (hasMore && totalPages < maxPages) {
        totalPages++;
        let url = `${INSTAGRAM_GRAPH_BASE_URL}/${account.instagramUserId}/media?fields=${fields}&limit=50&access_token=${account.accessToken}`;
        if (nextCursor) {
          url += `&after=${nextCursor}`;
        }

        let response: Response;
        try {
          response = await fetch(url);
        } catch (fetchErr) {
          console.error(`[Instagram FullSync] Network error on page ${totalPages}:`, fetchErr);
          errors++;
          break;
        }

        if (!response.ok) {
          const errText = await response.text();
          console.error(`[Instagram FullSync] API error on page ${totalPages}:`, errText);
          errors++;
          break;
        }

        const data = await response.json();
        const posts = data.data || [];

        if (posts.length === 0) {
          hasMore = false;
          break;
        }

        let reachedOldPost = false;

        for (const post of posts) {
          try {
            const postTimestamp = post.timestamp ? new Date(post.timestamp) : null;
            if (postTimestamp && postTimestamp < oneYearAgo) {
              reachedOldPost = true;
              break;
            }

            const hashtags: string[] = [];
            const mentionedAccounts: string[] = [];
            if (post.caption) {
              const hashtagMatches = post.caption.match(/#(\w+)/g);
              if (hashtagMatches) {
                hashtags.push(...hashtagMatches.map((h: string) => h.slice(1)));
              }
              const mentionMatches = post.caption.match(/@(\w+)/g);
              if (mentionMatches) {
                mentionedAccounts.push(...mentionMatches.map((m: string) => m.slice(1)));
              }
            }

            let insights: any = null;
            try {
              insights = await this.getMediaInsights(account.accessToken!, post.id);
            } catch (_insightErr) {}

            const existingPost = await db
              .select()
              .from(instagramPosts)
              .where(eq(instagramPosts.instagramMediaId, post.id))
              .limit(1);

            if (existingPost.length === 0) {
              await db.insert(instagramPosts).values({
                instagramAccountId,
                instagramMediaId: post.id,
                mediaType: post.media_type,
                mediaUrl: post.media_url,
                thumbnailUrl: post.thumbnail_url,
                permalink: post.permalink,
                caption: post.caption,
                timestamp: postTimestamp,
                likeCount: post.like_count || 0,
                commentsCount: post.comments_count || 0,
                hashtags: hashtags.length > 0 ? hashtags : null,
                mentionedAccounts: mentionedAccounts.length > 0 ? mentionedAccounts : null,
                impressionsCount: insights?.impressions || null,
                reachCount: insights?.reach || null,
                savedCount: insights?.saved || null,
              });
              postsSync++;
            } else {
              await db
                .update(instagramPosts)
                .set({
                  likeCount: post.like_count || 0,
                  commentsCount: post.comments_count || 0,
                  mediaUrl: post.media_url,
                  thumbnailUrl: post.thumbnail_url,
                  hashtags: hashtags.length > 0 ? hashtags : existingPost[0].hashtags,
                  mentionedAccounts:
                    mentionedAccounts.length > 0
                      ? mentionedAccounts
                      : existingPost[0].mentionedAccounts,
                  impressionsCount: insights?.impressions ?? existingPost[0].impressionsCount,
                  reachCount: insights?.reach ?? existingPost[0].reachCount,
                  savedCount: insights?.saved ?? existingPost[0].savedCount,
                  updatedAt: new Date(),
                })
                .where(eq(instagramPosts.id, existingPost[0].id));
            }
          } catch (postErr) {
            console.error(`[Instagram FullSync] Error processing post ${post.id}:`, postErr);
            errors++;
          }
        }

        if (reachedOldPost) {
          hasMore = false;
        } else {
          nextCursor = data.paging?.cursors?.after || null;
          hasMore = !!nextCursor && !!data.paging?.next;
        }

        if (onProgress) {
          onProgress({
            page: totalPages,
            totalFetched: postsSync,
            done: !hasMore || totalPages >= maxPages,
          });
        }

        console.log(
          `[Instagram FullSync] Page ${totalPages}: ${posts.length} posts fetched, ${postsSync} saved/updated`,
        );

        if (hasMore && totalPages < maxPages) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      console.log(
        `[Instagram FullSync] Complete: ${postsSync} posts, ${totalPages} pages, ${errors} errors`,
      );
    } catch (err) {
      console.error('[Instagram FullSync] Fatal error:', err);
      errors++;
    }

    return { postsSync, commentsSync, errors, totalPages };
  }
}

export const instagramService = new InstagramService();
