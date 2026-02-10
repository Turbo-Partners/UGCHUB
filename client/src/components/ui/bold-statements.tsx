import { motion } from "framer-motion";
import { Sparkles, Users, Zap, BarChart3, Shield, TrendingUp, CheckCircle2 } from "lucide-react";
import { FloatingDiamonds, SweepingLight } from "./animated-elements";

function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
      {/* Floating orbs - hidden on mobile for performance */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute rounded-full bg-primary/10 blur-3xl"
          style={{
            width: `${150 + i * 50}px`,
            height: `${150 + i * 50}px`,
            left: `${10 + i * 20}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
            scale: [1, 1.1, 0.9, 1],
            opacity: [0.3, 0.5, 0.3, 0.3],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
        />
      ))}
      
      {/* Animated vertical lines */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`line-${i}`}
          className="absolute w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent"
          style={{
            left: `${25 + i * 25}%`,
            height: "100%",
          }}
          animate={{
            opacity: [0, 0.5, 0],
            scaleY: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.8,
          }}
        />
      ))}
      
      {/* Floating particles - reduced count */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 bg-primary/40 rounded-full"
          style={{
            left: `${10 + i * 9}%`,
            top: `${15 + (i % 5) * 18}%`,
          }}
          animate={{
            y: [-20, 20, -20],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.2,
          }}
        />
      ))}
      
      {/* Animated diamond accents - reduced */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`diamond-${i}`}
          className="absolute w-2 h-2 bg-primary/30 rotate-45"
          style={{
            left: `${15 + i * 22}%`,
            top: `${20 + (i % 2) * 40}%`,
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        />
      ))}
    </div>
  );
}

function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="relative max-w-4xl mx-auto mt-12"
    >
      {/* Glow effect behind dashboard */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-primary/5 to-transparent blur-3xl -z-10" />
      
      {/* Dashboard card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <img 
              src="/attached_assets/freepik__background__5578_1767050858710.png" 
              alt="CreatorConnect" 
              className="w-8 h-8 rounded-lg object-cover"
            />
            <span className="font-semibold text-zinc-900 dark:text-white">CreatorConnect</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-zinc-500">Dashboard</span>
            <span className="text-zinc-500">Campanhas</span>
            <span className="text-zinc-500">Criadores</span>
          </div>
        </div>
        
        {/* Dashboard content */}
        <div className="p-6 bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Bom dia, Maria!</h3>
              <p className="text-sm text-zinc-500">Seu resumo de performance desde Janeiro 2025.</p>
            </div>
            <motion.div 
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">3 campanhas ativas</span>
            </motion.div>
          </div>
          
          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Receita Total", value: "R$ 127.450", change: "+34%", icon: TrendingUp },
              { label: "Criadores Ativos", value: "156", change: "+12%", icon: Users },
              { label: "Taxa de Conversão", value: "8.4%", change: "+2.1%", icon: BarChart3 },
              { label: "Engajamento", value: "4.2M", change: "+45%", icon: Sparkles },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-zinc-500">{stat.label}</span>
                  <stat.icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-xl font-bold text-zinc-900 dark:text-white">{stat.value}</p>
                <span className="text-xs text-emerald-500 font-medium">{stat.change}</span>
              </motion.div>
            ))}
          </div>
          
          {/* Mini chart */}
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-zinc-900 dark:text-white">Performance Mensal</span>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span className="text-xs text-emerald-500 font-medium">+127%</span>
              </div>
            </div>
            <div className="flex items-end gap-2 h-20">
              {[40, 55, 45, 70, 60, 85, 75, 95, 80, 100, 90, 110].map((h, i) => (
                <motion.div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-primary to-violet-500 rounded-t"
                  initial={{ height: 0 }}
                  whileInView={{ height: `${h}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8 + i * 0.05, duration: 0.5 }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <motion.div
        className="absolute -left-8 top-1/2 -translate-y-1/2 w-16 h-32 bg-gradient-to-b from-primary/30 to-transparent blur-2xl"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <motion.div
        className="absolute -right-8 top-1/3 w-16 h-32 bg-gradient-to-b from-violet-500/30 to-transparent blur-2xl"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
      />
    </motion.div>
  );
}

function FeatureCards() {
  const features = [
    {
      icon: Zap,
      title: "AUTOMAÇÃO COMPLETA",
      description: "Automatize propostas, contratos e pagamentos do início ao fim, liberando tempo para o que importa.",
      color: "text-emerald-400",
      bgGradient: "from-emerald-500/20 via-emerald-500/10 to-transparent",
      borderColor: "hover:border-emerald-500/50",
      glowColor: "rgba(16, 185, 129, 0.3)",
      iconBg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      icon: Users,
      title: "MATCH INTELIGENTE",
      description: "IA que encontra criadores perfeitos para sua marca, analisando engajamento e autenticidade.",
      color: "text-blue-400",
      bgGradient: "from-blue-500/20 via-blue-500/10 to-transparent",
      borderColor: "hover:border-blue-500/50",
      glowColor: "rgba(59, 130, 246, 0.3)",
      iconBg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      icon: BarChart3,
      title: "PREÇO POR RESULTADO",
      description: "Pague apenas por resultados reais. Sem taxas ocultas, sem contratos longos, transparência total.",
      color: "text-amber-400",
      bgGradient: "from-amber-500/20 via-amber-500/10 to-transparent",
      borderColor: "hover:border-amber-500/50",
      glowColor: "rgba(245, 158, 11, 0.3)",
      iconBg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      icon: Shield,
      title: "GESTÃO MULTI-MARCA",
      description: "Gerencie múltiplas marcas e equipes em uma única plataforma centralizada.",
      color: "text-violet-400",
      bgGradient: "from-violet-500/20 via-violet-500/10 to-transparent",
      borderColor: "hover:border-violet-500/50",
      glowColor: "rgba(139, 92, 246, 0.3)",
      iconBg: "bg-violet-500/10 border-violet-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-12 sm:mt-16">
      {features.map((feature, i) => (
        <motion.div
          key={feature.title}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 + i * 0.1, type: "spring", stiffness: 100 }}
          whileHover={{ y: -8, scale: 1.02 }}
          className={`group relative p-6 rounded-2xl bg-card dark:bg-zinc-900/60 backdrop-blur-sm border border-border dark:border-zinc-800/80 ${feature.borderColor} transition-all duration-300 cursor-pointer overflow-hidden`}
          style={{
            boxShadow: "0 4px 24px rgba(0, 0, 0, 0.2)",
          }}
        >
          {/* Background gradient on hover */}
          <motion.div
            className={`absolute inset-0 bg-gradient-to-b ${feature.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
          />
          
          {/* Top shimmer line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {/* Glow effect on hover */}
          <motion.div
            className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, ${feature.glowColor} 0%, transparent 70%)`,
            }}
          />
          
          {/* Content */}
          <div className="relative z-10">
            {/* Icon with background */}
            <motion.div
              className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${feature.iconBg} border mb-5 group-hover:scale-110 transition-transform duration-300`}
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
            >
              <feature.icon className={`w-7 h-7 ${feature.color}`} strokeWidth={1.5} />
            </motion.div>
            
            <h3 className="font-heading font-bold text-foreground text-sm tracking-wider mb-3 group-hover:text-foreground transition-colors">
              {feature.title}
            </h3>
            
            <p className="text-muted-foreground text-sm leading-relaxed group-hover:text-foreground/80 transition-colors">
              {feature.description}
            </p>
          </div>
          
          {/* Bottom corner accent */}
          <motion.div
            className="absolute bottom-0 right-0 w-20 h-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: `radial-gradient(circle at 100% 100%, ${feature.glowColor} 0%, transparent 70%)`,
            }}
          />
          
          {/* Animated border pulse on hover */}
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-transparent pointer-events-none opacity-0 group-hover:opacity-100"
            animate={{
              borderColor: ["transparent", feature.glowColor, "transparent"],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      ))}
    </div>
  );
}

export function BoldStatements() {
  return (
    <section id="recursos" className="py-24 bg-muted/30 dark:bg-zinc-950 relative overflow-hidden">
      <FloatingDiamonds />
      <SweepingLight />
      <AnimatedBackground />
      
      {/* Diamond grid pattern */}
      <div className="absolute inset-0">
        <svg className="w-full h-full opacity-20" preserveAspectRatio="none">
          <defs>
            <pattern id="boldGrid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path 
                d="M30 0 L60 30 L30 60 L0 30 Z" 
                fill="none" 
                stroke="rgba(255,255,255,0.03)" 
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#boldGrid)" />
        </svg>
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-zinc-900 border border-primary/20 dark:border-zinc-800">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">AUTOMAÇÃO</span>
          </div>
        </motion.div>
        
        {/* Headline with strikethrough effect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-center mb-6"
        >
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-6xl font-black text-foreground uppercase tracking-tight leading-tight">
            <span className="relative inline-block">
              <span className="text-muted-foreground">PLANILHAS.</span>
              <motion.span
                className="absolute left-0 top-1/2 w-full h-1 bg-primary"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.4 }}
                style={{ originX: 0 }}
              />
            </span>
            <br />
            <span className="text-foreground">NUNCA MAIS.</span>
          </h2>
        </motion.div>
        
        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-center text-muted-foreground text-lg max-w-2xl mx-auto"
        >
          Impulsionada por <span className="text-foreground font-semibold">anos de experiência</span> em marketing de influência,{" "}
          a CreatorConnect <span className="text-foreground font-semibold">automatiza todo o processo</span>{" "}
          e <span className="text-primary font-semibold">maximiza seus resultados</span>.
        </motion.p>
        
        {/* Dashboard preview - hidden on mobile */}
        <div className="hidden md:block">
          <DashboardPreview />
        </div>
        
        {/* Feature cards */}
        <FeatureCards />
      </div>
    </section>
  );
}
