import { Router, Request, Response } from "express";
import { instagramCommentsService } from "../services/instagram-comments";
import { instagramService } from "../services/instagram";

export function registerCommentsRoutes(app: Router) {

  app.get("/api/instagram/comments", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    const companyId = req.session.activeCompanyId;
    if (!companyId) return res.status(400).json({ error: "No active company" });
    
    try {
      const account = await instagramService.getInstagramAccountByCompanyId(companyId);
      if (!account?.accessToken) return res.status(404).json({ error: "Instagram not connected" });
      
      const postsLimit = parseInt(req.query.postsLimit as string) || 10;
      const commentsPerPost = parseInt(req.query.commentsPerPost as string) || 20;
      
      const comments = await instagramCommentsService.getRecentComments(
        account.accessToken, account.instagramUserId, postsLimit, commentsPerPost
      );
      
      res.json({ comments, total: comments.length });
    } catch (error: any) {
      console.error("[Comments Route] Error:", error);
      res.status(500).json({ error: error.message || "Erro ao buscar comentários" });
    }
  });

  app.get("/api/instagram/comments/:mediaId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    const companyId = req.session.activeCompanyId;
    if (!companyId) return res.status(400).json({ error: "No active company" });
    
    try {
      const account = await instagramService.getInstagramAccountByCompanyId(companyId);
      if (!account?.accessToken) return res.status(404).json({ error: "Instagram not connected" });
      
      const limit = parseInt(req.query.limit as string) || 50;
      const after = req.query.after as string | undefined;
      
      const result = await instagramCommentsService.getMediaComments(
        account.accessToken, req.params.mediaId, limit, after
      );
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/instagram/comments/:commentId/reply", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    const companyId = req.session.activeCompanyId;
    if (!companyId) return res.status(400).json({ error: "No active company" });
    
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });
    
    try {
      const account = await instagramService.getInstagramAccountByCompanyId(companyId);
      if (!account?.accessToken) return res.status(404).json({ error: "Instagram not connected" });
      
      const result = await instagramCommentsService.replyToComment(
        account.accessToken, req.params.commentId, message
      );
      
      res.json({ success: true, reply: result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/instagram/comments/:commentId/hide", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    const companyId = req.session.activeCompanyId;
    if (!companyId) return res.status(400).json({ error: "No active company" });
    
    const { hide } = req.body;
    
    try {
      const account = await instagramService.getInstagramAccountByCompanyId(companyId);
      if (!account?.accessToken) return res.status(404).json({ error: "Instagram not connected" });
      
      const result = await instagramCommentsService.toggleHideComment(
        account.accessToken, req.params.commentId, hide !== false
      );
      
      res.json({ success: true, result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/instagram/comments/:commentId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    const companyId = req.session.activeCompanyId;
    if (!companyId) return res.status(400).json({ error: "No active company" });
    
    try {
      const account = await instagramService.getInstagramAccountByCompanyId(companyId);
      if (!account?.accessToken) return res.status(404).json({ error: "Instagram not connected" });
      
      const result = await instagramCommentsService.deleteComment(
        account.accessToken, req.params.commentId
      );
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/instagram/comments/analyze-sentiment", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    const { comments } = req.body;
    if (!comments || !Array.isArray(comments) || comments.length === 0) {
      return res.status(400).json({ error: "Comments array is required" });
    }
    
    try {
      const results = await instagramCommentsService.analyzeSentiments(
        comments.map((c: any) => ({ id: c.id, text: c.text, username: c.username }))
      );
      
      res.json({ sentiments: results });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
