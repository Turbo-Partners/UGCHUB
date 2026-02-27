# Status de Execucao por Pagina

> Guia de trabalho: o que funciona, o que precisa ser corrigido, e o progresso atual.
> Atualizado: 2026-02-27

---

## Legenda

| Simbolo      | Significado                                 |
| ------------ | ------------------------------------------- |
| OK           | Funciona corretamente, sem acoes pendentes  |
| FIX          | Funciona mas precisa de correcoes/melhorias |
| PARCIAL      | Frontend existe, backend incompleto         |
| STUB         | Frontend existe, backend inexistente (404)  |
| QUEBRADA     | Nao funciona (sem rota, erros criticos)     |
| EM ANDAMENTO | Sendo trabalhada agora                      |
| CONCLUIDA    | Correcao/melhoria entregue nesta sprint     |

---

## Resumo Geral

| Status   | Qtde | Paginas                                                                |
| -------- | ---- | ---------------------------------------------------------------------- |
| OK       | 39   | Maioria das paginas creator + company (Discovery unificado)            |
| FIX      | 2    | Dashboard Creator, Integracoes                                         |
| PARCIAL  | 3    | Leaderboard, Analytics Company, Analytics Creator                      |
| STUB     | 4    | Content Library, Social Listening, Push Notifications, Program Courses |
| QUEBRADA | 1    | Operations                                                             |

---

## CREATOR

| #   | Pagina        | Rota                      | Status  | Problema                                                  | Acao                                |
| --- | ------------- | ------------------------- | ------- | --------------------------------------------------------- | ----------------------------------- |
| 1   | Inicio        | `/home`                   | OK      | —                                                         | —                                   |
| 2   | Descobrir     | `/explore`                | OK      | —                                                         | —                                   |
| 3   | Marcas        | `/brands`                 | OK      | —                                                         | —                                   |
| 4   | Campanhas     | `/campaigns`              | OK      | —                                                         | —                                   |
| 5   | Mensagens     | `/messages`               | OK      | —                                                         | —                                   |
| 6   | Carteira      | `/wallet`                 | OK      | Saque real nao implementado (so PIX key)                  | Depende de integracao bancaria      |
| 7   | Academy       | `/academy`                | OK      | —                                                         | —                                   |
| 8   | Configuracoes | `/settings`               | OK      | —                                                         | —                                   |
| 9   | Leaderboard   | `/ranking`                | PARCIAL | `getMonthlyLeaderboard()` retorna `[]`, stats hardcoded 0 | Implementar backend gamification V1 |
| 10  | Analytics     | `/creator/analytics`      | OK      | Funcional mas sem score de performance                    | Melhoria futura                     |
| 11  | Brand Hub     | `/brands/:brandId`        | OK      | —                                                         | —                                   |
| 12  | Comunidades   | `/my-communities`         | OK      | —                                                         | —                                   |
| 13  | Dashboard alt | `/dashboard`              | FIX     | Grafico semanal com dados hardcoded                       | Conectar a dados reais              |
| 14  | Workspace     | `/campaign/:id/workspace` | OK      | —                                                         | —                                   |

---

## COMPANY

| #   | Pagina                 | Rota                                 | Status       | Problema                                                          | Acao                                              |
| --- | ---------------------- | ------------------------------------ | ------------ | ----------------------------------------------------------------- | ------------------------------------------------- |
| 1   | Dashboard              | `/company/home`                      | OK           | —                                                                 | —                                                 |
| 2   | Discovery              | `/company/brand/:brandId/discovery`  | OK           | Unificado: SQL pagination + filtros avancados + favoritos         | CONCLUIDO                                         |
| 3   | Comunidade             | `/company/brand/:brandId/community`  | OK           | —                                                                 | —                                                 |
| 4   | Campanhas              | `/company/brand/:brandId/campaigns`  | OK           | —                                                                 | —                                                 |
| 5   | Tracking               | `/company/brand/:brandId/tracking`   | OK           | —                                                                 | —                                                 |
| 6   | Mensagens              | `/company/brand/:brandId/messages`   | OK           | —                                                                 | —                                                 |
| 7   | Brand Canvas           | `/company/brand-canvas`              | OK           | —                                                                 | —                                                 |
| 8   | Kanban                 | `/company/brand/:brandId/kanban`     | OK           | —                                                                 | —                                                 |
| 9   | **Operations**         | `/company/brand/:brandId/operations` | **QUEBRADA** | Sem rota no App.tsx, 4 endpoints faltando (seeding, review-queue) | Registrar rota + implementar endpoints            |
| 10  | **Content Library**    | `/company/brand/:brandId/content`    | **STUB**     | 0 endpoints backend, sem tabela DB, types frontend-only           | Implementar backend completo ou remover pagina    |
| 11  | Financeiro             | `/company/financeiro`                | OK           | —                                                                 | —                                                 |
| 12  | Integracoes            | `/company/integrations`              | FIX          | E-commerce stub (Yampi/Nuvemshop so UI)                           | Depende do roadmap S11                            |
| 13  | Instagram Inbox        | `/company/instagram-inbox`           | OK           | Duplicada com messages.tsx                                        | Considerar remover (messages.tsx e mais completa) |
| 14  | Instagram Comments     | `/company/instagram-comments`        | OK           | —                                                                 | —                                                 |
| 15  | Instagram Publishing   | `/company/instagram-publishing`      | OK           | —                                                                 | —                                                 |
| 16  | Meta Ads               | `/company/meta-ads`                  | OK           | —                                                                 | —                                                 |
| 17  | **Social Listening**   | `/company/social-listening`          | **STUB**     | 0 endpoints backend, sem tabela DB, type frontend-only            | Implementar backend ou remover                    |
| 18  | **Push Notifications** | `/company/push-notifications`        | **STUB**     | 0 endpoints backend                                               | Implementar backend ou remover                    |
| 19  | DM Templates           | `/company/dm-templates`              | OK           | —                                                                 | —                                                 |
| 20  | Program Overview       | `/company/brand/:brandId/program`    | OK           | —                                                                 | —                                                 |
| 21  | Program Tiers          | `.../program/tiers`                  | OK           | —                                                                 | —                                                 |
| 22  | Program Rewards        | `.../program/rewards`                | OK           | —                                                                 | —                                                 |
| 23  | Program Gamification   | `.../program/gamification`           | OK           | —                                                                 | —                                                 |
| 24  | **Program Courses**    | `.../program/courses`                | **STUB**     | Sem endpoints                                                     | Implementar ou remover                            |
| 25  | Analytics              | `/company/brand/:brandId/analytics`  | PARCIAL      | So stats publicos, sem filtros por periodo                        | Implementar analytics real                        |
| 26  | Landing Pages          | `/company/landing-pages`             | OK           | —                                                                 | —                                                 |
| 27  | Campaign Coupons       | `/company/campaigns/:id/coupons`     | OK           | —                                                                 | —                                                 |
| 28  | Campaign Sales         | `/company/campaigns/:id/sales`       | OK           | —                                                                 | —                                                 |

---

## ADMIN

| #   | Pagina      | Rota                  | Status | Problema | Acao |
| --- | ----------- | --------------------- | ------ | -------- | ---- |
| 1   | Dashboard   | `/admin`              | OK     | —        | —    |
| 2   | Usuarios    | `/admin/users`        | OK     | —        | —    |
| 3   | Campanhas   | `/admin/campaigns`    | OK     | —        | —    |
| 4   | Financeiro  | `/admin/financial`    | OK     | —        | —    |
| 5   | Suporte     | `/admin/support`      | OK     | —        | —    |
| 6   | Modulos     | `/admin/modules`      | OK     | —        | —    |
| 7   | Conteudo    | `/admin/content`      | OK     | —        | —    |
| 8   | Gamificacao | `/admin/gamification` | OK     | —        | —    |

---

## PUBLIC

| #   | Pagina            | Rota               | Status |
| --- | ----------------- | ------------------ | ------ |
| 1   | Profile           | `/p/:username`     | OK     |
| 2   | Blog              | `/blog`            | OK     |
| 3   | Community Landing | `/join/:brandSlug` | OK     |

---

## Progresso de Correcoes

### Em andamento

| Pagina    | Problema                                                        | Status    | Data inicio |
| --------- | --------------------------------------------------------------- | --------- | ----------- |
| Discovery | ~~2 paginas duplicadas~~ Unificado com SQL pagination + filtros | CONCLUIDO | 2026-02-27  |

### Backlog (proximas)

| Pagina             | Problema                                 | Prioridade |
| ------------------ | ---------------------------------------- | ---------- |
| Operations         | Sem rota no App.tsx + endpoints faltando | Alta       |
| Content Library    | Backend inteiro inexistente              | Alta       |
| Social Listening   | Backend inteiro inexistente              | Alta       |
| Push Notifications | Backend inteiro inexistente              | Alta       |
| Program Courses    | Backend inexistente                      | Media      |
| Analytics Company  | So stats basicos                         | Media      |
| Leaderboard        | Backend gamification V1 stubs            | Media      |
| Dashboard Creator  | Grafico hardcoded                        | Baixa      |

### Concluidas

| Pagina | O que foi feito | Data |
| ------ | --------------- | ---- |
| —      | —               | —    |

---

## Duplicacoes a Resolver

| Pagina A                    | Pagina B                | Decisao                                                                       |
| --------------------------- | ----------------------- | ----------------------------------------------------------------------------- |
| ~~`creator-discovery.tsx`~~ | ~~`creators-list.tsx`~~ | RESOLVIDO: unificado em `creator-discovery.tsx`, `creators-list.tsx` deletado |
| `instagram-inbox.tsx`       | `messages.tsx`          | Remover instagram-inbox (messages.tsx e mais completa)                        |
| `community-settings.tsx`    | `program-*.tsx`         | Avaliar sobreposicao                                                          |
| `nav-config.ts`             | `layout.tsx`            | nav-config esta desatualizado — layout.tsx e a fonte real                     |
