export const NICHE_OPTIONS = [
  { value: "tech", label: "Tecnologia & Games" },
  { value: "lifestyle", label: "Estilo de Vida & Vlogs" },
  { value: "beauty", label: "Beleza & Moda" },
  { value: "education", label: "Educação" },
  { value: "finance", label: "Finanças & Investimentos" },
  { value: "health", label: "Saúde & Fitness" },
  { value: "travel", label: "Viagens" },
  { value: "food", label: "Gastronomia" },
  { value: "entertainment", label: "Entretenimento & Humor" },
  { value: "sports", label: "Esportes" },
  { value: "pets", label: "Pets & Animais" },
  { value: "parenting", label: "Maternidade & Família" },
  { value: "business", label: "Negócios & Empreendedorismo" },
  { value: "other", label: "Outros" }
] as const;

export const PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "twitter", label: "X (Twitter)" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "pinterest", label: "Pinterest" },
  { value: "kwai", label: "Kwai" },
] as const;

export const CONTENT_FORMAT_OPTIONS = [
  { value: "photo", label: "Foto" },
  { value: "carousel", label: "Carrossel" },
  { value: "reels", label: "Reels" },
  { value: "stories", label: "Stories" },
  { value: "video", label: "Vídeo" },
  { value: "short", label: "Short" },
  { value: "live", label: "Live" },
  { value: "ugc", label: "UGC" },
] as const;

export const DELIVERABLE_TYPE_OPTIONS = [
  { value: "instagram_post", label: "Post Instagram" },
  { value: "instagram_reels", label: "Reels Instagram" },
  { value: "instagram_stories", label: "Stories Instagram" },
  { value: "instagram_carousel", label: "Carrossel Instagram" },
  { value: "tiktok_video", label: "Vídeo TikTok" },
  { value: "youtube_video", label: "Vídeo YouTube" },
  { value: "youtube_shorts", label: "Shorts YouTube" },
  { value: "ugc_video", label: "Vídeo UGC" },
  { value: "ugc_photo", label: "Foto UGC" },
  { value: "review", label: "Review/Depoimento" },
  { value: "unboxing", label: "Unboxing" },
  { value: "tutorial", label: "Tutorial" },
  { value: "other", label: "Outro" },
] as const;

export type NicheValue = typeof NICHE_OPTIONS[number]["value"];
export type PlatformValue = typeof PLATFORM_OPTIONS[number]["value"];
export type ContentFormatValue = typeof CONTENT_FORMAT_OPTIONS[number]["value"];
export type DeliverableTypeValue = typeof DELIVERABLE_TYPE_OPTIONS[number]["value"];

export const AGE_RANGE_OPTIONS = [
  { value: "13-17", label: "13-17 anos" },
  { value: "18-24", label: "18-24 anos" },
  { value: "25-34", label: "25-34 anos" },
  { value: "35-44", label: "35-44 anos" },
  { value: "45-54", label: "45-54 anos" },
  { value: "55+", label: "55+ anos" },
];

export const STATE_OPTIONS = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

export const IDEAL_CONTENT_TYPES = [
  { value: "review", label: "Review" },
  { value: "unboxing", label: "Unboxing" },
  { value: "tutorial", label: "Tutorial" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "antes_depois", label: "Antes e Depois" },
  { value: "receita", label: "Receita" },
  { value: "day_in_life", label: "Day in the Life" },
  { value: "depoimento", label: "Depoimento" },
  { value: "challenge", label: "Challenge" },
  { value: "behind_scenes", label: "Behind the Scenes" },
] as const;

export const BRAND_VOICE_OPTIONS = [
  { value: "formal", label: "Formal" },
  { value: "descontraido", label: "Descontraído" },
  { value: "tecnico", label: "Técnico" },
  { value: "inspiracional", label: "Inspiracional" },
  { value: "divertido", label: "Divertido" },
  { value: "premium", label: "Premium" },
  { value: "jovem", label: "Jovem" },
] as const;

// Brand Canvas V2 options
export const VISUAL_AESTHETIC_OPTIONS = [
  { value: "minimal", label: "Minimalista" },
  { value: "bold", label: "Ousado" },
  { value: "elegant", label: "Elegante" },
  { value: "playful", label: "Divertido" },
  { value: "corporate", label: "Corporativo" },
  { value: "organic", label: "Orgânico" },
  { value: "vintage", label: "Vintage" },
  { value: "tech", label: "Tecnológico" },
] as const;

export const LANGUAGE_STYLE_OPTIONS = [
  { value: "formal", label: "Formal" },
  { value: "casual", label: "Casual" },
  { value: "slang", label: "Gírias / Coloquial" },
  { value: "technical", label: "Técnico" },
  { value: "poetic", label: "Poético" },
] as const;

export const EMOJI_USAGE_OPTIONS = [
  { value: "none", label: "Nenhum" },
  { value: "minimal", label: "Mínimo" },
  { value: "moderate", label: "Moderado" },
  { value: "heavy", label: "Intenso" },
] as const;

export const FONT_SCALE_OPTIONS = [
  { value: "compact", label: "Compacto" },
  { value: "normal", label: "Normal" },
  { value: "large", label: "Grande" },
] as const;

export const PERSONALITY_TRAIT_OPTIONS = [
  { value: "amigável", label: "Amigável" },
  { value: "autoritário", label: "Autoritário" },
  { value: "confiável", label: "Confiável" },
  { value: "criativo", label: "Criativo" },
  { value: "divertido", label: "Divertido" },
  { value: "educativo", label: "Educativo" },
  { value: "empático", label: "Empático" },
  { value: "inovador", label: "Inovador" },
  { value: "inspirador", label: "Inspirador" },
  { value: "ousado", label: "Ousado" },
  { value: "premium", label: "Premium" },
  { value: "sustentável", label: "Sustentável" },
] as const;

export type VisualAestheticValue = typeof VISUAL_AESTHETIC_OPTIONS[number]["value"];
export type LanguageStyleValue = typeof LANGUAGE_STYLE_OPTIONS[number]["value"];
export type EmojiUsageValue = typeof EMOJI_USAGE_OPTIONS[number]["value"];
export type FontScaleValue = typeof FONT_SCALE_OPTIONS[number]["value"];

export const ANNUAL_REVENUE_OPTIONS = [
  "R$0 – R$30.000",
  "R$30.000 – R$50.000",
  "R$50.000 – R$100.000",
  "R$100.000 – R$500.000",
  "R$500.000 – R$1 milhão",
  "R$1 milhão – R$5 milhões",
  "R$5 milhões – R$15 milhões",
  "R$15 milhões – R$30 milhões",
  "Mais de R$30 milhões",
] as const;

export const BRAZIL_REGIONS: Record<string, string[]> = {
  sudeste: ["SP", "RJ", "MG", "ES"],
  sul: ["PR", "SC", "RS"],
  nordeste: ["BA", "CE", "PE", "MA", "PB", "RN", "PI", "AL", "SE"],
  norte: ["AM", "PA", "AC", "RO", "RR", "AP", "TO"],
  centro_oeste: ["GO", "MT", "MS", "DF"],
};

export function getRegionForState(state: string): string | null {
  for (const [region, states] of Object.entries(BRAZIL_REGIONS)) {
    if (states.includes(state.toUpperCase())) return region;
  }
  return null;
}
