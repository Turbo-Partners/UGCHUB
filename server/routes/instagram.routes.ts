import { Express, Request, Response } from 'express';
import { instagramService, isMessageIncoming } from '../services/instagram';
import crypto from 'crypto';
import { db } from '../db';
import {
  integrationLogs,
  instagramTaggedPosts,
  notifications,
  companies,
  contactNotes,
  instagramAccounts,
  instagramMessages,
  instagramProfiles,
  dmTemplates,
  dmSendLogs,
  users,
} from '@shared/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import OpenAI from 'openai';
import { getContactByUsername } from '../services/instagram-contacts';

function isAdminByEmail(user: any): boolean {
  const email = user?.email || '';
  return (
    user?.role === 'admin' ||
    email.endsWith('@turbopartners.com.br') ||
    email === 'rodrigoqs9@gmail.com'
  );
}

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const WEBHOOK_VERIFY_TOKEN =
  process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || 'creatorconnect_webhook_verify_2026';
const META_APP_SECRET = process.env.META_APP_SECRET;
const INSTAGRAM_WEBHOOK_SECRET = process.env.INSTAGRAM_APP_SECRET;

declare module 'express-session' {
  interface SessionData {
    instagramOAuthState?: {
      nonce: string;
      userId: number;
      type: 'creator' | 'business';
      timestamp: number;
      companyId?: number;
      returnTo?: string;
    };
  }
}

function verifyWebhookSignature(req: Request): boolean {
  const signature = req.headers['x-hub-signature-256'] as string;

  if (!signature) {
    console.log('[Instagram Webhook] Missing signature header');
    return false;
  }

  const rawBody = (req as any).rawBody;
  if (!rawBody) {
    console.log('[Instagram Webhook] No raw body available');
    return false;
  }

  // Try Instagram App Secret first, then Meta App Secret as fallback
  const secretsToTry = [INSTAGRAM_WEBHOOK_SECRET, META_APP_SECRET].filter(Boolean);

  if (secretsToTry.length === 0) {
    console.log(
      '[Instagram Webhook] No secrets configured (INSTAGRAM_APP_SECRET or META_APP_SECRET)',
    );
    return false;
  }

  for (const secret of secretsToTry) {
    const expectedSignature =
      'sha256=' + crypto.createHmac('sha256', secret!).update(rawBody).digest('hex');

    if (signature.length === expectedSignature.length) {
      try {
        if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
          console.log('[Instagram Webhook] Signature verified successfully');
          return true;
        }
      } catch (e) {
        // Continue to next secret
      }
    }
  }

  console.log('[Instagram Webhook] Signature mismatch with all configured secrets');
  return false;
}

const META_APP_ID = process.env.META_APP_ID;
const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const FACEBOOK_GRAPH_API_VERSION = 'v21.0';
const FACEBOOK_GRAPH_BASE_URL = `https://graph.facebook.com/${FACEBOOK_GRAPH_API_VERSION}`;
const INSTAGRAM_GRAPH_BASE_URL = `https://graph.instagram.com/${FACEBOOK_GRAPH_API_VERSION}`;

// Detecta automaticamente se está em desenvolvimento (Replit) ou produção
const isDevelopment = process.env.NODE_ENV === 'development';
const isDeployment = process.env.REPLIT_DEPLOYMENT === '1';
const REPLIT_DEV_URL = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : null;
const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://ugc.turbopartners.com.br';

// Em produção (deploy) usa URL de produção, em desenvolvimento usa URL do Replit
const BASE_URL = isDeployment ? PRODUCTION_URL : REPLIT_DEV_URL || PRODUCTION_URL;

console.log(
  `[Instagram Routes] Environment: ${isDeployment ? 'production' : 'development'}, Base URL: ${BASE_URL}`,
);

// Helper function for delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry fetch with exponential backoff for transient Meta API errors
// Uses 5s initial delay with 5 retries (6 total attempts), max 60s delay, handles rate limits
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 5,
  initialDelayMs: number = 5000,
): Promise<globalThis.Response> {
  let lastError: Error | null = null;
  let lastResponse: globalThis.Response | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Se a resposta foi OK, retorna imediatamente
      if (response.ok) {
        return response;
      }

      // Tenta parsear o erro para verificar se é transiente ou rate limit
      const clonedResponse = response.clone();
      const data = await clonedResponse.json().catch(() => null);

      // Também verifica HTTP 429 para rate limit
      if (response.status === 429 || data?.error?.code === 4 || data?.error?.code === 17) {
        const rateLimitDelay = 60000; // 1 minuto para rate limit
        console.log(
          `[Meta API] Rate limit detectado (status: ${response.status}, code: ${data?.error?.code}), aguardando ${rateLimitDelay / 1000}s...`,
        );
        lastResponse = response;
        if (attempt < maxRetries) {
          await delay(rateLimitDelay);
          continue;
        }
      }

      // Se for erro transiente da Meta (code 2), faz retry
      if (data?.error?.is_transient === true || data?.error?.code === 2) {
        const delayMs = initialDelayMs * Math.pow(2, attempt); // 5s, 10s, 20s, 40s, 80s
        const maxDelay = Math.min(delayMs, 60000); // Cap em 60 segundos
        console.log(
          `[Meta API] Erro transiente (code: ${data?.error?.code}), tentativa ${attempt + 1}/${maxRetries + 1}. Aguardando ${maxDelay / 1000}s...`,
        );
        lastResponse = response;
        if (attempt < maxRetries) {
          await delay(maxDelay);
          continue;
        }
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        const delayMs = initialDelayMs * Math.pow(2, attempt);
        const maxDelay = Math.min(delayMs, 60000);
        console.log(
          `[Meta API] Erro de rede, tentativa ${attempt + 1}/${maxRetries + 1}. Aguardando ${maxDelay / 1000}s...`,
        );
        await delay(maxDelay);
      }
    }
  }

  // Se ainda temos uma response (mesmo com erro), retorna ela para o caller decidir
  if (lastResponse) {
    console.log(`[Meta API] Retornando última resposta após ${maxRetries + 1} tentativas`);
    return lastResponse;
  }

  throw lastError || new Error('Máximo de tentativas excedido sem resposta');
}

// Cache de validação de tokens (evita chamadas repetidas)
const tokenValidationCache = new Map<string, { valid: boolean; checkedAt: number }>();
const TOKEN_CACHE_TTL_SUCCESS = 5 * 60 * 1000; // 5 minutos para tokens válidos
const TOKEN_CACHE_TTL_FAILURE = 60 * 1000; // 1 minuto para tokens inválidos (permite retry mais rápido)

async function isTokenValid(accessToken: string, instagramUserId: string): Promise<boolean> {
  // Usa hash do token completo para evitar colisões de suffix
  const tokenHash = Buffer.from(accessToken).toString('base64').slice(-20);
  const cacheKey = `${instagramUserId}:${tokenHash}`;
  const cached = tokenValidationCache.get(cacheKey);

  // Se validou recentemente, usa cache (TTL diferente para sucesso/falha)
  if (cached) {
    const ttl = cached.valid ? TOKEN_CACHE_TTL_SUCCESS : TOKEN_CACHE_TTL_FAILURE;
    if (Date.now() - cached.checkedAt < ttl) {
      console.log(
        `[Token Cache] Usando cache para ${instagramUserId}: ${cached.valid ? 'válido' : 'inválido'}`,
      );
      return cached.valid;
    }
  }

  try {
    const response = await fetchWithRetry(
      `${INSTAGRAM_GRAPH_BASE_URL}/${instagramUserId}?fields=id&access_token=${accessToken}`,
      {},
      3, // Menos retries para validação
      2000,
    );
    const data = await response.json();
    const isValid = !data.error;

    // Salva no cache (tanto sucesso quanto falha)
    tokenValidationCache.set(cacheKey, { valid: isValid, checkedAt: Date.now() });

    return isValid;
  } catch {
    // Cacheia falhas de rede também para evitar chamadas repetidas
    tokenValidationCache.set(cacheKey, { valid: false, checkedAt: Date.now() });
    return false;
  }
}

// Calculate Earned Media Value (EMV) based on reach and engagement
// Using Brazilian market values: R$ 0,02 per impression + R$ 0,50 per engagement
function calculateEMV(reach: number, engagement: number): number {
  const impressionValue = 0.02;
  const engagementValue = 0.5;
  return Math.round((reach * impressionValue + engagement * engagementValue) * 100) / 100;
}

// Analyze sentiment of a post using OpenAI
async function analyzeSentiment(
  caption: string,
  commentsText?: string,
): Promise<{
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  analysis: string;
  commentsAnalysis?: { positive: number; neutral: number; negative: number; summary: string };
}> {
  try {
    const prompt = `Analise o sentimento do seguinte post do Instagram e classifique como positivo, neutro ou negativo.

Caption do post:
"${caption || 'Sem legenda'}"

${commentsText ? `Comentários:\n${commentsText}` : ''}

Responda em JSON com o formato:
{
  "sentiment": "positive" | "neutral" | "negative",
  "score": número de -100 a 100 (negativo para sentimento ruim, positivo para bom),
  "analysis": "breve análise em português do sentimento geral",
  "commentsBreakdown": {
    "positive": porcentagem de comentários positivos,
    "neutral": porcentagem de comentários neutros,
    "negative": porcentagem de comentários negativos,
    "summary": "resumo dos comentários em português"
  }
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_completion_tokens: 500,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');

    return {
      sentiment: result.sentiment || 'neutral',
      score: result.score || 0,
      analysis: result.analysis || '',
      commentsAnalysis: result.commentsBreakdown,
    };
  } catch (error) {
    console.error('[Sentiment Analysis] Error:', error);
    return {
      sentiment: 'neutral',
      score: 0,
      analysis: 'Não foi possível analisar o sentimento',
    };
  }
}

// Helper function to get the correct redirect URI based on environment
// Usa BASE_URL que é automaticamente detectado (Replit dev ou produção)
function getInstagramRedirectUri(req: Request): string {
  const redirectUri = `${BASE_URL}/api/auth/instagram/callback`;
  console.log(`[Instagram OAuth] Using redirect URI: ${redirectUri}`);
  return redirectUri;
}

export function registerInstagramRoutes(app: Express) {
  app.get('/api/config/facebook-app-id', (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json({ appId: META_APP_ID || '' });
  });

  // Instagram Business Login - Start OAuth flow
  app.get('/api/auth/instagram/start', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.redirect('/auth?error=not_authenticated');
    }

    if (!INSTAGRAM_APP_ID) {
      console.error('[Instagram OAuth] INSTAGRAM_APP_ID not configured');
      return res.redirect('/company/integrations?error=config_missing');
    }

    // Determine connection type from query parameter or context
    // ?type=business -> connect to company
    // ?type=creator -> connect to creator profile
    const requestedType = (req.query.type as string) || '';
    const user = req.user!;

    let connectionType: 'business' | 'creator';
    let redirectOnError: string;

    // Explicit type requested via query param
    if (requestedType === 'business') {
      // User wants to connect as business - must have active company
      if (!req.session.activeCompanyId) {
        console.error('[Instagram OAuth] User tried to connect as business without active company');
        return res.redirect(
          '/company/integrations?error=no_company&message=' +
            encodeURIComponent('Você precisa ter uma empresa ativa para conectar como empresa'),
        );
      }
      connectionType = 'business';
      redirectOnError = '/company/integrations';
    } else if (requestedType === 'creator') {
      // User wants to connect as creator - must have creator role
      if (user.role !== 'creator' && !isAdminByEmail(user)) {
        console.error('[Instagram OAuth] User tried to connect as creator but is not a creator');
        return res.redirect(
          '/settings?error=not_creator&message=' +
            encodeURIComponent('Você precisa ser um criador para conectar como criador'),
        );
      }
      connectionType = 'creator';
      redirectOnError = '/settings';
    } else {
      // No explicit type - infer from user context
      // If user has active company selected, assume business
      // Otherwise, if user is a creator, assume creator
      if (req.session.activeCompanyId && (user.role === 'company' || isAdminByEmail(user))) {
        connectionType = 'business';
        redirectOnError = '/company/integrations';
      } else if (user.role === 'creator') {
        connectionType = 'creator';
        redirectOnError = '/settings';
      } else {
        // Default to business if user has any company
        connectionType = 'business';
        redirectOnError = '/company/integrations';
      }
    }

    const rawReturnTo = (req.query.returnTo as string) || '';
    const returnTo =
      rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//') ? rawReturnTo : '';
    console.log(
      `[Instagram OAuth] User ${user.id} connecting as ${connectionType}, activeCompany: ${req.session.activeCompanyId}, returnTo: ${returnTo}`,
    );

    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    req.session.instagramOAuthState = {
      nonce: state,
      userId: user.id,
      type: connectionType,
      timestamp: Date.now(),
      companyId: connectionType === 'business' ? req.session.activeCompanyId : undefined,
      returnTo: returnTo || undefined,
    };

    const scopes = [
      'instagram_business_basic',
      'instagram_business_manage_messages',
      'instagram_business_manage_comments',
      'instagram_business_content_publish',
      'instagram_business_manage_insights',
    ].join(',');

    const authUrl = new URL('https://www.instagram.com/oauth/authorize');
    authUrl.searchParams.set('force_reauth', 'true');
    authUrl.searchParams.set('client_id', INSTAGRAM_APP_ID);
    const redirectUri = getInstagramRedirectUri(req);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', state);

    console.log(
      `[Instagram OAuth] Starting OAuth for user ${req.user!.id}, redirect: ${redirectUri}`,
    );
    res.redirect(authUrl.toString());
  });

  // Instagram Business Login - OAuth callback
  app.get('/api/auth/instagram/callback', async (req: Request, res: Response) => {
    const { code, state, error, error_reason, error_description } = req.query;

    // Validate state for CSRF protection first
    const savedState = req.session.instagramOAuthState;

    // Determine redirect base based on user type (creator vs company) or returnTo
    const redirectBase =
      savedState?.returnTo ||
      (savedState?.type === 'creator' ? '/settings' : '/company/integrations');

    // Validate environment variables before proceeding
    if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET) {
      console.error('[Instagram OAuth] Missing INSTAGRAM_APP_ID or INSTAGRAM_APP_SECRET');
      return res.redirect(
        `${redirectBase}?error=config_error&message=${encodeURIComponent('Instagram não configurado corretamente')}`,
      );
    }

    // Handle user denial or errors from Instagram
    if (error) {
      console.error(
        '[Instagram OAuth] Error from Instagram:',
        error,
        error_reason,
        error_description,
      );
      return res.redirect(
        `${redirectBase}?error=oauth_denied&message=${encodeURIComponent(String(error_description || error))}`,
      );
    }

    if (!code || typeof code !== 'string') {
      console.error('[Instagram OAuth] No code received');
      return res.redirect(`${redirectBase}?error=no_code`);
    }

    if (!savedState || savedState.nonce !== state) {
      console.error('[Instagram OAuth] State mismatch - CSRF protection triggered');
      return res.redirect(`${redirectBase}?error=invalid_state`);
    }

    // Check if state is not expired (5 minutes)
    if (Date.now() - savedState.timestamp > 5 * 60 * 1000) {
      console.error('[Instagram OAuth] State expired');
      delete req.session.instagramOAuthState;
      return res.redirect(`${redirectBase}?error=state_expired`);
    }

    try {
      // Exchange code for short-lived token
      console.log('[Instagram OAuth] Exchanging code for token...');
      const callbackRedirectUri = getInstagramRedirectUri(req);
      const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: INSTAGRAM_APP_ID!,
          client_secret: INSTAGRAM_APP_SECRET!,
          grant_type: 'authorization_code',
          redirect_uri: callbackRedirectUri,
          code: code,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.error_type || tokenData.error_message) {
        console.error('[Instagram OAuth] Token exchange error:', tokenData);
        return res.redirect(
          `${redirectBase}?error=token_exchange&message=${encodeURIComponent(tokenData.error_message || 'Token exchange failed')}`,
        );
      }

      const shortLivedToken = tokenData.access_token;
      const instagramUserId = tokenData.user_id;

      if (!shortLivedToken || !instagramUserId) {
        console.error('[Instagram OAuth] Invalid token response:', tokenData);
        return res.redirect(`${redirectBase}?error=invalid_token_response`);
      }

      console.log('[Instagram OAuth] Got short-lived token, exchanging for long-lived...');

      // Exchange for long-lived token
      const llResponse = await fetch(
        `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${INSTAGRAM_APP_SECRET}&access_token=${shortLivedToken}`,
      );
      const llData = await llResponse.json();

      let longLivedToken = shortLivedToken;
      let expiresIn = 3600; // 1 hour for short-lived

      if (llData.access_token) {
        longLivedToken = llData.access_token;
        expiresIn = llData.expires_in || 5184000; // ~60 days
        console.log('[Instagram OAuth] Got long-lived token, expires in:', expiresIn, 'seconds');
      } else {
        console.warn(
          '[Instagram OAuth] Long-lived token exchange failed, using short-lived:',
          llData.error,
        );
      }

      // Get user profile
      const profileResponse = await fetch(
        `https://graph.instagram.com/me?fields=id,username,name,profile_picture_url,followers_count,follows_count,media_count,biography,website&access_token=${longLivedToken}`,
      );
      const profile = await profileResponse.json();

      if (profile.error) {
        console.error('[Instagram OAuth] Profile fetch error:', profile.error);
        return res.redirect(
          `${redirectBase}?error=profile_fetch&message=${encodeURIComponent(profile.error.message || 'Failed to fetch profile')}`,
        );
      }

      console.log(`[Instagram OAuth] Got profile: @${profile.username}, ID: ${profile.id}`);

      // Save or update account - usar profile.id (do /me) que é o ID correto
      // tokenData.user_id pode ser diferente do profile.id em alguns casos
      const correctInstagramUserId = profile.id;

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

      const existingAccount = await instagramService.getInstagramAccountByInstagramUserId(
        String(correctInstagramUserId),
      );

      if (existingAccount) {
        // Check ownership
        const isOwner =
          (savedState.type === 'creator' && existingAccount.userId === savedState.userId) ||
          (savedState.type === 'business' && existingAccount.companyId === savedState.companyId);

        if (!isOwner) {
          console.error('[Instagram OAuth] Account already connected to another user/company');
          return res.redirect(
            `${redirectBase}?error=account_taken&message=${encodeURIComponent('Esta conta já está conectada a outro usuário')}`,
          );
        }

        await instagramService.updateInstagramAccount(existingAccount.id, {
          accessToken: longLivedToken,
          accessTokenExpiresAt: expiresAt,
          username: profile.username,
          name: profile.name,
          profilePictureUrl: profile.profile_picture_url,
          followersCount: profile.followers_count,
          followsCount: profile.follows_count,
          mediaCount: profile.media_count,
          biography: profile.biography,
          website: profile.website,
          lastSyncAt: new Date(),
        });
        console.log(`[Instagram OAuth] Updated account: @${profile.username}`);
      } else {
        await instagramService.saveInstagramAccount({
          userId: savedState.type === 'creator' ? savedState.userId : null,
          companyId: savedState.type === 'business' ? savedState.companyId : null,
          instagramUserId: String(correctInstagramUserId),
          username: profile.username,
          name: profile.name,
          profilePictureUrl: profile.profile_picture_url,
          accountType: savedState.type,
          accessToken: longLivedToken,
          accessTokenExpiresAt: expiresAt,
          scopes: [
            'instagram_business_basic',
            'instagram_business_manage_messages',
            'instagram_business_manage_comments',
            'instagram_business_content_publish',
            'instagram_business_manage_insights',
          ],
          followersCount: profile.followers_count,
          followsCount: profile.follows_count,
          mediaCount: profile.media_count,
          biography: profile.biography,
          website: profile.website,
          lastSyncAt: new Date(),
        });
        console.log(`[Instagram OAuth] Created new account: @${profile.username}`);
      }

      // Aguardar propagação do token antes de qualquer sync automático
      console.log('[Instagram OAuth] Aguardando propagação do token (5s)...');
      await delay(5000);

      // Clean up session state
      delete req.session.instagramOAuthState;

      // Redirect back with success
      if (savedState.type === 'business' && savedState.companyId) {
        try {
          const existingCompany = await db
            .select({ logo: companies.logo })
            .from(companies)
            .where(eq(companies.id, savedState.companyId))
            .then((r) => r[0]);

          await db
            .update(companies)
            .set({
              instagram: profile.username,
              instagramProfilePic: profile.profile_picture_url,
              instagramFollowers: profile.followers_count,
              instagramFollowing: profile.follows_count,
              instagramPosts: profile.media_count,
              instagramBio: profile.biography,
              instagramVerified: false,
              instagramLastUpdated: new Date(),
              ...(!existingCompany?.logo && profile.profile_picture_url
                ? { logo: profile.profile_picture_url }
                : {}),
            })
            .where(eq(companies.id, savedState.companyId));
          console.log(
            `[Instagram OAuth] Updated company ${savedState.companyId} with Instagram data`,
          );
        } catch (err) {
          console.error(`[Instagram OAuth] Failed to update company with Instagram data:`, err);
        }
      }

      return res.redirect(
        `${redirectBase}?instagram_connected=true&username=${encodeURIComponent(profile.username)}&start_sync=true`,
      );
    } catch (error) {
      console.error('[Instagram OAuth] Callback error:', error);
      return res.redirect(
        `${redirectBase}?error=server_error&message=${encodeURIComponent('Erro interno ao conectar Instagram')}`,
      );
    }
  });

  app.post('/api/instagram/connect', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    try {
      const appAccessToken = `${META_APP_ID}|${META_APP_SECRET}`;
      const debugResponse = await fetch(
        `${FACEBOOK_GRAPH_BASE_URL}/debug_token?input_token=${accessToken}&access_token=${appAccessToken}`,
      );
      const debugData = await debugResponse.json();

      if (debugData.error || !debugData.data) {
        console.error('[Instagram Connect] Token debug error:', debugData.error);
        return res.status(400).json({ error: 'Token inválido ou expirado' });
      }

      if (debugData.data.app_id !== META_APP_ID) {
        console.error('[Instagram Connect] Token app_id mismatch:', debugData.data.app_id);
        return res.status(400).json({ error: 'Token não pertence a este aplicativo' });
      }

      if (!debugData.data.is_valid) {
        return res.status(400).json({ error: 'Token expirado ou revogado' });
      }

      const requiredScopes = [
        'pages_show_list',
        'instagram_basic',
        'instagram_manage_messages',
        'instagram_manage_comments',
        'instagram_manage_insights',
        'instagram_content_publish',
        'pages_read_engagement',
        'pages_messaging',
        'business_management',
      ];
      const tokenScopes = debugData.data.scopes || [];
      const missingScopes = requiredScopes.filter((s) => !tokenScopes.includes(s));
      if (missingScopes.length > 0) {
        console.error('[Instagram Connect] Missing scopes:', missingScopes);
        return res
          .status(400)
          .json({ error: `Permissões necessárias não concedidas: ${missingScopes.join(', ')}` });
      }

      const tokenUserId = debugData.data.user_id;

      const llTokenResponse = await fetch(
        `${FACEBOOK_GRAPH_BASE_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${accessToken}`,
      );
      const llTokenData = await llTokenResponse.json();

      if (llTokenData.error) {
        console.error('[Instagram Connect] Long-lived token exchange error:', llTokenData.error);
        return res.status(400).json({ error: 'Erro ao trocar token por versão de longa duração' });
      }

      const longLivedToken = llTokenData.access_token;
      const tokenExpiresIn = llTokenData.expires_in || 5184000;

      const pagesResponse = await fetch(
        `${FACEBOOK_GRAPH_BASE_URL}/me/accounts?access_token=${longLivedToken}`,
      );
      const pagesData = await pagesResponse.json();

      if (pagesData.error) {
        console.error('[Instagram Connect] Pages error:', pagesData.error);
        return res.status(400).json({ error: pagesData.error.message || 'Failed to get pages' });
      }

      if (!pagesData.data || pagesData.data.length === 0) {
        return res
          .status(400)
          .json({
            error:
              'Nenhuma página do Facebook encontrada. Você precisa ter uma Página vinculada à sua conta Instagram Business.',
          });
      }

      let connectedAccount = null;

      for (const page of pagesData.data) {
        const igResponse = await fetch(
          `${FACEBOOK_GRAPH_BASE_URL}/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`,
        );
        const igData = await igResponse.json();

        if (igData.instagram_business_account) {
          const igAccountId = igData.instagram_business_account.id;

          const profileResponse = await fetch(
            `${FACEBOOK_GRAPH_BASE_URL}/${igAccountId}?fields=id,username,name,profile_picture_url,followers_count,follows_count,media_count,biography,website&access_token=${page.access_token}`,
          );
          const profile = await profileResponse.json();

          if (profile.error) {
            console.error('[Instagram Connect] Profile error:', profile.error);
            continue;
          }

          const existingAccount = await instagramService.getInstagramAccountByInstagramUserId(
            profile.id,
          );
          const tokenExpiresAt = new Date(Date.now() + tokenExpiresIn * 1000);

          if (existingAccount) {
            const isOwner =
              (req.user!.role === 'creator' && existingAccount.userId === req.user!.id) ||
              (req.user!.role === 'company' &&
                existingAccount.companyId === req.session.activeCompanyId);

            if (!isOwner) {
              console.error(
                '[Instagram Connect] Account already connected to another user/company',
              );
              return res
                .status(400)
                .json({ error: 'Esta conta do Instagram já está conectada a outro usuário' });
            }

            if (existingAccount.facebookUserId && existingAccount.facebookUserId !== tokenUserId) {
              console.error(
                '[Instagram Connect] Facebook user_id mismatch - expected:',
                existingAccount.facebookUserId,
                'got:',
                tokenUserId,
              );
              return res
                .status(400)
                .json({
                  error: 'O token fornecido pertence a uma conta do Facebook diferente da original',
                });
            }

            await instagramService.updateInstagramAccount(existingAccount.id, {
              accessToken: page.access_token,
              accessTokenExpiresAt: tokenExpiresAt,
              facebookUserId: tokenUserId,
              scopes: tokenScopes,
              username: profile.username,
              name: profile.name,
              profilePictureUrl: profile.profile_picture_url,
              followersCount: profile.followers_count,
              followsCount: profile.follows_count,
              mediaCount: profile.media_count,
              biography: profile.biography,
              website: profile.website,
              lastSyncAt: new Date(),
            });
            connectedAccount = { ...existingAccount, username: profile.username };
          } else {
            const newAccountId = await instagramService.saveInstagramAccount({
              userId: req.user!.role === 'creator' ? req.user!.id : null,
              companyId: req.user!.role === 'company' ? req.session.activeCompanyId : null,
              instagramUserId: profile.id,
              facebookUserId: tokenUserId,
              username: profile.username,
              name: profile.name,
              profilePictureUrl: profile.profile_picture_url,
              accountType: req.user!.role === 'company' ? 'business' : 'creator',
              accessToken: page.access_token,
              accessTokenExpiresAt: tokenExpiresAt,
              scopes: tokenScopes,
              followersCount: profile.followers_count,
              followsCount: profile.follows_count,
              mediaCount: profile.media_count,
              biography: profile.biography,
              website: profile.website,
              lastSyncAt: new Date(),
            });
            connectedAccount = { id: newAccountId, username: profile.username };
          }

          console.log(`[Instagram Connect] Connected account: @${profile.username}`);
          break;
        }
      }

      if (!connectedAccount) {
        return res.status(400).json({
          error:
            'Nenhuma conta Instagram Business encontrada. Certifique-se de que sua conta Instagram está vinculada a uma Página do Facebook.',
        });
      }

      res.json({
        success: true,
        account: connectedAccount,
      });
    } catch (error) {
      console.error('[Instagram Connect] Error:', error);
      res.status(500).json({ error: 'Erro ao conectar conta do Instagram' });
    }
  });

  app.post('/api/instagram/import-token', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { accessToken, instagramUserId, username } = req.body;
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    try {
      const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
      const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;

      let longLivedToken = accessToken;
      let expiresIn = 5184000;

      try {
        const llResponse = await fetch(
          `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${INSTAGRAM_APP_SECRET}&access_token=${accessToken}`,
        );
        const llData = await llResponse.json();

        if (llData.access_token) {
          longLivedToken = llData.access_token;
          expiresIn = llData.expires_in || 5184000;
          console.log('[Instagram Import] Exchanged for long-lived token');
        } else if (llData.error) {
          console.log(
            '[Instagram Import] Token might already be long-lived:',
            llData.error?.message,
          );
        }
      } catch (e) {
        console.log('[Instagram Import] Token exchange skipped, using provided token');
      }

      let profile;
      try {
        const profileResponse = await fetch(
          `https://graph.instagram.com/me?fields=id,username,name,profile_picture_url,followers_count,follows_count,media_count,biography,website&access_token=${longLivedToken}`,
        );
        profile = await profileResponse.json();

        if (profile.error) {
          console.error('[Instagram Import] Profile fetch error:', profile.error);
          return res
            .status(400)
            .json({ error: profile.error.message || 'Erro ao buscar perfil do Instagram' });
        }
      } catch (e) {
        console.error('[Instagram Import] Profile fetch exception:', e);
        return res.status(400).json({ error: 'Erro ao validar token' });
      }

      const type = req.user!.role === 'company' ? 'business' : 'creator';
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

      const existingAccount = await instagramService.getInstagramAccountByInstagramUserId(
        profile.id,
      );

      if (existingAccount) {
        await instagramService.updateInstagramAccount(existingAccount.id, {
          accessToken: longLivedToken,
          accessTokenExpiresAt: expiresAt,
          username: profile.username,
          name: profile.name,
          profilePictureUrl: profile.profile_picture_url,
          followersCount: profile.followers_count,
          followsCount: profile.follows_count,
          mediaCount: profile.media_count,
          biography: profile.biography,
          website: profile.website,
          lastSyncAt: new Date(),
        });
        console.log(`[Instagram Import] Updated account: @${profile.username}`);
      } else {
        await instagramService.saveInstagramAccount({
          userId: type === 'creator' ? req.user!.id : null,
          companyId: type === 'business' ? req.session.activeCompanyId : null,
          instagramUserId: profile.id,
          username: profile.username,
          name: profile.name,
          profilePictureUrl: profile.profile_picture_url,
          accountType: type,
          accessToken: longLivedToken,
          accessTokenExpiresAt: expiresAt,
          scopes: [
            'instagram_business_basic',
            'instagram_business_manage_messages',
            'instagram_business_manage_comments',
            'instagram_business_content_publish',
            'instagram_business_manage_insights',
          ],
          followersCount: profile.followers_count,
          followsCount: profile.follows_count,
          mediaCount: profile.media_count,
          biography: profile.biography,
          website: profile.website,
          lastSyncAt: new Date(),
        });
        console.log(`[Instagram Import] Created account: @${profile.username}`);
      }

      res.json({
        success: true,
        account: {
          username: profile.username,
          id: profile.id,
        },
      });
    } catch (error) {
      console.error('[Instagram Import] Error:', error);
      res.status(500).json({ error: 'Erro ao importar conta do Instagram' });
    }
  });

  // Legacy /api/auth/instagram endpoint - redirect to new flow
  app.get('/api/auth/instagram', (req: Request, res: Response) => {
    res.redirect('/api/auth/instagram/start');
  });

  app.get('/api/auth/facebook/callback', async (req: Request, res: Response) => {
    try {
      const { code, state, error, error_description } = req.query;

      if (error) {
        console.error('[Facebook OAuth] Error:', error, error_description);
        return res.redirect(
          `/company/settings?error=${encodeURIComponent(String(error_description || error))}`,
        );
      }

      if (!code || !state) {
        return res.redirect('/company/settings?error=missing_params');
      }

      let decodedState;
      try {
        decodedState = JSON.parse(Buffer.from(String(state), 'base64').toString());
      } catch {
        console.error('[Facebook OAuth] Invalid state format');
        return res.redirect('/company/settings?error=invalid_state');
      }

      const { nonce, timestamp } = decodedState;
      const storedState = req.session.instagramOAuthState;

      if (!storedState || storedState.nonce !== nonce) {
        console.error('[Facebook OAuth] Invalid or missing state');
        return res.redirect('/company/settings?error=invalid_state');
      }

      const maxAge = 10 * 60 * 1000;
      if (Date.now() - timestamp > maxAge) {
        console.error('[Facebook OAuth] State expired');
        return res.redirect('/company/settings?error=state_expired');
      }

      delete req.session.instagramOAuthState;

      const tokenResponse = await instagramService.exchangeCodeForToken(String(code), 'business');

      const pagesResponse = await fetch(
        `https://graph.facebook.com/v21.0/me/accounts?access_token=${tokenResponse.access_token}`,
      );
      const pagesData = await pagesResponse.json();

      if (!pagesData.data || pagesData.data.length === 0) {
        return res.redirect('/company/settings?error=no_pages');
      }

      for (const page of pagesData.data) {
        const instagramAccountId = await instagramService.getInstagramBusinessAccountFromPage(
          tokenResponse.access_token,
          page.id,
        );

        if (instagramAccountId) {
          const profile = await instagramService.getUserProfile(
            page.access_token,
            instagramAccountId,
          );

          const existingAccount = await instagramService.getInstagramAccountByInstagramUserId(
            profile.id,
          );

          if (existingAccount) {
            await instagramService.updateInstagramAccount(existingAccount.id, {
              accessToken: page.access_token,
              username: profile.username,
              name: profile.name,
              profilePictureUrl: profile.profile_picture_url,
              followersCount: profile.followers_count,
              followsCount: profile.follows_count,
              mediaCount: profile.media_count,
              biography: profile.biography,
              website: profile.website,
              lastSyncAt: new Date(),
            });
          } else {
            await instagramService.saveInstagramAccount({
              userId: null,
              companyId: req.session.activeCompanyId,
              instagramUserId: profile.id,
              username: profile.username,
              name: profile.name,
              profilePictureUrl: profile.profile_picture_url,
              accountType: 'business',
              accessToken: page.access_token,
              scopes: [
                'instagram_basic',
                'instagram_manage_insights',
                'instagram_manage_comments',
                'instagram_manage_messages',
                'instagram_content_publish',
                'pages_read_engagement',
                'business_management',
              ],
              followersCount: profile.followers_count,
              followsCount: profile.follows_count,
              mediaCount: profile.media_count,
              biography: profile.biography,
              website: profile.website,
              lastSyncAt: new Date(),
            });
          }

          // Save Instagram profile pic as company logo
          if (profile.username && req.session.activeCompanyId) {
            try {
              const { getOrFetchProfilePic } = await import('../services/instagram-profile-pic');
              const profilePicResult = await getOrFetchProfilePic(profile.username.toLowerCase());

              if (profilePicResult.publicUrl) {
                await db
                  .update(companies)
                  .set({ logo: profilePicResult.publicUrl })
                  .where(eq(companies.id, req.session.activeCompanyId));
                console.log(
                  `[Instagram] Updated company logo from Instagram profile: ${profile.username}`,
                );
              }
            } catch (logoError) {
              console.error('[Instagram] Failed to save profile pic as company logo:', logoError);
            }
          }

          console.log(`[Instagram] Linked business account: ${profile.username}`);
          break;
        }
      }

      res.redirect('/company/settings?instagram=connected');
    } catch (error) {
      console.error('[Facebook OAuth] Callback error:', error);
      res.redirect(`/company/settings?error=${encodeURIComponent('Failed to connect Instagram')}`);
    }
  });

  // Health check endpoint para verificar status da conexão Instagram
  app.get('/api/instagram/health', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    try {
      const userId = req.user!.id;
      let account;

      // Prioriza conta da empresa se tiver uma ativa
      if (req.session.activeCompanyId) {
        account = await instagramService.getInstagramAccountByCompanyId(
          req.session.activeCompanyId,
        );
      }
      if (!account) {
        account = await instagramService.getInstagramAccountByUserId(userId);
      }

      if (!account) {
        return res.json({
          status: 'disconnected',
          message: 'Instagram não conectado',
        });
      }

      // Tenta uma chamada simples para validar o token
      const valid = await isTokenValid(account.accessToken, account.instagramUserId);

      if (valid) {
        return res.json({
          status: 'healthy',
          username: account.username,
          lastSync: account.lastSyncAt,
          tokenExpiresAt: account.accessTokenExpiresAt,
          followersCount: account.followersCount,
        });
      } else {
        return res.json({
          status: 'unhealthy',
          message: 'Token inválido ou API instável. Tente reconectar.',
          username: account.username,
        });
      }
    } catch (error) {
      console.error('[Instagram Health] Error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Erro ao verificar status',
      });
    }
  });

  app.get('/api/instagram/account', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      let account;
      // Check if user has an active company selected - prioritize company account
      if (req.session.activeCompanyId) {
        account = await instagramService.getInstagramAccountByCompanyId(
          req.session.activeCompanyId,
        );
      }
      // If no company account found, check for user's personal account
      if (!account) {
        account = await instagramService.getInstagramAccountByUserId(req.user!.id);
      }

      if (!account) {
        return res.json({ connected: false });
      }

      res.json({
        connected: true,
        account: {
          id: account.id,
          username: account.username,
          name: account.name,
          profilePictureUrl: account.profilePictureUrl,
          followersCount: account.followersCount,
          followsCount: account.followsCount,
          mediaCount: account.mediaCount,
          isActive: account.isActive,
          lastSyncAt: account.lastSyncAt,
        },
      });
    } catch (error) {
      console.error('[Instagram] Get account error:', error);
      res.status(500).json({ error: 'Failed to get Instagram account' });
    }
  });

  app.delete('/api/instagram/account', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      let account;
      // Check if user has an active company selected - prioritize company account
      if (req.session.activeCompanyId) {
        account = await instagramService.getInstagramAccountByCompanyId(
          req.session.activeCompanyId,
        );
      }
      // If no company account found, check for user's personal account
      if (!account) {
        account = await instagramService.getInstagramAccountByUserId(req.user!.id);
      }

      if (!account) {
        return res.status(404).json({ error: 'No Instagram account connected' });
      }

      if (account.userId !== req.user!.id && account.companyId !== req.session.activeCompanyId) {
        return res.status(403).json({ error: 'Not authorized to delete this account' });
      }

      await instagramService.deleteInstagramAccount(account.id);
      res.json({ success: true });
    } catch (error) {
      console.error('[Instagram] Delete account error:', error);
      res.status(500).json({ error: 'Failed to disconnect Instagram account' });
    }
  });

  // Get posts where the brand was tagged by creators
  app.get('/api/instagram/tagged-posts', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const companyId = req.session.activeCompanyId;
    const userId = req.user!.id;
    if (!companyId) {
      return res.status(400).json({ error: 'No active company selected' });
    }

    try {
      const account = await instagramService.getInstagramAccountByCompanyId(companyId);

      if (!account) {
        return res.json({ posts: [], message: 'No Instagram account connected' });
      }

      if (!account.accessToken || !account.instagramUserId) {
        return res.json({ posts: [], message: 'Instagram account not properly configured' });
      }

      const accessToken = account.accessToken;

      // Fetch tagged posts using the updated getMentions method
      const taggedPosts = await instagramService.getMentions(accessToken, account.instagramUserId);

      // Get existing posts from database to check for new ones
      const existingPosts = await db
        .select({ postId: instagramTaggedPosts.postId })
        .from(instagramTaggedPosts)
        .where(eq(instagramTaggedPosts.instagramAccountId, account.id));

      const existingPostIds = new Set(existingPosts.map((p) => p.postId));

      // Process posts and save new ones
      const postsWithInsights = await Promise.all(
        taggedPosts.slice(0, 20).map(async (post: any) => {
          let insights = null;
          try {
            insights = await instagramService.getMediaInsights(accessToken, post.id);
          } catch (e) {
            // Insights may not be available for all posts
          }

          // Calculate estimated EMV (Earned Media Value) using impressions + engagement
          const engagement = (post.like_count || 0) + (post.comments_count || 0);
          const impressions = insights?.impressions || engagement * 10;
          const emvValue = calculateEMV(impressions, engagement);
          const emvCents = Math.round(emvValue * 100);

          const isNewPost = !existingPostIds.has(post.id);

          // Check if post exists in database
          const existingPost = await db
            .select()
            .from(instagramTaggedPosts)
            .where(
              and(
                eq(instagramTaggedPosts.instagramAccountId, account.id),
                eq(instagramTaggedPosts.postId, post.id),
              ),
            )
            .limit(1);

          let savedPost = existingPost[0];

          if (!savedPost) {
            // New post - save to database
            const [newPost] = await db
              .insert(instagramTaggedPosts)
              .values({
                instagramAccountId: account.id,
                postId: post.id,
                username: post.username,
                mediaType: post.media_type,
                mediaUrl: post.media_url,
                permalink: post.permalink,
                caption: post.caption,
                timestamp: post.timestamp ? new Date(post.timestamp) : null,
                likes: post.like_count || 0,
                comments: post.comments_count || 0,
                impressions: insights?.impressions || null,
                reach: insights?.reach || null,
                engagement: insights?.engagement || null,
                saved: insights?.saved || null,
                emv: emvCents,
                isNotified: false,
              })
              .returning();

            savedPost = newPost;

            // Create notification for new post
            await db.insert(notifications).values({
              userId,
              type: 'new_instagram_post',
              title: `Nova menção de @${post.username}`,
              message: `${post.username} mencionou sua marca em um novo post no Instagram.`,
              actionUrl: `/company/brand/tracking?tab=posts`,
              metadata: {
                postId: post.id,
                username: post.username,
                permalink: post.permalink,
                mediaUrl: post.media_url,
              },
            });

            console.log(`[Instagram] New tagged post detected from @${post.username}`);

            // Analyze sentiment for new posts (async, don't block response)
            if (post.caption) {
              analyzeSentiment(post.caption)
                .then(async (sentimentResult) => {
                  await db
                    .update(instagramTaggedPosts)
                    .set({
                      sentiment: sentimentResult.sentiment,
                      sentimentScore: sentimentResult.score,
                      sentimentAnalysis: sentimentResult.analysis,
                      commentsAnalysis: sentimentResult.commentsAnalysis,
                    })
                    .where(eq(instagramTaggedPosts.id, newPost.id));
                })
                .catch((err) => console.error('[Sentiment] Analysis error:', err));
            }
          } else {
            // Update existing post metrics
            await db
              .update(instagramTaggedPosts)
              .set({
                likes: post.like_count || 0,
                comments: post.comments_count || 0,
                impressions: insights?.impressions || null,
                reach: insights?.reach || null,
                engagement: insights?.engagement || null,
                saved: insights?.saved || null,
                emv: emvCents,
              })
              .where(eq(instagramTaggedPosts.id, savedPost.id));
          }

          return {
            id: post.id,
            username: post.username,
            mediaType: post.media_type,
            mediaUrl: post.media_url,
            permalink: post.permalink,
            caption: post.caption,
            timestamp: post.timestamp,
            likes: post.like_count || 0,
            comments: post.comments_count || 0,
            impressions: insights?.impressions || null,
            reach: insights?.reach || null,
            engagement: insights?.engagement || null,
            saved: insights?.saved || null,
            emv: emvValue,
            sentiment: savedPost?.sentiment || null,
            sentimentScore: savedPost?.sentimentScore || null,
            sentimentAnalysis: savedPost?.sentimentAnalysis || null,
            isNew: isNewPost,
          };
        }),
      );

      res.json({
        posts: postsWithInsights,
        totalCount: taggedPosts.length,
        accountUsername: account.username,
      });
    } catch (error) {
      console.error('[Instagram] Get tagged posts error:', error);
      res.status(500).json({ error: 'Failed to fetch tagged posts' });
    }
  });

  app.get('/api/instagram/webhooks', (req: Request, res: Response) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('[Instagram Webhook] Verification request:', { mode, token });

    if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
      console.log('[Instagram Webhook] Verified successfully');
      res.status(200).send(challenge);
    } else {
      console.log('[Instagram Webhook] Verification failed');
      res.sendStatus(403);
    }
  });

  app.post('/api/instagram/webhooks', async (req: Request, res: Response) => {
    try {
      if (META_APP_SECRET && !verifyWebhookSignature(req)) {
        console.error('[Instagram Webhook] Invalid signature');
        return res.sendStatus(401);
      }

      const { object, entry } = req.body;

      console.log('[Instagram Webhook] Received:', JSON.stringify(req.body, null, 2));

      if (object !== 'instagram') {
        return res.sendStatus(200);
      }

      for (const entryItem of entry || []) {
        const instagramUserId = entryItem.id;

        const account =
          await instagramService.getInstagramAccountByInstagramUserId(instagramUserId);

        for (const change of entryItem.changes || []) {
          console.log(
            `[Instagram Webhook] Received change event: ${change.field}`,
            JSON.stringify(change.value),
          );
        }

        for (const messaging of entryItem.messaging || []) {
          if (messaging.message && account) {
            // Use centralized helper to determine if message is incoming
            const isIncoming = isMessageIncoming({
              senderId: messaging.sender.id,
              accountUsername: account.username,
              accountInstagramUserId: account.instagramUserId,
              accountFacebookUserId: account.facebookUserId,
            });

            const savedMessage = await instagramService.saveMessage({
              instagramAccountId: account.id,
              conversationId: messaging.sender.id + '_' + messaging.recipient.id,
              messageId: messaging.message.mid,
              senderId: messaging.sender.id,
              recipientId: messaging.recipient.id,
              messageText: messaging.message.text,
              messageType: messaging.message.attachments ? 'attachment' : 'text',
              attachments: messaging.message.attachments,
              isIncoming,
              sentAt: new Date(messaging.timestamp),
            });

            // Send real-time notification to company users via WebSocket
            if (account.companyId) {
              try {
                const { notificationWS } = await import('../websocket');
                const { db } = await import('../db');
                const { companyMembers } = await import('@shared/schema');
                const { eq } = await import('drizzle-orm');

                // Get all company members to notify
                const members = await db
                  .select()
                  .from(companyMembers)
                  .where(eq(companyMembers.companyId, account.companyId));

                for (const member of members) {
                  notificationWS.sendEventToUser(member.userId, {
                    type: 'instagram_dm',
                    data: {
                      conversationId: messaging.sender.id + '_' + messaging.recipient.id,
                      senderId: messaging.sender.id,
                      messageText: messaging.message.text,
                      messageType: messaging.message.attachments ? 'attachment' : 'text',
                      timestamp: messaging.timestamp,
                    },
                  });
                }
                console.log(
                  `[Instagram Webhook] Notified ${members.length} company members of new DM`,
                );
              } catch (err) {
                console.error('[Instagram Webhook] Error sending WebSocket notification:', err);
              }
            }
          }
        }
      }

      res.sendStatus(200);
    } catch (error) {
      console.error('[Instagram Webhook] Error processing:', error);
      res.sendStatus(200);
    }
  });

  // ============ CREATOR INSIGHTS ENDPOINTS ============

  // Get creator's Instagram profile insights
  app.get('/api/instagram/creator/insights', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = req.user!;
    if (user.role !== 'creator' && !isAdminByEmail(user)) {
      return res.status(403).json({ error: 'Only creators can access this endpoint' });
    }

    try {
      const account = await instagramService.getInstagramAccountByUserId(user.id);
      if (!account) {
        return res.status(404).json({ error: 'Instagram account not connected' });
      }

      // Fetch profile insights from Instagram Graph API with retry for transient errors
      const period = (req.query.period as string) || 'day';
      const metrics = ['impressions', 'reach', 'follower_count'].join(',');

      const insightsResponse = await fetchWithRetry(
        `${INSTAGRAM_GRAPH_BASE_URL}/${account.instagramUserId}/insights?metric=${metrics}&period=${period}&access_token=${account.accessToken}`,
      );
      const insightsData = await insightsResponse.json();

      if (insightsData.error) {
        console.error('[Instagram Insights] API error:', insightsData.error);
        if (insightsData.error.is_transient) {
          return res.status(503).json({
            error: 'Instagram API temporariamente indisponível. Tente novamente em alguns minutos.',
            code: 'TRANSIENT_ERROR',
            isRetryable: true,
            retryAfter: 60,
          });
        }
        return res.status(400).json({
          error: insightsData.error.message || 'Failed to fetch insights',
          code: insightsData.error.code,
        });
      }

      // Also fetch current profile stats with retry
      const profileResponse = await fetchWithRetry(
        `${INSTAGRAM_GRAPH_BASE_URL}/${account.instagramUserId}?fields=followers_count,follows_count,media_count,username,name,profile_picture_url,biography&access_token=${account.accessToken}`,
      );
      const profileData = await profileResponse.json();

      if (profileData.error) {
        console.error('[Instagram Insights] Profile API error:', profileData.error);
        if (profileData.error.is_transient) {
          return res.status(503).json({
            error: 'Instagram API temporariamente indisponível. Tente novamente em alguns minutos.',
            code: 'TRANSIENT_ERROR',
            isRetryable: true,
            retryAfter: 60,
          });
        }
        // If token expired, return 401
        if (profileData.error.code === 190) {
          return res.status(401).json({
            error: 'Instagram token expired. Please reconnect your account.',
            code: 'TOKEN_EXPIRED',
          });
        }
        return res.status(400).json({
          error: profileData.error.message || 'Failed to fetch profile',
          code: profileData.error.code,
        });
      }

      // Update stored follower count
      if (profileData.followers_count) {
        await instagramService.updateInstagramAccount(account.id, {
          followersCount: profileData.followers_count,
          followsCount: profileData.follows_count,
          mediaCount: profileData.media_count,
          lastSyncAt: new Date(),
        });
      }

      res.json({
        profile: {
          username: profileData.username || account.username,
          name: profileData.name || account.name,
          profilePictureUrl: profileData.profile_picture_url || account.profilePictureUrl,
          followersCount: profileData.followers_count || account.followersCount,
          followsCount: profileData.follows_count || account.followsCount,
          mediaCount: profileData.media_count || account.mediaCount,
          biography: profileData.biography || account.biography,
        },
        insights: insightsData.data || [],
        period,
      });
    } catch (error) {
      console.error('[Instagram Insights] Error:', error);
      res.status(500).json({ error: 'Failed to fetch insights' });
    }
  });

  // Get creator's media (posts) with basic metrics
  app.get('/api/instagram/creator/media', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = req.user!;
    if (user.role !== 'creator' && !isAdminByEmail(user)) {
      return res.status(403).json({ error: 'Only creators can access this endpoint' });
    }

    try {
      const account = await instagramService.getInstagramAccountByUserId(user.id);
      if (!account) {
        return res.status(404).json({ error: 'Instagram account not connected' });
      }

      const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
      const after = req.query.after as string;

      let url = `${INSTAGRAM_GRAPH_BASE_URL}/${account.instagramUserId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=${limit}&access_token=${account.accessToken}`;

      if (after) {
        url += `&after=${after}`;
      }

      const mediaResponse = await fetchWithRetry(url);
      const mediaData = await mediaResponse.json();

      if (mediaData.error) {
        console.error('[Instagram Media] API error:', mediaData.error);
        if (mediaData.error.is_transient) {
          return res.status(503).json({
            error: 'Instagram API temporariamente indisponível. Tente novamente em alguns minutos.',
            code: 'TRANSIENT_ERROR',
            isRetryable: true,
            retryAfter: 60,
          });
        }
        return res.status(400).json({
          error: mediaData.error.message || 'Failed to fetch media',
          code: mediaData.error.code,
        });
      }

      res.json({
        media: mediaData.data || [],
        paging: mediaData.paging || null,
      });
    } catch (error) {
      console.error('[Instagram Media] Error:', error);
      res.status(500).json({ error: 'Failed to fetch media' });
    }
  });

  // Get insights for a specific media (post/reel)
  app.get('/api/instagram/creator/media/:mediaId/insights', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = req.user!;
    if (user.role !== 'creator' && !isAdminByEmail(user)) {
      return res.status(403).json({ error: 'Only creators can access this endpoint' });
    }

    const { mediaId } = req.params;
    if (!mediaId) {
      return res.status(400).json({ error: 'Media ID is required' });
    }

    try {
      const account = await instagramService.getInstagramAccountByUserId(user.id);
      if (!account) {
        return res.status(404).json({ error: 'Instagram account not connected' });
      }

      // Metrics for posts: impressions, reach, engagement, saved (standard for feed posts)
      // Note: Different metrics available for different media types (Reels have different metrics)
      const metrics = 'impressions,reach,saved';

      const insightsResponse = await fetchWithRetry(
        `${INSTAGRAM_GRAPH_BASE_URL}/${mediaId}/insights?metric=${metrics}&access_token=${account.accessToken}`,
      );
      const insightsData = await insightsResponse.json();

      if (insightsData.error) {
        console.error('[Instagram Media Insights] API error:', insightsData.error);
        if (insightsData.error.is_transient) {
          return res.status(503).json({
            error: 'Instagram API temporariamente indisponível. Tente novamente em alguns minutos.',
            code: 'TRANSIENT_ERROR',
            isRetryable: true,
            retryAfter: 60,
          });
        }
        return res.status(400).json({
          error: insightsData.error.message || 'Failed to fetch media insights',
          code: insightsData.error.code,
        });
      }

      res.json({
        mediaId,
        insights: insightsData.data || [],
      });
    } catch (error) {
      console.error('[Instagram Media Insights] Error:', error);
      res.status(500).json({ error: 'Failed to fetch media insights' });
    }
  });

  // Get audience demographics (for creators with 100+ followers)
  app.get('/api/instagram/creator/audience', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = req.user!;
    if (user.role !== 'creator' && !isAdminByEmail(user)) {
      return res.status(403).json({ error: 'Only creators can access this endpoint' });
    }

    try {
      const account = await instagramService.getInstagramAccountByUserId(user.id);
      if (!account) {
        return res.status(404).json({ error: 'Instagram account not connected' });
      }

      // Audience demographics metrics
      const metrics = [
        'audience_city',
        'audience_country',
        'audience_gender_age',
        'audience_locale',
      ].join(',');

      const insightsResponse = await fetchWithRetry(
        `${INSTAGRAM_GRAPH_BASE_URL}/${account.instagramUserId}/insights?metric=${metrics}&period=lifetime&access_token=${account.accessToken}`,
      );
      const insightsData = await insightsResponse.json();

      if (insightsData.error) {
        console.error('[Instagram Audience] API error:', insightsData.error);
        if (insightsData.error.is_transient) {
          return res.status(503).json({
            error: 'Instagram API temporariamente indisponível. Tente novamente em alguns minutos.',
            code: 'TRANSIENT_ERROR',
            isRetryable: true,
            retryAfter: 60,
          });
        }
        // If error code 100, likely less than 100 followers
        if (insightsData.error.code === 100) {
          return res.status(400).json({
            error: 'Audience demographics require at least 100 followers',
            code: 'INSUFFICIENT_FOLLOWERS',
          });
        }
        return res.status(400).json({
          error: insightsData.error.message || 'Failed to fetch audience data',
          code: insightsData.error.code,
        });
      }

      // Parse and structure the audience data
      const audienceData: Record<string, any> = {};
      for (const metric of insightsData.data || []) {
        audienceData[metric.name] = metric.values?.[0]?.value || {};
      }

      res.json({
        audience: audienceData,
      });
    } catch (error) {
      console.error('[Instagram Audience] Error:', error);
      res.status(500).json({ error: 'Failed to fetch audience data' });
    }
  });

  // ============ BRAND ENDPOINTS - View Creator Metrics ============

  // Get a specific creator's Instagram metrics (for brands viewing campaign applicants)
  app.get('/api/instagram/creator/:userId/public-metrics', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { userId } = req.params;
    const requestingUser = req.user!;

    // Only companies/admins can view other creators' metrics
    if (requestingUser.role !== 'company' && !isAdminByEmail(requestingUser)) {
      return res.status(403).json({ error: 'Only companies can view creator metrics' });
    }

    try {
      const targetUserId = parseInt(userId);
      if (isNaN(targetUserId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const account = await instagramService.getInstagramAccountByUserId(targetUserId);
      if (!account) {
        return res.status(404).json({ error: 'Creator has not connected Instagram' });
      }

      // Return only public/cached metrics - don't make API calls with creator's token
      res.json({
        username: account.username,
        name: account.name,
        profilePictureUrl: account.profilePictureUrl,
        followersCount: account.followersCount,
        followsCount: account.followsCount,
        mediaCount: account.mediaCount,
        biography: account.biography,
        lastSyncAt: account.lastSyncAt,
      });
    } catch (error) {
      console.error('[Instagram Public Metrics] Error:', error);
      res.status(500).json({ error: 'Failed to fetch creator metrics' });
    }
  });

  // ============ SYNC ENDPOINT - Trigger all API calls for Meta verification ============

  app.post('/api/instagram/sync', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = req.user!;

    try {
      // For creators - sync their own account
      if (user.role === 'creator' || isAdminByEmail(user)) {
        const account = await instagramService.getInstagramAccountByUserId(user.id);
        if (!account) {
          return res.status(404).json({ error: 'Instagram account not connected' });
        }

        if (!account.accessToken) {
          return res.status(400).json({ error: 'No access token available' });
        }

        const results: { endpoint: string; status: string; data?: any; error?: string }[] = [];

        // 1. Fetch profile (instagram_business_basic) - Use Instagram Graph API with retry
        try {
          const profileResponse = await fetchWithRetry(
            `${INSTAGRAM_GRAPH_BASE_URL}/${account.instagramUserId}?fields=followers_count,follows_count,media_count,username,name,profile_picture_url,biography&access_token=${account.accessToken}`,
          );
          const profileData = await profileResponse.json();

          if (profileData.error) {
            const errorMsg = profileData.error.is_transient
              ? 'API temporariamente instável. Tente novamente.'
              : profileData.error.message;
            results.push({ endpoint: 'profile', status: 'error', error: errorMsg });
          } else {
            // Update stored data
            await instagramService.updateInstagramAccount(account.id, {
              followersCount: profileData.followers_count,
              followsCount: profileData.follows_count,
              mediaCount: profileData.media_count,
              lastSyncAt: new Date(),
            });
            results.push({
              endpoint: 'profile',
              status: 'success',
              data: { username: profileData.username, followers: profileData.followers_count },
            });
          }
        } catch (e: any) {
          results.push({ endpoint: 'profile', status: 'error', error: e.message });
        }

        // 2. Fetch insights (instagram_business_manage_insights)
        try {
          const insightsResponse = await fetchWithRetry(
            `${INSTAGRAM_GRAPH_BASE_URL}/${account.instagramUserId}/insights?metric=reach,follower_count,accounts_engaged,profile_views&period=day&access_token=${account.accessToken}`,
          );
          const insightsData = await insightsResponse.json();

          if (insightsData.error) {
            const errorMsg = insightsData.error.is_transient
              ? 'API temporariamente instável. Tente novamente.'
              : insightsData.error.message;
            results.push({ endpoint: 'insights', status: 'error', error: errorMsg });
          } else {
            results.push({
              endpoint: 'insights',
              status: 'success',
              data: { metricsCount: insightsData.data?.length || 0 },
            });
          }
        } catch (e: any) {
          results.push({ endpoint: 'insights', status: 'error', error: e.message });
        }

        // 3. Fetch media (instagram_business_basic)
        try {
          const mediaResponse = await fetchWithRetry(
            `${INSTAGRAM_GRAPH_BASE_URL}/${account.instagramUserId}/media?fields=id,caption,media_type,like_count,comments_count,timestamp&limit=10&access_token=${account.accessToken}`,
          );
          const mediaData = await mediaResponse.json();

          if (mediaData.error) {
            const errorMsg = mediaData.error.is_transient
              ? 'API temporariamente instável. Tente novamente.'
              : mediaData.error.message;
            results.push({ endpoint: 'media', status: 'error', error: errorMsg });
          } else {
            results.push({
              endpoint: 'media',
              status: 'success',
              data: { postsCount: mediaData.data?.length || 0 },
            });
          }
        } catch (e: any) {
          results.push({ endpoint: 'media', status: 'error', error: e.message });
        }

        // 4. Fetch comments from recent media items (instagram_business_manage_comments)
        try {
          const mediaResponse = await fetchWithRetry(
            `${INSTAGRAM_GRAPH_BASE_URL}/${account.instagramUserId}/media?fields=id&limit=10&access_token=${account.accessToken}`,
          );
          const mediaData = await mediaResponse.json();

          if (mediaData.data && mediaData.data.length > 0) {
            let totalComments = 0;
            // Process up to 10 recent posts for comments
            const commentsPromises = mediaData.data.slice(0, 10).map(async (media: any) => {
              try {
                const commentsResponse = await fetchWithRetry(
                  `${INSTAGRAM_GRAPH_BASE_URL}/${media.id}/comments?limit=10&access_token=${account.accessToken}`,
                );
                const commentsData = await commentsResponse.json();
                if (!commentsData.error && commentsData.data) {
                  return commentsData.data.length;
                }
                return 0;
              } catch {
                return 0;
              }
            });

            const commentsCounts = await Promise.all(commentsPromises);
            totalComments = commentsCounts.reduce((sum, count) => sum + count, 0);

            results.push({
              endpoint: 'comments',
              status: 'success',
              data: { commentsCount: totalComments },
            });
          } else {
            results.push({
              endpoint: 'comments',
              status: 'skipped',
              error: 'No media to fetch comments from',
            });
          }
        } catch (e: any) {
          results.push({ endpoint: 'comments', status: 'error', error: e.message });
        }

        console.log('[Instagram Sync] Sync completed for user', user.id, 'Results:', results);

        res.json({
          success: true,
          message: 'Instagram sync completed',
          results,
          syncedAt: new Date().toISOString(),
        });
      } else {
        return res.status(403).json({ error: 'This endpoint is for creators only' });
      }
    } catch (error) {
      console.error('[Instagram Sync] Error:', error);
      res.status(500).json({ error: 'Failed to sync Instagram data' });
    }
  });

  // Company sync - sync business account
  app.post('/api/instagram/company/sync', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const companyId = req.session.activeCompanyId;

    if (!companyId) {
      return res.status(400).json({ error: 'No active company' });
    }

    try {
      const account = await instagramService.getInstagramAccountByCompanyId(companyId);
      if (!account) {
        return res.status(404).json({ error: 'Instagram account not connected' });
      }

      if (!account.accessToken) {
        return res.status(400).json({ error: 'No access token available' });
      }

      // Check if token needs refresh (expires within 7 days, already expired, or never recorded)
      let accessToken = account.accessToken;
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      let tokenRefreshFailed = false;

      // Attempt refresh if: no expiry recorded, expired, or expires soon
      const shouldRefresh =
        !account.accessTokenExpiresAt || new Date(account.accessTokenExpiresAt) < sevenDaysFromNow;

      if (shouldRefresh) {
        console.log('[Instagram Company Sync] Token needs refresh, attempting...');
        try {
          const refreshedToken = await instagramService.refreshLongLivedToken(account.accessToken);
          if (refreshedToken.access_token) {
            const expiresAt = new Date(
              now.getTime() + (refreshedToken.expires_in || 5184000) * 1000,
            );
            await instagramService.updateInstagramAccount(account.id, {
              accessToken: refreshedToken.access_token,
              accessTokenExpiresAt: expiresAt,
            });
            accessToken = refreshedToken.access_token;
            console.log(
              '[Instagram Company Sync] Token refreshed successfully, new expiry:',
              expiresAt,
            );
          }
        } catch (refreshError: any) {
          console.error('[Instagram Company Sync] Token refresh failed:', refreshError.message);
          tokenRefreshFailed = true;
          // Continue to validation - the token might still work
        }
      }

      // Validate token with a simple profile check first
      // Use Instagram Graph API (graph.instagram.com) for tokens obtained via Instagram OAuth
      // Use fetchWithRetry to handle transient Meta API errors
      const validationResponse = await fetchWithRetry(
        `${INSTAGRAM_GRAPH_BASE_URL}/${account.instagramUserId}?fields=id&access_token=${accessToken}`,
      );
      const validationData = await validationResponse.json();

      if (validationData.error) {
        const errorCode = validationData.error.code;
        const errorMessage = validationData.error.message || '';
        const isTransient = validationData.error.is_transient === true;

        // If still transient after retries, return cached data with warning
        if (isTransient) {
          console.log(
            '[Instagram Company Sync] Transient error persisted after retries, returning cached data',
          );

          // Return cached data from database so UI can still show something
          return res.status(200).json({
            success: true,
            warning:
              'Instagram API temporariamente instável. Mostrando dados salvos anteriormente.',
            isFromCache: true,
            account: {
              id: account.id,
              username: account.username,
              profilePictureUrl: account.profilePictureUrl,
              followersCount: account.followersCount,
              followsCount: account.followsCount,
              mediaCount: account.mediaCount,
              lastSyncAt: account.lastSyncAt,
            },
            results: [
              {
                endpoint: 'profile',
                status: 'cached',
                data: { username: account.username, followers: account.followersCount },
              },
              { endpoint: 'insights', status: 'skipped', error: 'API temporariamente instável' },
              { endpoint: 'media', status: 'skipped', error: 'API temporariamente instável' },
            ],
            retryAfter: 120,
          });
        }

        // Token is invalid or expired - user needs to reconnect
        if (
          errorCode === 190 ||
          errorMessage.includes('Invalid OAuth access token') ||
          errorMessage.includes('Session has expired')
        ) {
          console.log('[Instagram Company Sync] Token invalid, user needs to reconnect');

          // Log the error with more context
          await db.insert(integrationLogs).values({
            companyId,
            platform: 'instagram',
            action: 'sync',
            status: 'error',
            endpoint: 'token_validation',
            errorMessage: tokenRefreshFailed
              ? 'Tentativa de renovação falhou e token está inválido. Reconecte sua conta.'
              : 'Token expirado ou inválido. Reconecte sua conta do Instagram.',
          });

          return res.status(401).json({
            error: tokenRefreshFailed
              ? 'Não foi possível renovar o token automaticamente. Por favor, desconecte e reconecte sua conta do Instagram.'
              : 'Token expirado ou inválido. Por favor, desconecte e reconecte sua conta do Instagram.',
            code: tokenRefreshFailed ? 'TOKEN_REFRESH_FAILED' : 'TOKEN_EXPIRED',
            needsReconnect: true,
          });
        }

        // Other API errors (permissions revoked, rate limiting, etc.)
        console.log('[Instagram Company Sync] API error during validation:', validationData.error);

        await db.insert(integrationLogs).values({
          companyId,
          platform: 'instagram',
          action: 'sync',
          status: 'error',
          endpoint: 'token_validation',
          errorMessage: errorMessage || `Erro da API (código ${errorCode})`,
        });

        return res.status(400).json({
          error: `Erro ao validar token: ${errorMessage || 'Erro desconhecido'}`,
          code: 'API_ERROR',
        });
      }

      const results: { endpoint: string; status: string; data?: any; error?: string }[] = [];

      // Fetch profile - Use Instagram Graph API for tokens from Instagram OAuth
      // Use fetchWithRetry for all API calls to handle transient errors
      try {
        const profileResponse = await fetchWithRetry(
          `${INSTAGRAM_GRAPH_BASE_URL}/${account.instagramUserId}?fields=followers_count,follows_count,media_count,username,name&access_token=${accessToken}`,
        );
        const profileData = await profileResponse.json();

        if (profileData.error) {
          const errorMsg = profileData.error.is_transient
            ? 'API temporariamente instável. Tente novamente em alguns segundos.'
            : profileData.error.message;
          results.push({ endpoint: 'profile', status: 'error', error: errorMsg });
        } else {
          await instagramService.updateInstagramAccount(account.id, {
            followersCount: profileData.followers_count,
            followsCount: profileData.follows_count,
            mediaCount: profileData.media_count,
            lastSyncAt: new Date(),
          });
          results.push({
            endpoint: 'profile',
            status: 'success',
            data: { username: profileData.username },
          });
        }
      } catch (e: any) {
        results.push({ endpoint: 'profile', status: 'error', error: e.message });
      }

      // Fetch insights - requires instagram_business_manage_insights scope
      try {
        const insightsResponse = await fetchWithRetry(
          `${INSTAGRAM_GRAPH_BASE_URL}/${account.instagramUserId}/insights?metric=reach,follower_count,accounts_engaged,profile_views&period=day&access_token=${accessToken}`,
        );
        const insightsData = await insightsResponse.json();

        if (insightsData.error) {
          const errorMsg = insightsData.error.is_transient
            ? 'API temporariamente instável. Tente novamente em alguns segundos.'
            : insightsData.error.message;
          results.push({ endpoint: 'insights', status: 'error', error: errorMsg });
        } else {
          results.push({
            endpoint: 'insights',
            status: 'success',
            data: { metricsCount: insightsData.data?.length || 0 },
          });
        }
      } catch (e: any) {
        results.push({ endpoint: 'insights', status: 'error', error: e.message });
      }

      // Fetch media
      try {
        const mediaResponse = await fetchWithRetry(
          `${INSTAGRAM_GRAPH_BASE_URL}/${account.instagramUserId}/media?fields=id,caption,media_type,like_count,comments_count&limit=10&access_token=${accessToken}`,
        );
        const mediaData = await mediaResponse.json();

        if (mediaData.error) {
          const errorMsg = mediaData.error.is_transient
            ? 'API temporariamente instável. Tente novamente em alguns segundos.'
            : mediaData.error.message;
          results.push({ endpoint: 'media', status: 'error', error: errorMsg });
        } else {
          results.push({
            endpoint: 'media',
            status: 'success',
            data: { postsCount: mediaData.data?.length || 0 },
          });
        }
      } catch (e: any) {
        results.push({ endpoint: 'media', status: 'error', error: e.message });
      }

      // Fetch comments from recent media items (instagram_business_manage_comments)
      try {
        const mediaResponse = await fetchWithRetry(
          `${INSTAGRAM_GRAPH_BASE_URL}/${account.instagramUserId}/media?fields=id&limit=10&access_token=${accessToken}`,
        );
        const mediaData = await mediaResponse.json();

        if (mediaData.data && mediaData.data.length > 0) {
          let totalComments = 0;
          // Process up to 10 recent posts for comments
          const commentsPromises = mediaData.data.slice(0, 10).map(async (media: any) => {
            try {
              const commentsResponse = await fetchWithRetry(
                `${INSTAGRAM_GRAPH_BASE_URL}/${media.id}/comments?limit=10&access_token=${accessToken}`,
              );
              const commentsData = await commentsResponse.json();
              if (!commentsData.error && commentsData.data) {
                return commentsData.data.length;
              }
              return 0;
            } catch {
              return 0;
            }
          });

          const commentsCounts = await Promise.all(commentsPromises);
          totalComments = commentsCounts.reduce((sum, count) => sum + count, 0);

          results.push({
            endpoint: 'comments',
            status: 'success',
            data: { commentsCount: totalComments },
          });
        } else {
          results.push({
            endpoint: 'comments',
            status: 'skipped',
            error: 'No media to fetch comments from',
          });
        }
      } catch (e: any) {
        results.push({ endpoint: 'comments', status: 'error', error: e.message });
      }

      // Sync DM conversations (instagram_business_manage_messages)
      try {
        const conversationsResult = await instagramService.syncConversationsFromAPI(
          accessToken,
          account.id,
          account.instagramUserId,
          account.username,
          companyId,
        );
        results.push({
          endpoint: 'conversations',
          status: 'success',
          data: { synced: conversationsResult.synced, errors: conversationsResult.errors },
        });
      } catch (e: any) {
        results.push({ endpoint: 'conversations', status: 'error', error: e.message });
      }

      console.log(
        '[Instagram Company Sync] Sync completed for company',
        companyId,
        'Results:',
        results,
      );

      // Save logs to database
      for (const result of results) {
        await db.insert(integrationLogs).values({
          companyId,
          platform: 'instagram',
          action: 'sync',
          status: result.status,
          endpoint: result.endpoint,
          details: result.data || null,
          errorMessage: result.error || null,
        });
      }

      res.json({
        success: true,
        message: 'Instagram sync completed',
        results,
        syncedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[Instagram Company Sync] Error:', error);
      res.status(500).json({ error: 'Failed to sync Instagram data' });
    }
  });

  // Get integration logs for the company
  app.get('/api/integration-logs', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const companyId = req.session.activeCompanyId;
    if (!companyId) {
      return res.status(400).json({ error: 'No active company' });
    }

    try {
      const platform = req.query.platform as string | undefined;

      let logs;
      if (platform) {
        logs = await db
          .select()
          .from(integrationLogs)
          .where(
            and(eq(integrationLogs.companyId, companyId), eq(integrationLogs.platform, platform)),
          )
          .orderBy(desc(integrationLogs.createdAt))
          .limit(50);
      } else {
        logs = await db
          .select()
          .from(integrationLogs)
          .where(eq(integrationLogs.companyId, companyId))
          .orderBy(desc(integrationLogs.createdAt))
          .limit(50);
      }

      res.json({ logs });
    } catch (error) {
      console.error('[Integration Logs] Error:', error);
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  });

  // ============ DM INBOX ENDPOINTS ============

  // Get all conversations for the company's Instagram account
  app.get('/api/instagram/conversations', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = req.user! as any;
    const companyId = user.activeCompanyId || req.session.activeCompanyId;

    if (!companyId) {
      return res.status(400).json({ error: 'No active company' });
    }

    try {
      const account = await instagramService.getInstagramAccountByCompanyId(companyId);
      if (!account) {
        return res.status(404).json({ error: 'Instagram account not connected' });
      }

      const conversations = await instagramService.getConversationsList(account.id);
      const unreadCount = await instagramService.getUnreadConversationCount(account.id);

      // Fetch business account profile pic in background (don't wait)
      if (account.username) {
        const { getOrFetchProfilePic } = await import('../services/instagram-profile-pic');
        getOrFetchProfilePic(account.username).catch((err: Error) => {
          console.error(
            `[Instagram] Failed to fetch business account pic for ${account.username}:`,
            err.message,
          );
        });
      }

      // Prevent caching to ensure fresh data with profile pics
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      // Get business account profile pic URL
      let businessProfilePicUrl = null;
      if (account.username) {
        businessProfilePicUrl = `/api/storage/public/instagram-profiles/${account.username.toLowerCase()}.jpg`;
      }

      const toISO = (d: any) => (d instanceof Date ? d.toISOString() : d ? String(d) : null);
      const toTimestamp = (d: any) =>
        d instanceof Date ? d.getTime() : d ? new Date(d).getTime() : 0;

      const normalized = conversations.map((c: any) => ({
        ...c,
        lastMessageAt: toISO(c.lastMessageAt),
        lastIncomingMessageAt: toISO(c.lastIncomingMessageAt),
        sortTimestamp: toTimestamp(c.lastMessageAt),
      }));
      normalized.sort((a: any, b: any) => b.sortTimestamp - a.sortTimestamp);

      const usernamesWithoutPic = Array.from(
        new Set(
          normalized
            .filter((c: any) => c.participantUsername && !c.participantProfilePic)
            .map((c: any) => (c.participantUsername as string).toLowerCase()),
        ),
      );

      if (usernamesWithoutPic.length > 0) {
        (async () => {
          try {
            const { batchGetOrFetchProfilePics } =
              await import('../services/instagram-profile-pic');
            await batchGetOrFetchProfilePics(usernamesWithoutPic);
            console.log(
              `[Instagram DM] Background batch profile pic fetch completed for ${usernamesWithoutPic.length} users`,
            );
          } catch (err) {
            console.error('[Instagram DM] Background profile pic fetch error:', err);
          }
        })();
      }

      res.json({
        conversations: normalized,
        unreadCount,
        accountId: account.id,
        instagramUsername: account.username,
        businessProfilePicUrl,
      });
    } catch (error) {
      console.error('[Instagram DM] Get conversations error:', error);
      res.status(500).json({ error: 'Failed to get conversations' });
    }
  });

  // Get messages for a specific conversation
  app.get(
    '/api/instagram/conversations/:conversationId/messages',
    async (req: Request, res: Response) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = req.user! as any;
      const companyId = user.activeCompanyId || req.session.activeCompanyId;

      if (!companyId) {
        return res.status(400).json({ error: 'No active company' });
      }

      try {
        const account = await instagramService.getInstagramAccountByCompanyId(companyId);
        if (!account) {
          return res.status(404).json({ error: 'Instagram account not connected' });
        }

        const { conversationId } = req.params;
        let messages = await instagramService.getConversationMessages(account.id, conversationId);

        if (messages.length < 3 && account.accessToken) {
          try {
            console.log(
              `[Instagram DM] Auto deep-sync for conversation ${conversationId.substring(0, 20)}... (only ${messages.length} local msgs)`,
            );
            const apiMessages = await instagramService.fetchConversationMessagesFromAPI(
              account.accessToken,
              conversationId,
              100,
            );

            const existingIds = new Set(messages.map((m) => m.messageId));
            let synced = 0;

            for (const msg of apiMessages) {
              if (existingIds.has(msg.id)) continue;

              let messageType: 'text' | 'image' | 'video' | 'audio' | 'file' | 'share' = 'text';
              let attachments: any[] | null = null;

              if (msg.attachments?.data && msg.attachments.data.length > 0) {
                attachments = msg.attachments.data.map((att: any) => {
                  let attType = att.type || 'file';
                  const attUrl =
                    att.image_data?.url ||
                    att.video_data?.url ||
                    att.audio_data?.url ||
                    att.file_url ||
                    att.url;
                  if (att.image_data) attType = 'image';
                  else if (att.video_data) attType = 'video';
                  else if (att.audio_data) attType = 'audio';
                  return {
                    type: attType,
                    url: attUrl,
                    preview: att.image_data?.preview_url,
                    width: att.image_data?.width || att.video_data?.width,
                    height: att.image_data?.height || att.video_data?.height,
                  };
                });
                const firstAtt = msg.attachments.data[0];
                if (firstAtt.image_data) messageType = 'image';
                else if (firstAtt.video_data) messageType = 'video';
                else if (firstAtt.audio_data) messageType = 'audio';
                else if (firstAtt.type === 'share') messageType = 'share';
                else messageType = 'file';
              }

              const isIncoming = isMessageIncoming({
                senderUsername: msg.from?.username,
                senderId: msg.from?.id,
                accountUsername: account.username,
                accountInstagramUserId: account.instagramUserId,
                accountFacebookUserId: account.facebookUserId,
              });

              await instagramService.saveMessage({
                instagramAccountId: account.id,
                conversationId,
                messageId: msg.id,
                senderId: msg.from?.id || '',
                senderUsername: msg.from?.username,
                recipientId: isIncoming ? account.instagramUserId : msg.from?.id || '',
                recipientUsername: isIncoming ? account.username : msg.from?.username,
                messageText: msg.message,
                messageType,
                attachments,
                isIncoming,
                sentAt: msg.created_time ? new Date(msg.created_time) : new Date(),
              });
              synced++;
            }

            if (synced > 0) {
              console.log(
                `[Instagram DM] Auto deep-synced ${synced} new messages for conversation`,
              );
              messages = await instagramService.getConversationMessages(account.id, conversationId);
            }
          } catch (syncErr) {
            console.error('[Instagram DM] Auto deep-sync error:', syncErr);
          }
        }

        await instagramService.markMessagesAsRead(account.id, conversationId);
        res.json({
          messages,
          conversationId,
          instagramAccountId: account.id,
        });
      } catch (error) {
        console.error('[Instagram DM] Get messages error:', error);
        res.status(500).json({ error: 'Failed to get messages' });
      }
    },
  );

  // Deep sync messages for a specific conversation from Instagram API
  app.post(
    '/api/instagram/conversations/:conversationId/sync',
    async (req: Request, res: Response) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = req.user! as any;
      const companyId = user.activeCompanyId || req.session.activeCompanyId;

      if (!companyId) {
        return res.status(400).json({ error: 'No active company' });
      }

      try {
        const account = await instagramService.getInstagramAccountByCompanyId(companyId);
        if (!account) {
          return res.status(404).json({ error: 'Instagram account not connected' });
        }

        if (!account.accessToken) {
          return res.status(400).json({ error: 'No access token available' });
        }

        const { conversationId } = req.params;

        const apiMessages = await instagramService.fetchConversationMessagesFromAPI(
          account.accessToken,
          conversationId,
          100,
        );

        const existingRows = await db
          .select({ messageId: instagramMessages.messageId })
          .from(instagramMessages)
          .where(
            and(
              eq(instagramMessages.instagramAccountId, account.id),
              eq(instagramMessages.conversationId, conversationId),
            ),
          );
        const existingIds = new Set(existingRows.map((r) => r.messageId));

        let synced = 0;
        for (const msg of apiMessages) {
          if (existingIds.has(msg.id)) continue;

          let messageType: 'text' | 'image' | 'video' | 'audio' | 'file' | 'share' = 'text';
          let attachments: any[] | null = null;

          if (msg.attachments?.data && msg.attachments.data.length > 0) {
            attachments = msg.attachments.data.map((att: any) => {
              let attType = att.type || 'file';
              const attUrl =
                att.image_data?.url ||
                att.video_data?.url ||
                att.audio_data?.url ||
                att.file_url ||
                att.url;
              if (att.image_data) attType = 'image';
              else if (att.video_data) attType = 'video';
              else if (att.audio_data) attType = 'audio';
              return {
                type: attType,
                url: attUrl,
                preview: att.image_data?.preview_url,
                width: att.image_data?.width || att.video_data?.width,
                height: att.image_data?.height || att.video_data?.height,
              };
            });
            const firstAtt = msg.attachments.data[0];
            if (firstAtt.image_data) messageType = 'image';
            else if (firstAtt.video_data) messageType = 'video';
            else if (firstAtt.audio_data) messageType = 'audio';
            else if (firstAtt.type === 'share') messageType = 'share';
            else messageType = 'file';
          }

          const isIncoming = isMessageIncoming({
            senderUsername: msg.from?.username,
            senderId: msg.from?.id,
            accountUsername: account.username,
            accountInstagramUserId: account.instagramUserId,
            accountFacebookUserId: account.facebookUserId,
          });

          await instagramService.saveMessage({
            instagramAccountId: account.id,
            conversationId,
            messageId: msg.id,
            senderId: msg.from?.id || '',
            senderUsername: msg.from?.username,
            recipientId: isIncoming ? account.instagramUserId : msg.from?.id || '',
            recipientUsername: isIncoming ? account.username : msg.from?.username,
            messageText: msg.message,
            messageType,
            attachments,
            isIncoming,
            sentAt: msg.created_time ? new Date(msg.created_time) : new Date(),
          });
          synced++;
        }

        console.log(
          `[Instagram DM] Deep synced ${synced} messages for conversation ${conversationId.substring(0, 20)}...`,
        );

        res.json({
          success: true,
          synced,
          total: apiMessages.length,
        });
      } catch (error: any) {
        console.error('[Instagram DM] Deep sync error:', error);
        res.status(500).json({ error: error.message || 'Failed to sync messages' });
      }
    },
  );

  // Send a DM to a user
  app.post('/api/instagram/messages/send', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = req.user! as any;
    const companyId = user.activeCompanyId || req.session.activeCompanyId;

    if (!companyId) {
      return res.status(400).json({ error: 'No active company' });
    }

    try {
      const account = await instagramService.getInstagramAccountByCompanyId(companyId);
      if (!account) {
        return res.status(404).json({ error: 'Instagram account not connected' });
      }

      if (!account.accessToken) {
        return res.status(400).json({ error: 'No access token available' });
      }

      const { recipientId, message, conversationId } = req.body;

      if (!recipientId || !message) {
        return res.status(400).json({ error: 'recipientId and message are required' });
      }

      // Send via Instagram API
      const result = await instagramService.sendDirectMessage(
        account.accessToken,
        recipientId,
        message,
      );

      // Save to local DB
      const savedMessageId = await instagramService.saveMessage({
        instagramAccountId: account.id,
        conversationId: conversationId || `${account.instagramUserId}_${recipientId}`,
        messageId: result.message_id || `sent_${Date.now()}`,
        senderId: account.instagramUserId,
        senderUsername: account.username,
        recipientId,
        messageText: message,
        messageType: 'text',
        isIncoming: false,
        isRead: true,
        sentAt: new Date(),
      });

      console.log('[Instagram DM] Message sent successfully:', {
        recipientId,
        messageId: savedMessageId,
      });

      res.json({
        success: true,
        messageId: savedMessageId,
        apiResponse: result,
      });
    } catch (error: any) {
      console.error('[Instagram DM] Send message error:', error);
      res.status(500).json({ error: error.message || 'Failed to send message' });
    }
  });

  // Sync conversations from Instagram API
  const activeSyncs = new Map<number, boolean>();

  app.post('/api/instagram/conversations/sync', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = req.user! as any;
    const userId = user.id;
    const companyId = user.activeCompanyId || req.session.activeCompanyId;

    if (!companyId) {
      return res.status(400).json({ error: 'No active company' });
    }

    if (activeSyncs.get(companyId)) {
      return res.json({ success: true, status: 'already_syncing' });
    }

    try {
      const account = await instagramService.getInstagramAccountByCompanyId(companyId);
      if (!account) {
        return res.status(404).json({ error: 'Instagram account not connected' });
      }

      if (!account.accessToken) {
        return res.status(400).json({ error: 'No access token available' });
      }

      activeSyncs.set(companyId, true);
      res.json({ success: true, status: 'sync_started' });

      const { notificationWS } = await import('../websocket');

      const sendProgress = (
        page: number,
        totalConversations: number,
        synced: number,
        errors: number,
        done: boolean,
      ) => {
        try {
          notificationWS.sendEventToUser(userId, {
            type: 'dm_sync_progress',
            data: { page, totalConversations, synced, errors, done },
          });
        } catch {
          // Ignore WebSocket send errors
        }
      };

      (async () => {
        try {
          sendProgress(0, 0, 0, 0, false);

          const result = await instagramService.syncConversationsFromAPI(
            account.accessToken,
            account.id,
            account.instagramUserId,
            account.username,
            companyId,
            (page, totalConversations, synced, errors) => {
              sendProgress(page, totalConversations, synced, errors, false);
            },
          );

          console.log('[Instagram DM] Background sync completed:', result);
          sendProgress(0, result.synced, result.synced, result.errors, true);
        } catch (error: any) {
          console.error('[Instagram DM] Background sync error:', error);
          sendProgress(0, 0, 0, 1, true);
        } finally {
          activeSyncs.delete(companyId);
        }
      })();
    } catch (error: any) {
      activeSyncs.delete(companyId);
      console.error('[Instagram DM] Sync conversations error:', error);
      res.status(500).json({ error: error.message || 'Failed to sync conversations' });
    }
  });

  // Mark all Instagram messages as read
  app.post('/api/instagram/conversations/mark-all-read', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = req.user! as any;
    const companyId = user.activeCompanyId || req.session.activeCompanyId;

    if (!companyId) {
      return res.status(400).json({ error: 'No active company' });
    }

    try {
      const account = await instagramService.getInstagramAccountByCompanyId(companyId);
      if (!account) {
        return res.status(404).json({ error: 'Instagram account not connected' });
      }

      const markedCount = await instagramService.markAllMessagesAsRead(account.id);

      console.log('[Instagram DM] Marked all messages as read:', markedCount);

      res.json({
        success: true,
        markedCount,
      });
    } catch (error: any) {
      console.error('[Instagram DM] Mark all as read error:', error);
      res.status(500).json({ error: error.message || 'Failed to mark all as read' });
    }
  });

  // Sync posts and comments from Instagram API (for engagement tracking)
  app.post('/api/instagram/posts/sync', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = req.user! as any;
    const companyId = user.activeCompanyId || req.session.activeCompanyId;

    if (!companyId) {
      return res.status(400).json({ error: 'No active company' });
    }

    try {
      const account = await instagramService.getInstagramAccountByCompanyId(companyId);
      if (!account) {
        return res.status(404).json({ error: 'Instagram account not connected' });
      }

      if (!account.accessToken) {
        return res.status(400).json({ error: 'No access token available' });
      }

      const result = await instagramService.syncPostsAndComments(account.id, companyId);

      console.log('[Instagram] Posts and comments synced:', result);

      res.json({
        success: true,
        postsSync: result.postsSync,
        commentsSync: result.commentsSync,
        errors: result.errors,
      });
    } catch (error: any) {
      console.error('[Instagram] Sync posts error:', error);
      res.status(500).json({ error: error.message || 'Failed to sync posts' });
    }
  });

  // Full history sync - fetches up to 1 year of posts with pagination
  app.post('/api/instagram/sync-full', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = req.user! as any;
    if (user.role !== 'company' && !isAdminByEmail(user)) {
      return res.status(403).json({ error: 'Only company or admin users can sync' });
    }

    const companyId = user.activeCompanyId || req.session.activeCompanyId;
    if (!companyId) {
      return res.status(400).json({ error: 'No active company' });
    }

    try {
      const account = await instagramService.getInstagramAccountByCompanyId(companyId);
      if (!account) {
        return res.status(404).json({ error: 'Instagram account not connected' });
      }

      if (!account.accessToken) {
        return res.status(400).json({ error: 'No access token available' });
      }

      console.log(
        `[Instagram FullSync] Starting full history sync for company ${companyId}, account ${account.id}`,
      );

      const result = await instagramService.syncFullHistory(account.id, (progress) => {
        console.log(
          `[Instagram FullSync] Progress: page ${progress.page}, fetched ${progress.totalFetched}, done: ${progress.done}`,
        );
      });

      console.log('[Instagram FullSync] Complete:', result);

      res.json({
        success: true,
        postsSync: result.postsSync,
        commentsSync: result.commentsSync,
        errors: result.errors,
        totalPages: result.totalPages,
      });
    } catch (error: any) {
      console.error('[Instagram FullSync] Error:', error);
      res.status(500).json({ error: error.message || 'Failed to sync full history' });
    }
  });

  // Get unread message count
  app.get('/api/instagram/messages/unread-count', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = req.user! as any;
    const companyId = user.activeCompanyId || req.session.activeCompanyId;

    if (!companyId) {
      return res.status(400).json({ error: 'No active company' });
    }

    try {
      const account = await instagramService.getInstagramAccountByCompanyId(companyId);
      if (!account) {
        return res.json({ count: 0 });
      }

      const count = await instagramService.getUnreadConversationCount(account.id);
      res.json({ count });
    } catch (error) {
      console.error('[Instagram DM] Get unread count error:', error);
      res.status(500).json({ error: 'Failed to get unread count' });
    }
  });

  // Fetch Instagram profile data - STRICT LOCAL-FIRST, never calls Apify automatically
  app.get('/api/instagram/profile/:username', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { username } = req.params;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const cleanUsername = username.toLowerCase().replace('@', '').trim();
    const user = req.user! as any;
    const companyId = user.activeCompanyId || (req.session as any).activeCompanyId;

    try {
      // Look up contact data for this user
      let contactData = null;
      if (companyId) {
        contactData = await getContactByUsername(companyId, cleanUsername);
      }

      // === LAYER 1: LOCAL DATABASE (always first, $0 cost) ===
      const [cached] = await db
        .select()
        .from(instagramProfiles)
        .where(eq(instagramProfiles.username, cleanUsername))
        .limit(1);

      if (cached && cached.lastFetchedAt) {
        const cacheAge = Date.now() - new Date(cached.lastFetchedAt).getTime();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (cacheAge < sevenDays) {
          console.log(
            `[Instagram Profile] Cache HIT for @${cleanUsername} (${Math.round(cacheAge / 3600000)}h old)`,
          );
          const profilePicUrl = cached.profilePicStoragePath
            ? `/api/storage/public/${cached.profilePicStoragePath}`
            : cached.profilePicUrl?.startsWith('/api/storage/')
              ? cached.profilePicUrl
              : null;
          return res.json({
            profile: { ...cached, profilePicUrl },
            source: 'cache',
            contact: contactData,
          });
        }
      }

      // Also check instagram_messages for participant info (free local data)
      const [messageData] = await db
        .select({
          senderUsername: instagramMessages.senderUsername,
          senderProfilePic: instagramMessages.senderProfilePic,
        })
        .from(instagramMessages)
        .where(sql`LOWER(${instagramMessages.senderUsername}) = ${cleanUsername}`)
        .limit(1);

      // === LAYER 2: Instagram Business Discovery API ($0 cost, if company connected) ===
      if (companyId) {
        try {
          const account = await instagramService.getInstagramAccountByCompanyId(companyId);
          if (account?.accessToken && account?.instagramUserId) {
            // Only use Business Discovery for profiles that are NOT the company's own profile
            // to avoid wasteful API calls
            const isOwnProfile = account.username?.toLowerCase() === cleanUsername;

            if (!isOwnProfile) {
              const apiUrl = `https://graph.instagram.com/${FACEBOOK_GRAPH_API_VERSION}/${account.instagramUserId}?fields=business_discovery.fields(username,name,biography,followers_count,follows_count,media_count,profile_picture_url,media.limit(9){id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count}).username(${cleanUsername})&access_token=${account.accessToken}`;

              const apiResponse = await fetch(apiUrl);
              const apiData = await apiResponse.json();

              if (!apiData.error && apiData.business_discovery) {
                const biz = apiData.business_discovery;

                const recentPosts = (biz.media?.data || []).map((post: any) => ({
                  id: post.id,
                  mediaType: post.media_type,
                  mediaUrl: post.media_url,
                  thumbnailUrl: post.thumbnail_url,
                  permalink: post.permalink,
                  caption: post.caption?.substring(0, 200),
                  timestamp: post.timestamp,
                  likeCount: post.like_count || 0,
                  commentsCount: post.comments_count || 0,
                }));

                const profileData = {
                  username: cleanUsername,
                  ownerType: 'external' as const,
                  source: 'manual' as const,
                  followers: biz.followers_count || null,
                  following: biz.follows_count || null,
                  postsCount: biz.media_count || null,
                  fullName: biz.name || null,
                  bio: biz.biography || null,
                  profilePicUrl: biz.profile_picture_url || null,
                  isVerified: false,
                  isPrivate: false,
                  externalUrl: null,
                  topPosts: recentPosts,
                  lastFetchedAt: new Date(),
                };

                // Upsert cache
                if (cached) {
                  await db
                    .update(instagramProfiles)
                    .set({ ...profileData, updatedAt: new Date() })
                    .where(eq(instagramProfiles.id, cached.id));
                } else {
                  await db.insert(instagramProfiles).values(profileData);
                }

                console.log(
                  `[Instagram Profile] Business Discovery API success for @${cleanUsername}`,
                );
                return res.json({
                  profile: { ...profileData, recentPosts },
                  source: 'api',
                  contact: contactData,
                });
              } else {
                console.log(
                  `[Instagram Profile] Business Discovery API failed for @${cleanUsername}: ${apiData.error?.message || 'No data'}`,
                );
              }
            }
          }
        } catch (apiError: any) {
          console.log(
            `[Instagram Profile] Business Discovery API error for @${cleanUsername}: ${apiError.message}`,
          );
        }
      }

      // === LAYER 3: Return whatever local data we have ===
      if (cached) {
        console.log(`[Instagram Profile] Returning stale cache for @${cleanUsername}`);
        const profilePicUrl = cached.profilePicStoragePath
          ? `/api/storage/public/${cached.profilePicStoragePath}`
          : cached.profilePicUrl?.startsWith('/api/storage/')
            ? cached.profilePicUrl
            : null;
        return res.json({
          profile: { ...cached, profilePicUrl },
          source: 'cache_stale',
          contact: contactData,
        });
      }

      // Build minimal profile from message data
      if (messageData) {
        const minimalProfile = {
          username: cleanUsername,
          fullName: null,
          bio: null,
          profilePicUrl: null,
          followers: null,
          following: null,
          postsCount: null,
          isVerified: false,
          isPrivate: false,
        };
        return res.json({ profile: minimalProfile, source: 'messages', contact: contactData });
      }

      // No data available at all - return empty profile, NOT an error
      return res.json({
        profile: {
          username: cleanUsername,
          fullName: null,
          bio: null,
          profilePicUrl: null,
          followers: null,
          following: null,
          postsCount: null,
        },
        source: 'none',
        canEnrich: true,
        contact: contactData,
      });
    } catch (error: any) {
      console.error(`[Instagram Profile] Error for @${cleanUsername}:`, error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  // Explicit Apify enrichment - user must click a button to trigger this
  app.post('/api/instagram/profile/:username/enrich', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { username } = req.params;
    const cleanUsername = username.toLowerCase().replace('@', '').trim();

    try {
      console.log(`[Apify] 🔍 User-triggered enrichment for @${cleanUsername}`);

      const { validateInstagramProfile } = await import('../apify-service');
      const metrics = await validateInstagramProfile(cleanUsername, { skipPosts: false });

      if (!metrics.exists) {
        return res.status(404).json({ error: 'Perfil não encontrado no Instagram' });
      }

      // Save to instagram_profiles cache
      const [existing] = await db
        .select()
        .from(instagramProfiles)
        .where(eq(instagramProfiles.username, cleanUsername))
        .limit(1);

      const profileData = {
        username: cleanUsername,
        ownerType: 'external' as const,
        source: 'manual' as const,
        followers: metrics.followers || null,
        following: metrics.following || null,
        postsCount: metrics.postsCount || null,
        fullName: metrics.fullName || null,
        bio: metrics.bio || null,
        profilePicUrl: metrics.profilePicUrl || null,
        isVerified: metrics.isVerified || false,
        isPrivate: metrics.isPrivate || false,
        engagementRate: metrics.engagementRate || null,
        topPosts: metrics.topPosts || [],
        lastFetchedAt: new Date(),
      };

      if (existing) {
        await db
          .update(instagramProfiles)
          .set({ ...profileData, updatedAt: new Date() })
          .where(eq(instagramProfiles.id, existing.id));
      } else {
        await db.insert(instagramProfiles).values(profileData);
      }

      return res.json({
        profile: profileData,
        source: 'apify',
        costEstimate: '~$0.005 (1 perfil + 12 posts)',
      });
    } catch (error: any) {
      console.error(`[Apify] Enrichment error for @${cleanUsername}:`, error);
      res.status(500).json({ error: 'Falha ao enriquecer perfil via Apify' });
    }
  });

  // Batch fetch profile pics - more efficient than individual calls
  app.post('/api/instagram/profile-pics/batch', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { usernames } = req.body;
    if (!Array.isArray(usernames) || usernames.length === 0) {
      return res.json({ pics: {} });
    }

    // Limit batch size
    const limitedUsernames = usernames
      .slice(0, 100)
      .map((u: string) => u.replace('@', '').trim().toLowerCase())
      .filter(Boolean);

    try {
      // First check instagram_profiles for stored pics
      const profilePics = await db
        .select({
          username: instagramProfiles.username,
          profilePicStoragePath: instagramProfiles.profilePicStoragePath,
          profilePicUrl: instagramProfiles.profilePicUrl,
        })
        .from(instagramProfiles)
        .where(
          sql`LOWER(${instagramProfiles.username}) IN (${sql.join(
            limitedUsernames.map((u) => sql`${u}`),
            sql`, `,
          )})`,
        );

      const pics: Record<string, string | null> = {};

      for (const pic of profilePics) {
        const key = pic.username.toLowerCase();
        if (pic.profilePicStoragePath) {
          pics[key] = `/api/storage/public/${pic.profilePicStoragePath}`;
        } else if (pic.profilePicUrl) {
          pics[key] = pic.profilePicUrl;
        }
      }

      // For usernames not found, check users table and companies
      const missing = limitedUsernames.filter((u) => !pics[u]);
      if (missing.length > 0) {
        const userPics = await db
          .select({
            instagram: users.instagram,
            pic: users.instagramProfilePic,
            avatar: users.avatar,
          })
          .from(users)
          .where(
            sql`LOWER(REPLACE(${users.instagram}, '@', '')) IN (${sql.join(
              missing.map((u) => sql`${u}`),
              sql`, `,
            )})`,
          );

        for (const u of userPics) {
          if (u.instagram) {
            const key = u.instagram.replace('@', '').toLowerCase().trim();
            const url = u.pic || u.avatar;
            if (url) pics[key] = url;
          }
        }
      }

      // Trigger background fetch for missing pics (don't block response)
      const stillMissing = limitedUsernames.filter((u) => !pics[u]);
      if (stillMissing.length > 0 && stillMissing.length <= 20) {
        setImmediate(async () => {
          try {
            const { getOrFetchProfilePic } = await import('../services/instagram-profile-pic');
            console.log(
              `[Instagram] Background fetch for ${stillMissing.length} missing profile pics`,
            );
            const concurrency = 5;
            for (let i = 0; i < stillMissing.length; i += concurrency) {
              const batch = stillMissing.slice(i, i + concurrency);
              await Promise.allSettled(
                batch.map(async (username) => {
                  try {
                    const result = await getOrFetchProfilePic(username);
                    if (result.publicUrl?.startsWith('/api/storage/')) {
                      await db
                        .update(users)
                        .set({ instagramProfilePic: result.publicUrl })
                        .where(
                          and(
                            sql`LOWER(REPLACE(${users.instagram}, '@', '')) = ${username}`,
                            sql`(${users.instagramProfilePic} IS NULL OR ${users.instagramProfilePic} NOT LIKE '/api/storage/%')`,
                          ),
                        )
                        .execute();
                    }
                  } catch (err) {
                    console.error(`[Instagram] Background pic fetch error @${username}:`, err);
                  }
                }),
              );
              if (i + concurrency < stillMissing.length) {
                await new Promise((r) => setTimeout(r, 1000));
              }
            }
          } catch (err) {
            console.error('[Instagram] Background batch pic fetch error:', err);
          }
        });
      }

      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.json({ pics });
    } catch (error) {
      console.error('[Instagram] Batch profile pics error:', error);
      res.status(500).json({ error: 'Failed to fetch profile pics' });
    }
  });

  // Fetch Instagram profile pic - saves permanently to our storage
  app.get('/api/instagram/profile-pic/:username', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const { username } = req.params;
      const cleanUsername = username.replace('@', '').trim().toLowerCase();

      const { getOrFetchProfilePic } = await import('../services/instagram-profile-pic');
      const result = await getOrFetchProfilePic(cleanUsername);

      // Persist GCS pic URL in user record if not already stored
      if (result.publicUrl && result.publicUrl.startsWith('/api/storage/')) {
        try {
          await db
            .update(users)
            .set({ instagramProfilePic: result.publicUrl })
            .where(
              and(
                sql`LOWER(REPLACE(${users.instagram}, '@', '')) = ${cleanUsername}`,
                sql`(${users.instagramProfilePic} IS NULL OR ${users.instagramProfilePic} NOT LIKE '/api/storage/%')`,
              ),
            )
            .execute();
        } catch (err) {
          console.error('[Instagram] Failed to persist profile pic:', err);
        }
      }

      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.json({
        username: result.username,
        profilePicUrl: result.publicUrl,
        storagePath: result.storagePath,
        cached: result.cached,
      });
    } catch (error) {
      console.error('[Instagram] Profile pic fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch profile picture' });
    }
  });

  // ============================================
  // CONTACT NOTES ENDPOINTS
  // ============================================

  // Get notes for a contact
  app.get('/api/contact-notes/:username', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const user = req.user as any;
      const companyId = user?.activeCompanyId || req.session.activeCompanyId || user?.companyId;
      const username = req.params.username.replace('@', '').toLowerCase().trim();

      if (!companyId) {
        return res.status(400).json({ error: 'No company selected' });
      }

      const notes = await db
        .select()
        .from(contactNotes)
        .where(
          and(eq(contactNotes.companyId, companyId), eq(contactNotes.instagramUsername, username)),
        )
        .orderBy(desc(contactNotes.createdAt));

      res.json(notes);
    } catch (error) {
      console.error('[Notes] Error fetching notes:', error);
      res.status(500).json({ error: 'Failed to fetch notes' });
    }
  });

  // Add a note for a contact
  app.post('/api/contact-notes/:username', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const user = req.user as any;
      const companyId = user?.activeCompanyId || req.session.activeCompanyId || user?.companyId;
      const username = req.params.username.replace('@', '').toLowerCase().trim();
      const { content } = req.body;

      if (!companyId) {
        return res.status(400).json({ error: 'No company selected' });
      }

      if (!content?.trim()) {
        return res.status(400).json({ error: 'Note content is required' });
      }

      const [newNote] = await db
        .insert(contactNotes)
        .values({
          companyId,
          instagramUsername: username,
          content: content.trim(),
          createdBy: user.id,
        })
        .returning();

      res.json(newNote);
    } catch (error) {
      console.error('[Notes] Error adding note:', error);
      res.status(500).json({ error: 'Failed to add note' });
    }
  });

  // Delete a note
  app.delete('/api/contact-notes/:noteId', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const user = req.user as any;
      const companyId = user?.activeCompanyId || req.session.activeCompanyId || user?.companyId;
      const noteId = parseInt(req.params.noteId);

      if (!companyId) {
        return res.status(400).json({ error: 'No company selected' });
      }

      await db
        .delete(contactNotes)
        .where(and(eq(contactNotes.id, noteId), eq(contactNotes.companyId, companyId)));

      res.json({ success: true });
    } catch (error) {
      console.error('[Notes] Error deleting note:', error);
      res.status(500).json({ error: 'Failed to delete note' });
    }
  });

  // ============================================
  // DM TEMPLATES ENDPOINTS
  // ============================================

  // List all templates for the company
  app.get('/api/dm-templates', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const user = req.user as any;
      const companyId = user?.activeCompanyId || req.session.activeCompanyId || user?.companyId;

      if (!companyId) {
        return res.status(400).json({ error: 'No company selected' });
      }

      const templates = await db
        .select()
        .from(dmTemplates)
        .where(eq(dmTemplates.companyId, companyId))
        .orderBy(desc(dmTemplates.createdAt));

      res.json(templates);
    } catch (error) {
      console.error('[DM Templates] Error fetching templates:', error);
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  });

  // Create a new template
  app.post('/api/dm-templates', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const user = req.user as any;
      const companyId = user?.activeCompanyId || req.session.activeCompanyId || user?.companyId;

      if (!companyId) {
        return res.status(400).json({ error: 'No company selected' });
      }

      const { name, type, content, variables, isDefault } = req.body;

      if (!name || !content) {
        return res.status(400).json({ error: 'Name and content are required' });
      }

      const validTypes = ['campaign_invite', 'community_invite', 'follow_up', 'welcome', 'custom'];
      if (type && !validTypes.includes(type)) {
        return res.status(400).json({ error: 'Invalid template type' });
      }

      // Extract variables from content using regex for {variable_name} pattern
      const extractedVariables =
        content.match(/\{([a-zA-Z_]+)\}/g)?.map((v: string) => v.slice(1, -1)) || [];
      const finalVariables = variables || extractedVariables;

      const [newTemplate] = await db
        .insert(dmTemplates)
        .values({
          companyId,
          name,
          type: type || 'custom',
          content,
          variables: finalVariables,
          isDefault: isDefault || false,
          createdBy: user.id,
        })
        .returning();

      res.json(newTemplate);
    } catch (error) {
      console.error('[DM Templates] Error creating template:', error);
      res.status(500).json({ error: 'Failed to create template' });
    }
  });

  // Update a template
  app.put('/api/dm-templates/:id', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const user = req.user as any;
      const companyId = user?.activeCompanyId || req.session.activeCompanyId || user?.companyId;
      const templateId = parseInt(req.params.id);

      if (!companyId) {
        return res.status(400).json({ error: 'No company selected' });
      }

      // Verify template belongs to company
      const [existingTemplate] = await db
        .select()
        .from(dmTemplates)
        .where(and(eq(dmTemplates.id, templateId), eq(dmTemplates.companyId, companyId)))
        .limit(1);

      if (!existingTemplate) {
        return res.status(404).json({ error: 'Template not found' });
      }

      const { name, type, content, variables, isDefault } = req.body;

      const validTypes = ['campaign_invite', 'community_invite', 'follow_up', 'welcome', 'custom'];
      if (type && !validTypes.includes(type)) {
        return res.status(400).json({ error: 'Invalid template type' });
      }

      // Extract variables from content if not provided
      let finalVariables = variables;
      if (!variables && content) {
        finalVariables =
          content.match(/\{([a-zA-Z_]+)\}/g)?.map((v: string) => v.slice(1, -1)) || [];
      }

      const [updatedTemplate] = await db
        .update(dmTemplates)
        .set({
          name: name || existingTemplate.name,
          type: type || existingTemplate.type,
          content: content || existingTemplate.content,
          variables: finalVariables !== undefined ? finalVariables : existingTemplate.variables,
          isDefault: isDefault !== undefined ? isDefault : existingTemplate.isDefault,
          updatedAt: new Date(),
        })
        .where(eq(dmTemplates.id, templateId))
        .returning();

      res.json(updatedTemplate);
    } catch (error) {
      console.error('[DM Templates] Error updating template:', error);
      res.status(500).json({ error: 'Failed to update template' });
    }
  });

  // Delete a template
  app.delete('/api/dm-templates/:id', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const user = req.user as any;
      const companyId = user?.activeCompanyId || req.session.activeCompanyId || user?.companyId;
      const templateId = parseInt(req.params.id);

      if (!companyId) {
        return res.status(400).json({ error: 'No company selected' });
      }

      // Verify template belongs to company before deletion
      const [existingTemplate] = await db
        .select()
        .from(dmTemplates)
        .where(and(eq(dmTemplates.id, templateId), eq(dmTemplates.companyId, companyId)))
        .limit(1);

      if (!existingTemplate) {
        return res.status(404).json({ error: 'Template not found' });
      }

      await db.delete(dmTemplates).where(eq(dmTemplates.id, templateId));

      res.json({ success: true });
    } catch (error) {
      console.error('[DM Templates] Error deleting template:', error);
      res.status(500).json({ error: 'Failed to delete template' });
    }
  });

  // Send DM to multiple recipients using a template
  app.post('/api/dm-templates/:id/send-bulk', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const user = req.user as any;
      const companyId = user?.activeCompanyId || req.session.activeCompanyId || user?.companyId;
      const templateId = parseInt(req.params.id);

      if (!companyId) {
        return res.status(400).json({ error: 'No company selected' });
      }

      const { recipients, instagramAccountId, campaignId } = req.body;

      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ error: 'Recipients array is required' });
      }

      // Get template
      const [template] = await db
        .select()
        .from(dmTemplates)
        .where(and(eq(dmTemplates.id, templateId), eq(dmTemplates.companyId, companyId)))
        .limit(1);

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // Get Instagram account
      const account = await instagramService.getInstagramAccountByCompanyId(companyId);
      if (!account) {
        return res.status(404).json({ error: 'Instagram account not connected' });
      }

      if (!account.accessToken) {
        return res.status(400).json({ error: 'No access token available' });
      }

      let successCount = 0;
      let failureCount = 0;
      const results: Array<{ username: string; status: string; error?: string }> = [];

      for (const recipient of recipients) {
        const { username, igId, variables = {} } = recipient;

        if (!username && !igId) {
          results.push({
            username: username || 'unknown',
            status: 'failed',
            error: 'Missing username or igId',
          });
          failureCount++;
          continue;
        }

        // Replace variables in template content
        let messageContent = template.content;
        for (const [key, value] of Object.entries(variables)) {
          messageContent = messageContent.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
        }

        // Log the send attempt
        const [logEntry] = await db
          .insert(dmSendLogs)
          .values({
            companyId,
            templateId,
            instagramAccountId: account.id,
            recipientUsername: username,
            recipientIgId: igId || null,
            campaignId: campaignId || null,
            messageContent,
            status: 'pending',
          })
          .returning();

        try {
          // Get recipient's Instagram ID if not provided
          const recipientId = igId;
          if (!recipientId && username) {
            // Try to find user by username - this requires the recipient to have messaged us first
            // or we need their IGSID from a previous interaction
            // For now, we'll log the attempt as needing manual resolution
            await db
              .update(dmSendLogs)
              .set({
                status: 'failed',
                errorMessage: 'Recipient Instagram ID not available. User must message first.',
              })
              .where(eq(dmSendLogs.id, logEntry.id));

            results.push({ username, status: 'failed', error: 'Recipient must message first' });
            failureCount++;
            continue;
          }

          // Send the message via Instagram API
          const result = await instagramService.sendDirectMessage(
            account.accessToken,
            recipientId,
            messageContent,
          );

          // Save to local messages DB
          await instagramService.saveMessage({
            instagramAccountId: account.id,
            conversationId: `${account.instagramUserId}_${recipientId}`,
            messageId: result.message_id || `bulk_sent_${Date.now()}`,
            senderId: account.instagramUserId,
            senderUsername: account.username,
            recipientId,
            recipientUsername: username,
            messageText: messageContent,
            messageType: 'text',
            isIncoming: false,
            isRead: true,
            sentAt: new Date(),
          });

          // Update log entry to sent
          await db
            .update(dmSendLogs)
            .set({ status: 'sent', sentAt: new Date() })
            .where(eq(dmSendLogs.id, logEntry.id));

          results.push({ username, status: 'sent' });
          successCount++;

          // Small delay between messages to avoid rate limiting
          await delay(1000);
        } catch (sendError: any) {
          await db
            .update(dmSendLogs)
            .set({ status: 'failed', errorMessage: sendError.message || 'Send failed' })
            .where(eq(dmSendLogs.id, logEntry.id));

          results.push({ username, status: 'failed', error: sendError.message });
          failureCount++;
        }
      }

      res.json({
        success: true,
        successCount,
        failureCount,
        totalRecipients: recipients.length,
        results,
      });
    } catch (error: any) {
      console.error('[DM Templates] Error sending bulk messages:', error);
      res.status(500).json({ error: error.message || 'Failed to send bulk messages' });
    }
  });

  // Get send history/logs
  app.get('/api/dm-send-logs', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const user = req.user as any;
      const companyId = user?.activeCompanyId || req.session.activeCompanyId || user?.companyId;

      if (!companyId) {
        return res.status(400).json({ error: 'No company selected' });
      }

      const { campaignId, templateId, page = '1', limit = '50' } = req.query;
      const pageNum = parseInt(page as string) || 1;
      const limitNum = Math.min(parseInt(limit as string) || 50, 100);
      const offset = (pageNum - 1) * limitNum;

      const conditions = [eq(dmSendLogs.companyId, companyId)];

      if (campaignId) {
        conditions.push(eq(dmSendLogs.campaignId, parseInt(campaignId as string)));
      }

      if (templateId) {
        conditions.push(eq(dmSendLogs.templateId, parseInt(templateId as string)));
      }

      const logs = await db
        .select()
        .from(dmSendLogs)
        .where(and(...conditions))
        .orderBy(desc(dmSendLogs.createdAt))
        .limit(limitNum)
        .offset(offset);

      // Get total count for pagination
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(dmSendLogs)
        .where(and(...conditions));

      const total = Number(countResult[0]?.count || 0);

      res.json({
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('[DM Send Logs] Error fetching logs:', error);
      res.status(500).json({ error: 'Failed to fetch send logs' });
    }
  });

  // ============================================
  // MESSAGING ANALYTICS ENDPOINTS
  // ============================================

  // Get messaging analytics
  app.get('/api/instagram/analytics/messages', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const user = req.user as any;
      const companyId = user?.activeCompanyId || req.session.activeCompanyId || user?.companyId;

      if (!companyId) {
        return res.status(400).json({ error: 'No company selected' });
      }

      // Get business account
      const [businessAccount] = await db
        .select()
        .from(instagramAccounts)
        .where(
          and(
            eq(instagramAccounts.companyId, companyId),
            eq(instagramAccounts.accountType, 'business'),
          ),
        )
        .limit(1);

      if (!businessAccount) {
        return res.json({
          totalConversations: 0,
          totalMessages: 0,
          incomingMessages: 0,
          outgoingMessages: 0,
          avgResponseTime: null,
          conversationsToday: 0,
          conversationsThisWeek: 0,
          conversationsThisMonth: 0,
          messagesToday: 0,
          messagesThisWeek: 0,
        });
      }

      // Get message counts
      const messageStats = await db
        .select({
          total: sql<number>`COUNT(*)`,
          incoming: sql<number>`COUNT(*) FILTER (WHERE ${instagramMessages.isIncoming} = true)`,
          outgoing: sql<number>`COUNT(*) FILTER (WHERE ${instagramMessages.isIncoming} = false)`,
          today: sql<number>`COUNT(*) FILTER (WHERE ${instagramMessages.sentAt} >= CURRENT_DATE)`,
          thisWeek: sql<number>`COUNT(*) FILTER (WHERE ${instagramMessages.sentAt} >= CURRENT_DATE - INTERVAL '7 days')`,
        })
        .from(instagramMessages)
        .where(eq(instagramMessages.instagramAccountId, businessAccount.id));

      // Get unique conversation count
      const conversationStats = await db
        .select({
          total: sql<number>`COUNT(DISTINCT ${instagramMessages.conversationId})`,
          today: sql<number>`COUNT(DISTINCT ${instagramMessages.conversationId}) FILTER (WHERE ${instagramMessages.sentAt} >= CURRENT_DATE)`,
          thisWeek: sql<number>`COUNT(DISTINCT ${instagramMessages.conversationId}) FILTER (WHERE ${instagramMessages.sentAt} >= CURRENT_DATE - INTERVAL '7 days')`,
          thisMonth: sql<number>`COUNT(DISTINCT ${instagramMessages.conversationId}) FILTER (WHERE ${instagramMessages.sentAt} >= CURRENT_DATE - INTERVAL '30 days')`,
        })
        .from(instagramMessages)
        .where(eq(instagramMessages.instagramAccountId, businessAccount.id));

      // Calculate average response time (in minutes)
      // This is a simplified calculation - gets avg time between consecutive messages
      const avgResponseTimeResult = await db.execute(sql`
        WITH message_pairs AS (
          SELECT 
            conversation_id,
            sent_at,
            is_incoming,
            LAG(sent_at) OVER (PARTITION BY conversation_id ORDER BY sent_at) as prev_sent_at,
            LAG(is_incoming) OVER (PARTITION BY conversation_id ORDER BY sent_at) as prev_is_incoming
          FROM instagram_messages
          WHERE instagram_account_id = ${businessAccount.id}
            AND sent_at >= CURRENT_DATE - INTERVAL '30 days'
        )
        SELECT AVG(EXTRACT(EPOCH FROM (sent_at - prev_sent_at)) / 60) as avg_minutes
        FROM message_pairs
        WHERE is_incoming = false 
          AND prev_is_incoming = true
          AND prev_sent_at IS NOT NULL
          AND EXTRACT(EPOCH FROM (sent_at - prev_sent_at)) / 60 < 1440
      `);

      const avgResponseTime = avgResponseTimeResult.rows?.[0]?.avg_minutes
        ? Math.round(Number(avgResponseTimeResult.rows[0].avg_minutes))
        : null;

      res.json({
        totalConversations: Number(conversationStats[0]?.total || 0),
        totalMessages: Number(messageStats[0]?.total || 0),
        incomingMessages: Number(messageStats[0]?.incoming || 0),
        outgoingMessages: Number(messageStats[0]?.outgoing || 0),
        avgResponseTime,
        conversationsToday: Number(conversationStats[0]?.today || 0),
        conversationsThisWeek: Number(conversationStats[0]?.thisWeek || 0),
        conversationsThisMonth: Number(conversationStats[0]?.thisMonth || 0),
        messagesToday: Number(messageStats[0]?.today || 0),
        messagesThisWeek: Number(messageStats[0]?.thisWeek || 0),
      });
    } catch (error) {
      console.error('[Analytics] Error fetching message analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  // Get daily message stats for chart
  app.get('/api/instagram/analytics/messages/daily', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const user = req.user as any;
      const companyId = user?.activeCompanyId || req.session.activeCompanyId || user?.companyId;
      const days = parseInt(req.query.days as string) || 30;

      if (!companyId) {
        return res.status(400).json({ error: 'No company selected' });
      }

      const [businessAccount] = await db
        .select()
        .from(instagramAccounts)
        .where(
          and(
            eq(instagramAccounts.companyId, companyId),
            eq(instagramAccounts.accountType, 'business'),
          ),
        )
        .limit(1);

      if (!businessAccount) {
        return res.json([]);
      }

      const dailyStats = await db.execute(sql`
        SELECT 
          DATE(sent_at) as date,
          COUNT(*) as total_messages,
          COUNT(*) FILTER (WHERE is_incoming = true) as incoming,
          COUNT(*) FILTER (WHERE is_incoming = false) as outgoing,
          COUNT(DISTINCT conversation_id) as conversations
        FROM instagram_messages
        WHERE instagram_account_id = ${businessAccount.id}
          AND sent_at >= CURRENT_DATE - INTERVAL '${sql.raw(String(days))} days'
        GROUP BY DATE(sent_at)
        ORDER BY date DESC
      `);

      res.json(dailyStats.rows || []);
    } catch (error) {
      console.error('[Analytics] Error fetching daily stats:', error);
      res.status(500).json({ error: 'Failed to fetch daily stats' });
    }
  });

  console.log('[Routes] Instagram routes registered');
}
