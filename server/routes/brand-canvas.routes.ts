import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { brandCanvasSchema, type BrandCanvas } from "@shared/schema";
import { calculateEnrichmentScore } from "../services/company-enrichment";

function isAdminByEmail(user: any): boolean {
  const email = user?.email || '';
  return user?.role === 'admin' || email.endsWith('@turbopartners.com.br') || email === 'rodrigoqs9@gmail.com';
}

/**
 * Calcula score de completude do Brand Canvas (0-100).
 * 12 campos-chave, cada um vale ~8 pontos.
 */
function calculateCanvasCompletionScore(canvas: BrandCanvas | null): number {
  if (!canvas) return 0;
  let filled = 0;
  const total = 12;

  // Tab 1 — Marca
  if (canvas.aboutBrand?.trim()) filled++;
  if (canvas.whatWeDo?.trim()) filled++;
  if (canvas.differentials?.trim()) filled++;

  // Tab 2 — Referências
  if (canvas.brandAssets?.length || canvas.referenceCreators?.trim() || canvas.referenceUrls?.length) filled++;

  // Tab 3 — Produtos
  if (canvas.products?.length) filled++;

  // Tab 4 — Público
  if (canvas.targetAudience?.trim()) filled++;
  if (canvas.personas?.length) filled++;

  // Tab 5 — Tom & Estilo
  if (canvas.brandVoice) filled++;
  if (canvas.doList?.length || canvas.dontList?.length) filled++;
  if (canvas.idealContentTypes?.length) filled++;

  // Tab 6 — Ganchos
  if (canvas.hooks?.length) filled++;
  if (canvas.keyMessages?.length || canvas.callToAction?.trim()) filled++;

  return Math.round((filled / total) * 100);
}

export function registerBrandCanvasRoutes(app: Express): void {

  // GET /api/companies/:id/brand-canvas
  app.get("/api/companies/:id/brand-canvas", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const companyId = parseInt(req.params.id);
      if (isNaN(companyId)) return res.status(400).json({ error: "ID inválido" });

      const company = await storage.getCompany(companyId);
      if (!company) return res.status(404).json({ error: "Empresa não encontrada" });

      // Verificar acesso: company member ou admin (email-verified)
      if (req.user!.role === 'company') {
        const isCompAdmin = await storage.isCompanyAdmin(companyId, req.user!.id);
        const isMember = await storage.getCompanyMember(companyId, req.user!.id);
        if (!isCompAdmin && !isMember) return res.status(403).json({ error: "Sem acesso" });
      } else if (!isAdminByEmail(req.user!)) {
        return res.status(403).json({ error: "Sem acesso" });
      }

      let canvas = company.brandCanvas as BrandCanvas | null;

      // Migração lazy: se brandCanvas vazio mas structuredBriefing tem dados
      if (!canvas && company.structuredBriefing) {
        const sb = company.structuredBriefing as any;
        canvas = {
          whatWeDo: sb.whatWeDo,
          differentials: sb.differentials,
          targetAudience: sb.targetAudience,
          brandVoice: sb.brandVoice,
          idealContentTypes: sb.idealContentTypes,
          avoidTopics: sb.avoidTopics,
          referenceCreators: sb.referenceCreators,
        };
      }

      const completionScore = calculateCanvasCompletionScore(canvas);

      res.json({
        brandCanvas: canvas,
        completionScore,
        // Dados auxiliares de enrichment para sugestões
        enrichmentData: {
          websiteDescription: company.websiteDescription,
          websiteAbout: company.websiteAbout,
          websiteProducts: company.websiteProducts,
          websiteKeywords: company.websiteKeywords,
          brandColors: company.brandColors,
          brandLogo: company.brandLogo,
          description: company.description,
          tagline: company.tagline,
          category: company.category,
        },
      });
    } catch (error) {
      console.error("[BrandCanvas] GET error:", error);
      res.status(500).json({ error: "Erro ao carregar Brand Canvas" });
    }
  });

  // PUT /api/companies/:id/brand-canvas
  app.put("/api/companies/:id/brand-canvas", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const companyId = parseInt(req.params.id);
      if (isNaN(companyId)) return res.status(400).json({ error: "ID inválido" });

      const company = await storage.getCompany(companyId);
      if (!company) return res.status(404).json({ error: "Empresa não encontrada" });

      // Verificar acesso: company admin ou admin (email-verified)
      if (req.user!.role === 'company') {
        const isCompAdmin = await storage.isCompanyAdmin(companyId, req.user!.id);
        if (!isCompAdmin) return res.status(403).json({ error: "Apenas administradores podem editar" });
      } else if (!isAdminByEmail(req.user!)) {
        return res.status(403).json({ error: "Sem acesso" });
      }

      // Validar payload
      const parsed = brandCanvasSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Dados inválidos", details: parsed.error.errors });
      }

      const canvas = parsed.data as BrandCanvas;
      if (canvas) {
        canvas.lastUpdatedAt = new Date().toISOString();
        canvas.completionScore = calculateCanvasCompletionScore(canvas);
      }

      // Salvar brandCanvas
      await storage.updateCompany(companyId, { brandCanvas: canvas });

      // Sincronizar campos-chave de volta para structuredBriefing (retrocompatibilidade)
      if (canvas) {
        const syncData: Record<string, any> = {};
        const structuredBriefing: Record<string, any> = {
          ...(company.structuredBriefing || {}),
        };
        let changed = false;

        if (canvas.whatWeDo !== undefined) { structuredBriefing.whatWeDo = canvas.whatWeDo; changed = true; }
        if (canvas.targetAudience !== undefined) { structuredBriefing.targetAudience = canvas.targetAudience; changed = true; }
        if (canvas.brandVoice !== undefined) { structuredBriefing.brandVoice = canvas.brandVoice; changed = true; }
        if (canvas.differentials !== undefined) { structuredBriefing.differentials = canvas.differentials; changed = true; }
        if (canvas.idealContentTypes !== undefined) { structuredBriefing.idealContentTypes = canvas.idealContentTypes; changed = true; }
        if (canvas.avoidTopics !== undefined) { structuredBriefing.avoidTopics = canvas.avoidTopics; changed = true; }
        if (canvas.referenceCreators !== undefined) { structuredBriefing.referenceCreators = canvas.referenceCreators; changed = true; }

        if (changed) syncData.structuredBriefing = structuredBriefing;

        if (Object.keys(syncData).length > 0) {
          await storage.updateCompany(companyId, syncData);
        }
      }

      // Recalcular enrichment score
      const freshCompany = await storage.getCompany(companyId);
      if (freshCompany) {
        const newScore = calculateEnrichmentScore(freshCompany);
        if (newScore !== freshCompany.enrichmentScore) {
          await storage.updateCompany(companyId, { enrichmentScore: newScore });
        }
      }

      res.json({
        success: true,
        brandCanvas: canvas,
        completionScore: canvas?.completionScore ?? 0,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      console.error("[BrandCanvas] PUT error:", error);
      res.status(500).json({ error: "Erro ao salvar Brand Canvas" });
    }
  });

  console.log("[Routes] Brand Canvas routes registered");
}
