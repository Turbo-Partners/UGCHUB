import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useMarketplace } from '@/lib/provider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Instagram, Youtube, User, CreditCard, Building2, CheckCircle2, Share2, Link2, Loader2, Image, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAddressByCEP } from '@/lib/cep';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';

const steps = [
  {
    id: 'about',
    title: "Sobre Voc\u00ea",
    description: "Conte um pouco sobre voc\u00ea e seus nichos",
    icon: <User className="w-5 h-5" />
  },
  {
    id: 'social',
    title: "Conecte suas Redes",
    description: "Vincule suas redes sociais",
    icon: <Share2 className="w-5 h-5" />
  },
  {
    id: 'banking',
    title: "Dados Banc\u00e1rios",
    description: "Onde voc\u00ea receber\u00e1 seus pagamentos",
    icon: <CreditCard className="w-5 h-5" />
  },
  {
    id: 'personal',
    title: "Seus Dados",
    description: "Informa\u00e7\u00f5es pessoais para faturamento",
    icon: <Building2 className="w-5 h-5" />
  }
];

const NICHE_OPTIONS = [
  { value: "tech", label: "Tecnologia & Games" },
  { value: "lifestyle", label: "Estilo de Vida & Vlogs" },
  { value: "beauty", label: "Beleza & Moda" },
  { value: "education", label: "Educa\u00e7\u00e3o" },
  { value: "finance", label: "Finan\u00e7as & Investimentos" },
  { value: "health", label: "Sa\u00fade & Fitness" },
  { value: "travel", label: "Viagens" },
  { value: "food", label: "Gastronomia" },
  { value: "entertainment", label: "Entretenimento & Humor" }
];

const SESSION_STORAGE_KEY = 'onboarding_form_data';
const SESSION_STEP_KEY = 'onboarding_current_step';

export default function CreatorOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, updateUser, isLoading } = useMarketplace();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    bio: '',
    dateOfBirth: '',
    gender: '',
    instagram: '',
    youtube: '',
    tiktok: '',
    portfolioUrl: '',
    niche: [] as string[],
    pixKey: '',
    cpf: '',
    phone: '',
    cep: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    complement: ''
  });

  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [instagramAccount, setInstagramAccount] = useState<any>(null);

  // Query Instagram account status
  const { data: igData, isLoading: igLoading } = useQuery({
    queryKey: ["/api/instagram/account"],
    refetchOnWindowFocus: true,
  });

  // Sync Instagram query data to local state
  useEffect(() => {
    if (igData && typeof igData === 'object' && 'connected' in igData) {
      const data = igData as { connected: boolean; account?: any };
      setInstagramConnected(data.connected);
      if (data.connected && data.account) {
        setInstagramAccount(data.account);
      }
    }
  }, [igData]);

  // Restore form data from sessionStorage (survives OAuth redirect)
  useEffect(() => {
    const savedForm = sessionStorage.getItem(SESSION_STORAGE_KEY);
    const savedStep = sessionStorage.getItem(SESSION_STEP_KEY);
    if (savedForm) {
      try {
        const parsed = JSON.parse(savedForm);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch {}
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
    if (savedStep) {
      const step = parseInt(savedStep, 10);
      if (!isNaN(step) && step >= 0 && step < steps.length) {
        setCurrentStep(step);
      }
      sessionStorage.removeItem(SESSION_STEP_KEY);
    }
  }, []);

  // Detect OAuth return params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('instagram_connected');
    const errorParam = params.get('error');
    const username = params.get('username');

    if (connected === 'true') {
      toast({
        title: "Instagram conectado!",
        description: username ? `@${username} vinculado com sucesso.` : "Conta vinculada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/instagram/account"] });
      // Clean URL params
      window.history.replaceState({}, '', window.location.pathname);
    } else if (errorParam) {
      const message = params.get('message') || 'Erro ao conectar Instagram.';
      toast({
        title: "Erro na conex\u00e3o",
        description: decodeURIComponent(message),
        variant: "destructive"
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [toast, queryClient]);

  // Load existing user data when component mounts
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        bio: user.bio || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || '',
        instagram: user.instagram || '',
        youtube: user.youtube || '',
        tiktok: user.tiktok || '',
        portfolioUrl: user.portfolioUrl || '',
        niche: user.niche || [],
        pixKey: user.pixKey || '',
        cpf: user.cpf || '',
        phone: user.phone || '',
        cep: user.cep || '',
        street: user.street || '',
        number: user.number || '',
        neighborhood: user.neighborhood || '',
        city: user.city || '',
        state: user.state || '',
        complement: user.complement || ''
      }));
    }
  }, [user]);

  const handleConnectInstagram = useCallback(() => {
    // Save form data and step before redirect
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(formData));
    sessionStorage.setItem(SESSION_STEP_KEY, String(currentStep));
    window.location.href = '/api/auth/instagram/start?type=creator&returnTo=/onboarding';
  }, [formData, currentStep]);

  const handleDisconnectInstagram = useCallback(async () => {
    try {
      await apiRequest('DELETE', '/api/instagram/account');
      setInstagramConnected(false);
      setInstagramAccount(null);
      queryClient.invalidateQueries({ queryKey: ["/api/instagram/account"] });
      toast({
        title: "Instagram desconectado",
        description: "Voc\u00ea pode conectar outra conta.",
      });
    } catch {
      toast({
        title: "Erro",
        description: "N\u00e3o foi poss\u00edvel desconectar.",
        variant: "destructive"
      });
    }
  }, [queryClient, toast]);

  const validateCurrentStep = () => {
    if (currentStep === 0) {
      // Step 0: Sobre Voc\u00ea - Bio e niche obrigat\u00f3rios
      if (!formData.bio.trim()) {
        toast({ title: "Campo obrigat\u00f3rio", description: "Conte um pouco sobre voc\u00ea.", variant: "destructive" });
        return false;
      }
      if (formData.niche.length === 0) {
        toast({ title: "Campo obrigat\u00f3rio", description: "Selecione pelo menos um nicho.", variant: "destructive" });
        return false;
      }
    } else if (currentStep === 1) {
      // Step 1: Conecte suas Redes - Instagram obrigat\u00f3rio (via OAuth)
      if (!instagramConnected) {
        toast({ title: "Instagram obrigat\u00f3rio", description: "Conecte seu Instagram para continuar.", variant: "destructive" });
        return false;
      }
    } else if (currentStep === 2) {
      // Step 2: Dados Banc\u00e1rios - PIX obrigat\u00f3rio
      if (!formData.pixKey.trim()) {
        toast({ title: "Campo obrigat\u00f3rio", description: "Preencha sua chave PIX.", variant: "destructive" });
        return false;
      }
    } else if (currentStep === 3) {
      // Step 3: Seus Dados - Todos obrigat\u00f3rios exceto complemento
      if (!formData.cpf.trim()) {
        toast({ title: "Campo obrigat\u00f3rio", description: "Preencha seu CPF/CNPJ.", variant: "destructive" });
        return false;
      }
      if (!formData.phone.trim()) {
        toast({ title: "Campo obrigat\u00f3rio", description: "Preencha seu telefone.", variant: "destructive" });
        return false;
      }
      const cepDigits = formData.cep.replace(/\D/g, '');
      if (cepDigits.length < 8) {
        toast({ title: "Campo obrigat\u00f3rio", description: "Preencha o CEP completo (8 d\u00edgitos).", variant: "destructive" });
        return false;
      }
      if (!formData.street.trim()) {
        toast({ title: "Campo obrigat\u00f3rio", description: "Preencha a rua.", variant: "destructive" });
        return false;
      }
      if (!formData.number.trim()) {
        toast({ title: "Campo obrigat\u00f3rio", description: "Preencha o n\u00famero.", variant: "destructive" });
        return false;
      }
      if (!formData.neighborhood.trim()) {
        toast({ title: "Campo obrigat\u00f3rio", description: "Preencha o bairro.", variant: "destructive" });
        return false;
      }
      if (!formData.city.trim()) {
        toast({ title: "Campo obrigat\u00f3rio", description: "Preencha a cidade.", variant: "destructive" });
        return false;
      }
      if (!formData.state.trim()) {
        toast({ title: "Campo obrigat\u00f3rio", description: "Preencha o estado (UF).", variant: "destructive" });
        return false;
      }
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) return;

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Finish onboarding
      setIsSubmitting(true);
      try {
        const userData: any = {
          ...formData,
          niche: formData.niche,
          dateOfBirth: formData.dateOfBirth || undefined,
          gender: formData.gender || undefined,
          cpf: formData.cpf.replace(/\D/g, ''),
          phone: formData.phone.replace(/\D/g, ''),
          cep: formData.cep.replace(/\D/g, '')
        };

        // Copy Instagram OAuth data to user fields
        if (instagramConnected && instagramAccount) {
          userData.instagram = instagramAccount.username;
          if (instagramAccount.followersCount !== undefined) {
            userData.instagramFollowers = instagramAccount.followersCount;
          }
          if (instagramAccount.followsCount !== undefined) {
            userData.instagramFollowing = instagramAccount.followsCount;
          }
          if (instagramAccount.mediaCount !== undefined) {
            userData.instagramPosts = instagramAccount.mediaCount;
          }
          if (instagramAccount.profilePictureUrl) {
            userData.avatar = instagramAccount.profilePictureUrl;
            userData.instagramProfilePic = instagramAccount.profilePictureUrl;
          }
          if (instagramAccount.biography) {
            userData.instagramBio = instagramAccount.biography;
          }
          userData.instagramLastUpdated = new Date().toISOString();
        }

        await updateUser(userData);
        toast({
          title: "Perfil Completo!",
          description: "Suas informa\u00e7\u00f5es foram salvas com sucesso.",
        });
        window.location.href = '/feed';
      } catch {
        toast({
          title: "Erro ao salvar",
          description: "Tente novamente.",
          variant: "destructive"
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleNiche = (value: string) => {
    setFormData(prev => {
      const current = prev.niche;
      if (current.includes(value)) {
        return { ...prev, niche: current.filter(item => item !== value) };
      } else {
        return { ...prev, niche: [...current, value] };
      }
    });
  };

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cepDigits = e.target.value.replace(/\D/g, '');
    if (cepDigits.length >= 8) {
      setIsLoadingCep(true);
      const address = await fetchAddressByCEP(cepDigits);
      setIsLoadingCep(false);

      if (address) {
        setFormData(prev => ({
          ...prev,
          street: address.street,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
          complement: address.complement
        }));
      } else {
        toast({
          title: "CEP n\u00e3o encontrado",
          description: "Por favor, preencha o endere\u00e7o manualmente.",
          variant: "destructive"
        });
      }
    }
  };

  // Masks
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 14) value = value.slice(0, 14);

    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      value = value.replace(/^(\d{2})(\d)/, '$1.$2');
      value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
      value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
      value = value.replace(/(\d{4})(\d)/, '$1-$2');
    }

    updateField('cpf', value);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length <= 10) {
      value = value.replace(/^(\d{2})(\d)/, '($1) $2');
      value = value.replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      value = value.replace(/^(\d{2})(\d)/, '($1) $2');
      value = value.replace(/(\d{5})(\d)/, '$1-$2');
    }

    updateField('phone', value);
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    value = value.replace(/^(\d{5})(\d)/, '$1-$2');
    updateField('cep', value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    setLocation('/auth');
    return null;
  }

  return (
    <div className="fixed inset-0 w-full overflow-y-auto bg-background">
      <div className="min-h-screen pt-8 pb-24 px-4 flex justify-center">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8 items-start">

        {/* Sidebar Progress */}
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground">Configure seu Perfil</h1>
            <p className="text-muted-foreground">Complete estas etapas para come\u00e7ar a se candidatar a campanhas.</p>
          </div>

          <div className="space-y-6 relative">
            <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border -z-10" />
            {steps.map((step, index) => (
              <div key={step.id} className="flex gap-4 relative">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300 z-10
                  ${index < currentStep
                    ? 'bg-green-500 border-green-500 text-white'
                    : index === currentStep
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-card border-border text-muted-foreground'}
                `}>
                  {index < currentStep ? <CheckCircle2 className="w-5 h-5" /> : step.icon}
                </div>
                <div className={`transition-opacity duration-300 ${index === currentStep ? 'opacity-100' : 'opacity-60'}`}>
                  <h3 className="font-semibold text-sm text-foreground">{step.title}</h3>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Area */}
        <div className="md:col-span-2">
          <Card className="shadow-xl border-border">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
              <CardDescription>{steps[currentStep].description}</CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Step 0 - Sobre Voc\u00ea */}
                  {currentStep === 0 && (
                    <div className="space-y-6">
                      {/* Bio */}
                      <div className="space-y-2">
                        <Label className="text-base font-semibold">
                          Conte um pouco sobre voc\u00ea <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          placeholder="Descreva brevemente seu trabalho, estilo de conte\u00fado e p\u00fablico-alvo..."
                          value={formData.bio}
                          onChange={(e) => updateField('bio', e.target.value)}
                          className="min-h-[100px] resize-none"
                          data-testid="input-bio"
                        />
                        <p className="text-xs text-muted-foreground">Essa descri\u00e7\u00e3o ser\u00e1 vista pelas marcas ao visualizar seu perfil.</p>
                      </div>

                      {/* Nichos */}
                      <div className="space-y-2">
                        <Label className="text-base font-semibold">
                          Quais seus nichos principais? <span className="text-red-500">*</span>
                        </Label>
                        <div className="grid grid-cols-2 gap-2 border p-4 rounded-xl h-48 overflow-y-auto">
                          {NICHE_OPTIONS.map(option => (
                            <div key={option.value} className="flex items-center gap-3">
                              <Checkbox
                                id={`niche-${option.value}`}
                                checked={formData.niche.includes(option.value)}
                                onCheckedChange={() => toggleNiche(option.value)}
                                data-testid={`checkbox-niche-${option.value}`}
                              />
                              <Label htmlFor={`niche-${option.value}`} className="cursor-pointer font-normal">
                                {option.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">Selecione quantos quiser.</p>
                      </div>

                      {/* Data Nascimento + G\u00eanero */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Data de Nascimento</Label>
                          <Input
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => updateField('dateOfBirth', e.target.value)}
                            data-testid="input-date-of-birth"
                            max={new Date().toISOString().split('T')[0]}
                          />
                          <p className="text-xs text-muted-foreground">Voc\u00ea deve ter pelo menos 18 anos</p>
                        </div>
                        <div className="space-y-2">
                          <Label>G\u00eanero</Label>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={formData.gender}
                            onChange={(e) => updateField('gender', e.target.value)}
                            data-testid="select-gender"
                          >
                            <option value="">Selecione...</option>
                            <option value="masculino">Masculino</option>
                            <option value="feminino">Feminino</option>
                            <option value="outro">Outro</option>
                            <option value="prefiro_nao_informar">Prefiro n\u00e3o informar</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 1 - Conecte suas Redes */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      {/* Instagram Card */}
                      <div className={`rounded-xl border-2 overflow-hidden transition-colors ${
                        instagramConnected ? 'border-green-500/50 bg-green-500/5' : 'border-border'
                      }`}>
                        {/* Card Header com gradiente Instagram */}
                        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 p-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Instagram className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white">Instagram</h3>
                            <p className="text-white/80 text-xs">Conecte para importar seus dados</p>
                          </div>
                          <span className="text-xs font-medium text-white/90 bg-white/20 px-2 py-0.5 rounded-full">Obrigat\u00f3rio</span>
                        </div>

                        <div className="p-4">
                          {igLoading ? (
                            <div className="flex items-center justify-center py-6">
                              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                          ) : instagramConnected && instagramAccount ? (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="space-y-4"
                            >
                              {/* Perfil conectado */}
                              <div className="flex items-center gap-3">
                                {instagramAccount.profilePictureUrl ? (
                                  <img
                                    src={instagramAccount.profilePictureUrl}
                                    alt={`@${instagramAccount.username}`}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-green-500/30"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                                    {instagramAccount.username?.[0]?.toUpperCase() || 'I'}
                                  </div>
                                )}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">@{instagramAccount.username}</span>
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  </div>
                                  <p className="text-xs text-muted-foreground">Conta conectada via OAuth</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleDisconnectInstagram}
                                  className="text-red-400 hover:text-red-500 hover:bg-red-500/10 text-xs"
                                >
                                  Desconectar
                                </Button>
                              </div>

                              {/* M\u00e9tricas */}
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="grid grid-cols-3 gap-3"
                              >
                                <div className="bg-muted/50 rounded-lg p-3 text-center">
                                  <Users className="w-4 h-4 text-primary mx-auto mb-1" />
                                  <div className="text-lg font-bold">{(instagramAccount.followersCount ?? 0).toLocaleString()}</div>
                                  <div className="text-xs text-muted-foreground">Seguidores</div>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-3 text-center">
                                  <Users className="w-4 h-4 text-primary mx-auto mb-1" />
                                  <div className="text-lg font-bold">{(instagramAccount.followsCount ?? 0).toLocaleString()}</div>
                                  <div className="text-xs text-muted-foreground">Seguindo</div>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-3 text-center">
                                  <Image className="w-4 h-4 text-primary mx-auto mb-1" />
                                  <div className="text-lg font-bold">{(instagramAccount.mediaCount ?? 0).toLocaleString()}</div>
                                  <div className="text-xs text-muted-foreground">Posts</div>
                                </div>
                              </motion.div>
                            </motion.div>
                          ) : (
                            <div className="flex flex-col items-center gap-3 py-4">
                              <p className="text-sm text-muted-foreground text-center">
                                Conecte sua conta do Instagram para importar automaticamente seu perfil e m\u00e9tricas.
                              </p>
                              <Button
                                onClick={handleConnectInstagram}
                                className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 text-white"
                              >
                                <Instagram className="w-4 h-4 mr-2" />
                                Conectar Instagram
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* TikTok Card - Em breve */}
                      <div className="rounded-xl border-2 border-dashed border-border/60 opacity-60 overflow-hidden">
                        <div className="bg-muted/30 p-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                            <span className="font-bold text-sm text-white">Tk</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">TikTok</h3>
                            <p className="text-muted-foreground text-xs">Integra\u00e7\u00e3o autom\u00e1tica</p>
                          </div>
                          <Badge variant="secondary" className="text-xs">Em breve</Badge>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-black/10 rounded-lg">
                              <span className="font-bold text-xs">Tk</span>
                            </div>
                            <Input
                              placeholder="@tiktok.handle (opcional)"
                              value={formData.tiktok}
                              onChange={(e) => updateField('tiktok', e.target.value)}
                              data-testid="input-tiktok"
                            />
                          </div>
                        </div>
                      </div>

                      {/* YouTube Card - Em breve */}
                      <div className="rounded-xl border-2 border-dashed border-border/60 opacity-60 overflow-hidden">
                        <div className="bg-muted/30 p-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                            <Youtube className="w-5 h-5 text-red-500" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">YouTube</h3>
                            <p className="text-muted-foreground text-xs">Integra\u00e7\u00e3o autom\u00e1tica</p>
                          </div>
                          <Badge variant="secondary" className="text-xs">Em breve</Badge>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/10 text-red-400 rounded-lg">
                              <Youtube className="w-5 h-5" />
                            </div>
                            <Input
                              placeholder="Link do canal (opcional)"
                              value={formData.youtube}
                              onChange={(e) => updateField('youtube', e.target.value)}
                              data-testid="input-youtube"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Portfolio */}
                      <div className="space-y-2 pt-2 border-t border-border">
                        <Label className="text-sm pt-4 block">Link do Portf\u00f3lio (opcional)</Label>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
                            <Link2 className="w-5 h-5" />
                          </div>
                          <Input
                            placeholder="https://seu-portfolio.com"
                            value={formData.portfolioUrl}
                            onChange={(e) => updateField('portfolioUrl', e.target.value)}
                            data-testid="input-portfolio"
                            type="url"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Link para seu portf\u00f3lio, site pessoal ou Behance</p>
                      </div>
                    </div>
                  )}

                  {/* Step 2 - Dados Banc\u00e1rios */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Chave PIX <span className="text-red-500">*</span></Label>
                        <Input
                          placeholder="CPF, Email, Telefone ou Chave Aleat\u00f3ria"
                          value={formData.pixKey}
                          onChange={(e) => updateField('pixKey', e.target.value)}
                          data-testid="input-pix"
                        />
                        <p className="text-xs text-muted-foreground">Sua chave PIX principal para recebimento.</p>
                      </div>

                      <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-sm text-yellow-400">
                        A conta vinculada ao PIX deve ser da mesma titularidade do CPF/CNPJ cadastrado.
                      </div>
                    </div>
                  )}

                  {/* Step 3 - Seus Dados */}
                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>CPF / CNPJ <span className="text-red-500">*</span></Label>
                        <Input
                          placeholder="000.000.000-00"
                          value={formData.cpf}
                          onChange={handleCpfChange}
                          data-testid="input-cpf"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Celular / WhatsApp <span className="text-red-500">*</span></Label>
                        <Input
                          placeholder="(00) 00000-0000"
                          value={formData.phone}
                          onChange={handlePhoneChange}
                          data-testid="input-phone"
                        />
                      </div>

                      <div className="space-y-2 pt-2">
                        <Label>Endere\u00e7o <span className="text-red-500">*</span></Label>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-1 relative">
                            <Input
                              placeholder="CEP *"
                              value={formData.cep}
                              onChange={handleCepChange}
                              onBlur={handleCepBlur}
                              data-testid="input-cep"
                            />
                            {isLoadingCep && <Loader2 className="w-4 h-4 absolute right-3 top-3 animate-spin text-muted-foreground" />}
                          </div>
                          <p className="text-xs text-muted-foreground col-span-3 mt-1">Digite o CEP para buscar o endere\u00e7o.</p>
                          <div className="col-span-2">
                            <Input
                              placeholder="Rua *"
                              value={formData.street}
                              onChange={(e) => updateField('street', e.target.value)}
                              data-testid="input-street"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          <div className="col-span-1">
                            <Input
                              placeholder="N\u00famero *"
                              value={formData.number}
                              onChange={(e) => updateField('number', e.target.value)}
                              data-testid="input-number"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              placeholder="Bairro *"
                              value={formData.neighborhood}
                              onChange={(e) => updateField('neighborhood', e.target.value)}
                              data-testid="input-neighborhood"
                            />
                          </div>
                          <div className="col-span-1">
                            <Input
                              placeholder="UF *"
                              value={formData.state}
                              onChange={(e) => updateField('state', e.target.value)}
                              data-testid="input-state"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <Input
                            placeholder="Cidade *"
                            value={formData.city}
                            onChange={(e) => updateField('city', e.target.value)}
                            data-testid="input-city"
                          />
                          <Input
                            placeholder="Complemento (opcional)"
                            value={formData.complement}
                            onChange={(e) => updateField('complement', e.target.value)}
                            data-testid="input-complement"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>

            <CardFooter className="flex justify-between border-t pt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0 || isSubmitting}
              >
                Voltar
              </Button>
              <Button onClick={handleNext} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  currentStep === steps.length - 1 ? 'Concluir Cadastro' : 'Pr\u00f3ximo'
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
}
