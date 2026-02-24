import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Sparkles,
  FileText,
  Instagram,
  Briefcase,
  Target,
  Shield,
  Users,
  MessageSquare,
  Check,
  X,
  Video,
  Ban,
  Package,
  Megaphone,
  Palette,
  Image,
  ShoppingBag,
  Tag,
  HelpCircle,
} from 'lucide-react';
import { BRAND_VOICE_OPTIONS, IDEAL_CONTENT_TYPES } from '@shared/constants';
import type { CompanyProfile } from './types';

interface AboutCompanySectionProps {
  company: CompanyProfile;
}

export function AboutCompanySection({ company }: AboutCompanySectionProps) {
  const sb = company.structuredBriefing;
  const bc = company.brandCanvas;
  const hasCanvas = bc && (bc.aboutBrand || bc.whatWeDo || bc.products?.length || bc.personas?.length || bc.voice?.toneType || bc.brandVoice || bc.voice?.doList?.length || bc.doList?.length || bc.voice?.dontList?.length || bc.dontList?.length || bc.contentStrategy?.hooks?.length || bc.hooks?.length || bc.contentStrategy?.keyMessages?.length || bc.keyMessages?.length);
  const hasStructured = sb && (sb.whatWeDo || sb.targetAudience || sb.differentials || sb.brandVoice || sb.idealContentTypes?.length || sb.avoidTopics);
  const hasEnrichment = company.companyBriefing || company.description ||
    company.websiteDescription || company.websiteAbout ||
    company.aiContextSummary || company.instagramBio ||
    (company.brandColors && company.brandColors.length > 0) ||
    (company.websiteProducts && company.websiteProducts.length > 0) ||
    company.websiteSocialLinks ||
    company.websiteKeywords || company.websiteFaq ||
    company.ecommercePlatform;

  if (!hasCanvas && !hasStructured && !hasEnrichment) return null;

  const aboutBrandText = bc?.aboutBrand || null;
  const enrichmentDesc = sb?.whatWeDo || company.websiteAbout || company.websiteDescription || company.companyBriefing || null;
  const whatWeDoText = bc?.whatWeDo && bc.whatWeDo !== bc?.aboutBrand ? bc.whatWeDo : (!bc?.aboutBrand && sb?.whatWeDo ? null : (sb?.whatWeDo && sb.whatWeDo !== enrichmentDesc ? sb.whatWeDo : null));
  const targetAudience = bc?.targetAudience || sb?.targetAudience || null;
  const differentials = bc?.differentials || sb?.differentials || null;
  const brandVoiceRaw = bc?.voice?.toneType || bc?.brandVoice || sb?.brandVoice || null;
  const brandVoiceLabel = brandVoiceRaw
    ? BRAND_VOICE_OPTIONS.find(o => o.value === brandVoiceRaw)?.label || brandVoiceRaw
    : null;
  const brandVoiceDesc = bc?.voice?.toneDescription || bc?.brandVoiceDescription || null;
  const doList = bc?.voice?.doList || bc?.doList || null;
  const dontList = bc?.voice?.dontList || bc?.dontList || null;
  const idealContentTypes = bc?.contentStrategy?.idealContentTypes || bc?.idealContentTypes || sb?.idealContentTypes || null;
  const avoidTopics = bc?.contentStrategy?.avoidTopics || bc?.avoidTopics || sb?.avoidTopics || null;

  return (
    <div className="space-y-5">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        Sobre a Empresa
      </h3>

      {aboutBrandText && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-200/30 dark:border-amber-800/30">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/15 to-orange-500/15 shrink-0 mt-0.5">
              <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-foreground mb-1">Sobre a Marca</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{aboutBrandText}</p>
            </div>
          </div>
        </div>
      )}

      {!aboutBrandText && enrichmentDesc && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-200/30 dark:border-amber-800/30">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/15 to-orange-500/15 shrink-0 mt-0.5">
              <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-foreground mb-1">Sobre a Marca</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{enrichmentDesc}</p>
            </div>
          </div>
        </div>
      )}

      {company.instagramBio && company.instagramBio !== aboutBrandText && company.instagramBio !== enrichmentDesc && (
        <div className="p-3 rounded-lg bg-gradient-to-r from-pink-500/5 to-purple-500/5 border border-pink-200/20">
          <div className="flex items-center gap-2 mb-1">
            <Instagram className="h-3.5 w-3.5 text-pink-500" />
            <span className="text-xs font-medium text-pink-600">Instagram</span>
          </div>
          <p className="text-sm text-muted-foreground">{company.instagramBio}</p>
        </div>
      )}

      {whatWeDoText && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/5 to-blue-500/5 border border-indigo-200/30 dark:border-indigo-800/30">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/15 to-blue-500/15 shrink-0 mt-0.5">
              <Briefcase className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-foreground mb-1">O que Fazemos</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{whatWeDoText}</p>
            </div>
          </div>
        </div>
      )}

      {(targetAudience || differentials) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {targetAudience && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-200/30 dark:border-blue-800/30">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/15 to-cyan-500/15 shrink-0 mt-0.5">
                  <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground mb-1">Público-Alvo</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{targetAudience}</p>
                </div>
              </div>
            </div>
          )}
          {differentials && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/5 to-green-500/5 border border-emerald-200/30 dark:border-emerald-800/30">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/15 to-green-500/15 shrink-0 mt-0.5">
                  <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground mb-1">Diferenciais</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{differentials}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {bc?.personas && bc.personas.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4 text-muted-foreground" />
            Personas
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {bc.personas.map((persona, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-muted/40 border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  {persona.name && <span className="text-sm font-medium">{persona.name}</span>}
                  {persona.ageRange && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{persona.ageRange}</Badge>
                  )}
                </div>
                {persona.desires && persona.desires.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {persona.desires.slice(0, 4).map((desire: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">{desire}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(brandVoiceLabel || brandVoiceDesc || (doList && doList.length > 0) || (dontList && dontList.length > 0)) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            Tom & Estilo
          </div>
          {(brandVoiceLabel || brandVoiceDesc) && (
            <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-200/20 dark:border-violet-800/20">
              {brandVoiceLabel && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-200/30 dark:border-violet-800/30 mb-2">
                  <MessageSquare className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                  <span className="text-xs font-medium text-violet-700 dark:text-violet-300">Tom: {brandVoiceLabel}</span>
                </div>
              )}
              {brandVoiceDesc && (
                <p className="text-sm text-muted-foreground leading-relaxed">{brandVoiceDesc}</p>
              )}
            </div>
          )}
          {((doList && doList.length > 0) || (dontList && dontList.length > 0)) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {doList && doList.length > 0 && (
                <div className="space-y-1.5">
                  {doList.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              )}
              {dontList && dontList.length > 0 && (
                <div className="space-y-1.5">
                  {dontList.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {idealContentTypes && idealContentTypes.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {idealContentTypes.map(ct => {
            const label = IDEAL_CONTENT_TYPES.find(o => o.value === ct)?.label || ct;
            return (
              <div key={ct} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-200/30 dark:border-pink-800/30">
                <Video className="h-3.5 w-3.5 text-pink-600 dark:text-pink-400" />
                <span className="text-xs font-medium text-pink-700 dark:text-pink-300">{label}</span>
              </div>
            );
          })}
        </div>
      )}

      {avoidTopics && (
        <div className="p-3 rounded-lg bg-red-500/5 border border-red-200/20 dark:border-red-800/20 flex items-start gap-2.5">
          <Ban className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">Evitar</span>
            <p className="text-sm text-muted-foreground mt-0.5">{avoidTopics}</p>
          </div>
        </div>
      )}

      {bc?.products && bc.products.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Package className="h-4 w-4 text-muted-foreground" />
            Produtos
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {bc.products.map((product, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-muted/40 border border-border/50">
                <h5 className="text-sm font-medium mb-1">{product.name}</h5>
                {product.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{product.description}</p>
                )}
                {product.benefits && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{product.benefits}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(() => {
        const hooks = bc?.contentStrategy?.hooks || bc?.hooks || [];
        const keyMessages = bc?.contentStrategy?.keyMessages || bc?.keyMessages || [];
        const callToAction = bc?.contentStrategy?.callToAction || bc?.callToAction;
        if (hooks.length === 0 && keyMessages.length === 0) return null;
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Megaphone className="h-4 w-4 text-muted-foreground" />
              Ganchos & Mensagens
            </div>
            {hooks.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ganchos</span>
                <div className="flex flex-wrap gap-1.5">
                  {hooks.map((hook, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs font-normal">{hook}</Badge>
                  ))}
                </div>
              </div>
            )}
            {keyMessages.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mensagens-chave</span>
                <div className="flex flex-wrap gap-1.5">
                  {keyMessages.map((msg, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs font-normal">{msg}</Badge>
                  ))}
                </div>
              </div>
            )}
            {callToAction && (
              <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                <span className="text-xs font-medium text-primary">CTA: </span>
                <span className="text-sm text-muted-foreground">{callToAction}</span>
              </div>
            )}
          </div>
        );
      })()}

      {((company.brandColors && company.brandColors.length > 0) || company.brandLogo) && (
        <div className="p-4 rounded-xl bg-muted/30 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Palette className="h-4 w-4 text-muted-foreground" />
            Identidade Visual
          </div>
          <div className="flex items-center gap-4">
            {company.brandColors && company.brandColors.length > 0 && (
              <div className="flex items-center gap-2">
                {company.brandColors.slice(0, 6).map((color, idx) => (
                  <div
                    key={idx}
                    className="w-8 h-8 rounded-full ring-2 ring-background shadow-sm"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            )}
            {company.brandLogo && (
              <div className="bg-background rounded-lg p-2 inline-block shadow-sm">
                <img src={company.brandLogo} alt="Logo" className="h-8 max-w-[120px] object-contain" />
              </div>
            )}
          </div>
        </div>
      )}

      {((bc?.references?.brandAssets || bc?.brandAssets)?.filter(a => a.type === 'image')?.length ?? 0) > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Image className="h-4 w-4 text-muted-foreground" />
            Referências Visuais
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {(bc!.references?.brandAssets || bc!.brandAssets || []).filter(a => a.type === 'image').slice(0, 6).map((asset, idx) => (
              <img
                key={idx}
                src={asset.url}
                alt={`Referência ${idx + 1}`}
                className="h-20 w-20 rounded-lg object-cover ring-1 ring-border shrink-0"
              />
            ))}
          </div>
        </div>
      )}

      {((company.websiteProducts && company.websiteProducts.length > 0) || company.ecommercePlatform) && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            Produtos/Serviços
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {company.websiteProducts && company.websiteProducts.slice(0, 10).map((product, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                <Package className="h-3 w-3 mr-1" />
                {product}
              </Badge>
            ))}
          </div>
          {company.ecommercePlatform && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span>Plataforma: <strong>{company.ecommercePlatform}</strong></span>
              {company.ecommerceProductCount != null && (
                <span>{company.ecommerceProductCount} produtos</span>
              )}
            </div>
          )}
        </div>
      )}

      {company.websiteKeywords && company.websiteKeywords.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Tag className="h-4 w-4 text-muted-foreground" />
            Palavras-chave
          </div>
          <div className="flex flex-wrap gap-1.5">
            {company.websiteKeywords.slice(0, 15).map((kw, idx) => (
              <Badge key={idx} variant="outline" className="text-[11px] font-normal">
                {kw}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {company.websiteFaq && company.websiteFaq.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            Perguntas Frequentes
          </div>
          <Accordion type="single" collapsible className="w-full">
            {company.websiteFaq.map((item, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`}>
                <AccordionTrigger className="text-sm text-left">{item.question}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  );
}
