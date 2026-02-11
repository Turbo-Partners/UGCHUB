# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language & Communication

Communicate in **Português (Brasil)**, linguagem simples e direta.

## Commands

```bash
npm run dev              # Full-stack dev server (Express + Vite on port 5000)
npm run dev:client       # Client-only dev server (Vite on port 5000)
npm run build            # Production build (Vite → dist/public, esbuild → dist/index.js)
npm run start            # Production server
npm run check            # TypeScript type checking
npm run db:push          # Push schema changes to database (Drizzle Kit)
npm run test             # Run tests (vitest run)
npm run test:watch       # Watch mode tests
```

Tests live in `server/__tests__/` and use Vitest + Supertest.

## Architecture

**Full-stack TypeScript app** — React frontend (Vite) + Express backend + PostgreSQL (Drizzle ORM).

### Project Layout

- `client/src/` — React frontend (pages, components, hooks, lib)
- `server/` — Express backend (routes, services, jobs, auth)
- `shared/schema.ts` — **Single source of truth** for all database schemas, Zod validations, and TypeScript types (~3900 lines, 12+ PostgreSQL schemas, 45+ tables)
- `shared/constants.ts` — Shared enums (niches, platforms, content formats, Brazilian states)
- `migrations/` — Drizzle ORM migration files

### Path Aliases (tsconfig & vite)

- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets/*` → `attached_assets/*`

### Frontend Stack

- **Routing**: Wouter with role-based `<ProtectedRoute>` guards
- **Data fetching**: TanStack React Query — use `apiRequest()` from `client/src/lib/queryClient.ts`
- **UI**: shadcn/ui (New York style) + Radix UI + Tailwind CSS v4
- **Forms**: React Hook Form + Zod resolvers
- **State**: React Query cache as global state via `MarketplaceProvider` in `client/src/lib/provider.tsx`

### Backend Stack

- **Auth**: Passport.js (local + Google OAuth), session-based with PostgreSQL store (`connect-pg-simple`). See `server/auth.ts`.
- **Roles**: `creator`, `company`, `admin` — each with distinct dashboards and API access
- **Routes**: Main consolidated file `server/routes.ts` + modular files in `server/routes/` (instagram, messaging, stripe, meta-marketing, etc.)
- **Services**: Business logic in `server/services/` (enrichment, apify, instagram, stripe, etc.)
- **Storage layer**: `server/storage.ts` — centralized data access interface over Drizzle
- **WebSocket**: Real-time notifications, chat, DM sync via `ws`
- **Background jobs**: `server/jobs/` — cron-based (metrics every 15min, weekly emails, daily enrichment)

### Database

Multi-schema PostgreSQL: `core`, `campaign`, `creator`, `brand`, `content`, `messaging`, `gamification`, `analytics`, `billing`, `academy`, `social`, `system`, `misc`.

Schema changes: edit `shared/schema.ts` then run `npm run db:push`.

## Key Design Decisions

1. **Data Extraction Hierarchy (LOCAL FIRST)**: Local DB → Free Meta APIs (Business Discovery) → Apify (paid, last resort). Minimize Apify costs.
2. **Profile Pictures**: All Instagram profile pics MUST be saved to Object Storage (permanent URLs via `/api/storage/public/...`). Never save CDN URLs directly. Service: `server/services/instagram-profile-pic.ts`.
3. **Two Apify files**: `server/apify-service.ts` (TikTok metrics/hashtags) vs `server/services/apify.ts` (profile/post scraping with caching). Both needed.
4. **Session-based auth** (not JWT) — enables admin impersonation and PostgreSQL-backed sessions.
5. **Zod validation**: All POST/PUT route bodies must be validated with Zod schemas.
6. **UTM Parameters**: External links should include `utm_source=creatorconnect, utm_medium=<local>, utm_campaign=<contexto>`.

## Environment Variables

Required: `DATABASE_URL`, `APP_PORT`, `NODE_ENV`. See `.env` for full list including Google OAuth, OpenAI, SendGrid, Stripe, and Meta API keys.

## Deployment

Deployed on Replit (autoscale). Production domain: `ugc.turbopartners.com.br`.
