import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Cookie, X, Settings, Shield } from "lucide-react";

const COOKIE_CONSENT_KEY = "creatorconnect_cookie_consent";

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: true,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      preferences: prefs,
      timestamp: new Date().toISOString(),
    }));
    setIsVisible(false);
  };

  const acceptAll = () => {
    saveConsent({ essential: true, analytics: true, marketing: true });
  };

  const acceptEssential = () => {
    saveConsent({ essential: true, analytics: false, marketing: false });
  };

  const savePreferences = () => {
    saveConsent(preferences);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6"
      >
        <div className="container mx-auto max-w-4xl">
          <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                  <Cookie className="h-6 w-6 text-primary" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="font-semibold text-foreground text-lg">
                      Nós usamos cookies
                    </h3>
                    <button
                      onClick={() => setIsVisible(false)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                      data-testid="button-close-cookie-banner"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                    Utilizamos cookies para melhorar sua experiência, analisar o tráfego do site e personalizar conteúdo. 
                    Ao clicar em "Aceitar Todos", você concorda com o uso de todos os cookies. 
                    Leia nossa{" "}
                    <a href="/politica-privacidade" className="text-primary hover:underline">
                      Política de Privacidade
                    </a>
                    .
                  </p>

                  <AnimatePresence>
                    {showDetails && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mb-4 overflow-hidden"
                      >
                        <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Shield className="h-4 w-4 text-green-500" />
                              <div>
                                <p className="text-sm font-medium text-foreground">Essenciais</p>
                                <p className="text-xs text-muted-foreground">Necessários para o funcionamento básico</p>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                              Sempre ativo
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-4 w-4 rounded bg-blue-500/20 flex items-center justify-center">
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">Análise</p>
                                <p className="text-xs text-muted-foreground">Nos ajudam a entender como você usa o site</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setPreferences(p => ({ ...p, analytics: !p.analytics }))}
                              className={`relative w-10 h-6 rounded-full transition-colors ${
                                preferences.analytics ? "bg-primary" : "bg-muted"
                              }`}
                              data-testid="toggle-analytics-cookies"
                            >
                              <motion.div
                                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                                animate={{ left: preferences.analytics ? 20 : 4 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-4 w-4 rounded bg-purple-500/20 flex items-center justify-center">
                                <div className="h-2 w-2 rounded-full bg-purple-500" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">Marketing</p>
                                <p className="text-xs text-muted-foreground">Personalizam anúncios e conteúdo</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setPreferences(p => ({ ...p, marketing: !p.marketing }))}
                              className={`relative w-10 h-6 rounded-full transition-colors ${
                                preferences.marketing ? "bg-primary" : "bg-muted"
                              }`}
                              data-testid="toggle-marketing-cookies"
                            >
                              <motion.div
                                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                                animate={{ left: preferences.marketing ? 20 : 4 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={acceptAll}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-medium"
                      data-testid="button-accept-all-cookies"
                    >
                      Aceitar Todos
                    </Button>
                    <Button
                      variant="outline"
                      onClick={acceptEssential}
                      className="rounded-full font-medium"
                      data-testid="button-accept-essential-cookies"
                    >
                      Apenas Essenciais
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        if (showDetails) {
                          savePreferences();
                        } else {
                          setShowDetails(true);
                        }
                      }}
                      className="rounded-full font-medium text-muted-foreground"
                      data-testid="button-cookie-settings"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      {showDetails ? "Salvar Preferências" : "Personalizar"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
