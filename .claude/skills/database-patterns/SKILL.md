---
name: database-patterns
description: Padrões para criar tabelas, migrations, queries com Drizzle ORM, relacionamentos e validação Zod. Use quando precisar modificar o schema do banco ou criar queries.
user-invocable: false
allowed-tools: Read, Grep, Glob
---

# Padrões de Banco de Dados

## Arquivo Único de Schema

Tudo fica em `shared/schema.ts` (~3900 linhas). Este arquivo define:
- Schemas PostgreSQL (namespaces)
- Tabelas com colunas
- Relations (Drizzle)
- Zod schemas para validação
- Types TypeScript exportados

## Multi-Schema PostgreSQL

O banco usa 12+ schemas para organizar tabelas por domínio:

```typescript
import { pgSchema } from "drizzle-orm/pg-core";

export const coreSchema = pgSchema("core");
export const campaignSchema = pgSchema("campaign");
export const creatorSchema = pgSchema("creator");
export const brandSchema = pgSchema("brand");
export const contentSchema = pgSchema("content");
export const messagingSchema = pgSchema("messaging");
export const gamificationSchema = pgSchema("gamification");
export const analyticsSchema = pgSchema("analytics");
export const billingSchema = pgSchema("billing");
export const academySchema = pgSchema("academy");
export const socialSchema = pgSchema("social");
export const systemSchema = pgSchema("system");
```

## Definir uma Tabela

```typescript
export const campaigns = campaignSchema.table("campaigns", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  title: varchar("title", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).default("draft"),
  budget: numeric("budget", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### Tipos de Coluna Comuns

| Tipo Drizzle | PostgreSQL | Uso |
|-------------|-----------|-----|
| `serial("id")` | SERIAL | IDs auto-incremento |
| `varchar("x", { length: N })` | VARCHAR(N) | Strings com limite |
| `text("x")` | TEXT | Strings longas |
| `integer("x")` | INTEGER | Números inteiros |
| `numeric("x", { precision, scale })` | NUMERIC | Valores monetários |
| `boolean("x")` | BOOLEAN | Flags |
| `timestamp("x")` | TIMESTAMP | Datas |
| `jsonb("x")` | JSONB | Dados estruturados flexíveis |

### Enums com pgEnum

```typescript
export const campaignStatusEnum = campaignSchema.enum("campaign_status", [
  "draft", "active", "paused", "completed", "cancelled"
]);

// Usar na tabela:
status: campaignStatusEnum("status").default("draft"),
```

## Definir Relations

```typescript
export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  company: one(companies, {
    fields: [campaigns.companyId],
    references: [companies.id],
  }),
  applications: many(applications),
  deliverables: many(campaignDeliverables),
}));
```

## Zod Schemas para Validação

```typescript
import { createInsertSchema } from "drizzle-zod";

// Schema base gerado automaticamente das colunas
export const insertCampaignSchema = createInsertSchema(campaigns);

// Schema customizado com validações extras
export const insertCampaignSchema = createInsertSchema(campaigns, {
  title: z.string().min(3).max(255),
  budget: z.string().regex(/^\d+(\.\d{1,2})?$/),
}).omit({ id: true, createdAt: true, updatedAt: true });

// Type inferido
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;
```

## Storage Layer (Data Access)

Queries ficam em `server/storage.ts`, não nas rotas:

```typescript
// server/storage.ts
export class DatabaseStorage implements IStorage {
  async getCampaign(id: number): Promise<Campaign | undefined> {
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, id));
    return campaign;
  }

  async createCampaign(data: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db
      .insert(campaigns)
      .values(data)
      .returning();
    return campaign;
  }
}

export const storage = new DatabaseStorage();
```

## Migrations

```bash
# Após editar shared/schema.ts:
npm run db:push          # Push direto (desenvolvimento)

# Drizzle config em drizzle.config.ts:
# - out: ./migrations
# - schema: ./shared/schema.ts
# - dialect: postgresql
```

## Checklist para Novas Tabelas

1. Definir tabela no schema correto em `shared/schema.ts`
2. Definir relations se houver FKs
3. Criar Zod insert schema com `createInsertSchema()`
4. Exportar types: `InsertX` e `X` (select)
5. Adicionar métodos CRUD em `server/storage.ts`
6. Rodar `npm run db:push`
7. Rodar `npm run check` para verificar tipos
