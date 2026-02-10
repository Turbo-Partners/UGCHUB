import { motion } from "framer-motion";
import { Users, Zap, Shield, BarChart3, Gift, MessageSquare, DollarSign, TrendingUp, Sparkles, Check, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FloatingDiamonds, SweepingLight } from "./animated-elements";
import { Link } from "wouter";
import { GlowButton } from "./glow-button";

function GlowingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-primary/50 rounded-full"
          style={{
            left: `${8 + i * 8}%`,
            top: `${12 + (i % 6) * 15}%`,
          }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [1, 2, 1],
          }}
          transition={{
            duration: 3 + i * 0.2,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
}

interface BentoItemProps {
  title: string;
  description: string;
  icon: LucideIcon;
  className?: string;
  gradient?: string;
  iconColor?: string;
  delay?: number;
  visual?: React.ReactNode;
  featured?: boolean;
}

function FloatingIcons() {
  const icons = [
    { emoji: "📸", x: 20, y: 15, delay: 0 },
    { emoji: "🎵", x: 75, y: 25, delay: 0.2 },
    { emoji: "▶️", x: 40, y: 70, delay: 0.4 },
    { emoji: "🛒", x: 85, y: 65, delay: 0.6 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {icons.map((icon, i) => (
        <motion.div
          key={i}
          className="absolute w-10 h-10 rounded-xl bg-card dark:bg-zinc-800 border border-border/50 dark:border-zinc-700 flex items-center justify-center shadow-lg"
          style={{ left: `${icon.x}%`, top: `${icon.y}%` }}
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          animate={{ 
            y: [0, -8, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            opacity: { delay: 0.5 + icon.delay, type: "spring" },
            scale: { delay: 0.5 + icon.delay, type: "spring" },
            y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: icon.delay },
            rotate: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: icon.delay }
          }}
        >
          <span className="text-lg">{icon.emoji}</span>
        </motion.div>
      ))}
    </div>
  );
}

function MetricDisplay() {
  return (
    <div className="flex items-end gap-4 mt-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, type: "spring" }}
        className="relative"
      >
        <span className="font-heading text-6xl lg:text-7xl font-black bg-gradient-to-br from-primary via-primary to-violet-500 bg-clip-text text-transparent">
          4X
        </span>
        <motion.div
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <TrendingUp className="w-3 h-3 text-white" />
        </motion.div>
      </motion.div>
      <div className="pb-2">
        <p className="text-sm font-semibold text-foreground">ROI médio</p>
        <p className="text-xs text-muted-foreground">nas campanhas</p>
      </div>
    </div>
  );
}

function DataOrbit() {
  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-32 h-32">
      <motion.div 
        className="absolute inset-0 rounded-full border border-dashed border-primary/30"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <motion.div 
        className="absolute inset-[20%] rounded-full border border-primary/40"
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute inset-[35%] rounded-full bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center">
        <Sparkles className="w-5 h-5 text-primary" />
      </div>
      {[0, 90, 180, 270].map((angle, i) => (
        <motion.div
          key={angle}
          className="absolute w-3 h-3 bg-primary rounded-full"
          style={{
            left: `${50 + 45 * Math.cos((angle * Math.PI) / 180)}%`,
            top: `${50 + 45 * Math.sin((angle * Math.PI) / 180)}%`,
            transform: "translate(-50%, -50%)"
          }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
        />
      ))}
    </div>
  );
}

function CheckList() {
  const items = ["Propostas automáticas", "Contratos digitais", "Pagamentos em 1 clique"];
  return (
    <div className="space-y-2 mt-4">
      {items.map((item, i) => (
        <motion.div
          key={item}
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 + i * 0.1 }}
          className="flex items-center gap-2"
        >
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Check className="w-3 h-3 text-emerald-500" />
          </div>
          <span className="text-sm text-muted-foreground">{item}</span>
        </motion.div>
      ))}
    </div>
  );
}

function MiniBarChart() {
  const bars = [40, 65, 45, 80, 60, 90, 70];
  return (
    <div className="flex items-end gap-1 h-16 mt-4">
      {bars.map((height, i) => (
        <motion.div
          key={i}
          className="flex-1 bg-gradient-to-t from-primary/60 to-primary rounded-t"
          initial={{ height: 0 }}
          whileInView={{ height: `${height}%` }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 + i * 0.05, duration: 0.5, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

function BentoItem({ 
  title, 
  description, 
  icon: Icon, 
  className = "", 
  gradient = "from-primary/20 to-primary/5",
  iconColor = "text-primary",
  delay = 0,
  visual,
  featured = false
}: BentoItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, type: "spring", stiffness: 100 }}
      whileHover={{ 
        y: -8, 
        scale: 1.02, 
        transition: { duration: 0.3, type: "spring", stiffness: 300 } 
      }}
      className={`group relative p-6 rounded-2xl ${featured ? "bg-primary/5 dark:bg-zinc-900 border-primary/20 dark:border-zinc-800" : "bg-card/80 dark:bg-card/50 border-border/50"} backdrop-blur-sm border hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all overflow-hidden cursor-pointer ${className}`}
      data-testid={`bento-item-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {/* Shimmer effect on hover */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer pointer-events-none"
        style={{
          backgroundSize: "200% 100%",
        }}
      />
      
      {/* Glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
        }}
      />
      
      {!featured && <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-100`} />}
      
      {featured && (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(var(--tw-gradient-stops))] from-primary/5 to-violet-500/5 dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] dark:bg-[size:24px_24px]" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-violet-500/10" />
        </>
      )}
      
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </div>
      
      <div className="relative z-10">
        <div className={`h-12 w-12 rounded-xl ${featured ? "bg-primary/10 dark:bg-zinc-800 border-primary/20 dark:border-zinc-700" : "bg-background/80 border-border/50"} border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <h3 className={`font-heading font-semibold text-lg mb-2 group-hover:text-primary transition-colors text-foreground`}>
          {title}
        </h3>
        <p className={`text-sm leading-relaxed text-muted-foreground`}>
          {description}
        </p>
        {visual}
      </div>
    </motion.div>
  );
}

export function BentoGrid() {
  const items = [
    {
      title: "Discovery Inteligente",
      description: "IA encontra criadores que já amam sua marca. Transforme fãs em parceiros automaticamente.",
      icon: Users,
      className: "md:col-span-2 md:row-span-1",
      gradient: "from-blue-500/15 via-blue-400/10 to-cyan-500/5",
      iconColor: "text-blue-500",
      visual: <FloatingIcons />,
    },
    {
      title: "Automação Total",
      description: "Propostas, contratos e pagamentos. Tudo no piloto automático.",
      icon: Zap,
      className: "md:col-span-1 md:row-span-2",
      gradient: "from-violet-500/15 via-purple-400/10 to-purple-500/5",
      iconColor: "text-violet-500",
      visual: <CheckList />,
      featured: true,
    },
    {
      title: "Analytics Avançado",
      description: "ROI, engajamento e conversões em tempo real.",
      icon: BarChart3,
      gradient: "from-emerald-500/15 via-green-400/10 to-green-500/5",
      iconColor: "text-emerald-500",
      visual: <MiniBarChart />,
    },
    {
      title: "ROI",
      description: "Resultados comprovados com métricas claras.",
      icon: TrendingUp,
      gradient: "from-primary/15 via-primary/10 to-violet-500/5",
      iconColor: "text-primary",
      visual: <MetricDisplay />,
      featured: true,
    },
    {
      title: "Gifting & Seeding",
      description: "Envie produtos e acompanhe entregas em tempo real.",
      icon: Gift,
      gradient: "from-pink-500/15 via-rose-400/10 to-rose-500/5",
      iconColor: "text-pink-500",
    },
    {
      title: "Comunicação Direta",
      description: "Chat integrado com criadores. Tudo em um só lugar.",
      icon: MessageSquare,
      gradient: "from-teal-500/15 via-cyan-400/10 to-cyan-500/5",
      iconColor: "text-teal-500",
    },
  ];

  return (
    <section id="recursos" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      <FloatingDiamonds />
      <SweepingLight />
      <GlowingParticles />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 mb-4"
          >
            Recursos
          </motion.span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Tudo em um só lugar
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Uma plataforma completa para gerenciar todo seu programa de creators
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item, i) => (
            <BentoItem key={item.title} {...item} delay={i * 0.08} className={`${item.className || ''} sm:col-span-1`} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link href="/auth">
            <GlowButton size="lg" className="h-12 px-8 bg-primary text-white hover:bg-primary/90 rounded-full font-semibold" data-testid="cta-recursos">
              Explorar Recursos
              <ArrowRight className="ml-2 h-4 w-4" />
            </GlowButton>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
