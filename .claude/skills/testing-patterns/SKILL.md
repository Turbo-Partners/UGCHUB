---
name: testing-patterns
description: Como escrever testes com Vitest e Supertest, o que testar, estrutura de arquivos de teste. Use quando criar ou modificar testes.
user-invocable: false
allowed-tools: Read, Grep, Glob
---

# Padrões de Testes

## Stack

- **Vitest** — test runner (config em `vitest.config.ts`)
- **Supertest** — testes de API HTTP
- Testes ficam em `server/__tests__/*.test.ts`

## Comandos

```bash
npm run test           # Rodar todos os testes (vitest run)
npm run test:watch     # Watch mode (vitest)
```

## Configuração

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: "node",
    globals: true,                              // describe, it, expect globais
    root: ".",
    include: ["server/__tests__/**/*.test.ts"],
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@": path.resolve(import.meta.dirname, "client", "src"),
    },
  },
});
```

## Estrutura de Teste

```typescript
// server/__tests__/campaigns.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express from "express";

describe("Campaigns API", () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    // Setup de rotas para teste
  });

  describe("GET /api/campaigns", () => {
    it("deve retornar lista de campanhas", async () => {
      const res = await request(app)
        .get("/api/campaigns")
        .expect(200);

      expect(res.body).toBeInstanceOf(Array);
    });

    it("deve retornar 401 se não autenticado", async () => {
      await request(app)
        .get("/api/campaigns")
        .expect(401);
    });
  });

  describe("POST /api/campaigns", () => {
    it("deve criar campanha com dados válidos", async () => {
      const res = await request(app)
        .post("/api/campaigns")
        .send({
          title: "Campanha Teste",
          budget: "1000.00",
          status: "draft",
        })
        .expect(201);

      expect(res.body).toHaveProperty("id");
      expect(res.body.title).toBe("Campanha Teste");
    });

    it("deve retornar 400 com dados inválidos", async () => {
      await request(app)
        .post("/api/campaigns")
        .send({ title: "" })  // título vazio
        .expect(400);
    });
  });
});
```

## Mocking

```typescript
import { vi } from "vitest";

// Mock de módulo inteiro
vi.mock("../storage", () => ({
  storage: {
    getCampaign: vi.fn(),
    createCampaign: vi.fn(),
  },
}));

// Mock de função específica
const mockGetCampaign = vi.fn().mockResolvedValue({
  id: 1,
  title: "Test Campaign",
});

// Mock de serviço externo
vi.mock("../services/apify", () => ({
  fetchProfile: vi.fn().mockResolvedValue({ followers: 10000 }),
}));

// Resetar mocks entre testes
beforeEach(() => {
  vi.clearAllMocks();
});
```

## Setup e Helpers (server/__tests__/setup.ts)

O projeto tem helpers prontos para testes:

```typescript
import { createMockUser, withAuth, withNoAuth } from "./setup";

// Criar usuário mock com overrides
const user = createMockUser({ name: "João", role: "creator" });
// → { id: 1, email: "test@test.com", name: "João", role: "creator" }

// Simular autenticação (inclui session com activeCompanyId)
const app = express();
app.use(express.json());
withAuth(app, user);
// → req.isAuthenticated() = true
// → req.user = user
// → req.session = { activeCompanyId: 1, save: cb => cb(), ... }

// Simular sem autenticação
withNoAuth(app);
// → req.isAuthenticated() = false
// → req.user = null
```

## O que Testar

### Obrigatório
- **Auth**: login, registro, logout, proteção de rotas
- **CRUD de campanhas**: criar, listar, atualizar, deletar
- **Candidaturas**: aplicar, aprovar, rejeitar, status flow
- **Validação Zod**: dados válidos aceitos, inválidos rejeitados

### Recomendado
- **Multi-tenant**: dados de uma empresa não vazam para outra
- **Permissões**: creator não acessa rotas de company e vice-versa
- **Edge cases**: IDs inexistentes, duplicatas, limites de campo

### Não Testar
- Componentes UI (sem testes de frontend por enquanto)
- Código de terceiros (shadcn, Drizzle, etc.)
- Endpoints de webhooks externos (Instagram, Stripe)

## Convenções

1. **Nome do arquivo**: `<domínio>.test.ts` (ex: `auth.test.ts`, `campaigns.test.ts`)
2. **describe aninhado**: por endpoint (`GET /api/x`, `POST /api/x`)
3. **it em português**: `it("deve retornar...", ...)` ou `it("should return...", ...)`
4. **Isolamento**: cada teste deve funcionar independente dos outros
5. **Cleanup**: resetar mocks no `beforeEach`
6. **Assertions claras**: verificar status code + body
