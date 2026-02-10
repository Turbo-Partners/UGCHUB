import { motion } from "framer-motion";
import { GlowingOrbs, SweepingLight } from "./animated-elements";
import { Button } from "./button";
import { ArrowUpRight } from "lucide-react";
import { Link } from "wouter";

const brands = [
  { 
    name: "Guday", 
    logo: "/attached_assets/logo-roxo_1767026682997.png",
    gridPosition: { col: 1, row: 1 }
  },
  { 
    name: "Ocean Drop", 
    logo: "/attached_assets/logo_oceandrop_1767050134921.png",
    gridPosition: { col: 2, row: 1 },
    size: "large"
  },
  { 
    name: "Minimal Club", 
    logo: "/attached_assets/Logo_Header_94582ed2-dc65-4f29-8e6a-3e2a2e96ba5b_1_1767026751041.png",
    gridPosition: { col: 3, row: 1 }
  },
  { 
    name: "Hommy", 
    logo: null,
    text: "hommy",
    gridPosition: { col: 4, row: 1 },
    size: "xxlarge"
  },
  { 
    name: "True Source", 
    logo: "/attached_assets/true_source_logo.png",
    text: null,
    gridPosition: { col: 5, row: 1 },
    forceWhite: true
  },
  { 
    name: "Liquidz", 
    logo: "/attached_assets/freepik__adjust__40502_1767049905471.png",
    gridPosition: { col: 1, row: 2 },
    size: "large"
  },
  { 
    name: "Le Lis Blanc", 
    logo: null,
    text: "LE LIS BLANC",
    gridPosition: { col: 2, row: 2 }
  },
  { 
    name: "PushPow", 
    logo: "/attached_assets/2358x292_1767026751040.png",
    gridPosition: { col: 3, row: 2 }
  },
  { 
    name: "Bready", 
    logo: "/attached_assets/logo-bready_1767026723827.webp",
    gridPosition: { col: 4, row: 2 }
  },
  { 
    name: "+250",
    logo: null,
    text: null,
    isBadge: true,
    gridPosition: { col: 5, row: 2 }
  },
];

function GridBackground() {
  return (
    <div className="absolute inset-0 hidden md:block">
      <svg className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <pattern id="clientGrid" width="200" height="80" patternUnits="userSpaceOnUse">
            <rect width="200" height="80" fill="none" stroke="currentColor" strokeOpacity="0.06" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#clientGrid)" className="text-foreground" />
      </svg>
      
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 bg-foreground/30 rotate-45"
          style={{
            left: `${10 + (i % 5) * 20}%`,
            top: `${20 + Math.floor(i / 5) * 40}%`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.03, duration: 0.3 }}
        />
      ))}
    </div>
  );
}

export function TrustStrip() {
  return (
    <section className="py-20 bg-muted/30 dark:bg-zinc-950 relative overflow-hidden border-y border-border/50 dark:border-zinc-800/50">
      <SweepingLight />
      <div className="opacity-50">
        <GlowingOrbs />
      </div>
      <GridBackground />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center mb-12"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-white/5 border border-primary/20 dark:border-white/10 mb-6"
          >
            <div className="flex -space-x-1">
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] text-white font-bold">✓</div>
              <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-[10px] text-white font-bold">★</div>
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold">G</div>
            </div>
            <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-sm">★</span>
              ))}
            </div>
            <span className="text-xs font-medium text-muted-foreground dark:text-zinc-400">300+ reviews</span>
          </motion.div>
          
          <p className="text-muted-foreground dark:text-zinc-400 text-lg text-center max-w-2xl">
            Marcas líderes confiam no <span className="text-foreground dark:text-white font-semibold">CreatorConnect</span> para escalar{" "}
            campanhas de <span className="text-foreground dark:text-white font-semibold">marketing de influência</span> e{" "}
            <span className="text-foreground dark:text-white font-semibold">gerar resultados reais</span>.
          </p>
        </motion.div>

        {/* Grid layout with liquid glass hover */}
        <div className="relative max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-px bg-border/20 dark:bg-zinc-800/20 rounded-xl overflow-hidden border border-border/30 dark:border-zinc-800/30">
            {brands.map((brand, i) => {
              const colors = [
                "from-violet-500/30 via-purple-500/20 to-fuchsia-500/30",
                "from-blue-500/30 via-cyan-500/20 to-teal-500/30",
                "from-rose-500/30 via-pink-500/20 to-red-500/30",
                "from-amber-500/30 via-orange-500/20 to-yellow-500/30",
                "from-emerald-500/30 via-green-500/20 to-lime-500/30",
                "from-indigo-500/30 via-blue-500/20 to-violet-500/30",
                "from-cyan-500/30 via-sky-500/20 to-blue-500/30",
                "from-pink-500/30 via-rose-500/20 to-fuchsia-500/30",
              ];
              const colorClass = colors[i % colors.length];
              
              if ((brand as any).isBadge) {
                return (
                  <motion.div
                    key={brand.name}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 }}
                    className="relative bg-gradient-to-br from-primary/10 to-violet-500/10 dark:from-primary/20 dark:to-violet-500/20 p-8 flex items-center justify-center transition-all duration-500 group cursor-pointer overflow-hidden"
                    data-testid="brand-badge-250"
                  >
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-br from-primary/30 to-violet-500/30"
                      animate={{
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.02, 1],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-violet-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative z-10 text-center">
                      <motion.span 
                        className="block text-2xl font-black text-primary dark:text-primary"
                        animate={{
                          scale: [1, 1.05, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        +250
                      </motion.span>
                      <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">empresas</span>
                    </div>
                  </motion.div>
                );
              }
              
              return (
                <motion.div
                  key={brand.name}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className={`relative bg-background dark:bg-zinc-950 p-8 flex items-center justify-center transition-all duration-500 group cursor-pointer overflow-hidden`}
                  data-testid={`brand-logo-${brand.name.toLowerCase()}`}
                >
                  {/* Colorful liquid glass effect on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} opacity-0 group-hover:opacity-100 transition-opacity duration-500 backdrop-blur-sm`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-0 border border-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-sm" />
                  
                    <div className="relative z-10 opacity-50 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105 transform">
                    {brand.logo ? (
                      <img 
                        src={brand.logo} 
                        alt={brand.name} 
                        className={`${(brand as any).size === "xxlarge" ? "h-28 max-w-[280px]" : (brand as any).size === "xlarge" ? "h-20 max-w-[220px]" : (brand as any).size === "large" ? "h-16 max-w-[180px]" : "h-10 max-w-[140px]"} w-auto object-contain ${(brand as any).forceWhite ? "brightness-0 invert" : "grayscale contrast-[1.2] dark:grayscale dark:brightness-200 dark:invert"}`}
                      />
                    ) : (
                      <span className={`text-foreground dark:text-white font-semibold tracking-wide whitespace-nowrap ${(brand as any).size === "xxlarge" ? "text-4xl" : (brand as any).size === "xlarge" ? "text-2xl" : "text-base"}`}>{brand.text}</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex justify-center mt-10"
        >
          <Link href="/auth">
            <Button 
              className="font-semibold bg-primary text-white hover:bg-primary/90 rounded-full px-8 h-12 text-sm shadow-xl shadow-primary/40 border border-primary/50"
              data-testid="button-cta-trust-strip"
            >
              Começar Agora
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
