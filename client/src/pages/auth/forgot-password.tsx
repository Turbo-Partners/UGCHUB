import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, ArrowLeft, Mail, Shield, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [emailSent, setEmailSent] = useState(false);

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao processar solicitação");
      return data;
    },
    onSuccess: (data) => {
      setEmailSent(true);
      toast({
        title: "Email enviado!",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      forgotPasswordMutation.mutate(email);
    }
  };

  const benefits = [
    { icon: Shield, text: "Processo seguro e criptografado", color: "bg-emerald-500/20 text-emerald-400" },
    { icon: Mail, text: "Link enviado diretamente no email", color: "bg-blue-500/20 text-blue-400" },
    { icon: KeyRound, text: "Crie uma nova senha em minutos", color: "bg-violet-500/20 text-violet-400" },
  ];

  return (
    <div className="min-h-screen w-full bg-background overflow-y-auto">
      <div className="flex min-h-screen">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden lg:flex lg:w-1/2 bg-zinc-950 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
          
          <motion.div 
            className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.3, 0.2]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.15, 0.25, 0.15]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
          <motion.div 
            className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2"
            animate={{ 
              scale: [1, 1.3, 1],
              x: ["-50%", "-40%", "-50%"],
              y: ["-50%", "-60%", "-50%"]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          />

          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary/40 rounded-full"
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut",
              }}
            />
          ))}
          
          <div className="relative z-10 flex flex-col justify-center p-12 xl:p-16 w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="max-w-lg"
            >
              <div className="flex items-center gap-3 mb-8">
                <img 
                  src="/attached_assets/freepik__adjust__40499_1767050491683.png"
                  alt="CreatorConnect"
                  className="h-10 w-auto object-contain"
                />
              </div>

              <motion.div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-6"
                animate={{ 
                  boxShadow: [
                    "0 0 0 0 rgba(99, 102, 241, 0)",
                    "0 0 15px 2px rgba(99, 102, 241, 0.2)",
                    "0 0 0 0 rgba(99, 102, 241, 0)"
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Shield className="w-3.5 h-3.5" />
                RECUPERAÇÃO SEGURA
              </motion.div>
              
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-3xl xl:text-4xl font-heading font-bold tracking-tight mb-4 text-white"
              >
                Recupere o acesso à sua conta
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="text-zinc-400 text-lg mb-8 max-w-md"
              >
                Não se preocupe, acontece com todo mundo. Vamos te ajudar a criar uma nova senha de forma rápida e segura.
              </motion.p>
              
              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.text}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.08, duration: 0.3 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700/50 transition-colors"
                  >
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${benefit.color.split(' ')[0]}`}>
                      <benefit.icon className={`h-4 w-4 ${benefit.color.split(' ')[1]}`} />
                    </div>
                    <span className="text-zinc-300 text-sm font-medium">{benefit.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>

        <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 py-8 lg:px-12 xl:px-16">
          <div className="w-full max-w-md mx-auto">
            <div className="mb-6">
              <Button 
                variant="ghost" 
                className="px-0 text-muted-foreground hover:text-foreground"
                onClick={() => setLocation('/auth')}
                data-testid="button-back-to-login"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Login
              </Button>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <AnimatePresence mode="wait">
                {emailSent ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="border border-border bg-card/50 backdrop-blur-sm shadow-xl dark:bg-card/80">
                      <CardHeader className="text-center pb-4">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                          className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4"
                        >
                          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                        </motion.div>
                        <CardTitle className="text-2xl">Email Enviado!</CardTitle>
                        <CardDescription className="text-base">
                          Enviamos um link de recuperação para <span className="font-medium text-foreground" data-testid="text-sent-email">{email}</span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-4 rounded-xl bg-muted/50 border border-border">
                          <p className="text-sm text-muted-foreground text-center">
                            Verifique sua caixa de entrada e spam. O link expira em <span className="font-medium text-foreground">1 hora</span>.
                          </p>
                        </div>

                        <div className="pt-2 space-y-3">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              setEmailSent(false);
                              setEmail("");
                            }}
                            data-testid="button-try-another-email"
                          >
                            Tentar outro email
                          </Button>
                          
                          <Link href="/auth">
                            <Button className="w-full" data-testid="button-go-to-login">
                              Ir para o Login
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="text-center lg:text-left space-y-2 mb-6">
                      <h1 className="font-heading text-2xl lg:text-3xl font-bold tracking-tight">
                        Esqueci minha senha
                      </h1>
                      <p className="text-muted-foreground">
                        Digite seu email para receber um link de recuperação
                      </p>
                    </div>

                    <Card className="border border-border bg-card/50 backdrop-blur-sm shadow-xl dark:bg-card/80">
                      <CardHeader className="pb-4">
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3"
                        >
                          <KeyRound className="h-6 w-6" />
                        </motion.div>
                        <CardTitle className="text-xl">Recuperar Acesso</CardTitle>
                        <CardDescription>
                          Enviaremos um link seguro para você redefinir sua senha
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="seu@email.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              className="h-11"
                              data-testid="input-forgot-password-email"
                            />
                          </div>

                          <Button
                            type="submit"
                            className="w-full h-11"
                            disabled={forgotPasswordMutation.isPending || !email}
                            data-testid="button-submit-forgot-password"
                          >
                            {forgotPasswordMutation.isPending ? (
                              <>
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="mr-2 h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                                />
                                Enviando...
                              </>
                            ) : (
                              <>
                                <Mail className="mr-2 h-4 w-4" />
                                Enviar link de recuperação
                              </>
                            )}
                          </Button>

                          <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-border"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-card px-2 text-muted-foreground">ou</span>
                            </div>
                          </div>

                          <Link href="/auth">
                            <Button variant="outline" className="w-full" data-testid="link-back-to-login">
                              Voltar para o login
                            </Button>
                          </Link>
                        </form>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center text-sm text-muted-foreground"
              >
                Lembrou sua senha?{" "}
                <Link href="/auth">
                  <span className="font-medium text-primary hover:underline cursor-pointer" data-testid="link-login-bottom">
                    Fazer login
                  </span>
                </Link>
              </motion.p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
