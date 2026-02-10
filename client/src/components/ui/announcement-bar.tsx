import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "wouter";

interface AnnouncementBarProps {
  highlightText?: string;
  regularText?: string;
  link?: string;
}

export function AnnouncementBar({ 
  highlightText = "CONECTE-SE COM MARCAS INCRÍVEIS",
  regularText = "A plataforma de marketing de influência que conecta criadores e empresas - Saiba mais",
  link = "/auth"
}: AnnouncementBarProps) {
  const items = Array(8).fill(null);

  return (
    <div className="w-full bg-black overflow-hidden border-b border-white/10">
      <div className="relative flex">
        <motion.div
          className="flex whitespace-nowrap py-2.5"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            x: {
              duration: 40,
              repeat: Infinity,
              ease: "linear",
            },
          }}
        >
          {items.map((_, i) => (
            <Link key={`announcement-${i}`} href={link}>
              <div className="flex items-center px-6 cursor-pointer group">
                <Sparkles className="h-3 w-3 text-primary mr-3 flex-shrink-0" />
                <span className="text-xs font-bold text-primary uppercase tracking-wider mr-1.5">
                  {highlightText}
                </span>
                <span className="text-xs text-white/70 group-hover:text-white transition-colors">
                  {regularText}
                </span>
                <ArrowRight className="h-3 w-3 text-white/50 group-hover:text-white ml-1.5 transition-colors" />
              </div>
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
