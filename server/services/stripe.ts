import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.warn('[Stripe] STRIPE_SECRET_KEY not configured');
}

export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, { apiVersion: '2025-01-27.acacia' as any })
  : null;

export interface CreateCheckoutSessionParams {
  companyId: number;
  userId: number;
  amountInCents: number;
  metadata?: Record<string, string>;
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<CheckoutSessionResult> {
  if (!stripe) {
    throw new Error('Stripe não está configurado');
  }

  const { companyId, userId, amountInCents, metadata = {} } = params;

  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://ugc.turbopartners.com.br'
    : process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : 'http://localhost:5000';

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card', 'boleto'],
    line_items: [
      {
        price_data: {
          currency: 'brl',
          product_data: {
            name: 'Créditos CreatorConnect',
            description: `Adição de R$ ${(amountInCents / 100).toFixed(2)} em créditos`,
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${baseUrl}/company/wallet?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/company/wallet?canceled=true`,
    metadata: {
      companyId: String(companyId),
      userId: String(userId),
      amountInCents: String(amountInCents),
      ...metadata,
    },
    payment_intent_data: {
      metadata: {
        companyId: String(companyId),
        userId: String(userId),
        amountInCents: String(amountInCents),
      },
    },
    locale: 'pt-BR',
    custom_text: {
      submit: {
        message: 'Seus créditos serão adicionados automaticamente após a confirmação do pagamento.',
      },
    },
  });

  if (!session.url) {
    throw new Error('Falha ao criar sessão de checkout');
  }

  return {
    sessionId: session.id,
    url: session.url,
  };
}

export async function getSession(sessionId: string): Promise<Stripe.Checkout.Session | null> {
  if (!stripe) {
    throw new Error('Stripe não está configurado');
  }

  try {
    return await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'customer'],
    });
  } catch (error) {
    console.error('[Stripe] Error retrieving session:', error);
    return null;
  }
}

export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  if (!stripe) {
    console.error('[Stripe] Stripe not configured');
    return null;
  }

  const webhookSecret = process.env.NODE_ENV === 'production'
    ? process.env.STRIPE_WEBHOOK_SECRET
    : process.env.STRIPE_WEBHOOK_SECRET_DEV;

  if (!webhookSecret) {
    console.error('[Stripe] Webhook secret not configured for environment:', process.env.NODE_ENV);
    return null;
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Stripe] Webhook signature verification failed:', message);
    return null;
  }
}

export function isStripeConfigured(): boolean {
  return stripe !== null;
}
