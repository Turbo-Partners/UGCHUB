---
name: deployment
description: Como fazer deploy, variáveis de ambiente, migrations em produção, build e monitoramento. Use quando trabalhar com deploy ou configuração de ambiente.
user-invocable: false
allowed-tools: Read, Grep, Glob
---

# Deployment

## Ambiente

- **Plataforma**: Replit (autoscale)
- **Domínio produção**: `ugc.turbopartners.com.br`
- **Banco**: PostgreSQL (Cloud SQL ou Replit DB)
- **Storage**: Google Cloud Storage (GCS)

## Build

```bash
npm run build
# Comando real:
# vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Resultado:
# 1. Vite compila React → dist/public/ (index.html, assets/)
# 2. esbuild compila Express → dist/index.js (ESM bundle)

npm run start
# Roda dist/index.js (servidor Express serve frontend e API)
```

## Variáveis de Ambiente

### Obrigatórias

```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
APP_PORT=5000
NODE_ENV=production
```

### Auth

```env
SESSION_SECRET=random-secret-string
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
```

### APIs Externas

```env
# Meta/Instagram
META_APP_ID=xxx
META_APP_SECRET=xxx
META_WEBHOOK_VERIFY_TOKEN=xxx

# OpenAI
OPENAI_API_KEY=sk-xxx

# SendGrid
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@ugc.turbopartners.com.br

# Stripe
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Apify
APIFY_API_TOKEN=apify_xxx

# Google Cloud Storage
GCS_BUCKET=bucket-name
GCS_KEY_FILE=path/to/keyfile.json
```

## Migrations em Produção

```bash
# Opção 1: Push direto (cuidado em produção)
npm run db:push

# O Drizzle compara schema.ts com banco e aplica mudanças
# drizzle.config.ts configura:
# - schema: ./shared/schema.ts
# - dialect: postgresql
# - dbCredentials: { url: DATABASE_URL }
```

### Checklist Antes de Migration

1. Testar localmente com dados reais (dump do banco de produção)
2. Verificar se há dados que seriam perdidos (drop column, etc.)
3. Para alterações destrutivas, fazer backup primeiro
4. Rodar `npm run check` para verificar tipos
5. Em produção, rodar durante horário de baixo tráfego

## Configuração Replit (.replit)

```ini
[deployment]
deploymentTarget = "autoscale"
build = ["npm", "run", "build"]
run = ["npm", "run", "start"]

[nix]
packages = ["ffmpeg"]    # Para processamento de mídia
```

## Processo de Deploy

```
1. Código commitado e testado localmente
2. Push para branch main
3. Replit detecta mudança e faz build automático (vite + esbuild)
4. Se necessário, rodar npm run db:push para migrations
5. Servidor reinicia com nova versão (autoscale)
```

## Monitoramento

### Logs

```typescript
// Console.log/error vão para logs do Replit
// Padrão de log:
console.log("[Módulo] Ação: detalhes");
console.error("[Módulo] Erro:", { context, error });
```

### Health Check

```
GET / → Frontend (SPA)
GET /api/user → 401 se não logado (servidor está ok)
```

## Segurança em Produção

1. **NODE_ENV=production** — habilita cookies seguros, desabilita debug
2. **HTTPS obrigatório** — Replit/Cloudflare provê SSL
3. **Variáveis sensíveis** — nunca commitar .env, usar secrets do Replit
4. **Rate limiting** — nos endpoints de auth (login, registro)
5. **CORS** — configurado para domínio de produção
6. **Headers de segurança** — helmet.js ou equivalente

## Estrutura de Build

```
dist/
├── index.js           # Backend compilado (esbuild)
└── public/            # Frontend compilado (Vite)
    ├── index.html
    ├── assets/
    │   ├── index-[hash].js
    │   └── index-[hash].css
    └── ...
```

## Rollback

```bash
# Se algo der errado:
# 1. Reverter commit: git revert HEAD
# 2. Push: git push
# 3. Replit faz build da versão anterior
# 4. Se migration destrutiva: restaurar backup do banco
```

## Convenções

1. **Testar build antes de deploy**: `npm run build && npm run start`
2. **Verificar tipos**: `npm run check`
3. **Rodar testes**: `npm run test`
4. **Nunca commitar .env** — está no .gitignore
5. **Backup antes de migrations destrutivas**
6. **Domínio de produção**: sempre usar `ugc.turbopartners.com.br`
7. **UTM em links externos**: `utm_source=creatorconnect&utm_medium=<local>&utm_campaign=<contexto>`
