import { useEffect, useState } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { useMarketplace, type UserRole } from '@/lib/provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, PenTool, ArrowLeft, Loader2, Check, Sparkles, TrendingUp, Shield, Zap, Users, Video, Star, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthPage() {
  const [_, setLocation] = useLocation();
  const search = useSearch();
  const { login, register, user, devLogin } = useMarketplace();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isDevLoading, setIsDevLoading] = useState(false);
  
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");

  const defaultTab = search.includes('role=company') ? 'company' : 'creator';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const isDev = import.meta.env.DEV;

  // Check for error messages from OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(search);
    const error = params.get('error');
    const message = params.get('message');
    
    if (error === 'role_mismatch' && message) {
      toast({
        title: "Conta existente",
        description: decodeURIComponent(message),
        variant: "destructive",
        duration: 8000,
      });
      // Clear the URL params
      window.history.replaceState({}, '', '/auth');
    } else if (error) {
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro ao fazer login com Google. Tente novamente.",
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/auth');
    }
  }, [search, toast]);

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        setLocation('/admin');
      } else if (user.role === 'company') {
        setLocation('/dashboard');
      } else {
        if (!user.niche) {
          setLocation('/onboarding');
        } else {
          setLocation('/feed');
        }
      }
    }
  }, [user, setLocation]);

  const handleSubmit = async () => {
    if (!email || !password) {
        toast({
            title: "Erro",
            description: "Por favor, preencha email e senha",
            variant: "destructive"
        });
        return;
    }

    if (isRegistering && !name) {
        toast({
            title: "Erro",
            description: "Por favor, preencha seu nome",
            variant: "destructive"
        });
        return;
    }

    if (isRegistering && activeTab === 'company' && (!companyName || companyName.trim().length < 2)) {
        toast({
            title: "Erro",
            description: "Por favor, preencha o nome da empresa (mínimo 2 caracteres)",
            variant: "destructive"
        });
        return;
    }

    setIsLoading(true);
    try {
        if (isRegistering) {
            await register({ 
                password, 
                name, 
                email, 
                role: activeTab,
                ...(activeTab === 'company' && { companyName: companyName.trim() })
            });
            setLocation('/verify-request');
        } else {
            await login({ email, password });
        }
    } catch (e) {
    } finally {
        setIsLoading(false);
    }
  };
  
  const onTabChange = (val: string) => {
      setActiveTab(val);
      setIsRegistering(false);
      window.history.replaceState({}, '', `/auth?role=${val}`);
  };
  
  const toggleMode = () => {
      setIsRegistering(!isRegistering);
      if (!isRegistering) {
          setPassword('');
          setName('');
          setEmail('');
          setCompanyName('');
      }
  };

  const handleDevLogin = async () => {
    setIsDevLoading(true);
    try {
      await devLogin(activeTab as UserRole);
    } finally {
      setIsDevLoading(false);
    }
  };

  const benefits = {
    company: [
      { icon: Video, text: "Conteúdo UGC autêntico", color: "bg-violet-500/20 text-violet-400" },
      { icon: Users, text: "Comunidade de +2.000 criadores", color: "bg-emerald-500/20 text-emerald-400" },
      { icon: TrendingUp, text: "ROI médio de 4.2x", color: "bg-amber-500/20 text-amber-400" },
      { icon: Shield, text: "Pagamentos protegidos", color: "bg-blue-500/20 text-blue-400" },
    ],
    creator: [
      { icon: Sparkles, text: "Campanhas exclusivas de UGC", color: "bg-violet-500/20 text-violet-400" },
      { icon: Users, text: "Faça parte da comunidade", color: "bg-emerald-500/20 text-emerald-400" },
      { icon: Star, text: "Marcas que valorizam criadores", color: "bg-amber-500/20 text-amber-400" },
      { icon: Heart, text: "Cresça fazendo o que ama", color: "bg-rose-500/20 text-rose-400" },
    ],
  };

  const stats = {
    company: [
      { value: "500+", label: "Marcas" },
      { value: "2K+", label: "Criadores" },
      { value: "R$15M+", label: "Parcerias" },
    ],
    creator: [
      { value: "R$5K", label: "Média/mês" },
      { value: "127%", label: "Crescimento" },
      { value: "98%", label: "Satisfação" },
    ],
  };

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

          {/* Floating geometric shapes */}
          <motion.div
            className="absolute top-20 left-10 w-20 h-20 border border-primary/20 rounded-xl"
            animate={{
              rotate: [0, 90, 180, 270, 360],
              y: [0, -20, 0, 20, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute top-40 left-32 w-8 h-8 bg-violet-500/10 rounded-lg"
            animate={{
              rotate: [0, -180, -360],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-40 left-16 w-16 h-16 border-2 border-violet-500/15 rounded-full"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-1/4 left-1/4 w-3 h-3 bg-primary/30 rounded-full"
            animate={{
              y: [0, -40, 0],
              x: [0, 20, 0],
              scale: [1, 1.5, 1],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-1/3 left-8 w-24 h-24 border border-emerald-500/10 rounded-2xl"
            animate={{
              rotate: [0, 45, 0, -45, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Animated lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <motion.line
              x1="0" y1="30%" x2="40%" y2="60%"
              stroke="url(#gradient1)" strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0, 0.3, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: 0 }}
            />
            <motion.line
              x1="10%" y1="80%" x2="50%" y2="40%"
              stroke="url(#gradient2)" strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0, 0.2, 0] }}
              transition={{ duration: 5, repeat: Infinity, delay: 2 }}
            />
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(139, 92, 246, 0)" />
                <stop offset="50%" stopColor="rgba(139, 92, 246, 0.4)" />
                <stop offset="100%" stopColor="rgba(139, 92, 246, 0)" />
              </linearGradient>
              <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(99, 102, 241, 0)" />
                <stop offset="50%" stopColor="rgba(99, 102, 241, 0.3)" />
                <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
              </linearGradient>
            </defs>
          </svg>

          {/* Floating particles */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute rounded-full ${i % 3 === 0 ? 'w-2 h-2 bg-primary/30' : i % 3 === 1 ? 'w-1.5 h-1.5 bg-violet-400/40' : 'w-1 h-1 bg-emerald-400/30'}`}
              style={{
                left: `${5 + (i * 8) % 45}%`,
                top: `${10 + (i * 7) % 80}%`,
              }}
              animate={{
                y: [0, -40 - i * 5, 0],
                x: [0, i % 2 === 0 ? 20 : -20, 0],
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.3 + i * 0.1, 1],
              }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Glowing orbs */}
          <motion.div
            className="absolute top-1/3 left-12 w-4 h-4 bg-violet-500 rounded-full"
            style={{ filter: 'blur(4px)' }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-1/4 left-24 w-3 h-3 bg-primary rounded-full"
            style={{ filter: 'blur(3px)' }}
            animate={{
              scale: [1, 1.8, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          />
          
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
                <Users className="w-3.5 h-3.5" />
                {activeTab === 'company' ? 'PLATAFORMA DE UGC' : 'COMUNIDADE DE CRIADORES'}
              </motion.div>
              
              <AnimatePresence mode="wait">
                <motion.h2 
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-3xl xl:text-4xl font-heading font-bold tracking-tight mb-4 text-white"
                >
                  {activeTab === 'company' 
                    ? "Escale seu conteúdo UGC com nossa comunidade"
                    : "Junte-se à maior comunidade de criadores UGC"
                  }
                </motion.h2>
              </AnimatePresence>
              
              <AnimatePresence mode="wait">
                <motion.p 
                  key={activeTab}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="text-zinc-400 text-lg mb-8 max-w-md"
                >
                  {activeTab === 'company'
                    ? "Conecte-se com criadores autênticos e gere conteúdo que converte. Sem complicação."
                    : "Monetize seu talento, conecte-se com marcas incríveis e faça parte de algo maior."
                  }
                </motion.p>
              </AnimatePresence>

              <div className="flex gap-4 mb-8">
                {stats[activeTab as keyof typeof stats].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="text-center px-4 py-3 rounded-xl bg-zinc-900/80 border border-zinc-800"
                  >
                    <p className="text-xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-zinc-500">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
              
              <div className="space-y-3">
                {benefits[activeTab as keyof typeof benefits].map((benefit, index) => (
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
            <div className="mb-6 lg:hidden">
              <Button 
                variant="ghost" 
                className="px-0 text-muted-foreground hover:text-foreground"
                onClick={() => setLocation('/')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Início
              </Button>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="text-center lg:text-left space-y-2">
                <h1 className="font-heading text-2xl lg:text-3xl font-bold tracking-tight">
                  {isRegistering ? "Criar Conta" : "Bem-vindo de Volta"}
                </h1>
                <p className="text-muted-foreground">
                  {isRegistering ? "Preencha seus dados para começar" : "Entre para acessar seu painel"}
                </p>
              </div>

              <Tabs defaultValue={defaultTab} onValueChange={onTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="company" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Empresa
                  </TabsTrigger>
                  <TabsTrigger value="creator" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
                    <PenTool className="h-4 w-4 mr-2" />
                    Criador
                  </TabsTrigger>
                </TabsList>
          
                <div className="w-full">
                  <Card className="border border-border bg-card/50 backdrop-blur-sm shadow-xl dark:bg-card/80">
                    <CardHeader className="pb-4">
                      <motion.div
                        key={activeTab}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className={`h-12 w-12 rounded-xl flex items-center justify-center mb-3 ${activeTab === 'company' ? 'bg-primary/10 text-primary' : 'bg-violet-500/10 text-violet-600 dark:text-violet-400'}`}
                      >
                        {activeTab === 'company' ? <Briefcase className="h-6 w-6" /> : <PenTool className="h-6 w-6" />}
                      </motion.div>
                      <CardTitle className="text-xl">
                        {activeTab === 'company' ? 'Portal da Empresa' : 'Estúdio do Criador'}
                      </CardTitle>
                      <CardDescription>
                        {activeTab === 'company' 
                          ? (isRegistering ? "Cadastre sua empresa para publicar campanhas." : "Entre para gerenciar suas campanhas.") 
                          : (isRegistering ? "Cadastre-se para encontrar oportunidades." : "Entre para acompanhar candidaturas.")}
                      </CardDescription>
                    </CardHeader>
              <CardContent className="space-y-4">
                {isRegistering && (
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome e Sobrenome</Label>
                      <Input 
                        id="name" 
                        placeholder="Ex: João Silva" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                      />
                    </div>
                )}

                {isRegistering && activeTab === 'company' && (
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Nome da Empresa</Label>
                      <Input 
                        id="companyName" 
                        placeholder="Ex: Minha Empresa Ltda" 
                        value={companyName} 
                        onChange={e => setCompanyName(e.target.value)} 
                      />
                    </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    placeholder="seu@email.com" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                  />
                </div>

                {isRegistering && (
                  <div className="text-xs text-muted-foreground text-center">
                    Ao se cadastrar, você concorda com nossos{" "}
                    <a 
                      href="/terms" 
                      className="text-primary hover:underline" 
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="link-terms-of-use"
                    >
                      Termos de Uso
                    </a>
                    .
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button className={`w-full h-11 text-base ${activeTab === 'creator' ? 'bg-violet-600 hover:bg-violet-700' : ''}`} onClick={handleSubmit} disabled={isLoading} data-testid="button-auth-submit">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {isRegistering 
                    ? (activeTab === 'company' ? "Cadastrar Empresa" : "Cadastrar como Criador")
                    : (activeTab === 'company' ? "Entrar como Empresa" : "Entrar como Criador")
                  }
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Ou continue com
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  type="button"
                  className="w-full h-11 text-base"
                  onClick={() => window.location.href = `/auth/google?role=${activeTab}`}
                  data-testid="button-google-login"
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continuar com Google
                </Button>

                {isDev && !isRegistering && (
                  <Button
                    variant="secondary"
                    type="button"
                    className="w-full h-11 text-base"
                    onClick={handleDevLogin}
                    disabled={isDevLoading}
                    data-testid="button-dev-login"
                  >
                    {isDevLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                    Entrar como Dev ({activeTab === 'company' ? 'Empresa' : 'Criador'})
                  </Button>
                )}
                
                {!isRegistering && (
                  <Link href="/forgot-password">
                    <Button variant="link" className="w-full text-sm" data-testid="link-forgot-password">
                      Esqueci minha senha
                    </Button>
                  </Link>
                )}

                <Button variant="link" className="w-full" onClick={toggleMode} data-testid="button-toggle-mode">
                    {isRegistering 
                        ? "Já tem uma conta? Faça login" 
                        : "Não tem conta? Cadastre-se agora"}
                </Button>
              </CardFooter>
                  </Card>
                </div>
              </Tabs>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
