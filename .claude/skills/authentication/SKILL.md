---
name: authentication
description: Fluxo de autenticação, sessões, proteção de rotas, multi-tenant com companyId e impersonation. Use quando trabalhar com auth, sessões ou controle de acesso.
user-invocable: false
allowed-tools: Read, Grep, Glob
---

# Autenticação e Autorização

## Stack

- **Passport.js** — estratégias de login (local + Google OAuth)
- **express-session** — sessões server-side
- **connect-pg-simple** — sessões persistidas no PostgreSQL
- Arquivo principal: `server/auth.ts`

## Auth é Session-Based (NÃO JWT)

Decisão arquitetural: sessões no PostgreSQL permitem:
- Admin impersonation (logar como outro usuário)
- Revogação imediata de sessões
- Dados de sessão consultáveis no banco

## Fluxo de Login

### Email + Senha

```
1. POST /api/login { email, password }
2. Passport LocalStrategy valida credenciais
3. Sessão criada no PostgreSQL (connect-pg-simple)
4. Cookie de sessão retornado ao browser
5. Requests subsequentes enviam cookie automaticamente
```

### Google OAuth

```
1. GET /api/auth/google → redireciona para Google
2. Google retorna code → GET /api/auth/google/callback
3. Passport GoogleStrategy troca code por perfil
4. Cria ou vincula usuário no banco
5. Sessão criada, redireciona para dashboard
```

## Verificar Auth nas Rotas

```typescript
// Verificar se está logado
if (!req.isAuthenticated()) {
  return res.status(401).json({ message: "Não autenticado" });
}

// Acessar dados do usuário
const userId = req.user.id;
const role = req.user.role;         // "creator" | "company" | "admin"
const companyId = req.user.companyId; // para users de empresa
const email = req.user.email;
```

## Roles e Permissões

| Role | Dashboards | Pode fazer |
|------|-----------|-----------|
| `creator` | Creator dashboard | Candidatar, entregar, mensagens, perfil |
| `company` | Company dashboard | Campanhas, comunidades, analytics, automações |
| `admin` | Admin dashboard + tudo | Gestão de usuários, métricas globais, impersonation |

### Proteção por Role (Backend)

```typescript
// Padrão mais comum: auth + role em uma linha
if (!req.isAuthenticated() || req.user!.role !== "company") return res.sendStatus(403);

// Company OU admin
if (!req.isAuthenticated() || !["company", "admin"].includes(req.user!.role)) {
  return res.sendStatus(403);
}

// Admin: verificação por role E email domain
const isAdminByRole = req.user?.role === "admin";
const isAdminByEmail = email.endsWith("@turbopartners.com.br") || email === "rodrigoqs9@gmail.com";
if (!isAdminByRole && !isAdminByEmail) return res.sendStatus(403);
```

### Proteção por Role (Frontend)

```typescript
// client/src/components/protected-route.tsx
<ProtectedRoute path="/company/dashboard" roles={["company", "admin"]}>
  <CompanyDashboard />
</ProtectedRoute>

<ProtectedRoute path="/creator/dashboard" roles={["creator"]}>
  <CreatorDashboard />
</ProtectedRoute>

<ProtectedRoute path="/admin" roles={["admin"]}>
  <AdminDashboard />
</ProtectedRoute>
```

## Multi-Tenant (Isolamento por Empresa)

**REGRA CRÍTICA: todo dado de empresa DEVE ser filtrado por companyId.**

```typescript
// CORRETO: filtrar por companyId
app.get("/api/campaigns", async (req, res) => {
  const campaigns = await storage.getCampaignsByCompany(req.user.companyId);
  res.json(campaigns);
});

// ERRADO: retornar dados de todas as empresas
app.get("/api/campaigns", async (req, res) => {
  const campaigns = await storage.getAllCampaigns(); // NUNCA FAZER ISSO
  res.json(campaigns);
});
```

### Multi-Workspace

- Empresas podem ter múltiplos workspaces
- Usuários podem pertencer a várias empresas
- `company-switcher.tsx` permite trocar empresa ativa
- `companyId` atual vem da sessão ou contexto

```typescript
// Convites para membros
// Permissões: owner > admin > member
// Owner pode tudo, admin gerencia, member apenas acessa
```

## Endpoints de Auth

```
POST /api/register            → Registro (creator ou company)
POST /api/login               → Login email/senha
POST /api/logout              → Logout (destroi sessão)
GET  /api/user                → Dados do usuário logado
GET  /api/auth/google         → Iniciar Google OAuth
GET  /api/auth/google/callback → Callback Google OAuth
POST /api/forgot-password     → Solicitar reset de senha
POST /api/reset-password      → Resetar senha com token
```

## Hook de Auth (Frontend)

```typescript
// client/src/hooks/use-auth.ts
export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isCreator: user?.role === "creator",
    isCompany: user?.role === "company",
    isAdmin: user?.role === "admin",
  };
}
```

## Impersonation (Admin)

```typescript
// Iniciar: POST /api/admin/impersonate/:userId
// - Salva em req.session.impersonation { originalUserId, impersonatedUserId, startedAt }
// - Não permite impersonar outros admins
// - GET /api/user retorna dados do impersonado com _isImpersonating: true

// Parar: POST /api/admin/impersonate/stop
// - Remove req.session.impersonation
```

## Segurança

1. **Senhas com scrypt** (hash + salt, `timingSafeEqual` na comparação)
2. **CSRF protection** via same-origin cookies
3. **Session secret** via variável de ambiente (`REPLIT_CLUSTER` ou custom)
4. **Cookie seguro** em produção (secure, httpOnly, sameSite)
5. **Rate limit** em rotas de login/registro (prevenir brute force)
6. **Google OAuth**: role vem de `req.session.googleAuthRole`, deletado após uso
