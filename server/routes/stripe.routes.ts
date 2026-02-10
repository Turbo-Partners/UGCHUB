import { Router, Request, Response } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import { db } from '../db';
import { companyWallets, walletTransactions, companyMembers } from '@shared/schema';
import { eq, sql, and } from 'drizzle-orm';
import {
  createCheckoutSession,
  getSession,
  verifyWebhookSignature,
  isStripeConfigured,
  stripe,
} from '../services/stripe';

const router = Router();

const createCheckoutSchema = z.object({
  amountInCents: z.number().min(500).max(1000000),
});

router.get('/status', (req: Request, res: Response) => {
  res.json({
    configured: isStripeConfigured(),
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
  });
});

router.post('/create-checkout', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated?.() || !req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const user = req.user as any;
    if (user.role !== 'company') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const membership = await db.query.companyMembers.findFirst({
      where: eq(companyMembers.userId, user.id),
    });

    if (!membership) {
      return res.status(403).json({ error: 'Você não pertence a nenhuma empresa' });
    }

    const validation = createCheckoutSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Valor inválido', details: validation.error.errors });
    }

    const { amountInCents } = validation.data;

    const result = await createCheckoutSession({
      companyId: membership.companyId,
      userId: user.id,
      amountInCents,
    });

    res.json(result);
  } catch (error) {
    console.error('[Stripe] Error creating checkout session:', error);
    const message = error instanceof Error ? error.message : 'Erro ao criar sessão';
    res.status(500).json({ error: message });
  }
});

router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated?.() || !req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { sessionId } = req.params;
    const session = await getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    res.json({
      id: session.id,
      status: session.status,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
      metadata: session.metadata,
    });
  } catch (error) {
    console.error('[Stripe] Error getting session:', error);
    res.status(500).json({ error: 'Erro ao buscar sessão' });
  }
});

router.post(
  '/webhook',
  async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'];

    if (!signature || typeof signature !== 'string') {
      console.error('[Stripe Webhook] Missing signature header');
      return res.status(400).json({ error: 'Missing signature' });
    }

    const event = verifyWebhookSignature(req.body, signature);

    if (!event) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutCompleted(event.id, event.data.object as Stripe.Checkout.Session);
          break;

        case 'checkout.session.async_payment_succeeded':
          await handleAsyncPaymentSucceeded(event.id, event.data.object as Stripe.Checkout.Session);
          break;

        case 'checkout.session.async_payment_failed':
          await handleAsyncPaymentFailed(event.data.object as Stripe.Checkout.Session);
          break;

        case 'payment_intent.succeeded':
          console.log('[Stripe Webhook] Payment intent succeeded:', (event.data.object as Stripe.PaymentIntent).id);
          break;

        case 'payment_intent.payment_failed':
          console.log('[Stripe Webhook] Payment intent failed:', (event.data.object as Stripe.PaymentIntent).id);
          break;

        case 'charge.refunded':
          await handleChargeRefunded(event.id, event.data.object as Stripe.Charge);
          break;

        case 'charge.dispute.created':
          await handleDisputeCreated(event.data.object as Stripe.Dispute);
          break;

        case 'charge.dispute.closed':
          console.log('[Stripe Webhook] Dispute closed:', (event.data.object as Stripe.Dispute).id);
          break;

        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('[Stripe Webhook] Error processing event:', error);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  }
);

async function handleCheckoutCompleted(eventId: string, session: Stripe.Checkout.Session) {
  console.log('[Stripe] Processing checkout.session.completed:', session.id);

  if (session.payment_status === 'paid') {
    await addCreditsToWallet(eventId, session);
  } else if (session.payment_status === 'unpaid') {
    console.log('[Stripe] Checkout completed but payment unpaid (boleto?), waiting for async payment');
  }
}

async function handleAsyncPaymentSucceeded(eventId: string, session: Stripe.Checkout.Session) {
  console.log('[Stripe] Processing async payment succeeded (boleto paid):', session.id);
  await addCreditsToWallet(eventId, session);
}

async function handleAsyncPaymentFailed(session: Stripe.Checkout.Session) {
  console.log('[Stripe] Async payment failed (boleto expired/failed):', session.id);
}

async function addCreditsToWallet(eventId: string, session: Stripe.Checkout.Session) {
  const metadata = session.metadata;
  if (!metadata?.companyId || !metadata?.amountInCents) {
    console.error('[Stripe] Missing metadata in session:', session.id);
    return;
  }

  const companyId = parseInt(metadata.companyId, 10);
  const amountInCents = parseInt(metadata.amountInCents, 10);
  const userId = metadata.userId ? parseInt(metadata.userId, 10) : null;

  if (amountInCents <= 0) {
    console.error('[Stripe] Invalid amount:', amountInCents);
    return;
  }

  try {
    await db.transaction(async (tx) => {
      let wallet = await tx.query.companyWallets.findFirst({
        where: eq(companyWallets.companyId, companyId),
      });

      if (!wallet) {
        try {
          const [newWallet] = await tx.insert(companyWallets).values({
            companyId,
            balance: 0,
            reservedBalance: 0,
          }).returning();
          wallet = newWallet;
        } catch (insertError: any) {
          if (insertError?.code === '23505') {
            wallet = await tx.query.companyWallets.findFirst({
              where: eq(companyWallets.companyId, companyId),
            });
            if (!wallet) throw new Error('Wallet creation race condition failed');
          } else {
            throw insertError;
          }
        }
      }

      const newBalance = wallet.balance + amountInCents;

      await tx
        .update(companyWallets)
        .set({
          balance: newBalance,
          updatedAt: new Date(),
        })
        .where(eq(companyWallets.id, wallet.id));

      await tx.insert(walletTransactions).values({
        companyWalletId: wallet.id,
        type: 'deposit',
        amount: amountInCents,
        balanceAfter: newBalance,
        description: `Depósito via Stripe - ${session.id}`,
        stripeEventId: eventId,
        relatedUserId: userId,
        status: 'completed',
        processedAt: new Date(),
      });

      console.log(`[Stripe] Added ${amountInCents} cents to company ${companyId} wallet. New balance: ${newBalance}`);
    });
  } catch (error: any) {
    if (error?.code === '23505' && error?.constraint?.includes('stripe_event')) {
      console.log(`[Stripe] Event ${eventId} already processed (duplicate webhook), skipping`);
      return;
    }
    throw error;
  }
}

async function handleChargeRefunded(eventId: string, charge: Stripe.Charge) {
  console.log('[Stripe] Processing charge.refunded:', charge.id);

  let companyId: number | null = null;

  if (charge.metadata?.companyId) {
    companyId = parseInt(charge.metadata.companyId, 10);
  }

  if (!companyId && charge.payment_intent && stripe) {
    try {
      const paymentIntent = typeof charge.payment_intent === 'string'
        ? await stripe.paymentIntents.retrieve(charge.payment_intent)
        : charge.payment_intent;
      
      if (paymentIntent.metadata?.companyId) {
        companyId = parseInt(paymentIntent.metadata.companyId, 10);
      }
    } catch (error) {
      console.error('[Stripe] Error fetching payment intent:', error);
    }
  }

  if (!companyId) {
    console.log('[Stripe] Charge refund without company metadata, skipping wallet deduction');
    return;
  }

  const refunds = charge.refunds?.data || [];
  
  if (refunds.length === 0) {
    console.log('[Stripe] No refund data found in charge');
    return;
  }

  for (const refund of refunds) {
    const refundAmount = refund.amount;
    const refundEventId = `refund_${refund.id}`;

    try {
      await db.transaction(async (tx) => {
        const wallet = await tx.query.companyWallets.findFirst({
          where: eq(companyWallets.companyId, companyId!),
        });

        if (!wallet) {
          console.error('[Stripe] Wallet not found for refund, company:', companyId);
          return;
        }

        const newBalance = wallet.balance - refundAmount;

        await tx
          .update(companyWallets)
          .set({
            balance: newBalance,
            updatedAt: new Date(),
          })
          .where(eq(companyWallets.id, wallet.id));

        await tx.insert(walletTransactions).values({
          companyWalletId: wallet.id,
          type: 'refund',
          amount: -refundAmount,
          balanceAfter: newBalance,
          description: `Reembolso Stripe - ${refund.id}`,
          stripeEventId: refundEventId,
          status: 'completed',
          processedAt: new Date(),
        });

        console.log(`[Stripe] Refunded ${refundAmount} cents from company ${companyId}. New balance: ${newBalance}`);
      });
    } catch (error: any) {
      if (error?.code === '23505' && error?.constraint?.includes('stripe_event')) {
        console.log(`[Stripe] Refund ${refund.id} already processed (duplicate webhook), skipping`);
        continue;
      }
      throw error;
    }
  }
}

async function handleDisputeCreated(dispute: Stripe.Dispute) {
  console.log('[Stripe] Dispute created:', dispute.id, 'Reason:', dispute.reason);
}

export default router;
