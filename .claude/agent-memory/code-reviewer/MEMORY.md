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
- Sem timeout nas chamadas AI (pode travar se API demorar)
- Erros de parsing não retornam mensagem útil ao usuário

## Architecture Decisions
- `scoreCreatorForCampaign()` usa scoring ponderado: niche (30), location (15), social (25), completeness (10)
- Structured briefing é opcional, com fallback para text briefing
- Re-enrichment automático roda semanalmente (Sundays 3 AM BRT)
