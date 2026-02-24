# Bug Fixer Memory - UGC HUB

## Padrões de Bugs Recorrentes (2026-02-16)

### 1. Schema Field Mismatches
- `instagramProfiles.ownerType`: enum é `["user", "company", "external"]`, NÃO `"creator"`
- `instagramProfiles.source`: enum é `["oauth", "apify", "manual", "api"]`, NÃO `"business_discovery"`
- `brandTierConfigs`: campo é `tierName`, NÃO `name`
- `brandCreatorMemberships`: campo é `pointsCache`, NÃO `points`
- `pointsLedger`: campo é `eventType`, NÃO `reason`
- `tiktokProfiles`: campos são `hearts`/`videoCount`/`lastFetchedAt`, NÃO `likes`/`videos`/`lastUpdated`
- `deliverables`: NÃO tem `status`, `reviewedAt`, `feedback`
- `communityInvites`: `name`/`customMessage` estão em `metadata` (jsonb)

### 2. Session vs User Properties
- `companyId` NÃO existe em `User` — usar `(req.session as any).activeCompanyId`
- `req.user.activeCompanyId` NÃO existe

### 3. Storage Methods Missing/Renamed
- `getUserAverageRating`, `getMonthlyLeaderboard`, `getRewardEvents`, `closeCampaignRanking`: NÃO existem
- `getCampaignLeaderboard` → `getCampaignLeaderboardV1`
- `getUnreadMessageCount` → `getUnreadCount`
- `getCompanyConversations`: requer 2 parâmetros `(companyId, brandId)`

### 4. Type Annotations
- Callbacks `.map()`, `.reduce()` precisam de tipos: `(entry: any, index: number) => ...`

### 5. Drizzle ORM
- `onConflictDoNothing()` com unique index composto pode dar erro — usar `try/catch` no insert

## Frontend-only Types Pattern

**Location**: End of `shared/schema.ts` (after line ~3420)

**Pattern**: Frontend usa tipos TypeScript que NÃO correspondem a tabelas do banco.

**Added types** (2026-02-16):
- `BrandMention` — API responses para social listening
- `UgcAsset` — Content library com `usageRights?`
- `UsageRights` — Direitos de uso (ads/organic/whitelist)
- `AssetComment` — Comentários em assets (`body?` além de `content`)
- `MonthlyLeaderboard` — Rankings mensais
- `Competition` — Competições de campanhas
- `EcommerceIntegration` — Integrações e-commerce (`shopUrl?`, `webhookSecret?`)
- `BrandScoringDefaults` — Defaults de pontuação (`rulesJson?`, `capsJson?`)

**Key learnings**:
- Propriedades opcionais (`?`) são comuns para dados que vêm de diferentes fontes API
- Alguns tipos têm propriedades duplicadas (`content` + `body?`) para compatibilidade
- Backend pode retornar dados que não correspondem exatamente ao schema do banco
