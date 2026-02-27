# Database Refactoring Guide v2 — CreatorConnect

> **Versao**: 2.0 | **Data**: 2026-02-26 | **Status**: Proposta (nao executada)
>
> Este documento e o guia completo de refatoracao do banco de dados.
> Diferente da v1 (limpeza de colunas), a v2 faz **split real de tabelas** com views de backward compatibility.
> Cada fase pode ser executada de forma independente, mas a ordem recomendada esta na Secao 7.

---

## Indice

1. [Resumo Executivo](#1-resumo-executivo)
2. [Decisoes Arquiteturais](#2-decisoes-arquiteturais)
3. [Novos Schemas Propostos](#3-novos-schemas-propostos)
4. [Views de Backward Compatibility](#4-views-de-backward-compatibility)
5. [Indices e Tipos](#5-indices-e-tipos)
6. [Migracao GCS](#6-migracao-gcs)
7. [Plano de Execucao (7 Fases)](#7-plano-de-execucao-7-fases)
8. [Impacto no Codigo](#8-impacto-no-codigo)

---

## 1. Resumo Executivo

### Numeros Atuais

| Metrica                | Valor                 |
| ---------------------- | --------------------- |
| Tabelas totais         | 92                    |
| Schemas PostgreSQL     | 14                    |
| Colunas em `users`     | **66**                |
| Colunas em `companies` | **76**                |
| Foreign Keys           | **152**               |
| Indices explicitos     | **16** (em 5 tabelas) |

### Problemas

1. **Tabelas gigantes** — `users` (66 cols) mistura auth, perfil, metricas Instagram/TikTok/YouTube, endereco, tokens. `companies` (76 cols) mistura dados basicos, endereco, enrichment de 5 fontes diferentes
2. **~22 colunas mortas** — campos nunca lidos ou populados (14 em users, 8 em companies)
3. **Indices quase inexistentes** — 152 FKs com apenas 16 indices explicitos
4. **Tipos incorretos** — `budget` como text, `deadline` como text, engagement rates como text (8 colunas)
5. **Storage misto** — avatars e deliverables em disco local (`./uploads/`), profile pics no GCS
6. **Dados duplicados** — endereco do creator em `users` E em `creatorAddresses`

### Resultado v2

| Tabela               | Antes                                            | Depois                                    |
| -------------------- | ------------------------------------------------ | ----------------------------------------- |
| `users`              | 66 colunas (auth + perfil + metricas + endereco) | **13 colunas** (auth + tokens)            |
| `creator_profiles`   | N/A                                              | **36 colunas** (novo, 1:1 com users)      |
| `companies`          | 76 colunas (tudo junto)                          | **31 colunas** (dados basicos + endereco) |
| `company_enrichment` | N/A                                              | **41 colunas** (novo, 1:1 com companies)  |
| Indices              | 16                                               | **49** (33 novos)                         |
| Colunas mortas       | ~22                                              | **0** (removidas)                         |
| Tipos incorretos     | 8                                                | **0** (corrigidos)                        |
| Uploads em disco     | 3 tipos                                          | **0** (tudo GCS)                          |

**Backward compatibility**: Views PostgreSQL `core.users_full` e `company.companies_full` garantem que codigo existente continua funcionando durante a migracao gradual.

---

## 2. Decisoes Arquiteturais

### 2.1 Split real (tabelas separadas) vs limpeza simples

A v1 propunha apenas remover colunas mortas (66→49, 76→63). A v2 faz **split real**:

| Aspecto              | v1 (limpeza)                   | v2 (split)                                   |
| -------------------- | ------------------------------ | -------------------------------------------- |
| `users`              | 66 → 49 cols                   | 66 → **13 cols** + `creator_profiles` (36)   |
| `companies`          | 76 → 63 cols                   | 76 → **31 cols** + `company_enrichment` (41) |
| Session deserialize  | Carrega 49 cols                | Carrega **13 cols**                          |
| Security             | Dados pessoais na mesma tabela | Auth isolado de perfil                       |
| Queries de discovery | `SELECT *` pesado              | JOIN so quando necessario                    |

**Motivacao**: Auth (session deserialize) carrega 13 cols vs 66. Dados pessoais (CPF, pix, bio) isolados. Enrichment nao polui a tabela principal da empresa.

### 2.2 Views de transicao

```
core.users_full = users LEFT JOIN creator_profiles ON user_id
company.companies_full = companies LEFT JOIN company_enrichment ON company_id
```

- Codigo existente continua funcionando via views durante migracao gradual
- Zero downtime — views sao criadas APOS popular as tabelas novas
- Cada arquivo/query pode ser migrado individualmente (reads da view → reads diretos)

### 2.3 Avatar unificado

**Problema atual**: Profile pic vem de 3 fontes (upload manual via `/api/upload`, Instagram enrichment, pipeline Apify) e fica espalhada em `users.avatar`, `users.instagramProfilePic`, `instagramProfiles.profilePicUrl`, `instagramProfiles.profilePicStoragePath`.

**Solucao**: `creator_profiles.avatar_storage_path` — campo unico que aponta para GCS. Pipeline:

1. Upload manual → GCS `avatars/{userId}.{ext}` → atualiza `avatar_storage_path`
2. Instagram enrichment → GCS `instagram-profiles/{username}.{ext}` → atualiza `avatar_storage_path`
3. Resolve via `COALESCE('/api/storage/public/' || avatar_storage_path, users.avatar)`

### 2.4 1:1 em vez de colunas na mesma tabela

| Beneficio                  | Detalhe                                                               |
| -------------------------- | --------------------------------------------------------------------- |
| **Performance**            | Session deserialize: 13 cols vs 66                                    |
| **Seguranca**              | CPF, pixKey, phone isolados em tabela separada                        |
| **Separation of concerns** | Auth (quem sou) vs Perfil (o que faco) vs Enrichment (dados externos) |
| **Queries seletivas**      | Discovery JOIN creator_profiles. Auth nao precisa de JOIN             |
| **Evolucao**               | Adicionar campos de perfil nao afeta tabela de auth                   |

### 2.5 Enderecos

- **Creators**: `creatorAddresses` (ja existe com `isDefault`, `label`, `recipientName`, `zipCode`, `country`, `phone`). Migrar dados de `users.{cep,street,...}` para ca
- **Companies**: Endereco permanece em `companies` (nao precisa de multiplos enderecos)

---

## 3. Novos Schemas Propostos

### 3.1 `core.users` (auth + tokens — 13 colunas)

```sql
-- Tabela reduzida: autenticacao, identidade basica e tokens de seguranca
CREATE TABLE core.users (
  id                  SERIAL PRIMARY KEY,
  email               TEXT NOT NULL UNIQUE,
  password            TEXT,
  google_id           TEXT,
  role                TEXT NOT NULL CHECK (role IN ('company', 'creator', 'admin')),
  name                TEXT NOT NULL,
  avatar              TEXT,                -- Para non-creators (company users). Creators usam creator_profiles
  is_banned           BOOLEAN NOT NULL DEFAULT false,
  is_verified         BOOLEAN NOT NULL DEFAULT false,
  verification_token  TEXT,                -- Verificacao de email (usado em auth.ts)
  reset_token         TEXT,                -- Reset de senha (usado em auth.ts)
  reset_token_expiry  TIMESTAMP,           -- Expiracao do reset token
  created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Colunas removidas de `users`** (53 colunas):

| Grupo                   | Colunas                                                                                                                                                                                                                          | Destino                                                                            |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Perfil creator (11)     | bio, dateOfBirth, gender, niche[], portfolioUrl, instagram, tiktok, youtube, cpf, phone, pixKey                                                                                                                                  | `creator_profiles`                                                                 |
| Instagram metricas (11) | instagramFollowers, instagramFollowing, instagramPosts, instagramEngagementRate, instagramVerified, instagramAuthenticityScore, instagramTopHashtags, instagramTopPosts, instagramBio, instagramProfilePic, instagramLastUpdated | `creator_profiles`                                                                 |
| TikTok ativos (5)       | tiktokFollowers, tiktokFollowing, tiktokHearts, tiktokVideos, tiktokLastUpdated                                                                                                                                                  | `creator_profiles`                                                                 |
| YouTube stubs (2)       | youtubeSubscribers, youtubeLastUpdated                                                                                                                                                                                           | `creator_profiles`                                                                 |
| Enrichment (3)          | enrichmentScore, lastEnrichedAt, enrichmentSource                                                                                                                                                                                | `creator_profiles`                                                                 |
| Endereco (7)            | cep, street, number, neighborhood, city, state, complement                                                                                                                                                                       | `creatorAddresses` (migrar dados)                                                  |
| TikTok mortos (5)       | tiktokEngagementRate, tiktokVerified, tiktokBio, tiktokProfilePic, tiktokTopVideos                                                                                                                                               | **REMOVER** (write-only — enrichment.ts escreve mas nunca sao lidos; parar writes) |
| YouTube mortos (7)      | youtubeTotalViews, youtubeVideosCount, youtubeVerified, youtubeChannelId, youtubeDescription, youtubeThumbnail, youtubeTopVideos                                                                                                 | **REMOVER**                                                                        |
| Legacy (2)              | followers, companyName                                                                                                                                                                                                           | **REMOVER**                                                                        |

> **Nota**: `verificationToken`, `resetToken`, `resetTokenExpiry` **permanecem em `users`** — sao ativamente usados em auth.ts (verificacao de email e reset de senha, 25+ referencias).

### 3.2 `core.creator_profiles` (novo — 36 colunas)

```sql
-- Perfil completo do creator, 1:1 com users (apenas role='creator')
CREATE TABLE core.creator_profiles (
  id                          SERIAL PRIMARY KEY,
  user_id                     INTEGER NOT NULL UNIQUE REFERENCES core.users(id) ON DELETE CASCADE,

  -- Avatar unificado (GCS path)
  avatar_storage_path         TEXT,           -- ex: 'avatars/42.jpg' ou 'instagram-profiles/joao.jpg'

  -- Dados pessoais
  bio                         TEXT,
  date_of_birth               DATE,
  gender                      TEXT CHECK (gender IN ('masculino', 'feminino', 'outro', 'prefiro_nao_informar')),
  niche                       TEXT[],
  portfolio_url               TEXT,

  -- Handles de redes sociais
  instagram                   TEXT,           -- @handle
  tiktok                      TEXT,           -- @handle
  youtube                     TEXT,           -- @handle ou channel URL

  -- Instagram metricas (cache de instagramProfiles, usado em discovery/matching/scoring)
  instagram_followers          INTEGER,
  instagram_following          INTEGER,
  instagram_posts              INTEGER,
  instagram_engagement_rate    NUMERIC(5,2),   -- CORRIGIDO: era text
  instagram_verified           BOOLEAN,
  instagram_authenticity_score  INTEGER,
  instagram_top_hashtags       TEXT[],
  instagram_top_posts          JSONB,          -- InstagramTopPost[]
  instagram_bio                TEXT,
  instagram_profile_pic        TEXT,           -- CDN URL (cache, pode expirar)
  instagram_last_updated       TIMESTAMP,

  -- TikTok metricas (cache de tiktokProfiles)
  tiktok_followers             INTEGER,
  tiktok_following             INTEGER,
  tiktok_hearts                INTEGER,
  tiktok_videos                INTEGER,
  tiktok_last_updated          TIMESTAMP,

  -- YouTube stubs (futura integracao)
  youtube_subscribers          INTEGER,
  youtube_last_updated         TIMESTAMP,

  -- Enrichment metadata
  enrichment_score             INTEGER,
  last_enriched_at             TIMESTAMP,
  enrichment_source            TEXT,

  -- Dados financeiros/pessoais
  pix_key                      TEXT,
  cpf                          TEXT,
  phone                        TEXT,

  created_at                   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indice obrigatorio
CREATE UNIQUE INDEX idx_creator_profiles_user_id ON core.creator_profiles(user_id);
```

### 3.3 `company.company_enrichment` (novo — 41 colunas)

```sql
-- Dados de enrichment da empresa, 1:1 com companies
-- Separado para nao poluir a tabela principal com ~45 colunas de dados externos
CREATE TABLE company.company_enrichment (
  id                          SERIAL PRIMARY KEY,
  company_id                  INTEGER NOT NULL UNIQUE REFERENCES company.companies(id) ON DELETE CASCADE,

  -- CNPJ enrichment (ReceitaWS)
  cnpj_razao_social           TEXT,
  cnpj_situacao               TEXT,
  cnpj_atividade_principal    TEXT,
  cnpj_data_abertura          TEXT,
  cnpj_capital_social         TEXT,
  cnpj_natureza_juridica      TEXT,           -- Mantido: lido em routes.ts e frontend
  cnpj_qsa                    JSONB,          -- Mantido: lido no frontend. { nome, qual }[]
  cnpj_last_updated           TIMESTAMP,

  -- Website enrichment
  website_title               TEXT,
  website_description         TEXT,
  website_keywords            TEXT[],
  website_content             TEXT,
  website_about               TEXT,
  website_faq                 JSONB,          -- { question, answer }[]
  website_social_links        JSONB,          -- Record<string, string>
  website_products            TEXT[],
  website_last_updated        TIMESTAMP,

  -- Instagram metricas
  instagram_followers          INTEGER,
  instagram_following          INTEGER,
  instagram_posts              INTEGER,
  instagram_engagement_rate    NUMERIC(5,2),   -- CORRIGIDO: era text
  instagram_verified           BOOLEAN,
  instagram_bio                TEXT,
  instagram_profile_pic        TEXT,
  instagram_last_updated       TIMESTAMP,

  -- TikTok metricas (somente os ativos)
  tiktok_followers             INTEGER,
  tiktok_last_updated          TIMESTAMP,

  -- E-commerce enrichment
  ecommerce_product_count      INTEGER,
  ecommerce_categories         TEXT[],
  ecommerce_platform           TEXT,
  ecommerce_last_updated       TIMESTAMP,     -- Mantido: usado como condicao de cache em enrichment.ts

  -- AI context
  company_briefing             TEXT,
  structured_briefing          JSONB,          -- StructuredBriefing
  ai_context_summary           TEXT,
  brand_canvas                 JSONB,          -- BrandCanvasV2

  -- Enrichment metadata
  enrichment_score             INTEGER,
  last_enriched_at             TIMESTAMP,

  created_at                   TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at                   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indice obrigatorio
CREATE UNIQUE INDEX idx_company_enrichment_company_id ON company.company_enrichment(company_id);
```

**Colunas mortas removidas de `companies`** (nao migradas para `company_enrichment`):

| Coluna                 | Motivo                                      |
| ---------------------- | ------------------------------------------- |
| `cnpjNomeFantasia`     | Redundante com `tradeName`                  |
| `websitePages`         | Escrito pelo enrichment mas nunca consumido |
| `tiktokHearts`         | Apenas no enrichment, nunca exibido         |
| `tiktokVideos`         | Apenas no enrichment, nunca exibido         |
| `tiktokVerified`       | Apenas no enrichment, nunca exibido         |
| `tiktokBio`            | Apenas no enrichment, nunca exibido         |
| `ecommerceProducts`    | Escrito mas nunca lido/exibido              |
| `aiContextLastUpdated` | Substituivel por `lastEnrichedAt`           |

> **Nota**: `cnpjNaturezaJuridica`, `cnpjQsa` e `ecommerceLastUpdated` foram reclassificados como **ativos** (lidos no frontend ou usados como condicao no enrichment) e movidos para `company_enrichment`.

### 3.4 `company.companies` (reduzida — 31 colunas)

```sql
-- Tabela reduzida: dados basicos da empresa + endereco
CREATE TABLE company.companies (
  id                    SERIAL PRIMARY KEY,
  name                  TEXT NOT NULL,
  trade_name            TEXT,
  slug                  TEXT UNIQUE,
  logo                  TEXT,
  cover_photo           TEXT,
  description           TEXT,
  cnpj                  TEXT,
  phone                 TEXT,
  email                 TEXT,
  website               TEXT,
  instagram             TEXT,           -- @handle
  tiktok                TEXT,           -- @handle

  -- Endereco (empresas mantém endereco na propria tabela)
  cep                   TEXT,
  street                TEXT,
  number                TEXT,
  neighborhood          TEXT,
  city                  TEXT,
  state                 TEXT,
  complement            TEXT,

  -- Discovery/Community
  category              TEXT,           -- brandCategories enum
  is_discoverable       BOOLEAN NOT NULL DEFAULT true,
  is_featured           BOOLEAN NOT NULL DEFAULT false,
  tagline               TEXT,
  auto_join_community   BOOLEAN NOT NULL DEFAULT true,
  onboarding_completed  BOOLEAN NOT NULL DEFAULT false,

  -- Profile
  annual_revenue        TEXT,
  brand_colors          TEXT[],
  brand_logo            TEXT,

  created_by_user_id    INTEGER NOT NULL REFERENCES core.users(id),
  created_at            TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 3.5 `creatorAddresses` (ja existe — sem mudanca estrutural)

```
creator.creator_addresses (existente):
  id, creator_id (FK → users), label, recipient_name, street, number,
  complement, neighborhood, city, state, zip_code, country, phone,
  is_default, created_at, updated_at
```

Apenas precisa receber os dados migrados de `users.{cep, street, ...}` (Fase 5).

---

## 4. Views de Backward Compatibility

### 4.1 `core.users_full`

View que reproduz o schema original de `users` (JOIN com creator_profiles). Inclui colunas de endereco via LEFT JOIN com `creatorAddresses` para backward compatibility ate a Fase 5.

```sql
CREATE VIEW core.users_full AS
SELECT
  u.id,
  u.email,
  u.password,
  u.google_id,
  u.role,
  u.name,
  -- Avatar resolution: creator profile GCS → fallback users.avatar
  CASE
    WHEN cp.avatar_storage_path IS NOT NULL
    THEN '/api/storage/public/' || cp.avatar_storage_path
    ELSE u.avatar
  END AS avatar,
  u.is_banned,
  u.is_verified,
  u.verification_token,
  u.reset_token,
  u.reset_token_expiry,
  u.created_at,

  -- Creator profile fields (NULL para non-creators)
  cp.bio,
  cp.date_of_birth,
  cp.gender,
  cp.niche,
  cp.portfolio_url,
  cp.instagram,
  cp.tiktok,
  cp.youtube,
  cp.instagram_followers,
  cp.instagram_following,
  cp.instagram_posts,
  cp.instagram_engagement_rate,
  cp.instagram_verified,
  cp.instagram_authenticity_score,
  cp.instagram_top_hashtags,
  cp.instagram_top_posts,
  cp.instagram_bio,
  cp.instagram_profile_pic,
  cp.instagram_last_updated,
  cp.tiktok_followers,
  cp.tiktok_following,
  cp.tiktok_hearts,
  cp.tiktok_videos,
  cp.tiktok_last_updated,
  cp.youtube_subscribers,
  cp.youtube_last_updated,
  cp.enrichment_score,
  cp.last_enriched_at,
  cp.enrichment_source,
  cp.pix_key,
  cp.cpf,
  cp.phone,
  cp.avatar_storage_path,

  -- Endereco (backward compat via creatorAddresses ate Fase 5)
  ca.zip_code AS cep,
  ca.street,
  ca.number,
  ca.neighborhood,
  ca.city,
  ca.state,
  ca.complement
FROM core.users u
LEFT JOIN core.creator_profiles cp ON cp.user_id = u.id
LEFT JOIN creator.creator_addresses ca ON ca.creator_id = u.id AND ca.is_default = true;
```

> **Nota**: Apos a Fase 5 (migracao de enderecos completa e codigo atualizado), as colunas de endereco podem ser removidas da view.

**Integracao com Drizzle ORM**:

```typescript
import { pgView } from 'drizzle-orm/pg-core';

export const usersFull = coreSchema.view('users_full').as((qb) =>
  qb
    .select({
      // ... mapear todas as colunas
    })
    .from(users)
    .leftJoin(creatorProfiles, eq(creatorProfiles.userId, users.id)),
);
```

> **Nota**: Drizzle suporta `pgView()` para read-only. Writes devem ir direto nas tabelas base.

### 4.2 `company.companies_full`

```sql
CREATE VIEW company.companies_full AS
SELECT
  c.id,
  c.name,
  c.trade_name,
  c.slug,
  c.logo,
  c.cover_photo,
  c.description,
  c.cnpj,
  c.phone,
  c.email,
  c.website,
  c.instagram,
  c.tiktok,
  c.cep,
  c.street,
  c.number,
  c.neighborhood,
  c.city,
  c.state,
  c.complement,
  c.category,
  c.is_discoverable,
  c.is_featured,
  c.tagline,
  c.auto_join_community,
  c.onboarding_completed,
  c.annual_revenue,
  c.brand_colors,
  c.brand_logo,
  c.created_by_user_id,
  c.created_at,

  -- Enrichment fields (NULL se nao enriquecido ainda)
  ce.cnpj_razao_social,
  ce.cnpj_situacao,
  ce.cnpj_atividade_principal,
  ce.cnpj_data_abertura,
  ce.cnpj_capital_social,
  ce.cnpj_natureza_juridica,
  ce.cnpj_qsa,
  ce.cnpj_last_updated,
  ce.website_title,
  ce.website_description,
  ce.website_keywords,
  ce.website_content,
  ce.website_about,
  ce.website_faq,
  ce.website_social_links,
  ce.website_products,
  ce.website_last_updated,
  ce.instagram_followers,
  ce.instagram_following,
  ce.instagram_posts,
  ce.instagram_engagement_rate,
  ce.instagram_verified,
  ce.instagram_bio,
  ce.instagram_profile_pic,
  ce.instagram_last_updated,
  ce.tiktok_followers,
  ce.tiktok_last_updated,
  ce.ecommerce_product_count,
  ce.ecommerce_categories,
  ce.ecommerce_platform,
  ce.ecommerce_last_updated,
  ce.company_briefing,
  ce.structured_briefing,
  ce.ai_context_summary,
  ce.brand_canvas,
  ce.enrichment_score,
  ce.last_enriched_at
FROM company.companies c
LEFT JOIN company.company_enrichment ce ON ce.company_id = c.id;
```

### 4.3 Estrategia de uso das views

| Cenario               | Antes                      | Durante migracao                    | Apos migracao                                       |
| --------------------- | -------------------------- | ----------------------------------- | --------------------------------------------------- |
| Auth (login, session) | `SELECT * FROM users`      | `SELECT * FROM users` (13 cols)     | `SELECT * FROM users` (13 cols)                     |
| Discovery/matching    | `SELECT * FROM users`      | `SELECT * FROM users_full`          | `SELECT ... FROM users JOIN creator_profiles`       |
| Enrichment write      | `UPDATE users SET ...`     | `UPDATE creator_profiles SET ...`   | `UPDATE creator_profiles SET ...`                   |
| Company profile       | `SELECT * FROM companies`  | `SELECT * FROM companies_full`      | `SELECT ... FROM companies JOIN company_enrichment` |
| Company enrichment    | `UPDATE companies SET ...` | `UPDATE company_enrichment SET ...` | `UPDATE company_enrichment SET ...`                 |

---

## 5. Indices e Tipos

### 5.1 Novos indices para tabelas novas (2)

```sql
-- Obrigatorios (criados junto com as tabelas)
CREATE UNIQUE INDEX idx_creator_profiles_user_id ON core.creator_profiles(user_id);
CREATE UNIQUE INDEX idx_company_enrichment_company_id ON company.company_enrichment(company_id);
```

### 5.2 Indices existentes propostos (31)

#### Prioridade CRITICA — Performance de queries frequentes (15)

```sql
-- Usar CREATE INDEX CONCURRENTLY em producao (0 downtime, sem lock de escrita)

-- 1. Applications por campanha (listagem de creators de uma campanha)
CREATE INDEX CONCURRENTLY idx_applications_campaign_id ON campaign.applications(campaign_id);

-- 2. Applications por creator (campanhas de um creator)
CREATE INDEX CONCURRENTLY idx_applications_creator_id ON campaign.applications(creator_id);

-- 3. Notifications feed do usuario (ordenado por data)
CREATE INDEX CONCURRENTLY idx_notifications_user_id_created ON system.notifications(user_id, created_at DESC);

-- 4. Deliverables por application
CREATE INDEX CONCURRENTLY idx_deliverables_application_id ON campaign.deliverables(application_id);

-- 5. Campaigns por company + status (dashboard da empresa)
CREATE INDEX CONCURRENTLY idx_campaigns_company_status ON campaign.campaigns(company_id, status);

-- 6. Wallet transactions do usuario (historico financeiro)
CREATE INDEX CONCURRENTLY idx_wallet_transactions_user_created ON billing.wallet_transactions(user_id, created_at DESC);

-- 7. Creator points (gamificacao)
CREATE INDEX CONCURRENTLY idx_creator_points_creator_created ON gamification.creator_points(creator_id, created_at DESC);

-- 8. Brand memberships por company (comunidade)
CREATE INDEX CONCURRENTLY idx_brand_memberships_company_status ON brand.brand_creator_memberships(company_id, status);

-- 9. Instagram posts por conta (timeline)
CREATE INDEX CONCURRENTLY idx_instagram_posts_account_timestamp ON social.instagram_posts(instagram_account_id, timestamp DESC);

-- 10. Favorite creators por company
CREATE INDEX CONCURRENTLY idx_favorite_creators_company_id ON misc.favorite_creators(company_id);

-- 11. Favorite companies por creator
CREATE INDEX CONCURRENTLY idx_favorite_companies_creator_id ON misc.favorite_companies(creator_id);

-- 12. Campaign invites (lookup por campanha + creator)
CREATE INDEX CONCURRENTLY idx_campaign_invites_campaign_creator ON campaign.campaign_invites(campaign_id, creator_id);

-- 13. Mensagens por conversa (chat)
CREATE INDEX CONCURRENTLY idx_conv_messages_conversation_created ON messaging.conv_messages(conversation_id, created_at DESC);

-- 14. Creator reviews por company
CREATE INDEX CONCURRENTLY idx_creator_reviews_company_id ON misc.creator_reviews(company_id);

-- 15. Points ledger por creator + campanha
CREATE INDEX CONCURRENTLY idx_points_ledger_creator_campaign ON gamification.points_ledger(creator_id, campaign_id);
```

#### Prioridade ALTA — Queries secundarias (10)

```sql
-- 16. Company members por company
CREATE INDEX CONCURRENTLY idx_company_members_company_id ON company.company_members(company_id);

-- 17. Deliverable comments por deliverable
CREATE INDEX CONCURRENTLY idx_deliverable_comments_deliverable_id ON campaign.deliverable_comments(deliverable_id);

-- 18. Conversations por company (inbox)
CREATE INDEX CONCURRENTLY idx_conversations_company_id ON messaging.conversations(company_id);

-- 19. Conversations por creator (inbox)
CREATE INDEX CONCURRENTLY idx_conversations_creator_id ON messaging.conversations(creator_id);

-- 20. Creator discovery profiles por company
CREATE INDEX CONCURRENTLY idx_creator_discovery_company_id ON creator.creator_discovery_profiles(company_id);

-- 21. Instagram messages por account + timestamp
CREATE INDEX CONCURRENTLY idx_instagram_messages_account_timestamp ON social.instagram_messages(instagram_account_id, sent_at DESC);

-- 22. Campaign tags
CREATE INDEX CONCURRENTLY idx_campaign_tags_campaign_id ON campaign.campaign_tags(campaign_id);

-- 23. Creator tags por creator
CREATE INDEX CONCURRENTLY idx_creator_tags_creator_id ON creator.creator_tags(creator_id);

-- 24. Brand tags por company
CREATE INDEX CONCURRENTLY idx_brand_tags_company_id ON brand.brand_tags(company_id);

-- 25. Problem reports por user
CREATE INDEX CONCURRENTLY idx_problem_reports_user_id ON misc.problem_reports(user_id);
```

#### Prioridade MEDIA — Performance geral (6)

```sql
-- 26. Wallet boxes por company wallet
CREATE INDEX CONCURRENTLY idx_wallet_boxes_wallet_id ON billing.wallet_boxes(wallet_id);

-- 27. Creator balances por creator
CREATE INDEX CONCURRENTLY idx_creator_balances_creator_id ON billing.creator_balances(creator_id);

-- 28. Message reads por user
CREATE INDEX CONCURRENTLY idx_message_reads_user_id ON messaging.message_reads(user_id);

-- 29. Community invites por company
CREATE INDEX CONCURRENTLY idx_community_invites_company_id ON misc.community_invites(company_id);

-- 30. Reward entitlements por creator
CREATE INDEX CONCURRENTLY idx_reward_entitlements_creator_id ON gamification.reward_entitlements(creator_id);

-- 31. Creator course progress
CREATE INDEX CONCURRENTLY idx_creator_course_progress_creator ON academy.creator_course_progress(creator_id);
```

### 5.3 Correcoes de tipo (8 colunas)

#### Validacao pre-migracao

```sql
-- Verificar dados invalidos ANTES de alterar tipos
SELECT id, budget FROM campaign.campaigns WHERE budget IS NOT NULL AND budget !~ '^\d+$';
SELECT id, deadline FROM campaign.campaigns WHERE deadline IS NOT NULL AND deadline !~ '^\d{4}-';
SELECT id, instagram_engagement_rate FROM core.users
  WHERE instagram_engagement_rate IS NOT NULL AND instagram_engagement_rate !~ '^\d+\.?\d*$';
```

#### Correcoes

| #   | Tabela                     | Coluna           | Tipo Atual | Tipo Correto         |
| --- | -------------------------- | ---------------- | ---------- | -------------------- |
| 1   | `campaigns`                | `budget`         | `text`     | `integer` (centavos) |
| 2   | `campaigns`                | `deadline`       | `text`     | `timestamp`          |
| 3   | `campaignTemplates`        | `deadline`       | `text`     | `timestamp`          |
| 4   | `creatorPosts`             | `engagementRate` | `text`     | `numeric(5,2)`       |
| 5   | `creatorAnalyticsHistory`  | `engagementRate` | `text`     | `numeric(5,2)`       |
| 6   | `creatorHashtags`          | `avgEngagement`  | `text`     | `numeric(5,2)`       |
| 7   | `instagramProfiles`        | `engagementRate` | `text`     | `numeric(5,2)`       |
| 8   | `creatorDiscoveryProfiles` | `engagementRate` | `text`     | `numeric(5,2)`       |

> **Nota**: `users.instagramEngagementRate` e `companies.instagramEngagementRate` ja serao criados como `NUMERIC(5,2)` nas tabelas novas (`creator_profiles` e `company_enrichment`).

```sql
-- Executar apos validacao
ALTER TABLE campaign.campaigns ALTER COLUMN budget TYPE integer USING budget::integer;
ALTER TABLE campaign.campaigns ALTER COLUMN deadline TYPE timestamp USING deadline::timestamp;
ALTER TABLE campaign.campaign_templates ALTER COLUMN deadline TYPE timestamp USING deadline::timestamp;
ALTER TABLE creator.creator_posts ALTER COLUMN engagement_rate TYPE numeric(5,2) USING engagement_rate::numeric;
ALTER TABLE analytics.creator_analytics_history ALTER COLUMN engagement_rate TYPE numeric(5,2) USING engagement_rate::numeric;
ALTER TABLE creator.creator_hashtags ALTER COLUMN avg_engagement TYPE numeric(5,2) USING avg_engagement::numeric;
ALTER TABLE social.instagram_profiles ALTER COLUMN engagement_rate TYPE numeric(5,2) USING engagement_rate::numeric;
ALTER TABLE creator.creator_discovery_profiles ALTER COLUMN engagement_rate TYPE numeric(5,2) USING engagement_rate::numeric;
```

---

## 6. Migracao GCS

### 6.1 Estado atual do storage

| Tipo de Arquivo            | Storage Atual              | Endpoint                                                |
| -------------------------- | -------------------------- | ------------------------------------------------------- |
| **Avatars**                | Disco local (`./uploads/`) | `POST /api/upload`                                      |
| **Deliverables**           | Disco local (`./uploads/`) | `POST /api/applications/:id/deliverables`               |
| **Support tickets**        | Disco local (`./uploads/`) | Endpoints de suporte                                    |
| **Instagram profile pics** | GCS (ja migrado)           | Pipeline automatico                                     |
| **Post thumbnails**        | GCS (ja migrado)           | Pipeline automatico                                     |
| **Brand Canvas refs**      | GCS (ja migrado)           | `POST /api/companies/:id/brand-canvas/upload-reference` |

### 6.2 Estrutura de pastas GCS

```
gs://{bucket}/
  avatars/{userId}.{ext}                              # Avatars (NOVO)
  logos/{companyId}.{ext}                             # Logos (NOVO)
  covers/{companyId}.{ext}                            # Cover photos (NOVO)
  deliverables/{campaignId}/{deliverableId}.{ext}     # Entregas (NOVO)
  support/{reportId}/{filename}.{ext}                 # Anexos tickets (NOVO)
  instagram-profiles/{username}.{ext}                 # Profile pics (JA EXISTE)
  posts/{platform}/{postId}.{ext}                     # Thumbnails (JA EXISTE)
  brand-canvas/{companyId}/{file}                     # Brand Canvas refs (JA EXISTE)
  blog/{slug}.{ext}                                   # Imagens de blog
  rewards/{rewardId}.{ext}                            # Imagens de rewards
```

### 6.3 Avatar upload refatorado

**Atual** (`server/routes.ts`):

```
multer → disco local → URL: /uploads/{timestamp}.{ext}
```

**Novo**:

```
multer (memory) → GCS avatars/{userId}.{ext} → update creator_profiles.avatar_storage_path
→ URL servida via /api/storage/public/avatars/{userId}.{ext}
```

**Patterns a reusar**:

- `downloadAndSaveToStorage()` de `server/services/instagram-profile-pic.ts`
- `getPublicUrl()` de `server/services/instagram-profile-pic.ts`
- `ObjectStorageService.save()` de `server/lib/object-storage.ts`

### 6.4 Deliverable upload refatorado

**Atual** (`server/routes.ts`):

```
multer (memory) → auth check → fs.writeFileSync → URL: /uploads/deliverable-{timestamp}.{ext}
```

**Novo**:

```
multer (memory) → auth check → GCS deliverables/{campaignId}/{deliverableId}.{ext}
→ URL: /api/storage/public/deliverables/{campaignId}/{deliverableId}.{ext}
```

### 6.5 Script de migracao disco → GCS

```bash
#!/bin/bash
# migrate-uploads-to-gcs.sh
# Pre-requisito: gcloud auth configurado, gsutil instalado

BUCKET="gs://SEU_BUCKET"
UPLOADS_DIR="./uploads"

echo "=== Migracao de uploads locais para GCS ==="

# 1. Avatars (arquivos sem prefixo deliverable- ou support-)
echo "--- Migrando avatars ---"
for f in "$UPLOADS_DIR"/*; do
  filename=$(basename "$f")
  if [[ ! "$filename" == deliverable-* ]] && [[ ! "$filename" == support-* ]]; then
    gsutil -h "Cache-Control:public, max-age=31536000" cp "$f" "$BUCKET/avatars/$filename"
  fi
done

# 2. Deliverables (prefixo deliverable-)
echo "--- Migrando deliverables ---"
for f in "$UPLOADS_DIR"/deliverable-*; do
  [ -e "$f" ] || continue
  filename=$(basename "$f")
  gsutil -h "Cache-Control:public, max-age=31536000" cp "$f" "$BUCKET/deliverables/legacy/$filename"
done

# 3. Support (prefixo support-)
echo "--- Migrando support ---"
for f in "$UPLOADS_DIR"/support-*; do
  [ -e "$f" ] || continue
  filename=$(basename "$f")
  gsutil -h "Cache-Control:public, max-age=31536000" cp "$f" "$BUCKET/support/legacy/$filename"
done

echo "=== Migracao concluida ==="
echo "IMPORTANTE: Atualize as URLs no banco antes de remover ./uploads/"
```

### 6.6 Atualizacao de URLs no banco

```sql
-- Avatars: /uploads/xxx.jpg → /api/storage/public/avatars/xxx.jpg
UPDATE core.users
SET avatar = REPLACE(avatar, '/uploads/', '/api/storage/public/avatars/')
WHERE avatar LIKE '/uploads/%'
  AND avatar NOT LIKE '/uploads/deliverable-%'
  AND avatar NOT LIKE '/uploads/support-%';

-- Deliverables: /uploads/deliverable-xxx → /api/storage/public/deliverables/legacy/deliverable-xxx
UPDATE campaign.deliverables
SET file_url = REPLACE(file_url, '/uploads/', '/api/storage/public/deliverables/legacy/')
WHERE file_url LIKE '/uploads/%';
```

---

## 7. Plano de Execucao (7 Fases)

### Fase 0 — Preparacao

- [ ] Snapshot do banco (Cloud SQL export ou `pg_dump`)
- [ ] Backup do `./uploads/` (tar.gz)
- [ ] Branch dedicada: `feat/db-refactoring-v2`
- [ ] Ambiente de staging testado

### Fase 1 — Indices (ZERO downtime)

**Risco**: Nenhum. `CREATE INDEX CONCURRENTLY` nao bloqueia leituras nem escritas.

1. Adicionar os 31 indices no `shared/schema.ts`
2. `npm run db:push`
3. Monitorar performance por 24h
4. Verificar: `npm run check` + `npm run test`

**Rollback**: `DROP INDEX` — sem impacto.

### Fase 2 — Criar tabelas novas + popular + views

**Risco**: Nenhum. Cria tabelas e views novas. Nenhum codigo existente muda.

1. Adicionar `creatorProfiles` e `companyEnrichment` em `shared/schema.ts` com Drizzle
2. `npm run db:push` (cria tabelas vazias)
3. Popular `creator_profiles` com dados de `users`:

```sql
INSERT INTO core.creator_profiles (
  user_id, bio, date_of_birth, gender, niche, portfolio_url,
  instagram, tiktok, youtube,
  instagram_followers, instagram_following, instagram_posts,
  instagram_engagement_rate, instagram_verified, instagram_authenticity_score,
  instagram_top_hashtags, instagram_top_posts, instagram_bio, instagram_profile_pic,
  instagram_last_updated,
  tiktok_followers, tiktok_following, tiktok_hearts, tiktok_videos, tiktok_last_updated,
  youtube_subscribers, youtube_last_updated,
  enrichment_score, last_enriched_at, enrichment_source,
  pix_key, cpf, phone,
  created_at
)
SELECT
  id, bio, date_of_birth, gender, niche, portfolio_url,
  instagram, tiktok, youtube,
  instagram_followers, instagram_following, instagram_posts,
  instagram_engagement_rate::numeric(5,2), instagram_verified, instagram_authenticity_score,
  instagram_top_hashtags, instagram_top_posts, instagram_bio, instagram_profile_pic,
  instagram_last_updated,
  tiktok_followers, tiktok_following, tiktok_hearts, tiktok_videos, tiktok_last_updated,
  youtube_subscribers, youtube_last_updated,
  enrichment_score, last_enriched_at, enrichment_source,
  pix_key, cpf, phone,
  created_at
FROM core.users
WHERE role = 'creator';
```

4. Popular `company_enrichment` com dados de `companies`:

```sql
INSERT INTO company.company_enrichment (
  company_id,
  cnpj_razao_social, cnpj_situacao, cnpj_atividade_principal,
  cnpj_data_abertura, cnpj_capital_social, cnpj_natureza_juridica, cnpj_qsa,
  cnpj_last_updated,
  website_title, website_description, website_keywords,
  website_content, website_about, website_faq, website_social_links,
  website_products, website_last_updated,
  instagram_followers, instagram_following, instagram_posts,
  instagram_engagement_rate, instagram_verified, instagram_bio,
  instagram_profile_pic, instagram_last_updated,
  tiktok_followers, tiktok_last_updated,
  ecommerce_product_count, ecommerce_categories, ecommerce_platform,
  ecommerce_last_updated,
  company_briefing, structured_briefing, ai_context_summary, brand_canvas,
  enrichment_score, last_enriched_at,
  created_at
)
SELECT
  id,
  cnpj_razao_social, cnpj_situacao, cnpj_atividade_principal,
  cnpj_data_abertura, cnpj_capital_social, cnpj_natureza_juridica, cnpj_qsa,
  cnpj_last_updated,
  website_title, website_description, website_keywords,
  website_content, website_about, website_faq, website_social_links,
  website_products, website_last_updated,
  instagram_followers, instagram_following, instagram_posts,
  instagram_engagement_rate::numeric(5,2), instagram_verified, instagram_bio,
  instagram_profile_pic, instagram_last_updated,
  tiktok_followers, tiktok_last_updated,
  ecommerce_product_count, ecommerce_categories, ecommerce_platform,
  ecommerce_last_updated,
  company_briefing, structured_briefing, ai_context_summary, brand_canvas,
  enrichment_score, last_enriched_at,
  NOW()
FROM company.companies;
```

5. Criar views `users_full` e `companies_full` (SQL da Secao 4)
6. Verificar: queries via views retornam mesmos dados que tabelas originais

**Rollback**: `DROP VIEW`, `DROP TABLE` — dados originais intactos.

### Fase 3 — Migrar escritas

**Risco**: Medio. Codigo de enrichment passa a escrever nas tabelas novas.

Arquivos a alterar:

| Arquivo                                 | Mudanca                                                                                                                                                                      |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server/services/creator-enrichment.ts` | Writes → `creator_profiles` em vez de `users`                                                                                                                                |
| `server/services/company-enrichment.ts` | Writes → `company_enrichment` em vez de `companies`                                                                                                                          |
| `server/services/brand-canvas.ts`       | Reads/writes → `company_enrichment`                                                                                                                                          |
| `server/auth.ts`                        | `createUser()` cria registro em `users` + `creator_profiles` (se role=creator)                                                                                               |
| `server/routes/user.routes.ts`          | PATCH profile split: auth fields → `users`, profile fields → `creator_profiles`                                                                                              |
| `server/storage.ts`                     | Novos metodos: `createCreatorProfile()`, `updateCreatorProfile()`, `getCreatorProfile()`, `createCompanyEnrichment()`, `updateCompanyEnrichment()`, `getCompanyEnrichment()` |

**Leituras continuam via views** — nada quebra.

**Rollback**: Reverter commits. Views garantem que leituras continuam funcionando.

### Fase 4 — Migrar leituras

**Risco**: Baixo (cada query migrada individualmente).

~100 queries a atualizar gradualmente. Prioridade:

| Grupo                    | Queries                                                            | Arquivos                       |
| ------------------------ | ------------------------------------------------------------------ | ------------------------------ |
| Discovery/matching       | `getCreators`, `getCreatorsForMatching`, `scoreCreatorForCampaign` | `storage.ts`                   |
| Public profile           | `getPublicCreatorProfile`                                          | `storage.ts`, `user.routes.ts` |
| Company enrichment reads | `getCompany`, `getCompanyProfile`                                  | `storage.ts`                   |
| Brand Canvas reads       | `getBrandCanvas`, pipeline reads                                   | `brand-canvas.ts`              |
| Dashboard/stats          | Contagens, metricas agregadas                                      | `routes.ts`                    |

**Estrategia**: Migrar uma query por vez. Testar. Proximo.

**Rollback**: Reverter query individual para usar view.

### Fase 5 — Migrar enderecos

**Risco**: Medio. Afeta formularios e geracao de PDF.

1. Migrar dados de `users.{cep,street,...}` para `creatorAddresses`:

```sql
INSERT INTO creator.creator_addresses (
  creator_id, label, recipient_name, street, number, complement,
  neighborhood, city, state, zip_code, country, is_default, created_at, updated_at
)
SELECT
  id, 'principal', name, street, number, complement,
  neighborhood, city, state, cep, 'Brasil', true, NOW(), NOW()
FROM core.users
WHERE role = 'creator'
  AND cep IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM creator.creator_addresses ca WHERE ca.creator_id = users.id
  );
```

2. Atualizar `server/contract-pdf.ts` — ler de `creatorAddresses`
3. Atualizar formularios frontend (settings, onboarding) para usar API de `creatorAddresses`
4. Testar geracao de contrato PDF
5. NAO remover colunas de `users` ainda (so na Fase 6)

**Rollback**: Dados em `creatorAddresses` ficam. Reverter codigo para ler de `users`.

### Fase 6 — Remover colunas antigas

**Risco**: Medio-alto. Ponto de nao-retorno para as tabelas originais.

**Pre-requisito**: Fases 3 e 4 100% completas. Zero queries lendo colunas antigas diretamente.

1. `DROP VIEW core.users_full` e `company.companies_full`
2. Remover colunas de `users` (53 colunas: perfil + metricas + endereco + mortos)
3. Remover colunas de `companies` (45 colunas: enrichment + metricas + mortos)
4. Atualizar `shared/schema.ts` — remover colunas do Drizzle schema
5. Atualizar Zod schemas e types
6. `npm run db:push`
7. `npm run check` + `npm run test`

**Rollback**: Restore do snapshot do banco (Fase 0). Reverter commits.

### Fase 7 — GCS

**Risco**: Medio. Afeta uploads e visualizacao de arquivos.

1. Refatorar `POST /api/upload` → GCS (Secao 6.3)
2. Refatorar deliverable upload → GCS (Secao 6.4)
3. Testar uploads novos
4. Executar script de migracao (Secao 6.5)
5. Atualizar URLs no banco (Secao 6.6)
6. Testar visualizacao de arquivos antigos e novos
7. Remover `express.static('/uploads')` e `./uploads/`

**Rollback**: Manter `./uploads/` intacto. Reverter codigo de upload. URLs `/uploads/...` continuam via `express.static`.

---

## 8. Impacto no Codigo

### 8.1 Backend (~40 arquivos)

| Arquivo                                    | Fase | Tipo de Mudanca                                                                                                                                         |
| ------------------------------------------ | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared/schema.ts`                         | 1-6  | Indices (F1), novas tabelas + views (F2), remover colunas (F6)                                                                                          |
| `server/storage.ts`                        | 2-6  | Novos metodos CRUD (F2), migrar writes (F3), migrar reads (F4), remover metodos antigos (F6)                                                            |
| `server/auth.ts`                           | 3    | `Express.User` type simplificado (13 cols). `createUser()` cria 2 registros (users + creator_profiles). Tokens de verificacao/reset permanecem em users |
| `server/routes.ts`                         | 3-7  | Writes split (F3), reads (F4), uploads GCS (F7)                                                                                                         |
| `server/routes/user.routes.ts`             | 3-4  | PATCH split: auth → users, profile → creator_profiles                                                                                                   |
| `server/routes/instagram.routes.ts`        | 3    | Profile pic writes → creator_profiles.avatar_storage_path                                                                                               |
| `server/services/creator-enrichment.ts`    | 3    | Writes → creator_profiles                                                                                                                               |
| `server/services/company-enrichment.ts`    | 3    | Writes → company_enrichment                                                                                                                             |
| `server/services/brand-canvas.ts`          | 3-4  | Reads/writes → company_enrichment                                                                                                                       |
| `server/services/business-discovery.ts`    | 3    | Writes → creator_profiles                                                                                                                               |
| `server/services/instagram-profile-pic.ts` | 3    | Update avatar_storage_path em creator_profiles                                                                                                          |
| `server/services/enrichment.ts`            | 3    | Remover writes para colunas mortas, split writes                                                                                                        |
| `server/contract-pdf.ts`                   | 4-5  | Ler cpf/phone/instagram de creator_profiles (F4), endereco de creatorAddresses (F5)                                                                     |
| `server/email.ts`                          | 4    | Verificar refs a colunas movidas                                                                                                                        |
| `server/jobs/autoEnrichmentJob.ts`         | 3    | Writes → creator_profiles                                                                                                                               |
| `server/jobs/companyEnrichmentJob.ts`      | 3    | Writes → company_enrichment                                                                                                                             |
| `server/lib/object-storage.ts`             | 7    | Novos helpers: `saveAvatar()`, `saveDeliverable()`                                                                                                      |
| `server/__tests__/*.test.ts`               | 3-6  | Atualizar mocks (User type simplificado, novos metodos storage)                                                                                         |

> **Nota sobre Passport session**: `deserializeUser` em auth.ts carrega o user completo (hoje 66 cols). Apos o split, carrega 13 cols. Todo codigo que acessa `req.user.bio`, `req.user.instagram`, etc. via sessao precisara de uma query separada a `creator_profiles`. A view `users_full` pode ser usada como atalho durante a transicao.

> **Nota sobre `creatorReviews`** (adicionada na Sprint S03): Esta tabela faz FK para `users` e `companies`. JOINs que buscam dados de perfil do creator (ex: nome, avatar, instagram) precisarao ser atualizados na Fase 4 para incluir `creator_profiles`.

### 8.2 Frontend (~22 arquivos)

| Arquivo                                              | Fase | Tipo de Mudanca                                 |
| ---------------------------------------------------- | ---- | ----------------------------------------------- |
| `client/src/lib/provider.tsx`                        | 3    | User context type (UserAuth vs UserFull)        |
| `client/src/lib/utils.ts`                            | 3    | `getAvatarUrl()` — resolver avatar_storage_path |
| `client/src/pages/company/creator-discovery.tsx`     | 4    | Usar campos de creator_profiles                 |
| `client/src/pages/public/public-creator-profile.tsx` | 4    | Usar campos de creator_profiles                 |
| `client/src/components/CreatorProfileView.tsx`       | 4    | Adaptar para novo type                          |
| Formularios de endereco (settings, onboarding)       | 5    | API de creatorAddresses em vez de users         |
| Upload de avatar                                     | 7    | Nova URL de retorno (GCS)                       |
| Componentes que exibem deliverables                  | 7    | Novas URLs (GCS)                                |

### 8.3 Tipos TypeScript

```typescript
// ANTES: User = tudo junto (66 campos)
export type User = typeof users.$inferSelect;

// DEPOIS: 3 tipos
export type UserAuth = typeof users.$inferSelect; // 13 campos (auth + tokens)
export type CreatorProfile = typeof creatorProfiles.$inferSelect; // 36 campos (perfil)
export type UserFull = UserAuth & Partial<CreatorProfile>; // Compat (view)

// Companies
export type Company = typeof companies.$inferSelect; // 31 campos (basico)
export type CompanyEnrichment = typeof companyEnrichment.$inferSelect; // 41 campos
export type CompanyFull = Company & Partial<CompanyEnrichment>; // Compat (view)

// Nota: Express.User em auth.ts muda de SelectUser (66 campos) para UserAuth (13 campos).
// Todo codigo que acessa req.user.bio, req.user.instagram, etc. precisara de JOIN/query separada.
```

### 8.4 Metodos de storage novos

```typescript
// creator_profiles
createCreatorProfile(userId: number, data: Partial<CreatorProfile>): Promise<CreatorProfile>
updateCreatorProfile(userId: number, data: Partial<CreatorProfile>): Promise<CreatorProfile>
getCreatorProfile(userId: number): Promise<CreatorProfile | null>
getCreatorProfilesByIds(userIds: number[]): Promise<CreatorProfile[]>

// company_enrichment
createCompanyEnrichment(companyId: number, data: Partial<CompanyEnrichment>): Promise<CompanyEnrichment>
updateCompanyEnrichment(companyId: number, data: Partial<CompanyEnrichment>): Promise<CompanyEnrichment>
getCompanyEnrichment(companyId: number): Promise<CompanyEnrichment | null>
```

### 8.5 Checklist de verificacao por fase

#### Apos cada fase:

- [ ] `npm run check` — 0 erros TypeScript
- [ ] `npm run test` — todos os 57 testes passam
- [ ] `npm run dev` — aplicacao inicia sem erros
- [ ] Login funciona (creator, company, admin)
- [ ] Listagem de creators carrega (com fotos)
- [ ] Dashboard da empresa carrega

#### Apos Fase 2 (tabelas novas):

- [ ] Views retornam mesmos dados que tabelas originais
- [ ] `SELECT count(*) FROM core.creator_profiles` = numero de creators
- [ ] `SELECT count(*) FROM company.company_enrichment` = numero de companies

#### Apos Fase 3 (escritas):

- [ ] Enrichment de creator escreve em `creator_profiles`
- [ ] Enrichment de company escreve em `company_enrichment`
- [ ] Registro de novo creator cria `users` + `creator_profiles`
- [ ] Update de perfil atualiza tabela correta

#### Apos Fase 4 (leituras):

- [ ] Discovery mostra metricas corretas
- [ ] Scoring usa engagement rate como numeric (sem parse manual)
- [ ] Public profile carrega dados completos

#### Apos Fase 5 (enderecos):

- [ ] Formulario de endereco funciona
- [ ] Contrato PDF gera com endereco correto
- [ ] Dados migrados corretamente

#### Apos Fase 6 (colunas removidas):

- [ ] Zero refs para colunas antigas no codigo
- [ ] Schema Drizzle limpo
- [ ] Zod schemas atualizados

#### Apos Fase 7 (GCS):

- [ ] Upload de avatar funciona → GCS
- [ ] Upload de deliverable funciona → GCS
- [ ] Arquivos antigos (migrados) exibem corretamente
- [ ] Profile pics do Instagram continuam funcionando

### 8.6 Rollback plan por fase

| Fase              | Rollback                                             |
| ----------------- | ---------------------------------------------------- |
| 0 (prep)          | N/A                                                  |
| 1 (indices)       | `DROP INDEX` — sem impacto                           |
| 2 (tabelas+views) | `DROP VIEW`, `DROP TABLE` — dados originais intactos |
| 3 (escritas)      | Git revert. Views garantem reads funcionando         |
| 4 (leituras)      | Git revert query individual para usar view           |
| 5 (enderecos)     | Dados ficam em creatorAddresses. Reverter codigo     |
| 6 (drop cols)     | `pg_restore` do snapshot (Fase 0) + git revert       |
| 7 (GCS)           | Manter `./uploads/`. Reverter codigo de upload       |

**Rollback geral**: `pg_restore` do snapshot + `git revert` dos commits.

---

## Apendice A: Mapeamento Completo de Colunas

### A.1 `users` — todas as 66 colunas e seu destino

| #   | Coluna                       | Tipo      | Destino                                                  |
| --- | ---------------------------- | --------- | -------------------------------------------------------- |
| 1   | `id`                         | serial    | `users.id` (permanece)                                   |
| 2   | `email`                      | text      | `users.email` (permanece)                                |
| 3   | `password`                   | text      | `users.password` (permanece)                             |
| 4   | `googleId`                   | text      | `users.googleId` (permanece)                             |
| 5   | `role`                       | text      | `users.role` (permanece)                                 |
| 6   | `name`                       | text      | `users.name` (permanece)                                 |
| 7   | `avatar`                     | text      | `users.avatar` (permanece, non-creators)                 |
| 8   | `isBanned`                   | boolean   | `users.isBanned` (permanece)                             |
| 9   | `isVerified`                 | boolean   | `users.isVerified` (permanece)                           |
| 10  | `createdAt`                  | timestamp | `users.createdAt` (permanece)                            |
| 11  | `bio`                        | text      | → `creator_profiles`                                     |
| 12  | `dateOfBirth`                | date      | → `creator_profiles`                                     |
| 13  | `gender`                     | text      | → `creator_profiles`                                     |
| 14  | `niche`                      | text[]    | → `creator_profiles`                                     |
| 15  | `portfolioUrl`               | text      | → `creator_profiles`                                     |
| 16  | `instagram`                  | text      | → `creator_profiles`                                     |
| 17  | `youtube`                    | text      | → `creator_profiles`                                     |
| 18  | `tiktok`                     | text      | → `creator_profiles`                                     |
| 19  | `instagramFollowers`         | integer   | → `creator_profiles`                                     |
| 20  | `instagramFollowing`         | integer   | → `creator_profiles`                                     |
| 21  | `instagramPosts`             | integer   | → `creator_profiles`                                     |
| 22  | `instagramEngagementRate`    | text      | → `creator_profiles` (como NUMERIC)                      |
| 23  | `instagramVerified`          | boolean   | → `creator_profiles`                                     |
| 24  | `instagramAuthenticityScore` | integer   | → `creator_profiles`                                     |
| 25  | `instagramTopHashtags`       | text[]    | → `creator_profiles`                                     |
| 26  | `instagramTopPosts`          | jsonb     | → `creator_profiles`                                     |
| 27  | `instagramBio`               | text      | → `creator_profiles`                                     |
| 28  | `instagramProfilePic`        | text      | → `creator_profiles`                                     |
| 29  | `instagramLastUpdated`       | timestamp | → `creator_profiles`                                     |
| 30  | `tiktokFollowers`            | integer   | → `creator_profiles`                                     |
| 31  | `tiktokFollowing`            | integer   | → `creator_profiles`                                     |
| 32  | `tiktokHearts`               | integer   | → `creator_profiles`                                     |
| 33  | `tiktokVideos`               | integer   | → `creator_profiles`                                     |
| 34  | `tiktokLastUpdated`          | timestamp | → `creator_profiles`                                     |
| 35  | `youtubeSubscribers`         | integer   | → `creator_profiles`                                     |
| 36  | `youtubeLastUpdated`         | timestamp | → `creator_profiles`                                     |
| 37  | `enrichmentScore`            | integer   | → `creator_profiles`                                     |
| 38  | `lastEnrichedAt`             | timestamp | → `creator_profiles`                                     |
| 39  | `enrichmentSource`           | text      | → `creator_profiles`                                     |
| 40  | `pixKey`                     | text      | → `creator_profiles`                                     |
| 41  | `cpf`                        | text      | → `creator_profiles`                                     |
| 42  | `phone`                      | text      | → `creator_profiles`                                     |
| 43  | `cep`                        | text      | → `creatorAddresses`                                     |
| 44  | `street`                     | text      | → `creatorAddresses`                                     |
| 45  | `number`                     | text      | → `creatorAddresses`                                     |
| 46  | `neighborhood`               | text      | → `creatorAddresses`                                     |
| 47  | `city`                       | text      | → `creatorAddresses`                                     |
| 48  | `state`                      | text      | → `creatorAddresses`                                     |
| 49  | `complement`                 | text      | → `creatorAddresses`                                     |
| 50  | `followers`                  | text      | **REMOVER** (legacy, usar instagramFollowers)            |
| 51  | `companyName`                | text      | **REMOVER** (redundante com companies.name)              |
| 52  | `verificationToken`          | text      | `users.verificationToken` (permanece — usado em auth.ts) |
| 53  | `resetToken`                 | text      | `users.resetToken` (permanece — usado em auth.ts)        |
| 54  | `resetTokenExpiry`           | timestamp | `users.resetTokenExpiry` (permanece — usado em auth.ts)  |
| 55  | `tiktokEngagementRate`       | text      | **REMOVER** (nunca populado)                             |
| 56  | `tiktokVerified`             | boolean   | **REMOVER** (nunca populado)                             |
| 57  | `tiktokBio`                  | text      | **REMOVER** (nunca populado)                             |
| 58  | `tiktokProfilePic`           | text      | **REMOVER** (nunca populado)                             |
| 59  | `tiktokTopVideos`            | jsonb     | **REMOVER** (nunca populado)                             |
| 60  | `youtubeTotalViews`          | integer   | **REMOVER** (sem integracao)                             |
| 61  | `youtubeVideosCount`         | integer   | **REMOVER** (sem integracao)                             |
| 62  | `youtubeVerified`            | boolean   | **REMOVER** (sem integracao)                             |
| 63  | `youtubeChannelId`           | text      | **REMOVER** (sem integracao)                             |
| 64  | `youtubeDescription`         | text      | **REMOVER** (sem integracao)                             |
| 65  | `youtubeThumbnail`           | text      | **REMOVER** (sem integracao)                             |
| 66  | `youtubeTopVideos`           | jsonb     | **REMOVER** (sem integracao)                             |

### A.2 `companies` — todas as 76 colunas e seu destino

| #     | Coluna                                                                                                                                                      | Destino                                       |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| 1-13  | id, name, tradeName, slug, logo, coverPhoto, description, cnpj, phone, email, website, instagram, tiktok                                                    | `companies` (permanece)                       |
| 14-20 | cep, street, number, neighborhood, city, state, complement                                                                                                  | `companies` (permanece)                       |
| 21-26 | category, isDiscoverable, isFeatured, tagline, autoJoinCommunity, onboardingCompleted                                                                       | `companies` (permanece)                       |
| 27-29 | annualRevenue, brandColors, brandLogo                                                                                                                       | `companies` (permanece)                       |
| 30-31 | createdByUserId, createdAt                                                                                                                                  | `companies` (permanece)                       |
| 32-39 | cnpjRazaoSocial, cnpjSituacao, cnpjAtividadePrincipal, cnpjDataAbertura, cnpjCapitalSocial, cnpjNaturezaJuridica, cnpjQsa, cnpjLastUpdated                  | → `company_enrichment`                        |
| 40-47 | websiteTitle, websiteDescription, websiteKeywords, websiteContent, websiteAbout, websiteFaq, websiteSocialLinks, websiteLastUpdated                         | → `company_enrichment`                        |
| 48    | websiteProducts                                                                                                                                             | → `company_enrichment`                        |
| 49-56 | instagramFollowers, instagramFollowing, instagramPosts, instagramEngagementRate, instagramVerified, instagramBio, instagramProfilePic, instagramLastUpdated | → `company_enrichment`                        |
| 57-58 | tiktokFollowers, tiktokLastUpdated                                                                                                                          | → `company_enrichment`                        |
| 59-62 | ecommerceProductCount, ecommerceCategories, ecommercePlatform, ecommerceLastUpdated                                                                         | → `company_enrichment`                        |
| 63-66 | companyBriefing, structuredBriefing, aiContextSummary, brandCanvas                                                                                          | → `company_enrichment`                        |
| 67-68 | enrichmentScore, lastEnrichedAt                                                                                                                             | → `company_enrichment`                        |
| 69    | cnpjNomeFantasia                                                                                                                                            | **REMOVER** (redundante com tradeName)        |
| 70    | websitePages                                                                                                                                                | **REMOVER** (nunca lido)                      |
| 71-74 | tiktokHearts, tiktokVideos, tiktokVerified, tiktokBio                                                                                                       | **REMOVER** (nunca exibidos)                  |
| 75    | ecommerceProducts                                                                                                                                           | **REMOVER** (nunca lido)                      |
| 76    | aiContextLastUpdated                                                                                                                                        | **REMOVER** (substituivel por lastEnrichedAt) |

---

## Apendice B: Numeros Finais

### Tabelas

| Tabela               | Antes   | Depois  | Delta      |
| -------------------- | ------- | ------- | ---------- |
| `users`              | 66 cols | 13 cols | -53        |
| `creator_profiles`   | N/A     | 36 cols | +36 (novo) |
| `companies`          | 76 cols | 31 cols | -45        |
| `company_enrichment` | N/A     | 41 cols | +41 (novo) |
| Total tabelas        | 92      | 94      | +2         |
| Colunas mortas       | ~22     | 0       | -22        |

### Indices

| Metrica             | Antes | Depois  |
| ------------------- | ----- | ------- |
| Indices explicitos  | 16    | **49**  |
| Tabelas com indices | 5     | **~27** |

### Storage

| Metrica              | Antes | Depois   |
| -------------------- | ----- | -------- |
| Tipos em disco local | 3     | 0        |
| Tipos em GCS         | 3     | **8**    |
| `./uploads/`         | Ativo | Removido |

### Performance esperada

| Operacao            | Antes                                  | Depois                                      |
| ------------------- | -------------------------------------- | ------------------------------------------- |
| Session deserialize | 66 cols (~2.5KB)                       | 13 cols (~300B)                             |
| Discovery query     | `SELECT *` 66 cols + parse text→number | JOIN 13+36 cols, tipos corretos             |
| Company profile     | `SELECT *` 76 cols                     | JOIN 31+41 cols                             |
| Enrichment write    | UPDATE 76-col table                    | UPDATE 41-col table (menos lock contention) |
