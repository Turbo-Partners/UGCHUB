import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const PARTICLES = ["✨", "🎉", "💜", "⭐", "🔥", "💫", "❤️", "🚀"];

interface Particle {
  id: number;
  x: number;
  y: number;
  emoji: string;
  angle: number;
  distance: number;
  scale: number;
}

interface GlowButtonProps extends ButtonProps {
  children: React.ReactNode;
}

let particleId = 0;

export const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ className, children, onClick, ...props }, ref) => {
    const [particles, setParticles] = useState<Particle[]>([]);
    const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
    const mountedRef = useRef(true);

    useEffect(() => {
      mountedRef.current = true;
      return () => {
        mountedRef.current = false;
        timersRef.current.forEach(t => clearTimeout(t));
        timersRef.current.clear();
      };
    }, []);

    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      const x = e.clientX;
      const y = e.clientY;

      const count = 6 + Math.floor(Math.random() * 3);
      const newParticles: Particle[] = [];
      const ids: number[] = [];

      for (let i = 0; i < count; i++) {
        const id = ++particleId;
        ids.push(id);
        newParticles.push({
          id,
          x,
          y,
          emoji: PARTICLES[Math.floor(Math.random() * PARTICLES.length)],
          angle: (360 / count) * i + (Math.random() * 30 - 15),
          distance: 40 + Math.random() * 60,
          scale: 0.6 + Math.random() * 0.6,
        });
      }

      setParticles(prev => [...prev, ...newParticles]);

      const timer = setTimeout(() => {
        if (mountedRef.current) {
          setParticles(prev => prev.filter(p => !ids.includes(p.id)));
        }
        timersRef.current.delete(timer);
      }, 700);
      timersRef.current.add(timer);

      onClick?.(e);
    }, [onClick]);

    return (
      <>
        <Button
          ref={ref}
          className={cn(
            "relative overflow-hidden",
            className
          )}
          onClick={handleClick}
          {...props}
        >
          <span className="relative z-10 flex items-center gap-2">
            {children}
          </span>
        </Button>
        {particles.length > 0 && typeof document !== "undefined" && createPortal(
          <div className="fixed inset-0 pointer-events-none z-[9999]" aria-hidden="true">
            {particles.map(p => (
              <span
                key={p.id}
                className="absolute"
                style={{
                  left: p.x,
                  top: p.y,
                  fontSize: `${p.scale * 18}px`,
                  animation: `particle-burst 650ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
                  ['--particle-tx' as string]: `${Math.cos(p.angle * Math.PI / 180) * p.distance}px`,
                  ['--particle-ty' as string]: `${Math.sin(p.angle * Math.PI / 180) * p.distance}px`,
                }}
              >
                {p.emoji}
              </span>
            ))}
          </div>,
          document.body
        )}
      </>
    );
  }
);

GlowButton.displayName = "GlowButton";
