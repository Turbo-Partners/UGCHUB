import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createMockUser, withAuth, withNoAuth } from './setup';

// Mock storage for reviews
const mockStorage = {
  getCreatorAverageRating: vi.fn(),
  getCreatorReviews: vi.fn(),
  getExistingReview: vi.fn(),
  createCreatorReview: vi.fn(),
  updateCreatorReview: vi.fn(),
  getUser: vi.fn(),
};

function setupApp(authFn: (app: express.Express) => void) {
  const app = express();
  app.use(express.json());
  authFn(app);

  // GET /api/users/:userId/rating
  app.get('/api/users/:userId/rating', async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const result = await mockStorage.getCreatorAverageRating(userId);
      res.json(result);
    } catch {
      res.status(500).json({ error: 'Erro ao buscar avaliacao' });
    }
  });

  // GET /api/users/:userId/reviews
  app.get('/api/users/:userId/reviews', async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const reviews = await mockStorage.getCreatorReviews(userId);
      res.json(reviews);
    } catch {
      res.status(500).json({ error: 'Erro ao buscar avaliacoes' });
    }
  });

  // POST /api/users/:userId/reviews
  app.post('/api/users/:userId/reviews', async (req: any, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== 'company') return res.sendStatus(403);

    try {
      const creatorId = parseInt(req.params.userId);
      const companyId = req.session.activeCompanyId;
      if (!companyId) return res.status(400).json({ error: 'Empresa nao selecionada' });

      const { rating, comment, campaignId } = req.body;
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating deve ser entre 1 e 5' });
      }

      const existing = await mockStorage.getExistingReview(
        companyId,
        creatorId,
        campaignId || null,
      );
      if (existing) {
        const updated = await mockStorage.updateCreatorReview(existing.id, { rating, comment });
        return res.json(updated);
      }

      const review = await mockStorage.createCreatorReview({
        creatorId,
        companyId,
        campaignId: campaignId || null,
        rating,
        comment: comment || null,
      });
      res.status(201).json(review);
    } catch {
      res.status(500).json({ error: 'Erro ao criar avaliacao' });
    }
  });

  // GET /api/public/creator/:id/rating
  app.get('/api/public/creator/:id/rating', async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await mockStorage.getUser(id);
      if (!user || user.role !== 'creator') return res.sendStatus(404);
      const rating = await mockStorage.getCreatorAverageRating(id);
      res.json(rating);
    } catch {
      res.status(500).json({ error: 'Erro ao buscar rating' });
    }
  });

  return app;
}

describe('Reviews API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/users/:userId/reviews', () => {
    it('should create a review (status 201)', async () => {
      const mockReview = {
        id: 1,
        creatorId: 5,
        companyId: 1,
        campaignId: null,
        rating: 4,
        comment: 'Otimo trabalho',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockStorage.getExistingReview.mockResolvedValue(undefined);
      mockStorage.createCreatorReview.mockResolvedValue(mockReview);

      const app = setupApp((a) => withAuth(a, createMockUser({ role: 'company' })));
      const res = await request(app)
        .post('/api/users/5/reviews')
        .send({ rating: 4, comment: 'Otimo trabalho' });

      expect(res.status).toBe(201);
      expect(res.body.rating).toBe(4);
      expect(res.body.comment).toBe('Otimo trabalho');
      expect(mockStorage.createCreatorReview).toHaveBeenCalledWith({
        creatorId: 5,
        companyId: 1,
        campaignId: null,
        rating: 4,
        comment: 'Otimo trabalho',
      });
    });

    it('should update existing review (upsert)', async () => {
      const existingReview = { id: 10, rating: 3, comment: 'ok' };
      const updatedReview = { ...existingReview, rating: 5, comment: 'Excelente' };
      mockStorage.getExistingReview.mockResolvedValue(existingReview);
      mockStorage.updateCreatorReview.mockResolvedValue(updatedReview);

      const app = setupApp((a) => withAuth(a, createMockUser({ role: 'company' })));
      const res = await request(app)
        .post('/api/users/5/reviews')
        .send({ rating: 5, comment: 'Excelente' });

      expect(res.status).toBe(200);
      expect(res.body.rating).toBe(5);
      expect(mockStorage.updateCreatorReview).toHaveBeenCalledWith(10, {
        rating: 5,
        comment: 'Excelente',
      });
    });

    it('should reject without auth (401)', async () => {
      const app = setupApp((a) => withNoAuth(a));
      const res = await request(app).post('/api/users/5/reviews').send({ rating: 4 });

      expect(res.status).toBe(401);
    });

    it('should reject non-company role (403)', async () => {
      const app = setupApp((a) => withAuth(a, createMockUser({ role: 'creator' })));
      const res = await request(app).post('/api/users/5/reviews').send({ rating: 4 });

      expect(res.status).toBe(403);
    });

    it('should validate rating 1-5', async () => {
      const app = setupApp((a) => withAuth(a, createMockUser({ role: 'company' })));

      const res0 = await request(app).post('/api/users/5/reviews').send({ rating: 0 });
      expect(res0.status).toBe(400);

      const res6 = await request(app).post('/api/users/5/reviews').send({ rating: 6 });
      expect(res6.status).toBe(400);

      const resNull = await request(app).post('/api/users/5/reviews').send({});
      expect(resNull.status).toBe(400);
    });
  });

  describe('GET /api/users/:userId/reviews', () => {
    it('should return reviews with companyName', async () => {
      const mockReviews = [
        {
          id: 1,
          creatorId: 5,
          companyId: 1,
          rating: 4,
          comment: 'Bom',
          companyName: 'Empresa Test',
          campaignTitle: 'Campanha X',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      mockStorage.getCreatorReviews.mockResolvedValue(mockReviews);

      const app = setupApp((a) => withAuth(a));
      const res = await request(app).get('/api/users/5/reviews');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].companyName).toBe('Empresa Test');
      expect(res.body[0].rating).toBe(4);
    });
  });

  describe('GET /api/users/:userId/rating', () => {
    it('should return average and count', async () => {
      mockStorage.getCreatorAverageRating.mockResolvedValue({ average: 4.5, count: 10 });

      const app = setupApp((a) => withAuth(a));
      const res = await request(app).get('/api/users/5/rating');

      expect(res.status).toBe(200);
      expect(res.body.average).toBe(4.5);
      expect(res.body.count).toBe(10);
    });
  });

  describe('GET /api/public/creator/:id/rating', () => {
    it('should return rating for valid creator', async () => {
      mockStorage.getUser.mockResolvedValue({ id: 5, role: 'creator' });
      mockStorage.getCreatorAverageRating.mockResolvedValue({ average: 4.2, count: 3 });

      const app = setupApp((a) => withNoAuth(a));
      const res = await request(app).get('/api/public/creator/5/rating');

      expect(res.status).toBe(200);
      expect(res.body.average).toBe(4.2);
      expect(res.body.count).toBe(3);
    });

    it('should return 404 for non-creator', async () => {
      mockStorage.getUser.mockResolvedValue({ id: 5, role: 'company' });

      const app = setupApp((a) => withNoAuth(a));
      const res = await request(app).get('/api/public/creator/5/rating');

      expect(res.status).toBe(404);
    });

    it('should return 404 for non-existent user', async () => {
      mockStorage.getUser.mockResolvedValue(null);

      const app = setupApp((a) => withNoAuth(a));
      const res = await request(app).get('/api/public/creator/999/rating');

      expect(res.status).toBe(404);
    });
  });
});
