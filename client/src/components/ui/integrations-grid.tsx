import { motion } from "framer-motion";
import { ArrowUpRight, Plug, Package, Cloud, Store } from "lucide-react";
import { Link } from "wouter";

const integrations = [
  { name: "Instagram", icon: "https://cdn.simpleicons.org/instagram/E4405F", color: "from-pink-500/20 to-purple-500/20" },
  { name: "TikTok", icon: "https://cdn.simpleicons.org/tiktok/000000", color: "from-cyan-500/20 to-pink-500/20", invert: true },
  { name: "Shopify", icon: "https://cdn.simpleicons.org/shopify/7AB55C", color: "from-green-500/20 to-emerald-500/20" },
  { name: "Bling", icon: "/attached_assets/logo-bling-png-1_1767108792349.png", darkIcon: "/attached_assets/bling-vindi_1767108856848.png", color: "from-violet-500/20 to-purple-500/20" },
  { name: "Meta Ads", icon: "https://cdn.simpleicons.org/meta/0082FB", color: "from-blue-500/20 to-cyan-500/20" },
  { name: "Nuvemshop", icon: null, lucideIcon: "Cloud", color: "from-blue-500/20 to-indigo-500/20" },
  { name: "VTEX", icon: "https://cdn.simpleicons.org/vtex/F71963", color: "from-rose-500/20 to-pink-500/20" },
  { name: "Loja Integrada", icon: "/attached_assets/novo-logo-loja-integrada-2021_1_1767108713445.png", color: "from-orange-500/20 to-amber-500/20" },
];

function ConnectingLines() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden hidden lg:block">
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(99, 102, 241, 0)" />
            <stop offset="50%" stopColor="rgba(99, 102, 241, 0.5)" />
            <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
          </linearGradient>
        </defs>
      </svg>
      
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
          style={{
            width: `${60 + i * 10}%`,
            left: `${20 - i * 5}%`,
            top: `${25 + i * 12}%`,
          }}
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
        />
      ))}
      
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`v-${i}`}
          className="absolute w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent"
          style={{
            height: `${50 + i * 10}%`,
            left: `${20 + i * 20}%`,
            top: `${25 - i * 5}%`,
          }}
          initial={{ opacity: 0, scaleY: 0 }}
          whileInView={{ opacity: 1, scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5 + i * 0.15 }}
        />
      ))}
      
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`dot-${i}`}
          className="absolute w-2 h-2 bg-primary/60 rounded-full"
          style={{
            left: `${15 + i * 11}%`,
            top: `${20 + (i % 4) * 18}%`,
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 2 + i * 0.3,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}

function CenterOrbit() {
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none hidden lg:block">
      <motion.div
        className="absolute inset-0 rounded-full border border-dashed border-primary/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-[15%] rounded-full border border-dashed border-primary/15"
        animate={{ rotate: -360 }}
        transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-[30%] rounded-full border border-dashed border-primary/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />
      
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-violet-500/20 flex items-center justify-center border border-primary/30"
        style={{
          boxShadow: "0 0 60px rgba(99, 102, 241, 0.3)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          boxShadow: [
            "0 0 60px rgba(99, 102, 241, 0.3)",
            "0 0 80px rgba(99, 102, 241, 0.5)",
            "0 0 60px rgba(99, 102, 241, 0.3)",
          ],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <img 
          src="/attached_assets/freepik__background__5578_1767050858710.png" 
          alt="CreatorConnect" 
          className="w-12 h-12 rounded-full object-cover"
        />
      </motion.div>
    </div>
  );
}

export function IntegrationsGrid() {
  return (
    <section id="integracoes" className="py-24 bg-muted/30 dark:bg-zinc-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <ConnectingLines />
      <CenterOrbit />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium bg-primary/10 dark:bg-white/5 text-primary dark:text-white/80 border border-primary/20 dark:border-white/10 mb-6">
            <Plug className="w-3 h-3" />
            INTEGRAÇÕES
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-6xl font-black text-foreground mb-6 uppercase tracking-tight">
            Um clique,<br />conecte tudo.
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Conecte instantaneamente com as principais plataformas de redes sociais e e-commerce usando nossas integrações nativas.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto mb-12">
          {integrations.map((integration, i) => (
            <motion.div
              key={integration.name}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06, type: "spring" }}
              whileHover={{ y: -6, scale: 1.03 }}
              className="group relative flex items-center gap-3 p-5 rounded-2xl bg-card dark:bg-zinc-900/90 border border-border dark:border-zinc-800 hover:border-primary/60 transition-all cursor-pointer overflow-hidden backdrop-blur-sm"
              style={{
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              }}
              data-testid={`integration-${integration.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${integration.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: "radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
                }}
              />
              
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 dark:via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10 flex items-center gap-3 w-full">
                <motion.div 
                  className="w-12 h-12 rounded-xl bg-muted dark:bg-zinc-800/80 border border-border dark:border-zinc-700/50 flex items-center justify-center group-hover:scale-110 group-hover:border-primary/30 transition-all"
                  whileHover={{ rotate: 5 }}
                >
                  {integration.icon ? (
                    <>
                      <img 
                        src={integration.icon} 
                        alt={integration.name} 
                        className={`w-6 h-6 object-contain ${(integration as any).darkIcon ? "dark:hidden" : ""} ${(integration as any).invert ? "dark:invert" : ""}`}
                      />
                      {(integration as any).darkIcon && (
                        <img 
                          src={(integration as any).darkIcon} 
                          alt={integration.name} 
                          className="w-6 h-6 object-contain hidden dark:block"
                        />
                      )}
                    </>
                  ) : (integration as any).lucideIcon === "Package" ? (
                    <Package className="w-6 h-6 text-primary" />
                  ) : (integration as any).lucideIcon === "Cloud" ? (
                    <Cloud className="w-6 h-6 text-primary" />
                  ) : (integration as any).lucideIcon === "Store" ? (
                    <Store className="w-6 h-6 text-primary" />
                  ) : null}
                </motion.div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{integration.name}</p>
                  <p className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">Conectado</p>
                </div>
              </div>
              
              <motion.div
                className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-emerald-500"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link href="/auth" className="inline-block">
            <span className="inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-white rounded-full h-12 px-8 font-medium transition-colors cursor-pointer" data-testid="view-integrations-button">
              Começar Agora
              <ArrowUpRight className="w-4 h-4 ml-2" />
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
