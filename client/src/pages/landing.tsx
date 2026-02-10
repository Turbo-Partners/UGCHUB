import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase, PenTool, Sparkles, Play, Star, CheckCircle2, ArrowUpRight, Users, TrendingUp, DollarSign, Award, ChevronDown, Clock, Heart } from "lucide-react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { SEO, OrganizationSchema, WebSiteSchema } from "@/components/seo";
import { PublicHeader } from "@/components/public-header";
import { Footer } from "@/components/footer";
import useEmblaCarousel from "embla-carousel-react";
import { Marquee } from "@/components/ui/marquee";
import { GlowButton } from "@/components/ui/glow-button";
import { LazyVideo } from "@/components/ui/lazy-video";
import { PulsingDot } from "@/components/ui/animated-elements";

const BoldStatements = lazy(() => import("@/components/ui/bold-statements").then(m => ({ default: m.BoldStatements })));
const BigMetric = lazy(() => import("@/components/ui/big-metric").then(m => ({ default: m.BigMetric })));
const VideoShowcase = lazy(() => import("@/components/ui/video-showcase").then(m => ({ default: m.VideoShowcase })));
const FeatureShowcase = lazy(() => import("@/components/ui/feature-showcase").then(m => ({ default: m.FeatureShowcase })));
const IntegrationsGrid = lazy(() => import("@/components/ui/integrations-grid").then(m => ({ default: m.IntegrationsGrid })));
const TrustStrip = lazy(() => import("@/components/ui/trust-strip").then(m => ({ default: m.TrustStrip })));
const BentoGrid = lazy(() => import("@/components/ui/bento-grid").then(m => ({ default: m.BentoGrid })));
const CustomerSpotlight = lazy(() => import("@/components/ui/customer-spotlight").then(m => ({ default: m.CustomerSpotlight })));

function DeferredBackgrounds() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = typeof requestIdleCallback === "function"
      ? requestIdleCallback(() => setReady(true))
      : (setTimeout(() => setReady(true), 100) as unknown as number);
    return () => { if (typeof cancelIdleCallback === "function") cancelIdleCallback(id); else clearTimeout(id as any); };
  }, []);
  if (!ready) return null;
  return (
    <>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/4 w-[150%] h-[150%] animate-pulse" style={{ background: "radial-gradient(ellipse at 30% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)", animationDuration: "20s" }} />
        <div className="absolute -bottom-1/2 -right-1/4 w-[150%] h-[150%] animate-pulse" style={{ background: "radial-gradient(ellipse at 70% 80%, rgba(139, 92, 246, 0.12) 0%, transparent 50%)", animationDuration: "25s", animationDelay: "3s" }} />
        <div className="absolute inset-0 lg:hidden" style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(99, 102, 241, 0.2) 0%, transparent 60%)" }} />
        <div className="absolute inset-0 lg:hidden" style={{ background: "radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.15) 0%, transparent 40%)" }} />
        <div className="absolute inset-0 lg:hidden" style={{ background: "linear-gradient(180deg, rgba(99, 102, 241, 0.08) 0%, transparent 40%, rgba(139, 92, 246, 0.06) 100%)" }} />
      </div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="30" cy="30" r="0.5" fill="currentColor" className="text-foreground/30" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    </>
  );
}

function LazySection({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="min-h-[200px]" />}>{children}</Suspense>;
}

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
  { name: "Turbo Partners", logo: "/attached_assets/Icone_Turbo_Branca_1770475932553.jpg", isImage: true, mixBlend: true },
];

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
  { video: "/media/ugc/oticas-paris-full.mp4", name: "Óticas Paris", color: "from-amber-500" },
  { video: "/media/ugc/bready-bre0509.mp4", name: "Bready", color: "from-yellow-500" },
  { video: "/media/ugc/bready-bre0505.mp4", name: "Bready", color: "from-orange-600" },
  { video: "/media/ugc/bready-lara.mp4", name: "Bready", color: "from-amber-600" },
  { video: "/media/ugc/nutty-bavarian.mp4", name: "Nutty Bavarian", color: "from-amber-700" },
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
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
    
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 4000);
    
    return () => {
      emblaApi.off('select', onSelect);
      clearInterval(interval);
    };
  }, [emblaApi, onSelect]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="lg:hidden mt-8 relative"
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {heroVideos.map((video, i) => (
            <div key={i} className="flex-none w-[70%] sm:w-[50%]">
              <div className="aspect-[9/16] rounded-2xl overflow-hidden shadow-xl">
                <LazyVideo
                  src={video.video}
                  className="w-full h-full"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${video.color}/30 to-transparent pointer-events-none`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
        transition={{ opacity: { delay: 1 }, y: { duration: 3, repeat: Infinity, ease: "easeInOut" } }}
        className="absolute -top-3 right-2 bg-card border border-border rounded-xl px-3 py-2 shadow-lg z-20"
      >
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Parceria fechada!</p>
            <p className="font-bold text-xs text-foreground">+R$ 2.500</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
        transition={{ opacity: { delay: 1.5 }, y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 } }}
        className="absolute top-1/3 -left-1 bg-card border border-border rounded-xl px-3 py-2 shadow-lg z-20"
      >
        <div className="text-center">
          <p className="text-lg font-black text-primary">+127%</p>
          <p className="text-[10px] text-muted-foreground">Crescimento</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1, x: [0, 4, 0] }}
        transition={{ opacity: { delay: 2 }, x: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 } }}
        className="absolute bottom-12 -right-1 bg-card border border-border rounded-xl px-3 py-2 shadow-lg z-20"
      >
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-violet-500/20 flex items-center justify-center">
            <Users className="h-3.5 w-3.5 text-violet-500" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Creators ativos</p>
            <p className="font-bold text-xs text-foreground">500+</p>
          </div>
        </div>
      </motion.div>

      <div className="flex justify-center gap-2 mt-4">
        {heroVideos.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === selectedIndex ? "bg-primary w-4" : "bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}

function HeroVideoCard({ video, eager = false }: { video: typeof heroVideosData[0]; eager?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(eager);

  useEffect(() => {
    if (!eager) {
      const timer = setTimeout(() => setShouldLoad(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [eager]);

  useEffect(() => {
    return () => {
      const vid = videoRef.current;
      if (vid) {
        vid.pause();
        vid.removeAttribute('src');
        vid.load();
      }
    };
  }, []);

  return (
    <div className="relative h-full bg-gradient-to-br from-gray-800 to-gray-900">
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse" />
      )}
      {shouldLoad && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          onLoadedData={() => setIsLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundColor: '#1f2937' }}
        >
          <source src={video.video} type="video/mp4" />
        </video>
      )}
      <div className={`absolute inset-0 bg-gradient-to-t ${video.color}/30 to-transparent`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/40 backdrop-blur-sm">
        <span className="text-white text-xs font-medium">1.00</span>
      </div>
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

function HeroVideoCarousel({ style }: { style?: React.CSSProperties }) {
  const [heroVideos] = useState(() => shuffleArray(heroVideosData));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondIndex, setSecondIndex] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 2) % heroVideos.length);
      setSecondIndex((prev) => (prev + 2) % heroVideos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroVideos.length]);

  const currentVideo = heroVideos[currentIndex];
  const secondVideo = heroVideos[secondIndex];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      style={style}
      className="relative hidden lg:block"
    >
      <div className="relative">
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
              <HeroVideoCard video={currentVideo} eager />
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
              className="aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl"
            >
              <HeroVideoCard video={secondVideo} eager />
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            y: [0, -8, 0],
          }}
          transition={{ 
            opacity: { duration: 0.5, delay: 0.8 },
            scale: { duration: 0.5, delay: 0.8 },
            y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute -bottom-6 -left-6 bg-card border border-border rounded-2xl p-4 shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Parceria fechada!</p>
              <p className="font-semibold text-foreground">+R$ 2.500</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            y: [0, -10, 0],
          }}
          transition={{ 
            opacity: { duration: 0.5, delay: 1 },
            scale: { duration: 0.5, delay: 1 },
            y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }
          }}
          className="absolute -top-4 -right-4 bg-card border border-border rounded-2xl p-4 shadow-xl"
        >
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">+127%</p>
            <p className="text-xs text-muted-foreground">Crescimento médio</p>
          </div>
        </motion.div>

        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-2">
          {heroVideos.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrentIndex(i);
                setSecondIndex((i + 1) % heroVideos.length);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex || i === secondIndex
                  ? "bg-primary w-4"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const videoY = useTransform(scrollYProgress, [0, 1], [0, -50]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-background font-sans">
      <SEO 
        title="Conecte sua marca com criadores de conteúdo UGC"
        description="Plataforma líder no Brasil para marketing de influência. Encontre creators, gerencie campanhas e escale resultados com UGC. +50K creators, +250 marcas."
        keywords="UGC, marketing de influência, creators, influenciadores, campanhas digitais, conteúdo autêntico, Brasil, plataforma de influenciadores"
        url="/"
      />
      <OrganizationSchema />
      <WebSiteSchema />
      
      <PublicHeader showAnnouncementBar />

      <section id="inicio" ref={heroRef} className="relative overflow-hidden pt-32 pb-24 lg:pt-40 lg:pb-32">
        <DeferredBackgrounds />

        {/* Animated gradient orbs - visible on all sizes */}
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-[10%] w-72 h-72 rounded-full opacity-20 pointer-events-none z-[0]"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)", filter: "blur(40px)" }}
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute bottom-10 right-[5%] w-96 h-96 rounded-full opacity-15 pointer-events-none z-[0]"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)", filter: "blur(50px)" }}
        />
        <motion.div
          animate={{ x: [0, 15, 0], y: [0, -15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          className="absolute top-1/2 left-1/2 w-60 h-60 rounded-full opacity-10 pointer-events-none z-[0]"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.5) 0%, transparent 70%)", filter: "blur(35px)" }}
        />

        {/* Floating icon badges */}
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-28 right-[8%] w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center z-[1]"
        >
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary/40" />
        </motion.div>
        <motion.div
          animate={{ y: [0, -8, 0], rotate: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="absolute top-40 left-[5%] w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center z-[1]"
        >
          <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400/40" />
        </motion.div>

        {/* Animated floating particles */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute top-36 left-[15%] w-2 h-2 rounded-full bg-violet-400/50 z-[1]"
        />
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-44 right-[20%] w-3 h-3 rounded-full bg-cyan-400/40 z-[1]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-52 right-[5%] w-2 h-2 rounded-full bg-amber-400/50 z-[1]"
        />
        <motion.div
          animate={{ y: [0, -20, 0], x: [0, 10, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          className="absolute bottom-32 left-[12%] w-3 h-3 rounded-full bg-pink-400/40 z-[1]"
        />
        <motion.div
          animate={{ y: [0, 15, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
          className="absolute top-1/3 right-[3%] w-4 h-4 rounded-sm bg-primary/15 border border-primary/20 z-[1]"
        />
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [0, -90, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute bottom-20 right-[15%] w-3 h-3 rounded-sm bg-emerald-400/15 border border-emerald-400/20 z-[1] hidden lg:block"
        />

        {/* Floating stats cards - desktop only */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0, y: [0, -6, 0] }}
          transition={{ opacity: { duration: 0.8, delay: 1.2 }, y: { duration: 5, repeat: Infinity, ease: "easeInOut" } }}
          className="absolute top-[35%] left-[3%] hidden xl:flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl px-3 py-2 shadow-lg z-[1]"
        >
          <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
            <Users className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">+50K</p>
            <p className="text-[10px] text-muted-foreground">Creators</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
          transition={{ opacity: { duration: 0.8, delay: 1.5 }, y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 } }}
          className="absolute bottom-[25%] left-[5%] hidden xl:flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl px-3 py-2 shadow-lg z-[1]"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">+127%</p>
            <p className="text-[10px] text-muted-foreground">ROI Médio</p>
          </div>
        </motion.div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div style={{ y: heroY, opacity: heroOpacity }} className="space-y-8 text-center lg:text-left">
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, type: "spring" }}
                className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm"
              >
                <PulsingDot className="mr-2" size="w-2 h-2" />
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                </motion.span>
                A plataforma #1 de Creators
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, type: "spring", stiffness: 100 }}
                className="hero-headline font-heading text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.1] text-foreground"
              >
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  Conecte sua marca{" "}
                </motion.span>
                <motion.span 
                  className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-cyan-400 inline-block"
                  initial={{ opacity: 0, scale: 0.8, rotateX: 45 }}
                  animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                  transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  a quem vende.
                </motion.span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="hero-description text-sm sm:text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0"
              >
                <span className="hidden sm:inline">Crie e gerencie seu programa de creators: recrutamento, onboarding e gestão da comunidade, campanhas e entregas, tracking e comissões automatizadas. Tudo em um só lugar, do primeiro contato a venda.</span>
                <span className="sm:hidden">Crie e gerencie seu programa de creators: recrutamento, comunidade, campanhas, tracking e comissões.</span>
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 items-center lg:items-start"
              >
                <Link href="/auth?role=company">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <GlowButton size="lg" className="h-14 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-semibold w-full sm:w-auto relative overflow-hidden group" data-testid="button-signup-company">
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.6 }}
                      />
                      <Briefcase className="mr-2 h-5 w-5 relative z-10" />
                      <span className="relative z-10">Sou uma Marca</span>
                      <motion.div
                        className="relative z-10 ml-2"
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <ArrowRight className="h-5 w-5" />
                      </motion.div>
                    </GlowButton>
                  </motion.div>
                </Link>
                <Link href="/para-criadores">
                  <motion.div 
                    whileHover={{ scale: 1.05, y: -2 }} 
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Button size="lg" className="h-14 px-8 text-base bg-violet-600/70 hover:bg-violet-600/90 text-white border border-violet-500/30 rounded-full font-semibold w-full sm:w-auto relative overflow-hidden group backdrop-blur-sm" data-testid="button-signup-creator">
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.6 }}
                      />
                      <PenTool className="mr-2 h-5 w-5 relative z-10" />
                      <span className="relative z-10">Sou Criador</span>
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>

              {/* Trust Badge - Companies & Reviews */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="flex items-center gap-3 pt-6"
              >
                <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-full bg-white/5 dark:bg-white/5 border border-white/10 dark:border-white/10 backdrop-blur-sm">
                  {/* Company logos in circles */}
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-white overflow-hidden border-2 border-background flex items-center justify-center p-1">
                      <img src="/attached_assets/logo-roxo_1767026682997.png" alt="Logo Guday - Empresa parceira do CreatorConnect" className="w-full h-full object-contain" loading="lazy" decoding="async" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white overflow-hidden border-2 border-background flex items-center justify-center p-1">
                      <img src="/attached_assets/logo-bready_1767026723827.webp" alt="Logo Bready - Empresa parceira do CreatorConnect" className="w-full h-full object-contain" loading="lazy" decoding="async" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white overflow-hidden border-2 border-background flex items-center justify-center p-1">
                      <img src="/attached_assets/18242756-zs8erl6v2k_1767026661672.png" alt="Logo Ocean Drop - Empresa parceira do CreatorConnect" className="w-full h-full object-contain" loading="lazy" decoding="async" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white overflow-hidden border-2 border-background flex items-center justify-center p-1">
                      <img src="/attached_assets/liquidz_logo-png-1_1767026674647.png" alt="Logo Liquidz - Empresa parceira do CreatorConnect" className="w-full h-full object-contain" loading="lazy" decoding="async" />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    {/* Stars */}
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                    
                    {/* Text */}
                    <span className="text-xs font-medium text-white/80">
                      +250 Empresas Confiam
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="flex flex-wrap items-center gap-4 pt-4"
              >
              </motion.div>
            </motion.div>

            <HeroVideoCarousel style={{ y: videoY } as any} />
          </div>
          
          <MobileVideoCarousel />
        </div>
      </section>

      <section id="clientes" className="py-12 border-y border-border/50 bg-muted/20 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-6"
          >
            Marcas que confiam em criadores
          </motion.p>
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
            <Marquee pauseOnHover duration={25} reverse>
              {brandLogos.map((brand, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center h-10 px-8 mx-4 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {brand.isImage ? (
                    <img 
                      src={brand.logo} 
                      alt={`Logo ${brand.name} - Marca parceira do CreatorConnect`}
                      className={`${(brand as any).size === "large" ? "h-12" : (brand as any).size === "small" ? "h-5" : "h-8"} w-auto object-contain ${(brand as any).mixBlend ? "mix-blend-multiply dark:invert dark:mix-blend-screen" : (brand as any).forceWhite ? "brightness-0 dark:invert" : "grayscale dark:brightness-200 dark:invert"}`}
                      loading="lazy"
                      decoding="async"
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

      <LazySection><BoldStatements /></LazySection>
      
      <LazySection>
        <BigMetric 
          startDate="2025-12-20T00:00:00"
          baseValue={15000000}
          ratePerSecond={0.12}
          prefix="R$ "
          label="Em parcerias pagas, e contando..."
        />
      </LazySection>

      <LazySection><VideoShowcase /></LazySection>

      <LazySection><FeatureShowcase /></LazySection>

      <LazySection><IntegrationsGrid /></LazySection>

      <LazySection><TrustStrip /></LazySection>

      <LazySection><BentoGrid /></LazySection>

      <LazySection><CustomerSpotlight /></LazySection>

      <section className="py-20 md:py-32 relative overflow-hidden bg-muted/30 dark:bg-zinc-950">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 opacity-40" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "0px 0px -80px 0px" }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -80px 0px" }}
              className="mb-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 via-violet-500/20 to-primary/20 border border-primary/30 backdrop-blur-sm">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-green-500"
                />
                <span className="text-sm font-medium text-foreground">+R$ 15 milhões em parcerias fechadas</span>
              </div>
            </motion.div>
            
            <h2 className="font-heading text-4xl sm:text-5xl lg:text-7xl font-black text-foreground mb-6">
              Pronto para{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-primary via-violet-500 to-pink-500 bg-clip-text text-transparent">crescer</span>
                <motion.span 
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary via-violet-500 to-pink-500 rounded-full"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, margin: "0px 0px -80px 0px" }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                />
              </span>
              ?
            </h2>
            <p className="text-muted-foreground text-lg sm:text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
              A plataforma que conecta <span className="text-foreground font-semibold">marcas</span> e <span className="text-foreground font-semibold">criadores</span> para campanhas de sucesso.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 max-w-2xl mx-auto">
              <motion.div 
                whileHover={{ y: -2 }}
                className="flex items-center gap-3 px-5 py-3 rounded-xl bg-card/50 dark:bg-zinc-900/50 border border-border/50 backdrop-blur-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
                <span className="text-sm font-medium text-foreground">Sem mensalidade</span>
              </motion.div>
              <motion.div 
                whileHover={{ y: -2 }}
                className="flex items-center gap-3 px-5 py-3 rounded-xl bg-card/50 dark:bg-zinc-900/50 border border-border/50 backdrop-blur-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-blue-500" />
                </div>
                <span className="text-sm font-medium text-foreground">Cadastro em 2 min</span>
              </motion.div>
              <motion.div 
                whileHover={{ y: -2 }}
                className="flex items-center gap-3 px-5 py-3 rounded-xl bg-card/50 dark:bg-zinc-900/50 border border-border/50 backdrop-blur-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <Heart className="h-4 w-4 text-violet-500" />
                </div>
                <span className="text-sm font-medium text-foreground">Suporte humanizado</span>
              </motion.div>
            </div>
            
            <Link href="/auth">
              <motion.div 
                whileHover={{ scale: 1.03, y: -2 }} 
                whileTap={{ scale: 0.98 }}
                className="inline-block"
              >
                <GlowButton size="lg" className="h-16 px-14 text-lg bg-gradient-to-r from-primary via-violet-600 to-primary text-white hover:opacity-90 rounded-full font-bold shadow-2xl shadow-primary/30" data-testid="button-cta-signup">
                  Começar Grátis Agora
                  <ArrowRight className="ml-3 h-5 w-5" />
                </GlowButton>
              </motion.div>
            </Link>
            
            <div className="mt-10 flex items-center justify-center gap-8 text-muted-foreground">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm"><span className="font-semibold text-foreground">+15mi</span> em parcerias</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm"><span className="font-semibold text-foreground">500+</span> creators ativos</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
