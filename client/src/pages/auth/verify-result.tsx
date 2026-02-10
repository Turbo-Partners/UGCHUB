import { useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, ArrowRight, Sparkles, Zap, TrendingUp, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function VerifyResult() {
  const search = useSearch();
  const query = new URLSearchParams(search);
  const status = query.get("status");
  const message = query.get("message");
  const role = query.get("role");

  const isSuccess = status === "success";

  const features = [
    { icon: Sparkles, text: "Acesse oportunidades exclusivas", color: "text-violet-400" },
    { icon: TrendingUp, text: "Acompanhe seu crescimento", color: "text-emerald-400" },
    { icon: Shield, text: "Transações seguras", color: "text-blue-400" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
      
      <motion.div
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.15, 0.25, 0.15]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-border/50 shadow-2xl bg-card/80 backdrop-blur-xl overflow-hidden">
          {isSuccess && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-violet-500 to-primary" />
          )}
          
          <CardHeader className="text-center pb-4 pt-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-6"
            >
              <div className="relative">
                {isSuccess ? (
                  <>
                    <motion.div 
                      className="absolute inset-0 bg-emerald-500/30 rounded-full blur-xl"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <div className="relative bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 rounded-full shadow-lg shadow-emerald-500/30">
                      <CheckCircle2 className="h-10 w-10 text-white" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl" />
                    <div className="relative bg-gradient-to-br from-red-500 to-red-600 p-5 rounded-full shadow-lg shadow-red-500/30">
                      <XCircle className="h-10 w-10 text-white" />
                    </div>
                  </>
                )}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CardTitle className="text-2xl sm:text-3xl font-bold mb-2">
                {isSuccess ? "Conta Ativada!" : "Falha na Verificação"}
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                {isSuccess 
                  ? "Sua conta foi verificada com sucesso. Você já pode fazer login." 
                  : message || "Não foi possível verificar seu email. O link pode ter expirado."}
              </CardDescription>
            </motion.div>
          </CardHeader>
          
          <CardContent className="space-y-6 pb-8">
            {isSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
              >
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.text}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50"
                  >
                    <div className={`p-2 rounded-lg bg-background/80 ${feature.color}`}>
                      <feature.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm text-foreground/80">{feature.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: isSuccess ? 0.8 : 0.4 }}
            >
              <Link href={isSuccess ? `/auth${role ? `?role=${role}` : ''}` : "/auth"}>
                <Button 
                  className={`w-full h-12 text-base font-semibold rounded-xl shadow-lg transition-all duration-300 ${
                    isSuccess 
                      ? "bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 shadow-primary/30"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                  data-testid="button-continue"
                >
                  {isSuccess ? (
                    <>
                      Fazer Login
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  ) : (
                    "Tentar Novamente"
                  )}
                </Button>
              </Link>
            </motion.div>
            
            {isSuccess && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-center text-xs text-muted-foreground"
              >
                Bem-vindo à comunidade CreatorConnect!
              </motion.p>
            )}
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center mt-6"
        >
          <Link href="/">
            <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              Voltar para a página inicial
            </span>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
