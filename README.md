# CreatorConnect (UGC HUB)

Plataforma de influencer marketing que conecta marcas a criadores de conteudo. Gerencia campanhas UGC, comunidades com gamificacao, pagamentos, integracoes com Instagram e TikTok, Brand Canvas com IA e muito mais.

## Requisitos

- **Node.js** >= 20
- **PostgreSQL** >= 15
- **npm** >= 10

## Setup Local

```bash
# 1. Clonar o repositorio
git clone <repo-url> && cd UGCHUB

# 2. Instalar dependencias
npm install

# 3. Configurar variaveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais (ver secao abaixo)

# 4. Criar/atualizar schema do banco
npm run db:push

# 5. Iniciar em modo desenvolvimento
npm run dev
```

O servidor estara disponivel em `http://localhost:5000`.

## Variaveis de Ambiente

| Variavel | Obrigatoria | Descricao |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | Connection string PostgreSQL |
| `SESSION_SECRET` | Sim | Secret para sessoes |
| `NODE_ENV` | Sim | `development` ou `production` |
| `GOOGLE_CLIENT_ID` | Nao | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Nao | Google OAuth |
| `STRIPE_SECRET_KEY` | Nao | Pagamentos Stripe |
| `SENDGRID_API_KEY` | Nao | Envio de emails |
| `META_APP_ID` | Nao | Instagram/Meta integration |
| `OPENAI_API_KEY` | Nao | IA (sentiment analysis) |
| `GOOGLE_GENAI_API_KEY` | Nao | Gemini IA (Brand Canvas) |

Veja a lista completa em [CLAUDE.md](./CLAUDE.md#environment-variables).

## Comandos

| Comando | Descricao |
|---------|-----------|
| `npm run dev` | Dev server full-stack (Express + Vite HMR, porta 5000) |
| `npm run dev:client` | Client-only (Vite, porta 5000) |
| `npm run build` | Build de producao (Vite + esbuild) |
| `npm run start` | Iniciar em producao |
| `npm run check` | TypeScript check (sem emitir) |
| `npm run db:push` | Push schema para o banco (Drizzle) |
| `npm run test` | Rodar testes (Vitest) |
| `npm run test:watch` | Testes em modo watch |

## Estrutura do Projeto

```
client/src/
  pages/          ~111 paginas (creator, company, admin, public, auth)
  components/     ~47 componentes custom + ui/ (shadcn)
  hooks/          6 hooks customizados
  lib/            queryClient, routes, utils, providers

server/
  routes.ts       Arquivo principal (~300 endpoints)
  routes/         15 modulos de rotas (~200 endpoints)
  services/       16 servicos de negocio
  jobs/           6 background jobs (cron)
  storage.ts      Data access layer (100+ metodos)
  auth.ts         Passport.js (local + Google OAuth)

shared/
  schema.ts       14 schemas, 91 tabelas, Zod validation, types
  constants.ts    Enums compartilhados
```

## Stack

| Camada | Tecnologias |
|--------|-------------|
| **Frontend** | React 19.2, Vite 7.1, TanStack Query 5, shadcn/ui, Tailwind CSS v4, Wouter |
| **Backend** | Express 4.21, Passport.js, node-cron, SendGrid, Stripe |
| **Banco** | PostgreSQL, Drizzle ORM 0.39 |
| **IA** | OpenAI, Google Gemini, Anthropic Claude |
| **Integracoes** | Instagram/Meta Graph API, TikTok API v2, Apify, Assinafy |
| **Infra** | Google Cloud SQL, Google Cloud Storage |

## Roles

- **Creator** — descobre oportunidades, participa de campanhas, Academy
- **Company** — gerencia creators, campanhas, Brand Hub, comunidades
- **Admin** — controle total, impersonation, feature flags

## Documentacao

- [CLAUDE.md](./CLAUDE.md) — Documentacao tecnica completa (arquitetura, patterns, endpoints, design decisions)
- [ROADMAP.md](./docs/ROADMAP.md) — Roadmap Q1 2026 com sprints semanais
- [CHANGELOG.md](./CHANGELOG.md) — Historico de mudancas

## Deploy

Build de producao:

```bash
npm run build    # Gera dist/public (frontend) e dist/index.js (backend)
npm run start    # Inicia em producao
```

Producao hospedada em Google Cloud (Cloud SQL + Cloud Storage). Deploy manual.
