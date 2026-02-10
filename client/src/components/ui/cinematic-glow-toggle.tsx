"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/components/theme-provider";

export function CinematicSwitch({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 rounded-xl bg-muted/50 border border-border backdrop-blur-sm cursor-pointer",
        className
      )}
      onClick={toggleTheme}
      data-testid="theme-toggle"
    >
      <span
        className={cn(
          "text-[10px] font-bold tracking-wider transition-colors duration-300",
          !isDark ? "text-foreground" : "text-muted-foreground/50"
        )}
      >
        ☀️
      </span>

      <motion.div
        className="relative w-10 h-5 rounded-full shadow-inner"
        initial={false}
        animate={{
          backgroundColor: isDark ? "hsl(var(--primary))" : "hsl(var(--muted))",
        }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full border border-white/10 shadow-md bg-white"
          initial={false}
          animate={{
            x: isDark ? 20 : 0,
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          whileTap={{ scale: 0.9 }}
        >
          <div className="absolute top-0.5 left-1 w-1.5 h-0.5 bg-white/30 rounded-full blur-[1px]" />
        </motion.div>
      </motion.div>

      <span
        className={cn(
          "text-[10px] font-bold tracking-wider transition-colors duration-300",
          isDark ? "text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" : "text-muted-foreground/50"
        )}
      >
        🌙
      </span>
    </div>
  );
}

export default CinematicSwitch;
