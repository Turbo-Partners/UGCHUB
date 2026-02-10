import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ApifyClient } from 'apify-client';
import apifyService from '../services/apify';
import { runManualSync } from '../jobs/apifySyncJob';
import * as presets from '../services/apify-presets';

const apifyClient = process.env.APIFY_API_KEY ? new ApifyClient({ token: process.env.APIFY_API_KEY }) : null;

const router = Router();

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).isAuthenticated || !(req as any).isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

function requireCompanyOrAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (user.role !== 'company' && user.role !== 'admin') {
    return res.status(403).json({ error: 'Company or admin access required' });
  }
  next();
}

router.use(requireAuth);
router.use(requireCompanyOrAdmin);

const scrapeProfilesSchema = z.object({
  usernames: z.array(z.string()).min(1).max(50),
});

const scrapePostsSchema = z.object({
  directUrls: z.array(z.string()).min(1).max(20),
  resultsLimit: z.number().min(1).max(100).optional().default(20),
  onlyPostsNewerThan: z.string().optional(),
});

const scrapeReelsSchema = z.object({
  directUrls: z.array(z.string()).min(1).max(20),
  resultsLimit: z.number().min(1).max(100).optional().default(15),
});

const discoverSchema = z.object({
  search: z.string().min(1),
  searchType: z.enum(['hashtag', 'user', 'place']),
  searchLimit: z.number().min(1).max(50).optional().default(10),
  resultsLimit: z.number().min(1).max(100).optional().default(20),
});

router.get('/status', async (_req: Request, res: Response) => {
  try {
    const isConfigured = apifyService.isApifyConfigured();
    const stats = isConfigured ? await apifyService.getApifyCallStats() : null;

    res.json({
      configured: isConfigured,
      stats,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/scrape/profiles', async (req: Request, res: Response) => {
  try {
    if (!apifyService.isApifyConfigured()) {
      return res.status(503).json({ error: 'Apify not configured. Please set APIFY_API_KEY.' });
    }

    const body = scrapeProfilesSchema.parse(req.body);
    const userId = (req as any).user?.id;

    console.log('[Apify] ⚠️ scrapeProfiles endpoint called - prefer API Scraper (instagram-api-scraper) for better cost efficiency');

    const results = await apifyService.scrapeProfiles(body.usernames, {
      triggeredBy: 'on_demand',
      triggeredByUserId: userId,
    });

    res.json({
      success: true,
      count: results.length,
      profiles: results,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

router.post('/scrape/profiles/detailed', async (req: Request, res: Response) => {
  try {
    if (!apifyService.isApifyConfigured()) {
      return res.status(503).json({ error: 'Apify not configured. Please set APIFY_API_KEY.' });
    }

    const body = scrapeProfilesSchema.parse(req.body);
    const userId = (req as any).user?.id;

    console.log(`[Apify] scrapeProfilesDetailed called with ${body.usernames.length} usernames (instagram-profile-scraper)`);

    const results = await apifyService.scrapeProfilesDetailed(body.usernames, {
      triggeredBy: 'on_demand',
      triggeredByUserId: userId,
    });

    res.json({
      success: true,
      count: results.length,
      profiles: results,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

router.post('/scrape/posts', async (req: Request, res: Response) => {
  try {
    if (!apifyService.isApifyConfigured()) {
      return res.status(503).json({ error: 'Apify not configured. Please set APIFY_API_KEY.' });
    }

    const body = scrapePostsSchema.parse(req.body);
    const userId = (req as any).user?.id;

    const results = await apifyService.scrapePosts(
      body.directUrls,
      body.resultsLimit,
      { onlyPostsNewerThan: body.onlyPostsNewerThan, addParentData: true },
      {
        triggeredBy: 'on_demand',
        triggeredByUserId: userId,
      }
    );

    res.json({
      success: true,
      count: results.length,
      posts: results,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

router.post('/scrape/reels', async (req: Request, res: Response) => {
  return res.status(403).json({ 
    error: "⛔ Reel Scraper desativado - custo muito alto (~$2.60/1k). Use o API Scraper via /api/apify/scrape/profiles ou /api/apify/scrape/posts",
    disabled: true,
  });
});

router.post('/discover', async (req: Request, res: Response) => {
  try {
    if (!apifyService.isApifyConfigured()) {
      return res.status(503).json({ error: 'Apify not configured. Please set APIFY_API_KEY.' });
    }

    const body = discoverSchema.parse(req.body);
    const userId = (req as any).user?.id;

    const results = await apifyService.discoverCreators(body, {
      triggeredBy: 'on_demand',
      triggeredByUserId: userId,
    });

    res.json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

router.get('/profile/:username/growth', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    const history = await apifyService.getProfileGrowthHistory(username, days);

    res.json({
      username,
      days,
      dataPoints: history.length,
      history,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/profile/:username/latest', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const snapshot = await apifyService.getLatestProfileSnapshot(username);

    if (!snapshot) {
      return res.status(404).json({ error: 'No data found for this profile' });
    }

    res.json(snapshot);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/profile/:username/posts', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    const posts = await apifyService.getPostsForUser(username, limit);

    res.json({
      username,
      count: posts.length,
      posts,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/profile/:username/reels', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    const reels = await apifyService.getReelsForUser(username, limit);

    res.json({
      username,
      count: reels.length,
      reels,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/profile/:username/cache-age', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const cacheAge = await apifyService.getCacheAge(username);
    const exists = await apifyService.checkProfileExists(username);

    res.json({
      username,
      exists,
      cacheAgeHours: cacheAge,
      needsUpdate: cacheAge === null || cacheAge >= 24,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await apifyService.getApifyCallStats();
    res.json({ stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/profiles-needing-update', async (req: Request, res: Response) => {
  try {
    const cacheHours = parseInt(req.query.cacheHours as string) || 24;
    const profiles = await apifyService.getProfilesNeedingUpdate(cacheHours);

    res.json({
      cacheHours,
      count: profiles.length,
      profiles,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/sync/manual', async (req: Request, res: Response) => {
  try {
    if (!apifyService.isApifyConfigured()) {
      return res.status(503).json({ error: 'Apify not configured. Please set APIFY_API_KEY.' });
    }

    const stats = await runManualSync();

    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/trigger/new-dm', async (req: Request, res: Response) => {
  const { username } = req.body;
  console.log(`[Apify] /trigger/new-dm DISABLED - Auto-scraping for DM senders is turned off. Username: ${username}`);
  return res.json({
    action: 'skipped',
    reason: 'auto_scraping_disabled',
    message: 'Scraping automático para DMs desativado para controle de custos. Use o botão "Atualizar Perfil" na tela de detalhes do criador.',
    username,
  });
});

// ==================== Integration Presets ====================

const creatorFullProfileSchema = z.object({
  instagramUsername: z.string().optional(),
  tiktokUsername: z.string().optional(),
  includeRecentPosts: z.boolean().optional().default(false),
  postsLimit: z.number().min(1).max(50).optional().default(10),
  includeReels: z.boolean().optional().default(false),
  reelsLimit: z.number().min(1).max(20).optional().default(5),
  dryRun: z.boolean().optional().default(false),
});

const campaignDiscoverySchema = z.object({
  hashtags: z.array(z.string()).min(1).max(10),
  platforms: z.array(z.enum(['instagram', 'tiktok'])).optional(),
  resultsPerHashtag: z.number().min(10).max(100).optional().default(30),
  dryRun: z.boolean().optional().default(false),
});

const competitorAnalysisSchema = z.object({
  instagramUsernames: z.array(z.string()).max(10).optional(),
  youtubeChannels: z.array(z.string()).max(5).optional(),
  includeRecentContent: z.boolean().optional().default(true),
  contentLimit: z.number().min(1).max(20).optional().default(5),
  dryRun: z.boolean().optional().default(false),
});

const brandMentionsSchema = z.object({
  brandName: z.string().min(1),
  hashtags: z.array(z.string()).max(5).optional(),
  platforms: z.array(z.enum(['instagram', 'tiktok'])).optional(),
  resultsLimit: z.number().min(10).max(100).optional().default(50),
  dryRun: z.boolean().optional().default(false),
});

router.get('/presets', async (_req: Request, res: Response) => {
  res.json({
    success: true,
    presets: presets.PRESETS,
  });
});

router.post('/presets/creator-full-profile', async (req: Request, res: Response) => {
  try {
    if (!apifyService.isApifyConfigured()) {
      return res.status(503).json({ error: 'Apify não configurado. Defina APIFY_API_KEY.' });
    }

    const body = creatorFullProfileSchema.parse(req.body);
    const userId = (req as any).user?.id;

    if (!body.instagramUsername && !body.tiktokUsername) {
      return res.status(400).json({ error: 'Informe pelo menos um username (Instagram ou TikTok).' });
    }

    const result = await presets.creatorFullProfile(
      {
        instagramUsername: body.instagramUsername,
        tiktokUsername: body.tiktokUsername,
        includeRecentPosts: body.includeRecentPosts,
        postsLimit: body.postsLimit,
        includeReels: body.includeReels,
        reelsLimit: body.reelsLimit,
      },
      {
        triggeredBy: 'on_demand',
        triggeredByUserId: userId,
        dryRun: body.dryRun,
      }
    );

    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

router.post('/presets/campaign-discovery', async (req: Request, res: Response) => {
  try {
    if (!apifyService.isApifyConfigured()) {
      return res.status(503).json({ error: 'Apify não configurado. Defina APIFY_API_KEY.' });
    }

    const body = campaignDiscoverySchema.parse(req.body);
    const userId = (req as any).user?.id;

    const result = await presets.campaignDiscovery(
      {
        hashtags: body.hashtags,
        platforms: body.platforms,
        resultsPerHashtag: body.resultsPerHashtag,
      },
      {
        triggeredBy: 'on_demand',
        triggeredByUserId: userId,
        dryRun: body.dryRun,
      }
    );

    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

router.post('/presets/competitor-analysis', async (req: Request, res: Response) => {
  try {
    if (!apifyService.isApifyConfigured()) {
      return res.status(503).json({ error: 'Apify não configurado. Defina APIFY_API_KEY.' });
    }

    const body = competitorAnalysisSchema.parse(req.body);
    const userId = (req as any).user?.id;

    if (!body.instagramUsernames?.length && !body.youtubeChannels?.length) {
      return res.status(400).json({ error: 'Informe pelo menos um perfil Instagram ou canal YouTube.' });
    }

    const result = await presets.competitorAnalysis(
      {
        instagramUsernames: body.instagramUsernames,
        youtubeChannels: body.youtubeChannels,
        includeRecentContent: body.includeRecentContent,
        contentLimit: body.contentLimit,
      },
      {
        triggeredBy: 'on_demand',
        triggeredByUserId: userId,
        dryRun: body.dryRun,
      }
    );

    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

router.post('/presets/brand-mentions', async (req: Request, res: Response) => {
  try {
    if (!apifyService.isApifyConfigured()) {
      return res.status(503).json({ error: 'Apify não configurado. Defina APIFY_API_KEY.' });
    }

    const body = brandMentionsSchema.parse(req.body);
    const userId = (req as any).user?.id;

    const result = await presets.brandMentions(
      {
        brandName: body.brandName,
        hashtags: body.hashtags,
        platforms: body.platforms,
        resultsLimit: body.resultsLimit,
      },
      {
        triggeredBy: 'on_demand',
        triggeredByUserId: userId,
        dryRun: body.dryRun,
      }
    );

    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// ==================== Google Maps Extractor ====================

const googleMapsExtractorSchema = z.object({
  searchQueries: z.array(z.string()).min(1).max(10),
  maxResultsPerQuery: z.number().min(1).max(100).optional().default(20),
  language: z.string().optional().default('pt-BR'),
  includeReviews: z.boolean().optional().default(false),
  maxReviews: z.number().optional().default(0),
});

router.post('/scrape/google-maps', async (req: Request, res: Response) => {
  try {
    if (!apifyService.isApifyConfigured()) {
      return res.status(503).json({ error: 'Apify não configurado. Defina APIFY_API_KEY.' });
    }

    const body = googleMapsExtractorSchema.parse(req.body);
    const userId = (req as any).user?.id;

    const results = await apifyService.scrapeGoogleMapsExtractor(
      body.searchQueries,
      {
        maxResultsPerQuery: body.maxResultsPerQuery,
        language: body.language,
        includeReviews: body.includeReviews,
        maxReviews: body.maxReviews,
      },
      {
        triggeredBy: 'on_demand',
        triggeredByUserId: userId,
      }
    );

    res.json({
      success: true,
      count: results.length,
      results,
      costEstimate: apifyService.estimateApifyCost('google_maps_extractor', results.length),
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// ==================== Ahrefs Scraper ====================

const ahrefsSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(20),
  includeBacklinks: z.boolean().optional().default(false),
  includeKeywords: z.boolean().optional().default(true),
  maxKeywords: z.number().min(1).max(50).optional().default(10),
});

router.post('/scrape/ahrefs', async (req: Request, res: Response) => {
  try {
    if (!apifyService.isApifyConfigured()) {
      return res.status(503).json({ error: 'Apify não configurado. Defina APIFY_API_KEY.' });
    }

    const body = ahrefsSchema.parse(req.body);
    const userId = (req as any).user?.id;

    const results = await apifyService.scrapeAhrefs(
      body.urls,
      {
        includeBacklinks: body.includeBacklinks,
        includeKeywords: body.includeKeywords,
        maxKeywords: body.maxKeywords,
      },
      {
        triggeredBy: 'on_demand',
        triggeredByUserId: userId,
      }
    );

    res.json({
      success: true,
      count: results.length,
      results,
      costEstimate: apifyService.estimateApifyCost('ahrefs_scraper', results.length),
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// ==================== YouTube Channel Info ====================

const youtubeChannelSchema = z.object({
  channelUrls: z.array(z.string()).min(1).max(20),
  includeRecentVideos: z.boolean().optional().default(true),
  maxRecentVideos: z.number().min(0).max(50).optional().default(10),
});

router.post('/scrape/youtube-channel', async (req: Request, res: Response) => {
  try {
    if (!apifyService.isApifyConfigured()) {
      return res.status(503).json({ error: 'Apify não configurado. Defina APIFY_API_KEY.' });
    }

    const body = youtubeChannelSchema.parse(req.body);
    const userId = (req as any).user?.id;

    const results = await apifyService.scrapeYouTubeChannelInfo(
      body.channelUrls,
      {
        includeRecentVideos: body.includeRecentVideos,
        maxRecentVideos: body.maxRecentVideos,
      },
      {
        triggeredBy: 'on_demand',
        triggeredByUserId: userId,
      }
    );

    res.json({
      success: true,
      count: results.length,
      results,
      costEstimate: apifyService.estimateApifyCost('youtube_channel', results.length),
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// ==================== Admin: Webhook & Schedule Management ====================

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

router.get('/webhooks', requireAdmin, async (_req: Request, res: Response) => {
  try {
    if (!apifyClient) {
      return res.status(503).json({ error: 'Apify not configured' });
    }
    const result = await apifyClient.webhooks().list();
    res.json({
      success: true,
      total: result.total,
      webhooks: result.items.map((w: any) => ({
        id: w.id,
        eventTypes: w.eventTypes,
        condition: w.condition,
        requestUrl: w.requestUrl,
        isAdHoc: w.isAdHoc,
        description: w.description,
        lastDispatch: w.lastDispatch,
        stats: w.stats,
        createdAt: w.createdAt,
        modifiedAt: w.modifiedAt,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/webhooks/:webhookId', requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!apifyClient) {
      return res.status(503).json({ error: 'Apify not configured' });
    }
    const { webhookId } = req.params;
    await apifyClient.webhook(webhookId).delete();
    console.log(`[Apify] ⛔ Webhook ${webhookId} DELETED by admin`);
    res.json({ success: true, message: `Webhook ${webhookId} deleted` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/webhooks/:webhookId/disable', requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!apifyClient) {
      return res.status(503).json({ error: 'Apify not configured' });
    }
    const { webhookId } = req.params;
    const updated = await apifyClient.webhook(webhookId).update({
      isAdHoc: true,
      requestUrl: 'https://disabled.example.com/webhook-disabled',
    });
    console.log(`[Apify] ⛔ Webhook ${webhookId} DISABLED by admin`);
    res.json({ success: true, message: `Webhook ${webhookId} disabled`, webhook: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/schedules', requireAdmin, async (_req: Request, res: Response) => {
  try {
    if (!apifyClient) {
      return res.status(503).json({ error: 'Apify not configured' });
    }
    const result = await apifyClient.schedules().list();
    res.json({
      success: true,
      total: result.total,
      schedules: result.items.map((s: any) => ({
        id: s.id,
        name: s.name,
        isEnabled: s.isEnabled,
        cronExpression: s.cronExpression,
        timezone: s.timezone,
        lastRunAt: s.lastRunAt,
        nextRunAt: s.nextRunAt,
        actions: s.actions,
        createdAt: s.createdAt,
        modifiedAt: s.modifiedAt,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/schedules/:scheduleId/disable', requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!apifyClient) {
      return res.status(503).json({ error: 'Apify not configured' });
    }
    const { scheduleId } = req.params;
    const updated = await apifyClient.schedule(scheduleId).update({ isEnabled: false });
    console.log(`[Apify] ⛔ Schedule ${scheduleId} DISABLED by admin`);
    res.json({ success: true, message: `Schedule ${scheduleId} disabled`, schedule: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/schedules/:scheduleId/enable', requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!apifyClient) {
      return res.status(503).json({ error: 'Apify not configured' });
    }
    const { scheduleId } = req.params;
    const updated = await apifyClient.schedule(scheduleId).update({ isEnabled: true });
    console.log(`[Apify] ✅ Schedule ${scheduleId} ENABLED by admin`);
    res.json({ success: true, message: `Schedule ${scheduleId} enabled`, schedule: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
