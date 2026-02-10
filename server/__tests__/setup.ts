import express from 'express';
import session from 'express-session';
import passport from 'passport';

export function createMockUser(overrides = {}) {
  return {
    id: 1,
    email: 'test@test.com',
    name: 'Test User',
    role: 'company',
    ...overrides,
  };
}

export function withAuth(app: express.Express, user = createMockUser()) {
  app.use((req: any, res, next) => {
    req.isAuthenticated = () => true;
    req.user = user;
    req.session = {
      activeCompanyId: 1,
      impersonation: null,
      save: (cb: any) => cb?.(),
      destroy: (cb: any) => cb?.(),
    };
    req.logIn = (u: any, cb: any) => cb?.();
    req.logout = (cb: any) => cb?.();
    next();
  });
}

export function withNoAuth(app: express.Express) {
  app.use((req: any, res, next) => {
    req.isAuthenticated = () => false;
    req.user = null;
    req.session = {};
    next();
  });
}
