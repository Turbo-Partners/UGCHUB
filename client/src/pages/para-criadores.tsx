import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { PublicHeader } from "@/components/public-header";
import { Footer } from "@/components/footer";
import { GlowButton } from "@/components/ui/glow-button";
import { LazyVideo } from "@/components/ui/lazy-video";
import { Marquee } from "@/components/ui/marquee";
import { PulsingDot } from "@/components/ui/animated-elements";
import {
  ArrowRight,
  PenTool,
  DollarSign,
  Users,
  GraduationCap,
  Trophy,
  Shield,
  Zap,
  CheckCircle2,
  Star,
  ChevronDown,
  Sparkles,
  Target,
  Heart,
  Rocket,
  BarChart3,
  Play,
  Camera,
  TrendingUp,
  Gift,
  Medal,
  Crown,
  Gem,
  BookOpen,
  Palette,
  Instagram,
  Video,
  ImageIcon,
  MessageCircle,
  Globe,
  Award,
  Wallet,
  Clock,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { SEO } from "@/components/seo";
import useEmblaCarousel from "embla-carousel-react";

const heroVideosData = [
  { video: "/attached_assets/66abe745afaa2b8c0a261b86_66d7624a28fb1053ce1e30db_VEED_Create__1766970674217.mp4", name: "BioGummy", color: "from-emerald-500" },
  { video: "/media/ugc/trizzi.mp4", name: "Trizzi", color: "from-pink-500" },
  { video: "/media/ugc/cacow-natali.mp4", name: "Cacow", color: "from-amber-500" },
  { video: "/media/ugc/farme.mp4", name: "Far-me", color: "from-violet-500" },
  { video: "/media/ugc/minimal.mp4", name: "Minimal", color: "from-cyan-500" },
  { video: "/media/ugc/cacow-elisa.mp4", name: "Cacow", color: "from-rose-500" },
  { video: "/media/ugc/bready.mp4", name: "Bready", color: "from-orange-500" },
  { video: "/media/ugc/biogummy-monise.mp4", name: "BioGummy", color: "from-teal-500" },
  { video: "/media/ugc/biogummy-nadia.mp4", name: "BioGummy", color: "from-indigo-500" },
  { video: "/media/ugc/gioey.mp4", name: "Beauty", color: "from-fuchsia-500" },
  { video: "/media/ugc/paris.mp4", name: "Óticas Paris", color: "from-sky-500" },
  { video: "/media/ugc/ugc-1.mp4", name: "Lifestyle", color: "from-lime-500" },
  { video: "/media/ugc/bready-bre0509.mp4", name: "Bready", color: "from-yellow-500" },
  { video: "/media/ugc/bready-bre0505.mp4", name: "Bready", color: "from-orange-600" },
  { video: "/media/ugc/bready-lara.mp4", name: "Bready", color: "from-amber-600" },
  { video: "/media/ugc/oticas-paris-full.mp4", name: "Óticas Paris", color: "from-amber-500" },
  { video: "/media/ugc/nutty-bavarian.mp4", name: "Nutty Bavarian", color: "from-amber-700" },
];

const brandLogos = [
  { name: "Guday", logo: "/attached_assets/logo-roxo_1767026682997.png", isImage: true },
  { name: "Ocean Drop", logo: "/attached_assets/logo_oceandrop_1767050134921.png", isImage: true, size: "large" },
  { name: "Minimal Club", logo: "/attached_assets/Logo_Header_94582ed2-dc65-4f29-8e6a-3e2a2e96ba5b_1_1767026751041.png", isImage: true, size: "small" },
  { name: "Hommy", text: "hommy", isImage: false },
  { name: "Le Lis Blanc", text: "LE LIS BLANC", isImage: false },
  { name: "True Source", logo: "/attached_assets/true_source_logo.png", isImage: true, forceWhite: true },
  { name: "PushPow", logo: "/attached_assets/2358x292_1767026751040.png", isImage: true },
  { name: "Bready", logo: "/attached_assets/logo-bready_1767026723827.webp", isImage: true },
  { name: "Liquidz", logo: "/attached_assets/freepik__adjust__40502_1767049905471.png", isImage: true },
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function HeroVideoCard({ video }: { video: typeof heroVideosData[0] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    return () => {
      const vid = videoRef.current;
      if (vid) { vid.pause(); vid.removeAttribute('src'); vid.load(); }
    };
  }, []);

  return (
    <div className="relative h-full bg-gradient-to-br from-gray-800 to-gray-900">
      {!isLoaded && <div className="absolute inset-0 bg-gray-800 animate-pulse" />}
      <video
        ref={videoRef}
        autoPlay loop muted playsInline preload="none"
        onLoadedData={() => setIsLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      >
        <source src={video.video} type="video/mp4" />
      </video>
      <div className={`absolute inset-0 bg-gradient-to-t ${video.color}/30 to-transparent`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex items-center gap-2">
          <Play className="h-4 w-4 text-white/80" />
          <span className="text-white/80 text-xs font-medium">UGC</span>
        </div>
        <p className="text-white font-semibold text-sm mt-1">{video.name}</p>
      </div>
    </div>
  );
}

function HeroVideoCarousel() {
  const [heroVideos] = useState(() => shuffleArray(heroVideosData).slice(0, 8));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondIndex, setSecondIndex] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 2) % heroVideos.length);
      setSecondIndex((prev) => (prev + 2) % heroVideos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroVideos.length]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="relative hidden lg:block"
    >
      <div className="grid grid-cols-2 gap-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl"
          >
            <HeroVideoCard video={heroVideos[currentIndex]} />
          </motion.div>
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.div
            key={secondIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl mt-8"
          >
            <HeroVideoCard video={heroVideos[secondIndex]} />
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
        transition={{
          opacity: { duration: 0.5, delay: 0.8 },
          y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }}
        className="absolute -bottom-6 -left-6 bg-card border border-border rounded-2xl p-4 shadow-xl"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Campanha aprovada!</p>
            <p className="font-semibold text-foreground">+R$ 2.500</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
        transition={{
          opacity: { duration: 0.5, delay: 1 },
          y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }
        }}
        className="absolute -top-4 -right-4 bg-card border border-border rounded-2xl p-4 shadow-xl"
      >
        <div className="text-center">
          <p className="text-2xl font-bold text-violet-500">+127%</p>
          <p className="text-xs text-muted-foreground">Crescimento médio</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function MobileVideoCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, dragFree: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [heroVideos] = useState(() => shuffleArray(heroVideosData).slice(0, 6));

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    const interval = setInterval(() => emblaApi.scrollNext(), 4000);
    return () => { emblaApi.off('select', onSelect); clearInterval(interval); };
  }, [emblaApi, onSelect]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="lg:hidden mt-8"
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {heroVideos.map((video, i) => (
            <div key={i} className="flex-none w-[70%] sm:w-[50%]">
              <div className="aspect-[9/16] rounded-2xl overflow-hidden shadow-xl relative">
                <LazyVideo src={video.video} className="w-full h-full" />
                <div className="absolute bottom-3 left-3">
                  <p className="text-white font-semibold text-xs">{video.name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-2 mt-4">
        {heroVideos.map((_, i) => (
          <button key={i} onClick={() => emblaApi?.scrollTo(i)} className={`w-2 h-2 rounded-full transition-all ${i === selectedIndex ? "bg-violet-500 w-4" : "bg-muted-foreground/30"}`} data-testid={`carousel-dot-${i}`} />
        ))}
      </div>
    </motion.div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      className="bg-card/50 border border-border rounded-2xl overflow-hidden hover:border-violet-500/30 transition-colors"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-muted/50 transition-colors"
        data-testid={`faq-toggle-${question.slice(0, 20).replace(/\s/g, '-').toLowerCase()}`}
      >
        <span className="text-foreground font-semibold text-lg pr-4">{question}</span>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="px-6 pb-6">
          <p className="text-muted-foreground leading-relaxed">{answer}</p>
        </motion.div>
      )}
    </motion.div>
  );
}

const contentTypes = [
  { icon: Video, label: "Reels & Shorts", desc: "Vídeos curtos para Instagram, TikTok e YouTube" },
  { icon: Camera, label: "Fotos & Carrosséis", desc: "Conteúdo estático de alta qualidade" },
  { icon: MessageCircle, label: "Reviews & Unboxing", desc: "Avaliações autênticas de produtos" },
  { icon: ImageIcon, label: "Stories & Ads", desc: "Conteúdo para stories e anúncios pagos" },
];

const gamificationLevels = [
  { name: "Bronze", icon: Medal, color: "from-amber-700 to-amber-800", textColor: "text-amber-600", points: "0 - 500 pts" },
  { name: "Prata", icon: Award, color: "from-slate-400 to-slate-500", textColor: "text-slate-400", points: "500 - 2.000 pts" },
  { name: "Ouro", icon: Crown, color: "from-amber-400 to-yellow-500", textColor: "text-amber-400", points: "2.000 - 5.000 pts" },
  { name: "Diamante", icon: Gem, color: "from-violet-400 to-blue-500", textColor: "text-violet-400", points: "5.000+ pts" },
];

export default function ParaCriadores() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <SEO
        title="Sou Criador | CreatorConnect"
        description="Ganhe dinheiro criando conteúdo para marcas. Não precisa ser famoso. Campanhas, Academy, comunidade e pagamentos — tudo em um só lugar."
      />
      <PublicHeader />

      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -left-1/4 w-[150%] h-[150%] animate-pulse" style={{ background: "radial-gradient(ellipse at 30% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)", animationDuration: "20s" }} />
          <div className="absolute -bottom-1/2 -right-1/4 w-[150%] h-[150%] animate-pulse" style={{ background: "radial-gradient(ellipse at 70% 80%, rgba(99, 102, 241, 0.12) 0%, transparent 50%)", animationDuration: "25s", animationDelay: "3s" }} />
        </div>
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="gridC" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="30" cy="30" r="0.5" fill="currentColor" className="text-foreground/30" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#gridC)" />
          </svg>
        </div>

        <div className="absolute top-24 left-[8%] w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center animate-pulse">
          <Camera className="w-7 h-7 text-violet-400/50" />
        </div>
        <div className="absolute top-36 right-[12%] w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center animate-bounce" style={{ animationDuration: "3s" }}>
          <DollarSign className="w-6 h-6 text-emerald-400/50" />
        </div>
        <div className="absolute bottom-24 left-[15%] w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center animate-pulse" style={{ animationDelay: "1s" }}>
          <Star className="w-5 h-5 text-amber-400/50" />
        </div>
        <div className="absolute top-44 left-[4%] w-2 h-2 rounded-full bg-violet-400/30" />
        <div className="absolute top-32 right-[22%] w-3 h-3 rounded-full bg-emerald-400/30" />
        <div className="absolute bottom-36 right-[8%] w-2 h-2 rounded-full bg-amber-400/30" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8 text-center lg:text-left"
            >
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, type: "spring" }}
                className="inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-400 backdrop-blur-sm"
              >
                <PulsingDot className="mr-2" size="w-2 h-2" />
                <motion.span animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
                  <Sparkles className="mr-2 h-4 w-4" />
                </motion.span>
                100% gratuito para criadores
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, type: "spring", stiffness: 100 }}
                className="font-heading text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.1] text-foreground"
              >
                <motion.span initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                  Ganhe dinheiro{" "}
                </motion.span>
                <motion.span
                  className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 inline-block"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
                >
                  criando conteúdo
                </motion.span>{" "}
                para marcas.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-sm sm:text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0"
              >
                <span className="hidden sm:inline">Não precisa ser famoso. Se você gosta de criar conteúdo, já pode começar a trabalhar com marcas, receber por campanhas e crescer como creator profissional.</span>
                <span className="sm:hidden">Crie conteúdo para marcas e ganhe dinheiro. Não precisa ser famoso.</span>
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 items-center lg:items-start"
              >
                <Link href="/auth?role=creator">
                  <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                    <GlowButton size="lg" className="h-14 px-10 text-base bg-violet-600 hover:bg-violet-700 text-white rounded-full font-semibold w-full sm:w-auto relative overflow-hidden group" data-testid="button-hero-cadastro">
                      <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" initial={{ x: "-100%" }} whileHover={{ x: "100%" }} transition={{ duration: 0.6 }} />
                      <Rocket className="mr-2 h-5 w-5 relative z-10" />
                      <span className="relative z-10">Começar Agora</span>
                      <motion.div className="relative z-10 ml-2" animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                        <ArrowRight className="h-5 w-5" />
                      </motion.div>
                    </GlowButton>
                  </motion.div>
                </Link>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })}
                  className="h-14 px-10 text-base border border-border hover:border-violet-500/40 text-foreground rounded-full font-semibold transition-colors"
                  data-testid="button-hero-como-funciona"
                >
                  Como funciona?
                </motion.button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="flex items-center gap-3 pt-4"
              >
                <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-full bg-muted/50 border border-border backdrop-blur-sm">
                  <div className="flex -space-x-2">
                    {brandLogos.filter(b => b.isImage).slice(0, 4).map((brand, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-white overflow-hidden border-2 border-background flex items-center justify-center p-1">
                        <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain" loading="lazy" />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />)}
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">+250 Empresas na plataforma</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Gratuito</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Sem burocracia</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Pagamento garantido</span>
                </div>
              </motion.div>
            </motion.div>

            <HeroVideoCarousel />
          </div>
          <MobileVideoCarousel />
        </div>
      </section>

      <section className="py-12 border-y border-border/50 bg-muted/20 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "0px 0px -80px 0px" }}
            className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-6"
          >
            Marcas que pagam creators na CreatorConnect
          </motion.p>
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
            <Marquee pauseOnHover duration={25} reverse>
              {brandLogos.map((brand, i) => (
                <div key={i} className="flex items-center justify-center h-10 px-8 mx-4 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                  {brand.isImage ? (
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className={`${(brand as any).size === "large" ? "h-12" : (brand as any).size === "small" ? "h-5" : "h-8"} w-auto object-contain ${(brand as any).forceWhite ? "brightness-0 dark:invert" : "grayscale dark:brightness-200 dark:invert"}`}
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-foreground font-semibold text-sm tracking-wide whitespace-nowrap">{brand.text}</span>
                  )}
                </div>
              ))}
            </Marquee>
          </div>
        </div>
      </section>

      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-500/5 via-transparent to-transparent" />
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -80px 0px" }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            {[
              { value: "+250", label: "Empresas na plataforma", icon: Shield, color: "text-violet-400", bg: "bg-violet-500/10" },
              { value: "500+", label: "Creators ativos", icon: Users, color: "text-emerald-400", bg: "bg-emerald-500/10" },
              { value: "+500", label: "Campanhas realizadas", icon: Target, color: "text-blue-400", bg: "bg-blue-500/10" },
              { value: "R$ 2M+", label: "Pagos a creators", icon: DollarSign, color: "text-amber-400", bg: "bg-amber-500/10" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -80px 0px" }}
                transition={{ delay: i * 0.1 }}
                className="text-center group"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${stat.bg} mb-4 transition-all`}
                >
                  <stat.icon className={`h-7 w-7 ${stat.color}`} />
                </motion.div>
                <p className="text-3xl lg:text-4xl font-black text-foreground" data-testid={`stat-${stat.label.replace(/\s/g, '-').toLowerCase()}`}>
                  {stat.value}
                </p>
                <p className="text-muted-foreground text-sm mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-muted/30 dark:bg-zinc-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -80px 0px" }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 mb-4">
              <Palette className="w-4 h-4" />
              TIPOS DE CONTEÚDO
            </span>
            <h2 className="font-heading text-3xl lg:text-5xl font-bold text-foreground mt-3">
              O que você pode criar
            </h2>
            <p className="text-muted-foreground text-lg mt-4 max-w-2xl mx-auto">
              Marcas buscam diferentes formatos. Escolha o que mais combina com seu estilo.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {contentTypes.map((type, i) => (
              <motion.div
                key={type.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -80px 0px" }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-card border border-border rounded-2xl p-6 text-center hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5 transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center mx-auto mb-4 group-hover:from-violet-500/20 group-hover:to-purple-500/20 transition-all">
                  <type.icon className="h-7 w-7 text-violet-500" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{type.label}</h3>
                <p className="text-muted-foreground text-sm">{type.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="py-20 lg:py-32 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -80px 0px" }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
              <Zap className="w-4 h-4" />
              SIMPLES E RÁPIDO
            </span>
            <h2 className="font-heading text-3xl lg:text-5xl font-bold text-foreground mt-3">
              Do cadastro ao pagamento em 4 passos
            </h2>
            <p className="text-muted-foreground text-lg mt-4 max-w-2xl mx-auto">
              Sem complicação, sem burocracia. Comece hoje e receba pelo que você cria.
            </p>
          </motion.div>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { step: "01", title: "Crie seu perfil", description: "Cadastre-se gratuitamente, monte seu portfólio e conecte suas redes sociais. Em 2 minutos você está pronto.", icon: PenTool, color: "from-violet-500 to-violet-600", bgGlow: "violet" },
                { step: "02", title: "Descubra campanhas", description: "Explore campanhas abertas de marcas reais. Filtre por nicho, tipo de conteúdo e valor. Candidate-se às que combinam com você.", icon: Target, color: "from-blue-500 to-cyan-500", bgGlow: "blue" },
                { step: "03", title: "Crie conteúdo", description: "Receba o briefing detalhado, grave seu conteúdo do seu jeito e envie para aprovação da marca.", icon: Camera, color: "from-amber-500 to-orange-500", bgGlow: "amber" },
                { step: "04", title: "Receba seu $$$", description: "Conteúdo aprovado? Pagamento na sua conta. Sem esperar o final do mês, sem taxas escondidas.", icon: DollarSign, color: "from-emerald-500 to-green-500", bgGlow: "emerald" },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "0px 0px -80px 0px" }}
                  transition={{ delay: i * 0.15 }}
                  className="relative group"
                >
                  <div className="bg-card border border-border rounded-2xl p-6 h-full hover:border-violet-500/30 hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-300 relative overflow-hidden">
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-${item.bgGlow}-500/5 to-transparent rounded-bl-full`} />
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                      <item.icon className="h-7 w-7 text-white" />
                    </div>
                    <span className="text-muted-foreground/40 text-sm font-mono font-bold">{item.step}</span>
                    <h3 className="text-xl font-bold text-foreground mt-1 mb-3">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -80px 0px" }}
              className="text-center mt-12"
            >
              <Link href="/auth?role=creator">
                <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.98 }}>
                  <GlowButton size="lg" className="h-14 px-10 text-base bg-violet-600 hover:bg-violet-700 text-white rounded-full font-semibold" data-testid="button-steps-cta">
                    <Rocket className="mr-2 h-5 w-5" />
                    Começar Agora — É Grátis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </GlowButton>
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-32 bg-gradient-to-b from-transparent via-violet-500/5 to-transparent relative overflow-hidden">
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-16 left-[5%] w-16 h-16 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center"
        >
          <DollarSign className="w-7 h-7 text-emerald-400/20" />
        </motion.div>
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="absolute bottom-16 right-[6%] w-14 h-14 rounded-full bg-amber-500/5 border border-amber-500/10 flex items-center justify-center"
        >
          <Trophy className="w-6 h-6 text-amber-400/20" />
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
          className="absolute top-24 right-[15%] w-3 h-3 rounded-full bg-violet-400/30"
        />
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }}
          transition={{ duration: 5.5, repeat: Infinity, delay: 2 }}
          className="absolute bottom-32 left-[18%] w-2 h-2 rounded-full bg-blue-400/30"
        />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -80px 0px" }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-pink-500/10 text-pink-400 border border-pink-500/20 mb-4">
              <Heart className="w-4 h-4" />
              TUDO QUE VOCÊ PRECISA
            </span>
            <h2 className="font-heading text-3xl lg:text-5xl font-bold text-foreground mt-3">
              Por que creators escolhem a CreatorConnect?
            </h2>
          </motion.div>

          <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: DollarSign, title: "Ganhe com campanhas", description: "Receba por cada conteúdo criado. Valores justos, pagamento garantido e sem taxas escondidas.", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "hover:border-emerald-500/30" },
              { icon: GraduationCap, title: "Academy gratuita", description: "Cursos exclusivos sobre UGC, Instagram, precificação e muito mais. Aprenda e cresça como creator profissional.", color: "text-blue-400", bg: "bg-blue-500/10", border: "hover:border-blue-500/30" },
              { icon: Trophy, title: "Gamificação e ranking", description: "Ganhe pontos, suba de nível (Bronze a Diamante), conquiste badges e destaque-se no ranking.", color: "text-amber-400", bg: "bg-amber-500/10", border: "hover:border-amber-500/30" },
              { icon: Users, title: "Comunidade de marcas", description: "Faça parte de comunidades exclusivas de marcas. Acesso a campanhas prioritárias e relacionamento de longo prazo.", color: "text-violet-400", bg: "bg-violet-500/10", border: "hover:border-violet-500/30" },
              { icon: BarChart3, title: "Analytics completo", description: "Acompanhe seu crescimento, engajamento e performance. Dados reais para você evoluir como creator.", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "hover:border-cyan-500/30" },
              { icon: Wallet, title: "Pagamento garantido", description: "Após aprovação do conteúdo, o pagamento é automático. Sem atrasos, sem promessas. Você cria, a gente paga.", color: "text-rose-400", bg: "bg-rose-500/10", border: "hover:border-rose-500/30" },
            ].map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -80px 0px" }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className={`bg-card border border-border rounded-2xl p-6 ${benefit.border} hover:shadow-xl transition-all duration-300 group`}
              >
                <div className={`w-14 h-14 rounded-2xl ${benefit.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <benefit.icon className={`h-7 w-7 ${benefit.color}`} />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-32 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -80px 0px" }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4">
              <Trophy className="w-4 h-4" />
              GAMIFICAÇÃO
            </span>
            <h2 className="font-heading text-3xl lg:text-5xl font-bold text-foreground mt-3">
              Suba de nível, ganhe mais
            </h2>
            <p className="text-muted-foreground text-lg mt-4 max-w-2xl mx-auto">
              Quanto mais você cria, mais você ganha. Suba de Bronze a Diamante e desbloqueie oportunidades exclusivas.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {gamificationLevels.map((level, i) => (
              <motion.div
                key={level.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -80px 0px" }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -8, scale: 1.03 }}
                className="bg-card border border-border rounded-2xl p-6 text-center hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${level.color}`} />
                <motion.div
                  className={`w-16 h-16 rounded-full bg-gradient-to-br ${level.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.8 }}
                >
                  <level.icon className="h-8 w-8 text-white" />
                </motion.div>
                <h3 className={`text-xl font-bold ${level.textColor} mb-1`}>{level.name}</h3>
                <p className="text-muted-foreground text-xs">{level.points}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -80px 0px" }}
            className="mt-12 max-w-3xl mx-auto grid sm:grid-cols-3 gap-4"
          >
            {[
              { icon: Gift, title: "Recompensas exclusivas", desc: "Cupons, brindes e bônus em cada nível" },
              { icon: TrendingUp, title: "Visibilidade premium", desc: "Creators top aparecem primeiro para as marcas" },
              { icon: Star, title: "Badges especiais", desc: "10+ badges para mostrar no seu perfil" },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "0px 0px -80px 0px" }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm">{item.title}</h4>
                  <p className="text-muted-foreground text-xs mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20 lg:py-32 bg-muted/30 dark:bg-zinc-950 relative overflow-hidden">
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-[8%] w-20 h-20 rounded-3xl bg-violet-500/5 border border-violet-500/10 flex items-center justify-center"
        >
          <Rocket className="w-8 h-8 text-violet-400/20" />
        </motion.div>
        <motion.div
          animate={{ y: [0, -10, 0], x: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-20 left-[5%] w-16 h-16 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center"
        >
          <TrendingUp className="w-7 h-7 text-emerald-400/20" />
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-32 left-[15%] w-3 h-3 rounded-full bg-pink-400/30"
        />
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1.5 }}
          className="absolute bottom-40 right-[12%] w-2 h-2 rounded-full bg-cyan-400/30"
        />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -80px 0px" }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-4">
              <Sparkles className="w-4 h-4" />
              SEU DIA COMO CREATOR
            </span>
            <h2 className="font-heading text-3xl lg:text-5xl font-bold text-foreground mt-3">
              Um dia típico na plataforma
            </h2>
            <p className="text-muted-foreground text-lg mt-4 max-w-2xl mx-auto">
              Veja como creators estão transformando sua rotina em renda recorrente
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto relative">
            <div className="absolute left-6 lg:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-violet-500/30 via-emerald-500/30 to-amber-500/30 hidden sm:block" />

            {[
              { time: "09:00", title: "Confira novos convites", desc: "Marcas que combinam com seu perfil enviam convites direto pra você. Aceite e veja o briefing.", icon: Target, color: "bg-violet-500", iconColor: "text-violet-400" },
              { time: "10:30", title: "Grave seu conteúdo", desc: "Use o briefing da marca como guia. Grave do seu jeito, no seu espaço, com seu estilo.", icon: Camera, color: "bg-pink-500", iconColor: "text-pink-400" },
              { time: "14:00", title: "Aprenda algo novo", desc: "Acesse a Academy: cursos de UGC, precificação, edição. Ganhe certificados e pontos.", icon: BookOpen, color: "bg-blue-500", iconColor: "text-blue-400" },
              { time: "16:00", title: "Envie e receba", desc: "Submeta o conteúdo para aprovação. Aprovado? Pagamento direto na sua conta via PIX.", icon: DollarSign, color: "bg-emerald-500", iconColor: "text-emerald-400" },
            ].map((step, i) => (
              <motion.div
                key={step.time}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "0px 0px -80px 0px" }}
                transition={{ delay: i * 0.15 }}
                className={`relative flex items-start gap-4 sm:gap-6 mb-8 ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} lg:text-${i % 2 === 0 ? 'right' : 'left'}`}
              >
                <div className={`flex-1 ${i % 2 === 0 ? 'lg:pr-12' : 'lg:pl-12'}`}>
                  <motion.div
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="bg-card border border-border rounded-2xl p-5 sm:p-6 hover:shadow-xl hover:border-violet-500/20 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl ${step.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                        <step.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <span className="text-xs font-mono text-muted-foreground">{step.time}</span>
                        <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                  </motion.div>
                </div>

                <div className="hidden sm:flex absolute left-6 lg:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-card border-2 border-violet-500 shadow-lg shadow-violet-500/20 z-10" style={{ top: '1.5rem' }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-32 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -80px 0px" }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 mb-4">
              <Play className="w-4 h-4" />
              CONTEÚDOS REAIS
            </span>
            <h2 className="font-heading text-3xl lg:text-5xl font-bold text-foreground mt-3">
              Veja o que creators estão produzindo
            </h2>
            <p className="text-muted-foreground text-lg mt-4 max-w-2xl mx-auto">
              Conteúdos reais criados por creators na plataforma para marcas parceiras
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
            {shuffleArray(heroVideosData).slice(0, 10).map((video, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -80px 0px" }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -8, scale: 1.03 }}
                className="aspect-[9/16] rounded-2xl overflow-hidden shadow-lg relative group"
              >
                <LazyVideo src={video.video} className="w-full h-full" />
                <div className={`absolute inset-0 bg-gradient-to-t ${video.color}/20 to-transparent pointer-events-none`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-white text-xs font-medium">{video.name}</span>
                  </div>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="px-2 py-0.5 rounded-full bg-violet-500 text-white text-[10px] font-bold">UGC</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-32 bg-gradient-to-b from-transparent via-violet-500/5 to-transparent">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -80px 0px" }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
              <Star className="w-4 h-4" />
              DEPOIMENTOS
            </span>
            <h2 className="font-heading text-3xl lg:text-5xl font-bold text-foreground mt-3">
              O que creators dizem
            </h2>
          </motion.div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Ana Carolina",
                role: "Criadora de conteúdo",
                avatar: "AC",
                quote: "Antes eu não sabia como cobrar ou onde encontrar marcas. Com a CreatorConnect, recebo briefings claros e o pagamento é garantido. Já completei mais de 20 campanhas!",
                rating: 5,
                badge: "Nível Ouro",
                badgeColor: "bg-amber-500/10 text-amber-400",
              },
              {
                name: "Lucas Mendes",
                role: "UGC Creator",
                avatar: "LM",
                quote: "O sistema de gamificação me motiva muito! Já cheguei no nível Ouro e agora recebo convites de campanhas exclusivas. A Academy também me ajudou demais.",
                rating: 5,
                badge: "Top Creator",
                badgeColor: "bg-violet-500/10 text-violet-400",
              },
              {
                name: "Mariana Santos",
                role: "Micro-influenciadora",
                avatar: "MS",
                quote: "Não precisa ter milhões de seguidores. Com 3k seguidores eu consigo campanhas toda semana. A comunidade de marcas é incrível, me sinto parte de algo maior.",
                rating: 5,
                badge: "3k seguidores",
                badgeColor: "bg-emerald-500/10 text-emerald-400",
              },
            ].map((testimonial, i) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -80px 0px" }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -4 }}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:border-violet-500/20 transition-all duration-300"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6 italic">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {testimonial.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground font-semibold text-sm">{testimonial.name}</p>
                    <p className="text-muted-foreground text-xs">{testimonial.role}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${testimonial.badgeColor}`}>
                    {testimonial.badge}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-32 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -80px 0px" }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-4">
              <MessageCircle className="w-4 h-4" />
              DÚVIDAS FREQUENTES
            </span>
            <h2 className="font-heading text-3xl lg:text-5xl font-bold text-foreground mt-3">
              Perguntas frequentes
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            <FAQItem question="Quanto custa para usar a plataforma?" answer="100% gratuito para criadores! Você não paga nada para se cadastrar, participar de campanhas ou usar a Academy. A plataforma é monetizada pelas marcas." />
            <FAQItem question="Preciso ter muitos seguidores?" answer="Não! Micro-criadores com 1.000+ seguidores já podem participar de campanhas. O que importa é a qualidade do seu conteúdo e engajamento, não o número de seguidores." />
            <FAQItem question="Quanto posso ganhar como criador?" answer="Os valores variam por campanha. Um Reel pode valer de R$100 a R$500+ para micro-influenciadores. Quanto mais campanhas você completar e melhor seu ranking, mais oportunidades e valores maiores você recebe." />
            <FAQItem question="Como funciona o pagamento?" answer="Após a aprovação do seu conteúdo pela marca, o pagamento é processado automaticamente. Você pode sacar via PIX ou transferência bancária. Sem taxas ocultas." />
            <FAQItem question="O que é o sistema de gamificação?" answer="É um sistema de pontos e níveis (Bronze, Prata, Ouro e Diamante) que te recompensa por criar conteúdo, completar campanhas e participar da comunidade. Quanto maior seu nível, mais oportunidades e benefícios exclusivos." />
            <FAQItem question="Posso trabalhar com várias marcas ao mesmo tempo?" answer="Sim! Você pode participar de múltiplas campanhas e comunidades de marcas simultaneamente. A plataforma organiza tudo para você." />
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32 relative overflow-hidden bg-muted/30 dark:bg-zinc-950">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-500/5 opacity-40" />

        <motion.div
          animate={{ y: [0, -10, 0], rotate: [0, 3, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-16 left-[8%] w-14 h-14 rounded-2xl bg-violet-500/5 border border-violet-500/10 flex items-center justify-center"
        >
          <Sparkles className="w-6 h-6 text-violet-400/20" />
        </motion.div>
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-24 right-[10%] w-12 h-12 rounded-full bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center"
        >
          <Star className="w-5 h-5 text-emerald-400/20" />
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3.5, repeat: Infinity }}
          className="absolute top-28 right-[20%] w-2 h-2 rounded-full bg-pink-400/40"
        />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "0px 0px -80px 0px" }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="font-heading text-4xl sm:text-5xl lg:text-7xl font-black text-foreground mb-6">
              Pronto para{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">começar</span>
                <motion.span
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 rounded-full"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, margin: "0px 0px -80px 0px" }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                />
              </span>
              ?
            </h2>
            <p className="text-muted-foreground text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              Crie conteúdo, ganhe dinheiro e cresça como creator profissional. Sem precisar de milhões de seguidores.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-10 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>100% gratuito</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Cadastro em 2 min</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Pagamento via PIX</span>
              </div>
            </div>

            <Link href="/auth?role=creator">
              <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }} className="inline-block">
                <GlowButton size="lg" className="h-16 px-14 text-lg bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 text-white hover:opacity-90 rounded-full font-bold shadow-2xl shadow-violet-500/30" data-testid="button-cta-final">
                  Começar Agora — É Grátis
                  <ArrowRight className="ml-3 h-5 w-5" />
                </GlowButton>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
