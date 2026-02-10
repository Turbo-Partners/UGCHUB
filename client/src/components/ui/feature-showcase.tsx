import { motion } from "framer-motion";
import { Check, TrendingUp, Users, Zap, BarChart3, Gift, MessageSquare, DollarSign, ArrowUpRight, Sparkles, Shield } from "lucide-react";
import { OrbitAnimation } from "./orbit-animation";
import { GlowingOrbs, SweepingLight } from "./animated-elements";

function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-primary/20 rotate-45"
          style={{
            left: `${10 + i * 12}%`,
            top: `${15 + (i % 4) * 22}%`,
          }}
          animate={{
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.4, 1],
            y: [0, -15, 0],
          }}
          transition={{
            duration: 4 + i * 0.3,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  children?: React.ReactNode;
  className?: string;
  dark?: boolean;
  delay?: number;
}

function FeatureCard({ title, description, children, className = "", dark = false, delay = 0 }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={`group relative p-6 rounded-2xl overflow-hidden ${
        dark 
          ? "bg-primary/5 dark:bg-zinc-900 border border-primary/20 dark:border-zinc-800" 
          : "bg-card dark:bg-card/50 border border-border"
      } ${className}`}
    >
      {dark && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-violet-500/5 dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] dark:bg-[size:32px_32px]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative z-10">
        <h3 className={`font-heading font-semibold text-lg mb-2 text-foreground`}>
          {title}
        </h3>
        <p className={`text-sm leading-relaxed text-muted-foreground`}>
          {description}
        </p>
        {children && <div className="mt-4">{children}</div>}
      </div>
    </motion.div>
  );
}

function TransactionList() {
  const transactions = [
    { name: "Marina Costa", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face", value: "R$ 2.500", status: "Pago", id: "CC-2605" },
    { name: "Lucas Ferreira", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face", value: "R$ 1.800", status: "Pago", id: "CC-139" },
    { name: "Julia Santos", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face", value: "R$ 4.200", status: "Pendente", id: "9423" },
  ];

  return (
    <div className="space-y-2">
      {transactions.map((tx, i) => (
        <motion.div
          key={tx.id}
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 + i * 0.1 }}
          className="flex items-center justify-between p-3 rounded-xl bg-muted/50 dark:bg-zinc-800/50 border border-border/50 dark:border-zinc-700/50 hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <img 
              src={tx.image} 
              alt={tx.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
            />
            <div>
              <p className="text-sm font-medium text-foreground">{tx.name}</p>
              <p className="text-xs text-muted-foreground">#{tx.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-bold text-foreground text-sm sm:text-base">{tx.value}</span>
            <motion.span 
              className={`text-xs px-3 py-1 rounded-full font-medium ${
                tx.status === "Pago" 
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" 
                  : "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
              }`}
              whileHover={{ scale: 1.05 }}
            >
              {tx.status}
            </motion.span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function EnhancedChart() {
  const points = [20, 35, 25, 45, 30, 55, 40, 70, 60, 85, 75, 95];
  const width = 280;
  const height = 100;
  const maxY = Math.max(...points);
  
  const pathD = points
    .map((point, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - (point / maxY) * height;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const smoothPath = points
    .map((point, i, arr) => {
      const x = (i / (arr.length - 1)) * width;
      const y = height - (point / maxY) * height;
      if (i === 0) return `M ${x} ${y}`;
      const prevX = ((i - 1) / (arr.length - 1)) * width;
      const prevY = height - (arr[i - 1] / maxY) * height;
      const cpX = (prevX + x) / 2;
      return `Q ${cpX} ${prevY} ${x} ${y}`;
    })
    .join(" ");

  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-muted-foreground">Ao vivo</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <TrendingUp className="w-3 h-3 text-emerald-500" />
          <span className="text-xs font-medium text-emerald-500">+127%</span>
        </div>
      </div>
      
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24">
        <defs>
          <linearGradient id="enhancedChartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.4" />
            <stop offset="50%" stopColor="rgb(139, 92, 246)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="rgb(139, 92, 246)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(99, 102, 241)" />
            <stop offset="100%" stopColor="rgb(139, 92, 246)" />
          </linearGradient>
        </defs>
        
        {[0, 25, 50, 75, 100].map((y) => (
          <line 
            key={y} 
            x1="0" 
            y1={height - (y / 100) * height} 
            x2={width} 
            y2={height - (y / 100) * height} 
            stroke="currentColor" 
            strokeOpacity="0.1" 
            strokeDasharray="4 4"
          />
        ))}
        
        <motion.path
          d={areaD}
          fill="url(#enhancedChartGradient)"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        />
        <motion.path
          d={pathD}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2, ease: "easeOut" }}
        />
        
        <motion.circle
          cx={width}
          cy={height - (points[points.length - 1] / maxY) * height}
          r="6"
          fill="rgb(139, 92, 246)"
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1.8 }}
        />
        <motion.circle
          cx={width}
          cy={height - (points[points.length - 1] / maxY) * height}
          r="10"
          fill="rgb(139, 92, 246)"
          opacity="0.3"
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: 2 }}
        />
      </svg>
      
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>Jan</span>
        <span>Mar</span>
        <span>Jun</span>
        <span>Set</span>
        <span>Dez</span>
      </div>
    </div>
  );
}

function PlatformGrid() {
  const platforms = [
    { emoji: "📸", name: "Instagram", color: "from-pink-500/20 to-purple-500/20" },
    { emoji: "🎵", name: "TikTok", color: "from-cyan-500/20 to-pink-500/20" },
    { emoji: "▶️", name: "YouTube", color: "from-red-500/20 to-orange-500/20" },
    { emoji: "🎮", name: "Twitch", color: "from-violet-500/20 to-purple-500/20" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 mt-2">
      {platforms.map((platform, i) => (
        <motion.div
          key={platform.name}
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 + i * 0.1, type: "spring" }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          className={`aspect-square rounded-xl bg-gradient-to-br ${platform.color} border border-border/50 flex items-center justify-center cursor-pointer`}
        >
          <span className="text-2xl">{platform.emoji}</span>
        </motion.div>
      ))}
    </div>
  );
}

export function FeatureShowcase() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      <div className="opacity-40">
        <GlowingOrbs />
      </div>
      <SweepingLight />
      <AnimatedBackground />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 mb-4">
            <Sparkles className="w-3 h-3" />
            Por que escolher
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Feito para resultados
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Cada funcionalidade foi pensada para maximizar seu ROI
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            title="Integrações Nativas"
            description="Conecte-se automaticamente com as principais plataformas de criação de conteúdo."
            dark
            delay={0}
            className="lg:row-span-2"
          >
            <OrbitAnimation />
          </FeatureCard>

          <FeatureCard
            title="Pagamentos Rastreados"
            description="Acompanhe todos os pagamentos em tempo real com status detalhado."
            delay={0.1}
            className="lg:col-span-2"
          >
            <TransactionList />
          </FeatureCard>

          <FeatureCard
            title="Analytics em Tempo Real"
            description="Visualize o desempenho das suas campanhas instantaneamente."
            delay={0.2}
          >
            <EnhancedChart />
          </FeatureCard>

          <FeatureCard
            title="Match Inteligente"
            description="IA encontra os criadores perfeitos."
            delay={0.3}
            dark
          >
            <PlatformGrid />
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}
