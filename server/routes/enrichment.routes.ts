import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import enrichmentService from '../services/enrichment';
import { db } from '../db';
import { companyMembers } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).isAuthenticated || !(req as any).isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

function isAdminByEmail(user: any): boolean {
  const email = user?.email || '';
  return user?.role === 'admin' || email.endsWith('@turbopartners.com.br') || email === 'rodrigoqs9@gmail.com';
}

function requireCompanyOrAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (user.role !== 'company' && !isAdminByEmail(user)) {
    return res.status(403).json({ error: 'Company or admin access required' });
  }
  next();
}

router.use(requireAuth);

const creatorEnrichmentSchema = z.object({
  includeInstagram: z.boolean().optional().default(true),
  includeTikTok: z.boolean().optional().default(true),
  includeYouTube: z.boolean().optional().default(false),
  forceRefresh: z.boolean().optional().default(false),
});

const companyEnrichmentSchema = z.object({
  includeInstagram: z.boolean().optional().default(true),
  includeTikTok: z.boolean().optional().default(true),
  includeCnpj: z.boolean().optional().default(true),
  includeWebsite: z.boolean().optional().default(true),
  forceRefresh: z.boolean().optional().default(false),
});

router.post('/creator/:id', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const creatorId = parseInt(req.params.id, 10);
    if (isNaN(creatorId)) {
      return res.status(400).json({ error: 'Invalid creator ID' });
    }

    if (!isAdminByEmail(user) && user.id !== creatorId) {
      return res.status(403).json({ error: 'You can only enrich your own profile or be an admin' });
    }

    const options = creatorEnrichmentSchema.parse(req.body);
    
    const result = await enrichmentService.enrichCreatorProfile(creatorId, options);

    res.json({
      success: result.success,
      creatorId,
      enrichedFields: result.enrichedFields,
      errors: result.errors,
      costEstimate: result.costEstimate,
      source: result.source,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

router.post('/company/:id', requireCompanyOrAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const companyId = parseInt(req.params.id, 10);
    if (isNaN(companyId)) {
      return res.status(400).json({ error: 'Invalid company ID' });
    }

    if (!isAdminByEmail(user)) {
      const [membership] = await db.select()
        .from(companyMembers)
        .where(and(
          eq(companyMembers.companyId, companyId),
          eq(companyMembers.userId, user.id)
        ))
        .limit(1);
      
      if (!membership) {
        return res.status(403).json({ error: 'You can only enrich companies you are a member of' });
      }
    }

    const options = companyEnrichmentSchema.parse(req.body);
    
    const result = await enrichmentService.enrichCompanyProfile(companyId, options);

    res.json({
      success: result.success,
      companyId,
      enrichedFields: result.enrichedFields,
      errors: result.errors,
      costEstimate: result.costEstimate,
      source: result.source,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

router.post('/my-profile', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'creator') {
      return res.status(403).json({ error: 'Only creators can enrich their own profile' });
    }

    const options = creatorEnrichmentSchema.parse(req.body);
    
    const result = await enrichmentService.enrichCreatorProfile(user.id, options);

    res.json({
      success: result.success,
      enrichedFields: result.enrichedFields,
      errors: result.errors,
      costEstimate: result.costEstimate,
      source: result.source,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

router.post('/my-company', requireCompanyOrAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const companyId = req.body.companyId;
    
    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    if (!isAdminByEmail(user)) {
      const [membership] = await db.select()
        .from(companyMembers)
        .where(and(
          eq(companyMembers.companyId, companyId),
          eq(companyMembers.userId, user.id)
        ))
        .limit(1);
      
      if (!membership) {
        return res.status(403).json({ error: 'You can only enrich companies you are a member of' });
      }
    }

    const options = companyEnrichmentSchema.parse(req.body);
    
    const result = await enrichmentService.enrichCompanyProfile(companyId, options);

    res.json({
      success: result.success,
      companyId,
      enrichedFields: result.enrichedFields,
      errors: result.errors,
      costEstimate: result.costEstimate,
      source: result.source,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

router.post('/company/:id/ecommerce', requireCompanyOrAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const companyId = parseInt(req.params.id, 10);
    if (isNaN(companyId)) {
      return res.status(400).json({ error: 'Invalid company ID' });
    }

    if (!isAdminByEmail(user)) {
      const [membership] = await db.select()
        .from(companyMembers)
        .where(and(
          eq(companyMembers.companyId, companyId),
          eq(companyMembers.userId, user.id)
        ))
        .limit(1);
      
      if (!membership) {
        return res.status(403).json({ error: 'You can only enrich companies you are a member of' });
      }
    }

    const forceRefresh = req.body.forceRefresh === true;
    const result = await enrichmentService.enrichCompanyEcommerce(companyId, { forceRefresh });

    res.json({
      success: result.success,
      companyId,
      enrichedFields: result.enrichedFields,
      errors: result.errors,
      costEstimate: result.costEstimate,
      source: result.source,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/company/:id/website', requireCompanyOrAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const companyId = parseInt(req.params.id, 10);
    if (isNaN(companyId)) {
      return res.status(400).json({ error: 'Invalid company ID' });
    }

    if (!isAdminByEmail(user)) {
      const [membership] = await db.select()
        .from(companyMembers)
        .where(and(
          eq(companyMembers.companyId, companyId),
          eq(companyMembers.userId, user.id)
        ))
        .limit(1);
      
      if (!membership) {
        return res.status(403).json({ error: 'You can only enrich companies you are a member of' });
      }
    }

    const forceRefresh = req.body.forceRefresh === true;
    const result = await enrichmentService.enrichCompanyProfile(companyId, {
      includeInstagram: false,
      includeTikTok: false,
      includeCnpj: false,
      includeWebsite: true,
      forceRefresh,
    });

    res.json({
      success: result.success,
      companyId,
      enrichedFields: result.enrichedFields,
      errors: result.errors,
      costEstimate: result.costEstimate,
      source: result.source,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const batchLimitSchema = z.object({
  limit: z.number().int().min(1).max(1000).optional().default(1000),
});

router.post('/batch/missing-pics', requireCompanyOrAdmin, async (req: Request, res: Response) => {
  try {
    const { limit } = batchLimitSchema.parse(req.body);
    console.log(`[API] Batch enrich missing profile pics requested (limit: ${limit})`);
    const result = await enrichmentService.batchEnrichMissingProfilePics(limit);
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    console.error('[API] Batch enrich missing pics error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/batch/missing-data', requireCompanyOrAdmin, async (req: Request, res: Response) => {
  try {
    const { limit } = batchLimitSchema.parse(req.body);
    console.log(`[API] Batch enrich missing data requested (limit: ${limit})`);
    const result = await enrichmentService.batchEnrichMissingData(limit);
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    console.error('[API] Batch enrich missing data error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/deep/:id', requireCompanyOrAdmin, async (req: Request, res: Response) => {
  try {
    const creatorId = parseInt(req.params.id, 10);
    if (isNaN(creatorId)) {
      return res.status(400).json({ error: 'Invalid creator ID' });
    }
    const forceRefresh = req.body.forceRefresh === true;
    console.log(`[API] Deep enrich requested for creator ${creatorId}`);
    const result = await enrichmentService.deepEnrichCreator(creatorId, { forceRefresh });
    res.json(result);
  } catch (error: any) {
    console.error('[API] Deep enrich error:', error);
    res.status(500).json({ error: error.message });
  }
});

const batchDeepSchema = z.object({
  creatorIds: z.array(z.number().int().positive()).min(1).max(20),
  forceRefresh: z.boolean().optional().default(false),
});

router.post('/batch/deep', requireCompanyOrAdmin, async (req: Request, res: Response) => {
  try {
    const { creatorIds, forceRefresh } = batchDeepSchema.parse(req.body);
    console.log(`[API] Batch deep enrich requested for ${creatorIds.length} creators`);
    const result = await enrichmentService.batchDeepEnrich(creatorIds, { forceRefresh });
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    console.error('[API] Batch deep enrich error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/queue/creators', requireCompanyOrAdmin, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const creatorIds = await enrichmentService.getCreatorsNeedingEnrichment(limit);
    
    res.json({
      count: creatorIds.length,
      creatorIds,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/queue/companies', requireCompanyOrAdmin, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const companyIds = await enrichmentService.getCompaniesNeedingEnrichment(limit);
    
    res.json({
      count: companyIds.length,
      companyIds,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
