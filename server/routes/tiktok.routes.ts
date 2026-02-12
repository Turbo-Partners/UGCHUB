import { Express, Request, Response } from "express";
import crypto from "crypto";
import { db } from "../db";
import { tiktokProfiles, tiktokVideos, users } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import * as tiktokService from "../services/tiktok";

export function registerTikTokRoutes(app: Express): void {
  // ==================== OAuth Flow ====================

  /**
   * GET /api/tiktok/oauth/authorize
   * Starts the TikTok OAuth flow. Redirects user to TikTok consent screen.
   */
  app.get("/api/tiktok/oauth/authorize", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.redirect("/auth?error=not_authenticated");
    }

    const user = req.user as any;
    const returnTo = (req.query.returnTo as string) || "";
    const safeReturnTo = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "";

    // Generate CSRF state
    const state = crypto.randomBytes(32).toString("hex");
    req.session.tiktokOAuthState = {
      nonce: state,
      userId: user.id,
      timestamp: Date.now(),
      returnTo: safeReturnTo || undefined,
    };

    const authUrl = tiktokService.buildAuthorizationUrl(state);
    console.log(`[TikTok OAuth] Starting OAuth for user ${user.id}`);
    res.redirect(authUrl);
  });

  /**
   * GET /api/tiktok/oauth/callback
   * Handles the redirect from TikTok after user authorizes.
   */
  app.get("/api/tiktok/oauth/callback", async (req: Request, res: Response) => {
    const { code, state, error, error_description } = req.query;
    const savedState = req.session.tiktokOAuthState;
    const redirectBase = savedState?.returnTo || "/settings";

    // Handle user denial
    if (error) {
      console.error("[TikTok OAuth] Error from TikTok:", error, error_description);
      delete req.session.tiktokOAuthState;
      return res.redirect(`${redirectBase}?error=oauth_denied&message=${encodeURIComponent(String(error_description || error))}`);
    }

    if (!code || typeof code !== "string") {
      console.error("[TikTok OAuth] No code received");
      return res.redirect(`${redirectBase}?error=no_code`);
    }

    // Validate CSRF state
    if (!savedState || savedState.nonce !== state) {
      console.error("[TikTok OAuth] State mismatch - CSRF protection triggered");
      return res.redirect(`${redirectBase}?error=invalid_state`);
    }

    // Check state expiration (5 minutes)
    if (Date.now() - savedState.timestamp > 5 * 60 * 1000) {
      console.error("[TikTok OAuth] State expired");
      delete req.session.tiktokOAuthState;
      return res.redirect(`${redirectBase}?error=state_expired`);
    }

    try {
      // Exchange code for tokens
      console.log("[TikTok OAuth] Exchanging code for token...");
      const tokenData = await tiktokService.exchangeCodeForToken(code);

      console.log(`[TikTok OAuth] Got tokens for open_id: ${tokenData.open_id}, scope: ${tokenData.scope}`);

      // Fetch user profile
      const userInfo = await tiktokService.getUserInfo(tokenData.access_token);
      console.log(`[TikTok OAuth] Got profile: @${userInfo.username || userInfo.display_name}, followers: ${userInfo.follower_count}`);

      const now = new Date();
      const tokenExpiresAt = tiktokService.calculateExpiresAt(tokenData.expires_in);
      const refreshTokenExpiresAt = tiktokService.calculateExpiresAt(tokenData.refresh_expires_in);

      const uniqueId = userInfo.username || tokenData.open_id;

      // Check if profile already exists (by openId or uniqueId)
      const [existingByOpenId] = await db
        .select()
        .from(tiktokProfiles)
        .where(eq(tiktokProfiles.openId, tokenData.open_id))
        .limit(1);

      const [existingByUsername] = !existingByOpenId
        ? await db
            .select()
            .from(tiktokProfiles)
            .where(eq(tiktokProfiles.uniqueId, uniqueId))
            .limit(1)
        : [null];

      const existing = existingByOpenId || existingByUsername;

      const profileData = {
        uniqueId,
        userId: tokenData.open_id,
        nickname: userInfo.display_name || null,
        avatarUrl: userInfo.avatar_large_url || userInfo.avatar_url || null,
        signature: userInfo.bio_description || null,
        verified: userInfo.is_verified || false,
        followers: userInfo.follower_count || 0,
        following: userInfo.following_count || 0,
        hearts: userInfo.likes_count || 0,
        videoCount: userInfo.video_count || 0,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt,
        refreshTokenExpiresAt,
        scope: tokenData.scope,
        openId: tokenData.open_id,
        unionId: userInfo.union_id || null,
        connectedByUserId: savedState.userId,
        connectedAt: now,
        disconnectedAt: null,
        lastSyncedAt: now,
        lastFetchedAt: now,
        syncStatus: "active" as const,
        syncError: null,
        updatedAt: now,
      };

      if (existing) {
        // Check if already connected to another user
        if (existing.connectedByUserId && existing.connectedByUserId !== savedState.userId && existing.syncStatus === "active") {
          console.error(`[TikTok OAuth] Account @${uniqueId} already connected to user ${existing.connectedByUserId}`);
          delete req.session.tiktokOAuthState;
          return res.redirect(`${redirectBase}?error=account_taken&message=${encodeURIComponent("Esta conta TikTok já está conectada a outro usuário")}`);
        }

        await db
          .update(tiktokProfiles)
          .set(profileData)
          .where(eq(tiktokProfiles.id, existing.id));
        console.log(`[TikTok OAuth] Updated profile: @${uniqueId}`);
      } else {
        await db.insert(tiktokProfiles).values({
          ...profileData,
          createdAt: now,
        });
        console.log(`[TikTok OAuth] Created new profile: @${uniqueId}`);
      }

      // Update user's tiktok field if it's a creator
      const [user] = await db
        .select({ role: users.role, tiktok: users.tiktok })
        .from(users)
        .where(eq(users.id, savedState.userId))
        .limit(1);

      if (user && (!user.tiktok || user.tiktok !== `@${uniqueId}`)) {
        await db
          .update(users)
          .set({ tiktok: `@${uniqueId}` })
          .where(eq(users.id, savedState.userId));
      }

      // Clean up session
      delete req.session.tiktokOAuthState;

      console.log(`[TikTok OAuth] Success! Redirecting to ${redirectBase}`);
      res.redirect(`${redirectBase}?tiktok=connected&username=${encodeURIComponent(uniqueId)}`);
    } catch (err: any) {
      console.error("[TikTok OAuth] Callback error:", err);
      delete req.session.tiktokOAuthState;
      res.redirect(`${redirectBase}?error=oauth_error&message=${encodeURIComponent(err.message || "Erro ao conectar TikTok")}`);
    }
  });

  // ==================== Account Management ====================

  /**
   * GET /api/tiktok/account
   * Check if the current user has a connected TikTok account.
   */
  app.get("/api/tiktok/account", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const user = req.user as any;

    try {
      const [profile] = await db
        .select()
        .from(tiktokProfiles)
        .where(
          and(
            eq(tiktokProfiles.connectedByUserId, user.id),
            eq(tiktokProfiles.syncStatus, "active"),
          ),
        )
        .limit(1);

      if (!profile) {
        return res.json({ connected: false });
      }

      res.json({
        connected: true,
        account: {
          id: profile.id,
          uniqueId: profile.uniqueId,
          nickname: profile.nickname,
          avatarUrl: profile.avatarUrl,
          verified: profile.verified,
          followers: profile.followers,
          following: profile.following,
          hearts: profile.hearts,
          videoCount: profile.videoCount,
          signature: profile.signature,
          lastSyncedAt: profile.lastSyncedAt,
          connectedAt: profile.connectedAt,
          tokenExpired: tiktokService.isTokenExpired(profile.tokenExpiresAt),
        },
      });
    } catch (err: any) {
      console.error("[TikTok] Error fetching account:", err);
      res.status(500).json({ error: "Erro ao buscar conta TikTok" });
    }
  });

  /**
   * POST /api/tiktok/oauth/disconnect
   * Disconnect the user's TikTok account.
   */
  app.post("/api/tiktok/oauth/disconnect", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const user = req.user as any;

    try {
      const [profile] = await db
        .select()
        .from(tiktokProfiles)
        .where(
          and(
            eq(tiktokProfiles.connectedByUserId, user.id),
            eq(tiktokProfiles.syncStatus, "active"),
          ),
        )
        .limit(1);

      if (!profile) {
        return res.status(404).json({ error: "Nenhuma conta TikTok conectada" });
      }

      // Revoke token at TikTok (best effort)
      if (profile.accessToken) {
        await tiktokService.revokeToken(profile.accessToken);
      }

      // Mark as disconnected locally
      await db
        .update(tiktokProfiles)
        .set({
          syncStatus: "disconnected",
          disconnectedAt: new Date(),
          accessToken: null,
          refreshToken: null,
          tokenExpiresAt: null,
          refreshTokenExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(tiktokProfiles.id, profile.id));

      console.log(`[TikTok] User ${user.id} disconnected @${profile.uniqueId}`);
      res.json({ success: true, message: "TikTok desconectado com sucesso" });
    } catch (err: any) {
      console.error("[TikTok] Error disconnecting:", err);
      res.status(500).json({ error: "Erro ao desconectar TikTok" });
    }
  });

  // ==================== Data Endpoints ====================

  /**
   * POST /api/tiktok/sync
   * Force a manual sync of the connected TikTok profile data.
   */
  app.post("/api/tiktok/sync", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const user = req.user as any;

    try {
      const [profile] = await db
        .select()
        .from(tiktokProfiles)
        .where(
          and(
            eq(tiktokProfiles.connectedByUserId, user.id),
            eq(tiktokProfiles.syncStatus, "active"),
          ),
        )
        .limit(1);

      if (!profile || !profile.accessToken) {
        return res.status(404).json({ error: "Nenhuma conta TikTok conectada" });
      }

      let accessToken = profile.accessToken;

      // Refresh token if expired
      if (tiktokService.isTokenExpired(profile.tokenExpiresAt)) {
        if (!profile.refreshToken || tiktokService.isRefreshTokenExpired(profile.refreshTokenExpiresAt)) {
          await db
            .update(tiktokProfiles)
            .set({ syncStatus: "error", syncError: "Refresh token expirado. Reconecte sua conta TikTok.", updatedAt: new Date() })
            .where(eq(tiktokProfiles.id, profile.id));
          return res.status(401).json({ error: "Token expirado. Reconecte sua conta TikTok." });
        }

        console.log(`[TikTok Sync] Refreshing token for @${profile.uniqueId}`);
        const newTokens = await tiktokService.refreshAccessToken(profile.refreshToken);
        accessToken = newTokens.access_token;

        await db
          .update(tiktokProfiles)
          .set({
            accessToken: newTokens.access_token,
            refreshToken: newTokens.refresh_token,
            tokenExpiresAt: tiktokService.calculateExpiresAt(newTokens.expires_in),
            refreshTokenExpiresAt: tiktokService.calculateExpiresAt(newTokens.refresh_expires_in),
            updatedAt: new Date(),
          })
          .where(eq(tiktokProfiles.id, profile.id));
      }

      // Fetch latest user info
      const userInfo = await tiktokService.getUserInfo(accessToken);

      const now = new Date();
      await db
        .update(tiktokProfiles)
        .set({
          nickname: userInfo.display_name || profile.nickname,
          avatarUrl: userInfo.avatar_large_url || userInfo.avatar_url || profile.avatarUrl,
          signature: userInfo.bio_description || profile.signature,
          verified: userInfo.is_verified ?? profile.verified,
          followers: userInfo.follower_count ?? profile.followers,
          following: userInfo.following_count ?? profile.following,
          hearts: userInfo.likes_count ?? profile.hearts,
          videoCount: userInfo.video_count ?? profile.videoCount,
          lastSyncedAt: now,
          lastFetchedAt: now,
          syncError: null,
          updatedAt: now,
        })
        .where(eq(tiktokProfiles.id, profile.id));

      // Fetch and save recent videos
      try {
        const videoResponse = await tiktokService.listUserVideos(accessToken);
        if (videoResponse.videos.length > 0) {
          for (const video of videoResponse.videos) {
            const videoData = {
              videoId: video.id,
              authorUniqueId: profile.uniqueId,
              description: video.video_description || video.title || null,
              coverUrl: video.cover_image_url || null,
              videoUrl: video.share_url || null,
              duration: video.duration || null,
              diggCount: video.like_count || 0,
              shareCount: video.share_count || 0,
              commentCount: video.comment_count || 0,
              playCount: video.view_count || 0,
              postedAt: video.create_time ? new Date(video.create_time * 1000) : null,
              updatedAt: now,
            };

            await db
              .insert(tiktokVideos)
              .values({ ...videoData, createdAt: now })
              .onConflictDoUpdate({
                target: tiktokVideos.videoId,
                set: videoData,
              });
          }
          console.log(`[TikTok Sync] Saved ${videoResponse.videos.length} videos for @${profile.uniqueId}`);
        }
      } catch (videoErr: any) {
        console.error(`[TikTok Sync] Error fetching videos for @${profile.uniqueId}:`, videoErr.message);
        // Don't fail the whole sync for video errors
      }

      console.log(`[TikTok Sync] Completed for @${profile.uniqueId}`);
      res.json({
        success: true,
        profile: {
          uniqueId: profile.uniqueId,
          nickname: userInfo.display_name,
          followers: userInfo.follower_count,
          following: userInfo.following_count,
          hearts: userInfo.likes_count,
          videoCount: userInfo.video_count,
          lastSyncedAt: now,
        },
      });
    } catch (err: any) {
      console.error("[TikTok Sync] Error:", err);
      res.status(500).json({ error: "Erro ao sincronizar dados do TikTok" });
    }
  });

  /**
   * GET /api/tiktok/videos
   * Fetch videos for the connected TikTok account (from local DB).
   */
  app.get("/api/tiktok/videos", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const user = req.user as any;

    try {
      const [profile] = await db
        .select()
        .from(tiktokProfiles)
        .where(
          and(
            eq(tiktokProfiles.connectedByUserId, user.id),
            eq(tiktokProfiles.syncStatus, "active"),
          ),
        )
        .limit(1);

      if (!profile) {
        return res.status(404).json({ error: "Nenhuma conta TikTok conectada" });
      }

      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

      const videos = await db
        .select()
        .from(tiktokVideos)
        .where(eq(tiktokVideos.authorUniqueId, profile.uniqueId))
        .orderBy(desc(tiktokVideos.postedAt))
        .limit(limit);

      res.json({ videos, total: videos.length });
    } catch (err: any) {
      console.error("[TikTok] Error fetching videos:", err);
      res.status(500).json({ error: "Erro ao buscar vídeos" });
    }
  });

  console.log("[Routes] TikTok routes registered");
}
