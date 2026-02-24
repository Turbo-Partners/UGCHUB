# CreatorConnect — Estrategia de Produto 2026

> **Versao**: 1.0
> **Data**: 24 de Fevereiro de 2026
> **Base**: [Analise Competitiva](./competitor-analysis.md) (11 concorrentes) + [Roadmap v3.0](./ROADMAP.md)

---

## 1. Posicionamento

### O que somos

Plataforma **all-in-one de influencer marketing** com foco em **comunidade gamificada** e **suite Instagram completa**, potencializada por IA.

### Diferencial central

Unica plataforma que combina:
- **Comunidade com gamificacao profunda** (pontos, badges, leaderboards, tiers, rewards)
- **Suite Instagram mais completa do mercado** (publishing, DM management, comments AI, hashtag tracking, CRM social)
- **Pipeline de IA para branding** (Brand Canvas com Gemini + Claude)
- **Multi-tenant sofisticado** (roles, briand-centrc routing, multi-empresa)

### Publico-alvo

- **Marcas de todos os portes**: de startups D2C a empresas mid-market e enterprise
- **Agencias de marketing** que gerenciam multiplas marcas
- **Mercado primario**: Brasil
- **Foco**: equipes de marketing, community managers, influencer managers

### O que NAO somos

- **Nao somos** um marketplace UGC one-off (Billo, Youdji) — nosso foco e relacionamento de longo prazo
- **Nao somos** uma plataforma programatica enterprise-only (BrandLovers) — atendemos todos os portes
- **Nao somos** um software de affiliate puro (Push Lap Growth) — affiliate e parte do ecossistema, nao o core
- **Nao somos** managed service de UGC (Twirl) — a plataforma e self-serve com IA como assistente

---

## 2. Moat (Vantagens Defensiveis)

Vantagens competitivas que sao dificeis de replicar e devem ser protegidas/ampliadas:

### 2.1 Gamificacao Completa

**Nenhum concorrente chega perto.** Sistema com pontos, badges, leaderboards por marca/periodo, tiers com promocao automatica, rewards, scoring rules configuráveis e caps. Inbazz tem gamificacao basica; SHOUT tem ranks simples. Ninguem tem o pacote completo.

**Ampliar**: missoes diarias, streaks, challenges sazonais, rewards marketplace.

### 2.2 Instagram Suite

**A mais completa do mercado** — nenhum concorrente oferece tudo junto:
- Publishing nativo (posts, carousels, reels, stories) — **exclusivo**
- DM Management com sync, templates, rate limiting — apenas Superfiliate tem DM automations
- Comments AI com sentiment analysis — **exclusivo**
- Hashtag Tracking com busca e vinculacao a campanhas — **exclusivo**
- CRM Social com contacts, interactions, scoring — **exclusivo**

**Ampliar**: auto-reply rules, scheduled publishing, AI-generated responses.

### 2.3 Brand Canvas AI

**Sem equivalente no mercado.** Pipeline de 6 etapas (CNPJ, Website/Gemini, Visual/Gemini, Social/BD, Voice/Claude, Synthesis/Claude) que gera identidade visual, voz e estrategia de conteudo automaticamente. Refresh mensal automatico.

**Ampliar**: usar como ferramenta de onboarding para atrair empresas.

### 2.4 Comunidade + Membership

Sistema de comunidades com memberships (invited→active→archived), landing pages, campanhas exclusivas, Brand Hub, tiers com recompensas. Inbazz e o concorrente mais proximo, mas sem gamificacao profunda. Squid tem comunidades mas sem tiers/rewards.

**Ampliar**: conteudo exclusivo por tier, eventos de comunidade, mentoria.

### 2.5 Multi-tenant Sofisticado

Modelo de roles (owner/admin/member) por empresa, routing brand-centric, multiplas empresas por usuario, admin impersonation, feature flags. Mais maduro que a maioria dos concorrentes.

### 2.6 Contratos Digitais

Integracao com Assinafy para assinatura digital + geracao de PDFs com PDFKit. Maioria dos concorrentes usa contratos simples ou manuais.

---

## 3. Cenario Competitivo

### 3.1 Mapa do Mercado

O mercado se divide em tres categorias:

| Categoria | Concorrentes | Foco |
|-----------|-------------|------|
| **Escala / Enterprise** | BrandLovers, Squid, Superfiliate | Centenas/milhares de creators, automacao, IA, enterprise |
| **Comunidade / Embaixadores** | Inbazz, Brands Meet Creators | Relacionamento de longo prazo, comunidade, gamificacao |
| **Marketplaces UGC** | Insense, Billo, SHOUT, Youdji, Twirl | Producao de conteudo one-off ou recorrente, pay-per-video |

### 3.2 Concorrentes Diretos no Brasil

| Concorrente | Tamanho | Forca | Fraqueza vs Nos |
|-------------|---------|-------|-----------------|
| **BrandLovers** | 240k+ creators, 57 func. | IA (GuardIAn, Whisper, Smart Match), escala, CreatorPay | Sem gamificacao, sem comunidade, sem Instagram suite, enterprise-only |
| **Squid** | 300k+ creators | Marca, dados (70+ metricas), base, juridico/contabil | Turbulencia corporativa (Locaweb→UNLK), sem gamificacao, sem publishing |
| **Inbazz** | N/A | Comunidade, gamificacao basica, Yampi, app mobile | Sem IA, sem Instagram suite, gamificacao inferior, sem Brand Canvas |

### 3.3 Nosso Sweet Spot

Posicionamento entre **comunidade** (Inbazz) e **all-in-one** (Superfiliate), com diferenciais unicos em gamificacao e Instagram:

```
Enterprise/Escala          All-in-One           Comunidade
BrandLovers ←——— Squid ←——— Superfiliate ←——— [CreatorConnect] ←——— Inbazz
```

Combinamos a profundidade de comunidade do Inbazz com a amplitude de features do Superfiliate, adicionando gamificacao e Instagram suite que nenhum dos dois tem.

---

## 4. Pilares Estrategicos

### Pilar 1: IA Competitiva

**Objetivo**: fechar os gaps de IA mais criticos em relacao a concorrentes.

| Feature | Gap | Referencia | Sprint |
|---------|-----|------------|--------|
| **AI Smart Match** | Superfiliate, BrandLovers, Squid, Billo tem | Algoritmo preditivo creator-campanha | S06 |
| **AI Content Review** | BrandLovers (GuardIAn), SHOUT, Billo tem | Verificacao automatica de deliverables vs briefing | S07 |
| **Roteiros IA** | Ninguem tem exatamente | Geracao de scripts de video a partir de briefings | S08 |
| **Brand Canvas AI** | Ninguem tem (ampliar) | Pipeline Gemini+Claude ja implementado | Continuo |

**Meta**: ao final de S08, ter **4 features de IA** — mais que qualquer concorrente exceto BrandLovers.

### Pilar 2: E-commerce + Attribution

**Objetivo**: conectar campanhas a vendas reais, provando ROI.

| Feature | Gap | Referencia | Sprint |
|---------|-----|------------|--------|
| **E-commerce Brasil (Yampi/Nuvemshop)** | Inbazz ja integra Yampi | Tracking de vendas e seeding | S09 |
| **Revenue Attribution** | Superfiliate, Billo, Push Lap tem | Conectar vendas a creators especificos | S12 |
| **Cupons + Comissoes** | Schemas prontos | Ativar tracking de cupons existente | S09/S12 |

**Meta**: ao final de S12, ter **prova de ROI** — essencial para retencao de clientes.

### Pilar 3: Growth Multi-plataforma

**Objetivo**: expandir alem do Instagram para TikTok e mobile.

| Feature | Gap | Referencia | Sprint |
|---------|-----|------------|--------|
| **TikTok Base** | OAuth ja existe, expandir metricas | Sync de perfil e metricas | S10 |
| **TikTok Discovery + Spark Ads** | Insense, Billo, Superfiliate tem Spark Ads | Discovery multi-plataforma + ads | S11 |
| **PWA Mobile** | 5/11 concorrentes tem app (BrandLovers, Inbazz, Squid, Billo, Insense) | App-like para creators | S13 |

**Meta**: ao final de S13, ser **multi-plataforma** com experiencia mobile.

### Pilar 4: Ampliar Moat

**Objetivo**: aumentar a distancia dos concorrentes nos nossos diferenciais.

| Feature | Acao | Quando |
|---------|------|--------|
| **Gamificacao** | Missoes, streaks, challenges, rewards marketplace | Incremental (S05+) |
| **Instagram Automacoes** | Novos triggers/actions, auto-reply, scheduling | S05 |
| **Brand Canvas** | Refresh automatico, uso no onboarding | Continuo |
| **Comunidade** | Conteudo exclusivo por tier, eventos | Incremental |

---

## 5. Priorizacao de Features

### Framework: Impacto Competitivo x Esforco Tecnico

| Feature | Impacto Competitivo | Esforco | Prioridade | Sprint |
|---------|:-------------------:|:-------:|:----------:|:------:|
| AI Smart Match | ALTO | Medio | **P0** | S06 |
| AI Content Review | ALTO | Medio | **P0** | S07 |
| E-commerce Brasil (Yampi/Nuvemshop) | ALTO | Alto | **P0** | S09 |
| Revenue Attribution + Sales Dashboard | ALTO | Alto | **P1** | S12 |
| TikTok Spark Ads | ALTO | Medio | **P1** | S11 |
| Roteiros IA MVP | MEDIO | Medio | **P1** | S08 |
| PWA Mobile | ALTO | Alto | **P1** | S13 |
| TikTok Discovery | MEDIO | Medio | **P2** | S11 |
| Automacoes Expandidas | MEDIO | Medio | **P2** | S05 |
| Analytics Company/Creator | MEDIO | Medio | **P2** | S03-S04 |

### O que NAO vamos construir (e por que)

| Feature | Por que NAO |
|---------|-------------|
| **Co-branded Landing Pages** | Alto esforco, ROI incerto no BR. Superfiliate e referencia, mas depende de e-commerce DTC forte. → Backlog futuro |
| **AI Communication Agent (Whisper)** | Complexidade muito alta (NLP conversacional). BrandLovers investiu equipe dedicada. → Backlog futuro |
| **Video Editing/Post-production** | Fora do nosso core. Billo e unico que faz. Creators usam CapCut/InShot. → Nao construir |
| **TikTok Shop** | Mercado ainda nascente no BR. Superfiliate e referencia global. → Backlog futuro |
| **White-label** | Nicho de agencias, alto esforco. Push Lap e referencia. → Backlog futuro |
| **Shopify Integration** | Brasil usa mais Yampi/Nuvemshop. Shopify vem depois. → Backlog futuro |
| **Earned Media Value** | Metrica complexa de implementar e controversa. → Backlog futuro |
| **Tax/Legal Compliance Automatizado** | Requer expertise juridica local. Squid tem equipe propria. → Backlog futuro |

---

## 6. Metricas de Sucesso

### North Star Metric

> **Campanhas entregues com sucesso por mes**

Mede o valor central da plataforma: conectar marcas a creators e entregar resultados.

### KPIs por Pilar

#### Pilar 1: IA Competitiva

| Metrica | Target Q2 2026 |
|---------|---------------|
| % de campanhas usando AI Smart Match | > 30% |
| Deliverables revisados por AI Content Review | > 50% |
| Roteiros gerados por IA / mes | > 100 |
| Tempo medio de match creator-campanha | -40% vs baseline |

#### Pilar 2: E-commerce + Attribution

| Metrica | Target Q2 2026 |
|---------|---------------|
| Lojas conectadas (Yampi/Nuvemshop) | > 20 |
| Vendas atribuidas a creators / mes | > 500 |
| Campanhas com tracking de ROI ativo | > 25% |

#### Pilar 3: Growth Multi-plataforma

| Metrica | Target Q2 2026 |
|---------|---------------|
| Creators com TikTok conectado | > 500 |
| Campanhas multi-plataforma (IG + TikTok) | > 10% |
| MAU via PWA mobile | > 30% do total |

#### Pilar 4: Ampliar Moat

| Metrica | Target Q2 2026 |
|---------|---------------|
| Creators ativos em comunidades | Crescimento > 20% MoM |
| Automacoes ativas por marca | > 3 em media |
| Brand Canvas gerados | > 100 |
| NPS de creators | > 50 |

### Metricas de Plataforma

| Metrica | Descricao |
|---------|-----------|
| **MAU** (Monthly Active Users) | Usuarios ativos por mes (creators + empresas) |
| **Campanhas ativas** | Campanhas em andamento simultaneamente |
| **Deliverables entregues / mes** | Volume de entregas concluidas |
| **Retention 30d / 90d** | Retencao de empresas e creators |
| **Time to first campaign** | Tempo do cadastro ate primeira campanha publicada |

---

## 7. Riscos e Mitigacoes

### 7.1 BrandLovers (Risco ALTO)

**Ameaca**: maior plataforma brasileira, escala massiva (240k creators), stack de IA forte (GuardIAn + Whisper + Smart Match), investidores de peso (Endeavor, Will I Am), CreatorPay com 6k+ transacoes/dia.

**Mitigacao**:
- Focar em **comunidade/gamificacao** — onde BrandLovers e fraco (sem gamificacao, sem comunidade)
- Atender **todos os portes** — BrandLovers foca enterprise, deixando mid-market e PMEs descobertos
- **Instagram suite** — BrandLovers nao tem publishing, DM management, comments AI, hashtag tracking
- **Agilidade de startup** — vs estrutura corporativa com 57 funcionarios

### 7.2 Squid (Risco MEDIO-ALTO)

**Ameaca**: marca mais antiga do Brasil (10+ anos), 300k+ influenciadores, 70+ metricas de analise, machine learning para matching, suite juridica/contabil.

**Mitigacao**:
- **Turbulencia corporativa** (Locaweb → UNLK, rebranding) cria janela de oportunidade
- **Agilidade de startup** vs corporacao em reestruturacao
- **Gamificacao superior** — Squid nao tem sistema de pontos/badges/leaderboards
- **Instagram suite** — Squid nao tem publishing nem DM management

### 7.3 Inbazz (Risco MEDIO)

**Ameaca**: concorrente mais direto em comunidade de embaixadores no Brasil, integracao com Yampi/Nuvemshop, app mobile, gamificacao basica.

**Mitigacao**:
- **Gamificacao superior** — nosso sistema e ordens de magnitude mais completo
- **Instagram suite completa** — Inbazz nao tem
- **IA** — Brand Canvas, Smart Match, Content Review, Roteiros — Inbazz nao tem IA
- **Analytics mais profundo** — dashboards, metricas, reports

### 7.4 Superfiliate entrando no Brasil (Risco MEDIO)

**Ameaca**: se Superfiliate decidir entrar no mercado brasileiro, traz modelo all-in-one forte com co-branded landing pages, Shopify integration, Meta Ads Suite.

**Mitigacao**:
- **Integracoes locais** — Yampi, Nuvemshop, PIX, Assinafy (Superfiliate nao tem)
- **Conhecimento do mercado brasileiro** — nuances culturais, plataformas locais, compliance BR
- **Comunidade/gamificacao** — feature que Superfiliate nao tem
- **Precificacao local** — custos em BRL vs USD

### 7.5 Dependencia do Instagram (Risco MEDIO)

**Ameaca**: mudancas na API do Meta/Instagram podem quebrar funcionalidades core. Rate limits, mudancas de permissao, deprecacao de endpoints.

**Mitigacao**:
- **Diversificar para TikTok** (Pilar 3) — reduzir dependencia de uma unica plataforma
- **Dados locais primeiro** — hierarquia Local DB → Free Meta APIs → Apify
- **Object Storage proprio** — fotos de perfil salvas no GCS, nao dependem de CDN URLs
- **Monitorar changelog** da Meta API proativamente

### 7.6 Escala Tecnica (Risco BAIXO-MEDIO)

**Ameaca**: monolito de ~20k linhas de rotas, deploy manual, sem CI/CD.

**Mitigacao**:
- **S02 (atual)**: bug fixes e performance
- **S14**: buffer/polish para tech debt
- **Modularizacao continua**: novas features em `server/routes/` como modulos separados
- **Monitoramento**: adicionar observabilidade gradualmente

---

## Documentos Relacionados

- [Analise Competitiva](./competitor-analysis.md) — mapeamento de 11 concorrentes
- [Roadmap v3.0](./ROADMAP.md) — sprints e entregas planejadas
- [CHANGELOG](../CHANGELOG.md) — historico de versoes

---

*Documento vivo — atualizar conforme mercado e prioridades evoluem.*
