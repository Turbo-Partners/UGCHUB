---
name: instagram-api
description: Endpoints do Instagram Graph API, OAuth, webhooks, rate limits e tratamento de erros transientes. Use quando trabalhar com integração Instagram.
user-invocable: false
allowed-tools: Read, Grep, Glob
---

# Instagram API Integration

## Arquivos Principais

| Arquivo | Responsabilidade |
|---------|-----------------|
| `server/routes/instagram.ts` | Rotas da API Instagram |
| `server/services/apify.ts` | Scraping de perfil/posts via Apify (fallback pago) |
| `server/services/instagram-profile-pic.ts` | Download e storage de fotos de perfil |
| `server/services/enrichment.ts` | Pipeline de enriquecimento de dados |
| `server/routes/meta-marketing.ts` | Partnership Ads e Meta Ads |

## Hierarquia de Dados (LOCAL FIRST)

**Regra fundamental: minimizar custos com APIs pagas.**

```
1. Banco local (PostgreSQL) — sempre consultar primeiro
2. Meta Graph API gratuita (Business Discovery) — dados públicos
3. Apify (scraping pago) — último recurso, com cache
```

## OAuth Flow

```
1. Frontend: botão "Conectar Instagram" → redireciona para Meta OAuth
2. Meta retorna code → backend troca por access_token
3. Backend salva token + instagram_business_account_id
4. Tokens são refreshed automaticamente antes de expirar
```

### Endpoints OAuth

```
GET  /api/instagram/auth/url          → URL de autorização Meta
GET  /api/instagram/auth/callback     → Callback OAuth (troca code por token)
POST /api/instagram/disconnect        → Desconectar conta
```

## Business Discovery API (Grátis)

Buscar dados públicos de qualquer perfil business:

```typescript
// Endpoint: GET graph.facebook.com/v21.0/{ig-user-id}
// ?fields=business_discovery.fields(username,name,biography,followers_count,...)
// &business_discovery.username={target_username}

// Rate limit: 200 calls/hour per user
```

## Webhooks Instagram

Receber eventos em tempo real:

```
POST /api/instagram/webhook           → Receber eventos
GET  /api/instagram/webhook           → Verificação (challenge)
```

### Tipos de Evento

| Evento | Campo | Descrição |
|--------|-------|-----------|
| `mentions` | `field: "mentions"` | Quando alguém menciona @marca |
| `comments` | `field: "comments"` | Novo comentário em post |
| `messages` | `field: "messages"` | Nova DM recebida |

### Verificação de Webhook

```typescript
// GET /webhook?hub.mode=subscribe&hub.verify_token=TOKEN&hub.challenge=CHALLENGE
if (req.query["hub.verify_token"] === process.env.META_WEBHOOK_VERIFY_TOKEN) {
  return res.send(req.query["hub.challenge"]);
}
```

## DMs (Direct Messages)

```
GET  /api/instagram/conversations     → Listar conversas
GET  /api/instagram/messages/:id      → Mensagens de uma conversa
POST /api/instagram/messages/send     → Enviar DM
```

**Rate limit**: 200 DMs/hora por conta.

## Publishing (Publicação)

```
POST /api/instagram/publish/image     → Publicar imagem
POST /api/instagram/publish/carousel  → Publicar carrossel (2-10 itens)
POST /api/instagram/publish/reel      → Publicar Reel
POST /api/instagram/publish/story     → Publicar Story
```

**Cota**: 25 publicações por 24h.

## Hashtag Tracking

```
POST /api/instagram/hashtags/search   → Buscar hashtag
GET  /api/instagram/hashtags/:id/posts → Posts da hashtag
POST /api/instagram/campaigns/:id/hashtags → Vincular hashtag a campanha
```

**Limite**: 30 hashtags únicas por semana por conta.

## Fotos de Perfil

**Regra: NUNCA salvar URLs de CDN do Instagram diretamente. Sempre baixar e salvar no Object Storage.**

```typescript
// server/services/instagram-profile-pic.ts
// 1. Baixar imagem da URL do Instagram
// 2. Upload para GCS (Google Cloud Storage)
// 3. Salvar URL permanente: /api/storage/public/{filename}
```

## Rate Limits

| Recurso | Limite |
|---------|--------|
| Business Discovery | 200 calls/hora por token |
| DMs (envio) | 200/hora por conta |
| Publishing | 25/24h por conta |
| Hashtags | 30 únicas/semana |
| Comments (leitura) | 200 calls/hora |
| Webhooks | Sem limite (push) |

## fetchWithRetry (Padrão de Retry)

Implementado em `server/routes/instagram.routes.ts`:

```typescript
// Configuração:
// - maxRetries: 5 (6 tentativas total)
// - initialDelayMs: 5000 (5 segundos)
// - Backoff exponencial: delay * 2^attempt
// - Max delay cap: 60000 (1 minuto)

// Sequência de backoff:
// Tentativa 1: 5s → 2: 10s → 3: 20s → 4: 40s → 5: 60s → 6: 60s

// Detecção de erros:
// HTTP 429 → Rate limit → esperar 60s
// Meta code 4 ou 17 → Rate limit → esperar 60s
// Meta code 2 ou is_transient=true → Erro transiente → backoff exponencial
// Meta code 190 → Token expirado → retornar 401
// Meta code 33 (subcode) → Insights de post de terceiro → ignorar silenciosamente
```

## Token Lifecycle

```
1. authorization_code → Token curto (1 hora)
   POST https://api.instagram.com/oauth/access_token

2. ig_exchange_token → Token longo (~60 dias)
   GET https://graph.instagram.com/v21.0/access_token

3. ig_refresh_token → Renovar antes de expirar (~60 dias)
   GET https://graph.instagram.com/v21.0/refresh_access_token
```

**Token Validation Cache**: tokens validados são cacheados em memória (5 min para válido, 1 min para inválido) para evitar chamadas desnecessárias.

## Verificação de Webhook (Assinatura)

```typescript
// Header: x-hub-signature-256 = sha256={hexdigest}
// IMPORTANTE: usar req.rawBody (antes do JSON.parse)
// IMPORTANTE: crypto.timingSafeEqual para prevenir timing attacks
// Tenta verificar com INSTAGRAM_APP_SECRET e META_APP_SECRET
```

## Partnership Ads

```
POST /api/meta-marketing/partnership/request    → Solicitar partnership
GET  /api/meta-marketing/partnership/status      → Status da solicitação
POST /api/meta-marketing/ads/create              → Criar anúncio
GET  /api/meta-marketing/ads/metrics             → Métricas do anúncio
```
