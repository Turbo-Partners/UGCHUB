# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language & Communication

Communicate in **Português (Brasil)**, linguagem simples e direta.

## O que é este projeto

**CreatorConnect (UGC HUB)** — plataforma **all-in-one de influencer marketing** com foco em **comunidade gamificada** e **suite Instagram completa**, potencializada por IA. Conecta marcas a criadores de conteúdo para campanhas UGC, comunidades de embaixadores e relacionamentos de longo prazo. Mercado primário: Brasil.

**Posicionamento**: Entre comunidade de embaixadores (Inbazz) e all-in-one enterprise (Superfiliate), com diferenciais únicos em gamificação profunda e Instagram suite — features que nenhum concorrente combina. Atende marcas de todos os portes, agências e equipes de marketing.

**Roles**: `creator` (descobre oportunidades, participa de campanhas, Academy, comunidades, ranking/gamificação), `company` (gerencia creators, campanhas, Brand Hub, comunidades, analytics, wallet), `admin` (controle total, impersonation, feature flags, moderação).

**Domínios funcionais**:

- **Core**: Marketplace de creators, campanhas (deliverables/tracking/rewards/briefings), Brand Hub (workspace centralizado por marca)
- **Comunidade & Gamificação**: Membership com tiers, pontos, badges, leaderboards, rewards, scoring rules configuráveis
- **Instagram Suite** (mais completa do mercado): OAuth, Publishing (posts/carousels/reels/stories), DM Management + sync, Comments AI com sentiment analysis, Hashtag Tracking, CRM Social (contacts/interactions/scoring), Partnership Ads
- **IA**: Brand Canvas (pipeline Gemini + Claude para identidade visual e voz), Sentiment Analysis (OpenAI), Enrichment pipeline multi-source
- **Integrações**: TikTok (OAuth/métricas), Meta Marketing API, Apify (scraping on-demand)
- **Outros**: Academy educacional, wallet/pagamentos (centavos), inspirations (swipe file), blog, contratos digitais (Assinafy)

## Commands

```bash
npm run dev              # Full-stack dev (Express + Vite HMR, porta 5000)
npm run dev:client       # Client-only (Vite, porta 5000)
npm run build            # Build (Vite → dist/public, esbuild → dist/index.js)
npm run start            # Production (cross-env NODE_ENV=production node dist/index.js)
npm run check            # TypeScript check (tsc com noEmit via tsconfig)
npm run db:push          # Push schema → database (drizzle-kit push)
npm run test             # vitest run (57 tests, 5 files)
npm run test:watch       # vitest watch mode
```

## Workflow

See `docs/WORKFLOW.md` for development workflow (task lifecycle, agent orchestration, commit protocol, session continuity).

## Architecture

**Full-stack TypeScript** — React 19.2 (Vite 7.1) + Express 4.21 + PostgreSQL (Drizzle ORM 0.39).

### Project Layout

```
client/src/
  ├── pages/             # ~111 pages (creator/33, company/41, root/30 incl admin, auth/4, public/3)
  ├── components/        # ~61 componentes custom (45 root + 3 gamification + 13 brand-canvas) + ui/ (72 shadcn)
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
  ├── lib/               # 4 módulos: object-storage.ts (GCS), image-storage.ts (thumbnails), gemini.ts, openai.ts
  ├── contract-pdf.ts    # Geração de contratos PDF (PDFKit)
  ├── assinafy.ts        # Integração Assinafy (assinatura digital)
  └── apify-service.ts   # Apify TikTok service (legacy)
shared/
  ├── schema.ts          # Single source of truth: 14 schemas, 91 tabelas, 89 Zod schemas, 221 types (~3.800 linhas)
  ├── constants.ts       # Enums (nichos, plataformas, formatos, estados BR)
  └── utils.ts           # Utilitários compartilhados
migrations/              # Drizzle migration files
```

### Path Aliases

- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets/*` → `attached_assets/*`

### Frontend Stack

| Aspecto           | Tecnologia                                                                    |
| ----------------- | ----------------------------------------------------------------------------- |
| **Routing**       | Wouter 3.3 com `<ProtectedRoute>` role-based                                  |
| **Data fetching** | TanStack React Query 5.60 — `apiRequest()` em `client/src/lib/queryClient.ts` |
| **UI**            | shadcn/ui (New York style) + Radix UI + Tailwind CSS v4                       |
| **Forms**         | React Hook Form 7.66 + `zodResolver`                                          |
| **Animations**    | Framer Motion 12.23                                                           |
| **State**         | React Query cache via `MarketplaceProvider` (`client/src/lib/provider.tsx`)   |
| **Charts**        | Recharts 2.15                                                                 |
| **Icons**         | Lucide React                                                                  |
| **Toast**         | Sonner + custom `use-toast` hook                                              |
| **Upload**        | Uppy (AWS S3 presigned) + Multer (server-side)                                |
| **DnD**           | @dnd-kit                                                                      |
| **Onboarding**    | Driver.js (guided tours)                                                      |
| **PDF**           | PDFKit (contratos)                                                            |

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

| Arquivo                    | Endpoints | Domínio                                                                            |
| -------------------------- | --------- | ---------------------------------------------------------------------------------- |
| `instagram.routes.ts`      | 45        | OAuth, conta, posts, comentários, DMs, hashtags, publishing, stories, contacts CRM |
| `meta-marketing.routes.ts` | 30        | Meta Ads, Partnership Ads, ad accounts                                             |
| `apify.routes.ts`          | 29        | Gestão de data sources, estimativas de custo                                       |
| `messaging.routes.ts`      | 18        | Conversas, mensagens, read receipts                                                |
| `campaign.routes.ts`       | 12        | CRUD avançado de campanhas, templates, briefings                                   |
| `enrichment.routes.ts`     | 12        | Enrichment de perfis de creators e empresas                                        |
| `user.routes.ts`           | 11        | Perfil, endereços, conexões sociais                                                |
| `hashtag.routes.ts`        | 8         | Busca e tracking de hashtags                                                       |
| `blog.routes.ts`           | 7         | CRUD de posts do blog                                                              |
| `publishing.routes.ts`     | 7         | Publicação de conteúdo Instagram                                                   |
| `tiktok.routes.ts`         | 6         | OAuth, perfil, vídeos, métricas                                                    |
| `comments.routes.ts`       | 6         | Gestão de comentários Instagram                                                    |
| `stripe.routes.ts`         | 4         | Checkout, webhooks, status                                                         |
| `brand-canvas.routes.ts`   | 9         | Brand Canvas V2 AI-powered (pipeline, visual identity, voice)                      |

### Services Reference

| Serviço                   | Arquivo                             | Responsabilidade                                                           |
| ------------------------- | ----------------------------------- | -------------------------------------------------------------------------- |
| **Instagram**             | `services/instagram.ts`             | OAuth, account management, DM sync                                         |
| **Instagram Comments**    | `services/instagram-comments.ts`    | Fetch comments, reply, sentiment analysis                                  |
| **Instagram Publishing**  | `services/instagram-publishing.ts`  | Publish images, carousels, reels, stories                                  |
| **Instagram Hashtags**    | `services/instagram-hashtags.ts`    | Search hashtags (30/week quota), fetch media                               |
| **Instagram Profile Pic** | `services/instagram-profile-pic.ts` | Fetch via Apify + persist no GCS. Fallbacks: BD API, IGSID                 |
| **Instagram Contacts**    | `services/instagram-contacts.ts`    | CRM: upsert contacts, record interactions, scoring                         |
| **Business Discovery**    | `services/business-discovery.ts`    | Free Meta API lookup for external profiles                                 |
| **Apify (Core)**          | `services/apify.ts`                 | Batch scraping (Instagram, TikTok, YouTube, e-commerce)                    |
| **Apify Presets**         | `services/apify-presets.ts`         | High-level workflows, cost estimation                                      |
| **Apify Legacy**          | `apify-service.ts`                  | TikTok metrics/hashtags (root-level)                                       |
| **TikTok**                | `services/tiktok.ts`                | TikTok OAuth v2, user info, video listing                                  |
| **Enrichment**            | `services/enrichment.ts`            | Multi-source profile enrichment                                            |
| **Creator Enrichment**    | `services/creator-enrichment.ts`    | BD API (free) → Apify (paid) fallback                                      |
| **Company Enrichment**    | `services/company-enrichment.ts`    | CNPJ (ReceitaWS), website (Apify), Instagram, Gemini AI                    |
| **Stripe**                | `services/stripe.ts`                | Checkout sessions, webhook handling                                        |
| **Brand Canvas**          | `services/brand-canvas.ts`          | AI pipeline V2: visual identity, voice, content strategy (Gemini + Claude) |
| **Cleanup**               | `services/cleanup.ts`               | Auto-cleanup: notifications (90d), logs (30d)                              |

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

| Job                        | Schedule                    | Descrição                                                             |
| -------------------------- | --------------------------- | --------------------------------------------------------------------- |
| `metricsProcessor.ts`      | A cada 15 min               | Calcula pontos de gamificação, recalcula leaderboards                 |
| `weeklyEmailJob.ts`        | Segunda 9h (`0 9 * * 1`)    | Relatório semanal para empresas (applications, deliverables)          |
| `autoEnrichmentJob.ts`     | Event-driven + 24h interval | Enriquece perfis de creators (pics + dados). Migra CDN URLs expiradas |
| `companyEnrichmentJob.ts`  | 1x ou forçado manualmente   | Re-enriquece empresas (CNPJ, website, Instagram)                      |
| `brandCanvasRefreshJob.ts` | 1x ou forçado manualmente   | Refresh de Brand Canvas (re-enriquecimento IA)                        |
| `cleanup`                  | A cada 24h                  | Remove notificações antigas e logs                                    |
| `apifySyncJob.ts`          | Diário 6h (`0 6 * * *`)     | Sync batch de perfis Instagram                                        |

### Database

**14 PostgreSQL schemas**, **91 tabelas**, **89 Zod insert schemas**, **221 types exportados**.

| Schema         | #   | Tabelas                                                                                                                                                                                                                                                                                                                  |
| -------------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `core`         | 1   | `users`                                                                                                                                                                                                                                                                                                                  |
| `company`      | 3   | `companies`, `companyMembers`, `companyUserInvites`                                                                                                                                                                                                                                                                      |
| `campaign`     | 12  | `campaigns`, `applications`, `deliverables`, `deliverableComments`, `campaignTemplates`, `campaignInvites`, `campaignTags`, `campaignHashtags`, `campaignCoupons`, `campaignPointsRules`, `campaignPrizes`, `campaignCreatorStats`                                                                                       |
| `creator`      | 7   | `creatorPosts`, `creatorHashtags`, `creatorTags`, `creatorDiscoveryProfiles`, `creatorAddresses`, `creatorAdPartners`, `creatorAuthLinks`                                                                                                                                                                                |
| `brand`        | 4   | `brandSettings`, `brandTags`, `brandCreatorTiers`, `brandCreatorMemberships`                                                                                                                                                                                                                                             |
| `content`      | 6   | `inspirations`, `inspirationCollections`, `inspirationCollectionItems`, `creatorSavedInspirations`, `campaignInspirations`, `blogPosts`                                                                                                                                                                                  |
| `messaging`    | 3   | `conversations`, `convMessages`, `messageReads`                                                                                                                                                                                                                                                                          |
| `gamification` | 9   | `creatorLevels`, `creatorPoints`, `badges`, `creatorBadges`, `brandPrograms`, `brandRewards`, `brandTierConfigs`, `pointsLedger`, `rewardEntitlements`                                                                                                                                                                   |
| `analytics`    | 3   | `creatorAnalyticsHistory`, `campaignMetricSnapshots`, `profileSnapshots`                                                                                                                                                                                                                                                 |
| `billing`      | 7   | `companyWallets`, `walletBoxes`, `creatorBalances`, `walletTransactions`, `paymentBatches`, `salesTracking`, `creatorCommissions`                                                                                                                                                                                        |
| `academy`      | 5   | `courses`, `courseModules`, `courseLessons`, `creatorCourseProgress`, `creatorLessonProgress`                                                                                                                                                                                                                            |
| `social`       | 16  | `instagramAccounts`, `instagramProfiles`, `instagramPosts`, `instagramMessages`, `instagramTaggedPosts`, `instagramContacts`, `instagramInteractions`, `tiktokProfiles`, `tiktokVideos`, `youtubeChannels`, `youtubeVideos`, `dmTemplates`, `dmSendLogs`, `metaAdAccounts`, `metaBusinessManagers`, `metaAdAccountsList` |
| `system`       | 6   | `session`, `notifications`, `tags`, `featureFlags`, `integrationLogs`, `dataSourceRegistry`                                                                                                                                                                                                                              |
| `misc`         | 9   | `problemReports`, `favoriteCreators`, `favoriteCompanies`, `workflowStages`, `postAiInsights`, `communityInvites`, `contactNotes`, `hashtagSearches`, `hashtagPosts`                                                                                                                                                     |

Schema changes: edit `shared/schema.ts` then `npm run db:push`.

## External Services

### Ativos

| Serviço                              | Uso                                                                                                                          | Custo              |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| **Meta Graph API (Instagram)**       | OAuth, métricas, comments, publishing, DMs, hashtags, Business Discovery, Partnership Ads                                    | Free (com token)   |
| **TikTok API v2**                    | OAuth, user info, video listing                                                                                              | Free               |
| **Apify**                            | Scraping on-demand: profile pics, métricas, hashtags                                                                         | ~$2.60/1k profiles |
| **OpenRouter**                       | **Provider principal de AI** — acessa Claude Sonnet 4.5 + Gemini 2.5 Flash. Brand Canvas (website, visual, voice, synthesis) | Pay-per-use        |
| **OpenAI (via `AI_INTEGRATIONS_*`)** | Sentiment analysis (comments), blog SEO, post analysis (gpt-4o, gpt-4o-mini)                                                 | Pay-per-use        |
| **Google Gemini AI**                 | Fallback direto para Brand Canvas quando OpenRouter indisponível                                                             | Pay-per-use        |
| **Anthropic Claude**                 | Fallback direto para Brand Canvas quando OpenRouter indisponível                                                             | Pay-per-use        |
| **Stripe**                           | Checkout (card + boleto), webhooks                                                                                           | % por transação    |
| **SendGrid**                         | Emails transacionais e relatórios semanais                                                                                   | Free tier / Pay    |
| **ReceitaWS**                        | CNPJ lookup para empresas brasileiras                                                                                        | Free               |
| **Assinafy**                         | Assinatura digital de contratos                                                                                              | Pay-per-use        |
| **Google Cloud SQL**                 | PostgreSQL (produção)                                                                                                        | Pay-per-use        |
| **Google Cloud Storage**             | Upload de mídia, profile pics, thumbnails                                                                                    | Pay-per-use        |

### Planejados (Roadmap)

| Serviço              | Uso futuro                           | Sprint |
| -------------------- | ------------------------------------ | ------ |
| **Yampi/Nuvemshop**  | E-commerce tracking, seeding, vendas | S09    |
| **TikTok Spark Ads** | Creator ads nativos no TikTok        | S11    |

**Apify Actors usados**: `apify/instagram-api-scraper`, `apify/instagram-profile-scraper`, `clockworks/tiktok-scraper`, `streamers/youtube-scraper`, `apify/e-commerce-scraping-tool`, `apify/influencer-discovery-agent`.

## Key Design Decisions

1. **Data Extraction Hierarchy**: Local DB → Apify (primary source para profile pics e métricas). Business Discovery API existe no código mas não funciona confiavelmente para profile pics.
2. **Profile Pictures**: Todas as fotos de perfil Instagram DEVEM ser salvas no Google Cloud Storage (URLs permanentes via `/api/storage/public/...`). Nunca salvar CDN URLs diretamente — URLs de CDN expiram em ~24h. Pipeline em `instagram-profile-pic.ts`: 1) GCS cache (`instagramProfiles.profilePicStoragePath`) → 2) Apify scrape → persist no GCS. CDN URLs expiradas são limpas pelo `autoEnrichmentJob.ts:migrateExpiredCdnUrls`. Posts thumbnails separados em `server/lib/image-storage.ts`.
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
res.json(data); // 200 OK
res.status(201).json(data); // Created
res.sendStatus(204); // No content

// Errors
res.sendStatus(401); // Unauthenticated
res.sendStatus(403); // Forbidden
res.status(400).json({ error: 'msg' }); // Bad request
res.status(404).json({ error: 'msg' }); // Not found
res.status(500).json({ error: 'msg' }); // Internal error
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
  console.error('Context:', error);
  res.status(500).json({ error: 'Failed to...' });
}
```

### TanStack Query

```typescript
// Queries — queryKey usa o path da API
const { data } = useQuery<Type>({ queryKey: ['/api/endpoint'] });

// Com condição
const { data } = useQuery({ queryKey: ['/api/endpoint'], enabled: !!user });

// 401 retorna null (auth-aware)
const { data: user } = useQuery<User | null>({
  queryKey: ['/api/user'],
  queryFn: getQueryFn({ on401: 'returnNull' }),
});

// Mutations
const mutation = useMutation({
  mutationFn: async (data) => {
    const res = await apiRequest('POST', '/api/endpoint', data);
    return res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/endpoint'] });
    toast({ title: 'Sucesso!' });
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
// Inline auth check (padrão mais comum)
if (!req.isAuthenticated()) return res.sendStatus(401);
if (req.user!.role !== 'company') return res.sendStatus(403);

// Brand access check (verifica admin por role/email + membership)
const hasAccess = await requireBrandAccess(req, brandId);
if (!hasAccess) return res.sendStatus(403);

// Admin check: role === 'admin' OU email @turbopartners.com.br
const isAdminByRole = req.user.role === 'admin';
const isAdminByEmail = email.endsWith('@turbopartners.com.br');
```

## Testing

**Framework**: Vitest 4.0 + Supertest 7.2 | **Config**: `vitest.config.ts` | **Run**: `npm run test` ou `npm run test:watch`

**5 test files** em `server/__tests__/` (57 tests total):

- `auth.test.ts` (8 tests) — register, login, logout, user update, sessão
- `brand-canvas.test.ts` (25 tests) — pipeline steps (CNPJ, website, visual, social, voice, synthesis), API endpoints, job scheduling
- `messaging.test.ts` (8 tests) — DM sync, profile pic hierarchy, rate limiting, batch operations
- `reviews.test.ts` (10 tests) — CRUD reviews, permissões (401/403), validação rating, endpoint público, upsert
- `stripe.test.ts` (6 tests) — status, checkout creation, webhook validation, error handling

**Test helpers** (`server/__tests__/setup.ts`):

- `createMockUser(overrides)` — factory de usuário mock (default: role='company', id=1)
- `withAuth(app, user)` — injeta sessão autenticada com `activeCompanyId=1`, `impersonation=null`
- `withNoAuth(app)` — simula não-autenticado (`isAuthenticated()` retorna false)

**Pattern de teste**: Testes são unitários/integração sem banco real. Usam mocks do `storage` e Express isolado.

```typescript
const app = express();
app.use(express.json());
withAuth(app, createMockUser({ role: 'company' }));
// register routes...
const res = await request(app).get('/api/endpoint');
expect(res.status).toBe(200);
```

**Convenções**:

- Mocks de storage em cada test file (`vi.mock('../storage')`)
- Cada test file cria seu próprio Express app (isolamento)
- Rotas testadas via Supertest (`request(app).get/post/put/delete`)
- Sem banco de dados nos testes — sempre mockado

## Environment Variables

### Infraestrutura (obrigatórias)

| Variável         | Descrição                                                       |
| ---------------- | --------------------------------------------------------------- |
| `DATABASE_URL`   | Connection string PostgreSQL (Cloud SQL)                        |
| `SESSION_SECRET` | Chave de encriptação das sessões                                |
| `NODE_ENV`       | `development` ou `production`                                   |
| `APP_PORT`       | Porta do Express (default: 5000)                                |
| `PRODUCTION_URL` | URL base produção (default: `https://ugc.turbopartners.com.br`) |

### Autenticação

| Variável               | Descrição                  |
| ---------------------- | -------------------------- |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID     |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `ADMIN_PASSWORD`       | Senha de login admin       |

### AI Services

| Variável                          | Descrição                                                                                                                                      |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENROUTER_API_KEY`              | **Provider principal** — acessa Claude Sonnet 4.5 + Gemini 2.5 Flash via OpenRouter. Usado em Brand Canvas (voice, synthesis, website, visual) |
| `AI_INTEGRATIONS_OPENAI_API_KEY`  | OpenAI models (gpt-4o, gpt-4o-mini) — sentiment analysis, blog SEO, post analysis                                                              |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Base URL customizada (opcional, permite apontar para OpenRouter)                                                                               |
| `GOOGLE_GENAI_API_KEY`            | Google Gemini direto — fallback quando OpenRouter indisponível                                                                                 |
| `ANTHROPIC_API_KEY`               | Anthropic Claude direto — fallback quando OpenRouter indisponível                                                                              |

### Meta / Instagram

| Variável                         | Descrição                                    |
| -------------------------------- | -------------------------------------------- |
| `META_APP_ID`                    | Meta App ID (Marketing API, Partnership Ads) |
| `META_APP_SECRET`                | Meta App secret                              |
| `INSTAGRAM_APP_ID`               | Instagram App ID (OAuth, Graph API)          |
| `INSTAGRAM_APP_SECRET`           | Instagram App secret                         |
| `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` | Token de verificação de webhooks Instagram   |

### TikTok

| Variável               | Descrição                  |
| ---------------------- | -------------------------- |
| `TIKTOK_CLIENT_KEY`    | TikTok OAuth client key    |
| `TIKTOK_CLIENT_SECRET` | TikTok OAuth client secret |
| `TIKTOK_REDIRECT_URI`  | TikTok OAuth redirect URI  |

### Pagamentos (Stripe)

| Variável                    | Descrição                                |
| --------------------------- | ---------------------------------------- |
| `STRIPE_PUBLISHABLE_KEY`    | Chave pública (client-side)              |
| `STRIPE_SECRET_KEY`         | Chave secreta (server-side)              |
| `STRIPE_WEBHOOK_SECRET`     | Webhook signing secret (produção)        |
| `STRIPE_WEBHOOK_SECRET_DEV` | Webhook signing secret (desenvolvimento) |

### Serviços externos

| Variável                | Descrição                                            |
| ----------------------- | ---------------------------------------------------- |
| `APIFY_API_KEY`         | Apify (scraping Instagram/TikTok)                    |
| `SENDGRID_API_KEY`      | SendGrid (emails transacionais)                      |
| `SENDGRID_FROM_EMAIL`   | Email remetente (default: `no-reply@yourdomain.com`) |
| `ASSINAFY_API_KEY`      | Assinafy (contratos digitais)                        |
| `ASSINAFY_WORKSPACE_ID` | Assinafy workspace ID                                |

### Storage (Google Cloud)

| Variável                           | Descrição                              |
| ---------------------------------- | -------------------------------------- |
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | Bucket GCS para uploads e profile pics |

### Dev-only (apenas `NODE_ENV=development`)

| Variável                  | Descrição                            |
| ------------------------- | ------------------------------------ |
| `DEV_LOGIN_EMAIL_CREATOR` | Email de login rápido (role creator) |
| `DEV_LOGIN_EMAIL_COMPANY` | Email de login rápido (role company) |
| `DEV_LOGIN_EMAIL_ADMIN`   | Email de login rápido (role admin)   |

## Deployment

**URL produção**: `ugc.turbopartners.com.br`

### Build pipeline

```bash
npm run build    # 1) Vite → dist/public (client)  2) esbuild → dist/index.js (server ESM)
npm run start    # cross-env NODE_ENV=production node dist/index.js
```

### Infraestrutura

| Componente     | Tecnologia                  | Detalhes                                                     |
| -------------- | --------------------------- | ------------------------------------------------------------ |
| **App server** | Node.js (ESM)               | Porta `APP_PORT` (default 5000), bind `0.0.0.0`              |
| **Database**   | Google Cloud SQL PostgreSQL | Pool: max 10 conexões, idle 30s, timeout 10s                 |
| **Storage**    | Google Cloud Storage        | Profile pics, uploads, thumbnails. Cache: `max-age=31536000` |
| **WebSocket**  | ws nativo                   | Path `/ws/notifications`, auth via session cookies           |
| **Sessões**    | `connect-pg-simple`         | PostgreSQL-backed, auto-create table                         |

### Deploy manual

Sem CI/CD automatizado. Build local → deploy manual no servidor.

### Static files (produção)

Express serve `/dist/public` (SPA), `/uploads` e `/attached_assets` como diretórios estáticos. SEO: `robots.txt` e `sitemap.xml` gerados dinamicamente.

### Background jobs na inicialização

Todos os jobs são iniciados em `server/index.ts` após o server estar rodando (metricsProcessor, weeklyEmail, autoEnrichment, companyEnrichment, brandCanvasRefresh, cleanup).
