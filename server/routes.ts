import type { Express, Request } from 'express';
import { createServer, type Server } from 'http';
import crypto from 'crypto';
import { storage } from './storage';
import { setupAuth } from './auth';
import {
  insertCampaignSchema,
  insertApplicationSchema,
  insertUserSchema,
  insertDeliverableSchema,
  insertDeliverableCommentSchema,
  insertCampaignTemplateSchema,
  structuredBriefingSchema,
  campaigns,
  applications,
  users,
  campaignInvites,
  companies,
  instagramAccounts,
  brandCreatorMemberships,
  instagramProfiles,
} from '@shared/schema';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { setupWebSocket } from './websocket';
import {
  getTikTokMetrics,
  getTikTokPosts,
  getInstagramDetailedPosts,
  analyzeHashtags,
  getInstagramMetrics,
} from './apify-service';
import { objectStorageClient, registerObjectStorageRoutes } from './lib/object-storage';
import { savePostThumbnail } from './lib/image-storage';
import { sendGeminiMessage } from './lib/gemini';
import { db } from './db';
import { eq, and, lte, desc, sql } from 'drizzle-orm';
import { registerModularRoutes } from './routes/index';
import { tryBusinessDiscoveryForProfile } from './services/business-discovery';
import {
  runBatchEnrichment,
  getEnrichmentStats,
  runBatchCompanyEnrichment,
} from './services/creator-enrichment';

// Helper middleware to require brand/company access
async function requireBrandAccess(req: Request, brandId: number): Promise<boolean> {
  if (!req.user) return false;

  // Admin users (email-verified) have access to all brands
  const email = (req.user as any).email || '';
  const isAdminByRole = req.user.role === 'admin';
  const isAdminByEmail =
    email.endsWith('@turbopartners.com.br') || email === 'rodrigoqs9@gmail.com';
  if (isAdminByRole || isAdminByEmail) return true;

  // Check if user is a member of the company (brand)
  const membership = await storage.getCompanyMember(req.user.id, brandId);
  return !!membership;
}

// Alias for verifyBrandAccess
async function verifyBrandAccess(user: Express.User, brandId: number): Promise<boolean> {
  // Admin users (email-verified) have access to all brands
  const email = (user as any).email || '';
  const isAdminByRole = user.role === 'admin';
  const isAdminByEmail =
    email.endsWith('@turbopartners.com.br') || email === 'rodrigoqs9@gmail.com';
  if (isAdminByRole || isAdminByEmail) return true;

  // Check if user is a member of the company (brand)
  const membership = await storage.getCompanyMember(user.id, brandId);
  return !!membership;
}

// Helper function to get workflow status labels in Portuguese
function getWorkflowStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    aceito: 'Aceito',
    contrato: 'Contrato',
    aguardando_produto: 'Aguardando Produto',
    producao: 'Produção',
    revisao: 'Revisão',
    entregue: 'Entregue',
  };
  return labels[status] || status;
}

// Helper function to get creator workflow status labels in Portuguese
function getCreatorWorkflowStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    aceito: 'Aceito',
    contrato: 'Contrato',
    aguardando_produto: 'Aguardando Produto',
    producao: 'Produção',
    revisao: 'Revisão',
    entregue: 'Entregue',
  };
  return labels[status] || status;
}

// Configure Multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  },
});

// Configure Multer for support ticket attachments
const supportUpload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, 'support-' + uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for support attachments
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/zip',
    ];
    if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  },
});

// Configure Multer for deliverable uploads - use memory storage for auth-before-persist
const deliverableUploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for deliverables
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'video/webm',
      'video/avi',
      'application/pdf',
      'application/zip',
    ];
    if (
      allowedTypes.includes(file.mimetype) ||
      file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('video/')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use imagens, vídeos ou PDF.'));
    }
  },
});

// tryBusinessDiscoveryForProfile imported from ./services/business-discovery

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check (before auth middleware)
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  setupAuth(app);

  // Register object storage routes (must be before modular routes)
  registerObjectStorageRoutes(app);

  // Register modular routes (messaging, etc.)
  registerModularRoutes(app);

  // --- Object Storage Routes for serving saved images ---
  app.get('/objects/uploads/public/*', async (req, res) => {
    try {
      const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
      if (!bucketId) {
        return res.status(404).json({ error: 'Storage not configured' });
      }

      const objectPath = req.path.replace('/objects/uploads/', '');
      const bucket = objectStorageClient.bucket(bucketId);
      const file = bucket.file(objectPath);

      const [exists] = await file.exists();
      if (!exists) {
        return res.status(404).json({ error: 'File not found' });
      }

      const [metadata] = await file.getMetadata();
      res.set({
        'Content-Type': metadata.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
      });

      file.createReadStream().pipe(res);
    } catch (error) {
      console.error('[Object Storage] Error serving file:', error);
      res.status(500).json({ error: 'Error serving file' });
    }
  });

  // --- SEO Routes ---
  app.get('/robots.txt', (req, res) => {
    const baseUrl = process.env.REPLIT_DEPLOYMENT_URL || `https://${req.get('host')}`;
    const robotsTxt = `# CreatorConnect Robots.txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/
Disallow: /admin/
Disallow: /auth

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay
Crawl-delay: 1
`;
    res.type('text/plain').send(robotsTxt);
  });

  app.get('/sitemap.xml', (req, res) => {
    const baseUrl = process.env.REPLIT_DEPLOYMENT_URL || `https://${req.get('host')}`;
    const today = new Date().toISOString().split('T')[0];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>${baseUrl}/og-image-creatorconnect.png</image:loc>
      <image:title>CreatorConnect - Plataforma de Marketing de Influência</image:title>
      <image:caption>Conecte marcas e criadores de conteúdo para campanhas de patrocínio</image:caption>
    </image:image>
  </url>
  <url>
    <loc>${baseUrl}/auth</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/termos-uso</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>${baseUrl}/politica-privacidade</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>
</urlset>`;
    res.type('application/xml').send(sitemap);
  });

  // --- Uploads ---
  app.post(
    '/api/upload',
    (req, res, next) => {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      next();
    },
    upload.single('avatar'),
    (req, res) => {
      const reqWithFile = req as Request & { file?: Express.Multer.File };
      if (!reqWithFile.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileUrl = `/uploads/${reqWithFile.file.filename}`;
      res.json({ url: fileUrl });
    },
  );

  app.get('/api/creators', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const creators = await storage.getCreators();
    res.json(creators);
  });

  app.get('/api/creators/discovery-stats', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    try {
      const allCreators = await storage.getCreators();

      const creatorsWithSocial = allCreators.filter((creator) => {
        const hasInstagram = creator.instagram && creator.instagram.trim().length > 0;
        const hasTiktok = (creator as any).tiktok && (creator as any).tiktok.trim().length > 0;
        return hasInstagram || hasTiktok;
      });

      const validatedProfiles = await db
        .select({
          userId: instagramProfiles.userId,
          followers: instagramProfiles.followers,
          username: instagramProfiles.username,
        })
        .from(instagramProfiles)
        .where(eq(instagramProfiles.ownerType, 'user'));

      const validatedMap = new Map(validatedProfiles.map((p) => [p.userId, p]));

      const validCreators = creatorsWithSocial.filter((creator) => {
        const hasInstagram = creator.instagram && creator.instagram.trim().length > 0;
        if (!hasInstagram) return true;

        const validated = validatedMap.get(creator.id);
        if (validated && validated.followers === null) {
          return false;
        }

        return true;
      });

      const campaignCounts = await db
        .select({
          creatorId: applications.creatorId,
          count: sql<number>`count(*)::int`,
        })
        .from(applications)
        .where(eq(applications.status, 'accepted'))
        .groupBy(applications.creatorId);

      const communityCounts = await db
        .select({
          creatorId: brandCreatorMemberships.creatorId,
          count: sql<number>`count(*)::int`,
        })
        .from(brandCreatorMemberships)
        .where(eq(brandCreatorMemberships.status, 'active'))
        .groupBy(brandCreatorMemberships.creatorId);

      const campaignMap = new Map(campaignCounts.map((c) => [c.creatorId, c.count]));
      const communityMap = new Map(communityCounts.map((c) => [c.creatorId, c.count]));

      const result = validCreators.map((creator) => {
        const validated = validatedMap.get(creator.id);
        const followers = validated?.followers ?? creator.instagramFollowers;

        return {
          id: creator.id,
          name: creator.name,
          avatar: creator.avatar,
          instagram: creator.instagram,
          instagramFollowers: followers,
          instagramFollowing: creator.instagramFollowing,
          instagramPosts: creator.instagramPosts,
          instagramValidated: !!validated,
          city: creator.city,
          state: creator.state,
          niche: creator.niche,
          campaignsCount: campaignMap.get(creator.id) || 0,
          communitiesCount: communityMap.get(creator.id) || 0,
        };
      });

      // Background: validate unvalidated Instagram profiles (up to 5 at a time, free API)
      const unvalidated = creatorsWithSocial
        .filter((c) => {
          const hasIg = c.instagram && c.instagram.trim().length > 0;
          return hasIg && !validatedMap.has(c.id);
        })
        .slice(0, 5);

      if (unvalidated.length > 0) {
        setImmediate(async () => {
          for (const creator of unvalidated) {
            try {
              const handle = creator.instagram!.replace('@', '').trim();
              const bdResult = await tryBusinessDiscoveryForProfile(handle);

              if (bdResult && bdResult.exists) {
                try {
                  await db.insert(instagramProfiles).values({
                    username: handle.toLowerCase(),
                    ownerType: 'user',
                    userId: creator.id,
                    source: 'api',
                    followers: bdResult.followers || 0,
                    following: bdResult.following || 0,
                    postsCount: bdResult.postsCount || 0,
                    fullName: bdResult.fullName || null,
                    bio: bdResult.bio || null,
                    profilePicUrl: bdResult.profilePicUrl || null,
                    isVerified: bdResult.isVerified || false,
                    isPrivate: bdResult.isPrivate || false,
                    engagementRate: bdResult.engagementRate || null,
                    topHashtags: bdResult.topHashtags || [],
                    lastFetchedAt: new Date(),
                  });
                } catch (insertErr) {
                  // Profile já existe, ignorar
                }

                if (bdResult.followers !== undefined) {
                  await db
                    .update(users)
                    .set({ instagramFollowers: bdResult.followers })
                    .where(eq(users.id, creator.id));
                }

                console.log(
                  `[Discovery Validation] @${handle} validated: ${bdResult.followers} followers`,
                );
              } else {
                try {
                  await db.insert(instagramProfiles).values({
                    username: handle.toLowerCase(),
                    ownerType: 'user',
                    userId: creator.id,
                    source: 'api',
                    followers: null as any,
                    following: null as any,
                    postsCount: null as any,
                    fullName: null,
                    bio: 'INVALID_PROFILE',
                    lastFetchedAt: new Date(),
                  });
                } catch (insertErr) {
                  // Profile já existe, ignorar
                }

                await db
                  .update(users)
                  .set({ instagramFollowers: 0 })
                  .where(eq(users.id, creator.id));

                console.log(`[Discovery Validation] @${handle} NOT FOUND - marked as invalid`);
              }
            } catch (err: any) {
              console.error(
                `[Discovery Validation] Error validating ${creator.instagram}:`,
                err.message,
              );
            }
          }
        });
      }

      res.json(result);
    } catch (error) {
      console.error('[Discovery Stats] Error:', error);
      res.status(500).json({ error: 'Erro ao buscar dados' });
    }
  });

  // --- Public Creator Profile (No Authentication Required) ---
  app.get('/api/public/creator/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);

      if (!user || user.role !== 'creator') {
        return res.sendStatus(404);
      }

      // Fetch completed partnerships (campaigns with workflowStatus = 'entregue')
      const completedApplicationsRaw = await db
        .select({
          appId: applications.id,
          appCampaignId: applications.campaignId,
          appCompletedAt: applications.appliedAt,
          campaignId: campaigns.id,
          campaignTitle: campaigns.title,
          campaignCompanyId: campaigns.companyId,
          companyId: companies.id,
          companyName: companies.name,
          companyLogo: companies.logo,
        })
        .from(applications)
        .innerJoin(campaigns, eq(applications.campaignId, campaigns.id))
        .innerJoin(companies, eq(campaigns.companyId, companies.id))
        .where(and(eq(applications.creatorId, id), eq(applications.workflowStatus, 'entregue')))
        .orderBy(desc(applications.appliedAt))
        .limit(20);

      // Transform to structured format
      const completedApplications = completedApplicationsRaw.map((row) => ({
        id: row.appId,
        campaignId: row.appCampaignId,
        completedAt: row.appCompletedAt,
        campaign: {
          id: row.campaignId,
          title: row.campaignTitle,
          companyId: row.campaignCompanyId,
        },
        company: {
          id: row.companyId,
          name: row.companyName,
          logo: row.companyLogo,
        },
      }));

      // Get unique partner companies
      const uniquePartners = completedApplications.reduce(
        (acc, app) => {
          if (!acc.find((p) => p.id === app.company.id)) {
            acc.push({
              id: app.company.id,
              name: app.company.name,
              logo: app.company.logo,
            });
          }
          return acc;
        },
        [] as { id: number; name: string; logo: string | null }[],
      );

      // Return only public-facing information (NO sensitive data like email, phone, CPF, PIX)
      const publicProfile = {
        id: user.id,
        name: user.name,
        bio: user.bio,
        avatar: user.avatar,
        niche: user.niche,
        gender: user.gender,
        city: user.city,
        state: user.state,
        instagram: user.instagram,
        youtube: user.youtube,
        tiktok: user.tiktok,
        portfolioUrl: user.portfolioUrl,
        instagramFollowers: user.instagramFollowers,
        instagramFollowing: user.instagramFollowing,
        instagramPosts: user.instagramPosts,
        instagramEngagementRate: user.instagramEngagementRate,
        instagramVerified: user.instagramVerified,
        instagramAuthenticityScore: user.instagramAuthenticityScore,
        instagramTopHashtags: user.instagramTopHashtags,
        instagramTopPosts: user.instagramTopPosts,
        instagramBio: user.instagramBio,
        partnerships: {
          count: completedApplications.length,
          partners: uniquePartners,
          campaigns: completedApplications.map((app) => ({
            id: app.campaign.id,
            title: app.campaign.title,
            company: app.company,
            completedAt: app.completedAt,
          })),
        },
        portfolio: [],
      };

      res.json(publicProfile);
    } catch (error) {
      console.error('[API] Error fetching public creator profile:', error);
      res.status(500).json({ error: 'Failed to fetch creator profile' });
    }
  });

  app.get('/api/public/creator/:id/posts', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);

      if (!user || user.role !== 'creator') {
        return res.sendStatus(404);
      }

      const posts = await storage.getCreatorPosts(id, 'instagram', 12);
      res.json(posts);
    } catch (error) {
      console.error('[API] Error fetching public creator posts:', error);
      res.status(500).json({ error: 'Failed to fetch creator posts' });
    }
  });

  app.get('/api/public/creator/:id/communities', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);

      if (!user || user.role !== 'creator') {
        return res.sendStatus(404);
      }

      const communities = await storage.getCreatorCommunities(id);
      res.json(communities);
    } catch (error) {
      console.error('[API] Error fetching public creator communities:', error);
      res.status(500).json({ error: 'Failed to fetch creator communities' });
    }
  });

  app.get('/api/public/creator/:id/rating', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);

      if (!user || user.role !== 'creator') {
        return res.sendStatus(404);
      }

      // TODO: implement getUserAverageRating
      const rating = 0;
      res.json(rating);
    } catch (error) {
      console.error('[API] Error fetching public creator rating:', error);
      res.status(500).json({ error: 'Failed to fetch creator rating' });
    }
  });

  // --- Favorite Creators ---
  app.get('/api/favorites', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });
    const favoriteIds = await storage.getCompanyFavoriteCreators(activeCompanyId);
    res.json(favoriteIds);
  });

  app.post('/api/favorites/:creatorId', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });
    const creatorId = parseInt(req.params.creatorId);

    // Verify that the user being favorited is actually a creator
    const creator = await storage.getUser(creatorId);
    if (!creator || creator.role !== 'creator') {
      return res.status(400).json({ error: 'Invalid creator ID' });
    }

    try {
      const favorite = await storage.addFavoriteCreator(activeCompanyId, creatorId);
      res.json(favorite);
    } catch (error) {
      // Duplicate favorite will fail on unique constraint
      res.status(400).json({ error: 'Already favorited' });
    }
  });

  app.delete('/api/favorites/:creatorId', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });
    const creatorId = parseInt(req.params.creatorId);

    // Verify that the user being unfavorited is actually a creator
    const creator = await storage.getUser(creatorId);
    if (!creator || creator.role !== 'creator') {
      return res.status(400).json({ error: 'Invalid creator ID' });
    }

    await storage.removeFavoriteCreator(activeCompanyId, creatorId);
    res.sendStatus(204);
  });

  // --- Favorite Companies (for creators) ---
  app.get('/api/favorite-companies', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);
    const favorites = await storage.getCreatorFavoriteCompanies(req.user!.id);
    res.json(favorites);
  });

  app.get('/api/favorite-companies/:companyId/check', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);
    const companyId = parseInt(req.params.companyId);
    const isFavorite = await storage.isCompanyFavorite(req.user!.id, companyId);
    res.json({ isFavorite });
  });

  app.post('/api/favorite-companies/:companyId', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);
    const companyId = parseInt(req.params.companyId);

    // Verify that the company exists
    const company = await storage.getCompany(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    try {
      const favorite = await storage.addFavoriteCompany(req.user!.id, companyId);
      res.json(favorite);
    } catch (error) {
      // Duplicate favorite will fail on unique constraint
      res.status(400).json({ error: 'Empresa já está nos favoritos' });
    }
  });

  app.delete('/api/favorite-companies/:companyId', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);
    const companyId = parseInt(req.params.companyId);

    await storage.removeFavoriteCompany(req.user!.id, companyId);
    res.sendStatus(204);
  });

  // --- Trending Companies ---
  app.get('/api/trending-companies', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const companies = await storage.getTrendingCompanies(limit);
      res.json(companies);
    } catch (error) {
      console.error('[API] Error fetching trending companies:', error);
      res.status(500).json({ error: 'Erro ao buscar empresas em destaque' });
    }
  });

  // --- Discovery: Explore Brands ---
  app.get('/api/discover/brands', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const category = req.query.category as string | undefined;
      const featured = req.query.featured === 'true';
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const brands = await storage.getDiscoverableBrands({ category, featured, limit, offset });
      res.json(brands);
    } catch (error) {
      console.error('[API] Error fetching discoverable brands:', error);
      res.status(500).json({ error: 'Erro ao buscar marcas' });
    }
  });

  // --- Discovery: Featured Brands ---
  app.get('/api/discover/featured', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const limit = parseInt(req.query.limit as string) || 8;
      const brands = await storage.getFeaturedBrands(limit);
      res.json(brands);
    } catch (error) {
      console.error('[API] Error fetching featured brands:', error);
      res.status(500).json({ error: 'Erro ao buscar marcas em destaque' });
    }
  });

  // --- Discovery: Brand Categories with counts ---
  app.get('/api/discover/categories', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const categories = await storage.getBrandCategories();
      res.json(categories);
    } catch (error) {
      console.error('[API] Error fetching brand categories:', error);
      res.status(500).json({ error: 'Erro ao buscar categorias' });
    }
  });

  // --- Discovery: Brand Profile (public for creators) ---
  app.get('/api/discover/brands/:companyId', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const companyId = parseInt(req.params.companyId);
      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ error: 'Marca não encontrada' });
      }

      // Get public campaigns for this company
      const campaigns = await storage.getCompanyCampaigns(companyId);
      const openCampaigns = campaigns.filter(
        (c) => c.status === 'open' && c.visibility === 'public',
      );

      res.json({
        id: company.id,
        name: company.name,
        tradeName: company.tradeName,
        slug: company.slug,
        logo: company.logo,
        coverPhoto: company.coverPhoto,
        description: company.description,
        website: company.website,
        instagram: company.instagram,
        category: company.category,
        tagline: company.tagline,
        isFeatured: company.isFeatured,
        openCampaignsCount: openCampaigns.length,
        campaigns: openCampaigns.map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          budget: c.budget,
          deadline: c.deadline,
          targetNiche: c.targetNiche,
          creatorsNeeded: c.creatorsNeeded,
        })),
      });
    } catch (error) {
      console.error('[API] Error fetching brand profile:', error);
      res.status(500).json({ error: 'Erro ao buscar perfil da marca' });
    }
  });

  // --- Companies Lookup (for displaying company names in campaign lists) ---
  app.get('/api/companies-lookup', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const idsParam = req.query.ids as string;
      if (!idsParam) {
        return res.json([]);
      }
      const ids = idsParam
        .split(',')
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));
      if (ids.length === 0) {
        return res.json([]);
      }
      const companiesData = await Promise.all(
        ids.map(async (id) => {
          const company = await storage.getCompany(id);
          if (company) {
            return {
              id: company.id,
              name: company.name,
              tradeName: company.tradeName,
              logo: company.logo,
            };
          }
          return null;
        }),
      );
      res.json(companiesData.filter((c) => c !== null));
    } catch (error) {
      console.error('[API] Error fetching companies lookup:', error);
      res.status(500).json({ error: 'Erro ao buscar empresas' });
    }
  });

  // --- Company Public Campaigns ---
  app.get('/api/companies/:companyId/public-campaigns', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const companyId = parseInt(req.params.companyId);
      const allCampaigns = await storage.getCompanyCampaigns(companyId);

      const publicCampaigns = allCampaigns.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        status: c.status,
        budget: c.budget,
        deadline: c.deadline,
        targetNiche: c.targetNiche,
        creatorsNeeded: c.creatorsNeeded,
        createdAt: c.createdAt,
      }));

      res.json(publicCampaigns);
    } catch (error) {
      console.error('[API] Error fetching company public campaigns:', error);
      res.status(500).json({ error: 'Erro ao buscar campanhas da empresa' });
    }
  });

  // --- Campaign Invites ---

  // Company sends invite to creator
  app.post('/api/campaigns/:campaignId/invites', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) {
      return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });
    }
    const campaignId = parseInt(req.params.campaignId);
    const { creatorId } = req.body;

    if (!creatorId) {
      return res.status(400).json({ error: 'Creator ID is required' });
    }

    // Verify campaign belongs to active store
    const campaign = await storage.getCampaign(campaignId);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (campaign.companyId !== activeCompanyId) return res.sendStatus(403);

    // Verify creator exists
    const creator = await storage.getUser(creatorId);
    if (!creator || creator.role !== 'creator') {
      return res.status(400).json({ error: 'Invalid creator ID' });
    }

    // Check if invite already exists
    const existingInvite = await storage.getExistingInvite(campaignId, creatorId);
    if (existingInvite) {
      return res.status(400).json({ error: 'Convite já enviado para este criador' });
    }

    // Check if creator already applied
    const existingApplication = await storage.getExistingApplication(campaignId, creatorId);
    if (existingApplication) {
      return res.status(400).json({ error: 'Este criador já se candidatou a esta campanha' });
    }

    try {
      const invite = await storage.createCampaignInvite({
        campaignId,
        companyId: activeCompanyId,
        creatorId,
        status: 'pending',
      });

      // Create persistent notification for creator (with type 'campaign_invite' to filter from bell)
      const activeCompany = await storage.getCompany(activeCompanyId);
      await storage.createNotification({
        userId: creatorId,
        type: 'campaign_invite',
        title: 'Novo convite de campanha!',
        message: `${activeCompany?.name || 'Uma empresa'} te convidou para a campanha "${campaign.title}"`,
        actionUrl: `/creator/invites`,
        isRead: false,
      });

      // Send WebSocket notification
      const { sendNotificationToUser } = await import('./websocket');
      sendNotificationToUser(creatorId, {
        type: 'campaign_invite',
        title: 'Novo convite de campanha!',
        message: `${activeCompany?.name || 'Uma empresa'} te convidou para a campanha "${campaign.title}"`,
        actionUrl: `/creator/invites`,
        inviteId: invite.id,
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        companyName: activeCompany?.name || '',
      });

      res.json(invite);
    } catch (error) {
      console.error('[API] Error creating invite:', error);
      res.status(500).json({ error: 'Failed to create invite' });
    }
  });

  // Bulk invite creators to a campaign
  app.post('/api/campaigns/:campaignId/invites/bulk', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) {
      return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });
    }
    const campaignId = parseInt(req.params.campaignId);
    const { creatorIds } = req.body;

    if (!creatorIds || !Array.isArray(creatorIds) || creatorIds.length === 0) {
      return res.status(400).json({ error: 'Lista de criadores é obrigatória' });
    }

    // Verify campaign belongs to active store
    const campaign = await storage.getCampaign(campaignId);
    if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada' });
    if (campaign.companyId !== activeCompanyId) return res.sendStatus(403);

    const activeCompany = await storage.getCompany(activeCompanyId);
    const { sendNotificationToUser } = await import('./websocket');

    const results = {
      sent: [] as number[],
      alreadyInvited: [] as number[],
      alreadyApplied: [] as number[],
      invalidCreator: [] as number[],
      errors: [] as number[],
    };

    for (const creatorId of creatorIds) {
      try {
        // Verify creator exists
        const creator = await storage.getUser(creatorId);
        if (!creator || creator.role !== 'creator') {
          results.invalidCreator.push(creatorId);
          continue;
        }

        // Check if invite already exists
        const existingInvite = await storage.getExistingInvite(campaignId, creatorId);
        if (existingInvite) {
          results.alreadyInvited.push(creatorId);
          continue;
        }

        // Check if creator already applied
        const existingApplication = await storage.getExistingApplication(campaignId, creatorId);
        if (existingApplication) {
          results.alreadyApplied.push(creatorId);
          continue;
        }

        // Create invite
        const invite = await storage.createCampaignInvite({
          campaignId,
          companyId: activeCompanyId,
          creatorId,
          status: 'pending',
        });

        // Create persistent notification
        await storage.createNotification({
          userId: creatorId,
          type: 'campaign_invite',
          title: 'Novo convite de campanha!',
          message: `${activeCompany?.name || 'Uma empresa'} te convidou para a campanha "${campaign.title}"`,
          actionUrl: `/creator/invites`,
          isRead: false,
        });

        // Send WebSocket notification
        sendNotificationToUser(creatorId, {
          type: 'campaign_invite',
          title: 'Novo convite de campanha!',
          message: `${activeCompany?.name || 'Uma empresa'} te convidou para a campanha "${campaign.title}"`,
          actionUrl: `/creator/invites`,
          inviteId: invite.id,
          campaignId: campaign.id,
          campaignTitle: campaign.title,
          companyName: activeCompany?.name || '',
        });

        results.sent.push(creatorId);
      } catch (error) {
        console.error(`[API] Error creating invite for creator ${creatorId}:`, error);
        results.errors.push(creatorId);
      }
    }

    res.json({
      success: true,
      results,
      summary: {
        total: creatorIds.length,
        sent: results.sent.length,
        skipped:
          results.alreadyInvited.length +
          results.alreadyApplied.length +
          results.invalidCreator.length,
        errors: results.errors.length,
      },
    });
  });

  // Get invites for a campaign (company view)
  app.get('/api/campaigns/:campaignId/invites', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) {
      return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });
    }
    const campaignId = parseInt(req.params.campaignId);

    // Verify campaign belongs to active store
    const campaign = await storage.getCampaign(campaignId);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (campaign.companyId !== activeCompanyId) return res.sendStatus(403);

    const invites = await storage.getCampaignInvites(campaignId);
    res.json(invites);
  });

  // Get creator's pending invites
  app.get('/api/invites/pending', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);
    const creatorId = Number(req.user!.id);
    const invites = await storage.getCreatorPendingInvites(creatorId);
    res.json(invites);
  });

  // Get creator's all invites
  app.get('/api/invites', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);
    const creatorId = Number(req.user!.id);
    const invites = await storage.getCreatorAllInvites(creatorId);
    res.json(invites);
  });

  // Get pending invite count
  app.get('/api/invites/count', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);
    const creatorId = Number(req.user!.id);
    const count = await storage.getCreatorPendingInviteCount(creatorId);
    res.json({ count });
  });

  // Accept invite
  app.post('/api/invites/:id/accept', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);
    const creatorId = Number(req.user!.id);
    const inviteId = parseInt(req.params.id);

    const invite = await storage.getCampaignInvite(inviteId);
    if (!invite) return res.status(404).json({ error: 'Invite not found' });
    if (invite.creatorId !== creatorId) return res.sendStatus(403);
    if (invite.status !== 'pending') {
      return res.status(400).json({ error: 'Invite already responded' });
    }

    // Update invite status
    const updatedInvite = await storage.updateInviteStatus(inviteId, 'accepted');

    // Create application automatically with 'accepted' status since creator was invited
    const campaign = await storage.getCampaign(invite.campaignId);
    const application = await storage.createApplication({
      campaignId: invite.campaignId,
      creatorId,
      status: 'accepted',
      workflowStatus: 'aceito',
      creatorWorkflowStatus: 'aceito',
    });

    // Auto-join community: create membership if not exists
    // Check brandProgram settings - defaults to true if no program configured
    const company = await storage.getCompany(invite.companyId);
    const brandProgram = await storage.getBrandProgram(invite.companyId);
    const autoJoinCommunity = brandProgram?.autoJoinCommunity !== false; // Default true

    if (autoJoinCommunity) {
      const existingMembership = await storage.getBrandCreatorMembershipByCreatorAndCompany(
        creatorId,
        invite.companyId,
      );
      if (!existingMembership) {
        await storage.createBrandCreatorMembership({
          companyId: invite.companyId,
          creatorId,
          status: 'active',
          source: 'campaign',
          campaignId: invite.campaignId,
          joinedAt: new Date(),
        });
      } else if (existingMembership.status === 'invited') {
        // If they had a pending community invite, activate the membership
        await storage.updateBrandCreatorMembership(existingMembership.id, {
          status: 'active',
          source: 'campaign',
          campaignId: invite.campaignId,
          joinedAt: new Date(),
        });
      }
    }

    // Notify company owner
    if (campaign && company) {
      const creator = await storage.getUser(creatorId);
      const notification = await storage.createNotification({
        userId: company.createdByUserId,
        type: 'new_applicant',
        title: 'Convite aceito!',
        message: `${creator?.name} aceitou o convite para a campanha "${campaign.title}"`,
        actionUrl: `/company/campaigns/${campaign.id}/manage`,
        isRead: false,
      });

      // Send real-time notification via WebSocket
      const { notificationWS } = await import('./websocket');
      if (notificationWS) {
        notificationWS.sendToUser(company.createdByUserId, notification);
        // Also send event to refresh campaign applications list
        notificationWS.sendEventToUser(company.createdByUserId, {
          type: 'application:created',
          campaignId: campaign.id,
        });
      }
    }

    // Return application with campaign data for frontend cache
    const applicationWithCampaign = { ...application, campaign };
    res.json({ invite: updatedInvite, application: applicationWithCampaign });
  });

  // Decline invite
  app.post('/api/invites/:id/decline', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);
    const creatorId = Number(req.user!.id);
    const inviteId = parseInt(req.params.id);

    const invite = await storage.getCampaignInvite(inviteId);
    if (!invite) return res.status(404).json({ error: 'Invite not found' });
    if (invite.creatorId !== creatorId) return res.sendStatus(403);
    if (invite.status !== 'pending') {
      return res.status(400).json({ error: 'Invite already responded' });
    }

    const updatedInvite = await storage.updateInviteStatus(inviteId, 'declined');
    res.json(updatedInvite);
  });

  // --- Campaign Templates ---
  app.post('/api/templates', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    try {
      const data = insertCampaignTemplateSchema.parse({
        ...req.body,
        companyId: activeCompanyId,
      });

      const template = await storage.createCampaignTemplate(data);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json(error.errors);
      } else {
        res.status(500).json({ error: 'Failed to create template' });
      }
    }
  });

  app.get('/api/templates', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const templates = await storage.getCompanyTemplates(activeCompanyId);
    res.json(templates);
  });

  app.get('/api/templates/:id', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });
    const id = parseInt(req.params.id);

    const template = await storage.getCampaignTemplate(id);
    if (!template) return res.sendStatus(404);
    if (template.companyId !== activeCompanyId) return res.sendStatus(403);

    res.json(template);
  });

  app.patch('/api/templates/:id', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });
    const id = parseInt(req.params.id);

    const template = await storage.getCampaignTemplate(id);
    if (!template) return res.sendStatus(404);
    if (template.companyId !== activeCompanyId) return res.sendStatus(403);

    try {
      const partialSchema = insertCampaignTemplateSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      const updated = await storage.updateCampaignTemplate(id, validatedData);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json(error.errors);
      } else {
        res.status(500).json({ error: 'Failed to update template' });
      }
    }
  });

  app.delete('/api/templates/:id', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });
    const id = parseInt(req.params.id);

    const template = await storage.getCampaignTemplate(id);
    if (!template) return res.sendStatus(404);
    if (template.companyId !== activeCompanyId) return res.sendStatus(403);

    await storage.deleteCampaignTemplate(id);
    res.sendStatus(204);
  });

  // Create campaign from template
  app.post('/api/templates/:id/create-campaign', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });
    const templateId = parseInt(req.params.id);

    const template = await storage.getCampaignTemplate(templateId);
    if (!template) return res.sendStatus(404);
    if (template.companyId !== activeCompanyId) return res.sendStatus(403);

    try {
      // Allow overrides from request body for specific fields
      const overrides = req.body || {};

      const campaignData = {
        companyId: activeCompanyId,
        title: overrides.title || template.title,
        description: overrides.description || template.campaignDescription,
        requirements: overrides.requirements || template.requirements,
        structuredDeliverables:
          overrides.structuredDeliverables || template.structuredDeliverables || [],
        targetPlatforms: overrides.targetPlatforms || template.targetPlatforms || [],
        budget: overrides.budget || template.budget,
        deadline: overrides.deadline || template.deadline,
        creatorsNeeded: overrides.creatorsNeeded || template.creatorsNeeded,
        targetNiche: overrides.targetNiche || template.targetNiche,
        targetAgeRanges: overrides.targetAgeRanges || template.targetAgeRanges,
        targetRegions: overrides.targetRegions || template.targetRegions,
        targetGender: overrides.targetGender || template.targetGender,
        visibility: overrides.visibility || template.visibility || 'public',
        minTierId: overrides.minTierId ?? template.minTierId,
        minPoints: overrides.minPoints ?? template.minPoints ?? 0,
        allowedTiers: overrides.allowedTiers || template.allowedTiers || [],
        rewardsJson: overrides.rewardsJson || template.rewardsJson || [],
        rewardMode: overrides.rewardMode || template.rewardMode || 'ranking',
        briefingText: overrides.briefingText || template.briefingText,
        templateId: templateId,
        status: 'open',
        deliverables: [],
      };

      const validatedData = insertCampaignSchema.parse(campaignData);
      const campaign = await storage.createCampaign(validatedData);
      res.status(201).json(campaign);
    } catch (error) {
      console.error('Error creating campaign from template:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json(error.errors);
      } else {
        res.status(500).json({ error: 'Failed to create campaign from template' });
      }
    }
  });

  // --- Applications ---
  app.post('/api/applications', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    try {
      const data = insertApplicationSchema.parse({
        ...req.body,
        creatorId: Number(req.user!.id),
        status: 'pending',
      });

      // Check if already applied
      const existing = await storage.getExistingApplication(data.campaignId, data.creatorId);
      if (existing) {
        return res.status(409).json({ error: 'You have already applied to this campaign' });
      }

      // Visibility and eligibility checks for community_only campaigns
      const campaign = await storage.getCampaign(data.campaignId);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      if (campaign.visibility === 'community_only') {
        // Check if creator is a member of the brand community
        const membership = await storage.getBrandCreatorMembershipByCreatorAndCompany(
          data.creatorId,
          campaign.companyId,
        );

        if (!membership || membership.status !== 'active') {
          return res.status(403).json({
            error: 'Esta campanha é exclusiva para membros da comunidade',
            code: 'NOT_COMMUNITY_MEMBER',
          });
        }

        // Check minPoints requirement
        if (campaign.minPoints && campaign.minPoints > 0) {
          const creatorPoints = membership.pointsCache || 0;
          if (creatorPoints < campaign.minPoints) {
            return res.status(403).json({
              error: `Você precisa de pelo menos ${campaign.minPoints} pontos para participar. Você tem ${creatorPoints} pontos.`,
              code: 'INSUFFICIENT_POINTS',
              required: campaign.minPoints,
              current: creatorPoints,
            });
          }
        }

        // Check tier eligibility
        if (campaign.minTierId) {
          const creatorTierId = membership.tierId;
          if (!creatorTierId) {
            return res.status(403).json({
              error: 'Você precisa ter um tier atribuído para participar desta campanha',
              code: 'NO_TIER',
            });
          }
          // Get tier configs to compare levels based on minPoints (higher minPoints = higher tier)
          const minTier = await storage.getBrandTierConfig(campaign.minTierId);
          const creatorTier = await storage.getBrandTierConfig(creatorTierId);

          // If we can't find tier configs, deny access for safety
          if (!minTier) {
            return res.status(403).json({
              error: 'Não foi possível verificar o tier mínimo desta campanha',
              code: 'TIER_CONFIG_ERROR',
            });
          }
          if (!creatorTier) {
            return res.status(403).json({
              error: 'Não foi possível verificar seu tier atual',
              code: 'TIER_CONFIG_ERROR',
            });
          }

          // Creator's tier minPoints must be >= required tier minPoints
          const creatorTierLevel = creatorTier.minPoints ?? 0;
          const requiredTierLevel = minTier.minPoints ?? 0;
          if (creatorTierLevel < requiredTierLevel) {
            return res.status(403).json({
              error: `Tier mínimo necessário: ${minTier.tierName}. Seu tier atual: ${creatorTier.tierName}`,
              code: 'TIER_TOO_LOW',
              requiredTier: minTier.tierName,
              currentTier: creatorTier.tierName,
            });
          }
        }

        // Check allowedTiers if specified
        if (campaign.allowedTiers && campaign.allowedTiers.length > 0) {
          const creatorTierId = membership.tierId;
          if (!creatorTierId || !campaign.allowedTiers.includes(creatorTierId)) {
            return res.status(403).json({
              error: 'Seu tier atual não está na lista de tiers permitidos para esta campanha',
              code: 'TIER_NOT_ALLOWED',
            });
          }
        }
      } else if (campaign.visibility === 'private') {
        // Private campaigns require invitation - regular application is not allowed
        return res.status(403).json({
          error: 'Esta campanha é privada. Você precisa de um convite para participar.',
          code: 'PRIVATE_CAMPAIGN',
        });
      }

      const application = await storage.createApplication(data);

      // Campaign already fetched above for visibility checks
      if (campaign) {
        // Get company members to notify (owners and admins)
        const companyMembers = await storage.getCompanyMembers(campaign.companyId);
        const membersToNotify = companyMembers.filter(
          (m) => m.role === 'owner' || m.role === 'admin',
        );

        const { notificationWS } = await import('./websocket');

        // Create notification for each company member
        for (const member of membersToNotify) {
          const notification = await storage.createNotification({
            userId: member.userId,
            title: 'Nova candidatura recebida',
            message: `${req.user!.name} se candidatou para a campanha "${campaign.title}"`,
            type: 'new_applicant',
            actionUrl: `/campaign/${campaign.id}/manage`,
            isRead: false,
          });

          // Send real-time notification via WebSocket
          if (notificationWS) {
            notificationWS.sendToUser(member.userId, notification);
            // Also send event to refresh campaign applications list
            notificationWS.sendEventToUser(member.userId, {
              type: 'application:created',
              campaignId: campaign.id,
            });
          }

          // Email notification removed to avoid spam - use weekly digest instead
        }
      }

      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json(error.errors);
      } else {
        res.status(500).json({ error: 'Failed to create application' });
      }
    }
  });

  app.get('/api/applications', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const campaignId = req.query.campaignId ? parseInt(req.query.campaignId as string) : undefined;
    const creatorId = req.query.creatorId ? parseInt(req.query.creatorId as string) : undefined;

    if (campaignId) {
      // Check if company owns the campaign via active store
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) return res.sendStatus(404);
      if (req.user!.role === 'company') {
        const activeCompanyId = req.session.activeCompanyId;
        if (!activeCompanyId || campaign.companyId !== activeCompanyId) return res.sendStatus(403);
      }

      const apps = await storage.getCampaignApplications(campaignId);
      res.json(apps);
    } else if (creatorId) {
      if (Number(req.user!.id) !== creatorId) return res.sendStatus(403);
      const apps = await storage.getCreatorApplications(creatorId);
      res.json(apps);
    } else {
      // Default behavior if no params:
      // If company, return all applications for their active store campaigns
      // If creator, return their applications
      if (req.user!.role === 'company') {
        const activeCompanyId = req.session.activeCompanyId;
        if (!activeCompanyId)
          return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });
        const apps = await storage.getCompanyApplications(activeCompanyId);
        res.json(apps);
      } else {
        const apps = await storage.getCreatorApplications(Number(req.user!.id));
        res.json(apps);
      }
    }
  });

  app.patch('/api/applications/:id/status', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const id = parseInt(req.params.id);
    const status = req.body.status;
    const activeCompanyId = req.session.activeCompanyId;

    if (status !== 'accepted' && status !== 'rejected')
      return res.status(400).send('Invalid status');
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    // Verify ownership via campaign and active store
    const application = await storage.getApplication(id);
    if (!application) return res.sendStatus(404);

    const campaign = await storage.getCampaign(application.campaignId);
    if (!campaign || campaign.companyId !== activeCompanyId) return res.sendStatus(403);

    const updated = await storage.updateApplicationStatus(id, status);

    // Create notification for creator
    const statusMessage =
      status === 'accepted' ? 'Sua candidatura foi aceita!' : 'Sua candidatura foi recusada';

    const notification = await storage.createNotification({
      userId: application.creatorId,
      title: statusMessage,
      message: `A empresa "${req.user!.name}" ${status === 'accepted' ? 'aceitou' : 'recusou'} sua candidatura para "${campaign.title}"`,
      type: status === 'accepted' ? 'application_accepted' : 'application_rejected',
      actionUrl: `/applications`,
      isRead: false,
    });

    // Send real-time notification via WebSocket
    const { notificationWS } = await import('./websocket');
    if (notificationWS) {
      notificationWS.sendToUser(application.creatorId, notification);
    }

    // Send email notification to creator only when ACCEPTED (avoid spam on rejection)
    if (status === 'accepted') {
      try {
        const creatorUser = await storage.getUser(application.creatorId);
        if (creatorUser?.email) {
          const company = await storage.getCompany(activeCompanyId);
          const { sendApplicationApprovedEmail } = await import('./email');
          await sendApplicationApprovedEmail(creatorUser.email, creatorUser.name || 'Creator', {
            title: campaign.title,
            brand: company?.tradeName || company?.name || req.user!.name || 'Marca',
            brandLogo: company?.logo || undefined,
            value: campaign.budget ? `R$ ${campaign.budget}` : undefined,
            deadline: (campaign as any).endDate
              ? new Date((campaign as any).endDate).toLocaleDateString('pt-BR')
              : undefined,
            type: (campaign as any).type || undefined,
          });
        }
      } catch (emailError) {
        console.error('[Email] Failed to send application approved email:', emailError);
      }
    }
    // Rejection emails removed to avoid spam - creator sees status in-app

    res.json(updated);
  });

  app.delete('/api/applications/:id', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);
    const id = parseInt(req.params.id);

    // Verify ownership
    const application = await storage.getApplication(id);
    if (!application) return res.sendStatus(404);
    if (application.creatorId !== Number(req.user!.id)) return res.sendStatus(403);

    await storage.deleteApplication(id);
    res.sendStatus(204);
  });

  // Get creator's accepted applications (active campaigns)
  app.get('/api/applications/active', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);
    const creatorId = Number(req.user!.id);
    const applications = await storage.getCreatorAcceptedApplications(creatorId);
    res.json(applications);
  });

  // Update application workflow status (creator only)
  app.patch('/api/applications/:id/workflow-status', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);
    const id = parseInt(req.params.id);
    const { workflowStatus } = req.body;

    if (!workflowStatus) {
      return res.status(400).json({ error: 'workflowStatus is required' });
    }

    // Verify ownership
    const application = await storage.getApplication(id);
    if (!application) return res.sendStatus(404);
    if (application.creatorId !== Number(req.user!.id)) return res.sendStatus(403);

    const updated = await storage.updateApplicationWorkflowStatus(id, workflowStatus);

    // Get campaign for notification
    const campaign = await storage.getCampaign(application.campaignId);
    if (campaign) {
      // Notify company about workflow update
      const notification = await storage.createNotification({
        userId: campaign.companyId,
        title: 'Atualização de Status',
        message: `Status da campanha "${campaign.title}" foi atualizado para: ${workflowStatus}`,
        type: 'workflow_update',
        actionUrl: `/campaign/${campaign.id}/manage`,
        isRead: false,
      });

      // Send real-time notification via WebSocket
      const { notificationWS } = await import('./websocket');
      if (notificationWS) {
        notificationWS.sendToUser(campaign.companyId, notification);
      }
    }

    res.json(updated);
  });

  // Update application workflow status (company only)
  app.patch('/api/applications/:id/workflow-status-company', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const id = parseInt(req.params.id);
    const { workflowStatus } = req.body;
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    if (!workflowStatus) {
      return res.status(400).json({ error: 'workflowStatus is required' });
    }

    const application = await storage.getApplication(id);
    if (!application) return res.sendStatus(404);

    // Verify campaign belongs to active store
    const campaign = await storage.getCampaign(application.campaignId);
    if (!campaign || campaign.companyId !== activeCompanyId) return res.sendStatus(403);

    const updated = await storage.updateApplicationWorkflowStatus(id, workflowStatus);

    // Notify creator about workflow update
    const notification = await storage.createNotification({
      userId: application.creatorId,
      title: 'Atualização de Status',
      message: `Status da campanha "${campaign.title}" foi atualizado para: ${getWorkflowStatusLabel(workflowStatus)}`,
      type: 'workflow_update',
      actionUrl: `/active-campaigns`,
      isRead: false,
    });

    // Send real-time notification via WebSocket
    const { notificationWS } = await import('./websocket');
    if (notificationWS) {
      notificationWS.sendToUser(application.creatorId, notification);
    }

    // If project is marked as "entregue", send review reminders to both parties
    if (workflowStatus === 'entregue') {
      // Notify creator to review the company
      const creatorReviewNotification = await storage.createNotification({
        userId: application.creatorId,
        title: 'Projeto Concluído! Avalie a empresa',
        message: `A campanha "${campaign.title}" foi finalizada. Avalie sua experiência com a empresa!`,
        type: 'review_reminder',
        actionUrl: `/campaign/${campaign.id}/workspace`,
        isRead: false,
      });
      if (notificationWS) {
        notificationWS.sendToUser(application.creatorId, creatorReviewNotification);
      }

      // Notify company user to review the creator (notify the company member who updated)
      const companyReviewNotification = await storage.createNotification({
        userId: req.user!.id,
        title: 'Projeto Concluído! Avalie o criador',
        message: `A campanha "${campaign.title}" foi finalizada. Avalie sua experiência com o criador!`,
        type: 'review_reminder',
        actionUrl: `/kanban`,
        isRead: false,
      });
      if (notificationWS) {
        notificationWS.sendToUser(req.user!.id, companyReviewNotification);
      }
    }

    res.json(updated);
  });

  // Update application creator workflow status (creator only)
  app.patch('/api/applications/:id/creator-workflow-status', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);
    const id = parseInt(req.params.id);
    const { creatorWorkflowStatus } = req.body;

    if (!creatorWorkflowStatus) {
      return res.status(400).json({ error: 'creatorWorkflowStatus is required' });
    }

    // Validate status is in allowed enum
    const validStatuses = [
      'aceito',
      'contrato',
      'aguardando_produto',
      'producao',
      'revisao',
      'entregue',
    ];
    if (!validStatuses.includes(creatorWorkflowStatus)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const application = await storage.getApplication(id);
    if (!application) return res.sendStatus(404);
    if (application.creatorId !== Number(req.user!.id)) return res.sendStatus(403);

    const currentStatus = application.creatorWorkflowStatus || 'aceito';

    const updated = await storage.updateApplicationCreatorWorkflowStatus(id, creatorWorkflowStatus);

    // Notify company members about creator workflow update
    const campaign = await storage.getCampaign(application.campaignId);
    if (campaign) {
      // Get company members to notify (owners and admins)
      const companyMembers = await storage.getCompanyMembers(campaign.companyId);
      const membersToNotify = companyMembers.filter(
        (m) => m.role === 'owner' || m.role === 'admin',
      );

      const { notificationWS } = await import('./websocket');

      for (const member of membersToNotify) {
        const notification = await storage.createNotification({
          userId: member.userId,
          title: 'Atualização de Produção',
          message: `O criador atualizou o status de produção para: ${getCreatorWorkflowStatusLabel(creatorWorkflowStatus)}`,
          type: 'workflow_update',
          actionUrl: `/kanban`,
          isRead: false,
        });

        // Send real-time notification via WebSocket
        if (notificationWS) {
          notificationWS.sendToUser(member.userId, notification);
          // Also send event to refresh kanban
          notificationWS.sendEventToUser(member.userId, {
            type: 'creator:workflow_changed',
            applicationId: id,
            campaignId: application.campaignId,
            newStatus: creatorWorkflowStatus,
          });
        }

        // If project is marked as "entregue" by creator, send review reminders
        if (creatorWorkflowStatus === 'entregue') {
          const reviewNotification = await storage.createNotification({
            userId: member.userId,
            title: 'Projeto Concluído! Avalie o criador',
            message: `A campanha "${campaign.title}" foi finalizada. Avalie sua experiência com o criador!`,
            type: 'review_reminder',
            actionUrl: `/kanban`,
            isRead: false,
          });
          if (notificationWS) {
            notificationWS.sendToUser(member.userId, reviewNotification);
          }
        }
      }

      // Notify creator to review company when they mark as entregue
      if (creatorWorkflowStatus === 'entregue') {
        const creatorReviewNotification = await storage.createNotification({
          userId: req.user!.id,
          title: 'Projeto Concluído! Avalie a empresa',
          message: `A campanha "${campaign.title}" foi finalizada. Avalie sua experiência com a empresa!`,
          type: 'review_reminder',
          actionUrl: `/campaign/${campaign.id}/workspace`,
          isRead: false,
        });
        if (notificationWS) {
          notificationWS.sendToUser(req.user!.id, creatorReviewNotification);
        }

        // Update campaign ranking stats when deliverable is marked as completed
        // Idempotency check: only award points if previous status was not "entregue"
        // This prevents point farming by toggling status back and forth
        const previousStatus = application.creatorWorkflowStatus || 'aceito';
        if (previousStatus !== 'entregue') {
          const existingStats = await storage.getCampaignCreatorStats(campaign.id, req.user!.id);

          // Calculate if this deliverable was on time (using campaign deadline)
          const isOnTime = campaign.deadline ? new Date() <= new Date(campaign.deadline) : true;

          // Points system: 100 for completion, +25 bonus for on-time
          const deliverablePoints = 100 + (isOnTime ? 25 : 0);

          if (existingStats) {
            await storage.upsertCampaignCreatorStats({
              campaignId: campaign.id,
              creatorId: req.user!.id,
              deliverablesCompleted: existingStats.deliverablesCompleted + 1,
              deliverablesOnTime: existingStats.deliverablesOnTime + (isOnTime ? 1 : 0),
              points: existingStats.points + deliverablePoints,
              totalViews: existingStats.totalViews,
              totalEngagement: existingStats.totalEngagement,
              totalSales: existingStats.totalSales,
              qualityScore: existingStats.qualityScore || 0,
            });
          } else {
            await storage.upsertCampaignCreatorStats({
              campaignId: campaign.id,
              creatorId: req.user!.id,
              points: deliverablePoints,
              deliverablesCompleted: 1,
              deliverablesOnTime: isOnTime ? 1 : 0,
              totalViews: 0,
              totalEngagement: 0,
              totalSales: 0,
              qualityScore: 0,
            });
          }

          // Recalculate rankings after update
          await storage.recalculateCampaignRankings(campaign.id);

          // GAMIFICATION V2: Add points to ledger
          try {
            const scoringRules = await storage.getEffectiveScoringRules(
              campaign.id,
              campaign.companyId,
            );

            const appDeliverables = await storage.getApplicationDeliverables(id);

            let totalDeliverablePoints = 0;
            const typePointsDetails: string[] = [];

            if (
              appDeliverables.length > 0 &&
              Object.keys(scoringRules.pointsPerDeliverableType).length > 0
            ) {
              for (const deliverable of appDeliverables) {
                const dtype = (deliverable.deliverableType ||
                  'other') as keyof typeof scoringRules.pointsPerDeliverableType;
                const typePoints =
                  scoringRules.pointsPerDeliverableType[dtype] ?? scoringRules.pointsPerDeliverable;
                totalDeliverablePoints += typePoints;
                typePointsDetails.push(`${dtype}: ${typePoints}pts`);
              }
            } else {
              totalDeliverablePoints =
                scoringRules.pointsPerDeliverable * Math.max(1, appDeliverables.length);
            }

            await storage.addPointsLedgerEntry({
              companyId: campaign.companyId,
              campaignId: campaign.id,
              creatorId: req.user!.id,
              deltaPoints: totalDeliverablePoints,
              eventType: 'delivery_approved',
              refType: 'application',
              refId: id,
              notes:
                typePointsDetails.length > 0
                  ? `Entrega aprovada (${typePointsDetails.join(', ')}) - Campanha: ${campaign.title}`
                  : `Entrega aprovada - Campanha: ${campaign.title}`,
            });

            if (isOnTime) {
              await storage.addPointsLedgerEntry({
                companyId: campaign.companyId,
                campaignId: campaign.id,
                creatorId: req.user!.id,
                deltaPoints: scoringRules.pointsOnTimeBonus,
                eventType: 'delivery_approved',
                refType: 'application',
                refId: id,
                notes: `Bônus de entrega no prazo - Campanha: ${campaign.title}`,
              });
            }

            await storage.updateBrandCreatorPoints(
              campaign.companyId,
              req.user!.id,
              totalDeliverablePoints + (isOnTime ? scoringRules.pointsOnTimeBonus : 0),
            );

            await storage.recalculateCampaignRanks(campaign.id);
          } catch (gamificationError) {
            console.error('Gamification v2 error:', gamificationError);
          }
        }
      }
    }

    res.json(updated);
  });

  // Approve deliverables and mark as complete (company only)
  app.patch('/api/applications/:id/approve', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const id = parseInt(req.params.id);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const application = await storage.getApplication(id);
    if (!application) return res.sendStatus(404);

    // Verify campaign belongs to active store
    const campaign = await storage.getCampaign(application.campaignId);
    if (!campaign || campaign.companyId !== activeCompanyId) return res.sendStatus(403);

    // Set workflow status to "entregue"
    const updated = await storage.updateApplicationWorkflowStatus(id, 'entregue');
    res.json(updated);
  });

  // Update creator performance metrics for campaign ranking (company only)
  app.patch('/api/applications/:id/metrics', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const id = parseInt(req.params.id);
    const { views, engagement, sales, qualityScore } = req.body;
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    // Validate numeric inputs
    if (views !== undefined && (typeof views !== 'number' || views < 0)) {
      return res.status(400).json({ error: 'Views deve ser um número não-negativo' });
    }
    if (engagement !== undefined && (typeof engagement !== 'number' || engagement < 0)) {
      return res.status(400).json({ error: 'Engajamento deve ser um número não-negativo' });
    }
    if (sales !== undefined && (typeof sales !== 'number' || sales < 0)) {
      return res.status(400).json({ error: 'Vendas deve ser um número não-negativo' });
    }
    if (
      qualityScore !== undefined &&
      (typeof qualityScore !== 'number' || qualityScore < 0 || qualityScore > 5)
    ) {
      return res.status(400).json({ error: 'Qualidade deve ser um número entre 0 e 5' });
    }

    const application = await storage.getApplication(id);
    if (!application) return res.sendStatus(404);

    // Verify campaign belongs to active store
    const campaign = await storage.getCampaign(application.campaignId);
    if (!campaign || campaign.companyId !== activeCompanyId) return res.sendStatus(403);

    // Get or create campaign creator stats
    const stats = await storage.getCampaignCreatorStats(campaign.id, application.creatorId);

    // Determine final values - use new value if provided, otherwise keep existing
    const newViews = views ?? (stats?.totalViews || 0);
    const newEngagement = engagement ?? (stats?.totalEngagement || 0);
    const newSales = sales ?? (stats?.totalSales || 0);
    const newQuality = qualityScore ?? (stats?.qualityScore || 0);

    // Calculate points from final metrics
    // Views: 1 point per 1000 views
    // Engagement: 1 point per 100 interactions
    // Sales: 10 points per sale
    // Quality: qualityScore * 10 points
    const newViewPoints = Math.floor(newViews / 1000);
    const newEngagementPoints = Math.floor(newEngagement / 100);
    const newSalesPoints = newSales * 10;
    const newQualityPoints = newQuality * 10;
    const newMetricPoints = newViewPoints + newEngagementPoints + newSalesPoints + newQualityPoints;

    if (stats) {
      // Calculate previous metric points
      const previousViewPoints = Math.floor(stats.totalViews / 1000);
      const previousEngagementPoints = Math.floor(stats.totalEngagement / 100);
      const previousSalesPoints = stats.totalSales * 10;
      const previousQualityPoints = (stats.qualityScore || 0) * 10;
      const previousMetricPoints =
        previousViewPoints + previousEngagementPoints + previousSalesPoints + previousQualityPoints;

      const pointsDelta = newMetricPoints - previousMetricPoints;

      await storage.upsertCampaignCreatorStats({
        campaignId: campaign.id,
        creatorId: application.creatorId,
        totalViews: newViews,
        totalEngagement: newEngagement,
        totalSales: newSales,
        qualityScore: newQuality,
        points: stats.points + pointsDelta,
        deliverablesCompleted: stats.deliverablesCompleted,
        deliverablesOnTime: stats.deliverablesOnTime,
      });
    } else {
      await storage.upsertCampaignCreatorStats({
        campaignId: campaign.id,
        creatorId: application.creatorId,
        points: newMetricPoints,
        deliverablesCompleted: 0,
        deliverablesOnTime: 0,
        totalViews: newViews,
        totalEngagement: newEngagement,
        totalSales: newSales,
        qualityScore: newQuality,
      });
    }

    // Recalculate rankings
    await storage.recalculateCampaignRankings(campaign.id);

    // Return updated stats
    const updatedStats = await storage.getCampaignCreatorStats(campaign.id, application.creatorId);
    res.json(updatedStats);
  });

  // Update campaign briefing (company only)
  app.patch('/api/campaigns/:id/briefing', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const id = parseInt(req.params.id);
    const { briefingText, briefingMaterials } = req.body;
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    // Verify ownership via active store
    const campaign = await storage.getCampaign(id);
    if (!campaign) return res.sendStatus(404);
    if (campaign.companyId !== activeCompanyId) return res.sendStatus(403);

    const updated = await storage.updateCampaignBriefing(id, briefingText, briefingMaterials);

    // Get accepted applications to notify creators
    const applications = await storage.getCampaignApplications(id);
    const acceptedCreatorIds = applications
      .filter((app) => app.status === 'accepted')
      .map((app) => app.creatorId);

    // Send real-time event via WebSocket to all accepted creators
    if (acceptedCreatorIds.length > 0) {
      const { notificationWS } = await import('./websocket');
      if (notificationWS) {
        notificationWS.sendEventToUsers(acceptedCreatorIds, {
          type: 'campaign:briefing_updated',
          campaignId: id,
        });
      }
    }

    res.json(updated);
  });

  // --- Deliverables ---
  // Upload deliverable file directly
  app.post('/api/deliverables/upload', async (req, res) => {
    // Check auth first, before any file processing
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    if (req.user!.role !== 'creator') {
      return res.status(403).json({ error: 'Apenas criadores podem enviar entregas' });
    }

    // Use a promise wrapper to handle multer upload to memory
    const handleUpload = () =>
      new Promise<Express.Multer.File>((resolve, reject) => {
        deliverableUploadMemory.single('file')(req, res, (err) => {
          if (err) {
            if (err instanceof multer.MulterError) {
              if (err.code === 'LIMIT_FILE_SIZE') {
                reject(new Error('Arquivo muito grande. O limite é 100MB.'));
              } else {
                reject(new Error(`Erro no upload: ${err.message}`));
              }
            } else {
              reject(new Error(err.message || 'Tipo de arquivo não permitido'));
            }
          } else {
            const reqWithFile = req as Request & { file?: Express.Multer.File };
            if (!reqWithFile.file) {
              reject(new Error('Nenhum arquivo enviado'));
            } else {
              resolve(reqWithFile.file);
            }
          }
        });
      });

    try {
      // First, upload file to memory (no disk write yet)
      const file = await handleUpload();

      const applicationId = parseInt(req.body.applicationId);
      const description =
        typeof req.body.description === 'string' ? req.body.description.slice(0, 500) : '';

      if (!applicationId || isNaN(applicationId)) {
        return res.status(400).json({ error: 'ID da aplicação é obrigatório' });
      }

      // Verify the application belongs to the creator BEFORE writing to disk
      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ error: 'Aplicação não encontrada' });
      }
      if (application.creatorId !== Number(req.user!.id)) {
        return res.status(403).json({ error: 'Você não tem permissão para esta aplicação' });
      }

      // Now that ownership is verified, write file to disk
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const filename = 'deliverable-' + uniqueSuffix + path.extname(file.originalname);
      const filepath = path.join(uploadDir, filename);

      fs.writeFileSync(filepath, file.buffer);

      const fileUrl = `/uploads/${filename}`;
      const fileName = file.originalname;
      const fileType = file.mimetype;
      const fileSize = file.size;

      // Validate with schema
      const deliverableData = insertDeliverableSchema.parse({
        applicationId,
        fileName,
        fileUrl,
        fileType,
        description: description || undefined,
      });

      const deliverable = await storage.createDeliverable(deliverableData);

      // Get campaign for notification
      const campaign = await storage.getCampaign(application.campaignId);
      if (campaign) {
        const notification = await storage.createNotification({
          userId: campaign.companyId,
          title: 'Novo Entregável',
          message: `Um novo arquivo foi enviado para a campanha "${campaign.title}"`,
          type: 'deliverable_uploaded',
          actionUrl: `/campaign/${campaign.id}/manage`,
          isRead: false,
        });

        const { notificationWS } = await import('./websocket');
        if (notificationWS) {
          notificationWS.sendToUser(campaign.companyId, notification);
          notificationWS.sendEventToUser(campaign.companyId, {
            type: 'deliverable:created',
            applicationId: application.id,
            campaignId: campaign.id,
          });
        }
      }

      // Return deliverable with fileSize for UI parity
      res.status(201).json({ ...deliverable, fileSize });
    } catch (error) {
      console.error('Error uploading deliverable:', error);
      const message = error instanceof Error ? error.message : 'Falha no upload';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/deliverables', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    try {
      const data = insertDeliverableSchema.parse(req.body);

      // Verify the application belongs to the creator
      const application = await storage.getApplication(data.applicationId);
      if (!application) return res.status(404).json({ error: 'Application not found' });
      if (application.creatorId !== Number(req.user!.id)) return res.sendStatus(403);

      const deliverable = await storage.createDeliverable(data);

      // Get campaign for notification
      const campaign = await storage.getCampaign(application.campaignId);
      if (campaign) {
        // Notify company about new deliverable
        const notification = await storage.createNotification({
          userId: campaign.companyId,
          title: 'Novo Entregável',
          message: `Um novo arquivo foi enviado para a campanha "${campaign.title}"`,
          type: 'deliverable_uploaded',
          actionUrl: `/campaign/${campaign.id}/manage`,
          isRead: false,
        });

        // Send real-time notification and event via WebSocket
        const { notificationWS } = await import('./websocket');
        if (notificationWS) {
          notificationWS.sendToUser(campaign.companyId, notification);
          notificationWS.sendEventToUser(campaign.companyId, {
            type: 'deliverable:created',
            applicationId: application.id,
            campaignId: campaign.id,
          });
        }

        // Email notification removed to avoid spam - use weekly digest instead
      }

      res.status(201).json(deliverable);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json(error.errors);
      } else {
        res.status(500).json({ error: 'Failed to create deliverable' });
      }
    }
  });

  app.get('/api/applications/:id/deliverables', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const applicationId = parseInt(req.params.id);

    // Verify access (creator owns application OR company owns campaign via active store)
    const application = await storage.getApplication(applicationId);
    if (!application) return res.sendStatus(404);

    const isCreator =
      req.user!.role === 'creator' && application.creatorId === Number(req.user!.id);
    const isCompany = req.user!.role === 'company';

    if (isCompany) {
      const activeCompanyId = req.session.activeCompanyId;
      const campaign = await storage.getCampaign(application.campaignId);
      if (!campaign || !activeCompanyId || campaign.companyId !== activeCompanyId)
        return res.sendStatus(403);
    } else if (!isCreator) {
      return res.sendStatus(403);
    }

    const deliverables = await storage.getApplicationDeliverables(applicationId);
    res.json(deliverables);
  });

  // --- Deliverable Comments ---
  app.get('/api/deliverables/:id/comments', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const deliverableId = parseInt(req.params.id);

    const comments = await storage.getDeliverableComments(deliverableId);
    res.json(comments);
  });

  app.post('/api/deliverables/:id/comments', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const deliverableId = parseInt(req.params.id);

    // Verify access: get deliverable and check if user has access to its application
    const deliverable = await storage.getDeliverable(deliverableId);
    if (!deliverable) return res.sendStatus(404);

    const application = await storage.getApplication(deliverable.applicationId);
    if (!application) return res.sendStatus(404);

    // Verify user is either creator or company owner
    const isCreator =
      req.user!.role === 'creator' && application.creatorId === Number(req.user!.id);
    const isCompany = req.user!.role === 'company';

    let canAccess = false;
    if (isCompany) {
      const activeCompanyId = req.session.activeCompanyId;
      const campaign = await storage.getCampaign(application.campaignId);
      canAccess = !!campaign && !!activeCompanyId && campaign.companyId === activeCompanyId;
    } else if (isCreator) {
      canAccess = true;
    }

    if (!canAccess) return res.sendStatus(403);

    try {
      const data = insertDeliverableCommentSchema.parse({
        deliverableId,
        userId: Number(req.user!.id),
        comment: req.body.comment,
      });

      const comment = await storage.createDeliverableComment(data);

      // Send notification to the other party
      const campaign = await storage.getCampaign(application.campaignId);
      if (campaign) {
        const senderName = req.user!.name;
        const { notificationWS } = await import('./websocket');

        if (isCreator) {
          // Creator commenting - notify company members (owners/admins)
          const companyMembers = await storage.getCompanyMembers(campaign.companyId);
          const membersToNotify = companyMembers.filter(
            (m) => m.role === 'owner' || m.role === 'admin',
          );

          for (const member of membersToNotify) {
            const notification = await storage.createNotification({
              userId: member.userId,
              title: 'Novo Comentário',
              message: `${senderName} comentou em uma entrega da campanha "${campaign.title}"`,
              type: 'message',
              actionUrl: `/campaign/${campaign.id}/manage`,
              isRead: false,
            });

            if (notificationWS) {
              notificationWS.sendToUser(member.userId, notification);
              notificationWS.sendEventToUser(member.userId, {
                type: 'deliverable:comment_created',
                deliverableId,
                applicationId: application.id,
              });
            }
          }
        } else {
          // Company commenting - notify creator
          const notification = await storage.createNotification({
            userId: application.creatorId,
            title: 'Novo Comentário',
            message: `${senderName} comentou em uma entrega da campanha "${campaign.title}"`,
            type: 'message',
            actionUrl: `/campaign/${campaign.id}/workspace`,
            isRead: false,
          });

          if (notificationWS) {
            notificationWS.sendToUser(application.creatorId, notification);
            notificationWS.sendEventToUser(application.creatorId, {
              type: 'deliverable:comment_created',
              deliverableId,
              applicationId: application.id,
            });
          }
        }
      }

      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json(error.errors);
      } else {
        res.status(500).json({ error: 'Failed to create comment' });
      }
    }
  });

  // --- Notifications ---
  app.get('/api/notifications', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const notifications = await storage.getUserNotifications(Number(req.user!.id), limit);
    res.json(notifications);
  });

  app.get('/api/notifications/unread-count', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const count = await storage.getUnreadCount(Number(req.user!.id));
    res.json({ count });
  });

  app.patch('/api/notifications/:id/read', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);

    // Verify ownership and mark as read in one query
    const updated = await storage.markNotificationAsRead(id, Number(req.user!.id));
    if (!updated) return res.sendStatus(404);

    res.json(updated);
  });

  app.patch('/api/notifications/read-all', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.markAllNotificationsAsRead(Number(req.user!.id));
    res.sendStatus(204);
  });

  // --- Problem Reports ---
  app.post('/api/problem-reports', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { subject, description } = req.body;
    if (!subject || !description) {
      return res.status(400).json({ error: 'Subject and description are required' });
    }

    const report = await storage.createProblemReport({
      userId: Number(req.user!.id),
      subject,
      description,
      status: 'open',
    });

    res.json(report);
  });

  // --- Support Tickets (alias for problem reports with category) ---
  app.post(
    '/api/support/tickets',
    (req, res, next) => {
      supportUpload.single('attachment')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Arquivo muito grande. Máximo 10MB.' });
          }
          return res.status(400).json({ error: 'Erro no upload do arquivo.' });
        } else if (err) {
          return res.status(400).json({ error: err.message });
        }
        next();
      });
    },
    async (req, res) => {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      const { subject, message, category, requestCallback, phone } = req.body;
      if (!subject || !message) {
        return res.status(400).json({ error: 'Subject and message are required' });
      }

      const categoryLabels: Record<string, string> = {
        bug: 'Problema / Bug',
        feature: 'Sugestão de melhoria',
        billing: 'Financeiro / Pagamentos',
        account: 'Conta / Perfil',
        other: 'Outro assunto',
      };

      const categoryLabel = categoryLabels[category] || 'Outro assunto';
      let description = `[${categoryLabel}]\n\n${message}`;

      if (requestCallback === 'true' && phone) {
        description += `\n\n📞 SOLICITA LIGAÇÃO DO SUPORTE\nTelefone: ${phone}`;
      }

      if (req.file) {
        description += `\n\n📎 Arquivo anexado: ${req.file.originalname} (${(req.file.size / 1024).toFixed(0)} KB)`;
      }

      const report = await storage.createProblemReport({
        userId: Number(req.user!.id),
        subject,
        description,
        status: 'open',
      });

      res.json({ success: true, ticketId: report.id });
    },
  );

  app.get('/api/problem-reports', async (req, res) => {
    // Check admin password
    const adminPassword = req.headers['x-admin-password'] as string;
    const expectedPassword = process.env.ADMIN_PASSWORD || 'Turbo100*';

    if (adminPassword !== expectedPassword) {
      return res.sendStatus(403);
    }

    const reports = await storage.getProblemReports();
    res.json(reports);
  });

  app.patch('/api/problem-reports/:id/status', async (req, res) => {
    // Check admin password
    const adminPassword = req.headers['x-admin-password'] as string;
    const expectedPassword = process.env.ADMIN_PASSWORD || 'Turbo100*';

    if (adminPassword !== expectedPassword) {
      return res.sendStatus(403);
    }

    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (!status || (status !== 'open' && status !== 'resolved')) {
      return res.status(400).json({ error: 'Valid status required (open or resolved)' });
    }

    const report = await storage.updateProblemReportStatus(id, status);
    res.json(report);
  });

  // --- Instagram Integration ---
  // Public image proxy (no authentication required) for public profile pages
  app.get('/api/public/proxy-image', async (req, res) => {
    const imageUrl = req.query.url as string;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL required' });
    }

    try {
      // Validate URL is from trusted Instagram CDN domains
      const url = new URL(imageUrl);
      const allowedDomains = [
        'scontent.cdninstagram.com',
        'scontent-lax3-1.cdninstagram.com',
        'scontent-lax3-2.cdninstagram.com',
        'instagram.frkh1-1.fna.fbcdn.net',
        'scontent.fna.fbcdn.net',
      ];

      const isAllowedDomain = allowedDomains.some(
        (domain) =>
          url.hostname === domain ||
          url.hostname.endsWith('.cdninstagram.com') ||
          url.hostname.endsWith('.fbcdn.net'),
      );

      if (!isAllowedDomain || url.protocol !== 'https:') {
        return res.status(403).json({ error: 'URL not from trusted Instagram CDN' });
      }

      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        // Return 204 No Content to signal fallback should be used
        return res.status(204).end();
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.startsWith('image/')) {
        return res.status(204).end();
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');

      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (error) {
      // Return 204 No Content instead of 500 error
      return res.status(204).end();
    }
  });

  // Authenticated image proxy for logged-in users
  app.get('/api/proxy-image', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const imageUrl = req.query.url as string;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL required' });
    }

    try {
      // Validate URL is from trusted Instagram CDN domains
      const url = new URL(imageUrl);
      const allowedDomains = [
        'scontent.cdninstagram.com',
        'scontent-lax3-1.cdninstagram.com',
        'scontent-lax3-2.cdninstagram.com',
        'instagram.frkh1-1.fna.fbcdn.net',
        'scontent.fna.fbcdn.net',
      ];

      const isAllowedDomain = allowedDomains.some(
        (domain) =>
          url.hostname === domain ||
          url.hostname.endsWith('.cdninstagram.com') ||
          url.hostname.endsWith('.fbcdn.net'),
      );

      if (!isAllowedDomain || url.protocol !== 'https:') {
        return res.status(403).json({ error: 'URL not from trusted Instagram CDN' });
      }

      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        // Return 204 No Content to signal fallback should be used
        // This prevents 500 errors from flooding the logs
        return res.status(204).end();
      }

      const buffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'image/jpeg';

      // Validate content type is actually an image
      if (!contentType.startsWith('image/')) {
        return res.status(204).end();
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      res.send(Buffer.from(buffer));
    } catch (error) {
      // Return 204 No Content instead of 500 error
      // This signals to the frontend to use a fallback avatar
      return res.status(204).end();
    }
  });

  app.post('/api/social/validate-instagram', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { username } = req.body;
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Instagram username required' });
    }

    try {
      const { downloadAndSaveToStorage, getPublicUrl } =
        await import('./services/instagram-profile-pic');

      const bizData = await tryBusinessDiscoveryForProfile(username);
      if (bizData) {
        if (bizData.profilePicUrl) {
          const cleanUser = username.replace('@', '').trim().toLowerCase();
          const storagePath = await downloadAndSaveToStorage(cleanUser, bizData.profilePicUrl);
          if (storagePath) {
            bizData.profilePicUrl = getPublicUrl(storagePath);
          }
        }
        return res.json(bizData);
      }

      console.log('[API] Business Discovery unavailable, falling back to Apify');

      // Check if Apify is configured before attempting
      if (!process.env.APIFY_API_KEY) {
        console.log('[API] APIFY_API_KEY not configured, returning fallback response');
        return res.json({
          exists: true,
          username: username.replace('@', '').trim().toLowerCase(),
          source: 'fallback',
          followers: 0,
          following: 0,
          postsCount: 0,
        });
      }

      const { validateInstagramProfile } = await import('./apify-service');
      const metrics = await validateInstagramProfile(username);

      if (metrics.profilePicUrl) {
        const cleanUser = username.replace('@', '').trim().toLowerCase();
        const storagePath = await downloadAndSaveToStorage(cleanUser, metrics.profilePicUrl);
        if (storagePath) {
          metrics.profilePicUrl = getPublicUrl(storagePath);
        }
      }

      res.json(metrics);
    } catch (error) {
      console.error('[API] Instagram validation error:', error);
      // Return fallback instead of 500 error
      const cleanUser = username.replace('@', '').trim().toLowerCase();
      res.json({
        exists: true,
        username: cleanUser,
        source: 'fallback',
        followers: 0,
        following: 0,
        postsCount: 0,
      });
    }
  });

  // --- Creator Discovery Profiles ---
  app.get('/api/discovery-profiles', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);

    try {
      const user = await storage.getUser(Number(req.user!.id));
      const activeCompanyId = (req.session as any).activeCompanyId;
      if (!activeCompanyId)
        return res.status(400).json({ error: 'User not associated with a company' });

      const profiles = await storage.getCompanyDiscoveryProfiles(activeCompanyId);
      res.json(profiles);
    } catch (error) {
      console.error('[API] Error fetching discovery profiles:', error);
      res.status(500).json({ error: 'Failed to fetch discovery profiles' });
    }
  });

  app.post('/api/discovery-profiles', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);

    try {
      const user = await storage.getUser(Number(req.user!.id));
      const activeCompanyId = (req.session as any).activeCompanyId;
      if (!activeCompanyId)
        return res.status(400).json({ error: 'User not associated with a company' });

      const {
        instagramHandle,
        displayName,
        avatarUrl,
        bio,
        followers,
        following,
        posts,
        engagementRate,
        source,
        nicheTags,
        location,
      } = req.body;

      if (!instagramHandle || typeof instagramHandle !== 'string') {
        return res.status(400).json({ error: 'Instagram handle is required' });
      }

      const profile = await storage.createOrUpdateDiscoveryProfile({
        companyId: activeCompanyId,
        instagramHandle: instagramHandle.replace('@', ''),
        displayName: displayName || null,
        avatarUrl: avatarUrl || null,
        bio: bio || null,
        followers: followers || null,
        following: following || null,
        posts: posts || null,
        engagementRate: engagementRate || null,
        source: source || 'manual',
        nicheTags: nicheTags || [],
        location: location || null,
      });

      res.json(profile);
    } catch (error) {
      console.error('[API] Error saving discovery profile:', error);
      res.status(500).json({ error: 'Failed to save discovery profile' });
    }
  });

  app.delete('/api/discovery-profiles/:id', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);

    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid profile ID' });

      await storage.deleteDiscoveryProfile(id);
      res.sendStatus(204);
    } catch (error) {
      console.error('[API] Error deleting discovery profile:', error);
      res.status(500).json({ error: 'Failed to delete discovery profile' });
    }
  });

  app.post('/api/social/update-metrics', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const userId = Number(req.user!.id);
    const user = await storage.getUser(userId);

    if (!user || !user.instagram) {
      return res.status(400).json({ error: 'Instagram username not set in profile' });
    }

    // Check if 30 days have passed since last update
    if (user.instagramLastUpdated) {
      const daysSinceUpdate =
        (Date.now() - new Date(user.instagramLastUpdated).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 30) {
        return res.status(429).json({
          error: 'Metrics can only be updated once every 30 days',
          nextUpdateDate: new Date(
            new Date(user.instagramLastUpdated).getTime() + 30 * 24 * 60 * 60 * 1000,
          ),
        });
      }
    }

    try {
      const { downloadAndSaveToStorage, getPublicUrl } =
        await import('./services/instagram-profile-pic');

      let metrics: any = null;

      const bizData = await tryBusinessDiscoveryForProfile(user.instagram);
      if (bizData && bizData.exists) {
        console.log('[API] Using Business Discovery for metrics update - $0 cost');
        metrics = bizData;
      }

      if (!metrics) {
        console.log('[API] Business Discovery unavailable, falling back to Apify');
        const { getInstagramMetrics } = await import('./apify-service');
        metrics = await getInstagramMetrics(user.instagram);
      }

      console.log('[API] Instagram metrics received:', {
        followers: metrics.followers,
        engagementRate: metrics.engagementRate,
        authenticityScore: metrics.authenticityScore,
      });

      if (!metrics.exists) {
        return res.status(404).json({ error: 'Instagram profile not found' });
      }

      let avatarUrl = metrics.profilePicUrl;
      if (metrics.profilePicUrl) {
        const cleanUser = (user.instagram || '').replace('@', '').trim().toLowerCase();
        const storagePath = await downloadAndSaveToStorage(cleanUser, metrics.profilePicUrl);
        if (storagePath) {
          avatarUrl = getPublicUrl(storagePath);
        }
      }

      const updateData = {
        instagramFollowers: metrics.followers,
        instagramFollowing: metrics.following,
        instagramPosts: metrics.postsCount,
        instagramEngagementRate: metrics.engagementRate || '0%',
        instagramVerified: metrics.isVerified || false,
        instagramAuthenticityScore: metrics.authenticityScore || 50,
        instagramTopHashtags: metrics.topHashtags || [],
        instagramTopPosts: metrics.topPosts || [],
        instagramLastUpdated: new Date(),
        avatar: avatarUrl || undefined,
      };

      console.log('[API] Updating user with data:', updateData);

      const updatedUser = await storage.updateUser(userId, updateData);

      console.log('[API] Updated user engagementRate:', updatedUser?.instagramEngagementRate);

      res.json(updatedUser);
    } catch (error) {
      console.error('[API] Instagram metrics update error:', error);
      res.status(500).json({ error: 'Failed to update Instagram metrics' });
    }
  });

  // --- Multi-tenant Company Routes ---
  // Get active company from session
  app.get('/api/active-company', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== 'company') return res.sendStatus(403);

    try {
      const activeCompanyId = req.session.activeCompanyId;

      if (!activeCompanyId) {
        // Get first company for the user
        const memberships = await storage.getUserCompanies(req.user!.id);
        if (memberships.length === 0) {
          return res.json(null);
        }
        // Set first company as active
        req.session.activeCompanyId = memberships[0].companyId;
        await new Promise<void>((resolve, reject) => {
          req.session.save((err) => (err ? reject(err) : resolve()));
        });
        return res.json(memberships[0]);
      }

      // Verify user is still a member of this company
      const member = await storage.getCompanyMember(activeCompanyId, req.user!.id);
      if (!member) {
        // Company no longer accessible, switch to first available
        const memberships = await storage.getUserCompanies(req.user!.id);
        if (memberships.length === 0) {
          req.session.activeCompanyId = undefined;
          return res.json(null);
        }
        req.session.activeCompanyId = memberships[0].companyId;
        await new Promise<void>((resolve, reject) => {
          req.session.save((err) => (err ? reject(err) : resolve()));
        });
        return res.json(memberships[0]);
      }

      const company = await storage.getCompany(activeCompanyId);
      res.json({ ...member, company });
    } catch (error) {
      console.error('[API] Error fetching active company:', error);
      res.status(500).json({ error: 'Erro ao buscar loja ativa' });
    }
  });

  // Update company data
  app.put('/api/companies/:id', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== 'company') return res.sendStatus(403);

    try {
      const companyId = parseInt(req.params.id);

      // Verify user is admin/owner
      const isAdmin = await storage.isCompanyAdmin(companyId, req.user!.id);
      if (!isAdmin)
        return res.status(403).json({ error: 'Apenas administradores podem editar a loja' });

      const {
        name,
        tradeName,
        description,
        cnpj,
        phone,
        email,
        website,
        instagram,
        cep,
        street,
        number,
        neighborhood,
        city,
        state,
        complement,
        logo,
        coverPhoto,
        tagline,
        category,
        annualRevenue,
        isDiscoverable,
        onboardingCompleted,
        companyBriefing,
        brandColors,
        websiteProducts,
        tiktok,
        structuredBriefing,
      } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Nome da loja é obrigatório' });
      }

      // Build update object
      const updatePayload = {
        name: name.trim(),
        ...(tradeName !== undefined && { tradeName: tradeName?.trim() || null }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(cnpj !== undefined && { cnpj: cnpj?.trim() || null }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(website !== undefined && { website: website?.trim() || null }),
        ...(instagram !== undefined && { instagram: instagram?.trim() || null }),
        ...(cep !== undefined && { cep: cep?.trim() || null }),
        ...(street !== undefined && { street: street?.trim() || null }),
        ...(number !== undefined && { number: number?.trim() || null }),
        ...(neighborhood !== undefined && { neighborhood: neighborhood?.trim() || null }),
        ...(city !== undefined && { city: city?.trim() || null }),
        ...(state !== undefined && { state: state?.trim() || null }),
        ...(complement !== undefined && { complement: complement?.trim() || null }),
        ...(logo !== undefined && { logo }),
        ...(coverPhoto !== undefined && { coverPhoto }),
        ...(tagline !== undefined && { tagline: tagline?.trim() || null }),
        ...(category !== undefined && { category: category || null }),
        ...(annualRevenue !== undefined && { annualRevenue: annualRevenue || null }),
        ...(isDiscoverable !== undefined && { isDiscoverable: Boolean(isDiscoverable) }),
        ...(onboardingCompleted !== undefined && {
          onboardingCompleted: Boolean(onboardingCompleted),
        }),
        ...(companyBriefing !== undefined && { companyBriefing: companyBriefing?.trim() || null }),
        ...(brandColors !== undefined && {
          brandColors: Array.isArray(brandColors) && brandColors.length > 0 ? brandColors : null,
        }),
        ...(websiteProducts !== undefined && {
          websiteProducts:
            Array.isArray(websiteProducts) && websiteProducts.length > 0 ? websiteProducts : null,
        }),
        ...(structuredBriefing !== undefined && {
          structuredBriefing: structuredBriefingSchema.parse(structuredBriefing),
        }),
        ...(tiktok !== undefined && { tiktok: tiktok?.trim() || null }),
      };

      const updatedCompany = await storage.updateCompany(companyId, updatePayload);

      // Recalculate enrichment score after manual save
      const freshCompanyForScore = await storage.getCompany(companyId);
      if (freshCompanyForScore) {
        const { calculateEnrichmentScore } = await import('./services/company-enrichment');
        const newScore = calculateEnrichmentScore(freshCompanyForScore);
        if (newScore !== freshCompanyForScore.enrichmentScore) {
          await storage.updateCompany(companyId, { enrichmentScore: newScore });
          (updatedCompany as any).enrichmentScore = newScore;
        }
      }

      res.json(updatedCompany);

      // Auto-enrich after onboarding completion (async, non-blocking)
      if (onboardingCompleted === true) {
        setImmediate(async () => {
          try {
            const freshCompany = await storage.getCompany(companyId);
            if (freshCompany && !freshCompany.lastEnrichedAt) {
              const { fullEnrichmentPipeline } = await import('./services/company-enrichment');
              await fullEnrichmentPipeline(companyId);
            }
          } catch (e) {
            console.error(`[API] Post-onboarding enrichment error for company ${companyId}:`, e);
          }
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      console.error('[API] Error updating company:', error);
      res.status(500).json({ error: 'Erro ao atualizar loja' });
    }
  });

  // Switch active company
  app.post('/api/active-company/:id', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== 'company') return res.sendStatus(403);

    try {
      const companyId = parseInt(req.params.id);

      // Verify user is a member
      const member = await storage.getCompanyMember(companyId, req.user!.id);
      if (!member) return res.status(403).json({ error: 'Você não é membro desta loja' });

      const company = await storage.getCompany(companyId);
      if (!company) return res.sendStatus(404);

      // Update session
      req.session.activeCompanyId = companyId;
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => (err ? reject(err) : resolve()));
      });

      res.json({ ...member, company });
    } catch (error) {
      console.error('[API] Error switching company:', error);
      res.status(500).json({ error: 'Erro ao trocar de loja' });
    }
  });

  // Get user's companies (stores they belong to)
  app.get('/api/companies', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== 'company') return res.sendStatus(403);

    try {
      const memberships = await storage.getUserCompanies(req.user!.id);
      res.json(memberships);
    } catch (error) {
      console.error('[API] Error fetching user companies:', error);
      res.status(500).json({ error: 'Erro ao buscar lojas' });
    }
  });

  // Get user's companies with active campaign stats (for company selection modal)
  app.get('/api/companies-with-stats', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== 'company') return res.sendStatus(403);

    try {
      const memberships = await storage.getUserCompanies(req.user!.id);

      // Get campaign counts for each company
      const companiesWithStats = await Promise.all(
        memberships.map(async (membership: any) => {
          const companyCampaigns = await db
            .select()
            .from(campaigns)
            .where(eq(campaigns.companyId, membership.companyId));
          const activeCampaignsCount = companyCampaigns.filter(
            (c: any) => c.status === 'open',
          ).length;

          return {
            ...membership,
            activeCampaignsCount,
            totalCampaignsCount: companyCampaigns.length,
          };
        }),
      );

      res.json(companiesWithStats);
    } catch (error) {
      console.error('[API] Error fetching companies with stats:', error);
      res.status(500).json({ error: 'Erro ao buscar lojas' });
    }
  });

  // Create a new company (store)
  app.post('/api/companies', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== 'company') return res.sendStatus(403);

    try {
      const {
        name,
        tradeName,
        description,
        cnpj,
        phone,
        email,
        instagram,
        website,
        cep,
        street,
        number,
        neighborhood,
        city,
        state,
        complement,
      } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Nome da loja é obrigatório' });
      }

      // Generate slug from name
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);

      // Check if slug already exists
      const existingCompany = await storage.getCompanyBySlug(slug);
      if (existingCompany) {
        return res.status(400).json({ error: 'Já existe uma loja com este nome' });
      }

      // Create the company
      const company = await storage.createCompany({
        name: name.trim(),
        tradeName: tradeName?.trim() || null,
        slug,
        description: description?.trim() || null,
        cnpj: cnpj?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        cep: cep?.trim() || null,
        street: street?.trim() || null,
        number: number?.trim() || null,
        neighborhood: neighborhood?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        instagram: instagram?.trim() || null,
        website: website?.trim() || null,
        complement: complement?.trim() || null,
        createdByUserId: req.user!.id,
      });

      // Auto-enrichment if company has CNPJ, Instagram, or website
      if (company.cnpj || company.instagram || company.website) {
        setImmediate(async () => {
          try {
            const { fullEnrichmentPipeline } = await import('./services/company-enrichment');
            await fullEnrichmentPipeline(company.id);
            console.log(`[API] Auto-enrichment completed for company ${company.id}`);
          } catch (e) {
            console.error('[API] Auto-enrichment failed for company', company.id, e);
          }
        });
      }

      // Add the creator as owner
      await storage.addCompanyMember({
        companyId: company.id,
        userId: req.user!.id,
        role: 'owner',
      });

      // Return company with membership
      const memberships = await storage.getUserCompanies(req.user!.id);
      const membership = memberships.find((m) => m.companyId === company.id);

      res.status(201).json(membership);
    } catch (error) {
      console.error('[API] Error creating company:', error);
      res.status(500).json({ error: 'Erro ao criar loja' });
    }
  });

  // Get specific company
  app.get('/api/companies/:id', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== 'company') return res.sendStatus(403);

    try {
      const companyId = parseInt(req.params.id);

      // Verify user is a member
      const member = await storage.getCompanyMember(companyId, req.user!.id);
      if (!member) return res.sendStatus(403);

      const company = await storage.getCompany(companyId);
      if (!company) return res.sendStatus(404);

      res.json({ ...member, company });
    } catch (error) {
      console.error('[API] Error fetching company:', error);
      res.status(500).json({ error: 'Erro ao buscar loja' });
    }
  });

  // Update company
  app.patch('/api/companies/:id', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== 'company') return res.sendStatus(403);

    try {
      const companyId = parseInt(req.params.id);

      // Verify user is admin or owner
      const isAdmin = await storage.isCompanyAdmin(companyId, req.user!.id);
      if (!isAdmin)
        return res.status(403).json({ error: 'Apenas administradores podem editar a loja' });

      const { name, description, logo } = req.body;
      const updates: any = {};

      if (name) updates.name = name.trim();
      if (description !== undefined) updates.description = description?.trim() || null;
      if (logo !== undefined) updates.logo = logo;

      const company = await storage.updateCompany(companyId, updates);
      res.json(company);
    } catch (error) {
      console.error('[API] Error updating company:', error);
      res.status(500).json({ error: 'Erro ao atualizar loja' });
    }
  });

  // Get company members
  app.get('/api/companies/:id/members', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== 'company') return res.sendStatus(403);

    try {
      const companyId = parseInt(req.params.id);

      // Verify user is a member
      const member = await storage.getCompanyMember(companyId, req.user!.id);
      if (!member) return res.sendStatus(403);

      const members = await storage.getCompanyMembers(companyId);
      res.json(members);
    } catch (error) {
      console.error('[API] Error fetching company members:', error);
      res.status(500).json({ error: 'Erro ao buscar membros' });
    }
  });

  // Update member role
  app.patch('/api/companies/:id/members/:userId', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== 'company') return res.sendStatus(403);

    try {
      const companyId = parseInt(req.params.id);
      const targetUserId = parseInt(req.params.userId);

      // Verify user is owner
      const isOwner = await storage.isCompanyOwner(companyId, req.user!.id);
      if (!isOwner)
        return res.status(403).json({ error: 'Apenas o proprietário pode alterar funções' });

      // Cannot change own role
      if (targetUserId === req.user!.id) {
        return res.status(400).json({ error: 'Você não pode alterar sua própria função' });
      }

      const { role } = req.body;
      if (!['owner', 'admin', 'member', 'reader'].includes(role)) {
        return res.status(400).json({ error: 'Função inválida' });
      }

      const member = await storage.updateCompanyMemberRole(companyId, targetUserId, role);
      res.json(member);
    } catch (error) {
      console.error('[API] Error updating member role:', error);
      res.status(500).json({ error: 'Erro ao atualizar função' });
    }
  });

  // Transfer ownership (demote self and promote target to owner)
  app.post('/api/companies/:id/transfer-ownership', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== 'company') return res.sendStatus(403);

    try {
      const companyId = parseInt(req.params.id);
      const { targetUserId } = req.body;

      if (!targetUserId) {
        return res.status(400).json({ error: 'ID do novo proprietário é obrigatório' });
      }

      // Verify user is owner
      const isOwner = await storage.isCompanyOwner(companyId, req.user!.id);
      if (!isOwner)
        return res
          .status(403)
          .json({ error: 'Apenas o proprietário pode transferir a propriedade' });

      // Cannot transfer to self
      if (targetUserId === req.user!.id) {
        return res.status(400).json({ error: 'Você já é o proprietário' });
      }

      // Verify target is a member
      const members = await storage.getCompanyMembers(companyId);
      const targetMember = members.find((m) => m.userId === targetUserId);
      if (!targetMember) {
        return res.status(404).json({ error: 'Membro não encontrado' });
      }

      // Promote target to owner
      await storage.updateCompanyMemberRole(companyId, targetUserId, 'owner');

      // Demote self to admin
      await storage.updateCompanyMemberRole(companyId, req.user!.id, 'admin');

      res.json({ success: true, message: 'Propriedade transferida com sucesso' });
    } catch (error) {
      console.error('[API] Error transferring ownership:', error);
      res.status(500).json({ error: 'Erro ao transferir propriedade' });
    }
  });

  // Remove member from company
  app.delete('/api/companies/:id/members/:userId', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== 'company') return res.sendStatus(403);

    try {
      const companyId = parseInt(req.params.id);
      const targetUserId = parseInt(req.params.userId);

      // Verify user is admin/owner OR removing themselves
      const isAdmin = await storage.isCompanyAdmin(companyId, req.user!.id);
      const isSelf = targetUserId === req.user!.id;

      if (!isAdmin && !isSelf) {
        return res.status(403).json({ error: 'Sem permissão para remover este membro' });
      }

      // Check if trying to remove an owner
      const targetMember = await storage.getCompanyMember(companyId, targetUserId);
      if (targetMember?.role === 'owner') {
        // Only another owner can remove an owner
        const isOwner = await storage.isCompanyOwner(companyId, req.user!.id);
        if (!isOwner) {
          return res
            .status(403)
            .json({ error: 'Apenas um proprietário pode remover outro proprietário' });
        }

        // Check if there's at least one other owner remaining
        const members = await storage.getCompanyMembers(companyId);
        const ownerCount = members.filter((m) => m.role === 'owner').length;
        if (ownerCount <= 1) {
          return res
            .status(400)
            .json({
              error: 'Não é possível remover o único proprietário. Promova outro membro primeiro.',
            });
        }
      }

      await storage.removeCompanyMember(companyId, targetUserId);
      res.sendStatus(204);
    } catch (error) {
      console.error('[API] Error removing member:', error);
      res.status(500).json({ error: 'Erro ao remover membro' });
    }
  });

  // Get pending invites for a company
  app.get('/api/companies/:id/invites', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== 'company') return res.sendStatus(403);

    try {
      const companyId = parseInt(req.params.id);

      // Verify user is admin/owner
      const isAdmin = await storage.isCompanyAdmin(companyId, req.user!.id);
      if (!isAdmin) return res.sendStatus(403);

      const invites = await storage.getCompanyPendingInvites(companyId);
      res.json(invites);
    } catch (error) {
      console.error('[API] Error fetching invites:', error);
      res.status(500).json({ error: 'Erro ao buscar convites' });
    }
  });

  // Create invite
  app.post('/api/companies/:id/invites', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== 'company') return res.sendStatus(403);

    try {
      const companyId = parseInt(req.params.id);

      // Verify user is admin/owner
      const isAdmin = await storage.isCompanyAdmin(companyId, req.user!.id);
      if (!isAdmin)
        return res.status(403).json({ error: 'Apenas administradores podem convidar membros' });

      const { email, role } = req.body;

      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Email é obrigatório' });
      }

      if (!['admin', 'member'].includes(role)) {
        return res.status(400).json({ error: 'Função inválida' });
      }

      // Check if user is already a member
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        const existingMember = await storage.getCompanyMember(companyId, existingUser.id);
        if (existingMember) {
          return res.status(400).json({ error: 'Este usuário já é membro da loja' });
        }
      }

      // Generate unique token
      const token = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const invite = await storage.createCompanyUserInvite({
        companyId,
        email: email.toLowerCase().trim(),
        role,
        token,
        invitedByUserId: req.user!.id,
        status: 'pending',
        expiresAt,
      });

      // Send invite email
      const company = await storage.getCompany(companyId);
      const inviter = await storage.getUser(req.user!.id);
      if (company && inviter) {
        const { sendTeamInviteEmail } = await import('./email');
        await sendTeamInviteEmail(
          email.toLowerCase().trim(),
          token,
          company.name,
          inviter.name,
          role,
        );
      }

      res.status(201).json(invite);
    } catch (error) {
      console.error('[API] Error creating invite:', error);
      res.status(500).json({ error: 'Erro ao criar convite' });
    }
  });

  // Cancel invite
  app.delete('/api/companies/:id/invites/:inviteId', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== 'company') return res.sendStatus(403);

    try {
      const companyId = parseInt(req.params.id);
      const inviteId = parseInt(req.params.inviteId);

      // Verify user is admin/owner
      const isAdmin = await storage.isCompanyAdmin(companyId, req.user!.id);
      if (!isAdmin) return res.sendStatus(403);

      await storage.cancelCompanyUserInvite(inviteId);
      res.sendStatus(204);
    } catch (error) {
      console.error('[API] Error canceling invite:', error);
      res.status(500).json({ error: 'Erro ao cancelar convite' });
    }
  });

  // Get invite info by token (public endpoint)
  app.get('/api/invites/:token', async (req, res) => {
    try {
      const { token } = req.params;

      const invite = await storage.getCompanyUserInviteByToken(token);

      if (!invite) {
        return res.status(404).json({ error: 'Convite não encontrado' });
      }

      // Get company info
      const company = await storage.getCompany(invite.companyId);
      const invitedBy = await storage.getUser(invite.invitedByUserId);

      res.json({
        id: invite.id,
        email: invite.email,
        role: invite.role,
        status: invite.status,
        expiresAt: invite.expiresAt,
        company: {
          id: company?.id,
          name: company?.name,
          logo: company?.logo,
        },
        invitedBy: {
          name: invitedBy?.name || 'Usuário',
        },
      });
    } catch (error) {
      console.error('[API] Error getting invite info:', error);
      res.status(500).json({ error: 'Erro ao buscar convite' });
    }
  });

  // Accept team invite (public endpoint, validates token)
  app.post('/api/team-invites/:token/accept', async (req, res) => {
    try {
      const { token } = req.params;
      const { name, email, password } = req.body;

      const invite = await storage.getCompanyUserInviteByToken(token);

      if (!invite) {
        return res.status(404).json({ error: 'Convite não encontrado' });
      }

      if (invite.status !== 'pending') {
        return res.status(400).json({ error: 'Este convite já foi utilizado ou expirou' });
      }

      if (new Date(invite.expiresAt) < new Date()) {
        return res.status(400).json({ error: 'Este convite expirou' });
      }

      // If user is authenticated, accept the invite
      if (req.isAuthenticated()) {
        // Check if user's email matches invite email
        if (req.user!.email.toLowerCase() !== invite.email.toLowerCase()) {
          return res.status(400).json({
            error: 'Este convite foi enviado para outro email. Faça login com o email correto.',
          });
        }

        // Add user as member
        await storage.addCompanyMember({
          companyId: invite.companyId,
          userId: req.user!.id,
          role: invite.role,
        });

        // Mark invite as accepted
        await storage.acceptCompanyUserInvite(token, req.user!.id);

        // Get company info
        const company = await storage.getCompany(invite.companyId);

        res.json({
          success: true,
          message: 'Convite aceito com sucesso!',
          company,
          user: req.user,
        });
      } else if (name && email && password) {
        // Create new user and accept invite
        // Check if email matches invite email
        if (email.toLowerCase() !== invite.email.toLowerCase()) {
          return res.status(400).json({
            error: 'O email deve ser o mesmo do convite',
          });
        }

        // Check if user already exists
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res.status(400).json({
            error: 'Este email já está cadastrado. Faça login para aceitar o convite.',
          });
        }

        // Create new user as company type
        const salt = crypto.randomBytes(16).toString('hex');
        const hashedPassword = crypto.scryptSync(password, salt, 64).toString('hex');

        const newUser = await storage.createUser({
          email: email.toLowerCase().trim(),
          name: name.trim(),
          password: `${hashedPassword}.${salt}`,
          role: 'company',
          isVerified: true, // Mark as verified since they're accepting an invite
        });

        // Add user as member
        await storage.addCompanyMember({
          companyId: invite.companyId,
          userId: newUser.id,
          role: invite.role,
        });

        // Mark invite as accepted
        await storage.acceptCompanyUserInvite(token, newUser.id);

        // Get company info
        const company = await storage.getCompany(invite.companyId);

        // Log the user in
        req.login(newUser, (err) => {
          if (err) {
            console.error('[API] Error logging in new user:', err);
            return res.status(500).json({ error: 'Erro ao fazer login' });
          }

          // Set active company for the session
          (req.session as any).activeCompanyId = invite.companyId;

          res.json({
            success: true,
            message: 'Conta criada e convite aceito com sucesso!',
            company,
            user: newUser,
          });
        });
      } else {
        // Return invite info for unauthenticated users without registration data
        res.status(400).json({
          error: 'Dados de registro incompletos',
          requiresAuth: true,
          email: invite.email,
        });
      }
    } catch (error) {
      console.error('[API] Error accepting invite:', error);
      res.status(500).json({ error: 'Erro ao aceitar convite' });
    }
  });

  // --- Workflow Stages Routes ---
  // Get workflow stages for a company
  app.get('/api/companies/:id/workflow-stages', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== 'company') return res.sendStatus(403);

    try {
      const companyId = parseInt(req.params.id);

      // Verify user is member of company
      const member = await storage.getCompanyMember(companyId, req.user!.id);
      if (!member) return res.sendStatus(403);

      let stages = await storage.getCompanyWorkflowStages(companyId);

      // If no stages exist, create default ones
      if (stages.length === 0) {
        stages = await storage.createDefaultWorkflowStages(companyId);
      }

      res.json(stages);
    } catch (error) {
      console.error('[API] Error fetching workflow stages:', error);
      res.status(500).json({ error: 'Erro ao buscar etapas' });
    }
  });

  // Create a new workflow stage
  app.post('/api/companies/:id/workflow-stages', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== 'company') return res.sendStatus(403);

    try {
      const companyId = parseInt(req.params.id);
      const { name, color } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Nome da etapa é obrigatório' });
      }

      // Verify user is admin/owner
      const isAdmin = await storage.isCompanyAdmin(companyId, req.user!.id);
      if (!isAdmin) return res.sendStatus(403);

      // Get current stages to determine position
      const existingStages = await storage.getCompanyWorkflowStages(companyId);
      const position = existingStages.length;

      const stage = await storage.createWorkflowStage({
        companyId,
        name: name.trim(),
        color: color || '#6366f1',
        position,
        isDefault: false,
      });

      res.status(201).json(stage);
    } catch (error) {
      console.error('[API] Error creating workflow stage:', error);
      res.status(500).json({ error: 'Erro ao criar etapa' });
    }
  });

  // Update a workflow stage
  app.patch('/api/companies/:id/workflow-stages/:stageId', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== 'company') return res.sendStatus(403);

    try {
      const companyId = parseInt(req.params.id);
      const stageId = parseInt(req.params.stageId);
      const { name, color } = req.body;

      // Verify user is admin/owner
      const isAdmin = await storage.isCompanyAdmin(companyId, req.user!.id);
      if (!isAdmin) return res.sendStatus(403);

      // Verify stage belongs to company
      const stage = await storage.getWorkflowStage(stageId);
      if (!stage || stage.companyId !== companyId) {
        return res.status(404).json({ error: 'Etapa não encontrada' });
      }

      const updates: any = {};
      if (name && typeof name === 'string') updates.name = name.trim();
      if (color && typeof color === 'string') updates.color = color;

      const updated = await storage.updateWorkflowStage(stageId, updates);
      res.json(updated);
    } catch (error) {
      console.error('[API] Error updating workflow stage:', error);
      res.status(500).json({ error: 'Erro ao atualizar etapa' });
    }
  });

  // Delete a workflow stage
  app.delete('/api/companies/:id/workflow-stages/:stageId', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== 'company') return res.sendStatus(403);

    try {
      const companyId = parseInt(req.params.id);
      const stageId = parseInt(req.params.stageId);

      // Verify user is admin/owner
      const isAdmin = await storage.isCompanyAdmin(companyId, req.user!.id);
      if (!isAdmin) return res.sendStatus(403);

      // Verify stage belongs to company
      const stage = await storage.getWorkflowStage(stageId);
      if (!stage || stage.companyId !== companyId) {
        return res.status(404).json({ error: 'Etapa não encontrada' });
      }

      // Check if stage has active applications
      const applicationsCount = await storage.getApplicationsCountByStage(stageId);
      if (applicationsCount > 0) {
        return res.status(400).json({
          error: 'Não é possível deletar esta etapa pois existem candidaturas vinculadas a ela',
          applicationsCount,
        });
      }

      // Check minimum stages (at least 2 must remain)
      const allStages = await storage.getCompanyWorkflowStages(companyId);
      if (allStages.length <= 2) {
        return res.status(400).json({
          error: 'É necessário manter pelo menos 2 etapas',
        });
      }

      await storage.deleteWorkflowStage(stageId);
      res.sendStatus(204);
    } catch (error) {
      console.error('[API] Error deleting workflow stage:', error);
      res.status(500).json({ error: 'Erro ao deletar etapa' });
    }
  });

  // Reorder workflow stages
  app.post('/api/companies/:id/workflow-stages/reorder', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== 'company') return res.sendStatus(403);

    try {
      const companyId = parseInt(req.params.id);
      const { stageIds } = req.body;

      if (!Array.isArray(stageIds) || stageIds.length === 0) {
        return res.status(400).json({ error: 'Lista de IDs inválida' });
      }

      // Verify user is admin/owner
      const isAdmin = await storage.isCompanyAdmin(companyId, req.user!.id);
      if (!isAdmin) return res.sendStatus(403);

      const stages = await storage.reorderWorkflowStages(companyId, stageIds);
      res.json(stages);
    } catch (error) {
      console.error('[API] Error reordering workflow stages:', error);
      res.status(500).json({ error: 'Erro ao reordenar etapas' });
    }
  });

  // --- Admin Routes ---
  // Middleware to check if user is authenticated as admin
  const isAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    const email = req.user?.email || '';
    const isAdminByRole = req.user?.role === 'admin';
    const isAdminByEmail =
      email.endsWith('@turbopartners.com.br') || email === 'rodrigoqs9@gmail.com';

    if (!isAdminByRole && !isAdminByEmail) {
      return res.sendStatus(403);
    }
    next();
  };

  // Helper function to check admin access (same logic as isAdmin middleware)
  const checkAdminAccess = (req: any): boolean => {
    if (!req.isAuthenticated()) return false;
    const email = req.user?.email || '';
    const isAdminByRole = req.user?.role === 'admin';
    const isAdminByEmail =
      email.endsWith('@turbopartners.com.br') || email === 'rodrigoqs9@gmail.com';
    return isAdminByRole || isAdminByEmail;
  };

  app.get('/api/admin/stats', isAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error('[API] Error fetching admin stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const { role, search, isBanned, sortBy, sortOrder } = req.query;
      const filters: any = {};

      if (role && typeof role === 'string') filters.role = role;
      if (search && typeof search === 'string') filters.search = search;
      if (isBanned !== undefined) filters.isBanned = isBanned === 'true';
      if (sortBy && typeof sortBy === 'string') filters.sortBy = sortBy;
      if (sortOrder && typeof sortOrder === 'string') filters.sortOrder = sortOrder;

      const users = await storage.getUsersWithFilters(filters);
      res.json(users);
    } catch (error) {
      console.error('[API] Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.patch('/api/admin/users/:id/ban', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { isBanned } = req.body;

      if (typeof isBanned !== 'boolean') {
        return res.status(400).json({ error: 'isBanned must be a boolean' });
      }

      const user = await storage.updateUserBanStatus(userId, isBanned);
      res.json(user);
    } catch (error) {
      console.error('[API] Error updating ban status:', error);
      res.status(500).json({ error: 'Failed to update ban status' });
    }
  });

  app.get('/api/admin/problem-reports', isAdmin, async (req, res) => {
    try {
      const { status } = req.query;
      const filters: any = {};

      if (status && typeof status === 'string') filters.status = status;

      const reports = await storage.getProblemReportsWithFilters(filters);
      res.json(reports);
    } catch (error) {
      console.error('[API] Error fetching problem reports:', error);
      res.status(500).json({ error: 'Failed to fetch problem reports' });
    }
  });

  app.patch('/api/admin/problem-reports/:id', isAdmin, async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      const { status, adminNotes } = req.body;

      const updates: any = {};
      if (status) updates.status = status;
      if (adminNotes !== undefined) updates.adminNotes = adminNotes;

      const report = await storage.updateProblemReport(reportId, updates);
      res.json(report);
    } catch (error) {
      console.error('[API] Error updating problem report:', error);
      res.status(500).json({ error: 'Failed to update problem report' });
    }
  });

  app.get('/api/admin/activity', isAdmin, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activity = await storage.getRecentActivity(limit);
      res.json(activity);
    } catch (error) {
      console.error('[API] Error fetching activity:', error);
      res.status(500).json({ error: 'Failed to fetch activity' });
    }
  });

  app.get('/api/admin/growth', isAdmin, async (req, res) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const growth = await storage.getUserGrowthStats(days);
      res.json(growth);
    } catch (error) {
      console.error('[API] Error fetching growth stats:', error);
      res.status(500).json({ error: 'Failed to fetch growth stats' });
    }
  });

  // Admin Campaigns
  app.get('/api/admin/campaigns', isAdmin, async (req, res) => {
    try {
      const { status, search, sortBy, sortOrder } = req.query;
      const campaignsList = await storage.getAllCampaigns();

      let filtered = [...campaignsList];

      if (status && status !== 'all') {
        filtered = filtered.filter((c) => c.status === status);
      }

      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.title.toLowerCase().includes(searchLower) ||
            c.description.toLowerCase().includes(searchLower),
        );
      }

      // Sort
      const sortField = (sortBy as string) || 'createdAt';
      const order = (sortOrder as string) || 'desc';
      filtered.sort((a: any, b: any) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        if (sortField === 'budget') {
          aVal =
            parseFloat(
              String(aVal)
                .replace(/[^\d.,]/g, '')
                .replace(',', '.'),
            ) || 0;
          bVal =
            parseFloat(
              String(bVal)
                .replace(/[^\d.,]/g, '')
                .replace(',', '.'),
            ) || 0;
        }

        if (sortField === 'createdAt') {
          aVal = new Date(aVal).getTime();
          bVal = new Date(bVal).getTime();
        }

        if (order === 'asc') {
          return aVal > bVal ? 1 : -1;
        }
        return aVal < bVal ? 1 : -1;
      });

      // Get counts for each campaign
      const campaignsWithCounts = await Promise.all(
        filtered.map(async (campaign) => {
          const applications = await storage.getCampaignApplications(campaign.id);
          const company = await storage.getCompany(campaign.companyId);
          return {
            ...campaign,
            company: company ? { id: company.id, name: company.name, logo: company.logo } : null,
            _count: {
              applications: applications.length,
              acceptedApplications: applications.filter((a) => a.status === 'accepted').length,
            },
          };
        }),
      );

      res.json(campaignsWithCounts);
    } catch (error) {
      console.error('[API] Error fetching admin campaigns:', error);
      res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
  });

  app.get('/api/admin/campaigns/stats', isAdmin, async (req, res) => {
    try {
      const campaignsList = await storage.getAllCampaigns();
      const allApplications = await storage.getAllApplications();

      let totalBudget = 0;
      campaignsList.forEach((c) => {
        const budget =
          parseFloat(
            String(c.budget)
              .replace(/[^\d.,]/g, '')
              .replace(',', '.'),
          ) || 0;
        totalBudget += budget;
      });

      res.json({
        totalCampaigns: campaignsList.length,
        activeCampaigns: campaignsList.filter((c) => c.status === 'open').length,
        totalApplications: allApplications.length,
        acceptedApplications: allApplications.filter((a) => a.status === 'accepted').length,
        avgBudget: campaignsList.length > 0 ? totalBudget / campaignsList.length : 0,
        totalBudget,
      });
    } catch (error) {
      console.error('[API] Error fetching campaign stats:', error);
      res.status(500).json({ error: 'Failed to fetch campaign stats' });
    }
  });

  // Admin Financial
  app.get('/api/admin/financial/stats', isAdmin, async (req, res) => {
    try {
      const sales = await storage.getAllSalesTracking();
      const commissions = await storage.getAllCreatorCommissions();

      // Convert cents to BRL
      const totalSalesCents = sales.reduce((sum, s) => sum + (s.orderValue || 0), 0);
      const totalCommissionsCents = commissions.reduce((sum, c) => sum + (c.amount || 0), 0);
      const pendingCommissionsCents = commissions
        .filter((c) => c.status === 'pending')
        .reduce((sum, c) => sum + (c.amount || 0), 0);
      const paidCommissionsCents = commissions
        .filter((c) => c.status === 'paid')
        .reduce((sum, c) => sum + (c.amount || 0), 0);

      const totalCouponsUsed = 0;
      const avgOrderValueCents = sales.length > 0 ? totalSalesCents / sales.length : 0;

      res.json({
        totalSales: totalSalesCents / 100,
        totalCommissions: totalCommissionsCents / 100,
        pendingCommissions: pendingCommissionsCents / 100,
        paidCommissions: paidCommissionsCents / 100,
        totalCouponsUsed,
        avgOrderValue: avgOrderValueCents / 100,
        salesGrowth: 0,
        commissionsGrowth: 0,
      });
    } catch (error) {
      console.error('[API] Error fetching financial stats:', error);
      res.status(500).json({ error: 'Failed to fetch financial stats' });
    }
  });

  app.get('/api/admin/financial/sales-chart', isAdmin, async (req, res) => {
    try {
      const days = parseInt(req.query.period as string) || 30;
      const sales = await storage.getAllSalesTracking();

      // Group by date
      const dataMap = new Map<string, { sales: number; commissions: number }>();
      const now = new Date();

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dataMap.set(dateStr, { sales: 0, commissions: 0 });
      }

      sales.forEach((sale) => {
        if (sale.trackedAt) {
          const dateStr = new Date(sale.trackedAt).toISOString().split('T')[0];
          if (dataMap.has(dateStr)) {
            const current = dataMap.get(dateStr)!;
            current.sales += sale.orderValue || 0;
            current.commissions += sale.commission || 0;
          }
        }
      });

      const chartData = Array.from(dataMap.entries()).map(([date, data]) => ({
        date,
        sales: data.sales / 100,
        commissions: data.commissions / 100,
      }));

      res.json(chartData);
    } catch (error) {
      console.error('[API] Error fetching sales chart:', error);
      res.status(500).json({ error: 'Failed to fetch sales chart' });
    }
  });

  app.get('/api/admin/financial/top-creators', isAdmin, async (req, res) => {
    try {
      const sales = await storage.getAllSalesTracking();

      const creatorMap = new Map<
        number,
        { totalSales: number; totalCommissions: number; ordersCount: number }
      >();

      sales.forEach((sale) => {
        const current = creatorMap.get(sale.creatorId) || {
          totalSales: 0,
          totalCommissions: 0,
          ordersCount: 0,
        };
        current.totalSales += sale.orderValue || 0;
        current.totalCommissions += sale.commission || 0;
        current.ordersCount += 1;
        creatorMap.set(sale.creatorId, current);
      });

      const creatorIds = Array.from(creatorMap.keys());
      const creators = await Promise.all(creatorIds.map((id) => storage.getUser(id)));

      const topCreators = creators
        .filter((c) => c)
        .map((creator) => {
          const stats = creatorMap.get(creator!.id)!;
          return {
            id: creator!.id,
            name: creator!.name,
            avatar: creator!.avatar,
            totalSales: stats.totalSales / 100,
            totalCommissions: stats.totalCommissions / 100,
            ordersCount: stats.ordersCount,
          };
        })
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, 10);

      res.json(topCreators);
    } catch (error) {
      console.error('[API] Error fetching top creators:', error);
      res.status(500).json({ error: 'Failed to fetch top creators' });
    }
  });

  app.get('/api/admin/financial/commissions', isAdmin, async (req, res) => {
    try {
      const { status } = req.query;
      let commissions = await storage.getAllCreatorCommissions();

      if (status && status !== 'all') {
        commissions = commissions.filter((c) => c.status === status);
      }

      const enrichedCommissions = await Promise.all(
        commissions.map(async (commission) => {
          const creator = await storage.getUser(commission.creatorId);
          const campaign = await storage.getCampaign(commission.campaignId ?? 0);
          return {
            id: commission.id,
            creatorId: commission.creatorId,
            creatorName: creator?.name || 'Unknown',
            creatorAvatar: creator?.avatar || null,
            campaignTitle: campaign?.title || 'Unknown',
            amount: (commission.amount || 0) / 100,
            status: commission.status,
            createdAt: commission.createdAt,
          };
        }),
      );

      // Sort by newest first
      enrichedCommissions.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      res.json(enrichedCommissions.slice(0, 50));
    } catch (error) {
      console.error('[API] Error fetching commissions:', error);
      res.status(500).json({ error: 'Failed to fetch commissions' });
    }
  });

  // Admin - Top Campaigns by Engagement
  app.get('/api/admin/campaigns/top-engagement', isAdmin, async (req, res) => {
    try {
      const campaigns = await storage.getAllCampaigns();
      const allApplications = await storage.getAllApplications();

      const campaignEngagement = await Promise.all(
        campaigns.map(async (campaign) => {
          const campaignApps = allApplications.filter((a) => a.campaignId === campaign.id);
          const acceptedApps = campaignApps.filter((a) => a.status === 'accepted');

          // Get aggregated stats from campaignCreatorStats
          let totalViews = 0;
          let totalEngagement = 0;
          let totalSales = 0;
          let trackedPosts = 0;

          for (const app of acceptedApps) {
            const stats = await storage.getCampaignCreatorStats(campaign.id, app.creatorId);
            if (stats) {
              totalViews += stats.totalViews || 0;
              totalEngagement += stats.totalEngagement || 0;
              totalSales += stats.totalSales || 0;
              trackedPosts += stats.deliverablesCompleted || 0;
            }
          }

          const company = await storage.getCompany(campaign.companyId);

          return {
            id: campaign.id,
            title: campaign.title,
            companyId: campaign.companyId,
            companyName: company?.tradeName || company?.name || 'Empresa',
            companyLogo: company?.logo || null,
            status: campaign.status,
            participants: acceptedApps.length,
            totalApplicants: campaignApps.length,
            totalViews,
            totalEngagement,
            totalSales,
            trackedPosts,
            engagementScore: totalViews + totalEngagement * 10 + totalSales * 100,
            createdAt: campaign.createdAt,
          };
        }),
      );

      // Sort by engagement score
      campaignEngagement.sort((a, b) => b.engagementScore - a.engagementScore);

      res.json(campaignEngagement.slice(0, 10));
    } catch (error) {
      console.error('[API] Error fetching top campaigns by engagement:', error);
      res.status(500).json({ error: 'Failed to fetch top campaigns' });
    }
  });

  // Admin - Gamification: Campaign points ledger
  app.get('/api/admin/campaigns/:id/points-ledger', isAdmin, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const ledger = await storage.getPointsLedgerForCampaign(campaignId);
      res.json(ledger);
    } catch (error) {
      console.error('[API] Error fetching admin campaign points ledger:', error);
      res.status(500).json({ error: 'Failed to fetch points ledger' });
    }
  });

  // Admin - Gamification: Campaign leaderboard (V2)
  app.get('/api/admin/campaigns/:id/leaderboard', isAdmin, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);

      // Recalculate ranks before returning
      await storage.recalculateCampaignRanks(campaignId);

      const leaderboard = await storage.getCampaignLeaderboardV1(campaignId);

      res.json({
        leaderboard: leaderboard.map((entry: any, index: number) => ({
          rank: entry.rank || index + 1,
          creatorId: entry.creatorId,
          creatorName: entry.creator.name,
          creatorAvatar: entry.creator.avatar,
          creatorUsername: entry.creator.instagram,
          totalPoints: entry.totalPoints,
        })),
      });
    } catch (error) {
      console.error('[API] Error fetching admin campaign leaderboard:', error);
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  });

  // Admin - Gamification: Campaign rewards
  app.get('/api/admin/campaigns/:id/rewards', isAdmin, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const status = req.query.status as string | undefined;

      const rewards = await storage.getRewardEntitlements({ campaignId, status });

      const enrichedRewards = await Promise.all(
        rewards.map(async (reward) => {
          const creator = await storage.getUser(reward.creatorId);
          const campaign = await storage.getCampaign(reward.campaignId);
          const prize = await storage.getCampaignPrize(reward.prizeId);
          return {
            ...reward,
            creator: creator
              ? {
                  id: creator.id,
                  name: creator.name,
                  avatar: creator.avatar,
                  instagram: creator.instagram,
                }
              : null,
            campaign: campaign ? { id: campaign.id, title: campaign.title } : null,
            prize,
          };
        }),
      );

      res.json(enrichedRewards);
    } catch (error) {
      console.error('[API] Error fetching admin campaign rewards:', error);
      res.status(500).json({ error: 'Failed to fetch rewards' });
    }
  });

  // Admin - Gamification: All rewards across platform
  app.get('/api/admin/rewards', isAdmin, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;

      const rewards = await storage.getRewardEntitlements({ status });

      const enrichedRewards = await Promise.all(
        rewards.map(async (reward) => {
          const creator = await storage.getUser(reward.creatorId);
          const campaign = await storage.getCampaign(reward.campaignId);
          const company = await storage.getCompany(reward.companyId);
          return {
            ...reward,
            creator: creator
              ? {
                  id: creator.id,
                  name: creator.name,
                  avatar: creator.avatar,
                  instagram: creator.instagram,
                }
              : null,
            campaign: campaign ? { id: campaign.id, title: campaign.title } : null,
            company: company ? { id: company.id, name: company.name } : null,
          };
        }),
      );

      res.json(enrichedRewards);
    } catch (error) {
      console.error('[API] Error fetching admin rewards:', error);
      res.status(500).json({ error: 'Failed to fetch rewards' });
    }
  });

  // Admin - Top Companies by Engagement
  app.get('/api/admin/companies/top-engagement', isAdmin, async (req, res) => {
    try {
      const campaigns = await storage.getAllCampaigns();
      const allApplications = await storage.getAllApplications();

      // Group campaigns by company
      const companyMap = new Map<
        number,
        {
          campaigns: number;
          activeCampaigns: number;
          totalParticipants: number;
          totalApplicants: number;
          totalViews: number;
          totalEngagement: number;
          totalSales: number;
          trackedPosts: number;
        }
      >();

      for (const campaign of campaigns) {
        const current = companyMap.get(campaign.companyId) || {
          campaigns: 0,
          activeCampaigns: 0,
          totalParticipants: 0,
          totalApplicants: 0,
          totalViews: 0,
          totalEngagement: 0,
          totalSales: 0,
          trackedPosts: 0,
        };

        current.campaigns++;
        if (campaign.status === 'open') current.activeCampaigns++;

        const campaignApps = allApplications.filter((a) => a.campaignId === campaign.id);
        const acceptedApps = campaignApps.filter((a) => a.status === 'accepted');

        current.totalApplicants += campaignApps.length;
        current.totalParticipants += acceptedApps.length;

        for (const app of acceptedApps) {
          const stats = await storage.getCampaignCreatorStats(campaign.id, app.creatorId);
          if (stats) {
            current.totalViews += stats.totalViews || 0;
            current.totalEngagement += stats.totalEngagement || 0;
            current.totalSales += stats.totalSales || 0;
            current.trackedPosts += stats.deliverablesCompleted || 0;
          }
        }

        companyMap.set(campaign.companyId, current);
      }

      // Enrich with company details
      const companyIds = Array.from(companyMap.keys());
      const topCompanies = await Promise.all(
        companyIds.map(async (companyId) => {
          const company = await storage.getCompany(companyId);
          const stats = companyMap.get(companyId)!;

          return {
            id: companyId,
            name: company?.tradeName || company?.name || 'Empresa',
            logo: company?.logo || null,
            slug: company?.slug || null,
            ...stats,
            engagementScore: stats.totalViews + stats.totalEngagement * 10 + stats.totalSales * 100,
          };
        }),
      );

      // Sort by engagement score
      topCompanies.sort((a, b) => b.engagementScore - a.engagementScore);

      res.json(topCompanies.slice(0, 10));
    } catch (error) {
      console.error('[API] Error fetching top companies by engagement:', error);
      res.status(500).json({ error: 'Failed to fetch top companies' });
    }
  });

  // ============================================
  // Deep Analytics Endpoints
  // ============================================

  app.get('/api/creators/:creatorId/deep-analysis', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const creatorId = parseInt(req.params.creatorId);
      const user = await storage.getUser(creatorId);

      if (!user || user.role !== 'creator') {
        return res.status(404).json({ error: 'Criador não encontrado' });
      }

      // Get stored posts, hashtags, and analytics history
      const [
        instagramPosts,
        tiktokPosts,
        tiktokProfile,
        instagramHashtags,
        tiktokHashtags,
        analyticsHistoryRaw,
      ] = await Promise.all([
        storage.getCreatorPosts(creatorId, 'instagram', 12),
        storage.getCreatorPosts(creatorId, 'tiktok', 12),
        storage.getTiktokProfile(creatorId),
        storage.getCreatorHashtags(creatorId, 'instagram', 20),
        storage.getCreatorHashtags(creatorId, 'tiktok', 20),
        storage.getCreatorAnalyticsHistory(creatorId, undefined, 30),
      ]);
      const analyticsHistory = [...analyticsHistoryRaw];

      // Create analytics snapshot if no recent one exists (last 24h)
      const hasRecentSnapshot =
        analyticsHistory.length > 0 &&
        Date.now() - new Date(analyticsHistory[0].recordedAt).getTime() < 24 * 60 * 60 * 1000;

      if (!hasRecentSnapshot && user.instagramFollowers) {
        try {
          const newEntry = await storage.createAnalyticsHistoryEntry({
            userId: creatorId,
            platform: 'instagram',
            followers: user.instagramFollowers,
            engagementRate: user.instagramEngagementRate || '0%',
          });
          analyticsHistory.unshift(newEntry);
        } catch (snapshotErr) {
          console.error('[DeepAnalysis] Snapshot creation error:', snapshotErr);
        }
      }

      // Auto-fetch posts via Business Discovery when no posts exist (free)
      if (instagramPosts.length === 0 && user.instagram) {
        try {
          const { savePostThumbnail: saveThumbnail } = await import('./lib/image-storage');
          const cleanUsername = user.instagram.replace('@', '').trim().toLowerCase();
          const bizData = await tryBusinessDiscoveryForProfile(cleanUsername);

          if (bizData?.recentMedia?.length) {
            for (const media of bizData.recentMedia) {
              const mediaUrl = media.media_url || media.thumbnail_url || '';
              const postIdStr = String(media.id || '').replace(/[^a-zA-Z0-9_-]/g, '');
              if (!postIdStr || !media.permalink) continue;

              const savedUrl = mediaUrl
                ? await saveThumbnail(mediaUrl, 'instagram', postIdStr)
                : null;
              const mediaType = (media.media_type || '').toUpperCase();
              const postType =
                mediaType === 'VIDEO'
                  ? 'reel'
                  : mediaType === 'CAROUSEL_ALBUM'
                    ? 'carousel'
                    : 'image';

              const post = await storage.upsertCreatorPost({
                userId: creatorId,
                platform: 'instagram',
                postId: postIdStr,
                postUrl: media.permalink,
                thumbnailUrl: savedUrl || mediaUrl || null,
                caption: (media.caption || '').substring(0, 2000),
                likes: media.like_count || 0,
                comments: media.comments_count || 0,
                views: null,
                shares: null,
                saves: null,
                engagementRate:
                  user.instagramFollowers && user.instagramFollowers > 0
                    ? (
                        (((media.like_count || 0) + (media.comments_count || 0)) /
                          user.instagramFollowers) *
                        100
                      ).toFixed(2) + '%'
                    : '0%',
                hashtags: ((media.caption || '').match(/#(\w+)/g) || []).map((t: string) =>
                  t.replace('#', ''),
                ),
                mentions: ((media.caption || '').match(/@(\w+)/g) || []).map((t: string) =>
                  t.replace('@', ''),
                ),
                postedAt: media.timestamp ? new Date(media.timestamp) : new Date(),
                postType,
              });
              instagramPosts.push(post);
            }
            console.log(
              `[DeepAnalysis] Auto-fetched ${instagramPosts.length} posts via BD for @${cleanUsername}`,
            );
          }
        } catch (bdErr) {
          console.error('[DeepAnalysis] Auto-fetch posts error:', bdErr);
        }
      }

      // Check if enrichment is needed (auto-trigger)
      const hasInstagramData =
        instagramPosts.length > 0 || (user.instagramFollowers && user.instagramFollowers > 0);
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
      const isStale = user.instagramLastUpdated
        ? Date.now() - new Date(user.instagramLastUpdated).getTime() > SEVEN_DAYS_MS
        : true;
      const needsEnrichment = !!(user.instagram && (!hasInstagramData || isStale));

      if (needsEnrichment) {
        // Fire-and-forget: don't block the response
        const { triggerCreatorEnrichment } = await import('./jobs/autoEnrichmentJob');
        triggerCreatorEnrichment(creatorId, user.instagram!).catch((err: any) =>
          console.error('[DeepAnalysis] Auto-enrichment error:', err),
        );
      }

      // Calculate summary statistics
      const instagramStats = {
        totalLikes: instagramPosts.reduce((sum: number, p: any) => sum + (p.likes || 0), 0),
        totalComments: instagramPosts.reduce((sum: number, p: any) => sum + (p.comments || 0), 0),
        avgEngagement:
          instagramPosts.length > 0
            ? (
                instagramPosts.reduce(
                  (sum: number, p: any) => sum + parseFloat(p.engagementRate || '0'),
                  0,
                ) / instagramPosts.length
              ).toFixed(2) + '%'
            : '0%',
        postsAnalyzed: instagramPosts.length,
      };

      const tiktokStats = {
        totalLikes: tiktokPosts.reduce((sum: number, p: any) => sum + (p.likes || 0), 0),
        totalComments: tiktokPosts.reduce((sum: number, p: any) => sum + (p.comments || 0), 0),
        totalViews: tiktokPosts.reduce((sum: number, p: any) => sum + (p.views || 0), 0),
        avgEngagement:
          tiktokPosts.length > 0
            ? (
                tiktokPosts.reduce(
                  (sum: number, p: any) => sum + parseFloat(p.engagementRate || '0'),
                  0,
                ) / tiktokPosts.length
              ).toFixed(2) + '%'
            : '0%',
        postsAnalyzed: tiktokPosts.length,
      };

      res.json({
        creator: {
          id: user.id,
          name: user.name,
          instagram: user.instagram,
          tiktok: user.tiktok,
          instagramFollowers: user.instagramFollowers,
          instagramEngagementRate: user.instagramEngagementRate,
        },
        instagram: {
          profile: {
            followers: user.instagramFollowers,
            following: user.instagramFollowing,
            postsCount: user.instagramPosts,
            engagementRate: user.instagramEngagementRate,
            verified: user.instagramVerified,
            authenticityScore: user.instagramAuthenticityScore,
            bio: user.instagramBio || null,
          },
          recentPosts: instagramPosts,
          stats: instagramStats,
          topHashtags: instagramHashtags,
          lastUpdated: user.instagramLastUpdated,
        },
        tiktok: {
          profile: tiktokProfile
            ? {
                followers: tiktokProfile.followers,
                following: tiktokProfile.following,
                likes: tiktokProfile.hearts || 0,
                videos: tiktokProfile.videoCount || 0,
                engagementRate: '0%',
                verified: tiktokProfile.verified,
              }
            : null,
          recentPosts: tiktokPosts,
          stats: tiktokStats,
          topHashtags: tiktokHashtags,
          lastUpdated: tiktokProfile?.lastFetchedAt,
        },
        analyticsHistory: analyticsHistory.map((h: any) => ({
          platform: h.platform,
          followers: h.followers,
          engagementRate: h.engagementRate,
          recordedAt: h.recordedAt,
        })),
        _meta: {
          needsEnrichment,
          lastUpdated: user.instagramLastUpdated?.toISOString() || null,
        },
      });
    } catch (error) {
      console.error('[API] Error fetching deep analysis:', error);
      res.status(500).json({ error: 'Erro ao buscar análise profunda' });
    }
  });

  app.post('/api/creators/:creatorId/refresh-analysis', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const creatorId = parseInt(req.params.creatorId);

      // Allow companies to refresh any creator, or creators to refresh their own profile
      const isCompany = req.user!.role === 'company';
      const isOwnProfile = req.user!.role === 'creator' && Number(req.user!.id) === creatorId;

      if (!isCompany && !isOwnProfile) {
        return res.status(403).json({ error: 'Sem permissão para atualizar estas análises' });
      }
      const { platform } = req.body as { platform?: 'instagram' | 'tiktok' | 'both' };
      const refreshPlatform = platform || 'both';

      const user = await storage.getUser(creatorId);
      if (!user || user.role !== 'creator') {
        return res.status(404).json({ error: 'Criador não encontrado' });
      }

      const results: any = { instagram: null, tiktok: null };

      // Refresh Instagram data
      if ((refreshPlatform === 'instagram' || refreshPlatform === 'both') && user.instagram) {
        try {
          console.log('[Deep Analysis] Refreshing Instagram for:', user.instagram);

          let profileMetrics: any = null;
          const bizData = await tryBusinessDiscoveryForProfile(user.instagram);
          if (bizData && bizData.exists) {
            console.log('[Deep Analysis] Using Business Discovery for profile metrics - $0 cost');
            profileMetrics = bizData;
          }
          if (!profileMetrics) {
            console.log('[Deep Analysis] Business Discovery unavailable, falling back to Apify 💰');
            profileMetrics = await getInstagramMetrics(user.instagram);
          }

          if (profileMetrics.exists) {
            // Update user's Instagram profile data
            await storage.updateUser(creatorId, {
              instagramFollowers: profileMetrics.followers || null,
              instagramFollowing: profileMetrics.following || null,
              instagramPosts: profileMetrics.postsCount || null,
              instagramEngagementRate: profileMetrics.engagementRate || '0%',
              instagramVerified: profileMetrics.isVerified || false,
              instagramAuthenticityScore: profileMetrics.authenticityScore || 0,
              instagramTopHashtags: profileMetrics.topHashtags || [],
              instagramTopPosts: profileMetrics.topPosts || [],
              instagramLastUpdated: new Date(),
            });

            console.log('[Deep Analysis] Updated Instagram profile:', {
              followers: profileMetrics.followers,
              engagement: profileMetrics.engagementRate,
              authenticity: profileMetrics.authenticityScore,
            });

            // Create analytics history entry with fresh data
            if (profileMetrics.followers) {
              await storage.createAnalyticsHistoryEntry({
                userId: creatorId,
                platform: 'instagram',
                followers: profileMetrics.followers,
                engagementRate: profileMetrics.engagementRate || '0%',
              });
            }
          }

          // Then fetch detailed posts
          const posts = await getInstagramDetailedPosts(user.instagram, 12);
          console.log(`[Deep Analysis] Fetched ${posts.length} Instagram posts for processing`);

          // Store posts in database with saved thumbnails
          for (const post of posts) {
            console.log(
              `[Deep Analysis] Processing post ${post.id}, thumbnailUrl exists: ${!!post.thumbnailUrl}`,
            );
            const savedThumbnailUrl = await savePostThumbnail(
              post.thumbnailUrl,
              'instagram',
              post.id,
            );
            await storage.upsertCreatorPost({
              userId: creatorId,
              platform: 'instagram',
              postId: post.id,
              postUrl: post.url,
              thumbnailUrl: savedThumbnailUrl || post.thumbnailUrl,
              caption: post.caption,
              likes: post.likes,
              comments: post.comments,
              views: post.views,
              shares: post.shares,
              saves: null,
              engagementRate: post.engagementRate,
              hashtags: post.hashtags,
              mentions: post.mentions,
              postedAt: post.timestamp ? new Date(post.timestamp) : new Date(),
              postType: post.postType,
            });
          }

          // Analyze and store hashtags
          const hashtagAnalysis = analyzeHashtags(posts);
          for (const { hashtag, avgEngagement } of hashtagAnalysis) {
            await storage.upsertCreatorHashtag({
              userId: creatorId,
              platform: 'instagram',
              hashtag: hashtag.toLowerCase(),
              usageCount: 1,
              avgEngagement,
              lastUsed: new Date(),
            });
          }

          results.instagram = {
            profileUpdated: profileMetrics.exists,
            followers: profileMetrics.followers,
            engagementRate: profileMetrics.engagementRate,
            postsUpdated: posts.length,
            hashtagsAnalyzed: hashtagAnalysis.length,
          };
        } catch (error) {
          console.error('[Deep Analysis] Error refreshing Instagram:', error);
          results.instagram = { error: 'Falha ao atualizar Instagram' };
        }
      }

      // Refresh TikTok data
      if ((refreshPlatform === 'tiktok' || refreshPlatform === 'both') && user.tiktok) {
        try {
          console.log('[Deep Analysis] Refreshing TikTok for:', user.tiktok);

          // Get TikTok profile metrics
          const tiktokMetrics = await getTikTokMetrics(user.tiktok);

          if (tiktokMetrics.exists) {
            // Store/update TikTok profile
            await storage.upsertTiktokProfile({
              userId: String(creatorId),
              uniqueId: tiktokMetrics.username,
              nickname: tiktokMetrics.username,
              followers: tiktokMetrics.followers,
              following: tiktokMetrics.following,
              hearts: tiktokMetrics.likes,
              videoCount: tiktokMetrics.videos,
              verified: tiktokMetrics.verified,
              signature: tiktokMetrics.bio,
              avatarUrl: tiktokMetrics.avatarUrl,
            });

            // Get TikTok posts
            const posts = await getTikTokPosts(user.tiktok, 12);

            // Store posts in database with saved thumbnails
            for (const post of posts) {
              const savedThumbnailUrl = await savePostThumbnail(
                post.thumbnailUrl,
                'tiktok',
                post.id,
              );
              await storage.upsertCreatorPost({
                userId: creatorId,
                platform: 'tiktok',
                postId: post.id,
                postUrl: post.url,
                thumbnailUrl: savedThumbnailUrl || post.thumbnailUrl,
                caption: post.caption,
                likes: post.likes,
                comments: post.comments,
                views: post.views,
                shares: post.shares,
                saves: null,
                engagementRate:
                  post.views > 0
                    ? (((post.likes + post.comments) / post.views) * 100).toFixed(2) + '%'
                    : '0%',
                hashtags: post.hashtags,
                mentions: post.mentions,
                postedAt: post.timestamp ? new Date(post.timestamp) : new Date(),
                postType: 'video',
              });
            }

            // Analyze and store hashtags
            const hashtagAnalysis = analyzeHashtags(posts);
            for (const { hashtag, avgEngagement } of hashtagAnalysis) {
              await storage.upsertCreatorHashtag({
                userId: creatorId,
                platform: 'tiktok',
                hashtag: hashtag.toLowerCase(),
                usageCount: 1,
                avgEngagement,
                lastUsed: new Date(),
              });
            }

            // Create analytics history entry
            await storage.createAnalyticsHistoryEntry({
              userId: creatorId,
              platform: 'tiktok',
              followers: tiktokMetrics.followers || 0,
              engagementRate: tiktokMetrics.engagementRate || '0%',
            });

            results.tiktok = {
              profileUpdated: true,
              postsUpdated: posts.length,
              hashtagsAnalyzed: hashtagAnalysis.length,
            };
          } else {
            results.tiktok = { error: 'Perfil TikTok não encontrado' };
          }
        } catch (error) {
          console.error('[Deep Analysis] Error refreshing TikTok:', error);
          results.tiktok = { error: 'Falha ao atualizar TikTok' };
        }
      }

      res.json({
        success: true,
        message: 'Análise atualizada com sucesso',
        results,
      });
    } catch (error) {
      console.error('[API] Error refreshing analysis:', error);
      res.status(500).json({ error: 'Erro ao atualizar análise' });
    }
  });

  // ============================================
  // Post AI Insights API
  // ============================================

  app.get('/api/posts/:postId/ai-insight', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const postId = parseInt(req.params.postId);
      const insight = await storage.getPostAiInsight(postId);

      if (!insight) {
        return res.status(404).json({ error: 'Insight não encontrado' });
      }

      res.json(insight);
    } catch (error) {
      console.error('[API] Error fetching post AI insight:', error);
      res.status(500).json({ error: 'Erro ao buscar insight do post' });
    }
  });

  app.get('/api/creators/:creatorId/post-insights', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const creatorId = parseInt(req.params.creatorId);
      const limit = parseInt(req.query.limit as string) || 20;

      const insights = await storage.getPostAiInsightsByUser(creatorId, limit);
      res.json(insights);
    } catch (error) {
      console.error('[API] Error fetching post insights:', error);
      res.status(500).json({ error: 'Erro ao buscar insights de posts' });
    }
  });

  app.post('/api/posts/:postId/ai-insight', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const postId = parseInt(req.params.postId);
      const {
        userId,
        platform,
        summary,
        strengths,
        improvements,
        hashtags,
        bestTimeToPost,
        audienceInsights,
        contentScore,
        engagementPrediction,
        recommendations,
      } = req.body;

      const insight = await storage.createPostAiInsight({
        userId,
        postId,
        platform,
        summary,
        strengths,
        improvements,
        hashtags,
        bestTimeToPost,
        audienceInsights,
        contentScore,
        engagementPrediction,
        recommendations,
      });

      res.json(insight);
    } catch (error) {
      console.error('[API] Error creating post AI insight:', error);
      res.status(500).json({ error: 'Erro ao criar insight do post' });
    }
  });

  app.put('/api/posts/:postId/ai-insight', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const postId = parseInt(req.params.postId);
      const updates = req.body;

      const insight = await storage.updatePostAiInsight(postId, updates);
      res.json(insight);
    } catch (error) {
      console.error('[API] Error updating post AI insight:', error);
      res.status(500).json({ error: 'Erro ao atualizar insight do post' });
    }
  });

  app.delete('/api/posts/:postId/ai-insight', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const postId = parseInt(req.params.postId);
      await storage.deletePostAiInsight(postId);
      res.json({ success: true });
    } catch (error) {
      console.error('[API] Error deleting post AI insight:', error);
      res.status(500).json({ error: 'Erro ao deletar insight do post' });
    }
  });

  app.post('/api/posts/:postId/generate-ai-insight', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const postId = parseInt(req.params.postId);
      const userId = req.user!.id;

      // Get the post to verify ownership and get data for AI analysis
      const posts = await storage.getCreatorPosts(userId, undefined, 100);
      const post = posts.find((p) => p.id === postId);

      if (!post) {
        return res.status(404).json({ error: 'Post não encontrado' });
      }

      // Generate AI insights based on post data
      const likes = post.likes || 0;
      const comments = post.comments || 0;
      const views = post.views || 0;
      const shares = post.shares || 0;
      const engagementRate = parseFloat(post.engagementRate || '0');
      const caption = post.caption || '';
      const isVideo = post.platform === 'tiktok' || (views && views > 0);

      // Generate detailed AI analysis based on metrics and caption
      let hookAnalysis = '';
      let retentionAnalysis = '';
      let storytellingAnalysis = '';
      let audioAnalysis = '';
      let editingTips: string[] = [];
      let viralPotential = 0;
      let viralAnalysis = '';

      try {
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({
          apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
          baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
        });

        // Generate detailed content analysis based on metrics and caption
        const contentAnalysisPrompt = `Você é um especialista em criação de conteúdo para ${post.platform}. Analise este post e gere insights detalhados para ajudar o criador a melhorar.

Dados do post:
- Plataforma: ${post.platform}
- Curtidas: ${likes.toLocaleString('pt-BR')}
- Comentários: ${comments}
- Visualizações: ${views > 0 ? views.toLocaleString('pt-BR') : 'N/A'}
- Compartilhamentos: ${shares}
- Taxa de engajamento: ${engagementRate.toFixed(2)}%
- Legenda: "${caption.substring(0, 500)}"
- Tipo: ${isVideo ? 'Vídeo' : 'Imagem/Carrossel'}

Analise profundamente e responda em JSON com TODOS os campos preenchidos:
{
  "hookTextAnalysis": "análise detalhada do hook textual (primeira linha da legenda) - é forte? Gera curiosidade? Como melhorar?",
  "retentionAnalysis": "com base nas métricas de visualização vs curtidas, análise da retenção - o público está assistindo até o final?",
  "storytellingAnalysis": "análise do storytelling na legenda - tem início, meio e fim? Gera conexão emocional? Como melhorar a narrativa?",
  "audioMusicTips": "3 dicas específicas de áudio/música trending para ${post.platform} que funcionariam bem com este tipo de conteúdo",
  "editingTips": ["dica 1 de edição", "dica 2 de edição", "dica 3 de edição", "dica 4 de edição", "dica 5 de edição"],
  "brollSuggestions": ["sugestão 1 de b-roll/cortes", "sugestão 2 de b-roll/cortes", "sugestão 3 de b-roll/cortes"],
  "viralPotential": 7,
  "viralAnalysis": "análise detalhada do potencial viral - o que ajuda e o que pode melhorar para viralizar"
}

Seja específico, prático e focado em técnicas de criação de conteúdo. NUNCA mencione hashtags.`;

        console.log('[AI Analysis] Generating content analysis...');
        const analysisResponse = await openai.chat.completions.create({
          model: 'gpt-4o',
          max_completion_tokens: 1500,
          messages: [{ role: 'user', content: contentAnalysisPrompt }],
        });

        const analysisContent = analysisResponse.choices[0]?.message?.content || '';
        console.log('[AI Analysis] Response received, parsing...');

        try {
          const jsonMatch = analysisContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const contentAnalysis = JSON.parse(jsonMatch[0]);
            hookAnalysis = contentAnalysis.hookTextAnalysis || '';
            retentionAnalysis = contentAnalysis.retentionAnalysis || '';
            storytellingAnalysis = contentAnalysis.storytellingAnalysis || '';
            audioAnalysis = contentAnalysis.audioMusicTips || '';
            editingTips = contentAnalysis.editingTips || [];
            viralPotential = contentAnalysis.viralPotential || 5;
            viralAnalysis = contentAnalysis.viralAnalysis || '';
            console.log('[AI Analysis] Successfully parsed AI response');
          }
        } catch (e) {
          console.log('[AI Analysis] Failed to parse content analysis JSON');
        }
      } catch (aiError) {
        console.log('[AI Analysis] AI analysis failed:', aiError);
      }

      // Calculate content score based on metrics and viral potential
      let contentScore = Math.min(
        100,
        Math.round(
          engagementRate * 15 +
            Math.min(likes / 100, 25) +
            Math.min(comments / 10, 25) +
            (views > 0 ? Math.min(views / 10000, 20) : 10) +
            (caption.length > 50 ? 15 : 5),
        ),
      );

      // Boost score based on viral potential if available
      if (viralPotential > 0) {
        contentScore = Math.min(100, Math.round(contentScore * 0.8 + viralPotential * 2));
      }

      // Generate insights based on analysis
      const strengths: string[] = [];
      const improvements: string[] = [];
      const recommendations: string[] = [];

      // Add editing tips as recommendations
      if (editingTips.length > 0) {
        editingTips.slice(0, 3).forEach((tip) => recommendations.push(tip));
      }

      if (engagementRate >= 5) {
        strengths.push('Taxa de engajamento excelente, acima da média do setor');
      } else if (engagementRate >= 3) {
        strengths.push('Boa taxa de engajamento');
      } else {
        improvements.push('Considere melhorar a taxa de engajamento com CTAs mais fortes');
      }

      if (likes > 500) {
        strengths.push('Alto número de curtidas, indicando conteúdo atrativo');
      }

      // Comment analysis
      const commentRatio = likes > 0 ? (comments / likes) * 100 : 0;
      let commentSentiment = 'neutro';
      let commentAnalysis = '';

      if (comments > 50) {
        strengths.push('Boa quantidade de comentários, mostrando alto engajamento');
        commentSentiment = 'positivo';
        commentAnalysis =
          'O alto volume de comentários indica que o conteúdo gerou forte reação da audiência.';
      } else if (comments >= 20) {
        commentSentiment = 'positivo';
        commentAnalysis = 'Bom nível de comentários. O público está interagindo de forma saudável.';
      } else if (comments >= 10) {
        commentSentiment = 'neutro';
        commentAnalysis =
          'Nível moderado de comentários. Há espaço para incentivar mais interações.';
      } else {
        improvements.push('Incentive mais comentários fazendo perguntas na legenda');
        commentAnalysis = 'Poucos comentários - experimente fazer perguntas diretas ao público.';
      }

      // Shares analysis
      if (shares > 50) {
        strengths.push('Conteúdo altamente compartilhável - gera valor percebido');
      } else if (shares > 10) {
        strengths.push('Bom potencial de compartilhamento');
      }

      // Visual retention
      if (views && views > 0) {
        const viewToLikeRatio = (likes / views) * 100;
        if (viewToLikeRatio > 10) {
          strengths.push('Excelente retenção visual - alto índice de curtidas por visualização');
        } else if (viewToLikeRatio > 5) {
          strengths.push('Boa retenção visual - conteúdo prende atenção');
        } else if (viewToLikeRatio < 2) {
          improvements.push('Melhore os primeiros segundos para aumentar retenção');
        }
      }

      const summary = `Este post teve um desempenho ${contentScore >= 70 ? 'excelente' : contentScore >= 50 ? 'bom' : 'moderado'} com ${likes.toLocaleString('pt-BR')} curtidas e ${comments} comentários. ${engagementRate >= 3 ? 'A taxa de engajamento está acima da média.' : 'Há oportunidades para melhorar o engajamento.'}`;

      const audienceInsights = `Seu público respondeu ${comments > 20 ? 'muito bem' : 'moderadamente'} a este conteúdo. ${views > 10000 ? 'O alcance foi excelente.' : 'Continue criando conteúdo consistente para aumentar o alcance.'}`;

      const insight = await storage.createPostAiInsight({
        userId,
        postId,
        platform: post.platform as 'instagram' | 'tiktok',
        summary,
        strengths,
        improvements,
        hashtags: [],
        bestTimeToPost: null,
        audienceInsights,
        contentScore,
        engagementPrediction:
          engagementRate >= 3 ? 'Alto' : engagementRate >= 1 ? 'Médio' : 'Baixo',
        recommendations,
      });

      res.json({
        ...insight,
        hookAnalysis: hookAnalysis || null,
        retentionAnalysis: retentionAnalysis || null,
        storytellingAnalysis: storytellingAnalysis || null,
        audioAnalysis: audioAnalysis || null,
        editingTips: editingTips || [],
        viralPotential: viralPotential || null,
        viralAnalysis: viralAnalysis || null,
        commentAnalysis: {
          totalComments: comments,
          commentRatio: commentRatio.toFixed(2) + '%',
          sentiment: commentSentiment,
          analysis: commentAnalysis,
          tips: [
            'Responda aos primeiros comentários rapidamente',
            'Faça perguntas polêmicas ou que gerem debate',
            'Peça opiniões: "O que vocês fariam?"',
            'Crie conteúdo que as pessoas queiram marcar amigos',
          ],
        },
      });
    } catch (error) {
      console.error('[API] Error generating post AI insight:', error);
      res.status(500).json({ error: 'Erro ao gerar análise de IA' });
    }
  });

  // ============================================
  // Company Public Profile & Stats
  // ============================================

  app.get('/api/companies/:companyId/public-stats', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const companyId = parseInt(req.params.companyId);

      try {
        // First try to get the company entity from the companies table
        const companyData = await storage.getCompany(companyId);

        // Determine the owner userId - either from company entity or use companyId as userId fallback
        let ownerUserId = companyId;
        if (companyData) {
          // If company entity exists, get the owner from company members
          const members = await storage.getCompanyMembers(companyId);
          const owner = members.find((m) => m.role === 'owner');
          if (owner) {
            ownerUserId = owner.userId;
          }
        }

        const stats = await storage.getCompanyPublicStats(ownerUserId);

        const safeCompany = {
          id: stats.company.id,
          name: stats.company.name,
          tradeName: companyData?.tradeName || null,
          logo: companyData?.logo || stats.company.avatar,
          coverPhoto: companyData?.coverPhoto || null,
          description: companyData?.description || stats.company.bio,
          category: companyData?.category || null,
          tagline: companyData?.tagline || null,
          city: stats.company.city || companyData?.city || null,
          state: companyData?.state || null,
          website: companyData?.website || null,
          instagram: companyData?.instagram || stats.company.instagram,
          tiktok: companyData?.tiktok || null,
          email: companyData?.email || null,
          phone: companyData?.phone || null,
          cnpj: companyData?.cnpj || null,
          isFeatured: companyData?.isFeatured || false,
          isDiscoverable: companyData?.isDiscoverable ?? true,
          createdAt: stats.company.createdAt,
          companyBriefing: companyData?.companyBriefing || companyData?.aiContextSummary || null,
          structuredBriefing: companyData?.structuredBriefing || null,
          brandColors: companyData?.brandColors || null,
          brandLogo: companyData?.brandLogo || null,
          websiteProducts: companyData?.websiteProducts || null,
          // CNPJ enrichment (public-safe fields)
          cnpjRazaoSocial: companyData?.cnpjRazaoSocial || null,
          cnpjSituacao: companyData?.cnpjSituacao || null,
          cnpjAtividadePrincipal: companyData?.cnpjAtividadePrincipal || null,
          cnpjDataAbertura: companyData?.cnpjDataAbertura || null,
          cnpjNaturezaJuridica: companyData?.cnpjNaturezaJuridica || null,
          // Website enrichment
          websiteTitle: companyData?.websiteTitle || null,
          websiteDescription: companyData?.websiteDescription || null,
          websiteKeywords: companyData?.websiteKeywords || null,
          websiteSocialLinks: companyData?.websiteSocialLinks || null,
          websiteFaq: companyData?.websiteFaq || null,
          // E-commerce enrichment
          ecommercePlatform: companyData?.ecommercePlatform || null,
          ecommerceProductCount: companyData?.ecommerceProductCount || null,
          ecommerceCategories: companyData?.ecommerceCategories || null,
          enrichmentScore: companyData?.enrichmentScore || null,
          // Additional enrichment text fields
          instagramBio: companyData?.instagramBio || null,
          websiteAbout: companyData?.websiteAbout || null,
          aiContextSummary: companyData?.aiContextSummary || null,
          brandCanvas: companyData?.brandCanvas || null,
        };

        const favoriteCount = await storage.getCompanyFavoriteCount(companyId);

        res.json({
          company: safeCompany,
          totalCampaigns: stats.totalCampaigns,
          activeCampaigns: stats.activeCampaigns,
          completedCampaigns: stats.completedCampaigns,
          totalApplications: stats.totalApplications,
          acceptedApplications: stats.acceptedApplications,
          acceptanceRate: stats.acceptanceRate,
          avgResponseTime: stats.avgResponseTime,
          avgRating: stats.avgRating,
          totalReviews: stats.totalReviews,
          totalCollaborations: stats.totalCollaborations,
          campaignsByMonth: stats.campaignsByMonth,
          collaborationsByMonth: (stats as any).collaborationsByMonth || [],
          topCreators: (stats as any).topCreators || [],
          favoriteCount: favoriteCount,
          financialMetrics: stats.financialMetrics,
        });
      } catch (error) {
        console.error('[API] Error getting company stats:', error);
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }
    } catch (error) {
      console.error('[API] Error getting company public stats:', error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas da empresa' });
    }
  });

  // Get creator's membership status for a company community
  app.get('/api/companies/:companyId/membership-status', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const companyId = parseInt(req.params.companyId);
      const membership = await storage.getBrandCreatorMembershipByCreatorAndCompany(
        req.user!.id,
        companyId,
      );

      if (membership) {
        res.json({
          isMember: membership.status === 'active',
          status: membership.status,
          joinedAt: membership.joinedAt,
        });
      } else {
        res.json({ isMember: false, status: null, joinedAt: null });
      }
    } catch (error) {
      console.error('[API] Error getting membership status:', error);
      res.status(500).json({ error: 'Erro ao verificar status de membro' });
    }
  });

  // Creator requests to join a company community
  app.post('/api/companies/:companyId/request-membership', async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user!.role !== 'creator') {
        return res.status(403).json({ error: 'Apenas creators podem solicitar entrada' });
      }

      const companyId = parseInt(req.params.companyId);

      const existing = await storage.getBrandCreatorMembershipByCreatorAndCompany(
        req.user!.id,
        companyId,
      );
      if (existing?.status === 'active') {
        return res.status(400).json({ error: 'Você já é membro desta comunidade' });
      }
      if (existing?.status === 'invited') {
        return res.status(400).json({ error: 'Sua solicitação já está pendente' });
      }

      await storage.createBrandCreatorMembership({
        creatorId: req.user!.id,
        companyId,
        status: 'invited',
        source: 'self_request',
        joinedAt: null,
      });

      // Notify company owner about join request
      try {
        const company = await storage.getCompany(companyId);
        if (company) {
          const notification = await storage.createNotification({
            userId: company.createdByUserId,
            type: 'community_join_request',
            title: 'Solicitação de entrada na comunidade',
            message: `${req.user!.name} solicitou entrada na sua comunidade`,
            actionUrl: `/company/brand/${companyId}/community`,
            isRead: false,
          });
          const { notificationWS } = await import('./websocket');
          if (notificationWS) {
            notificationWS.sendToUser(company.createdByUserId, notification);
          }
        }
      } catch (notifError) {
        console.error('[Notification] Error sending community_join_request:', notifError);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('[API] Error requesting membership:', error);
      res.status(500).json({ error: 'Erro ao solicitar entrada na comunidade' });
    }
  });

  app.get('/api/companies/:companyId/public-deliverables', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const companyId = parseInt(req.params.companyId);
      const deliverables = await storage.getCompanyPublicDeliverables(companyId);
      res.json(deliverables);
    } catch (error) {
      console.error('[API] Error getting public deliverables:', error);
      res.status(500).json({ error: 'Erro ao buscar trabalhos realizados' });
    }
  });

  app.get('/api/companies/:companyId/recent-partnerships', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const companyId = parseInt(req.params.companyId);
      const partnerships = await storage.getCompanyRecentPartnerships(companyId);
      res.json(partnerships);
    } catch (error) {
      console.error('[API] Error getting recent partnerships:', error);
      res.status(500).json({ error: 'Erro ao buscar parcerias recentes' });
    }
  });

  // ==========================================
  // FEATURE FLAGS API (Admin only)
  // ==========================================

  // Get all feature flags
  app.get('/api/admin/feature-flags', isAdmin, async (req, res) => {
    try {
      const flags = await storage.getFeatureFlags();
      res.json(flags);
    } catch (error) {
      console.error('[API] Error fetching feature flags:', error);
      res.status(500).json({ error: 'Failed to fetch feature flags' });
    }
  });

  // Update feature flag
  app.patch('/api/admin/feature-flags/:id', isAdmin, async (req, res) => {
    try {
      const flagId = parseInt(req.params.id);
      const { enabled } = req.body;

      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ error: 'enabled must be a boolean' });
      }

      const flag = await storage.updateFeatureFlag(flagId, enabled);
      res.json(flag);
    } catch (error) {
      console.error('[API] Error updating feature flag:', error);
      res.status(500).json({ error: 'Failed to update feature flag' });
    }
  });

  // Initialize default feature flags (admin only)
  app.post('/api/admin/feature-flags/initialize', isAdmin, async (req, res) => {
    try {
      await storage.initializeDefaultFeatureFlags();
      const flags = await storage.getFeatureFlags();
      res.json(flags);
    } catch (error) {
      console.error('[API] Error initializing feature flags:', error);
      res.status(500).json({ error: 'Failed to initialize feature flags' });
    }
  });

  // Check if a feature is enabled (public for frontend gating)
  app.get('/api/feature-flags/:name', async (req, res) => {
    try {
      const { name } = req.params;
      const isEnabled = await storage.isFeatureEnabled(name);
      res.json({ enabled: isEnabled });
    } catch (error) {
      console.error('[API] Error checking feature flag:', error);
      res.status(500).json({ error: 'Failed to check feature flag' });
    }
  });

  // Get all feature flags for frontend (only returns enabled status)
  app.get('/api/feature-flags', async (req, res) => {
    try {
      const flags = await storage.getFeatureFlags();
      const publicFlags = flags.reduce(
        (acc, flag) => {
          acc[flag.name] = flag.enabled;
          return acc;
        },
        {} as Record<string, boolean>,
      );
      res.json(publicFlags);
    } catch (error) {
      console.error('[API] Error fetching feature flags:', error);
      res.status(500).json({ error: 'Failed to fetch feature flags' });
    }
  });

  // ==========================================
  // CREATOR ENRICHMENT API
  // ==========================================

  app.post('/api/admin/enrich-creators', isAdmin, async (req, res) => {
    try {
      const { limit = 10, forceRefresh = false } = req.body || {};
      const result = await runBatchEnrichment({ limit, forceRefresh });
      res.json(result);
    } catch (error) {
      console.error('[API] Error running batch enrichment:', error);
      res.status(500).json({ error: 'Failed to run batch enrichment' });
    }
  });

  app.get('/api/admin/enrichment-stats', isAdmin, async (req, res) => {
    try {
      const stats = await getEnrichmentStats();
      res.json(stats);
    } catch (error) {
      console.error('[API] Error fetching enrichment stats:', error);
      res.status(500).json({ error: 'Failed to fetch enrichment stats' });
    }
  });

  app.post('/api/admin/enrich-companies', isAdmin, async (req, res) => {
    try {
      const { limit = 10, forceRefresh = false } = req.body || {};
      const result = await runBatchCompanyEnrichment({ limit, forceRefresh });
      res.json(result);
    } catch (error) {
      console.error('[API] Error running company batch enrichment:', error);
      res.status(500).json({ error: 'Failed to run company batch enrichment' });
    }
  });

  app.post('/api/discovery/enrich-background', async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.sendStatus(401);
    }
    if (req.user.role !== 'company' && !checkAdminAccess(req)) {
      return res.sendStatus(403);
    }
    const { limit = 5 } = req.body || {};
    const effectiveLimit = Math.min(Number(limit) || 5, 5);
    setImmediate(() => {
      runBatchEnrichment({ limit: effectiveLimit }).catch((err) => {
        console.error('[CreatorEnrichment] Background enrichment error:', err);
      });
      runBatchCompanyEnrichment({ limit: effectiveLimit }).catch((err) => {
        console.error('[CompanyEnrichment] Background enrichment error:', err);
      });
    });
    res.json({ status: 'started', limit: effectiveLimit });
  });

  // ==========================================
  // GAMIFICATION API
  // ==========================================

  // Get gamification feature status
  app.get('/api/gamification/status', async (req, res) => {
    try {
      const [gamificationEnabled, leaderboardEnabled, competitionsEnabled] = await Promise.all([
        storage.isFeatureEnabled('gamification_enabled'),
        storage.isFeatureEnabled('leaderboard_enabled'),
        storage.isFeatureEnabled('competitions_enabled'),
      ]);
      res.json({ gamificationEnabled, leaderboardEnabled, competitionsEnabled });
    } catch (error) {
      console.error('[API] Error fetching gamification status:', error);
      res.json({
        gamificationEnabled: false,
        leaderboardEnabled: false,
        competitionsEnabled: false,
      });
    }
  });

  // Get current user's gamification progress
  app.get('/api/gamification/my-progress', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== 'creator') {
      return res.status(403).json({ error: 'Only creators have gamification progress' });
    }

    try {
      const gamificationEnabled = await storage.isFeatureEnabled('gamification_enabled');
      if (!gamificationEnabled) {
        return res.status(403).json({ error: 'Gamification feature is not enabled' });
      }

      const creatorId = req.user!.id;
      const [creatorBadges, levels, currentDate] = await Promise.all([
        storage.getCreatorBadges(creatorId),
        storage.getCreatorLevels(),
        Promise.resolve(new Date()),
      ]);

      const totalPoints = 0;
      const currentLevel =
        levels.find(
          (l) => totalPoints >= l.minPoints && (!l.maxPoints || totalPoints < l.maxPoints),
        ) || levels[0];

      const nextLevel = levels.find((l) => l.minPoints > totalPoints);
      const pointsToNextLevel = nextLevel ? nextLevel.minPoints - totalPoints : 0;
      const progressPercentage =
        currentLevel && nextLevel
          ? Math.min(
              100,
              Math.round(
                ((totalPoints - currentLevel.minPoints) /
                  (nextLevel.minPoints - currentLevel.minPoints)) *
                  100,
              ),
            )
          : 100;

      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      // TODO: implement getMonthlyLeaderboard
      const leaderboard: any[] = [];
      const myRankEntry = leaderboard.find((l: any) => l.creatorId === creatorId);

      res.json({
        totalPoints,
        currentLevel: currentLevel || null,
        nextLevel: nextLevel || null,
        pointsToNextLevel,
        progressPercentage,
        badges: creatorBadges,
        rank: myRankEntry?.rank || null,
        stats: {
          totalViews: 0,
          totalSales: 0,
          totalPosts: 0,
          totalStories: 0,
          totalReels: 0,
          totalEngagement: 0,
          currentStreak: 0,
          longestStreak: 0,
          campaignsCompleted: 0,
          onTimeDeliveries: 0,
        },
      });
    } catch (error) {
      console.error('[API] Error fetching gamification progress:', error);
      res.status(500).json({ error: 'Failed to fetch gamification progress' });
    }
  });

  // Get creator levels
  app.get('/api/gamification/levels', async (req, res) => {
    try {
      const gamificationEnabled = await storage.isFeatureEnabled('gamification_enabled');
      if (!gamificationEnabled && !checkAdminAccess(req)) {
        return res.status(403).json({ error: 'Gamification feature is not enabled' });
      }
      const levels = await storage.getCreatorLevels();
      res.json(levels);
    } catch (error) {
      console.error('[API] Error fetching creator levels:', error);
      res.status(500).json({ error: 'Failed to fetch creator levels' });
    }
  });

  // Get badges
  app.get('/api/gamification/badges', async (req, res) => {
    try {
      const gamificationEnabled = await storage.isFeatureEnabled('gamification_enabled');
      if (!gamificationEnabled && !checkAdminAccess(req)) {
        return res.status(403).json({ error: 'Gamification feature is not enabled' });
      }
      const allBadges = await storage.getBadges();
      res.json(allBadges);
    } catch (error) {
      console.error('[API] Error fetching badges:', error);
      res.status(500).json({ error: 'Failed to fetch badges' });
    }
  });

  // Get creator's gamification stats
  app.get('/api/gamification/creator/:creatorId', async (req, res) => {
    try {
      const gamificationEnabled = await storage.isFeatureEnabled('gamification_enabled');
      if (!gamificationEnabled && !checkAdminAccess(req)) {
        return res.status(403).json({ error: 'Gamification feature is not enabled' });
      }

      const creatorId = parseInt(req.params.creatorId);
      const [pointsHistory, creatorBadges, levels] = await Promise.all([
        storage.getCreatorPointsHistory(creatorId, 20),
        storage.getCreatorBadges(creatorId),
        storage.getCreatorLevels(),
      ]);

      const currentLevel = levels[0];

      res.json({
        totalPoints: 0,
        currentLevel,
        campaignsCompleted: 0,
        onTimeDeliveries: 0,
        pointsHistory,
        badges: creatorBadges,
        nextLevel: currentLevel ? levels.find((l) => l.minPoints > 0) : null,
      });
    } catch (error) {
      console.error('[API] Error fetching gamification stats:', error);
      res.status(500).json({ error: 'Failed to fetch gamification stats' });
    }
  });

  // Get monthly leaderboard
  app.get('/api/gamification/leaderboard', async (req, res) => {
    try {
      const leaderboardEnabled = await storage.isFeatureEnabled('leaderboard_enabled');
      if (!leaderboardEnabled && !checkAdminAccess(req)) {
        return res.status(403).json({ error: 'Leaderboard feature is not enabled' });
      }

      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const limit = parseInt(req.query.limit as string) || 10;

      // TODO: implement getMonthlyLeaderboard
      const leaderboard: any[] = [];
      res.json(leaderboard);
    } catch (error) {
      console.error('[API] Error fetching leaderboard:', error);
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  });

  // Initialize default levels and badges (admin only)
  app.post('/api/admin/gamification/initialize', isAdmin, async (req, res) => {
    try {
      await storage.initializeDefaultLevelsAndBadges();
      const [levels, allBadges] = await Promise.all([
        storage.getCreatorLevels(),
        storage.getBadges(),
      ]);
      res.json({ levels, badges: allBadges });
    } catch (error) {
      console.error('[API] Error initializing gamification:', error);
      res.status(500).json({ error: 'Failed to initialize gamification' });
    }
  });

  // ==========================================
  // ADVANCED ANALYTICS API
  // ==========================================

  // Get analytics feature status (only for companies and admins)
  app.get('/api/analytics/status', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== 'company' && !checkAdminAccess(req)) {
      return res.json({ analyticsEnabled: false, pdfReportsEnabled: false });
    }

    try {
      const [analyticsEnabled, pdfReportsEnabled] = await Promise.all([
        storage.isFeatureEnabled('advanced_analytics_enabled'),
        storage.isFeatureEnabled('pdf_reports_enabled'),
      ]);
      res.json({ analyticsEnabled, pdfReportsEnabled });
    } catch (error) {
      console.error('[API] Error fetching analytics status:', error);
      res.json({ analyticsEnabled: false, pdfReportsEnabled: false });
    }
  });

  // ==========================================
  // CREATOR COMMISSIONS
  // ==========================================

  // Get my commissions (creator only)
  app.get('/api/my-commissions', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const commissions = await storage.getCreatorCommissions(req.user!.id);

    res.json(commissions);
  });

  // ==========================================
  // E-COMMERCE & COUPON MANAGEMENT
  // ==========================================

  // Create coupon for campaign (company only)
  app.post('/api/campaigns/:id/coupons', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const campaignId = parseInt(req.params.id);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const campaign = await storage.getCampaign(campaignId);
    if (!campaign || campaign.companyId !== activeCompanyId) return res.sendStatus(403);

    const { code, discountType, discountValue, maxUses, expiresAt, creatorId } = req.body;

    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({ error: 'Código, tipo de desconto e valor são obrigatórios' });
    }

    // Check if code already exists
    const existing = await storage.getCouponByCode(code);
    if (existing) {
      return res.status(400).json({ error: 'Este código de cupom já existe' });
    }

    const coupon = await storage.createCoupon({
      campaignId,
      creatorId: creatorId || null,
      code,
      discountType,
      discountValue,
      maxUses: maxUses || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: true,
      currentUses: 0,
    });

    res.status(201).json(coupon);
  });

  // Get coupons for campaign (company only)
  app.get('/api/campaigns/:id/coupons', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const campaignId = parseInt(req.params.id);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const campaign = await storage.getCampaign(campaignId);
    if (!campaign || campaign.companyId !== activeCompanyId) return res.sendStatus(403);

    const coupons = await storage.getCampaignCoupons(campaignId);
    res.json(coupons);
  });

  // Update coupon (company only)
  app.patch('/api/coupons/:id', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const couponId = parseInt(req.params.id);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const coupon = await storage.getCoupon(couponId);
    if (!coupon) return res.sendStatus(404);

    const campaign = await storage.getCampaign(coupon.campaignId);
    if (!campaign || campaign.companyId !== activeCompanyId) return res.sendStatus(403);

    const { isActive, maxUses, expiresAt } = req.body;
    const updates: any = {};
    if (isActive !== undefined) updates.isActive = isActive;
    if (maxUses !== undefined) updates.maxUses = maxUses;
    if (expiresAt !== undefined) updates.expiresAt = expiresAt ? new Date(expiresAt) : null;

    const updated = await storage.updateCoupon(couponId, updates);
    res.json(updated);
  });

  // Generate coupons for all accepted creators (company only)
  app.post('/api/campaigns/:id/coupons/generate', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const campaignId = parseInt(req.params.id);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const campaign = await storage.getCampaign(campaignId);
    if (!campaign || campaign.companyId !== activeCompanyId) return res.sendStatus(403);

    const { discountType, discountValue, maxUses, expiresAt, prefix } = req.body;

    if (!discountType || discountValue === undefined) {
      return res.status(400).json({ error: 'Tipo de desconto e valor são obrigatórios' });
    }

    // Get accepted applications
    const applications = await storage.getCampaignApplications(campaignId);
    const acceptedApps = applications.filter((app) => app.status === 'accepted');

    const createdCoupons = [];
    for (const app of acceptedApps) {
      // Check if creator already has a coupon
      const existing = await storage.getCreatorCoupon(campaignId, app.creatorId);
      if (existing) continue;

      // Get creator info
      const creator = await storage.getUser(app.creatorId);
      if (!creator) continue;

      // Generate unique code with retry loop for collision handling
      const creatorHandle = creator.instagram?.replace('@', '') || `creator${app.creatorId}`;
      const basePrefix = prefix || campaign.title.substring(0, 4).toUpperCase();

      let code = '';
      let attempts = 0;
      const maxAttempts = 5;

      while (attempts < maxAttempts) {
        const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
        code = `${basePrefix}_${creatorHandle.toUpperCase()}_${randomSuffix}`;

        const existingCode = await storage.getCouponByCode(code);
        if (!existingCode) break;
        attempts++;
      }

      if (attempts >= maxAttempts) {
        console.error(
          `[Coupon] Failed to generate unique code for creator ${app.creatorId} after ${maxAttempts} attempts`,
        );
        continue;
      }

      try {
        const coupon = await storage.createCoupon({
          campaignId,
          creatorId: app.creatorId,
          code,
          discountType,
          discountValue,
          maxUses: maxUses || null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          isActive: true,
          currentUses: 0,
        });

        createdCoupons.push(coupon);
      } catch (err) {
        console.error(`[Coupon] Failed to create coupon for creator ${app.creatorId}:`, err);
      }
    }

    res.status(201).json({ created: createdCoupons.length, coupons: createdCoupons });
  });

  // Register manual sale (company only)
  app.post('/api/campaigns/:id/sales', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const campaignId = parseInt(req.params.id);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const campaign = await storage.getCampaign(campaignId);
    if (!campaign || campaign.companyId !== activeCompanyId) return res.sendStatus(403);

    const { creatorId, orderId, orderValue, commissionRateBps, couponCode } = req.body;

    if (!creatorId || !orderId || orderValue === undefined) {
      return res.status(400).json({ error: 'Criador, ID do pedido e valor são obrigatórios' });
    }

    // Find coupon if code provided
    let couponId = null;
    if (couponCode) {
      const coupon = await storage.getCouponByCode(couponCode);
      if (coupon && coupon.campaignId === campaignId) {
        couponId = coupon.id;
      }
    }

    // Calculate commission using precise rounding (basis points)
    const commission = commissionRateBps ? Math.round((orderValue * commissionRateBps) / 10000) : 0;

    const sale = await storage.createSaleWithCommission({
      companyId: activeCompanyId,
      campaignId,
      creatorId,
      couponId,
      orderId,
      orderValue,
      commission,
      commissionRateBps,
      platform: 'manual',
    });

    // Record gamification event for sale (uses rules cascade: campaign > brand > defaults)
    try {
      await storage.recordGamificationEvent(
        activeCompanyId,
        creatorId,
        'sale_confirmed',
        `sale_${sale.id}`,
        'sale',
        sale.id,
        { orderId, orderValue, platform: 'manual' },
        campaignId,
      );
    } catch (gamificationError) {
      console.error('[Gamification] Error recording sale event:', gamificationError);
    }

    res.status(201).json(sale);
  });

  // Get sales for campaign (company only)
  app.get('/api/campaigns/:id/sales', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const campaignId = parseInt(req.params.id);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const campaign = await storage.getCampaign(campaignId);
    if (!campaign || campaign.companyId !== activeCompanyId) return res.sendStatus(403);

    const sales = await storage.getCampaignSales(campaignId);
    res.json(sales);
  });

  // Get commissions for campaign (company only)
  app.get('/api/campaigns/:id/commissions', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const campaignId = parseInt(req.params.id);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const campaign = await storage.getCampaign(campaignId);
    if (!campaign || campaign.companyId !== activeCompanyId) return res.sendStatus(403);

    const commissions = await storage.getCampaignCommissions(campaignId);
    res.json(commissions);
  });

  // Update commission status (company only - with ownership verification)
  app.patch('/api/commissions/:id', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const commissionId = parseInt(req.params.id);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const { status } = req.body;

    if (!status || !['pending', 'approved', 'paid'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    // Verify ownership through campaign
    const commission = await storage.getCommission(commissionId);
    if (!commission) return res.sendStatus(404);

    const campaign = await storage.getCampaign(commission.campaignId ?? 0);
    if (!campaign || campaign.companyId !== activeCompanyId) return res.sendStatus(403);

    const updated = await storage.updateCommissionStatus(commissionId, status);
    res.json(updated);
  });

  // Creator: Get my sales history
  app.get('/api/creator/sales', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const sales = await storage.getCreatorSales(req.user!.id);
    res.json(sales);
  });

  // Creator: Get my commissions
  app.get('/api/creator/commissions', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const commissions = await storage.getCreatorCommissions(req.user!.id);
    res.json(commissions);
  });

  // ==========================================
  // CREATOR SOCIAL CONNECTIONS
  // ==========================================

  // Get creator's social connections
  app.get('/api/creator/connections', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const user = await storage.getUser(req.user!.id);
    if (!user) return res.sendStatus(404);

    const connections = [
      {
        platform: 'instagram',
        username: user.instagram || null,
        connected: !!user.instagram,
        lastSync: user.instagramLastUpdated?.toISOString() || null,
        followers: user.instagramFollowers || undefined,
        profileUrl: user.instagram
          ? `https://instagram.com/${user.instagram.replace('@', '')}`
          : undefined,
      },
      {
        platform: 'tiktok',
        username: user.tiktok || null,
        connected: !!user.tiktok,
        lastSync: null,
        followers: undefined,
        profileUrl: user.tiktok ? `https://tiktok.com/@${user.tiktok.replace('@', '')}` : undefined,
      },
      {
        platform: 'youtube',
        username: user.youtube || null,
        connected: !!user.youtube,
        lastSync: null,
        followers: undefined,
        profileUrl: user.youtube ? `https://youtube.com/${user.youtube}` : undefined,
      },
      {
        platform: 'facebook',
        username: null,
        connected: false,
        lastSync: null,
      },
    ];

    res.json(connections);
  });

  // Connect a social platform
  app.post('/api/creator/connections', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const { platform, username } = req.body;
    if (!platform || !username) {
      return res.status(400).json({ error: 'Plataforma e nome de usuário são obrigatórios' });
    }

    const cleanUsername = username.replace('@', '').trim();

    const updateData: Record<string, string> = {};
    if (platform === 'instagram') updateData.instagram = cleanUsername;
    else if (platform === 'tiktok') updateData.tiktok = cleanUsername;
    else if (platform === 'youtube') updateData.youtube = cleanUsername;
    else return res.status(400).json({ error: 'Plataforma não suportada' });

    await storage.updateUser(req.user!.id, updateData);
    res.json({ success: true, platform, username: cleanUsername });
  });

  // Disconnect a social platform
  app.delete('/api/creator/connections/:platform', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const { platform } = req.params;

    const updateData: Record<string, null> = {};
    if (platform === 'instagram') updateData.instagram = null;
    else if (platform === 'tiktok') updateData.tiktok = null;
    else if (platform === 'youtube') updateData.youtube = null;
    else return res.status(400).json({ error: 'Plataforma não suportada' });

    await storage.updateUser(req.user!.id, updateData);
    res.json({ success: true });
  });

  // Creator: Get my coupon for a campaign
  app.get('/api/campaigns/:id/my-coupon', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);
    const campaignId = parseInt(req.params.id);

    const coupon = await storage.getCreatorCoupon(campaignId, req.user!.id);
    if (!coupon) {
      return res.json(null);
    }
    res.json(coupon);
  });

  // ==========================================
  // BRAND SALES & COMMISSIONS
  // ==========================================

  // Get brand coupons
  app.get('/api/brand/:brandId/coupons', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const brandId = parseInt(req.params.brandId);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId || activeCompanyId !== brandId) return res.sendStatus(403);

    try {
      const coupons = await storage.getBrandCoupons(brandId);
      res.json(coupons);
    } catch (error) {
      console.error('[API] Error fetching brand coupons:', error);
      res.status(500).json({ error: 'Failed to fetch coupons' });
    }
  });

  // Get brand sales
  app.get('/api/brand/sales', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const { from, to } = req.query;
    const fromDate = from ? new Date(from as string) : undefined;
    const toDate = to ? new Date(to as string) : undefined;

    const sales = await storage.getBrandSales(activeCompanyId, fromDate, toDate);
    res.json(sales);
  });

  // Create manual sale
  app.post('/api/brand/sales/manual', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const { creatorId, revenue, couponCode, campaignId } = req.body;

    if (!creatorId || !revenue) {
      return res.status(400).json({ error: 'creatorId e revenue são obrigatórios' });
    }

    const commissionRateBps = 1000;

    const sale = await storage.createSaleWithCommission({
      companyId: activeCompanyId,
      campaignId: campaignId || null,
      creatorId,
      couponCode: couponCode || null,
      orderId: `manual_${Date.now()}`,
      orderValue: Math.round(revenue * 100),
      commissionRateBps,
      platform: 'manual',
    });

    res.status(201).json(sale);
  });

  // Get brand commissions
  app.get('/api/brand/commissions', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const commissions = await storage.getBrandCommissions(activeCompanyId);
    res.json(commissions);
  });

  // Approve commission
  app.post('/api/brand/commissions/:id/approve', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const commissionId = parseInt(req.params.id);
    const commission = await storage.getCommission(commissionId);

    if (!commission) return res.status(404).json({ error: 'Comissão não encontrada' });
    if (commission.companyId !== activeCompanyId) return res.sendStatus(403);

    const updated = await storage.approveCommission(commissionId);
    res.json(updated);
  });

  // Pay commission
  app.post('/api/brand/commissions/:id/pay', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const commissionId = parseInt(req.params.id);
    const commission = await storage.getCommission(commissionId);

    if (!commission) return res.status(404).json({ error: 'Comissão não encontrada' });
    if (commission.companyId !== activeCompanyId) return res.sendStatus(403);
    if (commission.status !== 'approved') {
      return res.status(400).json({ error: 'Comissão precisa estar aprovada para ser paga' });
    }

    const updated = await storage.payCommission(commissionId);
    res.json(updated);
  });

  // Creator: get sales for a specific brand
  app.get('/api/creator/brand/:brandId/sales', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);
    const creatorId = req.user!.id;
    const brandId = parseInt(req.params.brandId);

    const allSales = await storage.getCreatorSales(creatorId);
    const brandSales = allSales.filter((s) => s.companyId === brandId);

    res.json(brandSales);
  });

  // Creator: get commissions for a specific brand
  app.get('/api/creator/brand/:brandId/commissions', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);
    const creatorId = req.user!.id;
    const brandId = parseInt(req.params.brandId);

    const allCommissions = await storage.getCreatorCommissions(creatorId);
    const brandCommissions = allCommissions.filter((c) => c.companyId === brandId);

    res.json(brandCommissions);
  });

  // ==========================================
  // BRAND OPERATIONS
  // ==========================================

  // Get operations summary
  app.get('/api/company/brand/:brandId/operations/summary', async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
      const brandId = parseInt(req.params.brandId);
      const activeCompanyId = req.session.activeCompanyId;
      if (!activeCompanyId || activeCompanyId !== brandId) return res.sendStatus(403);

      if (typeof (storage as any).getOperationsSummary === 'function') {
        const summary = await (storage as any).getOperationsSummary(brandId);
        res.json(summary);
      } else {
        res.json({ totalReachOut: 0, totalNegotiating: 0, totalActive: 0, totalCompleted: 0 });
      }
    } catch (error) {
      console.error('[Operations] Error getting summary:', error);
      res.json({ totalReachOut: 0, totalNegotiating: 0, totalActive: 0, totalCompleted: 0 });
    }
  });

  // Get discovery queue (reach-out)
  app.get('/api/company/brand/:brandId/operations/discovery', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const brandId = parseInt(req.params.brandId);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId || activeCompanyId !== brandId) return res.sendStatus(403);

    const queue = await storage.getBrandDiscoveryQueue(brandId);
    res.json(queue);
  });

  // Get pending invites
  app.get('/api/company/brand/:brandId/operations/invites', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const brandId = parseInt(req.params.brandId);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId || activeCompanyId !== brandId) return res.sendStatus(403);

    const invites = await storage.getBrandPendingInvites(brandId);
    res.json(invites);
  });

  // Approve deliverable
  app.post('/api/company/deliverables/:id/approve', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const deliverableId = parseInt(req.params.id);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const deliverable = await storage.getDeliverable(deliverableId);
    if (!deliverable) return res.status(404).json({ error: 'Entregável não encontrado' });

    const application = await storage.getApplication(deliverable.applicationId);
    if (!application) return res.sendStatus(404);

    const campaign = await storage.getCampaign(application.campaignId);
    if (!campaign || campaign.companyId !== activeCompanyId) return res.sendStatus(403);

    const updated = deliverable;

    // Send email notification to creator
    try {
      const creatorUser = await storage.getUser(application.creatorId);
      if (creatorUser?.email) {
        const { sendDeliverableApprovedEmail } = await import('./email');
        const company = await storage.getCompany(activeCompanyId);
        await sendDeliverableApprovedEmail(
          creatorUser.email,
          creatorUser.name || 'Creator',
          {
            title: campaign.title,
            brand: company?.tradeName || company?.name || 'Marca',
          },
          campaign.budget ? `R$ ${campaign.budget}` : 'A definir',
        );
      }
    } catch (emailError) {
      console.error('[Email] Failed to send deliverable approved email:', emailError);
    }

    // In-app notification for creator
    try {
      const notification = await storage.createNotification({
        userId: application.creatorId,
        type: 'deliverable_approved',
        title: 'Entregável aprovado!',
        message: `Seu entregável para a campanha "${campaign.title}" foi aprovado`,
        actionUrl: `/campaigns/${campaign.id}/workspace`,
        isRead: false,
      });
      const { notificationWS } = await import('./websocket');
      if (notificationWS) {
        notificationWS.sendToUser(application.creatorId, notification);
      }
    } catch (notifError) {
      console.error('[Notification] Error sending deliverable_approved:', notifError);
    }

    res.json(updated);
  });

  // Request changes on deliverable
  app.post('/api/company/deliverables/:id/request-changes', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const deliverableId = parseInt(req.params.id);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const deliverable = await storage.getDeliverable(deliverableId);
    if (!deliverable) return res.status(404).json({ error: 'Entregável não encontrado' });

    const application = await storage.getApplication(deliverable.applicationId);
    if (!application) return res.sendStatus(404);

    const campaign = await storage.getCampaign(application.campaignId);
    if (!campaign || campaign.companyId !== activeCompanyId) return res.sendStatus(403);

    const { feedback } = req.body;
    // TODO: implement feedback field in deliverables schema
    const updated = deliverable;

    // In-app notification for creator
    try {
      const notification = await storage.createNotification({
        userId: application.creatorId,
        type: 'deliverable_rejected',
        title: 'Alterações solicitadas no entregável',
        message: `A empresa solicitou alterações no seu entregável para a campanha "${campaign.title}"`,
        actionUrl: `/campaigns/${campaign.id}/workspace`,
        isRead: false,
      });
      const { notificationWS } = await import('./websocket');
      if (notificationWS) {
        notificationWS.sendToUser(application.creatorId, notification);
      }
    } catch (notifError) {
      console.error('[Notification] Error sending deliverable_rejected:', notifError);
    }

    res.json(updated);
  });

  // Get pendencias (SLA issues)
  app.get('/api/company/brand/:brandId/pendencias', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const brandId = parseInt(req.params.brandId);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId || activeCompanyId !== brandId) return res.sendStatus(403);

    const pendencias = await storage.getBrandPendencias(brandId);
    res.json(pendencias);
  });

  // ==========================================
  // BRANDED LANDING PAGES ROUTES
  // ==========================================

  // Company: Get brand settings
  app.get('/api/brand-settings', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const settings = await storage.getBrandSettingsByCompany(activeCompanyId);
    res.json(settings);
  });

  // Company: Create brand settings
  app.post('/api/brand-settings', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const { slug, brandName, ...rest } = req.body;
    if (!slug || !brandName) {
      return res.status(400).json({ error: 'Slug e nome da marca são obrigatórios' });
    }

    const existing = await storage.getBrandSettingsBySlug(slug);
    if (existing) {
      return res.status(400).json({ error: 'Este slug já está em uso' });
    }

    const settings = await storage.createBrandSettings({
      companyId: activeCompanyId,
      slug,
      brandName,
      ...rest,
    });
    res.status(201).json(settings);
  });

  // Company: Update brand settings
  app.patch('/api/brand-settings/:id', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const id = parseInt(req.params.id);
    const existing = await storage.getBrandSettings(id);
    if (!existing || existing.companyId !== activeCompanyId) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }

    if (req.body.slug && req.body.slug !== existing.slug) {
      const slugExists = await storage.getBrandSettingsBySlug(req.body.slug);
      if (slugExists) {
        return res.status(400).json({ error: 'Este slug já está em uso' });
      }
    }

    const updated = await storage.updateBrandSettings(id, req.body);
    res.json(updated);
  });

  // Company: Delete brand settings
  app.delete('/api/brand-settings/:id', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const id = parseInt(req.params.id);
    const existing = await storage.getBrandSettings(id);
    if (!existing || existing.companyId !== activeCompanyId) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }

    await storage.deleteBrandSettings(id);
    res.sendStatus(204);
  });

  // Public: Get brand settings by slug (for landing page)
  app.get('/api/m/:slug', async (req, res) => {
    const settings = await storage.getBrandSettingsBySlug(req.params.slug);
    if (!settings || !settings.isActive) {
      return res.status(404).json({ error: 'Página não encontrada' });
    }

    res.json({
      slug: settings.slug,
      brandName: settings.brandName,
      logoUrl: settings.logoUrl,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      backgroundColor: settings.backgroundColor,
      textColor: settings.textColor,
      accentColor: settings.accentColor,
      tagline: settings.tagline,
      description: settings.description,
      welcomeMessage: settings.welcomeMessage,
      termsAndConditions: settings.termsAndConditions,
      privacyPolicy: settings.privacyPolicy,
      collectSocialProfiles: settings.collectSocialProfiles,
      collectShippingAddress: settings.collectShippingAddress,
      collectPaymentInfo: settings.collectPaymentInfo,
      collectClothingSize: settings.collectClothingSize,
      collectContentPreferences: settings.collectContentPreferences,
      customFields: settings.customFields,
    });
  });

  // ==========================================
  // WALLET & PAYMENT SYSTEM
  // ==========================================

  // Company: Get wallet info
  app.get('/api/wallet', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const wallet = await storage.getOrCreateCompanyWallet(activeCompanyId);
    const boxes = await storage.getWalletBoxes(wallet.id);

    res.json({ wallet, boxes });
  });

  // Company: Get transactions (extrato)
  app.get('/api/wallet/transactions', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const wallet = await storage.getOrCreateCompanyWallet(activeCompanyId);
    const { type, status, userId, limit, offset } = req.query;

    const transactions = await storage.getCompanyTransactions(wallet.id, {
      type: type as string | undefined,
      status: status as string | undefined,
      userId: userId ? parseInt(userId as string) : undefined,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    });

    res.json(transactions);
  });

  // Company: Add balance to wallet
  app.post('/api/wallet/deposit', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const { amount, description } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    const transaction = await storage.addToCompanyWallet(
      activeCompanyId,
      Math.round(amount * 100),
      description || 'Depósito',
    );

    res.status(201).json(transaction);
  });

  // Company: Pay creator
  app.post('/api/wallet/pay-creator', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const { creatorId, amount, type, description, campaignId } = req.body;

    if (!creatorId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    try {
      const result = await storage.payCreator(
        activeCompanyId,
        creatorId,
        Math.round(amount * 100),
        type || 'payment_variable',
        description || 'Pagamento',
        campaignId,
      );

      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Company: Manage wallet boxes (caixinhas)
  app.get('/api/wallet/boxes', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const wallet = await storage.getOrCreateCompanyWallet(activeCompanyId);
    const boxes = await storage.getWalletBoxes(wallet.id);

    res.json(boxes);
  });

  app.post('/api/wallet/boxes', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const wallet = await storage.getOrCreateCompanyWallet(activeCompanyId);
    const { name, description, color, icon, targetAmount } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const box = await storage.createWalletBox({
      companyWalletId: wallet.id,
      name,
      description,
      color,
      icon,
      targetAmount: targetAmount ? Math.round(targetAmount * 100) : undefined,
    });

    res.status(201).json(box);
  });

  app.patch('/api/wallet/boxes/:id', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const id = parseInt(req.params.id);
    const { name, description, color, icon, targetAmount, isActive } = req.body;

    const updated = await storage.updateWalletBox(id, {
      name,
      description,
      color,
      icon,
      targetAmount: targetAmount !== undefined ? Math.round(targetAmount * 100) : undefined,
      isActive,
    });

    res.json(updated);
  });

  app.delete('/api/wallet/boxes/:id', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);

    await storage.deleteWalletBox(parseInt(req.params.id));
    res.sendStatus(204);
  });

  // Creator: Get balance info
  app.get('/api/creator/balance', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const balance = await storage.getOrCreateCreatorBalance(req.user!.id);
    res.json(balance);
  });

  // Creator: Get transactions (extrato)
  app.get('/api/creator/transactions', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const balance = await storage.getOrCreateCreatorBalance(req.user!.id);
    const { limit, offset } = req.query;

    const transactions = await storage.getCreatorTransactions(
      balance.id,
      limit ? parseInt(limit as string) : 50,
      offset ? parseInt(offset as string) : 0,
    );

    res.json(transactions);
  });

  // Creator: Update PIX info
  app.patch('/api/creator/balance/pix', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const { pixKey, pixKeyType } = req.body;

    if (!pixKey || !pixKeyType) {
      return res.status(400).json({ error: 'Dados PIX obrigatórios' });
    }

    const updated = await storage.updateCreatorBalance(req.user!.id, { pixKey, pixKeyType });
    res.json(updated);
  });

  // Company: Get all creators with balances (for payment management)
  app.get('/api/wallet/creators', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const wallet = await storage.getOrCreateCompanyWallet(activeCompanyId);
    const transactions = await storage.getCompanyTransactions(wallet.id, { limit: 1000 });

    const creatorIds = Array.from(
      new Set(transactions.filter((t) => t.relatedUserId).map((t) => t.relatedUserId!)),
    );

    const creatorsData = await Promise.all(
      creatorIds.map(async (creatorId) => {
        const creator = await storage.getUser(creatorId);
        const creatorTransactions = transactions.filter((t) => t.relatedUserId === creatorId);
        const totalPaid = creatorTransactions
          .filter((t) => t.status === 'completed' && t.amount < 0)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const pendingAmount = creatorTransactions
          .filter((t) => t.status === 'pending' && t.amount < 0)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        return {
          id: creator?.id,
          name: creator?.name || creator?.email,
          email: creator?.email,
          avatar: creator?.avatar,
          instagramHandle: creator?.instagram,
          totalPaid,
          pendingAmount,
          lastPayment: creatorTransactions.find((t) => t.amount < 0)?.createdAt,
        };
      }),
    );

    res.json(creatorsData);
  });

  // ==========================================
  // GAMIFICATION V2 - Brand/Campaign Configurable
  // ==========================================

  // ==========================================
  // BRAND PROGRAM - Company program configuration
  // ==========================================

  // Get brand program for active company
  app.get('/api/brand/program', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const program = await storage.getBrandProgram(activeCompanyId);
    res.json(program || null);
  });

  // Create or update brand program
  app.put('/api/brand/program', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const {
      name,
      description,
      autoJoinCommunity,
      couponPrefix,
      couponGenerationRule,
      requirementsJson,
      gamificationEnabled,
      defaultRewardMode,
    } = req.body;

    const program = await storage.upsertBrandProgram({
      companyId: activeCompanyId,
      name,
      description,
      autoJoinCommunity,
      couponPrefix,
      couponGenerationRule,
      requirementsJson,
      gamificationEnabled,
      defaultRewardMode,
    });

    res.json(program);
  });

  // Get brand rewards catalog
  app.get('/api/brand/rewards', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const rewards = await storage.getBrandRewards(activeCompanyId);
    res.json(rewards);
  });

  // Create brand reward
  app.post('/api/brand/rewards', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const {
      name,
      description,
      type,
      value,
      imageUrl,
      sku,
      stock,
      isActive,
      tierRequired,
      pointsCost,
    } = req.body;

    const reward = await storage.createBrandReward({
      companyId: activeCompanyId,
      name,
      description,
      type,
      value,
      imageUrl,
      sku,
      stock,
      isActive,
      tierRequired,
      pointsCost,
    });

    res.status(201).json(reward);
  });

  // Update brand reward
  app.put('/api/brand/rewards/:id', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const rewardId = parseInt(req.params.id);
    const existing = await storage.getBrandReward(rewardId);
    if (!existing || existing.companyId !== activeCompanyId) {
      return res.status(404).json({ error: 'Prêmio não encontrado' });
    }

    const {
      name,
      description,
      type,
      value,
      imageUrl,
      sku,
      stock,
      isActive,
      tierRequired,
      pointsCost,
    } = req.body;

    const reward = await storage.updateBrandReward(rewardId, {
      name,
      description,
      type,
      value,
      imageUrl,
      sku,
      stock,
      isActive,
      tierRequired,
      pointsCost,
    });

    res.json(reward);
  });

  // Delete brand reward
  app.delete('/api/brand/rewards/:id', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const rewardId = parseInt(req.params.id);
    const existing = await storage.getBrandReward(rewardId);
    if (!existing || existing.companyId !== activeCompanyId) {
      return res.status(404).json({ error: 'Prêmio não encontrado' });
    }

    await storage.deleteBrandReward(rewardId);
    res.sendStatus(204);
  });

  // Brand Tiers - Get all tiers for the active company
  app.get('/api/brand/tiers', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const tiers = await storage.getBrandTiers(activeCompanyId);
    const creatorCounts = await storage.getBrandTierCreatorCounts(activeCompanyId);

    const tiersWithCounts = tiers.map((tier) => ({
      ...tier,
      creatorCount: creatorCounts.find((c) => c.tierId === tier.id)?.count || 0,
    }));

    res.json(tiersWithCounts);
  });

  // Brand Tiers - Create new tier
  app.post('/api/brand/tiers', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const { tierName, minPoints, color, icon, benefitsJson, sortOrder } = req.body;

    const tier = await storage.createBrandTier({
      companyId: activeCompanyId,
      tierName,
      minPoints: minPoints || 0,
      color,
      icon,
      benefitsJson,
      sortOrder: sortOrder || 0,
    });

    res.status(201).json(tier);
  });

  // Brand Tiers - Update tier
  app.put('/api/brand/tiers/:id', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const tierId = parseInt(req.params.id);
    const { tierName, minPoints, color, icon, benefitsJson, sortOrder } = req.body;

    const tier = await storage.updateBrandTier(tierId, {
      tierName,
      minPoints,
      color,
      icon,
      benefitsJson,
      sortOrder,
    });

    res.json(tier);
  });

  // Brand Tiers - Delete tier
  app.delete('/api/brand/tiers/:id', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const tierId = parseInt(req.params.id);
    await storage.deleteBrandTier(tierId);

    res.sendStatus(204);
  });

  // Brand Tiers - Reorder tiers
  app.post('/api/brand/tiers/reorder', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const { tierIds } = req.body as { tierIds: number[] };
    if (!tierIds || !Array.isArray(tierIds)) {
      return res.status(400).json({ error: 'tierIds é obrigatório' });
    }

    try {
      // First verify all tiers belong to this company
      const existingTiers = await storage.getBrandTiers(activeCompanyId);
      const existingTierIds = new Set(existingTiers.map((t) => t.id));

      // Check ownership of all provided tier IDs
      for (const id of tierIds) {
        if (!existingTierIds.has(id)) {
          return res.status(403).json({ error: 'Tier não pertence a esta empresa' });
        }
      }

      // Update sort order for each tier (now safe since we verified ownership)
      await Promise.all(
        tierIds.map((id, index) => storage.updateBrandTier(id, { sortOrder: index })),
      );

      const tiers = await storage.getBrandTiers(activeCompanyId);
      res.json(tiers);
    } catch (error) {
      console.error('[API] Error reordering tiers:', error);
      res.status(500).json({ error: 'Erro ao reordenar tiers' });
    }
  });

  // Campaign Prizes - Replace all prizes for a campaign
  app.put('/api/campaigns/:id/prizes', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const campaignId = parseInt(req.params.id);
    const { prizes } = req.body;

    const prizesWithCampaignId = (prizes || []).map((p: any) => ({
      campaignId,
      type: p.type,
      rankPosition: p.rankPosition,
      milestonePoints: p.milestonePoints,
      rewardKind: p.rewardKind,
      cashAmount: p.cashAmount,
      productSku: p.productSku,
      productDescription: p.productDescription,
      notes: p.notes,
    }));

    const savedPrizes = await storage.replaceCampaignPrizes(campaignId, prizesWithCampaignId);
    res.json(savedPrizes);
  });

  // Campaign Leaderboard - Get ranking for a campaign
  app.get('/api/campaigns/:id/leaderboard', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const campaignId = parseInt(req.params.id);

    // Recalculate ranks before returning
    await storage.recalculateCampaignRanks(campaignId);

    const leaderboard = await storage.getCampaignLeaderboardV1(campaignId);
    const prizes = await storage.getCampaignPrizes(campaignId);

    res.json({
      leaderboard: leaderboard.map((entry: any, index: number) => ({
        rank: index + 1,
        creatorId: entry.creatorId,
        creatorName: entry.creator.name,
        creatorAvatar: entry.creator.avatar,
        totalPoints: entry.totalPoints,
        prize: prizes.find((p) => p.type === 'ranking_place' && p.rankPosition === index + 1),
      })),
      prizes,
    });
  });

  // Points Ledger - Get entries for a campaign
  app.get('/api/campaigns/:id/points-ledger', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const campaignId = parseInt(req.params.id);
    const ledger = await storage.getPointsLedgerForCampaign(campaignId);

    res.json(ledger);
  });

  // Creator's points in a campaign
  app.get('/api/creator/campaigns/:id/points', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const campaignId = parseInt(req.params.id);
    const creatorId = req.user!.id;

    const score = await storage.getCreatorScore(campaignId, creatorId);
    const ledger = await storage.getPointsLedgerForCreator(creatorId, campaignId);

    res.json({
      score: score || { totalPoints: 0, rank: null },
      history: ledger,
    });
  });

  // Get effective scoring rules for a campaign
  app.get('/api/campaigns/:id/scoring-rules', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const campaignId = parseInt(req.params.id);
    const campaign = await storage.getCampaign(campaignId);

    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    const rules = await storage.getEffectiveScoringRules(campaignId, campaign.companyId);
    res.json(rules);
  });

  // Get effective caps for a campaign
  app.get('/api/campaigns/:id/scoring-caps', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const campaignId = parseInt(req.params.id);
    const campaign = await storage.getCampaign(campaignId);

    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    const caps = await storage.getEffectiveCaps(campaignId, campaign.companyId);
    res.json(caps);
  });

  // Get metric snapshots for a campaign
  app.get('/api/campaigns/:id/metric-snapshots', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const campaignId = parseInt(req.params.id);
    const snapshots = await storage.getCampaignSnapshots(campaignId);
    res.json(snapshots);
  });

  // Get flagged snapshots for review
  app.get('/api/campaigns/:id/flagged-snapshots', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const campaignId = parseInt(req.params.id);
    const flagged = await storage.getFlaggedSnapshots(campaignId);
    res.json(flagged);
  });

  // Clear snapshot flag (approve after review)
  app.post('/api/metric-snapshots/:id/clear-flag', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const snapshotId = parseInt(req.params.id);
    const updated = await storage.clearSnapshotFlag(snapshotId);
    res.json(updated);
  });

  // Trigger manual metrics processing for a campaign
  app.post('/api/campaigns/:id/process-metrics', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const campaignId = parseInt(req.params.id);
    const campaign = await storage.getCampaign(campaignId);

    if (!campaign || campaign.companyId !== activeCompanyId) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    const { processMetricsForCampaign } = await import('./jobs/metricsProcessor');
    const result = await processMetricsForCampaign(campaignId, activeCompanyId);
    res.json(result);
  });

  // Creator's metric snapshots in a campaign
  app.get('/api/creator/campaigns/:id/metric-snapshots', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const campaignId = parseInt(req.params.id);
    const creatorId = req.user!.id;

    const snapshots = await storage.getCreatorCampaignSnapshots(campaignId, creatorId);
    res.json(snapshots);
  });

  // ==========================================
  // BRAND LEADERBOARD WITH RANGE FILTERING
  // ==========================================

  // Brand leaderboard with time range filter
  app.get('/api/brand/leaderboard', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const range = (req.query.range as 'week' | 'month' | 'all') || 'all';
    const campaignId = req.query.campaignId ? parseInt(req.query.campaignId as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const leaderboard = await storage.getBrandLeaderboard(
      activeCompanyId,
      range,
      campaignId,
      limit,
    );
    res.json(leaderboard);
  });

  // Creator points summary for a brand
  app.get('/api/creator/brand/:companyId/points-summary', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const creatorId = req.user!.id;
    const companyId = parseInt(req.params.companyId);

    const summary = await storage.getCreatorPointsSummary(creatorId, companyId);
    res.json(summary);
  });

  // Creator-facing brand leaderboard (shows other community members)
  app.get('/api/creator/brand/:companyId/leaderboard', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const companyId = parseInt(req.params.companyId);
    const range = (req.query.range as 'week' | 'month' | 'all') || 'all';
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    if (isNaN(companyId)) return res.status(400).json({ error: 'ID inválido' });

    const leaderboard = await storage.getBrandLeaderboard(companyId, range, undefined, limit);
    res.json(
      leaderboard.map((entry) => ({
        rank: entry.rank,
        points: entry.totalPoints,
        creator: entry.creator
          ? {
              id: entry.creator.id,
              name: entry.creator.name,
              avatar: entry.creator.avatar,
            }
          : null,
        isCurrentUser: entry.creatorId === req.user!.id,
      })),
    );
  });

  // Brand context for workspace (tier, points, coupon)
  app.get('/api/creator/brand/:companyId/context', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const creatorId = req.user!.id;
    const companyId = parseInt(req.params.companyId);

    if (isNaN(companyId)) return res.status(400).json({ error: 'ID inválido' });

    try {
      const company = await storage.getCompany(companyId);
      if (!company) return res.status(404).json({ error: 'Marca não encontrada' });

      const memberships = await storage.getCreatorMemberships(creatorId);
      const membership = memberships.find(
        (m) => m.companyId === companyId && m.status === 'active',
      );

      if (!membership) {
        return res.json({
          brandId: company.id,
          brandName: company.name || company.tradeName,
          brandLogo: company.logo,
          tier: null,
          points: 0,
          couponCode: null,
          isMember: false,
        });
      }

      let tierInfo = null;
      if (membership.tierId) {
        const tier = await storage.getBrandTierConfig(membership.tierId);
        tierInfo = tier ? { name: tier.tierName, color: tier.color, icon: tier.icon } : null;
      }

      res.json({
        brandId: company.id,
        brandName: company.name || company.tradeName,
        brandLogo: company.logo,
        tier: tierInfo,
        points: membership.pointsCache || 0,
        couponCode: membership.couponCode,
        isMember: true,
      });
    } catch (error) {
      console.error('Error fetching brand context:', error);
      res.status(500).json({ error: 'Erro ao buscar contexto da marca' });
    }
  });

  // Record gamification event (internal use - called from other flows)
  app.post('/api/gamification/event', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { companyId, creatorId, eventType, eventRefId, refType, refId, metadata, campaignId } =
      req.body;

    // Validate required fields
    if (!companyId || !creatorId || !eventType || !eventRefId || !refType || refId === undefined) {
      return res
        .status(400)
        .json({
          error: 'Campos obrigatórios: companyId, creatorId, eventType, eventRefId, refType, refId',
        });
    }

    const entry = await storage.recordGamificationEvent(
      companyId,
      creatorId,
      eventType,
      eventRefId,
      refType,
      refId,
      metadata,
      campaignId,
    );

    if (entry) {
      res.status(201).json(entry);
    } else {
      res.json({ message: 'Evento já registrado ou pontuação zero' });
    }
  });

  // System-level points event emission with configurable rules
  // POST /api/system/points/emit-event
  // Body: { companyId, campaignId?, creatorId, eventType, quantity?, metadata? }
  // eventType: 'deliverable_submitted', 'deliverable_approved', 'post', 'reels', 'story', 'views', 'likes', 'comments', 'sales'
  app.post('/api/system/points/emit-event', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { companyId, campaignId, creatorId, eventType, quantity = 1, metadata } = req.body;

    // Validate required fields
    if (!companyId || !creatorId || !eventType) {
      return res.status(400).json({
        error: 'Campos obrigatórios: companyId, creatorId, eventType',
      });
    }

    // Map input event types to valid schema enum values
    const eventTypeMap: Record<
      string,
      | 'post_created'
      | 'reel_created'
      | 'story_created'
      | 'views_milestone'
      | 'like_milestone'
      | 'comment_milestone'
      | 'sale_confirmed'
      | 'delivery_approved'
      | 'course_completed'
      | 'admin_adjustment'
      | 'ontime_bonus'
      | 'quality_bonus'
      | 'penalty_late'
      | 'milestone_reached'
    > = {
      post: 'post_created',
      reels: 'reel_created',
      story: 'story_created',
      views: 'views_milestone',
      likes: 'like_milestone',
      comments: 'comment_milestone',
      sales: 'sale_confirmed',
      deliverable_submitted: 'post_created',
      deliverable_approved: 'delivery_approved',
    };

    const validEventTypes = [
      'deliverable_submitted',
      'deliverable_approved',
      'post',
      'reels',
      'story',
      'views',
      'likes',
      'comments',
      'sales',
    ];

    if (!validEventTypes.includes(eventType)) {
      return res.status(400).json({
        error: `eventType inválido. Valores permitidos: ${validEventTypes.join(', ')}`,
      });
    }

    try {
      // 1. Fetch rules (campaign override if exists, else brand defaults)
      let rulesJson: any = {};

      if (campaignId) {
        const campaignRules = await storage.getCampaignPointsRules(campaignId);
        if (campaignRules?.overridesBrand && campaignRules.rulesJson) {
          rulesJson = campaignRules.rulesJson;
        }
      }

      // 2. Calculate points based on rules
      const calculatePointsForEvent = (eventType: string, qty: number, rules: any): number => {
        switch (eventType) {
          case 'post':
            return rules.pointsPerDeliverable || 100;
          case 'reels':
            return rules.pointsPerDeliverableType?.reels || rules.pointsPerDeliverable || 100;
          case 'story':
            return rules.pointsPerDeliverableType?.stories || 50;
          case 'views':
            return Math.floor((qty / 1000) * (rules.pointsPer1kViews || 10));
          case 'likes':
            return qty * (rules.pointsPerLike || 1);
          case 'comments':
            return qty * (rules.pointsPerComment || 3);
          case 'sales':
            return qty * (rules.pointsPerSale || 500);
          case 'deliverable_submitted':
            return rules.pointsPerDeliverable || 50;
          case 'deliverable_approved':
            return rules.pointsOnTimeBonus || 50;
          default:
            return 0;
        }
      };

      const deltaPoints = calculatePointsForEvent(eventType, quantity, rulesJson);

      if (deltaPoints <= 0) {
        return res.json({
          message: 'Nenhum ponto atribuído para este evento',
          points: 0,
        });
      }

      // 3. Add entry to points ledger
      const refId = metadata?.refId || Date.now();
      const refType = metadata?.refType || eventType;
      const mappedEventType = eventTypeMap[eventType] || 'post_created';

      const entry = await storage.addPointsLedgerEntry({
        companyId,
        campaignId: campaignId || null,
        creatorId,
        deltaPoints,
        eventType: mappedEventType,
        refType,
        refId,
        metadata: metadata || null,
      });

      if (!entry) {
        return res.json({
          message: 'Evento já registrado anteriormente',
          points: 0,
        });
      }

      // 4. Update brandCreatorTiers if necessary
      await storage.updateBrandCreatorPoints(companyId, creatorId, deltaPoints);

      res.status(201).json({
        success: true,
        entry,
        pointsAwarded: deltaPoints,
        eventType,
        rulesApplied: {
          source: campaignId ? 'campaign' : 'brand',
          campaignId,
          companyId,
        },
      });
    } catch (error) {
      console.error('[API] Error emitting points event:', error);
      res.status(500).json({ error: 'Erro ao emitir evento de pontos' });
    }
  });

  // Get campaign points rules
  app.get('/api/campaigns/:id/points-rules', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const campaignId = parseInt(req.params.id);

    const rules = await storage.getCampaignPointsRules(campaignId);
    res.json(rules || { rulesJson: {}, overridesBrand: false });
  });

  // Update campaign points rules
  app.put('/api/campaigns/:id/points-rules', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const campaignId = parseInt(req.params.id);
    const campaign = await storage.getCampaign(campaignId);

    if (!campaign || campaign.companyId !== activeCompanyId) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    const { rulesJson, overridesBrand } = req.body;
    const rules = await storage.upsertCampaignPointsRules(campaignId, rulesJson, overridesBrand);
    res.json(rules);
  });

  // ==========================================
  // REWARD ENTITLEMENTS - Milestones & Prizes
  // ==========================================

  // Get reward entitlements for a campaign (company view)
  app.get('/api/campaigns/:id/rewards', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const campaignId = parseInt(req.params.id);
    const status = req.query.status as string | undefined;

    const rewards = await storage.getRewardEntitlements({
      companyId: activeCompanyId,
      campaignId,
      status,
    });

    // Enrich with creator info
    const enrichedRewards = await Promise.all(
      rewards.map(async (reward) => {
        const creator = await storage.getUser(reward.creatorId);
        const prize = await storage.getCampaignPrize(reward.prizeId);
        return {
          ...reward,
          creator: creator ? { id: creator.id, name: creator.name, avatar: creator.avatar } : null,
          prize,
        };
      }),
    );

    res.json(enrichedRewards);
  });

  // Get all rewards for a company (across all campaigns)
  app.get('/api/company/rewards', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const status = req.query.status as string | undefined;

    const rewards = await storage.getRewardEntitlements({
      companyId: activeCompanyId,
      status,
    });

    // Enrich with creator and campaign info
    const enrichedRewards = await Promise.all(
      rewards.map(async (reward) => {
        const creator = await storage.getUser(reward.creatorId);
        const campaign = await storage.getCampaign(reward.campaignId);
        return {
          ...reward,
          creator: creator ? { id: creator.id, name: creator.name, avatar: creator.avatar } : null,
          campaign: campaign ? { id: campaign.id, title: campaign.title } : null,
        };
      }),
    );

    res.json(enrichedRewards);
  });

  // Approve a reward entitlement
  app.post('/api/rewards/:id/approve', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const rewardId = parseInt(req.params.id);

    // Verify reward belongs to company
    const reward = await storage.getRewardEntitlement(rewardId);
    if (!reward || reward.companyId !== activeCompanyId) {
      return res.status(404).json({ error: 'Recompensa não encontrada' });
    }

    const updated = await storage.approveRewardEntitlement(rewardId, req.user!.id);
    res.json(updated);
  });

  // Reject a reward entitlement
  app.post('/api/rewards/:id/reject', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const rewardId = parseInt(req.params.id);
    const { reason } = req.body;

    // Verify reward belongs to company
    const reward = await storage.getRewardEntitlement(rewardId);
    if (!reward || reward.companyId !== activeCompanyId) {
      return res.status(404).json({ error: 'Recompensa não encontrada' });
    }

    const updated = await storage.rejectRewardEntitlement(rewardId, req.user!.id, reason);
    res.json(updated);
  });

  // Execute an approved reward (trigger payment/shipment)
  app.post('/api/rewards/:id/execute', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const rewardId = parseInt(req.params.id);

    // Verify reward belongs to company
    const reward = await storage.getRewardEntitlement(rewardId);
    if (!reward || reward.companyId !== activeCompanyId) {
      return res.status(404).json({ error: 'Recompensa não encontrada' });
    }

    if (reward.status !== 'approved') {
      return res.status(400).json({ error: 'Recompensa deve ser aprovada antes de executar' });
    }

    try {
      await storage.executeApprovedReward(rewardId, req.user!.id);
      const updated = await storage.getRewardEntitlement(rewardId);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Bulk approve rewards
  app.post('/api/rewards/bulk-approve', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const { rewardIds } = req.body;

    if (!Array.isArray(rewardIds) || rewardIds.length === 0) {
      return res.status(400).json({ error: 'IDs de recompensas inválidos' });
    }

    // Verify all rewards belong to company
    for (const id of rewardIds) {
      const reward = await storage.getRewardEntitlement(id);
      if (!reward || reward.companyId !== activeCompanyId) {
        return res.status(403).json({ error: `Recompensa ${id} não pertence à empresa` });
      }
    }

    const approved = await storage.bulkApproveRewards(rewardIds, req.user!.id);
    res.json({ approved });
  });

  // Complete a reward entitlement
  app.post('/api/rewards/:id/complete', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const rewardId = parseInt(req.params.id);

    // Verify reward belongs to company
    const reward = await storage.getRewardEntitlement(rewardId);
    if (!reward || reward.companyId !== activeCompanyId) {
      return res.status(404).json({ error: 'Recompensa não encontrada' });
    }

    const updated = await storage.completeRewardEntitlement(rewardId, req.user!.id);
    res.json(updated);
  });

  // Get reward event history (audit log)
  app.get('/api/rewards/:id/events', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const rewardId = parseInt(req.params.id);

    // Verify reward belongs to company
    const reward = await storage.getRewardEntitlement(rewardId);
    if (!reward || reward.companyId !== activeCompanyId) {
      return res.status(404).json({ error: 'Recompensa não encontrada' });
    }

    // TODO: implement getRewardEvents
    const events: any[] = [];
    res.json(events);
  });

  // Close campaign ranking and create winner rewards
  app.post('/api/campaigns/:id/close-ranking', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const campaignId = parseInt(req.params.id);
    const campaign = await storage.getCampaign(campaignId);

    if (!campaign || campaign.companyId !== activeCompanyId) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    try {
      // TODO: implement closeCampaignRanking
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Creator view: my rewards
  app.get('/api/creator/rewards', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const creatorId = req.user!.id;
    const rewards = await storage.getRewardEntitlements({ creatorId });

    // Enrich with campaign info
    const enrichedRewards = await Promise.all(
      rewards.map(async (reward) => {
        const campaign = await storage.getCampaign(reward.campaignId);
        const company = await storage.getCompany(reward.companyId);
        return {
          ...reward,
          campaign: campaign ? { id: campaign.id, title: campaign.title } : null,
          company: company ? { id: company.id, name: company.name } : null,
        };
      }),
    );

    res.json(enrichedRewards);
  });

  // ==========================================
  // COMMUNITY - MINHA COMUNIDADE
  // ==========================================

  // List company community invites
  app.get('/api/community/invites', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const invites = await storage.getCompanyCommunityInvites(activeCompanyId);
    res.json(invites);
  });

  // Create community invite - supports creatorId, creatorHandle, or email
  app.post('/api/community/invites', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const { creatorId, creatorHandle, email, campaignId, message, expiresInDays = 30 } = req.body;

    // Must have at least one identifier
    if (!creatorId && !creatorHandle && !email) {
      return res.status(400).json({ error: 'Informe creatorId, @instagram ou email' });
    }

    // If creatorId provided, check if already a member
    if (creatorId) {
      const existingMembership = await storage.getBrandCreatorMembershipByCreatorAndCompany(
        creatorId,
        activeCompanyId,
      );
      if (existingMembership && existingMembership.status === 'active') {
        return res.status(400).json({ error: 'Creator já é membro ativo desta comunidade' });
      }

      // Check for pending invite
      const pendingInvites = await storage.getCreatorPendingCommunityInvites(creatorId);
      const existingPending = pendingInvites.find((i) => i.companyId === activeCompanyId);
      if (existingPending) {
        return res.status(400).json({ error: 'Já existe convite pendente para este creator' });
      }
    }

    // If creatorHandle provided, try to find existing creator
    let resolvedCreatorId = creatorId;
    if (!resolvedCreatorId && creatorHandle) {
      const handle = creatorHandle.replace('@', '').toLowerCase();
      const creator = await storage.getUserByInstagram(handle);
      if (creator) {
        resolvedCreatorId = creator.id;
        // Check membership
        const existingMembership = await storage.getBrandCreatorMembershipByCreatorAndCompany(
          creator.id,
          activeCompanyId,
        );
        if (existingMembership && existingMembership.status === 'active') {
          return res.status(400).json({ error: 'Creator já é membro ativo desta comunidade' });
        }
      }
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const invite = await storage.createCommunityInvite({
      companyId: activeCompanyId,
      creatorId: resolvedCreatorId || null,
      creatorHandle: creatorHandle ? creatorHandle.replace('@', '').toLowerCase() : null,
      email: email || null,
      token,
      status: 'sent',
      campaignId: campaignId || null,
      metadata: message ? { message } : null,
      expiresAt,
      createdByUserId: req.user!.id,
    });

    // Build invite link
    const inviteLink = `/join/${token}`;

    res.json({ ...invite, inviteLink });
  });

  // Get invite details (public endpoint for join page)
  app.get('/api/join/:token', async (req, res) => {
    const invite = await storage.getCommunityInviteByToken(req.params.token);

    if (!invite) {
      return res.status(404).json({ error: 'Convite não encontrado' });
    }

    if (
      invite.status === 'expired' ||
      (invite.expiresAt && new Date(invite.expiresAt) < new Date())
    ) {
      await storage.updateCommunityInvite(invite.id, { status: 'expired' });
      return res.status(410).json({ error: 'Convite expirado' });
    }

    if (invite.status === 'accepted') {
      return res.status(410).json({ error: 'Convite já utilizado' });
    }

    if (invite.status === 'cancelled') {
      return res.status(410).json({ error: 'Convite cancelado' });
    }

    // Mark as opened
    if (invite.status === 'sent') {
      await storage.updateCommunityInvite(invite.id, { status: 'opened', openedAt: new Date() });
    }

    const company = await storage.getCompany(invite.companyId);

    res.json({
      id: invite.id,
      companyName: company?.name || 'Marca',
      companyLogo: company?.logo || null,
      invitedName: invite.metadata?.source || 'Creator',
      invitedEmail: invite.email,
      customMessage: invite.metadata?.message || null,
    });
  });

  // Accept invite (requires authentication)
  app.post('/api/join/:token/accept', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Faça login ou crie uma conta para aceitar o convite' });
    }

    if (req.user!.role !== 'creator') {
      return res
        .status(403)
        .json({ error: 'Apenas criadores podem aceitar convites de comunidade' });
    }

    const { termsAccepted } = req.body;
    if (!termsAccepted) {
      return res.status(400).json({ error: 'Você deve aceitar os termos de uso para continuar' });
    }

    const invite = await storage.getCommunityInviteByToken(req.params.token);

    if (!invite) {
      return res.status(404).json({ error: 'Convite não encontrado' });
    }

    if (invite.status === 'accepted') {
      return res.status(410).json({ error: 'Convite já utilizado' });
    }

    if (invite.status === 'expired' || invite.status === 'cancelled') {
      return res.status(410).json({ error: 'Convite não está mais válido' });
    }

    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      await storage.updateCommunityInvite(invite.id, { status: 'expired' });
      return res.status(410).json({ error: 'Convite expirado' });
    }

    // Check if already a member
    const existingMembership = await storage.getBrandCreatorMembershipByCreatorAndCompany(
      req.user!.id,
      invite.companyId,
    );

    if (existingMembership) {
      return res.status(400).json({ error: 'Você já é membro desta comunidade' });
    }

    // Get client IP
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';

    // Get default Bronze tier for company
    const tiers = await storage.getBrandTiers(invite.companyId);
    const bronzeTier = tiers.find((t: any) => t.sortOrder === 0 || t.minPoints === 0);

    // Create membership
    const membership = await storage.createBrandCreatorMembership({
      creatorId: req.user!.id,
      companyId: invite.companyId,
      status: 'active',
      tierId: bronzeTier?.id || null,
      source: 'invite',
      inviteId: invite.id,
      termsAcceptedAt: new Date(),
      termsAcceptedIp: clientIp,
      joinedAt: new Date(),
    });

    // Update invite
    await storage.updateCommunityInvite(invite.id, {
      status: 'accepted',
      acceptedAt: new Date(),
    });

    // Record gamification event for community join
    try {
      await storage.recordGamificationEvent(
        invite.companyId,
        req.user!.id,
        'community_joined',
        `community_${invite.companyId}_${req.user!.id}`,
        'membership',
        membership.id,
        { source: 'invite', inviteId: invite.id },
        invite.campaignId || undefined,
      );
    } catch (gamificationError) {
      console.error('[Gamification] Error recording community_joined event:', gamificationError);
    }

    // DISABLED: Auto enrichment removed to control costs - use on-demand only

    // Auto-generate coupon for this creator+brand relationship
    const company = await storage.getCompany(invite.companyId);
    const creator = await storage.getUser(req.user!.id);

    if (company && creator && creator.instagram) {
      const prefix = company.name
        .substring(0, 6)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
      const instagram = creator.instagram.replace('@', '').toUpperCase().substring(0, 10);
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      const couponCode = `${prefix}_${instagram}_${random}`;

      // We'll create a community coupon (without campaign association)
      // This requires extending the schema, for now we log it
      console.log(`Generated community coupon for creator ${creator.id}: ${couponCode}`);
    }

    // Notify company owner about new member
    try {
      if (company) {
        const creatorName = creator?.name || req.user!.name || 'Um creator';
        const notification = await storage.createNotification({
          userId: company.createdByUserId,
          type: 'community_member_joined',
          title: 'Novo membro na comunidade',
          message: `${creatorName} entrou na sua comunidade`,
          actionUrl: `/company/brand/${invite.companyId}/community`,
          isRead: false,
        });
        const { notificationWS } = await import('./websocket');
        if (notificationWS) {
          notificationWS.sendToUser(company.createdByUserId, notification);
        }
      }
    } catch (notifError) {
      console.error('[Notification] Error sending community_member_joined:', notifError);
    }

    res.json({
      success: true,
      membership,
      message: 'Você agora faz parte da comunidade!',
    });
  });

  // List company members
  app.get('/api/community/members', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const { status, tierId, search } = req.query;

    const members = await storage.getCompanyMemberships(activeCompanyId, {
      status: status as string | undefined,
      tierId: tierId ? parseInt(tierId as string) : undefined,
      search: search as string | undefined,
    });

    // Enrich with tier info
    const tiers = await storage.getBrandTiers(activeCompanyId);
    const tierMap = new Map(tiers.map((t) => [t.id, t]));

    const enrichedMembers = members.map((m) => ({
      ...m,
      tier: m.tierId ? tierMap.get(m.tierId) : null,
    }));

    res.json(enrichedMembers);
  });

  // Update member
  app.patch('/api/community/members/:id', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const membershipId = parseInt(req.params.id);
    const membership = await storage.getBrandCreatorMembership(membershipId);

    if (!membership || membership.companyId !== activeCompanyId) {
      return res.status(404).json({ error: 'Membro não encontrado' });
    }

    const { status, tierId, tags, notes } = req.body;

    const updated = await storage.updateBrandCreatorMembership(membershipId, {
      ...(status && { status }),
      ...(tierId !== undefined && { tierId }),
      ...(tags && { tags }),
      ...(notes !== undefined && { notes }),
    });

    res.json(updated);
  });

  // Creator: list my memberships
  app.get('/api/creator/memberships', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const memberships = await storage.getCreatorMemberships(req.user!.id);

    // Enrich with tier info
    const enrichedMemberships = await Promise.all(
      memberships.map(async (m) => {
        const tiers = await storage.getBrandTiers(m.companyId);
        const tier = m.tierId ? tiers.find((t) => t.id === m.tierId) : null;
        return { ...m, tier };
      }),
    );

    res.json(enrichedMemberships);
  });

  // Get community stats for company dashboard
  app.get('/api/community/stats', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const [allMembers, invites] = await Promise.all([
      storage.getCompanyMemberships(activeCompanyId, {}),
      storage.getCompanyCommunityInvites(activeCompanyId),
    ]);

    const activeMembers = allMembers.filter((m) => m.status === 'active');
    const pendingInvites = invites.filter((i) => i.status === 'sent' || i.status === 'opened');

    res.json({
      totalMembers: allMembers.length,
      activeMembers: activeMembers.length,
      pendingInvites: pendingInvites.length,
    });
  });

  // Cancel invite
  app.delete('/api/community/invites/:id', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const inviteId = parseInt(req.params.id);
    const invite = await storage.getCommunityInvite(inviteId);

    if (!invite || invite.companyId !== activeCompanyId) {
      return res.status(404).json({ error: 'Convite não encontrado' });
    }

    if (invite.status === 'accepted') {
      return res.status(400).json({ error: 'Não é possível cancelar um convite já aceito' });
    }

    await storage.updateCommunityInvite(inviteId, { status: 'cancelled' });

    res.json({ success: true });
  });

  // Creator: list active communities with brand info
  app.get('/api/creator/communities', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const memberships = await storage.getCreatorMemberships(req.user!.id);

    // Filter active only and enrich with tier info
    const activeMemberships = memberships.filter((m) => m.status === 'active');

    const enrichedMemberships = await Promise.all(
      activeMemberships.map(async (m) => {
        const tiers = await storage.getBrandTiers(m.companyId);
        const tier = m.tierId ? tiers.find((t) => t.id === m.tierId) : null;
        return {
          ...m,
          tier,
          brandName: m.company.name,
          brandLogo: m.company.logo,
        };
      }),
    );

    res.json(enrichedMemberships);
  });

  // Creator: list all pending invitations (community + campaign)
  app.get('/api/creator/invitations', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const [communityInvites, campaignInvites] = await Promise.all([
      storage.getCreatorPendingCommunityInvites(req.user!.id),
      storage.getCreatorPendingInvites(req.user!.id),
    ]);

    // Normalize to unified format
    const unified = [
      ...communityInvites.map((inv) => ({
        id: inv.id,
        type: 'community' as const,
        brandId: inv.companyId,
        brandName: inv.company.name,
        brandLogo: inv.company.logo,
        campaignId: null,
        campaignTitle: null,
        status: inv.status,
        createdAt: inv.createdAt,
        expiresAt: inv.expiresAt,
        message: inv.metadata?.message || null,
      })),
      ...campaignInvites.map((inv) => ({
        id: inv.id,
        type: 'campaign' as const,
        brandId: inv.companyId,
        brandName: (inv.company as any).name,
        brandLogo: (inv.company as any).avatar,
        campaignId: inv.campaignId,
        campaignTitle: inv.campaign.title,
        status: inv.status,
        createdAt: inv.createdAt,
        expiresAt: null,
        message: null,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(unified);
  });

  // Creator: accept invitation
  app.post('/api/creator/invitations/:id/accept', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const { type } = req.body; // "community" or "campaign"
    const id = parseInt(req.params.id);

    if (!type) {
      return res.status(400).json({ error: 'Tipo de convite não especificado' });
    }

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';

    if (type === 'community') {
      const invite = await storage.getCommunityInvite(id);

      if (!invite || invite.creatorId !== req.user!.id) {
        return res.status(404).json({ error: 'Convite não encontrado' });
      }

      if (invite.status === 'accepted') {
        return res.status(400).json({ error: 'Convite já aceito' });
      }

      if (invite.status === 'expired' || invite.status === 'cancelled') {
        return res.status(400).json({ error: 'Convite não está mais válido' });
      }

      // Check if already a member
      const existingMembership = await storage.getBrandCreatorMembershipByCreatorAndCompany(
        req.user!.id,
        invite.companyId,
      );

      if (existingMembership) {
        // Update invite status anyway
        await storage.updateCommunityInvite(id, { status: 'accepted', acceptedAt: new Date() });
        return res.json({ success: true, membership: existingMembership });
      }

      // Get default Bronze tier for company
      const tiers = await storage.getBrandTiers(invite.companyId);
      const bronzeTier = tiers.find((t: any) => t.sortOrder === 0 || t.minPoints === 0);

      // Create membership
      const membership = await storage.createBrandCreatorMembership({
        creatorId: req.user!.id,
        companyId: invite.companyId,
        status: 'active',
        source: 'invite',
        tierId: bronzeTier?.id || null,
        inviteId: invite.id,
        termsAcceptedAt: new Date(),
        termsAcceptedIp: clientIp,
        joinedAt: new Date(),
      });

      // Update invite
      await storage.updateCommunityInvite(id, { status: 'accepted', acceptedAt: new Date() });

      // Record gamification event for community join
      try {
        await storage.recordGamificationEvent(
          invite.companyId,
          req.user!.id,
          'community_joined',
          `community_${invite.companyId}_${req.user!.id}`,
          'membership',
          membership.id,
          { source: 'invite', inviteId: invite.id },
          invite.campaignId || undefined,
        );
      } catch (gamificationError) {
        console.error('[Gamification] Error recording community_joined event:', gamificationError);
      }

      // Notify company owner about new member
      try {
        const company = await storage.getCompany(invite.companyId);
        const creator = await storage.getUser(req.user!.id);
        if (company) {
          const notification = await storage.createNotification({
            userId: company.createdByUserId,
            type: 'community_member_joined',
            title: 'Novo membro na comunidade',
            message: `${creator?.name || req.user!.name || 'Um creator'} entrou na sua comunidade`,
            actionUrl: `/company/brand/${invite.companyId}/community`,
            isRead: false,
          });
          const { notificationWS } = await import('./websocket');
          if (notificationWS) {
            notificationWS.sendToUser(company.createdByUserId, notification);
          }
        }
      } catch (notifError) {
        console.error('[Notification] Error sending community_member_joined:', notifError);
      }

      res.json({ success: true, membership });
    } else if (type === 'campaign') {
      const invite = await storage.getCampaignInvite(id);

      if (!invite || invite.creatorId !== req.user!.id) {
        return res.status(404).json({ error: 'Convite não encontrado' });
      }

      if (invite.status !== 'pending') {
        return res.status(400).json({ error: 'Convite não está pendente' });
      }

      // Update invite status to accepted
      await storage.updateCampaignInvite(id, { status: 'accepted', respondedAt: new Date() });

      // Check if should auto-join community via brandProgram settings
      const company = await storage.getCompany(invite.companyId);
      const brandProgram = await storage.getBrandProgram(invite.companyId);
      const autoJoinCommunity = brandProgram?.autoJoinCommunity !== false; // Default true

      if (company && autoJoinCommunity) {
        const existingMembership = await storage.getBrandCreatorMembershipByCreatorAndCompany(
          req.user!.id,
          invite.companyId,
        );

        if (!existingMembership) {
          const tiers = await storage.getBrandTiers(invite.companyId);
          const bronzeTier = tiers.find((t: any) => t.sortOrder === 0 || t.minPoints === 0);

          const membership = await storage.createBrandCreatorMembership({
            creatorId: req.user!.id,
            companyId: invite.companyId,
            status: 'active',
            source: 'campaign',
            tierId: bronzeTier?.id || null,
            campaignId: invite.campaignId,
            termsAcceptedAt: new Date(),
            termsAcceptedIp: clientIp,
            joinedAt: new Date(),
          });
        }
      }

      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Tipo de convite inválido' });
    }
  });

  // Creator: decline invitation
  app.post('/api/creator/invitations/:id/decline', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const { type } = req.body;
    const id = parseInt(req.params.id);

    if (!type) {
      return res.status(400).json({ error: 'Tipo de convite não especificado' });
    }

    if (type === 'community') {
      const invite = await storage.getCommunityInvite(id);

      if (!invite || invite.creatorId !== req.user!.id) {
        return res.status(404).json({ error: 'Convite não encontrado' });
      }

      await storage.updateCommunityInvite(id, { status: 'cancelled' });
      res.json({ success: true });
    } else if (type === 'campaign') {
      const invite = await storage.getCampaignInvite(id);

      if (!invite || invite.creatorId !== req.user!.id) {
        return res.status(404).json({ error: 'Convite não encontrado' });
      }

      await storage.updateCampaignInvite(id, { status: 'declined', respondedAt: new Date() });
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Tipo de convite inválido' });
    }
  });

  // Creator: get all brands the creator is associated with (member or has pending invites/campaigns)
  app.get('/api/creator/brands', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const creatorId = req.user!.id;

    try {
      // Get all memberships
      const memberships = await storage.getCreatorMemberships(creatorId);

      // Get all applications to find additional brands
      const applications = await storage.getCreatorApplications(creatorId);

      // Get pending invites
      const invites = await storage.getCreatorAllInvites(creatorId);
      const pendingCampaignInvites = invites.filter((inv) => inv.status === 'pending');

      // Build a map of brandId -> data
      const brandMap = new Map<number, any>();

      // Add brands from memberships
      for (const mem of memberships) {
        const company = mem.company;
        if (!company) continue;

        // Get tier info if available
        let tierName = null;
        if (mem.tierId) {
          const tier = await storage.getBrandTierConfig(mem.tierId);
          tierName = tier?.tierName || null;
        }

        brandMap.set(company.id, {
          brandId: company.id,
          brandName: company.name,
          brandLogo: company.logo,
          membershipStatus:
            mem.status === 'active' ? 'member' : mem.status === 'invited' ? 'pending' : 'none',
          membershipId: mem.id,
          points: mem.pointsCache || 0,
          tier: tierName,
          couponCode: mem.couponCode || null,
          joinedAt: mem.joinedAt,
          openCampaigns: 0,
          activeCampaigns: 0,
          completedCampaigns: 0,
          pendingInvites: 0,
          unreadMessages: 0,
        });
      }

      // Count campaigns per brand from applications
      for (const app of applications) {
        const campaign = (app as any).campaign;
        if (!campaign) continue;

        const companyId = campaign.companyId;

        // If brand not in map, fetch company info
        if (!brandMap.has(companyId)) {
          const company = await storage.getCompany(companyId);
          if (company) {
            brandMap.set(companyId, {
              brandId: company.id,
              brandName: company.name,
              brandLogo: company.logo,
              membershipStatus: 'none',
              membershipId: null,
              points: 0,
              tier: null,
              couponCode: null,
              joinedAt: null,
              openCampaigns: 0,
              activeCampaigns: 0,
              completedCampaigns: 0,
              pendingInvites: 0,
              unreadMessages: 0,
            });
          }
        }

        if (brandMap.has(companyId)) {
          const data = brandMap.get(companyId);
          if (app.status === 'pending') {
            data.openCampaigns++;
          } else if (
            app.status === 'accepted' &&
            !['completed', 'cancelled'].includes(app.workflowStatus || '')
          ) {
            data.activeCampaigns++;
          } else if (app.workflowStatus === 'completed' || app.workflowStatus === 'entregue') {
            data.completedCampaigns++;
          }
        }
      }

      // Count pending invites
      for (const inv of pendingCampaignInvites) {
        const campaign = (inv as any).campaign;
        if (!campaign) continue;

        const companyId = campaign.companyId;
        if (brandMap.has(companyId)) {
          brandMap.get(companyId).pendingInvites++;
        }
      }

      const brands = Array.from(brandMap.values())
        .filter(
          (b) => b.membershipStatus !== 'none' || b.activeCampaigns > 0 || b.pendingInvites > 0,
        )
        .sort((a, b) => b.activeCampaigns - a.activeCampaigns);

      res.json(brands);
    } catch (error) {
      console.error('[API] Error fetching creator brands:', error);
      res.status(500).json({ error: 'Erro ao buscar marcas' });
    }
  });

  // Creator: get brand overview with campaigns, membership, performance
  app.get('/api/creator/brand/:brandId/overview', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const creatorId = req.user!.id;
    const brandId = parseInt(req.params.brandId);

    if (isNaN(brandId)) return res.status(400).json({ error: 'ID de marca inválido' });

    try {
      // Get company info
      const company = await storage.getCompany(brandId);
      if (!company) return res.status(404).json({ error: 'Marca não encontrada' });

      // Get membership
      const memberships = await storage.getCreatorMemberships(creatorId);
      const membership = memberships.find((m) => m.companyId === brandId);

      // Get tier info with benefits and next tier
      let tierInfo = null;
      let nextTierInfo = null;
      const allTiers = await storage.getBrandTiers(brandId);

      if (membership?.tierId) {
        const tier = await storage.getBrandTierConfig(membership.tierId);
        if (tier) {
          tierInfo = {
            id: tier.id,
            name: tier.tierName,
            color: tier.color,
            icon: tier.icon,
            minPoints: tier.minPoints,
            benefits: tier.benefitsJson,
          };

          // Find next tier
          const sortedTiers = allTiers.sort((a, b) => a.minPoints - b.minPoints);
          const currentIdx = sortedTiers.findIndex((t) => t.id === tier.id);
          if (currentIdx >= 0 && currentIdx < sortedTiers.length - 1) {
            const next = sortedTiers[currentIdx + 1];
            nextTierInfo = {
              id: next.id,
              name: next.tierName,
              color: next.color,
              icon: next.icon,
              minPoints: next.minPoints,
              pointsNeeded: next.minPoints - (membership.pointsCache || 0),
            };
          }
        }
      } else if (allTiers.length > 0) {
        // No tier yet, show first tier as next
        const firstTier = allTiers.sort((a, b) => a.minPoints - b.minPoints)[0];
        nextTierInfo = {
          id: firstTier.id,
          name: firstTier.tierName,
          color: firstTier.color,
          icon: firstTier.icon,
          minPoints: firstTier.minPoints,
          pointsNeeded: firstTier.minPoints - (membership?.pointsCache || 0),
        };
      }

      // Get recent points ledger entries for this brand
      const recentPointsEvents = membership
        ? (await storage.getPointsLedgerForCreator(creatorId))
            .filter((e) => e.companyId === brandId)
            .slice(0, 10)
        : [];

      // Get unread messages count
      let unreadMessagesCount = 0;
      try {
        const conversations = await storage.getCreatorConversations(creatorId);
        const brandConvo = conversations.find((c: any) => c.companyId === brandId);
        if (brandConvo) {
          unreadMessagesCount = brandConvo.unreadCount || 0;
        }
      } catch {
        // Ignore conversation fetch errors
      }

      // Get all applications for this brand's campaigns
      const allApplications = await storage.getCreatorApplications(creatorId);
      const brandCampaigns = await storage.getCompanyCampaigns(brandId);
      const brandCampaignIds = new Set(brandCampaigns.map((c) => c.id));

      const brandApplications = allApplications.filter((app) =>
        brandCampaignIds.has(app.campaignId),
      );

      // Get campaign IDs the creator already applied to
      const appliedCampaignIds = new Set(brandApplications.map((app) => app.campaignId));

      // Categorize campaigns
      const openCampaigns: any[] = [];
      const activeCampaigns: any[] = [];
      const completedCampaigns: any[] = [];
      const availableCampaigns: any[] = [];

      // Add available campaigns (open, not applied, member can see community_only)
      const isMember = membership?.status === 'active';
      const creatorPoints = membership?.pointsCache || 0;
      const creatorTierId = membership?.tierId;

      // Get all tiers sorted for comparison
      const sortedTiers = allTiers.sort((a, b) => a.minPoints - b.minPoints);
      const creatorTierIndex = creatorTierId
        ? sortedTiers.findIndex((t) => t.id === creatorTierId)
        : -1;

      for (const campaign of brandCampaigns) {
        if (campaign.status !== 'open') continue;
        if (appliedCampaignIds.has(campaign.id)) continue;

        // Non-members can only see public campaigns
        if (!isMember && campaign.visibility !== 'public') continue;

        // Check eligibility
        let eligible = true;
        let eligibilityReason: string | null = null;

        // Check minimum tier requirement
        if (campaign.minTierId && creatorTierIndex >= 0) {
          const requiredTierIndex = sortedTiers.findIndex((t) => t.id === campaign.minTierId);
          if (requiredTierIndex > creatorTierIndex) {
            eligible = false;
            const requiredTier = sortedTiers[requiredTierIndex];
            eligibilityReason = `Tier mínimo: ${requiredTier?.tierName || 'Desconhecido'}`;
          }
        } else if (campaign.minTierId && creatorTierIndex < 0) {
          eligible = false;
          const requiredTier = sortedTiers.find((t) => t.id === campaign.minTierId);
          eligibilityReason = `Tier mínimo: ${requiredTier?.tierName || 'Desconhecido'}`;
        }

        // Check minimum points requirement
        if (eligible && campaign.minPoints && campaign.minPoints > 0) {
          if (creatorPoints < campaign.minPoints) {
            eligible = false;
            eligibilityReason = `Faltam ${campaign.minPoints - creatorPoints} pontos`;
          }
        }

        availableCampaigns.push({
          campaignId: campaign.id,
          campaignTitle: campaign.title,
          budget: campaign.budget,
          deadline: campaign.deadline,
          visibility: campaign.visibility,
          isInternal: campaign.visibility === 'community_only',
          eligible,
          eligibilityReason,
          minTierId: campaign.minTierId,
          minPoints: campaign.minPoints,
        });
      }

      for (const app of brandApplications) {
        const campaign =
          (app as any).campaign || brandCampaigns.find((c) => c.id === app.campaignId);
        if (!campaign) continue;

        const summary = {
          applicationId: app.id,
          campaignId: campaign.id,
          campaignTitle: campaign.title,
          budget: campaign.budget,
          deadline: campaign.deadline,
          workflowStatus: app.workflowStatus,
          status: app.status,
        };

        if (app.status === 'pending') {
          openCampaigns.push(summary);
        } else if (
          app.status === 'accepted' &&
          !['completed', 'cancelled', 'entregue'].includes(app.workflowStatus || '')
        ) {
          activeCampaigns.push(summary);
        } else if (app.workflowStatus === 'completed' || app.workflowStatus === 'entregue') {
          completedCampaigns.push(summary);
        }
      }

      // Get pending invites for this brand
      const invites = await storage.getCreatorAllInvites(creatorId);
      const pendingInvites = invites
        .filter((inv) => {
          const campaign = inv.campaign;
          return inv.status === 'pending' && campaign?.companyId === brandId;
        })
        .map((inv) => ({
          id: inv.id,
          type: 'campaign' as const,
          campaignId: inv.campaignId,
          campaignTitle: inv.campaign?.title,
          createdAt: inv.createdAt,
        }));

      // Build next actions
      const nextActions: any[] = [];

      for (const camp of activeCampaigns.slice(0, 3)) {
        let action = 'Ver detalhes';
        if (camp.workflowStatus === 'aceito') action = 'Ver briefing';
        else if (camp.workflowStatus === 'contrato') action = 'Assinar contrato';
        else if (camp.workflowStatus === 'aguardando_produto') action = 'Confirmar recebimento';
        else if (camp.workflowStatus === 'producao') action = 'Enviar criativo';
        else if (camp.workflowStatus === 'revisao') action = 'Aguardando revisão';

        if (action !== 'Ver detalhes') {
          nextActions.push({
            type: 'campaign',
            label: `${camp.campaignTitle}: ${action}`,
            href: `/brand/${brandId}/campaign/${camp.campaignId}`,
            priority: 2,
          });
        }
      }

      if (pendingInvites.length > 0) {
        nextActions.unshift({
          type: 'invite',
          label: `${pendingInvites.length} convite(s) pendente(s)`,
          href: `/brand/${brandId}?tab=invites`,
          priority: 1,
        });
      }

      // Performance summary (simplified for now)
      const performance = {
        totalSales: 0,
        totalCommission: 0,
        totalViews: 0,
        totalPosts: completedCampaigns.length,
      };

      res.json({
        brand: {
          id: company.id,
          name: company.name,
          logo: company.logo,
          description: company.description,
          website: company.website,
          instagram: company.instagram,
        },
        membership: membership
          ? {
              id: membership.id,
              status: membership.status,
              tier: tierInfo,
              nextTier: nextTierInfo,
              points: membership.pointsCache || 0,
              couponCode: membership.couponCode,
              joinedAt: membership.joinedAt,
              tags: membership.tags || [],
            }
          : null,
        campaigns: {
          available: availableCampaigns,
          open: openCampaigns,
          active: activeCampaigns,
          completed: completedCampaigns,
        },
        pendingInvites,
        nextActions: nextActions.sort((a, b) => a.priority - b.priority),
        performance,
        recentPointsEvents: recentPointsEvents.map((e) => ({
          id: e.id,
          deltaPoints: e.deltaPoints,
          eventType: e.eventType,
          notes: e.notes,
          createdAt: e.createdAt,
        })),
        unreadMessagesCount,
      });
    } catch (error) {
      console.error('[API] Error fetching brand overview:', error);
      res.status(500).json({ error: 'Erro ao buscar dados da marca' });
    }
  });

  // Creator: get active campaigns with full details
  app.get('/api/creator/campaigns/active', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    try {
      const applications = await storage.getCreatorAcceptedApplications(req.user!.id);

      // Filter for active workflow statuses
      const activeApps = applications.filter(
        (app) =>
          app.status === 'accepted' &&
          !['completed', 'cancelled'].includes(app.workflowStatus || ''),
      );

      // Enrich with company info
      const enrichedApps = await Promise.all(
        activeApps.map(async (app) => {
          const campaign = (app as any).campaign;
          const company = campaign ? await storage.getCompany(campaign.companyId) : null;

          // Determine next action
          let nextAction = 'Ver detalhes';
          if (app.workflowStatus === 'aceito') nextAction = 'Ver briefing';
          else if (app.workflowStatus === 'contrato') nextAction = 'Assinar contrato';
          else if (app.workflowStatus === 'aguardando_produto') nextAction = 'Aguardando produto';
          else if (app.workflowStatus === 'producao') nextAction = 'Enviar conteúdo';
          else if (app.workflowStatus === 'revisao') nextAction = 'Aguardando revisão';
          else if (app.workflowStatus === 'entregue') nextAction = 'Concluído';

          return {
            applicationId: app.id,
            campaignId: app.campaignId,
            campaignTitle: campaign?.title || 'Campanha',
            campaignBudget: campaign?.budget || null,
            campaignDeadline: campaign?.deadline || null,
            brandId: company?.id || null,
            brandName: company?.name || '',
            brandLogo: company?.logo || null,
            workflowStatus: app.workflowStatus,
            creatorWorkflowStatus: app.creatorWorkflowStatus,
            seedingStatus: app.seedingStatus,
            nextAction,
            deliverables: (app as any).deliverables || [],
          };
        }),
      );

      res.json(enrichedApps);
    } catch (error) {
      console.error('[API] Error fetching active campaigns:', error);
      res.status(500).json({ error: 'Erro ao buscar campanhas ativas' });
    }
  });

  // Creator: overview aggregating all key data for home page
  app.get('/api/creator/overview', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const creatorId = req.user!.id;

    // Fetch all data in parallel
    const [
      communityInvites,
      campaignInvites,
      applications,
      memberships,
      balance,
      unreadMessagesCount,
    ] = await Promise.all([
      storage.getCreatorPendingCommunityInvites(creatorId),
      storage.getCreatorPendingInvites(creatorId),
      storage.getCreatorApplications(creatorId),
      storage.getCreatorMemberships(creatorId),
      storage.getOrCreateCreatorBalance(creatorId),
      storage.getUnreadCount(creatorId),
    ]);

    // Normalize invitations (last 5 + count)
    const allInvitations = [
      ...communityInvites.map((inv: any) => ({
        id: inv.id,
        type: 'community' as const,
        brandName: inv.company.name,
        brandLogo: inv.company.logo,
        campaignTitle: null,
        createdAt: inv.createdAt,
      })),
      ...campaignInvites.map((inv: any) => ({
        id: inv.id,
        type: 'campaign' as const,
        brandName: (inv.company as any).name,
        brandLogo: (inv.company as any).avatar,
        campaignTitle: inv.campaign.title,
        createdAt: inv.createdAt,
      })),
    ].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Active campaigns = accepted applications with active workflow
    const activeCampaigns = applications
      .filter((app: any) => app.status === 'accepted' && app.workflowStatus !== 'completed')
      .map((app: any) => {
        // Determine next action based on status
        let nextAction = '';
        if (app.workflowStatus === 'pending_brief') nextAction = 'Aguardando briefing';
        else if (app.workflowStatus === 'brief_sent') nextAction = 'Ver briefing';
        else if (app.creatorWorkflowStatus === 'aguardando_conteudo')
          nextAction = 'Enviar conteúdo';
        else if (app.creatorWorkflowStatus === 'revisao') nextAction = 'Aguardando revisão';
        else if (app.seedingStatus === 'pending') nextAction = 'Aguardando produto';
        else if (app.seedingStatus === 'sent') nextAction = 'Confirmar recebimento';
        else nextAction = 'Ver detalhes';

        return {
          applicationId: app.id,
          campaignId: app.campaignId,
          campaignTitle: (app as any).campaign?.title || 'Campanha',
          brandName: (app as any).campaign?.company?.name || '',
          workflowStatus: app.workflowStatus,
          creatorWorkflowStatus: app.creatorWorkflowStatus,
          seedingStatus: app.seedingStatus,
          nextAction,
        };
      })
      .slice(0, 5);

    // Active communities with tier info
    const activeCommunities = await Promise.all(
      memberships
        .filter((m: any) => m.status === 'active')
        .slice(0, 5)
        .map(async (m: any) => {
          const tiers = await storage.getBrandTiers(m.companyId);
          const tier = m.tierId ? tiers.find((t: any) => t.id === m.tierId) : null;
          return {
            brandId: m.companyId,
            brandName: m.company.name,
            brandLogo: m.company.logo,
            tierName: tier?.tierName || 'Bronze',
            tierColor: tier?.color || '#cd7f32',
            points: m.pointsCache || 0,
            couponCode: m.couponCode,
          };
        }),
    );

    // Next actions (derived from invites and campaigns)
    const nextActions: { type: string; label: string; href: string; priority: number }[] = [];

    // Pending invites are high priority
    if (allInvitations.length > 0) {
      nextActions.push({
        type: 'invite',
        label: `${allInvitations.length} convite${allInvitations.length > 1 ? 's' : ''} pendente${allInvitations.length > 1 ? 's' : ''}`,
        href: '/creator/invites',
        priority: 1,
      });
    }

    // Active campaigns needing action
    for (const camp of activeCampaigns.slice(0, 3)) {
      if (camp.nextAction !== 'Ver detalhes') {
        nextActions.push({
          type: 'campaign',
          label: `${camp.campaignTitle}: ${camp.nextAction}`,
          href: `/campaign/${camp.campaignId}/workspace`,
          priority: 2,
        });
      }
    }

    res.json({
      invitations: {
        items: allInvitations.slice(0, 5),
        pendingCount: allInvitations.length,
      },
      activeCampaigns,
      activeCommunities,
      walletSummary: {
        available: balance.availableBalance || 0,
        pending: balance.pendingBalance || 0,
      },
      unreadMessagesCount,
      nextActions: nextActions.sort((a, b) => a.priority - b.priority).slice(0, 5),
    });
  });

  // ==========================================
  // COMMUNITY HUB - DISCOVERY PROFILES
  // ==========================================

  // List discovery profiles for company
  app.get('/api/community/discovery', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const { query, connected, niche, minFollowers } = req.query;

    const profiles = await storage.getCompanyDiscoveryProfiles(activeCompanyId, {
      query: query as string | undefined,
      connected: connected as 'all' | 'only' | 'none' | undefined,
      niche: niche as string | undefined,
      minFollowers: minFollowers ? parseInt(minFollowers as string) : undefined,
    });

    res.json(profiles);
  });

  // Import discovery profile (from Instagram handle)
  app.post('/api/community/discovery/import', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const { instagramHandle, displayName, followers, profilePictureUrl, bio, nicheTags } = req.body;

    if (!instagramHandle) {
      return res.status(400).json({ error: 'Instagram handle é obrigatório' });
    }

    const normalizedHandle = instagramHandle.replace('@', '').toLowerCase();

    const profile = await storage.createOrUpdateDiscoveryProfile({
      companyId: activeCompanyId,
      instagramHandle: normalizedHandle,
      displayName: displayName || normalizedHandle,
      followers: followers || null,
      bio: bio || null,
      nicheTags: nicheTags || null,
    });

    res.json(profile);
  });

  // Delete discovery profile
  app.delete('/api/community/discovery/:id', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);

    await storage.deleteDiscoveryProfile(parseInt(req.params.id));
    res.json({ success: true });
  });

  // ==========================================
  // COMMUNITY HUB - CONVERSATIONS & MESSAGES
  // ==========================================

  // Company: list conversations
  app.get('/api/community/conversations', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const conversations = await storage.getCompanyConversations(activeCompanyId, activeCompanyId);
    res.json(conversations);
  });

  // Creator: list conversations
  app.get('/api/creator/conversations', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const conversations = await storage.getCreatorConversations(req.user!.id);
    res.json(conversations);
  });

  // Start or get conversation (for company initiating with creator)
  app.post('/api/community/conversations', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);
    const activeCompanyId = req.session.activeCompanyId;
    if (!activeCompanyId) return res.status(400).json({ error: 'Nenhuma loja ativa selecionada' });

    const { creatorId } = req.body;
    if (!creatorId) return res.status(400).json({ error: 'creatorId é obrigatório' });

    const conversation = await storage.createOrGetConversation(activeCompanyId, creatorId);
    res.json(conversation);
  });

  // ===================== ACADEMY ENDPOINTS =====================

  // Get all courses with creator's progress
  app.get('/api/creator/courses', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const coursesWithProgress = await storage.getCreatorCoursesWithProgress(req.user!.id);
    res.json(coursesWithProgress);
  });

  // Get course details with structure
  app.get('/api/creator/courses/:courseId', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const courseId = parseInt(req.params.courseId);
    const courseData = await storage.getCourseWithStructure(courseId);

    if (!courseData) return res.status(404).json({ error: 'Curso não encontrado' });

    // Get creator's lesson progress for this course
    const completedLessonIds = await storage.getCreatorLessonProgress(req.user!.id, courseId);

    // Get course progress
    const [courseProgress] = await storage.getCreatorCoursesWithProgress(req.user!.id);
    const progress = courseProgress?.course.id === courseId ? courseProgress.progress : null;

    res.json({
      ...courseData,
      completedLessonIds,
      progress,
    });
  });

  // Start a course
  app.post('/api/creator/courses/:courseId/start', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const courseId = parseInt(req.params.courseId);
    const course = await storage.getCourse(courseId);

    if (!course) return res.status(404).json({ error: 'Curso não encontrado' });

    const progress = await storage.startCourseForCreator(req.user!.id, courseId);
    res.json(progress);
  });

  // Complete a lesson
  app.post('/api/creator/lessons/:lessonId/complete', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const lessonId = parseInt(req.params.lessonId);
    const lesson = await storage.getLesson(lessonId);

    if (!lesson) return res.status(404).json({ error: 'Lição não encontrada' });

    try {
      const result = await storage.completeLessonForCreator(req.user!.id, lessonId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get academy summary for home page
  app.get('/api/creator/academy/summary', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const summary = await storage.getCreatorAcademySummary(req.user!.id);
    res.json(summary);
  });

  // ========== INSPIRATIONS (Swipe File) ==========

  // List all inspirations with filters
  app.get('/api/creator/inspirations', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const { query, platform, format, tag, niche } = req.query;
    const inspirationsList = await storage.listInspirations({
      query: query as string | undefined,
      platform: platform as string | undefined,
      format: format as string | undefined,
      tag: tag as string | undefined,
      niche: niche as string | undefined,
    });

    // Get saved status for each inspiration
    const withSavedStatus = await Promise.all(
      inspirationsList.map(async (insp) => ({
        ...insp,
        isSaved: await storage.isInspirationSaved(req.user!.id, insp.id),
      })),
    );

    res.json(withSavedStatus);
  });

  // Get single inspiration
  app.get('/api/creator/inspirations/:id', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const id = parseInt(req.params.id);
    const inspiration = await storage.getInspiration(id);
    if (!inspiration) return res.status(404).json({ error: 'Inspiração não encontrada' });

    const isSaved = await storage.isInspirationSaved(req.user!.id, id);
    res.json({ ...inspiration, isSaved });
  });

  // Save/unsave inspiration
  app.post('/api/creator/inspirations/:id/save', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const id = parseInt(req.params.id);
    const inspiration = await storage.getInspiration(id);
    if (!inspiration) return res.status(404).json({ error: 'Inspiração não encontrada' });

    const saved = await storage.saveInspiration(req.user!.id, id);
    res.json(saved);
  });

  app.delete('/api/creator/inspirations/:id/save', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const id = parseInt(req.params.id);
    await storage.unsaveInspiration(req.user!.id, id);
    res.json({ success: true });
  });

  // Get saved inspirations
  app.get('/api/creator/saved-inspirations', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const saved = await storage.getCreatorSavedInspirations(req.user!.id);
    res.json(saved);
  });

  // Collections CRUD
  app.get('/api/creator/collections', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const collections = await storage.getCreatorCollections(req.user!.id);
    res.json(collections);
  });

  app.post('/api/creator/collections', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Título é obrigatório' });

    const collection = await storage.createInspirationCollection(req.user!.id, title);
    res.json(collection);
  });

  app.get('/api/creator/collections/:id', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const id = parseInt(req.params.id);
    const result = await storage.getCollectionWithItems(id, req.user!.id);
    if (!result) return res.status(404).json({ error: 'Coleção não encontrada' });

    res.json(result);
  });

  app.patch('/api/creator/collections/:id', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const id = parseInt(req.params.id);
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Título é obrigatório' });

    const updated = await storage.updateCollection(id, req.user!.id, title);
    if (!updated) return res.status(404).json({ error: 'Coleção não encontrada' });

    res.json(updated);
  });

  app.delete('/api/creator/collections/:id', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const id = parseInt(req.params.id);
    await storage.deleteCollection(id, req.user!.id);
    res.json({ success: true });
  });

  // Collection items
  app.post('/api/creator/collections/:collectionId/items', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const collectionId = parseInt(req.params.collectionId);
    const { inspirationId } = req.body;
    if (!inspirationId) return res.status(400).json({ error: 'inspirationId é obrigatório' });

    const item = await storage.addToCollection(collectionId, inspirationId, req.user!.id);
    if (!item)
      return res.status(404).json({ error: 'Coleção não encontrada ou não pertence a você' });

    res.json(item);
  });

  app.delete('/api/creator/collections/:collectionId/items/:inspirationId', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const collectionId = parseInt(req.params.collectionId);
    const inspirationId = parseInt(req.params.inspirationId);

    await storage.removeFromCollection(collectionId, inspirationId, req.user!.id);
    res.json({ success: true });
  });

  // Campaign inspirations (for companies)
  app.get('/api/company/campaigns/:campaignId/inspirations', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);

    const campaignId = parseInt(req.params.campaignId);
    const campaign = await storage.getCampaign(campaignId);
    if (!campaign || campaign.companyId !== (req.session as any).activeCompanyId) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    const items = await storage.getCampaignInspirations(campaignId);
    res.json(items);
  });

  app.post('/api/company/campaigns/:campaignId/inspirations', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);

    const campaignId = parseInt(req.params.campaignId);
    const campaign = await storage.getCampaign(campaignId);
    if (!campaign || campaign.companyId !== (req.session as any).activeCompanyId) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    const { inspirationId } = req.body;
    if (!inspirationId) return res.status(400).json({ error: 'inspirationId é obrigatório' });

    const item = await storage.addInspirationToCampaign(campaignId, inspirationId);
    res.json(item);
  });

  app.delete('/api/company/campaigns/:campaignId/inspirations/:inspirationId', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);

    const campaignId = parseInt(req.params.campaignId);
    const campaign = await storage.getCampaign(campaignId);
    if (!campaign || campaign.companyId !== (req.session as any).activeCompanyId) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    const inspirationId = parseInt(req.params.inspirationId);
    await storage.removeInspirationFromCampaign(campaignId, inspirationId);
    res.json({ success: true });
  });

  // List all inspirations for company (to add to campaigns)
  app.get('/api/company/inspirations', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);

    const { query, platform, format, tag, niche } = req.query;
    const inspirationsList = await storage.listInspirations({
      query: query as string | undefined,
      platform: platform as string | undefined,
      format: format as string | undefined,
      tag: tag as string | undefined,
      niche: niche as string | undefined,
    });

    res.json(inspirationsList);
  });

  // ========== BRAND INSPIRATIONS (Company-owned) ==========

  app.get('/api/company/brand/:brandId/inspirations', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);

    const brandId = parseInt(req.params.brandId);
    if (brandId !== (req.session as any).activeCompanyId) return res.sendStatus(403);

    const inspirations = await storage.getBrandInspirations(brandId);
    res.json(inspirations);
  });

  app.post('/api/company/brand/:brandId/inspirations', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);

    const brandId = parseInt(req.params.brandId);
    if (brandId !== (req.session as any).activeCompanyId) return res.sendStatus(403);

    const { title, description, platform, format, url, thumbnailUrl, tags, nicheTags } = req.body;
    if (!title || !platform || !format || !url) {
      return res.status(400).json({ error: 'title, platform, format e url são obrigatórios' });
    }

    const inspiration = await storage.createInspiration({
      scope: 'brand',
      brandId,
      title,
      description: description || null,
      platform,
      format,
      url,
      thumbnailUrl: thumbnailUrl || null,
      tags: tags || [],
      nicheTags: nicheTags || [],
      isPublished: true,
      createdByUserId: req.user!.id,
    });
    res.json(inspiration);
  });

  app.put('/api/company/brand/:brandId/inspirations/:id', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);

    const brandId = parseInt(req.params.brandId);
    if (brandId !== (req.session as any).activeCompanyId) return res.sendStatus(403);

    const id = parseInt(req.params.id);
    const inspiration = await storage.getInspiration(id);
    if (!inspiration || inspiration.brandId !== brandId) {
      return res.status(404).json({ error: 'Inspiração não encontrada' });
    }

    const updated = await storage.updateInspiration(id, req.body);
    res.json(updated);
  });

  app.delete('/api/company/brand/:brandId/inspirations/:id', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'company') return res.sendStatus(403);

    const brandId = parseInt(req.params.brandId);
    if (brandId !== (req.session as any).activeCompanyId) return res.sendStatus(403);

    const id = parseInt(req.params.id);
    const inspiration = await storage.getInspiration(id);
    if (!inspiration || inspiration.brandId !== brandId) {
      return res.status(404).json({ error: 'Inspiração não encontrada' });
    }

    await storage.deleteInspiration(id);
    res.json({ success: true });
  });

  // Creator: get brand inspirations
  app.get('/api/creator/brands/:brandId/inspirations', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') return res.sendStatus(403);

    const brandId = parseInt(req.params.brandId);
    const inspirations = await storage.getBrandInspirations(brandId);
    res.json(inspirations.filter((i) => i.isPublished));
  });

  // ========== ADMIN: ACADEMY CMS ==========

  app.get('/api/admin/academy/courses', isAdmin, async (req, res) => {
    const courses = await storage.getAllCourses();
    res.json(courses);
  });

  app.post('/api/admin/academy/courses', isAdmin, async (req, res) => {
    const { slug, title, description, level, estimatedMinutes, coverUrl, isPublished } = req.body;
    if (!slug || !title) return res.status(400).json({ error: 'slug e title são obrigatórios' });

    const course = await storage.createCourse({
      slug,
      title,
      description: description || null,
      level: level || 'basic',
      estimatedMinutes: estimatedMinutes || 30,
      coverUrl: coverUrl || null,
      isPublished: isPublished !== false,
    });
    res.json(course);
  });

  app.put('/api/admin/academy/courses/:id', isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const updated = await storage.updateCourse(id, req.body);
    res.json(updated);
  });

  app.delete('/api/admin/academy/courses/:id', isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteCourse(id);
    res.json({ success: true });
  });

  app.post('/api/admin/academy/modules', isAdmin, async (req, res) => {
    const { courseId, title, order } = req.body;
    if (!courseId || !title)
      return res.status(400).json({ error: 'courseId e title são obrigatórios' });

    const mod = await storage.createCourseModule({ courseId, title, order: order || 0 });
    res.json(mod);
  });

  app.put('/api/admin/academy/modules/:id', isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const updated = await storage.updateCourseModule(id, req.body);
    res.json(updated);
  });

  app.delete('/api/admin/academy/modules/:id', isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteCourseModule(id);
    res.json({ success: true });
  });

  app.post('/api/admin/academy/lessons', isAdmin, async (req, res) => {
    const { moduleId, title, order, contentType, content, durationMinutes } = req.body;
    if (!moduleId || !title)
      return res.status(400).json({ error: 'moduleId e title são obrigatórios' });

    const lesson = await storage.createCourseLesson({
      moduleId,
      title,
      order: order || 0,
      contentType: contentType || 'text',
      content: content || null,
      durationMinutes: durationMinutes || 5,
    });
    res.json(lesson);
  });

  app.put('/api/admin/academy/lessons/:id', isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const updated = await storage.updateCourseLesson(id, req.body);
    res.json(updated);
  });

  app.delete('/api/admin/academy/lessons/:id', isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteCourseLesson(id);
    res.json({ success: true });
  });

  // ========== ADMIN: INSPIRATIONS CMS ==========

  app.get('/api/admin/inspirations', isAdmin, async (req, res) => {
    const { scope } = req.query;
    const inspirations = await storage.listInspirations({ scope: (scope as string) || 'global' });
    res.json(inspirations);
  });

  app.post('/api/admin/inspirations', isAdmin, async (req, res) => {
    const {
      title,
      description,
      platform,
      format,
      url,
      thumbnailUrl,
      tags,
      nicheTags,
      isPublished,
    } = req.body;
    if (!title || !platform || !format || !url) {
      return res.status(400).json({ error: 'title, platform, format e url são obrigatórios' });
    }

    const inspiration = await storage.createInspiration({
      scope: 'global',
      brandId: null,
      title,
      description: description || null,
      platform,
      format,
      url,
      thumbnailUrl: thumbnailUrl || null,
      tags: tags || [],
      nicheTags: nicheTags || [],
      isPublished: isPublished !== false,
      createdByUserId: req.user!.id,
    });
    res.json(inspiration);
  });

  app.put('/api/admin/inspirations/:id', isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const updated = await storage.updateInspiration(id, req.body);
    res.json(updated);
  });

  app.delete('/api/admin/inspirations/:id', isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteInspiration(id);
    res.json({ success: true });
  });

  // ============ Taxonomy Routes ============

  // Get all tags, optionally filtered by type
  app.get('/api/tags', async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      const tagsList = await storage.getTags(type);
      res.json(tagsList);
    } catch (error) {
      console.error('[API] Error fetching tags:', error);
      res.status(500).json({ error: 'Failed to fetch tags' });
    }
  });

  // Creator: Get/Set tags
  app.get('/api/creator/tags', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') {
      return res.status(403).json({ error: 'Creator access required' });
    }
    try {
      const tagsList = await storage.getCreatorTags(req.user!.id);
      res.json(tagsList);
    } catch (error) {
      console.error('[API] Error fetching creator tags:', error);
      res.status(500).json({ error: 'Failed to fetch tags' });
    }
  });

  app.post('/api/creator/tags', async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'creator') {
      return res.status(403).json({ error: 'Creator access required' });
    }
    try {
      const { tagIds } = req.body;
      if (!Array.isArray(tagIds)) {
        return res.status(400).json({ error: 'tagIds must be an array' });
      }
      await storage.setCreatorTags(req.user!.id, tagIds);
      const updatedTags = await storage.getCreatorTags(req.user!.id);
      res.json(updatedTags);
    } catch (error) {
      console.error('[API] Error setting creator tags:', error);
      res.status(500).json({ error: 'Failed to set tags' });
    }
  });

  // Brand: Get/Set tags
  app.get('/api/company/brands/:brandId/tags', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const brandId = parseInt(req.params.brandId);

    const hasAccess = await verifyBrandAccess(req.user!, brandId);
    if (!hasAccess) return res.status(403).json({ error: 'No access to this brand' });

    try {
      const tagsList = await storage.getBrandTags(brandId);
      res.json(tagsList);
    } catch (error) {
      console.error('[API] Error fetching brand tags:', error);
      res.status(500).json({ error: 'Failed to fetch tags' });
    }
  });

  app.post('/api/company/brands/:brandId/tags', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const brandId = parseInt(req.params.brandId);

    const hasAccess = await verifyBrandAccess(req.user!, brandId);
    if (!hasAccess) return res.status(403).json({ error: 'No access to this brand' });

    try {
      const { tagIds } = req.body;
      if (!Array.isArray(tagIds)) {
        return res.status(400).json({ error: 'tagIds must be an array' });
      }
      await storage.setBrandTags(brandId, tagIds);
      const updatedTags = await storage.getBrandTags(brandId);
      res.json(updatedTags);
    } catch (error) {
      console.error('[API] Error setting brand tags:', error);
      res.status(500).json({ error: 'Failed to set tags' });
    }
  });

  // Campaign: Get/Set tags
  app.get('/api/company/campaigns/:campaignId/tags', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const campaignId = parseInt(req.params.campaignId);

    try {
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

      const hasAccess = await verifyBrandAccess(req.user!, campaign.companyId);
      if (!hasAccess) return res.status(403).json({ error: 'No access to this campaign' });

      const tagsList = await storage.getCampaignTags(campaignId);
      res.json(tagsList);
    } catch (error) {
      console.error('[API] Error fetching campaign tags:', error);
      res.status(500).json({ error: 'Failed to fetch tags' });
    }
  });

  app.post('/api/company/campaigns/:campaignId/tags', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const campaignId = parseInt(req.params.campaignId);

    try {
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

      const hasAccess = await verifyBrandAccess(req.user!, campaign.companyId);
      if (!hasAccess) return res.status(403).json({ error: 'No access to this campaign' });

      const { tagIds } = req.body;
      if (!Array.isArray(tagIds)) {
        return res.status(400).json({ error: 'tagIds must be an array' });
      }
      await storage.setCampaignTags(campaignId, tagIds);
      const updatedTags = await storage.getCampaignTags(campaignId);
      res.json(updatedTags);
    } catch (error) {
      console.error('[API] Error setting campaign tags:', error);
      res.status(500).json({ error: 'Failed to set tags' });
    }
  });

  // ===== ENRICHMENT ROUTES =====

  // CNPJ Enrichment - Fetch company data from Receita Federal
  app.get('/api/enrichment/cnpj/:cnpj', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const cnpj = req.params.cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14) {
      return res.status(400).json({ error: 'CNPJ inválido' });
    }

    try {
      // Use ReceitaWS API (free, limited to 3 requests per minute)
      const response = await fetch(`https://receitaws.com.br/v1/cnpj/${cnpj}`);

      if (!response.ok) {
        if (response.status === 429) {
          return res
            .status(429)
            .json({ error: 'Limite de requisições atingido. Tente novamente em 1 minuto.' });
        }
        return res.status(response.status).json({ error: 'Erro ao consultar CNPJ' });
      }

      const data = await response.json();

      if (data.status === 'ERROR') {
        return res.status(404).json({ error: data.message || 'CNPJ não encontrado' });
      }

      // Calculate company age
      let tempoMercado = '';
      if (data.abertura) {
        const [dia, mes, ano] = data.abertura.split('/');
        const dataAbertura = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
        const hoje = new Date();
        const diffAnos = Math.floor(
          (hoje.getTime() - dataAbertura.getTime()) / (1000 * 60 * 60 * 24 * 365),
        );
        if (diffAnos > 1) tempoMercado = `${diffAnos} anos no mercado`;
        else if (diffAnos === 1) tempoMercado = '1 ano no mercado';
        else tempoMercado = 'Menos de 1 ano no mercado';
      }

      // Map CNAE to category
      const cnaeCode = data.atividade_principal?.[0]?.code || '';
      let suggestedCategory = '';
      if (cnaeCode.startsWith('47') || cnaeCode.startsWith('46')) suggestedCategory = 'outros';
      else if (cnaeCode.startsWith('56')) suggestedCategory = 'alimentos';
      else if (cnaeCode.startsWith('62') || cnaeCode.startsWith('63'))
        suggestedCategory = 'tecnologia';
      else if (cnaeCode.startsWith('86') || cnaeCode.startsWith('87')) suggestedCategory = 'saude';
      else if (cnaeCode.startsWith('85')) suggestedCategory = 'outros';
      else if (cnaeCode.startsWith('96')) suggestedCategory = 'beleza';
      else if (cnaeCode.startsWith('55') || cnaeCode.startsWith('79')) suggestedCategory = 'outros';
      else if (cnaeCode.startsWith('64') || cnaeCode.startsWith('65') || cnaeCode.startsWith('66'))
        suggestedCategory = 'outros';
      else if (cnaeCode.startsWith('93') || cnaeCode.startsWith('94'))
        suggestedCategory = 'fitness';

      // Determine company size based on natureza juridica
      let porte = '';
      const natureza = data.natureza_juridica || '';
      if (natureza.includes('MEI')) porte = 'MEI';
      else if (natureza.includes('EIRELI') || natureza.includes('Empresário Individual'))
        porte = 'ME';
      else if (natureza.includes('Sociedade Limitada')) porte = 'LTDA';
      else if (natureza.includes('Sociedade Anônima')) porte = 'S/A';

      // Persist CNPJ data to company
      const user = req.user! as any;
      const companyId = user.activeCompanyId || (req as any).session?.activeCompanyId;
      if (companyId) {
        try {
          const { companies } = await import('@shared/schema');
          const { db } = await import('./db');
          const { eq } = await import('drizzle-orm');
          await db
            .update(companies)
            .set({
              cnpjRazaoSocial: data.nome || null,
              cnpjNomeFantasia: data.fantasia || null,
              cnpjSituacao: data.situacao || null,
              cnpjAtividadePrincipal: data.atividade_principal?.[0]?.text || null,
              cnpjDataAbertura: data.abertura || null,
              cnpjCapitalSocial: data.capital_social || null,
              cnpjNaturezaJuridica: data.natureza_juridica || null,
              cnpjQsa: data.qsa?.map((s: any) => ({ nome: s.nome, qual: s.qual })) || null,
              cnpjLastUpdated: new Date(),
              lastEnrichedAt: new Date(),
            })
            .where(eq(companies.id, companyId));
          console.log(`[Enrichment] CNPJ data persisted for company ${companyId}`);
        } catch (dbError) {
          console.error('[Enrichment] Failed to persist CNPJ data:', dbError);
        }
      }

      res.json({
        success: true,
        data: {
          cnpj: data.cnpj,
          razaoSocial: data.nome,
          nomeFantasia: data.fantasia,
          situacao: data.situacao,
          situacaoOk: data.situacao === 'ATIVA',
          dataAbertura: data.abertura,
          tempoMercado,
          naturezaJuridica: data.natureza_juridica,
          porte,
          atividadePrincipal: data.atividade_principal?.[0]?.text,
          cnaeCode,
          suggestedCategory,
          logradouro: data.logradouro,
          numero: data.numero,
          complemento: data.complemento,
          bairro: data.bairro,
          municipio: data.municipio,
          uf: data.uf,
          cep: data.cep?.replace(/\D/g, ''),
          telefone: data.telefone?.replace(/\D/g, ''),
          email: data.email?.toLowerCase(),
        },
      });
    } catch (error) {
      console.error('[Enrichment] CNPJ lookup error:', error);
      res.status(500).json({ error: 'Erro ao consultar CNPJ' });
    }
  });

  // Website Enrichment - Extract data from website using Apify
  app.post('/api/enrichment/website', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL é obrigatória' });
    }

    // URL validation to prevent SSRF
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      return res.status(400).json({ error: 'URL inválida' });
    }

    // Only allow http/https schemes
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ error: 'Apenas URLs HTTP/HTTPS são permitidas' });
    }

    // Block private IP ranges and localhost
    const hostname = parsedUrl.hostname.toLowerCase();
    const blockedPatterns = [
      /^localhost$/i,
      /^127\.\d+\.\d+\.\d+$/,
      /^10\.\d+\.\d+\.\d+$/,
      /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
      /^192\.168\.\d+\.\d+$/,
      /^0\.0\.0\.0$/,
      /^::1$/,
      /\.local$/i,
      /\.internal$/i,
    ];

    if (blockedPatterns.some((pattern) => pattern.test(hostname))) {
      return res.status(400).json({ error: 'URL não permitida' });
    }

    const APIFY_API_KEY = process.env.APIFY_API_KEY;
    if (!APIFY_API_KEY) {
      return res.status(500).json({ error: 'Apify API não configurada' });
    }

    try {
      const actorId = 'apify~website-content-crawler';
      const runResponse = await fetch(
        `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startUrls: [{ url }],
            maxCrawlPages: 10,
            crawlerType: 'cheerio',
          }),
        },
      );

      if (!runResponse.ok) {
        const error = await runResponse.text();
        console.error('[Enrichment] Apify error:', error);
        return res.status(500).json({ error: 'Erro ao analisar website' });
      }

      const results = await runResponse.json();
      const pageData = results[0];

      if (!pageData) {
        return res.status(404).json({ error: 'Não foi possível extrair dados do site' });
      }

      const allText = results.map((p: any) => (p.text || '').slice(0, 2000)).join('\n\n');
      const contentSummary = allText.slice(0, 8000);

      const aboutPage = results.find((p: any) => {
        const pageUrl = (p.url || '').toLowerCase();
        return (
          pageUrl.includes('/sobre') ||
          pageUrl.includes('/about') ||
          pageUrl.includes('/quem-somos') ||
          pageUrl.includes('/a-empresa')
        );
      });

      const crawledPages = results.map((p: any) => ({
        url: p.url || '',
        title: p.title || '',
        summary: (p.text || '').slice(0, 300),
      }));

      const socialLinks: Record<string, string> = {};
      for (const page of results) {
        const fullText = page.html || page.text || '';
        const urlRegex =
          /https?:\/\/(?:www\.)?(instagram|facebook|tiktok|youtube|twitter|linkedin|x)\.com\/[^\s"'<>)]+/gi;
        let match;
        while ((match = urlRegex.exec(fullText)) !== null) {
          const link = match[0];
          if (link.includes('instagram.com') && !socialLinks.instagram)
            socialLinks.instagram = link;
          else if (link.includes('facebook.com') && !socialLinks.facebook)
            socialLinks.facebook = link;
          else if (link.includes('tiktok.com') && !socialLinks.tiktok) socialLinks.tiktok = link;
          else if (link.includes('youtube.com') && !socialLinks.youtube) socialLinks.youtube = link;
          else if ((link.includes('twitter.com') || link.includes('x.com')) && !socialLinks.twitter)
            socialLinks.twitter = link;
          else if (link.includes('linkedin.com') && !socialLinks.linkedin)
            socialLinks.linkedin = link;
        }
      }

      const allKeywords: string[] = [];
      for (const page of results) {
        if (page.metadata?.keywords) {
          const kw =
            typeof page.metadata.keywords === 'string'
              ? page.metadata.keywords.split(',').map((k: string) => k.trim())
              : page.metadata.keywords;
          allKeywords.push(...kw);
        }
      }
      const uniqueKeywords = Array.from(new Set(allKeywords.filter(Boolean))).slice(0, 30);

      const user = req.user! as any;
      let companyId = user.activeCompanyId || (req as any).session?.activeCompanyId;
      // Fallback: lookup via company membership if session doesn't have activeCompanyId
      if (!companyId) {
        try {
          const memberships = await storage.getUserCompanies(req.user!.id);
          if (memberships.length > 0) companyId = memberships[0].companyId;
        } catch {
          /* ignore */
        }
      }
      if (companyId) {
        try {
          const { companies } = await import('@shared/schema');
          const { db } = await import('./db');
          const { eq } = await import('drizzle-orm');
          await db
            .update(companies)
            .set({
              websiteTitle: pageData.title || null,
              websiteDescription: pageData.metadata?.description || null,
              websiteContent: contentSummary,
              websiteAbout: aboutPage?.text?.slice(0, 3000) || null,
              websitePages: crawledPages,
              websiteSocialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : null,
              websiteKeywords: uniqueKeywords.length > 0 ? uniqueKeywords : null,
              websiteLastUpdated: new Date(),
              lastEnrichedAt: new Date(),
            })
            .where(eq(companies.id, companyId));
          console.log(
            `[Enrichment] Website data persisted for company ${companyId}: ${results.length} pages crawled`,
          );
        } catch (dbError) {
          console.error('[Enrichment] Failed to persist website data:', dbError);
        }
      }

      let aiAnalysis = null;
      const websiteText = contentSummary.substring(0, 6000);
      const metaDescription = pageData.metadata?.description || '';
      const metaTitle = pageData.metadata?.title || '';

      try {
        const prompt = `Você é um especialista em análise de empresas brasileiras. Analise o conteúdo deste site e extraia informações estruturadas sobre a empresa.

=== DADOS DO SITE ===
URL: ${url}
Título: ${metaTitle}
Meta descrição: ${metaDescription}

=== CONTEÚDO DA PÁGINA ===
${websiteText}

=== INSTRUÇÕES ===
1. DESCRIÇÃO: Crie uma descrição profissional e atraente da empresa em português brasileiro. Deve explicar O QUE a empresa faz, para QUEM, e qual seu DIFERENCIAL. Use 2-3 frases, máximo 280 caracteres. NÃO use aspas dentro do texto.

2. CATEGORIA: Escolha a categoria que MELHOR representa o negócio principal:
   - saude (clínicas, hospitais, farmácias, produtos de saúde)
   - beleza (cosméticos, estética, cabelo, maquiagem)
   - moda (roupas, acessórios, calçados, joias)
   - tecnologia (software, hardware, apps, TI)
   - alimentos (restaurantes, delivery, produtos alimentícios)
   - bebidas (cervejarias, vinícolas, sucos, cafés)
   - fitness (academias, suplementos, equipamentos esportivos)
   - casa (decoração, móveis, construção, reformas)
   - pets (petshops, veterinários, produtos para animais)
   - infantil (brinquedos, roupas infantis, educação infantil)
   - servicos (consultoria, marketing, advocacia, contabilidade)
   - outros (se nenhuma categoria acima se aplica)

3. TAGLINE: Crie um slogan curto e impactante que represente a marca. Máximo 50 caracteres. Se o site já tiver um slogan, use-o.

4. REDES SOCIAIS: Procure links de redes sociais no conteúdo. Para Instagram, retorne apenas o @usuario (sem URL).

5. E-COMMERCE: Analise se o site é um e-commerce (vende produtos online). Identifique:
   - Se é e-commerce (true/false)
   - Plataforma (Shopify, WooCommerce, Nuvemshop, VTEX, Loja Integrada, Tray, ou "custom")
   - Faixa de preço dos produtos se detectável

6. PRODUTOS/SERVIÇOS: Liste os 3-5 principais produtos ou serviços oferecidos.

7. CORES DA MARCA: Identifique as cores principais da marca (máximo 3 cores em hexadecimal #RRGGBB).

8. LOGO: Procure a URL do logotipo principal da empresa no HTML (normalmente em <img> com alt contendo "logo", ou em <header>). Retorne a URL absoluta completa. Se não encontrar, retorne null.

Responda APENAS com JSON válido (sem markdown, sem explicações):
{
  "description": "descrição aqui",
  "category": "categoria_aqui",
  "tagline": "slogan aqui",
  "socialMedia": {
    "instagram": "@usuario ou null",
    "facebook": "url completa ou null",
    "tiktok": "@usuario ou null"
  },
  "ecommerce": {
    "isEcommerce": true/false,
    "platform": "nome da plataforma ou null",
    "priceRange": "ex: R$ 50 - R$ 200 ou null"
  },
  "products": ["produto1", "produto2", "produto3"],
  "brandColors": ["#RRGGBB", "#RRGGBB"],
  "logoUrl": "https://... ou null"
}`;

        const aiResponse = await sendGeminiMessage(prompt, {
          model: 'gemini-2.5-flash',
          systemInstruction:
            'Você é um analista de dados que extrai informações estruturadas de websites. Sempre responda apenas com JSON válido, sem explicações.',
        });

        // Try to parse AI response as JSON
        try {
          // Remove markdown code blocks if present
          const cleanJson = aiResponse
            .replace(/```json?\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
          aiAnalysis = JSON.parse(cleanJson);
        } catch (parseError) {
          console.error('[Enrichment] Failed to parse AI response:', aiResponse);
        }
      } catch (aiError) {
        console.error('[Enrichment] AI analysis error:', aiError);
        // Continue without AI analysis
      }

      // Persist AI-extracted fields (brandColors, logo, products) to DB
      if (companyId && aiAnalysis) {
        try {
          const { companies } = await import('@shared/schema');
          const { db } = await import('./db');
          const { eq } = await import('drizzle-orm');
          const aiUpdateData: Record<string, any> = {};
          if (aiAnalysis.brandColors?.length > 0) aiUpdateData.brandColors = aiAnalysis.brandColors;
          if (aiAnalysis.logoUrl) aiUpdateData.brandLogo = aiAnalysis.logoUrl;
          if (aiAnalysis.products?.length > 0) aiUpdateData.websiteProducts = aiAnalysis.products;
          if (Object.keys(aiUpdateData).length > 0) {
            await db.update(companies).set(aiUpdateData).where(eq(companies.id, companyId));
            console.log(
              `[Enrichment] AI fields persisted for company ${companyId}:`,
              Object.keys(aiUpdateData),
            );
          }
          // Recalculate enrichment score after website enrichment
          const freshCo = await storage.getCompany(companyId);
          if (freshCo) {
            const { calculateEnrichmentScore } = await import('./services/company-enrichment');
            const newScore = calculateEnrichmentScore(freshCo);
            await storage.updateCompany(companyId, { enrichmentScore: newScore });
          }
        } catch (aiDbError) {
          console.error('[Enrichment] Failed to persist AI fields:', aiDbError);
        }
      }

      res.json({
        success: true,
        data: {
          title: metaTitle,
          description: aiAnalysis?.description || metaDescription,
          category: aiAnalysis?.category || null,
          tagline: aiAnalysis?.tagline || null,
          socialMedia: aiAnalysis?.socialMedia || null,
          ecommerce: aiAnalysis?.ecommerce || null,
          products: aiAnalysis?.products || null,
          brandColors: aiAnalysis?.brandColors || null,
          logoUrl: aiAnalysis?.logoUrl || null,
          text: websiteText.substring(0, 500),
          url: pageData.url,
          pagesCrawled: results.length,
          socialLinks,
          keywords: uniqueKeywords,
        },
      });
    } catch (error) {
      console.error('[Enrichment] Website analysis error:', error);
      res.status(500).json({ error: 'Erro ao analisar website' });
    }
  });

  // Profile Completeness Score - Calculate how complete the company profile is
  app.get('/api/enrichment/completeness/:companyId', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) return res.status(400).json({ error: 'ID inválido' });

    try {
      const company = await storage.getCompany(companyId);
      if (!company) return res.status(404).json({ error: 'Empresa não encontrada' });

      const fields = [
        { name: 'name', weight: 10, filled: !!company.name },
        { name: 'description', weight: 15, filled: !!company.description },
        { name: 'cnpj', weight: 10, filled: !!company.cnpj },
        { name: 'website', weight: 10, filled: !!company.website },
        { name: 'instagram', weight: 10, filled: !!company.instagram },
        { name: 'logo', weight: 15, filled: !!company.logo },
        { name: 'coverPhoto', weight: 5, filled: !!company.coverPhoto },
        { name: 'email', weight: 5, filled: !!company.email },
        { name: 'phone', weight: 5, filled: !!company.phone },
        { name: 'category', weight: 10, filled: !!company.category },
        { name: 'tagline', weight: 5, filled: !!company.tagline },
      ];

      const totalWeight = fields.reduce((sum, f) => sum + f.weight, 0);
      const filledWeight = fields.filter((f) => f.filled).reduce((sum, f) => sum + f.weight, 0);
      const score = Math.round((filledWeight / totalWeight) * 100);

      const missingFields = fields.filter((f) => !f.filled).map((f) => f.name);
      const suggestions = [];
      if (missingFields.includes('logo'))
        suggestions.push('Adicione um logo para melhorar o reconhecimento da marca');
      if (missingFields.includes('description'))
        suggestions.push('Adicione uma descrição para explicar o que sua empresa faz');
      if (missingFields.includes('instagram'))
        suggestions.push('Conecte seu Instagram para validar suas redes sociais');

      res.json({
        success: true,
        data: {
          score,
          level:
            score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'basic' : 'incomplete',
          missingFields,
          suggestions,
        },
      });
    } catch (error) {
      console.error('[Enrichment] Completeness check error:', error);
      res.status(500).json({ error: 'Erro ao calcular completude' });
    }
  });

  // AI Generate Description V2 - Generate professional description with enrichment context
  app.post('/api/enrichment/generate-description-v2', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { companyId, formData, enrichmentContext, includeBriefing } = req.body;
    if (!companyId) return res.status(400).json({ error: 'ID da empresa é obrigatório' });

    try {
      const company = await storage.getCompany(companyId);
      if (!company) return res.status(404).json({ error: 'Empresa não encontrada' });

      // Build rich context from all available data
      const contextParts: string[] = [];

      // Company form data
      const name = formData?.name || company.name;
      const tradeName = formData?.tradeName || company.tradeName;
      const category = formData?.category || company.category;
      const website = formData?.website || company.website;
      const instagram = formData?.instagram || company.instagram;
      const city = formData?.city || company.city;
      const state = formData?.state || company.state;

      contextParts.push(`Nome: ${name}`);
      if (tradeName) contextParts.push(`Razão Social: ${tradeName}`);
      if (category) contextParts.push(`Categoria: ${category}`);
      if (website) contextParts.push(`Website: ${website}`);
      if (instagram) contextParts.push(`Instagram: ${instagram}`);
      if (city) contextParts.push(`Localização: ${city}${state ? `/${state}` : ''}`);

      // CNPJ enrichment data
      if (enrichmentContext?.cnpjData) {
        const cnpj = enrichmentContext.cnpjData;
        if (cnpj.atividade) contextParts.push(`Atividade Principal: ${cnpj.atividade}`);
        if (cnpj.tempoMercado) contextParts.push(`Tempo de Mercado: ${cnpj.tempoMercado}`);
        if (cnpj.porte) contextParts.push(`Porte: ${cnpj.porte}`);
      }

      // Website enrichment data
      if (enrichmentContext?.websiteData) {
        const web = enrichmentContext.websiteData;
        if (web.description)
          contextParts.push(`Descrição do Site: ${web.description.substring(0, 300)}`);
        if (web.products?.length)
          contextParts.push(`Produtos/Serviços: ${web.products.slice(0, 5).join(', ')}`);
        if (web.ecommerce) contextParts.push(`Tipo: E-commerce`);
      }

      // Instagram enrichment data
      if (enrichmentContext?.instagramData) {
        const ig = enrichmentContext.instagramData;
        if (ig.followers) {
          const followersStr =
            ig.followers >= 1000000
              ? `${(ig.followers / 1000000).toFixed(1)}M`
              : ig.followers >= 1000
                ? `${(ig.followers / 1000).toFixed(1)}K`
                : ig.followers.toString();
          contextParts.push(`Seguidores Instagram: ${followersStr}`);
        }
        if (ig.bio) contextParts.push(`Bio do Instagram: ${ig.bio}`);
        if (ig.isVerified) contextParts.push(`Perfil Verificado: Sim`);
      }

      // Add DB enrichment data for briefing context
      if (company.websiteAbout)
        contextParts.push(`Sobre (site): ${company.websiteAbout.substring(0, 500)}`);
      if (company.websiteProducts?.length)
        contextParts.push(`Produtos do site: ${company.websiteProducts.join(', ')}`);
      if (company.cnpjRazaoSocial)
        contextParts.push(`Razão Social (CNPJ): ${company.cnpjRazaoSocial}`);
      if (company.cnpjAtividadePrincipal)
        contextParts.push(`Atividade CNAE: ${company.cnpjAtividadePrincipal}`);
      if (company.cnpjCapitalSocial)
        contextParts.push(`Capital Social: R$ ${company.cnpjCapitalSocial}`);
      if (company.instagramFollowers)
        contextParts.push(`Seguidores Instagram (DB): ${company.instagramFollowers}`);
      if (company.instagramBio) contextParts.push(`Bio Instagram (DB): ${company.instagramBio}`);

      const briefingSection = includeBriefing
        ? `

3. BRIEFING ESTRUTURADO (JSON):
   Gere um briefing estruturado da marca para uso em campanhas de marketing de influência. Retorne como objeto JSON com os campos:
   - "whatWeDo": O que a empresa faz (2-3 frases, máximo 300 caracteres)
   - "targetAudience": Público-alvo detalhado (2-3 frases, máximo 300 caracteres)
   - "brandVoice": Tom de voz (uma palavra entre: formal, descontraido, tecnico, inspiracional, divertido, premium, jovem)
   - "differentials": Diferenciais competitivos (2-3 frases, máximo 300 caracteres)
   - "idealContentTypes": Array de tipos de conteúdo ideais (escolha entre: review, unboxing, tutorial, lifestyle, antes_depois, receita, day_in_life, depoimento, challenge, behind_scenes)
   - "avoidTopics": Temas a evitar (se aplicável, senão string vazia)
   Use português brasileiro, tom profissional mas acessível.`
        : '';

      const briefingJsonField = includeBriefing
        ? ', "structuredBriefing": { "whatWeDo": "...", "targetAudience": "...", "brandVoice": "formal", "differentials": "...", "idealContentTypes": ["review"], "avoidTopics": "" }'
        : '';

      const prompt = `Você é um copywriter especialista em marketing de influência no Brasil. Crie uma descrição profissional e uma tagline criativa para a empresa abaixo.

=== DADOS COLETADOS ===
${contextParts.join('\n')}

=== INSTRUÇÕES ===
Com base nos dados acima, crie:

1. DESCRIÇÃO (150-300 caracteres):
   - Atraente para criadores de conteúdo/influenciadores
   - Explique claramente o que a empresa oferece
   - Destaque o diferencial competitivo
   - Use português brasileiro natural e moderno
   - NÃO use aspas dentro do texto
   - NÃO comece com "Somos" ou "A [nome]"
   - Seja criativo e envolvente

2. TAGLINE (máximo 50 caracteres):
   - Memorável e impactante
   - Capture a essência da marca
   - Em português brasileiro
${briefingSection}

Responda APENAS com JSON válido (sem markdown):
{"description": "descrição aqui", "tagline": "tagline aqui"${briefingJsonField}}`;

      const aiResponse = await sendGeminiMessage(prompt, {
        model: 'gemini-2.5-flash',
        systemInstruction:
          'Você é um copywriter brasileiro especialista em branding. Responda apenas com JSON válido, sem markdown.',
      });

      try {
        const cleanJson = aiResponse
          .replace(/```json?\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        const result = JSON.parse(cleanJson);

        // Persist briefing to DB if generated
        if (includeBriefing && result.structuredBriefing) {
          try {
            const { companies } = await import('@shared/schema');
            const { db } = await import('./db');
            const { eq } = await import('drizzle-orm');
            const sb = result.structuredBriefing;
            // Generate text briefing from structured data
            const textParts: string[] = [];
            if (sb.whatWeDo) textParts.push(sb.whatWeDo);
            if (sb.targetAudience) textParts.push(`Público-alvo: ${sb.targetAudience}`);
            if (sb.differentials) textParts.push(`Diferenciais: ${sb.differentials}`);
            if (sb.brandVoice) textParts.push(`Tom de voz: ${sb.brandVoice}`);
            if (sb.idealContentTypes?.length)
              textParts.push(`Conteúdo ideal: ${sb.idealContentTypes.join(', ')}`);
            if (sb.avoidTopics) textParts.push(`Evitar: ${sb.avoidTopics}`);
            const textBriefing = textParts.join('. ');

            await db
              .update(companies)
              .set({
                structuredBriefing: sb,
                companyBriefing: textBriefing,
                aiContextSummary: textBriefing,
                aiContextLastUpdated: new Date(),
              })
              .where(eq(companies.id, companyId));
            console.log(`[Enrichment V2] Structured briefing persisted for company ${companyId}`);
          } catch (dbErr) {
            console.error('[Enrichment V2] Failed to persist briefing:', dbErr);
          }
        }

        res.json({ success: true, data: result });
      } catch (parseError) {
        console.error('[Enrichment V2] Failed to parse AI response:', aiResponse);
        res.status(500).json({ error: 'Erro ao processar resposta da IA' });
      }
    } catch (error) {
      console.error('[Enrichment V2] Generate description error:', error);
      res.status(500).json({ error: 'Erro ao gerar descrição' });
    }
  });

  // AI Generate Description - Generate professional description from all data
  app.post('/api/enrichment/generate-description', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { companyId, context } = req.body;
    if (!companyId) return res.status(400).json({ error: 'ID da empresa é obrigatório' });

    try {
      const company = await storage.getCompany(companyId);
      if (!company) return res.status(404).json({ error: 'Empresa não encontrada' });

      const prompt = `Você é um copywriter especialista em marketing de influência. Crie uma descrição profissional para a empresa abaixo.

=== DADOS DA EMPRESA ===
Nome: ${company.name}
Razão Social: ${company.tradeName || 'N/A'}
Categoria: ${company.category || 'N/A'}
Tagline atual: ${company.tagline || 'N/A'}
Website: ${company.website || 'N/A'}
Instagram: ${company.instagram || 'N/A'}
Cidade/Estado: ${company.city ? `${company.city}/${company.state}` : 'N/A'}
${context ? `\nContexto adicional: ${context}` : ''}

=== INSTRUÇÕES ===
Crie uma descrição que:
1. Seja atraente para criadores de conteúdo/influenciadores
2. Explique claramente o que a empresa oferece
3. Destaque o diferencial competitivo
4. Use português brasileiro natural
5. Tenha entre 150-300 caracteres
6. NÃO use aspas dentro do texto
7. NÃO comece com "Somos" ou "A [nome]"

Também sugira uma tagline criativa (máximo 50 caracteres).

Responda APENAS com JSON:
{
  "description": "descrição aqui",
  "tagline": "tagline aqui"
}`;

      const aiResponse = await sendGeminiMessage(prompt, {
        model: 'gemini-2.5-flash',
        systemInstruction: 'Você é um copywriter profissional. Responda apenas com JSON válido.',
      });

      try {
        const cleanJson = aiResponse
          .replace(/```json?\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        const result = JSON.parse(cleanJson);
        res.json({ success: true, data: result });
      } catch (parseError) {
        console.error('[Enrichment] Failed to parse AI response:', aiResponse);
        res.status(500).json({ error: 'Erro ao processar resposta da IA' });
      }
    } catch (error) {
      console.error('[Enrichment] Generate description error:', error);
      res.status(500).json({ error: 'Erro ao gerar descrição' });
    }
  });

  // Instagram Enrichment - Validate and extract profile data
  app.get('/api/enrichment/instagram/:username', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const username = req.params.username.replace('@', '').trim();
    if (!username || username.length < 1) {
      return res.status(400).json({ error: 'Username inválido' });
    }

    try {
      let metrics: any = null;

      const bizData = await tryBusinessDiscoveryForProfile(username);
      if (bizData && bizData.exists) {
        metrics = bizData;
      }

      if (!metrics) {
        console.log('[Enrichment] Business Discovery unavailable, falling back to Apify');
        const { validateInstagramProfile } = await import('./apify-service');
        metrics = await validateInstagramProfile(username);
      }

      if (!metrics.exists) {
        return res.status(404).json({ error: 'Perfil não encontrado' });
      }

      let savedProfilePicUrl = metrics.profilePicUrl;
      if (metrics.profilePicUrl) {
        const { downloadAndSaveToStorage, getPublicUrl } =
          await import('./services/instagram-profile-pic');
        const storagePath = await downloadAndSaveToStorage(username, metrics.profilePicUrl);
        if (storagePath) {
          savedProfilePicUrl = getPublicUrl(storagePath);
        }
      }

      let followersDisplay = '';
      if (metrics.followers) {
        if (metrics.followers >= 1000000) {
          followersDisplay = `${(metrics.followers / 1000000).toFixed(1)}M`;
        } else if (metrics.followers >= 1000) {
          followersDisplay = `${(metrics.followers / 1000).toFixed(1)}K`;
        } else {
          followersDisplay = String(metrics.followers);
        }
      }

      res.json({
        success: true,
        data: {
          exists: true,
          username: metrics.username,
          fullName: metrics.fullName,
          bio: metrics.bio,
          followers: metrics.followers,
          followersDisplay,
          following: metrics.following,
          postsCount: metrics.postsCount,
          engagementRate: metrics.engagementRate,
          authenticityScore: metrics.authenticityScore,
          isVerified: metrics.isVerified,
          isPrivate: metrics.isPrivate,
          profilePicUrl: savedProfilePicUrl,
          topHashtags: metrics.topHashtags,
          topPosts: metrics.topPosts?.slice(0, 3),
        },
      });
    } catch (error) {
      console.error('[Enrichment] Instagram lookup error:', error);
      res.status(500).json({ error: 'Erro ao validar Instagram' });
    }
  });

  // =============================================================================
  // EMAIL PREVIEW ENDPOINT (DEV ONLY - requires admin auth)
  // =============================================================================

  app.get('/api/preview-email/:type', async (req, res) => {
    // Block in production unless explicitly enabled
    if (process.env.NODE_ENV === 'production' && !process.env.EMAIL_PREVIEW_ENABLED) {
      return res.status(404).send('Not found');
    }

    // Require admin authentication (email-verified)
    if (!checkAdminAccess(req)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const {
      previewApplicationApprovedEmail,
      previewWeeklyReportEmail,
      previewOnboardingWelcomeEmail,
    } = await import('./email');
    const type = req.params.type;

    // Mock data for preview with realistic data
    const mockCreator = { name: 'Maria Silva' };
    const mockCompany = { name: 'Turbo Partners' };
    const mockCampaign = {
      title: 'UGC para Lançamento de Produto',
      brand: 'Turbo Partners',
      brandLogo:
        'https://api.dicebear.com/7.x/initials/svg?seed=TP&backgroundColor=8b5cf6&textColor=ffffff',
      value: 'R$ 2.500',
      deadline: '15/02/2026',
      type: 'UGC',
    };

    let html = '';

    try {
      switch (type) {
        case 'approval':
          html = previewApplicationApprovedEmail(mockCreator.name, mockCampaign);
          break;

        case 'weekly-report': {
          const mockStats = {
            totalApplications: 12,
            approvedCreators: 8,
            pendingDeliverables: 3,
            completedCampaigns: 2,
            totalSpent: 'R$ 15.000',
            pendingApplications: 4,
          };
          const mockPendingItems = {
            applications: [
              { creatorName: 'Ana Santos', campaignTitle: 'UGC Lançamento', daysAgo: 2 },
              { creatorName: 'João Costa', campaignTitle: 'Reels Q1', daysAgo: 5 },
              { creatorName: 'Maria Lima', campaignTitle: 'Stories Brand', daysAgo: 1 },
            ],
            deliverables: [
              { creatorName: 'Pedro Silva', campaignTitle: 'UGC Lançamento', type: 'Reels' },
              { creatorName: 'Carla Souza', campaignTitle: 'Stories Brand', type: 'Stories' },
            ],
          };
          html = previewWeeklyReportEmail(mockCompany.name, mockStats, mockPendingItems);
          break;
        }

        case 'welcome':
        case 'welcome-creator':
          html = previewOnboardingWelcomeEmail(mockCreator.name, 'creator');
          break;

        case 'welcome-company':
          html = previewOnboardingWelcomeEmail(mockCompany.name, 'company');
          break;

        default:
          html = `<html><body style="margin:0;padding:40px;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <div style="max-width:600px;margin:0 auto;background:#18181b;border-radius:16px;padding:32px;border:1px solid #27272a;">
              <h2 style="color:#fff;margin:0 0 8px;">🎨 Preview de E-mails</h2>
              <p style="color:#a1a1aa;margin:0 0 24px;font-size:14px;">Visualize os templates sem enviar (Admin only)</p>
              <div style="display:grid;gap:12px;">
                <a href="/api/preview-email/approval" style="display:block;padding:16px;background:#27272a;border-radius:12px;color:#fff;text-decoration:none;border:1px solid #3f3f46;">
                  <span style="font-size:20px;">📧</span>
                  <span style="margin-left:12px;font-weight:600;">Aprovação de Candidatura</span>
                  <span style="display:block;margin-top:4px;color:#71717a;font-size:13px;">Email enviado quando creator é aprovado</span>
                </a>
                <a href="/api/preview-email/weekly-report" style="display:block;padding:16px;background:#27272a;border-radius:12px;color:#fff;text-decoration:none;border:1px solid #3f3f46;">
                  <span style="font-size:20px;">📊</span>
                  <span style="margin-left:12px;font-weight:600;">Relatório Semanal (Empresa)</span>
                  <span style="display:block;margin-top:4px;color:#71717a;font-size:13px;">Resumo enviado toda segunda às 9h</span>
                </a>
                <a href="/api/preview-email/welcome-creator" style="display:block;padding:16px;background:#27272a;border-radius:12px;color:#fff;text-decoration:none;border:1px solid #3f3f46;">
                  <span style="font-size:20px;">🎬</span>
                  <span style="margin-left:12px;font-weight:600;">Boas-Vindas (Creator)</span>
                  <span style="display:block;margin-top:4px;color:#71717a;font-size:13px;">Onboarding para novos creators</span>
                </a>
                <a href="/api/preview-email/welcome-company" style="display:block;padding:16px;background:#27272a;border-radius:12px;color:#fff;text-decoration:none;border:1px solid #3f3f46;">
                  <span style="font-size:20px;">🏢</span>
                  <span style="margin-left:12px;font-weight:600;">Boas-Vindas (Empresa)</span>
                  <span style="display:block;margin-top:4px;color:#71717a;font-size:13px;">Onboarding para novas empresas</span>
                </a>
              </div>
              <p style="color:#52525b;font-size:12px;margin:24px 0 0;text-align:center;">Acesse como admin para visualizar</p>
            </div>
          </body></html>`;
      }

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error('[Email Preview] Error:', error);
      res.status(500).json({ error: 'Failed to generate preview' });
    }
  });

  const httpServer = createServer(app);

  // Setup WebSocket for real-time notifications
  const { sessionMiddleware } = await import('./auth');
  setupWebSocket(httpServer, sessionMiddleware);

  return httpServer;
}
