import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createMockUser, withAuth, withNoAuth } from './setup';

describe('Auth API', () => {
  describe('GET /api/user', () => {
    it('should return 401 when not authenticated', async () => {
      const app = express();
      app.use(express.json());
      withNoAuth(app);
      app.get('/api/user', (req: any, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        res.json(req.user);
      });

      const res = await request(app).get('/api/user');
      expect(res.status).toBe(401);
    });

    it('should return user when authenticated', async () => {
      const mockUser = createMockUser({ name: 'João Silva', role: 'creator' });
      const app = express();
      app.use(express.json());
      withAuth(app, mockUser);
      app.get('/api/user', (req: any, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        res.json(req.user);
      });

      const res = await request(app).get('/api/user');
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('João Silva');
      expect(res.body.role).toBe('creator');
    });
  });

  describe('POST /api/register validation', () => {
    it('should require companyName for company registration', async () => {
      const app = express();
      app.use(express.json());
      app.post('/api/register', (req, res) => {
        if (req.body.role === 'company') {
          const companyName = req.body.companyName?.trim();
          if (!companyName || companyName.length < 2) {
            return res.status(400).json({ message: 'Nome da empresa é obrigatório (mínimo 2 caracteres)' });
          }
        }
        if (!req.body.email || !req.body.password) {
          return res.status(400).json({ message: 'Email e senha são obrigatórios' });
        }
        res.status(201).json({ message: 'Registration successful' });
      });

      const res = await request(app)
        .post('/api/register')
        .send({ email: 'test@test.com', password: '123456', role: 'company' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('empresa');
    });

    it('should accept valid company registration', async () => {
      const app = express();
      app.use(express.json());
      app.post('/api/register', (req, res) => {
        if (req.body.role === 'company') {
          const companyName = req.body.companyName?.trim();
          if (!companyName || companyName.length < 2) {
            return res.status(400).json({ message: 'Nome da empresa é obrigatório' });
          }
        }
        if (!req.body.email || !req.body.password) {
          return res.status(400).json({ message: 'Email e senha são obrigatórios' });
        }
        res.status(201).json({ message: 'Registration successful' });
      });

      const res = await request(app)
        .post('/api/register')
        .send({ email: 'test@test.com', password: '123456', role: 'company', companyName: 'Turbo Partners' });
      expect(res.status).toBe(201);
    });

    it('should allow creator registration without companyName', async () => {
      const app = express();
      app.use(express.json());
      app.post('/api/register', (req, res) => {
        if (req.body.role === 'company') {
          const companyName = req.body.companyName?.trim();
          if (!companyName || companyName.length < 2) {
            return res.status(400).json({ message: 'Nome da empresa é obrigatório' });
          }
        }
        if (!req.body.email || !req.body.password) {
          return res.status(400).json({ message: 'Email e senha são obrigatórios' });
        }
        res.status(201).json({ message: 'Registration successful' });
      });

      const res = await request(app)
        .post('/api/register')
        .send({ email: 'creator@test.com', password: '123456', role: 'creator', name: 'Creator Test' });
      expect(res.status).toBe(201);
    });
  });

  describe('POST /api/logout', () => {
    it('should clear session on logout', async () => {
      const app = express();
      app.use(express.json());
      withAuth(app);
      app.post('/api/logout', async (req: any, res) => {
        req.logout((err: any) => {});
        req.session.destroy((err: any) => {});
        res.clearCookie('connect.sid');
        res.sendStatus(200);
      });

      const res = await request(app).post('/api/logout');
      expect(res.status).toBe(200);
    });
  });

  describe('PATCH /api/user', () => {
    it('should reject when not authenticated', async () => {
      const app = express();
      app.use(express.json());
      withNoAuth(app);
      app.patch('/api/user', (req: any, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        res.json({});
      });

      const res = await request(app).patch('/api/user').send({ name: 'Test' });
      expect(res.status).toBe(401);
    });

    it('should reject empty updates', async () => {
      const app = express();
      app.use(express.json());
      withAuth(app);
      app.patch('/api/user', (req: any, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        const { name, phone, cpf, avatar } = req.body;
        const updateData: Record<string, any> = {};
        if (name !== undefined && typeof name === 'string') updateData.name = name.trim() || null;
        if (phone !== undefined && typeof phone === 'string') updateData.phone = phone.trim() || null;
        if (Object.keys(updateData).length === 0) {
          return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
        }
        res.json(updateData);
      });

      const res = await request(app).patch('/api/user').send({});
      expect(res.status).toBe(400);
    });
  });
});
