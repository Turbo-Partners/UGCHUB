import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, Play, TrendingUp, Users, DollarSign, Clock, ChevronRight, Sparkles, Trophy, Target, Zap } from "lucide-react";
import { GlowButton } from "@/components/ui/glow-button";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/public-header";
import { Footer } from "@/components/footer";
import { SEO, BreadcrumbSchema } from "@/components/seo";

const caseStudies = [
  {
    slug: "cristal-graffiti-ugc-moda",
    company: "Cristal Graffiti",
    owner: "Wagner",
    logo: "/attached_assets/logo-cristal-graffiti-moda-feminina-brasil.png",
    industry: "Moda",
    title: "Posts do próprio perfil como anúncio geraram 664% de crescimento",
    description: "Uso de posts do próprio perfil como anúncio, anúncio de catálogo, criação de anúncios de conversão e campanha promocional Black Friday com creators.",
    image: "/images/cases/cristal-graffiti-hero.png",
    color: "from-pink-500 to-rose-500",
    bgColor: "bg-pink-500",
    metrics: [
      { value: "664%", label: "Crescimento faturamento", icon: TrendingUp },
      { value: "R$20,21", label: "CPA", icon: DollarSign },
      { value: "8,41", label: "ROAS", icon: TrendingUp },
    ],
    featured: true,
  },
  {
    slug: "cacow-creators-veganos",
    company: "Cacow",
    owner: "Rodrigo",
    logo: "/attached_assets/logo-cacow-chocolates-artesanais-brasil.png",
    industry: "Wellness (Saudável)",
    title: "UGC creators com foco vegano consolidaram posicionamento da marca",
    description: "Testes de ângulos de criativos, validação do ângulo vegano, UGC creators especializados, reformulação de banners e roteirização de criativos para própria base.",
    image: "/images/cases/cacow-hero.png",
    color: "from-emerald-500 to-green-500",
    bgColor: "bg-emerald-500",
    metrics: [
      { value: "400%", label: "Aumento faturamento", icon: TrendingUp },
      { value: "2,99→5,75", label: "ROAS", icon: DollarSign },
      { value: "200%", label: "Recorrência e LTV", icon: Users },
    ],
    featured: true,
  },
  {
    slug: "jui-comunidade-influencers",
    company: "Jui",
    owner: "Andre",
    logo: "/attached_assets/logo-jui-suplementos-alimentares-brasil.png",
    industry: "Wellness (Saudável)",
    title: "Estratégia com influencers que gerou 1200% de crescimento",
    description: "Assessoria de marketing, estratégia com influencers e campanhas focadas em funil que estabeleceram a marca e expandiram a base de clientes.",
    image: "/images/cases/jui-hero.png",
    color: "from-orange-500 to-amber-500",
    bgColor: "bg-orange-500",
    metrics: [
      { value: "1200%", label: "Aumento faturamento", icon: TrendingUp },
      { value: "✓", label: "Estabelecimento de marca", icon: Target },
      { value: "✓", label: "Crescimento de clientes", icon: Users },
    ],
    featured: true,
  },
  {
    slug: "oticas-paris-criativos-inteligentes",
    company: "Óticas Paris",
    owner: "Ana",
    logo: "/attached_assets/logo-oticas-paris-otica-brasil.png",
    industry: "Óticas",
    title: "Criativos variados com análise inteligente dobraram o faturamento",
    description: "Produção de diversos criativos variando textos e elementos, CRO do site e construção de email marketing analisando óculos que estão no hype.",
    image: "/images/cases/oticas-paris-hero.png",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500",
    metrics: [
      { value: "82%", label: "Crescimento", icon: TrendingUp },
      { value: "5 meses", label: "Período", icon: Clock },
    ],
    featured: true,
  },
];

const industries = ["Todos", "Moda", "Wellness (Saudável)", "Óticas"];

const stats = [
  { value: "R$ 15M+", label: "Pagos a criadores", icon: DollarSign },
  { value: "250+", label: "Empresas ativas", icon: Users },
  { value: "4.2x", label: "ROI médio", icon: TrendingUp },
  { value: "50K+", label: "Creators na base", icon: Sparkles },
];

function AnimatedNumber({ value, delay = 0 }: { value: string; delay?: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, type: "spring", stiffness: 100 }}
    >
      {value}
    </motion.span>
  );
}

function HeroCase({ caseStudy, index }: { caseStudy: typeof caseStudies[0]; index: number }) {
  const isEven = index % 2 === 0;
  
  return (
    <Link href={`/case/${caseStudy.slug}`}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
        className="group relative"
        data-testid={`hero-case-${caseStudy.slug}`}
      >
        <div className="flex flex-col lg:flex-row rounded-3xl overflow-hidden bg-card dark:bg-zinc-900/80 border border-border dark:border-zinc-800 hover:border-primary/40 transition-all duration-500">
          <div className={`relative aspect-[16/9] lg:aspect-auto lg:w-1/2 overflow-hidden ${!isEven ? 'lg:order-2' : ''}`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${caseStudy.color} opacity-40 z-10`} />
            <motion.img
              src={caseStudy.image}
              alt={`Case de sucesso UGC ${caseStudy.company} - ${caseStudy.industry}`}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.6 }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-20" />
            
            <motion.div 
              className="absolute top-6 left-6 z-30"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-white/95 text-zinc-900 shadow-lg backdrop-blur-sm">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                CASE DE SUCESSO
              </span>
            </motion.div>
            
            <motion.div 
              className="absolute bottom-6 left-6 right-6 z-30"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-end justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-xl overflow-hidden p-1.5">
                      {caseStudy.logo.startsWith("/") ? (
                        <img src={caseStudy.logo} alt={`Case de sucesso UGC ${caseStudy.company} - ${caseStudy.industry}`} className="w-full h-full object-contain" />
                      ) : (
                        <span className={`font-bold text-lg bg-gradient-to-br ${caseStudy.color} bg-clip-text text-transparent`}>{caseStudy.logo}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{caseStudy.company}</p>
                      <p className="text-white/60 text-sm">{caseStudy.industry}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-heading text-5xl font-black text-white drop-shadow-lg`}>
                    {caseStudy.metrics[0].value}
                  </p>
                  <p className="text-white/80 text-sm font-medium">{caseStudy.metrics[0].label}</p>
                </div>
              </div>
            </motion.div>
          </div>
          
          <div className={`p-5 lg:p-10 flex flex-col justify-center lg:w-1/2 ${!isEven ? 'lg:order-1' : ''}`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="font-heading text-2xl lg:text-3xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors leading-tight">
                {caseStudy.title}
              </h3>
              
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {caseStudy.description}
              </p>
              
              <div className="grid grid-cols-3 gap-2 mb-8">
                {caseStudy.metrics.map((metric, i) => {
                  const Icon = metric.icon;
                  return (
                    <motion.div 
                      key={metric.label}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="text-center p-3 rounded-xl bg-muted/50 dark:bg-zinc-800/50"
                    >
                      <Icon className="w-4 h-4 text-primary mx-auto mb-1" />
                      <p className="font-heading text-lg lg:text-xl font-bold text-foreground">{metric.value}</p>
                      <p className="text-muted-foreground text-[11px] lg:text-xs">{metric.label}</p>
                    </motion.div>
                  );
                })}
              </div>
              
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 text-primary font-semibold group-hover:bg-primary group-hover:text-white transition-all">
                <Play className="w-5 h-5 fill-current" />
                <span>Ver história completa</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export default function CasesPage() {
  const [selectedIndustry, setSelectedIndustry] = useState("Todos");
  const heroRef = useRef(null);
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  
  const filteredCases = selectedIndustry === "Todos" 
    ? caseStudies 
    : caseStudies.filter(c => c.industry === selectedIndustry);

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Cases de Sucesso | Resultados reais com UGC"
        description="Veja como marcas como Cristal Graffiti, Cacow e Óticas Paris cresceram até 664% com marketing de influência e UGC. Cases reais com métricas comprovadas."
        keywords="cases de sucesso, UGC resultados, marketing de influência cases, ROAS influenciadores, ROI creators"
        url="/cases"
      />
      <BreadcrumbSchema items={[
        { name: "Início", url: "/" },
        { name: "Cases de Sucesso", url: "/cases" },
      ]} />
      <PublicHeader />
      
      <section ref={heroRef} className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-primary/5 to-transparent" />
          <motion.div 
            className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
            animate={{ 
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"
            animate={{ 
              x: [0, -30, 0],
              y: [0, -50, 0],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="container mx-auto px-6 relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-5xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20 mb-8"
            >
              <Sparkles className="w-4 h-4" />
              <span>CASES DE SUCESSO REAIS</span>
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            </motion.div>
            
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-black text-foreground mb-6 leading-tight">
              Resultados que{" "}
              <span className="relative">
                <span className="bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
                  transformam
                </span>
                <motion.span 
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary to-purple-500 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                />
              </span>
              {" "}negócios
            </h1>
            
            <p className="text-muted-foreground text-xl lg:text-2xl max-w-3xl mx-auto mb-12 leading-relaxed">
              Descubra como marcas reais multiplicaram seus resultados com 
              <span className="text-foreground font-semibold"> UGC creators </span>
              e estratégias de influência autênticas
            </p>
            
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative p-6 rounded-2xl bg-card/50 dark:bg-zinc-900/50 border border-border dark:border-zinc-800 backdrop-blur-sm">
                      <Icon className="w-6 h-6 text-primary mb-3 mx-auto" />
                      <p className="font-heading text-3xl lg:text-4xl font-black text-foreground">
                        <AnimatedNumber value={stat.value} delay={0.6 + i * 0.1} />
                      </p>
                      <p className="text-muted-foreground text-sm mt-1">{stat.label}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      <section className="py-6 border-y border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x flex-nowrap">
            {industries.map((industry) => (
              <motion.button
                key={industry}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedIndustry(industry)}
                className={`flex-shrink-0 snap-center px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  selectedIndustry === industry 
                    ? "bg-primary text-white shadow-lg shadow-primary/25" 
                    : "bg-muted/50 dark:bg-zinc-800/50 text-foreground hover:bg-primary/10 border border-border"
                }`}
                data-testid={`filter-${industry.toLowerCase().replace(/\s+/g, '-').replace(/&/g, '')}`}
              >
                {industry === "Todos" && <Target className="w-4 h-4 inline mr-2" />}
                {industry}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-foreground mb-4">
              {selectedIndustry === "Todos" ? "Todos os Cases" : `Cases de ${selectedIndustry}`}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {filteredCases.length} {filteredCases.length === 1 ? 'história' : 'histórias'} de transformação com creators e UGC
            </p>
          </motion.div>
          
          <div className="space-y-12">
            {filteredCases.map((caseStudy, index) => (
              <HeroCase key={caseStudy.slug} caseStudy={caseStudy} index={index} />
            ))}
          </div>
          
          {filteredCases.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
                <Target className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg mb-6">
                Nenhum case encontrado para "{selectedIndustry}"
              </p>
              <Button 
                variant="outline" 
                onClick={() => setSelectedIndustry("Todos")}
                className="rounded-full"
                data-testid="clear-filter"
              >
                Ver todos os cases
              </Button>
            </motion.div>
          )}
        </div>
      </section>

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
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-8"
            >
              <Zap className="w-10 h-10 text-primary" />
            </motion.div>
            
            <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black text-foreground mb-6">
              Pronto para ser o{" "}
              <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                próximo case
              </span>
              ?
            </h2>
            
            <p className="text-muted-foreground text-xl mb-10 max-w-2xl mx-auto">
              Junte-se a marcas que já transformaram seu marketing de influência e alcançaram resultados extraordinários
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth">
                <GlowButton size="lg" className="h-14 px-10 bg-primary text-white hover:bg-primary/90 rounded-full font-semibold text-base" data-testid="cta-cases-start">
                  Começar Agora - É Grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </GlowButton>
              </Link>
              <a href="https://wa.me/5527997969628" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="h-14 px-10 rounded-full" data-testid="cta-cases-contact">
                  Falar com Especialista
                </Button>
              </a>
            </div>
            
            <p className="text-muted-foreground text-sm mt-6">
              Sem compromisso. Configure em menos de 5 minutos.
            </p>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
