---
name: background-jobs
description: Padrões para cron jobs, tarefas assíncronas, agendamento e rate limiting de jobs. Use quando criar ou modificar background jobs.
user-invocable: false
allowed-tools: Read, Grep, Glob
---

# Background Jobs

## Localização

Jobs ficam em `server/jobs/`. Cada arquivo exporta uma função de setup.

## Stack

- **node-cron** — agendamento de tarefas
- Não usa filas externas (Redis/Bull) por enquanto
- Jobs rodam no mesmo processo do servidor Express

## Estrutura de um Job

```typescript
// server/jobs/meu-job.ts
import cron from "node-cron";
import { storage } from "../storage";

export function setupMeuJob() {
  // Cron expression: minuto hora dia mês diaSemana
  cron.schedule("*/15 * * * *", async () => {
    console.log("[MeuJob] Iniciando...");
    const startTime = Date.now();

    try {
      // Lógica do job
      const items = await storage.getPendingItems();

      for (const item of items) {
        try {
          await processItem(item);
        } catch (error) {
          // Logar erro mas continuar processando outros itens
          console.error(`[MeuJob] Erro no item ${item.id}:`, error);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`[MeuJob] Concluído em ${duration}ms. ${items.length} itens processados.`);
    } catch (error) {
      console.error("[MeuJob] Erro fatal:", error);
    }
  });

  console.log("[MeuJob] Agendado: a cada 15 minutos");
}
```

## Registrar Jobs

```typescript
// server/index.ts — dentro do callback de server.listen()
server.listen(port, "0.0.0.0", async () => {
  // Métricas: a cada 15 minutos (gamificação)
  const { startMetricsProcessor } = await import("./jobs/metricsProcessor");
  startMetricsProcessor(15);

  // Emails semanais: Segunda 9 AM (Brasília)
  const { initWeeklyEmailJob } = await import("./jobs/weeklyEmailJob");
  initWeeklyEmailJob();

  // Cleanup: a cada 24 horas
  const { startCleanupScheduler } = await import("./services/cleanup");
  startCleanupScheduler();

  // Auto-enrichment: event-driven + daily catch-up
  const { startDailyCatchUpJob } = await import("./jobs/autoEnrichmentJob");
  startDailyCatchUpJob();
});
```

### Timeline de Inicialização

```
Server listen
├── MetricsProcessor → initial run +5s, depois 15 min interval
├── WeeklyEmailJob → Segunda 9AM (cron)
├── CleanupScheduler → initial run imediato, depois 24h interval
└── AutoEnrichmentJob → initial catch-up +30s, depois daily
```

## Jobs Existentes

| Job | Arquivo | Frequência | O que faz |
|-----|---------|-----------|-----------|
| Métricas/Gamificação | `metricsProcessor.ts` | A cada 15 min | Processar pontos, ranks, milestones |
| Emails semanais | `weeklyEmailJob.ts` | Segunda 9AM (BRT) | Resumo semanal para empresas |
| Auto-enrichment | `autoEnrichmentJob.ts` | Event-driven + diário | Enriquecer perfis e fotos |
| Apify Sync | `apifySyncJob.ts` | Diário 6AM (DESATIVADO) | Sync de perfis via Apify |
| Cleanup | `services/cleanup.ts` | A cada 24h | Limpar notificações e logs antigos |

## Cron Expressions Comuns

```
*/15 * * * *     → A cada 15 minutos
0 * * * *        → A cada hora (minuto 0)
0 */6 * * *      → A cada 6 horas
0 9 * * *        → Todos os dias às 9h
0 9 * * 1        → Toda segunda às 9h
0 0 1 * *        → Primeiro dia do mês à meia-noite
```

## Padrões

### Rate Limiting em Jobs

```typescript
// Para APIs externas, respeitar rate limits
async function processWithRateLimit(items: Item[], ratePerMinute: number) {
  const delayMs = (60 * 1000) / ratePerMinute;

  for (const item of items) {
    await processItem(item);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}

// Exemplo: Instagram Business Discovery (200/hora)
await processWithRateLimit(creators, 180); // 180/hora (margem de segurança)
```

### Lock para Evitar Execução Dupla

```typescript
let isRunning = false;

cron.schedule("*/15 * * * *", async () => {
  if (isRunning) {
    console.log("[Job] Já em execução, pulando...");
    return;
  }

  isRunning = true;
  try {
    await doWork();
  } finally {
    isRunning = false;
  }
});
```

### Batch Processing

```typescript
// Processar em lotes para não sobrecarregar
async function processBatch(items: Item[], batchSize = 10) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map(item => processItem(item)));
    console.log(`[Job] Processado lote ${i / batchSize + 1}`);
  }
}
```

### Logging Estruturado

```typescript
// Sempre incluir:
// - Nome do job em colchetes
// - Timestamp de início/fim
// - Contagem de itens processados
// - Duração total
// - Erros individuais (sem interromper o job)

console.log(`[MetricsCron] Iniciando sync de ${creators.length} creators`);
console.log(`[MetricsCron] Concluído: ${success}/${total} sucesso, ${errors} erros, ${duration}ms`);
```

## Convenções

1. **Cada job em arquivo separado** em `server/jobs/`
2. **Exportar função setupX** que registra o cron
3. **Try/catch no nível do item** — um item falhando não deve parar o job
4. **Lock de execução** — evitar execução paralela do mesmo job
5. **Respeitar rate limits** — calcular delay entre chamadas a APIs externas
6. **Logar início, fim e erros** — facilitar debug em produção
7. **Sem side effects no import** — só executar quando setup() é chamado
