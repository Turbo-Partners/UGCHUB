# CreatorConnect — Roadmap Q1 2026

> **Versão**: 2.0
> **Data**: 11 de Fevereiro de 2026
> **Horizonte**: Fev 11 – Mai 5, 2026 (12 sprints semanais)
> **Cadência**: Sprints semanais
> **Prioridades**: 1) Estabilizar + Analytics → 2) Automações + IA → 3) Growth

---

## Estado Atual

Resumo das funcionalidades já implementadas na plataforma:

| Área | O que já funciona |
|------|-------------------|
| **Infra** | Express + TypeScript, PostgreSQL/Drizzle, WebSocket, cron jobs, Object Storage (GCS), SendGrid, Apify |
| **Auth** | Email/senha, Google OAuth, recuperação de senha, sessões persistentes, roles (creator/company/admin), multi-workspace com convites e permissões |
| **Campanhas** | CRUD completo, status flow (draft→completed), visibilidade (public/private/community), budget, deliverables, tags, candidaturas com status flow, convites diretos |
| **Comunidades** | Memberships (invited→active→archived), landing pages (/m/:slug), campanhas exclusivas, Brand Hub para creators, eventos de comunidade |
| **Gamificação** | Points ledger, regras configuráveis por marca, tiers com promoção automática, leaderboards por marca/período, campaign prizes (ranking/milestone), reward entitlements |
| **Mensagens** | Chat por candidatura, DMs, brand conversations, WebSocket real-time, email consolidado |
| **Instagram — OAuth** | Business Login, OAuth flow, múltiplas contas, refresh de tokens |
| **Instagram — Dados** | Sync de perfil, métricas (followers, follows, media_count), posts recentes |
| **Instagram — Webhooks** | Menções, comentários, DMs, logging |
| **Instagram — DMs** | Enviar DM via API, rate limit 200/h, sync progressivo, templates |
| **Instagram — Hashtags** | Busca via Graph API, posts top/recentes, vincular a campanhas, limite 30/semana, grid, stats |
| **Instagram — Comentários** | Listar, responder, ocultar/mostrar, excluir, análise de sentimento (OpenAI), filtros, badges |
| **Instagram — Publishing** | Imagem, carrossel, Reels, Stories, composer com preview, cota 25/24h |
| **Instagram — Partnership Ads** | Solicitação, status, gerenciar parceiros, criar anúncios, métricas, OAuth one-click, convites por link |
| **Instagram — CRM Social** | Contatos por empresa, métricas de interação, tags, scoring, histórico, auto-populado |
| **Automações** | Engine trigger→action, triggers (mention, comment, dm_keyword, new_follower), actions (send_dm, notify_team, add_tag), filtros, logs |
| **Financeiro** | Cupons por campanha, atribuição a creator, tracking de uso, registro de vendas, cálculo de comissões (schemas prontos) |
| **Academy** | Cursos (course→modules→lessons), progresso do creator, swipe file com collections |
| **SEO/Marketing** | Meta tags dinâmicas, Open Graph, Schema.org, robots.txt otimizado, blog, cases de sucesso, landing pages, FAQPageSchema, bots de IA permitidos |
| **Admin** | Métricas da plataforma, gestão de usuários, preview de emails, Ops Hub (tasks, status tracking) |

---

## Visão Q1 2026

Três objetivos macro que guiam os próximos 3 meses:

1. **Estabilizar e medir** — Corrigir bugs, fortalecer a base de código e entregar dashboards de analytics para empresas e creators.
2. **Automatizar e gerar** — Expandir o engine de automações com novos triggers/actions e lançar geração de roteiros com IA.
3. **Crescer plataforma** — Integrar TikTok, entregar Brand Kit e iniciar tracking de e-commerce.

---

## Sprints Semanais

### Fase 1: Estabilizar + Analytics (S01–S04)

---

#### S01 · Fev 11–17 · Saúde do Código

- [ ] Corrigir erros TypeScript críticos (content-library, storage, admin-dashboard, blog-post e demais)
- [ ] Revisar e corrigir types em `shared/schema.ts` (exports faltando: `EcommerceIntegration`, `BrandScoringDefaults`, `UgcAsset`, etc.)
- [ ] Adicionar rate limiting nos endpoints principais (`express-rate-limit`)
- [ ] Audit de dependências (`npm audit`) e atualizar pacotes com vulnerabilidades

**Entregável**: Build limpo sem erros de tipo bloqueantes; endpoints protegidos contra abuso.

---

#### S02 · Fev 18–24 · Bug Fixes e Performance

- [ ] Levantar e corrigir bugs reportados na plataforma (lista priorizada)
- [ ] Melhorias de performance: lazy loading de rotas, code splitting por role
- [ ] Adicionar testes para fluxos críticos: auth (login, registro, OAuth), criação de campanha, candidatura
- [ ] Revisar e melhorar error handling nos endpoints mais usados

**Entregável**: Principais bugs corrigidos; cobertura de testes nos fluxos core; carregamento inicial mais rápido.

---

#### S03 · Fev 25–Mar 3 · Analytics Company

- [ ] Dashboard de analytics para empresas: métricas agregadas de campanhas (total de aplicações, taxa de aprovação, entregas concluídas)
- [ ] Gráficos de crescimento: aplicações ao longo do tempo, entregas por semana, engajamento
- [ ] Filtros por período (7d, 30d, 90d, custom) e por campanha
- [ ] Cards de KPIs: campanhas ativas, creators na comunidade, deliverables pendentes

**Entregável**: Página `/company/analytics` funcional com dados reais.

---

#### S04 · Mar 4–10 · Analytics Creator + Relatórios

- [ ] Dashboard de analytics para creators: campanhas participadas, entregas, taxa de aprovação
- [ ] Score de performance por creator (baseado em entregas no prazo, qualidade, engajamento)
- [ ] Histórico de participação em campanhas e comunidades
- [ ] Export básico de relatórios (PDF e CSV) para empresas

**Entregável**: Página `/creator/analytics`; export funcional para empresas.

---

### Fase 2: Automações + IA (S05–S08)

---

#### S05 · Mar 11–17 · Novos Triggers de Automação

- [ ] Novos triggers: nova candidatura recebida, entrega aprovada, creator sobe de tier
- [ ] Condições avançadas no engine (if/else — ex: "se creator tem +10k followers")
- [ ] UI para configurar os novos triggers no painel de automações
- [ ] Testes automatizados para o engine de automação

**Entregável**: 3 novos triggers funcionais com condições configuráveis.

---

#### S06 · Mar 18–24 · Novas Actions + Templates

- [ ] Novas actions: enviar email (SendGrid), webhook externo, auto-aprovar candidatura, promover tier
- [ ] Delay entre ações (ex: "esperar 24h antes de enviar DM")
- [ ] Templates pré-configurados: auto-DM para quem menciona, auto-approve +10k followers
- [ ] Múltiplas ações encadeadas por trigger

**Entregável**: Actions expandidas; pelo menos 3 templates prontos para uso.

---

#### S07 · Mar 25–31 · Roteiros IA (MVP)

- [ ] Input: briefing da campanha + tom de voz + duração + plataforma destino
- [ ] Geração de roteiro via OpenAI (GPT-4) com prompt estruturado
- [ ] Interface de edição e refinamento (chat com IA para ajustar)
- [ ] Salvar roteiros vinculados a campanhas

**Entregável**: Feature `/scripts/generate` funcional, gerando roteiros de vídeo a partir de briefings.

---

#### S08 · Abr 1–7 · Roteiros IA (Expansão)

- [ ] Templates de roteiro: problema→solução→CTA, unboxing, tutorial, testimonial
- [ ] Gerar múltiplas variações a partir do mesmo briefing
- [ ] Vincular roteiros a deliverables específicos de campanhas
- [ ] Histórico de roteiros gerados por campanha

**Entregável**: Templates funcionais; múltiplas variações; integração com fluxo de campanhas.

---

### Fase 3: Growth (S09–S12)

---

#### S09 · Abr 8–14 · TikTok API (Base)

- [ ] OAuth TikTok (Login Kit)
- [ ] Sync de perfil e métricas básicas (followers, likes, total de vídeos)
- [ ] Tabela `tiktok_accounts` + relação com creators
- [ ] Enrichment pipeline para TikTok (similar ao Instagram)

**Entregável**: Creators podem conectar TikTok e ver métricas básicas no perfil.

---

#### S10 · Abr 15–21 · TikTok (Posts + Discovery)

- [ ] Sync de posts/vídeos TikTok (últimos N vídeos, métricas por vídeo)
- [ ] Integrar TikTok na Creator Discovery (buscar creators por métricas TikTok)
- [ ] Métricas combinadas Instagram + TikTok nos perfis de creator
- [ ] Badge de plataformas conectadas no card do creator

**Entregável**: Discovery multi-plataforma; perfis com dados Instagram + TikTok unificados.

---

#### S11 · Abr 22–28 · Brand Kit MVP

- [ ] Upload de logo (múltiplos formatos), paleta de cores, tipografia
- [ ] Guidelines de uso da marca (texto + imagens de referência)
- [ ] Compartilhar Brand Kit com creators da comunidade
- [ ] Visualização do Brand Kit no Brand Hub (creator view)

**Entregável**: Página `/company/brand-kit`; creators veem o kit na comunidade.

---

#### S12 · Abr 29–Mai 5 · E-commerce MVP

- [ ] Webhook genérico para receber eventos de venda
- [ ] Integração Shopify (MVP): OAuth, sync de pedidos, atribuição por cupom
- [ ] Dashboard de vendas em tempo real por campanha (vendas, receita, comissões)
- [ ] Notificação para creator quando uma venda é atribuída

**Entregável**: Shopify conectado; vendas trackadas e visíveis no dashboard.

---

## Backlog Futuro

Itens mapeados para além de Q1 2026, sem data definida:

| Item | Descrição |
|------|-----------|
| Wallet + PIX | Saldo, saques via PIX, aprovação, comprovantes |
| AI Mashups | Combinar clips de diferentes creators, gerar variações automáticas |
| Editor de vídeo/anúncios | Cortar clips, legendas automáticas, templates intro/outro |
| PWA + Push notifications | App-like experience com notificações nativas |
| SSO enterprise | Single sign-on para empresas grandes |
| YouTube / Twitter / LinkedIn APIs | Integrações com outras redes sociais |
| CRM externo (HubSpot, RD Station) | Sync de contatos e métricas com CRMs |
| Verificação de email + 2FA | Segurança avançada de conta |
| Quick Jobs | Briefing rápido + match automático + pagamento instantâneo |
| White-label para agências | Plataforma personalizada para agências de marketing |
| Multi-idioma | Suporte a inglês e espanhol |

---

## Convenções e Notas

- **Checkboxes** (`[ ]`) representam entregas da sprint. Marcar `[x]` ao concluir.
- **Entregável** no final de cada sprint define o critério de "done".
- Sprints podem ser ajustadas com base em feedback e descobertas técnicas — repriorizar é esperado.
- Bugs críticos descobertos durante o trimestre entram como prioridade na sprint corrente.
- Este documento é atualizado semanalmente no fechamento de cada sprint.
- Schema changes: editar `shared/schema.ts` → `npm run db:push`.
- Testes: `npm run test` antes de fechar qualquer sprint.
