import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { insertCampaignSchema } from "@shared/schema";
import { z } from "zod";

export function registerCampaignRoutes(app: Express): void {
  // ============================================================
  // CAMPAIGN CRUD
  // ============================================================

  app.get("/api/campaigns", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    if (req.user!.role === 'company') {
      const activeCompanyId = req.session.activeCompanyId;
      if (!activeCompanyId) {
        return res.status(400).json({ error: "Nenhuma loja ativa selecionada" });
      }
      const campaigns = await storage.getCompanyCampaigns(activeCompanyId);
      return res.json(campaigns);
    } else if (req.user!.role === 'creator') {
      const creatorId = Number(req.user!.id);
      const campaigns = await storage.getQualifiedCampaignsForCreator(creatorId);
      return res.json(campaigns);
    } else if (req.user!.role === 'admin') {
      const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;

      if (companyId) {
        const campaigns = await storage.getCompanyCampaigns(companyId);
        return res.json(campaigns);
      } else {
        const campaigns = await storage.getAllCampaigns();
        return res.json(campaigns);
      }
    } else {
      return res.sendStatus(403);
    }
  });

  app.get("/api/campaigns/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    const campaign = await storage.getCampaign(id);
    if (!campaign) return res.sendStatus(404);

    if (req.user!.role === 'company') {
      const activeCompanyId = req.session.activeCompanyId;
      if (!activeCompanyId || campaign.companyId !== activeCompanyId) {
        return res.sendStatus(403);
      }
    }

    res.json(campaign);
  });

  app.get("/api/campaigns/:id/company", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    const campaign = await storage.getCampaign(id);
    if (!campaign) return res.sendStatus(404);

    const company = await storage.getCompany(campaign.companyId);
    if (!company) return res.sendStatus(404);

    res.json({
      id: company.id,
      name: company.name,
      tradeName: company.tradeName,
      logo: company.logo,
      description: company.description,
      website: company.website,
      instagram: company.instagram,
      email: company.email,
    });
  });

  app.get("/api/campaigns/:id/applications", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const id = parseInt(req.params.id);
    const activeCompanyId = req.session.activeCompanyId;

    const campaign = await storage.getCampaign(id);
    if (!campaign) return res.sendStatus(404);
    if (!activeCompanyId || campaign.companyId !== activeCompanyId) return res.sendStatus(403);

    const applications = await storage.getCampaignApplications(id);
    res.json(applications);
  });

  app.post("/api/campaigns", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);

    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) {
      return res.status(400).json({ error: "Nenhuma loja ativa selecionada" });
    }

    try {
      const data = insertCampaignSchema.parse({
        ...req.body,
        companyId: activeCompanyId
      });
      const campaign = await storage.createCampaign(data);

      res.status(201).json(campaign);

      setImmediate(async () => {
        try {
          const qualifiedCreators = await storage.getQualifiedCreatorsForCampaign(campaign);
          const { notificationWS } = await import('../websocket');

          const notificationPromises = qualifiedCreators.map(async (creator) => {
            try {
              const notification = await storage.createNotification({
                userId: creator.id,
                title: 'Nova campanha disponível',
                message: `${req.user!.name} publicou uma nova campanha: "${campaign.title}"`,
                type: 'new_campaign',
                actionUrl: `/campaign/${campaign.id}`,
                isRead: false
              });

              if (notificationWS) {
                notificationWS.sendToUser(creator.id, notification);
              }
            } catch (error) {
              console.error(`[Notifications] Failed to notify creator ${creator.id}:`, error);
            }
          });

          await Promise.allSettled(notificationPromises);

          const company = await storage.getCompany(activeCompanyId);
          const companyName = company?.tradeName || company?.name || req.user!.name;

          const favoritedCreators = await storage.getCreatorsWhoFavoritedCompany(activeCompanyId);
          const qualifiedCreatorIds = new Set(qualifiedCreators.map(c => c.id));

          const favoriteOnlyCreators = favoritedCreators.filter(c => !qualifiedCreatorIds.has(c.id));

          const favoriteNotificationPromises = favoriteOnlyCreators.map(async (creator) => {
            try {
              const notification = await storage.createNotification({
                userId: creator.id,
                title: '❤️ Empresa favorita publicou nova campanha!',
                message: `${companyName} (uma das suas empresas favoritas) publicou uma nova campanha: "${campaign.title}"`,
                type: 'favorite_company_campaign',
                actionUrl: `/campaign/${campaign.id}`,
                isRead: false
              });

              if (notificationWS) {
                notificationWS.sendToUser(creator.id, notification);
              }
            } catch (error) {
              console.error(`[Notifications] Failed to notify favorited creator ${creator.id}:`, error);
            }
          });

          await Promise.allSettled(favoriteNotificationPromises);
        } catch (error) {
          console.error('[Notifications] Failed to send campaign notifications:', error);
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json(error.errors);
      } else {
        res.status(500).json({ error: "Failed to create campaign" });
      }
    }
  });

  app.patch("/api/campaigns/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const id = parseInt(req.params.id);
    const activeCompanyId = req.session.activeCompanyId;

    const campaign = await storage.getCampaign(id);
    if (!campaign) return res.sendStatus(404);
    if (!activeCompanyId || campaign.companyId !== activeCompanyId) return res.sendStatus(403);

    try {
      const partialSchema = insertCampaignSchema.partial().omit({ companyId: true });
      const validatedData = partialSchema.parse(req.body);

      const updated = await storage.updateCampaign(id, validatedData);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json(error.errors);
      } else {
        console.error("Error updating campaign:", error);
        res.status(500).json({ error: "Failed to update campaign" });
      }
    }
  });

  app.patch("/api/campaigns/:id/status", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const id = parseInt(req.params.id);
    const status = req.body.status;
    const activeCompanyId = req.session.activeCompanyId;

    if (status !== 'open' && status !== 'closed') return res.status(400).send("Invalid status");

    const campaign = await storage.getCampaign(id);
    if (!campaign || !activeCompanyId || campaign.companyId !== activeCompanyId) return res.sendStatus(403);

    const updated = await storage.updateCampaignStatus(id, status);
    res.json(updated);
  });

  app.delete("/api/campaigns/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const id = parseInt(req.params.id);
    const activeCompanyId = req.session.activeCompanyId;

    const campaign = await storage.getCampaign(id);
    if (!campaign) return res.sendStatus(404);
    if (!activeCompanyId || campaign.companyId !== activeCompanyId) return res.sendStatus(403);

    await storage.deleteCampaign(id);
    res.sendStatus(204);
  });

  // ============================================================
  // CAMPAIGN STATS
  // Note: Leaderboard routes are in routes.ts (gamification V2 system)
  // ============================================================

  app.get("/api/campaigns/:id/my-stats", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);
    const campaignId = parseInt(req.params.id);

    const application = await storage.getExistingApplication(campaignId, req.user!.id);
    if (!application || application.status !== 'accepted') {
      return res.sendStatus(403);
    }

    const stats = await storage.getCampaignCreatorStats(campaignId, req.user!.id);
    if (!stats) {
      return res.json({
        points: 0,
        rank: null,
        deliverablesCompleted: 0,
        deliverablesOnTime: 0,
        totalViews: 0,
        totalEngagement: 0,
        totalSales: 0
      });
    }

    res.json(stats);
  });

  app.get("/api/campaigns/:id/creator/:creatorId/stats", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const campaignId = parseInt(req.params.id);
    const creatorId = parseInt(req.params.creatorId);
    const activeCompanyId = req.session.activeCompanyId;

    const campaign = await storage.getCampaign(campaignId);
    if (!campaign) return res.sendStatus(404);
    if (!activeCompanyId || campaign.companyId !== activeCompanyId) return res.sendStatus(403);

    const stats = await storage.getCampaignCreatorStats(campaignId, creatorId);
    if (!stats) {
      return res.json({
        points: 0,
        rank: null,
        deliverablesCompleted: 0,
        deliverablesOnTime: 0,
        totalViews: 0,
        totalEngagement: 0,
        totalSales: 0,
        qualityScore: 0
      });
    }

    res.json(stats);
  });

  console.log("[Routes] Campaign routes registered");
}
