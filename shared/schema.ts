import { pgTable, pgSchema, text, serial, integer, boolean, timestamp, jsonb, unique, date, pgEnum, uniqueIndex, index } from "drizzle-orm/pg-core";

// ==========================================
// DATABASE SCHEMAS (multi-schema PostgreSQL)
// ==========================================
export const academySchema = pgSchema("academy");
export const analyticsSchema = pgSchema("analytics");
export const billingSchema = pgSchema("billing");
export const brandSchema = pgSchema("brand");
export const campaignSchema = pgSchema("campaign");
export const companySchema = pgSchema("company");
export const contentSchema = pgSchema("content");
export const coreSchema = pgSchema("core");
export const creatorSchema = pgSchema("creator");
export const gamificationSchema = pgSchema("gamification");
export const messagingSchema = pgSchema("messaging");
export const miscSchema = pgSchema("misc");
export const socialSchema = pgSchema("social");
export const systemSchema = pgSchema("system");
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const platformEnum = pgEnum("platform", ["instagram", "tiktok", "youtube", "twitter", "linkedin", "pinterest", "kwai"]);

export const contentFormatEnum = pgEnum("content_format", ["photo", "carousel", "reels", "stories", "video", "short", "live", "ugc"]);

export const deliverableTypeEnum = pgEnum("deliverable_type", [
  "instagram_post", "instagram_reels", "instagram_stories", "instagram_carousel",
  "tiktok_video", "youtube_video", "youtube_shorts",
  "ugc_video", "ugc_photo", "review", "unboxing", "tutorial", "other"
]);

export const nicheEnum = pgEnum("niche", [
  "tech", "lifestyle", "beauty", "education", "finance", "health",
  "travel", "food", "entertainment", "sports", "pets", "parenting", "business", "other"
]);

export const tagTypeEnum = pgEnum("tag_type", [
  "niche", "style", "vertical", "audience", "skill", "platform"
]);

export const campaignDeliverableTypeEnum = pgEnum("campaign_deliverable_type", [
  "reel", "story", "post", "tiktok", "youtube_short", "youtube_long", "live", "ugc_raw"
]);

export const structuredDeliverableSchema = z.object({
  type: z.enum([
    "instagram_post", "instagram_reels", "instagram_stories", "instagram_carousel",
    "tiktok_video", "youtube_video", "youtube_shorts",
    "ugc_video", "ugc_photo", "review", "unboxing", "tutorial", "other"
  ]),
  quantity: z.number().int().min(1).default(1),
  notes: z.string().max(200).optional(),
});

export type StructuredDeliverable = z.infer<typeof structuredDeliverableSchema>;

export interface WebSocketMessage {
  id: number;
  applicationId: number;
  senderId: number;
  receiverId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: { id: number; name: string; avatar: string | null };
  receiver: { id: number; name: string; avatar: string | null };
}

export type WebSocketEvent = 
  | { type: 'notification'; data: any }
  | { type: 'campaign:briefing_updated'; campaignId: number }
  | { type: 'deliverable:created'; applicationId: number; campaignId: number }
  | { type: 'deliverable:comment_created'; deliverableId: number; applicationId: number }
  | { type: 'application:created'; campaignId: number }
  | { type: 'campaign_invite'; title: string; message: string; actionUrl: string; inviteId: number; campaignId: number; campaignTitle: string; companyName: string }
  | { type: 'creator:workflow_changed'; applicationId: number; campaignId: number; newStatus: string }
  | { type: 'message:new'; applicationId?: number; conversationId?: number; message?: WebSocketMessage; payload?: { conversationId: number; message: any } }
  | { type: 'instagram_dm'; data: { conversationId: string; senderId: string; messageText: string | null; messageType: string; timestamp: number } }
  | { type: 'dm_sync_progress'; data: { page: number; totalConversations: number; synced: number; errors: number; done: boolean } }
  | { type: 'brand_canvas:processing'; companyId: number; step: string; status: BrandCanvasStepStatus; progress: number; message: string }
  | { type: 'brand_canvas:completed'; companyId: number; confidenceScore: number }
  | { type: 'brand_canvas:failed'; companyId: number; error: string };

export interface InstagramTopPost {
  id: string;
  url: string;
  imageUrl: string;
  caption: string;
  likes: number;
  comments: number;
  timestamp: string;
}

export function isValidInstagramUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && 
           (parsed.hostname === 'www.instagram.com' || 
            parsed.hostname === 'instagram.com' ||
            parsed.hostname.endsWith('.cdninstagram.com') ||
            parsed.hostname.endsWith('.fbcdn.net'));
  } catch {
    return false;
  }
}

export function sanitizeCaption(caption: string): string {
  if (!caption || typeof caption !== 'string') return '';
  return caption
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .substring(0, 200);
}

export function validateInstagramTopPost(post: any): InstagramTopPost | null {
  if (!post || typeof post !== 'object') return null;
  
  const id = String(post.id || '').substring(0, 100);
  const url = String(post.url || '');
  const imageUrl = String(post.imageUrl || '');
  const caption = sanitizeCaption(post.caption);
  const likes = Math.max(0, parseInt(post.likes) || 0);
  const comments = Math.max(0, parseInt(post.comments) || 0);
  const timestamp = String(post.timestamp || new Date().toISOString());
  
  if (!id || !isValidInstagramUrl(url)) return null;
  
  return { id, url, imageUrl, caption, likes, comments, timestamp };
}

export const users = coreSchema.table("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(), // Made email unique
  password: text("password"),
  googleId: text("google_id"),
  role: text("role", { enum: ["company", "creator", "admin"] }).notNull(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  isBanned: boolean("is_banned").notNull().default(false),
  
  // Creator specific fields
  bio: text("bio"),
  dateOfBirth: date("date_of_birth"),
  gender: text("gender", { enum: ["masculino", "feminino", "outro", "prefiro_nao_informar"] }),
  niche: text("niche").array(), // Stores multiple niches as an array
  followers: text("followers"),
  instagram: text("instagram"),
  youtube: text("youtube"),
  tiktok: text("tiktok"),
  portfolioUrl: text("portfolio_url"),
  
  // Instagram verified metrics
  instagramFollowers: integer("instagram_followers"),
  instagramFollowing: integer("instagram_following"),
  instagramPosts: integer("instagram_posts"),
  instagramEngagementRate: text("instagram_engagement_rate"),
  instagramVerified: boolean("instagram_verified"),
  instagramAuthenticityScore: integer("instagram_authenticity_score"),
  instagramTopHashtags: text("instagram_top_hashtags").array(),
  instagramTopPosts: jsonb("instagram_top_posts").$type<{
    id: string;
    url: string;
    imageUrl: string;
    caption: string;
    likes: number;
    comments: number;
    timestamp: string;
  }[]>(),
  instagramBio: text("instagram_bio"),
  instagramProfilePic: text("instagram_profile_pic"),
  instagramLastUpdated: timestamp("instagram_last_updated"),
  
  // TikTok verified metrics
  tiktokFollowers: integer("tiktok_followers"),
  tiktokFollowing: integer("tiktok_following"),
  tiktokHearts: integer("tiktok_hearts"),
  tiktokVideos: integer("tiktok_videos"),
  tiktokEngagementRate: text("tiktok_engagement_rate"),
  tiktokVerified: boolean("tiktok_verified"),
  tiktokBio: text("tiktok_bio"),
  tiktokProfilePic: text("tiktok_profile_pic"),
  tiktokTopVideos: jsonb("tiktok_top_videos").$type<{
    id: string;
    url: string;
    thumbnailUrl: string;
    description: string;
    plays: number;
    likes: number;
    comments: number;
    shares: number;
    timestamp: string;
  }[]>(),
  tiktokLastUpdated: timestamp("tiktok_last_updated"),
  
  // YouTube verified metrics
  youtubeSubscribers: integer("youtube_subscribers"),
  youtubeTotalViews: integer("youtube_total_views"),
  youtubeVideosCount: integer("youtube_videos_count"),
  youtubeVerified: boolean("youtube_verified"),
  youtubeChannelId: text("youtube_channel_id"),
  youtubeDescription: text("youtube_description"),
  youtubeThumbnail: text("youtube_thumbnail"),
  youtubeTopVideos: jsonb("youtube_top_videos").$type<{
    id: string;
    url: string;
    thumbnailUrl: string;
    title: string;
    views: number;
    likes: number;
    duration: string;
    publishedAt: string;
  }[]>(),
  youtubeLastUpdated: timestamp("youtube_last_updated"),
  
  // Profile enrichment metadata
  enrichmentScore: integer("enrichment_score"),
  lastEnrichedAt: timestamp("last_enriched_at"),
  enrichmentSource: text("enrichment_source"),
  
  // Banking Info (Pix only as requested)
  pixKey: text("pix_key"),
  
  // Personal/Registration Info
  cpf: text("cpf"),
  phone: text("phone"),
  // Address broken down
  cep: text("cep"),
  street: text("street"),
  number: text("number"),
  neighborhood: text("neighborhood"),
  city: text("city"),
  state: text("state"),
  complement: text("complement"),
  
  // Company specific
  companyName: text("company_name"),

  // Email Verification
  isVerified: boolean("is_verified").notNull().default(false),
  verificationToken: text("verification_token"),
  
  // Password Reset
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Session table managed by connect-pg-simple
export const session = systemSchema.table("session", {
  sid: text("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// Structured briefing for brand intelligence
export interface StructuredBriefing {
  whatWeDo?: string;
  targetAudience?: string;
  brandVoice?: string;
  differentials?: string;
  idealContentTypes?: string[];
  avoidTopics?: string;
  referenceCreators?: string;
}

export const structuredBriefingSchema = z.object({
  whatWeDo: z.string().max(500).optional(),
  targetAudience: z.string().max(500).optional(),
  brandVoice: z.string().max(50).optional(),
  differentials: z.string().max(500).optional(),
  idealContentTypes: z.array(z.string().max(50)).max(20).optional(),
  avoidTopics: z.string().max(500).optional(),
  referenceCreators: z.string().max(500).optional(),
}).nullable();

// ==========================================
// Brand Canvas V2 — structured brand knowledge for UGC briefings
// ==========================================

// --- Shared sub-types (used in both V1 compat and V2) ---
export interface BrandCanvasAsset {
  url: string;
  type: 'image' | 'video';
  source: 'upload' | 'instagram' | 'campaign';
  caption?: string;
  instagramPostId?: string;
  campaignId?: number;
}

export interface BrandCanvasProduct {
  name: string;
  description?: string;
  benefits?: string;
  valueProposition?: string;
  priceRange?: string;
  imageUrl?: string;
  category?: string;
}

export interface BrandCanvasPersona {
  id?: string;
  name?: string;
  ageRange?: string;
  gender?: string;
  location?: string;
  interests?: string[];
  painPoints?: string[];
  desires?: string[];
  blockers?: string[];
}

// --- V2 sub-types ---
export interface BrandCanvasColorPalette {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  text?: string;
  additional?: string[];
  gradients?: string[];
}

export interface BrandCanvasTypography {
  headingFont?: string;
  bodyFont?: string;
  fontScale?: 'compact' | 'normal' | 'large';
  fontPairingSuggestion?: string;
}

export interface BrandCanvasVisualIdentity {
  colors?: BrandCanvasColorPalette;
  typography?: BrandCanvasTypography;
  logoUrl?: string;
  logoAnalysis?: string;
  visualAesthetic?: string;
  moodKeywords?: string[];
}

export interface BrandCanvasVoice {
  toneType?: string;
  toneDescription?: string;
  personalityTraits?: string[];
  languageStyle?: string;
  keywords?: string[];
  doList?: string[];
  dontList?: string[];
  exampleCaptions?: string[];
  emojiUsage?: 'none' | 'minimal' | 'moderate' | 'heavy';
}

export interface BrandCanvasContentStrategy {
  idealContentTypes?: string[];
  hooks?: string[];
  keyMessages?: string[];
  callToAction?: string;
  avoidTopics?: string;
  hashtagStrategy?: string[];
}

export interface BrandCanvasCompetitor {
  name: string;
  instagram?: string;
  website?: string;
  insights?: string;
}

export interface BrandCanvasReference {
  referenceCreators?: string;
  competitorBrands?: string[];
  competitors?: BrandCanvasCompetitor[];
  referenceBrands?: string[];
  referenceUrls?: string[];
  brandAssets?: BrandCanvasAsset[];
  avoidWords?: string[];
}

export type BrandCanvasStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface BrandCanvasProcessingStep {
  name: string;
  status: BrandCanvasStepStatus;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface BrandCanvasProcessingMeta {
  version: number;
  status: 'idle' | 'processing' | 'completed' | 'failed';
  currentStep?: string;
  steps?: BrandCanvasProcessingStep[];
  aiConfidenceScore?: number;
  dataSources?: string[];
  lastProcessedAt?: string;
  error?: string;
  history?: { date: string; score: number; sources: string[] }[];
}

// --- V2 Main Interface ---
export interface BrandCanvasV2 {
  // Identity
  aboutBrand?: string;
  whatWeDo?: string;
  differentials?: string;
  mission?: string;
  vision?: string;
  coreValues?: string[];
  slogan?: string;
  marketPositioning?: string;

  // Visual Identity
  visualIdentity?: BrandCanvasVisualIdentity;

  // Voice & Tone
  voice?: BrandCanvasVoice;

  // Products
  products?: BrandCanvasProduct[];

  // Audience
  targetAudience?: string;
  demographics?: string;
  personas?: BrandCanvasPersona[];
  painPoints?: string[];
  desiredEmotions?: string[];

  // Angles & Psychological Triggers (UGC briefing focus)
  problemsAndDesires?: string[];
  transformationStories?: string;
  valueProposition?: string;
  commercialStrategies?: string;

  // Content Strategy
  contentStrategy?: BrandCanvasContentStrategy;

  // References
  references?: BrandCanvasReference;

  // Processing metadata
  processing?: BrandCanvasProcessingMeta;

  // V1 compat fields (kept for lazy migration)
  brandVoice?: string;
  brandVoiceDescription?: string;
  doList?: string[];
  dontList?: string[];
  idealContentTypes?: string[];
  avoidTopics?: string;
  referenceCreators?: string;
  competitorBrands?: string[];
  referenceUrls?: string[];
  brandAssets?: BrandCanvasAsset[];
  hooks?: string[];
  keyMessages?: string[];
  callToAction?: string;

  // Generation context (user-provided for AI pipeline)
  generationContext?: {
    selectedPostIds?: string[];
    uploadedReferences?: BrandCanvasAsset[];
    questionnaire?: {
      tonePreference?: string;
      targetAudience?: string;
      inspirationBrands?: string;
      communicationAvoid?: string;
      brandEssence?: string;
    };
  };

  // Metadata
  lastUpdatedAt?: string;
  completionScore?: number;
}

// Legacy alias — BrandCanvas now maps to V2
export type BrandCanvas = BrandCanvasV2;

// --- Zod Schemas ---
const brandCanvasAssetSchema = z.object({
  url: z.string(),
  type: z.enum(['image', 'video']),
  source: z.enum(['upload', 'instagram', 'campaign']),
  caption: z.string().max(300).optional(),
  instagramPostId: z.string().optional(),
  campaignId: z.number().optional(),
});

const brandCanvasProductSchema = z.object({
  name: z.string().max(200),
  description: z.string().max(500).optional(),
  benefits: z.string().max(500).optional(),
  valueProposition: z.string().max(500).optional(),
  priceRange: z.string().max(100).optional(),
  imageUrl: z.string().max(500).optional(),
  category: z.string().max(100).optional(),
});

const brandCanvasPersonaSchema = z.object({
  id: z.string().max(50).optional(),
  name: z.string().max(100).optional(),
  ageRange: z.string().max(50).optional(),
  gender: z.string().max(50).optional(),
  location: z.string().max(100).optional(),
  interests: z.array(z.string().max(100)).max(20).optional(),
  painPoints: z.array(z.string().max(200)).max(10).optional(),
  desires: z.array(z.string().max(200)).max(10).optional(),
  blockers: z.array(z.string().max(200)).max(10).optional(),
});

const brandCanvasColorPaletteSchema = z.object({
  primary: z.string().max(20).optional(),
  secondary: z.string().max(20).optional(),
  accent: z.string().max(20).optional(),
  background: z.string().max(20).optional(),
  text: z.string().max(20).optional(),
  additional: z.array(z.string().max(20)).max(10).optional(),
  gradients: z.array(z.string().max(100)).max(5).optional(),
});

const brandCanvasTypographySchema = z.object({
  headingFont: z.string().max(100).optional(),
  bodyFont: z.string().max(100).optional(),
  fontScale: z.enum(['compact', 'normal', 'large']).optional(),
  fontPairingSuggestion: z.string().max(200).optional(),
});

const brandCanvasVisualIdentitySchema = z.object({
  colors: brandCanvasColorPaletteSchema.optional(),
  typography: brandCanvasTypographySchema.optional(),
  logoUrl: z.string().max(500).optional(),
  logoAnalysis: z.string().max(1000).optional(),
  visualAesthetic: z.string().max(50).optional(),
  moodKeywords: z.array(z.string().max(50)).max(20).optional(),
});

const brandCanvasVoiceSchema = z.object({
  toneType: z.string().max(50).optional(),
  toneDescription: z.string().max(500).optional(),
  personalityTraits: z.array(z.string().max(100)).max(10).optional(),
  languageStyle: z.string().max(50).optional(),
  keywords: z.array(z.string().max(100)).max(30).optional(),
  doList: z.array(z.string().max(200)).max(20).optional(),
  dontList: z.array(z.string().max(200)).max(20).optional(),
  exampleCaptions: z.array(z.string().max(500)).max(10).optional(),
  emojiUsage: z.enum(['none', 'minimal', 'moderate', 'heavy']).optional(),
});

const brandCanvasContentStrategySchema = z.object({
  idealContentTypes: z.array(z.string().max(50)).max(20).optional(),
  hooks: z.array(z.string().max(300)).max(20).optional(),
  keyMessages: z.array(z.string().max(300)).max(20).optional(),
  callToAction: z.string().max(300).optional(),
  avoidTopics: z.string().max(500).optional(),
  hashtagStrategy: z.array(z.string().max(100)).max(30).optional(),
});

const brandCanvasCompetitorSchema = z.object({
  name: z.string().max(200),
  instagram: z.string().max(200).optional(),
  website: z.string().max(500).optional(),
  insights: z.string().max(500).optional(),
});

const brandCanvasReferenceSchema = z.object({
  referenceCreators: z.string().max(500).optional(),
  competitorBrands: z.array(z.string().max(200)).max(20).optional(),
  competitors: z.array(brandCanvasCompetitorSchema).max(10).optional(),
  referenceBrands: z.array(z.string().max(200)).max(10).optional(),
  referenceUrls: z.array(z.string().max(500)).max(20).optional(),
  brandAssets: z.array(brandCanvasAssetSchema).max(50).optional(),
  avoidWords: z.array(z.string().max(100)).max(30).optional(),
});

const brandCanvasProcessingStepSchema = z.object({
  name: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'skipped']),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  error: z.string().optional(),
});

const brandCanvasProcessingMetaSchema = z.object({
  version: z.number().default(2),
  status: z.enum(['idle', 'processing', 'completed', 'failed']).default('idle'),
  currentStep: z.string().optional(),
  steps: z.array(brandCanvasProcessingStepSchema).optional(),
  aiConfidenceScore: z.number().min(0).max(100).optional(),
  dataSources: z.array(z.string()).optional(),
  lastProcessedAt: z.string().optional(),
  error: z.string().optional(),
  history: z.array(z.object({
    date: z.string(),
    score: z.number(),
    sources: z.array(z.string()),
  })).max(50).optional(),
});

export const brandCanvasSchema = z.object({
  // Identity
  aboutBrand: z.string().max(500).optional(),
  whatWeDo: z.string().max(500).optional(),
  differentials: z.string().max(500).optional(),
  mission: z.string().max(500).optional(),
  vision: z.string().max(500).optional(),
  coreValues: z.array(z.string().max(100)).max(15).optional(),
  slogan: z.string().max(300).optional(),
  marketPositioning: z.string().max(500).optional(),

  // Visual Identity (V2)
  visualIdentity: brandCanvasVisualIdentitySchema.optional(),

  // Voice (V2)
  voice: brandCanvasVoiceSchema.optional(),

  // Products
  products: z.array(brandCanvasProductSchema).max(30).optional(),

  // Audience
  targetAudience: z.string().max(500).optional(),
  demographics: z.string().max(500).optional(),
  personas: z.array(brandCanvasPersonaSchema).max(10).optional(),
  painPoints: z.array(z.string().max(300)).max(15).optional(),
  desiredEmotions: z.array(z.string().max(100)).max(10).optional(),

  // Angles & Psychological Triggers
  problemsAndDesires: z.array(z.string().max(300)).max(15).optional(),
  transformationStories: z.string().max(1000).optional(),
  valueProposition: z.string().max(300).optional(),
  commercialStrategies: z.string().max(500).optional(),

  // Content Strategy (V2)
  contentStrategy: brandCanvasContentStrategySchema.optional(),

  // References (V2)
  references: brandCanvasReferenceSchema.optional(),

  // Processing (V2)
  processing: brandCanvasProcessingMetaSchema.optional(),

  // V1 compat flat fields
  brandVoice: z.string().max(50).optional(),
  brandVoiceDescription: z.string().max(500).optional(),
  doList: z.array(z.string().max(200)).max(20).optional(),
  dontList: z.array(z.string().max(200)).max(20).optional(),
  idealContentTypes: z.array(z.string().max(50)).max(20).optional(),
  avoidTopics: z.string().max(500).optional(),
  referenceCreators: z.string().max(500).optional(),
  competitorBrands: z.array(z.string().max(200)).max(20).optional(),
  referenceUrls: z.array(z.string().max(500)).max(20).optional(),
  brandAssets: z.array(brandCanvasAssetSchema).max(50).optional(),
  hooks: z.array(z.string().max(300)).max(20).optional(),
  keyMessages: z.array(z.string().max(300)).max(20).optional(),
  callToAction: z.string().max(300).optional(),

  // Generation context
  generationContext: z.object({
    selectedPostIds: z.array(z.string()).max(10).optional(),
    uploadedReferences: z.array(brandCanvasAssetSchema).max(5).optional(),
    questionnaire: z.object({
      tonePreference: z.string().max(50).optional(),
      targetAudience: z.string().max(300).optional(),
      inspirationBrands: z.string().max(300).optional(),
      communicationAvoid: z.string().max(300).optional(),
      brandEssence: z.string().max(200).optional(),
    }).optional(),
  }).optional(),

  // Metadata
  lastUpdatedAt: z.string().optional(),
  completionScore: z.number().min(0).max(100).optional(),
}).nullable();

// Campaign reward types
export interface CampaignReward {
  place: number;
  rewardType: 'cash' | 'product' | 'points' | 'coupon';
  value: number;
  description?: string;
}

// Campaign eligibility rules
export interface CampaignEligibility {
  minTierId?: number;
  minPoints?: number;
  allowedTiers?: number[];
}

export const campaigns = campaignSchema.table("campaigns", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements").array().notNull(),
  deliverables: text("deliverables").array().default([]),
  structuredDeliverables: jsonb("structured_deliverables").$type<StructuredDeliverable[]>().default([]),
  targetPlatforms: text("target_platforms").array().default([]),
  budget: text("budget").notNull(),
  deadline: text("deadline").notNull(),
  creatorsNeeded: integer("creators_needed").notNull(),
  targetNiche: text("target_niche").array(),
  targetAgeRanges: text("target_age_ranges").array(),
  targetRegions: text("target_regions").array(),
  targetGender: text("target_gender", { enum: ["masculino", "feminino", "outro", "prefiro_nao_informar"] }),
  status: text("status", { enum: ["open", "closed"] }).notNull().default("open"),
  visibility: text("visibility", { enum: ["public", "private", "community_only"] }).notNull().default("public"),
  minTierId: integer("min_tier_id"),
  minPoints: integer("min_points").default(0),
  allowedTiers: jsonb("allowed_tiers").$type<number[]>().default([]),
  rewardsJson: jsonb("rewards_json").$type<CampaignReward[]>().default([]),
  templateId: integer("template_id"),
  briefingText: text("briefing_text"),
  briefingMaterials: text("briefing_materials").array(),
  inheritsBrandRules: boolean("inherits_brand_rules").notNull().default(true),
  rewardMode: text("reward_mode", { enum: ["ranking", "threshold", "none"] }).default("ranking"),
  allowSeeding: boolean("allow_seeding").notNull().default(true),
  allowPayment: boolean("allow_payment").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Etapas fixas do criador para o fluxo de produção
export const creatorWorkflowStages = [
  "aceito",
  "contrato", 
  "aguardando_produto",
  "producao",
  "revisao",
  "entregue"
] as const;

export type CreatorWorkflowStatus = typeof creatorWorkflowStages[number];

export const deliverableTypes = [
  "post_feed",
  "reels",
  "stories",
  "tiktok",
  "youtube_video",
  "youtube_shorts",
  "twitter_post",
  "other"
] as const;

export type DeliverableType = typeof deliverableTypes[number];

export const deliverableTypeLabels: Record<DeliverableType, string> = {
  post_feed: "Post Feed",
  reels: "Reels",
  stories: "Stories",
  tiktok: "TikTok",
  youtube_video: "YouTube Video",
  youtube_shorts: "YouTube Shorts",
  twitter_post: "Twitter/X Post",
  other: "Outro"
};

export const applications = campaignSchema.table("applications", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  status: text("status", { enum: ["pending", "accepted", "rejected"] }).notNull().default("pending"),
  workflowStatus: text("workflow_status"),
  creatorWorkflowStatus: text("creator_workflow_status", { 
    enum: ["aceito", "contrato", "aguardando_produto", "producao", "revisao", "entregue"] 
  }).default("aceito"),
  message: text("message"),
  appliedAt: timestamp("applied_at").defaultNow(),
  seedingStatus: text("seeding_status", { 
    enum: ["not_required", "pending", "sent", "received"] 
  }).default("not_required"),
  seedingSentAt: timestamp("seeding_sent_at"),
  seedingReceivedAt: timestamp("seeding_received_at"),
  seedingTrackingCode: text("seeding_tracking_code"),
  seedingNotes: text("seeding_notes"),
}, (table) => ({
  uniqueApplication: unique().on(table.campaignId, table.creatorId),
}));

export const deliverables = campaignSchema.table("deliverables", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => applications.id),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type"),
  deliverableType: text("deliverable_type", { 
    enum: ["post_feed", "reels", "stories", "tiktok", "youtube_video", "youtube_shorts", "twitter_post", "other"] 
  }).default("other"),
  description: text("description"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const notifications = systemSchema.table("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type", { 
    enum: ["new_campaign", "application_accepted", "application_rejected", "new_applicant", "message", "workflow_update", "deliverable_uploaded", "campaign_invite", "favorite_company_campaign", "review_reminder", "review_revealed", "seeding_sent", "seeding_received", "new_instagram_post"] 
  }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  actionUrl: text("action_url"),
  isRead: boolean("is_read").notNull().default(false),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const problemReports = miscSchema.table("problem_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: text("status", { enum: ["open", "in_progress", "resolved"] }).notNull().default("open"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const favoriteCreators = miscSchema.table("favorite_creators", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueFavorite: unique().on(table.companyId, table.creatorId),
}));

export const favoriteCompanies = miscSchema.table("favorite_companies", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  companyId: integer("company_id").notNull().references(() => companies.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueFavorite: unique().on(table.creatorId, table.companyId),
}));

export const campaignInvites = campaignSchema.table("campaign_invites", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  companyId: integer("company_id").notNull().references(() => companies.id),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  status: text("status", { enum: ["pending", "accepted", "declined"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  respondedAt: timestamp("responded_at"),
}, (table) => ({
  uniqueInvite: unique().on(table.campaignId, table.creatorId),
}));


export const deliverableComments = campaignSchema.table("deliverable_comments", {
  id: serial("id").primaryKey(),
  deliverableId: integer("deliverable_id").notNull().references(() => deliverables.id),
  userId: integer("user_id").notNull().references(() => users.id),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const campaignTemplates = campaignSchema.table("campaign_templates", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  description: text("description"),
  title: text("title").notNull(),
  campaignDescription: text("campaign_description").notNull(),
  requirements: text("requirements").array().notNull(),
  structuredDeliverables: jsonb("structured_deliverables").$type<StructuredDeliverable[]>().default([]),
  targetPlatforms: text("target_platforms").array().default([]),
  budget: text("budget").notNull(),
  deadline: text("deadline").notNull(),
  creatorsNeeded: integer("creators_needed").notNull(),
  targetNiche: text("target_niche").array(),
  targetAgeRanges: text("target_age_ranges").array(),
  targetRegions: text("target_regions").array(),
  targetGender: text("target_gender", { enum: ["masculino", "feminino", "outro", "prefiro_nao_informar"] }),
  visibility: text("visibility", { enum: ["public", "private", "community_only"] }).default("public"),
  minTierId: integer("min_tier_id"),
  minPoints: integer("min_points").default(0),
  allowedTiers: jsonb("allowed_tiers").$type<number[]>().default([]),
  rewardsJson: jsonb("rewards_json").$type<CampaignReward[]>().default([]),
  rewardMode: text("reward_mode", { enum: ["ranking", "threshold", "none"] }).default("ranking"),
  briefingText: text("briefing_text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


// Multi-tenant: Companies (Lojas)
// Brand categories for discovery
export const brandCategories = [
  "saude",
  "beleza", 
  "moda",
  "tecnologia",
  "alimentos",
  "bebidas",
  "fitness",
  "casa",
  "pets",
  "infantil",
  "servicos",
  "outros"
] as const;

export type BrandCategory = typeof brandCategories[number];

export const companies = companySchema.table("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  tradeName: text("trade_name"),
  slug: text("slug").unique(),
  logo: text("logo"),
  coverPhoto: text("cover_photo"),
  description: text("description"),
  cnpj: text("cnpj"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  instagram: text("instagram"),
  cep: text("cep"),
  street: text("street"),
  number: text("number"),
  neighborhood: text("neighborhood"),
  city: text("city"),
  state: text("state"),
  complement: text("complement"),
  
  // Discovery fields
  category: text("category", { enum: brandCategories }),
  isDiscoverable: boolean("is_discoverable").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),
  tagline: text("tagline"),
  
  // Community settings
  autoJoinCommunity: boolean("auto_join_community").notNull().default(true),
  
  // Onboarding
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  
  // TikTok
  tiktok: text("tiktok"),
  
  // Instagram verified metrics
  instagramFollowers: integer("instagram_followers"),
  instagramFollowing: integer("instagram_following"),
  instagramPosts: integer("instagram_posts"),
  instagramEngagementRate: text("instagram_engagement_rate"),
  instagramVerified: boolean("instagram_verified"),
  instagramBio: text("instagram_bio"),
  instagramProfilePic: text("instagram_profile_pic"),
  instagramLastUpdated: timestamp("instagram_last_updated"),
  
  // TikTok verified metrics
  tiktokFollowers: integer("tiktok_followers"),
  tiktokHearts: integer("tiktok_hearts"),
  tiktokVideos: integer("tiktok_videos"),
  tiktokVerified: boolean("tiktok_verified"),
  tiktokBio: text("tiktok_bio"),
  tiktokLastUpdated: timestamp("tiktok_last_updated"),
  
  // CNPJ enrichment (ReceitaWS)
  cnpjRazaoSocial: text("cnpj_razao_social"),
  cnpjNomeFantasia: text("cnpj_nome_fantasia"),
  cnpjSituacao: text("cnpj_situacao"),
  cnpjAtividadePrincipal: text("cnpj_atividade_principal"),
  cnpjDataAbertura: text("cnpj_data_abertura"),
  cnpjCapitalSocial: text("cnpj_capital_social"),
  cnpjNaturezaJuridica: text("cnpj_natureza_juridica"),
  cnpjQsa: jsonb("cnpj_qsa").$type<{
    nome: string;
    qual: string;
  }[]>(),
  cnpjLastUpdated: timestamp("cnpj_last_updated"),
  
  // Website enrichment
  websiteTitle: text("website_title"),
  websiteDescription: text("website_description"),
  websiteKeywords: text("website_keywords").array(),
  websiteLastUpdated: timestamp("website_last_updated"),
  
  // Website content enrichment (rich data for AI context)
  websiteContent: text("website_content"),
  websiteAbout: text("website_about"),
  websiteFaq: jsonb("website_faq").$type<{ question: string; answer: string }[]>(),
  websitePages: jsonb("website_pages").$type<{ url: string; title: string; summary: string }[]>(),
  websiteSocialLinks: jsonb("website_social_links").$type<Record<string, string>>(),
  
  // Brand enrichment
  brandColors: text("brand_colors").array(),
  brandLogo: text("brand_logo"),

  // AI briefing
  companyBriefing: text("company_briefing"),
  structuredBriefing: jsonb("structured_briefing").$type<StructuredBriefing>(),

  // Products/services from website
  websiteProducts: text("website_products").array(),

  // E-commerce enrichment
  ecommerceProducts: jsonb("ecommerce_products").$type<{
    name: string;
    price?: string;
    currency?: string;
    imageUrl?: string;
    url?: string;
    category?: string;
    description?: string;
  }[]>(),
  ecommerceProductCount: integer("ecommerce_product_count"),
  ecommerceCategories: text("ecommerce_categories").array(),
  ecommercePlatform: text("ecommerce_platform"),
  ecommerceLastUpdated: timestamp("ecommerce_last_updated"),
  
  // AI context summary (generated from all enrichment data)
  aiContextSummary: text("ai_context_summary"),
  aiContextLastUpdated: timestamp("ai_context_last_updated"),
  
  // Company profile
  annualRevenue: text("annual_revenue"),

  // Enrichment metadata
  // Brand Canvas (structured brand knowledge for UGC briefings)
  brandCanvas: jsonb("brand_canvas").$type<BrandCanvas>(),

  enrichmentScore: integer("enrichment_score"),
  lastEnrichedAt: timestamp("last_enriched_at"),

  createdByUserId: integer("created_by_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Taxonomy System: Tags
export const tags = systemSchema.table("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: tagTypeEnum("type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueNameType: unique().on(table.name, table.type),
}));

export const creatorTags = creatorSchema.table("creator_tags", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueCreatorTag: unique().on(table.creatorId, table.tagId),
}));

export const brandTags = brandSchema.table("brand_tags", {
  id: serial("id").primaryKey(),
  brandId: integer("brand_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueBrandTag: unique().on(table.brandId, table.tagId),
}));

export const campaignTags = campaignSchema.table("campaign_tags", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueCampaignTag: unique().on(table.campaignId, table.tagId),
}));

// Drizzle-Zod schemas for taxonomy
export const insertTagSchema = createInsertSchema(tags).omit({ id: true, createdAt: true });
export const insertCreatorTagSchema = createInsertSchema(creatorTags).omit({ id: true, createdAt: true });
export const insertBrandTagSchema = createInsertSchema(brandTags).omit({ id: true, createdAt: true });
export const insertCampaignTagSchema = createInsertSchema(campaignTags).omit({ id: true, createdAt: true });
export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;
export type CreatorTag = typeof creatorTags.$inferSelect;
export type InsertCreatorTag = z.infer<typeof insertCreatorTagSchema>;
export type BrandTag = typeof brandTags.$inferSelect;
export type InsertBrandTag = z.infer<typeof insertBrandTagSchema>;
export type CampaignTag = typeof campaignTags.$inferSelect;
export type InsertCampaignTag = z.infer<typeof insertCampaignTagSchema>;
// Tag type values for frontend
export const tagTypes = ["niche", "style", "vertical", "audience", "skill", "platform"] as const;
export type TagType = typeof tagTypes[number];

export const campaignDeliverableTypes = ["reel", "story", "post", "tiktok", "youtube_short", "youtube_long", "live", "ugc_raw"] as const;
export type CampaignDeliverableType = typeof campaignDeliverableTypes[number];

export const campaignDeliverableTypeLabels: Record<CampaignDeliverableType, string> = {
  reel: "Reels",
  story: "Stories",
  post: "Post Feed",
  tiktok: "TikTok",
  youtube_short: "YouTube Shorts",
  youtube_long: "YouTube Longo",
  live: "Live",
  ugc_raw: "UGC Raw"
};

// Multi-tenant: Company Members (Membros da Loja)
export const companyMembers = companySchema.table("company_members", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role", { enum: ["owner", "admin", "member", "reader"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueMember: unique().on(table.companyId, table.userId),
}));

// Multi-tenant: Company User Invites (Convites para Usuários da Loja)
export const companyUserInvites = companySchema.table("company_user_invites", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  email: text("email").notNull(),
  role: text("role", { enum: ["admin", "member", "reader"] }).notNull(),
  token: text("token").notNull().unique(),
  invitedByUserId: integer("invited_by_user_id").notNull().references(() => users.id),
  status: text("status", { enum: ["pending", "accepted", "expired", "cancelled"] }).notNull().default("pending"),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedByUserId: integer("accepted_by_user_id").references(() => users.id),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


// Relations
export const usersRelations = relations(users, ({ many }) => ({
  campaigns: many(campaigns),
  applications: many(applications),
  notifications: many(notifications),
  problemReports: many(problemReports),
  favoritedBy: many(favoriteCreators, { relationName: "favoritedBy" }),
  favorites: many(favoriteCreators, { relationName: "favorites" }),
  campaignTemplates: many(campaignTemplates),
  ownedCompanies: many(companies, { relationName: "ownedCompanies" }),
  companyMemberships: many(companyMembers, { relationName: "userMemberships" }),
}));

// Multi-tenant Relations
export const companiesRelations = relations(companies, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [companies.createdByUserId],
    references: [users.id],
    relationName: "ownedCompanies",
  }),
  members: many(companyMembers),
  userInvites: many(companyUserInvites),
  favoritedByCreators: many(favoriteCompanies, { relationName: "favoritedByCreators" }),
}));

export const companyMembersRelations = relations(companyMembers, ({ one }) => ({
  company: one(companies, {
    fields: [companyMembers.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [companyMembers.userId],
    references: [users.id],
    relationName: "userMemberships",
  }),
}));

export const companyUserInvitesRelations = relations(companyUserInvites, ({ one }) => ({
  company: one(companies, {
    fields: [companyUserInvites.companyId],
    references: [companies.id],
  }),
  invitedBy: one(users, {
    fields: [companyUserInvites.invitedByUserId],
    references: [users.id],
    relationName: "sentUserInvites",
  }),
  acceptedBy: one(users, {
    fields: [companyUserInvites.acceptedByUserId],
    references: [users.id],
    relationName: "acceptedUserInvites",
  }),
}));

// Workflow Stages (Customizable Kanban stages per company)
export const workflowStages = miscSchema.table("workflow_stages", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull().default("#6366f1"), // Default indigo color
  position: integer("position").notNull(),
  isDefault: boolean("is_default").notNull().default(false), // System default stages can't be deleted
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workflowStagesRelations = relations(workflowStages, ({ one }) => ({
  company: one(companies, {
    fields: [workflowStages.companyId],
    references: [companies.id],
  }),
}));

export const insertWorkflowStageSchema = createInsertSchema(workflowStages).omit({
  id: true,
  createdAt: true,
});
export type InsertWorkflowStage = z.infer<typeof insertWorkflowStageSchema>;
export type WorkflowStage = typeof workflowStages.$inferSelect;

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  company: one(users, {
    fields: [campaigns.companyId],
    references: [users.id],
  }),
  applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [applications.campaignId],
    references: [campaigns.id],
  }),
  creator: one(users, {
    fields: [applications.creatorId],
    references: [users.id],
  }),
  deliverables: many(deliverables),
}));

export const deliverablesRelations = relations(deliverables, ({ one, many }) => ({
  application: one(applications, {
    fields: [deliverables.applicationId],
    references: [applications.id],
  }),
  comments: many(deliverableComments),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const problemReportsRelations = relations(problemReports, ({ one }) => ({
  user: one(users, {
    fields: [problemReports.userId],
    references: [users.id],
  }),
}));

export const favoriteCreatorsRelations = relations(favoriteCreators, ({ one }) => ({
  company: one(users, {
    fields: [favoriteCreators.companyId],
    references: [users.id],
    relationName: "favorites",
  }),
  creator: one(users, {
    fields: [favoriteCreators.creatorId],
    references: [users.id],
    relationName: "favoritedBy",
  }),
}));

export const favoriteCompaniesRelations = relations(favoriteCompanies, ({ one }) => ({
  creator: one(users, {
    fields: [favoriteCompanies.creatorId],
    references: [users.id],
    relationName: "creatorFavorites",
  }),
  company: one(companies, {
    fields: [favoriteCompanies.companyId],
    references: [companies.id],
    relationName: "favoritedByCreators",
  }),
}));

export const campaignInvitesRelations = relations(campaignInvites, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignInvites.campaignId],
    references: [campaigns.id],
  }),
  company: one(users, {
    fields: [campaignInvites.companyId],
    references: [users.id],
    relationName: "sentInvites",
  }),
  creator: one(users, {
    fields: [campaignInvites.creatorId],
    references: [users.id],
    relationName: "receivedInvites",
  }),
}));


export const deliverableCommentsRelations = relations(deliverableComments, ({ one }) => ({
  deliverable: one(deliverables, {
    fields: [deliverableComments.deliverableId],
    references: [deliverables.id],
  }),
  user: one(users, {
    fields: [deliverableComments.userId],
    references: [users.id],
  }),
}));

export const campaignTemplatesRelations = relations(campaignTemplates, ({ one }) => ({
  company: one(users, {
    fields: [campaignTemplates.companyId],
    references: [users.id],
  }),
}));


// Deep Analytics Tables

// Creator posts - analyzed posts from Instagram/TikTok
export const creatorPosts = creatorSchema.table("creator_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  platform: text("platform", { enum: ["instagram", "tiktok"] }).notNull(),
  postId: text("post_id").notNull(), // External platform post ID
  postUrl: text("post_url").notNull(),
  postType: text("post_type", { enum: ["image", "video", "carousel", "reel", "story"] }),
  caption: text("caption"),
  thumbnailUrl: text("thumbnail_url"),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  views: integer("views").default(0),
  saves: integer("saves").default(0),
  engagementRate: text("engagement_rate"),
  hashtags: text("hashtags").array(),
  mentions: text("mentions").array(),
  aiAnalysis: text("ai_analysis"),
  postedAt: timestamp("posted_at"),
  analyzedAt: timestamp("analyzed_at").defaultNow().notNull(),
}, (table) => ({
  uniquePost: unique().on(table.userId, table.platform, table.postId),
}));

// Creator analytics history - track metrics over time
export const creatorAnalyticsHistory = analyticsSchema.table("creator_analytics_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  platform: text("platform", { enum: ["instagram", "tiktok"] }).notNull(),
  followers: integer("followers"),
  following: integer("following"),
  posts: integer("posts"),
  engagementRate: text("engagement_rate"),
  avgLikes: integer("avg_likes"),
  avgComments: integer("avg_comments"),
  avgViews: integer("avg_views"),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

// Hashtag analysis - track popular hashtags for each creator
export const creatorHashtags = creatorSchema.table("creator_hashtags", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  platform: text("platform", { enum: ["instagram", "tiktok"] }).notNull(),
  hashtag: text("hashtag").notNull(),
  usageCount: integer("usage_count").default(1),
  avgEngagement: text("avg_engagement"),
  lastUsed: timestamp("last_used"),
}, (table) => ({
  uniqueHashtag: unique().on(table.userId, table.platform, table.hashtag),
}));

// Relations for analytics tables
export const creatorPostsRelations = relations(creatorPosts, ({ one }) => ({
  user: one(users, {
    fields: [creatorPosts.userId],
    references: [users.id],
  }),
}));

export const creatorAnalyticsHistoryRelations = relations(creatorAnalyticsHistory, ({ one }) => ({
  user: one(users, {
    fields: [creatorAnalyticsHistory.userId],
    references: [users.id],
  }),
}));

// tiktokProfilesLegacy - REMOVIDO: Dados migrados para tiktok_profiles via Apify

export const creatorHashtagsRelations = relations(creatorHashtags, ({ one }) => ({
  user: one(users, {
    fields: [creatorHashtags.userId],
    references: [users.id],
  }),
}));

// Post AI Insights - stores AI-generated analysis for individual posts
export const postAiInsights = miscSchema.table("post_ai_insights", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  postId: integer("post_id").notNull().references(() => creatorPosts.id),
  platform: text("platform", { enum: ["instagram", "tiktok"] }).notNull(),
  summary: text("summary").notNull(),
  strengths: jsonb("strengths").$type<string[]>(),
  improvements: jsonb("improvements").$type<string[]>(),
  hashtags: jsonb("hashtags").$type<{ tag: string; performance: string }[]>(),
  bestTimeToPost: text("best_time_to_post"),
  audienceInsights: text("audience_insights"),
  contentScore: integer("content_score"),
  engagementPrediction: text("engagement_prediction"),
  recommendations: jsonb("recommendations").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueInsight: unique().on(table.postId),
}));

export const postAiInsightsRelations = relations(postAiInsights, ({ one }) => ({
  user: one(users, {
    fields: [postAiInsights.userId],
    references: [users.id],
  }),
  post: one(creatorPosts, {
    fields: [postAiInsights.postId],
    references: [creatorPosts.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true }).extend({
  dateOfBirth: z.string().optional().refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    if (isNaN(date.getTime())) return false;
    
    const today = new Date();
    const minDate = new Date(1900, 0, 1);
    if (date < minDate || date > today) return false;
    
    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    const finalAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate()) ? age - 1 : age;
    
    return finalAge >= 18;
  }, {
    message: "Você deve ter pelo menos 18 anos de idade"
  }),
});
export const insertCampaignSchema = createInsertSchema(campaigns)
  .omit({ id: true, createdAt: true })
  .extend({
    targetGender: z.enum(["masculino", "feminino", "outro", "prefiro_nao_informar"])
      .optional()
      .or(z.literal(""))
      .transform(val => val === "" ? undefined : val)
  });
export const insertApplicationSchema = createInsertSchema(applications).omit({ id: true, appliedAt: true });
export const insertDeliverableSchema = createInsertSchema(deliverables).omit({ id: true, uploadedAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertProblemReportSchema = createInsertSchema(problemReports).omit({ id: true, createdAt: true });
export const insertFavoriteCreatorSchema = createInsertSchema(favoriteCreators).omit({ id: true, createdAt: true });
export const insertFavoriteCompanySchema = createInsertSchema(favoriteCompanies).omit({ id: true, createdAt: true });
export const insertCampaignInviteSchema = createInsertSchema(campaignInvites).omit({ id: true, createdAt: true, respondedAt: true });
export const insertDeliverableCommentSchema = createInsertSchema(deliverableComments).omit({ id: true, createdAt: true });
export const insertCampaignTemplateSchema = createInsertSchema(campaignTemplates)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    targetGender: z.enum(["masculino", "feminino", "outro", "prefiro_nao_informar"])
      .optional()
      .or(z.literal(""))
      .transform(val => val === "" ? undefined : val)
  });

// Deep Analytics Schemas
export const insertCreatorPostSchema = createInsertSchema(creatorPosts).omit({ id: true, analyzedAt: true });
export const insertCreatorAnalyticsHistorySchema = createInsertSchema(creatorAnalyticsHistory).omit({ id: true, recordedAt: true });
// insertTiktokProfileLegacySchema - REMOVIDO: Tabela migrada para tiktok_profiles
export const insertCreatorHashtagSchema = createInsertSchema(creatorHashtags).omit({ id: true });
export const insertPostAiInsightSchema = createInsertSchema(postAiInsights).omit({ id: true, createdAt: true, updatedAt: true });

// Multi-tenant Schemas
export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true });
export const insertCompanyMemberSchema = createInsertSchema(companyMembers).omit({ id: true, createdAt: true });
export const insertCompanyUserInviteSchema = createInsertSchema(companyUserInvites).omit({ id: true, createdAt: true, acceptedAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Deliverable = typeof deliverables.$inferSelect;
export type InsertDeliverable = z.infer<typeof insertDeliverableSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type ProblemReport = typeof problemReports.$inferSelect;
export type InsertProblemReport = z.infer<typeof insertProblemReportSchema>;
export type FavoriteCreator = typeof favoriteCreators.$inferSelect;
export type InsertFavoriteCreator = z.infer<typeof insertFavoriteCreatorSchema>;
export type FavoriteCompany = typeof favoriteCompanies.$inferSelect;
export type InsertFavoriteCompany = z.infer<typeof insertFavoriteCompanySchema>;
export type CampaignInvite = typeof campaignInvites.$inferSelect;
export type InsertCampaignInvite = z.infer<typeof insertCampaignInviteSchema>;
export type DeliverableComment = typeof deliverableComments.$inferSelect;
export type InsertDeliverableComment = z.infer<typeof insertDeliverableCommentSchema>;
export type CampaignTemplate = typeof campaignTemplates.$inferSelect;
export type InsertCampaignTemplate = z.infer<typeof insertCampaignTemplateSchema>;

// Multi-tenant Types
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type CompanyMember = typeof companyMembers.$inferSelect;
export type InsertCompanyMember = z.infer<typeof insertCompanyMemberSchema>;
export type CompanyUserInvite = typeof companyUserInvites.$inferSelect;
export type InsertCompanyUserInvite = z.infer<typeof insertCompanyUserInviteSchema>;

// Deep Analytics Types
export type CreatorPost = typeof creatorPosts.$inferSelect;
export type InsertCreatorPost = z.infer<typeof insertCreatorPostSchema>;
export type CreatorAnalyticsHistory = typeof creatorAnalyticsHistory.$inferSelect;
export type InsertCreatorAnalyticsHistory = z.infer<typeof insertCreatorAnalyticsHistorySchema>;
// TiktokProfileLegacy types - REMOVIDO: Tabela migrada para tiktok_profiles
export type CreatorHashtag = typeof creatorHashtags.$inferSelect;
export type InsertCreatorHashtag = z.infer<typeof insertCreatorHashtagSchema>;
export type PostAiInsight = typeof postAiInsights.$inferSelect;
export type InsertPostAiInsight = z.infer<typeof insertPostAiInsightSchema>;

// Deep Analysis response type
export interface DeepAnalysis {
  instagram: {
    profile: {
      followers: number;
      following: number;
      posts: number;
      engagementRate: string;
      verified: boolean;
      authenticityScore: number;
    } | null;
    recentPosts: CreatorPost[];
    topHashtags: { hashtag: string; count: number; avgEngagement: string }[];
    analyticsHistory: CreatorAnalyticsHistory[];
  };
  tiktok: {
    profile: TikTokProfile | null;
    recentPosts: CreatorPost[];
    topHashtags: { hashtag: string; count: number; avgEngagement: string }[];
    analyticsHistory: CreatorAnalyticsHistory[];
  };
  lastUpdated: Date | null;
}

// Helper type for user with company memberships
export type UserWithCompanies = User & {
  memberships: (CompanyMember & { company: Company })[];
};

// ==========================================
// FEATURE FLAGS (Admin-controlled features)
// ==========================================

export const featureFlags = systemSchema.table("feature_flags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  enabled: boolean("enabled").notNull().default(false),
  module: text("module", { enum: ["gamification", "advanced_analytics", "ecommerce", "social_listening"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ==========================================
// GAMIFICATION SYSTEM
// ==========================================

export const creatorLevels = gamificationSchema.table("creator_levels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Bronze, Prata, Ouro, Diamante
  minPoints: integer("min_points").notNull(),
  maxPoints: integer("max_points"),
  icon: text("icon"), // emoji or icon name
  color: text("color"), // hex color
  benefits: text("benefits").array(),
});

export const creatorPoints = gamificationSchema.table("creator_points", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  points: integer("points").notNull(),
  action: text("action", { 
    enum: [
      "profile_complete", 
      "campaign_accepted", 
      "delivered_on_time", 
      "positive_review", 
      "first_campaign", 
      "milestone_10_campaigns", 
      "perfect_rating", 
      "verified_profile", 
      "referral",
      "views_1k",
      "views_10k",
      "views_100k",
      "sale_generated",
      "post_published",
      "story_published",
      "reels_published",
      "comment_received",
      "engagement_bonus",
      "monthly_streak",
      "early_delivery",
      "campaign_goal_reached"
    ] 
  }).notNull(),
  category: text("category", { 
    enum: ["performance", "content", "engagement", "sales", "achievement", "bonus"] 
  }).notNull().default("achievement"),
  description: text("description"),
  relatedId: integer("related_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const badges = gamificationSchema.table("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").notNull(),
  color: text("color"),
  requirement: text("requirement").notNull(), // e.g., "complete_10_campaigns"
  requiredValue: integer("required_value"), // e.g., 10
  isSecret: boolean("is_secret").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const creatorBadges = gamificationSchema.table("creator_badges", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  badgeId: integer("badge_id").notNull().references(() => badges.id),
  earnedAt: timestamp("earned_at").defaultNow(),
}, (table) => ({
  uniqueCreatorBadge: unique().on(table.creatorId, table.badgeId),
}));


export const campaignCreatorStats = campaignSchema.table("campaign_creator_stats", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  points: integer("points").notNull().default(0),
  rank: integer("rank"),
  deliverablesCompleted: integer("deliverables_completed").notNull().default(0),
  deliverablesOnTime: integer("deliverables_on_time").notNull().default(0),
  totalViews: integer("total_views").notNull().default(0),
  totalEngagement: integer("total_engagement").notNull().default(0),
  totalSales: integer("total_sales").notNull().default(0),
  qualityScore: integer("quality_score"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueCampaignCreator: unique().on(table.campaignId, table.creatorId),
}));

export const insertCampaignCreatorStatsSchema = createInsertSchema(campaignCreatorStats).omit({ id: true, updatedAt: true });
export type InsertCampaignCreatorStats = z.infer<typeof insertCampaignCreatorStatsSchema>;
export type CampaignCreatorStats = typeof campaignCreatorStats.$inferSelect;

// ==========================================
// ADVANCED ANALYTICS & ROI
// ==========================================


// ==========================================
// E-COMMERCE & CRM INTEGRATION
// ==========================================

export const campaignCoupons = campaignSchema.table("campaign_coupons", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  creatorId: integer("creator_id").references(() => users.id),
  code: text("code").notNull().unique(),
  discountType: text("discount_type", { enum: ["percentage", "fixed"] }).notNull(),
  discountValue: integer("discount_value").notNull(), // percentage or cents
  maxUses: integer("max_uses"),
  currentUses: integer("current_uses").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const salesTracking = billingSchema.table("sales_tracking", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  couponId: integer("coupon_id").references(() => campaignCoupons.id),
  couponCode: text("coupon_code"),
  orderId: text("order_id").notNull(),
  externalOrderId: text("external_order_id"),
  orderValue: integer("order_value").notNull(), // in cents
  commission: integer("commission"), // in cents
  commissionRateBps: integer("commission_rate_bps"), // basis points (e.g., 1000 = 10%)
  platform: text("platform", { enum: ["shopify", "woocommerce", "manual"] }).notNull(),
  status: text("status", { enum: ["pending", "confirmed", "paid", "cancelled"] }).notNull().default("pending"),
  rawJson: jsonb("raw_json").$type<Record<string, any>>(),
  trackedAt: timestamp("tracked_at").defaultNow(),
});

export const creatorCommissions = billingSchema.table("creator_commissions", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  salesTrackingId: integer("sales_tracking_id").references(() => salesTracking.id),
  amount: integer("amount").notNull(), // in cents
  status: text("status", { enum: ["pending", "approved", "paid", "rejected"] }).notNull().default("pending"),
  approvedAt: timestamp("approved_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});


// ==========================================
// SOCIAL LISTENING & TRACKING
// ==========================================


// ==========================================
// INSERT SCHEMAS FOR NEW TABLES
// ==========================================

export const insertFeatureFlagSchema = createInsertSchema(featureFlags).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCreatorLevelSchema = createInsertSchema(creatorLevels).omit({ id: true });
export const insertCreatorPointsSchema = createInsertSchema(creatorPoints).omit({ id: true, createdAt: true });
export const insertBadgeSchema = createInsertSchema(badges).omit({ id: true, createdAt: true });
export const insertCreatorBadgeSchema = createInsertSchema(creatorBadges).omit({ id: true, earnedAt: true });
export const insertCampaignCouponSchema = createInsertSchema(campaignCoupons).omit({ id: true, createdAt: true });
export const insertSalesTrackingSchema = createInsertSchema(salesTracking).omit({ id: true, trackedAt: true });
export const insertCreatorCommissionSchema = createInsertSchema(creatorCommissions).omit({ id: true, createdAt: true });

// ==========================================
// TYPES FOR NEW TABLES
// ==========================================

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type InsertFeatureFlag = z.infer<typeof insertFeatureFlagSchema>;
export type CreatorLevel = typeof creatorLevels.$inferSelect;
export type InsertCreatorLevel = z.infer<typeof insertCreatorLevelSchema>;
export type CreatorPointsEntry = typeof creatorPoints.$inferSelect;
export type InsertCreatorPoints = z.infer<typeof insertCreatorPointsSchema>;
export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type CreatorBadge = typeof creatorBadges.$inferSelect;
export type InsertCreatorBadge = z.infer<typeof insertCreatorBadgeSchema>;
export type CampaignCoupon = typeof campaignCoupons.$inferSelect;
export type InsertCampaignCoupon = z.infer<typeof insertCampaignCouponSchema>;
export type SalesTracking = typeof salesTracking.$inferSelect;
export type InsertSalesTracking = z.infer<typeof insertSalesTrackingSchema>;
export type CreatorCommission = typeof creatorCommissions.$inferSelect;
export type InsertCreatorCommission = z.infer<typeof insertCreatorCommissionSchema>;

// ==========================================
// BRANDED LANDING PAGES (Multi-tenant)
// ==========================================

export const brandSettings = brandSchema.table("brand_settings", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  
  // Visual Identity
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#6366f1"),
  secondaryColor: text("secondary_color").default("#8b5cf6"),
  backgroundColor: text("background_color").default("#ffffff"),
  textColor: text("text_color").default("#1f2937"),
  accentColor: text("accent_color").default("#10b981"),
  
  // Content
  brandName: text("brand_name").notNull(),
  tagline: text("tagline"),
  description: text("description"),
  welcomeMessage: text("welcome_message"),
  termsAndConditions: text("terms_and_conditions"),
  privacyPolicy: text("privacy_policy"),
  
  // Settings
  isActive: boolean("is_active").default(true),
  requiresApproval: boolean("requires_approval").default(true),
  defaultCampaignId: integer("default_campaign_id").references(() => campaigns.id),
  
  // Onboarding Steps Config
  collectSocialProfiles: boolean("collect_social_profiles").default(true),
  collectShippingAddress: boolean("collect_shipping_address").default(true),
  collectPaymentInfo: boolean("collect_payment_info").default(true),
  collectClothingSize: boolean("collect_clothing_size").default(false),
  collectContentPreferences: boolean("collect_content_preferences").default(false),
  
  // Custom Fields
  customFields: jsonb("custom_fields").$type<{
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number';
    required: boolean;
    options?: string[];
    placeholder?: string;
  }[]>().default([]),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


export const insertBrandSettingsSchema = createInsertSchema(brandSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});


export type BrandSettings = typeof brandSettings.$inferSelect;
export type InsertBrandSettings = z.infer<typeof insertBrandSettingsSchema>;

// ==========================================
// WALLET & PAYMENT SYSTEM
// ==========================================

// Company Wallet - Saldo da empresa
export const companyWallets = billingSchema.table("company_wallets", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }).unique(),
  
  // Saldo
  balance: integer("balance").default(0).notNull(), // em centavos
  reservedBalance: integer("reserved_balance").default(0).notNull(), // saldo reservado para pagamentos pendentes
  
  // Ciclo de faturamento
  billingCycleStart: timestamp("billing_cycle_start"),
  billingCycleEnd: timestamp("billing_cycle_end"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Wallet Boxes (Caixinhas) - Sub-carteiras para organização
export const walletBoxes = billingSchema.table("wallet_boxes", {
  id: serial("id").primaryKey(),
  companyWalletId: integer("company_wallet_id").notNull().references(() => companyWallets.id, { onDelete: "cascade" }),
  
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#6366f1"),
  icon: text("icon").default("piggy-bank"),
  
  targetAmount: integer("target_amount"), // meta em centavos
  currentAmount: integer("current_amount").default(0).notNull(), // valor atual em centavos
  
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Creator Balance - Saldo do criador
export const creatorBalances = billingSchema.table("creator_balances", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  
  // Saldos
  availableBalance: integer("available_balance").default(0).notNull(), // disponível para saque em centavos
  pendingBalance: integer("pending_balance").default(0).notNull(), // aguardando liberação em centavos
  
  // Dados bancários para saque
  pixKey: text("pix_key"),
  pixKeyType: text("pix_key_type", { enum: ["cpf", "cnpj", "email", "phone", "random"] }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Wallet Transactions - Extrato de transações
export const walletTransactions = billingSchema.table("wallet_transactions", {
  id: serial("id").primaryKey(),
  
  // Origem (empresa ou criador)
  companyWalletId: integer("company_wallet_id").references(() => companyWallets.id, { onDelete: "cascade" }),
  creatorBalanceId: integer("creator_balance_id").references(() => creatorBalances.id, { onDelete: "cascade" }),
  
  // Tipo de transação
  type: text("type", { 
    enum: [
      "deposit",           // Depósito/adição de saldo
      "withdrawal",        // Saque
      "payment_fixed",     // Pagamento fixo para criador
      "payment_variable",  // Pagamento avulso/variável
      "commission",        // Comissão de venda
      "bonus",             // Bônus/recompensa
      "refund",            // Reembolso
      "transfer_in",       // Transferência recebida
      "transfer_out",      // Transferência enviada
      "box_allocation",    // Alocação para caixinha
    ] 
  }).notNull(),
  
  // Valores em centavos
  amount: integer("amount").notNull(),
  balanceAfter: integer("balance_after"), // saldo após transação
  
  // Referências
  relatedUserId: integer("related_user_id").references(() => users.id), // criador envolvido
  relatedCampaignId: integer("related_campaign_id").references(() => campaigns.id),
  walletBoxId: integer("wallet_box_id").references(() => walletBoxes.id),
  
  // Detalhes
  description: text("description"),
  notes: text("notes"),
  tags: text("tags").array(),
  
  // Stripe idempotency
  stripeEventId: text("stripe_event_id").unique(),
  
  // Status
  status: text("status", { 
    enum: ["pending", "available", "processing", "completed", "failed", "cancelled"] 
  }).default("pending").notNull(),
  
  // Datas
  scheduledFor: timestamp("scheduled_for"), // agendado para
  processedAt: timestamp("processed_at"), // processado em
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Payment Batches - Lotes de pagamento
export const paymentBatches = billingSchema.table("payment_batches", {
  id: serial("id").primaryKey(),
  companyWalletId: integer("company_wallet_id").notNull().references(() => companyWallets.id, { onDelete: "cascade" }),
  
  name: text("name"),
  totalAmount: integer("total_amount").notNull(), // valor total em centavos
  transactionCount: integer("transaction_count").notNull(),
  
  status: text("status", { 
    enum: ["draft", "pending", "processing", "completed", "failed", "cancelled"] 
  }).default("draft").notNull(),
  
  processedAt: timestamp("processed_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


// Insert schemas
export const insertCompanyWalletSchema = createInsertSchema(companyWallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWalletBoxSchema = createInsertSchema(walletBoxes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCreatorBalanceSchema = createInsertSchema(creatorBalances).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWalletTransactionSchema = createInsertSchema(walletTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentBatchSchema = createInsertSchema(paymentBatches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type CompanyWallet = typeof companyWallets.$inferSelect;
export type InsertCompanyWallet = z.infer<typeof insertCompanyWalletSchema>;
export type WalletBox = typeof walletBoxes.$inferSelect;
export type InsertWalletBox = z.infer<typeof insertWalletBoxSchema>;
export type CreatorBalance = typeof creatorBalances.$inferSelect;
export type InsertCreatorBalance = z.infer<typeof insertCreatorBalanceSchema>;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type PaymentBatch = typeof paymentBatches.$inferSelect;
export type InsertPaymentBatch = z.infer<typeof insertPaymentBatchSchema>;

// ==========================================
// GAMIFICATION V2 - Configurable per Brand/Campaign
// ==========================================

// Brand Program - Configuração geral do programa de creators da marca
export const brandPrograms = gamificationSchema.table("brand_programs", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }).unique(),
  name: text("name").default("Programa de Creators"),
  description: text("description"),
  autoJoinCommunity: boolean("auto_join_community").notNull().default(true),
  couponPrefix: text("coupon_prefix"),
  couponGenerationRule: text("coupon_generation_rule", { 
    enum: ["prefix_username", "prefix_random", "custom"] 
  }).default("prefix_username"),
  requirementsJson: jsonb("requirements_json").$type<{
    minFollowers?: number;
    niches?: string[];
    regions?: string[];
    minEngagementRate?: number;
    minAuthenticityScore?: number;
    verifiedOnly?: boolean;
  }>(),
  gamificationEnabled: boolean("gamification_enabled").notNull().default(true),
  defaultRewardMode: text("default_reward_mode", { 
    enum: ["ranking", "threshold", "none"] 
  }).default("ranking"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Brand Rewards Catalog - Catálogo de prêmios da marca
export const brandRewards = gamificationSchema.table("brand_rewards", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type", { enum: ["cash", "product", "benefit", "experience"] }).notNull(),
  value: integer("value"), // valor em centavos para cash, ou valor estimado para outros
  imageUrl: text("image_url"),
  sku: text("sku"),
  stock: integer("stock"), // null = unlimited
  isActive: boolean("is_active").notNull().default(true),
  tierRequired: integer("tier_required"), // min tier ID to redeem
  pointsCost: integer("points_cost"), // cost in points to redeem (for reward shop)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Brand Tier Configs - Tiers personalizados por marca
export const brandTierConfigs = gamificationSchema.table("brand_tier_configs", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  tierName: text("tier_name").notNull(), // Bronze, Prata, Ouro, Diamante, etc
  minPoints: integer("min_points").notNull().default(0),
  color: text("color"), // hex color for display
  icon: text("icon"), // emoji or icon name
  benefitsJson: jsonb("benefits_json").$type<{
    priorityCampaigns?: boolean;
    fasterPayout?: boolean;
    exclusiveContent?: boolean;
    badgeVisible?: boolean;
    customBenefits?: string[];
  }>(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Type for per-deliverable-type points configuration
export type PointsPerDeliverableType = {
  post_feed?: number;
  reels?: number;
  stories?: number;
  tiktok?: number;
  youtube_video?: number;
  youtube_shorts?: number;
  twitter_post?: number;
  other?: number;
};

// Brand Scoring Defaults - Regras default de pontuação por marca

// Campaign Gamification Configs - Override de gamificação por campanha

// Campaign Prizes - Prêmios por ranking ou milestone
export const campaignPrizes = campaignSchema.table("campaign_prizes", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["ranking_place", "milestone"] }).notNull(),
  rankPosition: integer("rank_position"), // 1, 2, 3... for ranking_place
  milestonePoints: integer("milestone_points"), // points threshold for milestone
  rewardKind: text("reward_kind", { enum: ["cash", "product", "both", "none"] }).notNull(),
  cashAmount: integer("cash_amount"), // in centavos
  productSku: text("product_sku"),
  productDescription: text("product_description"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// brand_points_rules - REMOVIDO: Não utilizado. campaign_points_rules contém overrides por campanha.

// Campaign Points Rules - Regras de pontuação por campanha
export const campaignPointsRules = campaignSchema.table("campaign_points_rules", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }).unique(),
  overridesBrand: boolean("overrides_brand").notNull().default(false),
  rulesJson: jsonb("rules_json").$type<{
    // Pontos por tipo de post
    postTypes?: {
      post_feed?: number;
      reels?: number;
      stories?: number;
      tiktok?: number;
      youtube_video?: number;
      youtube_shorts?: number;
      twitter_post?: number;
      other?: number;
    };
    // Milestones de visualização
    viewsMilestone?: {
      per: number;
      points: number;
    };
    // Milestones de engajamento
    likesMilestone?: {
      threshold: number;
      points: number;
    };
    commentsMilestone?: {
      threshold: number;
      points: number;
    };
    // Vendas
    salesPoints?: {
      pointsPerSale: number;
      bonusPercentage?: number;
    };
    // Entrega
    deliveryPoints?: {
      approved: number;
      onTimeBonus: number;
    };
    // Cursos
    courseCompletionPoints?: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Points Ledger - Registro detalhado de cada delta de pontos (source of truth)
export const pointsLedger = gamificationSchema.table("points_ledger", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  campaignId: integer("campaign_id").references(() => campaigns.id, { onDelete: "cascade" }),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  deltaPoints: integer("delta_points").notNull(),
  eventType: text("event_type", { 
    enum: [
      "post_created",
      "reel_created",
      "story_created",
      "views_milestone",
      "like_milestone",
      "comment_milestone",
      "sale_confirmed",
      "delivery_approved",
      "course_completed",
      "admin_adjustment",
      "ontime_bonus",
      "quality_bonus",
      "penalty_late",
      "milestone_reached"
    ] 
  }).notNull(),
  eventRefId: text("event_ref_id"), // ID externo do evento (ex: postId, saleId)
  refType: text("ref_type"), // "deliverable", "post", "sale", "application", etc
  refId: integer("ref_id"), // ID interno da entidade relacionada
  metadata: jsonb("metadata").$type<{
    postUrl?: string;
    platform?: string;
    viewCount?: number;
    likeCount?: number;
    commentCount?: number;
    saleAmount?: number;
    couponCode?: string;
    notes?: string;
    adjustedBy?: number;
  }>(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Idempotency: prevent duplicate points for same ref+eventType combo
  uniqueLedgerEntry: unique().on(table.campaignId, table.creatorId, table.eventType, table.refType, table.refId),
}));

// Creator Scores - Cache de pontuação por creator/campanha

// Campaign Metric Snapshots - Track post metrics over time for delta calculation
export const campaignMetricSnapshots = analyticsSchema.table("campaign_metric_snapshots", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  postId: text("post_id").notNull(), // External platform post ID
  platform: text("platform", { enum: ["instagram", "tiktok"] }).notNull(),
  postUrl: text("post_url"),
  views: integer("views").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  lastAwardedViews: integer("last_awarded_views").notNull().default(0),
  lastAwardedLikes: integer("last_awarded_likes").notNull().default(0),
  lastAwardedComments: integer("last_awarded_comments").notNull().default(0),
  // Historical delta tracking for rolling average calculation (spike detection)
  updateCount: integer("update_count").notNull().default(0),
  sumViewsDeltas: integer("sum_views_deltas").notNull().default(0),
  sumLikesDeltas: integer("sum_likes_deltas").notNull().default(0),
  sumCommentsDeltas: integer("sum_comments_deltas").notNull().default(0),
  totalPointsAwarded: integer("total_points_awarded").notNull().default(0),
  pointsAwardedToday: integer("points_awarded_today").notNull().default(0),
  lastPointsDate: timestamp("last_points_date"),
  flaggedForReview: boolean("flagged_for_review").notNull().default(false),
  flagReason: text("flag_reason"),
  postedAt: timestamp("posted_at"),
  lastSnapshotAt: timestamp("last_snapshot_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueCampaignPost: unique().on(table.campaignId, table.postId, table.platform),
}));

// Brand Creator Tiers - Track which tier each creator is in for a brand
export const brandCreatorTiers = brandSchema.table("brand_creator_tiers", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  tierId: integer("tier_id").references(() => brandTierConfigs.id, { onDelete: "set null" }),
  totalBrandPoints: integer("total_brand_points").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueBrandCreator: unique().on(table.companyId, table.creatorId),
}));

// Reward Entitlements - Recompensas conquistadas por creators (milestone ou ranking)
export const rewardEntitlements = gamificationSchema.table("reward_entitlements", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  prizeId: integer("prize_id").notNull().references(() => campaignPrizes.id, { onDelete: "cascade" }),
  
  // Source of entitlement
  sourceType: text("source_type", { enum: ["milestone_reached", "ranking_place"] }).notNull(),
  pointsAtTime: integer("points_at_time"), // Points when milestone was reached
  rankAtTime: integer("rank_at_time"), // Rank when campaign closed (for ranking rewards)
  
  // Reward details (copied from prize for audit)
  rewardKind: text("reward_kind", { enum: ["cash", "product", "both", "none"] }).notNull(),
  cashAmount: integer("cash_amount"), // in centavos
  productSku: text("product_sku"),
  productDescription: text("product_description"),
  
  // Status workflow
  status: text("status", { 
    enum: ["pending", "approved", "rejected", "cash_paid", "product_shipped", "completed", "cancelled"] 
  }).notNull().default("pending"),
  
  // Fulfillment references
  walletTransactionId: integer("wallet_transaction_id").references(() => walletTransactions.id),
  shipmentId: integer("shipment_id"), // Reference to product seeding if applicable
  
  // Audit
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectedBy: integer("rejected_by").references(() => users.id),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Prevent duplicate rewards for same prize/creator
  uniqueCreatorPrize: unique().on(table.creatorId, table.prizeId),
}));

// Reward Events - Audit log for reward lifecycle

// ==========================================
// COMMUNITY SYSTEM - Brand Creator Memberships
// ==========================================

// Creator Discovery Profiles - cache/import of creator profiles for discovery
export const creatorDiscoveryProfiles = creatorSchema.table("creator_discovery_profiles", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  
  instagramHandle: text("instagram_handle").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  
  followers: integer("followers"),
  following: integer("following"),
  posts: integer("posts"),
  engagementRate: text("engagement_rate"),
  
  nicheTags: text("niche_tags").array().default([]),
  location: text("location"),
  
  source: text("source", { enum: ["manual", "apify", "import"] }).notNull().default("manual"),
  
  linkedCreatorId: integer("linked_creator_id").references(() => users.id),
  
  lastFetchedAt: timestamp("last_fetched_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueCompanyHandle: unique().on(table.companyId, table.instagramHandle),
}));

// Membership status enum
export const membershipStatusEnum = ["invited", "active", "suspended", "archived"] as const;
export type MembershipStatus = typeof membershipStatusEnum[number];

// Membership source enum
export const membershipSourceEnum = ["manual", "campaign", "invite", "self_request"] as const;
export type MembershipSource = typeof membershipSourceEnum[number];

// Invite status enum  
export const inviteStatusEnum = ["sent", "opened", "accepted", "expired", "cancelled"] as const;
export type InviteStatus = typeof inviteStatusEnum[number];

// Brand Creator Memberships - tracks creator membership in brand communities
export const brandCreatorMemberships = brandSchema.table("brand_creator_memberships", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  creatorId: integer("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  status: text("status", { enum: membershipStatusEnum }).notNull().default("invited"),
  source: text("source", { enum: membershipSourceEnum }).notNull().default("manual"),
  
  tierId: integer("tier_id").references(() => brandTierConfigs.id),
  pointsCache: integer("points_cache").notNull().default(0),
  tags: text("tags").array().default([]),
  
  couponCode: text("coupon_code"),
  
  inviteId: integer("invite_id"),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  
  termsAcceptedAt: timestamp("terms_accepted_at"),
  termsAcceptedIp: text("terms_accepted_ip"),
  
  joinedAt: timestamp("joined_at"),
  lastActivityAt: timestamp("last_activity_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueCompanyCreator: unique().on(table.companyId, table.creatorId),
}));

// Community Invites - tracks invite tokens for brand communities
export const communityInvites = miscSchema.table("community_invites", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  
  creatorId: integer("creator_id").references(() => users.id),
  email: text("email"),
  creatorHandle: text("creator_handle"),
  
  token: text("token").notNull().unique(),
  
  status: text("status", { enum: inviteStatusEnum }).notNull().default("sent"),
  
  campaignId: integer("campaign_id").references(() => campaigns.id),
  
  metadata: jsonb("metadata").$type<{
    source?: string;
    message?: string;
    tags?: string[];
  }>(),
  
  expiresAt: timestamp("expires_at").notNull(),
  openedAt: timestamp("opened_at"),
  acceptedAt: timestamp("accepted_at"),
  
  createdByUserId: integer("created_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas for community
export const insertBrandCreatorMembershipSchema = createInsertSchema(brandCreatorMemberships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommunityInviteSchema = createInsertSchema(communityInvites).omit({
  id: true,
  createdAt: true,
});

export const insertCreatorDiscoveryProfileSchema = createInsertSchema(creatorDiscoveryProfiles).omit({
  id: true,
  createdAt: true,
});

// Types for community
export type BrandCreatorMembership = typeof brandCreatorMemberships.$inferSelect;
export type InsertBrandCreatorMembership = z.infer<typeof insertBrandCreatorMembershipSchema>;
export type CommunityInvite = typeof communityInvites.$inferSelect;
export type InsertCommunityInvite = z.infer<typeof insertCommunityInviteSchema>;
export type CreatorDiscoveryProfile = typeof creatorDiscoveryProfiles.$inferSelect;
export type InsertCreatorDiscoveryProfile = z.infer<typeof insertCreatorDiscoveryProfileSchema>;
// Insert schemas for Brand Program
export const insertBrandProgramSchema = createInsertSchema(brandPrograms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBrandRewardSchema = createInsertSchema(brandRewards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Insert schemas for gamification v2
export const insertBrandTierConfigSchema = createInsertSchema(brandTierConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});



export const insertCampaignPointsRulesSchema = createInsertSchema(campaignPointsRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignPrizeSchema = createInsertSchema(campaignPrizes).omit({
  id: true,
  createdAt: true,
});

export const insertPointsLedgerSchema = createInsertSchema(pointsLedger).omit({
  id: true,
  createdAt: true,
});


export const insertBrandCreatorTierSchema = createInsertSchema(brandCreatorTiers).omit({
  id: true,
  updatedAt: true,
});

export const insertCampaignMetricSnapshotSchema = createInsertSchema(campaignMetricSnapshots).omit({
  id: true,
  createdAt: true,
  lastSnapshotAt: true,
});

export const insertRewardEntitlementSchema = createInsertSchema(rewardEntitlements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});


// Types for Brand Program
export type BrandProgram = typeof brandPrograms.$inferSelect;
export type InsertBrandProgram = z.infer<typeof insertBrandProgramSchema>;
export type BrandReward = typeof brandRewards.$inferSelect;
export type InsertBrandReward = z.infer<typeof insertBrandRewardSchema>;

// Types for gamification v2
export type BrandTierConfig = typeof brandTierConfigs.$inferSelect;
export type InsertBrandTierConfig = z.infer<typeof insertBrandTierConfigSchema>;
export type CampaignPointsRules = typeof campaignPointsRules.$inferSelect;
export type InsertCampaignPointsRules = z.infer<typeof insertCampaignPointsRulesSchema>;
export type CampaignPrize = typeof campaignPrizes.$inferSelect;
export type InsertCampaignPrize = z.infer<typeof insertCampaignPrizeSchema>;
export type PointsLedgerEntry = typeof pointsLedger.$inferSelect;
export type InsertPointsLedgerEntry = z.infer<typeof insertPointsLedgerSchema>;
export type BrandCreatorTier = typeof brandCreatorTiers.$inferSelect;
export type InsertBrandCreatorTier = z.infer<typeof insertBrandCreatorTierSchema>;
export type CampaignMetricSnapshot = typeof campaignMetricSnapshots.$inferSelect;
export type InsertCampaignMetricSnapshot = z.infer<typeof insertCampaignMetricSnapshotSchema>;
export type RewardEntitlement = typeof rewardEntitlements.$inferSelect;
export type InsertRewardEntitlement = z.infer<typeof insertRewardEntitlementSchema>;

// ===================== ACADEMY TABLES =====================

export const courses = academySchema.table("courses", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  level: text("level", { enum: ["basic", "intermediate", "advanced"] }).notNull().default("basic"),
  estimatedMinutes: integer("estimated_minutes").notNull().default(30),
  coverUrl: text("cover_url"),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const courseModules = academySchema.table("course_modules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  order: integer("order").notNull().default(0),
});

export const courseLessons = academySchema.table("course_lessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull().references(() => courseModules.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  order: integer("order").notNull().default(0),
  contentType: text("content_type", { enum: ["text", "video", "link", "checklist"] }).notNull().default("text"),
  content: jsonb("content").$type<{ body?: string; url?: string; items?: string[] }>(),
  durationMinutes: integer("duration_minutes").default(5),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const creatorCourseProgress = academySchema.table("creator_course_progress", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  progressPct: integer("progress_pct").notNull().default(0),
  currentLessonId: integer("current_lesson_id"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  uniqueCreatorCourse: unique().on(table.creatorId, table.courseId),
}));

export const creatorLessonProgress = academySchema.table("creator_lesson_progress", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lessonId: integer("lesson_id").notNull().references(() => courseLessons.id, { onDelete: "cascade" }),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
}, (table) => ({
  uniqueCreatorLesson: unique().on(table.creatorId, table.lessonId),
}));

// Academy relations
export const coursesRelations = relations(courses, ({ many }) => ({
  modules: many(courseModules),
  progress: many(creatorCourseProgress),
}));

export const courseModulesRelations = relations(courseModules, ({ one, many }) => ({
  course: one(courses, { fields: [courseModules.courseId], references: [courses.id] }),
  lessons: many(courseLessons),
}));

export const courseLessonsRelations = relations(courseLessons, ({ one, many }) => ({
  module: one(courseModules, { fields: [courseLessons.moduleId], references: [courseModules.id] }),
  progress: many(creatorLessonProgress),
}));

export const creatorCourseProgressRelations = relations(creatorCourseProgress, ({ one }) => ({
  creator: one(users, { fields: [creatorCourseProgress.creatorId], references: [users.id] }),
  course: one(courses, { fields: [creatorCourseProgress.courseId], references: [courses.id] }),
}));

export const creatorLessonProgressRelations = relations(creatorLessonProgress, ({ one }) => ({
  creator: one(users, { fields: [creatorLessonProgress.creatorId], references: [users.id] }),
  lesson: one(courseLessons, { fields: [creatorLessonProgress.lessonId], references: [courseLessons.id] }),
}));

// Academy insert schemas
export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
});

export const insertCourseModuleSchema = createInsertSchema(courseModules).omit({
  id: true,
});

export const insertCourseLessonSchema = createInsertSchema(courseLessons).omit({
  id: true,
  createdAt: true,
});

export const insertCreatorCourseProgressSchema = createInsertSchema(creatorCourseProgress).omit({
  id: true,
  startedAt: true,
  updatedAt: true,
});

export const insertCreatorLessonProgressSchema = createInsertSchema(creatorLessonProgress).omit({
  id: true,
  completedAt: true,
});

// Academy types
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type CourseModule = typeof courseModules.$inferSelect;
export type InsertCourseModule = z.infer<typeof insertCourseModuleSchema>;
export type CourseLesson = typeof courseLessons.$inferSelect;
export type InsertCourseLesson = z.infer<typeof insertCourseLessonSchema>;
export type CreatorCourseProgress = typeof creatorCourseProgress.$inferSelect;
export type InsertCreatorCourseProgress = z.infer<typeof insertCreatorCourseProgressSchema>;
export type CreatorLessonProgress = typeof creatorLessonProgress.$inferSelect;
export type InsertCreatorLessonProgress = z.infer<typeof insertCreatorLessonProgressSchema>;

// ========== INSPIRATIONS (Swipe File) ==========
export const inspirations = contentSchema.table("inspirations", {
  id: serial("id").primaryKey(),
  scope: text("scope", { enum: ["global", "brand"] }).notNull().default("global"),
  brandId: integer("brand_id").references(() => companies.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  platform: text("platform", { enum: ["instagram", "tiktok", "youtube", "ads", "ugc"] }).notNull(),
  format: text("format", { enum: ["reels", "story", "post", "ad", "shorts", "hook", "script", "effect", "edit", "brief", "reference"] }).notNull(),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  tags: text("tags").array().notNull().default([]),
  nicheTags: text("niche_tags").array().notNull().default([]),
  isPublished: boolean("is_published").notNull().default(true),
  createdByUserId: integer("created_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const inspirationCollections = contentSchema.table("inspiration_collections", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const inspirationCollectionItems = contentSchema.table("inspiration_collection_items", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id").notNull().references(() => inspirationCollections.id, { onDelete: "cascade" }),
  inspirationId: integer("inspiration_id").notNull().references(() => inspirations.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const creatorSavedInspirations = contentSchema.table("creator_saved_inspirations", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  inspirationId: integer("inspiration_id").notNull().references(() => inspirations.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const campaignInspirations = contentSchema.table("campaign_inspirations", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  inspirationId: integer("inspiration_id").notNull().references(() => inspirations.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Inspirations relations
export const inspirationsRelations = relations(inspirations, ({ one, many }) => ({
  createdBy: one(users, { fields: [inspirations.createdByUserId], references: [users.id] }),
  savedBy: many(creatorSavedInspirations),
  collectionItems: many(inspirationCollectionItems),
  campaigns: many(campaignInspirations),
}));

export const inspirationCollectionsRelations = relations(inspirationCollections, ({ one, many }) => ({
  creator: one(users, { fields: [inspirationCollections.creatorId], references: [users.id] }),
  items: many(inspirationCollectionItems),
}));

export const inspirationCollectionItemsRelations = relations(inspirationCollectionItems, ({ one }) => ({
  collection: one(inspirationCollections, { fields: [inspirationCollectionItems.collectionId], references: [inspirationCollections.id] }),
  inspiration: one(inspirations, { fields: [inspirationCollectionItems.inspirationId], references: [inspirations.id] }),
}));

export const creatorSavedInspirationsRelations = relations(creatorSavedInspirations, ({ one }) => ({
  creator: one(users, { fields: [creatorSavedInspirations.creatorId], references: [users.id] }),
  inspiration: one(inspirations, { fields: [creatorSavedInspirations.inspirationId], references: [inspirations.id] }),
}));

export const campaignInspirationsRelations = relations(campaignInspirations, ({ one }) => ({
  campaign: one(campaigns, { fields: [campaignInspirations.campaignId], references: [campaigns.id] }),
  inspiration: one(inspirations, { fields: [campaignInspirations.inspirationId], references: [inspirations.id] }),
}));

// Inspirations insert schemas
export const insertInspirationSchema = createInsertSchema(inspirations).omit({
  id: true,
  createdAt: true,
});

export const insertInspirationCollectionSchema = createInsertSchema(inspirationCollections).omit({
  id: true,
  createdAt: true,
});

export const insertInspirationCollectionItemSchema = createInsertSchema(inspirationCollectionItems).omit({
  id: true,
  createdAt: true,
});

export const insertCreatorSavedInspirationSchema = createInsertSchema(creatorSavedInspirations).omit({
  id: true,
  createdAt: true,
});

export const insertCampaignInspirationSchema = createInsertSchema(campaignInspirations).omit({
  id: true,
  createdAt: true,
});

// Inspirations types
export type Inspiration = typeof inspirations.$inferSelect;
export type InsertInspiration = z.infer<typeof insertInspirationSchema>;
export type InspirationCollection = typeof inspirationCollections.$inferSelect;
export type InsertInspirationCollection = z.infer<typeof insertInspirationCollectionSchema>;
export type InspirationCollectionItem = typeof inspirationCollectionItems.$inferSelect;
export type InsertInspirationCollectionItem = z.infer<typeof insertInspirationCollectionItemSchema>;
export type CreatorSavedInspiration = typeof creatorSavedInspirations.$inferSelect;
export type InsertCreatorSavedInspiration = z.infer<typeof insertCreatorSavedInspirationSchema>;
export type CampaignInspiration = typeof campaignInspirations.$inferSelect;
export type InsertCampaignInspiration = z.infer<typeof insertCampaignInspirationSchema>;

// ========== OPERATIONS: SEEDING & ADDRESSES ==========
export const creatorAddresses = creatorSchema.table("creator_addresses", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  label: text("label").default("principal"),
  recipientName: text("recipient_name").notNull(),
  street: text("street").notNull(),
  number: text("number").notNull(),
  complement: text("complement"),
  neighborhood: text("neighborhood").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  country: text("country").default("Brasil"),
  phone: text("phone"),
  isDefault: boolean("is_default").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


// Relations
export const creatorAddressesRelations = relations(creatorAddresses, ({ one }) => ({
  creator: one(users, { fields: [creatorAddresses.creatorId], references: [users.id] }),
}));


// Insert schemas
export const insertCreatorAddressSchema = createInsertSchema(creatorAddresses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});


// Types
export type CreatorAddress = typeof creatorAddresses.$inferSelect;
export type InsertCreatorAddress = z.infer<typeof insertCreatorAddressSchema>;

// ============================================================
// UNIFIED MESSAGING SYSTEM
// ============================================================

export const conversationTypeEnum = ["brand", "campaign"] as const;
export type ConversationType = typeof conversationTypeEnum[number];

export const conversationStatusEnum = ["open", "resolved"] as const;
export type ConversationStatus = typeof conversationStatusEnum[number];

export const conversations = messagingSchema.table("conversations", {
  id: serial("id").primaryKey(),
  type: text("type", { enum: conversationTypeEnum }).notNull(),
  status: text("status", { enum: conversationStatusEnum }).notNull().default("open"),
  
  brandId: integer("brand_id").references(() => companies.id, { onDelete: "cascade" }),
  campaignId: integer("campaign_id").references(() => campaigns.id, { onDelete: "cascade" }),
  
  creatorId: integer("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueBrandConvo: unique().on(table.brandId, table.creatorId).nullsNotDistinct(),
  uniqueCampaignConvo: unique().on(table.campaignId, table.creatorId).nullsNotDistinct(),
}));

export const convMessages = messagingSchema.table("conv_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderUserId: integer("sender_user_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messageReads = messagingSchema.table("message_reads", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lastReadAt: timestamp("last_read_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserConvo: unique().on(table.conversationId, table.userId),
}));

// Relations
export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  brand: one(companies, { fields: [conversations.brandId], references: [companies.id], relationName: "brandConversations" }),
  campaign: one(campaigns, { fields: [conversations.campaignId], references: [campaigns.id] }),
  creator: one(users, { fields: [conversations.creatorId], references: [users.id], relationName: "creatorConversations" }),
  company: one(companies, { fields: [conversations.companyId], references: [companies.id], relationName: "companyConversations" }),
  messages: many(convMessages),
  reads: many(messageReads),
}));

export const convMessagesRelations = relations(convMessages, ({ one }) => ({
  conversation: one(conversations, { fields: [convMessages.conversationId], references: [conversations.id] }),
  sender: one(users, { fields: [convMessages.senderUserId], references: [users.id] }),
}));

export const messageReadsRelations = relations(messageReads, ({ one }) => ({
  conversation: one(conversations, { fields: [messageReads.conversationId], references: [conversations.id] }),
  user: one(users, { fields: [messageReads.userId], references: [users.id] }),
}));

// Insert schemas
export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  lastMessageAt: true,
});

export const insertConvMessageSchema = createInsertSchema(convMessages).omit({
  id: true,
  createdAt: true,
});

export const insertMessageReadSchema = createInsertSchema(messageReads).omit({
  id: true,
});

// Types
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type ConvMessage = typeof convMessages.$inferSelect;
export type InsertConvMessage = z.infer<typeof insertConvMessageSchema>;
export type MessageRead = typeof messageReads.$inferSelect;
export type InsertMessageRead = z.infer<typeof insertMessageReadSchema>;

// ============================================
// INSTAGRAM INTEGRATION TABLES
// ============================================

export const instagramAccountTypeEnum = ["creator", "business"] as const;

export const instagramAccounts = socialSchema.table("instagram_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }),
  instagramUserId: text("instagram_user_id").notNull().unique(),
  facebookUserId: text("facebook_user_id"),
  username: text("username").notNull(),
  name: text("name"),
  profilePictureUrl: text("profile_picture_url"),
  accountType: text("account_type", { enum: instagramAccountTypeEnum }).notNull(),
  accessToken: text("access_token").notNull(),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshToken: text("refresh_token"),
  scopes: text("scopes").array(),
  followersCount: integer("followers_count"),
  followsCount: integer("follows_count"),
  mediaCount: integer("media_count"),
  biography: text("biography"),
  website: text("website"),
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tipos de owner para instagram_profiles
export const instagramProfileOwnerTypeEnum = ["user", "company", "external"] as const;
export const instagramProfileSourceEnum = ["oauth", "apify", "manual", "api"] as const;

// Tabela unificada de perfis do Instagram
export const instagramProfiles = socialSchema.table("instagram_profiles", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  ownerType: text("owner_type", { enum: instagramProfileOwnerTypeEnum }).notNull().default("external"),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "set null" }),
  instagramAccountId: integer("instagram_account_id").references(() => instagramAccounts.id, { onDelete: "set null" }),
  source: text("source", { enum: instagramProfileSourceEnum }).notNull().default("manual"),
  
  // Métricas básicas
  followers: integer("followers"),
  following: integer("following"),
  postsCount: integer("posts_count"),
  
  // Dados do perfil
  fullName: text("full_name"),
  bio: text("bio"),
  profilePicUrl: text("profile_pic_url"),
  profilePicStoragePath: text("profile_pic_storage_path"),
  profilePicOriginalUrl: text("profile_pic_original_url"),
  isVerified: boolean("is_verified").default(false),
  isPrivate: boolean("is_private").default(false),
  externalUrl: text("external_url"),
  
  // Engagement
  engagementRate: text("engagement_rate"),
  avgLikes: integer("avg_likes"),
  avgComments: integer("avg_comments"),
  totalLikes: integer("total_likes"),
  totalComments: integer("total_comments"),
  
  // Campos avançados (migrados de users)
  authenticityScore: integer("authenticity_score"),
  topHashtags: text("top_hashtags").array(),
  topPosts: jsonb("top_posts").$type<{
    id: string;
    url: string;
    likes: number;
    comments: number;
    thumbnail?: string;
  }[]>(),
  
  // Timestamps
  lastFetchedAt: timestamp("last_fetched_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Constraint composto para permitir mesmo username para user e company
  uniqueIndex("instagram_profiles_username_owner_type_idx").on(table.username, table.ownerType),
  index("instagram_profiles_user_id_idx").on(table.userId),
  index("instagram_profiles_company_id_idx").on(table.companyId),
]);

export type InstagramProfile = typeof instagramProfiles.$inferSelect;
export type InsertInstagramProfile = typeof instagramProfiles.$inferInsert;

export const instagramPosts = socialSchema.table("instagram_posts", {
  id: serial("id").primaryKey(),
  instagramAccountId: integer("instagram_account_id").references(() => instagramAccounts.id, { onDelete: "cascade" }).notNull(),
  instagramMediaId: text("instagram_media_id").notNull().unique(),
  mediaType: text("media_type"),
  mediaUrl: text("media_url"),
  thumbnailUrl: text("thumbnail_url"),
  permalink: text("permalink"),
  caption: text("caption"),
  timestamp: timestamp("timestamp"),
  likeCount: integer("like_count").default(0),
  commentsCount: integer("comments_count").default(0),
  reachCount: integer("reach_count"),
  impressionsCount: integer("impressions_count"),
  savedCount: integer("saved_count"),
  sharesCount: integer("shares_count"),
  isCollabPost: boolean("is_collab_post").default(false),
  collabPartners: text("collab_partners").array(),
  mentionedAccounts: text("mentioned_accounts").array(),
  hashtags: text("hashtags").array(),
  commentsData: jsonb("comments_data"),
  source: text("source", { enum: ["native_api", "apify", "manual"] }).default("native_api"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


export const instagramMessages = socialSchema.table("instagram_messages", {
  id: serial("id").primaryKey(),
  instagramAccountId: integer("instagram_account_id").references(() => instagramAccounts.id, { onDelete: "cascade" }).notNull(),
  conversationId: text("conversation_id").notNull(),
  messageId: text("message_id").notNull().unique(),
  senderId: text("sender_id").notNull(),
  senderUsername: text("sender_username"),
  senderProfilePic: text("sender_profile_pic"),
  recipientId: text("recipient_id").notNull(),
  recipientUsername: text("recipient_username"),
  messageText: text("message_text"),
  messageType: text("message_type"),
  attachments: jsonb("attachments"),
  isIncoming: boolean("is_incoming").default(true),
  isRead: boolean("is_read").default(false),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// instagram_profile_cache - REMOVIDO: Dados migrados para instagram_profiles unificada


export const instagramTaggedPosts = socialSchema.table("instagram_tagged_posts", {
  id: serial("id").primaryKey(),
  instagramAccountId: integer("instagram_account_id").references(() => instagramAccounts.id, { onDelete: "cascade" }).notNull(),
  postId: text("post_id").notNull(),
  username: text("username").notNull(),
  mediaType: text("media_type"),
  mediaUrl: text("media_url"),
  permalink: text("permalink").notNull(),
  caption: text("caption"),
  timestamp: timestamp("timestamp"),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  impressions: integer("impressions"),
  reach: integer("reach"),
  engagement: integer("engagement"),
  saved: integer("saved"),
  emv: integer("emv").default(0),
  sentiment: text("sentiment", { enum: ["positive", "neutral", "negative"] }),
  sentimentScore: integer("sentiment_score"),
  sentimentAnalysis: text("sentiment_analysis"),
  commentsAnalysis: jsonb("comments_analysis").$type<{ positive: number; neutral: number; negative: number; summary: string }>(),
  isNotified: boolean("is_notified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniquePost: unique().on(table.instagramAccountId, table.postId),
}));


// Instagram Relations
export const instagramAccountsRelations = relations(instagramAccounts, ({ one, many }) => ({
  user: one(users, { fields: [instagramAccounts.userId], references: [users.id] }),
  company: one(companies, { fields: [instagramAccounts.companyId], references: [companies.id] }),
  posts: many(instagramPosts),
  messages: many(instagramMessages),
}));

export const instagramPostsRelations = relations(instagramPosts, ({ one }) => ({
  account: one(instagramAccounts, { fields: [instagramPosts.instagramAccountId], references: [instagramAccounts.id] }),
}));


export const instagramMessagesRelations = relations(instagramMessages, ({ one }) => ({
  account: one(instagramAccounts, { fields: [instagramMessages.instagramAccountId], references: [instagramAccounts.id] }),
}));


// Instagram Insert Schemas
export const insertInstagramAccountSchema = createInsertSchema(instagramAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInstagramPostSchema = createInsertSchema(instagramPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});


export const insertInstagramMessageSchema = createInsertSchema(instagramMessages).omit({
  id: true,
  createdAt: true,
});


// Instagram Types
export type InstagramAccount = typeof instagramAccounts.$inferSelect;
export type InsertInstagramAccount = z.infer<typeof insertInstagramAccountSchema>;
export type InstagramPost = typeof instagramPosts.$inferSelect;
export type InsertInstagramPost = z.infer<typeof insertInstagramPostSchema>;
export type InstagramMessage = typeof instagramMessages.$inferSelect;
export type InsertInstagramMessage = z.infer<typeof insertInstagramMessageSchema>;

// ============================================
// INSTAGRAM CONTACTS (CRM Social)
// ============================================

export const instagramContactStatusEnum = ["lead", "engaged", "vip", "member", "inactive"] as const;
export const instagramInteractionTypeEnum = [
  "dm_received", "dm_sent", "comment_on_post", "mention", "story_reply", "tagged_post", "like"
] as const;

export const instagramContacts = socialSchema.table("instagram_contacts", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  instagramUserId: text("instagram_user_id"),
  username: text("username").notNull(),
  fullName: text("full_name"),
  profilePicUrl: text("profile_pic_url"),
  instagramProfileId: integer("instagram_profile_id").references(() => instagramProfiles.id, { onDelete: "set null" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),

  totalDmsReceived: integer("total_dms_received").default(0),
  totalDmsSent: integer("total_dms_sent").default(0),
  totalCommentsOnPosts: integer("total_comments_on_posts").default(0),
  totalMentions: integer("total_mentions").default(0),
  totalStoryReplies: integer("total_story_replies").default(0),
  totalTaggedPosts: integer("total_tagged_posts").default(0),
  interactionScore: integer("interaction_score").default(0),

  firstInteractionAt: timestamp("first_interaction_at"),
  lastInteractionAt: timestamp("last_interaction_at"),

  status: text("status", { enum: instagramContactStatusEnum }).default("lead"),
  tags: text("tags").array(),
  notes: text("notes"),

  followers: integer("followers"),
  isVerified: boolean("is_verified").default(false),
  bio: text("bio"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("instagram_contacts_company_username_idx").on(table.companyId, table.username),
  index("instagram_contacts_company_id_idx").on(table.companyId),
  index("instagram_contacts_status_idx").on(table.companyId, table.status),
  index("instagram_contacts_score_idx").on(table.companyId, table.interactionScore),
  index("instagram_contacts_last_interaction_idx").on(table.companyId, table.lastInteractionAt),
]);

export const instagramInteractions = socialSchema.table("instagram_interactions", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").references(() => instagramContacts.id, { onDelete: "cascade" }).notNull(),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  type: text("type", { enum: instagramInteractionTypeEnum }).notNull(),
  referenceId: text("reference_id"),
  contentPreview: text("content_preview"),
  metadata: jsonb("metadata"),
  occurredAt: timestamp("occurred_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("instagram_interactions_contact_id_idx").on(table.contactId),
  index("instagram_interactions_company_type_idx").on(table.companyId, table.type),
  index("instagram_interactions_occurred_at_idx").on(table.contactId, table.occurredAt),
]);

export const instagramContactsRelations = relations(instagramContacts, ({ one, many }) => ({
  company: one(companies, { fields: [instagramContacts.companyId], references: [companies.id] }),
  profile: one(instagramProfiles, { fields: [instagramContacts.instagramProfileId], references: [instagramProfiles.id] }),
  user: one(users, { fields: [instagramContacts.userId], references: [users.id] }),
  interactions: many(instagramInteractions),
}));

export const instagramInteractionsRelations = relations(instagramInteractions, ({ one }) => ({
  contact: one(instagramContacts, { fields: [instagramInteractions.contactId], references: [instagramContacts.id] }),
  company: one(companies, { fields: [instagramInteractions.companyId], references: [companies.id] }),
}));

export const insertInstagramContactSchema = createInsertSchema(instagramContacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInstagramInteractionSchema = createInsertSchema(instagramInteractions).omit({
  id: true,
  createdAt: true,
});

export type InstagramContact = typeof instagramContacts.$inferSelect;
export type InsertInstagramContact = z.infer<typeof insertInstagramContactSchema>;
export type InstagramInteraction = typeof instagramInteractions.$inferSelect;
export type InsertInstagramInteraction = z.infer<typeof insertInstagramInteractionSchema>;

// ============================================
// META MARKETING API INTEGRATION TABLES
// ============================================

export const metaAdAccounts = socialSchema.table("meta_ad_accounts", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  metaUserId: text("meta_user_id").notNull(),
  metaUserName: text("meta_user_name"),
  metaUserEmail: text("meta_user_email"),
  accessToken: text("access_token").notNull(),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  scopes: text("scopes").array(),
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const metaBusinessManagers = socialSchema.table("meta_business_managers", {
  id: serial("id").primaryKey(),
  metaAdAccountId: integer("meta_ad_account_id").references(() => metaAdAccounts.id, { onDelete: "cascade" }).notNull(),
  businessId: text("business_id").notNull(),
  businessName: text("business_name"),
  isSelected: boolean("is_selected").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const metaAdAccountsList = socialSchema.table("meta_ad_accounts_list", {
  id: serial("id").primaryKey(),
  metaAdAccountId: integer("meta_ad_account_id").references(() => metaAdAccounts.id, { onDelete: "cascade" }).notNull(),
  adAccountId: text("ad_account_id").notNull(),
  adAccountName: text("ad_account_name"),
  currency: text("currency"),
  timezone: text("timezone"),
  businessId: text("business_id"),
  isSelected: boolean("is_selected").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const metaAdAccountsRelations = relations(metaAdAccounts, ({ one, many }) => ({
  company: one(companies, { fields: [metaAdAccounts.companyId], references: [companies.id] }),
  businessManagers: many(metaBusinessManagers),
  adAccountsList: many(metaAdAccountsList),
}));

export const metaBusinessManagersRelations = relations(metaBusinessManagers, ({ one }) => ({
  metaAdAccount: one(metaAdAccounts, { fields: [metaBusinessManagers.metaAdAccountId], references: [metaAdAccounts.id] }),
}));

export const metaAdAccountsListRelations = relations(metaAdAccountsList, ({ one }) => ({
  metaAdAccount: one(metaAdAccounts, { fields: [metaAdAccountsList.metaAdAccountId], references: [metaAdAccounts.id] }),
}));

export const insertMetaAdAccountSchema = createInsertSchema(metaAdAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMetaBusinessManagerSchema = createInsertSchema(metaBusinessManagers).omit({
  id: true,
  createdAt: true,
});

export const insertMetaAdAccountsListSchema = createInsertSchema(metaAdAccountsList).omit({
  id: true,
  createdAt: true,
});

// Integration Logs - stores sync history for integrations
export const integrationLogs = systemSchema.table("integration_logs", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  platform: text("platform").notNull(),
  action: text("action").notNull(),
  status: text("status").notNull(),
  endpoint: text("endpoint"),
  details: jsonb("details"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIntegrationLogSchema = createInsertSchema(integrationLogs).omit({
  id: true,
  createdAt: true,
});

export type IntegrationLog = typeof integrationLogs.$inferSelect;
export type InsertIntegrationLog = z.infer<typeof insertIntegrationLogSchema>;

// Meta Marketing API Types
export type MetaAdAccount = typeof metaAdAccounts.$inferSelect;
export type InsertMetaAdAccount = z.infer<typeof insertMetaAdAccountSchema>;
export type MetaBusinessManager = typeof metaBusinessManagers.$inferSelect;
export type InsertMetaBusinessManager = z.infer<typeof insertMetaBusinessManagerSchema>;
export type MetaAdAccountsList = typeof metaAdAccountsList.$inferSelect;
export type InsertMetaAdAccountsList = z.infer<typeof insertMetaAdAccountsListSchema>;

// Creator Ad Partners - stores authorized creators for Partnership Ads
export const creatorAdPartnerStatusEnum = ["pending", "request_sent", "active", "expired", "revoked"] as const;

export const creatorAdPartners = creatorSchema.table("creator_ad_partners", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  creatorId: integer("creator_id").references(() => users.id, { onDelete: "cascade" }),
  instagramAccountId: integer("instagram_account_id").references(() => instagramAccounts.id),
  instagramUserId: text("instagram_user_id"),
  instagramUsername: text("instagram_username"),
  instagramProfilePic: text("instagram_profile_pic"),
  status: text("status").$type<typeof creatorAdPartnerStatusEnum[number]>().default("pending"),
  authorizedAt: timestamp("authorized_at"),
  expiresAt: timestamp("expires_at"),
  permissions: text("permissions").array(),
  metaPartnerId: text("meta_partner_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Creator Auth Links - one-click authentication links for creators
export const creatorAuthLinks = creatorSchema.table("creator_auth_links", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  creatorId: integer("creator_id").references(() => users.id),
  token: text("token").notNull().unique(),
  instagramUsername: text("instagram_username"),
  email: text("email"),
  isUsed: boolean("is_used").default(false),
  usedAt: timestamp("used_at"),
  expiresAt: timestamp("expires_at").notNull(),
  redirectUrl: text("redirect_url"),
  createdAt: timestamp("created_at").defaultNow(),
});


// Relations for new tables
export const creatorAdPartnersRelations = relations(creatorAdPartners, ({ one, many }) => ({
  company: one(companies, { fields: [creatorAdPartners.companyId], references: [companies.id] }),
  creator: one(users, { fields: [creatorAdPartners.creatorId], references: [users.id] }),
  instagramAccount: one(instagramAccounts, { fields: [creatorAdPartners.instagramAccountId], references: [instagramAccounts.id] }),
}));

export const creatorAuthLinksRelations = relations(creatorAuthLinks, ({ one }) => ({
  company: one(companies, { fields: [creatorAuthLinks.companyId], references: [companies.id] }),
  creator: one(users, { fields: [creatorAuthLinks.creatorId], references: [users.id] }),
}));


// Insert schemas
export const insertCreatorAdPartnerSchema = createInsertSchema(creatorAdPartners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCreatorAuthLinkSchema = createInsertSchema(creatorAuthLinks).omit({
  id: true,
  createdAt: true,
});


// instagram_profile_pics - REMOVIDO: Dados migrados para instagram_profiles (campos profile_pic_storage_path, profile_pic_original_url)

// Types
export type CreatorAdPartner = typeof creatorAdPartners.$inferSelect;
export type InsertCreatorAdPartner = z.infer<typeof insertCreatorAdPartnerSchema>;
export type CreatorAuthLink = typeof creatorAuthLinks.$inferSelect;
export type InsertCreatorAuthLink = z.infer<typeof insertCreatorAuthLinkSchema>;
// Contact Notes - private notes about Instagram contacts
export const contactNotes = miscSchema.table("contact_notes", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  instagramUsername: text("instagram_username").notNull(),
  content: text("content").notNull(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contactNotesRelations = relations(contactNotes, ({ one }) => ({
  company: one(companies, { fields: [contactNotes.companyId], references: [companies.id] }),
  createdByUser: one(users, { fields: [contactNotes.createdBy], references: [users.id] }),
}));

export const insertContactNoteSchema = createInsertSchema(contactNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ContactNote = typeof contactNotes.$inferSelect;
export type InsertContactNote = z.infer<typeof insertContactNoteSchema>;

// ============================================================
// DM TEMPLATES - Templates de mensagem para convites
// ============================================================

export const dmTemplateTypeEnum = ["campaign_invite", "community_invite", "follow_up", "welcome", "custom"] as const;

export const dmTemplates = socialSchema.table("dm_templates", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  type: text("type", { enum: dmTemplateTypeEnum }).notNull().default("custom"),
  content: text("content").notNull(),
  variables: text("variables").array().default([]), // Available variables like {nome_criador}, {nome_campanha}
  isDefault: boolean("is_default").default(false),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// DM Send Logs - Track sent DMs for analytics
export const dmSendLogs = socialSchema.table("dm_send_logs", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  templateId: integer("template_id").references(() => dmTemplates.id, { onDelete: "set null" }),
  instagramAccountId: integer("instagram_account_id").references(() => instagramAccounts.id),
  recipientUsername: text("recipient_username").notNull(),
  recipientIgId: text("recipient_ig_id"),
  campaignId: integer("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
  messageContent: text("message_content").notNull(),
  status: text("status", { enum: ["pending", "sent", "failed", "delivered", "read"] }).notNull().default("pending"),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dmTemplatesRelations = relations(dmTemplates, ({ one, many }) => ({
  company: one(companies, { fields: [dmTemplates.companyId], references: [companies.id] }),
  createdByUser: one(users, { fields: [dmTemplates.createdBy], references: [users.id] }),
  sendLogs: many(dmSendLogs),
}));

export const dmSendLogsRelations = relations(dmSendLogs, ({ one }) => ({
  company: one(companies, { fields: [dmSendLogs.companyId], references: [companies.id] }),
  template: one(dmTemplates, { fields: [dmSendLogs.templateId], references: [dmTemplates.id] }),
  instagramAccount: one(instagramAccounts, { fields: [dmSendLogs.instagramAccountId], references: [instagramAccounts.id] }),
  campaign: one(campaigns, { fields: [dmSendLogs.campaignId], references: [campaigns.id] }),
}));

export const insertDmTemplateSchema = createInsertSchema(dmTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDmSendLogSchema = createInsertSchema(dmSendLogs).omit({
  id: true,
  createdAt: true,
});

export type DmTemplate = typeof dmTemplates.$inferSelect;
export type InsertDmTemplate = z.infer<typeof insertDmTemplateSchema>;
export type DmSendLog = typeof dmSendLogs.$inferSelect;
export type InsertDmSendLog = z.infer<typeof insertDmSendLogSchema>;

// ============================================================
// PROFILE METRICS HISTORY TABLES - Tracking profile/post metrics over time
// ============================================================

// Histórico de métricas de perfis para gráficos de crescimento
export const profileSnapshots = analyticsSchema.table("profile_snapshots", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  followersCount: integer("followers_count"),
  followsCount: integer("follows_count"),
  postsCount: integer("posts_count"),
  engagementRate: text("engagement_rate"),
  isVerified: boolean("is_verified").default(false),
  isPrivate: boolean("is_private").default(false),
  biography: text("biography"),
  fullName: text("full_name"),
  profilePicUrl: text("profile_pic_url"),
  externalUrl: text("external_url"),
  businessCategory: text("business_category"),
  rawData: jsonb("raw_data"), // Full response data
  snapshotDate: timestamp("snapshot_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Registry de fontes de dados externas (Apify actors, APIs, etc)
export const dataSourceRegistry = systemSchema.table("data_source_registry", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // e.g., "instagram_profile", "tiktok_scraper"
  actorId: text("actor_id").notNull(), // e.g., "apify/instagram-profile-scraper"
  displayName: text("display_name"),
  costPer1k: text("cost_per_1k"), // e.g., "2.60"
  pricingModel: text("pricing_model", { enum: ["ppr", "ppe", "cu"] }).default("ppr"), // Pay Per Result, Pay Per Event, Compute Units
  category: text("category", { enum: ["instagram", "tiktok", "meta_ads", "youtube", "ecommerce", "discovery", "utility"] }),
  description: text("description"),
  inputSchemaUrl: text("input_schema_url"),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Log de chamadas a APIs externas (para controle de custos)

// Insert Schemas
export const insertProfileSnapshotSchema = createInsertSchema(profileSnapshots).omit({
  id: true,
  createdAt: true,
});


export const insertDataSourceRegistrySchema = createInsertSchema(dataSourceRegistry).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ==================== TikTok Tables ====================

export const tiktokProfiles = socialSchema.table("tiktok_profiles", {
  id: serial("id").primaryKey(),
  uniqueId: text("unique_id").notNull().unique(), // @username
  userId: text("user_id"), // TikTok internal ID
  nickname: text("nickname"),
  avatarUrl: text("avatar_url"),
  signature: text("signature"), // bio
  verified: boolean("verified").default(false),
  followers: integer("followers").default(0),
  following: integer("following").default(0),
  hearts: integer("hearts").default(0), // total likes received
  videoCount: integer("video_count").default(0),
  rawData: jsonb("raw_data"),
  lastFetchedAt: timestamp("last_fetched_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  // OAuth fields (TikTok Login Kit)
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"), // comma-separated scopes granted
  openId: text("open_id").unique(), // TikTok unique user identifier
  unionId: text("union_id"), // cross-app identifier

  // Connection metadata
  connectedByUserId: integer("connected_by_user_id"),
  connectedAt: timestamp("connected_at"),
  disconnectedAt: timestamp("disconnected_at"),
  lastSyncedAt: timestamp("last_synced_at"),
  syncStatus: text("sync_status", { enum: ["active", "error", "disconnected"] }).default("active"),
  syncError: text("sync_error"),
}, (table) => [
  index("tiktok_profiles_connected_by_user_idx").on(table.connectedByUserId),
  index("tiktok_profiles_open_id_idx").on(table.openId),
]);

export const tiktokVideos = socialSchema.table("tiktok_videos", {
  id: serial("id").primaryKey(),
  videoId: text("video_id").notNull().unique(),
  authorUniqueId: text("author_unique_id").notNull(),
  description: text("description"),
  coverUrl: text("cover_url"),
  videoUrl: text("video_url"),
  duration: integer("duration"), // seconds
  diggCount: integer("digg_count").default(0), // likes
  shareCount: integer("share_count").default(0),
  commentCount: integer("comment_count").default(0),
  playCount: integer("play_count").default(0),
  musicTitle: text("music_title"),
  musicAuthor: text("music_author"),
  hashtags: text("hashtags").array(),
  postedAt: timestamp("posted_at"),
  rawData: jsonb("raw_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ==================== Meta Ads Tables ====================

// Anúncios de concorrentes monitorados

// ==================== YouTube Tables ====================

export const youtubeChannels = socialSchema.table("youtube_channels", {
  id: serial("id").primaryKey(),
  channelId: text("channel_id").notNull().unique(),
  channelName: text("channel_name"),
  channelUrl: text("channel_url"),
  thumbnailUrl: text("thumbnail_url"),
  subscriberCount: integer("subscriber_count").default(0),
  videoCount: integer("video_count").default(0),
  viewCount: integer("view_count").default(0), // total views
  description: text("description"),
  rawData: jsonb("raw_data"),
  lastFetchedAt: timestamp("last_fetched_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const youtubeVideos = socialSchema.table("youtube_videos", {
  id: serial("id").primaryKey(),
  videoId: text("video_id").notNull().unique(),
  channelId: text("channel_id"),
  title: text("title"),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  viewCount: integer("view_count").default(0),
  likeCount: integer("like_count").default(0),
  commentCount: integer("comment_count").default(0),
  duration: text("duration"), // ISO 8601 format
  publishedAt: timestamp("published_at"),
  isShort: boolean("is_short").default(false),
  rawData: jsonb("raw_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ==================== E-commerce Tables ====================

// Produtos de e-commerce monitorados

// ==================== Blog / Content Tables ====================

export const blogPosts = contentSchema.table("blog_posts", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  type: text("type").notNull().default("article"),
  category: text("category").notNull().default("dicas"),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  image: text("image"),
  author: text("author").notNull().default("CreatorConnect"),
  authorAvatar: text("author_avatar"),
  readTime: text("read_time"),
  featured: boolean("featured").default(false),
  published: boolean("published").default(false),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords").array(),
  canonicalUrl: text("canonical_url"),
  ogImage: text("og_image"),
  structuredData: jsonb("structured_data"),
  company: text("company"),
  metricValue: text("metric_value"),
  metricLabel: text("metric_label"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("blog_posts_slug_idx").on(table.slug),
  index("blog_posts_published_idx").on(table.published),
  index("blog_posts_category_idx").on(table.category),
]);

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

// ==================== Insert Schemas for New Tables ====================

export const insertTikTokProfileSchema = createInsertSchema(tiktokProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTikTokVideoSchema = createInsertSchema(tiktokVideos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});


export const insertYouTubeChannelSchema = createInsertSchema(youtubeChannels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertYouTubeVideoSchema = createInsertSchema(youtubeVideos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});


export const hashtagSearches = miscSchema.table("hashtag_searches", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  instagramUserId: text("instagram_user_id").notNull(),
  hashtag: text("hashtag").notNull(),
  hashtagId: text("hashtag_id"),
  searchedAt: timestamp("searched_at").defaultNow().notNull(),
});

export const campaignHashtags = campaignSchema.table("campaign_hashtags", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  companyId: integer("company_id").notNull().references(() => companies.id),
  hashtag: text("hashtag").notNull(),
  hashtagId: text("hashtag_id"),
  isActive: boolean("is_active").notNull().default(true),
  lastCheckedAt: timestamp("last_checked_at"),
  totalPostsFound: integer("total_posts_found").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueCampaignHashtag: unique().on(table.campaignId, table.hashtag),
}));

export const hashtagPosts = miscSchema.table("hashtag_posts", {
  id: serial("id").primaryKey(),
  campaignHashtagId: integer("campaign_hashtag_id").notNull().references(() => campaignHashtags.id),
  companyId: integer("company_id").notNull().references(() => companies.id),
  mediaId: text("media_id").notNull(),
  mediaType: text("media_type"),
  caption: text("caption"),
  permalink: text("permalink"),
  mediaUrl: text("media_url"),
  thumbnailUrl: text("thumbnail_url"),
  likeCount: integer("like_count"),
  commentsCount: integer("comments_count"),
  timestamp: timestamp("timestamp"),
  username: text("username"),
  source: text("source", { enum: ["top", "recent"] }).notNull().default("recent"),
  discoveredAt: timestamp("discovered_at").defaultNow().notNull(),
}, (table) => ({
  uniqueMedia: unique().on(table.campaignHashtagId, table.mediaId),
}));

export const insertHashtagSearchSchema = createInsertSchema(hashtagSearches).omit({
  id: true,
  searchedAt: true,
});

export const insertCampaignHashtagSchema = createInsertSchema(campaignHashtags).omit({
  id: true,
  createdAt: true,
});

export const insertHashtagPostSchema = createInsertSchema(hashtagPosts).omit({
  id: true,
  discoveredAt: true,
});

export type HashtagSearch = typeof hashtagSearches.$inferSelect;
export type InsertHashtagSearch = z.infer<typeof insertHashtagSearchSchema>;
export type CampaignHashtag = typeof campaignHashtags.$inferSelect;
export type InsertCampaignHashtag = z.infer<typeof insertCampaignHashtagSchema>;
export type HashtagPost = typeof hashtagPosts.$inferSelect;
export type InsertHashtagPost = z.infer<typeof insertHashtagPostSchema>;

// Types
export type TikTokProfile = typeof tiktokProfiles.$inferSelect;
export type InsertTikTokProfile = z.infer<typeof insertTikTokProfileSchema>;
export type TikTokVideo = typeof tiktokVideos.$inferSelect;
export type InsertTikTokVideo = z.infer<typeof insertTikTokVideoSchema>;
export type YouTubeChannel = typeof youtubeChannels.$inferSelect;
export type InsertYouTubeChannel = z.infer<typeof insertYouTubeChannelSchema>;
export type YouTubeVideo = typeof youtubeVideos.$inferSelect;
export type InsertYouTubeVideo = z.infer<typeof insertYouTubeVideoSchema>;
export type DataSourceRegistry = typeof dataSourceRegistry.$inferSelect;
export type InsertDataSourceRegistry = z.infer<typeof insertDataSourceRegistrySchema>;
export type ProfileSnapshot = typeof profileSnapshots.$inferSelect;
export type InsertProfileSnapshot = z.infer<typeof insertProfileSnapshotSchema>;

// === Frontend-only types (não precisam de tabelas) ===

export type BrandMention = {
  id: number;
  brandId: number;
  campaignId: number | null;
  creatorId: number | null;
  platform: string;
  mentionType: string;
  postType: string | null;
  postUrl: string | null;
  thumbnailUrl: string | null;
  caption: string | null;
  authorUsername: string | null;
  likes: number;
  comments: number;
  views: number;
  shares: number;
  postedAt: string | null;
  createdAt: string | null;
};

export type UgcAsset = {
  id: number;
  brandId: number;
  campaignId: number | null;
  creatorId: number | null;
  title: string;
  description: string | null;
  type: string;
  url: string;
  status: string;
  tags: string[] | null;
  createdAt: string | null;
  usageRights?: UsageRights;
};

export type UsageRights = {
  id: number;
  assetId: number;
  type: string;
  expiresAt: string | null;
  ads?: boolean;
  organic?: boolean;
  whitelist?: boolean;
};

export type AssetComment = {
  id: number;
  assetId: number;
  userId: number;
  content: string;
  body?: string;
  createdAt: string | null;
};

export type MonthlyLeaderboard = {
  id: number;
  userId: number;
  points: number;
  rank: number;
  campaignsCompleted: number;
  avgRating: number;
  month: string;
  year: number;
};

export type Competition = {
  id: number;
  campaignId: number;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
};

export type EcommerceIntegration = {
  id: number;
  companyId: number;
  platform: string;
  storeUrl: string | null;
  shopUrl?: string | null;
  apiKey: string | null;
  webhookSecret?: string | null;
  isActive: boolean;
  lastSyncAt: string | null;
};

export type BrandScoringDefaults = {
  pointsPerPost: number;
  pointsPerStory: number;
  pointsPerReel: number;
  pointsOnTimeBonus: number;
  pointsPer1kViews: number;
  qualityMultiplier: number;
  rulesJson?: any;
  capsJson?: any;
};
