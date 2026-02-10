import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState, useCallback } from "react";
import { OrbitalLines, GeometricShapes } from "./animated-elements";

interface BigMetricProps {
  value?: number;
  prefix?: string;
  suffix?: string;
  label: string;
  startDate?: string;
  baseValue?: number;
  ratePerSecond?: number;
}

function calculateDynamicValue(startDate: string, baseValue: number, ratePerSecond: number): number {
  const start = new Date(startDate);
  const now = new Date();
  const secondsElapsed = (now.getTime() - start.getTime()) / 1000;
  return baseValue + (secondsElapsed * ratePerSecond);
}

function LiveCounter({ 
  startDate, 
  baseValue, 
  ratePerSecond, 
  prefix = "", 
  suffix = "" 
}: { 
  startDate: string; 
  baseValue: number; 
  ratePerSecond: number; 
  prefix?: string; 
  suffix?: string 
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false);
  
  const getCurrentValue = useCallback(() => {
    return calculateDynamicValue(startDate, baseValue, ratePerSecond);
  }, [startDate, baseValue, ratePerSecond]);

  useEffect(() => {
    if (isInView && !hasAnimatedIn) {
      const targetValue = getCurrentValue();
      const duration = 2500;
      const startTime = Date.now();
      
      const animateIn = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        setDisplayValue(Math.floor(eased * targetValue));
        
        if (progress < 1) {
          requestAnimationFrame(animateIn);
        } else {
          setHasAnimatedIn(true);
        }
      };
      
      requestAnimationFrame(animateIn);
    }
  }, [isInView, hasAnimatedIn, getCurrentValue]);

  useEffect(() => {
    if (hasAnimatedIn) {
      let animationFrame: number;
      let lastTargetValue = displayValue;
      
      const smoothUpdate = () => {
        const targetValue = Math.floor(getCurrentValue());
        
        if (targetValue !== lastTargetValue) {
          const diff = targetValue - displayValue;
          const step = Math.max(1, Math.ceil(Math.abs(diff) / 10));
          
          if (displayValue < targetValue) {
            setDisplayValue(prev => Math.min(prev + step, targetValue));
          } else if (displayValue > targetValue) {
            setDisplayValue(prev => Math.max(prev - step, targetValue));
          }
          
          if (displayValue === targetValue) {
            lastTargetValue = targetValue;
          }
        }
        
        animationFrame = requestAnimationFrame(smoothUpdate);
      };
      
      animationFrame = requestAnimationFrame(smoothUpdate);
      
      return () => cancelAnimationFrame(animationFrame);
    }
  }, [hasAnimatedIn, getCurrentValue, displayValue]);

  const formattedValue = displayValue.toLocaleString('pt-BR');

  return (
    <div ref={ref} className="font-heading text-5xl sm:text-7xl md:text-8xl lg:text-[10rem] font-black text-foreground leading-none tracking-tight">
      {prefix}{formattedValue}{suffix}
    </div>
  );
}

function AnimatedCounter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView) {
      const duration = 2500;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        setDisplayValue(Math.floor(eased * value));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayValue(value);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [isInView, value]);

  const formattedValue = displayValue.toLocaleString('pt-BR');

  return (
    <div ref={ref} className="font-heading text-5xl sm:text-7xl md:text-8xl lg:text-[10rem] font-black text-foreground leading-none tracking-tight">
      {prefix}{formattedValue}{suffix}
    </div>
  );
}

export function BigMetric({ value, prefix = "R$ ", suffix = "", label, startDate, baseValue = 0, ratePerSecond = 0.12 }: BigMetricProps) {
  const useDynamicCounter = !!startDate;
  
  return (
    <section className="py-32 bg-gradient-to-b from-background via-muted/20 to-background dark:from-zinc-950 dark:via-zinc-900/50 dark:to-zinc-950 relative overflow-hidden">
      <div className="opacity-30 dark:opacity-30">
        <OrbitalLines />
      </div>
      <GeometricShapes />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      
      {/* T-Connector at top center */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 flex flex-col items-center pointer-events-none">
        {/* Vertical line going down */}
        <motion.div
          className="w-px h-16 bg-gradient-to-b from-transparent via-primary/60 to-primary"
          initial={{ scaleY: 0, opacity: 0 }}
          whileInView={{ scaleY: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ transformOrigin: 'top' }}
        />
        
        {/* Animated pulse dot at bottom of vertical */}
        <motion.div
          className="w-2 h-2 bg-primary rounded-full"
          animate={{
            boxShadow: [
              '0 0 8px 2px rgba(99, 102, 241, 0.4)',
              '0 0 16px 4px rgba(99, 102, 241, 0.8)',
              '0 0 8px 2px rgba(99, 102, 241, 0.4)',
            ],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Small connecting lines from the dot */}
        <motion.div
          className="w-3 h-px bg-primary/60"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.8 }}
        />
      </div>

      {/* Horizontal decorative line with animated elements */}
      <div className="absolute left-0 right-0 top-20 flex items-center justify-center pointer-events-none px-8">
        {/* Left line with walking light */}
        <div className="flex-1 max-w-md relative overflow-hidden">
          <motion.div
            className="w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-primary/50"
            initial={{ scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.5 }}
            style={{ transformOrigin: 'right' }}
          />
          {/* Walking light on left line */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-12 h-1"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.8), rgba(139, 92, 246, 1), rgba(99, 102, 241, 0.8), transparent)",
              boxShadow: "0 0 12px 2px rgba(99, 102, 241, 0.6)",
              borderRadius: "2px",
            }}
            animate={{
              x: ["100%", "-100%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              repeatDelay: 1,
            }}
          />
        </div>
        
        {/* Center diamond cluster */}
        <div className="relative mx-4">
          {/* Main pulsing diamond */}
          <motion.div
            className="w-3 h-3 bg-primary/80 rotate-45"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Orbiting small diamonds */}
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 bg-primary/50 rotate-45"
              style={{
                top: '50%',
                left: '50%',
              }}
              animate={{
                x: [
                  Math.cos((i * Math.PI / 2)) * 16,
                  Math.cos((i * Math.PI / 2) + Math.PI / 2) * 16,
                  Math.cos((i * Math.PI / 2) + Math.PI) * 16,
                  Math.cos((i * Math.PI / 2) + 3 * Math.PI / 2) * 16,
                  Math.cos((i * Math.PI / 2)) * 16,
                ],
                y: [
                  Math.sin((i * Math.PI / 2)) * 16,
                  Math.sin((i * Math.PI / 2) + Math.PI / 2) * 16,
                  Math.sin((i * Math.PI / 2) + Math.PI) * 16,
                  Math.sin((i * Math.PI / 2) + 3 * Math.PI / 2) * 16,
                  Math.sin((i * Math.PI / 2)) * 16,
                ],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear",
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
        
        {/* Right line with walking light */}
        <div className="flex-1 max-w-md relative overflow-hidden">
          <motion.div
            className="w-full h-px bg-gradient-to-l from-transparent via-primary/30 to-primary/50"
            initial={{ scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.5 }}
            style={{ transformOrigin: 'left' }}
          />
          {/* Walking light on right line */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-12 h-1"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.8), rgba(139, 92, 246, 1), rgba(99, 102, 241, 0.8), transparent)",
              boxShadow: "0 0 12px 2px rgba(99, 102, 241, 0.6)",
              borderRadius: "2px",
            }}
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              repeatDelay: 1,
              delay: 2,
            }}
          />
        </div>
      </div>

      {/* Floating particles - hidden on mobile */}
      <div className="hidden md:block">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/40 rounded-full"
            style={{
              left: `${15 + i * 14}%`,
              top: `${30 + (i % 3) * 20}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Side decorative lines with traveling dots - desktop only */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 w-px h-32 overflow-hidden hidden xl:block">
        <motion.div
          className="w-full h-full bg-gradient-to-b from-transparent via-primary/40 to-transparent"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        />
        <motion.div
          className="absolute w-2 h-2 bg-primary rounded-full left-1/2 -translate-x-1/2"
          animate={{ y: [0, 128, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <div className="absolute right-8 top-1/2 -translate-y-1/2 w-px h-32 overflow-hidden hidden xl:block">
        <motion.div
          className="w-full h-full bg-gradient-to-b from-transparent via-primary/40 to-transparent"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        />
        <motion.div
          className="absolute w-2 h-2 bg-primary rounded-full left-1/2 -translate-x-1/2"
          animate={{ y: [128, 0, 128] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {useDynamicCounter ? (
            <LiveCounter 
              startDate={startDate!} 
              baseValue={baseValue} 
              ratePerSecond={ratePerSecond} 
              prefix={prefix} 
              suffix={suffix} 
            />
          ) : (
            <AnimatedCounter value={value || 0} prefix={prefix} suffix={suffix} />
          )}
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-xl sm:text-2xl text-lime-400 font-medium mt-6"
          >
            {label}
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
