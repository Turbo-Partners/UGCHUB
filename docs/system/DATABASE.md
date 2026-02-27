# CreatorConnect — Database Reference

> Fonte de verdade: `shared/schema.ts` (92 tabelas, 14 schemas PostgreSQL).
> Atualizado: 2026-02-27

---

## 1. Overview

### 1.1 Schema Map

| Schema         | Tables | Description                                                               |
| -------------- | ------ | ------------------------------------------------------------------------- |
| `core`         | 1      | Hub central — tabela users                                                |
| `company`      | 3      | Empresas, membros, convites                                               |
| `campaign`     | 12     | Campanhas, applications, deliverables, templates, coupons, rules          |
| `creator`      | 7      | Posts, hashtags, tags, discovery, endereços, ad partners, auth links      |
| `brand`        | 4      | Settings, tags, tiers, memberships                                        |
| `content`      | 6      | Inspirations, collections, blog                                           |
| `messaging`    | 3      | Conversas, mensagens, read tracking                                       |
| `gamification` | 9      | Levels, points, badges, programs, rewards, tiers, ledger, entitlements    |
| `analytics`    | 3      | History, metric snapshots, profile snapshots                              |
| `billing`      | 7      | Wallets, boxes, balances, transactions, batches, sales, commissions       |
| `academy`      | 5      | Courses, modules, lessons, progress                                       |
| `social`       | 16     | Instagram, TikTok, YouTube, DMs, Meta Ads                                 |
| `system`       | 6      | Sessions, notifications, tags, feature flags, logs, data sources          |
| `misc`         | 10     | Reports, favorites, reviews, workflow, insights, invites, notes, hashtags |
| **Total**      | **92** |                                                                           |

### 1.2 Conceitos Transversais

- **Multi-tenant**: Toda query de empresa filtra por `companyId`. Sessão tem `activeCompanyId`. Esquecer esse filtro vaza dados entre empresas.
- **Valores monetários em centavos**: Wallets, transações, comissões, prêmios usam `integer` em centavos. R$ 10,00 = 1000.
- **Roles**: `creator`, `company`, `admin`. Verificação via `req.user.role`. Admin: role=admin OU email @turbopartners.com.br.
- **Profile pic pipeline**: CDN URLs expiram em ~24h. Pipeline: GCS cache → Apify scrape → persist GCS. Job `autoEnrichmentJob` migra URLs expiradas.
- **Zod validation**: Todo POST/PUT usa `insertXxxSchema` via `createInsertSchema()`. Erros retornam 400.

### 1.3 Convenções

- Nomes DB: `snake_case`. Drizzle/TS: `camelCase`.
- FK: `table_id` → parent `id`. Maioria sem `onDelete` (restrict). Alguns com `cascade` ou `set null`.
- PK: `id serial` (exceto `session` que usa `sid text`).
- Timestamps: `created_at defaultNow()`, `updated_at defaultNow()` onde aplicável.
- Insert schemas: omitem `id` + timestamps auto-geridos.

---

## 2. Enums

### 2.1 pgEnum (6)

| #   | Enum Name                   | Values                                                                                                                                                                                                 | Used By                           |
| --- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| 1   | `platform`                  | `instagram`, `tiktok`, `youtube`, `twitter`, `linkedin`, `pinterest`, `kwai`                                                                                                                           | Disponível programaticamente      |
| 2   | `content_format`            | `photo`, `carousel`, `reels`, `stories`, `video`, `short`, `live`, `ugc`                                                                                                                               | Disponível programaticamente      |
| 3   | `deliverable_type`          | `instagram_post`, `instagram_reels`, `instagram_stories`, `instagram_carousel`, `tiktok_video`, `youtube_video`, `youtube_shorts`, `ugc_video`, `ugc_photo`, `review`, `unboxing`, `tutorial`, `other` | Zod `structuredDeliverableSchema` |
| 4   | `niche`                     | `tech`, `lifestyle`, `beauty`, `education`, `finance`, `health`, `travel`, `food`, `entertainment`, `sports`, `pets`, `parenting`, `business`, `other`                                                 | Disponível programaticamente      |
| 5   | `tag_type`                  | `niche`, `style`, `vertical`, `audience`, `skill`, `platform`                                                                                                                                          | `system.tags.type`                |
| 6   | `campaign_deliverable_type` | `reel`, `story`, `post`, `tiktok`, `youtube_short`, `youtube_long`, `live`, `ugc_raw`                                                                                                                  | Disponível programaticamente      |

### 2.2 Inline Text Enums

Colunas com `text("col", { enum: [...] })`. Agrupadas por schema.

**core.users**: `role` (company/creator/admin), `gender` (masculino/feminino/outro/prefiro_nao_informar)

**company.companies**: `category` (saude/beleza/moda/tecnologia/alimentos/bebidas/fitness/casa/pets/infantil/servicos/outros)

**company.company_members**: `role` (owner/admin/member/reader)

**company.company_user_invites**: `role` (admin/member/reader), `status` (pending/accepted/expired/cancelled)

**campaign.campaigns**: `status` (open/closed), `visibility` (public/private/community_only), `target_gender` (masculino/feminino/outro/prefiro_nao_informar), `reward_mode` (ranking/threshold/none)

**campaign.applications**: `status` (pending/accepted/rejected), `creator_workflow_status` (aceito/contrato/aguardando_produto/producao/revisao/entregue), `seeding_status` (not_required/pending/sent/received)

**campaign.deliverables**: `deliverable_type` (post_feed/reels/stories/tiktok/youtube_video/youtube_shorts/twitter_post/other)

**campaign.campaign_templates**: `target_gender`, `visibility`, `reward_mode` (mesmos valores de campaigns)

**campaign.campaign_invites**: `status` (pending/accepted/declined)

**campaign.campaign_coupons**: `discount_type` (percentage/fixed)

**campaign.campaign_prizes**: `type` (ranking_place/milestone), `reward_kind` (cash/product/both/none)

**system.notifications**: `type` (new_campaign/application_accepted/application_rejected/new_applicant/message/workflow_update/deliverable_uploaded/campaign_invite/favorite_company_campaign/review_reminder/review_revealed/seeding_sent/seeding_received/new_instagram_post/community_join_request/community_member_joined/deliverable_approved/deliverable_rejected)

**system.feature_flags**: `module` (gamification/advanced_analytics/ecommerce/social_listening)

**system.data_source_registry**: `pricing_model` (ppr/ppe/cu), `category` (instagram/tiktok/meta_ads/youtube/ecommerce/discovery/utility)

**gamification.creator_points**: `action` (21 valores — profile_complete, campaign_accepted, delivered_on_time, positive_review, first_campaign, milestone_10_campaigns, perfect_rating, verified_profile, referral, views_1k, views_10k, views_100k, sale_generated, post_published, story_published, reels_published, comment_received, engagement_bonus, monthly_streak, early_delivery, campaign_goal_reached), `category` (performance/content/engagement/sales/achievement/bonus)

**gamification.brand_programs**: `coupon_generation_rule` (prefix_username/prefix_random/custom), `default_reward_mode` (ranking/threshold/none)

**gamification.brand_rewards**: `type` (cash/product/benefit/experience)

**gamification.points_ledger**: `event_type` (post_created/reel_created/story_created/views_milestone/like_milestone/comment_milestone/sale_confirmed/delivery_approved/course_completed/admin_adjustment/ontime_bonus/quality_bonus/penalty_late/milestone_reached)

**gamification.reward_entitlements**: `source_type` (milestone_reached/ranking_place), `reward_kind` (cash/product/both/none), `status` (pending/approved/rejected/cash_paid/product_shipped/completed/cancelled)

**billing.wallet_transactions**: `type` (deposit/withdrawal/payment_fixed/payment_variable/commission/bonus/refund/transfer_in/transfer_out/box_allocation), `status` (pending/available/processing/completed/failed/cancelled)

**billing.payment_batches**: `status` (draft/pending/processing/completed/failed/cancelled)

**billing.creator_balances**: `pix_key_type` (cpf/cnpj/email/phone/random)

**billing.sales_tracking**: `platform` (shopify/woocommerce/manual), `status` (pending/confirmed/paid/cancelled)

**billing.creator_commissions**: `status` (pending/approved/paid/rejected)

**brand.brand_creator_memberships**: `status` (invited/active/suspended/archived), `source` (manual/campaign/invite/self_request)

**content.inspirations**: `scope` (global/brand), `platform` (instagram/tiktok/youtube/ads/ugc), `format` (reels/story/post/ad/shorts/hook/script/effect/edit/brief/reference)

**messaging.conversations**: `type` (brand/campaign), `status` (open/resolved)

**social.instagram_accounts**: `account_type` (creator/business)

**social.instagram_profiles**: `owner_type` (user/company/external), `source` (oauth/apify/manual/api)

**social.instagram_posts**: `source` (native_api/apify/manual)

**social.instagram_tagged_posts**: `sentiment` (positive/neutral/negative)

**social.instagram_contacts**: `status` (lead/engaged/vip/member/inactive)

**social.instagram_interactions**: `type` (dm_received/dm_sent/comment_on_post/mention/story_reply/tagged_post/like)

**social.dm_templates**: `type` (campaign_invite/community_invite/follow_up/welcome/custom)

**social.dm_send_logs**: `status` (pending/sent/failed/delivered/read)

**social.tiktok_profiles**: `sync_status` (active/error/disconnected)

**creator.creator_posts**: `platform` (instagram/tiktok), `post_type` (image/video/carousel/reel/story)

**creator.creator_hashtags**: `platform` (instagram/tiktok)

**creator.creator_discovery_profiles**: `source` (manual/apify/import)

**analytics.creator_analytics_history**: `platform` (instagram/tiktok)

**analytics.campaign_metric_snapshots**: `platform` (instagram/tiktok)

**academy.courses**: `level` (basic/intermediate/advanced)

**academy.course_lessons**: `content_type` (text/video/link/checklist)

**misc.problem_reports**: `status` (open/in_progress/resolved)

**misc.community_invites**: `status` (sent/opened/accepted/expired/cancelled)

**misc.post_ai_insights**: `platform` (instagram/tiktok)

**misc.hashtag_posts**: `source` (top/recent)

---

## 3. Schema: `core` (1 table)

Hub central. A tabela `users` é referenciada por praticamente todas as outras tabelas. Armazena creators, company users e admins, diferenciados pelo campo `role`.

### 3.1 `core.users` (`users`)

| Column                       | Type      | Null? | Default | FK  | Description                                                                            |
| ---------------------------- | --------- | ----- | ------- | --- | -------------------------------------------------------------------------------------- |
| id                           | serial    | No    | auto    | —   | PK                                                                                     |
| email                        | text      | No    | —       | —   | Email único                                                                            |
| password                     | text      | Yes   | —       | —   | Hash senha (null p/ Google OAuth)                                                      |
| google_id                    | text      | Yes   | —       | —   | Google OAuth ID                                                                        |
| role                         | text      | No    | —       | —   | `company` / `creator` / `admin`                                                        |
| name                         | text      | No    | —       | —   | Nome completo                                                                          |
| avatar                       | text      | Yes   | —       | —   | URL do avatar                                                                          |
| is_banned                    | boolean   | No    | `false` | —   | Banido pelo admin                                                                      |
| bio                          | text      | Yes   | —       | —   | Bio do criador                                                                         |
| date_of_birth                | date      | Yes   | —       | —   | Data nascimento (validação ≥18)                                                        |
| gender                       | text      | Yes   | —       | —   | Gênero (enum inline)                                                                   |
| niche                        | text[]    | Yes   | —       | —   | Array de nichos                                                                        |
| followers                    | text      | Yes   | —       | —   | Faixa de seguidores (legacy)                                                           |
| instagram                    | text      | Yes   | —       | —   | Handle Instagram                                                                       |
| youtube                      | text      | Yes   | —       | —   | Handle YouTube                                                                         |
| tiktok                       | text      | Yes   | —       | —   | Handle TikTok                                                                          |
| portfolio_url                | text      | Yes   | —       | —   | URL do portfolio                                                                       |
| instagram_followers          | integer   | Yes   | —       | —   | Seguidores IG verificados                                                              |
| instagram_following          | integer   | Yes   | —       | —   | Seguindo IG                                                                            |
| instagram_posts              | integer   | Yes   | —       | —   | Total posts IG                                                                         |
| instagram_engagement_rate    | text      | Yes   | —       | —   | Taxa engajamento IG                                                                    |
| instagram_verified           | boolean   | Yes   | —       | —   | Verificado no IG                                                                       |
| instagram_authenticity_score | integer   | Yes   | —       | —   | Score autenticidade (0-100)                                                            |
| instagram_top_hashtags       | text[]    | Yes   | —       | —   | Hashtags mais usadas                                                                   |
| instagram_top_posts          | jsonb     | Yes   | —       | —   | Top posts `{id,url,imageUrl,caption,likes,comments,timestamp}[]`                       |
| instagram_bio                | text      | Yes   | —       | —   | Bio do IG                                                                              |
| instagram_profile_pic        | text      | Yes   | —       | —   | URL foto perfil IG                                                                     |
| instagram_last_updated       | timestamp | Yes   | —       | —   | Última atualização métricas IG                                                         |
| tiktok_followers             | integer   | Yes   | —       | —   | Seguidores TikTok                                                                      |
| tiktok_following             | integer   | Yes   | —       | —   | Seguindo TikTok                                                                        |
| tiktok_hearts                | integer   | Yes   | —       | —   | Curtidas TikTok                                                                        |
| tiktok_videos                | integer   | Yes   | —       | —   | Total vídeos TikTok                                                                    |
| tiktok_engagement_rate       | text      | Yes   | —       | —   | Taxa engajamento TikTok                                                                |
| tiktok_verified              | boolean   | Yes   | —       | —   | Verificado TikTok                                                                      |
| tiktok_bio                   | text      | Yes   | —       | —   | Bio TikTok                                                                             |
| tiktok_profile_pic           | text      | Yes   | —       | —   | Foto perfil TikTok                                                                     |
| tiktok_top_videos            | jsonb     | Yes   | —       | —   | Top vídeos `{id,url,thumbnailUrl,description,plays,likes,comments,shares,timestamp}[]` |
| tiktok_last_updated          | timestamp | Yes   | —       | —   | Última atualização TikTok                                                              |
| youtube_subscribers          | integer   | Yes   | —       | —   | Inscritos YouTube                                                                      |
| youtube_total_views          | integer   | Yes   | —       | —   | Views totais YouTube                                                                   |
| youtube_videos_count         | integer   | Yes   | —       | —   | Total vídeos YouTube                                                                   |
| youtube_verified             | boolean   | Yes   | —       | —   | Verificado YouTube                                                                     |
| youtube_channel_id           | text      | Yes   | —       | —   | Channel ID YouTube                                                                     |
| youtube_description          | text      | Yes   | —       | —   | Descrição canal                                                                        |
| youtube_thumbnail            | text      | Yes   | —       | —   | Thumbnail canal                                                                        |
| youtube_top_videos           | jsonb     | Yes   | —       | —   | Top vídeos `{id,url,thumbnailUrl,title,views,likes,duration,publishedAt}[]`            |
| youtube_last_updated         | timestamp | Yes   | —       | —   | Última atualização YouTube                                                             |
| enrichment_score             | integer   | Yes   | —       | —   | Score completude enrichment                                                            |
| last_enriched_at             | timestamp | Yes   | —       | —   | Último enrichment                                                                      |
| enrichment_source            | text      | Yes   | —       | —   | Fonte último enrichment                                                                |
| pix_key                      | text      | Yes   | —       | —   | Chave Pix                                                                              |
| cpf                          | text      | Yes   | —       | —   | CPF                                                                                    |
| phone                        | text      | Yes   | —       | —   | Telefone                                                                               |
| cep                          | text      | Yes   | —       | —   | CEP                                                                                    |
| street                       | text      | Yes   | —       | —   | Rua                                                                                    |
| number                       | text      | Yes   | —       | —   | Número                                                                                 |
| neighborhood                 | text      | Yes   | —       | —   | Bairro                                                                                 |
| city                         | text      | Yes   | —       | —   | Cidade                                                                                 |
| state                        | text      | Yes   | —       | —   | Estado (UF)                                                                            |
| complement                   | text      | Yes   | —       | —   | Complemento                                                                            |
| company_name                 | text      | Yes   | —       | —   | Nome empresa (role company)                                                            |
| is_verified                  | boolean   | No    | `false` | —   | Email verificado                                                                       |
| verification_token           | text      | Yes   | —       | —   | Token verificação email                                                                |
| reset_token                  | text      | Yes   | —       | —   | Token reset senha                                                                      |
| reset_token_expiry           | timestamp | Yes   | —       | —   | Expiração token reset                                                                  |
| created_at                   | timestamp | No    | `now()` | —   | Data criação                                                                           |

**UNIQUE**: `email` | **Insert schema**: `insertUserSchema` | **Types**: `User`, `InsertUser`

---

## 4. Schema: `company` (3 tables)

Multi-tenant. Empresas separadas de users. Cada user pode pertencer a múltiplas empresas com roles (owner/admin/member/reader). Sessão tem `activeCompanyId`.

### 4.1 `company.companies` (`companies`)

| Column                    | Type      | Null? | Default | FK              | Description                                                                                                                   |
| ------------------------- | --------- | ----- | ------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| id                        | serial    | No    | auto    | —               | PK                                                                                                                            |
| name                      | text      | No    | —       | —               | Nome da empresa                                                                                                               |
| trade_name                | text      | Yes   | —       | —               | Nome fantasia                                                                                                                 |
| slug                      | text      | Yes   | —       | —               | Slug único URL pública                                                                                                        |
| logo                      | text      | Yes   | —       | —               | URL logo                                                                                                                      |
| cover_photo               | text      | Yes   | —       | —               | URL foto capa                                                                                                                 |
| description               | text      | Yes   | —       | —               | Descrição                                                                                                                     |
| cnpj                      | text      | Yes   | —       | —               | CNPJ                                                                                                                          |
| phone                     | text      | Yes   | —       | —               | Telefone                                                                                                                      |
| email                     | text      | Yes   | —       | —               | Email empresa                                                                                                                 |
| website                   | text      | Yes   | —       | —               | URL site                                                                                                                      |
| instagram                 | text      | Yes   | —       | —               | Handle IG                                                                                                                     |
| cep                       | text      | Yes   | —       | —               | CEP                                                                                                                           |
| street                    | text      | Yes   | —       | —               | Rua                                                                                                                           |
| number                    | text      | Yes   | —       | —               | Número                                                                                                                        |
| neighborhood              | text      | Yes   | —       | —               | Bairro                                                                                                                        |
| city                      | text      | Yes   | —       | —               | Cidade                                                                                                                        |
| state                     | text      | Yes   | —       | —               | Estado                                                                                                                        |
| complement                | text      | Yes   | —       | —               | Complemento                                                                                                                   |
| category                  | text      | Yes   | —       | —               | Categoria marca (enum inline, 12 valores)                                                                                     |
| is_discoverable           | boolean   | No    | `true`  | —               | Visível no discovery                                                                                                          |
| is_featured               | boolean   | No    | `false` | —               | Marca destacada                                                                                                               |
| tagline                   | text      | Yes   | —       | —               | Tagline                                                                                                                       |
| auto_join_community       | boolean   | No    | `true`  | —               | Auto-join comunidade                                                                                                          |
| onboarding_completed      | boolean   | No    | `false` | —               | Onboarding concluído                                                                                                          |
| tiktok                    | text      | Yes   | —       | —               | Handle TikTok                                                                                                                 |
| instagram_followers       | integer   | Yes   | —       | —               | Seguidores IG                                                                                                                 |
| instagram_following       | integer   | Yes   | —       | —               | Seguindo IG                                                                                                                   |
| instagram_posts           | integer   | Yes   | —       | —               | Posts IG                                                                                                                      |
| instagram_engagement_rate | text      | Yes   | —       | —               | Engajamento IG                                                                                                                |
| instagram_verified        | boolean   | Yes   | —       | —               | Verificado IG                                                                                                                 |
| instagram_bio             | text      | Yes   | —       | —               | Bio IG                                                                                                                        |
| instagram_profile_pic     | text      | Yes   | —       | —               | Foto perfil IG                                                                                                                |
| instagram_last_updated    | timestamp | Yes   | —       | —               | Última att IG                                                                                                                 |
| tiktok_followers          | integer   | Yes   | —       | —               | Seguidores TikTok                                                                                                             |
| tiktok_hearts             | integer   | Yes   | —       | —               | Curtidas TikTok                                                                                                               |
| tiktok_videos             | integer   | Yes   | —       | —               | Vídeos TikTok                                                                                                                 |
| tiktok_verified           | boolean   | Yes   | —       | —               | Verificado TikTok                                                                                                             |
| tiktok_bio                | text      | Yes   | —       | —               | Bio TikTok                                                                                                                    |
| tiktok_last_updated       | timestamp | Yes   | —       | —               | Última att TikTok                                                                                                             |
| cnpj_razao_social         | text      | Yes   | —       | —               | Razão social (ReceitaWS)                                                                                                      |
| cnpj_nome_fantasia        | text      | Yes   | —       | —               | Nome fantasia (ReceitaWS)                                                                                                     |
| cnpj_situacao             | text      | Yes   | —       | —               | Situação cadastral                                                                                                            |
| cnpj_atividade_principal  | text      | Yes   | —       | —               | CNAE principal                                                                                                                |
| cnpj_data_abertura        | text      | Yes   | —       | —               | Data abertura                                                                                                                 |
| cnpj_capital_social       | text      | Yes   | —       | —               | Capital social                                                                                                                |
| cnpj_natureza_juridica    | text      | Yes   | —       | —               | Natureza jurídica                                                                                                             |
| cnpj_qsa                  | jsonb     | Yes   | —       | —               | QSA `{nome,qual}[]`                                                                                                           |
| cnpj_last_updated         | timestamp | Yes   | —       | —               | Última att CNPJ                                                                                                               |
| website_title             | text      | Yes   | —       | —               | Título site                                                                                                                   |
| website_description       | text      | Yes   | —       | —               | Meta description                                                                                                              |
| website_keywords          | text[]    | Yes   | —       | —               | Keywords site                                                                                                                 |
| website_last_updated      | timestamp | Yes   | —       | —               | Última att site                                                                                                               |
| website_content           | text      | Yes   | —       | —               | Conteúdo textual site                                                                                                         |
| website_about             | text      | Yes   | —       | —               | Página "Sobre"                                                                                                                |
| website_faq               | jsonb     | Yes   | —       | —               | FAQ `{question,answer}[]`                                                                                                     |
| website_pages             | jsonb     | Yes   | —       | —               | Páginas `{url,title,summary}[]`                                                                                               |
| website_social_links      | jsonb     | Yes   | —       | —               | Links sociais `Record<string,string>`                                                                                         |
| brand_colors              | text[]    | Yes   | —       | —               | Cores marca (hex)                                                                                                             |
| brand_logo                | text      | Yes   | —       | —               | Logo marca (enrichment)                                                                                                       |
| company_briefing          | text      | Yes   | —       | —               | Briefing texto livre                                                                                                          |
| structured_briefing       | jsonb     | Yes   | —       | —               | `StructuredBriefing` (whatWeDo, targetAudience, brandVoice, differentials, idealContentTypes, avoidTopics, referenceCreators) |
| website_products          | text[]    | Yes   | —       | —               | Produtos do site                                                                                                              |
| ecommerce_products        | jsonb     | Yes   | —       | —               | Produtos e-commerce `{name,price?,currency?,imageUrl?,url?,category?,description?}[]`                                         |
| ecommerce_product_count   | integer   | Yes   | —       | —               | Qtd produtos                                                                                                                  |
| ecommerce_categories      | text[]    | Yes   | —       | —               | Categorias e-commerce                                                                                                         |
| ecommerce_platform        | text      | Yes   | —       | —               | Plataforma (Shopify, etc)                                                                                                     |
| ecommerce_last_updated    | timestamp | Yes   | —       | —               | Última att e-commerce                                                                                                         |
| ai_context_summary        | text      | Yes   | —       | —               | Resumo AI de enrichment                                                                                                       |
| ai_context_last_updated   | timestamp | Yes   | —       | —               | Última att contexto AI                                                                                                        |
| annual_revenue            | text      | Yes   | —       | —               | Faturamento anual                                                                                                             |
| brand_canvas              | jsonb     | Yes   | —       | —               | `BrandCanvasV2` — ver interface em schema.ts:405-478                                                                          |
| enrichment_score          | integer   | Yes   | —       | —               | Score enrichment                                                                                                              |
| last_enriched_at          | timestamp | Yes   | —       | —               | Último enrichment                                                                                                             |
| created_by_user_id        | integer   | No    | —       | `core.users.id` | Criador da empresa                                                                                                            |
| created_at                | timestamp | No    | `now()` | —               | Data criação                                                                                                                  |

**UNIQUE**: `slug` | **Insert schema**: `insertCompanySchema` | **Types**: `Company`, `InsertCompany`

### 4.2 `company.company_members` (`companyMembers`)

| Column     | Type      | Null? | Default | FK                     | Description                       |
| ---------- | --------- | ----- | ------- | ---------------------- | --------------------------------- |
| id         | serial    | No    | auto    | —                      | PK                                |
| company_id | integer   | No    | —       | `company.companies.id` | Empresa                           |
| user_id    | integer   | No    | —       | `core.users.id`        | Usuário membro                    |
| role       | text      | No    | —       | —                      | `owner`/`admin`/`member`/`reader` |
| created_at | timestamp | No    | `now()` | —                      | Data entrada                      |

**UNIQUE**: `(company_id, user_id)` | **Insert schema**: `insertCompanyMemberSchema` | **Types**: `CompanyMember`, `InsertCompanyMember`

### 4.3 `company.company_user_invites` (`companyUserInvites`)

| Column              | Type      | Null? | Default   | FK                     | Description                                |
| ------------------- | --------- | ----- | --------- | ---------------------- | ------------------------------------------ |
| id                  | serial    | No    | auto      | —                      | PK                                         |
| company_id          | integer   | No    | —         | `company.companies.id` | Empresa                                    |
| email               | text      | No    | —         | —                      | Email convidado                            |
| role                | text      | No    | —         | —                      | `admin`/`member`/`reader`                  |
| token               | text      | No    | —         | —                      | Token único convite                        |
| invited_by_user_id  | integer   | No    | —         | `core.users.id`        | Quem convidou                              |
| status              | text      | No    | `pending` | —                      | `pending`/`accepted`/`expired`/`cancelled` |
| expires_at          | timestamp | No    | —         | —                      | Expiração                                  |
| accepted_by_user_id | integer   | Yes   | —         | `core.users.id`        | Quem aceitou                               |
| accepted_at         | timestamp | Yes   | —         | —                      | Data aceitação                             |
| created_at          | timestamp | No    | `now()`   | —                      | Data criação                               |

**UNIQUE**: `token` | **Insert schema**: `insertCompanyUserInviteSchema` | **Types**: `CompanyUserInvite`, `InsertCompanyUserInvite`

---

## 5. Schema: `campaign` (12 tables)

Campanhas conectam marcas a criadores. Incluem candidaturas, entregas, templates, convites, cupons, hashtags, regras de pontuação, prêmios e stats.

### 5.1 `campaign.campaigns` (`campaigns`)

| Column                  | Type      | Null? | Default   | FK                     | Description                                                  |
| ----------------------- | --------- | ----- | --------- | ---------------------- | ------------------------------------------------------------ |
| id                      | serial    | No    | auto      | —                      | PK                                                           |
| company_id              | integer   | No    | —         | `company.companies.id` | Empresa dona                                                 |
| title                   | text      | No    | —         | —                      | Título                                                       |
| description             | text      | No    | —         | —                      | Descrição                                                    |
| requirements            | text[]    | No    | —         | —                      | Requisitos                                                   |
| deliverables            | text[]    | Yes   | `[]`      | —                      | Deliverables (legacy string)                                 |
| structured_deliverables | jsonb     | Yes   | `[]`      | —                      | `StructuredDeliverable[]` — `{type,quantity,notes?}`         |
| target_platforms        | text[]    | Yes   | `[]`      | —                      | Plataformas alvo                                             |
| budget                  | text      | No    | —         | —                      | Orçamento                                                    |
| deadline                | text      | No    | —         | —                      | Prazo                                                        |
| creators_needed         | integer   | No    | —         | —                      | Qtd criadores                                                |
| target_niche            | text[]    | Yes   | —         | —                      | Nichos alvo                                                  |
| target_age_ranges       | text[]    | Yes   | —         | —                      | Faixas etárias                                               |
| target_regions          | text[]    | Yes   | —         | —                      | Regiões alvo                                                 |
| target_gender           | text      | Yes   | —         | —                      | Gênero alvo (enum inline)                                    |
| status                  | text      | No    | `open`    | —                      | `open`/`closed`                                              |
| visibility              | text      | No    | `public`  | —                      | `public`/`private`/`community_only`                          |
| min_tier_id             | integer   | Yes   | —         | —                      | Tier mínimo                                                  |
| min_points              | integer   | Yes   | `0`       | —                      | Pontos mínimos                                               |
| allowed_tiers           | jsonb     | Yes   | `[]`      | —                      | `number[]` — IDs de tiers permitidos                         |
| rewards_json            | jsonb     | Yes   | `[]`      | —                      | `CampaignReward[]` — `{place,rewardType,value,description?}` |
| template_id             | integer   | Yes   | —         | —                      | Template usado                                               |
| briefing_text           | text      | Yes   | —         | —                      | Texto briefing                                               |
| briefing_materials      | text[]    | Yes   | —         | —                      | URLs materiais briefing                                      |
| inherits_brand_rules    | boolean   | No    | `true`    | —                      | Herda regras da marca                                        |
| reward_mode             | text      | Yes   | `ranking` | —                      | `ranking`/`threshold`/`none`                                 |
| allow_seeding           | boolean   | No    | `true`    | —                      | Permite envio produto                                        |
| allow_payment           | boolean   | No    | `true`    | —                      | Permite pagamento                                            |
| created_at              | timestamp | Yes   | `now()`   | —                      | Data criação                                                 |

**Insert schema**: `insertCampaignSchema` | **Types**: `Campaign`, `InsertCampaign`

### 5.2 `campaign.applications` (`applications`)

| Column                  | Type      | Null? | Default        | FK                      | Description                                                              |
| ----------------------- | --------- | ----- | -------------- | ----------------------- | ------------------------------------------------------------------------ |
| id                      | serial    | No    | auto           | —                       | PK                                                                       |
| campaign_id             | integer   | No    | —              | `campaign.campaigns.id` | Campanha                                                                 |
| creator_id              | integer   | No    | —              | `core.users.id`         | Criador                                                                  |
| status                  | text      | No    | `pending`      | —                       | `pending`/`accepted`/`rejected`                                          |
| workflow_status         | text      | Yes   | —              | —                       | Status workflow customizado                                              |
| creator_workflow_status | text      | Yes   | `aceito`       | —                       | `aceito`/`contrato`/`aguardando_produto`/`producao`/`revisao`/`entregue` |
| message                 | text      | Yes   | —              | —                       | Mensagem do criador                                                      |
| applied_at              | timestamp | Yes   | `now()`        | —                       | Data candidatura                                                         |
| seeding_status          | text      | Yes   | `not_required` | —                       | `not_required`/`pending`/`sent`/`received`                               |
| seeding_sent_at         | timestamp | Yes   | —              | —                       | Data envio produto                                                       |
| seeding_received_at     | timestamp | Yes   | —              | —                       | Data recebimento                                                         |
| seeding_tracking_code   | text      | Yes   | —              | —                       | Código rastreio                                                          |
| seeding_notes           | text      | Yes   | —              | —                       | Notas seeding                                                            |

**UNIQUE**: `(campaign_id, creator_id)` | **Insert schema**: `insertApplicationSchema` | **Types**: `Application`, `InsertApplication`

### 5.3 `campaign.deliverables` (`deliverables`)

| Column           | Type      | Null? | Default | FK                         | Description                           |
| ---------------- | --------- | ----- | ------- | -------------------------- | ------------------------------------- |
| id               | serial    | No    | auto    | —                          | PK                                    |
| application_id   | integer   | No    | —       | `campaign.applications.id` | Application                           |
| file_name        | text      | No    | —       | —                          | Nome arquivo                          |
| file_url         | text      | No    | —       | —                          | URL arquivo                           |
| file_type        | text      | Yes   | —       | —                          | Tipo MIME                             |
| deliverable_type | text      | Yes   | `other` | —                          | Tipo entrega (enum inline, 8 valores) |
| description      | text      | Yes   | —       | —                          | Descrição                             |
| uploaded_at      | timestamp | No    | `now()` | —                          | Data upload                           |

**Insert schema**: `insertDeliverableSchema` | **Types**: `Deliverable`, `InsertDeliverable`

### 5.4 `campaign.deliverable_comments` (`deliverableComments`)

| Column         | Type      | Null? | Default | FK                         | Description      |
| -------------- | --------- | ----- | ------- | -------------------------- | ---------------- |
| id             | serial    | No    | auto    | —                          | PK               |
| deliverable_id | integer   | No    | —       | `campaign.deliverables.id` | Deliverable      |
| user_id        | integer   | No    | —       | `core.users.id`            | Autor            |
| comment        | text      | No    | —       | —                          | Texto comentário |
| created_at     | timestamp | No    | `now()` | —                          | Data criação     |

**Insert schema**: `insertDeliverableCommentSchema` | **Types**: `DeliverableComment`, `InsertDeliverableComment`

### 5.5 `campaign.campaign_templates` (`campaignTemplates`)

| Column                  | Type      | Null? | Default   | FK                     | Description                   |
| ----------------------- | --------- | ----- | --------- | ---------------------- | ----------------------------- |
| id                      | serial    | No    | auto      | —                      | PK                            |
| company_id              | integer   | No    | —         | `company.companies.id` | Empresa                       |
| name                    | text      | No    | —         | —                      | Nome template                 |
| description             | text      | Yes   | —         | —                      | Descrição                     |
| title                   | text      | No    | —         | —                      | Título campanha               |
| campaign_description    | text      | No    | —         | —                      | Descrição campanha            |
| requirements            | text[]    | No    | —         | —                      | Requisitos                    |
| structured_deliverables | jsonb     | Yes   | `[]`      | —                      | `StructuredDeliverable[]`     |
| target_platforms        | text[]    | Yes   | `[]`      | —                      | Plataformas                   |
| budget                  | text      | No    | —         | —                      | Orçamento                     |
| deadline                | text      | No    | —         | —                      | Prazo                         |
| creators_needed         | integer   | No    | —         | —                      | Qtd criadores                 |
| target_niche            | text[]    | Yes   | —         | —                      | Nichos                        |
| target_age_ranges       | text[]    | Yes   | —         | —                      | Faixas etárias                |
| target_regions          | text[]    | Yes   | —         | —                      | Regiões                       |
| target_gender           | text      | Yes   | —         | —                      | Gênero (enum inline)          |
| visibility              | text      | Yes   | `public`  | —                      | Visibilidade (enum inline)    |
| min_tier_id             | integer   | Yes   | —         | —                      | Tier mínimo                   |
| min_points              | integer   | Yes   | `0`       | —                      | Pontos mínimos                |
| allowed_tiers           | jsonb     | Yes   | `[]`      | —                      | `number[]`                    |
| rewards_json            | jsonb     | Yes   | `[]`      | —                      | `CampaignReward[]`            |
| reward_mode             | text      | Yes   | `ranking` | —                      | Modo recompensa (enum inline) |
| briefing_text           | text      | Yes   | —         | —                      | Briefing                      |
| created_at              | timestamp | No    | `now()`   | —                      | Criação                       |
| updated_at              | timestamp | No    | `now()`   | —                      | Atualização                   |

**Insert schema**: `insertCampaignTemplateSchema` | **Types**: `CampaignTemplate`, `InsertCampaignTemplate`

### 5.6 `campaign.campaign_invites` (`campaignInvites`)

| Column       | Type      | Null? | Default   | FK                      | Description                     |
| ------------ | --------- | ----- | --------- | ----------------------- | ------------------------------- |
| id           | serial    | No    | auto      | —                       | PK                              |
| campaign_id  | integer   | No    | —         | `campaign.campaigns.id` | Campanha                        |
| company_id   | integer   | No    | —         | `company.companies.id`  | Empresa                         |
| creator_id   | integer   | No    | —         | `core.users.id`         | Criador convidado               |
| status       | text      | No    | `pending` | —                       | `pending`/`accepted`/`declined` |
| created_at   | timestamp | No    | `now()`   | —                       | Data convite                    |
| responded_at | timestamp | Yes   | —         | —                       | Data resposta                   |

**UNIQUE**: `(campaign_id, creator_id)` | **Insert schema**: `insertCampaignInviteSchema` | **Types**: `CampaignInvite`, `InsertCampaignInvite`

### 5.7 `campaign.campaign_tags` (`campaignTags`)

| Column      | Type      | Null? | Default | FK                                | Description |
| ----------- | --------- | ----- | ------- | --------------------------------- | ----------- |
| id          | serial    | No    | auto    | —                                 | PK          |
| campaign_id | integer   | No    | —       | `campaign.campaigns.id` (CASCADE) | Campanha    |
| tag_id      | integer   | No    | —       | `system.tags.id` (CASCADE)        | Tag         |
| created_at  | timestamp | No    | `now()` | —                                 | Data        |

**UNIQUE**: `(campaign_id, tag_id)` | **Insert schema**: `insertCampaignTagSchema` | **Types**: `CampaignTag`, `InsertCampaignTag`

### 5.8 `campaign.campaign_hashtags` (`campaignHashtags`)

| Column            | Type      | Null? | Default | FK                      | Description         |
| ----------------- | --------- | ----- | ------- | ----------------------- | ------------------- |
| id                | serial    | No    | auto    | —                       | PK                  |
| campaign_id       | integer   | No    | —       | `campaign.campaigns.id` | Campanha            |
| company_id        | integer   | No    | —       | `company.companies.id`  | Empresa             |
| hashtag           | text      | No    | —       | —                       | Hashtag monitorada  |
| hashtag_id        | text      | Yes   | —       | —                       | ID hashtag no IG    |
| is_active         | boolean   | No    | `true`  | —                       | Monitoramento ativo |
| last_checked_at   | timestamp | Yes   | —       | —                       | Última verificação  |
| total_posts_found | integer   | Yes   | `0`     | —                       | Posts encontrados   |
| created_at        | timestamp | No    | `now()` | —                       | Data criação        |

**UNIQUE**: `(campaign_id, hashtag)` | **Insert schema**: `insertCampaignHashtagSchema` | **Types**: `CampaignHashtag`, `InsertCampaignHashtag`

### 5.9 `campaign.campaign_coupons` (`campaignCoupons`)

| Column         | Type      | Null? | Default | FK                      | Description           |
| -------------- | --------- | ----- | ------- | ----------------------- | --------------------- |
| id             | serial    | No    | auto    | —                       | PK                    |
| campaign_id    | integer   | No    | —       | `campaign.campaigns.id` | Campanha              |
| creator_id     | integer   | Yes   | —       | `core.users.id`         | Criador vinculado     |
| code           | text      | No    | —       | —                       | Código cupom          |
| discount_type  | text      | No    | —       | —                       | `percentage`/`fixed`  |
| discount_value | integer   | No    | —       | —                       | Valor (% ou centavos) |
| max_uses       | integer   | Yes   | —       | —                       | Máximo usos           |
| current_uses   | integer   | No    | `0`     | —                       | Usos atuais           |
| expires_at     | timestamp | Yes   | —       | —                       | Expiração             |
| is_active      | boolean   | No    | `true`  | —                       | Ativo                 |
| created_at     | timestamp | Yes   | `now()` | —                       | Data criação          |

**UNIQUE**: `code` | **Insert schema**: `insertCampaignCouponSchema` | **Types**: `CampaignCoupon`, `InsertCampaignCoupon`

### 5.10 `campaign.campaign_points_rules` (`campaignPointsRules`)

| Column          | Type      | Null? | Default | FK                                | Description                                |
| --------------- | --------- | ----- | ------- | --------------------------------- | ------------------------------------------ |
| id              | serial    | No    | auto    | —                                 | PK                                         |
| campaign_id     | integer   | No    | —       | `campaign.campaigns.id` (CASCADE) | Campanha                                   |
| overrides_brand | boolean   | No    | `false` | —                                 | Sobrescreve regras da marca                |
| rules_json      | jsonb     | Yes   | —       | —                                 | Regras de pontuação (ver interface abaixo) |
| created_at      | timestamp | No    | `now()` | —                                 | Criação                                    |
| updated_at      | timestamp | No    | `now()` | —                                 | Atualização                                |

**UNIQUE**: `campaign_id`

**Interface `rules_json`**:

```typescript
{
  postTypes?: { post_feed?: number; reels?: number; stories?: number; tiktok?: number; youtube_video?: number; youtube_shorts?: number; twitter_post?: number; other?: number };
  viewsMilestone?: { per: number; points: number };
  likesMilestone?: { threshold: number; points: number };
  commentsMilestone?: { threshold: number; points: number };
  salesPoints?: { pointsPerSale: number; bonusPercentage?: number };
  deliveryPoints?: { approved: number; onTimeBonus: number };
  courseCompletionPoints?: number;
}
```

**Insert schema**: `insertCampaignPointsRulesSchema` | **Types**: `CampaignPointsRules`, `InsertCampaignPointsRules`

### 5.11 `campaign.campaign_prizes` (`campaignPrizes`)

| Column              | Type      | Null? | Default | FK                                | Description                    |
| ------------------- | --------- | ----- | ------- | --------------------------------- | ------------------------------ |
| id                  | serial    | No    | auto    | —                                 | PK                             |
| campaign_id         | integer   | No    | —       | `campaign.campaigns.id` (CASCADE) | Campanha                       |
| type                | text      | No    | —       | —                                 | `ranking_place`/`milestone`    |
| rank_position       | integer   | Yes   | —       | —                                 | Posição ranking                |
| milestone_points    | integer   | Yes   | —       | —                                 | Threshold pontos               |
| reward_kind         | text      | No    | —       | —                                 | `cash`/`product`/`both`/`none` |
| cash_amount         | integer   | Yes   | —       | —                                 | Valor centavos                 |
| product_sku         | text      | Yes   | —       | —                                 | SKU produto                    |
| product_description | text      | Yes   | —       | —                                 | Descrição produto              |
| notes               | text      | Yes   | —       | —                                 | Notas                          |
| created_at          | timestamp | No    | `now()` | —                                 | Data criação                   |

**Insert schema**: `insertCampaignPrizeSchema` | **Types**: `CampaignPrize`, `InsertCampaignPrize`

### 5.12 `campaign.campaign_creator_stats` (`campaignCreatorStats`)

| Column                 | Type      | Null? | Default | FK                      | Description         |
| ---------------------- | --------- | ----- | ------- | ----------------------- | ------------------- |
| id                     | serial    | No    | auto    | —                       | PK                  |
| campaign_id            | integer   | No    | —       | `campaign.campaigns.id` | Campanha            |
| creator_id             | integer   | No    | —       | `core.users.id`         | Criador             |
| points                 | integer   | No    | `0`     | —                       | Pontos acumulados   |
| rank                   | integer   | Yes   | —       | —                       | Posição leaderboard |
| deliverables_completed | integer   | No    | `0`     | —                       | Entregas feitas     |
| deliverables_on_time   | integer   | No    | `0`     | —                       | Entregas no prazo   |
| total_views            | integer   | No    | `0`     | —                       | Views totais        |
| total_engagement       | integer   | No    | `0`     | —                       | Engajamento total   |
| total_sales            | integer   | No    | `0`     | —                       | Vendas geradas      |
| quality_score          | integer   | Yes   | —       | —                       | Score qualidade     |
| updated_at             | timestamp | Yes   | `now()` | —                       | Última atualização  |

**UNIQUE**: `(campaign_id, creator_id)` | **Insert schema**: `insertCampaignCreatorStatsSchema` | **Types**: `CampaignCreatorStats`, `InsertCampaignCreatorStats`

---

## 6. Schema: `creator` (7 tables)

Dados específicos de criadores — posts analisados, hashtags, tags de taxonomia, perfis discovery, endereços, ad partners e auth links.

### 6.1 `creator.creator_posts` (`creatorPosts`)

| Column          | Type      | Null? | Default | FK              | Description                               |
| --------------- | --------- | ----- | ------- | --------------- | ----------------------------------------- |
| id              | serial    | No    | auto    | —               | PK                                        |
| user_id         | integer   | No    | —       | `core.users.id` | Criador                                   |
| platform        | text      | No    | —       | —               | `instagram`/`tiktok`                      |
| post_id         | text      | No    | —       | —               | ID externo na plataforma                  |
| post_url        | text      | No    | —       | —               | URL do post                               |
| post_type       | text      | Yes   | —       | —               | `image`/`video`/`carousel`/`reel`/`story` |
| caption         | text      | Yes   | —       | —               | Legenda                                   |
| thumbnail_url   | text      | Yes   | —       | —               | Thumbnail                                 |
| likes           | integer   | Yes   | `0`     | —               | Curtidas                                  |
| comments        | integer   | Yes   | `0`     | —               | Comentários                               |
| shares          | integer   | Yes   | `0`     | —               | Compartilhamentos                         |
| views           | integer   | Yes   | `0`     | —               | Visualizações                             |
| saves           | integer   | Yes   | `0`     | —               | Saves                                     |
| engagement_rate | text      | Yes   | —       | —               | Taxa engajamento                          |
| hashtags        | text[]    | Yes   | —       | —               | Hashtags usadas                           |
| mentions        | text[]    | Yes   | —       | —               | Menções                                   |
| ai_analysis     | text      | Yes   | —       | —               | Análise AI                                |
| posted_at       | timestamp | Yes   | —       | —               | Data publicação                           |
| analyzed_at     | timestamp | No    | `now()` | —               | Data análise                              |

**UNIQUE**: `(user_id, platform, post_id)` | **Insert schema**: `insertCreatorPostSchema` | **Types**: `CreatorPost`, `InsertCreatorPost`

### 6.2 `creator.creator_hashtags` (`creatorHashtags`)

| Column         | Type      | Null? | Default | FK              | Description          |
| -------------- | --------- | ----- | ------- | --------------- | -------------------- |
| id             | serial    | No    | auto    | —               | PK                   |
| user_id        | integer   | No    | —       | `core.users.id` | Criador              |
| platform       | text      | No    | —       | —               | `instagram`/`tiktok` |
| hashtag        | text      | No    | —       | —               | Hashtag              |
| usage_count    | integer   | Yes   | `1`     | —               | Vezes usada          |
| avg_engagement | text      | Yes   | —       | —               | Engajamento médio    |
| last_used      | timestamp | Yes   | —       | —               | Última vez usada     |

**UNIQUE**: `(user_id, platform, hashtag)` | **Insert schema**: `insertCreatorHashtagSchema` | **Types**: `CreatorHashtag`, `InsertCreatorHashtag`

### 6.3 `creator.creator_tags` (`creatorTags`)

| Column     | Type      | Null? | Default | FK                         | Description |
| ---------- | --------- | ----- | ------- | -------------------------- | ----------- |
| id         | serial    | No    | auto    | —                          | PK          |
| creator_id | integer   | No    | —       | `core.users.id` (CASCADE)  | Criador     |
| tag_id     | integer   | No    | —       | `system.tags.id` (CASCADE) | Tag         |
| created_at | timestamp | No    | `now()` | —                          | Data        |

**UNIQUE**: `(creator_id, tag_id)` | **Insert schema**: `insertCreatorTagSchema` | **Types**: `CreatorTag`, `InsertCreatorTag`

### 6.4 `creator.creator_discovery_profiles` (`creatorDiscoveryProfiles`)

| Column            | Type      | Null? | Default  | FK                               | Description               |
| ----------------- | --------- | ----- | -------- | -------------------------------- | ------------------------- |
| id                | serial    | No    | auto     | —                                | PK                        |
| company_id        | integer   | No    | —        | `company.companies.id` (CASCADE) | Empresa dona              |
| instagram_handle  | text      | No    | —        | —                                | Handle IG                 |
| display_name      | text      | Yes   | —        | —                                | Nome exibição             |
| avatar_url        | text      | Yes   | —        | —                                | Avatar                    |
| bio               | text      | Yes   | —        | —                                | Bio                       |
| followers         | integer   | Yes   | —        | —                                | Seguidores                |
| following         | integer   | Yes   | —        | —                                | Seguindo                  |
| posts             | integer   | Yes   | —        | —                                | Posts                     |
| engagement_rate   | text      | Yes   | —        | —                                | Engajamento               |
| niche_tags        | text[]    | Yes   | `[]`     | —                                | Tags nicho                |
| location          | text      | Yes   | —        | —                                | Localização               |
| source            | text      | No    | `manual` | —                                | `manual`/`apify`/`import` |
| linked_creator_id | integer   | Yes   | —        | `core.users.id`                  | Criador vinculado         |
| last_fetched_at   | timestamp | Yes   | —        | —                                | Última busca              |
| created_at        | timestamp | No    | `now()`  | —                                | Data criação              |

**UNIQUE**: `(company_id, instagram_handle)` | **Insert schema**: `insertCreatorDiscoveryProfileSchema` | **Types**: `CreatorDiscoveryProfile`, `InsertCreatorDiscoveryProfile`

### 6.5 `creator.creator_addresses` (`creatorAddresses`)

| Column         | Type      | Null? | Default     | FK                        | Description       |
| -------------- | --------- | ----- | ----------- | ------------------------- | ----------------- |
| id             | serial    | No    | auto        | —                         | PK                |
| creator_id     | integer   | No    | —           | `core.users.id` (CASCADE) | Criador           |
| label          | text      | Yes   | `principal` | —                         | Rótulo endereço   |
| recipient_name | text      | No    | —           | —                         | Nome destinatário |
| street         | text      | No    | —           | —                         | Rua               |
| number         | text      | No    | —           | —                         | Número            |
| complement     | text      | Yes   | —           | —                         | Complemento       |
| neighborhood   | text      | No    | —           | —                         | Bairro            |
| city           | text      | No    | —           | —                         | Cidade            |
| state          | text      | No    | —           | —                         | Estado            |
| zip_code       | text      | No    | —           | —                         | CEP               |
| country        | text      | Yes   | `Brasil`    | —                         | País              |
| phone          | text      | Yes   | —           | —                         | Telefone entrega  |
| is_default     | boolean   | Yes   | `true`      | —                         | Endereço padrão   |
| created_at     | timestamp | No    | `now()`     | —                         | Criação           |
| updated_at     | timestamp | No    | `now()`     | —                         | Atualização       |

**Insert schema**: `insertCreatorAddressSchema` | **Types**: `CreatorAddress`, `InsertCreatorAddress`

### 6.6 `creator.creator_ad_partners` (`creatorAdPartners`)

| Column                | Type      | Null? | Default   | FK                               | Description                                           |
| --------------------- | --------- | ----- | --------- | -------------------------------- | ----------------------------------------------------- |
| id                    | serial    | No    | auto      | —                                | PK                                                    |
| company_id            | integer   | No    | —         | `company.companies.id` (CASCADE) | Empresa                                               |
| creator_id            | integer   | Yes   | —         | `core.users.id` (CASCADE)        | Criador                                               |
| instagram_account_id  | integer   | Yes   | —         | `social.instagram_accounts.id`   | Conta IG                                              |
| instagram_user_id     | text      | Yes   | —         | —                                | IG user ID                                            |
| instagram_username    | text      | Yes   | —         | —                                | Username IG                                           |
| instagram_profile_pic | text      | Yes   | —         | —                                | Foto perfil                                           |
| status                | text      | Yes   | `pending` | —                                | `pending`/`request_sent`/`active`/`expired`/`revoked` |
| authorized_at         | timestamp | Yes   | —         | —                                | Data autorização                                      |
| expires_at            | timestamp | Yes   | —         | —                                | Expiração                                             |
| permissions           | text[]    | Yes   | —         | —                                | Permissões                                            |
| meta_partner_id       | text      | Yes   | —         | —                                | ID parceiro Meta                                      |
| created_at            | timestamp | Yes   | `now()`   | —                                | Criação                                               |
| updated_at            | timestamp | Yes   | `now()`   | —                                | Atualização                                           |

**Insert schema**: `insertCreatorAdPartnerSchema` | **Types**: `CreatorAdPartner`, `InsertCreatorAdPartner`

### 6.7 `creator.creator_auth_links` (`creatorAuthLinks`)

| Column             | Type      | Null? | Default | FK                               | Description  |
| ------------------ | --------- | ----- | ------- | -------------------------------- | ------------ |
| id                 | serial    | No    | auto    | —                                | PK           |
| company_id         | integer   | No    | —       | `company.companies.id` (CASCADE) | Empresa      |
| creator_id         | integer   | Yes   | —       | `core.users.id`                  | Criador      |
| token              | text      | No    | —       | —                                | Token único  |
| instagram_username | text      | Yes   | —       | —                                | Username IG  |
| email              | text      | Yes   | —       | —                                | Email        |
| is_used            | boolean   | Yes   | `false` | —                                | Já usado     |
| used_at            | timestamp | Yes   | —       | —                                | Data uso     |
| expires_at         | timestamp | No    | —       | —                                | Expiração    |
| redirect_url       | text      | Yes   | —       | —                                | URL redirect |
| created_at         | timestamp | Yes   | `now()` | —                                | Criação      |

**UNIQUE**: `token` | **Insert schema**: `insertCreatorAuthLinkSchema` | **Types**: `CreatorAuthLink`, `InsertCreatorAuthLink`

---

## 7. Schema: `brand` (4 tables)

Landing pages de marca, tags, tiers de creators e memberships de comunidade.

### 7.1 `brand.brand_settings` (`brandSettings`)

| Column                      | Type      | Null? | Default   | FK                               | Description                                        |
| --------------------------- | --------- | ----- | --------- | -------------------------------- | -------------------------------------------------- |
| id                          | serial    | No    | auto      | —                                | PK                                                 |
| company_id                  | integer   | No    | —         | `company.companies.id` (CASCADE) | Empresa                                            |
| slug                        | text      | No    | —         | —                                | Slug único landing page                            |
| logo_url                    | text      | Yes   | —         | —                                | URL logo                                           |
| primary_color               | text      | Yes   | `#6366f1` | —                                | Cor primária                                       |
| secondary_color             | text      | Yes   | `#8b5cf6` | —                                | Cor secundária                                     |
| background_color            | text      | Yes   | `#ffffff` | —                                | Cor fundo                                          |
| text_color                  | text      | Yes   | `#1f2937` | —                                | Cor texto                                          |
| accent_color                | text      | Yes   | `#10b981` | —                                | Cor destaque                                       |
| brand_name                  | text      | No    | —         | —                                | Nome marca                                         |
| tagline                     | text      | Yes   | —         | —                                | Tagline                                            |
| description                 | text      | Yes   | —         | —                                | Descrição                                          |
| welcome_message             | text      | Yes   | —         | —                                | Mensagem boas-vindas                               |
| terms_and_conditions        | text      | Yes   | —         | —                                | Termos                                             |
| privacy_policy              | text      | Yes   | —         | —                                | Política privacidade                               |
| is_active                   | boolean   | Yes   | `true`    | —                                | Ativo                                              |
| requires_approval           | boolean   | Yes   | `true`    | —                                | Requer aprovação                                   |
| default_campaign_id         | integer   | Yes   | —         | `campaign.campaigns.id`          | Campanha padrão                                    |
| collect_social_profiles     | boolean   | Yes   | `true`    | —                                | Coletar perfis sociais                             |
| collect_shipping_address    | boolean   | Yes   | `true`    | —                                | Coletar endereço                                   |
| collect_payment_info        | boolean   | Yes   | `true`    | —                                | Coletar dados pagamento                            |
| collect_clothing_size       | boolean   | Yes   | `false`   | —                                | Coletar tamanho roupa                              |
| collect_content_preferences | boolean   | Yes   | `false`   | —                                | Coletar preferências conteúdo                      |
| custom_fields               | jsonb     | Yes   | `[]`      | —                                | `{id,label,type,required,options?,placeholder?}[]` |
| created_at                  | timestamp | No    | `now()`   | —                                | Criação                                            |
| updated_at                  | timestamp | No    | `now()`   | —                                | Atualização                                        |

**UNIQUE**: `slug` | **Insert schema**: `insertBrandSettingsSchema` | **Types**: `BrandSettings`, `InsertBrandSettings`

### 7.2 `brand.brand_tags` (`brandTags`)

| Column     | Type      | Null? | Default | FK                               | Description |
| ---------- | --------- | ----- | ------- | -------------------------------- | ----------- |
| id         | serial    | No    | auto    | —                                | PK          |
| brand_id   | integer   | No    | —       | `company.companies.id` (CASCADE) | Marca       |
| tag_id     | integer   | No    | —       | `system.tags.id` (CASCADE)       | Tag         |
| created_at | timestamp | No    | `now()` | —                                | Data        |

**UNIQUE**: `(brand_id, tag_id)` | **Insert schema**: `insertBrandTagSchema` | **Types**: `BrandTag`, `InsertBrandTag`

### 7.3 `brand.brand_creator_tiers` (`brandCreatorTiers`)

| Column             | Type      | Null? | Default | FK                                              | Description            |
| ------------------ | --------- | ----- | ------- | ----------------------------------------------- | ---------------------- |
| id                 | serial    | No    | auto    | —                                               | PK                     |
| company_id         | integer   | No    | —       | `company.companies.id` (CASCADE)                | Empresa                |
| creator_id         | integer   | No    | —       | `core.users.id`                                 | Criador                |
| tier_id            | integer   | Yes   | —       | `gamification.brand_tier_configs.id` (SET NULL) | Tier atual             |
| total_brand_points | integer   | No    | `0`     | —                                               | Pontos totais na marca |
| updated_at         | timestamp | No    | `now()` | —                                               | Atualização            |

**UNIQUE**: `(company_id, creator_id)` | **Insert schema**: `insertBrandCreatorTierSchema` | **Types**: `BrandCreatorTier`, `InsertBrandCreatorTier`

### 7.4 `brand.brand_creator_memberships` (`brandCreatorMemberships`)

| Column            | Type      | Null? | Default   | FK                                   | Description                                 |
| ----------------- | --------- | ----- | --------- | ------------------------------------ | ------------------------------------------- |
| id                | serial    | No    | auto      | —                                    | PK                                          |
| company_id        | integer   | No    | —         | `company.companies.id` (CASCADE)     | Empresa                                     |
| creator_id        | integer   | No    | —         | `core.users.id` (CASCADE)            | Criador                                     |
| status            | text      | No    | `invited` | —                                    | `invited`/`active`/`suspended`/`archived`   |
| source            | text      | No    | `manual`  | —                                    | `manual`/`campaign`/`invite`/`self_request` |
| tier_id           | integer   | Yes   | —         | `gamification.brand_tier_configs.id` | Tier                                        |
| points_cache      | integer   | No    | `0`       | —                                    | Cache pontos                                |
| tags              | text[]    | Yes   | `[]`      | —                                    | Tags customizadas                           |
| coupon_code       | text      | Yes   | —         | —                                    | Cupom do creator                            |
| invite_id         | integer   | Yes   | —         | —                                    | ID convite (sem FK)                         |
| campaign_id       | integer   | Yes   | —         | `campaign.campaigns.id`              | Campanha origem                             |
| terms_accepted_at | timestamp | Yes   | —         | —                                    | Aceitação termos                            |
| terms_accepted_ip | text      | Yes   | —         | —                                    | IP aceitação                                |
| joined_at         | timestamp | Yes   | —         | —                                    | Data entrada                                |
| last_activity_at  | timestamp | Yes   | —         | —                                    | Última atividade                            |
| created_at        | timestamp | No    | `now()`   | —                                    | Criação                                     |
| updated_at        | timestamp | No    | `now()`   | —                                    | Atualização                                 |

**UNIQUE**: `(company_id, creator_id)` | **Insert schema**: `insertBrandCreatorMembershipSchema` | **Types**: `BrandCreatorMembership`, `InsertBrandCreatorMembership`

---

## 8. Schema: `content` (6 tables)

Inspirations (swipe file), coleções, salvos, vinculação com campanhas e blog.

### 8.1 `content.inspirations` (`inspirations`)

| Column             | Type      | Null? | Default  | FK                               | Description                         |
| ------------------ | --------- | ----- | -------- | -------------------------------- | ----------------------------------- |
| id                 | serial    | No    | auto     | —                                | PK                                  |
| scope              | text      | No    | `global` | —                                | `global`/`brand`                    |
| brand_id           | integer   | Yes   | —        | `company.companies.id` (CASCADE) | Marca (se scope=brand)              |
| title              | text      | No    | —        | —                                | Título                              |
| description        | text      | Yes   | —        | —                                | Descrição                           |
| platform           | text      | No    | —        | —                                | Plataforma (enum inline, 5 valores) |
| format             | text      | No    | —        | —                                | Formato (enum inline, 11 valores)   |
| url                | text      | No    | —        | —                                | URL do conteúdo                     |
| thumbnail_url      | text      | Yes   | —        | —                                | Thumbnail                           |
| tags               | text[]    | No    | `[]`     | —                                | Tags                                |
| niche_tags         | text[]    | No    | `[]`     | —                                | Tags nicho                          |
| is_published       | boolean   | No    | `true`   | —                                | Publicado                           |
| created_by_user_id | integer   | Yes   | —        | `core.users.id`                  | Criador                             |
| created_at         | timestamp | No    | `now()`  | —                                | Data criação                        |

**Insert schema**: `insertInspirationSchema` | **Types**: `Inspiration`, `InsertInspiration`

### 8.2 `content.inspiration_collections` (`inspirationCollections`)

| Column     | Type      | Null? | Default | FK                        | Description    |
| ---------- | --------- | ----- | ------- | ------------------------- | -------------- |
| id         | serial    | No    | auto    | —                         | PK             |
| creator_id | integer   | No    | —       | `core.users.id` (CASCADE) | Criador dono   |
| title      | text      | No    | —       | —                         | Título coleção |
| created_at | timestamp | No    | `now()` | —                         | Data criação   |

**Insert schema**: `insertInspirationCollectionSchema` | **Types**: `InspirationCollection`, `InsertInspirationCollection`

### 8.3 `content.inspiration_collection_items` (`inspirationCollectionItems`)

| Column         | Type      | Null? | Default | FK                                             | Description |
| -------------- | --------- | ----- | ------- | ---------------------------------------------- | ----------- |
| id             | serial    | No    | auto    | —                                              | PK          |
| collection_id  | integer   | No    | —       | `content.inspiration_collections.id` (CASCADE) | Coleção     |
| inspiration_id | integer   | No    | —       | `content.inspirations.id` (CASCADE)            | Inspiração  |
| created_at     | timestamp | No    | `now()` | —                                              | Data        |

**Insert schema**: `insertInspirationCollectionItemSchema` | **Types**: `InspirationCollectionItem`, `InsertInspirationCollectionItem`

### 8.4 `content.creator_saved_inspirations` (`creatorSavedInspirations`)

| Column         | Type      | Null? | Default | FK                                  | Description |
| -------------- | --------- | ----- | ------- | ----------------------------------- | ----------- |
| id             | serial    | No    | auto    | —                                   | PK          |
| creator_id     | integer   | No    | —       | `core.users.id` (CASCADE)           | Criador     |
| inspiration_id | integer   | No    | —       | `content.inspirations.id` (CASCADE) | Inspiração  |
| created_at     | timestamp | No    | `now()` | —                                   | Data        |

**Insert schema**: `insertCreatorSavedInspirationSchema` | **Types**: `CreatorSavedInspiration`, `InsertCreatorSavedInspiration`

### 8.5 `content.campaign_inspirations` (`campaignInspirations`)

| Column         | Type      | Null? | Default | FK                                  | Description |
| -------------- | --------- | ----- | ------- | ----------------------------------- | ----------- |
| id             | serial    | No    | auto    | —                                   | PK          |
| campaign_id    | integer   | No    | —       | `campaign.campaigns.id` (CASCADE)   | Campanha    |
| inspiration_id | integer   | No    | —       | `content.inspirations.id` (CASCADE) | Inspiração  |
| created_at     | timestamp | No    | `now()` | —                                   | Data        |

**Insert schema**: `insertCampaignInspirationSchema` | **Types**: `CampaignInspiration`, `InsertCampaignInspiration`

### 8.6 `content.blog_posts` (`blogPosts`)

| Column           | Type      | Null? | Default          | FK  | Description            |
| ---------------- | --------- | ----- | ---------------- | --- | ---------------------- |
| id               | serial    | No    | auto             | —   | PK                     |
| slug             | text      | No    | —                | —   | Slug único             |
| type             | text      | No    | `article`        | —   | Tipo post              |
| category         | text      | No    | `dicas`          | —   | Categoria              |
| title            | text      | No    | —                | —   | Título                 |
| excerpt          | text      | No    | —                | —   | Resumo                 |
| content          | text      | No    | —                | —   | Conteúdo HTML          |
| image            | text      | Yes   | —                | —   | Imagem destaque        |
| author           | text      | No    | `CreatorConnect` | —   | Autor                  |
| author_avatar    | text      | Yes   | —                | —   | Avatar autor           |
| read_time        | text      | Yes   | —                | —   | Tempo leitura          |
| featured         | boolean   | Yes   | `false`          | —   | Destaque               |
| published        | boolean   | Yes   | `false`          | —   | Publicado              |
| meta_title       | text      | Yes   | —                | —   | SEO title              |
| meta_description | text      | Yes   | —                | —   | SEO description        |
| meta_keywords    | text[]    | Yes   | —                | —   | SEO keywords           |
| canonical_url    | text      | Yes   | —                | —   | URL canônica           |
| og_image         | text      | Yes   | —                | —   | Open Graph image       |
| structured_data  | jsonb     | Yes   | —                | —   | Schema.org data        |
| company          | text      | Yes   | —                | —   | Empresa mencionada     |
| metric_value     | text      | Yes   | —                | —   | Valor métrica destaque |
| metric_label     | text      | Yes   | —                | —   | Label métrica          |
| created_at       | timestamp | No    | `now()`          | —   | Criação                |
| updated_at       | timestamp | No    | `now()`          | —   | Atualização            |

**UNIQUE**: `slug` | **Indexes**: `blog_posts_slug_idx`, `blog_posts_published_idx`, `blog_posts_category_idx`
**Insert schema**: `insertBlogPostSchema` | **Types**: `BlogPost`, `InsertBlogPost`

---

## 9. Schema: `messaging` (3 tables)

Sistema unificado de mensagens entre criadores e empresas, por marca ou campanha.

### 9.1 `messaging.conversations` (`conversations`)

| Column          | Type      | Null? | Default | FK                                | Description                 |
| --------------- | --------- | ----- | ------- | --------------------------------- | --------------------------- |
| id              | serial    | No    | auto    | —                                 | PK                          |
| type            | text      | No    | —       | —                                 | `brand`/`campaign`          |
| status          | text      | No    | `open`  | —                                 | `open`/`resolved`           |
| brand_id        | integer   | Yes   | —       | `company.companies.id` (CASCADE)  | Marca (se type=brand)       |
| campaign_id     | integer   | Yes   | —       | `campaign.campaigns.id` (CASCADE) | Campanha (se type=campaign) |
| creator_id      | integer   | No    | —       | `core.users.id` (CASCADE)         | Criador                     |
| company_id      | integer   | No    | —       | `company.companies.id` (CASCADE)  | Empresa                     |
| last_message_at | timestamp | Yes   | —       | —                                 | Última mensagem             |
| created_at      | timestamp | No    | `now()` | —                                 | Criação                     |

**UNIQUE**: `(brand_id, creator_id)` NULLS NOT DISTINCT, `(campaign_id, creator_id)` NULLS NOT DISTINCT
**Insert schema**: `insertConversationSchema` | **Types**: `Conversation`, `InsertConversation`

### 9.2 `messaging.conv_messages` (`convMessages`)

| Column          | Type      | Null? | Default | FK                                     | Description    |
| --------------- | --------- | ----- | ------- | -------------------------------------- | -------------- |
| id              | serial    | No    | auto    | —                                      | PK             |
| conversation_id | integer   | No    | —       | `messaging.conversations.id` (CASCADE) | Conversa       |
| sender_user_id  | integer   | No    | —       | `core.users.id`                        | Remetente      |
| body            | text      | No    | —       | —                                      | Texto mensagem |
| created_at      | timestamp | No    | `now()` | —                                      | Data envio     |

**Insert schema**: `insertConvMessageSchema` | **Types**: `ConvMessage`, `InsertConvMessage`

### 9.3 `messaging.message_reads` (`messageReads`)

| Column          | Type      | Null? | Default | FK                                     | Description    |
| --------------- | --------- | ----- | ------- | -------------------------------------- | -------------- |
| id              | serial    | No    | auto    | —                                      | PK             |
| conversation_id | integer   | No    | —       | `messaging.conversations.id` (CASCADE) | Conversa       |
| user_id         | integer   | No    | —       | `core.users.id` (CASCADE)              | Usuário        |
| last_read_at    | timestamp | No    | `now()` | —                                      | Última leitura |

**UNIQUE**: `(conversation_id, user_id)` | **Insert schema**: `insertMessageReadSchema` | **Types**: `MessageRead`, `InsertMessageRead`

---

## 10. Schema: `gamification` (9 tables)

Levels globais, pontos, badges, programas por marca, recompensas, tiers, ledger de pontos e entitlements.

### 10.1 `gamification.creator_levels` (`creatorLevels`)

| Column     | Type    | Null? | Default | FK  | Description                                |
| ---------- | ------- | ----- | ------- | --- | ------------------------------------------ |
| id         | serial  | No    | auto    | —   | PK                                         |
| name       | text    | No    | —       | —   | Nome nível (Bronze, Prata, Ouro, Diamante) |
| min_points | integer | No    | —       | —   | Pontos mínimos                             |
| max_points | integer | Yes   | —       | —   | Pontos máximos                             |
| icon       | text    | Yes   | —       | —   | Ícone/emoji                                |
| color      | text    | Yes   | —       | —   | Cor hex                                    |
| benefits   | text[]  | Yes   | —       | —   | Benefícios                                 |

**Insert schema**: `insertCreatorLevelSchema` | **Types**: `CreatorLevel`, `InsertCreatorLevel`

### 10.2 `gamification.creator_points` (`creatorPoints`)

| Column      | Type      | Null? | Default       | FK              | Description                        |
| ----------- | --------- | ----- | ------------- | --------------- | ---------------------------------- |
| id          | serial    | No    | auto          | —               | PK                                 |
| creator_id  | integer   | No    | —             | `core.users.id` | Criador                            |
| points      | integer   | No    | —             | —               | Pontos ganhos                      |
| action      | text      | No    | —             | —               | Ação (enum inline, 21 valores)     |
| category    | text      | No    | `achievement` | —               | Categoria (enum inline, 6 valores) |
| description | text      | Yes   | —             | —               | Descrição                          |
| related_id  | integer   | Yes   | —             | —               | ID entidade relacionada            |
| created_at  | timestamp | Yes   | `now()`       | —               | Data                               |

**Insert schema**: `insertCreatorPointsSchema` | **Types**: `CreatorPointsEntry`, `InsertCreatorPoints`

### 10.3 `gamification.badges` (`badges`)

| Column         | Type      | Null? | Default | FK  | Description                             |
| -------------- | --------- | ----- | ------- | --- | --------------------------------------- |
| id             | serial    | No    | auto    | —   | PK                                      |
| name           | text      | No    | —       | —   | Nome badge                              |
| description    | text      | Yes   | —       | —   | Descrição                               |
| icon           | text      | No    | —       | —   | Ícone                                   |
| color          | text      | Yes   | —       | —   | Cor                                     |
| requirement    | text      | No    | —       | —   | Requisito (ex: "complete_10_campaigns") |
| required_value | integer   | Yes   | —       | —   | Valor necessário                        |
| is_secret      | boolean   | No    | `false` | —   | Badge secreto                           |
| created_at     | timestamp | Yes   | `now()` | —   | Data                                    |

**Insert schema**: `insertBadgeSchema` | **Types**: `Badge`, `InsertBadge`

### 10.4 `gamification.creator_badges` (`creatorBadges`)

| Column     | Type      | Null? | Default | FK                       | Description    |
| ---------- | --------- | ----- | ------- | ------------------------ | -------------- |
| id         | serial    | No    | auto    | —                        | PK             |
| creator_id | integer   | No    | —       | `core.users.id`          | Criador        |
| badge_id   | integer   | No    | —       | `gamification.badges.id` | Badge          |
| earned_at  | timestamp | Yes   | `now()` | —                        | Data conquista |

**UNIQUE**: `(creator_id, badge_id)` | **Insert schema**: `insertCreatorBadgeSchema` | **Types**: `CreatorBadge`, `InsertCreatorBadge`

### 10.5 `gamification.brand_programs` (`brandPrograms`)

| Column                 | Type      | Null? | Default                | FK                               | Description                                                                               |
| ---------------------- | --------- | ----- | ---------------------- | -------------------------------- | ----------------------------------------------------------------------------------------- |
| id                     | serial    | No    | auto                   | —                                | PK                                                                                        |
| company_id             | integer   | No    | —                      | `company.companies.id` (CASCADE) | Empresa                                                                                   |
| name                   | text      | Yes   | `Programa de Creators` | —                                | Nome programa                                                                             |
| description            | text      | Yes   | —                      | —                                | Descrição                                                                                 |
| auto_join_community    | boolean   | No    | `true`                 | —                                | Auto-join                                                                                 |
| coupon_prefix          | text      | Yes   | —                      | —                                | Prefixo cupons                                                                            |
| coupon_generation_rule | text      | Yes   | `prefix_username`      | —                                | Regra geração (enum inline)                                                               |
| requirements_json      | jsonb     | Yes   | —                      | —                                | `{minFollowers?,niches?,regions?,minEngagementRate?,minAuthenticityScore?,verifiedOnly?}` |
| gamification_enabled   | boolean   | No    | `true`                 | —                                | Gamificação ativa                                                                         |
| default_reward_mode    | text      | Yes   | `ranking`              | —                                | Modo recompensa padrão                                                                    |
| created_at             | timestamp | No    | `now()`                | —                                | Criação                                                                                   |
| updated_at             | timestamp | No    | `now()`                | —                                | Atualização                                                                               |

**UNIQUE**: `company_id` | **Insert schema**: `insertBrandProgramSchema` | **Types**: `BrandProgram`, `InsertBrandProgram`

### 10.6 `gamification.brand_rewards` (`brandRewards`)

| Column        | Type      | Null? | Default | FK                               | Description                             |
| ------------- | --------- | ----- | ------- | -------------------------------- | --------------------------------------- |
| id            | serial    | No    | auto    | —                                | PK                                      |
| company_id    | integer   | No    | —       | `company.companies.id` (CASCADE) | Empresa                                 |
| name          | text      | No    | —       | —                                | Nome prêmio                             |
| description   | text      | Yes   | —       | —                                | Descrição                               |
| type          | text      | No    | —       | —                                | `cash`/`product`/`benefit`/`experience` |
| value         | integer   | Yes   | —       | —                                | Valor centavos                          |
| image_url     | text      | Yes   | —       | —                                | Imagem                                  |
| sku           | text      | Yes   | —       | —                                | SKU                                     |
| stock         | integer   | Yes   | —       | —                                | Estoque (null=ilimitado)                |
| is_active     | boolean   | No    | `true`  | —                                | Ativo                                   |
| tier_required | integer   | Yes   | —       | —                                | Tier mínimo                             |
| points_cost   | integer   | Yes   | —       | —                                | Custo em pontos                         |
| created_at    | timestamp | No    | `now()` | —                                | Criação                                 |
| updated_at    | timestamp | No    | `now()` | —                                | Atualização                             |

**Insert schema**: `insertBrandRewardSchema` | **Types**: `BrandReward`, `InsertBrandReward`

### 10.7 `gamification.brand_tier_configs` (`brandTierConfigs`)

| Column        | Type      | Null? | Default | FK                               | Description                                                                          |
| ------------- | --------- | ----- | ------- | -------------------------------- | ------------------------------------------------------------------------------------ |
| id            | serial    | No    | auto    | —                                | PK                                                                                   |
| company_id    | integer   | No    | —       | `company.companies.id` (CASCADE) | Empresa                                                                              |
| tier_name     | text      | No    | —       | —                                | Nome tier                                                                            |
| min_points    | integer   | No    | `0`     | —                                | Pontos mínimos                                                                       |
| color         | text      | Yes   | —       | —                                | Cor hex                                                                              |
| icon          | text      | Yes   | —       | —                                | Ícone                                                                                |
| benefits_json | jsonb     | Yes   | —       | —                                | `{priorityCampaigns?,fasterPayout?,exclusiveContent?,badgeVisible?,customBenefits?}` |
| sort_order    | integer   | No    | `0`     | —                                | Ordem exibição                                                                       |
| created_at    | timestamp | No    | `now()` | —                                | Criação                                                                              |
| updated_at    | timestamp | No    | `now()` | —                                | Atualização                                                                          |

**Insert schema**: `insertBrandTierConfigSchema` | **Types**: `BrandTierConfig`, `InsertBrandTierConfig`

### 10.8 `gamification.points_ledger` (`pointsLedger`)

| Column       | Type      | Null? | Default | FK                                | Description                                                                                           |
| ------------ | --------- | ----- | ------- | --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| id           | serial    | No    | auto    | —                                 | PK                                                                                                    |
| company_id   | integer   | No    | —       | `company.companies.id` (CASCADE)  | Empresa                                                                                               |
| campaign_id  | integer   | Yes   | —       | `campaign.campaigns.id` (CASCADE) | Campanha                                                                                              |
| creator_id   | integer   | No    | —       | `core.users.id`                   | Criador                                                                                               |
| delta_points | integer   | No    | —       | —                                 | Delta pontos (+/-)                                                                                    |
| event_type   | text      | No    | —       | —                                 | Tipo evento (enum inline, 14 valores)                                                                 |
| event_ref_id | text      | Yes   | —       | —                                 | ID externo evento                                                                                     |
| ref_type     | text      | Yes   | —       | —                                 | Tipo ref (deliverable/post/sale/etc)                                                                  |
| ref_id       | integer   | Yes   | —       | —                                 | ID interno ref                                                                                        |
| metadata     | jsonb     | Yes   | —       | —                                 | `{postUrl?,platform?,viewCount?,likeCount?,commentCount?,saleAmount?,couponCode?,notes?,adjustedBy?}` |
| notes        | text      | Yes   | —       | —                                 | Notas                                                                                                 |
| created_at   | timestamp | No    | `now()` | —                                 | Data                                                                                                  |

**UNIQUE**: `(campaign_id, creator_id, event_type, ref_type, ref_id)` — idempotency
**Insert schema**: `insertPointsLedgerSchema` | **Types**: `PointsLedgerEntry`, `InsertPointsLedgerEntry`

### 10.9 `gamification.reward_entitlements` (`rewardEntitlements`)

| Column                | Type      | Null? | Default   | FK                                      | Description                         |
| --------------------- | --------- | ----- | --------- | --------------------------------------- | ----------------------------------- |
| id                    | serial    | No    | auto      | —                                       | PK                                  |
| company_id            | integer   | No    | —         | `company.companies.id` (CASCADE)        | Empresa                             |
| campaign_id           | integer   | No    | —         | `campaign.campaigns.id` (CASCADE)       | Campanha                            |
| creator_id            | integer   | No    | —         | `core.users.id`                         | Criador                             |
| prize_id              | integer   | No    | —         | `campaign.campaign_prizes.id` (CASCADE) | Prêmio                              |
| source_type           | text      | No    | —         | —                                       | `milestone_reached`/`ranking_place` |
| points_at_time        | integer   | Yes   | —         | —                                       | Pontos no momento                   |
| rank_at_time          | integer   | Yes   | —         | —                                       | Rank no momento                     |
| reward_kind           | text      | No    | —         | —                                       | `cash`/`product`/`both`/`none`      |
| cash_amount           | integer   | Yes   | —         | —                                       | Valor centavos                      |
| product_sku           | text      | Yes   | —         | —                                       | SKU                                 |
| product_description   | text      | Yes   | —         | —                                       | Descrição produto                   |
| status                | text      | No    | `pending` | —                                       | Status (enum inline, 7 valores)     |
| wallet_transaction_id | integer   | Yes   | —         | `billing.wallet_transactions.id`        | Transação wallet                    |
| shipment_id           | integer   | Yes   | —         | —                                       | ID envio (sem FK)                   |
| approved_by           | integer   | Yes   | —         | `core.users.id`                         | Aprovador                           |
| approved_at           | timestamp | Yes   | —         | —                                       | Data aprovação                      |
| rejected_by           | integer   | Yes   | —         | `core.users.id`                         | Rejeitador                          |
| rejected_at           | timestamp | Yes   | —         | —                                       | Data rejeição                       |
| rejection_reason      | text      | Yes   | —         | —                                       | Motivo rejeição                     |
| notes                 | text      | Yes   | —         | —                                       | Notas                               |
| created_at            | timestamp | No    | `now()`   | —                                       | Criação                             |
| updated_at            | timestamp | No    | `now()`   | —                                       | Atualização                         |

**UNIQUE**: `(creator_id, prize_id)` | **Insert schema**: `insertRewardEntitlementSchema` | **Types**: `RewardEntitlement`, `InsertRewardEntitlement`

---

## 11. Schema: `analytics` (3 tables)

Histórico de métricas de creators, snapshots de campanhas e perfis.

### 11.1 `analytics.creator_analytics_history` (`creatorAnalyticsHistory`)

| Column          | Type      | Null? | Default | FK              | Description          |
| --------------- | --------- | ----- | ------- | --------------- | -------------------- |
| id              | serial    | No    | auto    | —               | PK                   |
| user_id         | integer   | No    | —       | `core.users.id` | Criador              |
| platform        | text      | No    | —       | —               | `instagram`/`tiktok` |
| followers       | integer   | Yes   | —       | —               | Seguidores           |
| following       | integer   | Yes   | —       | —               | Seguindo             |
| posts           | integer   | Yes   | —       | —               | Posts                |
| engagement_rate | text      | Yes   | —       | —               | Engajamento          |
| avg_likes       | integer   | Yes   | —       | —               | Média curtidas       |
| avg_comments    | integer   | Yes   | —       | —               | Média comentários    |
| avg_views       | integer   | Yes   | —       | —               | Média views          |
| recorded_at     | timestamp | No    | `now()` | —               | Data registro        |

**Insert schema**: `insertCreatorAnalyticsHistorySchema` | **Types**: `CreatorAnalyticsHistory`, `InsertCreatorAnalyticsHistory`

### 11.2 `analytics.campaign_metric_snapshots` (`campaignMetricSnapshots`)

| Column                | Type      | Null? | Default | FK                                | Description           |
| --------------------- | --------- | ----- | ------- | --------------------------------- | --------------------- |
| id                    | serial    | No    | auto    | —                                 | PK                    |
| campaign_id           | integer   | No    | —       | `campaign.campaigns.id` (CASCADE) | Campanha              |
| creator_id            | integer   | No    | —       | `core.users.id`                   | Criador               |
| post_id               | text      | No    | —       | —                                 | ID externo post       |
| platform              | text      | No    | —       | —                                 | `instagram`/`tiktok`  |
| post_url              | text      | Yes   | —       | —                                 | URL post              |
| views                 | integer   | No    | `0`     | —                                 | Views atuais          |
| likes                 | integer   | No    | `0`     | —                                 | Likes atuais          |
| comments              | integer   | No    | `0`     | —                                 | Comments atuais       |
| last_awarded_views    | integer   | No    | `0`     | —                                 | Views já premiados    |
| last_awarded_likes    | integer   | No    | `0`     | —                                 | Likes já premiados    |
| last_awarded_comments | integer   | No    | `0`     | —                                 | Comments já premiados |
| update_count          | integer   | No    | `0`     | —                                 | Qtd atualizações      |
| sum_views_deltas      | integer   | No    | `0`     | —                                 | Soma deltas views     |
| sum_likes_deltas      | integer   | No    | `0`     | —                                 | Soma deltas likes     |
| sum_comments_deltas   | integer   | No    | `0`     | —                                 | Soma deltas comments  |
| total_points_awarded  | integer   | No    | `0`     | —                                 | Total pontos dados    |
| points_awarded_today  | integer   | No    | `0`     | —                                 | Pontos dados hoje     |
| last_points_date      | timestamp | Yes   | —       | —                                 | Data último ponto     |
| flagged_for_review    | boolean   | No    | `false` | —                                 | Flagged (spike)       |
| flag_reason           | text      | Yes   | —       | —                                 | Motivo flag           |
| posted_at             | timestamp | Yes   | —       | —                                 | Data publicação       |
| last_snapshot_at      | timestamp | No    | `now()` | —                                 | Último snapshot       |
| created_at            | timestamp | No    | `now()` | —                                 | Criação               |

**UNIQUE**: `(campaign_id, post_id, platform)` | **Insert schema**: `insertCampaignMetricSnapshotSchema` | **Types**: `CampaignMetricSnapshot`, `InsertCampaignMetricSnapshot`

### 11.3 `analytics.profile_snapshots` (`profileSnapshots`)

| Column            | Type      | Null? | Default | FK  | Description            |
| ----------------- | --------- | ----- | ------- | --- | ---------------------- |
| id                | serial    | No    | auto    | —   | PK                     |
| username          | text      | No    | —       | —   | Username IG            |
| followers_count   | integer   | Yes   | —       | —   | Seguidores             |
| follows_count     | integer   | Yes   | —       | —   | Seguindo               |
| posts_count       | integer   | Yes   | —       | —   | Posts                  |
| engagement_rate   | text      | Yes   | —       | —   | Engajamento            |
| is_verified       | boolean   | Yes   | `false` | —   | Verificado             |
| is_private        | boolean   | Yes   | `false` | —   | Privado                |
| biography         | text      | Yes   | —       | —   | Bio                    |
| full_name         | text      | Yes   | —       | —   | Nome completo          |
| profile_pic_url   | text      | Yes   | —       | —   | Foto perfil            |
| external_url      | text      | Yes   | —       | —   | URL externa            |
| business_category | text      | Yes   | —       | —   | Categoria negócio      |
| raw_data          | jsonb     | Yes   | —       | —   | Dados brutos completos |
| snapshot_date     | timestamp | No    | `now()` | —   | Data snapshot          |
| created_at        | timestamp | No    | `now()` | —   | Criação                |

**Insert schema**: `insertProfileSnapshotSchema` | **Types**: `ProfileSnapshot`, `InsertProfileSnapshot`

---

## 12. Schema: `billing` (7 tables)

Wallets de empresa, caixinhas, saldos de criador, transações, lotes de pagamento, tracking de vendas e comissões.

### 12.1 `billing.company_wallets` (`companyWallets`)

| Column              | Type      | Null? | Default | FK                               | Description              |
| ------------------- | --------- | ----- | ------- | -------------------------------- | ------------------------ |
| id                  | serial    | No    | auto    | —                                | PK                       |
| company_id          | integer   | No    | —       | `company.companies.id` (CASCADE) | Empresa                  |
| balance             | integer   | No    | `0`     | —                                | Saldo centavos           |
| reserved_balance    | integer   | No    | `0`     | —                                | Saldo reservado centavos |
| billing_cycle_start | timestamp | Yes   | —       | —                                | Início ciclo             |
| billing_cycle_end   | timestamp | Yes   | —       | —                                | Fim ciclo                |
| created_at          | timestamp | No    | `now()` | —                                | Criação                  |
| updated_at          | timestamp | No    | `now()` | —                                | Atualização              |

**UNIQUE**: `company_id` | **Insert schema**: `insertCompanyWalletSchema` | **Types**: `CompanyWallet`, `InsertCompanyWallet`

### 12.2 `billing.wallet_boxes` (`walletBoxes`)

| Column            | Type      | Null? | Default      | FK                                     | Description          |
| ----------------- | --------- | ----- | ------------ | -------------------------------------- | -------------------- |
| id                | serial    | No    | auto         | —                                      | PK                   |
| company_wallet_id | integer   | No    | —            | `billing.company_wallets.id` (CASCADE) | Wallet               |
| name              | text      | No    | —            | —                                      | Nome caixinha        |
| description       | text      | Yes   | —            | —                                      | Descrição            |
| color             | text      | Yes   | `#6366f1`    | —                                      | Cor                  |
| icon              | text      | Yes   | `piggy-bank` | —                                      | Ícone                |
| target_amount     | integer   | Yes   | —            | —                                      | Meta centavos        |
| current_amount    | integer   | No    | `0`          | —                                      | Valor atual centavos |
| is_active         | boolean   | Yes   | `true`       | —                                      | Ativo                |
| created_at        | timestamp | No    | `now()`      | —                                      | Criação              |
| updated_at        | timestamp | No    | `now()`      | —                                      | Atualização          |

**Insert schema**: `insertWalletBoxSchema` | **Types**: `WalletBox`, `InsertWalletBox`

### 12.3 `billing.creator_balances` (`creatorBalances`)

| Column            | Type      | Null? | Default | FK                        | Description                           |
| ----------------- | --------- | ----- | ------- | ------------------------- | ------------------------------------- |
| id                | serial    | No    | auto    | —                         | PK                                    |
| user_id           | integer   | No    | —       | `core.users.id` (CASCADE) | Criador                               |
| available_balance | integer   | No    | `0`     | —                         | Disponível centavos                   |
| pending_balance   | integer   | No    | `0`     | —                         | Pendente centavos                     |
| pix_key           | text      | Yes   | —       | —                         | Chave Pix                             |
| pix_key_type      | text      | Yes   | —       | —                         | `cpf`/`cnpj`/`email`/`phone`/`random` |
| created_at        | timestamp | No    | `now()` | —                         | Criação                               |
| updated_at        | timestamp | No    | `now()` | —                         | Atualização                           |

**UNIQUE**: `user_id` | **Insert schema**: `insertCreatorBalanceSchema` | **Types**: `CreatorBalance`, `InsertCreatorBalance`

### 12.4 `billing.wallet_transactions` (`walletTransactions`)

| Column              | Type      | Null? | Default   | FK                                      | Description                              |
| ------------------- | --------- | ----- | --------- | --------------------------------------- | ---------------------------------------- |
| id                  | serial    | No    | auto      | —                                       | PK                                       |
| company_wallet_id   | integer   | Yes   | —         | `billing.company_wallets.id` (CASCADE)  | Wallet empresa                           |
| creator_balance_id  | integer   | Yes   | —         | `billing.creator_balances.id` (CASCADE) | Balance criador                          |
| type                | text      | No    | —         | —                                       | Tipo transação (enum inline, 10 valores) |
| amount              | integer   | No    | —         | —                                       | Valor centavos                           |
| balance_after       | integer   | Yes   | —         | —                                       | Saldo após                               |
| related_user_id     | integer   | Yes   | —         | `core.users.id`                         | Criador envolvido                        |
| related_campaign_id | integer   | Yes   | —         | `campaign.campaigns.id`                 | Campanha                                 |
| wallet_box_id       | integer   | Yes   | —         | `billing.wallet_boxes.id`               | Caixinha                                 |
| description         | text      | Yes   | —         | —                                       | Descrição                                |
| notes               | text      | Yes   | —         | —                                       | Notas                                    |
| tags                | text[]    | Yes   | —         | —                                       | Tags                                     |
| stripe_event_id     | text      | Yes   | —         | —                                       | ID evento Stripe (idempotency)           |
| status              | text      | No    | `pending` | —                                       | Status (enum inline, 6 valores)          |
| scheduled_for       | timestamp | Yes   | —         | —                                       | Agendado para                            |
| processed_at        | timestamp | Yes   | —         | —                                       | Processado em                            |
| created_at          | timestamp | No    | `now()`   | —                                       | Criação                                  |
| updated_at          | timestamp | No    | `now()`   | —                                       | Atualização                              |

**UNIQUE**: `stripe_event_id` | **Insert schema**: `insertWalletTransactionSchema` | **Types**: `WalletTransaction`, `InsertWalletTransaction`

### 12.5 `billing.payment_batches` (`paymentBatches`)

| Column            | Type      | Null? | Default | FK                                     | Description                     |
| ----------------- | --------- | ----- | ------- | -------------------------------------- | ------------------------------- |
| id                | serial    | No    | auto    | —                                      | PK                              |
| company_wallet_id | integer   | No    | —       | `billing.company_wallets.id` (CASCADE) | Wallet                          |
| name              | text      | Yes   | —       | —                                      | Nome lote                       |
| total_amount      | integer   | No    | —       | —                                      | Total centavos                  |
| transaction_count | integer   | No    | —       | —                                      | Qtd transações                  |
| status            | text      | No    | `draft` | —                                      | Status (enum inline, 6 valores) |
| processed_at      | timestamp | Yes   | —       | —                                      | Processado em                   |
| created_at        | timestamp | No    | `now()` | —                                      | Criação                         |
| updated_at        | timestamp | No    | `now()` | —                                      | Atualização                     |

**Insert schema**: `insertPaymentBatchSchema` | **Types**: `PaymentBatch`, `InsertPaymentBatch`

### 12.6 `billing.sales_tracking` (`salesTracking`)

| Column              | Type      | Null? | Default   | FK                             | Description                              |
| ------------------- | --------- | ----- | --------- | ------------------------------ | ---------------------------------------- |
| id                  | serial    | No    | auto      | —                              | PK                                       |
| company_id          | integer   | No    | —         | `company.companies.id`         | Empresa                                  |
| campaign_id         | integer   | Yes   | —         | `campaign.campaigns.id`        | Campanha                                 |
| creator_id          | integer   | No    | —         | `core.users.id`                | Criador                                  |
| coupon_id           | integer   | Yes   | —         | `campaign.campaign_coupons.id` | Cupom                                    |
| coupon_code         | text      | Yes   | —         | —                              | Código cupom                             |
| order_id            | text      | No    | —         | —                              | ID pedido                                |
| external_order_id   | text      | Yes   | —         | —                              | ID externo                               |
| order_value         | integer   | No    | —         | —                              | Valor centavos                           |
| commission          | integer   | Yes   | —         | —                              | Comissão centavos                        |
| commission_rate_bps | integer   | Yes   | —         | —                              | Taxa bps (1000=10%)                      |
| platform            | text      | No    | —         | —                              | `shopify`/`woocommerce`/`manual`         |
| status              | text      | No    | `pending` | —                              | `pending`/`confirmed`/`paid`/`cancelled` |
| raw_json            | jsonb     | Yes   | —         | —                              | Dados brutos                             |
| tracked_at          | timestamp | Yes   | `now()`   | —                              | Data tracking                            |

**Insert schema**: `insertSalesTrackingSchema` | **Types**: `SalesTracking`, `InsertSalesTracking`

### 12.7 `billing.creator_commissions` (`creatorCommissions`)

| Column            | Type      | Null? | Default   | FK                          | Description                            |
| ----------------- | --------- | ----- | --------- | --------------------------- | -------------------------------------- |
| id                | serial    | No    | auto      | —                           | PK                                     |
| company_id        | integer   | No    | —         | `company.companies.id`      | Empresa                                |
| creator_id        | integer   | No    | —         | `core.users.id`             | Criador                                |
| campaign_id       | integer   | Yes   | —         | `campaign.campaigns.id`     | Campanha                               |
| sales_tracking_id | integer   | Yes   | —         | `billing.sales_tracking.id` | Venda                                  |
| amount            | integer   | No    | —         | —                           | Valor centavos                         |
| status            | text      | No    | `pending` | —                           | `pending`/`approved`/`paid`/`rejected` |
| approved_at       | timestamp | Yes   | —         | —                           | Aprovação                              |
| paid_at           | timestamp | Yes   | —         | —                           | Pagamento                              |
| created_at        | timestamp | Yes   | `now()`   | —                           | Criação                                |

**Insert schema**: `insertCreatorCommissionSchema` | **Types**: `CreatorCommission`, `InsertCreatorCommission`

---

## 13. Schema: `academy` (5 tables)

Sistema educacional com cursos, módulos, aulas e progresso de criadores.

### 13.1 `academy.courses` (`courses`)

| Column            | Type      | Null? | Default | FK  | Description                       |
| ----------------- | --------- | ----- | ------- | --- | --------------------------------- |
| id                | serial    | No    | auto    | —   | PK                                |
| slug              | text      | No    | —       | —   | Slug único                        |
| title             | text      | No    | —       | —   | Título                            |
| description       | text      | Yes   | —       | —   | Descrição                         |
| level             | text      | No    | `basic` | —   | `basic`/`intermediate`/`advanced` |
| estimated_minutes | integer   | No    | `30`    | —   | Duração estimada                  |
| cover_url         | text      | Yes   | —       | —   | URL capa                          |
| is_published      | boolean   | No    | `true`  | —   | Publicado                         |
| created_at        | timestamp | No    | `now()` | —   | Criação                           |

**UNIQUE**: `slug` | **Insert schema**: `insertCourseSchema` | **Types**: `Course`, `InsertCourse`

### 13.2 `academy.course_modules` (`courseModules`)

| Column    | Type    | Null? | Default | FK                             | Description   |
| --------- | ------- | ----- | ------- | ------------------------------ | ------------- |
| id        | serial  | No    | auto    | —                              | PK            |
| course_id | integer | No    | —       | `academy.courses.id` (CASCADE) | Curso         |
| title     | text    | No    | —       | —                              | Título módulo |
| order     | integer | No    | `0`     | —                              | Ordem         |

**Insert schema**: `insertCourseModuleSchema` | **Types**: `CourseModule`, `InsertCourseModule`

### 13.3 `academy.course_lessons` (`courseLessons`)

| Column           | Type      | Null? | Default | FK                                    | Description                       |
| ---------------- | --------- | ----- | ------- | ------------------------------------- | --------------------------------- |
| id               | serial    | No    | auto    | —                                     | PK                                |
| module_id        | integer   | No    | —       | `academy.course_modules.id` (CASCADE) | Módulo                            |
| title            | text      | No    | —       | —                                     | Título aula                       |
| order            | integer   | No    | `0`     | —                                     | Ordem                             |
| content_type     | text      | No    | `text`  | —                                     | `text`/`video`/`link`/`checklist` |
| content          | jsonb     | Yes   | —       | —                                     | `{body?,url?,items?}`             |
| duration_minutes | integer   | Yes   | `5`     | —                                     | Duração minutos                   |
| created_at       | timestamp | No    | `now()` | —                                     | Criação                           |

**Insert schema**: `insertCourseLessonSchema` | **Types**: `CourseLesson`, `InsertCourseLesson`

### 13.4 `academy.creator_course_progress` (`creatorCourseProgress`)

| Column            | Type      | Null? | Default | FK                             | Description |
| ----------------- | --------- | ----- | ------- | ------------------------------ | ----------- |
| id                | serial    | No    | auto    | —                              | PK          |
| creator_id        | integer   | No    | —       | `core.users.id` (CASCADE)      | Criador     |
| course_id         | integer   | No    | —       | `academy.courses.id` (CASCADE) | Curso       |
| started_at        | timestamp | No    | `now()` | —                              | Início      |
| completed_at      | timestamp | Yes   | —       | —                              | Conclusão   |
| progress_pct      | integer   | No    | `0`     | —                              | Progresso % |
| current_lesson_id | integer   | Yes   | —       | —                              | Aula atual  |
| updated_at        | timestamp | No    | `now()` | —                              | Atualização |

**UNIQUE**: `(creator_id, course_id)` | **Insert schema**: `insertCreatorCourseProgressSchema` | **Types**: `CreatorCourseProgress`, `InsertCreatorCourseProgress`

### 13.5 `academy.creator_lesson_progress` (`creatorLessonProgress`)

| Column       | Type      | Null? | Default | FK                                    | Description    |
| ------------ | --------- | ----- | ------- | ------------------------------------- | -------------- |
| id           | serial    | No    | auto    | —                                     | PK             |
| creator_id   | integer   | No    | —       | `core.users.id` (CASCADE)             | Criador        |
| lesson_id    | integer   | No    | —       | `academy.course_lessons.id` (CASCADE) | Aula           |
| completed_at | timestamp | No    | `now()` | —                                     | Data conclusão |

**UNIQUE**: `(creator_id, lesson_id)` | **Insert schema**: `insertCreatorLessonProgressSchema` | **Types**: `CreatorLessonProgress`, `InsertCreatorLessonProgress`

---

## 14. Schema: `social` (16 tables)

Integrações Instagram, TikTok, YouTube, DMs, Meta Ads.

### 14.1 `social.instagram_accounts` (`instagramAccounts`)

| Column                  | Type      | Null? | Default | FK                               | Description          |
| ----------------------- | --------- | ----- | ------- | -------------------------------- | -------------------- |
| id                      | serial    | No    | auto    | —                                | PK                   |
| user_id                 | integer   | Yes   | —       | `core.users.id` (CASCADE)        | Usuário              |
| company_id              | integer   | Yes   | —       | `company.companies.id` (CASCADE) | Empresa              |
| instagram_user_id       | text      | No    | —       | —                                | IG user ID           |
| facebook_user_id        | text      | Yes   | —       | —                                | Facebook user ID     |
| username                | text      | No    | —       | —                                | Username             |
| name                    | text      | Yes   | —       | —                                | Nome                 |
| profile_picture_url     | text      | Yes   | —       | —                                | Foto perfil          |
| account_type            | text      | No    | —       | —                                | `creator`/`business` |
| access_token            | text      | No    | —       | —                                | Token acesso         |
| access_token_expires_at | timestamp | Yes   | —       | —                                | Expiração token      |
| refresh_token           | text      | Yes   | —       | —                                | Refresh token        |
| scopes                  | text[]    | Yes   | —       | —                                | Scopes concedidos    |
| followers_count         | integer   | Yes   | —       | —                                | Seguidores           |
| follows_count           | integer   | Yes   | —       | —                                | Seguindo             |
| media_count             | integer   | Yes   | —       | —                                | Mídias               |
| biography               | text      | Yes   | —       | —                                | Bio                  |
| website                 | text      | Yes   | —       | —                                | Website              |
| is_active               | boolean   | Yes   | `true`  | —                                | Ativo                |
| last_sync_at            | timestamp | Yes   | —       | —                                | Último sync          |
| created_at              | timestamp | Yes   | `now()` | —                                | Criação              |
| updated_at              | timestamp | Yes   | `now()` | —                                | Atualização          |

**UNIQUE**: `instagram_user_id` | **Insert schema**: `insertInstagramAccountSchema` | **Types**: `InstagramAccount`, `InsertInstagramAccount`

### 14.2 `social.instagram_profiles` (`instagramProfiles`)

| Column                   | Type      | Null? | Default    | FK                                        | Description                            |
| ------------------------ | --------- | ----- | ---------- | ----------------------------------------- | -------------------------------------- |
| id                       | serial    | No    | auto       | —                                         | PK                                     |
| username                 | text      | No    | —          | —                                         | Username IG                            |
| owner_type               | text      | No    | `external` | —                                         | `user`/`company`/`external`            |
| user_id                  | integer   | Yes   | —          | `core.users.id` (SET NULL)                | Usuário                                |
| company_id               | integer   | Yes   | —          | `company.companies.id` (SET NULL)         | Empresa                                |
| instagram_account_id     | integer   | Yes   | —          | `social.instagram_accounts.id` (SET NULL) | Conta IG                               |
| source                   | text      | No    | `manual`   | —                                         | `oauth`/`apify`/`manual`/`api`         |
| followers                | integer   | Yes   | —          | —                                         | Seguidores                             |
| following                | integer   | Yes   | —          | —                                         | Seguindo                               |
| posts_count              | integer   | Yes   | —          | —                                         | Posts                                  |
| full_name                | text      | Yes   | —          | —                                         | Nome                                   |
| bio                      | text      | Yes   | —          | —                                         | Bio                                    |
| profile_pic_url          | text      | Yes   | —          | —                                         | URL foto (pode ser CDN)                |
| profile_pic_storage_path | text      | Yes   | —          | —                                         | Path GCS (permanente)                  |
| profile_pic_original_url | text      | Yes   | —          | —                                         | URL original                           |
| is_verified              | boolean   | Yes   | `false`    | —                                         | Verificado                             |
| is_private               | boolean   | Yes   | `false`    | —                                         | Privado                                |
| external_url             | text      | Yes   | —          | —                                         | URL externa                            |
| engagement_rate          | text      | Yes   | —          | —                                         | Engajamento                            |
| avg_likes                | integer   | Yes   | —          | —                                         | Média likes                            |
| avg_comments             | integer   | Yes   | —          | —                                         | Média comments                         |
| total_likes              | integer   | Yes   | —          | —                                         | Total likes                            |
| total_comments           | integer   | Yes   | —          | —                                         | Total comments                         |
| authenticity_score       | integer   | Yes   | —          | —                                         | Score autenticidade                    |
| top_hashtags             | text[]    | Yes   | —          | —                                         | Top hashtags                           |
| top_posts                | jsonb     | Yes   | —          | —                                         | `{id,url,likes,comments,thumbnail?}[]` |
| last_fetched_at          | timestamp | Yes   | —          | —                                         | Último fetch                           |
| created_at               | timestamp | Yes   | `now()`    | —                                         | Criação                                |
| updated_at               | timestamp | Yes   | `now()`    | —                                         | Atualização                            |

**Indexes**: `instagram_profiles_username_owner_type_idx` (UNIQUE), `instagram_profiles_user_id_idx`, `instagram_profiles_company_id_idx`
**Types**: `InstagramProfile`, `InsertInstagramProfile`

### 14.3 `social.instagram_posts` (`instagramPosts`)

| Column               | Type      | Null? | Default      | FK                                       | Description                   |
| -------------------- | --------- | ----- | ------------ | ---------------------------------------- | ----------------------------- |
| id                   | serial    | No    | auto         | —                                        | PK                            |
| instagram_account_id | integer   | No    | —            | `social.instagram_accounts.id` (CASCADE) | Conta                         |
| instagram_media_id   | text      | No    | —            | —                                        | Media ID IG                   |
| media_type           | text      | Yes   | —            | —                                        | Tipo mídia                    |
| media_url            | text      | Yes   | —            | —                                        | URL mídia                     |
| thumbnail_url        | text      | Yes   | —            | —                                        | Thumbnail                     |
| permalink            | text      | Yes   | —            | —                                        | Permalink                     |
| caption              | text      | Yes   | —            | —                                        | Legenda                       |
| timestamp            | timestamp | Yes   | —            | —                                        | Data publicação               |
| like_count           | integer   | Yes   | `0`          | —                                        | Likes                         |
| comments_count       | integer   | Yes   | `0`          | —                                        | Comments                      |
| reach_count          | integer   | Yes   | —            | —                                        | Alcance                       |
| impressions_count    | integer   | Yes   | —            | —                                        | Impressões                    |
| saved_count          | integer   | Yes   | —            | —                                        | Saves                         |
| shares_count         | integer   | Yes   | —            | —                                        | Shares                        |
| is_collab_post       | boolean   | Yes   | `false`      | —                                        | Post colaborativo             |
| collab_partners      | text[]    | Yes   | —            | —                                        | Parceiros collab              |
| mentioned_accounts   | text[]    | Yes   | —            | —                                        | Menções                       |
| hashtags             | text[]    | Yes   | —            | —                                        | Hashtags                      |
| comments_data        | jsonb     | Yes   | —            | —                                        | Dados comentários             |
| source               | text      | Yes   | `native_api` | —                                        | `native_api`/`apify`/`manual` |
| created_at           | timestamp | Yes   | `now()`      | —                                        | Criação                       |
| updated_at           | timestamp | Yes   | `now()`      | —                                        | Atualização                   |

**UNIQUE**: `instagram_media_id` | **Insert schema**: `insertInstagramPostSchema` | **Types**: `InstagramPost`, `InsertInstagramPost`

### 14.4 `social.instagram_messages` (`instagramMessages`)

| Column               | Type      | Null? | Default | FK                                       | Description           |
| -------------------- | --------- | ----- | ------- | ---------------------------------------- | --------------------- |
| id                   | serial    | No    | auto    | —                                        | PK                    |
| instagram_account_id | integer   | No    | —       | `social.instagram_accounts.id` (CASCADE) | Conta                 |
| conversation_id      | text      | No    | —       | —                                        | ID conversa IG        |
| message_id           | text      | No    | —       | —                                        | ID mensagem IG        |
| sender_id            | text      | No    | —       | —                                        | ID remetente          |
| sender_username      | text      | Yes   | —       | —                                        | Username remetente    |
| sender_profile_pic   | text      | Yes   | —       | —                                        | Foto remetente        |
| recipient_id         | text      | No    | —       | —                                        | ID destinatário       |
| recipient_username   | text      | Yes   | —       | —                                        | Username destinatário |
| message_text         | text      | Yes   | —       | —                                        | Texto                 |
| message_type         | text      | Yes   | —       | —                                        | Tipo mensagem         |
| attachments          | jsonb     | Yes   | —       | —                                        | Anexos                |
| is_incoming          | boolean   | Yes   | `true`  | —                                        | Recebida              |
| is_read              | boolean   | Yes   | `false` | —                                        | Lida                  |
| sent_at              | timestamp | Yes   | —       | —                                        | Data envio            |
| created_at           | timestamp | Yes   | `now()` | —                                        | Criação               |

**UNIQUE**: `message_id` | **Insert schema**: `insertInstagramMessageSchema` | **Types**: `InstagramMessage`, `InsertInstagramMessage`

### 14.5 `social.instagram_tagged_posts` (`instagramTaggedPosts`)

| Column               | Type      | Null? | Default | FK                                       | Description                           |
| -------------------- | --------- | ----- | ------- | ---------------------------------------- | ------------------------------------- |
| id                   | serial    | No    | auto    | —                                        | PK                                    |
| instagram_account_id | integer   | No    | —       | `social.instagram_accounts.id` (CASCADE) | Conta                                 |
| post_id              | text      | No    | —       | —                                        | ID post                               |
| username             | text      | No    | —       | —                                        | Quem taggeou                          |
| media_type           | text      | Yes   | —       | —                                        | Tipo mídia                            |
| media_url            | text      | Yes   | —       | —                                        | URL                                   |
| permalink            | text      | No    | —       | —                                        | Permalink                             |
| caption              | text      | Yes   | —       | —                                        | Legenda                               |
| timestamp            | timestamp | Yes   | —       | —                                        | Data                                  |
| likes                | integer   | Yes   | `0`     | —                                        | Likes                                 |
| comments             | integer   | Yes   | `0`     | —                                        | Comments                              |
| impressions          | integer   | Yes   | —       | —                                        | Impressões                            |
| reach                | integer   | Yes   | —       | —                                        | Alcance                               |
| engagement           | integer   | Yes   | —       | —                                        | Engajamento                           |
| saved                | integer   | Yes   | —       | —                                        | Saves                                 |
| emv                  | integer   | Yes   | `0`     | —                                        | Earned media value                    |
| sentiment            | text      | Yes   | —       | —                                        | `positive`/`neutral`/`negative`       |
| sentiment_score      | integer   | Yes   | —       | —                                        | Score sentimento                      |
| sentiment_analysis   | text      | Yes   | —       | —                                        | Análise texto                         |
| comments_analysis    | jsonb     | Yes   | —       | —                                        | `{positive,neutral,negative,summary}` |
| is_notified          | boolean   | Yes   | `false` | —                                        | Notificado                            |
| created_at           | timestamp | Yes   | `now()` | —                                        | Criação                               |

**UNIQUE**: `(instagram_account_id, post_id)` | **Types**: N/A (sem insert schema exportado)

### 14.6 `social.instagram_contacts` (`instagramContacts`)

| Column                  | Type      | Null? | Default | FK                                        | Description                                |
| ----------------------- | --------- | ----- | ------- | ----------------------------------------- | ------------------------------------------ |
| id                      | serial    | No    | auto    | —                                         | PK                                         |
| company_id              | integer   | No    | —       | `company.companies.id` (CASCADE)          | Empresa                                    |
| instagram_user_id       | text      | Yes   | —       | —                                         | IG user ID                                 |
| username                | text      | No    | —       | —                                         | Username                                   |
| full_name               | text      | Yes   | —       | —                                         | Nome                                       |
| profile_pic_url         | text      | Yes   | —       | —                                         | Foto                                       |
| instagram_profile_id    | integer   | Yes   | —       | `social.instagram_profiles.id` (SET NULL) | Perfil vinculado                           |
| user_id                 | integer   | Yes   | —       | `core.users.id` (SET NULL)                | Usuário vinculado                          |
| total_dms_received      | integer   | Yes   | `0`     | —                                         | DMs recebidas                              |
| total_dms_sent          | integer   | Yes   | `0`     | —                                         | DMs enviadas                               |
| total_comments_on_posts | integer   | Yes   | `0`     | —                                         | Comments em posts                          |
| total_mentions          | integer   | Yes   | `0`     | —                                         | Menções                                    |
| total_story_replies     | integer   | Yes   | `0`     | —                                         | Respostas stories                          |
| total_tagged_posts      | integer   | Yes   | `0`     | —                                         | Posts taggeados                            |
| interaction_score       | integer   | Yes   | `0`     | —                                         | Score interação                            |
| first_interaction_at    | timestamp | Yes   | —       | —                                         | Primeira interação                         |
| last_interaction_at     | timestamp | Yes   | —       | —                                         | Última interação                           |
| status                  | text      | Yes   | `lead`  | —                                         | `lead`/`engaged`/`vip`/`member`/`inactive` |
| tags                    | text[]    | Yes   | —       | —                                         | Tags                                       |
| notes                   | text      | Yes   | —       | —                                         | Notas                                      |
| followers               | integer   | Yes   | —       | —                                         | Seguidores                                 |
| is_verified             | boolean   | Yes   | `false` | —                                         | Verificado                                 |
| bio                     | text      | Yes   | —       | —                                         | Bio                                        |
| created_at              | timestamp | Yes   | `now()` | —                                         | Criação                                    |
| updated_at              | timestamp | Yes   | `now()` | —                                         | Atualização                                |

**Indexes**: `instagram_contacts_company_username_idx` (UNIQUE), `instagram_contacts_company_id_idx`, `instagram_contacts_status_idx`, `instagram_contacts_score_idx`, `instagram_contacts_last_interaction_idx`
**Insert schema**: `insertInstagramContactSchema` | **Types**: `InstagramContact`, `InsertInstagramContact`

### 14.7 `social.instagram_interactions` (`instagramInteractions`)

| Column          | Type      | Null? | Default | FK                                       | Description                             |
| --------------- | --------- | ----- | ------- | ---------------------------------------- | --------------------------------------- |
| id              | serial    | No    | auto    | —                                        | PK                                      |
| contact_id      | integer   | No    | —       | `social.instagram_contacts.id` (CASCADE) | Contato                                 |
| company_id      | integer   | No    | —       | `company.companies.id` (CASCADE)         | Empresa                                 |
| type            | text      | No    | —       | —                                        | Tipo interação (enum inline, 7 valores) |
| reference_id    | text      | Yes   | —       | —                                        | ID referência                           |
| content_preview | text      | Yes   | —       | —                                        | Preview conteúdo                        |
| metadata        | jsonb     | Yes   | —       | —                                        | Dados extras                            |
| occurred_at     | timestamp | No    | —       | —                                        | Data ocorrência                         |
| created_at      | timestamp | Yes   | `now()` | —                                        | Criação                                 |

**Indexes**: `instagram_interactions_contact_id_idx`, `instagram_interactions_company_type_idx`, `instagram_interactions_occurred_at_idx`
**Insert schema**: `insertInstagramInteractionSchema` | **Types**: `InstagramInteraction`, `InsertInstagramInteraction`

### 14.8 `social.tiktok_profiles` (`tiktokProfiles`)

| Column                   | Type      | Null? | Default  | FK  | Description                     |
| ------------------------ | --------- | ----- | -------- | --- | ------------------------------- |
| id                       | serial    | No    | auto     | —   | PK                              |
| unique_id                | text      | No    | —        | —   | @username                       |
| user_id                  | text      | Yes   | —        | —   | TikTok internal ID              |
| nickname                 | text      | Yes   | —        | —   | Nickname                        |
| avatar_url               | text      | Yes   | —        | —   | Avatar                          |
| signature                | text      | Yes   | —        | —   | Bio                             |
| verified                 | boolean   | Yes   | `false`  | —   | Verificado                      |
| followers                | integer   | Yes   | `0`      | —   | Seguidores                      |
| following                | integer   | Yes   | `0`      | —   | Seguindo                        |
| hearts                   | integer   | Yes   | `0`      | —   | Total likes                     |
| video_count              | integer   | Yes   | `0`      | —   | Total vídeos                    |
| raw_data                 | jsonb     | Yes   | —        | —   | Dados brutos                    |
| last_fetched_at          | timestamp | Yes   | `now()`  | —   | Último fetch                    |
| created_at               | timestamp | No    | `now()`  | —   | Criação                         |
| updated_at               | timestamp | No    | `now()`  | —   | Atualização                     |
| access_token             | text      | Yes   | —        | —   | OAuth token                     |
| refresh_token            | text      | Yes   | —        | —   | Refresh token                   |
| token_expires_at         | timestamp | Yes   | —        | —   | Expiração token                 |
| refresh_token_expires_at | timestamp | Yes   | —        | —   | Expiração refresh               |
| scope                    | text      | Yes   | —        | —   | Scopes                          |
| open_id                  | text      | Yes   | —        | —   | TikTok open ID                  |
| union_id                 | text      | Yes   | —        | —   | Cross-app ID                    |
| connected_by_user_id     | integer   | Yes   | —        | —   | Quem conectou                   |
| connected_at             | timestamp | Yes   | —        | —   | Data conexão                    |
| disconnected_at          | timestamp | Yes   | —        | —   | Data desconexão                 |
| last_synced_at           | timestamp | Yes   | —        | —   | Último sync                     |
| sync_status              | text      | Yes   | `active` | —   | `active`/`error`/`disconnected` |
| sync_error               | text      | Yes   | —        | —   | Erro sync                       |

**UNIQUE**: `unique_id`, `open_id` | **Indexes**: `tiktok_profiles_connected_by_user_idx`, `tiktok_profiles_open_id_idx`
**Insert schema**: `insertTikTokProfileSchema` | **Types**: `TikTokProfile`, `InsertTikTokProfile`

### 14.9 `social.tiktok_videos` (`tiktokVideos`)

| Column           | Type      | Null? | Default | FK  | Description      |
| ---------------- | --------- | ----- | ------- | --- | ---------------- |
| id               | serial    | No    | auto    | —   | PK               |
| video_id         | text      | No    | —       | —   | ID vídeo TikTok  |
| author_unique_id | text      | No    | —       | —   | @autor           |
| description      | text      | Yes   | —       | —   | Descrição        |
| cover_url        | text      | Yes   | —       | —   | Cover            |
| video_url        | text      | Yes   | —       | —   | URL vídeo        |
| duration         | integer   | Yes   | —       | —   | Duração segundos |
| digg_count       | integer   | Yes   | `0`     | —   | Likes            |
| share_count      | integer   | Yes   | `0`     | —   | Shares           |
| comment_count    | integer   | Yes   | `0`     | —   | Comments         |
| play_count       | integer   | Yes   | `0`     | —   | Plays            |
| music_title      | text      | Yes   | —       | —   | Música           |
| music_author     | text      | Yes   | —       | —   | Autor música     |
| hashtags         | text[]    | Yes   | —       | —   | Hashtags         |
| posted_at        | timestamp | Yes   | —       | —   | Data publicação  |
| raw_data         | jsonb     | Yes   | —       | —   | Dados brutos     |
| created_at       | timestamp | No    | `now()` | —   | Criação          |
| updated_at       | timestamp | No    | `now()` | —   | Atualização      |

**UNIQUE**: `video_id` | **Insert schema**: `insertTikTokVideoSchema` | **Types**: `TikTokVideo`, `InsertTikTokVideo`

### 14.10 `social.youtube_channels` (`youtubeChannels`)

| Column           | Type      | Null? | Default | FK  | Description  |
| ---------------- | --------- | ----- | ------- | --- | ------------ |
| id               | serial    | No    | auto    | —   | PK           |
| channel_id       | text      | No    | —       | —   | Channel ID   |
| channel_name     | text      | Yes   | —       | —   | Nome canal   |
| channel_url      | text      | Yes   | —       | —   | URL canal    |
| thumbnail_url    | text      | Yes   | —       | —   | Thumbnail    |
| subscriber_count | integer   | Yes   | `0`     | —   | Inscritos    |
| video_count      | integer   | Yes   | `0`     | —   | Vídeos       |
| view_count       | integer   | Yes   | `0`     | —   | Views totais |
| description      | text      | Yes   | —       | —   | Descrição    |
| raw_data         | jsonb     | Yes   | —       | —   | Dados brutos |
| last_fetched_at  | timestamp | Yes   | `now()` | —   | Último fetch |
| created_at       | timestamp | No    | `now()` | —   | Criação      |
| updated_at       | timestamp | No    | `now()` | —   | Atualização  |

**UNIQUE**: `channel_id` | **Insert schema**: `insertYouTubeChannelSchema` | **Types**: `YouTubeChannel`, `InsertYouTubeChannel`

### 14.11 `social.youtube_videos` (`youtubeVideos`)

| Column        | Type      | Null? | Default | FK  | Description      |
| ------------- | --------- | ----- | ------- | --- | ---------------- |
| id            | serial    | No    | auto    | —   | PK               |
| video_id      | text      | No    | —       | —   | Video ID         |
| channel_id    | text      | Yes   | —       | —   | Channel ID       |
| title         | text      | Yes   | —       | —   | Título           |
| description   | text      | Yes   | —       | —   | Descrição        |
| thumbnail_url | text      | Yes   | —       | —   | Thumbnail        |
| view_count    | integer   | Yes   | `0`     | —   | Views            |
| like_count    | integer   | Yes   | `0`     | —   | Likes            |
| comment_count | integer   | Yes   | `0`     | —   | Comments         |
| duration      | text      | Yes   | —       | —   | Duração ISO 8601 |
| published_at  | timestamp | Yes   | —       | —   | Publicação       |
| is_short      | boolean   | Yes   | `false` | —   | É Short          |
| raw_data      | jsonb     | Yes   | —       | —   | Dados brutos     |
| created_at    | timestamp | No    | `now()` | —   | Criação          |
| updated_at    | timestamp | No    | `now()` | —   | Atualização      |

**UNIQUE**: `video_id` | **Insert schema**: `insertYouTubeVideoSchema` | **Types**: `YouTubeVideo`, `InsertYouTubeVideo`

### 14.12 `social.dm_templates` (`dmTemplates`)

| Column     | Type      | Null? | Default  | FK                               | Description                                                         |
| ---------- | --------- | ----- | -------- | -------------------------------- | ------------------------------------------------------------------- |
| id         | serial    | No    | auto     | —                                | PK                                                                  |
| company_id | integer   | No    | —        | `company.companies.id` (CASCADE) | Empresa                                                             |
| name       | text      | No    | —        | —                                | Nome template                                                       |
| type       | text      | No    | `custom` | —                                | `campaign_invite`/`community_invite`/`follow_up`/`welcome`/`custom` |
| content    | text      | No    | —        | —                                | Conteúdo                                                            |
| variables  | text[]    | Yes   | `[]`     | —                                | Variáveis disponíveis                                               |
| is_default | boolean   | Yes   | `false`  | —                                | Padrão                                                              |
| created_by | integer   | Yes   | —        | `core.users.id`                  | Criador                                                             |
| created_at | timestamp | No    | `now()`  | —                                | Criação                                                             |
| updated_at | timestamp | No    | `now()`  | —                                | Atualização                                                         |

**Insert schema**: `insertDmTemplateSchema` | **Types**: `DmTemplate`, `InsertDmTemplate`

### 14.13 `social.dm_send_logs` (`dmSendLogs`)

| Column               | Type      | Null? | Default   | FK                                  | Description                                  |
| -------------------- | --------- | ----- | --------- | ----------------------------------- | -------------------------------------------- |
| id                   | serial    | No    | auto      | —                                   | PK                                           |
| company_id           | integer   | No    | —         | `company.companies.id` (CASCADE)    | Empresa                                      |
| template_id          | integer   | Yes   | —         | `social.dm_templates.id` (SET NULL) | Template                                     |
| instagram_account_id | integer   | Yes   | —         | `social.instagram_accounts.id`      | Conta IG                                     |
| recipient_username   | text      | No    | —         | —                                   | Username destinatário                        |
| recipient_ig_id      | text      | Yes   | —         | —                                   | IG ID destinatário                           |
| campaign_id          | integer   | Yes   | —         | `campaign.campaigns.id` (SET NULL)  | Campanha                                     |
| message_content      | text      | No    | —         | —                                   | Conteúdo enviado                             |
| status               | text      | No    | `pending` | —                                   | `pending`/`sent`/`failed`/`delivered`/`read` |
| error_message        | text      | Yes   | —         | —                                   | Erro                                         |
| sent_at              | timestamp | Yes   | —         | —                                   | Data envio                                   |
| created_at           | timestamp | No    | `now()`   | —                                   | Criação                                      |

**Insert schema**: `insertDmSendLogSchema` | **Types**: `DmSendLog`, `InsertDmSendLog`

### 14.14 `social.meta_ad_accounts` (`metaAdAccounts`)

| Column                  | Type      | Null? | Default | FK                               | Description  |
| ----------------------- | --------- | ----- | ------- | -------------------------------- | ------------ |
| id                      | serial    | No    | auto    | —                                | PK           |
| company_id              | integer   | No    | —       | `company.companies.id` (CASCADE) | Empresa      |
| meta_user_id            | text      | No    | —       | —                                | Meta user ID |
| meta_user_name          | text      | Yes   | —       | —                                | Nome         |
| meta_user_email         | text      | Yes   | —       | —                                | Email        |
| access_token            | text      | No    | —       | —                                | Token        |
| access_token_expires_at | timestamp | Yes   | —       | —                                | Expiração    |
| scopes                  | text[]    | Yes   | —       | —                                | Scopes       |
| is_active               | boolean   | Yes   | `true`  | —                                | Ativo        |
| last_sync_at            | timestamp | Yes   | —       | —                                | Último sync  |
| created_at              | timestamp | Yes   | `now()` | —                                | Criação      |
| updated_at              | timestamp | Yes   | `now()` | —                                | Atualização  |

**Insert schema**: `insertMetaAdAccountSchema` | **Types**: `MetaAdAccount`, `InsertMetaAdAccount`

### 14.15 `social.meta_business_managers` (`metaBusinessManagers`)

| Column             | Type      | Null? | Default | FK                                     | Description   |
| ------------------ | --------- | ----- | ------- | -------------------------------------- | ------------- |
| id                 | serial    | No    | auto    | —                                      | PK            |
| meta_ad_account_id | integer   | No    | —       | `social.meta_ad_accounts.id` (CASCADE) | Conta Meta    |
| business_id        | text      | No    | —       | —                                      | Business ID   |
| business_name      | text      | Yes   | —       | —                                      | Nome business |
| is_selected        | boolean   | Yes   | `false` | —                                      | Selecionado   |
| created_at         | timestamp | Yes   | `now()` | —                                      | Criação       |

**Insert schema**: `insertMetaBusinessManagerSchema` | **Types**: `MetaBusinessManager`, `InsertMetaBusinessManager`

### 14.16 `social.meta_ad_accounts_list` (`metaAdAccountsList`)

| Column             | Type      | Null? | Default | FK                                     | Description   |
| ------------------ | --------- | ----- | ------- | -------------------------------------- | ------------- |
| id                 | serial    | No    | auto    | —                                      | PK            |
| meta_ad_account_id | integer   | No    | —       | `social.meta_ad_accounts.id` (CASCADE) | Conta Meta    |
| ad_account_id      | text      | No    | —       | —                                      | Ad Account ID |
| ad_account_name    | text      | Yes   | —       | —                                      | Nome          |
| currency           | text      | Yes   | —       | —                                      | Moeda         |
| timezone           | text      | Yes   | —       | —                                      | Timezone      |
| business_id        | text      | Yes   | —       | —                                      | Business ID   |
| is_selected        | boolean   | Yes   | `false` | —                                      | Selecionado   |
| created_at         | timestamp | Yes   | `now()` | —                                      | Criação       |

**Insert schema**: `insertMetaAdAccountsListSchema` | **Types**: `MetaAdAccountsList`, `InsertMetaAdAccountsList`

---

## 15. Schema: `system` (6 tables)

Sessões, notificações, tags, feature flags, logs de integração e registro de data sources.

### 15.1 `system.session` (`session`)

| Column | Type      | Null? | Default | FK  | Description                                  |
| ------ | --------- | ----- | ------- | --- | -------------------------------------------- |
| sid    | text      | No    | —       | —   | **PK** (session ID)                          |
| sess   | jsonb     | No    | —       | —   | Dados da sessão (user, activeCompanyId, etc) |
| expire | timestamp | No    | —       | —   | Expiração                                    |

Gerenciada por `connect-pg-simple`. Não possui insert schema.

### 15.2 `system.notifications` (`notifications`)

| Column     | Type      | Null? | Default | FK              | Description                                |
| ---------- | --------- | ----- | ------- | --------------- | ------------------------------------------ |
| id         | serial    | No    | auto    | —               | PK                                         |
| user_id    | integer   | No    | —       | `core.users.id` | Destinatário                               |
| type       | text      | No    | —       | —               | Tipo notificação (enum inline, 18 valores) |
| title      | text      | No    | —       | —               | Título                                     |
| message    | text      | No    | —       | —               | Mensagem                                   |
| action_url | text      | Yes   | —       | —               | URL ação                                   |
| is_read    | boolean   | No    | `false` | —               | Lida                                       |
| metadata   | jsonb     | Yes   | —       | —               | `Record<string, any>`                      |
| created_at | timestamp | No    | `now()` | —               | Criação                                    |

**Insert schema**: `insertNotificationSchema` | **Types**: `Notification`, `InsertNotification`

### 15.3 `system.tags` (`tags`)

| Column     | Type              | Null? | Default | FK  | Description                                         |
| ---------- | ----------------- | ----- | ------- | --- | --------------------------------------------------- |
| id         | serial            | No    | auto    | —   | PK                                                  |
| name       | text              | No    | —       | —   | Nome tag                                            |
| type       | tag_type (pgEnum) | No    | —       | —   | Tipo (niche/style/vertical/audience/skill/platform) |
| created_at | timestamp         | No    | `now()` | —   | Criação                                             |

**UNIQUE**: `(name, type)` | **Insert schema**: `insertTagSchema` | **Types**: `Tag`, `InsertTag`

### 15.4 `system.feature_flags` (`featureFlags`)

| Column      | Type      | Null? | Default | FK  | Description                     |
| ----------- | --------- | ----- | ------- | --- | ------------------------------- |
| id          | serial    | No    | auto    | —   | PK                              |
| name        | text      | No    | —       | —   | Nome flag                       |
| description | text      | Yes   | —       | —   | Descrição                       |
| enabled     | boolean   | No    | `false` | —   | Habilitado                      |
| module      | text      | No    | —       | —   | Módulo (enum inline, 4 valores) |
| created_at  | timestamp | Yes   | `now()` | —   | Criação                         |
| updated_at  | timestamp | Yes   | `now()` | —   | Atualização                     |

**UNIQUE**: `name` | **Insert schema**: `insertFeatureFlagSchema` | **Types**: `FeatureFlag`, `InsertFeatureFlag`

### 15.5 `system.integration_logs` (`integrationLogs`)

| Column        | Type      | Null? | Default | FK                               | Description      |
| ------------- | --------- | ----- | ------- | -------------------------------- | ---------------- |
| id            | serial    | No    | auto    | —                                | PK               |
| company_id    | integer   | No    | —       | `company.companies.id` (CASCADE) | Empresa          |
| platform      | text      | No    | —       | —                                | Plataforma       |
| action        | text      | No    | —       | —                                | Ação             |
| status        | text      | No    | —       | —                                | Status           |
| endpoint      | text      | Yes   | —       | —                                | Endpoint chamado |
| details       | jsonb     | Yes   | —       | —                                | Detalhes         |
| error_message | text      | Yes   | —       | —                                | Erro             |
| created_at    | timestamp | Yes   | `now()` | —                                | Criação          |

**Insert schema**: `insertIntegrationLogSchema` | **Types**: `IntegrationLog`, `InsertIntegrationLog`

### 15.6 `system.data_source_registry` (`dataSourceRegistry`)

| Column           | Type      | Null? | Default | FK  | Description                           |
| ---------------- | --------- | ----- | ------- | --- | ------------------------------------- |
| id               | serial    | No    | auto    | —   | PK                                    |
| key              | text      | No    | —       | —   | Chave única (ex: "instagram_profile") |
| actor_id         | text      | No    | —       | —   | Apify actor ID                        |
| display_name     | text      | Yes   | —       | —   | Nome exibição                         |
| cost_per_1k      | text      | Yes   | —       | —   | Custo/1k runs                         |
| pricing_model    | text      | Yes   | `ppr`   | —   | `ppr`/`ppe`/`cu`                      |
| category         | text      | Yes   | —       | —   | Categoria (enum inline, 7 valores)    |
| description      | text      | Yes   | —       | —   | Descrição                             |
| input_schema_url | text      | Yes   | —       | —   | URL schema input                      |
| is_active        | boolean   | No    | `true`  | —   | Ativo                                 |
| notes            | text      | Yes   | —       | —   | Notas                                 |
| created_at       | timestamp | No    | `now()` | —   | Criação                               |
| updated_at       | timestamp | No    | `now()` | —   | Atualização                           |

**UNIQUE**: `key` | **Insert schema**: `insertDataSourceRegistrySchema` | **Types**: `DataSourceRegistry`, `InsertDataSourceRegistry`

---

## 16. Schema: `misc` (10 tables)

Reports, favoritos, reviews, workflow stages, AI insights, community invites, contact notes, hashtag searches/posts.

### 16.1 `misc.problem_reports` (`problemReports`)

| Column      | Type      | Null? | Default | FK              | Description                     |
| ----------- | --------- | ----- | ------- | --------------- | ------------------------------- |
| id          | serial    | No    | auto    | —               | PK                              |
| user_id     | integer   | No    | —       | `core.users.id` | Autor                           |
| subject     | text      | No    | —       | —               | Assunto                         |
| description | text      | No    | —       | —               | Descrição                       |
| status      | text      | No    | `open`  | —               | `open`/`in_progress`/`resolved` |
| admin_notes | text      | Yes   | —       | —               | Notas admin                     |
| created_at  | timestamp | No    | `now()` | —               | Criação                         |
| updated_at  | timestamp | No    | `now()` | —               | Atualização                     |

**Insert schema**: `insertProblemReportSchema` | **Types**: `ProblemReport`, `InsertProblemReport`

### 16.2 `misc.favorite_creators` (`favoriteCreators`)

| Column     | Type      | Null? | Default | FK                     | Description |
| ---------- | --------- | ----- | ------- | ---------------------- | ----------- |
| id         | serial    | No    | auto    | —                      | PK          |
| company_id | integer   | No    | —       | `company.companies.id` | Empresa     |
| creator_id | integer   | No    | —       | `core.users.id`        | Criador     |
| created_at | timestamp | No    | `now()` | —                      | Data        |

**UNIQUE**: `(company_id, creator_id)` | **Insert schema**: `insertFavoriteCreatorSchema` | **Types**: `FavoriteCreator`, `InsertFavoriteCreator`

### 16.3 `misc.favorite_companies` (`favoriteCompanies`)

| Column     | Type      | Null? | Default | FK                     | Description |
| ---------- | --------- | ----- | ------- | ---------------------- | ----------- |
| id         | serial    | No    | auto    | —                      | PK          |
| creator_id | integer   | No    | —       | `core.users.id`        | Criador     |
| company_id | integer   | No    | —       | `company.companies.id` | Empresa     |
| created_at | timestamp | No    | `now()` | —                      | Data        |

**UNIQUE**: `(creator_id, company_id)` | **Insert schema**: `insertFavoriteCompanySchema` | **Types**: `FavoriteCompany`, `InsertFavoriteCompany`

### 16.4 `misc.creator_reviews` (`creatorReviews`)

| Column      | Type      | Null? | Default | FK                      | Description         |
| ----------- | --------- | ----- | ------- | ----------------------- | ------------------- |
| id          | serial    | No    | auto    | —                       | PK                  |
| creator_id  | integer   | No    | —       | `core.users.id`         | Criador avaliado    |
| company_id  | integer   | No    | —       | `company.companies.id`  | Empresa avaliadora  |
| campaign_id | integer   | Yes   | —       | `campaign.campaigns.id` | Campanha (opcional) |
| rating      | integer   | No    | —       | —                       | Nota 1-5            |
| comment     | text      | Yes   | —       | —                       | Comentário          |
| created_at  | timestamp | No    | `now()` | —                       | Criação             |
| updated_at  | timestamp | No    | `now()` | —                       | Atualização         |

**UNIQUE**: `(company_id, creator_id, campaign_id)` | **Insert schema**: `insertCreatorReviewSchema` | **Types**: `CreatorReview`, `InsertCreatorReview`

### 16.5 `misc.workflow_stages` (`workflowStages`)

| Column     | Type      | Null? | Default   | FK                               | Description                  |
| ---------- | --------- | ----- | --------- | -------------------------------- | ---------------------------- |
| id         | serial    | No    | auto      | —                                | PK                           |
| company_id | integer   | No    | —         | `company.companies.id` (CASCADE) | Empresa                      |
| name       | text      | No    | —         | —                                | Nome etapa                   |
| color      | text      | No    | `#6366f1` | —                                | Cor hex                      |
| position   | integer   | No    | —         | —                                | Posição                      |
| is_default | boolean   | No    | `false`   | —                                | Etapa padrão (não deletável) |
| created_at | timestamp | No    | `now()`   | —                                | Criação                      |

**Insert schema**: `insertWorkflowStageSchema` | **Types**: `WorkflowStage`, `InsertWorkflowStage`

### 16.6 `misc.post_ai_insights` (`postAiInsights`)

| Column                | Type      | Null? | Default | FK                         | Description           |
| --------------------- | --------- | ----- | ------- | -------------------------- | --------------------- |
| id                    | serial    | No    | auto    | —                          | PK                    |
| user_id               | integer   | No    | —       | `core.users.id`            | Criador               |
| post_id               | integer   | No    | —       | `creator.creator_posts.id` | Post                  |
| platform              | text      | No    | —       | —                          | `instagram`/`tiktok`  |
| summary               | text      | No    | —       | —                          | Resumo AI             |
| strengths             | jsonb     | Yes   | —       | —                          | `string[]`            |
| improvements          | jsonb     | Yes   | —       | —                          | `string[]`            |
| hashtags              | jsonb     | Yes   | —       | —                          | `{tag,performance}[]` |
| best_time_to_post     | text      | Yes   | —       | —                          | Melhor horário        |
| audience_insights     | text      | Yes   | —       | —                          | Insights audiência    |
| content_score         | integer   | Yes   | —       | —                          | Score conteúdo        |
| engagement_prediction | text      | Yes   | —       | —                          | Previsão engajamento  |
| recommendations       | jsonb     | Yes   | —       | —                          | `string[]`            |
| created_at            | timestamp | No    | `now()` | —                          | Criação               |
| updated_at            | timestamp | No    | `now()` | —                          | Atualização           |

**UNIQUE**: `post_id` | **Insert schema**: `insertPostAiInsightSchema` | **Types**: `PostAiInsight`, `InsertPostAiInsight`

### 16.7 `misc.community_invites` (`communityInvites`)

| Column             | Type      | Null? | Default | FK                               | Description                                      |
| ------------------ | --------- | ----- | ------- | -------------------------------- | ------------------------------------------------ |
| id                 | serial    | No    | auto    | —                                | PK                                               |
| company_id         | integer   | No    | —       | `company.companies.id` (CASCADE) | Empresa                                          |
| creator_id         | integer   | Yes   | —       | `core.users.id`                  | Criador                                          |
| email              | text      | Yes   | —       | —                                | Email                                            |
| creator_handle     | text      | Yes   | —       | —                                | Handle IG                                        |
| token              | text      | No    | —       | —                                | Token único                                      |
| status             | text      | No    | `sent`  | —                                | `sent`/`opened`/`accepted`/`expired`/`cancelled` |
| campaign_id        | integer   | Yes   | —       | `campaign.campaigns.id`          | Campanha                                         |
| metadata           | jsonb     | Yes   | —       | —                                | `{source?,message?,tags?}`                       |
| expires_at         | timestamp | No    | —       | —                                | Expiração                                        |
| opened_at          | timestamp | Yes   | —       | —                                | Data abertura                                    |
| accepted_at        | timestamp | Yes   | —       | —                                | Data aceitação                                   |
| created_by_user_id | integer   | Yes   | —       | `core.users.id`                  | Criador do convite                               |
| created_at         | timestamp | No    | `now()` | —                                | Criação                                          |

**UNIQUE**: `token` | **Insert schema**: `insertCommunityInviteSchema` | **Types**: `CommunityInvite`, `InsertCommunityInvite`

### 16.8 `misc.contact_notes` (`contactNotes`)

| Column             | Type      | Null? | Default | FK                               | Description   |
| ------------------ | --------- | ----- | ------- | -------------------------------- | ------------- |
| id                 | serial    | No    | auto    | —                                | PK            |
| company_id         | integer   | No    | —       | `company.companies.id` (CASCADE) | Empresa       |
| instagram_username | text      | No    | —       | —                                | Username IG   |
| content            | text      | No    | —       | —                                | Conteúdo nota |
| created_by         | integer   | No    | —       | `core.users.id`                  | Autor         |
| created_at         | timestamp | No    | `now()` | —                                | Criação       |
| updated_at         | timestamp | No    | `now()` | —                                | Atualização   |

**Insert schema**: `insertContactNoteSchema` | **Types**: `ContactNote`, `InsertContactNote`

### 16.9 `misc.hashtag_searches` (`hashtagSearches`)

| Column            | Type      | Null? | Default | FK                     | Description        |
| ----------------- | --------- | ----- | ------- | ---------------------- | ------------------ |
| id                | serial    | No    | auto    | —                      | PK                 |
| company_id        | integer   | No    | —       | `company.companies.id` | Empresa            |
| instagram_user_id | text      | No    | —       | —                      | IG user ID usado   |
| hashtag           | text      | No    | —       | —                      | Hashtag pesquisada |
| hashtag_id        | text      | Yes   | —       | —                      | ID hashtag IG      |
| searched_at       | timestamp | No    | `now()` | —                      | Data pesquisa      |

**Insert schema**: `insertHashtagSearchSchema` | **Types**: `HashtagSearch`, `InsertHashtagSearch`

### 16.10 `misc.hashtag_posts` (`hashtagPosts`)

| Column              | Type      | Null? | Default  | FK                              | Description      |
| ------------------- | --------- | ----- | -------- | ------------------------------- | ---------------- |
| id                  | serial    | No    | auto     | —                               | PK               |
| campaign_hashtag_id | integer   | No    | —        | `campaign.campaign_hashtags.id` | Campaign hashtag |
| company_id          | integer   | No    | —        | `company.companies.id`          | Empresa          |
| media_id            | text      | No    | —        | —                               | Media ID         |
| media_type          | text      | Yes   | —        | —                               | Tipo mídia       |
| caption             | text      | Yes   | —        | —                               | Legenda          |
| permalink           | text      | Yes   | —        | —                               | Permalink        |
| media_url           | text      | Yes   | —        | —                               | URL mídia        |
| thumbnail_url       | text      | Yes   | —        | —                               | Thumbnail        |
| like_count          | integer   | Yes   | —        | —                               | Likes            |
| comments_count      | integer   | Yes   | —        | —                               | Comments         |
| timestamp           | timestamp | Yes   | —        | —                               | Data publicação  |
| username            | text      | Yes   | —        | —                               | Autor            |
| source              | text      | No    | `recent` | —                               | `top`/`recent`   |
| discovered_at       | timestamp | No    | `now()`  | —                               | Data descoberta  |

**UNIQUE**: `(campaign_hashtag_id, media_id)` | **Insert schema**: `insertHashtagPostSchema` | **Types**: `HashtagPost`, `InsertHashtagPost`

---

## 17. Drizzle Relations

46 relation definitions em `shared/schema.ts`. Cada uma define como Drizzle ORM resolve JOINs no query builder.

| Relation                              | Source Table                 | Related To                                                                                                                  | Cardinality | FK Column(s)                                                       |
| ------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------ |
| `usersRelations`                      | `users`                      | campaigns, applications, notifications, problemReports, favoriteCreators (×2), campaignTemplates, companies, companyMembers | one-to-many | —                                                                  |
| `companiesRelations`                  | `companies`                  | users, companyMembers, companyUserInvites, favoriteCompanies                                                                | one+many    | `created_by_user_id` → users                                       |
| `companyMembersRelations`             | `companyMembers`             | companies, users                                                                                                            | many-to-one | `company_id`, `user_id`                                            |
| `companyUserInvitesRelations`         | `companyUserInvites`         | companies, users (×2)                                                                                                       | many-to-one | `company_id`, `invited_by_user_id`, `accepted_by_user_id`          |
| `workflowStagesRelations`             | `workflowStages`             | companies                                                                                                                   | many-to-one | `company_id`                                                       |
| `campaignsRelations`                  | `campaigns`                  | users, applications                                                                                                         | one+many    | `company_id` → users                                               |
| `applicationsRelations`               | `applications`               | campaigns, users, deliverables                                                                                              | one+many    | `campaign_id`, `creator_id`                                        |
| `deliverablesRelations`               | `deliverables`               | applications, deliverableComments                                                                                           | one+many    | `application_id`                                                   |
| `notificationsRelations`              | `notifications`              | users                                                                                                                       | many-to-one | `user_id`                                                          |
| `problemReportsRelations`             | `problemReports`             | users                                                                                                                       | many-to-one | `user_id`                                                          |
| `favoriteCreatorsRelations`           | `favoriteCreators`           | users (×2)                                                                                                                  | many-to-one | `company_id`, `creator_id`                                         |
| `favoriteCompaniesRelations`          | `favoriteCompanies`          | users, companies                                                                                                            | many-to-one | `creator_id`, `company_id`                                         |
| `campaignInvitesRelations`            | `campaignInvites`            | campaigns, users (×2)                                                                                                       | many-to-one | `campaign_id`, `company_id`, `creator_id`                          |
| `deliverableCommentsRelations`        | `deliverableComments`        | deliverables, users                                                                                                         | many-to-one | `deliverable_id`, `user_id`                                        |
| `campaignTemplatesRelations`          | `campaignTemplates`          | users                                                                                                                       | many-to-one | `company_id` → users                                               |
| `creatorPostsRelations`               | `creatorPosts`               | users                                                                                                                       | many-to-one | `user_id`                                                          |
| `creatorAnalyticsHistoryRelations`    | `creatorAnalyticsHistory`    | users                                                                                                                       | many-to-one | `user_id`                                                          |
| `creatorHashtagsRelations`            | `creatorHashtags`            | users                                                                                                                       | many-to-one | `user_id`                                                          |
| `postAiInsightsRelations`             | `postAiInsights`             | users, creatorPosts                                                                                                         | many-to-one | `user_id`, `post_id`                                               |
| `coursesRelations`                    | `courses`                    | courseModules, creatorCourseProgress                                                                                        | one-to-many | —                                                                  |
| `courseModulesRelations`              | `courseModules`              | courses, courseLessons                                                                                                      | one+many    | `course_id`                                                        |
| `courseLessonsRelations`              | `courseLessons`              | courseModules, creatorLessonProgress                                                                                        | one+many    | `module_id`                                                        |
| `creatorCourseProgressRelations`      | `creatorCourseProgress`      | users, courses                                                                                                              | many-to-one | `creator_id`, `course_id`                                          |
| `creatorLessonProgressRelations`      | `creatorLessonProgress`      | users, courseLessons                                                                                                        | many-to-one | `creator_id`, `lesson_id`                                          |
| `inspirationsRelations`               | `inspirations`               | users, creatorSavedInspirations, inspirationCollectionItems, campaignInspirations                                           | one+many    | `created_by_user_id`                                               |
| `inspirationCollectionsRelations`     | `inspirationCollections`     | users, inspirationCollectionItems                                                                                           | one+many    | `creator_id`                                                       |
| `inspirationCollectionItemsRelations` | `inspirationCollectionItems` | inspirationCollections, inspirations                                                                                        | many-to-one | `collection_id`, `inspiration_id`                                  |
| `creatorSavedInspirationsRelations`   | `creatorSavedInspirations`   | users, inspirations                                                                                                         | many-to-one | `creator_id`, `inspiration_id`                                     |
| `campaignInspirationsRelations`       | `campaignInspirations`       | campaigns, inspirations                                                                                                     | many-to-one | `campaign_id`, `inspiration_id`                                    |
| `creatorAddressesRelations`           | `creatorAddresses`           | users                                                                                                                       | many-to-one | `creator_id`                                                       |
| `conversationsRelations`              | `conversations`              | companies (×2), campaigns, users, convMessages, messageReads                                                                | one+many    | `brand_id`, `company_id`, `campaign_id`, `creator_id`              |
| `convMessagesRelations`               | `convMessages`               | conversations, users                                                                                                        | many-to-one | `conversation_id`, `sender_user_id`                                |
| `messageReadsRelations`               | `messageReads`               | conversations, users                                                                                                        | many-to-one | `conversation_id`, `user_id`                                       |
| `instagramAccountsRelations`          | `instagramAccounts`          | users, companies, instagramPosts, instagramMessages                                                                         | one+many    | `user_id`, `company_id`                                            |
| `instagramPostsRelations`             | `instagramPosts`             | instagramAccounts                                                                                                           | many-to-one | `instagram_account_id`                                             |
| `instagramMessagesRelations`          | `instagramMessages`          | instagramAccounts                                                                                                           | many-to-one | `instagram_account_id`                                             |
| `instagramContactsRelations`          | `instagramContacts`          | companies, instagramProfiles, users, instagramInteractions                                                                  | one+many    | `company_id`, `instagram_profile_id`, `user_id`                    |
| `instagramInteractionsRelations`      | `instagramInteractions`      | instagramContacts, companies                                                                                                | many-to-one | `contact_id`, `company_id`                                         |
| `metaAdAccountsRelations`             | `metaAdAccounts`             | companies, metaBusinessManagers, metaAdAccountsList                                                                         | one+many    | `company_id`                                                       |
| `metaBusinessManagersRelations`       | `metaBusinessManagers`       | metaAdAccounts                                                                                                              | many-to-one | `meta_ad_account_id`                                               |
| `metaAdAccountsListRelations`         | `metaAdAccountsList`         | metaAdAccounts                                                                                                              | many-to-one | `meta_ad_account_id`                                               |
| `creatorAdPartnersRelations`          | `creatorAdPartners`          | companies, users, instagramAccounts                                                                                         | many-to-one | `company_id`, `creator_id`, `instagram_account_id`                 |
| `creatorAuthLinksRelations`           | `creatorAuthLinks`           | companies, users                                                                                                            | many-to-one | `company_id`, `creator_id`                                         |
| `contactNotesRelations`               | `contactNotes`               | companies, users                                                                                                            | many-to-one | `company_id`, `created_by`                                         |
| `dmTemplatesRelations`                | `dmTemplates`                | companies, users, dmSendLogs                                                                                                | one+many    | `company_id`, `created_by`                                         |
| `dmSendLogsRelations`                 | `dmSendLogs`                 | companies, dmTemplates, instagramAccounts, campaigns                                                                        | many-to-one | `company_id`, `template_id`, `instagram_account_id`, `campaign_id` |

> **Nota**: Named relations (`relationName`) usadas para disambiguação: `favorites`/`favoritedBy` (favoriteCreators), `ownedCompanies`/`userMemberships` (users↔companies), `sentInvites`/`receivedInvites` (campaignInvites), `brandConversations`/`companyConversations`/`creatorConversations` (conversations).

---

## 18. Zod Insert Schemas (89)

Todos criados via `createInsertSchema(table).omit({...})`. Usados para validação de POST/PUT bodies.

**Pattern**: `createInsertSchema(table).omit({ id: true, createdAt: true, ... })`
Alguns schemas adicionam `.extend({})` com validações customizadas.

| #   | Schema Name                             | Source Table               | Omitted Fields               | Extensions                                                                                      |
| --- | --------------------------------------- | -------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------- |
| 1   | `insertTagSchema`                       | tags                       | id, createdAt                | —                                                                                               |
| 2   | `insertCreatorTagSchema`                | creatorTags                | id, createdAt                | —                                                                                               |
| 3   | `insertBrandTagSchema`                  | brandTags                  | id, createdAt                | —                                                                                               |
| 4   | `insertCampaignTagSchema`               | campaignTags               | id, createdAt                | —                                                                                               |
| 5   | `insertWorkflowStageSchema`             | workflowStages             | id, createdAt                | —                                                                                               |
| 6   | `insertUserSchema`                      | users                      | id                           | `.extend({ dateOfBirth: z.string().optional().refine(≥18 anos) })`                              |
| 7   | `insertCampaignSchema`                  | campaigns                  | id, createdAt                | `.extend({ targetGender: z.enum([...]).optional().or(z.literal("")).transform() })`             |
| 8   | `insertApplicationSchema`               | applications               | id, appliedAt                | —                                                                                               |
| 9   | `insertDeliverableSchema`               | deliverables               | id, uploadedAt               | —                                                                                               |
| 10  | `insertNotificationSchema`              | notifications              | id, createdAt                | —                                                                                               |
| 11  | `insertProblemReportSchema`             | problemReports             | id, createdAt                | —                                                                                               |
| 12  | `insertFavoriteCreatorSchema`           | favoriteCreators           | id, createdAt                | —                                                                                               |
| 13  | `insertFavoriteCompanySchema`           | favoriteCompanies          | id, createdAt                | —                                                                                               |
| 14  | `insertCreatorReviewSchema`             | creatorReviews             | id, createdAt, updatedAt     | `.extend({ rating: z.number().int().min(1).max(5), comment: z.string().max(1000).optional() })` |
| 15  | `insertCampaignInviteSchema`            | campaignInvites            | id, createdAt, respondedAt   | —                                                                                               |
| 16  | `insertDeliverableCommentSchema`        | deliverableComments        | id, createdAt                | —                                                                                               |
| 17  | `insertCampaignTemplateSchema`          | campaignTemplates          | id, createdAt, updatedAt     | `.extend({ targetGender: z.enum([...]).optional().or(z.literal("")).transform() })`             |
| 18  | `insertCreatorPostSchema`               | creatorPosts               | id, analyzedAt               | —                                                                                               |
| 19  | `insertCreatorAnalyticsHistorySchema`   | creatorAnalyticsHistory    | id, recordedAt               | —                                                                                               |
| 20  | `insertCreatorHashtagSchema`            | creatorHashtags            | id                           | —                                                                                               |
| 21  | `insertPostAiInsightSchema`             | postAiInsights             | id, createdAt, updatedAt     | —                                                                                               |
| 22  | `insertCompanySchema`                   | companies                  | id, createdAt                | —                                                                                               |
| 23  | `insertCompanyMemberSchema`             | companyMembers             | id, createdAt                | —                                                                                               |
| 24  | `insertCompanyUserInviteSchema`         | companyUserInvites         | id, createdAt, acceptedAt    | —                                                                                               |
| 25  | `insertCampaignCreatorStatsSchema`      | campaignCreatorStats       | id, updatedAt                | —                                                                                               |
| 26  | `insertFeatureFlagSchema`               | featureFlags               | id, createdAt, updatedAt     | —                                                                                               |
| 27  | `insertCreatorLevelSchema`              | creatorLevels              | id                           | —                                                                                               |
| 28  | `insertCreatorPointsSchema`             | creatorPoints              | id, createdAt                | —                                                                                               |
| 29  | `insertBadgeSchema`                     | badges                     | id, createdAt                | —                                                                                               |
| 30  | `insertCreatorBadgeSchema`              | creatorBadges              | id, earnedAt                 | —                                                                                               |
| 31  | `insertCampaignCouponSchema`            | campaignCoupons            | id, createdAt                | —                                                                                               |
| 32  | `insertSalesTrackingSchema`             | salesTracking              | id, trackedAt                | —                                                                                               |
| 33  | `insertCreatorCommissionSchema`         | creatorCommissions         | id, createdAt                | —                                                                                               |
| 34  | `insertBrandSettingsSchema`             | brandSettings              | id, createdAt, updatedAt     | —                                                                                               |
| 35  | `insertCompanyWalletSchema`             | companyWallets             | id, createdAt, updatedAt     | —                                                                                               |
| 36  | `insertWalletBoxSchema`                 | walletBoxes                | id, createdAt, updatedAt     | —                                                                                               |
| 37  | `insertCreatorBalanceSchema`            | creatorBalances            | id, createdAt, updatedAt     | —                                                                                               |
| 38  | `insertWalletTransactionSchema`         | walletTransactions         | id, createdAt, updatedAt     | —                                                                                               |
| 39  | `insertPaymentBatchSchema`              | paymentBatches             | id, createdAt, updatedAt     | —                                                                                               |
| 40  | `insertBrandCreatorMembershipSchema`    | brandCreatorMemberships    | id, createdAt, updatedAt     | —                                                                                               |
| 41  | `insertCommunityInviteSchema`           | communityInvites           | id, createdAt, respondedAt   | —                                                                                               |
| 42  | `insertCreatorDiscoveryProfileSchema`   | creatorDiscoveryProfiles   | id, updatedAt                | —                                                                                               |
| 43  | `insertBrandProgramSchema`              | brandPrograms              | id, createdAt, updatedAt     | —                                                                                               |
| 44  | `insertBrandRewardSchema`               | brandRewards               | id, createdAt, updatedAt     | —                                                                                               |
| 45  | `insertBrandTierConfigSchema`           | brandTierConfigs           | id, createdAt                | —                                                                                               |
| 46  | `insertCampaignPointsRulesSchema`       | campaignPointsRules        | id, createdAt, updatedAt     | —                                                                                               |
| 47  | `insertCampaignPrizeSchema`             | campaignPrizes             | id, createdAt                | —                                                                                               |
| 48  | `insertPointsLedgerSchema`              | pointsLedger               | id, createdAt                | —                                                                                               |
| 49  | `insertBrandCreatorTierSchema`          | brandCreatorTiers          | id, createdAt                | —                                                                                               |
| 50  | `insertCampaignMetricSnapshotSchema`    | campaignMetricSnapshots    | id, capturedAt               | —                                                                                               |
| 51  | `insertRewardEntitlementSchema`         | rewardEntitlements         | id, createdAt                | —                                                                                               |
| 52  | `insertCourseSchema`                    | courses                    | id, createdAt                | —                                                                                               |
| 53  | `insertCourseModuleSchema`              | courseModules              | id                           | —                                                                                               |
| 54  | `insertCourseLessonSchema`              | courseLessons              | id, createdAt                | —                                                                                               |
| 55  | `insertCreatorCourseProgressSchema`     | creatorCourseProgress      | id, startedAt, updatedAt     | —                                                                                               |
| 56  | `insertCreatorLessonProgressSchema`     | creatorLessonProgress      | id, completedAt              | —                                                                                               |
| 57  | `insertInspirationSchema`               | inspirations               | id, createdAt                | —                                                                                               |
| 58  | `insertInspirationCollectionSchema`     | inspirationCollections     | id, createdAt                | —                                                                                               |
| 59  | `insertInspirationCollectionItemSchema` | inspirationCollectionItems | id, createdAt                | —                                                                                               |
| 60  | `insertCreatorSavedInspirationSchema`   | creatorSavedInspirations   | id, createdAt                | —                                                                                               |
| 61  | `insertCampaignInspirationSchema`       | campaignInspirations       | id, createdAt                | —                                                                                               |
| 62  | `insertCreatorAddressSchema`            | creatorAddresses           | id, createdAt, updatedAt     | —                                                                                               |
| 63  | `insertConversationSchema`              | conversations              | id, createdAt, lastMessageAt | —                                                                                               |
| 64  | `insertConvMessageSchema`               | convMessages               | id, createdAt                | —                                                                                               |
| 65  | `insertMessageReadSchema`               | messageReads               | id                           | —                                                                                               |
| 66  | `insertInstagramAccountSchema`          | instagramAccounts          | id, createdAt, updatedAt     | —                                                                                               |
| 67  | `insertInstagramPostSchema`             | instagramPosts             | id, createdAt, updatedAt     | —                                                                                               |
| 68  | `insertInstagramMessageSchema`          | instagramMessages          | id, createdAt                | —                                                                                               |
| 69  | `insertInstagramContactSchema`          | instagramContacts          | id, createdAt, updatedAt     | —                                                                                               |
| 70  | `insertInstagramInteractionSchema`      | instagramInteractions      | id, createdAt                | —                                                                                               |
| 71  | `insertMetaAdAccountSchema`             | metaAdAccounts             | id, createdAt, updatedAt     | —                                                                                               |
| 72  | `insertMetaBusinessManagerSchema`       | metaBusinessManagers       | id, createdAt                | —                                                                                               |
| 73  | `insertMetaAdAccountsListSchema`        | metaAdAccountsList         | id, createdAt                | —                                                                                               |
| 74  | `insertIntegrationLogSchema`            | integrationLogs            | id, createdAt                | —                                                                                               |
| 75  | `insertCreatorAdPartnerSchema`          | creatorAdPartners          | id, createdAt, updatedAt     | —                                                                                               |
| 76  | `insertCreatorAuthLinkSchema`           | creatorAuthLinks           | id, createdAt                | —                                                                                               |
| 77  | `insertContactNoteSchema`               | contactNotes               | id, createdAt, updatedAt     | —                                                                                               |
| 78  | `insertDmTemplateSchema`                | dmTemplates                | id, createdAt, updatedAt     | —                                                                                               |
| 79  | `insertDmSendLogSchema`                 | dmSendLogs                 | id, createdAt                | —                                                                                               |
| 80  | `insertProfileSnapshotSchema`           | profileSnapshots           | id, capturedAt               | —                                                                                               |
| 81  | `insertDataSourceRegistrySchema`        | dataSourceRegistry         | id, createdAt, updatedAt     | —                                                                                               |
| 82  | `insertBlogPostSchema`                  | blogPosts                  | id, createdAt, updatedAt     | —                                                                                               |
| 83  | `insertTikTokProfileSchema`             | tiktokProfiles             | id, createdAt, updatedAt     | —                                                                                               |
| 84  | `insertTikTokVideoSchema`               | tiktokVideos               | id, createdAt                | —                                                                                               |
| 85  | `insertYouTubeChannelSchema`            | youtubeChannels            | id, createdAt, updatedAt     | —                                                                                               |
| 86  | `insertYouTubeVideoSchema`              | youtubeVideos              | id, createdAt                | —                                                                                               |
| 87  | `insertHashtagSearchSchema`             | hashtagSearches            | id, createdAt                | —                                                                                               |
| 88  | `insertCampaignHashtagSchema`           | campaignHashtags           | id, createdAt                | —                                                                                               |
| 89  | `insertHashtagPostSchema`               | hashtagPosts               | id, discoveredAt             | —                                                                                               |

---

## 19. Exported Types (223)

### 19.1 Table Select Types (92)

Gerados via `typeof table.$inferSelect`. Um por tabela.

| Type                        | Source Table               |
| --------------------------- | -------------------------- |
| `User`                      | users                      |
| `Campaign`                  | campaigns                  |
| `Application`               | applications               |
| `Deliverable`               | deliverables               |
| `Notification`              | notifications              |
| `ProblemReport`             | problemReports             |
| `FavoriteCreator`           | favoriteCreators           |
| `FavoriteCompany`           | favoriteCompanies          |
| `CreatorReview`             | creatorReviews             |
| `CampaignInvite`            | campaignInvites            |
| `DeliverableComment`        | deliverableComments        |
| `CampaignTemplate`          | campaignTemplates          |
| `Company`                   | companies                  |
| `CompanyMember`             | companyMembers             |
| `CompanyUserInvite`         | companyUserInvites         |
| `CreatorPost`               | creatorPosts               |
| `CreatorAnalyticsHistory`   | creatorAnalyticsHistory    |
| `CreatorHashtag`            | creatorHashtags            |
| `PostAiInsight`             | postAiInsights             |
| `Tag`                       | tags                       |
| `CreatorTag`                | creatorTags                |
| `BrandTag`                  | brandTags                  |
| `CampaignTag`               | campaignTags               |
| `WorkflowStage`             | workflowStages             |
| `CampaignCreatorStats`      | campaignCreatorStats       |
| `FeatureFlag`               | featureFlags               |
| `CreatorLevel`              | creatorLevels              |
| `CreatorPointsEntry`        | creatorPoints              |
| `Badge`                     | badges                     |
| `CreatorBadge`              | creatorBadges              |
| `CampaignCoupon`            | campaignCoupons            |
| `SalesTracking`             | salesTracking              |
| `CreatorCommission`         | creatorCommissions         |
| `BrandSettings`             | brandSettings              |
| `CompanyWallet`             | companyWallets             |
| `WalletBox`                 | walletBoxes                |
| `CreatorBalance`            | creatorBalances            |
| `WalletTransaction`         | walletTransactions         |
| `PaymentBatch`              | paymentBatches             |
| `BrandCreatorMembership`    | brandCreatorMemberships    |
| `CommunityInvite`           | communityInvites           |
| `CreatorDiscoveryProfile`   | creatorDiscoveryProfiles   |
| `BrandProgram`              | brandPrograms              |
| `BrandReward`               | brandRewards               |
| `BrandTierConfig`           | brandTierConfigs           |
| `CampaignPointsRules`       | campaignPointsRules        |
| `CampaignPrize`             | campaignPrizes             |
| `PointsLedgerEntry`         | pointsLedger               |
| `BrandCreatorTier`          | brandCreatorTiers          |
| `CampaignMetricSnapshot`    | campaignMetricSnapshots    |
| `RewardEntitlement`         | rewardEntitlements         |
| `Course`                    | courses                    |
| `CourseModule`              | courseModules              |
| `CourseLesson`              | courseLessons              |
| `CreatorCourseProgress`     | creatorCourseProgress      |
| `CreatorLessonProgress`     | creatorLessonProgress      |
| `Inspiration`               | inspirations               |
| `InspirationCollection`     | inspirationCollections     |
| `InspirationCollectionItem` | inspirationCollectionItems |
| `CreatorSavedInspiration`   | creatorSavedInspirations   |
| `CampaignInspiration`       | campaignInspirations       |
| `CreatorAddress`            | creatorAddresses           |
| `Conversation`              | conversations              |
| `ConvMessage`               | convMessages               |
| `MessageRead`               | messageReads               |
| `InstagramProfile`          | instagramProfiles          |
| `InstagramAccount`          | instagramAccounts          |
| `InstagramPost`             | instagramPosts             |
| `InstagramMessage`          | instagramMessages          |
| `InstagramContact`          | instagramContacts          |
| `InstagramInteraction`      | instagramInteractions      |
| `MetaAdAccount`             | metaAdAccounts             |
| `MetaBusinessManager`       | metaBusinessManagers       |
| `MetaAdAccountsList`        | metaAdAccountsList         |
| `IntegrationLog`            | integrationLogs            |
| `CreatorAdPartner`          | creatorAdPartners          |
| `CreatorAuthLink`           | creatorAuthLinks           |
| `ContactNote`               | contactNotes               |
| `DmTemplate`                | dmTemplates                |
| `DmSendLog`                 | dmSendLogs                 |
| `ProfileSnapshot`           | profileSnapshots           |
| `DataSourceRegistry`        | dataSourceRegistry         |
| `BlogPost`                  | blogPosts                  |
| `TikTokProfile`             | tiktokProfiles             |
| `TikTokVideo`               | tiktokVideos               |
| `YouTubeChannel`            | youtubeChannels            |
| `YouTubeVideo`              | youtubeVideos              |
| `HashtagSearch`             | hashtagSearches            |
| `CampaignHashtag`           | campaignHashtags           |
| `HashtagPost`               | hashtagPosts               |

### 19.2 Table Insert Types (89)

Gerados via `z.infer<typeof insertXxxSchema>`. Pattern: `InsertXxx`.

Cada `InsertXxx` corresponde exatamente a um `insertXxxSchema` da seção 18. Exemplos: `InsertUser`, `InsertCampaign`, `InsertApplication`, etc.

### 19.3 Interfaces (19)

| Interface                    | Descrição                                             |
| ---------------------------- | ----------------------------------------------------- |
| `WebSocketMessage`           | Mensagem WebSocket (`type` + `payload`)               |
| `InstagramTopPost`           | Post popular do Instagram (resumo)                    |
| `StructuredBriefing`         | Briefing estruturado de campanha (JSON)               |
| `BrandCanvasAsset`           | Asset de referência visual                            |
| `BrandCanvasProduct`         | Produto da marca                                      |
| `BrandCanvasPersona`         | Persona/público-alvo                                  |
| `BrandCanvasColorPalette`    | Paleta de cores                                       |
| `BrandCanvasTypography`      | Tipografia                                            |
| `BrandCanvasVisualIdentity`  | Identidade visual completa                            |
| `BrandCanvasVoice`           | Tom de voz da marca                                   |
| `BrandCanvasContentStrategy` | Estratégia de conteúdo                                |
| `BrandCanvasCompetitor`      | Competidor analisado                                  |
| `BrandCanvasReference`       | Referência visual/social                              |
| `BrandCanvasProcessingStep`  | Step do pipeline de processamento                     |
| `BrandCanvasProcessingMeta`  | Metadata do processamento                             |
| `BrandCanvasV2`              | Objeto completo Brand Canvas (JSONB em brandSettings) |
| `DeepAnalysis`               | Análise completa de perfil (Instagram + TikTok)       |

### 19.4 Utility Types (23)

| Type                       | Descrição                                                        |
| -------------------------- | ---------------------------------------------------------------- |
| `StructuredDeliverable`    | `z.infer` do schema de deliverable estruturado                   |
| `WebSocketEvent`           | Union de tipos de evento WebSocket                               |
| `BrandCanvasStepStatus`    | `'pending' \| 'running' \| 'completed' \| 'failed' \| 'skipped'` |
| `BrandCanvas`              | Alias para `BrandCanvasV2` (backward compat)                     |
| `CampaignReward`           | Interface de reward em campanha                                  |
| `CampaignEligibility`      | Critérios de elegibilidade                                       |
| `CreatorWorkflowStatus`    | Union dos estágios de workflow                                   |
| `DeliverableType`          | Union dos tipos de deliverable                                   |
| `BrandCategory`            | Union das categorias de marca                                    |
| `TagType`                  | Union dos tipos de tag                                           |
| `CampaignDeliverableType`  | Union dos tipos de deliverable de campanha                       |
| `PointsPerDeliverableType` | Pontos por tipo de deliverable                                   |
| `MembershipStatus`         | Union dos status de membership                                   |
| `MembershipSource`         | Union das fontes de membership                                   |
| `InviteStatus`             | Union dos status de convite                                      |
| `ConversationType`         | Union dos tipos de conversa                                      |
| `ConversationStatus`       | Union dos status de conversa                                     |
| `UserWithCompanies`        | `User & { memberships: ... }`                                    |
| `BrandMention`             | Menção de marca (frontend-only)                                  |
| `UgcAsset`                 | Asset UGC (frontend-only)                                        |
| `UsageRights`              | Direitos de uso (frontend-only)                                  |
| `AssetComment`             | Comentário em asset (frontend-only)                              |
| `MonthlyLeaderboard`       | Leaderboard mensal (frontend-only)                               |
| `Competition`              | Competição (frontend-only)                                       |
| `EcommerceIntegration`     | Integração e-commerce (frontend-only)                            |
| `BrandScoringDefaults`     | Defaults de scoring (frontend-only)                              |

---

## 20. Indexes Reference

### 20.1 Explicit Indexes (16)

Definidos via `index()` ou `uniqueIndex()` no terceiro argumento de `pgTable()`.

**instagramProfiles** (3):
| Index | Columns | Type |
|-------|---------|------|
| `instagram_profiles_username_owner_type_idx` | (username, ownerType) | UNIQUE |
| `instagram_profiles_user_id_idx` | (userId) | INDEX |
| `instagram_profiles_company_id_idx` | (companyId) | INDEX |

**instagramContacts** (4):
| Index | Columns | Type |
|-------|---------|------|
| `instagram_contacts_company_username_idx` | (companyId, username) | UNIQUE |
| `instagram_contacts_company_id_idx` | (companyId) | INDEX |
| `instagram_contacts_status_idx` | (companyId, status) | INDEX |
| `instagram_contacts_score_idx` | (companyId, interactionScore) | INDEX |
| `instagram_contacts_last_interaction_idx` | (companyId, lastInteractionAt) | INDEX |

**instagramInteractions** (3):
| Index | Columns | Type |
|-------|---------|------|
| `instagram_interactions_contact_id_idx` | (contactId) | INDEX |
| `instagram_interactions_company_type_idx` | (companyId, type) | INDEX |
| `instagram_interactions_occurred_at_idx` | (contactId, occurredAt) | INDEX |

**tiktokProfiles** (2):
| Index | Columns | Type |
|-------|---------|------|
| `tiktok_profiles_connected_by_user_idx` | (connectedByUserId) | INDEX |
| `tiktok_profiles_open_id_idx` | (openId) | INDEX |

**blogPosts** (3):
| Index | Columns | Type |
|-------|---------|------|
| `blog_posts_slug_idx` | (slug) | INDEX |
| `blog_posts_published_idx` | (published) | INDEX |
| `blog_posts_category_idx` | (category) | INDEX |

### 20.2 Unique Constraints (~30)

Definidas via `.unique()` na coluna ou `unique().on(...)` no table builder.

**Column-level `.unique()`**:

| Table               | Column           | DB Constraint     |
| ------------------- | ---------------- | ----------------- |
| users               | email            | UNIQUE            |
| campaigns           | slug             | UNIQUE (nullable) |
| companyUserInvites  | token            | UNIQUE            |
| featureFlags        | name             | UNIQUE            |
| campaignCoupons     | code             | UNIQUE            |
| brandSettings       | companyId        | UNIQUE            |
| creatorBalances     | userId           | UNIQUE            |
| brandPrograms       | companyId        | UNIQUE            |
| campaignPointsRules | campaignId       | UNIQUE            |
| communityInvites    | token            | UNIQUE            |
| courses             | slug             | UNIQUE            |
| instagramAccounts   | instagramUserId  | UNIQUE            |
| instagramPosts      | instagramMediaId | UNIQUE            |
| instagramMessages   | messageId        | UNIQUE            |
| creatorAuthLinks    | token            | UNIQUE            |
| dataSourceRegistry  | key              | UNIQUE            |
| tiktokProfiles      | uniqueId         | UNIQUE            |
| tiktokProfiles      | openId           | UNIQUE (nullable) |
| tiktokVideos        | videoId          | UNIQUE            |
| youtubeChannels     | channelId        | UNIQUE            |
| youtubeVideos       | videoId          | UNIQUE            |
| blogPosts           | slug             | UNIQUE            |
| salesTracking       | stripeEventId    | UNIQUE (nullable) |

**Composite unique via `unique().on(...)`**:

| Table                 | Columns                      | Purpose                                |
| --------------------- | ---------------------------- | -------------------------------------- |
| creatorHashtags       | (userId, platform, hashtag)  | Uma hashtag por plataforma por creator |
| postAiInsights        | (postId)                     | Um insight por post                    |
| creatorLessonProgress | (creatorId, lessonId)        | Um progresso por lição por creator     |
| instagramTaggedPosts  | (instagramAccountId, postId) | Um tagged post por conta               |
| messageReads          | (conversationId, userId)     | Um read tracker por conversa por user  |
| campaignHashtags      | (campaignId, hashtag)        | Uma hashtag por campanha               |
| hashtagPosts          | (campaignHashtagId, mediaId) | Um post por hashtag de campanha        |
