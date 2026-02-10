import { motion } from "framer-motion";

export function AuroraBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute -top-1/2 -left-1/4 w-[150%] h-[150%]"
        style={{
          background: "radial-gradient(ellipse at 30% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)",
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute -bottom-1/2 -right-1/4 w-[150%] h-[150%]"
        style={{
          background: "radial-gradient(ellipse at 70% 80%, rgba(139, 92, 246, 0.12) 0%, transparent 50%)",
        }}
        animate={{
          x: [0, -40, 0],
          y: [0, -20, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
      />
      <motion.div
        className="absolute top-1/4 right-1/4 w-[100%] h-[100%]"
        style={{
          background: "radial-gradient(ellipse at 60% 40%, rgba(56, 189, 248, 0.08) 0%, transparent 40%)",
        }}
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -30, 20, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5,
        }}
      />
    </div>
  );
}

export function FloatingShapes() {
  const shapes = [
    { type: "circle", size: 80, top: "10%", left: "5%", delay: 0, duration: 15 },
    { type: "circle", size: 120, top: "60%", right: "8%", delay: 2, duration: 18 },
    { type: "square", size: 60, top: "30%", right: "12%", delay: 1, duration: 12 },
    { type: "square", size: 40, bottom: "20%", left: "10%", delay: 3, duration: 14 },
    { type: "circle", size: 100, bottom: "30%", right: "20%", delay: 4, duration: 20 },
    { type: "triangle", size: 50, top: "45%", left: "3%", delay: 2.5, duration: 16 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
      {shapes.map((shape, i) => (
        <motion.div
          key={i}
          className={`absolute ${
            shape.type === "circle" 
              ? "rounded-full" 
              : shape.type === "square" 
                ? "rotate-45" 
                : ""
          }`}
          style={{
            width: shape.size,
            height: shape.size,
            top: shape.top,
            bottom: shape.bottom,
            left: shape.left,
            right: shape.right,
            background: shape.type === "triangle" 
              ? "none" 
              : "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%)",
            border: "1px solid rgba(99, 102, 241, 0.1)",
            borderImage: shape.type === "triangle" 
              ? "none" 
              : undefined,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            rotate: shape.type === "square" ? [45, 90, 45] : [0, 5, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: shape.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: shape.delay,
          }}
        />
      ))}
    </div>
  );
}

export function AnimatedGradientBorder({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <motion.div
        className="absolute -inset-[1px] rounded-2xl opacity-75"
        style={{
          background: "linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4, #6366f1)",
          backgroundSize: "300% 100%",
        }}
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <div className="relative bg-background rounded-2xl">{children}</div>
    </div>
  );
}

export function PulsingDot({ className = "", size = "w-2 h-2" }: { className?: string; size?: string }) {
  return (
    <span className={`relative flex ${size} ${className}`}>
      <motion.span
        className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"
        animate={{ scale: [1, 1.5, 1], opacity: [0.75, 0, 0.75] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <span className="relative inline-flex rounded-full h-full w-full bg-primary" />
    </span>
  );
}

export function GlowingLine({ direction = "horizontal" }: { direction?: "horizontal" | "vertical" }) {
  const isHorizontal = direction === "horizontal";
  
  return (
    <div className={`relative ${isHorizontal ? "h-px w-full" : "w-px h-full"}`}>
      <motion.div
        className={`absolute ${isHorizontal ? "h-full w-20" : "w-full h-20"} bg-gradient-to-r from-transparent via-primary to-transparent`}
        animate={{
          [isHorizontal ? "x" : "y"]: ["-100%", "200%"],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          repeatDelay: 1,
        }}
      />
      <div className={`${isHorizontal ? "w-full h-px" : "h-full w-px"} bg-gradient-to-r from-transparent via-primary/20 to-transparent`} />
    </div>
  );
}

export function AnimatedText({ text, className = "" }: { text: string; className?: string }) {
  const words = text.split(" ");
  
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-2"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

export function SparkleEffect() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: `${5 + (i * 4.5)}%`,
            top: `${10 + (i % 5) * 18}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

export function HexagonGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
      <svg width="100%" height="100%" className="absolute inset-0">
        <defs>
          <pattern id="hexagons" width="56" height="100" patternUnits="userSpaceOnUse">
            <path
              d="M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z"
              fill="none"
              stroke="rgba(99, 102, 241, 0.1)"
              strokeWidth="1"
            />
            <path
              d="M28 68 L56 84 L56 116 L28 132 L0 116 L0 84 Z"
              fill="none"
              stroke="rgba(99, 102, 241, 0.1)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexagons)" />
      </svg>
    </div>
  );
}

export function AnimatedCounter2({ value, suffix = "" }: { value: number; suffix?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        {value.toLocaleString('pt-BR')}{suffix}
      </motion.span>
    </motion.span>
  );
}

export function WaveAnimation() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden pointer-events-none">
      <motion.svg
        viewBox="0 0 1440 120"
        className="absolute bottom-0 w-full h-full"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,30 1440,60 L1440,120 L0,120 Z"
          fill="url(#waveGradient)"
          animate={{
            d: [
              "M0,60 C360,120 720,0 1080,60 C1260,90 1380,30 1440,60 L1440,120 L0,120 Z",
              "M0,80 C360,20 720,100 1080,40 C1260,60 1380,80 1440,40 L1440,120 L0,120 Z",
              "M0,60 C360,120 720,0 1080,60 C1260,90 1380,30 1440,60 L1440,120 L0,120 Z",
            ],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(99, 102, 241, 0.1)" />
            <stop offset="50%" stopColor="rgba(139, 92, 246, 0.1)" />
            <stop offset="100%" stopColor="rgba(99, 102, 241, 0.1)" />
          </linearGradient>
        </defs>
      </motion.svg>
    </div>
  );
}

export function MouseFollowGlow() {
  return (
    <motion.div
      className="fixed w-96 h-96 rounded-full pointer-events-none z-0 hidden lg:block"
      style={{
        background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
        filter: "blur(40px)",
      }}
      animate={{
        x: [0, 100, -100, 0],
        y: [0, -50, 50, 0],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

export function SectionDivider({ variant = "gradient" }: { variant?: "gradient" | "dots" | "wave" }) {
  if (variant === "dots") {
    return (
      <div className="py-8 flex items-center justify-center gap-3">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary/30"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    );
  }
  
  if (variant === "wave") {
    return <WaveAnimation />;
  }
  
  return (
    <div className="py-4">
      <GlowingLine direction="horizontal" />
    </div>
  );
}

export function FloatingBadge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md ${className}`}
      animate={{
        y: [0, -5, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}

export function NumberTicker({ value, duration = 2 }: { value: number; duration?: number }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      {value.toLocaleString('pt-BR')}
    </motion.span>
  );
}

export function OrbitalLines() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10"
          style={{
            width: `${300 + i * 150}px`,
            height: `${300 + i * 150}px`,
          }}
          animate={{
            rotate: [0, 360],
            scale: [1, 1.05, 1],
          }}
          transition={{
            rotate: { duration: 20 + i * 10, repeat: Infinity, ease: "linear" },
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <motion.div
            className="absolute w-2 h-2 bg-primary rounded-full"
            style={{ top: 0, left: "50%", transform: "translateX(-50%) translateY(-50%)" }}
            animate={{
              boxShadow: [
                "0 0 10px 2px rgba(99, 102, 241, 0.3)",
                "0 0 20px 4px rgba(99, 102, 241, 0.6)",
                "0 0 10px 2px rgba(99, 102, 241, 0.3)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      ))}
    </div>
  );
}

export function GeometricShapes() {
  const shapes = [
    { x: "10%", y: "20%", size: 60, rotation: 45, delay: 0 },
    { x: "85%", y: "15%", size: 40, rotation: 30, delay: 0.5 },
    { x: "75%", y: "70%", size: 80, rotation: 60, delay: 1 },
    { x: "15%", y: "75%", size: 50, rotation: 15, delay: 1.5 },
    { x: "50%", y: "10%", size: 30, rotation: 0, delay: 2 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
      {shapes.map((shape, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: shape.x, top: shape.y }}
          initial={{ opacity: 0, scale: 0, rotate: shape.rotation }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: shape.delay, duration: 0.6 }}
        >
          <motion.svg
            width={shape.size}
            height={shape.size}
            viewBox="0 0 100 100"
            animate={{
              rotate: [shape.rotation, shape.rotation + 360],
              y: [0, -10, 0],
            }}
            transition={{
              rotate: { duration: 30 + i * 5, repeat: Infinity, ease: "linear" },
              y: { duration: 4 + i, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <polygon
              points="50,5 95,50 50,95 5,50"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-primary/20"
            />
            <polygon
              points="50,20 80,50 50,80 20,50"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-primary/10"
            />
          </motion.svg>
        </motion.div>
      ))}
    </div>
  );
}

export function LiquidGlow({ className = "" }: { className?: string }) {
  return (
    <motion.div
      className={`absolute inset-0 rounded-full pointer-events-none ${className}`}
      animate={{
        background: [
          "radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)",
          "radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, transparent 70%)",
          "radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)",
        ],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

export function GlowingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[
        { x: "20%", y: "30%", size: 300, color: "99, 102, 241", delay: 0 },
        { x: "70%", y: "60%", size: 400, color: "139, 92, 246", delay: 2 },
        { x: "40%", y: "80%", size: 250, color: "56, 189, 248", delay: 4 },
      ].map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: orb.x,
            top: orb.y,
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, rgba(${orb.color}, 0.15) 0%, transparent 70%)`,
            filter: "blur(60px)",
          }}
          animate={{
            x: [0, 50, -30, 0],
            y: [0, -40, 20, 0],
            scale: [1, 1.2, 0.9, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 15 + i * 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: orb.delay,
          }}
        />
      ))}
    </div>
  );
}

export function AnimatedGridLines() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30 dark:opacity-20">
      <svg width="100%" height="100%" className="absolute inset-0">
        <defs>
          <pattern id="animatedGrid" width="80" height="80" patternUnits="userSpaceOnUse">
            <motion.rect
              width="80"
              height="80"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-primary/30"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </pattern>
          <linearGradient id="gridFade" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(99, 102, 241, 0.1)" />
            <stop offset="50%" stopColor="rgba(139, 92, 246, 0.05)" />
            <stop offset="100%" stopColor="rgba(99, 102, 241, 0.1)" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#gridFade)" />
        {[...Array(20)].map((_, i) => (
          <motion.line
            key={`h-${i}`}
            x1="0"
            y1={i * 80}
            x2="100%"
            y2={i * 80}
            stroke="currentColor"
            strokeWidth="0.3"
            className="text-primary/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.1 }}
          />
        ))}
        {[...Array(20)].map((_, i) => (
          <motion.line
            key={`v-${i}`}
            x1={i * 80}
            y1="0"
            x2={i * 80}
            y2="100%"
            stroke="currentColor"
            strokeWidth="0.3"
            className="text-primary/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </svg>
    </div>
  );
}

export function FloatingDiamonds() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 bg-primary/30 rotate-45"
          style={{
            left: `${10 + i * 12}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        />
      ))}
    </div>
  );
}

export function SweepingLight() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="absolute w-[200%] h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
        style={{ top: "50%", left: "-100%" }}
        animate={{
          x: ["0%", "100%"],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          repeatDelay: 3,
        }}
      />
    </motion.div>
  );
}
