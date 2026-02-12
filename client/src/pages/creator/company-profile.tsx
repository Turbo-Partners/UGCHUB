import { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Building2,
  Star,
  CheckCircle,
  Briefcase,
  Calendar,
  Loader2,
  AlertCircle,
  MapPin,
  Heart,
  ExternalLink,
  Globe,
  Instagram,
  ChevronDown,
  ChevronUp,
  Play,
  Users,
  TrendingUp,
  Package,
  ShieldCheck,
  Clock,
  Eye,
  Send,
  Sparkles,
  DollarSign,
  Check,
  Mail,
  CalendarDays,
  BadgeCheck,
  Palette,
  Tag,
  HelpCircle,
  FileText,
  Building,
  ShoppingBag,
  Phone,
  Linkedin,
  Facebook,
  Twitter,
  Youtube,
  Target,
  MessageSquare,
  Shield,
  Video,
  Ban,
} from 'lucide-react';
import type { StructuredBriefing } from '@shared/schema';
import { BRAND_VOICE_OPTIONS, IDEAL_CONTENT_TYPES } from '@shared/constants';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'wouter';
import { getAvatarUrl } from '@/lib/utils';

interface CompanyProfile {
  id: number;
  name: string;
  tradeName: string | null;
  logo: string | null;
  coverPhoto: string | null;
  description: string | null;
  category: string | null;
  tagline: string | null;
  city: string | null;
  state: string | null;
  website: string | null;
  instagram: string | null;
  tiktok: string | null;
  email: string | null;
  phone: string | null;
  cnpj: string | null;
  isFeatured: boolean;
  isDiscoverable: boolean;
  createdAt: string | null;
  companyBriefing: string | null;
  structuredBriefing: StructuredBriefing | null;
  brandColors: string[] | null;
  brandLogo: string | null;
  websiteProducts: string[] | null;
  // CNPJ enrichment
  cnpjRazaoSocial: string | null;
  cnpjSituacao: string | null;
  cnpjAtividadePrincipal: string | null;
  cnpjDataAbertura: string | null;
  cnpjNaturezaJuridica: string | null;
  // Website enrichment
  websiteTitle: string | null;
  websiteDescription: string | null;
  websiteKeywords: string[] | null;
  websiteSocialLinks: Record<string, string> | null;
  websiteFaq: { question: string; answer: string }[] | null;
  // E-commerce enrichment
  ecommercePlatform: string | null;
  ecommerceProductCount: number | null;
  ecommerceCategories: string[] | null;
  enrichmentScore: number | null;
}

interface InstagramMetrics {
  exists: boolean;
  username?: string;
  followers?: number;
  followersDisplay?: string;
  engagementRate?: number;
  engagementDisplay?: string;
  isVerified?: boolean;
  bio?: string;
  postsCount?: number;
}

interface CompanyStats {
  company: CompanyProfile;
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalApplications: number;
  acceptedApplications: number;
  acceptanceRate: string;
  avgResponseTime: string;
  avgRating: number;
  totalReviews: number;
  totalCollaborations: number;
  favoriteCount: number;
  topCreators: {
    id: number;
    name: string;
    avatar: string | null;
    collaborations: number;
    avgRating: number;
  }[];
}

interface RecentPartnership {
  id: number;
  campaignTitle: string;
  creatorName: string;
  creatorAvatar: string | null;
  creatorCity: string | null;
  creatorNiche: string | null;
  thumbnail: string | null;
  hasVideo: boolean;
  completedAt: string;
}

interface OpenCampaign {
  id: number;
  title: string;
  description: string;
  budget: number | null;
  deadline: string;
  targetNiche: string[] | null;
  creatorsNeeded: number | null;
  applicationsCount: number;
}

const categoryLabels: Record<string, string> = {
  saude: 'Saúde',
  beleza: 'Beleza',
  moda: 'Moda',
  tecnologia: 'Tecnologia',
  alimentos: 'Alimentos',
  bebidas: 'Bebidas',
  fitness: 'Fitness',
  casa: 'Casa',
  pets: 'Pets',
  infantil: 'Infantil',
  servicos: 'Serviços',
  outros: 'Outros',
};

export default function CompanyProfile() {
  const [matchCompany, paramsCompany] = useRoute('/company/:id/profile');
  const [matchBrand, paramsBrand] = useRoute('/brand/:id');
  const [_, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [applySheetOpen, setApplySheetOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [applyStep, setApplyStep] = useState<'select' | 'message' | 'success'>('select');
  const [instagramMetrics, setInstagramMetrics] = useState<InstagramMetrics | null>(null);
  
  const params = paramsCompany || paramsBrand;
  const companyId = params?.id ? parseInt(params.id) : null;

  const { data: stats, isLoading, error } = useQuery<CompanyStats>({
    queryKey: [`/api/companies/${companyId}/public-stats`],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/public-stats`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch company stats');
      return res.json();
    },
    enabled: !!companyId,
  });

  const { data: favoriteStatus } = useQuery<{ isFavorite: boolean }>({
    queryKey: [`/api/favorite-companies/${companyId}/check`],
    queryFn: async () => {
      const res = await fetch(`/api/favorite-companies/${companyId}/check`, {
        credentials: 'include',
      });
      if (!res.ok) return { isFavorite: false };
      return res.json();
    },
    enabled: !!companyId,
  });

  const { data: openCampaigns = [] } = useQuery<OpenCampaign[]>({
    queryKey: [`/api/companies/${companyId}/public-campaigns`],
    enabled: !!companyId,
  });

  const { data: recentPartnerships = [] } = useQuery<RecentPartnership[]>({
    queryKey: [`/api/companies/${companyId}/recent-partnerships`],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/recent-partnerships`, {
        credentials: 'include',
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!companyId,
  });

  useQuery({
    queryKey: [`instagram-metrics-${stats?.company?.instagram}`],
    queryFn: async () => {
      if (!stats?.company?.instagram) return null;
      const username = stats.company.instagram.replace('@', '').trim();
      if (!username) return null;
      
      const res = await fetch(`/api/enrichment/instagram/${encodeURIComponent(username)}`, {
        credentials: 'include',
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.success && data.data) {
        setInstagramMetrics(data.data);
      }
      return data;
    },
    enabled: !!stats?.company?.instagram,
    staleTime: 1000 * 60 * 30,
  });

  const { data: membershipStatus } = useQuery<{ isMember: boolean; status: string | null; joinedAt: string | null }>({
    queryKey: [`/api/companies/${companyId}/membership-status`],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/membership-status`, {
        credentials: 'include',
      });
      if (!res.ok) return { isMember: false, status: null, joinedAt: null };
      return res.json();
    },
    enabled: !!companyId,
  });

  const requestMembershipMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/request-membership`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao solicitar entrada');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/membership-status`] });
      toast.success('Solicitação enviada! A marca irá avaliar seu pedido.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const addFavoriteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/favorite-companies/${companyId}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to add favorite');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/favorite-companies/${companyId}/check`] });
      queryClient.invalidateQueries({ queryKey: ['/api/favorite-companies'] });
      toast.success('Marca adicionada aos favoritos!');
    },
    onError: () => {
      toast.error('Erro ao adicionar aos favoritos');
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/favorite-companies/${companyId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to remove favorite');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/favorite-companies/${companyId}/check`] });
      queryClient.invalidateQueries({ queryKey: ['/api/favorite-companies'] });
      toast.success('Marca removida dos favoritos');
    },
    onError: () => {
      toast.error('Erro ao remover dos favoritos');
    },
  });

  const applyMutation = useMutation({
    mutationFn: async ({ campaignId, message }: { campaignId: number; message: string }) => {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ campaignId, message }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao enviar candidatura');
      }
      return res.json();
    },
    onSuccess: () => {
      setApplyStep('success');
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/public-campaigns`] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const isFavorite = favoriteStatus?.isFavorite ?? false;
  const isFavoriteLoading = addFavoriteMutation.isPending || removeFavoriteMutation.isPending;

  const handleToggleFavorite = () => {
    if (isFavorite) {
      removeFavoriteMutation.mutate();
    } else {
      addFavoriteMutation.mutate();
    }
  };

  const handleOpenApplySheet = () => {
    setApplySheetOpen(true);
    setApplyStep('select');
    setSelectedCampaignId(null);
    setApplicationMessage('');
  };

  const handleSelectCampaign = (campaignId: number) => {
    setSelectedCampaignId(campaignId);
    setApplyStep('message');
  };

  const handleSubmitApplication = () => {
    if (!selectedCampaignId) return;
    applyMutation.mutate({ campaignId: selectedCampaignId, message: applicationMessage });
  };

  const handleCloseSheet = () => {
    setApplySheetOpen(false);
    setApplyStep('select');
    setSelectedCampaignId(null);
    setApplicationMessage('');
  };

  const selectedCampaign = openCampaigns.find(c => c.id === selectedCampaignId);

  // TikTok Icon component
  const TikTokIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  );

  if ((!matchCompany && !matchBrand) || !companyId) return null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-primary/20 rounded-full" />
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="mt-6 text-lg font-medium text-muted-foreground">Carregando perfil...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="p-4 bg-red-50 rounded-full mb-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Perfil não encontrado</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          Não foi possível carregar as informações desta marca.
        </p>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  const displayName = stats.company.tradeName || stats.company.name;
  const categoryLabel = stats.company.category ? categoryLabels[stats.company.category] || stats.company.category : null;
  
  const getMarketTime = () => {
    if (!stats.company.createdAt) return null;
    const createdDate = new Date(stats.company.createdAt);
    const now = new Date();
    const diffMonths = (now.getFullYear() - createdDate.getFullYear()) * 12 + (now.getMonth() - createdDate.getMonth());
    if (diffMonths < 1) return "Novo na plataforma";
    if (diffMonths < 12) return `${diffMonths} ${diffMonths === 1 ? 'mês' : 'meses'} na plataforma`;
    const years = Math.floor(diffMonths / 12);
    return `${years} ${years === 1 ? 'ano' : 'anos'} na plataforma`;
  };
  
  const marketTime = getMarketTime();

  return (
    <div className="animate-in fade-in duration-500 pb-12 -mx-4 sm:-mx-6 lg:-mx-8">
      <div className="relative">
        <div className="h-48 md:h-64 lg:h-80 w-full relative overflow-hidden">
          {stats.company.coverPhoto ? (
            <img 
              src={stats.company.coverPhoto} 
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-violet-500/20 dark:from-primary/40 dark:via-slate-800 dark:to-violet-900/30">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
        </div>

        <div className="absolute top-4 left-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.history.back()}
            className="bg-black/40 hover:bg-black/60 text-white shadow-lg backdrop-blur-sm border-0"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 md:-mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-visible shadow-xl border-0">
              <CardContent className="p-6 pt-0">
                <div className="flex flex-col sm:flex-row items-start gap-4 -mt-12 sm:-mt-16">
                  <div className="relative">
                    <Avatar className="h-24 w-24 sm:h-32 sm:w-32 ring-4 ring-white shadow-lg">
                      <AvatarImage src={getAvatarUrl(stats.company.logo)} />
                      <AvatarFallback className="text-3xl sm:text-4xl bg-gradient-to-br from-primary to-primary/80 text-white font-bold">
                        {displayName[0]}
                      </AvatarFallback>
                    </Avatar>
                    {stats.company.isFeatured && (
                      <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1.5 rounded-full shadow-lg">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 pt-4 sm:pt-16">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h1 className="text-2xl sm:text-3xl font-bold font-heading">{displayName}</h1>
                      {categoryLabel && (
                        <Badge variant="secondary" className="text-sm bg-primary/10 text-primary border-primary/20">
                          {categoryLabel}
                        </Badge>
                      )}
                      {stats.company.isFeatured && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Em destaque
                        </Badge>
                      )}
                    </div>
                    
                    {stats.company.tagline && (
                      <p className="text-muted-foreground text-sm italic mb-2">"{stats.company.tagline}"</p>
                    )}
                    
                    {stats.company.createdAt && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <CalendarDays className="h-3 w-3" />
                        <span>Na plataforma desde {format(new Date(stats.company.createdAt), "MMMM 'de' yyyy", { locale: ptBR })}</span>
                        {stats.totalCollaborations > 0 && (
                          <>
                            <span className="text-muted-foreground/50">•</span>
                            <span>{stats.totalCollaborations} parcerias realizadas</span>
                          </>
                        )}
                      </div>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <Button
                        size="lg"
                        className="gap-2"
                        onClick={handleOpenApplySheet}
                        disabled={openCampaigns.length === 0}
                        data-testid="button-apply-partnership"
                      >
                        <Sparkles className="h-4 w-4" />
                        Solicitar Parceria
                      </Button>

                      {membershipStatus?.isMember ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 py-1.5 px-3">
                          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                          Membro da comunidade
                        </Badge>
                      ) : membershipStatus?.status === "invited" ? (
                        <Badge variant="secondary" className="py-1.5 px-3">
                          <Clock className="h-3.5 w-3.5 mr-1.5" />
                          Solicitação pendente
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="lg"
                          className="gap-2"
                          onClick={() => requestMembershipMutation.mutate()}
                          disabled={requestMembershipMutation.isPending}
                          data-testid="button-join-community"
                        >
                          {requestMembershipMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Users className="h-4 w-4" />
                          )}
                          Entrar na Comunidade
                        </Button>
                      )}

                      <div className="flex items-center gap-2">
                        {stats.company.website && (
                          <Button variant="outline" size="icon" asChild>
                            <a href={stats.company.website.startsWith('http') ? stats.company.website : `https://${stats.company.website}`} target="_blank" rel="noopener noreferrer">
                              <Globe className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {stats.company.instagram && (
                          <Button variant="outline" size="icon" asChild>
                            <a href={`https://instagram.com/${stats.company.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                              <Instagram className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant={isFavorite ? "default" : "outline"}
                          size="icon"
                          onClick={handleToggleFavorite}
                          disabled={isFavoriteLoading}
                          className={isFavorite ? "bg-red-500 hover:bg-red-600 text-white" : ""}
                          data-testid="button-toggle-favorite"
                        >
                          {isFavoriteLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {stats.company.description && (
                  <div className="space-y-2">
                    <p className={`text-muted-foreground leading-relaxed ${!showFullDescription ? 'line-clamp-3' : ''}`}>
                      {stats.company.description}
                    </p>
                    {stats.company.description.length > 200 && (
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-primary"
                        onClick={() => setShowFullDescription(!showFullDescription)}
                      >
                        {showFullDescription ? (
                          <>Ver menos <ChevronUp className="h-4 w-4 ml-1" /></>
                        ) : (
                          <>Ver mais <ChevronDown className="h-4 w-4 ml-1" /></>
                        )}
                      </Button>
                    )}
                  </div>
                )}

                {/* Seção Sobre a Empresa */}
                {(() => {
                  const sb = stats.company.structuredBriefing;
                  const hasStructured = sb && (sb.whatWeDo || sb.targetAudience || sb.differentials || sb.brandVoice || sb.idealContentTypes?.length || sb.avoidTopics);
                  const hasEnrichment = stats.company.companyBriefing || stats.company.description ||
                    (stats.company.brandColors && stats.company.brandColors.length > 0) ||
                    (stats.company.websiteProducts && stats.company.websiteProducts.length > 0) ||
                    stats.company.cnpjRazaoSocial || stats.company.websiteSocialLinks ||
                    stats.company.websiteKeywords || stats.company.websiteFaq ||
                    stats.company.ecommercePlatform;

                  if (!hasStructured && !hasEnrichment) return null;

                  const brandVoiceLabel = sb?.brandVoice
                    ? BRAND_VOICE_OPTIONS.find(o => o.value === sb.brandVoice)?.label || sb.brandVoice
                    : null;

                  return (
                    <>
                      <Separator className="my-6" />
                      <div className="space-y-5">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          Sobre a Empresa
                        </h3>

                        {/* Briefing Estruturado da Marca */}
                        {hasStructured && (
                          <div className="space-y-4">
                            {/* Sobre a Marca (whatWeDo) */}
                            {sb.whatWeDo && (
                              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-200/30 dark:border-amber-800/30">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/15 to-orange-500/15 shrink-0 mt-0.5">
                                    <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-foreground mb-1">Sobre a Marca</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{sb.whatWeDo}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Grid: Público-Alvo + Diferenciais */}
                            {(sb.targetAudience || sb.differentials) && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {sb.targetAudience && (
                                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-200/30 dark:border-blue-800/30">
                                    <div className="flex items-start gap-3">
                                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/15 to-cyan-500/15 shrink-0 mt-0.5">
                                        <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-foreground mb-1">Público-Alvo</h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{sb.targetAudience}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {sb.differentials && (
                                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/5 to-green-500/5 border border-emerald-200/30 dark:border-emerald-800/30">
                                    <div className="flex items-start gap-3">
                                      <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/15 to-green-500/15 shrink-0 mt-0.5">
                                        <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-foreground mb-1">Diferenciais</h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{sb.differentials}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Tom de Voz + Conteúdo Ideal inline */}
                            {(brandVoiceLabel || (sb.idealContentTypes && sb.idealContentTypes.length > 0)) && (
                              <div className="flex flex-wrap items-center gap-2">
                                {brandVoiceLabel && (
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-200/30 dark:border-violet-800/30">
                                    <MessageSquare className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                                    <span className="text-xs font-medium text-violet-700 dark:text-violet-300">Tom: {brandVoiceLabel}</span>
                                  </div>
                                )}
                                {sb.idealContentTypes && sb.idealContentTypes.map(ct => {
                                  const label = IDEAL_CONTENT_TYPES.find(o => o.value === ct)?.label || ct;
                                  return (
                                    <div key={ct} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-200/30 dark:border-pink-800/30">
                                      <Video className="h-3.5 w-3.5 text-pink-600 dark:text-pink-400" />
                                      <span className="text-xs font-medium text-pink-700 dark:text-pink-300">{label}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* O que Evitar */}
                            {sb.avoidTopics && (
                              <div className="p-3 rounded-lg bg-red-500/5 border border-red-200/20 dark:border-red-800/20 flex items-start gap-2.5">
                                <Ban className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                  <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">Evitar</span>
                                  <p className="text-sm text-muted-foreground mt-0.5">{sb.avoidTopics}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Fallback: briefing texto livre (se não tem estruturado) */}
                        {!hasStructured && (stats.company.companyBriefing || stats.company.description) && (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              Sobre
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                              {stats.company.companyBriefing || stats.company.description}
                            </p>
                          </div>
                        )}

                        {/* Identidade Visual */}
                        {((stats.company.brandColors && stats.company.brandColors.length > 0) || stats.company.brandLogo) && (
                          <div className="p-4 rounded-xl bg-muted/30 space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <Palette className="h-4 w-4 text-muted-foreground" />
                              Identidade Visual
                            </div>
                            <div className="flex items-center gap-4">
                              {stats.company.brandColors && stats.company.brandColors.length > 0 && (
                                <div className="flex items-center gap-2">
                                  {stats.company.brandColors.slice(0, 6).map((color, idx) => (
                                    <div
                                      key={idx}
                                      className="w-8 h-8 rounded-full ring-2 ring-background shadow-sm"
                                      style={{ backgroundColor: color }}
                                      title={color}
                                    />
                                  ))}
                                </div>
                              )}
                              {stats.company.brandLogo && (
                                <div className="bg-background rounded-lg p-2 inline-block shadow-sm">
                                  <img src={stats.company.brandLogo} alt="Logo" className="h-8 max-w-[120px] object-contain" />
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Fatos-chave */}
                        {(stats.company.cnpjDataAbertura || stats.company.cnpjAtividadePrincipal || stats.company.cnpjSituacao || stats.company.cnpjNaturezaJuridica) && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              Fatos-chave
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              {stats.company.cnpjDataAbertura && (
                                <FactItem label="Fundação" value={stats.company.cnpjDataAbertura} />
                              )}
                              {stats.company.cnpjAtividadePrincipal && (
                                <FactItem label="Atividade" value={stats.company.cnpjAtividadePrincipal} />
                              )}
                              {stats.company.cnpjSituacao && (
                                <div className="space-y-0.5">
                                  <span className="text-xs text-muted-foreground">Situação</span>
                                  <div>
                                    <Badge variant={stats.company.cnpjSituacao === "ATIVA" ? "default" : "destructive"} className="text-xs">
                                      {stats.company.cnpjSituacao}
                                    </Badge>
                                  </div>
                                </div>
                              )}
                              {stats.company.cnpjNaturezaJuridica && (
                                <FactItem label="Natureza Jurídica" value={stats.company.cnpjNaturezaJuridica} />
                              )}
                            </div>
                          </div>
                        )}

                        {/* Produtos/Serviços */}
                        {((stats.company.websiteProducts && stats.company.websiteProducts.length > 0) || stats.company.ecommercePlatform) && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                              Produtos/Serviços
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {stats.company.websiteProducts && stats.company.websiteProducts.slice(0, 10).map((product, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  <Package className="h-3 w-3 mr-1" />
                                  {product}
                                </Badge>
                              ))}
                            </div>
                            {stats.company.ecommercePlatform && (
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                <span>Plataforma: <strong>{stats.company.ecommercePlatform}</strong></span>
                                {stats.company.ecommerceProductCount != null && (
                                  <span>{stats.company.ecommerceProductCount} produtos</span>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Palavras-chave */}
                        {stats.company.websiteKeywords && stats.company.websiteKeywords.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <Tag className="h-4 w-4 text-muted-foreground" />
                              Palavras-chave
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {stats.company.websiteKeywords.slice(0, 15).map((kw, idx) => (
                                <Badge key={idx} variant="outline" className="text-[11px] font-normal">
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* FAQ */}
                        {stats.company.websiteFaq && stats.company.websiteFaq.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                              Perguntas Frequentes
                            </div>
                            <Accordion type="single" collapsible className="w-full">
                              {stats.company.websiteFaq.map((item, idx) => (
                                <AccordionItem key={idx} value={`faq-${idx}`}>
                                  <AccordionTrigger className="text-sm text-left">{item.question}</AccordionTrigger>
                                  <AccordionContent className="text-sm text-muted-foreground">
                                    {item.answer}
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}

              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Campanhas
                  </h2>
                  <div className="flex items-center gap-2">
                    {openCampaigns.length > 0 && (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        {openCampaigns.length} abertas
                      </Badge>
                    )}
                    {stats.completedCampaigns > 0 && (
                      <Badge variant="secondary">
                        {stats.completedCampaigns} concluídas
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                {openCampaigns.length > 0 ? (
                  <div className="space-y-3">
                    {openCampaigns.slice(0, 3).map((campaign) => (
                      <Link key={campaign.id} href={`/campaign/${campaign.id}`}>
                        <motion.div 
                          whileHover={{ scale: 1.01 }}
                          className="p-4 rounded-xl border-2 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold group-hover:text-primary transition-colors">{campaign.title}</h3>
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  Aberta
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{campaign.description}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-3">
                                {campaign.budget && (
                                  <Badge variant="secondary" className="text-xs">
                                    <DollarSign className="h-3 w-3 mr-0.5" />
                                    R$ {campaign.budget.toLocaleString('pt-BR')}
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  <Calendar className="h-3 w-3 mr-0.5" />
                                  {format(new Date(campaign.deadline), "dd MMM", { locale: ptBR })}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  <Users className="h-3 w-3 mr-0.5" />
                                  {campaign.applicationsCount} candidatos
                                </Badge>
                              </div>
                            </div>
                            <Button variant="default" size="sm" className="shrink-0 gap-1">
                              Candidatar-se
                              <Sparkles className="h-3 w-3" />
                            </Button>
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                    {openCampaigns.length > 3 && (
                      <Button variant="outline" className="w-full">
                        Ver todas as {openCampaigns.length} campanhas
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                      <Briefcase className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold mb-1">Sem campanhas abertas</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Esta marca não está recrutando criadores no momento
                    </p>
                    {stats.completedCampaigns > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Histórico: {stats.completedCampaigns} campanhas realizadas
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  Parcerias Recentes
                </h2>
                {recentPartnerships.length > 0 && (
                  <span className="text-sm text-muted-foreground">{recentPartnerships.length} colaborações</span>
                )}
              </div>
              
              {recentPartnerships.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {recentPartnerships.map((partnership, idx) => (
                    <motion.div
                      key={partnership.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="overflow-hidden hover:shadow-md transition-all cursor-pointer group">
                        <div className="relative aspect-[4/5] bg-muted">
                          {partnership.thumbnail ? (
                            <img 
                              src={partnership.thumbnail} 
                              alt={partnership.creatorName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                              <Building2 className="h-8 w-8 text-muted-foreground/30" />
                            </div>
                          )}
                          {partnership.hasVideo && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                                <Play className="h-5 w-5 text-primary ml-1" />
                              </div>
                            </div>
                          )}
                          <div className="absolute bottom-2 left-2">
                            <Avatar className="h-8 w-8 ring-2 ring-white shadow">
                              <AvatarImage src={getAvatarUrl(partnership.creatorAvatar)} />
                              <AvatarFallback className="text-xs bg-primary text-white">
                                {partnership.creatorName[0]}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </div>
                        <CardContent className="p-3">
                          <div className="flex flex-wrap items-center gap-1 mb-1">
                            {partnership.creatorCity && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0">
                                <MapPin className="h-2.5 w-2.5 mr-0.5" />
                                {partnership.creatorCity}
                              </Badge>
                            )}
                            {partnership.creatorNiche && (
                              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                {partnership.creatorNiche}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium truncate">{partnership.creatorName}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Ainda sem parcerias</h3>
                    <p className="text-muted-foreground text-center max-w-md">
                      Esta marca está começando agora. Seja o primeiro a colaborar!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <Card className="sticky top-4 shadow-lg">
              <CardContent className="p-6 space-y-6">
                {/* Badge de Verificação */}
                {stats.company.cnpj && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800">
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-lg shadow-md">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-emerald-700 dark:text-emerald-300">Marca Verificada</h3>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                        CNPJ verificado no sistema
                      </p>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Estatísticas */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Estatísticas</h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                      <p className="text-2xl font-bold text-primary">{stats.activeCampaigns}</p>
                      <p className="text-xs text-muted-foreground mt-1">Campanhas Ativas</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-violet-500/10 to-violet-500/5 rounded-xl border border-violet-500/20">
                      <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{stats.totalCollaborations}</p>
                      <p className="text-xs text-muted-foreground mt-1">Colaborações</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        Avaliação
                      </span>
                      <span className="font-semibold flex items-center gap-1">
                        {stats.avgRating.toFixed(1)}
                        <span className="text-muted-foreground font-normal text-xs">({stats.totalReviews})</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        Taxa de Aceitação
                      </span>
                      <span className="font-semibold">{stats.acceptanceRate}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        Tempo de Resposta
                      </span>
                      <span className="font-semibold">{stats.avgResponseTime}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                        Favoritos
                      </span>
                      <span className="font-semibold">{stats.favoriteCount}</span>
                    </div>
                  </div>
                </div>

                {/* Contato & Redes Sociais */}
                {(stats.company.website || stats.company.email || stats.company.phone || stats.company.instagram || stats.company.tiktok || (stats.company.city || stats.company.state) || (stats.company.websiteSocialLinks && Object.keys(stats.company.websiteSocialLinks).length > 0)) && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Contato & Redes Sociais</h3>

                      <div className="space-y-2">
                        {stats.company.website && (
                          <a
                            href={stats.company.website.startsWith('http') ? stats.company.website : `https://${stats.company.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/70 transition-all group"
                          >
                            <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                              <Globe className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                                {stats.company.website.replace(/^https?:\/\//, '')}
                              </p>
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        )}

                        {stats.company.email && (
                          <a
                            href={`mailto:${stats.company.email}`}
                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/70 transition-all group"
                          >
                            <div className="p-2 rounded-md bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                              <Mail className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                                {stats.company.email}
                              </p>
                            </div>
                          </a>
                        )}

                        {stats.company.phone && (
                          <div className="flex items-center gap-3 p-2.5 rounded-lg">
                            <div className="p-2 rounded-md bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400">
                              <Phone className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{stats.company.phone}</p>
                            </div>
                          </div>
                        )}

                        {stats.company.instagram && (
                          <a
                            href={`https://instagram.com/${stats.company.instagram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/70 transition-all group"
                          >
                            <div className="p-2 rounded-md bg-gradient-to-br from-pink-500 to-purple-600 text-white">
                              <Instagram className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                                  {stats.company.instagram.startsWith('@') ? stats.company.instagram : `@${stats.company.instagram}`}
                                </p>
                                {instagramMetrics?.isVerified && (
                                  <BadgeCheck className="h-3 w-3 text-blue-500 flex-shrink-0" />
                                )}
                              </div>
                              {instagramMetrics?.followersDisplay && (
                                <p className="text-[10px] text-muted-foreground">{instagramMetrics.followersDisplay} seguidores</p>
                              )}
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        )}

                        {stats.company.tiktok && (
                          <a
                            href={`https://tiktok.com/@${stats.company.tiktok.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/70 transition-all group"
                          >
                            <div className="p-2 rounded-md bg-black dark:bg-white/90 text-white dark:text-black">
                              <TikTokIcon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                                {stats.company.tiktok.startsWith('@') ? stats.company.tiktok : `@${stats.company.tiktok}`}
                              </p>
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        )}

                        {/* Outras redes sociais do websiteSocialLinks */}
                        {stats.company.websiteSocialLinks && Object.entries(stats.company.websiteSocialLinks).map(([platform, url]) => {
                          // Pular se já mostramos acima
                          if (platform === 'instagram' || platform === 'tiktok') return null;

                          const getSocialIcon = () => {
                            switch (platform.toLowerCase()) {
                              case 'facebook': return <Facebook className="h-4 w-4" />;
                              case 'linkedin': return <Linkedin className="h-4 w-4" />;
                              case 'twitter': return <Twitter className="h-4 w-4" />;
                              case 'youtube': return <Youtube className="h-4 w-4" />;
                              default: return <Globe className="h-4 w-4" />;
                            }
                          };

                          const getIconBg = () => {
                            switch (platform.toLowerCase()) {
                              case 'facebook': return 'bg-blue-600 text-white';
                              case 'linkedin': return 'bg-blue-700 text-white';
                              case 'twitter': return 'bg-sky-500 text-white';
                              case 'youtube': return 'bg-red-600 text-white';
                              default: return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
                            }
                          };

                          return (
                            <a
                              key={platform}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/70 transition-all group"
                            >
                              <div className={`p-2 rounded-md ${getIconBg()}`}>
                                {getSocialIcon()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate group-hover:text-primary transition-colors capitalize">
                                  {platform}
                                </p>
                              </div>
                              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          );
                        })}

                        {(stats.company.city || stats.company.state) && (
                          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 mt-3">
                            <div className="p-2 rounded-md bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400">
                              <MapPin className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">
                                {[stats.company.city, stats.company.state].filter(Boolean).join(', ')}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Instagram Metrics */}
                {instagramMetrics?.exists && (instagramMetrics.followersDisplay || instagramMetrics.engagementDisplay) && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <Instagram className="h-4 w-4" />
                        Métricas do Instagram
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {instagramMetrics.followersDisplay && (
                          <div className="text-center p-3 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 rounded-lg border border-pink-200/50 dark:border-pink-800/30">
                            <p className="text-lg font-bold text-primary">{instagramMetrics.followersDisplay}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Seguidores</p>
                          </div>
                        )}
                        {instagramMetrics.engagementDisplay && (
                          <div className="text-center p-3 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 rounded-lg border border-pink-200/50 dark:border-pink-800/30">
                            <p className="text-lg font-bold text-primary">{instagramMetrics.engagementDisplay}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Engajamento</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {stats.topCreators.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Top Criadores</h3>
                      <div className="space-y-2">
                        {stats.topCreators.slice(0, 4).map((creator) => (
                          <div key={creator.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={getAvatarUrl(creator.avatar)} />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {creator.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{creator.name}</p>
                              <p className="text-xs text-muted-foreground">{creator.collaborations} parcerias</p>
                            </div>
                            {creator.avgRating > 0 && (
                              <div className="flex items-center gap-1 text-xs">
                                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                {creator.avgRating.toFixed(1)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  {openCampaigns.length > 0 ? (
                    <Button
                      className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all"
                      size="lg"
                      onClick={handleOpenApplySheet}
                      data-testid="button-apply-sidebar"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Solicitar Parceria
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      size="lg"
                      variant="secondary"
                      disabled
                      data-testid="button-apply-sidebar"
                    >
                      <Briefcase className="h-4 w-4 mr-2" />
                      Sem campanhas abertas
                    </Button>
                  )}

                  {!membershipStatus?.isMember && membershipStatus?.status !== "invited" && (
                    <Button
                      className="w-full"
                      variant="outline"
                      size="lg"
                      onClick={() => requestMembershipMutation.mutate()}
                      disabled={requestMembershipMutation.isPending}
                    >
                      {requestMembershipMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Users className="h-4 w-4 mr-2" />
                      )}
                      Entrar na Comunidade
                    </Button>
                  )}

                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={handleToggleFavorite}
                    disabled={isFavoriteLoading}
                  >
                    {isFavorite ? (
                      <>
                        <Heart className="h-4 w-4 mr-2 fill-current text-red-500" />
                        Favoritada
                      </>
                    ) : (
                      <>
                        <Heart className="h-4 w-4 mr-2" />
                        Adicionar aos favoritos
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>

      {/* Apply Partnership Sheet */}
      <Sheet open={applySheetOpen} onOpenChange={setApplySheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                <AvatarImage src={getAvatarUrl(stats.company.logo)} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white font-bold">
                  {displayName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-left">Solicitar Parceria</SheetTitle>
                <SheetDescription className="text-left">
                  {displayName}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="mt-6">
            <AnimatePresence mode="wait">
              {applyStep === 'select' && (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <h3 className="font-semibold">Escolha uma campanha</h3>
                    <p className="text-sm text-muted-foreground">
                      Selecione a campanha para a qual você deseja se candidatar
                    </p>
                  </div>

                  {openCampaigns.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-8">
                        <div className="rounded-full bg-muted p-3 mb-3">
                          <Briefcase className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground text-center">
                          Esta marca não tem campanhas abertas no momento
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {openCampaigns.map((campaign) => (
                        <motion.div
                          key={campaign.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card 
                            className="cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                            onClick={() => handleSelectCampaign(campaign.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-1">
                                  <h4 className="font-medium">{campaign.title}</h4>
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {campaign.description}
                                  </p>
                                  <div className="flex items-center gap-3 pt-2">
                                    {campaign.budget && (
                                      <Badge variant="secondary" className="text-xs">
                                        <DollarSign className="h-3 w-3 mr-0.5" />
                                        R$ {campaign.budget.toLocaleString('pt-BR')}
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="text-xs">
                                      <Calendar className="h-3 w-3 mr-0.5" />
                                      {format(new Date(campaign.deadline), "dd MMM", { locale: ptBR })}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      <Users className="h-3 w-3 mr-0.5" />
                                      {campaign.applicationsCount} candidatos
                                    </Badge>
                                  </div>
                                </div>
                                <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {applyStep === 'message' && selectedCampaign && (
                <motion.div
                  key="message"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-0 h-auto text-muted-foreground"
                      onClick={() => setApplyStep('select')}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Voltar
                    </Button>
                    <h3 className="font-semibold">{selectedCampaign.title}</h3>
                  </div>

                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {selectedCampaign.budget && (
                          <Badge variant="secondary" className="text-xs">
                            <DollarSign className="h-3 w-3 mr-0.5" />
                            R$ {selectedCampaign.budget.toLocaleString('pt-BR')}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="h-3 w-3 mr-0.5" />
                          Prazo: {format(new Date(selectedCampaign.deadline), "dd/MM/yyyy", { locale: ptBR })}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-2">
                    <Label htmlFor="message">Sua mensagem</Label>
                    <Textarea
                      id="message"
                      placeholder="Olá! Estou muito interessado(a) nesta campanha porque..."
                      className="min-h-[150px] resize-none"
                      value={applicationMessage}
                      onChange={(e) => setApplicationMessage(e.target.value)}
                      data-testid="input-application-message"
                    />
                    <p className="text-xs text-muted-foreground">
                      Apresente-se e explique por que você é ideal para esta campanha
                    </p>
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleSubmitApplication}
                    disabled={applyMutation.isPending}
                    data-testid="button-submit-application"
                  >
                    {applyMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Candidatura
                      </>
                    )}
                  </Button>
                </motion.div>
              )}

              {applyStep === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 space-y-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                    className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center"
                  >
                    <Check className="h-10 w-10 text-green-600" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-center">Candidatura Enviada!</h3>
                  <p className="text-muted-foreground text-center max-w-sm">
                    Sua candidatura foi enviada com sucesso. A marca irá avaliar seu perfil e entrará em contato em breve.
                  </p>
                  <Button onClick={handleCloseSheet} variant="outline" className="mt-4">
                    Fechar
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function FactItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-medium leading-snug">{value}</p>
    </div>
  );
}
