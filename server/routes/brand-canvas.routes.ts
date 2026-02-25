import type { Express } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { storage } from '../storage';
import { brandCanvasSchema, type BrandCanvasV2 } from '@shared/schema';
import { calculateEnrichmentScore } from '../services/company-enrichment';
import {
  migrateV1toV2,
  calculateCanvasCompletionScoreV2,
  mergeCanvasData,
  runBrandCanvasPipeline,
} from '../services/brand-canvas';
import { db } from '../db';
import { companies, brandSettings, instagramAccounts, instagramPosts } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { objectStorageClient } from '../lib/object-storage';

function isAdminByEmail(user: any): boolean {
  const email = user?.email || '';
  return (
    user?.role === 'admin' ||
    email.endsWith('@turbopartners.com.br') ||
    email === 'rodrigoqs9@gmail.com'
  );
}

/**
 * Verify that the user has access to edit a company's brand canvas.
 * Returns the company or null if access denied.
 */
async function verifyCompanyAccess(
  req: any,
  res: any,
  companyId: number,
  requireAdmin = false,
): Promise<any | null> {
  if (!req.isAuthenticated()) {
    res.sendStatus(401);
    return null;
  }

  if (isNaN(companyId)) {
    res.status(400).json({ error: 'ID inválido' });
    return null;
  }

  const company = await storage.getCompany(companyId);
  if (!company) {
    res.status(404).json({ error: 'Empresa não encontrada' });
    return null;
  }

  if (req.user!.role === 'company') {
    if (requireAdmin) {
      const isCompAdmin = await storage.isCompanyAdmin(companyId, req.user!.id);
      if (!isCompAdmin) {
        res.status(403).json({ error: 'Apenas administradores podem editar' });
        return null;
      }
    } else {
      const isCompAdmin = await storage.isCompanyAdmin(companyId, req.user!.id);
      const isMember = await storage.getCompanyMember(companyId, req.user!.id);
      if (!isCompAdmin && !isMember) {
        res.status(403).json({ error: 'Sem acesso' });
        return null;
      }
    }
  } else if (!isAdminByEmail(req.user!)) {
    res.status(403).json({ error: 'Sem acesso' });
    return null;
  }

  return company;
}

export function registerBrandCanvasRoutes(app: Express): void {
  // GET /api/companies/:id/brand-canvas
  app.get('/api/companies/:id/brand-canvas', async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const company = await verifyCompanyAccess(req, res, companyId);
      if (!company) return;

      let canvas = company.brandCanvas as BrandCanvasV2 | null;

      // Lazy migration: structuredBriefing -> V1 -> V2
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

      // Migrate V1 to V2 if needed
      if (canvas) {
        canvas = migrateV1toV2(canvas);
      }

      // Auto-populate from enrichment data if canvas is empty/partial
      const sb = company.structuredBriefing as any;
      if (canvas) {
        if (!canvas.aboutBrand?.trim() && company.description) {
          canvas.aboutBrand = company.description;
        }
        if (!canvas.whatWeDo?.trim() && sb?.whatWeDo) {
          canvas.whatWeDo = sb.whatWeDo;
        }
        if (!canvas.differentials?.trim() && sb?.differentials) {
          canvas.differentials = sb.differentials;
        }
        if (!canvas.targetAudience?.trim() && sb?.targetAudience) {
          canvas.targetAudience = sb.targetAudience;
        }

        // Visual: pre-fill colors from brandColors
        const brandColors = company.brandColors as string[] | null;
        if (!canvas.visualIdentity?.colors?.primary && brandColors?.length) {
          canvas.visualIdentity = canvas.visualIdentity || {};
          canvas.visualIdentity.colors = {
            ...canvas.visualIdentity.colors,
            primary: brandColors[0],
            secondary: brandColors[1],
            accent: brandColors[2],
          };
        }

        // Visual: pre-fill logo
        if (!canvas.visualIdentity?.logoUrl) {
          const logoUrl = company.brandLogo || company.instagramProfilePic;
          if (logoUrl) {
            canvas.visualIdentity = canvas.visualIdentity || {};
            canvas.visualIdentity.logoUrl = logoUrl;
          }
        }

        // Voice: pre-fill from structuredBriefing
        if (!canvas.voice?.toneType && sb?.brandVoice) {
          canvas.voice = canvas.voice || {};
          canvas.voice.toneType = sb.brandVoice;
        }

        // Content: pre-fill idealContentTypes
        if (!canvas.contentStrategy?.idealContentTypes?.length && sb?.idealContentTypes?.length) {
          canvas.contentStrategy = canvas.contentStrategy || {};
          canvas.contentStrategy.idealContentTypes = sb.idealContentTypes;
        }
      }

      const completionScore = calculateCanvasCompletionScoreV2(canvas);

      res.json({
        brandCanvas: canvas,
        completionScore,
        processingStatus: canvas?.processing || { version: 2, status: 'idle' },
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
      console.error('[BrandCanvas] GET error:', error);
      res.status(500).json({ error: 'Erro ao carregar Brand Canvas' });
    }
  });

  // PUT /api/companies/:id/brand-canvas
  app.put('/api/companies/:id/brand-canvas', async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const company = await verifyCompanyAccess(req, res, companyId, true);
      if (!company) return;

      // Validate payload
      const parsed = brandCanvasSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.errors });
      }

      const canvas = parsed.data as BrandCanvasV2;
      if (canvas) {
        canvas.lastUpdatedAt = new Date().toISOString();
        canvas.completionScore = calculateCanvasCompletionScoreV2(canvas);
      }

      // Save brandCanvas
      await storage.updateCompany(companyId, { brandCanvas: canvas });

      // Sync key fields back to structuredBriefing (backward compat)
      if (canvas) {
        const structuredBriefing: Record<string, any> = {
          ...(company.structuredBriefing || {}),
        };
        let changed = false;

        // V2 nested fields take priority, fall back to V1 flat fields
        const voiceTone = canvas.voice?.toneType || canvas.brandVoice;
        const contentTypes = canvas.contentStrategy?.idealContentTypes || canvas.idealContentTypes;
        const avoidTopics = canvas.contentStrategy?.avoidTopics || canvas.avoidTopics;
        const refCreators = canvas.references?.referenceCreators || canvas.referenceCreators;

        if (canvas.whatWeDo !== undefined) {
          structuredBriefing.whatWeDo = canvas.whatWeDo;
          changed = true;
        }
        if (canvas.targetAudience !== undefined) {
          structuredBriefing.targetAudience = canvas.targetAudience;
          changed = true;
        }
        if (voiceTone !== undefined) {
          structuredBriefing.brandVoice = voiceTone;
          changed = true;
        }
        if (canvas.differentials !== undefined) {
          structuredBriefing.differentials = canvas.differentials;
          changed = true;
        }
        if (contentTypes !== undefined) {
          structuredBriefing.idealContentTypes = contentTypes;
          changed = true;
        }
        if (avoidTopics !== undefined) {
          structuredBriefing.avoidTopics = avoidTopics;
          changed = true;
        }
        if (refCreators !== undefined) {
          structuredBriefing.referenceCreators = refCreators;
          changed = true;
        }

        if (changed) {
          await storage.updateCompany(companyId, { structuredBriefing });
        }
      }

      // Recalculate enrichment score
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
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      console.error('[BrandCanvas] PUT error:', error);
      res.status(500).json({ error: 'Erro ao salvar Brand Canvas' });
    }
  });

  // POST /api/companies/:id/brand-canvas/generate — Start AI pipeline
  app.post('/api/companies/:id/brand-canvas/generate', async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const company = await verifyCompanyAccess(req, res, companyId, true);
      if (!company) return;

      // Check if already processing
      const canvas = company.brandCanvas as BrandCanvasV2 | null;
      if (canvas?.processing?.status === 'processing') {
        return res.status(409).json({ error: 'Pipeline já em execução' });
      }

      // Parse optional generation context
      const contextSchema = z
        .object({
          selectedPostIds: z.array(z.string()).max(10).optional(),
          uploadedReferences: z
            .array(
              z.object({
                url: z.string(),
                type: z.enum(['image', 'video']),
                filename: z.string(),
              }),
            )
            .max(5)
            .optional(),
          questionnaire: z
            .object({
              tonePreference: z.string().max(50).optional(),
              targetAudience: z.string().max(300).optional(),
              inspirationBrands: z.string().max(300).optional(),
              communicationAvoid: z.string().max(300).optional(),
              brandEssence: z.string().max(200).optional(),
            })
            .optional(),
        })
        .optional();

      const generationContext = contextSchema.parse(req.body || {});

      // Start pipeline async
      const userId = req.user!.id;
      setImmediate(() => {
        runBrandCanvasPipeline({ companyId, userId, referenceContext: generationContext }).catch(
          (error) => {
            console.error('[BrandCanvas] Pipeline failed:', error);
            // Mark as failed
            db.update(companies)
              .set({
                brandCanvas: {
                  ...(canvas || {}),
                  processing: {
                    version: 2,
                    status: 'failed' as const,
                    lastProcessedAt: new Date().toISOString(),
                  },
                },
              })
              .where(eq(companies.id, companyId))
              .catch(() => {});

            // Notify failure via WebSocket
            try {
              const { notificationWS } = require('../websocket');
              notificationWS?.sendEventToUser(userId, {
                type: 'brand_canvas:failed',
                companyId,
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            } catch {}
          },
        );
      });

      res.status(202).json({
        message: 'Pipeline iniciado',
        status: 'processing',
      });
    } catch (error) {
      console.error('[BrandCanvas] Generate error:', error);
      res.status(500).json({ error: 'Erro ao iniciar geração' });
    }
  });

  // GET /api/companies/:id/brand-canvas/status
  app.get('/api/companies/:id/brand-canvas/status', async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const company = await verifyCompanyAccess(req, res, companyId);
      if (!company) return;

      const canvas = company.brandCanvas as BrandCanvasV2 | null;
      const processing = canvas?.processing || { version: 2, status: 'idle' };

      const completedSteps = processing.steps?.filter((s) => s.status === 'completed').length || 0;
      const totalSteps = processing.steps?.length || 0;
      const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

      res.json({
        status: processing.status,
        currentStep: processing.currentStep,
        progress,
        steps: processing.steps,
        aiConfidenceScore: processing.aiConfidenceScore,
        lastProcessedAt: processing.lastProcessedAt,
      });
    } catch (error) {
      console.error('[BrandCanvas] Status error:', error);
      res.status(500).json({ error: 'Erro ao buscar status' });
    }
  });

  // POST /api/companies/:id/brand-canvas/generate-section — Regenerate single section
  app.post('/api/companies/:id/brand-canvas/generate-section', async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const company = await verifyCompanyAccess(req, res, companyId, true);
      if (!company) return;

      const sectionSchema = z.object({
        section: z.enum(['visual', 'voice', 'content', 'audience', 'angles']),
      });
      const { section } = sectionSchema.parse(req.body);

      // Map section to pipeline steps
      const stepMap: Record<
        string,
        Array<'cnpj' | 'website' | 'visual' | 'social' | 'voice' | 'synthesis'>
      > = {
        visual: ['visual'],
        voice: ['voice'],
        content: ['synthesis'],
        audience: ['synthesis'],
        angles: ['synthesis'],
      };

      const userId = req.user!.id;
      setImmediate(() => {
        runBrandCanvasPipeline({
          companyId,
          userId,
          force: true,
          sectionsOnly: stepMap[section],
        }).catch((error) => {
          console.error(`[BrandCanvas] Section ${section} regeneration failed:`, error);
        });
      });

      res.status(202).json({
        message: `Regenerando seção: ${section}`,
        status: 'processing',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Seção inválida', details: error.errors });
      }
      console.error('[BrandCanvas] Generate-section error:', error);
      res.status(500).json({ error: 'Erro ao regenerar seção' });
    }
  });

  // POST /api/companies/:id/brand-canvas/apply — Apply canvas to brandSettings & company profile
  app.post('/api/companies/:id/brand-canvas/apply', async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const company = await verifyCompanyAccess(req, res, companyId, true);
      if (!company) return;

      const canvas = migrateV1toV2(company.brandCanvas) as BrandCanvasV2;
      if (!canvas) {
        return res.status(400).json({ error: 'Brand Canvas vazio' });
      }

      const updates: string[] = [];

      // 1. Update company profile
      const companyUpdate: Record<string, any> = {};
      if (canvas.aboutBrand && !company.description) {
        companyUpdate.description = canvas.aboutBrand;
        updates.push('company.description');
      }
      if (canvas.voice?.toneType || canvas.brandVoice) {
        const voiceTone = canvas.voice?.toneType || canvas.brandVoice;
        const structuredBriefing = {
          ...((company.structuredBriefing as any) || {}),
          brandVoice: voiceTone,
        };
        companyUpdate.structuredBriefing = structuredBriefing;
        updates.push('structuredBriefing.brandVoice');
      }
      if (canvas.contentStrategy?.idealContentTypes?.length || canvas.idealContentTypes?.length) {
        const types = canvas.contentStrategy?.idealContentTypes || canvas.idealContentTypes;
        const structuredBriefing = {
          ...(companyUpdate.structuredBriefing || (company.structuredBriefing as any) || {}),
          idealContentTypes: types,
        };
        companyUpdate.structuredBriefing = structuredBriefing;
        updates.push('structuredBriefing.idealContentTypes');
      }

      if (Object.keys(companyUpdate).length > 0) {
        await storage.updateCompany(companyId, companyUpdate);
      }

      // 2. Update brandSettings if exists
      const [existingSettings] = await db
        .select()
        .from(brandSettings)
        .where(eq(brandSettings.companyId, companyId))
        .limit(1);

      if (existingSettings) {
        const settingsUpdate: Record<string, any> = {};

        if (canvas.visualIdentity?.colors?.primary) {
          settingsUpdate.primaryColor = canvas.visualIdentity.colors.primary;
          updates.push('brandSettings.primaryColor');
        }
        if (canvas.visualIdentity?.colors?.secondary) {
          settingsUpdate.secondaryColor = canvas.visualIdentity.colors.secondary;
          updates.push('brandSettings.secondaryColor');
        }
        if (canvas.visualIdentity?.colors?.accent) {
          settingsUpdate.accentColor = canvas.visualIdentity.colors.accent;
          updates.push('brandSettings.accentColor');
        }
        if (canvas.visualIdentity?.colors?.background) {
          settingsUpdate.backgroundColor = canvas.visualIdentity.colors.background;
          updates.push('brandSettings.backgroundColor');
        }
        if (canvas.visualIdentity?.colors?.text) {
          settingsUpdate.textColor = canvas.visualIdentity.colors.text;
          updates.push('brandSettings.textColor');
        }
        if (canvas.visualIdentity?.logoUrl && !existingSettings.logoUrl) {
          settingsUpdate.logoUrl = canvas.visualIdentity.logoUrl;
          updates.push('brandSettings.logoUrl');
        }
        if (canvas.aboutBrand && !existingSettings.description) {
          settingsUpdate.description = canvas.aboutBrand;
          updates.push('brandSettings.description');
        }

        if (Object.keys(settingsUpdate).length > 0) {
          settingsUpdate.updatedAt = new Date();
          await db
            .update(brandSettings)
            .set(settingsUpdate)
            .where(eq(brandSettings.id, existingSettings.id));
        }
      }

      res.json({
        success: true,
        appliedFields: updates,
        message: `${updates.length} campos aplicados com sucesso`,
      });
    } catch (error) {
      console.error('[BrandCanvas] Apply error:', error);
      res.status(500).json({ error: 'Erro ao aplicar Brand Canvas' });
    }
  });

  // POST /api/companies/:id/brand-canvas/accept-suggestions — Accept selected AI suggestions
  app.post('/api/companies/:id/brand-canvas/accept-suggestions', async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const company = await verifyCompanyAccess(req, res, companyId, true);
      if (!company) return;

      const acceptSchema = z.object({
        fields: z.record(z.string(), z.any()),
      });
      const { fields } = acceptSchema.parse(req.body);

      const canvas = (migrateV1toV2(company.brandCanvas) as BrandCanvasV2) || {};

      // Apply each accepted field
      for (const [path, value] of Object.entries(fields)) {
        const parts = path.split('.');
        let target: any = canvas;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!target[parts[i]]) target[parts[i]] = {};
          target = target[parts[i]];
        }
        target[parts[parts.length - 1]] = value;
      }

      canvas.lastUpdatedAt = new Date().toISOString();
      canvas.completionScore = calculateCanvasCompletionScoreV2(canvas);

      await storage.updateCompany(companyId, { brandCanvas: canvas });

      res.json({
        success: true,
        brandCanvas: canvas,
        completionScore: canvas.completionScore,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      console.error('[BrandCanvas] Accept-suggestions error:', error);
      res.status(500).json({ error: 'Erro ao aceitar sugestões' });
    }
  });

  // GET /api/companies/:id/brand-canvas/social-posts
  app.get('/api/companies/:id/brand-canvas/social-posts', async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const company = await verifyCompanyAccess(req, res, companyId);
      if (!company) return;

      // Find Instagram accounts for this company
      const accounts = await db
        .select({ id: instagramAccounts.id })
        .from(instagramAccounts)
        .where(eq(instagramAccounts.companyId, companyId));

      if (!accounts.length) {
        return res.json([]);
      }

      // Get posts from all company accounts
      const posts = await db
        .select({
          id: instagramPosts.id,
          instagramMediaId: instagramPosts.instagramMediaId,
          mediaType: instagramPosts.mediaType,
          mediaUrl: instagramPosts.mediaUrl,
          thumbnailUrl: instagramPosts.thumbnailUrl,
          caption: instagramPosts.caption,
          likeCount: instagramPosts.likeCount,
          commentsCount: instagramPosts.commentsCount,
          timestamp: instagramPosts.timestamp,
        })
        .from(instagramPosts)
        .where(eq(instagramPosts.instagramAccountId, accounts[0].id))
        .orderBy(desc(instagramPosts.timestamp))
        .limit(50);

      res.json(posts);
    } catch (error) {
      console.error('[BrandCanvas] Social posts error:', error);
      res.status(500).json({ error: 'Erro ao buscar posts' });
    }
  });

  // POST /api/companies/:id/brand-canvas/upload-reference
  const referenceUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Tipo não permitido. Use imagens ou PDF.'));
      }
    },
  });

  app.post(
    '/api/companies/:id/brand-canvas/upload-reference',
    referenceUpload.single('file'),
    async (req, res) => {
      try {
        const companyId = parseInt(req.params.id);
        const company = await verifyCompanyAccess(req, res, companyId, true);
        if (!company) return;

        const file = req.file;
        if (!file) {
          return res.status(400).json({ error: 'Arquivo não enviado' });
        }

        const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
        if (!bucketId) {
          return res.status(500).json({ error: 'Storage não configurado' });
        }

        const ext = file.originalname.split('.').pop() || 'jpg';
        const timestamp = Date.now();
        const fileName = `brand-canvas/references/${companyId}/${timestamp}.${ext}`;

        const bucket = objectStorageClient.bucket(bucketId);
        const gcsFile = bucket.file(`public/${fileName}`);
        await gcsFile.save(file.buffer, {
          contentType: file.mimetype,
          metadata: { cacheControl: 'public, max-age=31536000' },
        });

        const fileType = file.mimetype.startsWith('image/')
          ? ('image' as const)
          : ('video' as const);

        res.json({
          url: `/objects/uploads/public/${fileName}`,
          type: fileType,
          filename: file.originalname,
        });
      } catch (error) {
        console.error('[BrandCanvas] Upload reference error:', error);
        res.status(500).json({ error: 'Erro ao enviar arquivo' });
      }
    },
  );

  console.log('[Routes] Brand Canvas V2 routes registered (9 endpoints)');
}
