import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { instagramService } from "../services/instagram";

export function registerMessagingRoutes(app: Express): void {

  app.get("/api/messages/unread-count", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const user = req.user! as any;
      let totalUnread = 0;

      if (user.role === 'company') {
        const companyId = user.activeCompanyId || req.session.activeCompanyId;
        if (companyId) {
          const account = await instagramService.getInstagramAccountByCompanyId(companyId);
          if (account) {
            totalUnread += await instagramService.getUnreadConversationCount(account.id);
          }
          const platformUnread = await storage.getUnreadConversationCount(Number(user.id), 'company', companyId);
          totalUnread += platformUnread;
        }
      } else if (user.role === 'creator') {
        totalUnread = await storage.getUnreadConversationCount(Number(user.id), 'creator');
      }

      res.json({ count: totalUnread });
    } catch (error) {
      console.error('[API] Error fetching unread count:', error);
      res.json({ count: 0 });
    }
  });

  app.get("/api/messages/unread-conversations", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const user = req.user! as any;
      const role = user.role as 'creator' | 'company';
      const companyId = role === 'company' ? (user.activeCompanyId || req.session.activeCompanyId) : undefined;
      const conversations = await storage.getUnreadConversations(Number(user.id), role, companyId);
      res.json(conversations);
    } catch (error) {
      console.error('[API] Error fetching unread conversations:', error);
      res.json([]);
    }
  });

  app.get("/api/messages/conversations", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const user = req.user! as any;
      const role = user.role as 'creator' | 'company';
      const companyId = role === 'company' ? (user.activeCompanyId || req.session.activeCompanyId) : undefined;
      const conversations = await storage.getAllConversations(Number(user.id), role, companyId);
      res.json(conversations);
    } catch (error) {
      console.error('[API] Error fetching conversations:', error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/messages/available-contacts", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = Number(req.user!.id);
      const userRole = req.user!.role;
      const activeCompanyId = req.session.activeCompanyId;

      const allApplications = await storage.getAllApplications();
      const allCampaigns = await storage.getAllCampaigns();
      const allUsers = await storage.getUsersWithFilters();

      const acceptedApps = allApplications.filter((app: { status: string }) => app.status === 'accepted');

      const contacts = acceptedApps.map((app: { id: number; campaignId: number; creatorId: number; status: string }) => {
        const campaign = allCampaigns.find((c: { id: number }) => c.id === app.campaignId);
        if (!campaign) return null;

        if (userRole === 'company') {
          if (activeCompanyId && campaign.companyId !== activeCompanyId) return null;
          const creator = allUsers.find((u: { id: number }) => u.id === app.creatorId);
          if (!creator) return null;

          return {
            id: app.id,
            campaignId: app.campaignId,
            campaignTitle: campaign.title,
            creatorId: creator.id,
            creatorName: creator.name,
            creatorAvatar: creator.avatar,
            companyId: campaign.companyId,
            companyName: ""
          };
        } else {
          if (app.creatorId !== userId) return null;
          const company = allUsers.find((u: { id: number }) => u.id === campaign.companyId);

          return {
            id: app.id,
            campaignId: app.campaignId,
            campaignTitle: campaign.title,
            creatorId: app.creatorId,
            creatorName: "",
            creatorAvatar: null,
            companyId: campaign.companyId,
            companyName: company?.name || "Empresa"
          };
        }
      }).filter(Boolean);

      res.json(contacts);
    } catch (error) {
      console.error('[API] Error fetching available contacts:', error);
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  // ============================================================
  // UNIFIED MESSAGING SYSTEM - Creator Endpoints
  // ============================================================

  app.get("/api/creator/messages/conversations", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(401);
    try {
      const type = req.query.type as 'brand' | 'campaign' | undefined;
      const conversations = await storage.getCreatorConversations(Number(req.user!.id), type);
      res.json(conversations);
    } catch (error) {
      console.error('[API] Error fetching creator conversations:', error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/creator/messages/conversations/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(401);
    try {
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) return res.sendStatus(404);
      if (conversation.creatorId !== Number(req.user!.id)) return res.sendStatus(403);

      const messages = await storage.getConversationMessages(conversationId);
      await storage.markConversationAsRead(conversationId, Number(req.user!.id));

      res.json({ conversation, messages });
    } catch (error) {
      console.error('[API] Error fetching conversation:', error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  app.post("/api/creator/messages/conversations/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(401);
    try {
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) return res.sendStatus(404);
      if (conversation.creatorId !== Number(req.user!.id)) return res.sendStatus(403);

      const { body } = req.body;
      if (!body || typeof body !== 'string') {
        return res.status(400).json({ error: "Message body is required" });
      }

      const message = await storage.sendConversationMessage(conversationId, Number(req.user!.id), body);

      const { notificationWS } = await import('../websocket');
      const companyMembers = await storage.getCompanyMembers(conversation.companyId);
      for (const member of companyMembers) {
        notificationWS?.sendEventToUser(member.userId, {
          type: 'message:new',
          conversationId,
          payload: { conversationId, message }
        });
      }

      res.json(message);
    } catch (error) {
      console.error('[API] Error sending message:', error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.post("/api/creator/messages/conversations/:id/read", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(401);
    try {
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) return res.sendStatus(404);
      if (conversation.creatorId !== Number(req.user!.id)) return res.sendStatus(403);

      await storage.markConversationAsRead(conversationId, Number(req.user!.id));
      res.json({ success: true });
    } catch (error) {
      console.error('[API] Error marking conversation as read:', error);
      res.status(500).json({ error: "Failed to mark as read" });
    }
  });

  app.get("/api/creator/messages/unread-count", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(401);
    try {
      const count = await storage.getUnreadConversationCount(Number(req.user!.id), 'creator');
      res.json({ count });
    } catch (error) {
      console.error('[API] Error getting unread count:', error);
      res.status(500).json({ error: "Failed to get unread count" });
    }
  });

  // ============================================================
  // UNIFIED MESSAGING SYSTEM - Company Endpoints (brand context)
  // ============================================================

  app.get("/api/company/brand/:brandId/messages/conversations", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(401);
    const brandId = parseInt(req.params.brandId);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId || brandId !== activeCompanyId) return res.sendStatus(403);

    try {
      const type = req.query.type as 'brand' | 'campaign' | undefined;
      const conversations = await storage.getCompanyConversations(activeCompanyId, brandId, type);
      res.json(conversations);
    } catch (error) {
      console.error('[API] Error fetching company conversations:', error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/company/brand/:brandId/messages/conversations/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(401);
    const brandId = parseInt(req.params.brandId);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId || brandId !== activeCompanyId) return res.sendStatus(403);

    try {
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) return res.sendStatus(404);
      if (conversation.companyId !== activeCompanyId) return res.sendStatus(403);

      const messages = await storage.getConversationMessages(conversationId);
      await storage.markConversationAsRead(conversationId, Number(req.user!.id));

      res.json({ conversation, messages });
    } catch (error) {
      console.error('[API] Error fetching conversation:', error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  app.post("/api/company/brand/:brandId/messages/conversations/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(401);
    const brandId = parseInt(req.params.brandId);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId || brandId !== activeCompanyId) return res.sendStatus(403);

    try {
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) return res.sendStatus(404);
      if (conversation.companyId !== activeCompanyId) return res.sendStatus(403);

      const { body } = req.body;
      if (!body || typeof body !== 'string') {
        return res.status(400).json({ error: "Message body is required" });
      }

      const message = await storage.sendConversationMessage(conversationId, Number(req.user!.id), body);

      const { notificationWS } = await import('../websocket');
      notificationWS?.sendEventToUser(conversation.creatorId, {
        type: 'message:new',
        conversationId,
        payload: { conversationId, message }
      });

      res.json(message);
    } catch (error) {
      console.error('[API] Error sending message:', error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.post("/api/company/brand/:brandId/messages/conversations/:id/read", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(401);
    const brandId = parseInt(req.params.brandId);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId || brandId !== activeCompanyId) return res.sendStatus(403);

    try {
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) return res.sendStatus(404);
      if (conversation.companyId !== activeCompanyId) return res.sendStatus(403);

      await storage.markConversationAsRead(conversationId, Number(req.user!.id));
      res.json({ success: true });
    } catch (error) {
      console.error('[API] Error marking conversation as read:', error);
      res.status(500).json({ error: "Failed to mark as read" });
    }
  });

  app.get("/api/company/brand/:brandId/messages/unread-count", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(401);
    const brandId = parseInt(req.params.brandId);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId || brandId !== activeCompanyId) return res.sendStatus(403);

    try {
      const count = await storage.getUnreadConversationCount(Number(req.user!.id), 'company', activeCompanyId, brandId);
      res.json({ count });
    } catch (error) {
      console.error('[API] Error getting unread count:', error);
      res.status(500).json({ error: "Failed to get unread count" });
    }
  });

  // Update conversation status (open/resolved)
  app.patch("/api/company/brand/:brandId/messages/conversations/:id/status", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(401);
    const brandId = parseInt(req.params.brandId);
    const conversationId = parseInt(req.params.id);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId || brandId !== activeCompanyId) return res.sendStatus(403);

    try {
      const { status } = req.body;
      if (!status || !['open', 'resolved'].includes(status)) {
        return res.status(400).json({ error: "Status inválido. Use 'open' ou 'resolved'" });
      }

      const conversation = await storage.getConversation(conversationId);
      if (!conversation) return res.status(404).json({ error: "Conversa não encontrada" });
      if (conversation.brandId !== brandId) return res.sendStatus(403);

      await storage.updateConversationStatus(conversationId, status);
      res.json({ success: true, status });
    } catch (error) {
      console.error('[API] Error updating conversation status:', error);
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  // Creator: Update conversation status
  app.patch("/api/creator/messages/conversations/:id/status", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(401);
    const conversationId = parseInt(req.params.id);

    try {
      const { status } = req.body;
      if (!status || !['open', 'resolved'].includes(status)) {
        return res.status(400).json({ error: "Status inválido. Use 'open' ou 'resolved'" });
      }

      const conversation = await storage.getConversation(conversationId);
      if (!conversation) return res.status(404).json({ error: "Conversa não encontrada" });
      if (conversation.creatorId !== req.user!.id) return res.sendStatus(403);

      await storage.updateConversationStatus(conversationId, status);
      res.json({ success: true, status });
    } catch (error) {
      console.error('[API] Error updating conversation status:', error);
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  // ============================================================
  // COMMUNITY CONVERSATIONS
  // ============================================================

  app.get("/api/community/conversations/:id/messages", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const conversationId = parseInt(req.params.id);
    const conversation = await storage.getConversation(conversationId);

    if (!conversation) return res.status(404).json({ error: "Conversa não encontrada" });

    if (req.user!.role === 'company') {
      const activeCompanyId = req.session.activeCompanyId;
      if (conversation.companyId !== activeCompanyId) return res.sendStatus(403);
    } else if (req.user!.role === 'creator') {
      if (conversation.creatorId !== req.user!.id) return res.sendStatus(403);
    } else {
      return res.sendStatus(403);
    }

    await storage.markConversationAsRead(conversationId, req.user!.id);

    const messages = await storage.getConversationMessages(conversationId);
    res.json(messages.reverse());
  });

  app.post("/api/community/conversations/:id/messages", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const conversationId = parseInt(req.params.id);
    const conversation = await storage.getConversation(conversationId);

    if (!conversation) return res.status(404).json({ error: "Conversa não encontrada" });

    if (req.user!.role === 'company') {
      const activeCompanyId = req.session.activeCompanyId;
      if (conversation.companyId !== activeCompanyId) return res.sendStatus(403);
    } else if (req.user!.role === 'creator') {
      if (conversation.creatorId !== req.user!.id) return res.sendStatus(403);
    } else {
      return res.sendStatus(403);
    }

    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Conteúdo da mensagem é obrigatório" });

    const message = await storage.sendConversationMessage(conversationId, Number(req.user!.id), content);

    res.json(message);
  });

  console.log("[Routes] Messaging routes registered");
}
