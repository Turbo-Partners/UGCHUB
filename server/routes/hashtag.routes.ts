import { Router, Request, Response } from "express";
import { instagramHashtagService } from "../services/instagram-hashtags";
import { instagramService } from "../services/instagram";

export function registerHashtagRoutes(app: Router) {

  app.get("/api/instagram/hashtags/usage", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

    const companyId = req.session.activeCompanyId;
    if (!companyId) return res.status(400).json({ error: "No active company" });

    try {
      const account = await instagramService.getInstagramAccountByCompanyId(companyId);
      if (!account) return res.status(404).json({ error: "Instagram not connected" });

      const usage = await instagramHashtagService.getWeeklySearchCount(account.instagramUserId);
      res.json(usage);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/instagram/hashtags/search", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

    const companyId = req.session.activeCompanyId;
    if (!companyId) return res.status(400).json({ error: "No active company" });

    const { hashtag } = req.body;
    if (!hashtag) return res.status(400).json({ error: "Hashtag is required" });

    try {
      const account = await instagramService.getInstagramAccountByCompanyId(companyId);
      if (!account?.accessToken) return res.status(404).json({ error: "Instagram not connected" });

      const result = await instagramHashtagService.searchHashtag(
        account.accessToken, account.instagramUserId, hashtag, companyId
      );

      if (!result) return res.status(404).json({ error: "Hashtag not found" });

      const [topMedia, recentMedia] = await Promise.all([
        instagramHashtagService.getHashtagMedia(account.accessToken, account.instagramUserId, result.hashtagId, "top_media"),
        instagramHashtagService.getHashtagMedia(account.accessToken, account.instagramUserId, result.hashtagId, "recent_media"),
      ]);

      const usage = await instagramHashtagService.getWeeklySearchCount(account.instagramUserId);

      res.json({
        hashtag: result,
        topMedia,
        recentMedia,
        usage,
      });
    } catch (error: any) {
      res.status(error.message?.includes("Limite") ? 429 : 500).json({ error: error.message });
    }
  });

  app.post("/api/instagram/hashtags/campaign", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

    const companyId = req.session.activeCompanyId;
    if (!companyId) return res.status(400).json({ error: "No active company" });

    const { campaignId, hashtag } = req.body;
    if (!campaignId || !hashtag) return res.status(400).json({ error: "campaignId and hashtag required" });

    try {
      const account = await instagramService.getInstagramAccountByCompanyId(companyId);
      if (!account?.accessToken) return res.status(404).json({ error: "Instagram not connected" });

      let hashtagId: string | undefined;
      try {
        const searchResult = await instagramHashtagService.searchHashtag(
          account.accessToken, account.instagramUserId, hashtag, companyId
        );
        hashtagId = searchResult?.hashtagId;
      } catch {}

      const result = await instagramHashtagService.addCampaignHashtag(campaignId, companyId, hashtag, hashtagId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/instagram/hashtags/campaign/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

    const companyId = req.session.activeCompanyId;
    if (!companyId) return res.status(400).json({ error: "No active company" });

    try {
      await instagramHashtagService.removeCampaignHashtag(parseInt(req.params.id), companyId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/instagram/hashtags/campaign/:campaignId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

    try {
      const hashtags = await instagramHashtagService.getCampaignHashtags(parseInt(req.params.campaignId));
      res.json(hashtags);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/instagram/hashtags/campaign/:id/refresh", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

    const companyId = req.session.activeCompanyId;
    if (!companyId) return res.status(400).json({ error: "No active company" });

    try {
      const account = await instagramService.getInstagramAccountByCompanyId(companyId);
      if (!account?.accessToken) return res.status(404).json({ error: "Instagram not connected" });

      const campaignHashtagId = parseInt(req.params.id);

      const { db } = await import("../db");
      const { campaignHashtags: campaignHashtagsTable } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");

      const [campaignHashtag] = await db.select()
        .from(campaignHashtagsTable)
        .where(and(
          eq(campaignHashtagsTable.id, campaignHashtagId),
          eq(campaignHashtagsTable.companyId, companyId)
        ))
        .limit(1);

      if (!campaignHashtag) return res.status(404).json({ error: "Hashtag not found" });

      let hashtagId = campaignHashtag.hashtagId;

      if (!hashtagId) {
        const searchResult = await instagramHashtagService.searchHashtag(
          account.accessToken, account.instagramUserId, campaignHashtag.hashtag, companyId
        );
        if (!searchResult) return res.status(404).json({ error: "Hashtag not found on Instagram" });
        hashtagId = searchResult.hashtagId;

        await db.update(campaignHashtagsTable)
          .set({ hashtagId })
          .where(eq(campaignHashtagsTable.id, campaignHashtagId));
      }

      const [topMedia, recentMedia] = await Promise.all([
        instagramHashtagService.getHashtagMedia(account.accessToken, account.instagramUserId, hashtagId, "top_media"),
        instagramHashtagService.getHashtagMedia(account.accessToken, account.instagramUserId, hashtagId, "recent_media"),
      ]);

      const [topSaved, recentSaved] = await Promise.all([
        instagramHashtagService.saveHashtagPosts(campaignHashtagId, companyId, topMedia, "top"),
        instagramHashtagService.saveHashtagPosts(campaignHashtagId, companyId, recentMedia, "recent"),
      ]);

      res.json({
        topMedia: topMedia.length,
        recentMedia: recentMedia.length,
        topSaved,
        recentSaved,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/instagram/hashtags/campaign/:id/posts", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    try {
      const posts = await instagramHashtagService.getHashtagPostsList(parseInt(req.params.id), limit, offset);
      res.json(posts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/instagram/hashtags/stats", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

    const companyId = req.session.activeCompanyId;
    if (!companyId) return res.status(400).json({ error: "No active company" });

    try {
      const stats = await instagramHashtagService.getCompanyHashtagStats(companyId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
