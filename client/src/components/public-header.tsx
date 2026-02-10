import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { AnnouncementBar } from "@/components/ui/announcement-bar";

const navItems = [
  { label: "Sou Criador", href: "/para-criadores", exact: false, highlight: true },
  { label: "Recursos", href: "/#recursos", exact: false },
  { label: "Cases", href: "/cases", exact: false },
  { label: "Blog", href: "/blog", exact: false },
];

const isActiveRoute = (location: string, href: string, exact: boolean) => {
  if (href.includes('#')) {
    return false;
  }
  if (exact) {
    return location === href;
  }
  return location === href || location.startsWith(`${href}/`) || location.startsWith("/case/");
};

interface PublicHeaderProps {
  showAnnouncementBar?: boolean;
}

export function PublicHeader({ showAnnouncementBar = false }: PublicHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    if (href.includes('#')) {
      const id = href.split('#')[1];
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else if (location !== '/') {
        window.location.href = href;
      }
    }
  };

  const headerTop = showAnnouncementBar ? "top-[36px]" : "top-0";

  return (
    <>
      {showAnnouncementBar && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <AnnouncementBar />
        </div>
      )}
      <motion.header 
        className={`fixed ${headerTop} left-0 right-0 w-full z-50`}
        initial={false}
        animate={isScrolled ? "scrolled" : "top"}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={false}
          animate={{
            opacity: 1,
          }}
          style={{
            backdropFilter: isScrolled ? "blur(20px) saturate(180%)" : "blur(8px)",
            WebkitBackdropFilter: isScrolled ? "blur(20px) saturate(180%)" : "blur(8px)",
            background: isScrolled 
              ? "rgba(0, 0, 0, 0.85)"
              : "rgba(0, 0, 0, 0.4)",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
        
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px"
          initial={false}
          animate={{
            opacity: isScrolled ? 0.6 : 0.2,
          }}
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(99, 102, 241, 0.5) 50%, transparent 100%)",
          }}
          transition={{ duration: 0.4 }}
        />

        <div className="container mx-auto px-4 lg:px-8 relative">
          <motion.div 
            className="flex items-center justify-between"
            initial={false}
            animate={{
              paddingTop: isScrolled ? "12px" : "16px",
              paddingBottom: isScrolled ? "12px" : "16px",
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="lg:hidden flex items-center z-10">
              <motion.button
                className="relative w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                whileTap={{ scale: 0.95 }}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
                aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
                data-testid="button-mobile-menu"
              >
                <motion.div
                  animate={mobileMenuOpen ? "open" : "closed"}
                  className="relative w-5 h-5"
                >
                  <motion.span
                    variants={{
                      closed: { rotate: 0, y: 0 },
                      open: { rotate: 45, y: 6 }
                    }}
                    className="absolute top-1 left-0 w-5 h-0.5 bg-white rounded-full origin-center"
                  />
                  <motion.span
                    variants={{
                      closed: { opacity: 1, x: 0 },
                      open: { opacity: 0, x: 10 }
                    }}
                    className="absolute top-[9px] left-0 w-5 h-0.5 bg-white rounded-full"
                  />
                  <motion.span
                    variants={{
                      closed: { rotate: 0, y: 0 },
                      open: { rotate: -45, y: -6 }
                    }}
                    className="absolute top-[17px] left-0 w-5 h-0.5 bg-white rounded-full origin-center"
                  />
                </motion.div>
              </motion.button>
            </div>

            <Link href="/" className="hidden lg:flex items-center z-10">
              <motion.img 
                src="/attached_assets/freepik__adjust__40499_1767050491683.png"
                alt="CreatorConnect"
                className={`h-10 w-auto object-contain ${isScrolled ? 'block' : 'hidden dark:block'}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              />
              <motion.img 
                src="/attached_assets/Logo_CC_Preta_1769604458305.png"
                alt="CreatorConnect"
                className={`h-10 w-auto object-contain ${isScrolled ? 'hidden' : 'dark:hidden'}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              />
            </Link>
            
            <Link href="/" className="lg:hidden absolute left-1/2 -translate-x-1/2 flex items-center z-10">
              <motion.img 
                src="/attached_assets/freepik__adjust__40499_1767050491683.png"
                alt="CreatorConnect"
                className={`h-9 w-auto object-contain ${isScrolled ? 'block' : 'hidden dark:block'}`}
                whileTap={{ scale: 0.95 }}
              />
              <motion.img 
                src="/attached_assets/Logo_CC_Preta_1769604458305.png"
                alt="CreatorConnect"
                className={`h-9 w-auto object-contain ${isScrolled ? 'hidden' : 'dark:hidden'}`}
                whileTap={{ scale: 0.95 }}
              />
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = isActiveRoute(location, item.href, item.exact);
                return (
                  <Link key={item.label} href={item.href} onClick={() => handleNavClick(item.href)}>
                    <motion.span
                      className={`relative text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 group cursor-pointer ${
                        item.highlight
                          ? "text-violet-400 hover:text-violet-300 font-bold"
                          : isActive 
                            ? "text-white" 
                            : "text-white/70 hover:text-white"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={item.highlight ? { textShadow: '0 0 10px rgba(139, 92, 246, 0.5), 0 0 20px rgba(139, 92, 246, 0.3)' } : undefined}
                      data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <span className="relative z-10">{item.label}</span>
                      {isActive && !item.highlight && (
                        <motion.div
                          layoutId="nav-indicator"
                          className="absolute inset-0 rounded-lg bg-white/10"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </motion.span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3 z-10">
              <div className="hidden lg:flex items-center gap-4">
                <ThemeToggle />
                <Link href="/auth">
                  <motion.span 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="text-sm text-white/70 hover:text-white transition-colors cursor-pointer font-medium"
                    data-testid="button-login"
                  >
                    Entrar
                  </motion.span>
                </Link>
                <Link href="/auth">
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button 
                      className="font-medium bg-[#6366f1] text-white hover:bg-[#4f46e5] border-none rounded-full px-5 h-9 text-sm shadow-lg shadow-[#6366f1]/20"
                      data-testid="button-signup-header"
                    >
                      Começar Agora
                      <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
        
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[55]"
                onClick={() => setMobileMenuOpen(false)}
              />
              
              <motion.div
                id="mobile-menu"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="lg:hidden fixed left-3 right-3 bg-zinc-900/98 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden z-[60]"
                style={{
                  top: isScrolled ? "68px" : "76px",
                }}
              >
                <div className="p-5 flex flex-col">
                  <nav className="flex flex-col gap-0.5 mb-5">
                    {navItems.map((item, index) => {
                      const isActive = isActiveRoute(location, item.href, item.exact);
                      return (
                        <Link key={item.label} href={item.href} onClick={() => handleNavClick(item.href)}>
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className={`group flex items-center justify-between p-3.5 rounded-xl hover:bg-white/5 transition-all w-full text-left ${
                              isActive ? "bg-white/5" : ""
                            }`}
                            data-testid={`nav-mobile-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <span 
                              className={item.highlight ? "text-violet-400 font-bold text-base" : "text-white font-medium text-base"}
                              style={item.highlight ? { textShadow: '0 0 10px rgba(139, 92, 246, 0.5), 0 0 20px rgba(139, 92, 246, 0.3)' } : undefined}
                            >
                              {item.label}
                            </span>
                            <ArrowRight className="h-4 w-4 text-white/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </motion.div>
                        </Link>
                      );
                    })}
                  </nav>
                  
                  <div className="h-px bg-white/10 mb-5" />
                  
                  <div className="flex flex-col gap-3">
                    <Link href="/auth" onClick={() => setMobileMenuOpen(false)} className="w-full">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="relative overflow-hidden"
                      >
                        <Button 
                          className="w-full h-14 font-semibold bg-gradient-to-r from-primary via-violet-500 to-primary text-white rounded-xl text-base shadow-lg shadow-primary/30 relative"
                          data-testid="button-signup-mobile"
                        >
                          <Sparkles className="mr-2 h-5 w-5" />
                          Começar Agora
                          <ArrowUpRight className="ml-2 h-5 w-5" />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
                        </Button>
                      </motion.div>
                    </Link>
                    
                    <Link href="/auth" onClick={() => setMobileMenuOpen(false)} className="w-full">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Button 
                          variant="outline" 
                          className="w-full h-12 font-medium rounded-xl text-sm border-white/20 text-white hover:bg-white/10 hover:text-white"
                          data-testid="button-login-mobile"
                        >
                          Entrar
                        </Button>
                      </motion.div>
                    </Link>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10"
                    >
                      <span className="text-white font-medium text-base">Modo de exibição</span>
                      <ThemeToggle />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.header>
      
      <div className={showAnnouncementBar ? "h-[100px]" : "h-16"} />
    </>
  );
}
