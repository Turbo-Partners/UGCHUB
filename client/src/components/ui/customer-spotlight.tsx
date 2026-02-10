import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Play, Star } from "lucide-react";
import { ShineButton } from "./shine-button";
import useEmblaCarousel from "embla-carousel-react";
import { Link } from "wouter";

const testimonials = [
  {
    name: "Wagner",
    role: "Cristal Graffiti · Moda",
    avatar: "WG",
    image: "/attached_assets/cristal_graffiti_logo_1769956270651.png",
    content: "UGC virou o motor da marca. Em poucas semanas, os criadores geraram conteúdo que sustentou um crescimento de 600% no faturamento.",
    rating: 5,
    metric: "664%",
    metricLabel: "crescimento"
  },
  {
    name: "Rodrigo",
    role: "Cacow · Wellness",
    avatar: "RD",
    image: "/attached_assets/rodrigo_-_cacow_1769956149612.png",
    content: "Com creators certos e UGC estratégico, transformamos a comunicação da marca e escalamos conteúdo que realmente conectou com a comunidade.",
    rating: 5,
    metric: "400%",
    metricLabel: "faturamento"
  },
  {
    name: "André",
    role: "Jui · Wellness",
    avatar: "AD",
    image: "/attached_assets/andre_-_jui_1769956149613.png",
    content: "Estruturamos creators do zero e criamos uma comunidade ativa. O impacto acompanhou um crescimento de 4 dígitos no faturamento.",
    rating: 5,
    metric: "1200%",
    metricLabel: "crescimento"
  },
  {
    name: "Ana",
    role: "Óticas Paris · Óticas",
    avatar: "AN",
    image: "/attached_assets/ana_-_oticas_1769956149611.png",
    content: "Saímos de poucos conteúdos para uma biblioteca contínua de UGC com creators, dando consistência e força à marca em menos de 90 dias.",
    rating: 5,
    metric: "59%",
    metricLabel: "em 5 meses"
  },
];

const caseStudies = [
  {
    company: "Cristal Graffiti",
    owner: "Wagner",
    logo: "/attached_assets/cristal_graffiti_logo_1770062831280.png",
    headline: "664% de crescimento com UGC",
    description: "Posts do próprio perfil como anúncio + anúncio de catálogo + campanha Black Friday com creators",
    image: "/images/cases/cristal-graffiti-hero.png",
    color: "from-pink-500 to-rose-500",
    metrics: [
      { value: "664%", label: "Crescimento em 1 mês" },
      { value: "8.41", label: "ROAS com creators" },
      { value: "226%", label: "Aumento média mensal" },
    ],
  },
  {
    company: "Cacow",
    owner: "Rodrigo",
    logo: "/attached_assets/logo-cacow-chocolates-artesanais-brasil.png",
    headline: "400% no faturamento com creators veganos",
    description: "Validação do ângulo vegano com UGC creators + roteirização de criativos para própria base",
    image: "/images/cases/cacow-hero.png",
    color: "from-blue-500 to-indigo-500",
    metrics: [
      { value: "400%", label: "Aumento no faturamento" },
      { value: "2.99→5.75", label: "ROAS com creators" },
      { value: "200%", label: "Recorrência e LTV" },
    ],
  },
  {
    company: "Jui",
    owner: "Andre",
    logo: "/attached_assets/jui-logo_1769956179162.png",
    headline: "1200% de crescimento com influencers",
    description: "Estratégia com influencers + campanhas em funil que estabeleceu a marca no Instagram",
    image: "/images/cases/jui-hero.png",
    color: "from-emerald-500 to-green-500",
    metrics: [
      { value: "1200%", label: "Aumento no faturamento" },
      { value: "✓", label: "Marca estabelecida" },
      { value: "3x", label: "Base de clientes" },
    ],
  },
];

const clientLogos = [
  { name: "Natura", display: "Natura" },
  { name: "Boticário", display: "Boticário" },
  { name: "Renner", display: "Renner" },
  { name: "Magalu", display: "Magazine Luiza" },
  { name: "Nubank", display: "Nubank" },
];

function TestimonialCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start", slidesToScroll: 1 });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);
    
    return () => {
      emblaApi.off('select', onSelect);
      clearInterval(interval);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="mb-12">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-6">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-shrink-0 w-[85%] md:w-[calc(33.333%-16px)] p-6 rounded-2xl bg-card dark:bg-zinc-900/80 border border-border dark:border-zinc-800 relative overflow-hidden group hover:border-primary/30 transition-all"
              data-testid={`testimonial-${testimonial.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              
              <p className="text-foreground/80 text-sm md:text-base mb-6 leading-relaxed line-clamp-4 relative z-10">"{testimonial.content}"</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="h-10 w-10 rounded-full object-cover border-2 border-primary/20"
                  />
                  <div>
                    <p className="font-semibold text-foreground text-sm">{testimonial.name}</p>
                    <p className="text-muted-foreground text-xs">{testimonial.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary text-lg">{testimonial.metric}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.metricLabel}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex justify-center items-center gap-4 mt-6">
        <button
          onClick={() => emblaApi?.scrollPrev()}
          className="w-10 h-10 rounded-full bg-muted/50 dark:bg-zinc-800/50 flex items-center justify-center text-foreground hover:bg-primary/20 transition-all border border-border"
          data-testid="testimonial-prev"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === selectedIndex 
                  ? "bg-primary w-6" 
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => emblaApi?.scrollNext()}
          className="w-10 h-10 rounded-full bg-muted/50 dark:bg-zinc-800/50 flex items-center justify-center text-foreground hover:bg-primary/20 transition-all border border-border"
          data-testid="testimonial-next"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export function CustomerSpotlight() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % caseStudies.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isHovered]);

  const currentCase = caseStudies[currentIndex];

  const goToNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % caseStudies.length);
  };

  const goToPrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + caseStudies.length) % caseStudies.length);
  };

  return (
    <section id="cases" className="py-24 bg-muted/30 dark:bg-zinc-950 relative overflow-hidden border-y border-border/50 dark:border-zinc-800/50">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-violet-500/5 via-transparent to-transparent" />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium bg-primary/10 dark:bg-white/5 text-primary dark:text-white/80 border border-primary/20 dark:border-white/10 mb-6 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            CUSTOMER SPOTLIGHT
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-6xl font-black text-foreground mb-4 uppercase tracking-tight">
            Experiência que fala.
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            eCommerce, SaaS e empresas de todos os tamanhos.
          </p>
        </motion.div>

        <div 
          className="max-w-6xl mx-auto mb-16"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="relative">
            <div className="grid lg:grid-cols-5 gap-0 rounded-2xl overflow-hidden bg-card dark:bg-zinc-900/50 border border-border dark:border-zinc-800/50 backdrop-blur-sm shadow-xl">
              <div className="lg:col-span-3 relative aspect-[16/10] lg:aspect-auto overflow-hidden group">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentIndex}
                    custom={direction}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute inset-0"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${currentCase.color} opacity-60`} />
                    <img
                      src={currentCase.image}
                      alt={currentCase.company}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/50 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-zinc-950/30" />
                    
                    <div className="absolute inset-0 backdrop-blur-[2px]" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-8">
                      <motion.h3 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-white font-heading font-bold text-xl lg:text-2xl mb-5 max-w-md"
                      >
                        {currentCase.headline}
                      </motion.h3>
                      
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mb-4"
                      >
                        <img 
                          src={currentCase.logo} 
                          alt={currentCase.company}
                          className="h-14 w-auto object-contain brightness-0 invert"
                        />
                      </motion.div>
                      
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md text-white text-sm font-medium border border-white/20 hover:bg-white/20 transition-all group"
                        data-testid="read-story-button"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>VER HISTÓRIA</span>
                      </motion.button>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <button
                  onClick={goToPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-all opacity-0 group-hover:opacity-100 border border-white/10"
                  data-testid="prev-case-button"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-all opacity-0 group-hover:opacity-100 border border-white/10"
                  data-testid="next-case-button"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                <div className="absolute top-4 right-4 flex gap-2">
                  {caseStudies.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setDirection(i > currentIndex ? 1 : -1);
                        setCurrentIndex(i);
                      }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === currentIndex 
                          ? "bg-white w-6" 
                          : "bg-white/30 hover:bg-white/50"
                      }`}
                      data-testid={`case-dot-${i}`}
                    />
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2 p-8 lg:p-10 flex flex-col justify-center bg-muted/50 dark:bg-zinc-900/80">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-8"
                  >
                    {currentCase.metrics.map((metric, i) => (
                      <motion.div
                        key={metric.label}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.1, duration: 0.4 }}
                        className="group"
                      >
                        <motion.p 
                          className="font-heading text-5xl lg:text-6xl font-black text-foreground mb-1 tracking-tight"
                          whileHover={{ scale: 1.02 }}
                        >
                          {metric.value}
                        </motion.p>
                        <p className="text-muted-foreground text-sm lg:text-base">{metric.label}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials - Single Line Carousel */}
        <TestimonialCarousel />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link href="/cases">
            <ShineButton className="group" data-testid="read-case-studies-button">
              VER TODOS OS CASES
              <ArrowUpRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </ShineButton>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
