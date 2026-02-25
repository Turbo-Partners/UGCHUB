# Changelog

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.4.0] - 2026-02-25

### Adicionado

- `server/lib/image-storage.ts`: modulo de storage para thumbnails de posts (download + persist no GCS)
- `client/src/components/instagram-verified-badge.tsx`: badge de verificacao Instagram reutilizavel
- Documentacao: README.md, product-strategy.md, competitor-analysis.md, ROADMAP v3.0

### Corrigido

- Fix enrichment onboarding flow: backend preenche campos basicos (bio, pic), frontend faz polling ate completar
- Pipeline de profile pics melhorado: hierarquia GCS → Instagram API → Apify → avatar
- Melhorias no perfil do creator: contraste visual, bio real do Instagram, thumbnails de posts

### Alterado

- CLAUDE.md: numeros corrigidos (89 Zod schemas, 202 types, ~61 componentes, pages breakdown)
- MEMORY.md: reescrito sem duplicacao com CLAUDE.md, foco em licoes aprendidas
- CHANGELOG.md: adicionado v1.4.0

## [1.3.0] - 2026-02-16

### Adicionado

- **Brand Canvas V2**: rebuild completo com pipeline IA (Gemini + Claude), visual identity, voice, content strategy
- 9 endpoints Brand Canvas em `server/routes/brand-canvas.routes.ts`
- Service dedicado `server/services/brand-canvas.ts` com pipeline de 6 steps
- Job de refresh mensal `server/jobs/brandCanvasRefreshJob.ts`
- 12 componentes frontend para Brand Canvas em `client/src/components/brand-canvas/`
- 25 testes automatizados para Brand Canvas (`brand-canvas.test.ts`)

### Alterado

- `BrandCanvas` agora usa modelo V2 (aliased para backward compat)

## [1.2.0] - 2026-02-16

### Corrigido

- 233 erros TypeScript corrigidos (build limpo)
- Migracão de `server/replit_integrations/` para `server/lib/`

### Adicionado

- 8 tipos frontend-only no schema: `BrandMention`, `UgcAsset`, `EcommerceIntegration`, etc.

### Removido

- Pasta `server/replit_integrations/` (legacy Replit)
- Dependencias mortas: `memorystore`, `tailwindcss-animate`, `@replit/*` plugins

## [1.1.2] - 2026-02-14

### Alterado

- Refatoracao do company-profile em componentes modulares
- `CLAUDE.md` reescrito do zero com numeros corrigidos e estrutura completa

## [1.1.1] - 2026-02-11

### Removido

- 3 arquivos duplicados em `attached_assets/` (cristal_graffiti_logo, Icone_Turbo_Branca, novo-logo-loja-integrada)
- 2 arquivos sem referência em `attached_assets/` (Icone_Turbo_Preta, Logo_14)
- 2 backups SQL na raiz (`backup.sql`, `backup_28nov_antes.sql`) — migrações gerenciadas pelo Drizzle
- 8 uploads órfãos de desenvolvimento/teste em `uploads/`
- Pasta `MigrationUGCHUB/` (migração histórica já concluída)

### Alterado

- `.gitignore` atualizado com `uploads/` e `*.sql` para prevenir acúmulo futuro

## [1.1.0] - 2026-02-10

### Adicionado

- **Instagram Hashtag Tracking**: busca de hashtags via Graph API, posts top/recentes, associação a campanhas, controle de limite 30/semana, grid de posts, estatísticas (3 tabelas: `hashtag_searches`, `campaign_hashtags`, `hashtag_posts`)
- **Instagram Comments Management**: listar/responder/ocultar/excluir comentários, análise de sentimento com IA (OpenAI), filtros e badges de sentimento
- **Content Publishing via Meta API**: publicar imagens, carrosséis (2-10 itens), Reels e Stories, composer com preview, tracking de cota (25 pub/24h)
- **Partnership Ads**: solicitação de partnership, verificação de permissões, gestão de criadores parceiros, criação de anúncios, métricas de performance, OAuth one-click, convites por link
- **CRM Social (Instagram Contacts)**: registro de contatos por empresa, métricas de interação, tags e scoring, histórico, auto-populado por DM sync e comments
- **DM Sync melhorado**: progresso via WebSocket, cleanup de erros
- **Documentação**: `docs/ROADMAP.md` com 18 blocos de features e prioridades Q1 2026, `docs/DATA_EXTRACTION_GUIDE.md`

## [1.0.0] - 2026-02-10

### Adicionado

- Commit inicial do UGC HUB Creator Connect
- Setup do projeto com Vite, React 19, TypeScript e Tailwind CSS 4
- Backend com Express e Drizzle ORM (PostgreSQL)
- Sistema de autenticação com Passport (local + Google OAuth)
- Integração com Stripe para pagamentos
- Integração com SendGrid para envio de emails
- Integração com Google Cloud Storage para upload de arquivos
- Integração com IA (OpenAI, Anthropic, Google GenAI)
- Componentes UI com Radix UI e shadcn/ui
- Sistema de drag-and-drop com dnd-kit
- Gráficos e dashboards com Recharts
- Agendamento de tarefas com node-cron
- Geração de PDFs com PDFKit
- WebSocket para comunicação em tempo real
- Testes com Vitest e Supertest
- Assets e recursos visuais do projeto
