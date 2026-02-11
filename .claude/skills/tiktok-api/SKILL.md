---
name: tiktok-api
description: Integração TikTok, endpoints, OAuth, limitações de webhooks, estratégia de polling e uso do Apify. Use quando trabalhar com dados do TikTok.
user-invocable: false
allowed-tools: Read, Grep, Glob
---

# TikTok API Integration

## Arquivos Principais

| Arquivo | Responsabilidade |
|---------|-----------------|
| `server/apify-service.ts` | TikTok metrics e hashtags via Apify |
| `server/services/apify.ts` | Profile/post scraping com cache |

## Estratégia Atual: Apify (Scraping)

O TikTok ainda não tem OAuth implementado. Dados são coletados via Apify actors:

```typescript
// server/apify-service.ts
// - Buscar métricas de perfil TikTok (followers, likes, vídeos)
// - Buscar hashtags TikTok
// - Custo por chamada Apify — usar com moderação

// server/services/apify.ts
// - Scraping de perfil e posts com CACHE
// - Evitar chamadas duplicadas
// - Ambos os arquivos são necessários (não duplicar)
```

## Dois Arquivos Apify (IMPORTANTE)

| Arquivo | Foco | Cache |
|---------|------|-------|
| `server/apify-service.ts` | TikTok metrics + hashtags | Não |
| `server/services/apify.ts` | Profile/post scraping geral | Sim |

**Ambos são necessários.** Não consolidar em um só.

## Hierarquia de Dados TikTok

```
1. Banco local (cache de dados já coletados)
2. Apify (scraping pago) — com cache para evitar re-chamadas
```

## TikTok API Oficial (Futuro — S09/S10)

Quando implementar OAuth TikTok:

### OAuth Flow (Login Kit)

```
1. Frontend: botão "Conectar TikTok" → redireciona para TikTok Auth
2. TikTok retorna code → backend troca por access_token
3. Salvar token + open_id do usuário
4. Tokens expiram em 24h — refresh_token dura 365 dias
```

### Endpoints Planejados

```
GET  /api/tiktok/auth/url              → URL de autorização
GET  /api/tiktok/auth/callback         → Callback OAuth
GET  /api/tiktok/profile/:username     → Dados do perfil
GET  /api/tiktok/videos/:userId        → Vídeos recentes
POST /api/tiktok/disconnect            → Desconectar conta
```

### Limitações do TikTok vs Instagram

| Feature | Instagram | TikTok |
|---------|-----------|--------|
| Webhooks | Sim (menções, DMs, comments) | Não disponível |
| Business Discovery | Sim (dados públicos grátis) | Não existe equivalente |
| DMs via API | Sim | Não disponível |
| Publishing | Sim | Limitado (Content Posting API) |
| Métricas | Via API oficial | Limitado, suplementar com Apify |

### Estratégia de Polling

Como TikTok não tem webhooks, usar polling via cron jobs:

```typescript
// Cron: a cada 15 minutos para contas ativas
// 1. Buscar métricas atualizadas (followers, likes)
// 2. Buscar novos vídeos postados
// 3. Atualizar tabela tiktok_accounts
// 4. Rate limit: respeitar 100 requests/minuto
```

## Tabelas Planejadas

```typescript
// shared/schema.ts — a criar em S09
export const tiktokAccounts = socialSchema.table("tiktok_accounts", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").references(() => users.id),
  openId: varchar("open_id", { length: 255 }),
  username: varchar("username", { length: 255 }),
  displayName: varchar("display_name", { length: 255 }),
  followerCount: integer("follower_count"),
  likeCount: integer("like_count"),
  videoCount: integer("video_count"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

## Actors Apify para TikTok

```typescript
// Dois actors disponíveis:
TIKTOK_SCRAPER: 'clockworks/tiktok-scraper'      // Full-featured
TIKTOK_FREE: 'clockworks/free-tiktok-scraper'     // Budget option
```

## Dados Retornados pelo Apify

```typescript
// Perfil:
{ uniqueId, nickname, avatarLarger, signature, verified,
  followers, following, hearts, videoCount }

// Vídeo:
{ id, desc, createTime, video: { cover, playAddr, duration },
  stats: { diggCount, shareCount, commentCount, playCount },
  author, music: { title, authorName }, hashtags: [{ name }] }
```

## Persistência (Upsert)

```typescript
// Vídeos e perfis usam onConflictDoUpdate para idempotência
db.insert(tiktokVideos).values(data)
  .onConflictDoUpdate({ target: tiktokVideos.videoId, set: { ...data, updatedAt: new Date() } })
```

## Otimização de Custos Apify

1. **Cache agressivo** — CACHE_DAYS=7, não re-buscar perfis recentes
2. **Batch requests** — BATCH_SIZE=50 perfis por execução, 3s delay entre batches
3. **Dry-run mode** — estimar custos antes de executar
4. **Priorizar API oficial** quando disponível
5. **Fallback gradual**: API oficial → Apify cached → Apify fresh

### Custos estimados (por 1k itens):
- API Scraper: $0.50
- Profile Scraper: $2.60
- Post Scraper: $2.70
