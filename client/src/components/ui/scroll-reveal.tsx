import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  variant?: "fadeUp" | "fadeDown" | "fadeLeft" | "fadeRight" | "scale" | "rotate" | "blur";
  delay?: number;
  duration?: number;
  once?: boolean;
}

const variants: Record<string, Variants> = {
  fadeUp: {
    hidden: { opacity: 0, y: 60, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 }
  },
  fadeDown: {
    hidden: { opacity: 0, y: -60, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 }
  },
  fadeLeft: {
    hidden: { opacity: 0, x: -60, scale: 0.95 },
    visible: { opacity: 1, x: 0, scale: 1 }
  },
  fadeRight: {
    hidden: { opacity: 0, x: 60, scale: 0.95 },
    visible: { opacity: 1, x: 0, scale: 1 }
  },
  scale: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 }
  },
  rotate: {
    hidden: { opacity: 0, scale: 0.8, rotate: -10 },
    visible: { opacity: 1, scale: 1, rotate: 0 }
  },
  blur: {
    hidden: { opacity: 0, filter: "blur(10px)", scale: 0.95 },
    visible: { opacity: 1, filter: "blur(0px)", scale: 1 }
  }
};

export function ScrollReveal({ 
  children, 
  className, 
  variant = "fadeUp", 
  delay = 0,
  duration = 0.6,
  once = true 
}: ScrollRevealProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-50px" }}
      variants={variants[variant]}
      transition={{ 
        duration,
        delay,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  once?: boolean;
}

export function StaggerContainer({ children, className, staggerDelay = 0.1, once = true }: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-50px" }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          transition: {
            type: "spring",
            stiffness: 100,
            damping: 15
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
