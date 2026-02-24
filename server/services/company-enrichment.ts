import { db } from "../db";
import { companies, type StructuredBriefing, type BrandCanvas } from "@shared/schema";
import { eq } from "drizzle-orm";
import { storage } from "../storage";
import { sendGeminiMessage } from "../lib/gemini";

/**
 * Match CNAE description to a platform category.
 */
function matchCnaeToCategory(cnaeDescription: string): string {
  if (!cnaeDescription) return "outros";
  const desc = cnaeDescription.toLowerCase();
  if (desc.includes("saude") || desc.includes("saúde") || desc.includes("farmac") || desc.includes("medic")) return "saude";
  if (desc.includes("beleza") || desc.includes("cosmet") || desc.includes("estetic")) return "beleza";
  if (desc.includes("moda") || desc.includes("vestuário") || desc.includes("roupa") || desc.includes("confec") || desc.includes("calçad")) return "moda";
  if (desc.includes("tecnologia") || desc.includes("informática") || desc.includes("software") || desc.includes("computad")) return "tecnologia";
  if (desc.includes("aliment") || desc.includes("comida") || desc.includes("restaur") || desc.includes("padaria") || desc.includes("chocolat")) return "alimentos";
  if (desc.includes("bebida") || desc.includes("cervej") || desc.includes("vinho")) return "bebidas";
  if (desc.includes("fitness") || desc.includes("academia") || desc.includes("esport") || desc.includes("suplement")) return "fitness";
  if (desc.includes("casa") || desc.includes("decoração") || desc.includes("moveis") || desc.includes("móveis")) return "casa";
  if (desc.includes("pet") || desc.includes("animal") || desc.includes("veterinár")) return "pets";
  if (desc.includes("infantil") || desc.includes("criança") || desc.includes("brinquedo")) return "infantil";
  return "outros";
}

/**
 * Re-enrich company CNPJ data from ReceitaWS.
 * Returns true if data was updated.
 */
export async function enrichCompanyCnpj(companyId: number, cnpj: string): Promise<boolean> {
  const cleanCnpj = cnpj.replace(/\D/g, "");
  if (cleanCnpj.length !== 14) return false;

  try {
    const response = await fetch(`https://receitaws.com.br/v1/cnpj/${cleanCnpj}`);
    if (!response.ok) {
      console.log(`[CompanyEnrich] CNPJ fetch failed for company ${companyId}: status ${response.status}`);
      return false;
    }

    const data = await response.json();
    if (data.status === "ERROR") return false;

    // Build update object with CNPJ data
    const updateData: Record<string, any> = {
      cnpjRazaoSocial: data.nome || null,
      cnpjNomeFantasia: data.fantasia || null,
      cnpjSituacao: data.situacao || null,
      cnpjAtividadePrincipal: data.atividade_principal?.[0]?.text || null,
      cnpjDataAbertura: data.abertura || null,
      cnpjCapitalSocial: data.capital_social || null,
      cnpjNaturezaJuridica: data.natureza_juridica || null,
      cnpjQsa: data.qsa?.map((s: any) => ({ nome: s.nome, qual: s.qual })) || null,
      cnpjLastUpdated: new Date(),
    };

    // Fill basic fields from CNPJ data if not already set
    const existing = await db.select({
      tradeName: companies.tradeName,
      phone: companies.phone,
      cep: companies.cep,
      street: companies.street,
      number: companies.number,
      neighborhood: companies.neighborhood,
      complement: companies.complement,
      city: companies.city,
      state: companies.state,
      category: companies.category,
    }).from(companies).where(eq(companies.id, companyId)).limit(1);
    if (existing[0]) {
      const e = existing[0];
      if (!e.tradeName && (data.fantasia || data.nome)) {
        updateData.tradeName = data.fantasia || data.nome;
      }
      if (!e.phone && data.telefone) {
        // Format phone: remove non-digits, keep raw
        updateData.phone = data.telefone.replace(/\D/g, "").slice(0, 11);
      }
      if (!e.cep && data.cep) {
        updateData.cep = data.cep.replace(/\D/g, "");
      }
      if (!e.street && data.logradouro) {
        updateData.street = data.logradouro;
      }
      if (!e.number && data.numero) {
        updateData.number = data.numero;
      }
      if (!e.neighborhood && data.bairro) {
        updateData.neighborhood = data.bairro;
      }
      if (!e.complement && data.complemento) {
        updateData.complement = data.complemento;
      }
      if (!e.city && data.municipio) {
        updateData.city = data.municipio;
      }
      if (!e.state && data.uf) {
        updateData.state = data.uf;
      }
      if (!e.category && data.atividade_principal?.[0]?.text) {
        updateData.category = matchCnaeToCategory(data.atividade_principal[0].text);
      }
    }

    await db.update(companies).set(updateData).where(eq(companies.id, companyId));

    console.log(`[CompanyEnrich] CNPJ updated for company ${companyId}`);
    return true;
  } catch (error) {
    console.error(`[CompanyEnrich] CNPJ error for company ${companyId}:`, error);
    return false;
  }
}

/**
 * Re-enrich company website data via Apify crawler + Gemini AI analysis.
 * Returns true if data was updated.
 */
export async function enrichCompanyWebsite(companyId: number, url: string): Promise<boolean> {
  const APIFY_API_KEY = process.env.APIFY_API_KEY;
  if (!APIFY_API_KEY) return false;

  try {
    const parsedUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) return false;

    const actorId = "apify~website-content-crawler";
    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startUrls: [{ url }],
          maxCrawlPages: 10,
          crawlerType: 'cheerio',
        }),
      }
    );

    if (!runResponse.ok) return false;

    const results = await runResponse.json();
    const pageData = results[0];
    if (!pageData) return false;

    const allText = results.map((p: any) => (p.text || '').slice(0, 2000)).join('\n\n');
    const contentSummary = allText.slice(0, 8000);

    const aboutPage = results.find((p: any) => {
      const pageUrl = (p.url || '').toLowerCase();
      return pageUrl.includes('/sobre') || pageUrl.includes('/about') || pageUrl.includes('/quem-somos') || pageUrl.includes('/a-empresa');
    });

    const crawledPages = results.map((p: any) => ({
      url: p.url || '',
      title: p.title || '',
      summary: (p.text || '').slice(0, 300),
    }));

    const socialLinks: Record<string, string> = {};
    for (const page of results) {
      const fullText = (page.html || page.text || '');
      const urlRegex = /https?:\/\/(?:www\.)?(instagram|facebook|tiktok|youtube|twitter|linkedin|x)\.com\/[^\s"'<>)]+/gi;
      let match;
      while ((match = urlRegex.exec(fullText)) !== null) {
        const link = match[0];
        if (link.includes('instagram.com') && !socialLinks.instagram) socialLinks.instagram = link;
        else if (link.includes('facebook.com') && !socialLinks.facebook) socialLinks.facebook = link;
        else if (link.includes('tiktok.com') && !socialLinks.tiktok) socialLinks.tiktok = link;
        else if (link.includes('youtube.com') && !socialLinks.youtube) socialLinks.youtube = link;
        else if ((link.includes('twitter.com') || link.includes('x.com')) && !socialLinks.twitter) socialLinks.twitter = link;
        else if (link.includes('linkedin.com') && !socialLinks.linkedin) socialLinks.linkedin = link;
      }
    }

    const allKeywords: string[] = [];
    for (const page of results) {
      if (page.metadata?.keywords) {
        const kw = typeof page.metadata.keywords === 'string'
          ? page.metadata.keywords.split(',').map((k: string) => k.trim())
          : page.metadata.keywords;
        allKeywords.push(...kw);
      }
    }
    const uniqueKeywords = Array.from(new Set(allKeywords.filter(Boolean))).slice(0, 30);

    await db.update(companies).set({
      websiteTitle: pageData.title || null,
      websiteDescription: pageData.metadata?.description || null,
      websiteContent: contentSummary,
      websiteAbout: aboutPage?.text?.slice(0, 3000) || null,
      websitePages: crawledPages,
      websiteSocialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : null,
      websiteKeywords: uniqueKeywords.length > 0 ? uniqueKeywords : null,
      websiteLastUpdated: new Date(),
    }).where(eq(companies.id, companyId));

    console.log(`[CompanyEnrich] Website updated for company ${companyId}: ${results.length} pages`);
    return true;
  } catch (error) {
    console.error(`[CompanyEnrich] Website error for company ${companyId}:`, error);
    return false;
  }
}

/**
 * Re-enrich company Instagram data.
 * Returns true if data was updated.
 */
export async function enrichCompanyInstagram(companyId: number, username: string): Promise<boolean> {
  const clean = username.replace("@", "").trim();
  if (!clean) return false;

  try {
    // Try Business Discovery first (free)
    const { tryBusinessDiscoveryForProfile } = await import("./business-discovery");
    let metrics: any = null;

    try {
      const bizData = await tryBusinessDiscoveryForProfile(clean);
      if (bizData && bizData.exists) {
        metrics = bizData;
      }
    } catch {}

    if (!metrics) {
      const { validateInstagramProfile } = await import("../apify-service");
      metrics = await validateInstagramProfile(clean);
    }

    if (!metrics?.exists) return false;

    // Save profile pic to permanent storage
    let savedProfilePicUrl = metrics.profilePicUrl;
    if (metrics.profilePicUrl) {
      try {
        const { downloadAndSaveToStorage, getPublicUrl } = await import("./instagram-profile-pic");
        const storagePath = await downloadAndSaveToStorage(clean, metrics.profilePicUrl);
        if (storagePath) {
          savedProfilePicUrl = getPublicUrl(storagePath);
        }
      } catch {}
    }

    await db.update(companies).set({
      instagramFollowers: metrics.followers || null,
      instagramBio: metrics.bio || null,
      instagramProfilePic: savedProfilePicUrl || null,
      instagramLastUpdated: new Date(),
    }).where(eq(companies.id, companyId));

    console.log(`[CompanyEnrich] Instagram updated for company ${companyId} (@${clean})`);
    return true;
  } catch (error) {
    console.error(`[CompanyEnrich] Instagram error for company ${companyId}:`, error);
    return false;
  }
}

/**
 * Build structured AI input from all available company data.
 * Organized by priority: identity → website content → products → social → legal.
 */
function buildAIInput(company: any): string {
  const sections: string[] = [];

  // === IDENTIDADE (sempre presente) ===
  const identity: string[] = [`nome: ${company.name}`];
  if (company.tradeName) identity.push(`nome_fantasia: ${company.tradeName}`);
  if (company.category) identity.push(`categoria: ${company.category}`);
  if (company.city) identity.push(`cidade: ${company.city}${company.state ? `/${company.state}` : ""}`);
  if (company.website) identity.push(`site: ${company.website}`);
  sections.push(`[IDENTIDADE]\n${identity.join("\n")}`);

  // === CONTEÚDO DO SITE (dado mais rico — prioridade máxima) ===
  const site: string[] = [];
  if (company.websiteAbout) site.push(`pagina_sobre:\n${company.websiteAbout.substring(0, 2000)}`);
  if (company.websiteContent) site.push(`conteudo_principal:\n${company.websiteContent.substring(0, 3000)}`);
  if (company.websiteDescription) site.push(`meta_description: ${company.websiteDescription}`);
  if (company.websiteFaq?.length) {
    const faq = company.websiteFaq.slice(0, 4).map((f: any) => `  - ${f.question}: ${f.answer}`).join("\n");
    site.push(`faq:\n${faq}`);
  }
  if (company.websiteKeywords?.length) site.push(`keywords: ${company.websiteKeywords.slice(0, 15).join(", ")}`);
  if (site.length) sections.push(`[SITE]\n${site.join("\n")}`);

  // === PRODUTOS E E-COMMERCE ===
  const products: string[] = [];
  if (company.websiteProducts?.length) products.push(`produtos: ${company.websiteProducts.slice(0, 15).join(", ")}`);
  if (company.ecommerceCategories?.length) products.push(`categorias: ${company.ecommerceCategories.join(", ")}`);
  if (company.ecommerceProductCount) products.push(`total_produtos: ${company.ecommerceProductCount}`);
  if (company.ecommercePlatform) products.push(`plataforma: ${company.ecommercePlatform}`);
  if (products.length) sections.push(`[PRODUTOS]\n${products.join("\n")}`);

  // === REDES SOCIAIS ===
  const social: string[] = [];
  if (company.instagramBio) social.push(`instagram_bio: ${company.instagramBio}`);
  if (company.instagramFollowers) social.push(`instagram_seguidores: ${company.instagramFollowers}`);
  if (company.instagramVerified) social.push(`instagram_verificado: sim`);
  if (company.instagram) social.push(`instagram: @${company.instagram.replace("@", "")}`);
  if (company.tiktok) social.push(`tiktok: @${company.tiktok.replace("@", "")}`);
  if (social.length) sections.push(`[REDES_SOCIAIS]\n${social.join("\n")}`);

  // === CNPJ (dados formais — menor prioridade para briefing) ===
  const legal: string[] = [];
  if (company.cnpjAtividadePrincipal) legal.push(`atividade_cnae: ${company.cnpjAtividadePrincipal}`);
  if (company.cnpjRazaoSocial) legal.push(`razao_social: ${company.cnpjRazaoSocial}`);
  if (legal.length) sections.push(`[DADOS_FORMAIS]\n${legal.join("\n")}`);

  return sections.join("\n\n");
}

const BRIEFING_SYSTEM_INSTRUCTION = `Você é um analista de marketing de influência brasileiro.
Sua tarefa: analisar dados de uma empresa e gerar um perfil de marca estruturado.
Regras:
- Base TUDO nos dados fornecidos — nunca invente informações
- Se não há dados suficientes para um campo, escreva algo genérico mas útil baseado na categoria
- Português brasileiro, tom profissional e direto
- Retorne APENAS JSON válido, sem markdown, sem comentários`;

/**
 * Regenerate structured briefing using Gemini AI.
 * Uses all available enrichment data to generate a comprehensive briefing.
 *
 * INPUT: Dados organizados por seção (identidade, site, produtos, social, legal)
 * OUTPUT: StructuredBriefing + description + tagline
 */
export async function regenerateStructuredBriefing(companyId: number): Promise<boolean> {
  try {
    const company = await storage.getCompany(companyId);
    if (!company) return false;

    const aiInput = buildAIInput(company);

    const prompt = `Analise os dados desta empresa e gere o perfil de marca.

${aiInput}

---

Retorne JSON com esta estrutura exata:
{
  "aboutBrand": "Conte a história da marca: quem é, como surgiu, qual o propósito. Tom narrativo e inspiracional. (2-3 frases, max 500 chars)",
  "whatWeDo": "O que a empresa faz e vende. Seja específico. (2-3 frases, max 500 chars)",
  "targetAudience": "Quem compra: faixa etária, gênero predominante, classe social, interesses. Infira dos produtos e conteúdo do site. (2-3 frases, max 400 chars)",
  "brandVoice": "formal | descontraido | tecnico | inspiracional | divertido | premium | jovem",
  "differentials": "O que diferencia esta marca dos concorrentes. Extraia dos dados reais. (2-3 frases, max 400 chars)",
  "idealContentTypes": "Escolha 2-4: review, unboxing, tutorial, lifestyle, antes_depois, receita, day_in_life, depoimento, challenge, behind_scenes",
  "avoidTopics": "Temas que um creator deve evitar ao falar desta marca. String vazia se nenhum.",
  "description": "Texto de apresentação da empresa para exibição pública no marketplace. Tom acolhedor e profissional. (2-3 frases, max 250 chars)",
  "tagline": "Frase curta que resume a proposta de valor da marca. (max 60 chars)"
}`;

    const aiResponse = await sendGeminiMessage(prompt, {
      model: "gemini-2.5-flash",
      systemInstruction: BRIEFING_SYSTEM_INSTRUCTION,
    });

    const cleanJson = aiResponse.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    // Separate profile fields (description, tagline, aboutBrand) from briefing fields
    const aiDescription: string | undefined = parsed.description;
    const aiTagline: string | undefined = parsed.tagline;
    const aiAboutBrand: string | undefined = parsed.aboutBrand;

    const sb: StructuredBriefing = {
      whatWeDo: parsed.whatWeDo,
      targetAudience: parsed.targetAudience,
      brandVoice: parsed.brandVoice,
      differentials: parsed.differentials,
      idealContentTypes: Array.isArray(parsed.idealContentTypes) ? parsed.idealContentTypes : [],
      avoidTopics: parsed.avoidTopics || "",
    };

    // Text briefing for backward compatibility (used in campaign context building)
    const textParts: string[] = [];
    if (sb.whatWeDo) textParts.push(sb.whatWeDo);
    if (sb.targetAudience) textParts.push(`Público-alvo: ${sb.targetAudience}`);
    if (sb.differentials) textParts.push(`Diferenciais: ${sb.differentials}`);

    const updateData: Record<string, any> = {
      structuredBriefing: sb,
      companyBriefing: textParts.join(" | "),
      aiContextSummary: textParts.join(" | "),
      aiContextLastUpdated: new Date(),
    };

    // Only set description and tagline if currently empty (don't overwrite manual data)
    if (aiDescription && !company.description) {
      updateData.description = aiDescription;
    }
    if (aiTagline && !company.tagline) {
      updateData.tagline = aiTagline;
    }

    // Merge AI data into Brand Canvas (only fill empty fields, never overwrite manual data)
    const existingCanvas = (company.brandCanvas as BrandCanvas | null) || {};
    const updatedCanvas: BrandCanvas = {
      ...existingCanvas,
      aboutBrand: existingCanvas.aboutBrand || aiAboutBrand,
      whatWeDo: existingCanvas.whatWeDo || sb.whatWeDo,
      targetAudience: existingCanvas.targetAudience || sb.targetAudience,
      brandVoice: existingCanvas.brandVoice || sb.brandVoice,
      differentials: existingCanvas.differentials || sb.differentials,
      idealContentTypes: existingCanvas.idealContentTypes?.length ? existingCanvas.idealContentTypes : sb.idealContentTypes,
      avoidTopics: existingCanvas.avoidTopics || sb.avoidTopics,
      lastUpdatedAt: new Date().toISOString(),
    };
    updateData.brandCanvas = updatedCanvas;

    await db.update(companies).set(updateData).where(eq(companies.id, companyId));

    console.log(`[CompanyEnrich] Briefing regenerated for company ${companyId}`);
    return true;
  } catch (error) {
    console.error(`[CompanyEnrich] Briefing error for company ${companyId}:`, error);
    return false;
  }
}

/**
 * Calculate enrichment score (0-100) based on data completeness.
 */
export function calculateEnrichmentScore(company: any): number {
  let score = 0;

  // Dados básicos (20 pts)
  if (company.name) score += 5;
  if (company.category) score += 5;
  if (company.city || company.state) score += 5;
  if (company.cnpj) score += 5;

  // CNPJ enrichment (15 pts)
  if (company.cnpjRazaoSocial) score += 5;
  if (company.cnpjAtividadePrincipal) score += 5;
  if (company.cnpjSituacao || company.cnpjDataAbertura || company.cnpjCapitalSocial) score += 5;

  // Website enrichment (20 pts)
  if (company.websiteTitle) score += 4;
  if (company.websiteContent) score += 6;
  if (company.websiteAbout) score += 5;
  if (company.websiteKeywords?.length) score += 5;

  // Instagram enrichment (15 pts)
  if (company.instagramFollowers) score += 5;
  if (company.instagramBio) score += 5;
  if (company.instagramProfilePic) score += 5;

  // AI briefing (20 pts)
  if (company.structuredBriefing) score += 8;
  if (company.description) score += 6;
  if (company.tagline) score += 6;

  // E-commerce (10 pts)
  if (company.ecommerceProductCount) score += 5;
  if (company.ecommerceCategories?.length) score += 5;

  return Math.min(score, 100);
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Full enrichment pipeline — runs all enrichment steps sequentially.
 * Designed to be called async (via setImmediate) after onboarding.
 */
export async function fullEnrichmentPipeline(companyId: number): Promise<void> {
  console.log(`[CompanyEnrich:Pipeline] Starting full enrichment for company ${companyId}...`);

  try {
    const company = await storage.getCompany(companyId);
    if (!company) {
      console.log(`[CompanyEnrich:Pipeline] Company ${companyId} not found, aborting`);
      return;
    }

    // Step 1: CNPJ enrichment
    if (company.cnpj) {
      try {
        await enrichCompanyCnpj(companyId, company.cnpj);
      } catch (e) {
        console.error(`[CompanyEnrich:Pipeline] CNPJ step failed:`, e);
      }
      await delay(3000);
    }

    // Step 2: Website enrichment
    if (company.website) {
      try {
        await enrichCompanyWebsite(companyId, company.website);
      } catch (e) {
        console.error(`[CompanyEnrich:Pipeline] Website step failed:`, e);
      }
      await delay(3000);
    }

    // Step 3: Instagram enrichment
    if (company.instagram) {
      try {
        await enrichCompanyInstagram(companyId, company.instagram);
      } catch (e) {
        console.error(`[CompanyEnrich:Pipeline] Instagram step failed:`, e);
      }
      await delay(2000);
    }

    // Step 4: Regenerate AI briefing with all collected data
    try {
      await regenerateStructuredBriefing(companyId);
    } catch (e) {
      console.error(`[CompanyEnrich:Pipeline] Briefing step failed:`, e);
    }

    // Step 5: Calculate enrichment score and update lastEnrichedAt
    const enrichedCompany = await storage.getCompany(companyId);
    if (enrichedCompany) {
      const score = calculateEnrichmentScore(enrichedCompany);
      await db.update(companies).set({
        enrichmentScore: score,
        lastEnrichedAt: new Date(),
      }).where(eq(companies.id, companyId));

      console.log(`[CompanyEnrich:Pipeline] Completed for company ${companyId} — score: ${score}/100`);
    }
  } catch (error) {
    console.error(`[CompanyEnrich:Pipeline] Fatal error for company ${companyId}:`, error);
  }
}
