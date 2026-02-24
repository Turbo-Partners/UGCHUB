# CreatorConnect — Roadmap Q1-Q2 2026

> **Versao**: 3.0
> **Data**: 24 de Fevereiro de 2026
> **Horizonte**: Fev 11 – Mai 19, 2026 (14 sprints semanais)
> **Cadencia**: Sprints semanais
> **Base**: [Estrategia de Produto](./product-strategy.md) + [Analise Competitiva](./competitor-analysis.md)
> **Prioridades**: 1) Estabilizar + Analytics → 2) IA + Automacoes Competitivas → 3) Growth Multi-plataforma

---

## Estado Atual (atualizado 2026-02-24)

Resumo das funcionalidades ja implementadas na plataforma:

| Area | O que ja funciona |
|------|-------------------|
| **Infra** | Express + TypeScript, PostgreSQL/Drizzle, WebSocket, cron jobs, Object Storage (GCS), SendGrid, Apify |
| **Auth** | Email/senha, Google OAuth, recuperacao de senha, sessoes persistentes, roles (creator/company/admin), multi-workspace com convites e permissoes |
| **Campanhas** | CRUD completo, status flow (draft→completed), visibilidade (public/private/community), budget, deliverables, tags, candidaturas com status flow, convites diretos |
| **Comunidades** | Memberships (invited→active→archived), landing pages (/m/:slug), campanhas exclusivas, Brand Hub para creators, eventos de comunidade |
| **Gamificacao** | Points ledger, regras configuraveis por marca, tiers com promocao automatica, leaderboards por marca/periodo, campaign prizes (ranking/milestone), reward entitlements |
| **Mensagens** | Chat por candidatura, DMs, brand conversations, WebSocket real-time, email consolidado |
| **Instagram — OAuth** | Business Login, OAuth flow, multiplas contas, refresh de tokens |
| **Instagram — Dados** | Sync de perfil, metricas (followers, follows, media_count), posts recentes |
| **Instagram — Webhooks** | Mencoes, comentarios, DMs, logging |
| **Instagram — DMs** | Enviar DM via API, rate limit 200/h, sync progressivo, templates |
| **Instagram — Hashtags** | Busca via Graph API, posts top/recentes, vincular a campanhas, limite 30/semana, grid, stats |
| **Instagram — Comentarios** | Listar, responder, ocultar/mostrar, excluir, analise de sentimento (OpenAI), filtros, badges |
| **Instagram — Publishing** | Imagem, carrossel, Reels, Stories, composer com preview, cota 25/24h |
| **Instagram — Partnership Ads** | Solicitacao, status, gerenciar parceiros, criar anuncios, metricas, OAuth one-click, convites por link |
| **Instagram — CRM Social** | Contatos por empresa, metricas de interacao, tags, scoring, historico, auto-populado |
| **Automacoes** | Engine trigger→action, triggers (mention, comment, dm_keyword, new_follower), actions (send_dm, notify_team, add_tag), filtros, logs |
| **Financeiro** | Cupons por campanha, atribuicao a creator, tracking de uso, registro de vendas, calculo de comissoes (schemas prontos) |
| **Academy** | Cursos (course→modules→lessons), progresso do creator, swipe file com collections |
| **SEO/Marketing** | Meta tags dinamicas, Open Graph, Schema.org, robots.txt otimizado, blog, cases de sucesso, landing pages, FAQPageSchema, bots de IA permitidos |
| **Brand Canvas V2** | Pipeline IA (Gemini + Claude) para visual identity, voice, content strategy; grid dashboard; refresh mensal automatico |
| **Admin** | Metricas da plataforma, gestao de usuarios, preview de emails, Ops Hub (tasks, status tracking) |

---

## Visao Q1-Q2 2026

Tres objetivos macro que guiam os proximos 3.5 meses, agora informados pela [analise competitiva](./competitor-analysis.md):

1. **Estabilizar e medir** (S01-S04) — Corrigir bugs, fortalecer a base de codigo e entregar dashboards de analytics para empresas e creators.
2. **IA + Automacoes Competitivas** (S05-S09) — Fechar gaps criticos de IA (Smart Match, Content Review), expandir automacoes, lancar roteiros IA e integrar e-commerce brasileiro.
3. **Growth Multi-plataforma** (S10-S14) — TikTok com Spark Ads, revenue attribution, PWA mobile para creators.

---

## Sprints Semanais

### Fase 1: Estabilizar + Analytics (S01–S04)

---

#### S01 · Fev 11–17 · Saude do Codigo ✅

- [x] Corrigir erros TypeScript criticos (233 erros → 0)
- [x] Revisar e corrigir types em `shared/schema.ts` (8 tipos frontend-only adicionados: `EcommerceIntegration`, `BrandScoringDefaults`, `UgcAsset`, etc.)
- [ ] Adicionar rate limiting nos endpoints principais (`express-rate-limit`) — movido para S02
- [x] Cleanup de dependencias mortas e migracao `server/replit_integrations/` → `server/lib/`
- [x] Brand Canvas V2: rebuild completo com pipeline IA, 25 testes, 9 endpoints

**Entregavel**: Build limpo sem erros de tipo; Brand Canvas V2 entregue; legacy Replit removido.

---

#### S02 · Fev 18–24 · Bug Fixes e Performance

- [ ] Levantar e corrigir bugs reportados na plataforma (lista priorizada)
- [ ] Melhorias de performance: lazy loading de rotas, code splitting por role
- [ ] Adicionar testes para fluxos criticos: auth (login, registro, OAuth), criacao de campanha, candidatura
- [ ] Revisar e melhorar error handling nos endpoints mais usados

**Entregavel**: Principais bugs corrigidos; cobertura de testes nos fluxos core; carregamento inicial mais rapido.

---

#### S03 · Fev 25–Mar 3 · Analytics Company

- [ ] Dashboard de analytics para empresas: metricas agregadas de campanhas (total de aplicacoes, taxa de aprovacao, entregas concluidas)
- [ ] Graficos de crescimento: aplicacoes ao longo do tempo, entregas por semana, engajamento
- [ ] Filtros por periodo (7d, 30d, 90d, custom) e por campanha
- [ ] Cards de KPIs: campanhas ativas, creators na comunidade, deliverables pendentes

**Entregavel**: Pagina `/company/analytics` funcional com dados reais.

---

#### S04 · Mar 4–10 · Analytics Creator + Relatorios

- [ ] Dashboard de analytics para creators: campanhas participadas, entregas, taxa de aprovacao
- [ ] Score de performance por creator (baseado em entregas no prazo, qualidade, engajamento)
- [ ] Historico de participacao em campanhas e comunidades
- [ ] Export basico de relatorios (PDF e CSV) para empresas

**Entregavel**: Pagina `/creator/analytics`; export funcional para empresas.

---

### Fase 2: IA + Automacoes Competitivas (S05–S09)

> **Contexto**: a [analise competitiva](./competitor-analysis.md) revelou que BrandLovers, Squid e Superfiliate tem AI Matching e AI Content Review. Esses sao os gaps mais criticos a fechar. Esta fase foi reestruturada para priorizar IA competitiva e integracoes de e-commerce brasileiro.

---

#### S05 · Mar 11–17 · Automacoes Completas

> Compressao de S05+S06 do roadmap v2.0 em uma unica sprint.

- [ ] Novos triggers: nova candidatura recebida, entrega aprovada, creator sobe de tier
- [ ] Novas actions: enviar email (SendGrid), webhook externo, auto-aprovar candidatura, promover tier
- [ ] Condicoes avancadas no engine (if/else — ex: "se creator tem +10k followers")
- [ ] Delay entre acoes (ex: "esperar 24h antes de enviar DM")
- [ ] Templates pre-configurados: auto-DM para quem menciona, auto-approve +10k followers
- [ ] Testes automatizados para o engine de automacao

**Entregavel**: Engine de automacao expandido com 3+ novos triggers, 4+ novas actions, condicoes, delays e templates.

---

#### S06 · Mar 18–24 · AI Smart Match

> **Gap competitivo #1** — Superfiliate, BrandLovers, Squid e Billo ja tem matching com IA.

- [ ] Modelo de scoring creator↔campanha usando dados existentes (historico de entregas, engagement, nicho, plataformas, localizacao)
- [ ] Algoritmo de ranking: ordenar creators por fit com cada campanha
- [ ] UI no fluxo de campanha: sugestoes de creators com score e justificativa
- [ ] UI no fluxo de creator: campanhas recomendadas com score
- [ ] Feedback loop: marca aprova/rejeita sugestoes para melhorar o modelo
- [ ] Testes automatizados para o algoritmo de matching

**Entregavel**: Feature "AI Smart Match" funcional — empresa vê creators recomendados ao criar campanha; creator vê campanhas recomendadas no feed.

---

#### S07 · Mar 25–31 · AI Content Review

> **Gap competitivo #2** — BrandLovers (GuardIAn), SHOUT e Billo ja tem revisao de conteudo com IA.

- [ ] Pipeline de revisao: deliverable submetido → analise automatica via Claude/OpenAI
- [ ] Verificacoes: conformidade com briefing, brand guidelines (Brand Canvas), qualidade tecnica (resolucao, duracao, formato)
- [ ] Score de conformidade (0-100) com detalhamento por criterio
- [ ] UI no workflow de aprovacao: badge de AI review, detalhes expandiveis, override manual
- [ ] Sugestoes de melhoria automaticas para o creator quando score < threshold
- [ ] Testes automatizados para o pipeline de review

**Entregavel**: Feature "AI Content Review" funcional — deliverables recebem avaliacao automatica; empresa vê score e detalhes antes de aprovar.

---

#### S08 · Abr 1–7 · Roteiros IA (MVP)

> Mantido do v2.0, comprimido de 2 sprints para 1 (MVP sem expansao).

- [ ] Input: briefing da campanha + tom de voz (Brand Canvas) + duracao + plataforma destino
- [ ] Geracao de roteiro via Claude/OpenAI com prompt estruturado e templates (problema→solucao→CTA, unboxing, tutorial, testimonial)
- [ ] Interface de edicao e refinamento (chat com IA para ajustar)
- [ ] Salvar roteiros vinculados a campanhas e deliverables
- [ ] Gerar multiplas variacoes a partir do mesmo briefing

**Entregavel**: Feature `/scripts/generate` funcional — roteiros de video gerados a partir de briefings com templates e variacoes.

---

#### S09 · Abr 8–14 · E-commerce Brasil (Yampi/Nuvemshop)

> **Gap competitivo** — Inbazz ja integra com Yampi. Essencial para competir no mercado brasileiro de e-commerce.

- [ ] Integracao Yampi: OAuth/API key, sync de pedidos, atribuicao por cupom
- [ ] Integracao Nuvemshop: OAuth, sync de pedidos, atribuicao por cupom
- [ ] Webhook generico para receber eventos de venda de outras plataformas
- [ ] Ativar tracking de cupons existente (schemas ja prontos em `billing`)
- [ ] Notificacao para creator quando uma venda e atribuida
- [ ] Dashboard basico de vendas por campanha

**Entregavel**: Yampi e/ou Nuvemshop conectados; vendas trackadas por cupom; creators notificados.

---

### Fase 3: Growth Multi-plataforma (S10–S14)

> **Contexto**: com IA e e-commerce entregues, foco em expandir plataformas (TikTok), provar ROI (revenue attribution) e aumentar engajamento mobile (PWA).

---

#### S10 · Abr 15–21 · TikTok Base

> Mantido do v2.0.

- [ ] Expandir OAuth TikTok existente com sync completo de perfil e metricas (followers, likes, total de videos)
- [ ] Enrichment pipeline para TikTok (similar ao Instagram)
- [ ] Sync de posts/videos TikTok (ultimos N videos, metricas por video)
- [ ] Metricas combinadas Instagram + TikTok nos perfis de creator

**Entregavel**: Creators podem conectar TikTok e ver metricas completas no perfil; dados sincronizados.

---

#### S11 · Abr 22–28 · TikTok Discovery + Spark Ads

> Expandido do v2.0 com Spark Ads (gap competitivo — Insense, Billo e Superfiliate ja tem).

- [ ] Integrar TikTok na Creator Discovery (buscar creators por metricas TikTok)
- [ ] Badge de plataformas conectadas no card do creator
- [ ] TikTok Spark Ads: creator gera codigo de autorizacao, marca usa para boostar conteudo
- [ ] UI para gerenciar codigos Spark Ads por campanha/deliverable
- [ ] Analytics de Spark Ads (impressoes, cliques, conversoes via TikTok API)

**Entregavel**: Discovery multi-plataforma; Spark Ads funcional com gerenciamento de codigos.

---

#### S12 · Abr 29–Mai 5 · Revenue Attribution + Sales Dashboard

> **Gap competitivo** — Superfiliate, Billo e Push Lap tem revenue attribution. Essencial para provar ROI e reter clientes.

- [ ] Pipeline de atribuicao: venda → cupom → creator → campanha
- [ ] Dashboard de vendas em tempo real: receita por campanha, por creator, por periodo
- [ ] Calculo automatico de comissoes (ativar schemas existentes em `billing`)
- [ ] Metricas de ROI: custo por aquisicao, ROAS por creator, ticket medio
- [ ] Export de relatorio de vendas (CSV/PDF)

**Entregavel**: Dashboard `/company/brand/:brandId/sales` funcional; ROI visivel por campanha e por creator.

---

#### S13 · Mai 6–12 · PWA Mobile para Creators

> **Gap competitivo** — 5/11 concorrentes tem app mobile (BrandLovers, Inbazz, Squid, Billo, Insense). Essencial para engajamento no Brasil.

- [ ] Configurar PWA: manifest.json, service worker, icones, splash screen
- [ ] Layout responsivo otimizado para mobile (bottom nav, gestos, touch targets)
- [ ] Notificacoes push via Web Push API
- [ ] Offline-first para paginas criticas (home, campanhas, mensagens)
- [ ] Prompt de instalacao (Add to Home Screen)
- [ ] Testes em Android (Chrome) e iOS (Safari)

**Entregavel**: Creators podem instalar CreatorConnect como app no celular; notificacoes push funcionais.

---

#### S14 · Mai 13–19 · Buffer / Polish

> Sprint de respiro para tech debt, bugs acumulados e melhorias de qualidade.

- [ ] Corrigir bugs acumulados durante S05-S13
- [ ] Performance: otimizar queries lentas, revisar N+1, adicionar indices
- [ ] Tech debt: refatorar trechos criticos identificados durante o trimestre
- [ ] Melhorias de UX baseadas em feedback de usuarios
- [ ] Testes: aumentar cobertura nos fluxos novos (Smart Match, Content Review, E-commerce)
- [ ] Documentacao: atualizar CLAUDE.md, ROADMAP, CHANGELOG

**Entregavel**: Plataforma estavel e polida; divida tecnica reduzida; pronta para proxima fase de growth.

---

## Backlog Futuro

Itens mapeados para alem deste roadmap, priorizados pela analise competitiva:

### Prioridade Alta (proximo ciclo)

| Item | Referencia Competitiva | Descricao |
|------|----------------------|-----------|
| Roteiros IA Expansao | — | Templates avancados, historico, vinculacao a deliverables (era S08 do v2.0) |
| Shopify Integration | Superfiliate, Insense, Push Lap | OAuth, sync de pedidos, atribuicao por cupom |
| Wallet + PIX | BrandLovers (CreatorPay) | Saldo, saques via PIX, aprovacao, comprovantes |
| AI Brief Builder | SHOUT | IA que cria briefings otimizados a partir de objetivos |

### Prioridade Media

| Item | Referencia Competitiva | Descricao |
|------|----------------------|-----------|
| Co-branded Landing Pages | Superfiliate (feature unica) | Cada creator recebe landing page personalizada |
| AI Communication Agent | BrandLovers (Whisper) | Agente IA para comunicacao operacional com creators |
| TikTok Shop Integration | Superfiliate, Insense, BMC | Social commerce via TikTok |
| Earned Media Value | Superfiliate, Squid | Metrica de valor de midia conquistada |
| Fraud Protection | Superfiliate, Push Lap | Protecao contra fraude em affiliate/comissoes |

### Prioridade Baixa (longo prazo)

| Item | Referencia Competitiva | Descricao |
|------|----------------------|-----------|
| White-label para agencias | Push Lap Growth | Plataforma personalizada para agencias |
| SSO enterprise | — | Single sign-on para grandes corporacoes |
| YouTube / Twitter / LinkedIn APIs | Squid (multi-rede) | Integracao com outras redes sociais |
| CRM externo (HubSpot, RD Station) | — | Sync de contatos e metricas com CRMs |
| Multi-idioma (EN/ES) | — | Suporte a ingles e espanhol |
| AI Mashups | — | Combinar clips de diferentes creators, variacoes automaticas |
| Editor de video/anuncios | Billo (Expert Editing) | Cortar clips, legendas automaticas, templates |
| Verificacao de email + 2FA | — | Seguranca avancada de conta |
| Quick Jobs | — | Briefing rapido + match automatico + pagamento instantaneo |

### Removido do roadmap ativo → backlog

| Item | Era | Motivo |
|------|-----|--------|
| Roteiros IA Expansao | S08 v2.0 | MVP fica em S08, expansao vai para proximo ciclo |
| Brand Kit MVP | S11 v2.0 | Brand Canvas V2 ja cobre identidade visual — brand kit e incremental |
| Shopify (como primeira integracao) | S12 v2.0 | Brasil usa mais Yampi/Nuvemshop — Shopify vem depois |

---

## Resumo das Mudancas v2.0 → v3.0

| Aspecto | v2.0 | v3.0 |
|---------|------|------|
| **Sprints** | 12 (Fev 11 – Mai 5) | 14 (Fev 11 – Mai 19) |
| **Fase 1** | S01-S04 (sem mudanca) | S01-S04 (sem mudanca) |
| **Fase 2** | S05-S08 (Automacoes + Roteiros IA) | S05-S09 (Automacoes + **AI Smart Match** + **AI Content Review** + Roteiros IA + **E-commerce BR**) |
| **Fase 3** | S09-S12 (TikTok + Brand Kit + Shopify) | S10-S14 (TikTok + **Spark Ads** + **Revenue Attribution** + **PWA Mobile** + Buffer) |
| **IA features** | 1 (Roteiros) | 4 (Smart Match, Content Review, Roteiros, Brand Canvas) |
| **Base competitiva** | Sem analise | [11 concorrentes analisados](./competitor-analysis.md) |
| **Estrategia** | — | [Product Strategy v1.0](./product-strategy.md) |

---

## Convencoes e Notas

- **Checkboxes** (`[ ]`) representam entregas da sprint. Marcar `[x]` ao concluir.
- **Entregavel** no final de cada sprint define o criterio de "done".
- Sprints podem ser ajustadas com base em feedback e descobertas tecnicas — repriorizar e esperado.
- Bugs criticos descobertos durante o trimestre entram como prioridade na sprint corrente.
- Este documento e atualizado semanalmente no fechamento de cada sprint.
- Schema changes: editar `shared/schema.ts` → `npm run db:push`.
- Testes: `npm run test` antes de fechar qualquer sprint.
