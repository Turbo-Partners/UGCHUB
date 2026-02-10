import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, ArrowLeft, Shield, KeyRound, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      toast({
        title: "Token inválido",
        description: "Link de recuperação inválido",
        variant: "destructive",
      });
      setTimeout(() => setLocation("/auth"), 2000);
    }
  }, [toast, setLocation]);

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ token, password }: { token: string; password: string }) => {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao redefinir senha");
      return data;
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast({
        title: "Senha redefinida!",
        description: "Você já pode fazer login com sua nova senha",
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
    
    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    resetPasswordMutation.mutate({ token, password });
  };

  const benefits = [
    { icon: Shield, text: "Senha criptografada com segurança", color: "bg-emerald-500/20 text-emerald-400" },
    { icon: Lock, text: "Proteção contra acessos não autorizados", color: "bg-blue-500/20 text-blue-400" },
    { icon: KeyRound, text: "Nova senha ativa imediatamente", color: "bg-violet-500/20 text-violet-400" },
  ];

  const passwordStrength = () => {
    if (password.length === 0) return { width: "0%", color: "bg-zinc-700", text: "" };
    if (password.length < 6) return { width: "25%", color: "bg-red-500", text: "Fraca" };
    if (password.length < 8) return { width: "50%", color: "bg-yellow-500", text: "Média" };
    if (password.length < 12) return { width: "75%", color: "bg-blue-500", text: "Boa" };
    return { width: "100%", color: "bg-emerald-500", text: "Forte" };
  };

  const strength = passwordStrength();

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando link...</p>
        </motion.div>
      </div>
    );
  }

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
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-6"
                animate={{ 
                  boxShadow: [
                    "0 0 0 0 rgba(16, 185, 129, 0)",
                    "0 0 15px 2px rgba(16, 185, 129, 0.2)",
                    "0 0 0 0 rgba(16, 185, 129, 0)"
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Lock className="w-3.5 h-3.5" />
                REDEFINIÇÃO DE SENHA
              </motion.div>
              
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-3xl xl:text-4xl font-heading font-bold tracking-tight mb-4 text-white"
              >
                Crie sua nova senha
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="text-zinc-400 text-lg mb-8 max-w-md"
              >
                Escolha uma senha forte e segura para proteger sua conta. Recomendamos usar letras, números e caracteres especiais.
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
                {isSuccess ? (
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
                          className="mx-auto h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4"
                        >
                          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                        </motion.div>
                        <CardTitle className="text-2xl">Senha Redefinida!</CardTitle>
                        <CardDescription className="text-base">
                          Sua nova senha foi configurada com sucesso
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                        >
                          <p className="text-sm text-center text-emerald-600 dark:text-emerald-400">
                            Você já pode fazer login com sua nova senha
                          </p>
                        </motion.div>

                        <div className="pt-2">
                          <Link href="/auth">
                            <Button className="w-full h-11" data-testid="button-go-to-login">
                              <KeyRound className="mr-2 h-4 w-4" />
                              Fazer Login
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
                        Redefinir Senha
                      </h1>
                      <p className="text-muted-foreground">
                        Digite sua nova senha abaixo
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
                          <Lock className="h-6 w-6" />
                        </motion.div>
                        <CardTitle className="text-xl">Nova Senha</CardTitle>
                        <CardDescription>
                          Escolha uma senha forte com pelo menos 6 caracteres
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-5">
                          <div className="space-y-2">
                            <Label htmlFor="password">Nova senha</Label>
                            <div className="relative">
                              <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="h-11 pr-10"
                                data-testid="input-new-password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                            {password.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="space-y-1.5"
                              >
                                <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: strength.width }}
                                    className={`h-full ${strength.color} transition-all duration-300`}
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Força da senha: <span className={strength.color.replace('bg-', 'text-')}>{strength.text}</span>
                                </p>
                              </motion.div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar senha</Label>
                            <div className="relative">
                              <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                                className="h-11 pr-10"
                                data-testid="input-confirm-password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                            {confirmPassword.length > 0 && password !== confirmPassword && (
                              <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-xs text-red-500"
                              >
                                As senhas não coincidem
                              </motion.p>
                            )}
                            {confirmPassword.length > 0 && password === confirmPassword && (
                              <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-xs text-emerald-500 flex items-center gap-1"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Senhas coincidem
                              </motion.p>
                            )}
                          </div>

                          <Button
                            type="submit"
                            className="w-full h-11"
                            disabled={resetPasswordMutation.isPending || password !== confirmPassword || password.length < 6}
                            data-testid="button-reset-password"
                          >
                            {resetPasswordMutation.isPending ? (
                              <>
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="mr-2 h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                                />
                                Redefinindo...
                              </>
                            ) : (
                              <>
                                <Lock className="mr-2 h-4 w-4" />
                                Redefinir Senha
                              </>
                            )}
                          </Button>
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
