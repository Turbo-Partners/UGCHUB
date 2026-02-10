import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMarketplace } from '@/lib/provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Instagram, Youtube, Search, User, CreditCard, Building2, CheckCircle2, Shield, Users, Image, TrendingUp, Loader2, AlertCircle, Link2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAddressByCEP } from '@/lib/cep';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarUrl } from '@/lib/utils';

const steps = [
  {
    id: 'social',
    title: "Nicho & Redes",
    description: "Conecte suas redes para mostrar seu alcance",
    icon: <User className="w-6 h-6" />
  },
  {
    id: 'banking',
    title: "Dados Bancários",
    description: "Onde você receberá seus pagamentos",
    icon: <CreditCard className="w-6 h-6" />
  },
  {
    id: 'personal',
    title: "Cadastro",
    description: "Informações pessoais para faturamento",
    icon: <Building2 className="w-6 h-6" />
  }
];

const NICHE_OPTIONS = [
  { value: "tech", label: "Tecnologia & Games" },
  { value: "lifestyle", label: "Estilo de Vida & Vlogs" },
  { value: "beauty", label: "Beleza & Moda" },
  { value: "education", label: "Educação" },
  { value: "finance", label: "Finanças & Investimentos" },
  { value: "health", label: "Saúde & Fitness" },
  { value: "travel", label: "Viagens" },
  { value: "food", label: "Gastronomia" },
  { value: "entertainment", label: "Entretenimento & Humor" }
];

export default function CreatorOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, updateUser, isLoading } = useMarketplace();

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
  const [isValidatingInstagram, setIsValidatingInstagram] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [instagramMetrics, setInstagramMetrics] = useState<any>(null);
  const [instagramError, setInstagramError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingInstagramData, setPendingInstagramData] = useState<any>(null);

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

  const validateCurrentStep = () => {
    if (currentStep === 0) {
      // Step 0: Nicho & Redes - Bio, Instagram e niche obrigatórios
      if (!formData.bio.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Conte um pouco sobre você.",
          variant: "destructive"
        });
        return false;
      }
      if (formData.niche.length === 0) {
        toast({
          title: "Campo obrigatório",
          description: "Selecione pelo menos um nicho.",
          variant: "destructive"
        });
        return false;
      }
      if (!formData.instagram.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Preencha seu Instagram.",
          variant: "destructive"
        });
        return false;
      }
      
      // Validate Instagram profile
      if (instagramError) {
        toast({
          title: "Instagram inválido",
          description: instagramError,
          variant: "destructive"
        });
        return false;
      }
      
      if (isValidatingInstagram) {
        toast({
          title: "Aguarde",
          description: "Validando perfil do Instagram...",
          variant: "default"
        });
        return false;
      }
      
      if (!instagramMetrics || !instagramMetrics.exists) {
        toast({
          title: "Perfil não validado",
          description: "Por favor, clique em 'Verificar' para validar seu perfil do Instagram.",
          variant: "destructive"
        });
        return false;
      }
      
      // Accept private profiles - they just have partial metrics
      
      // Youtube e TikTok são opcionais
    } else if (currentStep === 1) {
      // Step 1: Dados Bancários - PIX obrigatório
      if (!formData.pixKey.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Preencha sua chave PIX.",
          variant: "destructive"
        });
        return false;
      }
    } else if (currentStep === 2) {
      // Step 2: Cadastro - Todos obrigatórios exceto complemento
      if (!formData.cpf.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Preencha seu CPF/CNPJ.",
          variant: "destructive"
        });
        return false;
      }
      if (!formData.phone.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Preencha seu telefone.",
          variant: "destructive"
        });
        return false;
      }
      const cepDigits = formData.cep.replace(/\D/g, '');
      if (cepDigits.length < 8) {
        toast({
          title: "Campo obrigatório",
          description: "Preencha o CEP completo (8 dígitos).",
          variant: "destructive"
        });
        return false;
      }
      if (!formData.street.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Preencha a rua.",
          variant: "destructive"
        });
        return false;
      }
      if (!formData.number.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Preencha o número.",
          variant: "destructive"
        });
        return false;
      }
      if (!formData.neighborhood.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Preencha o bairro.",
          variant: "destructive"
        });
        return false;
      }
      if (!formData.city.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Preencha a cidade.",
          variant: "destructive"
        });
        return false;
      }
      if (!formData.state.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Preencha o estado (UF).",
          variant: "destructive"
        });
        return false;
      }
      // complement é opcional
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Finish onboarding - strip masks before sending to backend
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
        
        // If Instagram metrics were collected, save them (including partial data from private profiles)
        if (instagramMetrics && instagramMetrics.exists) {
          // Always save whatever data is available
          if (instagramMetrics.followers !== undefined) {
            userData.instagramFollowers = instagramMetrics.followers;
          }
          if (instagramMetrics.following !== undefined) {
            userData.instagramFollowing = instagramMetrics.following;
          }
          if (instagramMetrics.postsCount !== undefined) {
            userData.instagramPosts = instagramMetrics.postsCount;
          }
          // For private profiles, these will likely be undefined
          if (instagramMetrics.engagementRate) {
            userData.instagramEngagementRate = instagramMetrics.engagementRate;
          }
          if (instagramMetrics.isVerified !== undefined) {
            userData.instagramVerified = instagramMetrics.isVerified;
          }
          if (instagramMetrics.authenticityScore !== undefined) {
            userData.instagramAuthenticityScore = instagramMetrics.authenticityScore;
          }
          if (instagramMetrics.topHashtags && instagramMetrics.topHashtags.length > 0) {
            userData.instagramTopHashtags = instagramMetrics.topHashtags;
          }
          if (instagramMetrics.topPosts && instagramMetrics.topPosts.length > 0) {
            userData.instagramTopPosts = instagramMetrics.topPosts;
          }
          userData.instagramLastUpdated = new Date().toISOString();
          // Use Instagram profile picture as avatar
          if (instagramMetrics.profilePicUrl) {
            userData.avatar = instagramMetrics.profilePicUrl;
          }
        }
        
        await updateUser(userData); 
        toast({
            title: "Perfil Completo!",
            description: "Suas informações foram salvas com sucesso.",
        });
        window.location.href = '/feed';
      } catch (error) {
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

  const validateInstagram = async (username: string) => {
    const cleanUsername = username.replace('@', '').trim();
    if (!cleanUsername || cleanUsername.length < 3) {
      setInstagramMetrics(null);
      setInstagramError(null);
      setShowVerificationModal(false);
      return;
    }

    setIsValidatingInstagram(true);
    setInstagramError(null);
    
    try {
      const response = await fetch('/api/social/validate-instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: cleanUsername })
      });

      if (!response.ok) {
        throw new Error('Falha ao validar perfil');
      }

      const metrics = await response.json();
      setShowVerificationModal(false);
      
      if (!metrics.exists) {
        setInstagramError('Perfil não encontrado no Instagram');
        setInstagramMetrics(null);
      } else {
        // Accept both public and private profiles
        // For private profiles, we'll use whatever data is available
        setPendingInstagramData(metrics);
        setShowConfirmModal(true);
        setInstagramError(null);
      }
    } catch (error) {
      setInstagramError('Erro ao validar perfil');
      setInstagramMetrics(null);
      setShowVerificationModal(false);
    } finally {
      setIsValidatingInstagram(false);
    }
  };

  const handleConfirmInstagram = () => {
    if (pendingInstagramData) {
      setInstagramMetrics(pendingInstagramData);
      setShowConfirmModal(false);
      setPendingInstagramData(null);
      toast({
        title: "Perfil confirmado!",
        description: "Suas métricas do Instagram foram validadas com sucesso.",
      });
    }
  };

  const handleCancelInstagram = () => {
    setShowConfirmModal(false);
    setPendingInstagramData(null);
    setInstagramMetrics(null);
    updateField('instagram', '');
    toast({
      title: "Cancelado",
      description: "Por favor, insira o perfil correto do Instagram.",
      variant: "destructive"
    });
  };

  // Instagram validation is now triggered manually via button click
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  
  const handleVerifyInstagram = () => {
    if (formData.instagram && formData.instagram.length >= 3) {
      setShowVerificationModal(true);
      validateInstagram(formData.instagram);
    } else {
      toast({
        title: "Instagram inválido",
        description: "Digite um nome de usuário válido do Instagram.",
        variant: "destructive"
      });
    }
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
          title: "CEP não encontrado",
          description: "Por favor, preencha o endereço manualmente.",
          variant: "destructive"
        });
      }
    }
  };

  // Masks
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 14) value = value.slice(0, 14);
    
    // Apply mask (Simple logic for CPF/CNPJ mixed)
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
    
    // Apply mask: (00) 00000-0000 or (00) 0000-0000
    if (value.length <= 10) {
      // Landline format: (00) 0000-0000
      value = value.replace(/^(\d{2})(\d)/, '($1) $2');
      value = value.replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      // Mobile format: (00) 00000-0000
      value = value.replace(/^(\d{2})(\d)/, '($1) $2');
      value = value.replace(/(\d{5})(\d)/, '$1-$2');
    }
    
    updateField('phone', value);
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    
    // Apply mask: 00000-000
    value = value.replace(/^(\d{5})(\d)/, '$1-$2');
    
    updateField('cep', value);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;
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
            <p className="text-muted-foreground">Complete estas etapas para começar a se candidatar a campanhas.</p>
          </div>

          <div className="space-y-6 relative">
            <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border -z-10" />
            {steps.map((step, index) => (
              <div key={step.id} className="flex gap-4 relative">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300 z-10
                  ${index <= currentStep 
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
                  transition={{ duration: 0.2 }}
                >
                  {currentStep === 0 && (
                    <div className="space-y-6">
                      {/* 1. Conecte suas redes - PRIMEIRO */}
                      <div className="space-y-4">
                        <Label className="text-base font-semibold">Conecte suas redes</Label>
                        {/* Instagram */}
                        <div className="space-y-2">
                          <Label className="text-sm">Instagram <span className="text-red-500">*</span></Label>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-pink-500/20 text-pink-400 rounded-lg">
                              <Instagram className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <Input 
                                placeholder="@seu.usuario" 
                                value={formData.instagram}
                                onChange={(e) => {
                                  updateField('instagram', e.target.value);
                                  setInstagramMetrics(null);
                                  setInstagramError(null);
                                }}
                                data-testid="input-instagram"
                              />
                            </div>
                            <Button
                              type="button"
                              onClick={handleVerifyInstagram}
                              disabled={isValidatingInstagram || !formData.instagram}
                              data-testid="button-verify-instagram"
                            >
                              {isValidatingInstagram ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Search className="w-4 h-4 mr-2" />
                              )}
                              {isValidatingInstagram ? 'Verificando...' : 'Verificar'}
                            </Button>
                          </div>
                          
                          {instagramError && (
                            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/20 p-2 rounded-md">
                              <AlertCircle className="w-4 h-4" />
                              <span>{instagramError}</span>
                            </div>
                          )}
                          
                          {instagramMetrics && instagramMetrics.exists && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`p-4 border rounded-lg space-y-3 ${instagramMetrics.isPrivate ? 'bg-yellow-500/20 border-yellow-500/30' : 'bg-green-500/20 border-green-500/30'}`}
                            >
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className={`w-5 h-5 ${instagramMetrics.isPrivate ? 'text-yellow-400' : 'text-green-400'}`} />
                                <span className={`font-semibold ${instagramMetrics.isPrivate ? 'text-yellow-300' : 'text-green-300'}`}>
                                  {instagramMetrics.isPrivate ? 'Perfil verificado (privado)' : 'Perfil verificado!'}
                                </span>
                              </div>
                              
                              {instagramMetrics.isPrivate && (
                                <p className="text-xs text-yellow-400">
                                  Como seu perfil é privado, algumas métricas podem não estar disponíveis.
                                </p>
                              )}
                              
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <Users className={`w-4 h-4 ${instagramMetrics.isPrivate ? 'text-yellow-400' : 'text-green-400'}`} />
                                  <span className={instagramMetrics.isPrivate ? 'text-yellow-300' : 'text-green-300'}>
                                    {instagramMetrics.followers?.toLocaleString() || 0} seguidores
                                  </span>
                                </div>
                                {instagramMetrics.postsCount !== undefined && (
                                  <div className="flex items-center gap-2">
                                    <Image className={`w-4 h-4 ${instagramMetrics.isPrivate ? 'text-yellow-400' : 'text-green-400'}`} />
                                    <span className={instagramMetrics.isPrivate ? 'text-yellow-300' : 'text-green-300'}>
                                      {instagramMetrics.postsCount || 0} posts
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {instagramMetrics.isVerified && (
                                <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Verificado
                                </Badge>
                              )}
                            </motion.div>
                          )}
                        </div>
                        {/* Youtube */}
                        <div className="space-y-2">
                          <Label className="text-sm">YouTube (opcional)</Label>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/20 text-red-400 rounded-lg">
                              <Youtube className="w-5 h-5" />
                            </div>
                            <Input 
                              placeholder="Link do canal" 
                              value={formData.youtube}
                              onChange={(e) => updateField('youtube', e.target.value)}
                              data-testid="input-youtube"
                            />
                          </div>
                        </div>
                        {/* TikTok */}
                        <div className="space-y-2">
                          <Label className="text-sm">TikTok (opcional)</Label>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-black text-white rounded-lg w-9 h-9 flex items-center justify-center">
                              <span className="font-bold text-xs">Tk</span>
                            </div>
                            <Input 
                              placeholder="@tiktok.handle" 
                              value={formData.tiktok} 
                              onChange={(e) => updateField('tiktok', e.target.value)}
                              data-testid="input-tiktok"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 2. Portfolio - SEGUNDO */}
                      <div className="space-y-2 pt-2 border-t border-border">
                        <Label className="text-sm pt-4 block">Link do Portfólio (opcional)</Label>
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
                        <p className="text-xs text-muted-foreground">Link para seu portfólio, site pessoal ou Behance</p>
                      </div>

                      {/* 3. Conte sobre você - TERCEIRO */}
                      <div className="space-y-4 pt-2 border-t border-border">
                        <div className="pt-4 flex items-center justify-between">
                          <Label className="text-base font-semibold">Conte um pouco sobre você <span className="text-red-500">*</span></Label>
                          {instagramMetrics && instagramMetrics.bio && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateField('bio', instagramMetrics.bio)}
                              className="text-xs gap-1.5"
                              data-testid="button-fill-from-instagram"
                            >
                              <Instagram className="w-3.5 h-3.5 text-pink-400" />
                              Usar bio do Instagram
                            </Button>
                          )}
                        </div>
                        <textarea 
                          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                          placeholder="Descreva brevemente seu trabalho, estilo de conteúdo e público-alvo..."
                          value={formData.bio}
                          onChange={(e) => updateField('bio', e.target.value)}
                          data-testid="input-bio"
                        />
                        <p className="text-xs text-muted-foreground">Essa descrição será vista pelas marcas ao visualizar seu perfil.</p>
                      </div>

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
                          <p className="text-xs text-muted-foreground">Você deve ter pelo menos 18 anos</p>
                        </div>
                        <div className="space-y-2">
                          <Label>Gênero</Label>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.gender}
                            onChange={(e) => updateField('gender', e.target.value)}
                            data-testid="select-gender"
                          >
                            <option value="">Selecione...</option>
                            <option value="masculino">Masculino</option>
                            <option value="feminino">Feminino</option>
                            <option value="outro">Outro</option>
                            <option value="prefiro_nao_informar">Prefiro não informar</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Quais seus nichos principais? <span className="text-red-500">*</span></Label>
                        <div className="grid grid-cols-2 gap-2 border p-4 rounded-md h-48 overflow-y-auto">
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
                    </div>
                  )}

                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Chave PIX <span className="text-red-500">*</span></Label>
                        <Input 
                          placeholder="CPF, Email, Telefone ou Chave Aleatória" 
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

                  {currentStep === 2 && (
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
                        <Label>Endereço <span className="text-red-500">*</span></Label>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-1 relative">
                            <Input 
                              placeholder="CEP *" 
                              value={formData.cep}
                              onChange={handleCepChange}
                              onBlur={handleCepBlur}
                              data-testid="input-cep"
                            />
                            {isLoadingCep && <Search className="w-4 h-4 absolute right-3 top-3 animate-spin text-muted-foreground" />}
                          </div>
                          <p className="text-xs text-muted-foreground col-span-3 mt-1">Digite o CEP para buscar o endereço.</p>
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
                              placeholder="Número *" 
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
                  currentStep === steps.length - 1 ? 'Concluir Cadastro' : 'Próximo'
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      </div>

      {/* Instagram Verification Loading Modal */}
      <Dialog open={showVerificationModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Verificando Instagram</DialogTitle>
            <DialogDescription className="text-center">
              Estamos buscando as informações do seu perfil...
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-pink-500/20 flex items-center justify-center">
                <Instagram className="w-8 h-8 text-pink-400" />
              </div>
              <div className="absolute -bottom-1 -right-1">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Isso pode levar alguns segundos...
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Instagram Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Confirme seu perfil do Instagram</DialogTitle>
            <DialogDescription className="text-center">
              Este é o seu perfil? Verifique se os dados estão corretos.
            </DialogDescription>
          </DialogHeader>
          
          {pendingInstagramData && (
            <div className="flex flex-col items-center gap-6 py-4">
              {/* Profile Avatar */}
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                {pendingInstagramData.profilePicUrl ? (
                  <img 
                    src={getAvatarUrl(pendingInstagramData.profilePicUrl)}
                    alt={`@${pendingInstagramData.username}`}
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      console.error('[Avatar] Failed to load Instagram image');
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : null}
                <AvatarFallback className="text-2xl">
                  {pendingInstagramData.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Username */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Instagram className="h-5 w-5 text-pink-600" />
                  <span className="text-lg font-bold">@{pendingInstagramData.username}</span>
                  {pendingInstagramData.isVerified && (
                    <Shield className="h-5 w-5 text-blue-500" fill="currentColor" />
                  )}
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
                  <Users className="h-5 w-5 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">
                    {pendingInstagramData.followers?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Seguidores</div>
                </div>
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
                  <Users className="h-5 w-5 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">
                    {pendingInstagramData.following?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Seguindo</div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={handleCancelInstagram}
              className="w-full sm:w-auto"
              data-testid="button-cancel-instagram"
            >
              Não, cancelar
            </Button>
            <Button 
              onClick={handleConfirmInstagram}
              className="w-full sm:w-auto"
              data-testid="button-confirm-instagram"
            >
              Sim, é meu perfil!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
