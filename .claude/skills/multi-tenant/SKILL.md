---
name: multi-tenant
description: Isolamento de dados por empresa, filtros automáticos por companyId, permissões de workspace e padrões multi-tenant. Use quando trabalhar com dados de empresa.
user-invocable: false
allowed-tools: Read, Grep, Glob
---

# Multi-Tenant (Isolamento por Empresa)

## Modelo

Cada empresa (company) tem seus dados isolados. Creators podem participar de múltiplas empresas/comunidades.

```
Company A ──► Campanhas A, Comunidades A, Creators da comunidade A
Company B ──► Campanhas B, Comunidades B, Creators da comunidade B
Admin     ──► Vê tudo (dashboard global)
```

## companyId é Obrigatório

**REGRA CRÍTICA: toda query de dados de empresa DEVE filtrar por companyId.**

### Backend — Filtrar Sempre

**IMPORTANTE: `activeCompanyId` vem de `req.session.activeCompanyId`, NÃO de `req.user`.**

```typescript
// CORRETO ✅
app.get("/api/campaigns", async (req, res) => {
  if (!req.isAuthenticated() || req.user!.role !== "company") return res.sendStatus(403);

  const activeCompanyId = req.session.activeCompanyId;
  if (!activeCompanyId) {
    return res.status(400).json({ error: "Nenhuma loja ativa selecionada" });
  }

  const campaigns = await storage.getCompanyCampaigns(activeCompanyId);
  res.json(campaigns);
});

// ERRADO ❌ — vaza dados de outras empresas
app.get("/api/campaigns", async (req, res) => {
  const campaigns = await storage.getAllCampaigns();
  res.json(campaigns);
});
```

### Lógica por Role

```typescript
if (req.user!.role === "company") {
  // Company: filtra por activeCompanyId da sessão
  const campaigns = await storage.getCompanyCampaigns(req.session.activeCompanyId);
} else if (req.user!.role === "creator") {
  // Creator: vê campanhas qualificadas para ele
  const campaigns = await storage.getQualifiedCampaignsForCreator(req.user!.id);
} else if (req.user!.role === "admin") {
  // Admin: pode filtrar por companyId ou ver tudo
  const campaigns = await storage.getAllCampaigns();
}
```

### Storage Layer

```typescript
// server/storage.ts — métodos SEMPRE recebem companyId
async getCampaignsByCompany(companyId: number): Promise<Campaign[]> {
  return db
    .select()
    .from(campaigns)
    .where(eq(campaigns.companyId, companyId));
}

async getCampaign(id: number, companyId: number): Promise<Campaign | undefined> {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(and(
      eq(campaigns.id, id),
      eq(campaigns.companyId, companyId) // SEMPRE verificar
    ));
  return campaign;
}
```

## Multi-Workspace

### Estrutura

```
User (email)
  ├── Company A (owner)
  │   ├── Members: user1 (admin), user2 (member)
  │   └── Campanhas, Comunidades, etc.
  └── Company B (member)
      ├── Members: user3 (owner), user1 (member)
      └── Campanhas, Comunidades, etc.
```

### Permissões de Workspace

| Papel | Pode fazer |
|-------|-----------|
| `owner` | Tudo: editar empresa, gerenciar membros, excluir workspace |
| `admin` | Gerenciar campanhas, comunidades, membros (não excluir workspace) |
| `member` | Acessar dados, criar campanhas (sem gerenciar membros) |

### Trocar Empresa Ativa

```typescript
// Frontend: CompanySwitcher component
// - Lista empresas do usuário via getUserCompanies()
// - Ao selecionar, atualiza contexto (brand-context.tsx + localStorage)
// - Todas as queries são re-executadas com novo companyId

// Backend: activeCompanyId vem da SESSÃO (req.session.activeCompanyId)
// Setado no login e atualizado ao trocar empresa
// Persistido no PostgreSQL via connect-pg-simple
```

## Tabelas Multi-Tenant

Tabelas que DEVEM ter companyId:

| Tabela | Campo |
|--------|-------|
| `campaigns` | `company_id` |
| `communities` | `company_id` |
| `community_memberships` | (via community → company) |
| `automations` | `company_id` |
| `instagram_accounts` | `company_id` |
| `brand_conversations` | `company_id` |
| `ops_tasks` | `company_id` |
| `campaign_hashtags` | (via campaign → company) |

Tabelas que NÃO têm companyId (são do creator ou globais):

| Tabela | Razão |
|--------|-------|
| `users` | Usuários são globais |
| `creator_profiles` | Perfil é do creator |
| `applications` | Vinculada a campaign (que tem companyId) |
| `academy_*` | Conteúdo global |

## Convites para Membros

```typescript
// Fluxo:
// 1. Owner/admin envia convite por email
POST /api/companies/:id/invite { email, role }

// 2. Destinatário recebe email com link
// 3. Ao clicar, aceita e é adicionado à empresa

// Validações:
// - Só owner/admin pode convidar
// - Não pode convidar quem já é membro
// - Role máximo = role de quem convida (member não promove admin)
```

## Checklist para Novo Recurso Multi-Tenant

1. Adicionar `companyId` na tabela (FK para companies)
2. Criar index: `CREATE INDEX idx_resource_company ON resource(company_id)`
3. No storage layer, SEMPRE receber e filtrar por companyId
4. Na rota, usar `req.user.companyId`
5. Verificar: admin bypassa filtro? (geralmente sim para dashboard admin)
6. Testar: dados de empresa A não aparecem para empresa B
