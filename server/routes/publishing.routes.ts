import { Router, Request, Response } from "express";
import { z } from "zod";
import { instagramPublishingService } from "../services/instagram-publishing";
import { instagramService } from "../services/instagram";

const publishImageSchema = z.object({
  imageUrl: z.string().url(),
  caption: z.string().max(2200).optional(),
  locationId: z.string().optional(),
  userTags: z.array(z.object({
    username: z.string(),
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
  })).optional(),
});

const publishCarouselSchema = z.object({
  children: z.array(z.object({
    imageUrl: z.string().url().optional(),
    videoUrl: z.string().url().optional(),
    isVideo: z.boolean().optional(),
  })).min(2).max(10),
  caption: z.string().max(2200).optional(),
  locationId: z.string().optional(),
});

const publishReelSchema = z.object({
  videoUrl: z.string().url(),
  caption: z.string().max(2200).optional(),
  coverUrl: z.string().url().optional(),
  shareToFeed: z.boolean().optional(),
  locationId: z.string().optional(),
});

const publishStorySchema = z.object({
  imageUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
}).refine(data => data.imageUrl || data.videoUrl, {
  message: "imageUrl or videoUrl is required",
});

export function registerPublishingRoutes(app: Router) {

  app.get("/api/instagram/publishing/limit", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    const companyId = req.session.activeCompanyId;
    if (!companyId) return res.status(400).json({ error: "No active company" });
    
    try {
      const account = await instagramService.getInstagramAccountByCompanyId(companyId);
      if (!account?.accessToken) return res.status(404).json({ error: "Instagram not connected" });
      
      const limit = await instagramPublishingService.getPublishingLimit(
        account.accessToken, account.instagramUserId
      );
      
      res.json(limit);
    } catch (error: any) {
      console.error("[Publishing Route] Limit error:", error);
      res.status(500).json({ error: error.message || "Erro ao buscar limite" });
    }
  });

  app.get("/api/instagram/publishing/media", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    const companyId = req.session.activeCompanyId;
    if (!companyId) return res.status(400).json({ error: "No active company" });
    
    try {
      const account = await instagramService.getInstagramAccountByCompanyId(companyId);
      if (!account?.accessToken) return res.status(404).json({ error: "Instagram not connected" });
      
      const limit = parseInt(req.query.limit as string) || 12;
      const media = await instagramPublishingService.getRecentMedia(
        account.accessToken, account.instagramUserId, limit
      );
      
      res.json({ media });
    } catch (error: any) {
      console.error("[Publishing Route] Media error:", error);
      res.status(500).json({ error: error.message || "Erro ao buscar mídia" });
    }
  });

  app.post("/api/instagram/publish/image", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    const companyId = req.session.activeCompanyId;
    if (!companyId) return res.status(400).json({ error: "No active company" });
    
    const parsed = publishImageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
    
    try {
      const account = await instagramService.getInstagramAccountByCompanyId(companyId);
      if (!account?.accessToken) return res.status(404).json({ error: "Instagram not connected" });
      
      const result = await instagramPublishingService.publishImage({
        accessToken: account.accessToken,
        igUserId: account.instagramUserId,
        ...parsed.data,
      });
      
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("[Publishing Route] Image publish error:", error);
      res.status(500).json({ error: error.message || "Erro ao publicar imagem" });
    }
  });

  app.post("/api/instagram/publish/carousel", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    const companyId = req.session.activeCompanyId;
    if (!companyId) return res.status(400).json({ error: "No active company" });
    
    const parsed = publishCarouselSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
    
    try {
      const account = await instagramService.getInstagramAccountByCompanyId(companyId);
      if (!account?.accessToken) return res.status(404).json({ error: "Instagram not connected" });
      
      const result = await instagramPublishingService.publishCarousel({
        accessToken: account.accessToken,
        igUserId: account.instagramUserId,
        ...parsed.data,
      });
      
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("[Publishing Route] Carousel publish error:", error);
      res.status(500).json({ error: error.message || "Erro ao publicar carrossel" });
    }
  });

  app.post("/api/instagram/publish/reel", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    const companyId = req.session.activeCompanyId;
    if (!companyId) return res.status(400).json({ error: "No active company" });
    
    const parsed = publishReelSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
    
    try {
      const account = await instagramService.getInstagramAccountByCompanyId(companyId);
      if (!account?.accessToken) return res.status(404).json({ error: "Instagram not connected" });
      
      const result = await instagramPublishingService.publishReel({
        accessToken: account.accessToken,
        igUserId: account.instagramUserId,
        ...parsed.data,
        shareToFeed: parsed.data.shareToFeed !== false,
      });
      
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("[Publishing Route] Reel publish error:", error);
      res.status(500).json({ error: error.message || "Erro ao publicar reel" });
    }
  });

  app.post("/api/instagram/publish/story", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    const companyId = req.session.activeCompanyId;
    if (!companyId) return res.status(400).json({ error: "No active company" });
    
    const parsed = publishStorySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
    
    try {
      const account = await instagramService.getInstagramAccountByCompanyId(companyId);
      if (!account?.accessToken) return res.status(404).json({ error: "Instagram not connected" });
      
      const result = await instagramPublishingService.publishStory({
        accessToken: account.accessToken,
        igUserId: account.instagramUserId,
        imageUrl: parsed.data.imageUrl,
        videoUrl: parsed.data.videoUrl,
      });
      
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("[Publishing Route] Story publish error:", error);
      res.status(500).json({ error: error.message || "Erro ao publicar story" });
    }
  });

  app.get("/api/instagram/publishing/container/:containerId/status", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    const companyId = req.session.activeCompanyId;
    if (!companyId) return res.status(400).json({ error: "No active company" });
    
    try {
      const account = await instagramService.getInstagramAccountByCompanyId(companyId);
      if (!account?.accessToken) return res.status(404).json({ error: "Instagram not connected" });
      
      const status = await instagramPublishingService.checkContainerStatus(
        account.accessToken, req.params.containerId
      );
      
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
