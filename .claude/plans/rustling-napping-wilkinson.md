# Plano: Adicionar roles "owner" e "reader" no convite de membros

## Contexto

Ao convidar um usuário para uma loja, apenas as opções "admin" e "member" aparecem. O schema do banco já suporta 4 roles em `companyMembers` (`owner`, `admin`, `member`, `reader`), mas a tabela `companyUserInvites` só permite 3 (`admin`, `member`, `reader`) e a validação do backend restringe a apenas 2 (`admin`, `member`). O frontend também está inconsistente entre os dois componentes.

## Mudanças

### 1. Schema — adicionar "owner" ao enum de `companyUserInvites.role`

**`shared/schema.ts:827`**
- `["admin", "member", "reader"]` → `["owner", "admin", "member", "reader"]`
- Requer `npm run db:push` para aplicar

### 2. Backend — expandir validação para aceitar todos os 4 roles

**`server/routes.ts:3340`**
- `['admin', 'member']` → `['owner', 'admin', 'member', 'reader']`

### 3. Frontend `team-management.tsx` — adicionar opção "owner"

**`client/src/components/team-management.tsx`**
- L62: Tipo do state → `"owner" | "admin" | "member" | "reader"`
- L593: `onValueChange` type → incluir "owner"
- L599-603: Adicionar `<SelectItem value="owner">Dono</SelectItem>`
- L605-611: Adicionar descrição para "owner": "Donos têm controle total sobre a loja e podem gerenciar todos os membros."

### 4. Frontend `company-members.tsx` — adicionar todas as opções

**`client/src/pages/company-members.tsx`**
- L56: Tipo do state → `"owner" | "admin" | "member" | "reader"`
- L470: `onValueChange` type → incluir todos os roles
- L476-479: Adicionar `<SelectItem>` para todos os 4 roles (owner, admin, member, reader)
- L481-484: Adicionar descrições para todos os 4 roles

### Permissão

Admins e owners podem convidar com qualquer role (incluindo owner). Sem restrição adicional — o middleware `isCompanyAdmin` existente já cobre ambos.

## Arquivos a modificar

| # | Arquivo | Mudança |
|---|---------|---------|
| 1 | `shared/schema.ts` | Adicionar "owner" ao enum de `companyUserInvites.role` (L827) |
| 2 | `server/routes.ts` | Expandir validação de roles no invite (L3340) |
| 3 | `client/src/components/team-management.tsx` | Adicionar "owner" ao select e tipo (L62, L593, L599-603, L605-611) |
| 4 | `client/src/pages/company-members.tsx` | Adicionar todos os 4 roles ao select e tipo (L56, L470, L476-479, L481-484) |

## Verificação

1. `npm run db:push` — aplicar mudança de schema
2. `npm run test` — 22 testes passando
3. Testar no frontend: abrir modal de convite → 4 opções visíveis (Dono, Administrador, Membro, Leitor) com descrições
