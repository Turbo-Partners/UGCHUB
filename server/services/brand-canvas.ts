import { db } from "../db";
import { companies, instagramAccounts, instagramPosts } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import { storage } from "../storage";
import { sendGeminiMessage, sendGeminiMultimodal } from "../lib/gemini";
import { notificationWS } from "../websocket";
import OpenAI from "openai";
import type {
  BrandCanvasV2,
  BrandCanvasVisualIdentity,
  BrandCanvasVoice,
  BrandCanvasContentStrategy,
  BrandCanvasProcessingMeta,
  BrandCanvasProcessingStep,
  BrandCanvasStepStatus,
  WebSocketEvent,
} from "@shared/schema";

// ==========================================
// Brand Canvas AI Pipeline
// ==========================================

const PIPELINE_STEPS = ['cnpj', 'website', 'visual', 'social', 'voice', 'synthesis'] as const;
type PipelineStep = typeof PIPELINE_STEPS[number];

const STEP_TIMEOUT_MS = 30_000; // 30s per step
const PIPELINE_TIMEOUT_MS = 180_000; // 3 min total

// Steps that require specific API keys when OpenRouter is not available
const GEMINI_STEPS: PipelineStep[] = ['website', 'visual'];
const CLAUDE_STEPS: PipelineStep[] = ['voice', 'synthesis'];

// ==========================================
// OpenRouter AI Client
// ==========================================

let _openRouterClient: OpenAI | null = null;

function getOpenRouterClient(): OpenAI | null {
  if (!process.env.OPENROUTER_API_KEY) return null;
  if (!_openRouterClient) {
    _openRouterClient = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });
  }
  return _openRouterClient;
}

/** Check if we have any AI capability available */
function hasAICapability(): { hasGemini: boolean; hasClaude: boolean; hasOpenRouter: boolean } {
  return {
    hasGemini: !!process.env.GOOGLE_GENAI_API_KEY,
    hasClaude: !!process.env.ANTHROPIC_API_KEY,
    hasOpenRouter: !!process.env.OPENROUTER_API_KEY,
  };
}

/** Call an AI model via OpenRouter (OpenAI-compatible API) */
async function callOpenRouter(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2000,
): Promise<string> {
  const client = getOpenRouterClient();
  if (!client) throw new Error("OPENROUTER_API_KEY não configurada");

  const response = await client.chat.completions.create({
    model,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  return response.choices[0]?.message?.content || "";
}

/** Call an AI model with image via OpenRouter */
async function callOpenRouterWithImage(
  model: string,
  systemPrompt: string,
  textPrompt: string,
  imageBase64: string,
  mimeType: string,
  maxTokens = 2000,
): Promise<string> {
  const client = getOpenRouterClient();
  if (!client) throw new Error("OPENROUTER_API_KEY não configurada");

  const response = await client.chat.completions.create({
    model,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          { type: "text", text: textPrompt },
        ],
      },
    ],
  });

  return response.choices[0]?.message?.content || "";
}

/**
 * Wrap a promise with a timeout. Rejects with a descriptive error on timeout.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: ${label} excedeu ${ms / 1000}s`)), ms)
    ),
  ]);
}

interface ReferenceContext {
  selectedPostIds?: string[];
  uploadedReferences?: { url: string; type: string; filename: string }[];
  questionnaire?: {
    tonePreference?: string;
    targetAudience?: string;
    inspirationBrands?: string;
    communicationAvoid?: string;
    brandEssence?: string;
  };
}

interface PipelineOptions {
  companyId: number;
  userId: number;
  force?: boolean;
  sectionsOnly?: PipelineStep[];
  referenceContext?: ReferenceContext;
}

interface StepResult {
  data: Partial<BrandCanvasV2>;
  sources: string[];
}

/**
 * Notify connected users about pipeline progress via WebSocket.
 */
function notifyProgress(
  userId: number,
  companyId: number,
  step: string,
  status: BrandCanvasStepStatus,
  progress: number,
  message: string,
) {
  try {
    const event: WebSocketEvent = {
      type: 'brand_canvas:processing',
      companyId,
      step,
      status,
      progress,
      message,
    };
    notificationWS?.sendEventToUser(userId, event);
  } catch {
    // WebSocket may not be initialized in tests
  }
}

/**
 * Migrate V1 canvas to V2 structure.
 * Moves flat fields into nested objects while preserving all data.
 */
export function migrateV1toV2(canvas: any): BrandCanvasV2 {
  if (!canvas) return {};

  // Already V2 if it has processing.version === 2
  if (canvas.processing?.version === 2) return canvas as BrandCanvasV2;

  const v2: BrandCanvasV2 = {
    // Identity (same in both versions)
    aboutBrand: canvas.aboutBrand,
    whatWeDo: canvas.whatWeDo,
    differentials: canvas.differentials,

    // Visual Identity
    visualIdentity: canvas.visualIdentity || {},

    // Voice — migrate flat fields into nested object
    voice: canvas.voice || {
      toneType: canvas.brandVoice,
      toneDescription: canvas.brandVoiceDescription,
      doList: canvas.doList,
      dontList: canvas.dontList,
    },

    // Products (same structure, just new optional fields)
    products: canvas.products,

    // Audience
    targetAudience: canvas.targetAudience,
    personas: canvas.personas,

    // Content Strategy — migrate flat fields
    contentStrategy: canvas.contentStrategy || {
      idealContentTypes: canvas.idealContentTypes,
      hooks: canvas.hooks,
      keyMessages: canvas.keyMessages,
      callToAction: canvas.callToAction,
      avoidTopics: canvas.avoidTopics,
    },

    // References — migrate flat fields
    references: canvas.references || {
      referenceCreators: canvas.referenceCreators,
      competitorBrands: canvas.competitorBrands,
      referenceUrls: canvas.referenceUrls,
      brandAssets: canvas.brandAssets,
    },

    // Keep V1 compat flat fields for backward compat
    brandVoice: canvas.brandVoice,
    brandVoiceDescription: canvas.brandVoiceDescription,
    doList: canvas.doList,
    dontList: canvas.dontList,
    idealContentTypes: canvas.idealContentTypes,
    avoidTopics: canvas.avoidTopics,
    referenceCreators: canvas.referenceCreators,
    competitorBrands: canvas.competitorBrands,
    referenceUrls: canvas.referenceUrls,
    brandAssets: canvas.brandAssets,
    hooks: canvas.hooks,
    keyMessages: canvas.keyMessages,
    callToAction: canvas.callToAction,

    // Processing metadata
    processing: {
      version: 2,
      status: 'idle',
      lastProcessedAt: canvas.lastUpdatedAt,
    },

    lastUpdatedAt: canvas.lastUpdatedAt,
    completionScore: canvas.completionScore,
  };

  return v2;
}

/**
 * Calculate V2 completion score (0-100) based on 24 key fields.
 */
export function calculateCanvasCompletionScoreV2(canvas: BrandCanvasV2 | null): number {
  if (!canvas) return 0;

  const checks = [
    // Identity (5 fields)
    !!canvas.aboutBrand?.trim(),
    !!canvas.whatWeDo?.trim(),
    !!canvas.differentials?.trim(),
    !!canvas.mission?.trim(),
    !!canvas.coreValues?.length,

    // Visual Identity (3 fields)
    !!canvas.visualIdentity?.colors?.primary,
    !!canvas.visualIdentity?.logoUrl,
    !!canvas.visualIdentity?.visualAesthetic,

    // Voice (3 fields)
    !!(canvas.voice?.toneType || canvas.brandVoice),
    !!(canvas.voice?.doList?.length || canvas.doList?.length),
    !!(canvas.voice?.exampleCaptions?.length),

    // Products (1 field)
    !!canvas.products?.length,

    // Audience (4 fields)
    !!canvas.targetAudience?.trim(),
    !!canvas.personas?.length,
    !!canvas.painPoints?.length,
    !!canvas.desiredEmotions?.length,

    // Angles & UGC (3 fields)
    !!canvas.problemsAndDesires?.length,
    !!canvas.valueProposition?.trim(),
    !!canvas.commercialStrategies?.trim(),

    // Content Strategy (2 fields)
    !!(canvas.contentStrategy?.idealContentTypes?.length || canvas.idealContentTypes?.length),
    !!(canvas.contentStrategy?.hooks?.length || canvas.hooks?.length),

    // References (2 fields)
    !!(canvas.references?.competitors?.length),
    !!(canvas.references?.referenceBrands?.length),

    // Processing (1 field)
    !!canvas.processing?.lastProcessedAt,
  ];

  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

// ==========================================
// Pipeline Steps
// ==========================================

/**
 * Step 1: CNPJ enrichment — reuses existing company-enrichment service.
 */
async function stepCnpj(company: any): Promise<StepResult> {
  if (!company.cnpj) return { data: {}, sources: [] };

  try {
    const { enrichCompanyCnpj } = await import("./company-enrichment");
    await enrichCompanyCnpj(company.id, company.cnpj);
    // Refresh company data after enrichment
    return { data: {}, sources: ['cnpj'] };
  } catch (error) {
    console.error("[BrandCanvas] CNPJ step error:", error);
    return { data: {}, sources: [] };
  }
}

/**
 * Step 2: Website enrichment + Gemini analysis.
 */
async function stepWebsite(company: any): Promise<StepResult> {
  if (!company.website) return { data: {}, sources: [] };

  try {
    const { enrichCompanyWebsite } = await import("./company-enrichment");
    await enrichCompanyWebsite(company.id, company.website);

    // Refresh company to get website data
    const refreshed = await storage.getCompany(company.id);
    if (!refreshed?.websiteContent) return { data: {}, sources: ['website'] };

    // Use AI to extract brand-relevant insights from website content
    const websiteText = [
      refreshed.websiteAbout || '',
      refreshed.websiteContent || '',
      refreshed.websiteDescription || '',
    ].filter(Boolean).join('\n\n').slice(0, 6000);

    const userPrompt = `Analise o conteúdo deste website de marca brasileira e extraia informações detalhadas para um canvas de briefing de conteúdo UGC (User Generated Content) para influencer marketing.

${websiteText}

Retorne JSON:
{
  "aboutBrand": "história, propósito e origem da marca — conte como se estivesse apresentando para um creator que vai falar da marca (max 500 chars)",
  "whatWeDo": "o que a empresa faz, vende e entrega de valor — seja específico sobre os produtos/serviços (max 500 chars)",
  "differentials": "diferenciais concretos vs concorrência — ingredientes, tecnologia, processo, preço, atendimento (max 500 chars)",
  "mission": "missão da marca — propósito maior que vai além do lucro (max 400 chars)",
  "vision": "visão da marca — onde quer chegar em 5-10 anos (max 400 chars)",
  "coreValues": ["valor1", "valor2", ...max 8],
  "slogan": "slogan ou frase-chave da marca encontrada no site (max 200 chars)",
  "marketPositioning": "posicionamento: premium, acessível, nicho específico, líder de mercado — com contexto (max 300 chars)",
  "products": [{"name": "nome do produto", "description": "descrição com benefícios", "category": "categoria"}],
  "targetAudience": "público-alvo inferido com dados demográficos: faixa etária, gênero predominante, classe social, região, estilo de vida (max 400 chars)",
  "valueProposition": "frase que resume o maior diferencial — o que faz alguém escolher essa marca (max 200 chars)",
  "demographics": "perfil demográfico detalhado: gênero predominante, faixa etária, classe econômica, localização geográfica, estilo de vida (max 300 chars)"
}
Retorne APENAS JSON válido.`;

    const systemPrompt = "Você é um analista sênior de marketing especializado em UGC e influencer marketing no Brasil. Extraia informações de marca de websites com foco em dados que serão usados para criar briefings de conteúdo para creators. Seja específico e concreto — evite descrições genéricas. Retorne APENAS JSON válido, sem markdown.";

    let aiResponse: string;
    const or = getOpenRouterClient();
    if (or) {
      aiResponse = await callOpenRouter("google/gemini-2.5-flash", systemPrompt, userPrompt, 1500);
    } else {
      aiResponse = await sendGeminiMessage(userPrompt, {
        model: "gemini-2.5-flash",
        systemInstruction: systemPrompt,
      });
    }

    const cleanJson = aiResponse.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return {
      data: {
        aboutBrand: parsed.aboutBrand,
        whatWeDo: parsed.whatWeDo,
        differentials: parsed.differentials,
        mission: parsed.mission,
        vision: parsed.vision,
        coreValues: Array.isArray(parsed.coreValues) ? parsed.coreValues.slice(0, 8) : undefined,
        slogan: parsed.slogan,
        marketPositioning: parsed.marketPositioning,
        valueProposition: parsed.valueProposition,
        demographics: parsed.demographics,
        products: Array.isArray(parsed.products) ? parsed.products.slice(0, 10) : undefined,
        targetAudience: parsed.targetAudience,
      },
      sources: ['website'],
    };
  } catch (error) {
    console.error("[BrandCanvas] Website step error:", error);
    return { data: {}, sources: [] };
  }
}

/**
 * Step 3: Visual identity — Gemini Flash Vision analyzes logo/og:image.
 */
async function stepVisual(company: any): Promise<StepResult> {
  try {
    const refreshed = await storage.getCompany(company.id);
    const imageUrl = refreshed?.brandLogo || refreshed?.instagramProfilePic;

    if (!imageUrl) {
      // No image to analyze, but we can extract colors from website data
      const brandColors = refreshed?.brandColors as string[] | null;
      if (brandColors?.length) {
        return {
          data: {
            visualIdentity: {
              colors: {
                primary: brandColors[0],
                secondary: brandColors[1],
                accent: brandColors[2],
                additional: brandColors.slice(3),
              },
            },
          },
          sources: ['website_colors'],
        };
      }
      return { data: {}, sources: [] };
    }

    // Download image and convert to base64 for Gemini
    let imageBase64: string | null = null;
    let mimeType = 'image/jpeg';

    try {
      const response = await fetch(imageUrl);
      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer());
        imageBase64 = buffer.toString('base64');
        const ct = response.headers.get('content-type');
        if (ct) mimeType = ct.split(';')[0].trim();
      }
    } catch {
      // Image download failed
    }

    if (!imageBase64) return { data: {}, sources: [] };

    const visualTextPrompt = `Analise esta imagem (logo ou identidade visual de marca) e extraia:

Retorne JSON:
{
  "colors": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "background": "#hex",
    "text": "#hex",
    "additional": ["#hex"]
  },
  "logoAnalysis": "descrição breve do logo/visual (max 200 chars)",
  "visualAesthetic": "minimal | bold | elegant | playful | corporate | organic | vintage | tech",
  "moodKeywords": ["palavra1", "palavra2", ...],
  "typographySuggestion": "sugestão de fontes baseada na estética (max 150 chars)"
}
Retorne APENAS JSON válido.`;

    const visualSystemPrompt = "Você é um designer de marca. Analise identidades visuais e extraia paletas, tipografia e estética. Retorne APENAS JSON.";

    let aiResponse: string;
    const orClient = getOpenRouterClient();
    if (orClient) {
      aiResponse = await callOpenRouterWithImage(
        "google/gemini-2.5-flash",
        visualSystemPrompt,
        visualTextPrompt,
        imageBase64,
        mimeType,
        1500,
      );
    } else {
      const parts = [
        { inlineData: { mimeType, data: imageBase64 } },
        { text: visualTextPrompt },
      ];
      aiResponse = await sendGeminiMultimodal(parts, {
        model: "gemini-2.5-flash",
        systemInstruction: visualSystemPrompt,
      });
    }

    const cleanJson = aiResponse.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    // Merge with existing brand colors (use refreshed data from DB)
    const brandColors = (refreshed?.brandColors as string[] | null) || [];
    const colors = parsed.colors || {};
    if (brandColors.length && !colors.primary) {
      colors.primary = brandColors[0];
      colors.secondary = brandColors[1];
      colors.accent = brandColors[2];
    }

    return {
      data: {
        visualIdentity: {
          colors,
          typography: parsed.typographySuggestion ? {
            fontPairingSuggestion: parsed.typographySuggestion,
          } : undefined,
          logoUrl: imageUrl,
          logoAnalysis: parsed.logoAnalysis,
          visualAesthetic: parsed.visualAesthetic,
          moodKeywords: parsed.moodKeywords,
        },
      },
      sources: ['visual_analysis'],
    };
  } catch (error) {
    console.error("[BrandCanvas] Visual step error:", error);
    return { data: {}, sources: [] };
  }
}

/**
 * Step 4: Social media analysis — reads existing DB data only (no Apify/enrichment calls).
 */
async function stepSocial(company: any): Promise<StepResult> {
  if (!company.instagram) return { data: {}, sources: [] };

  try {
    const refreshed = await storage.getCompany(company.id);
    if (!refreshed) return { data: {}, sources: [] };

    // Extract hashtags and engagement data from stored posts (DB only)
    const accounts = await db.select({ id: instagramAccounts.id })
      .from(instagramAccounts)
      .where(eq(instagramAccounts.companyId, company.id));

    if (accounts.length) {
      const posts = await db.select({
        caption: instagramPosts.caption,
        likeCount: instagramPosts.likeCount,
        commentsCount: instagramPosts.commentsCount,
        hashtags: instagramPosts.hashtags,
      })
        .from(instagramPosts)
        .where(eq(instagramPosts.instagramAccountId, accounts[0].id))
        .orderBy(desc(instagramPosts.timestamp))
        .limit(30);

      if (posts.length) {
        const hashtagCounts: Record<string, number> = {};
        posts.forEach(p => {
          const tags = p.hashtags as string[] | null;
          tags?.forEach(h => { hashtagCounts[h] = (hashtagCounts[h] || 0) + 1; });
        });
        const topHashtags = Object.entries(hashtagCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 15)
          .map(([h]) => h.startsWith('#') ? h : `#${h}`);

        return {
          data: {
            contentStrategy: topHashtags.length ? { hashtagStrategy: topHashtags } : undefined,
          },
          sources: ['instagram', 'instagram_posts'],
        };
      }
    }

    return {
      data: {},
      sources: refreshed.instagramBio ? ['instagram'] : [],
    };
  } catch (error) {
    console.error("[BrandCanvas] Social step error:", error);
    return { data: {}, sources: [] };
  }
}

/**
 * Step 5: Voice analysis — Claude Sonnet analyzes all collected text.
 */
async function stepVoice(company: any, partialCanvas: BrandCanvasV2, referenceContext?: ReferenceContext): Promise<StepResult> {
  try {
    // Refresh company to get all enriched data
    const refreshed = await storage.getCompany(company.id);
    if (!refreshed) return { data: {}, sources: [] };

    // Collect all text sources for voice analysis
    const textSources: string[] = [];

    // Company basic info
    if (refreshed.instagramBio) textSources.push(`[Instagram Bio] ${refreshed.instagramBio}`);
    if (refreshed.websiteAbout) textSources.push(`[Website Sobre] ${(refreshed.websiteAbout as string).slice(0, 2000)}`);
    if (refreshed.websiteContent) textSources.push(`[Website Conteúdo] ${(refreshed.websiteContent as string).slice(0, 2000)}`);
    if (refreshed.description) textSources.push(`[Descrição] ${refreshed.description}`);
    if (refreshed.tagline) textSources.push(`[Tagline] ${refreshed.tagline}`);

    // Canvas context from previous steps
    if (partialCanvas.aboutBrand) textSources.push(`[Sobre a Marca] ${partialCanvas.aboutBrand}`);
    if (partialCanvas.whatWeDo) textSources.push(`[O que faz] ${partialCanvas.whatWeDo}`);
    if (partialCanvas.differentials) textSources.push(`[Diferenciais] ${partialCanvas.differentials}`);
    if (partialCanvas.targetAudience) textSources.push(`[Público-alvo] ${partialCanvas.targetAudience}`);
    if (partialCanvas.products?.length) {
      const productNames = partialCanvas.products.map(p => `${p.name}${p.category ? ` (${p.category})` : ''}`).join(', ');
      textSources.push(`[Produtos] ${productNames}`);
    }

    // Inject questionnaire answers if available
    const q = referenceContext?.questionnaire;
    if (q?.tonePreference) textSources.push(`[Preferência de tom] ${q.tonePreference}`);
    if (q?.targetAudience) textSources.push(`[Público-alvo informado] ${q.targetAudience}`);
    if (q?.inspirationBrands) textSources.push(`[Marcas de referência] ${q.inspirationBrands}`);
    if (q?.communicationAvoid) textSources.push(`[O que evitar] ${q.communicationAvoid}`);
    if (q?.brandEssence) textSources.push(`[Essência da marca] ${q.brandEssence}`);

    // Auto-select top 10 posts by engagement (no manual selection needed)
    try {
      const accounts = await db.select({ id: instagramAccounts.id })
        .from(instagramAccounts)
        .where(eq(instagramAccounts.companyId, refreshed.id));

      if (accounts.length) {
        const topPosts = await db.select({ caption: instagramPosts.caption })
          .from(instagramPosts)
          .where(eq(instagramPosts.instagramAccountId, accounts[0].id))
          .orderBy(desc(sql`COALESCE(${instagramPosts.likeCount}, 0) + COALESCE(${instagramPosts.commentsCount}, 0)`))
          .limit(10);

        const captions = topPosts.filter(p => p.caption).map(p => p.caption!.slice(0, 500));
        if (captions.length) {
          textSources.push(`[Top 10 posts Instagram por engagement]\n${captions.join('\n---\n')}`);
        }
      }
    } catch (e) { console.warn("[BrandCanvas] Voice posts fetch failed:", e); }

    if (textSources.length === 0) {
      return { data: {}, sources: [] };
    }

    const voiceSystemPrompt = `Você é um especialista sênior em branding, tom de voz e copywriting para marcas brasileiras. Analise textos de marca e identifique padrões de comunicação que serão usados para briefar creators de UGC. Seja concreto e específico — evite respostas genéricas. Retorne APENAS JSON válido, sem markdown.`;
    const voiceUserPrompt = `Analise profundamente os textos desta marca brasileira e identifique o tom de voz, padrões linguísticos e aspectos emocionais do público:

${textSources.join('\n\n')}

---

Retorne JSON:
{
  "toneType": "formal | descontraido | tecnico | inspiracional | divertido | premium | jovem",
  "toneDescription": "descrição detalhada e prática do tom — como um creator deve falar sobre essa marca. Inclua exemplos de expressões típicas (max 500 chars)",
  "personalityTraits": ["traço de personalidade específico da marca", ...max 5],
  "languageStyle": "formal | casual | slang | technical | poetic",
  "keywords": ["palavra-chave da marca", ...max 15],
  "doList": ["orientação específica e acionável — ex: 'Use dados e números para dar credibilidade', 'Mostre o produto em uso real'", ...max 8],
  "dontList": ["restrição específica — ex: 'Nunca compare com concorrentes pelo nome', 'Evite linguagem muito técnica/médica'", ...max 8],
  "exampleCaptions": ["legenda completa de Instagram (2-4 linhas) no estilo exato da marca, com emojis se aplicável, hashtags ao final", "outra legenda com estilo diferente mas mesma voz", "terceira legenda variada — pode ser storytelling, review ou dica", ...max 3],
  "emojiUsage": "none | minimal | moderate | heavy",
  "painPoints": ["dor/medo específico e acionável do público — ex: 'Frustração com produtos que prometem e não entregam resultado visível'", ...max 6],
  "desiredEmotions": ["emoção específica com contexto — ex: 'Confiança de estar usando algo comprovado cientificamente'", ...max 6]
}

IMPORTANTE:
- "exampleCaptions" devem ser legendas COMPLETAS e realistas, como um creator escreveria — não frases genéricas.
- "doList" e "dontList" devem ser orientações que um creator pode seguir imediatamente.
- "painPoints" e "desiredEmotions" devem ser específicos para o público DESTA marca, não genéricos.`;

    let text: string;
    const or = getOpenRouterClient();
    if (or) {
      text = await callOpenRouter("anthropic/claude-sonnet-4-5", voiceSystemPrompt, voiceUserPrompt, 1500);
    } else {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic();
      const response = await client.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 1500,
        system: voiceSystemPrompt,
        messages: [{ role: "user", content: voiceUserPrompt }],
      });
      text = response.content[0].type === 'text' ? response.content[0].text : '';
    }

    const cleanJson = text.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return {
      data: {
        voice: {
          toneType: parsed.toneType,
          toneDescription: parsed.toneDescription,
          personalityTraits: parsed.personalityTraits,
          languageStyle: parsed.languageStyle,
          keywords: parsed.keywords,
          doList: parsed.doList,
          dontList: parsed.dontList,
          exampleCaptions: parsed.exampleCaptions,
          emojiUsage: parsed.emojiUsage,
        },
        // Audience insights extracted from voice analysis
        painPoints: Array.isArray(parsed.painPoints) ? parsed.painPoints.slice(0, 6) : undefined,
        desiredEmotions: Array.isArray(parsed.desiredEmotions) ? parsed.desiredEmotions.slice(0, 6) : undefined,
        // Also set flat V1 compat fields
        brandVoice: parsed.toneType,
        brandVoiceDescription: parsed.toneDescription,
        doList: parsed.doList,
        dontList: parsed.dontList,
      },
      sources: ['claude_voice'],
    };
  } catch (error) {
    console.error("[BrandCanvas] Voice step error:", error);
    return { data: {}, sources: [] };
  }
}

/**
 * Step 6: Synthesis — Claude consolidates all data into a complete canvas.
 */
async function stepSynthesis(company: any, partialCanvas: BrandCanvasV2, referenceContext?: ReferenceContext): Promise<StepResult> {
  try {
    const refreshed = await storage.getCompany(company.id);
    if (!refreshed) return { data: {}, sources: [] };

    // Build context from all available data
    const context: string[] = [];
    context.push(`Nome: ${refreshed.name}`);
    if (refreshed.tradeName) context.push(`Nome fantasia: ${refreshed.tradeName}`);
    if (refreshed.category) context.push(`Categoria: ${refreshed.category}`);
    if (refreshed.city) context.push(`Localização: ${refreshed.city}/${refreshed.state || ''}`);
    if (partialCanvas.aboutBrand) context.push(`Sobre: ${partialCanvas.aboutBrand}`);
    if (partialCanvas.whatWeDo) context.push(`O que faz: ${partialCanvas.whatWeDo}`);
    if (partialCanvas.differentials) context.push(`Diferenciais: ${partialCanvas.differentials}`);
    if (partialCanvas.targetAudience) context.push(`Público-alvo: ${partialCanvas.targetAudience}`);
    if (partialCanvas.voice?.toneType) context.push(`Tom: ${partialCanvas.voice.toneType}`);
    if (partialCanvas.voice?.keywords?.length) context.push(`Keywords: ${partialCanvas.voice.keywords.join(', ')}`);
    if (partialCanvas.voice?.toneDescription) context.push(`Tom descrição: ${partialCanvas.voice.toneDescription}`);
    if (partialCanvas.voice?.doList?.length) context.push(`Orientações (do): ${partialCanvas.voice.doList.join(', ')}`);
    if (partialCanvas.voice?.dontList?.length) context.push(`Restrições (don't): ${partialCanvas.voice.dontList.join(', ')}`);
    if (partialCanvas.products?.length) {
      const productInfo = partialCanvas.products.map(p => `${p.name}${p.description ? ` — ${p.description}` : ''}${p.category ? ` (${p.category})` : ''}`).join('; ');
      context.push(`Produtos: ${productInfo}`);
    }
    if (partialCanvas.painPoints?.length) context.push(`Dores do público: ${partialCanvas.painPoints.join(', ')}`);
    if (partialCanvas.desiredEmotions?.length) context.push(`Emoções desejadas: ${partialCanvas.desiredEmotions.join(', ')}`);
    if (partialCanvas.mission) context.push(`Missão: ${partialCanvas.mission}`);
    if (partialCanvas.valueProposition) context.push(`Proposta de valor: ${partialCanvas.valueProposition}`);
    if (refreshed.instagramBio) context.push(`Instagram bio: ${refreshed.instagramBio}`);
    if (refreshed.websiteKeywords?.length) context.push(`Website keywords: ${(refreshed.websiteKeywords as string[]).join(', ')}`);

    // Inject questionnaire data
    const q = referenceContext?.questionnaire;
    if (q?.tonePreference) context.push(`Tom preferido: ${q.tonePreference}`);
    if (q?.targetAudience) context.push(`Público-alvo (informado): ${q.targetAudience}`);
    if (q?.inspirationBrands) context.push(`Marcas de inspiração: ${q.inspirationBrands}`);
    if (q?.communicationAvoid) context.push(`Evitar: ${q.communicationAvoid}`);
    if (q?.brandEssence) context.push(`Essência da marca: ${q.brandEssence}`);

    const synthSystemPrompt = `Você é um estrategista sênior de conteúdo UGC (User Generated Content) e influencer marketing no Brasil. Você cria briefings detalhados e criativos que creators usam para produzir conteúdo autêntico e de alta conversão. Suas sugestões devem ser CONCRETAS, ACIONÁVEIS e ESPECÍFICAS para o segmento da marca — nunca genéricas. Retorne APENAS JSON válido.`;
    const synthUserPrompt = `Com base nos dados desta marca, complete a estratégia de conteúdo UGC, personas, ângulos de comunicação e mapeie concorrentes e marcas de referência:

${context.join('\n')}

---

Retorne JSON:
{
  "contentStrategy": {
    "idealContentTypes": ["review", "tutorial", "unboxing", "before/after", "storytelling", etc... max 5],
    "hooks": ["gancho real de abertura de vídeo UGC que gera curiosidade — ex: 'Gente, preciso contar uma coisa sobre esse produto...', 'Eu testei por 30 dias e o resultado me chocou'", ...max 5],
    "keyMessages": ["mensagem-chave para roteiros", ...max 5],
    "callToAction": "CTA principal da marca",
    "avoidTopics": "temas a evitar",
    "hashtagStrategy": ["#hashtag1", ...max 10]
  },
  "personas": [
    {
      "name": "Nome da persona (nome próprio brasileiro, ex: 'Mariana, a Mãe Prática')",
      "ageRange": "25-34",
      "gender": "feminino",
      "location": "São Paulo, SP",
      "interests": ["interesse específico 1", "interesse 2", ...min 3, max 6],
      "painPoints": ["dor específica e acionável", ...min 2, max 4],
      "desires": ["desejo concreto", ...min 2, max 4],
      "blockers": ["objeção de compra", ...min 1, max 3]
    }
  ],
  "demographics": "perfil demográfico resumido do público-alvo (max 300 chars)",
  "problemsAndDesires": ["cada item deve ser um ângulo de roteiro UGC completo — ex: 'Medo de gastar dinheiro em skincare que não funciona → mostrar antes/depois real', 'Desejo de ter pele saudável sem rotina complicada → rotina de 3 passos'", ...max 8],
  "commercialStrategies": "estratégias comerciais concretas para roteiros: cite valores de frete, cupons específicos, condições de parcelamento, garantias — ex: 'Frete grátis acima de R$150, cupom PRIMEIRA10 para 10% off, parcelamento em 3x sem juros' (max 500 chars)",
  "transformationStories": "histórias de transformação emblemáticas que podem ser usadas como ângulos de conteúdo — descreva a jornada do cliente, o problema inicial e o resultado (max 500 chars)",
  "references": {
    "competitors": [
      { "name": "Nome do Concorrente Direto", "instagram": "@perfil_se_conhecer", "website": "url_se_conhecer" }
    ],
    "referenceBrands": ["marca de referência que a marca admira ou se inspira (mesmo de outros segmentos)", "outra marca de referência"]
  },
  "aiConfidenceScore": 75
}

INSTRUÇÕES DETALHADAS:
- Crie 2-3 personas realistas com nomes brasileiros típicos e subtítulos descritivos.
- Cada persona deve ter pelo menos 3 interesses, 2 dores e 2 desejos específicos.
- "hooks" devem ser frases REAIS de abertura de vídeo UGC, como um creator falaria — nunca genéricos.
- "problemsAndDesires" devem ser ângulos completos: descreva o problema/desejo + o formato de conteúdo que resolve.
- Liste 2-4 concorrentes diretos da marca com Instagram e website quando possível.
- Liste 3-5 marcas de referência (podem ser de outros segmentos) que são referência de conteúdo UGC.
- O score de confiança (0-100) deve refletir a quantidade e qualidade dos dados disponíveis.`;

    let text: string;
    const or = getOpenRouterClient();
    if (or) {
      text = await callOpenRouter("anthropic/claude-sonnet-4-5", synthSystemPrompt, synthUserPrompt, 3000);
    } else {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic();
      const response = await client.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 3000,
        system: synthSystemPrompt,
        messages: [{ role: "user", content: synthUserPrompt }],
      });
      text = response.content[0].type === 'text' ? response.content[0].text : '';
    }

    const cleanJson = text.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    // Add IDs to personas
    const personas = (parsed.personas || []).map((p: any, i: number) => ({
      ...p,
      id: `ai-persona-${i + 1}`,
    }));

    return {
      data: {
        contentStrategy: parsed.contentStrategy,
        personas,
        // UGC-specific fields
        demographics: parsed.demographics,
        problemsAndDesires: Array.isArray(parsed.problemsAndDesires) ? parsed.problemsAndDesires.slice(0, 8) : undefined,
        commercialStrategies: parsed.commercialStrategies,
        transformationStories: parsed.transformationStories,
        // References (competitors + referenceBrands)
        references: {
          competitors: Array.isArray(parsed.references?.competitors) ? parsed.references.competitors.slice(0, 5) : [],
          referenceBrands: Array.isArray(parsed.references?.referenceBrands) ? parsed.references.referenceBrands.slice(0, 8) : [],
        },
        // V1 compat
        idealContentTypes: parsed.contentStrategy?.idealContentTypes,
        hooks: parsed.contentStrategy?.hooks,
        keyMessages: parsed.contentStrategy?.keyMessages,
        callToAction: parsed.contentStrategy?.callToAction,
        avoidTopics: parsed.contentStrategy?.avoidTopics,
      },
      sources: ['claude_synthesis'],
    };
  } catch (error) {
    console.error("[BrandCanvas] Synthesis step error:", error);
    return { data: {}, sources: [] };
  }
}

// ==========================================
// Pipeline Orchestrator
// ==========================================

/**
 * Merge AI data into existing canvas, preserving manual edits.
 * Only fills empty/undefined fields unless force=true (overwrites everything).
 */
export function mergeCanvasData(existing: BrandCanvasV2, aiData: Partial<BrandCanvasV2>, force = false): BrandCanvasV2 {
  const merged = { ...existing };

  // Simple string fields (V1 compat fields handled by voice/contentStrategy deep merges below)
  for (const key of [
    'aboutBrand', 'whatWeDo', 'differentials', 'targetAudience',
    'brandVoice', 'brandVoiceDescription', 'referenceCreators',
    // New UGC fields
    'mission', 'vision', 'slogan', 'marketPositioning', 'valueProposition',
    'demographics', 'commercialStrategies', 'transformationStories',
  ] as const) {
    if ((force || !merged[key]?.trim()) && aiData[key]) {
      (merged as any)[key] = aiData[key];
    }
  }

  // Array fields (doList, dontList, idealContentTypes, hooks, keyMessages handled by voice/contentStrategy deep merges)
  for (const key of [
    'competitorBrands', 'referenceUrls',
    // New UGC array fields
    'coreValues', 'painPoints', 'desiredEmotions', 'problemsAndDesires',
  ] as const) {
    if ((force || !merged[key] || (merged[key] as any[])!.length === 0) && aiData[key]) {
      (merged as any)[key] = aiData[key];
    }
  }

  // Products
  if ((force || !merged.products || merged.products.length === 0) && aiData.products?.length) {
    merged.products = aiData.products;
  }

  // Personas
  if ((force || !merged.personas || merged.personas.length === 0) && aiData.personas?.length) {
    merged.personas = aiData.personas;
  }

  // Visual Identity: deep merge
  if (aiData.visualIdentity) {
    merged.visualIdentity = merged.visualIdentity || {};
    if (force || !merged.visualIdentity.colors) {
      if (aiData.visualIdentity.colors) merged.visualIdentity.colors = aiData.visualIdentity.colors;
    }
    if (force || !merged.visualIdentity.typography) {
      if (aiData.visualIdentity.typography) merged.visualIdentity.typography = aiData.visualIdentity.typography;
    }
    if (force || !merged.visualIdentity.logoUrl) {
      if (aiData.visualIdentity.logoUrl) merged.visualIdentity.logoUrl = aiData.visualIdentity.logoUrl;
    }
    if (force || !merged.visualIdentity.logoAnalysis) {
      if (aiData.visualIdentity.logoAnalysis) merged.visualIdentity.logoAnalysis = aiData.visualIdentity.logoAnalysis;
    }
    if (force || !merged.visualIdentity.visualAesthetic) {
      if (aiData.visualIdentity.visualAesthetic) merged.visualIdentity.visualAesthetic = aiData.visualIdentity.visualAesthetic;
    }
    if (force || !merged.visualIdentity.moodKeywords?.length) {
      if (aiData.visualIdentity.moodKeywords?.length) merged.visualIdentity.moodKeywords = aiData.visualIdentity.moodKeywords;
    }
  }

  // Voice: deep merge
  if (aiData.voice) {
    merged.voice = merged.voice || {};
    for (const key of ['toneType', 'toneDescription', 'languageStyle', 'emojiUsage'] as const) {
      if ((force || !merged.voice[key]) && aiData.voice[key]) {
        (merged.voice as any)[key] = aiData.voice[key];
      }
    }
    for (const key of ['personalityTraits', 'keywords', 'doList', 'dontList', 'exampleCaptions'] as const) {
      if ((force || !merged.voice[key] || merged.voice[key]!.length === 0) && aiData.voice[key]) {
        (merged.voice as any)[key] = aiData.voice[key];
      }
    }
  }

  // Content Strategy: deep merge
  if (aiData.contentStrategy) {
    merged.contentStrategy = merged.contentStrategy || {};
    for (const key of ['callToAction', 'avoidTopics'] as const) {
      if ((force || !merged.contentStrategy[key]) && aiData.contentStrategy[key]) {
        (merged.contentStrategy as any)[key] = aiData.contentStrategy[key];
      }
    }
    for (const key of ['idealContentTypes', 'hooks', 'keyMessages', 'hashtagStrategy'] as const) {
      if ((force || !merged.contentStrategy[key] || merged.contentStrategy[key]!.length === 0) && aiData.contentStrategy[key]) {
        (merged.contentStrategy as any)[key] = aiData.contentStrategy[key];
      }
    }
  }

  // References: deep merge
  if (aiData.references) {
    merged.references = merged.references || {};
    for (const key of ['referenceCreators'] as const) {
      if ((force || !merged.references[key]) && aiData.references[key]) {
        (merged.references as any)[key] = aiData.references[key];
      }
    }
    for (const key of ['competitors', 'referenceBrands', 'competitorBrands', 'referenceUrls', 'brandAssets', 'avoidWords'] as const) {
      if ((force || !merged.references[key] || (merged.references[key] as any[])!.length === 0) && aiData.references[key]) {
        (merged.references as any)[key] = aiData.references[key];
      }
    }
  }

  return merged;
}

/**
 * Run the full Brand Canvas AI pipeline.
 * Executes steps sequentially, merging results as they complete.
 * Includes pre-flight API key checks, per-step timeouts, and proper failure detection.
 */
export async function runBrandCanvasPipeline(options: PipelineOptions): Promise<BrandCanvasV2> {
  const { companyId, userId, force, sectionsOnly, referenceContext } = options;

  const company = await storage.getCompany(companyId);
  if (!company) throw new Error("Company not found");

  // Get existing canvas and migrate to V2 if needed
  let canvas = migrateV1toV2(company.brandCanvas);

  // Check if already processing
  if (canvas.processing?.status === 'processing' && !force) {
    throw new Error("Pipeline already running");
  }

  // ── Pre-flight: check API keys ──
  const { hasGemini, hasClaude, hasOpenRouter } = hasAICapability();

  if (!hasGemini && !hasClaude && !hasOpenRouter) {
    const errorMsg = 'Nenhuma API de IA configurada (GOOGLE_GENAI_API_KEY e ANTHROPIC_API_KEY ausentes)';
    console.error(`[BrandCanvas] ${errorMsg}`);
    canvas.processing = {
      version: 2,
      status: 'failed',
      error: errorMsg,
      lastProcessedAt: new Date().toISOString(),
    };
    await db.update(companies).set({ brandCanvas: canvas }).where(eq(companies.id, companyId));
    try {
      const event: WebSocketEvent = { type: 'brand_canvas:failed', companyId, error: errorMsg };
      notificationWS?.sendEventToUser(userId, event);
    } catch {}
    return canvas;
  }

  // Initialize processing metadata
  const stepsToRun = sectionsOnly || [...PIPELINE_STEPS];
  const steps: BrandCanvasProcessingStep[] = stepsToRun.map(name => ({
    name,
    status: 'pending' as BrandCanvasStepStatus,
  }));

  canvas.processing = {
    version: 2,
    status: 'processing',
    steps,
    dataSources: [],
  };

  // Save initial processing state
  await db.update(companies).set({
    brandCanvas: canvas,
  }).where(eq(companies.id, companyId));

  const allSources: string[] = [];
  let aiConfidenceScore = 0;

  // Save generation context to canvas
  if (referenceContext) {
    canvas.generationContext = {
      questionnaire: referenceContext.questionnaire,
      selectedPostIds: referenceContext.selectedPostIds,
      uploadedReferences: referenceContext.uploadedReferences?.map(r => ({
        url: r.url,
        type: r.type as 'image' | 'video',
        source: 'upload' as const,
        caption: r.filename,
      })),
    };
  }

  // Step functions map
  const stepFunctions: Record<PipelineStep, (company: any) => Promise<StepResult>> = {
    cnpj: stepCnpj,
    website: stepWebsite,
    visual: stepVisual,
    social: stepSocial,
    voice: (comp) => stepVoice(comp, canvas, referenceContext),
    synthesis: (comp) => stepSynthesis(comp, canvas, referenceContext),
  };

  const pipelineStart = Date.now();

  for (let i = 0; i < stepsToRun.length; i++) {
    const stepName = stepsToRun[i];
    const stepIndex = steps.findIndex(s => s.name === stepName);
    const progress = Math.round(((i) / stepsToRun.length) * 100);

    // ── Check pipeline total timeout ──
    if (Date.now() - pipelineStart > PIPELINE_TIMEOUT_MS) {
      console.warn(`[BrandCanvas] Pipeline timeout reached at step ${stepName}`);
      for (let j = i; j < stepsToRun.length; j++) {
        const idx = steps.findIndex(s => s.name === stepsToRun[j]);
        steps[idx].status = 'skipped';
        steps[idx].error = 'Pipeline timeout (3 min)';
        steps[idx].completedAt = new Date().toISOString();
      }
      break;
    }

    // ── Pre-flight: skip steps missing required API key (OpenRouter covers all) ──
    if (GEMINI_STEPS.includes(stepName) && !hasGemini && !hasOpenRouter) {
      console.warn(`[BrandCanvas] Skipping ${stepName}: GOOGLE_GENAI_API_KEY and OPENROUTER_API_KEY not set`);
      steps[stepIndex].status = 'skipped';
      steps[stepIndex].error = 'Nenhuma API de IA disponível para este step';
      steps[stepIndex].completedAt = new Date().toISOString();
      notifyProgress(userId, companyId, stepName, 'skipped', progress, `Pulado: ${stepName} (API key ausente)`);
      continue;
    }
    if (CLAUDE_STEPS.includes(stepName) && !hasClaude && !hasOpenRouter) {
      console.warn(`[BrandCanvas] Skipping ${stepName}: ANTHROPIC_API_KEY and OPENROUTER_API_KEY not set`);
      steps[stepIndex].status = 'skipped';
      steps[stepIndex].error = 'Nenhuma API de IA disponível para este step';
      steps[stepIndex].completedAt = new Date().toISOString();
      notifyProgress(userId, companyId, stepName, 'skipped', progress, `Pulado: ${stepName} (API key ausente)`);
      continue;
    }

    // Update step status
    steps[stepIndex].status = 'running';
    steps[stepIndex].startedAt = new Date().toISOString();
    canvas.processing!.currentStep = stepName;

    notifyProgress(userId, companyId, stepName, 'running', progress, `Processando: ${stepName}...`);

    try {
      // Refresh company data for each step
      const freshCompany = await storage.getCompany(companyId);
      const fn = stepFunctions[stepName];

      // ── Per-step timeout (30s) ──
      const result = await withTimeout(
        fn(freshCompany || company),
        STEP_TIMEOUT_MS,
        stepName,
      );

      // Merge result into canvas (force mode overwrites existing fields)
      canvas = mergeCanvasData(canvas, result.data, !!force);
      allSources.push(...result.sources);

      steps[stepIndex].status = 'completed';
      steps[stepIndex].completedAt = new Date().toISOString();

      notifyProgress(userId, companyId, stepName, 'completed', progress + Math.round(100 / stepsToRun.length), `Concluído: ${stepName}`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      const isTimeout = errMsg.startsWith('Timeout:');
      console.error(`[BrandCanvas] Step ${stepName} ${isTimeout ? 'timed out' : 'failed'}:`, errMsg);

      steps[stepIndex].status = isTimeout ? 'skipped' : 'failed';
      steps[stepIndex].error = errMsg;
      steps[stepIndex].completedAt = new Date().toISOString();

      notifyProgress(userId, companyId, stepName, isTimeout ? 'skipped' : 'failed', progress, `${isTimeout ? 'Timeout' : 'Erro'}: ${stepName}`);
    }

    // Save progress after each step
    canvas.processing = {
      ...canvas.processing!,
      steps,
      dataSources: Array.from(new Set(allSources)),
    };
    canvas.lastUpdatedAt = new Date().toISOString();
    canvas.completionScore = calculateCanvasCompletionScoreV2(canvas);

    await db.update(companies).set({
      brandCanvas: canvas,
    }).where(eq(companies.id, companyId));
  }

  // ── Status logic: check if AI steps actually produced data ──
  const AI_SOURCE_MARKERS = ['website', 'visual_analysis', 'claude_voice', 'claude_synthesis'];
  const hasAIData = allSources.some(s => AI_SOURCE_MARKERS.includes(s));
  const completedSteps = steps.filter(s => s.status === 'completed').length;

  if (!hasAIData && completedSteps <= 2) {
    // Only data/DB steps completed (cnpj, social) — no AI analysis was done
    const failedStepNames = steps
      .filter(s => s.status === 'failed' || s.status === 'skipped')
      .map(s => s.name)
      .join(', ');
    const errorMsg = `Nenhum step de IA gerou dados. Steps com falha: ${failedStepNames}`;
    console.warn(`[BrandCanvas] ${errorMsg}`);

    canvas.processing = {
      version: 2,
      status: 'failed',
      steps,
      error: errorMsg,
      dataSources: Array.from(new Set(allSources)),
      lastProcessedAt: new Date().toISOString(),
      history: [
        ...(canvas.processing?.history || []),
        { date: new Date().toISOString(), score: 0, sources: Array.from(new Set(allSources)) },
      ].slice(-50),
    };

    canvas.lastUpdatedAt = new Date().toISOString();
    canvas.completionScore = calculateCanvasCompletionScoreV2(canvas);

    await db.update(companies).set({ brandCanvas: canvas }).where(eq(companies.id, companyId));

    // ── WebSocket: notify failure with error details ──
    try {
      const event: WebSocketEvent = { type: 'brand_canvas:failed', companyId, error: errorMsg };
      notificationWS?.sendEventToUser(userId, event);
    } catch {}

    return canvas;
  }

  // Auto-fill visual identity from company data if pipeline didn't generate
  const freshCompanyForVisual = await storage.getCompany(companyId);
  if (freshCompanyForVisual) {
    if (!canvas.visualIdentity?.logoUrl) {
      const logo = freshCompanyForVisual.brandLogo || freshCompanyForVisual.instagramProfilePic;
      if (logo) {
        canvas.visualIdentity = canvas.visualIdentity || {};
        canvas.visualIdentity.logoUrl = logo;
      }
    }
    if (!canvas.visualIdentity?.colors?.primary) {
      const colors = freshCompanyForVisual.brandColors as string[] | null;
      if (colors?.length) {
        canvas.visualIdentity = canvas.visualIdentity || {};
        canvas.visualIdentity.colors = {
          ...canvas.visualIdentity.colors,
          primary: colors[0],
          secondary: colors[1],
          accent: colors[2],
        };
      }
    }
  }

  // Finalize — AI produced useful data
  aiConfidenceScore = Math.round((completedSteps / stepsToRun.length) * 80) + (allSources.length > 3 ? 20 : allSources.length * 5);
  aiConfidenceScore = Math.min(100, aiConfidenceScore);

  canvas.processing = {
    version: 2,
    status: 'completed',
    steps,
    aiConfidenceScore,
    dataSources: Array.from(new Set(allSources)),
    lastProcessedAt: new Date().toISOString(),
    history: [
      ...(canvas.processing?.history || []),
      {
        date: new Date().toISOString(),
        score: aiConfidenceScore,
        sources: Array.from(new Set(allSources)),
      },
    ].slice(-50),
  };

  canvas.lastUpdatedAt = new Date().toISOString();
  canvas.completionScore = calculateCanvasCompletionScoreV2(canvas);

  // Sync V1 compat fields from V2 nested objects
  if (canvas.voice) {
    canvas.brandVoice = canvas.brandVoice || canvas.voice.toneType;
    canvas.brandVoiceDescription = canvas.brandVoiceDescription || canvas.voice.toneDescription;
    canvas.doList = canvas.doList?.length ? canvas.doList : canvas.voice.doList;
    canvas.dontList = canvas.dontList?.length ? canvas.dontList : canvas.voice.dontList;
  }
  if (canvas.contentStrategy) {
    canvas.idealContentTypes = canvas.idealContentTypes?.length ? canvas.idealContentTypes : canvas.contentStrategy.idealContentTypes;
    canvas.hooks = canvas.hooks?.length ? canvas.hooks : canvas.contentStrategy.hooks;
    canvas.keyMessages = canvas.keyMessages?.length ? canvas.keyMessages : canvas.contentStrategy.keyMessages;
    canvas.callToAction = canvas.callToAction || canvas.contentStrategy.callToAction;
    canvas.avoidTopics = canvas.avoidTopics || canvas.contentStrategy.avoidTopics;
  }
  if (canvas.references) {
    canvas.referenceCreators = canvas.referenceCreators || canvas.references.referenceCreators;
    canvas.competitorBrands = canvas.competitorBrands?.length ? canvas.competitorBrands : canvas.references.competitorBrands;
    canvas.referenceUrls = canvas.referenceUrls?.length ? canvas.referenceUrls : canvas.references.referenceUrls;
    canvas.brandAssets = canvas.brandAssets?.length ? canvas.brandAssets : canvas.references.brandAssets;
  }

  // Save final state
  await db.update(companies).set({
    brandCanvas: canvas,
  }).where(eq(companies.id, companyId));

  // Notify completion
  try {
    const event: WebSocketEvent = {
      type: 'brand_canvas:completed',
      companyId,
      confidenceScore: aiConfidenceScore,
    };
    notificationWS?.sendEventToUser(userId, event);
  } catch {}

  console.log(`[BrandCanvas] Pipeline completed for company ${companyId}. Score: ${aiConfidenceScore}, Sources: ${allSources.join(', ')}`);

  return canvas;
}
