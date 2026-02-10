import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { ArrowRight, Clock, Calendar, ChevronRight, TrendingUp, BookOpen, Lightbulb, Megaphone, Mail, Sparkles, Zap, BarChart3, Users, Star, Rocket, ExternalLink, Target, Palette, Code, MessageCircle, Award, Globe, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlowButton } from "@/components/ui/glow-button";
import { PublicHeader } from "@/components/public-header";
import { Footer } from "@/components/footer";
import { SEO } from "@/components/seo";

const categories = [
  { id: "todos", label: "Todos", icon: BookOpen },
  { id: "cases", label: "Cases de Sucesso", icon: TrendingUp },
  { id: "dicas", label: "Dicas & Estratégias", icon: Lightbulb },
  { id: "novidades", label: "Novidades", icon: Megaphone },
];

const blogPosts = [
  {
    slug: "o-que-e-ugc-guia-completo",
    type: "article",
    category: "dicas",
    title: "O que é UGC? Guia Completo para Marcas e Creators em 2025",
    excerpt: "Descubra como o User-Generated Content (UGC) está revolucionando o marketing digital brasileiro. Aprenda a criar, monetizar e escalar conteúdo autêntico.",
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=500&fit=crop",
    color: "from-violet-500 to-purple-500",
    date: "5 Fev 2025",
    readTime: "8 min",
    featured: true,
  },
  {
    slug: "cases-sucesso-marcas-brasileiras-ugc",
    type: "case",
    category: "cases",
    title: "5 Marcas Brasileiras que Explodiram com UGC: Cases de Sucesso",
    excerpt: "Conheça histórias reais de marcas brasileiras que multiplicaram seus resultados usando creators de UGC. De moda a alimentação, os números impressionam.",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=500&fit=crop",
    color: "from-emerald-500 to-green-500",
    date: "3 Fev 2025",
    readTime: "6 min",
    featured: true,
    company: "Marcas Brasileiras",
    metrics: { value: "664%", label: "Crescimento" },
  },
  {
    slug: "beautybrands-ugc-autentico",
    type: "case",
    category: "cases",
    title: "Como BeautyBrands conquistou milhões com UGC autêntico",
    excerpt: "Transformando criadores de conteúdo em embaixadores da marca para gerar vendas recordes.",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=500&fit=crop",
    color: "from-violet-500 to-purple-500",
    date: "15 Dez 2024",
    readTime: "4 min",
    featured: false,
    company: "BeautyBrands",
    metrics: { value: "170%", label: "Crescimento" },
  },
  {
    slug: "como-encontrar-criadores-certos",
    type: "article",
    category: "dicas",
    title: "Como encontrar os criadores certos para sua marca",
    excerpt: "Um guia completo para identificar e selecionar influenciadores que realmente combinam com seus valores e objetivos.",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=500&fit=crop",
    color: "from-blue-500 to-cyan-500",
    date: "12 Dez 2024",
    readTime: "6 min",
    featured: false,
  },
  {
    slug: "como-montar-portfolio-ugc-creator",
    type: "article",
    category: "dicas",
    title: "Como Montar um Portfólio de UGC Creator que Conquista Marcas",
    excerpt: "Seu portfólio é seu cartão de visita. Aprenda a montar um portfólio profissional que atrai marcas e gera oportunidades constantes de trabalho.",
    image: "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=800&h=500&fit=crop",
    color: "from-pink-500 to-rose-500",
    date: "1 Fev 2025",
    readTime: "7 min",
    featured: false,
  },
  {
    slug: "fashionbrand-vendas-criadores",
    type: "case",
    category: "cases",
    title: "FashionBrand multiplicou vendas com micro-influenciadores",
    excerpt: "Parcerias de longo prazo com micro-influenciadores geram mais resultados que campanhas pontuais.",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=500&fit=crop",
    color: "from-pink-500 to-rose-500",
    date: "10 Dez 2024",
    readTime: "5 min",
    featured: false,
    company: "FashionBrand Co.",
    metrics: { value: "3.4x", label: "ROI" },
  },
  {
    slug: "ugc-vs-marketing-influencia-diferencas",
    type: "article",
    category: "dicas",
    title: "UGC vs Marketing de Influência: Qual a Diferença e Quando Usar",
    excerpt: "UGC e marketing de influência são estratégias diferentes com objetivos distintos. Entenda quando usar cada um para maximizar seus resultados.",
    image: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&h=500&fit=crop",
    color: "from-blue-500 to-cyan-500",
    date: "28 Jan 2025",
    readTime: "6 min",
    featured: false,
  },
  {
    slug: "tendencias-influencer-marketing-2025",
    type: "article",
    category: "novidades",
    title: "Tendências de influencer marketing para 2025",
    excerpt: "O que esperar do mercado de marketing de influência no próximo ano e como se preparar.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop",
    color: "from-purple-500 to-indigo-500",
    date: "8 Dez 2024",
    readTime: "8 min",
    featured: false,
  },
  {
    slug: "techstartup-b2b-influencia",
    type: "case",
    category: "cases",
    title: "Como uma startup B2B usou influenciadores para crescer",
    excerpt: "TechStartup provou que marketing de influência funciona também no B2B.",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=500&fit=crop",
    color: "from-blue-500 to-cyan-500",
    date: "5 Dez 2024",
    readTime: "5 min",
    featured: false,
    company: "TechStartup",
    metrics: { value: "312%", label: "Leads" },
  },
  {
    slug: "como-ugc-reduz-cac-ecommerce",
    type: "article",
    category: "novidades",
    title: "Como UGC Reduz o CAC do seu E-commerce em até 45%",
    excerpt: "Entenda como o conteúdo gerado por creators pode derrubar seu Custo de Aquisição de Clientes e melhorar a performance dos seus anúncios pagos.",
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=500&fit=crop",
    color: "from-amber-500 to-orange-500",
    date: "20 Jan 2025",
    readTime: "7 min",
    featured: false,
  },
  {
    slug: "metricas-essenciais-campanhas",
    type: "article",
    category: "dicas",
    title: "As métricas essenciais para medir suas campanhas",
    excerpt: "Aprenda quais KPIs realmente importam e como usá-los para otimizar seus resultados.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop",
    color: "from-emerald-500 to-green-500",
    date: "3 Dez 2024",
    readTime: "7 min",
    featured: false,
  },
  {
    slug: "fitnessbrand-comunidade-engajada",
    type: "case",
    category: "cases",
    title: "FitnessBrand criou uma comunidade de milhares de embaixadores",
    excerpt: "Como transformar clientes em criadores de conteúdo autêntico.",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=500&fit=crop",
    color: "from-emerald-500 to-green-500",
    date: "1 Dez 2024",
    readTime: "4 min",
    featured: false,
    company: "FitnessBrand",
    metrics: { value: "890%", label: "Engajamento" },
  },
  {
    slug: "erros-comuns-parcerias",
    type: "article",
    category: "dicas",
    title: "7 erros comuns em parcerias com influenciadores",
    excerpt: "Evite esses erros e maximize o retorno das suas campanhas de marketing de influência.",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=500&fit=crop",
    color: "from-red-500 to-orange-500",
    date: "28 Nov 2024",
    readTime: "5 min",
    featured: false,
  },
];

function FeaturedPost({ post }: { post: typeof blogPosts[0] }) {
  const linkPath = `/blog/${post.slug}`;
  
  return (
    <Link href={linkPath}>
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="group relative rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/30 transition-all duration-300 cursor-pointer"
        data-testid={`featured-post-${post.slug}`}
      >
        <div className="grid md:grid-cols-2 gap-0">
          <div className="relative aspect-video md:aspect-auto">
            <div className={`absolute inset-0 bg-gradient-to-br ${post.color} opacity-20`} />
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {post.type === "case" && (
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-lg">
                  <TrendingUp className="w-3 h-3" />
                  CASE DE SUCESSO
                </span>
              </div>
            )}
          </div>
          
          <div className="p-8 flex flex-col justify-center">
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {post.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.readTime}
              </span>
            </div>
            
            <h2 className="font-heading text-2xl lg:text-3xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors">
              {post.title}
            </h2>
            
            <p className="text-muted-foreground mb-6 line-clamp-2">
              {post.excerpt}
            </p>
            
            {post.type === "case" && post.metrics && (
              <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/10 inline-flex items-center gap-3 w-fit">
                <span className="font-heading text-2xl font-black text-primary">{post.metrics.value}</span>
                <span className="text-sm text-muted-foreground">{post.metrics.label}</span>
              </div>
            )}
            
            <div>
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary font-semibold text-sm group-hover:bg-primary group-hover:text-white transition-all duration-300" data-testid={`button-read-featured-${post.slug}`}>
                Ler artigo completo
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}

function PostCard({ post, index }: { post: typeof blogPosts[0]; index: number }) {
  const linkPath = `/blog/${post.slug}`;
  const categoryLabels: Record<string, { label: string; bg: string; text: string }> = {
    cases: { label: "CASE", bg: "bg-emerald-500", text: "text-white" },
    dicas: { label: "DICAS & ESTRATÉGIAS", bg: "bg-violet-500", text: "text-white" },
    novidades: { label: "NOVIDADES", bg: "bg-amber-500", text: "text-white" },
  };
  const catStyle = categoryLabels[post.category] || { label: post.category, bg: "bg-primary", text: "text-white" };
  
  return (
    <Link href={linkPath}>
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        className="group rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer h-full flex flex-col"
        data-testid={`post-card-${post.slug}`}
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${post.color} opacity-20 group-hover:opacity-30 transition-opacity`} />
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute top-3 left-3 flex gap-2">
            {post.type === "case" ? (
              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${catStyle.bg} ${catStyle.text} shadow-lg`}>
                <TrendingUp className="w-3 h-3" />
                CASE
              </span>
            ) : (
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${catStyle.bg} ${catStyle.text} shadow-lg`}>
                {catStyle.label}
              </span>
            )}
          </div>
          {post.type === "case" && post.metrics && (
            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md rounded-lg px-3 py-1.5 border border-white/10">
              <span className="font-black text-emerald-400 text-lg">{post.metrics.value}</span>
              <span className="text-white/60 text-[10px] ml-1 uppercase">{post.metrics.label}</span>
            </div>
          )}
        </div>
        
        <div className="p-5 flex flex-col flex-grow">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Calendar className="w-3 h-3" />
            <span>{post.date}</span>
            <span className="text-muted-foreground/40">|</span>
            <Clock className="w-3 h-3" />
            <span>{post.readTime}</span>
          </div>
          
          <h3 className="font-heading font-bold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2 text-[15px] leading-snug">
            {post.title}
          </h3>
          
          <p className="text-muted-foreground text-sm line-clamp-2 flex-grow leading-relaxed">
            {post.excerpt}
          </p>
          
          <div className="mt-5 pt-4 border-t border-border/50">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all duration-300" data-testid={`button-read-${post.slug}`}>
              Ler artigo
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}

function AdBannerCC() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="col-span-full rounded-2xl relative overflow-hidden group"
      data-testid="ad-banner-cc"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-violet-950 via-purple-900 to-indigo-950" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,_var(--tw-gradient-stops))] from-violet-600/30 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,_var(--tw-gradient-stops))] from-emerald-500/15 via-transparent to-transparent" />
      
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-violet-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-full translate-y-1/2 -translate-x-1/3" />
      
      <div className="absolute top-6 right-12 w-3 h-3 rounded-full bg-violet-400/40 animate-pulse" />
      <div className="absolute bottom-8 right-24 w-2 h-2 rounded-full bg-emerald-400/40 animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute top-12 right-32 w-2 h-2 rounded-full bg-pink-400/30 animate-pulse" style={{ animationDelay: "2s" }} />

      <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
        <div className="flex-shrink-0 hidden md:flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex gap-3 ml-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/25">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Zap className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[11px] font-bold text-violet-300 uppercase tracking-wider mb-4">
            <Sparkles className="w-3 h-3" />
            Plataforma #1 de UGC no Brasil
          </div>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-3 leading-tight">
            Escale suas campanhas com{" "}
            <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent">creators qualificados</span>
          </h3>
          <p className="text-white/60 text-sm max-w-lg">
            Gerencie creators, campanhas de UGC e resultados em um só lugar.
          </p>
          <div className="flex items-center gap-4 sm:gap-6 mt-4 text-sm justify-center md:justify-start">
            <div className="flex items-center gap-2 text-emerald-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="font-semibold text-xs sm:text-sm">350+ marcas</span>
            </div>
            <div className="flex items-center gap-2 text-violet-400">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              <span className="font-semibold text-xs sm:text-sm">5.000+ creators</span>
            </div>
          </div>
        </div>

        <div className="flex flex-row sm:flex-col gap-3 w-full sm:w-auto">
          <Link href="/para-empresas" className="flex-1 sm:flex-none">
            <GlowButton className="rounded-full px-6 sm:px-8 py-3 text-sm font-bold whitespace-nowrap w-full" data-testid="ad-cc-empresas">
              Sou Marca
              <ArrowRight className="w-4 h-4 ml-2" />
            </GlowButton>
          </Link>
          <Link href="/para-criadores" className="flex-1 sm:flex-none">
            <Button variant="outline" className="rounded-full px-6 sm:px-8 py-3 text-sm font-bold border-white/20 text-white hover:bg-white/10 whitespace-nowrap w-full" data-testid="ad-cc-creators">
              Sou Creator
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function AdBannerTurbo() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="col-span-full rounded-2xl relative overflow-hidden group"
      data-testid="ad-banner-turbo"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_var(--tw-gradient-stops))] from-emerald-600/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />
      
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
      
      <div className="absolute top-4 left-4">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold bg-white/10 text-white/50 uppercase tracking-wider border border-white/5">
          Parceiro
        </span>
      </div>

      <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
        <div className="flex-shrink-0 hidden md:block">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/20 relative overflow-hidden">
              <img 
                src="/attached_assets/Icone_Turbo_Branca_1770642199382.jpg" 
                alt="Turbo Partners" 
                className="w-16 h-16 object-contain mix-blend-screen"
              />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <Rocket className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-4">
            <Zap className="w-3 h-3" />
            Aceleradora Digital
          </div>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-3 leading-tight">
            Sua vida mais fácil e rentável{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">no digital.</span>
          </h3>
          <p className="text-white/50 text-sm max-w-lg mb-4">
            Performance, Comunicação, Design e Desenvolvimento — tudo que seu negócio precisa para escalar.
          </p>
          
          <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-white/70 text-xs font-medium">Performance</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <MessageCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-white/70 text-xs font-medium">Comunicação</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <Palette className="w-3.5 h-3.5 text-pink-400" />
              <span className="text-white/70 text-xs font-medium">Design</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <Code className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-white/70 text-xs font-medium">Dev</span>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-4 text-xs justify-center md:justify-start text-white/40">
            <span><strong className="text-emerald-400 text-sm">350+</strong> clientes turbinados</span>
            <span><strong className="text-cyan-400 text-sm">R$225M+</strong> faturamento gerado</span>
          </div>
        </div>

        <div className="flex-shrink-0">
          <a href="https://turbopartners.com.br?utm_source=creatorconnect&utm_medium=blog&utm_campaign=banner_parceiro" target="_blank" rel="noopener noreferrer">
            <Button className="rounded-full px-8 py-3 text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 whitespace-nowrap" data-testid="ad-turbo-cta">
              Turbinar resultados
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </a>
        </div>
      </div>
    </motion.div>
  );
}

function CtaBanner({ variant = "platform" }: { variant?: "platform" | "creators" | "newsletter" }) {
  if (variant === "creators") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="col-span-full rounded-2xl relative overflow-hidden"
        data-testid="cta-banner-creators"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_50%,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-white/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-400/20 to-transparent rounded-full translate-y-1/2 -translate-x-1/4" />
        
        <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center gap-5 md:gap-6">
          <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <Award className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white mb-2">
              Comece a monetizar seu conteúdo agora
            </h3>
            <p className="text-white/80 text-sm">
              Cadastro gratuito. Receba oportunidades de marcas e ganhe por cada conteúdo aprovado.
            </p>
          </div>
          <Link href="/para-criadores" className="w-full sm:w-auto">
            <Button className="bg-white text-emerald-700 hover:bg-white/90 font-bold rounded-full px-8 py-3 whitespace-nowrap shadow-xl shadow-black/10 text-sm w-full sm:w-auto" data-testid="cta-creators-signup">
              Criar conta grátis
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  if (variant === "newsletter") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="col-span-full rounded-2xl relative overflow-hidden"
        data-testid="cta-banner-newsletter"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,_var(--tw-gradient-stops))] from-pink-500/20 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-white/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/4" />
        
        <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center gap-5 md:gap-6">
          <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <Mail className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white mb-2">
              Newsletter semanal de UGC & Marketing
            </h3>
            <p className="text-white/80 text-sm">
              Cases reais, dicas exclusivas e tendências. Zero spam.
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input
              type="email"
              placeholder="seu@email.com"
              className="flex-1 md:w-56 px-4 sm:px-5 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:border-white/40 backdrop-blur-sm"
              data-testid="input-newsletter-inline"
            />
            <Button className="bg-white text-violet-700 hover:bg-white/90 font-bold rounded-full px-5 sm:px-6 whitespace-nowrap shadow-xl shadow-black/10 text-sm" data-testid="button-subscribe-inline">
              Assinar
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="col-span-full rounded-2xl relative overflow-hidden"
      data-testid="cta-banner-platform"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-violet-700 via-purple-600 to-violet-800" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,_var(--tw-gradient-stops))] from-violet-400/20 via-transparent to-transparent" />
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-white/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-400/20 to-transparent rounded-full translate-y-1/2 -translate-x-1/4" />
      
      <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center gap-5 md:gap-6">
        <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
          <Rocket className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white mb-2">
            Conecte sua marca com os melhores creators
          </h3>
          <p className="text-white/80 text-sm">
            Plataforma completa para campanhas de UGC, comunidades de creators e resultados mensuráveis.
          </p>
        </div>
        <Link href="/para-empresas" className="w-full sm:w-auto">
          <GlowButton className="rounded-full px-8 py-3 text-sm font-bold whitespace-nowrap w-full sm:w-auto" data-testid="cta-platform-signup">
            Começar agora
            <ArrowRight className="w-4 h-4 ml-2" />
          </GlowButton>
        </Link>
      </div>
    </motion.div>
  );
}

const realCaseStudies = [
  {
    slug: "cristal-graffiti-ugc-moda",
    company: "Cristal Graffiti",
    title: "Posts do próprio perfil como anúncio geraram 664% de crescimento",
    description: "Uso de posts do próprio perfil como anúncio, anúncio de catálogo, criação de anúncios de conversão e campanha promocional Black Friday com creators.",
    image: "/images/cases/cristal-graffiti-hero.png",
    metricValue: "664%",
    metricLabel: "Crescimento",
  },
  {
    slug: "cacow-creators-veganos",
    company: "Cacow",
    title: "UGC creators com foco vegano consolidaram posicionamento da marca",
    description: "Testes de ângulos de criativos, validação do ângulo vegano, UGC creators especializados.",
    image: "/images/cases/cacow-hero.png",
    metricValue: "400%",
    metricLabel: "Faturamento",
  },
  {
    slug: "jui-comunidade-influencers",
    company: "Jui",
    title: "Estratégia com influencers que gerou 1200% de crescimento",
    description: "Assessoria de marketing, estratégia com influencers e campanhas focadas em funil.",
    image: "/images/cases/jui-hero.png",
    metricValue: "1200%",
    metricLabel: "Crescimento",
  },
  {
    slug: "oticas-paris-criativos-inteligentes",
    company: "Óticas Paris",
    title: "Criativos variados com análise inteligente dobraram o faturamento",
    description: "Produção de diversos criativos variando textos e elementos, CRO do site e email marketing.",
    image: "/images/cases/oticas-paris-hero.png",
    metricValue: "82%",
    metricLabel: "Crescimento",
  },
];

function CaseHighlightCard({ caseItem, isCarousel = false }: { caseItem: typeof realCaseStudies[0]; isCarousel?: boolean }) {
  return (
    <Link href={`/case/${caseItem.slug}`}>
      <motion.div
        initial={isCarousel ? false : { opacity: 0, y: 20 }}
        whileInView={isCarousel ? undefined : { opacity: 1, y: 0 }}
        viewport={isCarousel ? undefined : { once: true }}
        className="group relative rounded-2xl overflow-hidden cursor-pointer h-full"
        data-testid={`case-highlight-${caseItem.slug}`}
      >
        <div className={`relative ${isCarousel ? 'aspect-[3/4]' : 'aspect-[4/3]'}`}>
          <img
            src={caseItem.image}
            alt={caseItem.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-lg">
              <TrendingUp className="w-3 h-3" />
              CASE
            </span>
          </div>
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2 text-center border border-white/10">
            <p className="text-2xl font-black text-emerald-400">{caseItem.metricValue}</p>
            <p className="text-[10px] text-white/80 uppercase tracking-wider font-medium">{caseItem.metricLabel}</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1.5">{caseItem.company}</p>
            <h3 className={`text-white font-bold leading-tight group-hover:text-emerald-300 transition-colors ${isCarousel ? 'text-xl' : 'text-lg line-clamp-2'}`}>
              {caseItem.title}
            </h3>
            <p className={`text-white/70 text-sm mt-2 ${isCarousel ? 'line-clamp-2' : 'line-clamp-1'}`}>{caseItem.description}</p>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function CasesCarousel({ cases }: { cases: typeof realCaseStudies }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(((index % cases.length) + cases.length) % cases.length);
  }, [cases.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      goTo(diff > 0 ? currentIndex + 1 : currentIndex - 1);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => goTo(currentIndex + 1), 5000);
    return () => clearInterval(timer);
  }, [currentIndex, goTo]);

  return (
    <div className="relative">
      <div
        className="overflow-hidden rounded-2xl"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <CaseHighlightCard caseItem={cases[currentIndex]} isCarousel />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-center gap-3 mt-4">
        <button
          onClick={() => goTo(currentIndex - 1)}
          className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
          data-testid="case-carousel-prev"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex gap-1.5">
          {cases.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex ? 'w-6 bg-emerald-500' : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              data-testid={`case-carousel-dot-${i}`}
            />
          ))}
        </div>
        <button
          onClick={() => goTo(currentIndex + 1)}
          className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
          data-testid="case-carousel-next"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [email, setEmail] = useState("");
  
  const filteredPosts = selectedCategory === "todos"
    ? blogPosts
    : blogPosts.filter(p => p.category === selectedCategory);
  
  const allFeatured = filteredPosts.filter(p => p.featured);
  const featuredPosts = allFeatured.slice(0, 1);
  const regularPosts = [...allFeatured.slice(1), ...filteredPosts.filter(p => !p.featured)];

  const renderPostsWithAds = () => {
    const items: React.ReactNode[] = [];
    regularPosts.forEach((post, index) => {
      items.push(<PostCard key={post.slug} post={post} index={index} />);
      if (index === 2) {
        items.push(<AdBannerCC key="ad-cc" />);
      }
      if (index === 5) {
        items.push(<CtaBanner key="cta-creators" variant="creators" />);
      }
      if (index === 8) {
        items.push(<AdBannerTurbo key="ad-turbo" />);
      }
    });
    if (regularPosts.length > 0 && regularPosts.length <= 3) {
      items.push(<AdBannerCC key="ad-cc-fallback" />);
    }
    if (regularPosts.length > 3) {
      items.push(<CtaBanner key="cta-newsletter" variant="newsletter" />);
    }
    return items;
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Blog | CreatorConnect"
        description="Cases de sucesso, dicas práticas e as últimas novidades sobre marketing de influência e UGC. Aprenda como crescer com criadores de conteúdo."
        keywords="blog ugc, marketing de influência, cases de sucesso, dicas creators, ugc brasil"
      />
      <PublicHeader />

      <section className="pt-28 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/40 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-violet-600/15 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-600/10 via-transparent to-transparent" />
        
        <div className="absolute top-20 left-[10%] w-20 h-20 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center animate-pulse">
          <Sparkles className="w-8 h-8 text-violet-400/50" />
        </div>
        <div className="absolute top-32 right-[15%] w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center animate-bounce" style={{ animationDuration: "3s" }}>
          <BarChart3 className="w-6 h-6 text-emerald-400/50" />
        </div>
        <div className="absolute bottom-20 left-[20%] w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center animate-pulse" style={{ animationDelay: "1s" }}>
          <Star className="w-5 h-5 text-amber-400/50" />
        </div>
        <div className="absolute top-40 left-[5%] w-2 h-2 rounded-full bg-violet-400/30" />
        <div className="absolute top-28 right-[25%] w-3 h-3 rounded-full bg-emerald-400/30" />
        <div className="absolute bottom-32 right-[10%] w-2 h-2 rounded-full bg-amber-400/30" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-400 border border-violet-500/25 mb-6">
              <BookOpen className="w-4 h-4" />
              BLOG & RECURSOS
            </span>
            
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black text-foreground mb-6 leading-tight">
              Insights para{" "}
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
                crescer com criadores
              </span>
            </h1>
            
            <p className="text-muted-foreground text-lg lg:text-xl max-w-2xl mx-auto mb-10">
              Cases de sucesso, dicas práticas e as últimas novidades sobre marketing de influência e UGC
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="max-w-xl mx-auto"
            >
              <div className="flex gap-2 p-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border shadow-xl shadow-violet-500/5">
                <div className="flex items-center pl-4 text-muted-foreground">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Receba conteúdo exclusivo no seu email"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground focus:outline-none px-2 py-2"
                  data-testid="input-hero-email"
                />
                <GlowButton
                  className="rounded-full px-6 text-sm font-semibold"
                  data-testid="button-hero-subscribe"
                >
                  Assinar grátis
                </GlowButton>
              </div>
              <p className="text-xs text-muted-foreground/60 mt-3">
                Sem spam. Cancele quando quiser.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-4 border-b border-border sticky top-16 bg-background/95 backdrop-blur-sm z-20">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide justify-start sm:justify-center pb-1 -mb-1">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="rounded-full flex-shrink-0"
                  data-testid={`filter-${category.id}`}
                >
                  <Icon className="w-4 h-4 mr-1.5" />
                  {category.label}
                </Button>
              );
            })}
          </div>
        </div>
      </section>

      {featuredPosts.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <h2 className="font-heading text-2xl font-bold text-foreground">
                Em destaque
              </h2>
            </motion.div>
            
            <div className="space-y-8">
              {featuredPosts.map((post) => (
                <FeaturedPost key={post.slug} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}

      {selectedCategory !== "cases" && (
        <section className="py-16 border-t border-border">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center justify-between mb-10"
            >
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 mb-3">
                  <TrendingUp className="w-3 h-3" />
                  CASES DE SUCESSO
                </span>
                <h2 className="font-heading text-3xl lg:text-4xl font-bold text-foreground">
                  Resultados reais de marcas reais
                </h2>
                <p className="text-muted-foreground mt-2">Inspire-se com empresas que escalaram usando creators de UGC</p>
              </div>
              <Link href="/cases">
                <Button variant="outline" className="hidden sm:flex rounded-full" data-testid="link-all-cases-top">
                  Ver todos
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
            
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {realCaseStudies.map((caseItem) => (
                <CaseHighlightCard key={caseItem.slug} caseItem={caseItem} />
              ))}
            </div>

            <div className="sm:hidden">
              <CasesCarousel cases={realCaseStudies} />
            </div>

            <div className="flex justify-center mt-8 sm:hidden">
              <Link href="/cases">
                <Button variant="outline" className="rounded-full" data-testid="link-all-cases-mobile">
                  Ver todos os cases
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="py-16 bg-muted/30 dark:bg-zinc-950">
        <div className="container mx-auto px-6">
          {regularPosts.length > 0 ? (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex items-center justify-between mb-8"
              >
                <div>
                  <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
                    {selectedCategory === "todos" ? "Últimos artigos" : categories.find(c => c.id === selectedCategory)?.label}
                  </h2>
                  <p className="text-muted-foreground">
                    {filteredPosts.length} {filteredPosts.length === 1 ? "artigo" : "artigos"} encontrados
                  </p>
                </div>
              </motion.div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderPostsWithAds()}
              </div>
            </>
          ) : filteredPosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <p className="text-muted-foreground text-lg mb-4">
                Nenhum artigo encontrado para "{categories.find(c => c.id === selectedCategory)?.label}"
              </p>
              <Button 
                variant="outline" 
                onClick={() => setSelectedCategory("todos")}
                data-testid="clear-filter"
              >
                Ver todos os artigos
              </Button>
            </motion.div>
          ) : null}
        </div>
      </section>

      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Fique por dentro das novidades
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Receba semanalmente dicas, cases e tendências sobre UGC e marketing de influência
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="seu@email.com"
                className="flex-1 px-5 py-3 rounded-full bg-card border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                data-testid="input-newsletter-email"
              />
              <GlowButton className="rounded-full px-8" data-testid="button-subscribe">
                Assinar grátis
              </GlowButton>
            </div>
            
            <p className="text-xs text-muted-foreground/60 mt-4">
              Sem spam. Cancele quando quiser.
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
