import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Link, useParams } from "wouter";
import { ArrowLeft, ArrowRight, Clock, TrendingUp, DollarSign, Users, Quote, ChevronRight, ChevronLeft, Play, Share2, Download, Menu, X, CheckCircle2, Sparkles, Target, Trophy, Zap, MessageCircle, ArrowUpRight } from "lucide-react";
import { GlowButton } from "@/components/ui/glow-button";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/public-header";
import { Footer } from "@/components/footer";
import { SEO, ArticleSchema, BreadcrumbSchema } from "@/components/seo";

function TurboPartnersBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="my-12 rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border border-emerald-500/20 relative"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="relative p-8 lg:p-10">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30 mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              AGÊNCIA DE PERFORMANCE
            </div>
            <h3 className="font-heading text-2xl lg:text-3xl font-black text-white mb-4">
              Quer resultados como esses para sua marca?
            </h3>
            <p className="text-zinc-300 mb-6 text-base">
              A Turbo Partners é a agência por trás deste case. Performance, comunicação, design e desenvolvimento digital integrados.
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                +350 clientes
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                R$225M+ gerado
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                4.2x ROI médio
              </span>
            </div>
            <a 
              href="https://turbopartners.com.br?utm_source=creatorconnect&utm_medium=case&utm_campaign=banner_parceiro" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg shadow-emerald-500/25"
            >
              Falar com a Turbo
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          <div className="flex-shrink-0 hidden lg:block">
            <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center border border-emerald-500/30 backdrop-blur-sm">
              <div className="text-center">
                <p className="text-4xl font-black text-white">4.2x</p>
                <p className="text-emerald-400 text-sm font-medium">ROI médio</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CreatorConnectBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="my-12 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/30 relative"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      <div className="relative p-8 lg:p-10">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-primary/20 to-violet-500/20 text-primary border border-primary/30 mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              PLATAFORMA CREATORCONNECT
            </div>
            <h3 className="font-heading text-2xl lg:text-3xl font-black text-foreground mb-4">
              Gerencie suas campanhas com creators
            </h3>
            <p className="text-muted-foreground mb-6 text-base">
              A mesma plataforma usada por essa marca. Encontre creators, gerencie entregas e acompanhe resultados em um só lugar.
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                50K+ Creators
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-500/10 text-violet-500 border border-violet-500/20">
                250+ Empresas
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                100% Grátis
              </span>
            </div>
            <Link href="/auth">
              <GlowButton className="bg-primary text-white hover:bg-primary/90 font-bold shadow-lg shadow-primary/25">
                Criar conta grátis
                <ArrowRight className="w-4 h-4 ml-2" />
              </GlowButton>
            </Link>
          </div>
          <div className="flex-shrink-0 hidden lg:block">
            <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center border border-primary/30 backdrop-blur-sm">
              <div className="text-center">
                <p className="text-4xl font-black text-primary">50K+</p>
                <p className="text-primary/70 text-sm font-medium">Creators</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const caseStudiesData: Record<string, {
  company: string;
  logo: string;
  industry: string;
  title: string;
  subtitle: string;
  heroImage: string;
  color: string;
  bgColor: string;
  readTime: string;
  metrics: { value: string; label: string; icon: any }[];
  quote: { text: string; author: string; role: string; avatar?: string };
  sections: { id: string; title: string; content: string[]; icon?: any }[];
  quickFire: { question: string; answer: string }[];
  related: string[];
  videos?: string[];
  timeline?: { phase: string; title: string; description: string }[];
  highlights?: string[];
}> = {
  "cristal-graffiti-ugc-moda": {
    company: "Cristal Graffiti",
    logo: "/attached_assets/logo-cristal-graffiti-moda-feminina-brasil.png",
    industry: "Moda",
    title: "Posts do próprio perfil como anúncio geraram 664% de crescimento",
    subtitle: "Uso de posts do próprio perfil como anúncio, anúncio de catálogo, criação de anúncios de conversão e campanha promocional Black Friday com creators.",
    heroImage: "/images/cases/cristal-graffiti-hero.png",
    color: "from-pink-500 to-rose-500",
    bgColor: "bg-pink-500",
    readTime: "4 min",
    metrics: [
      { value: "664%", label: "Crescimento faturamento", icon: TrendingUp },
      { value: "R$20,21", label: "CPA", icon: DollarSign },
      { value: "8,41", label: "ROAS", icon: TrendingUp },
    ],
    quote: {
      text: "226% de aumento na média de faturamento mensal em 2 meses de trabalho com a Turbo. O resultado mais expressivo que tivemos.",
      author: "Wagner",
      role: "Cristal Graffiti",
      avatar: "/attached_assets/logo-cristal-graffiti-moda-ugc.png"
    },
    highlights: [
      "Performance, Creators, Ecommerce, E-mail Marketing",
      "Uso de posts do próprio perfil como anúncio",
      "Uso de anúncio de catálogo",
      "Campanha promocional - Black Friday"
    ],
    timeline: [
      { phase: "Análise", title: "Mapeamento do Ecommerce", description: "Aumentar o faturamento do ecommerce e o alcance e reconhecimento da marca" },
      { phase: "Execução", title: "Posts como Anúncio", description: "Uso de posts do próprio perfil como anúncio + anúncio de catálogo" },
      { phase: "Black Friday", title: "Campanha Promocional", description: "Campanha Black Friday com creators gerando 664% de crescimento" },
    ],
    sections: [
      {
        id: "desafio",
        title: "O Desafio",
        icon: Target,
        content: [
          "A Cristal Graffiti tinha dois objetivos claros: aumentar o faturamento do ecommerce e aumentar o alcance e reconhecimento da marca.",
          "A marca de moda precisava de uma estratégia integrada que combinasse diferentes formatos de anúncio e canais de comunicação.",
          "O timing era crucial: a Black Friday se aproximava e era necessário preparar uma campanha promocional de alto impacto."
        ]
      },
      {
        id: "solucao",
        title: "Performance + Creators + Ecommerce",
        icon: Sparkles,
        content: [
          "Implementamos uma estratégia completa: Performance, Creators, Ecommerce e E-mail Marketing trabalhando de forma integrada.",
          "Transformamos posts do próprio perfil da marca em anúncios de alta conversão, aproveitando o engajamento orgânico já existente.",
          "Combinamos anúncios de catálogo com criação de anúncios de conversão pela Turbo, culminando em uma campanha promocional de Black Friday com creators."
        ]
      },
      {
        id: "resultados",
        title: "664% de Crescimento",
        icon: Trophy,
        content: [
          "Resultado do primeiro mês: 664% de crescimento do faturamento comparando nov/23 com out/23.",
          "CPA de apenas R$20,21 e ROAS de 8,41 - cada real investido retornou mais de 8 reais em vendas.",
          "Resultado mais expressivo: 226% de aumento na média de faturamento mensal em apenas 2 meses de trabalho com a Turbo."
        ]
      }
    ],
    quickFire: [
      {
        question: "O que fez a diferença nos resultados?",
        answer: "Usar posts do próprio perfil como anúncio. O conteúdo já tinha engajamento orgânico, então ao impulsioná-lo como anúncio, a conversão foi muito maior."
      },
      {
        question: "Como foi a campanha de Black Friday?",
        answer: "Combinamos creators com anúncios de catálogo e conversão. A sinergia entre esses canais gerou o pico de 664% de crescimento."
      }
    ],
    related: ["cacow-creators-veganos", "jui-comunidade-influencers", "oticas-paris-criativos-inteligentes"],
    videos: [
      "/attached_assets/66abe745afaa2b8c0a261b86_66d76b7a86b907756c6efc94_Moleton1_(1)_1766970674216.mp4"
    ]
  },
  "cacow-creators-veganos": {
    company: "Cacow",
    logo: "/attached_assets/logo-cacow-chocolates-artesanais-brasil.png",
    industry: "Wellness (Saudável)",
    title: "UGC creators com foco vegano consolidaram posicionamento da marca",
    subtitle: "Testes de ângulos de criativos, validação do ângulo vegano, UGC creators especializados, reformulação de banners e roteirização de criativos para própria base.",
    heroImage: "/images/cases/cacow-hero.png",
    color: "from-emerald-500 to-green-500",
    bgColor: "bg-emerald-500",
    readTime: "5 min",
    metrics: [
      { value: "400%", label: "Aumento faturamento", icon: TrendingUp },
      { value: "2,99→5,75", label: "ROAS", icon: DollarSign },
      { value: "200%", label: "Recorrência e LTV", icon: Users },
    ],
    quote: {
      text: "Chegamos no faturamento da casa de 6 dígitos antes do esperado pelo cliente. Consolidamos aumento de 400% no faturamento e 200% em recorrência e LTV.",
      author: "Rodrigo",
      role: "Cacow",
      avatar: "/attached_assets/avatar-rodrigo-fundador-cacow-chocolates.png"
    },
    highlights: [
      "Performance, E-mail Marketing, Account Manager, Creators",
      "Validação do ângulo vegano para os produtos",
      "UGC creators com foco em ângulo vegano",
      "Roteirização de criativos UGC para própria base"
    ],
    timeline: [
      { phase: "Fase 1", title: "Testes de Ângulos", description: "Testes de ângulos de criativos para encontrar o posicionamento ideal" },
      { phase: "Fase 2", title: "Validação Vegana", description: "Validação do ângulo vegano para os produtos com creators especializados" },
      { phase: "Fase 3", title: "Reformulação + LTV", description: "Reformulação de banners + E-mail marketing para recorrência e LTV" },
    ],
    sections: [
      {
        id: "desafio",
        title: "O Desafio",
        icon: Target,
        content: [
          "A Cacow enfrentava desafios em posicionamento da marca e definição do ângulo de criativos e comunicação.",
          "O objetivo era escalar o faturamento para a casa dos 6 dígitos e aumentar o ROAS das campanhas.",
          "Era necessário encontrar o ângulo certo de comunicação que ressoasse com o público-alvo e diferenciasse a marca."
        ]
      },
      {
        id: "solucao",
        title: "Estratégia Vegana + Creators",
        icon: Sparkles,
        content: [
          "Realizamos testes de ângulos de criativos até validar o ângulo vegano como o mais efetivo para os produtos.",
          "Recrutamos UGC creators com foco específico em ângulo vegano, reformulamos toda a comunicação dos banners e criativos.",
          "Implementamos E-mail marketing para manutenção da recorrência e LTV, além de roteirização de criativos UGC para a própria base."
        ]
      },
      {
        id: "resultados",
        title: "6 Dígitos Antes do Esperado",
        icon: Trophy,
        content: [
          "ROAS aumentou de 2,99 para 5,75 - quase dobrando o retorno sobre o investimento em ads.",
          "Chegamos no faturamento da casa de 6 dígitos antes do esperado pelo cliente.",
          "Consolidamos aumento de 400% no faturamento e 200% em recorrência e LTV."
        ]
      }
    ],
    quickFire: [
      {
        question: "Por que o ângulo vegano funcionou?",
        answer: "Testamos vários ângulos e o vegano foi o que mais ressoou. Quando encontramos o ângulo certo, reformulamos toda a comunicação em torno dele."
      },
      {
        question: "Como aumentaram a recorrência?",
        answer: "E-mail marketing estratégico + roteirização de UGC para a própria base. Mantivemos o cliente engajado pós-compra, aumentando LTV em 200%."
      }
    ],
    related: ["cristal-graffiti-ugc-moda", "jui-comunidade-influencers", "oticas-paris-criativos-inteligentes"],
    videos: [
      "/attached_assets/618da0947823662661595607_67866f49858aa064f7d2f6b4_cacow-natali_1766974978182.mp4"
    ]
  },
  "jui-comunidade-influencers": {
    company: "Jui",
    logo: "/attached_assets/logo-jui-suplementos-alimentares-brasil.png",
    industry: "Wellness (Saudável)",
    title: "Estratégia com influencers que gerou 1200% de crescimento",
    subtitle: "Assessoria de marketing, estratégia com influencers e campanhas focadas em funil que estabeleceram a marca e expandiram a base de clientes.",
    heroImage: "/images/cases/jui-hero.png",
    color: "from-orange-500 to-amber-500",
    bgColor: "bg-orange-500",
    readTime: "4 min",
    metrics: [
      { value: "1200%", label: "Aumento faturamento", icon: TrendingUp },
      { value: "✓", label: "Estabelecimento de marca", icon: Target },
      { value: "✓", label: "Crescimento de clientes", icon: Users },
    ],
    quote: {
      text: "Saímos da falta de presença forte no Instagram para uma marca estabelecida com crescimento exponencial de 1200% no faturamento.",
      author: "André",
      role: "Jui",
      avatar: "/attached_assets/avatar-andre-fundador-jui-suplementos.png"
    },
    highlights: [
      "Account Manager, Performance, E-mail Marketing, Blog Post, Sustentação, Creators",
      "Assessoria de marketing completa",
      "Estratégia com influencers",
      "Campanhas focadas em funil"
    ],
    timeline: [
      { phase: "Diagnóstico", title: "Análise de Presença", description: "Falta de presença forte no Instagram, dificuldade em escalar verba, necessidade de direcionamento" },
      { phase: "Estratégia", title: "Influencers + Funil", description: "Assessoria de marketing com estratégia com influencers e campanhas focadas em funil" },
      { phase: "Escala", title: "Estabelecimento de Marca", description: "Crescimento de 1200% no faturamento e estabelecimento de marca no mercado" },
    ],
    sections: [
      {
        id: "desafio",
        title: "O Desafio",
        icon: Target,
        content: [
          "A Jui enfrentava três desafios principais: falta de presença forte no Instagram, dificuldade em escalar verba de mídia e necessidade de direcionamento estratégico.",
          "Como marca do segmento Wellness (Saudável), precisava construir autoridade e confiança com seu público-alvo.",
          "A marca precisava de uma estratégia completa que combinasse diferentes canais e táticas de forma integrada."
        ]
      },
      {
        id: "solucao",
        title: "Assessoria + Influencers + Funil",
        icon: Sparkles,
        content: [
          "Implementamos uma estratégia completa: Account Manager, Performance, E-mail Marketing, Blog Post, Sustentação e Creators trabalhando de forma integrada.",
          "Desenvolvemos uma assessoria de marketing que deu direcionamento claro para todas as ações da marca.",
          "Criamos uma estratégia com influencers combinada com campanhas focadas em funil, otimizando cada etapa da jornada do cliente."
        ]
      },
      {
        id: "resultados",
        title: "1200% de Crescimento",
        icon: Trophy,
        content: [
          "O faturamento cresceu 1200% - um resultado extraordinário que transformou a operação da marca.",
          "A Jui conquistou o estabelecimento de marca no segmento Wellness, passando de desconhecida para referência.",
          "O crescimento de clientes foi sustentável, construído sobre uma base sólida de estratégia com influencers e campanhas de funil."
        ]
      }
    ],
    quickFire: [
      {
        question: "O que fez a diferença no resultado?",
        answer: "A combinação de assessoria de marketing com estratégia de influencers e funil. Cada canal alimentava o outro, criando um ciclo de crescimento."
      },
      {
        question: "Como escalaram a verba?",
        answer: "Com campanhas focadas em funil. Quando você tem métricas claras de cada etapa, fica mais fácil justificar e aumentar o investimento gradualmente."
      }
    ],
    related: ["cacow-creators-veganos", "oticas-paris-criativos-inteligentes", "cristal-graffiti-ugc-moda"],
    videos: []
  },
  "oticas-paris-criativos-inteligentes": {
    company: "Óticas Paris",
    logo: "/attached_assets/logo-oticas-paris-otica-brasil.png",
    industry: "Óticas",
    title: "Criativos variados com análise inteligente dobraram o faturamento",
    subtitle: "Produção de diversos criativos variando textos e elementos, CRO do site e construção de email marketing analisando óculos que estão no hype.",
    heroImage: "/images/cases/oticas-paris-hero.png",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500",
    readTime: "4 min",
    metrics: [
      { value: "R$672K→R$1.2M", label: "Faturamento", icon: TrendingUp },
      { value: "82%", label: "Crescimento", icon: TrendingUp },
      { value: "5 meses", label: "Período", icon: Users },
    ],
    quote: {
      text: "De R$672.109,86 para R$1.223.633,76 no mesmo período do ano seguinte. A produção de criativos variados com análise inteligente transformou nossos resultados.",
      author: "Ana",
      role: "Óticas Paris",
      avatar: "/attached_assets/avatar-ana-gestora-oticas-paris.png"
    },
    highlights: [
      "Performance, Blog Post, Creators, E-mail Marketing",
      "Produção de diversos criativos variando textos e elementos",
      "CRO do site",
      "Email marketing analisando óculos que estão no hype"
    ],
    timeline: [
      { phase: "Diagnóstico", title: "Análise de Gaps", description: "Poucos criativos, sem inteligência na hora de analisar dados, pouco aproveitamento de ads no Facebook/Instagram" },
      { phase: "Execução", title: "Criativos + CRO", description: "Produção de criativos variados + CRO do site + construção de email marketing" },
      { phase: "Resultado", title: "82% de Crescimento", description: "De R$672.109 (set/23-jan/24) para R$1.223.633 (set/24-jan/25)" },
    ],
    sections: [
      {
        id: "desafio",
        title: "O Desafio",
        icon: Target,
        content: [
          "A Óticas Paris tinha poucos criativos e faltava inteligência na hora de analisar os dados das campanhas.",
          "Havia pouco aproveitamento de ads no Facebook/Instagram, alguns pontos ruins no site e falta de disparos de emails.",
          "A marca precisava de uma estratégia completa que combinasse produção de conteúdo, otimização de conversão e automação."
        ]
      },
      {
        id: "solucao",
        title: "Criativos + CRO + Email Marketing",
        icon: Sparkles,
        content: [
          "Implementamos produção de diversos criativos variando textos e elementos que poderiam alavancar as vendas, sempre aprendendo com as variações.",
          "Realizamos CRO do site para melhorar a conversão e construímos email marketing analisando óculos que estão no hype.",
          "A estratégia completa incluiu Performance, Blog Post, Creators e E-mail Marketing trabalhando de forma integrada."
        ]
      },
      {
        id: "resultados",
        title: "De R$672K para R$1.2M",
        icon: Trophy,
        content: [
          "01/09/2023 a 31/01/2024: R$ 672.109,86 (Sem Turbo)",
          "01/09/2024 a 31/01/2025: R$ 1.223.633,76 (Com Turbo)",
          "Crescimento de 82% no mesmo período do ano seguinte, com a mesma base de clientes mas estratégia otimizada."
        ]
      }
    ],
    quickFire: [
      {
        question: "O que fez a diferença nos resultados?",
        answer: "Produzir criativos variados e analisar os dados com inteligência. Cada variação nos ensinou o que funciona, e usamos isso para produzir ainda melhor."
      },
      {
        question: "Como o CRO ajudou?",
        answer: "Corrigimos pontos ruins no site que estavam atrapalhando a conversão. Combinado com criativos melhores, o resultado foi 82% de crescimento."
      }
    ],
    related: ["cristal-graffiti-ugc-moda", "cacow-creators-veganos", "jui-comunidade-influencers"],
    videos: []
  }
};

const allCases = [
  { slug: "cristal-graffiti-ugc-moda", company: "Cristal Graffiti", title: "664% crescimento", color: "from-pink-500 to-rose-500", image: "/images/cases/cristal-graffiti-hero.png", metric: "664%" },
  { slug: "cacow-creators-veganos", company: "Cacow", title: "UGC vegano", color: "from-emerald-500 to-green-500", image: "/images/cases/cacow-hero.png", metric: "400%" },
  { slug: "jui-comunidade-influencers", company: "Jui", title: "1200% crescimento", color: "from-orange-500 to-amber-500", image: "/images/cases/jui-hero.png", metric: "1200%" },
  { slug: "oticas-paris-criativos-inteligentes", company: "Óticas Paris", title: "Criativos inteligentes", color: "from-blue-500 to-cyan-500", image: "/images/cases/oticas-paris-hero.png", metric: "59%" },
];

function AnimatedMetric({ value, delay = 0 }: { value: string; delay?: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, type: "spring", stiffness: 100 }}
    >
      {value}
    </motion.span>
  );
}

function VideoGallery({ videos, heroImage, color }: { videos: string[]; heroImage: string; color: string }) {
  const [activeVideo, setActiveVideo] = useState(0);
  
  if (!videos || videos.length === 0) return null;
  
  return (
    <motion.div
      id="videos"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-16"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
          <Play className="w-6 h-6 text-white fill-white" />
        </div>
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">
            Conteúdo dos Creators
          </h2>
          <p className="text-muted-foreground text-sm">Veja exemplos de UGC que geraram resultados</p>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Main Video */}
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-[9/16] shadow-2xl">
          <video
            key={activeVideo}
            src={videos[activeVideo]}
            controls
            autoPlay
            muted
            loop
            className="w-full h-full object-cover"
            poster={heroImage}
          />
          <div className={`absolute inset-0 bg-gradient-to-t ${color} opacity-10 pointer-events-none`} />
        </div>
        
        {/* Thumbnails */}
        {videos.length > 1 && (
          <div className="grid grid-cols-2 gap-4">
            {videos.map((video, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveVideo(i)}
                className={`relative aspect-[9/16] rounded-xl overflow-hidden border-2 transition-all ${
                  activeVideo === i ? 'border-primary shadow-lg shadow-primary/20' : 'border-border hover:border-primary/50'
                }`}
              >
                <video
                  src={video}
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className={`w-10 h-10 rounded-full ${activeVideo === i ? 'bg-primary' : 'bg-white/80'} flex items-center justify-center`}>
                    <Play className={`w-4 h-4 ${activeVideo === i ? 'text-white' : 'text-zinc-900'} fill-current`} />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function CaseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  
  const caseData = caseStudiesData[slug || ""];
  const currentIndex = allCases.findIndex(c => c.slug === slug);
  const prevCase = currentIndex > 0 ? allCases[currentIndex - 1] : allCases[allCases.length - 1];
  const nextCase = currentIndex < allCases.length - 1 ? allCases[currentIndex + 1] : allCases[0];

  useEffect(() => {
    if (!caseData || !slug) return;
    
    const existingScript = document.getElementById('case-jsonld');
    if (existingScript) existingScript.remove();

    const caseSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      "@id": `https://creatorconnect.com.br/cases/${slug}#case`,
      "headline": caseData.title,
      "description": caseData.subtitle,
      "image": caseData.heroImage,
      "author": { "@type": "Organization", "name": "CreatorConnect", "url": "https://creatorconnect.com.br" },
      "publisher": { "@type": "Organization", "name": "CreatorConnect", "url": "https://creatorconnect.com.br" },
      "dateModified": new Date().toISOString().split('T')[0],
      "articleSection": "Case de Sucesso",
      "inLanguage": "pt-BR"
    };

    const script = document.createElement('script');
    script.id = 'case-jsonld';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(caseSchema);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById('case-jsonld');
      if (scriptToRemove) scriptToRemove.remove();
    };
  }, [caseData, slug]);
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: caseData?.title || "Case de Sucesso",
        text: caseData?.subtitle || "Veja este case de sucesso da CreatorConnect",
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (!caseData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-20">
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
            <Target className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">Case não encontrado</h1>
          <p className="text-muted-foreground mb-6">
            O case que você está procurando não existe ou foi removido.
          </p>
          <Link href="/cases">
            <Button size="lg" data-testid="fallback-back-to-cases">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Ver todos os cases
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const relatedCases = allCases.filter(c => caseData.related.includes(c.slug));

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={`${caseData.company} | Case de Sucesso`}
        description={caseData.subtitle}
        keywords={`case ${caseData.company}, UGC resultados, ${caseData.industry}, marketing de influência, ROAS, ROI creators`}
        image={caseData.heroImage}
        url={`/case/${slug}`}
        type="article"
        article={{
          author: "CreatorConnect",
          section: "Case de Sucesso",
        }}
      />
      <ArticleSchema 
        title={caseData.title}
        description={caseData.subtitle}
        image={caseData.heroImage}
        url={`/case/${slug}`}
        author="CreatorConnect"
        datePublished="2026-01-15"
        section="Case de Sucesso"
      />
      <BreadcrumbSchema items={[
        { name: "Início", url: "/" },
        { name: "Cases de Sucesso", url: "/cases" },
        { name: caseData.company, url: `/case/${slug}` },
      ]} />
      <PublicHeader />
      
      {/* Hero Section - Immersive */}
      <section ref={heroRef} className="relative min-h-[80vh] overflow-hidden">
        {/* Background */}
        <motion.div style={{ y: heroY }} className="absolute inset-0">
          <div className={`absolute inset-0 bg-gradient-to-br ${caseData.color} opacity-30 z-10`} />
          <img
            src={caseData.heroImage}
            alt={`Case de sucesso marketing de influência ${caseData.company}`}
            className="w-full h-full object-cover scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background z-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background/50 z-20" />
        </motion.div>
        
        <motion.div 
          style={{ opacity: heroOpacity }}
          className="container mx-auto px-6 relative z-30 pt-32 pb-20 min-h-[80vh] flex flex-col justify-end"
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            {/* Back Button */}
            <Link href="/cases">
              <motion.button 
                whileHover={{ x: -4 }}
                className="flex items-center gap-2 text-foreground/70 hover:text-foreground mb-8 transition-colors"
                data-testid="back-to-cases"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Voltar para Cases</span>
              </motion.button>
            </Link>
            
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <motion.span 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-white/90 text-zinc-900 shadow-lg"
              >
                <Trophy className="w-4 h-4 text-amber-500" />
                CASE DE SUCESSO
              </motion.span>
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-primary/20 text-primary backdrop-blur-sm border border-primary/30">
                {caseData.industry}
              </span>
              <span className="flex items-center gap-1.5 text-foreground/70 text-sm font-medium">
                <Clock className="w-4 h-4" />
                {caseData.readTime} de leitura
              </span>
            </div>
            
            {/* Title */}
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black text-foreground mb-6 leading-tight">
              {caseData.title}
            </h1>
            
            <p className="text-foreground/80 text-xl lg:text-2xl max-w-3xl mb-10 leading-relaxed">
              {caseData.subtitle}
            </p>
            
            {/* Company Info */}
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-xl overflow-hidden p-2.5">
                {caseData.logo.startsWith("/") ? (
                  <img src={caseData.logo} alt={`Case de sucesso marketing de influência ${caseData.company}`} className="w-full h-full object-contain" />
                ) : (
                  <span className={`font-bold text-2xl bg-gradient-to-br ${caseData.color} bg-clip-text text-transparent`}>{caseData.logo}</span>
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground text-lg">{caseData.company}</p>
                <p className="text-foreground/60">{caseData.industry}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Metrics Bar - Animated */}
      <section className="py-10 bg-muted/50 dark:bg-zinc-950 border-y border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto px-6 relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {caseData.metrics.map((metric, i) => {
              const Icon = metric.icon;
              return (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="text-center relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                  <div className="relative p-6 rounded-2xl bg-card/50 dark:bg-zinc-900/50 border border-border">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>
                    <p className="font-heading text-5xl lg:text-6xl font-black text-foreground mb-2">
                      <AnimatedMetric value={metric.value} delay={i * 0.1} />
                    </p>
                    <p className="text-muted-foreground font-medium">{metric.label}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Highlights Strip */}
      {caseData.highlights && (
        <section className="py-8 border-b border-border">
          <div className="container mx-auto px-6">
            <div className="flex flex-wrap justify-center gap-4">
              {caseData.highlights.map((highlight, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20"
                >
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{highlight}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Content */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-4 gap-16">
            {/* Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Neste case
                </p>
                <nav className="space-y-1 mb-8">
                  {caseData.sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors py-2 px-3 rounded-lg hover:bg-primary/5"
                    >
                      {section.icon && <section.icon className="w-4 h-4" />}
                      {section.title}
                    </a>
                  ))}
                  {caseData.videos && caseData.videos.length > 0 && (
                    <a href="#videos" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors py-2 px-3 rounded-lg hover:bg-primary/5">
                      <Play className="w-4 h-4" />
                      Vídeos
                    </a>
                  )}
                  <a href="#quote" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors py-2 px-3 rounded-lg hover:bg-primary/5">
                    <MessageCircle className="w-4 h-4" />
                    Depoimento
                  </a>
                </nav>
                
                <div className="pt-6 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    Compartilhar
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                      onClick={handleShare}
                      data-testid="share-case-button"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartilhar
                    </Button>
                  </div>
                </div>
              </div>
            </aside>
            
            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Timeline */}
              {caseData.timeline && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="mb-16"
                >
                  <h2 className="font-heading text-2xl font-bold text-foreground mb-8 flex items-center gap-3">
                    <Zap className="w-6 h-6 text-primary" />
                    Jornada do Projeto
                  </h2>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent" />
                    <div className="space-y-8">
                      {caseData.timeline.map((phase, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.15 }}
                          className="relative pl-12"
                        >
                          <div className={`absolute left-0 w-8 h-8 rounded-full bg-gradient-to-br ${caseData.color} flex items-center justify-center text-white text-xs font-bold shadow-lg`}>
                            {i + 1}
                          </div>
                          <div className="p-6 rounded-xl bg-card dark:bg-zinc-900/50 border border-border">
                            <span className="text-xs font-semibold text-primary uppercase tracking-wider">{phase.phase}</span>
                            <h3 className="font-semibold text-foreground text-lg mt-1 mb-2">{phase.title}</h3>
                            <p className="text-muted-foreground">{phase.description}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Sections */}
              {caseData.sections.map((section, index) => {
                const Icon = section.icon || Target;
                const showTurboBanner = index === Math.floor(caseData.sections.length / 2) - 1;
                return (
                  <div key={section.id}>
                    <motion.div
                      id={section.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ delay: index * 0.1 }}
                      className="mb-16"
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${caseData.color} flex items-center justify-center shadow-lg`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="font-heading text-2xl lg:text-3xl font-bold text-foreground">
                          {section.title}
                        </h2>
                      </div>
                      <div className="space-y-5 pl-16">
                        {section.content.map((paragraph, i) => (
                          <p key={i} className="text-muted-foreground text-lg leading-relaxed">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </motion.div>
                    {showTurboBanner && <TurboPartnersBanner />}
                  </div>
                );
              })}

              {/* Videos Section */}
              <VideoGallery videos={caseData.videos || []} heroImage={caseData.heroImage} color={caseData.color} />

              {/* CreatorConnect CTA */}
              <CreatorConnectBanner />

              {/* Quote - Premium Design */}
              <motion.div
                id="quote"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="my-20"
              >
                <div className={`relative p-10 rounded-3xl bg-gradient-to-br ${caseData.color} overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                  
                  <div className="relative z-10">
                    <Quote className="w-16 h-16 text-white/30 mb-6" />
                    <blockquote>
                      <p className="text-2xl lg:text-3xl text-white font-medium leading-relaxed mb-8">
                        "{caseData.quote.text}"
                      </p>
                      <footer className="flex items-center gap-4">
                        {caseData.quote.avatar ? (
                          <img 
                            src={caseData.quote.avatar} 
                            alt={caseData.quote.author}
                            className="w-14 h-14 rounded-full bg-white p-1 object-contain"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold">
                            {caseData.quote.author.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-white text-lg">{caseData.quote.author}</p>
                          <p className="text-white/70">{caseData.quote.role}</p>
                        </div>
                      </footer>
                    </blockquote>
                  </div>
                </div>
              </motion.div>

              {/* Quick-fire Q&A */}
              <motion.div
                id="quickfire"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-16"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${caseData.color} flex items-center justify-center shadow-lg`}>
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="font-heading text-2xl font-bold text-foreground">
                      Perguntas Rápidas
                    </h2>
                    <p className="text-muted-foreground text-sm">Insights diretos do cliente</p>
                  </div>
                </div>
                <div className="space-y-6">
                  {caseData.quickFire.map((qa, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="p-6 rounded-2xl bg-card dark:bg-zinc-900/50 border border-border hover:border-primary/30 transition-colors"
                    >
                      <p className="font-semibold text-foreground text-lg mb-3 flex items-start gap-2">
                        <span className="text-primary">Q:</span>
                        {qa.question}
                      </p>
                      <p className="text-muted-foreground leading-relaxed pl-6">{qa.answer}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Case Navigation */}
      <section className="py-8 border-y border-border bg-muted/30 dark:bg-zinc-950">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <Link href={`/case/${prevCase.slug}`}>
              <motion.button
                whileHover={{ x: -4 }}
                className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group"
                data-testid="prev-case"
              >
                <ChevronLeft className="w-5 h-5 group-hover:text-primary" />
                <div className="text-left">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Anterior</p>
                  <p className="font-semibold">{prevCase.company}</p>
                </div>
              </motion.button>
            </Link>
            
            <Link href="/cases">
              <Button variant="outline" size="sm" className="rounded-full" data-testid="all-cases-nav">
                Ver todos
              </Button>
            </Link>
            
            <Link href={`/case/${nextCase.slug}`}>
              <motion.button
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group"
                data-testid="next-case"
              >
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Próximo</p>
                  <p className="font-semibold">{nextCase.company}</p>
                </div>
                <ChevronRight className="w-5 h-5 group-hover:text-primary" />
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-primary/10" />
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-8"
            >
              <Sparkles className="w-10 h-10 text-primary" />
            </motion.div>
            
            <h2 className="font-heading text-4xl sm:text-5xl font-black text-foreground mb-6">
              Quer resultados como esses?
            </h2>
            <p className="text-muted-foreground text-xl mb-10">
              Comece gratuitamente e transforme seu marketing de influência em resultados reais
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth">
                <GlowButton size="lg" className="h-14 px-10 bg-primary text-white hover:bg-primary/90 rounded-full font-semibold text-base" data-testid="cta-case-detail">
                  Começar Agora - É Grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </GlowButton>
              </Link>
              <Link href="/cases">
                <Button variant="outline" size="lg" className="h-14 px-10 rounded-full" data-testid="cta-more-cases">
                  Ver mais cases
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Related Cases */}
      <section className="py-20 bg-muted/30 dark:bg-zinc-950">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-heading text-3xl font-bold text-foreground mb-4">
              Cases relacionados
            </h2>
            <p className="text-muted-foreground">Explore mais histórias de sucesso</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {relatedCases.map((relatedCase, index) => (
              <Link key={relatedCase.slug} href={`/case/${relatedCase.slug}`}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="group relative overflow-hidden rounded-2xl bg-card dark:bg-zinc-900/80 border border-border hover:border-primary/40 transition-all cursor-pointer shadow-lg hover:shadow-2xl"
                  data-testid={`related-case-${relatedCase.slug}`}
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${relatedCase.color} opacity-40 z-10`} />
                    <motion.img
                      src={relatedCase.image}
                      alt={`Case UGC ${relatedCase.company} - CreatorConnect`}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-20" />
                    
                    <div className="absolute top-4 right-4 z-30">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-white text-zinc-900 shadow-lg`}>
                        {relatedCase.metric}
                      </span>
                    </div>
                    
                    <div className="absolute bottom-4 left-4 right-4 z-30">
                      <p className="text-white font-semibold text-lg">{relatedCase.company}</p>
                      <p className="text-white/70">{relatedCase.title}</p>
                    </div>
                  </div>
                  
                  <div className="p-5 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">Ler case completo</span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-2 transition-all" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
