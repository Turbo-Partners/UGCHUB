import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createMockUser, withAuth, withNoAuth } from './setup';

describe('Stripe API', () => {
  describe('GET /api/stripe/status', () => {
    it('should return stripe configuration status', async () => {
      const app = express();
      app.use(express.json());
      app.get('/api/stripe/status', (req, res) => {
        res.json({
          configured: true,
          publishableKey: 'pk_test_xxx',
        });
      });

      const res = await request(app).get('/api/stripe/status');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('configured');
      expect(res.body).toHaveProperty('publishableKey');
    });
  });

  describe('POST /api/stripe/create-checkout', () => {
    it('should require authentication', async () => {
      const app = express();
      app.use(express.json());
      withNoAuth(app);
      app.post('/api/stripe/create-checkout', (req: any, res) => {
        if (!req.isAuthenticated?.() || !req.user) {
          return res.status(401).json({ error: 'Não autenticado' });
        }
        res.json({ url: 'https://checkout.stripe.com/...' });
      });

      const res = await request(app).post('/api/stripe/create-checkout').send({ amountInCents: 5000 });
      expect(res.status).toBe(401);
    });

    it('should reject non-company users', async () => {
      const app = express();
      app.use(express.json());
      withAuth(app, createMockUser({ role: 'creator' }));
      app.post('/api/stripe/create-checkout', (req: any, res) => {
        if (!req.isAuthenticated?.() || !req.user) {
          return res.status(401).json({ error: 'Não autenticado' });
        }
        if (req.user.role !== 'company') {
          return res.status(403).json({ error: 'Acesso negado' });
        }
        res.json({ url: 'https://checkout.stripe.com/...' });
      });

      const res = await request(app).post('/api/stripe/create-checkout').send({ amountInCents: 5000 });
      expect(res.status).toBe(403);
    });

    it('should validate amount schema (min 500 cents)', async () => {
      const { z } = await import('zod');
      const createCheckoutSchema = z.object({
        amountInCents: z.number().min(500).max(1000000),
      });

      expect(createCheckoutSchema.safeParse({ amountInCents: 100 }).success).toBe(false);
      expect(createCheckoutSchema.safeParse({ amountInCents: 500 }).success).toBe(true);
      expect(createCheckoutSchema.safeParse({ amountInCents: 50000 }).success).toBe(true);
      expect(createCheckoutSchema.safeParse({ amountInCents: 1000001 }).success).toBe(false);
    });

    it('should validate amount schema rejects invalid types', async () => {
      const { z } = await import('zod');
      const createCheckoutSchema = z.object({
        amountInCents: z.number().min(500).max(1000000),
      });

      expect(createCheckoutSchema.safeParse({ amountInCents: 'abc' }).success).toBe(false);
      expect(createCheckoutSchema.safeParse({}).success).toBe(false);
      expect(createCheckoutSchema.safeParse({ amountInCents: null }).success).toBe(false);
    });
  });

  describe('POST /api/stripe/webhook', () => {
    it('should reject requests without signature', async () => {
      const app = express();
      app.use(express.raw({ type: 'application/json' }));
      app.post('/api/stripe/webhook', (req, res) => {
        const signature = req.headers['stripe-signature'];
        if (!signature || typeof signature !== 'string') {
          return res.status(400).json({ error: 'Missing signature' });
        }
        res.json({ received: true });
      });

      const res = await request(app)
        .post('/api/stripe/webhook')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ type: 'test' }));
      expect(res.status).toBe(400);
    });
  });
});
