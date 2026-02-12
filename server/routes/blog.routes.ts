import type { Express, Request, Response } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../db";
import { blogPosts, insertBlogPostSchema } from "@shared/schema";
import OpenAI from "openai";

function isAdminUser(req: Request): boolean {
  if (!req.isAuthenticated?.()) return false;
  const user = req.user as any;
  if (!user) return false;
  const email = user.email || '';
  return user.role === 'admin' || email.endsWith('@turbopartners.com.br') || email === 'rodrigoqs9@gmail.com';
}

export function registerBlogRoutes(app: Express): void {

  app.get("/api/blog", async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string | undefined;
      const featured = req.query.featured === "true" ? true : req.query.featured === "false" ? false : undefined;
      const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 10, 1), 100);
      const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

      const conditions = [eq(blogPosts.published, true)];
      if (category) conditions.push(eq(blogPosts.category, category));
      if (featured !== undefined) conditions.push(eq(blogPosts.featured, featured));

      const whereClause = and(...conditions);

      const [posts, countResult] = await Promise.all([
        db.select().from(blogPosts).where(whereClause).orderBy(desc(blogPosts.createdAt)).limit(limit).offset(offset),
        db.select({ count: sql<number>`count(*)` }).from(blogPosts).where(whereClause),
      ]);

      res.json({ posts, total: Number(countResult[0].count) });
    } catch (error) {
      console.error("[Blog] Error listing posts:", error);
      res.status(500).json({ error: "Failed to fetch blog posts" });
    }
  });

  app.get("/api/blog/:slug", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const [post] = await db.select().from(blogPosts).where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, true)));
      if (!post) return res.status(404).json({ error: "Post not found" });
      res.json(post);
    } catch (error) {
      console.error("[Blog] Error fetching post:", error);
      res.status(500).json({ error: "Failed to fetch blog post" });
    }
  });

  app.get("/api/admin/blog/posts", async (req: Request, res: Response) => {
    if (!isAdminUser(req)) return res.status(403).json({ error: 'Forbidden' });
    try {
      const posts = await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
      res.json(posts);
    } catch (error) {
      console.error("[Blog] Error listing admin posts:", error);
      res.status(500).json({ error: "Failed to fetch blog posts" });
    }
  });

  app.post("/api/admin/blog/posts", async (req: Request, res: Response) => {
    if (!isAdminUser(req)) return res.status(403).json({ error: 'Forbidden' });
    try {
      const data = insertBlogPostSchema.parse(req.body);
      const [post] = await db.insert(blogPosts).values(data).returning();
      res.status(201).json(post);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("[Blog] Error creating post:", error);
      res.status(500).json({ error: "Failed to create blog post" });
    }
  });

  app.patch("/api/admin/blog/posts/:id", async (req: Request, res: Response) => {
    if (!isAdminUser(req)) return res.status(403).json({ error: 'Forbidden' });
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

      const partialSchema = insertBlogPostSchema.partial();
      const data = partialSchema.parse(req.body);

      const [updated] = await db.update(blogPosts).set({ ...data, updatedAt: new Date() }).where(eq(blogPosts.id, id)).returning();
      if (!updated) return res.status(404).json({ error: "Post not found" });
      res.json(updated);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("[Blog] Error updating post:", error);
      res.status(500).json({ error: "Failed to update blog post" });
    }
  });

  app.delete("/api/admin/blog/posts/:id", async (req: Request, res: Response) => {
    if (!isAdminUser(req)) return res.status(403).json({ error: 'Forbidden' });
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

      await db.delete(blogPosts).where(eq(blogPosts.id, id));
      res.status(204).send();
    } catch (error) {
      console.error("[Blog] Error deleting post:", error);
      res.status(500).json({ error: "Failed to delete blog post" });
    }
  });

  app.post("/api/admin/blog/generate-seo", async (req: Request, res: Response) => {
    if (!isAdminUser(req)) return res.status(403).json({ error: 'Forbidden' });
    try {
      const { title, content, type } = req.body;
      if (!title || !content) return res.status(400).json({ error: "Title and content are required" });

      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Você é um especialista em SEO para blogs em português brasileiro. Gere metadados SEO otimizados para o conteúdo fornecido. Responda APENAS com um JSON válido no formato: {"metaTitle": "string (max 60 chars)", "metaDescription": "string (max 160 chars)", "metaKeywords": ["keyword1", "keyword2", ...]}`,
          },
          {
            role: "user",
            content: `Tipo: ${type || "article"}\nTítulo: ${title}\nConteúdo: ${content.substring(0, 2000)}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const seoData = JSON.parse(response.choices[0].message.content || "{}");
      res.json({
        metaTitle: seoData.metaTitle || title,
        metaDescription: seoData.metaDescription || "",
        metaKeywords: seoData.metaKeywords || [],
      });
    } catch (error) {
      console.error("[Blog] Error generating SEO:", error);
      res.status(500).json({ error: "Failed to generate SEO metadata" });
    }
  });

  console.log("[Routes] Blog routes registered");
}
