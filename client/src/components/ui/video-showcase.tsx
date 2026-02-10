import { motion } from "framer-motion";
import { useState, useRef, useCallback, useEffect, type MouseEvent } from "react";
import { Play, Pause, Volume2, VolumeX, Sparkles, Eye, Heart, TrendingUp, CheckCircle, Zap, Award, Star, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

const videosData = [
  {
    src: "/media/ugc/paris.mp4",
    creator: "Ana Laura",
    brand: "Óticas Paris",
    views: "187K",
    likes: "14.9K",
    growth: "+89%",
    verified: true,
    color: "from-sky-500",
  },
  {
    src: "/media/ugc/oticas-paris-full.mp4",
    creator: "Ana Luiza",
    brand: "Óticas Paris",
    views: "324K",
    likes: "26.8K",
    growth: "+167%",
    verified: true,
    color: "from-amber-500",
  },
  {
    src: "/attached_assets/66abe745afaa2b8c0a261b86_66d7624a28fb1053ce1e30db_VEED_Create__1766970674217.mp4",
    creator: "Lara Groberio",
    brand: "BioGummy",
    views: "245K",
    likes: "18.2K",
    growth: "+127%",
    verified: true,
    color: "from-emerald-500",
  },
  {
    src: "/media/ugc/trizzi.mp4",
    creator: "Raphaela Oliveira",
    brand: "Trizzi",
    views: "342K",
    likes: "28.4K",
    growth: "+189%",
    verified: true,
    color: "from-pink-500",
  },
  {
    src: "/attached_assets/618da0947823662661595607_67866f49858aa064f7d2f6b4_cacow-natali_1766974978182.mp4",
    creator: "Natalia Rody",
    brand: "Cacow",
    views: "312K",
    likes: "24.5K",
    growth: "+156%",
    verified: true,
    color: "from-amber-500",
  },
  {
    src: "/media/ugc/farme.mp4",
    creator: "Moyara",
    brand: "Far-me",
    views: "267K",
    likes: "19.8K",
    growth: "+112%",
    verified: true,
    color: "from-violet-500",
  },
  {
    src: "/media/ugc/minimal.mp4",
    creator: "Rodrigo Padrão",
    brand: "Minimal",
    views: "198K",
    likes: "15.3K",
    growth: "+95%",
    verified: true,
    color: "from-cyan-500",
  },
  {
    src: "/media/ugc/cacow-elisa.mp4",
    creator: "Elisa Ferreira",
    brand: "Cacow",
    views: "278K",
    likes: "21.6K",
    growth: "+134%",
    verified: true,
    color: "from-rose-500",
  },
  {
    src: "/media/ugc/bready.mp4",
    creator: "Luana Giestas",
    brand: "Bready",
    views: "289K",
    likes: "22.1K",
    growth: "+145%",
    verified: true,
    color: "from-orange-500",
  },
  {
    src: "/media/ugc/biogummy-monise.mp4",
    creator: "Monise Costa",
    brand: "BioGummy",
    views: "223K",
    likes: "17.8K",
    growth: "+118%",
    verified: true,
    color: "from-teal-500",
  },
  {
    src: "/media/ugc/biogummy-nadia.mp4",
    creator: "Nadia Oliveira",
    brand: "BioGummy",
    views: "256K",
    likes: "20.2K",
    growth: "+142%",
    verified: true,
    color: "from-indigo-500",
  },
  {
    src: "/media/ugc/gioey.mp4",
    creator: "Gioey",
    brand: "Beauty",
    views: "198K",
    likes: "16.7K",
    growth: "+108%",
    verified: true,
    color: "from-fuchsia-500",
  },
  {
    src: "/media/ugc/ugc-1.mp4",
    creator: "Ana Carolina",
    brand: "Lifestyle",
    views: "156K",
    likes: "11.3K",
    growth: "+78%",
    verified: true,
    color: "from-lime-500",
  },
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function FloatingOrb({ delay, size, left, top, color }: { delay: number; size: number; left: string; top: string; color: string }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl opacity-20 ${color}`}
      style={{ width: size, height: size, left, top }}
      animate={{
        y: [0, -40, 0],
        x: [0, 20, 0],
        scale: [1, 1.2, 1],
        opacity: [0.15, 0.25, 0.15],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
    />
  );
}

function FloatingParticle({ delay, left, top }: { delay: number; left: string; top: string }) {
  return (
    <motion.div
      className="absolute w-1 h-1 bg-primary rounded-full"
      style={{ left, top }}
      animate={{
        y: [0, -60, 0],
        opacity: [0, 1, 0],
        scale: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
    />
  );
}

function AnimatedStar({ delay, left, top, size }: { delay: number; left: string; top: string; size: number }) {
  return (
    <motion.div
      className="absolute text-primary/30"
      style={{ left, top }}
      animate={{
        rotate: [0, 180, 360],
        scale: [1, 1.3, 1],
        opacity: [0.2, 0.5, 0.2],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
    >
      <Star className="fill-current" style={{ width: size, height: size }} />
    </motion.div>
  );
}

function VideoCard({ video, index }: { video: typeof videosData[0]; index: number }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.play().catch(() => {});
    }
  }, []);

  const handlePlayPause = (e: MouseEvent) => {
    e.stopPropagation();
    const videoEl = videoRef.current;
    if (videoEl) {
      if (isPlaying) {
        videoEl.pause();
      } else {
        videoEl.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMute = (e: MouseEvent) => {
    e.stopPropagation();
    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-zinc-900 group cursor-pointer shadow-2xl shadow-black/30"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handlePlayPause}
      data-testid={`video-card-${index}`}
    >
      <video
        ref={videoRef}
        src={video.src}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loop
        muted={isMuted}
        playsInline
        autoPlay
        preload="metadata"
      />
      
      <div className={`absolute inset-0 bg-gradient-to-t ${video.color}/30 to-transparent`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      
      <motion.div 
        className="absolute top-3 left-3 right-3 flex items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: isHovered ? 1 : 0.7, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 rounded-md bg-black/50 backdrop-blur-md border border-white/10">
            <div className="flex items-center gap-1.5">
              <Eye className="w-3 h-3 text-white/80" />
              <span className="text-white text-xs font-medium">{video.views}</span>
            </div>
          </div>
        </div>
        
        <motion.div 
          className="px-2 py-1 rounded-md bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30"
          animate={{ scale: isHovered ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400 text-xs font-bold">{video.growth}</span>
          </div>
        </motion.div>
      </motion.div>
      
      <motion.div 
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered && !isPlaying ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-xl"
          data-testid={`play-button-${index}`}
        >
          {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
        </motion.button>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <motion.div 
          className="flex items-center gap-2 mb-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: isHovered ? 1 : 0.8, y: isHovered ? 0 : 5 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm">
            <Heart className="w-3 h-3 text-rose-400" />
            <span className="text-white/90 text-xs font-medium">{video.likes}</span>
          </div>
        </motion.div>
        
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className="text-white font-semibold text-sm">{video.creator}</p>
              {video.verified && (
                <CheckCircle className="w-3.5 h-3.5 text-primary fill-primary/20" />
              )}
            </div>
            <p className="text-white/60 text-xs">para <span className="text-primary/80 font-medium">{video.brand}</span></p>
          </div>
          <motion.button
            onClick={handleMute}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-white/20 transition-colors"
            data-testid={`mute-button-${index}`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </motion.button>
        </div>
      </div>
      
      <motion.div 
        className="absolute inset-0 border-2 border-primary/0 rounded-2xl pointer-events-none"
        animate={{ borderColor: isHovered ? "rgba(99, 102, 241, 0.5)" : "rgba(99, 102, 241, 0)" }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}

export function VideoShowcase() {
  return (
    <section className="py-24 md:py-32 bg-gradient-to-b from-muted/30 via-muted/50 to-muted/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 dark:from-primary/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
      
      <FloatingOrb delay={0} size={400} left="5%" top="10%" color="bg-primary" />
      <FloatingOrb delay={2} size={300} left="70%" top="60%" color="bg-violet-600" />
      <FloatingOrb delay={4} size={250} left="40%" top="20%" color="bg-indigo-500" />
      
      {[...Array(20)].map((_, i) => (
        <FloatingParticle 
          key={i}
          delay={i * 0.3}
          left={`${5 + i * 4.5}%`}
          top={`${20 + (i % 5) * 15}%`}
        />
      ))}
      
      <AnimatedStar delay={0} left="8%" top="15%" size={16} />
      <AnimatedStar delay={1} left="92%" top="25%" size={12} />
      <AnimatedStar delay={2} left="15%" top="70%" size={14} />
      <AnimatedStar delay={3} left="85%" top="65%" size={18} />
      <AnimatedStar delay={4} left="50%" top="8%" size={10} />
      
      <motion.div
        className="absolute left-1/4 top-1/3 w-px h-32 bg-gradient-to-b from-transparent via-primary/30 to-transparent"
        animate={{ opacity: [0.3, 0.6, 0.3], scaleY: [1, 1.2, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-1/4 bottom-1/4 w-px h-24 bg-gradient-to-b from-transparent via-violet-500/30 to-transparent"
        animate={{ opacity: [0.3, 0.6, 0.3], scaleY: [1, 1.3, 1] }}
        transition={{ duration: 5, repeat: Infinity, delay: 1, ease: "easeInOut" }}
      />
      
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <motion.span 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
              animate={{ 
                boxShadow: [
                  "0 0 0 0 rgba(99, 102, 241, 0)",
                  "0 0 20px 2px rgba(99, 102, 241, 0.3)",
                  "0 0 0 0 rgba(99, 102, 241, 0)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                <Sparkles className="w-3.5 h-3.5" />
              </motion.span>
              CONTEÚDO REAL
            </motion.span>
            
            <motion.span 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              animate={{ 
                y: [0, -3, 0],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              <Zap className="w-3.5 h-3.5" />
              CONTEÚDO QUE VENDE
            </motion.span>
            
            <motion.span 
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20"
              animate={{ 
                y: [0, -3, 0],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <Award className="w-3.5 h-3.5" />
              TOP CREATORS
            </motion.span>
          </div>
          
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-5">
            Criadores gerando{" "}
            <motion.span 
              className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-violet-400 to-primary bg-[size:200%_auto]"
              animate={{ backgroundPosition: ["0% center", "200% center"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              resultados
            </motion.span>
          </h2>
          <p className="text-muted-foreground text-lg lg:text-xl max-w-2xl mx-auto">
            Veja o trabalho de criadores conectados com marcas através da nossa plataforma
          </p>
        </motion.div>

        <VideoCarousel />
      </div>
    </section>
  );
}

function VideoCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true, 
    align: "start",
    slidesToScroll: 1,
    containScroll: "trimSnaps"
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);
  const [shuffledVideos] = useState(() => shuffleArray(videosData));

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();

    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 4000);
    
    return () => {
      emblaApi.off('select', onSelect);
      clearInterval(interval);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {shuffledVideos.map((video, i) => (
            <div key={i} className="flex-none w-[45%] sm:w-[30%] md:w-[22%] lg:w-[16%]">
              <VideoCard video={video} index={i} />
            </div>
          ))}
        </div>
      </div>
      
      <button
        onClick={scrollPrev}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-background/90 backdrop-blur border shadow-lg flex items-center justify-center hover:bg-background transition-colors z-10 disabled:opacity-50"
        disabled={!canScrollPrev}
        data-testid="carousel-prev"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-background/90 backdrop-blur border shadow-lg flex items-center justify-center hover:bg-background transition-colors z-10 disabled:opacity-50"
        disabled={!canScrollNext}
        data-testid="carousel-next"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
