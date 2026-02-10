import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, RefreshCw, ArrowLeft, CheckCircle2, Inbox, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function VerifyRequest() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const resendMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao reenviar email");
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Email reenviado!",
        description: "Verifique sua caixa de entrada",
      });
      setEmail("");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4 sm:p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-border/50 shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-6"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <div className="relative bg-gradient-to-br from-primary to-primary/80 p-5 rounded-full shadow-lg">
                  <Mail className="h-8 w-8 text-primary-foreground" />
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -bottom-1 -right-1 bg-green-500 p-1.5 rounded-full shadow-md"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                </motion.div>
              </div>
            </motion.div>
            
            <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Verifique seu Email
            </CardTitle>
            <CardDescription className="text-base mt-2 text-muted-foreground">
              Enviamos um link de confirmação para o seu endereço de email.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              className="bg-violet-500/10 rounded-xl p-4 border border-violet-500/30"
            >
              <div className="flex items-start gap-3">
                <div className="bg-violet-500/20 p-2 rounded-lg shrink-0">
                  <AlertTriangle className="h-5 w-5 text-violet-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-violet-300">
                    Verifique sua pasta de Spam!
                  </p>
                  <p className="text-sm text-violet-300/80 leading-relaxed">
                    O email pode ter ido para a pasta de spam ou lixo eletrônico. Procure por "CreatorConnect" e marque como confiável.
                  </p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="bg-muted/50 rounded-xl p-4 border border-border/50"
            >
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                  <Inbox className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Próximos passos
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Encontre o email e clique no link para ativar sua conta.
                  </p>
                </div>
              </div>
            </motion.div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground font-medium">
                  Não recebeu o email?
                </span>
              </div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Digite seu email para reenviar"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50 border-border/50 focus:border-primary/50 h-11"
                  data-testid="input-resend-email"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0 border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
                  onClick={() => resendMutation.mutate(email)}
                  disabled={!email || resendMutation.isPending}
                  data-testid="button-resend-verification"
                >
                  <RefreshCw className={`h-4 w-4 ${resendMutation.isPending ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Clique no ícone para reenviar o email de verificação
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="pt-2"
            >
              <Link href="/auth">
                <Button 
                  variant="ghost" 
                  className="w-full h-11 gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200" 
                  data-testid="button-back-to-login"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para o Login
                </Button>
              </Link>
            </motion.div>
          </CardContent>
        </Card>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs text-muted-foreground mt-6"
        >
          Precisa de ajuda? Entre em contato com nosso{" "}
          <a href="mailto:suporte@creatorconnect.com" className="text-primary hover:underline">
            suporte
          </a>
        </motion.p>
      </motion.div>
    </div>
  );
}
