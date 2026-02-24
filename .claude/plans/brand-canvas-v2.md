# Brand Canvas V2 - Referência Técnica

## Resumo

Reconstrução completa do Brand Canvas com modelo de dados expandido, pipeline IA automatizado (Gemini + Claude), dashboard grid de cards com sheets laterais, e auto-aplicação.

**Data**: 2026-02-16
**Status**: Implementado

---

## Arquivos Criados/Modificados

### Criados
| Arquivo | Descrição |
|---------|-----------|
| `server/services/brand-canvas.ts` | Pipeline IA (~450 linhas): 6 steps, merge inteligente, migração V1→V2 |
| `server/jobs/brandCanvasRefreshJob.ts` | Cron mensal (1o domingo, 4h BRT), re-processa canvas > 30 dias |
| `server/__tests__/brand-canvas.test.ts` | 14 testes: migração, score, merge, Zod |
| `client/src/components/brand-canvas/SectionCard.tsx` | Card wrapper com título, ícone, completion %, badge IA |
| `client/src/components/brand-canvas/ColorSwatch.tsx` | Swatch interativo + ColorPalette |
| `client/src/components/brand-canvas/FieldWithAI.tsx` | Campo com badge "Sugestão IA" |
| `client/src/components/brand-canvas/AIBadge.tsx` | Badge violet "Sugestão IA" |
| `client/src/components/brand-canvas/BrandCanvasHeader.tsx` | Progress ring, botões gerar/aplicar |
| `client/src/components/brand-canvas/BrandCanvasAIPanel.tsx` | Sheet lateral com steps do pipeline |
| `client/src/components/brand-canvas/BrandCanvasVisualIdentity.tsx` | Editor de cores, logo, estética, tipografia |
| `client/src/components/brand-canvas/BrandCanvasVoice.tsx` | Tom, traits, do/dont, exemplos |
| `client/src/components/brand-canvas/BrandCanvasProducts.tsx` | Grid de produtos editáveis |
| `client/src/components/brand-canvas/BrandCanvasAudience.tsx` | Público-alvo + personas |
| `client/src/components/brand-canvas/BrandCanvasContent.tsx` | Tipos, ganchos, CTAs, hashtags |
| `client/src/components/brand-canvas/BrandCanvasReferences.tsx` | Competitors, URLs, ativos |

### Modificados
| Arquivo | Mudança |
|---------|---------|
| `shared/schema.ts` | +15 interfaces V2, +15 Zod schemas, +3 WebSocket events, BrandCanvas = BrandCanvasV2 |
| `shared/constants.ts` | +7 novos arrays de opções (aesthetic, language, emoji, font, personality) |
| `server/lib/gemini.ts` | +sendGeminiMultimodal() para análise de imagens |
| `server/routes/brand-canvas.routes.ts` | 2→7 endpoints (GET, PUT, generate, status, generate-section, apply, accept-suggestions) |
| `server/index.ts` | +registro do brandCanvasRefreshJob |
| `client/src/pages/company/brand-canvas.tsx` | Reescrita total: grid cards + sheets + WebSocket |

---

## Modelo de Dados V2

```
BrandCanvasV2 {
  // Identidade
  aboutBrand, whatWeDo, differentials

  // Visual (NOVO)
  visualIdentity: { colors: ColorPalette, typography, logoUrl, logoAnalysis, visualAesthetic, moodKeywords }

  // Voz (NOVO - antes era flat)
  voice: { toneType, toneDescription, personalityTraits, languageStyle, keywords, doList, dontList, exampleCaptions, emojiUsage }

  // Produtos (expandido)
  products: [{ name, description, benefits, valueProposition, priceRange, imageUrl, category }]

  // Público
  targetAudience, personas: [{ id, name, ageRange, gender, location, interests, painPoints, desires, blockers }]

  // Estratégia (NOVO - antes era flat)
  contentStrategy: { idealContentTypes, hooks, keyMessages, callToAction, avoidTopics, hashtagStrategy }

  // Referências (NOVO - antes era flat)
  references: { referenceCreators, competitorBrands, referenceUrls, brandAssets }

  // Pipeline (NOVO)
  processing: { version:2, status, currentStep, steps[], aiConfidenceScore, dataSources, lastProcessedAt, history[] }

  // V1 compat (mantido para migração lazy)
  brandVoice, doList, dontList, idealContentTypes, hooks, etc.
}
```

---

## Pipeline IA (6 Steps)

| Step | Engine | Fonte | Saída |
|------|--------|-------|-------|
| 1. CNPJ | ReceitaWS | company.cnpj | Dados formais |
| 2. Website | Apify + Gemini Flash | company.website | about, products, audience |
| 3. Visual | Gemini Flash Vision | logo/profilePic | colors, aesthetic, mood |
| 4. Social | Business Discovery | company.instagram | métricas, bio |
| 5. Voice | Claude Sonnet | textos coletados | tone, traits, do/dont, exemplos |
| 6. Síntese | Claude Sonnet | tudo acumulado | contentStrategy, personas, score |

**Merge**: Nunca sobrescreve dados manuais. Só preenche campos vazios.

---

## Endpoints API

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/api/companies/:id/brand-canvas` | Retorna canvas V2 (migra lazy) |
| PUT | `/api/companies/:id/brand-canvas` | Salva canvas, sync structuredBriefing |
| POST | `/api/companies/:id/brand-canvas/generate` | Inicia pipeline IA async (202) |
| GET | `/api/companies/:id/brand-canvas/status` | Status do pipeline |
| POST | `/api/companies/:id/brand-canvas/generate-section` | Regenera 1 seção |
| POST | `/api/companies/:id/brand-canvas/apply` | Aplica canvas → brandSettings/company |
| POST | `/api/companies/:id/brand-canvas/accept-suggestions` | Aceita sugestões por campo |

---

## WebSocket Events

- `brand_canvas:processing` — progresso step-by-step
- `brand_canvas:completed` — pipeline concluído com confidence score
- `brand_canvas:failed` — erro no pipeline

---

## Frontend UX

- **Página única** com grid de 7 cards (3 colunas desktop, 1 mobile)
- Click no card abre **Sheet lateral** para edição
- **Header** com progress ring, botão "Gerar com IA", "Aplicar"
- **AI Panel** (sheet) mostra steps do pipeline em tempo real
- Badges "Sugestão IA" em campos preenchidos pela IA
- **Save bar** sticky no bottom quando há alterações não salvas
- **Polling** + WebSocket para acompanhar progresso do pipeline
