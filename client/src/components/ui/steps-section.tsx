import { motion } from "framer-motion";
import { GlowingOrbs, SweepingLight } from "./animated-elements";
import { UserPlus, Handshake, Rocket, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { GlowButton } from "./glow-button";

const steps = [
  { 
    number: "01",
    label: "CADASTRO", 
    title: "Crie sua conta", 
    description: "Cadastre-se em menos de 2 minutos. Sem cartão de crédito.",
    icon: UserPlus,
    gradient: "from-blue-500 to-cyan-500",
  },
  { 
    number: "02",
    label: "MATCH", 
    title: "Conecte-se", 
    description: "Marcas publicam campanhas. Criadores aplicam. Match perfeito.",
    icon: Handshake,
    gradient: "from-primary to-violet-500",
    isCenter: true,
  },
  { 
    number: "03",
    label: "ESCALA", 
    title: "Cresça", 
    description: "Gerencie entregas, pagamentos e resultados. Tudo automatizado.",
    icon: Rocket,
    gradient: "from-emerald-500 to-green-500",
  },
];

function DiamondGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={`diag1-${i}`}
          className="absolute w-px bg-gradient-to-b from-transparent via-foreground/5 to-transparent"
          style={{
            height: '200%',
            left: `${(i - 2) * 12}%`,
            top: '-50%',
            transform: 'rotate(45deg)',
            transformOrigin: 'center',
          }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05 }}
        />
      ))}
      
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={`diag2-${i}`}
          className="absolute w-px bg-gradient-to-b from-transparent via-foreground/5 to-transparent"
          style={{
            height: '200%',
            left: `${(i - 2) * 12}%`,
            top: '-50%',
            transform: 'rotate(-45deg)',
            transformOrigin: 'center',
          }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05 }}
        />
      ))}

      {[...Array(15)].map((_, i) => {
        const row = Math.floor(i / 5);
        const col = i % 5;
        return (
          <motion.div
            key={`diamond-${i}`}
            className="absolute w-2 h-2 bg-primary rotate-45"
            style={{
              left: `${15 + col * 18}%`,
              top: `${30 + row * 25}%`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.03 }}
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.2, 1],
            }}
          />
        );
      })}
    </div>
  );
}

export function StepsSection() {
  return (
    <section id="como-funciona" className="py-24 md:py-32 bg-muted/30 dark:bg-zinc-950 relative overflow-hidden">
      <div className="opacity-40">
        <GlowingOrbs />
      </div>
      <SweepingLight />
      <DiamondGrid />
      
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-primary/10 dark:bg-white/5 text-primary dark:text-white/80 border border-primary/20 dark:border-white/10 mb-4">
            Como funciona
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-6xl font-black text-foreground mb-4">
            Comece em 3 passos
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Simples, rápido e sem burocracia
          </p>
        </motion.div>

        {/* Steps - Card Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {steps.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 40, rotateX: 15 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: i * 0.2, type: "spring", stiffness: 80 }}
                whileHover={{ y: -8, scale: 1.03 }}
                className="relative group"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="relative p-8 rounded-2xl bg-card dark:bg-zinc-900/80 border border-border dark:border-zinc-800 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/20 transition-all backdrop-blur-sm overflow-hidden h-full">
                  {/* Animated shimmer on hover */}
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer pointer-events-none"
                    style={{
                      backgroundSize: "200% 100%",
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <motion.div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring" }}
                      >
                        <Icon className="w-7 h-7 text-white" />
                      </motion.div>
                      <span className="text-6xl font-heading font-black bg-gradient-to-br from-muted-foreground/50 to-muted-foreground/30 bg-clip-text text-transparent">
                        {item.number}
                      </span>
                    </div>
                    
                    <h3 className="font-heading font-bold text-xl text-foreground mb-3 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {item.isCenter && (
                    <motion.div
                      className="absolute -top-1 -right-1 w-6 h-6 rounded-lg overflow-hidden"
                      animate={{
                        boxShadow: [
                          '0 0 8px 2px rgba(99, 102, 241, 0.3)',
                          '0 0 16px 4px rgba(99, 102, 241, 0.6)',
                          '0 0 8px 2px rgba(99, 102, 241, 0.3)',
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <img 
                        src="/attached_assets/freepik__background__5578_1767050858710.png" 
                        alt="CreatorConnect" 
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  )}
                </div>

                {i < steps.length - 1 && (
                  <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 items-center justify-center">
                    <motion.div
                      className="w-2 h-2 bg-primary rotate-45"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link href="/auth">
            <GlowButton size="lg" className="h-14 px-10 bg-primary text-white hover:bg-primary/90 rounded-full font-semibold text-base" data-testid="cta-como-funciona">
              Começar Agora - É Grátis
              <ArrowRight className="ml-2 h-5 w-5" />
            </GlowButton>
          </Link>
          <p className="text-muted-foreground text-sm mt-3">Sem cartão de crédito necessário</p>
        </motion.div>

        {/* Bottom decorative */}
        <div className="mt-12 flex items-center justify-center gap-4 hidden md:flex">
          <motion.div
            className="w-2 h-2 bg-primary/50 rotate-45"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="w-32 h-px bg-gradient-to-r from-primary/50 via-primary/20 to-primary/50"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          />
          <motion.div
            className="w-3 h-3 bg-primary rotate-45"
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="w-32 h-px bg-gradient-to-r from-primary/50 via-primary/20 to-primary/50"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          />
          <motion.div
            className="w-2 h-2 bg-primary/50 rotate-45"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
        </div>
      </div>
    </section>
  );
}
