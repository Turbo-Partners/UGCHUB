# Code Reviewer Memory

## Project Context
- Full-stack TypeScript app (React + Vite frontend, Express backend, PostgreSQL)
- Schema centralizado em `shared/schema.ts` (~3900 linhas)
- Path aliases: `@/*` → `client/src/*`, `@shared/*` → `shared/*`
- Zod validation obrigatória em rotas POST/PUT
- Session-based auth (Passport.js), roles: creator/company/admin

## Common Issues Found

### Validation Patterns
- PUT /api/companies/:id não valida structuredBriefing com Zod (permite qualquer object)
- Falta validação de limites de caracteres em campos de texto
- Arrays não são validados quanto ao tamanho máximo

### Security Patterns
- Rotas de company requerem `req.user.role === 'company'`
- Verificação de ownership via `storage.isCompanyAdmin()` ou `activeCompanyId`
- AI prompts não sanitizam inputs do usuário

### Performance Patterns
- Jobs de enriquecimento usam delays para rate limiting (ReceitaWS: 3s, Apify: 3s)
- Batch enrichment limitado a 20 companies por execução
- Queries podem ser otimizadas com select específico ao invés de select()

### AI Integration Patterns
- Gemini Flash usado para generation (descrições, briefings)
- Respostas sempre limpas com `.replace(/```json?\n?/g, "")` antes de JSON.parse()
- Brand Canvas V2 tem timeouts por step (30s) + timeout total (3min) em `brand-canvas.ts`
- OpenRouter é o cliente principal (singleton `_openRouterClient`); Gemini e Anthropic são fallbacks diretos
- Fallback Anthropic (stepVoice/stepSynthesis) cria `new Anthropic()` a cada chamada — deveria ser singleton
- `Promise.race` para timeout não cancela a promise original (custo AI acumulado em background)

### Brand Canvas V2 Bugs Conhecidos (brand-canvas.ts)
- `mergeCanvasData`: 7 campos duplicados entre lista flat e deep-merges aninhados (doList, dontList, avoidTopics, callToAction, idealContentTypes, hooks, keyMessages)
- `mergeCanvasData`: campo `references` (BrandCanvasReference) completamente ausente — nunca mergeado
- `calculateCanvasCompletionScoreV2`: comentário diz "20 fields" mas são 24 checks; `references.competitors` e `references.referenceBrands` nunca são preenchidos via pipeline
- `skippedOrFailed` (linha 1115): variável dead code, nunca usada após declaração
- `stepVisual` linha 502: usa `company.brandColors` (não-refreshed) em vez de `refreshed.brandColors`
- `stepSocial`/`stepVoice`: dynamic import de `@shared/schema` e `drizzle-orm` dentro de funções — desnecessário, já importados estáticamente no topo

## Architecture Decisions
- `scoreCreatorForCampaign()` usa scoring ponderado: niche (30), location (15), social (25), completeness (10)
- Structured briefing é opcional, com fallback para text briefing
- Re-enrichment automático roda semanalmente (Sundays 3 AM BRT)
