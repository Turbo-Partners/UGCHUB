# Guia de Extração de Dados - CreatorConnect

Este documento centraliza toda a estratégia de extração de dados do CreatorConnect, incluindo APIs nativas e Apify.

---

## 📋 Índice

1. [Princípios Fundamentais](#princípios-fundamentais)
2. [Hierarquia LOCAL FIRST](#-hierarquia-local-first)
3. [Instagram API Nativa - Features Implementadas](#instagram-api-nativa---features-implementadas)
4. [Fontes de Dados por Plataforma](#fontes-de-dados-por-plataforma)
   - [Instagram](#instagram)
   - [TikTok](#tiktok)
   - [Meta Ads](#meta-ads)
   - [YouTube](#youtube)
   - [Ferramentas para Empresas](#ferramentas-para-empresas)
   - [Discovery & Leads](#discovery--leads)
5. [Política de Chamadas](#política-de-chamadas)
6. [Custos e Orçamento](#custos-e-orçamento)
7. [Implementação Técnica](#implementação-técnica)
8. [Referência de Atores Apify](#referência-de-atores-apify)

---

## Princípios Fundamentais

| Princípio | Descrição |
|-----------|-----------|
| **LOCAL FIRST** | Sempre buscar dados no banco local antes de chamar APIs externas |
| **API NATIVA > APIFY** | Quando disponível, usar API oficial (custo $0) |
| **ON-DEMAND** | 99% das chamadas Apify são via botão do usuário |
| **CACHE COMPARTILHADO** | Cache de 7 dias beneficia TODAS as empresas |
| **ORÇAMENTO** | $300/mês para ~100 usuários ativos |
| **RATE LIMIT** | Máximo 5 chamadas Apify por minuto (proteção anti-loop) |
| **REEL SCRAPER** | ⛔ DESATIVADO - Custo muito alto (~$2.60/1k). Usar Profile Scraper |
| **DM AUTO-SCRAPE** | ⛔ DESATIVADO - Não raspar perfis automaticamente de DMs |

**Total de atores Apify configurados:** 22 atores em 7 categorias

---

## 🚨 ENDPOINTS APIFY - STATUS E USO

### Endpoints ATIVOS (usar com moderação)

| Endpoint | Custo | Quando Usar | Trigger |
|----------|-------|-------------|---------|
| `POST /api/apify/scrape/profiles` | ~$0.50/1k | Botão "Atualizar Perfil" no detalhe do criador | On-demand |
| `POST /api/apify/scrape/posts` | ~$2.70/1k | Análise de conteúdo específico | On-demand |
| `POST /api/apify/discover` | ~$2.50/1k | Discovery de criadores por hashtag | On-demand |
| `POST /api/apify/sync/manual` | variável | Sync forçado de perfis da comunidade | Admin |
| `POST /api/apify/presets/creator-full-profile` | ~$0.50+ | Deep analysis de criador específico | On-demand |
| `POST /api/apify/presets/competitor-analysis` | ~$2.00/perfil | Análise de concorrentes | On-demand |
| `GET /api/apify/profile/:username/*` | $0 | Consulta cache local apenas | Automático |

### Endpoints DESATIVADOS (bloqueados)

| Endpoint | Motivo | Alternativa |
|----------|--------|-------------|
| `POST /api/apify/scrape/reels` | ⛔ Custo alto ($2.60/1k) | Usar `/scrape/profiles` |
| `POST /api/apify/trigger/new-dm` | ⛔ Chamadas automáticas excessivas | Scraping manual apenas |

### Jobs Agendados

| Job | Frequência | Descrição | Status |
|-----|------------|-----------|--------|
| `apifySyncJob` | Diário 6h | Sync de perfis da comunidade (cache >7 dias) | ✅ Ativo, com rate limit |

### Regras de Uso

1. **NUNCA** chamar Apify automaticamente quando:
   - Uma DM é recebida
   - Um perfil é visualizado na lista
   - Página carrega

2. **SEMPRE** chamar Apify apenas quando:
   - Usuário clica em botão "Atualizar Perfil"
   - Usuário inicia Discovery explicitamente
   - Admin executa sync manual
   - Job diário roda (6h da manhã)

3. **Verificar cache antes de chamar:**
   ```typescript
   const cacheAge = await apifyService.getCacheAge(username);
   if (cacheAge !== null && cacheAge < 168) { // 7 dias
     return cachedProfile; // NÃO chamar Apify
   }
   ```

---

## 🔴 Hierarquia LOCAL FIRST (3 Camadas)

Antes de QUALQUER chamada externa, verificar dados nesta ordem:

```
┌─────────────────────────────────────────────────────────────┐
│  CAMADA 1: Dados Locais (custo ZERO)                        │
│  ├── users                    → Criador cadastrado           │
│  ├── instagram_profiles       → Cache compartilhado (7 dias) │
│  ├── creator_posts            → Posts já coletados           │
│  ├── creator_analytics_history→ Métricas históricas          │
│  ├── hashtag_posts            → Posts de hashtags coletados   │
│  └── instagram_messages       → Foto de perfil via DMs       │
├─────────────────────────────────────────────────────────────┤
│  CAMADA 2: Instagram API Nativa (custo ZERO)                 │
│  ├── Business Discovery API   → Perfis externos via Graph API│
│  ├── Comments API             → Comentários dos posts        │
│  ├── Hashtag Search API       → Busca por hashtag (30/semana)│
│  ├── Content Publishing API   → Publicar conteúdo            │
│  ├── Messaging API            → DMs (200/hora)               │
│  └── Partnership Ads API      → Anúncios com criadores       │
├─────────────────────────────────────────────────────────────┤
│  CAMADA 3: Apify (ÚLTIMO RECURSO - PAGO)                     │
│  ├── Só via ação explícita do usuário (botão "Enriquecer")   │
│  ├── Usar APENAS instagram-api-scraper (~$0.50/1k)           │
│  └── NUNCA chamar automaticamente (sem cron, sem auto-DM)    │
└─────────────────────────────────────────────────────────────┘
```

### Helper: `tryBusinessDiscoveryForProfile()`

Implementado em `server/routes.ts` e `server/routes/instagram.routes.ts`.
Busca QUALQUER conta Instagram Business conectada no sistema e usa a
Business Discovery API para consultar perfis externos gratuitamente.

```typescript
const bizData = await tryBusinessDiscoveryForProfile(username);
if (bizData) {
  return bizData; // $0 cost!
}
// fallback: Apify (only on explicit user action)
```

### Endpoints refatorados para LOCAL FIRST

| Endpoint | Camada 1 | Camada 2 | Camada 3 |
|----------|----------|----------|----------|
| `/api/social/validate-instagram` | ✅ | ✅ Business Discovery | ✅ Apify fallback |
| `/api/social/update-metrics` | ✅ | ✅ Business Discovery | ✅ Apify fallback |
| `/api/creators/:id/refresh-analysis` | ✅ | ✅ Business Discovery | ✅ Apify fallback |
| `/api/enrichment/instagram/:username` | ✅ | ✅ Business Discovery | ✅ Apify fallback |
| `/api/instagram/profile/:username` | ✅ | ✅ Business Discovery | ❌ Sem Apify |
| `/api/instagram/profile/:username/enrich` | ❌ | ❌ | ✅ Apify (explícito) |

### Admin: Gerenciamento de Webhooks/Schedules Apify

Endpoints para controlar webhooks e schedules automatizados que podem gerar custo:

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/apify/webhooks` | GET | Listar todos os webhooks |
| `/api/apify/webhooks/:id` | DELETE | Deletar um webhook |
| `/api/apify/webhooks/:id/disable` | PUT | Desativar um webhook |
| `/api/apify/schedules` | GET | Listar todos os schedules |
| `/api/apify/schedules/:id/disable` | PUT | Pausar um schedule |
| `/api/apify/schedules/:id/enable` | PUT | Reativar um schedule |

---

## Instagram API Nativa - Features Implementadas

Todas as features abaixo usam a API oficial do Instagram/Meta e custam **$0**. Requerem conta Instagram Business conectada via OAuth.

### Permissões OAuth Solicitadas
```
instagram_business_basic
instagram_business_manage_messages
instagram_business_manage_comments
instagram_business_content_publish
instagram_business_manage_insights
```

### Hashtag Tracking

| Item | Detalhe |
|------|---------|
| **Service** | `server/services/instagram-hashtags.ts` |
| **Routes** | `server/routes/hashtag.routes.ts` |
| **Frontend** | `client/src/components/campaign-hashtag-tracking.tsx` |
| **Schema** | `hashtag_searches`, `campaign_hashtags`, `hashtag_posts` |
| **Custo** | $0 (Instagram Graph API) |
| **Limite** | 30 hashtags únicas por semana (limite da API) |

**Endpoints:**

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/instagram/hashtags/search` | Buscar posts por hashtag (top/recent) |
| POST | `/api/instagram/hashtags/track` | Associar hashtag a uma campanha |
| GET | `/api/instagram/hashtags/campaign/:campaignId` | Listar hashtags de uma campanha |
| DELETE | `/api/instagram/hashtags/campaign/:campaignId/:hashtagId` | Remover hashtag de campanha |
| GET | `/api/instagram/hashtags/campaign/:campaignId/posts` | Posts descobertos da campanha |
| GET | `/api/instagram/hashtags/campaign/:campaignId/stats` | Estatísticas de hashtags |
| GET | `/api/instagram/hashtags/usage` | Uso semanal de hashtags |
| GET | `/api/instagram/hashtags/search-history` | Histórico de buscas |

### Comments Management

| Item | Detalhe |
|------|---------|
| **Service** | `server/services/instagram-comments.ts` |
| **Routes** | `server/routes/comments.routes.ts` |
| **Frontend** | `client/src/pages/company/instagram-comments.tsx` |
| **Custo** | $0 (Instagram Graph API) |
| **IA** | OpenAI para análise de sentimento em batch |

**Endpoints:**

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/instagram/comments` | Listar comentários de todos os posts |
| GET | `/api/instagram/comments/:mediaId` | Comentários de um post específico |
| POST | `/api/instagram/comments/:commentId/reply` | Responder a um comentário |
| POST | `/api/instagram/comments/:commentId/hide` | Ocultar/mostrar comentário |
| DELETE | `/api/instagram/comments/:commentId` | Excluir comentário |
| POST | `/api/instagram/comments/analyze-sentiment` | Análise de sentimento com IA |

### Content Publishing

| Item | Detalhe |
|------|---------|
| **Service** | `server/services/instagram-publishing.ts` |
| **Routes** | `server/routes/publishing.routes.ts` |
| **Frontend** | `client/src/pages/company/instagram-publishing.tsx` |
| **Custo** | $0 (Meta Content Publishing API) |
| **Limite** | 25 publicações por 24 horas |
| **Validação** | Zod schemas em todos os endpoints de publicação |

**Tipos de publicação suportados:**

| Tipo | Requisitos |
|------|------------|
| **Imagem** | URL pública HTTPS, JPEG ou PNG |
| **Carrossel** | 2-10 itens (imagens e/ou vídeos) |
| **Reel** | Vídeo MP4/MOV, 3s-15min, mín. 720p |
| **Story** | Imagem ou vídeo, desaparece em 24h |

**Endpoints:**

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/instagram/publishing/limit` | Verificar cota de publicação (25/24h) |
| GET | `/api/instagram/publishing/media` | Listar publicações recentes |
| POST | `/api/instagram/publish/image` | Publicar imagem no feed |
| POST | `/api/instagram/publish/carousel` | Publicar carrossel |
| POST | `/api/instagram/publish/reel` | Publicar Reel |
| POST | `/api/instagram/publish/story` | Publicar Story |
| GET | `/api/instagram/publishing/container/:id/status` | Status de processamento |

### Partnership Ads

| Item | Detalhe |
|------|---------|
| **Routes** | `server/routes/meta-marketing.routes.ts` |
| **Frontend** | `client/src/pages/company/meta-ads-suite.tsx` |
| **Custo** | $0 (Meta Marketing API) |

**Endpoints:**

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/meta-marketing/partnership-request` | Enviar solicitação ao criador |
| GET | `/api/meta-marketing/partnership-status` | Status de permissões |
| GET | `/api/meta-marketing/partnership-ads` | Listar Partnership Ads |
| POST | `/api/meta-marketing/create-partnership-ad` | Criar anúncio partnership |
| GET | `/api/meta-marketing/partnership-performance` | Métricas de performance |
| POST | `/api/partnership/invitations` | Criar convite para criador |
| GET | `/api/partnership/invite/:token` | Landing page do convite |
| GET | `/api/partnership/auth/:token` | Iniciar OAuth do criador |
| GET | `/api/partnership/callback` | Callback OAuth |

### DM Management

| Item | Detalhe |
|------|---------|
| **Routes** | `server/routes/messaging.routes.ts` |
| **Frontend** | `client/src/pages/company/instagram-inbox.tsx` |
| **Custo** | $0 (Instagram Messaging API) |
| **Limite** | 200 DMs/hora |

### CRM Social (Instagram Contacts)

| Item | Detalhe |
|------|---------|
| **Service** | `server/services/instagram-contacts.ts` |
| **Routes** | Embedded in `instagram.routes.ts` and `messaging.routes.ts` |
| **Schema** | `instagram_contacts` (per-company registry), `instagram_interactions` (history log) |
| **Custo** | $0 (dados locais) |
| **Features** | Contact registry, interaction metrics, status tracking, tags, scoring |
| **Auto-populado** | DM sync e comments sync alimentam automaticamente |

---

## Fontes de Dados por Plataforma

### Instagram

#### Árvore de Decisão

```
Preciso de dados do Instagram?
│
├─ O criador está CONECTADO (tem access_token)?
│   │
│   ├─ SIM → USAR API NATIVA (server/services/instagram.ts)
│   │        - getUserProfile() → dados do perfil
│   │        - getUserMedia() → posts
│   │        - getMediaInsights() → métricas
│   │        - getConversations() → DMs
│   │        - getMentions() → menções/tags
│   │        - getMediaComments() → comentários
│   │        - publishImage/Carousel/Reel/Story → publicar conteúdo
│   │        - searchHashtag() → buscar posts por hashtag
│   │        CUSTO: $0.00
│   │
│   └─ NÃO → Verificar LOCAL FIRST
│            ├─ Dados em `users`? → USAR CACHE
│            ├─ Dados em `instagram_profiles`? → USAR CACHE
│            ├─ Business Discovery API disponível? → USAR ($0)
│            └─ Não encontrado ou >7 dias? → APIFY (on-demand apenas)
│
└─ É busca de NOVOS criadores (discovery)?
    └─ APIFY instagram-scraper (on-demand apenas)
```

#### API Nativa vs Apify

| Dado | Criador CONECTADO | Perfil EXTERNO |
|------|-------------------|----------------|
| Perfil (followers, bio) | ✅ `getUserProfile()` - $0 | Business Discovery / Apify |
| Posts | ✅ `getUserMedia()` - $0 | Apify Post Scraper |
| Insights | ✅ `getMediaInsights()` - $0 | ❌ Não disponível |
| Menções/Tags | ✅ `getMentions()` - $0 | ❌ Não disponível |
| DMs/Conversas | ✅ `getConversations()` - $0 | ❌ Não disponível |
| Comentários | ✅ `getMediaComments()` - $0 | Apify Comment Scraper |
| Reels | ✅ Via `getUserMedia()` - $0 | Apify Reel Scraper |
| Hashtag Search | ✅ `searchHashtag()` - $0 (30/semana) | Apify General Scraper |
| Publicar conteúdo | ✅ `publishImage/Carousel/Reel/Story()` - $0 | ❌ Não disponível |
| Partnership Ads | ✅ Meta Marketing API - $0 | ❌ Não disponível |
| Discovery por hashtag | ❌ | Apify General Scraper |

> **Arquivos:** `server/services/instagram.ts`, `server/services/instagram-comments.ts`, `server/services/instagram-hashtags.ts`, `server/services/instagram-publishing.ts`, `server/routes/instagram.routes.ts`, `server/routes/comments.routes.ts`, `server/routes/hashtag.routes.ts`, `server/routes/publishing.routes.ts`

#### Endpoints que Usam API Nativa

| Endpoint | Método | Dados |
|----------|--------|-------|
| `/api/instagram/sync` | POST | Perfil + Posts do criador conectado |
| `/api/instagram/creator/media` | GET | Posts do criador |
| `/api/instagram/creator/audience` | GET | Insights de audiência |
| `/api/instagram/profile/:username` | GET | Perfil (cache ou API) |
| `/api/instagram/comments` | GET | Comentários dos posts |
| `/api/instagram/comments/:commentId/reply` | POST | Responder comentário |
| `/api/instagram/hashtags/search` | POST | Buscar posts por hashtag |
| `/api/instagram/publish/image` | POST | Publicar imagem |
| `/api/instagram/publish/carousel` | POST | Publicar carrossel |
| `/api/instagram/publish/reel` | POST | Publicar Reel |
| `/api/instagram/publish/story` | POST | Publicar Story |
| `/api/instagram/publishing/limit` | GET | Verificar cota (25/24h) |

#### Limites da API Nativa

| Feature | Limite | Período |
|---------|--------|---------|
| Hashtag lookups | 30 hashtags únicas | 7 dias (rolling) |
| Content Publishing | 25 publicações | 24 horas |
| DM sending | 200 mensagens | 1 hora |
| API requests (geral) | 200 calls | 1 hora/user |

#### Atores Apify para Instagram

| Ator | ID | Custo/1k | Quando Usar | Prioridade |
|------|----|----------|-------------|------------|
| **API Scraper** | `apify/instagram-api-scraper` | **~$0.50** | Posts + Perfil combinados | ⭐ **1º PREFERIDO** |
| Post Scraper | `apify/instagram-post-scraper` | ~$2.70 | Posts detalhados (captions, likes, comments) | ⭐ 2º |
| Profile Scraper | `apify/instagram-profile-scraper` | ~$2.60 | Apenas perfis básicos | 3º |
| Reel Scraper | `apify/instagram-reel-scraper` | ~$2.60 | Análise profunda de Reels | ⚠️ Usar com moderação |
| Comment Scraper | `apify/instagram-comment-scraper` | ~$2.50 | Comentários (análise) | On-demand |
| General Scraper | `apify/instagram-scraper` | ~$2.50 | Hashtags, locations, discovery | Discovery |

**Recomendação de Uso:**
- **`instagram-api-scraper`** → Mais versátil e 5x mais barato! Use para perfil + posts combinados
- **`instagram-post-scraper`** → Quando precisa de dados detalhados dos posts (captions completas, menções, tagged users)
- **`instagram-profile-scraper`** → Apenas quando só precisa de dados do perfil (sem posts)
- **`instagram-reel-scraper`** → Para análise profunda de Reels, usar com cautela (custo alto)

---

### TikTok

> ⚠️ **NÃO TEMOS API NATIVA** - Todo dado de TikTok vem do Apify (on-demand)

#### Árvore de Decisão

```
Preciso de dados do TikTok?
│
├─ Verificar LOCAL FIRST
│   ├─ Dados em `users.tiktok`? → USAR CACHE
│   └─ Dados em `tiktok_profiles`? → USAR CACHE
│
└─ Não encontrado ou >7 dias?
    └─ APIFY tiktok-scraper (on-demand apenas)
```

#### Atores Apify para TikTok

| Ator | ID | Custo | Quando Usar |
|------|----|-------|-------------|
| TikTok Scraper | `clockworks/tiktok-scraper` | $0.03 start + ~$3/1k | Perfis, vídeos, hashtags |
| Free TikTok Scraper | `clockworks/free-tiktok-scraper` | CU-based | Testes, baixo volume |

**Modelo de Custo (Pay Per Event):**
- $0.03 por início de execução
- ~$0.003 por item retornado
- +$0.001 por download de vídeo (desativar!)

> 📝 **TODO:** Considerar integração com TikTok API oficial para reduzir custos

---

### Meta Ads

#### Árvore de Decisão

```
Preciso de dados de Ads?
│
├─ São dados da MINHA empresa (conectada)?
│   │
│   └─ SIM → USAR META ADS API NATIVA
│            - Contas de anúncio → $0
│            - Insights de ads → $0
│            - Campanhas/Criativos → $0
│            - Partnership Ads → $0
│            Arquivo: server/routes/meta-marketing.routes.ts
│
└─ São dados de CONCORRENTES?
    └─ APIFY facebook-ads-library-scraper (on-demand)
```

#### API Nativa vs Apify

| Dado | Empresa CONECTADA | Concorrentes |
|------|-------------------|--------------|
| Contas de anúncio | ✅ Meta Marketing API - $0 | ❌ |
| Insights de ads | ✅ Meta Marketing API - $0 | ❌ |
| Campanhas/Criativos | ✅ Meta Marketing API - $0 | ❌ |
| Partnership Ads | ✅ Meta Marketing API - $0 | ❌ |
| Biblioteca de Ads | ❌ | Apify FB Ads Library |

> **Arquivo:** `server/routes/meta-marketing.routes.ts`

#### Endpoints que Usam API Nativa

| Endpoint | Método | Dados |
|----------|--------|-------|
| `/api/meta/auth/url` | GET | URL OAuth |
| `/api/auth/meta/callback` | GET | Callback OAuth |
| `/api/meta/sync` | POST | Sync contas + campanhas |
| `/api/meta/ad-accounts/:id/insights` | GET | Insights de ads |
| `/api/meta-marketing/partnership-request` | POST | Enviar partnership request |
| `/api/meta-marketing/partnership-ads` | GET | Listar partnership ads |
| `/api/meta-marketing/create-partnership-ad` | POST | Criar partnership ad |
| `/api/meta-marketing/partnership-performance` | GET | Performance metrics |

#### Atores Apify para Meta Ads

| Ator | ID | Custo/1k | Input | Output |
|------|----|----------|-------|--------|
| **Facebook Ads Scraper** | `apify/facebook-ads-scraper` | ~$2.00 | `@instagram` da empresa | Todos os anúncios ativos |
| FB Ads Library Scraper | `curious_coder/facebook-ads-library-scraper` | ~$0.75 | URL da biblioteca | Anúncios por busca |

**Como Buscar Anúncios de Concorrentes:**

```json
// Input para facebook-ads-scraper
{
  "username": "@nomeusuarioinstagram"  // Use o @ do Instagram da empresa
}
```

> **Dica:** O `facebook-ads-scraper` aceita o @ do Instagram da empresa como input e retorna TODOS os anúncios ativos no Facebook e Instagram.

> ⚠️ **IMPORTANTE:** Usar Meta API para dados próprios. Apify APENAS para análise competitiva.

---

### YouTube

| Ator | ID | Custo/1k | Uso |
|------|----|----------|-----|
| YouTube Scraper | `streamers/youtube-scraper` | ~$2.00 | Vídeos, canais, playlists |
| YouTube Shorts | `streamers/youtube-shorts-scraper` | ~$2.00 | Shorts específicos |

---

### Ferramentas para Empresas

Ferramentas exclusivas para empresas, sem alternativa de API nativa:

| Ferramenta | Actor Apify | Execução | Custo |
|------------|-------------|----------|-------|
| **Ahrefs SEO** | `radeance/ahrefs-scraper` | 1x no cadastro + on-demand | ~$5.00 PPR |
| **Website Scraper** | `apify/website-content-crawler` | 1x no cadastro + on-demand | CU-based |
| **E-commerce Scraper** | `apify/e-commerce-scraping-tool` | 1x no cadastro + on-demand | CU-based |

#### Política de Execução

**Execução AUTOMÁTICA (1x no cadastro):**
Quando empresa cadastra seu site/e-commerce:
1. Website Crawler → extrai conteúdo do site
2. Ahrefs Scraper → análise SEO inicial
3. E-commerce Scraper (se aplicável) → cataloga produtos

Os dados são **salvos no banco de dados** e ficam disponíveis para consulta.

**Execução ON-DEMAND (posterior):**
Empresa pode atualizar dados clicando em "Sincronizar".

#### Casos de Uso

**Ahrefs Scraper** (`radeance/ahrefs-scraper`):
- Análise de backlinks do site
- Pesquisa de keywords e ranking
- Análise de concorrentes
- Auditoria SEO
- **Salvar em:** `company_seo_data`

**Website Content Crawler** (`apify/website-content-crawler`):
- Extração de conteúdo do site
- Mapeamento de páginas e estrutura
- **Salvar em:** `company_website_data`

**E-commerce Scraping Tool** (`apify/e-commerce-scraping-tool`):
- Sincronização de catálogo de produtos
- Preços e descrições
- **Salvar em:** `company_products`

---

### Discovery & Leads

| Ator | ID | Custo/1k | Uso |
|------|----|----------|-----|
| Influencer Discovery | `apify/influencer-discovery-agent` | CU-based | Descoberta multi-plataforma |
| Google Search | `apify/google-search-scraper` | ~$2.50 | Resultados de busca |
| Google Maps Email | `lukaskrivka/google-maps-with-contact-details` | ~$3.00 | Leads B2B com contato |
| Google Maps Extractor | `compass/google-maps-extractor` | ~$2.50 | Dados de estabelecimentos |
| LinkedIn Profiles | `dev_fusion/Linkedin-Profile-Scraper` | ~$5.00 | Perfis sem cookies |

---

## Política de Chamadas

### ✅ Chamadas Automáticas PERMITIDAS

| Trigger | Ator | Custo Est. | Justificativa |
|---------|------|------------|---------------|
| Login de criador (>7 dias) | Profile Scraper | ~$0.002/perfil | Manter dados frescos |
| Webhook conclusão campanha | Profile Scraper | ~$0.002/perfil | Calcular ROI |
| Cadastro de empresa | Website/Ahrefs/E-commerce | ~$5-10 | Onboarding completo |

### ⛔ Chamadas ON-DEMAND (requer ação do usuário)

| Ação | Trigger | Ator |
|------|---------|------|
| Enriquecer perfil | Botão "Atualizar Perfil" | Profile/Post Scraper |
| Buscar criador | Botão "Buscar" | Profile Scraper |
| Analisar concorrentes | Botão "Analisar Ads" | FB Ads Library |
| Sync e-commerce | Botão "Sincronizar Loja" | E-commerce Tool |
| Discovery | Botão "Descobrir Criadores" | Instagram Scraper |

### ✅ Features de Custo ZERO (API Nativa)

| Feature | API | Limite |
|---------|-----|--------|
| Hashtag Tracking | Instagram Graph API | 30 hashtags/semana |
| Comments Management | Instagram Graph API | Ilimitado |
| Content Publishing | Meta Content Publishing API | 25/24h |
| Partnership Ads | Meta Marketing API | Ilimitado |
| DM Sync | Instagram Messaging API | 200/hora |
| Business Discovery | Facebook Graph API | Ilimitado |

### ❌ Chamadas PROIBIDAS

- Enriquecimento automático quando criador entra em comunidade
- Cron jobs internos (usar Apify Schedules se necessário)
- Webhooks que disparam scraping sem ação do usuário

---

## Custos e Orçamento

### Orçamento: $300/mês para ~100 usuários

### Estimativa com LOCAL FIRST + ON-DEMAND + API NATIVA

| Operação | Trigger | Volume/Mês | Custo/mês |
|----------|---------|------------|-----------|
| **API Nativa Instagram** | Automático | Ilimitado | **$0** |
| ↳ Hashtag Tracking | On-demand | ~100 buscas | $0 |
| ↳ Comments Management | Automático | ~500 comments | $0 |
| ↳ Content Publishing | On-demand | ~50 posts | $0 |
| ↳ Partnership Ads | On-demand | ~20 ads | $0 |
| ↳ DM Sync | Automático | ~1000 DMs | $0 |
| ↳ Business Discovery | Automático | ~200 lookups | $0 |
| Login refresh (>7 dias) | Automático | ~200 logins | ~$0.52 |
| Busca de novos criadores | On-demand | ~50 buscas | ~$13 |
| Atualização de perfil | On-demand | ~100 cliques | ~$26 |
| Discovery por hashtag (Apify) | On-demand | ~20 buscas | ~$5 |
| Análise de ads (concorrentes) | On-demand | ~30 análises | ~$2.25 |
| E-commerce sync | On-demand | ~10 lojas | ~$5 |
| Posts/Reels sob demanda | On-demand | ~80 requests | ~$21 |
| Cadastro empresas (website/SEO) | Automático | ~10 empresas | ~$50 |
| **Buffer de segurança** | - | - | ~$27 |
| **TOTAL** | | | **~$150/mês** |

### Economia com LOCAL FIRST + API Nativa

| Sem Local First | Com Local First + API Nativa | Economia |
|-----------------|------------------------------|----------|
| ~$500+/mês | ~$150/mês | **70%** |

**Por que funciona:**
- 70% das buscas encontram dados em `users` ou `instagram_profiles`
- Cache compartilhado: Empresa A busca criador → Empresa B usa grátis
- API nativa para criadores conectados: $0
- Hashtag tracking, comments, publishing: $0 via API nativa
- Business Discovery para perfis externos: $0

### Tabela de Custos por Ator

#### Instagram
| Ator | Custo/1k | Modelo | Prioridade |
|------|----------|--------|------------|
| **API Scraper** | **~$0.50** | CU | ⭐ 1º PREFERIDO |
| Post Scraper | ~$2.70 | PPR | ⭐ 2º |
| Profile Scraper | ~$2.60 | PPR | 3º |
| Reel Scraper | ~$2.60 | PPR | ⚠️ Moderação |
| Comment Scraper | ~$2.50 | PPR | On-demand |
| General Scraper | ~$2.50 | PPR | Discovery |

#### TikTok
| Ator | Custo | Modelo |
|------|-------|--------|
| TikTok Scraper | $0.03 + ~$3/1k | PPE |
| Free TikTok Scraper | CU-based | CU |

#### Meta Ads
| Ator | Custo/1k | Modelo | Input |
|------|----------|--------|-------|
| Facebook Ads Scraper | ~$2.00 | PPR | `@instagram` |
| FB Ads Library | ~$0.75 | PPR | URL biblioteca |

#### Outros
| Ator | Custo/1k | Modelo |
|------|----------|--------|
| YouTube Scraper | ~$2.00 | PPR |
| Google Maps | ~$3.00 | PPR |
| Ahrefs | ~$5.00 | PPR |
| E-commerce Tool | CU-based | CU |
| Website Crawler | CU-based | CU |

---

## Implementação Técnica

### Segurança

1. **NUNCA hardcode tokens** - Use `process.env.APIFY_API_KEY`
2. **Token já configurado** - Secret `APIFY_API_KEY` disponível
3. **resultsLimit conservador** - Quanto maior, maior o custo
4. **Validação Zod** - Todos os endpoints de publicação usam Zod schemas

### Caching

```javascript
const CACHE_DAYS = 7;

async function shouldFetch(lastUpdate: Date): boolean {
  const days = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
  return days >= CACHE_DAYS;
}
```

### Batch de Requisições

```javascript
const BATCH_SIZES = {
  profiles: 50,     // 50 perfis por chamada
  posts: 10,        // 10 URLs por chamada
  discovery: 5      // 5 hashtags por chamada
};
```

### Agendamento via Apify Schedules

> ⚠️ **NÃO usamos cron interno**. Todo agendamento via [Apify Schedules](https://console.apify.com/schedules).

**Por que Apify Schedules:**
- ✅ Controle de custos centralizado
- ✅ Fácil pausar/retomar sem deploy
- ✅ Logs e monitoramento integrados

### Webhooks

```typescript
// server/routes/webhooks.routes.ts
router.post('/apify/success', async (req, res) => {
  const { runId, datasetId } = req.body;
  const items = await apifyClient.dataset(datasetId).listItems();
  await processApifyResults(items);
  res.status(200).json({ received: true });
});
```

### Actor Registry

```typescript
async function getActorId(key: string): Promise<string> {
  const [actor] = await db
    .select()
    .from(dataSourceRegistry)
    .where(eq(dataSourceRegistry.key, key))
    .where(eq(dataSourceRegistry.isActive, true));
  
  if (!actor) throw new Error(`Actor not found: ${key}`);
  return actor.actorId;
}
```

### Checklist Antes de Chamar Apify

- [ ] Buscar em `users` - Criador já cadastrado?
- [ ] Buscar em `companies` - Empresa já cadastrada?
- [ ] Buscar em `instagram_profiles` - Já buscado?
- [ ] Buscar em `tiktok_profiles` - Já temos dados?
- [ ] Verificar idade dos dados - Menos de 7 dias?
- [ ] Criador tem access_token? - Usar API nativa!
- [ ] Business Discovery disponível? - Usar ($0)!

Se precisar chamar Apify:
- [ ] Agrupar em batch (50 perfis)
- [ ] Definir resultsLimit conservador (10-20)
- [ ] Log em `external_api_logs`
- [ ] Salvar em cache após sucesso

---

## Tipos de Input Aceitos

Esta seção lista todos os formatos de input aceitos pelos atores Apify.

### Instagram

| Tipo de Input | Exemplo | Atores Compatíveis |
|---------------|---------|-------------------|
| `@username` | `@nike` | API Scraper, Profile Scraper, Post Scraper |
| URL de perfil | `https://instagram.com/nike` | API Scraper, Profile Scraper, Post Scraper |
| URL de post | `https://instagram.com/p/ABC123` | API Scraper, Post Scraper |
| URL de reel | `https://instagram.com/reel/ABC123` | API Scraper, Reel Scraper |
| Hashtag | `#ugcbrasil` | General Scraper, API Scraper |
| Location ID | `212988663` (São Paulo) | General Scraper |

### TikTok

| Tipo de Input | Exemplo | Atores Compatíveis |
|---------------|---------|-------------------|
| `@username` | `@charlidamelio` | TikTok Scraper |
| URL de perfil | `https://tiktok.com/@username` | TikTok Scraper |
| URL de vídeo | `https://tiktok.com/@user/video/123` | TikTok Scraper |
| Hashtag | `#fyp` | TikTok Scraper |
| Música/Sound | URL do som | TikTok Scraper |

### Meta Ads

| Tipo de Input | Exemplo | Atores Compatíveis |
|---------------|---------|-------------------|
| `@instagram` da empresa | `@cocacola` | Facebook Ads Scraper |
| URL da Ads Library | `https://facebook.com/ads/library/?q=...` | FB Ads Library Scraper |
| Page ID | `123456789` | Facebook Ads Scraper |

### YouTube

| Tipo de Input | Exemplo | Atores Compatíveis |
|---------------|---------|-------------------|
| `@channel` | `@MrBeast` | YouTube Scraper |
| URL de vídeo | `https://youtube.com/watch?v=...` | YouTube Scraper |
| URL de playlist | `https://youtube.com/playlist?list=...` | YouTube Scraper |
| Termo de busca | `marketing digital` | YouTube Scraper |

---

## Referência Rápida de Serviços

### Arquivos de Serviço (server/services/)

| Arquivo | Função | API |
|---------|--------|-----|
| `instagram.ts` | OAuth, profile sync, token management | Instagram Graph API |
| `instagram-comments.ts` | Comment CRUD, AI sentiment analysis | Instagram Graph API + OpenAI |
| `instagram-hashtags.ts` | Hashtag search, 30/week limit | Instagram Graph API |
| `instagram-publishing.ts` | Publish image/carousel/reel/story | Meta Content Publishing API |
| `instagram-contacts.ts` | CRM Social: contacts, scoring, tags | Local DB |
| `instagram-profile-pic.ts` | Profile picture sync and caching | Instagram Graph API |
| `business-discovery.ts` | External profile lookup ($0) | Facebook Graph API |
| `apify.ts` | Actor management, cost tracking | Apify API |
| `apify-presets.ts` | Pre-configured workflows | Apify API |
| `enrichment.ts` | Website/e-commerce scraping | Apify API |
| `stripe.ts` | Payment processing | Stripe API |
| `cleanup.ts` | Data cleanup tasks | Local DB |

### Arquivos de Rotas (server/routes/)

| Arquivo | Prefixo | Endpoints |
|---------|---------|-----------|
| `instagram.routes.ts` | `/api/instagram/` | OAuth, sync, profile |
| `comments.routes.ts` | `/api/instagram/comments` | CRUD, sentiment |
| `hashtag.routes.ts` | `/api/instagram/hashtags` | Search, track, stats |
| `publishing.routes.ts` | `/api/instagram/publish` | Image, carousel, reel, story |
| `meta-marketing.routes.ts` | `/api/meta-marketing/` | Partnership Ads, campaigns |
| `messaging.routes.ts` | `/api/instagram/messages` | DM sync, send |
| `campaign.routes.ts` | `/api/campaigns/` | Campaign CRUD |
| `user.routes.ts` | `/api/users/` | Auth, profile |
| `blog.routes.ts` | `/api/blog/` | Blog posts |
| `apify.routes.ts` | `/api/apify/` | Scraping endpoints |
| `enrichment.routes.ts` | `/api/enrich/` | Profile enrichment |
| `stripe.routes.ts` | `/api/stripe/` | Payments |
