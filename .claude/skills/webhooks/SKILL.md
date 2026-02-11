---
name: webhooks
description: Como receber e processar webhooks do Instagram, TikTok e Stripe. Verificação, retry, idempotência e logging. Use quando trabalhar com webhooks.
user-invocable: false
allowed-tools: Read, Grep, Glob
---

# Padrões de Webhooks

## Webhooks Ativos

| Provedor | Endpoint | Eventos |
|----------|----------|---------|
| Instagram/Meta | `POST /api/instagram/webhook` | mentions, comments, messages |
| Stripe | `POST /api/stripe/webhook` | payment_intent, subscription, invoice |

## Instagram Webhooks

### Verificação (Challenge)

Meta envia GET para verificar ownership:

```typescript
// GET /api/instagram/webhook
app.get("/api/instagram/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.status(403).send("Forbidden");
});
```

### Receber Eventos

```typescript
// POST /api/instagram/webhook
app.post("/api/instagram/webhook", async (req, res) => {
  // 1. Responder 200 IMEDIATAMENTE (Meta timeout = 20s)
  res.status(200).send("EVENT_RECEIVED");

  // 2. Processar assincronamente
  try {
    const { object, entry } = req.body;

    for (const item of entry) {
      for (const change of item.changes) {
        switch (change.field) {
          case "mentions":
            await processMention(change.value);
            break;
          case "comments":
            await processComment(change.value);
            break;
          case "messages":
            await processMessage(change.value);
            break;
        }
      }
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
    // NÃO retornar erro — já respondemos 200
  }
});
```

### Payload Instagram

```json
{
  "object": "instagram",
  "entry": [{
    "id": "INSTAGRAM_BUSINESS_ACCOUNT_ID",
    "time": 1727961600,
    "changes": [{
      "field": "mentions",
      "value": {
        "media_id": "123456",
        "comment_id": "789"
      }
    }]
  }]
}
```

## Stripe Webhooks

### Verificação de Assinatura

```typescript
import Stripe from "stripe";

app.post("/api/stripe/webhook",
  express.raw({ type: "application/json" }),  // Body RAW, não JSON
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig!,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err) {
      console.error("Invalid Stripe signature:", err);
      return res.status(400).send("Invalid signature");
    }

    // Processar evento
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSuccess(event.data.object);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdate(event.data.object);
        break;
    }

    res.json({ received: true });
  }
);
```

## Padrões Gerais

### Responder Rápido

```typescript
// SEMPRE responder 200 antes de processar
// Provedores (Meta, Stripe) têm timeout curto
res.status(200).send("OK");
// Depois processar...
```

### Idempotência

```typescript
// Webhooks podem ser enviados mais de uma vez
// Verificar se já processou o evento

async function processWebhookEvent(eventId: string, handler: () => Promise<void>) {
  // Verificar se já processou
  const existing = await storage.getWebhookEvent(eventId);
  if (existing) return; // Já processado, ignorar

  // Processar
  await handler();

  // Registrar como processado
  await storage.saveWebhookEvent(eventId);
}
```

### Logging

```typescript
// Logar TODOS os webhooks recebidos para debug
console.log("Webhook received:", {
  provider: "instagram",
  event: change.field,
  payload: JSON.stringify(change.value).substring(0, 500),
  timestamp: new Date().toISOString(),
});
```

### Retry

```typescript
// Meta: reenvia se não receber 200 em 20s
// Stripe: reenvia até 3 dias, backoff exponencial
// Seu código: não precisa implementar retry — o provedor faz
// MAS: precisa ser idempotente para lidar com duplicatas
```

## Checklist para Novo Webhook

1. Criar endpoint POST (URL fixa e pública)
2. Implementar verificação de assinatura/token
3. Responder 200 imediatamente
4. Processar evento de forma assíncrona
5. Implementar idempotência (verificar duplicatas)
6. Logar eventos recebidos
7. Configurar URL no dashboard do provedor
8. Testar com webhook local (ngrok ou similar)
