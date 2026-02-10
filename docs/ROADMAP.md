# CreatorConnect - Roadmap de Produto

> **Última Atualização**: Fevereiro 2026  
> **Versão**: 1.1  
> **Status**: Em desenvolvimento ativo

---

## Legenda

- ✅ Concluído
- 🔄 Em progresso
- ⏳ Pendente
- 🔮 Futuro (próximas versões)

---

## Sumário

1. [Bloco 1: Infraestrutura Base](#bloco-1-infraestrutura-base)
2. [Bloco 2: Autenticação e Usuários](#bloco-2-autenticação-e-usuários)
3. [Bloco 3: Campanhas e Jobs](#bloco-3-campanhas-e-jobs)
4. [Bloco 4: Comunidades de Marca](#bloco-4-comunidades-de-marca)
5. [Bloco 5: Gamificação](#bloco-5-gamificação)
6. [Bloco 6: Mensagens e Chat](#bloco-6-mensagens-e-chat)
7. [Bloco 7: Instagram API Integration](#bloco-7-instagram-api-integration)
8. [Bloco 8: Automações](#bloco-8-automações)
9. [Bloco 9: Roteiros com IA](#bloco-9-roteiros-com-ia)
10. [Bloco 10: Analytics e Tracking](#bloco-10-analytics-e-tracking)
11. [Bloco 11: Arquivos e Assets da Marca](#bloco-11-arquivos-e-assets-da-marca)
12. [Bloco 12: Creator Academy](#bloco-12-creator-academy)
13. [Bloco 13: E-commerce e Tracking](#bloco-13-e-commerce-e-tracking)
14. [Bloco 14: Wallet e Pagamentos](#bloco-14-wallet-e-pagamentos)
15. [Bloco 15: Criação de Anúncios](#bloco-15-criação-de-anúncios)
16. [Bloco 16: Integrações Externas](#bloco-16-integrações-externas)
17. [Bloco 17: SEO e Marketing](#bloco-17-seo-e-marketing)
18. [Bloco 18: Admin e Ops](#bloco-18-admin-e-ops)

---

## Bloco 1: Infraestrutura Base

### Backend
- [x] Express.js com TypeScript
- [x] PostgreSQL com Drizzle ORM
- [x] Sessões com express-session
- [x] WebSocket para notificações real-time
- [x] Cron jobs para tarefas agendadas
- [x] Object Storage (GCS) para uploads
- [x] SendGrid para emails transacionais
- [ ] Rate limiting por endpoint
- [ ] Cache com Redis
- [ ] Queue para processamento assíncrono

### Frontend
- [x] React 18 + TypeScript + Vite
- [x] TanStack Query para data fetching
- [x] Tailwind CSS v4
- [x] shadcn/ui components
- [x] Wouter para routing
- [x] React Hook Form + Zod validation
- [ ] PWA com offline support
- [ ] Push notifications

---

## Bloco 2: Autenticação e Usuários

### Core Auth
- [x] Login com email/senha
- [x] Google OAuth
- [x] Registro de creators
- [x] Registro de empresas
- [x] Recuperação de senha
- [x] Sessões persistentes

### Perfil de Usuário
- [x] Edição de perfil básico
- [x] Upload de foto de perfil
- [x] Configurações da conta
- [ ] Verificação de email
- [ ] Two-factor authentication (2FA)
- [ ] Histórico de sessões

### Multi-tenant (Empresas)
- [x] Múltiplos workspaces por empresa
- [x] Convites para membros
- [x] Permissões: owner, admin, member
- [x] Switch entre empresas
- [ ] SSO para empresas enterprise

---

## Bloco 3: Campanhas e Jobs

### Gestão de Campanhas
- [x] Criar/editar/excluir campanhas
- [x] Status: draft, active, paused, completed
- [x] Visibilidade: public, private, community_only
- [x] Definir budget e pagamento por creator
- [x] Definir entregas (deliverables)
- [x] Adicionar tags e categorias
- [ ] Templates de campanha reutilizáveis
- [ ] Duplicar campanha existente
- [ ] Agendamento de publicação

### Candidaturas (Applications)
- [x] Creators se candidatam
- [x] Status flow: pending → approved → in_progress → delivered → completed
- [x] Rejeição com motivo
- [x] Tracking de entregas por deliverable
- [x] Comentários em entregas
- [ ] Propostas personalizadas do creator (preço, prazo)
- [ ] Negociação de termos

### Jobs Pontuais (Quick Jobs)
- [ ] Criar job com briefing rápido
- [ ] Match automático com creators disponíveis
- [ ] Aceite/recusa em 24h
- [ ] Pagamento instantâneo ao concluir
- [ ] Rating mútuo após job

### Convites Diretos
- [x] Convidar creators específicos
- [x] Email de convite personalizado
- [ ] Convite via WhatsApp
- [ ] Convite em lote (bulk)

---

## Bloco 4: Comunidades de Marca

### Memberships
- [x] Creators se associam a marcas
- [x] Status: invited, active, suspended, archived
- [x] Landing pages personalizadas (/m/:slug)
- [x] Campanhas exclusivas para comunidade
- [ ] Formulário de application customizável
- [ ] Auto-aprovação por critérios
- [ ] Níveis de membership (tiers)

### Brand Hub (Creator View)
- [x] Dashboard da marca para creators
- [x] Ver campanhas disponíveis
- [x] Ver pontos e tier atual
- [ ] Feed de novidades da marca
- [ ] Eventos e desafios da comunidade

### Eventos da Comunidade
- [x] Criar eventos para comunidade
- [ ] RSVP de creators
- [ ] Lembretes automáticos
- [ ] Check-in no evento
- [ ] Conteúdo exclusivo pós-evento

---

## Bloco 5: Gamificação

### Sistema de Pontos
- [x] Points ledger (registro de pontos)
- [x] Regras de pontos configuráveis por marca
- [x] Pontos por: candidatura, entrega, menção, etc
- [x] Histórico de pontos do creator
- [ ] Pontos expiráveis
- [ ] Bônus de streak (consistência)

### Tiers e Níveis
- [x] Tiers por marca (bronze, silver, gold, etc)
- [x] Promoção automática por pontos
- [x] Benefícios por tier
- [ ] Rebaixamento por inatividade
- [ ] Badges e conquistas

### Leaderboards
- [x] Ranking por marca
- [x] Ranking por período (semanal, mensal)
- [ ] Ranking por categoria
- [ ] Destaque do top 3 no Brand Hub

### Recompensas e Prêmios
- [x] Campaign prizes (prêmios de campanha)
- [x] Modos: ranking (top N) ou milestone
- [x] Reward entitlements
- [ ] Catálogo de recompensas resgatáveis
- [ ] Cupons exclusivos por tier
- [ ] Produtos físicos como recompensa

---

## Bloco 6: Mensagens e Chat

### Chat por Candidatura
- [x] Mensagens entre creator e empresa
- [x] Histórico de mensagens
- [x] Notificações de novas mensagens
- [ ] Anexos (imagens, vídeos, arquivos)
- [ ] Marcação de mensagens importantes

### Mensagens Diretas
- [x] Brand conversations
- [x] Direct messages entre usuários
- [ ] Grupos de chat
- [ ] Broadcast para comunidade

### Notificações
- [x] WebSocket real-time
- [x] Email de novas mensagens (consolidado)
- [ ] Push notifications mobile
- [ ] Preferências de notificação granulares

---

## Bloco 7: Instagram API Integration

### OAuth e Conexão
- [x] Instagram Business Login
- [x] OAuth flow completo
- [x] Múltiplas contas por empresa
- [x] Refresh de tokens
- [x] Callback dinâmico (dev/prod)
- [ ] Reconexão automática quando token expira

### Dados do Instagram
- [x] Sincronizar perfil (foto, bio, followers)
- [x] Métricas: followers, follows, media_count
- [x] Posts recentes (via Content Publishing API)
- [ ] Histórico de crescimento de followers
- [ ] Stories insights
- [ ] Reels insights detalhados

### Webhooks
- [x] Receber menções (@)
- [x] Receber comentários
- [x] Receber DMs
- [x] Logging de eventos
- [ ] Receber Story mentions
- [ ] Receber novos seguidores

### Envio de Mensagens (DMs)
- [x] Enviar DM via API
- [x] Rate limit (200 DMs/hora)
- [x] Sync progressivo com WebSocket
- [x] Templates de mensagens
- [ ] Agendamento de DMs
- [ ] Sequences (múltiplas mensagens)

### Hashtag Tracking ✅ NEW
- [x] Buscar hashtags via Instagram Graph API
- [x] Posts top e recentes por hashtag
- [x] Associar hashtags a campanhas
- [x] Controle de limite 30 hashtags/semana
- [x] Grid de posts descobertos
- [x] Estatísticas por hashtag
- [x] 3 tabelas: `hashtag_searches`, `campaign_hashtags`, `hashtag_posts`

### Gestão de Comentários ✅ NEW
- [x] Listar comentários de todos os posts
- [x] Responder comentários inline
- [x] Ocultar/mostrar comentários
- [x] Excluir comentários
- [x] Análise de sentimento com IA (OpenAI)
- [x] Filtro por todos/ocultos
- [x] Badges de sentimento (positivo/neutro/negativo)

### Publicação de Conteúdo ✅ NEW
- [x] Publicar imagens no feed
- [x] Publicar carrosséis (2-10 itens)
- [x] Publicar Reels (vídeo)
- [x] Publicar Stories (imagem ou vídeo)
- [x] Composer com preview
- [x] Tracking de cota (25 publicações/24h)
- [x] Grid de publicações recentes
- [x] Validação Zod em todos os endpoints

### Partnership Ads ✅
- [x] Enviar solicitação de partnership para criadores
- [x] Verificar status de permissões
- [x] Gerenciar criadores parceiros
- [x] Criar anúncios com conteúdo do criador
- [x] Métricas de performance de Partnership Ads
- [x] Fluxo OAuth one-click para criadores
- [x] Convites por link com token seguro

### CRM Social (Instagram Contacts)
- [x] Registro de contatos por empresa
- [x] Métricas de interação (DMs, menções, comentários)
- [x] Tags e scoring de contatos
- [x] Histórico de interações
- [x] Auto-populado por DM sync e comments

---

## Bloco 8: Automações

> **Referência**: Superfiliate Automations

### Engine de Automação
- [x] Modelo de automações (trigger → action)
- [x] Tipos de trigger: mention, comment, dm_keyword, new_follower
- [x] Tipos de action: send_dm, send_dm_with_link, notify_team, add_tag
- [x] Filtros configuráveis
- [x] Logs de execução
- [ ] Condições avançadas (if/else)
- [ ] Delay entre ações
- [ ] Múltiplas ações por trigger

### Triggers (Gatilhos)
- [x] Creator menciona marca no post
- [x] Comentário com palavra-chave
- [x] DM com palavra-chave
- [ ] Novo seguidor
- [ ] Story mention
- [ ] Creator atinge milestone de vendas
- [ ] Creator sobe de tier
- [ ] Nova candidatura recebida
- [ ] Entrega aprovada

### Actions (Ações)
- [x] Enviar DM personalizada
- [x] Enviar DM com link
- [x] Notificar equipe
- [x] Adicionar tag ao creator
- [ ] Aprovar candidatura automaticamente
- [ ] Rejeitar candidatura automaticamente
- [ ] Adicionar creator à comunidade
- [ ] Promover creator de tier
- [ ] Criar task no Ops Hub
- [ ] Enviar email
- [ ] Webhook para sistema externo

### Templates de Automação
- [ ] Auto-DM para quem menciona a marca
- [ ] Auto-aprovar creators com +10k followers
- [ ] Auto-promover após 5 entregas aprovadas
- [ ] Onboarding sequence para novos membros
- [ ] Re-engajamento de creators inativos

---

## Bloco 9: Roteiros com IA

> **Referência**: Billo CreativeOps, Poppy AI

### Gerador de Roteiros
- [ ] Briefing da campanha como input
- [ ] Estilo/tom de voz configurável
- [ ] Duração do vídeo (15s, 30s, 60s)
- [ ] Plataforma destino (TikTok, Reels, Stories)
- [ ] Gerar múltiplas versões
- [ ] Editar e refinar com IA

### Templates de Roteiro
- [ ] Hook patterns que funcionam
- [ ] Estruturas: problema → solução → CTA
- [ ] Testimonial scripts
- [ ] Unboxing scripts
- [ ] Tutorial/How-to scripts
- [ ] ASMR/Visual scripts

### IA para Briefings
- [ ] Gerar briefing a partir de produto
- [ ] Sugerir ângulos criativos
- [ ] Análise de briefings dos concorrentes
- [ ] Benchmark de hooks virais

### Integração com Dados
- [ ] Aprender com criativos que performam
- [ ] Sugestões baseadas em métricas
- [ ] A/B testing de scripts
- [ ] Score de viralidade previsto

---

## Bloco 10: Analytics e Tracking

> **Referência**: Billo CreativeOps

### Métricas de Campanha
- [x] Dashboard básico de campanhas
- [x] Status de entregas
- [x] Hashtag tracking com posts descobertos
- [ ] Views por criativo
- [ ] Engajamento (likes, comments, shares)
- [ ] CTR de links
- [ ] Conversões e vendas

### Performance de Creators
- [ ] Score de performance por creator
- [ ] Taxa de entrega no prazo
- [ ] Qualidade média das entregas
- [ ] ROI por creator
- [ ] Comparativo entre creators

### Analytics de Criativos
- [ ] Hook rate (primeiros 3 segundos)
- [ ] Watch time médio
- [ ] Taxa de replay
- [ ] Ações após visualização
- [ ] Heatmap de atenção

### Relatórios
- [ ] Relatório semanal automático
- [ ] Relatório mensal consolidado
- [ ] Export para PDF/Excel
- [ ] Dashboards customizáveis

---

## Bloco 11: Arquivos e Assets da Marca

### Brand Kit
- [ ] Upload de logo (múltiplos formatos)
- [ ] Paleta de cores
- [ ] Tipografia
- [ ] Guidelines de uso da marca
- [ ] Templates aprovados

### Biblioteca de Assets
- [ ] Upload de imagens/vídeos
- [ ] Organização por pastas
- [ ] Tags e busca
- [ ] Versioning de arquivos
- [ ] Compartilhar com creators

### Briefing Assets
- [ ] Anexar assets aos briefings
- [ ] Moodboard visual
- [ ] Referências de criativos
- [ ] Do's and Don'ts visuais

### UGC Library
- [ ] Coletar criativos entregues
- [ ] Organizar por campanha
- [ ] Marcar favoritos
- [ ] Download em lote
- [ ] Direitos de uso tracking

---

## Bloco 12: Creator Academy

### Cursos
- [x] Estrutura: Course → Modules → Lessons
- [x] Progresso do creator
- [ ] Vídeo lessons
- [ ] Quizzes e avaliações
- [ ] Certificados de conclusão
- [ ] Cursos premium (tier específico)

### Swipe File / Inspirações
- [x] Coleção de inspirações
- [x] Organização por collection
- [ ] Filtro por categoria/nicho
- [ ] Salvar favoritos
- [ ] Contribuir com inspirações

### Recursos
- [ ] Templates de contratos
- [ ] Calculadora de preços
- [ ] Guias de equipamento
- [ ] Tutoriais de edição

---

## Bloco 13: E-commerce e Tracking

### Cupons e Códigos
- [x] Criar cupons por campanha
- [x] Atribuir cupom ao creator
- [x] Tracking de uso
- [ ] Cupons dinâmicos (únicos por creator)
- [ ] Validade e limites de uso

### Tracking de Vendas
- [x] Registrar vendas por cupom
- [x] Calcular comissões
- [ ] Webhook para receber vendas
- [ ] Dashboard de vendas em tempo real
- [ ] Atribuição multi-touch

### Integrações E-commerce
- [x] Base para integração
- [ ] Shopify integration
- [ ] WooCommerce integration
- [ ] Nuvemshop integration
- [ ] VTEX integration
- [ ] API genérica para outras plataformas

---

## Bloco 14: Wallet e Pagamentos

### Wallet do Creator
- [ ] Saldo disponível
- [ ] Saldo pendente
- [ ] Histórico de transações
- [ ] Extrato detalhado

### Saques
- [ ] Solicitar saque
- [ ] Dados bancários (PIX)
- [ ] Aprovação de saque
- [ ] Comprovante de pagamento
- [ ] Nota fiscal (opcional)

### Pagamentos da Empresa
- [ ] Adicionar créditos
- [ ] Pagamento por campanha
- [ ] Pagamento por performance
- [ ] Relatório de gastos

---

## Bloco 15: Criação de Anúncios

> **Referência**: Billo AI Mashups

### Partnership Ads (Meta API) ✅
- [x] Enviar solicitação de Partnership Ads via Meta API
- [x] Verificar status de aprovação
- [x] Gerenciar criadores parceiros autorizados
- [x] Criar anúncio com conteúdo do criador
- [x] Métricas de performance dos Partnership Ads
- [x] Convites OAuth one-click para criadores
- [x] Dashboard completo (Meta Ads Suite)

### Editor de Anúncios
- [ ] Upload de vídeos do creator
- [ ] Cortar e editar clips
- [ ] Adicionar legendas automáticas
- [ ] Adicionar música/áudio
- [ ] Templates de intro/outro

### AI Mashups
- [ ] Combinar clips de diferentes creators
- [ ] Gerar variações automaticamente
- [ ] Diferentes aspect ratios (9:16, 1:1, 16:9)
- [ ] A/B testing de versões

### Export e Publicação
- [x] Publicar direto no Instagram (imagem, carrossel, reel, story)
- [ ] Export para Meta Ads
- [ ] Export para TikTok Ads
- [ ] Export para Google Ads

---

## Bloco 16: Integrações Externas

### Redes Sociais
- [x] Instagram Business API (OAuth, DMs, Comments, Hashtags, Publishing, Partnership Ads)
- [ ] TikTok API
- [ ] YouTube API
- [ ] Twitter/X API
- [ ] LinkedIn API

### Plataformas de Ads
- [x] Meta Ads Manager (Partnership Ads, campaign creation)
- [ ] TikTok Ads
- [ ] Google Ads

### CRMs e Marketing
- [ ] HubSpot
- [ ] Salesforce
- [ ] RD Station
- [ ] Mailchimp

### Outros
- [x] Apify (web scraping)
- [x] ReceitaWS (CNPJ)
- [x] SendGrid (emails)
- [x] Google Cloud Storage
- [ ] Slack (notificações)
- [ ] Zapier (automações)
- [ ] Webhooks genéricos

---

## Bloco 17: SEO e Marketing

### SEO Técnico
- [x] Meta tags dinâmicas
- [x] Open Graph tags
- [x] Schema.org (Organization, Website)
- [x] Robots.txt otimizado para IA
- [ ] Sitemap.xml automático
- [ ] Canonical URLs
- [ ] Hreflang para multi-idioma

### Conteúdo
- [x] Blog com artigos
- [x] Cases de sucesso
- [x] Landing pages de marca
- [ ] Glossário de termos
- [ ] FAQ expandido

### GEO (Generative Engine Optimization)
- [x] FAQPageSchema disponível
- [x] Permitir bots de IA (GPTBot, PerplexityBot, etc)
- [ ] Respostas diretas nos primeiros parágrafos
- [ ] Estatísticas citáveis
- [ ] Structured data em todo conteúdo

---

## Bloco 18: Admin e Ops

### Admin Dashboard
- [x] Métricas gerais da plataforma
- [x] Gestão de usuários
- [x] Preview de emails
- [ ] Logs de sistema
- [ ] Gestão de empresas
- [ ] Feature flags

### Ops Hub
- [x] Tasks operacionais
- [x] Tipos: followup, ship_product, review_deliverable, etc
- [x] Status tracking
- [ ] Atribuição para membros da equipe
- [ ] SLA e prazos
- [ ] Automação de tasks repetitivas

### Suporte
- [ ] Tickets de suporte
- [ ] Chat in-app
- [ ] Knowledge base
- [ ] Status page

---

## Prioridades Q1 2026

### P0 - Crítico (Este mês)
1. ✅ Instagram Hashtag Tracking
2. ✅ Instagram Comments Management
3. ✅ Content Publishing via Meta API
4. ✅ Partnership Ads (verificado completo)
5. ⏳ Corrigir bugs existentes na plataforma
6. ⏳ Dashboard de analytics básico

### P1 - Alta (Próximo mês)
1. ⏳ Automações expandidas (mais triggers/actions)
2. ⏳ Brand Kit e arquivos da marca
3. ⏳ Roteiros com IA (MVP)
4. ⏳ TikTok API integration

### P2 - Média (Próximo trimestre)
1. ⏳ Tracking de vendas com webhooks
2. ⏳ Wallet e pagamentos via PIX
3. ⏳ AI Mashups para anúncios
4. ⏳ Integrações e-commerce (Shopify, Nuvemshop)

### P3 - Baixa (Futuro)
1. 🔮 PWA com push notifications
2. 🔮 SSO enterprise
3. 🔮 Multi-idioma
4. 🔮 White-label para agências

---

## Changelog do Roadmap

### Fevereiro 2026 (v1.1)
- **Instagram Hashtag Tracking**: ✅ Concluído - 3 tabelas DB, 8 endpoints, componente frontend
- **Instagram Comments Management**: ✅ Concluído - Reply/hide/delete, análise de sentimento com IA
- **Content Publishing**: ✅ Concluído - Publicar imagem/carrossel/reel/story via Meta API
- **Partnership Ads**: ✅ Verificado completo - Backend + frontend já implementados
- **DM Sync**: Melhorias no progresso e cleanup de erros
- Prioridades Q1 2026 atualizadas com status
- Bloco 7 expandido com 5 novas subseções (Hashtag, Comments, Publishing, Partnership, CRM)
- Bloco 15 atualizado com Partnership Ads e Content Publishing
- Bloco 16 atualizado com Meta Ads Manager

### Fevereiro 2026 (v1.0)
- Documento criado com base em análise competitiva
- Concorrentes analisados: Billo, Superfiliate, Twirl, Youdji, Poppy AI
- 18 blocos de features mapeados
- Prioridades Q1 2026 definidas

---

## Notas

- Este roadmap é um documento vivo e será atualizado conforme o desenvolvimento avança
- Features podem ser repriorizadas baseado em feedback dos usuários
- Checkboxes marcados (`[x]`) indicam features já implementadas
- Para contribuir com sugestões, adicione na seção correspondente
