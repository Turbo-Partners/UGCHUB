# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language & Communication

Communicate in **Português (Brasil)**, linguagem simples e direta.

## O que é este projeto

**CreatorConnect (UGC HUB)** — plataforma de influencer marketing que conecta marcas a criadores de conteúdo. Gerencia campanhas UGC, comunidades, gamificação, pagamentos e integrações com redes sociais.

**Roles**: `creator` (descobre oportunidades, participa de campanhas, Academy), `company` (gerencia creators, campanhas, Brand Hub, comunidades), `admin` (controle total, impersonation, feature flags).

**Domínios funcionais**: Marketplace de creators, campanhas com deliverables/tracking/rewards, Brand Hub (workspace centralizado por marca), comunidades/membership com gamificação e leaderboards, Instagram Integration (OAuth, Hashtag Tracking, Comments AI, Publishing, Partnership Ads, DM Management, CRM Social), TikTok Integration (OAuth, métricas), Academy educacional, sistema de wallet/pagamentos, inspirations (swipe file), blog, contratos digitais (Assinafy).

## Commands

```bash
npm run dev              # Full-stack dev (Express + Vite HMR, porta 5000)
npm run dev:client       # Client-only (Vite, porta 5000)
npm run build            # Build (Vite → dist/public, esbuild → dist/index.js)
npm run start            # Production (cross-env NODE_ENV=production node dist/index.js)
npm run check            # TypeScript check (tsc com noEmit via tsconfig)
npm run db:push          # Push schema → database (drizzle-kit push)
npm run test             # vitest run (47 tests, 4 files)
npm run test:watch       # vitest watch mode
```

## Architecture

**Full-stack TypeScript** — React 19.2 (Vite 7.1) + Express 4.21 + PostgreSQL (Drizzle ORM 0.39).

### Project Layout

```
client/src/
  ├── pages/             # ~111 pages (creator/33, company/41, admin/9, public, auth, misc)
  ├── components/        # ~47 componentes custom + gamification/ + ui/ (72 shadcn)
  ├── hooks/             # 6 hooks (toast, upload, facebook-sdk, tiktok, view-preference, mobile)
  └── lib/               # queryClient, provider, brand-context, nav-config, routes, utils, cep
server/
  ├── routes.ts          # Arquivo principal (~10.000 linhas, ~300 endpoints)
  ├── routes/            # 15 módulos de rotas (~10.000 linhas, ~200 endpoints)
  ├── services/          # 16 serviços de negócio
  ├── jobs/              # 6 background jobs (cron)
  ├── auth.ts            # Passport.js (local + Google OAuth)
  ├── storage.ts         # Data access layer (~5.900 linhas, 100+ métodos)
  ├── websocket.ts       # WebSocket server (/ws/notifications)
  ├── email.ts           # SendGrid templates (~1.750 linhas)
  ├── db.ts              # Drizzle + pg Pool
  ├── lib/object-storage.ts # Google Cloud Storage (upload de mídia)
  ├── contract-pdf.ts    # Geração de contratos PDF (PDFKit)
  ├── assinafy.ts        # Integração Assinafy (assinatura digital)
  └── apify-service.ts   # Apify TikTok service (legacy)
shared/
  ├── schema.ts          # Single source of truth: 14 schemas, 91 tabelas, Zod, types (~3.800 linhas)
  ├── constants.ts       # Enums (nichos, plataformas, formatos, estados BR)
  └── utils.ts           # Utilitários compartilhados
migrations/              # Drizzle migration files
```

### Path Aliases

- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets/*` → `attached_assets/*`

### Frontend Stack

| Aspecto | Tecnologia |
|---------|-----------|
| **Routing** | Wouter 3.3 com `<ProtectedRoute>` role-based |
| **Data fetching** | TanStack React Query 5.60 — `apiRequest()` em `client/src/lib/queryClient.ts` |
| **UI** | shadcn/ui (New York style) + Radix UI + Tailwind CSS v4 |
| **Forms** | React Hook Form 7.66 + `zodResolver` |
| **Animations** | Motion 12 (`motion` package) |
| **State** | React Query cache via `MarketplaceProvider` (`client/src/lib/provider.tsx`) |
| **Charts** | Recharts 2.15 |
| **Icons** | Lucide React |
| **Toast** | Sonner + custom `use-toast` hook |
| **Upload** | Uppy (AWS S3 presigned) + Multer (server-side) |
| **DnD** | @dnd-kit |
| **Onboarding** | Driver.js (guided tours) |
| **PDF** | PDFKit (contratos) |

### Frontend Routes

**Creator** (rotas raiz, definidas em `client/src/lib/routes.ts`):
- `/home` — Dashboard | `/explore` — Feed/Descoberta
- `/campaigns` — Campanhas | `/campaigns/:id/workspace` — Workspace
- `/brands` — Marcas parceiras | `/brands/:brandId` — Brand Hub
- `/wallet` — Saldo e transações | `/academy` — Cursos
- `/inspirations` — Swipe file | `/settings` — Configurações
- `/messages` — Mensagens | `/notifications` — Notificações
- `/invites` — Convites | `/profile` — Perfil
- `/ranking` — Leaderboard

**Company** (`/company/*`, brand-centric):
- `/company/home` — Dashboard | `/company/brands` — Lista de marcas
- `/company/brand/:brandId/overview` — Overview da marca
- `/company/brand/:brandId/campaigns` — Campanhas
- `/company/brand/:brandId/discovery` — Descobrir creators
- `/company/brand/:brandId/community` — Comunidade
- `/company/brand/:brandId/operations` — Operações (Kanban)
- `/company/brand/:brandId/tracking` — Tracking
- `/company/brand/:brandId/content` — Content Library
- `/company/brand/:brandId/messages` — Mensagens
- `/company/brand/:brandId/program` — Programa (tiers, gamificação, rewards)
- `/company/brand/:brandId/settings` — Configurações
- `/company/settings` — Settings gerais

**Admin** (`/admin/*`):
- `/admin` — Dashboard | `/admin/users` — Gestão de usuários
- `/admin/campaigns` — Todas campanhas | `/admin/financial` — Financeiro
- `/admin/support` — Reports/Tickets | `/admin/modules` — Feature flags
- `/admin/content` — Conteúdo | `/admin/gamification` — Gamificação

### Backend Stack

- **Auth**: Passport.js (local + Google OAuth), sessões PostgreSQL (`connect-pg-simple`). Session data: `activeCompanyId`, `impersonation`, `googleAuthRole`, `tiktokOAuthState`.
- **Roles**: `creator`, `company`, `admin` — middleware `isAdmin` para rotas admin.
- **WebSocket**: `server/websocket.ts` — path `/ws/notifications`. Events: `notification`, `message:new`, `campaign:briefing_updated`, `deliverable:created`, `application:created`, `instagram_dm`, `dm_sync_progress`.
- **Dev login**: `POST /api/dev/login` — apenas em `NODE_ENV=development`.

### Route Organization

**~500 endpoints totais** distribuídos entre `routes.ts` e módulos em `server/routes/`.

**Main file** (`server/routes.ts` ~10.000 linhas, ~300 endpoints): Auth, users, campaigns, applications, deliverables, notifications, favorites, company management, workflow stages, gamification, wallet, community, academy, inspirations, tags, enrichment, brand settings.

**Modular routes** (`server/routes/`, ~200 endpoints):

| Arquivo | Endpoints | Domínio |
|---------|-----------|---------|
| `instagram.routes.ts` | 45 | OAuth, conta, posts, comentários, DMs, hashtags, publishing, stories, contacts CRM |
| `meta-marketing.routes.ts` | 30 | Meta Ads, Partnership Ads, ad accounts |
| `apify.routes.ts` | 29 | Gestão de data sources, estimativas de custo |
| `messaging.routes.ts` | 18 | Conversas, mensagens, read receipts |
| `campaign.routes.ts` | 12 | CRUD avançado de campanhas, templates, briefings |
| `enrichment.routes.ts` | 12 | Enrichment de perfis de creators e empresas |
| `user.routes.ts` | 11 | Perfil, endereços, conexões sociais |
| `hashtag.routes.ts` | 8 | Busca e tracking de hashtags |
| `blog.routes.ts` | 7 | CRUD de posts do blog |
| `publishing.routes.ts` | 7 | Publicação de conteúdo Instagram |
| `tiktok.routes.ts` | 6 | OAuth, perfil, vídeos, métricas |
| `comments.routes.ts` | 6 | Gestão de comentários Instagram |
| `stripe.routes.ts` | 4 | Checkout, webhooks, status |
| `brand-canvas.routes.ts` | 9 | Brand Canvas V2 AI-powered (pipeline, visual identity, voice) |

### Services Reference

| Serviço | Arquivo | Responsabilidade |
|---------|---------|-----------------|
| **Instagram** | `services/instagram.ts` | OAuth, account management, DM sync |
| **Instagram Comments** | `services/instagram-comments.ts` | Fetch comments, reply, sentiment analysis |
| **Instagram Publishing** | `services/instagram-publishing.ts` | Publish images, carousels, reels, stories |
| **Instagram Hashtags** | `services/instagram-hashtags.ts` | Search hashtags (30/week quota), fetch media |
| **Instagram Profile Pic** | `services/instagram-profile-pic.ts` | Download + persist pics to Object Storage |
| **Instagram Contacts** | `services/instagram-contacts.ts` | CRM: upsert contacts, record interactions, scoring |
| **Business Discovery** | `services/business-discovery.ts` | Free Meta API lookup for external profiles |
| **Apify (Core)** | `services/apify.ts` | Batch scraping (Instagram, TikTok, YouTube, e-commerce) |
| **Apify Presets** | `services/apify-presets.ts` | High-level workflows, cost estimation |
| **Apify Legacy** | `apify-service.ts` | TikTok metrics/hashtags (root-level) |
| **TikTok** | `services/tiktok.ts` | TikTok OAuth v2, user info, video listing |
| **Enrichment** | `services/enrichment.ts` | Multi-source profile enrichment |
| **Creator Enrichment** | `services/creator-enrichment.ts` | BD API (free) → Apify (paid) fallback |
| **Company Enrichment** | `services/company-enrichment.ts` | CNPJ (ReceitaWS), website (Apify), Instagram, Gemini AI |
| **Stripe** | `services/stripe.ts` | Checkout sessions, webhook handling |
| **Brand Canvas** | `services/brand-canvas.ts` | AI pipeline V2: visual identity, voice, content strategy (Gemini + Claude) |
| **Cleanup** | `services/cleanup.ts` | Auto-cleanup: notifications (90d), logs (30d) |

### Storage Layer (`server/storage.ts`)

Interface `IStorage` com 100+ métodos. Categorias principais:

- **Users** (20+): CRUD, getCreators, getCreatorsForMatching, scoreCreatorForCampaign
- **Campaigns** (10+): CRUD, getQualifiedCampaignsForCreator, briefings
- **Applications** (15+): CRUD, workflow status, seeding tracking
- **Deliverables** (8+): CRUD, comments with user data
- **Notifications** (8+): CRUD, unread count, batch mark as read
- **Companies** (15+): Multi-tenant CRUD, members, roles (owner/admin/member)
- **Invites** (8+): Campaign invites, company user invites, community invites
- **Workflow Stages** (6+): CRUD, reorder, default stages
- **Favorites** (10+): Creators ↔ Companies bidirectional
- **Gamification** (20+): Points, badges, leaderboards, scoring rules, caps
- **Wallet** (10+): Company wallets, creator balances, transactions, pay creator
- **Community** (10+): Memberships, invites, tiers
- **Academy** (4+): Courses, modules, lessons, progress
- **Messaging** (10+): Conversations, messages, read tracking
- **Tags** (6+): Creator, brand, campaign taxonomy
- **Admin** (10+): Stats, user management, ban, reports, activity feed

### Background Jobs

| Job | Schedule | Descrição |
|-----|----------|-----------|
| `metricsProcessor.ts` | A cada 15 min | Calcula pontos de gamificação, recalcula leaderboards |
| `weeklyEmailJob.ts` | Segunda 9h (`0 9 * * 1`) | Relatório semanal para empresas (applications, deliverables) |
| `autoEnrichmentJob.ts` | Event-driven + diário | Enriquece perfis de creators (pics + dados) |
| `companyEnrichmentJob.ts` | Domingo 3h (`0 3 * * 0`) | Re-enriquece empresas (CNPJ, website, Instagram) |
| `brandCanvasRefreshJob.ts` | 1o Domingo/mês 4h BRT (`0 7 1-7 * 0`) | Refresh mensal de Brand Canvas (re-enriquecimento IA) |
| `cleanup` | A cada 24h | Remove notificações antigas e logs |
| `apifySyncJob.ts` | **DISABLED** | Sync batch de perfis Instagram |

### Database

**14 PostgreSQL schemas**, **91 tabelas**, **91 Zod insert schemas**, **192 types exportados**.

| Schema | Tabelas principais |
|--------|-------------------|
| `core` | `users`, `companies`, `companyMembers`, `companyUserInvites`, `notifications` |
| `company` | Company-specific tables |
| `campaign` | `campaigns`, `applications`, `deliverables`, `deliverableComments`, `campaignTemplates`, `campaignInvites`, `campaignHashtags`, `campaignCoupons`, `campaignPointsRules`, `campaignInspirations` |
| `creator` | `creatorPosts`, `creatorAnalyticsHistory`, `creatorHashtags`, `creatorLevels`, `creatorPoints`, `creatorBadges`, `creatorAddresses`, `creatorDiscoveryProfiles`, `creatorAdPartners`, `creatorAuthLinks` |
| `brand` | `brandSettings`, `brandPrograms`, `brandRewards`, `brandTierConfigs`, `brandCreatorTiers`, `brandCreatorMemberships` |
| `content` | `inspirations`, `inspirationCollections`, `creatorSavedInspirations`, `campaignInspirations`, `blogPosts` |
| `messaging` | `conversations`, `convMessages`, `messageReads` |
| `gamification` | `campaignPrizes`, `pointsLedger`, `campaignCreatorStats`, `campaignMetricSnapshots`, `rewardEntitlements` |
| `analytics` | `profileSnapshots` |
| `billing` | `companyWallets`, `walletBoxes`, `creatorBalances`, `walletTransactions`, `paymentBatches`, `salesTracking`, `creatorCommissions` |
| `academy` | `courses`, `courseModules`, `courseLessons`, `creatorCourseProgress`, `creatorLessonProgress` |
| `social` | `instagramAccounts`, `instagramProfiles`, `instagramPosts`, `instagramMessages`, `instagramTaggedPosts`, `instagramContacts`, `instagramInteractions`, `tiktokProfiles`, `tiktokVideos`, `youtubeChannels`, `youtubeVideos`, `dmTemplates`, `dmSendLogs`, `metaAdAccounts`, `metaBusinessManagers`, `metaAdAccountsList` |
| `system` | `featureFlags`, `integrationLogs`, `dataSourceRegistry` |
| `misc` | `problemReports`, `workflowStages`, `hashtagSearches`, `hashtagPosts`, `communityInvites`, `tags`, `creatorTags`, `brandTags`, `campaignTags`, `contactNotes` |

Schema changes: edit `shared/schema.ts` then `npm run db:push`.

## External Services

| Serviço | Uso | Custo |
|---------|-----|-------|
| **Instagram/Meta Graph API** | OAuth, métricas, comments, publishing, DMs, hashtags | Free (com token) |
| **Meta Business Discovery API** | Lookup gratuito de perfis externos | Free |
| **Meta Marketing API** | Partnership Ads, ad accounts | Free (com permissões) |
| **Meta Content Publishing API** | Posts, carousels, reels, stories | Free |
| **TikTok API v2** | OAuth, user info, video listing | Free |
| **Apify** | Scraping on-demand (último recurso) | ~$2.60/1k profiles |
| **OpenAI** | Sentiment analysis, sugestões de conteúdo | Pay-per-use |
| **Google Gemini AI** | Análise de websites, geração de descrições | Pay-per-use |
| **Anthropic Claude** | AI integrations (`@anthropic-ai/sdk`) | Pay-per-use |
| **Stripe** | Checkout (card + boleto), webhooks | % por transação |
| **SendGrid** | Emails transacionais | Free tier / Pay |
| **ReceitaWS** | CNPJ lookup para empresas brasileiras | Free |
| **Assinafy** | Assinatura digital de contratos | Pay-per-use |
| **Google Cloud SQL** | PostgreSQL (produção) | Pay-per-use |
| **Google Cloud Storage** | Upload de arquivos e mídia | Pay-per-use |

**Apify Actors usados**: `apify/instagram-api-scraper`, `apify/instagram-profile-scraper`, `clockworks/tiktok-scraper`, `streamers/youtube-scraper`, `apify/e-commerce-scraping-tool`, `apify/influencer-discovery-agent`.

## Key Design Decisions

1. **Data Extraction Hierarchy (LOCAL FIRST)**: Local DB → Free Meta APIs (Business Discovery) → Apify (paid, last resort). Minimizar custos Apify ($0.0005/profile BD vs $0.0026/profile Apify).
2. **Profile Pictures**: Todas as fotos de perfil Instagram DEVEM ser salvas no Google Cloud Storage (URLs permanentes via `/api/storage/public/...`). Nunca salvar CDN URLs diretamente. Service: `server/services/instagram-profile-pic.ts`.
3. **Dois arquivos Apify**: `server/apify-service.ts` (TikTok legacy) vs `server/services/apify.ts` (core service com todos actors). Ambos necessários.
4. **Session-based auth** (não JWT) — habilita admin impersonation e sessões PostgreSQL-backed.
5. **Zod validation**: Todos os POST/PUT bodies devem ser validados com Zod schemas. Erros Zod retornam `400` com detalhes.
6. **UTM Parameters**: Links externos devem incluir `utm_source=creatorconnect, utm_medium=<local>, utm_campaign=<contexto>`.
7. **Valores monetários em centavos**: Wallet, transações e comissões usam `integer` em centavos (R$ 10,00 = 1000).
8. **Multi-tenant**: Empresas são `companies` separadas de `users`. Usuário pode pertencer a múltiplas empresas com roles (owner/admin/member). Sessão tem `activeCompanyId`.
9. **Monolito modular**: `routes.ts` é o arquivo principal (~10.000 linhas). Novas features complexas devem ser criadas em `server/routes/` como módulos separados.
10. **Brand-centric company**: Rotas da empresa são centradas em brand (`/company/brand/:brandId/...`). Routing config em `client/src/lib/routes.ts`.

## Code Patterns

### API Responses
```typescript
// Success
res.json(data)                           // 200 OK
res.status(201).json(data)               // Created
res.sendStatus(204)                       // No content

// Errors
res.sendStatus(401)                       // Unauthenticated
res.sendStatus(403)                       // Forbidden
res.status(400).json({ error: "msg" })    // Bad request
res.status(404).json({ error: "msg" })    // Not found
res.status(500).json({ error: "msg" })    // Internal error
```

### Error Handling
```typescript
try {
  const validated = schema.parse(req.body);
  const result = await storage.method(validated);
  res.json(result);
} catch (error) {
  if (error instanceof z.ZodError) {
    return res.status(400).json(error.errors);
  }
  console.error("Context:", error);
  res.status(500).json({ error: "Failed to..." });
}
```

### TanStack Query
```typescript
// Queries — queryKey usa o path da API
const { data } = useQuery<Type>({ queryKey: ["/api/endpoint"] });

// Com condição
const { data } = useQuery({ queryKey: ["/api/endpoint"], enabled: !!user });

// 401 retorna null (auth-aware)
const { data: user } = useQuery<User | null>({
  queryKey: ['/api/user'],
  queryFn: getQueryFn({ on401: "returnNull" }),
});

// Mutations
const mutation = useMutation({
  mutationFn: async (data) => {
    const res = await apiRequest('POST', '/api/endpoint', data);
    return res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/endpoint'] });
    toast({ title: "Sucesso!" });
  },
});
```

### Forms (React Hook Form + Zod)
```typescript
const schema = z.object({ title: z.string().min(5), ... });
const form = useForm({ resolver: zodResolver(schema), defaultValues: { title: "" } });

<Form {...form}>
  <FormField control={form.control} name="title" render={({ field }) => (
    <FormItem>
      <FormLabel>Título</FormLabel>
      <FormControl><Input {...field} /></FormControl>
      <FormMessage />
    </FormItem>
  )} />
</Form>
```

### Auth Guards (rotas backend)
```typescript
// Middleware pattern
if (!req.isAuthenticated()) return res.sendStatus(401);
if (req.user.role !== 'company') return res.sendStatus(403);

// Admin guard
const isAdmin = (req, res, next) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  if (req.user.role !== 'admin') return res.sendStatus(403);
  next();
};
```

## Testing

**Framework**: Vitest 4.0 + Supertest 7.2 | **Config**: `vitest.config.ts`

**4 test files** em `server/__tests__/`:
- `auth.test.ts` (8 tests) — register, login, logout, user update
- `brand-canvas.test.ts` (25 tests) — pipeline steps, API endpoints, job scheduling
- `messaging.test.ts` (8 tests) — DM sync, profile pic hierarchy, rate limiting
- `stripe.test.ts` (6 tests) — status, checkout creation, webhook validation

**Test helpers** (`server/__tests__/setup.ts`):
- `createMockUser(overrides)` — factory de usuário mock
- `withAuth(app, user)` — injeta sessão autenticada
- `withNoAuth(app)` — simula não-autenticado

**Pattern de teste**:
```typescript
const app = express();
app.use(express.json());
withAuth(app, createMockUser({ role: 'company' }));
// register routes...
const res = await request(app).get('/api/endpoint');
expect(res.status).toBe(200);
```

## Environment Variables

**Required**: `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV`

**Auth**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_PASSWORD`

**APIs**: `OPENAI_API_KEY`, `GOOGLE_GENAI_API_KEY`, `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `APIFY_API_KEY`

**Stripe**: `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

**Meta/Instagram**: `META_APP_ID`, `META_APP_SECRET`, `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`

**TikTok**: `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI`

**Contratos**: `ASSINAFY_API_KEY`, `ASSINAFY_WORKSPACE_ID`

## Deployment

**Produção**: `ugc.turbopartners.com.br`. Build: `npm run build` → `npm run start`.

**Database**: Google Cloud SQL PostgreSQL (IP: 34.95.249.110). Conexão via `DATABASE_URL`.

**Storage**: Google Cloud Storage para uploads de mídia e fotos de perfil.

**Sem CI/CD automatizado** — deploy manual.
