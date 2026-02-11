---
name: project-structure
description: Estrutura de pastas do projeto, convenções de nomenclatura e onde colocar cada tipo de arquivo. Use quando criar novos arquivos ou precisar entender a organização do codebase.
user-invocable: false
allowed-tools: Read, Grep, Glob
---

# Estrutura do Projeto CreatorConnect

## Layout de Pastas

```
/
├── client/src/              # Frontend React
│   ├── pages/               # Páginas (1 arquivo por rota, subpastas por role)
│   │   ├── auth/            # Páginas de autenticação
│   │   ├── company/         # Dashboard empresa (~40 arquivos)
│   │   ├── creator/         # Dashboard creator (~24 arquivos)
│   │   └── public/          # Páginas públicas
│   ├── components/          # Componentes reutilizáveis (root = features)
│   │   ├── ui/              # shadcn/ui primitivos (~72 componentes)
│   │   ├── gamification/    # Componentes de gamificação
│   │   ├── instagram/       # Componentes Instagram
│   │   └── landing/         # Componentes da landing page
│   ├── hooks/               # Custom hooks React
│   ├── lib/                 # Utilitários e configuração
│   │   ├── queryClient.ts   # TanStack Query config + apiRequest()
│   │   ├── provider.tsx     # MarketplaceProvider (estado global)
│   │   ├── routes.ts        # Definição de rotas Wouter
│   │   ├── brand-context.tsx # Context de marca selecionada
│   │   ├── utils.ts         # cn() e helpers gerais
│   │   └── nav-config.ts    # Configuração de navegação
│   └── App.tsx              # Root component
├── server/                  # Backend Express
│   ├── routes.ts            # Rotas principais consolidadas
│   ├── routes/              # Rotas modulares por domínio
│   │   ├── instagram.routes.ts
│   │   ├── messaging.routes.ts
│   │   ├── stripe.routes.ts
│   │   ├── campaign.routes.ts
│   │   ├── hashtag.routes.ts
│   │   ├── comments.routes.ts
│   │   ├── publishing.routes.ts
│   │   └── meta-marketing.routes.ts
│   ├── services/            # Lógica de negócio
│   │   ├── enrichment.ts
│   │   ├── apify.ts
│   │   ├── instagram-profile-pic.ts
│   │   └── stripe.ts
│   ├── jobs/                # Background jobs (cron)
│   ├── __tests__/           # Testes (Vitest + Supertest)
│   ├── auth.ts              # Passport.js + sessões
│   ├── storage.ts           # Camada de acesso a dados (Drizzle)
│   ├── db.ts                # Conexão com PostgreSQL
│   ├── email.ts             # Templates e envio SendGrid
│   ├── websocket.ts         # WebSocket server
│   ├── objectStorage.ts     # Google Cloud Storage
│   └── apify-service.ts     # TikTok via Apify
├── shared/                  # Compartilhado frontend + backend
│   ├── schema.ts            # FONTE ÚNICA de verdade: tabelas, Zod, types
│   └── constants.ts         # Enums: niches, platforms, estados BR
├── migrations/              # Drizzle ORM migrations
└── docs/                    # Documentação
```

## Convenções de Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| **Páginas** | kebab-case.tsx | `creator-dashboard.tsx`, `campaign-details.tsx` |
| **Componentes feature** | kebab-case.tsx ou PascalCase.tsx | `campaign-hashtag-tracking.tsx`, `Chat.tsx` |
| **Componentes UI** | kebab-case.tsx | `button.tsx`, `data-table.tsx` |
| **Hooks** | use-kebab-case.ts | `use-auth.ts`, `use-toast.ts` |
| **Rotas backend** | {feature}.routes.ts | `instagram.routes.ts`, `meta-marketing.routes.ts` |
| **Services** | kebab-case.ts | `enrichment.ts`, `instagram-profile-pic.ts` |
| **Jobs** | {name}Job.ts | `metricsProcessor.ts`, `weeklyEmailJob.ts` |
| **Testes** | nome.test.ts | `auth.test.ts`, `campaigns.test.ts` |

## Path Aliases (tsconfig + vite)

```typescript
import { Button } from "@/components/ui/button";     // → client/src/components/ui/button
import { users } from "@shared/schema";               // → shared/schema
import logo from "@assets/logo.png";                   // → attached_assets/logo.png
```

## Onde Colocar Cada Tipo de Arquivo

| O que você está criando | Onde colocar |
|-------------------------|-------------|
| Nova página/rota | `client/src/pages/` + registrar em `client/src/lib/routes.ts` |
| Componente reutilizável | `client/src/components/` (subpasta por domínio se necessário) |
| Componente UI primitivo | `npx shadcn@latest add <component>` → `client/src/components/ui/` |
| Custom hook | `client/src/hooks/` |
| Nova tabela DB | `shared/schema.ts` (dentro do pgSchema correto) |
| Novo endpoint API | `server/routes.ts` (ou novo arquivo em `server/routes/` se for domínio grande) |
| Lógica de negócio | `server/services/` |
| Background job | `server/jobs/` |
| Teste | `server/__tests__/` |
| Constantes/enums | `shared/constants.ts` |

## Regras Importantes

1. **shared/schema.ts é a fonte única** — tipos, tabelas e validações Zod. Nunca duplicar tipos em outro lugar.
2. **storage.ts é o data access layer** — nunca fazer queries Drizzle diretamente nas rotas. Adicionar métodos em storage.ts.
3. **Não criar arquivos de barrel** (index.ts) — importar diretamente do arquivo.
4. **Componentes UI via shadcn** — não criar componentes UI do zero se o shadcn já tem.
