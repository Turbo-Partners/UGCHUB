---
name: api-patterns
description: Estrutura de endpoints REST, validação com Zod, autenticação, middleware e tratamento de erros. Use quando criar ou modificar endpoints da API.
user-invocable: false
allowed-tools: Read, Grep, Glob
---

# Padrões de API

## Estrutura de Rotas

Rotas ficam em dois lugares:
- `server/routes.ts` — rotas principais consolidadas (campanhas, users, comunidades, etc.)
- `server/routes/*.ts` — módulos separados para domínios grandes (instagram, messaging, stripe, meta-marketing)

### Registrar Rotas

```typescript
// server/routes.ts
import { type Express } from "express";
import { createServer } from "http";

export async function registerRoutes(app: Express) {
  // Rotas inline
  app.get("/api/campaigns", async (req, res) => { ... });

  // Ou importar módulos
  const instagramRouter = await import("./routes/instagram");
  app.use("/api/instagram", instagramRouter.default);

  const httpServer = createServer(app);
  return httpServer;
}
```

### Rota Modular

```typescript
// server/routes/meu-dominio.ts
import { Router } from "express";
const router = Router();

router.get("/endpoint", async (req, res) => { ... });
router.post("/endpoint", async (req, res) => { ... });

export default router;
```

## Padrão de Endpoint Completo

```typescript
app.post("/api/campaigns", async (req, res) => {
  // 1. Autenticação + Autorização
  if (!req.isAuthenticated() || req.user!.role !== "company") {
    return res.sendStatus(403);
  }

  // 2. Multi-tenant: pegar companyId da sessão
  const activeCompanyId = req.session.activeCompanyId;
  if (!activeCompanyId) {
    return res.status(400).json({ error: "Nenhuma loja ativa selecionada" });
  }

  try {
    // 3. Validação com Zod (usando .parse, que lança ZodError)
    const data = insertCampaignSchema.parse({
      ...req.body,
      companyId: activeCompanyId,  // Injetar da sessão
    });

    // 4. Lógica via storage layer
    const campaign = await storage.createCampaign(data);
    res.status(201).json(campaign);

    // 5. Side effects assíncronos (não bloqueiam response)
    setImmediate(async () => {
      try {
        // Notificações, emails, etc.
      } catch (error) {
        console.error("[Notifications] Error:", error);
      }
    });
  } catch (error) {
    // 6. Erros específicos
    if (error instanceof z.ZodError) {
      res.status(400).json(error.errors);
    } else {
      console.error("Erro ao criar campanha:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  }
});
```

## Validação com Zod

**Regra: todo POST/PUT DEVE ter validação Zod.**

```typescript
import { insertCampaignSchema } from "@shared/schema";

// Validação básica
const parsed = insertCampaignSchema.safeParse(req.body);

// Validação com schema inline (para query params, etc.)
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(["active", "draft", "completed"]).optional(),
});
const query = querySchema.parse(req.query);
```

## Autenticação e Autorização

```typescript
// Verificar autenticação (Passport.js session-based)
if (!req.isAuthenticated()) {
  return res.status(401).json({ message: "Não autenticado" });
}

// req.user disponível após auth:
// req.user.id, req.user.role, req.user.email, req.user.name

// CompanyId vem da SESSÃO (não do user):
const activeCompanyId = req.session.activeCompanyId;

// Verificar role
if (req.user.role !== "company" && req.user.role !== "admin") {
  return res.status(403).json({ message: "Acesso negado" });
}

// Multi-tenant: SEMPRE filtrar por activeCompanyId
const campaigns = await storage.getCompanyCampaigns(activeCompanyId);
```

### Roles Disponíveis

| Role | Acesso |
|------|--------|
| `creator` | Dashboard creator, candidaturas, entregas, perfil, mensagens |
| `company` | Dashboard empresa, campanhas, comunidades, analytics, automações |
| `admin` | Tudo + admin dashboard, gestão de usuários, impersonation |

## Respostas HTTP

| Código | Quando usar |
|--------|-------------|
| `200` | GET/PUT sucesso |
| `201` | POST criou recurso |
| `400` | Validação falhou |
| `401` | Não autenticado |
| `403` | Sem permissão |
| `404` | Recurso não encontrado |
| `409` | Conflito (duplicata) |
| `500` | Erro interno |

## Formato de Resposta

```typescript
// Sucesso
res.json(data);                    // GET: retorna dados
res.status(201).json(data);        // POST: retorna recurso criado

// Erro
res.status(400).json({
  message: "Descrição do erro",
  errors: zodErrors                // opcional: detalhes Zod
});

// Lista paginada
res.json({
  data: items,
  total: count,
  page: 1,
  limit: 20,
});
```

## Convenções

1. **Prefixo `/api/`** em todas as rotas do backend
2. **RESTful**: GET (listar/buscar), POST (criar), PUT/PATCH (atualizar), DELETE (remover)
3. **camelCase** nos nomes de campos JSON
4. **Storage layer**: nunca fazer queries direto nas rotas, usar `storage.*`
5. **Zod obrigatório** para todo body de POST/PUT
6. **companyId**: sempre filtrar dados por empresa (multi-tenant)
