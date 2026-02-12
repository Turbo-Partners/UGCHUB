import { useState, useEffect, useRef } from 'react';
import { useMarketplace } from '@/lib/provider';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { User, Instagram, Youtube, Linkedin, CreditCard, Building2, Save, Search, Edit2, Camera, Upload, Users, Image as ImageIcon, TrendingUp, Shield, RefreshCw, Hash, Calendar, Loader2, Link2, Heart, MessageCircle, ExternalLink, Facebook, Unlink, CheckCircle2, Lock, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { fetchAddressByCEP } from '@/lib/cep';
import { NICHE_OPTIONS } from '@shared/constants';
import type { InstagramTopPost } from '@shared/schema';
import { format } from 'date-fns';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { getAvatarUrl } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useTikTokAccount, useDisconnectTikTok, useSyncTikTok } from "@/hooks/use-tiktok";

interface SocialConnection {
  platform: string;
  username: string | null;
  connected: boolean;
  lastSync: string | null;
  followers?: number;
  profileUrl?: string;
}


export default function CreatorProfile() {
  const { user, updateUser, isLoading } = useMarketplace();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdatingMetrics, setIsUpdatingMetrics] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatar: '',
    dateOfBirth: '',
    gender: '',
    niche: [] as string[],
    instagram: '',
    youtube: '',
    tiktok: '',
    portfolioUrl: '',
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
  const [isDisconnectingInstagram, setIsDisconnectingInstagram] = useState(false);

  const { data: connections = [] } = useQuery<SocialConnection[]>({
    queryKey: ["/api/creator/connections"],
    queryFn: async () => {
      const res = await fetch("/api/creator/connections", { credentials: "include" });
      if (!res.ok) {
        return [
          { platform: "instagram", username: null, connected: false, lastSync: null },
          { platform: "tiktok", username: null, connected: false, lastSync: null },
          { platform: "youtube", username: null, connected: false, lastSync: null },
          { platform: "facebook", username: null, connected: false, lastSync: null },
        ];
      }
      return res.json();
    },
  });

  // Instagram OAuth account
  const { data: instagramAccount } = useQuery<{ connected: boolean; account?: { username: string; profilePictureUrl?: string; followersCount?: number; followsCount?: number; mediaCount?: number; lastSyncAt?: string } }>({
    queryKey: ["/api/instagram/account"],
    queryFn: async () => {
      const res = await fetch("/api/instagram/account", { credentials: "include" });
      if (!res.ok) return { connected: false };
      return res.json();
    },
  });

  // TikTok OAuth account
  const { connected: tiktokConnected, account: tiktokAccount } = useTikTokAccount();
  const tiktokDisconnect = useDisconnectTikTok();
  const tiktokSync = useSyncTikTok();

  const handleDisconnectInstagram = async () => {
    setIsDisconnectingInstagram(true);
    try {
      const res = await fetch("/api/instagram/account", { method: "DELETE", credentials: "include" });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/instagram/account"] });
        queryClient.invalidateQueries({ queryKey: ["/api/creator/connections"] });
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        toast({ title: "Instagram desconectado", description: "Sua conta foi desconectada com sucesso." });
      } else {
        toast({ title: "Erro", description: "Não foi possível desconectar.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro", description: "Não foi possível desconectar.", variant: "destructive" });
    } finally {
      setIsDisconnectingInstagram(false);
    }
  };

  const getConnection = (platform: string): SocialConnection | undefined => {
    return connections.find(c => c.platform === platform);
  };

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || '',
        niche: user.niche || [],
        instagram: user.instagram || '',
        youtube: user.youtube || '',
        tiktok: user.tiktok || '',
        portfolioUrl: user.portfolioUrl || '',
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
      });
    }
  }, [user]);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleNiche = (value: string) => {
    if (!isEditing) return;
    setFormData(prev => {
      const current = prev.niche;
      if (current.includes(value)) {
        return { ...prev, niche: current.filter(item => item !== value) };
      } else {
        return { ...prev, niche: [...current, value] };
      }
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const validGenders = ["masculino", "feminino", "outro", "prefiro_nao_informar"] as const;
      const gender = formData.gender && validGenders.includes(formData.gender as any) 
        ? formData.gender as typeof validGenders[number]
        : undefined;

      await updateUser({
          ...formData,
          dateOfBirth: formData.dateOfBirth || undefined,
          gender,
          niche: formData.niche
      });
      setIsEditing(false);
      toast({
        title: "Perfil Atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || '',
        niche: user.niche || [],
        instagram: user.instagram || '',
        youtube: user.youtube || '',
        tiktok: user.tiktok || '',
        portfolioUrl: user.portfolioUrl || '',
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
      });
    }
  };

  const handleAvatarClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('avatar', file);

    setIsUploading(true);
    try {
      // We'll need to implement this endpoint
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      updateField('avatar', data.url);
      
      toast({
        title: "Imagem carregada",
        description: "Clique em 'Salvar Alterações' para confirmar a nova foto.",
      });
      
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar a imagem.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleCepBlur = async () => {
    if (!isEditing) return;
    if (formData.cep.length >= 8) {
      setIsLoadingCep(true);
      const address = await fetchAddressByCEP(formData.cep);
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

  const canUpdateMetrics = () => {
    if (!user?.instagramLastUpdated) return true;
    
    const daysSinceUpdate = (Date.now() - new Date(user.instagramLastUpdated).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate >= 30;
  };

  const getNextUpdateDate = () => {
    if (!user?.instagramLastUpdated) return null;
    
    const lastUpdate = new Date(user.instagramLastUpdated);
    const nextUpdate = new Date(lastUpdate.getTime() + 30 * 24 * 60 * 60 * 1000);
    return nextUpdate;
  };

  const handleUpdateMetrics = async () => {
    if (!canUpdateMetrics()) {
      const nextDate = getNextUpdateDate();
      if (nextDate) {
        toast({
          title: "Aguarde",
          description: `Métricas podem ser atualizadas novamente em ${format(nextDate, 'dd/MM/yyyy')}`,
          variant: "destructive"
        });
      }
      return;
    }

    setIsUpdatingMetrics(true);
    try {
      const response = await fetch('/api/social/update-metrics', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 429) {
          toast({
            title: "Limite atingido",
            description: error.error || 'Métricas podem ser atualizadas apenas uma vez a cada 30 dias',
            variant: "destructive"
          });
        } else {
          throw new Error(error.error || 'Erro ao atualizar métricas');
        }
        return;
      }

      await queryClient.refetchQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Métricas atualizadas!",
        description: 'Suas métricas do Instagram foram atualizadas com sucesso.',
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: 'Não foi possível atualizar as métricas do Instagram',
        variant: "destructive"
      });
    } finally {
      setIsUpdatingMetrics(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/auth');
    }
  }, [isLoading, user, setLocation]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* ... header ... */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-heading tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações públicas e privadas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="space-y-6">
          <Card className="border-none shadow-md">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="relative mb-4 group cursor-pointer" onClick={handleAvatarClick}>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={!isEditing}
                />
                <Avatar className={`h-32 w-32 border-4 border-white shadow-lg transition-opacity ${isEditing ? 'group-hover:opacity-75' : ''}`}>
                  <AvatarImage src={getAvatarUrl(formData.avatar || user.avatar)} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                
                {isEditing && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-full">
                    <Camera className="h-8 w-8 text-white drop-shadow-md" />
                  </div>
                )}

                {isEditing && (
                  <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 shadow-md">
                     {isUploading ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Upload className="h-4 w-4" />}
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold">{formData.name}</h2>
              <p className="text-sm text-muted-foreground mb-2">
                {formData.niche.length > 0 
                  ? formData.niche.map(slug => NICHE_OPTIONS.find(opt => opt.value === slug)?.label || slug).join(', ')
                  : 'Sem nicho definido'
                }
              </p>
              <div className="flex gap-2 mt-2">
                {formData.instagram && <Instagram className="h-4 w-4 text-pink-600" />}
                {formData.youtube && <Youtube className="h-4 w-4 text-red-600" />}
                {formData.tiktok && (
                  <div className="bg-black text-white text-[10px] font-bold px-1 rounded h-4 flex items-center">
                    Tk
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Forms */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-6">
              <TabsTrigger value="general">Geral</TabsTrigger>
              <TabsTrigger value="personal">Cadastro</TabsTrigger>
              <TabsTrigger value="connections">Conexões</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <Card className="border-none shadow-md">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>Informações Públicas</CardTitle>
                    <CardDescription>Dados visíveis para as empresas.</CardDescription>
                  </div>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Button onClick={handleCancel} variant="outline" size="sm" disabled={isSaving}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSave} size="sm" className="shadow-lg shadow-primary/20" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                      <Edit2 className="mr-2 h-4 w-4" />
                      Editar Perfil
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* ... name, bio ... */}
                  <div className="space-y-2">
                    <Label>Nome de Exibição</Label>
                    <Input 
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Bio</Label>
                    <Input 
                      value={formData.bio}
                      onChange={(e) => updateField('bio', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Link do Portfólio</Label>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                        <Link2 className="w-5 h-5" />
                      </div>
                      <Input 
                        placeholder="https://seu-portfolio.com" 
                        value={formData.portfolioUrl} 
                        onChange={(e) => updateField('portfolioUrl', e.target.value)}
                        disabled={!isEditing}
                        type="url"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data de Nascimento</Label>
                      <Input 
                        type="date" 
                        value={formData.dateOfBirth}
                        onChange={(e) => updateField('dateOfBirth', e.target.value)}
                        disabled={!isEditing}
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
                        disabled={!isEditing}
                      >
                        <option value="">Selecione...</option>
                        <option value="masculino">Masculino</option>
                        <option value="feminino">Feminino</option>
                        <option value="outro">Outro</option>
                        <option value="prefiro_nao_informar">Prefiro não informar</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Redes Sociais</Label>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-pink-100 text-pink-600 rounded-lg">
                        <Instagram className="w-5 h-5" />
                      </div>
                      <Input 
                        placeholder="@seu.usuario" 
                        value={formData.instagram}
                        onChange={(e) => updateField('instagram', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                        <Youtube className="w-5 h-5" />
                      </div>
                      <Input 
                        placeholder="Link do canal" 
                        value={formData.youtube}
                        onChange={(e) => updateField('youtube', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-black text-white rounded-lg w-9 h-9 flex items-center justify-center">
                         <span className="font-bold text-xs">Tk</span>
                      </div>
                      <Input 
                        placeholder="@tiktok.handle" 
                        value={formData.tiktok} 
                        onChange={(e) => updateField('tiktok', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-4">
                    <Label>Nichos Principais</Label>
                    <div className={`grid grid-cols-2 gap-2 border p-4 rounded-md h-48 overflow-y-auto ${!isEditing ? 'bg-muted/50 opacity-70 pointer-events-none' : ''}`}>
                        {NICHE_OPTIONS.map(option => (
                        <div key={option.value} className="flex items-center space-x-2">
                            <Checkbox 
                            id={`profile-niche-${option.value}`} 
                            checked={formData.niche.includes(option.value)}
                            onCheckedChange={() => toggleNiche(option.value)}
                            disabled={!isEditing}
                            />
                            <Label htmlFor={`profile-niche-${option.value}`} className="cursor-pointer font-normal">
                            {option.label}
                            </Label>
                        </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="connections">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Link2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Minhas Conexões</h3>
                    <p className="text-sm text-muted-foreground">
                      Conecte suas redes sociais para sincronizar métricas e validar seu perfil.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Instagram Card */}
                  {(() => {
                    const igOAuth = instagramAccount?.connected;
                    const igFallback = getConnection("instagram");
                    const igConnected = igOAuth || igFallback?.connected;
                    const igUsername = instagramAccount?.account?.username || igFallback?.username;

                    return (
                      <Card className={`relative ${igConnected ? "border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-950/20" : "hover:border-primary/50 transition-colors"}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 text-pink-600">
                              <Instagram className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium flex items-center gap-2">
                                Instagram
                                {igConnected && (
                                  <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Conectado
                                  </Badge>
                                )}
                              </p>
                              {igConnected && igUsername ? (
                                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                  @{igUsername}
                                  <a href={`https://instagram.com/${igUsername}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Conecte seu perfil do Instagram para sincronizar métricas.
                                </p>
                              )}
                              {igConnected && instagramAccount?.account?.followersCount != null && (
                                <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {instagramAccount.account.followersCount.toLocaleString()} seguidores
                                  </span>
                                  {instagramAccount.account.mediaCount != null && (
                                    <span className="flex items-center gap-1">
                                      <ImageIcon className="h-3 w-3" />
                                      {instagramAccount.account.mediaCount.toLocaleString()} posts
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          {igConnected ? (
                            <div className="mt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={handleDisconnectInstagram}
                                disabled={isDisconnectingInstagram}
                              >
                                {isDisconnectingInstagram ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <Unlink className="h-4 w-4 mr-2" />
                                )}
                                Desconectar
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-4"
                              onClick={() => { window.location.href = "/api/auth/instagram/start?type=creator"; }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Conectar Instagram
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })()}

                  {/* TikTok Card */}
                  <Card className={`relative ${tiktokConnected ? "border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-950/20" : "hover:border-primary/50 transition-colors"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-lg bg-gray-500/10 text-gray-900 dark:text-white">
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium flex items-center gap-2">
                            TikTok
                            {tiktokConnected && (
                              <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Conectado
                              </Badge>
                            )}
                          </p>
                          {tiktokConnected && tiktokAccount ? (
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              @{tiktokAccount.uniqueId}
                              <a href={`https://tiktok.com/@${tiktokAccount.uniqueId}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Conecte seu TikTok para acompanhar visualizações e engajamento.
                            </p>
                          )}
                          {tiktokConnected && tiktokAccount && (
                            <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {tiktokAccount.followers.toLocaleString()} seguidores
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {tiktokAccount.hearts.toLocaleString()} curtidas
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      {tiktokConnected ? (
                        <div className="mt-4 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => tiktokSync.mutate()}
                            disabled={tiktokSync.isPending}
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${tiktokSync.isPending ? 'animate-spin' : ''}`} />
                            {tiktokSync.isPending ? "Sincronizando..." : "Sincronizar"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => tiktokDisconnect.mutate()}
                            disabled={tiktokDisconnect.isPending}
                          >
                            {tiktokDisconnect.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Unlink className="h-4 w-4 mr-2" />
                            )}
                            Desconectar
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-4"
                          onClick={() => { window.location.href = "/api/tiktok/oauth/authorize?returnTo=/settings"; }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Conectar TikTok
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* YouTube Card - Em breve */}
                  <Card className="relative opacity-70 cursor-not-allowed">
                    <div className="absolute top-2 right-2 z-10">
                      <div className="p-1.5 rounded-full bg-muted">
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-lg bg-red-500/10 text-red-600 grayscale">
                          <Youtube className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium flex items-center gap-2">
                            YouTube
                            <Badge variant="secondary" className="text-xs">Em breve</Badge>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Integração em desenvolvimento
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Facebook Card - Em breve */}
                  <Card className="relative opacity-70 cursor-not-allowed">
                    <div className="absolute top-2 right-2 z-10">
                      <div className="p-1.5 rounded-full bg-muted">
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 grayscale">
                          <Facebook className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium flex items-center gap-2">
                            Facebook
                            <Badge variant="secondary" className="text-xs">Em breve</Badge>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Integração em desenvolvimento
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="personal">
              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle>Dados Cadastrais</CardTitle>
                  <CardDescription>Informações para nota fiscal e pagamentos.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>CPF / CNPJ</Label>
                    <Input 
                      placeholder="000.000.000-00" 
                      value={formData.cpf}
                      onChange={handleCpfChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Chave PIX</Label>
                    <Input 
                      placeholder="CPF, Email, Telefone ou Chave Aleatória" 
                      value={formData.pixKey}
                      onChange={(e) => updateField('pixKey', e.target.value)}
                      disabled={!isEditing}
                    />
                    <p className="text-xs text-muted-foreground">Sua chave PIX principal para recebimento.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Celular / WhatsApp</Label>
                    <Input 
                      placeholder="(00) 00000-0000" 
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <Label>Endereço</Label>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1 relative">
                        <Input 
                            placeholder="CEP" 
                            value={formData.cep}
                            onChange={(e) => updateField('cep', e.target.value)}
                            onBlur={handleCepBlur}
                            disabled={!isEditing}
                        />
                        {isLoadingCep && <Search className="w-4 h-4 absolute right-3 top-3 animate-spin text-muted-foreground" />}
                        </div>
                        <p className="text-xs text-muted-foreground col-span-3 mt-1">Digite o CEP para buscar o endereço.</p>
                        <div className="col-span-2">
                        <Input 
                            placeholder="Rua" 
                            value={formData.street}
                            onChange={(e) => updateField('street', e.target.value)}
                            disabled={!isEditing}
                        />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                        <div className="col-span-1">
                        <Input 
                            placeholder="Número" 
                            value={formData.number}
                            onChange={(e) => updateField('number', e.target.value)}
                            disabled={!isEditing}
                        />
                        </div>
                        <div className="col-span-2">
                        <Input 
                            placeholder="Bairro" 
                            value={formData.neighborhood}
                            onChange={(e) => updateField('neighborhood', e.target.value)}
                            disabled={!isEditing}
                        />
                        </div>
                        <div className="col-span-1">
                        <Input 
                            placeholder="UF" 
                            value={formData.state}
                            onChange={(e) => updateField('state', e.target.value)}
                            disabled={!isEditing}
                        />
                        </div>
                    </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                        <Input 
                            placeholder="Cidade" 
                            value={formData.city}
                            onChange={(e) => updateField('city', e.target.value)}
                            disabled={!isEditing}
                        />
                        <Input 
                            placeholder="Complemento" 
                            value={formData.complement}
                            onChange={(e) => updateField('complement', e.target.value)}
                            disabled={!isEditing}
                        />
                        </div>
                    </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

    </div>
  );
}
