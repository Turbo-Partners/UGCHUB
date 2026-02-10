import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, useLocation, useSearch } from 'wouter';
import { useMarketplace } from '@/lib/provider';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Building2,
  ChevronRight,
  Crown,
  Package,
  Bell,
  Loader2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Star,
  Ticket,
  ArrowLeft,
  ArrowRight,
  Trophy,
  Gift,
  Coins,
  Copy,
  CheckCircle,
  Clock,
  MessageSquare,
  Award,
  TrendingUp,
  ExternalLink,
  Instagram,
  Globe,
  Calendar,
  CheckCircle2,
  Sparkles,
  Users,
  Target,
  DollarSign,
  Check,
  X,
  Eye,
  Lightbulb,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TierInfo {
  id: number;
  name: string;
  color: string | null;
  icon: string | null;
  minPoints: number;
  benefits?: {
    priorityCampaigns?: boolean;
    fasterPayout?: boolean;
    exclusiveContent?: boolean;
    badgeVisible?: boolean;
    customBenefits?: string[];
  };
}

interface AvailableCampaign {
  campaignId: number;
  campaignTitle: string;
  budget: string | null;
  deadline: string | null;
  visibility: string;
  isInternal: boolean;
  eligible?: boolean;
  eligibilityReason?: string | null;
  minTierId?: number | null;
  minPoints?: number | null;
}

interface CampaignSummary {
  applicationId: number;
  campaignId: number;
  campaignTitle: string;
  budget: number | null;
  deadline: string | null;
  workflowStatus: string;
  status: string;
}

interface PendingInvite {
  id: number;
  type: string;
  campaignId: number | null;
  campaignTitle: string | null;
  createdAt: string;
}

interface NextAction {
  type: string;
  label: string;
  href: string;
  priority: number;
}

interface PointsEvent {
  id: number;
  deltaPoints: number;
  eventType: string;
  notes: string | null;
  createdAt: string;
}

interface BrandOverview {
  brand: {
    id: number;
    name: string;
    logo: string | null;
    description: string | null;
    website: string | null;
    instagram: string | null;
  };
  membership: {
    id: number;
    status: string;
    tier: TierInfo | null;
    nextTier: TierInfo | null;
    points: number;
    couponCode: string | null;
    joinedAt: string | null;
    tags: string[];
  } | null;
  campaigns: {
    available: AvailableCampaign[];
    open: CampaignSummary[];
    active: CampaignSummary[];
    completed: CampaignSummary[];
  };
  pendingInvites: PendingInvite[];
  nextActions: NextAction[];
  performance: {
    totalSales: number;
    totalCommission: number;
    totalViews: number;
    totalPosts: number;
  };
  recentPointsEvents: PointsEvent[];
  unreadMessagesCount: number;
}

export default function BrandHub() {
  const [_, navigate] = useLocation();
  const [match, params] = useRoute('/brand/:brandId');
  const searchString = useSearch();
  const { user } = useMarketplace();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  const brandId = params?.brandId ? parseInt(params.brandId) : null;

  useEffect(() => {
    const urlParams = new URLSearchParams(searchString);
    const tab = urlParams.get('tab');
    if (tab && ['overview', 'campaigns', 'ranking', 'inspirations', 'messages'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchString]);

  const { data: overview, isLoading, isError, refetch } = useQuery<BrandOverview>({
    queryKey: [`/api/creator/brand/${brandId}/overview`],
    enabled: !!user && user.role === 'creator' && !!brandId,
    retry: 2,
    staleTime: 30000,
  });

  const acceptMutation = useMutation({
    mutationFn: async ({ id, type }: { id: number; type: string }) => {
      return apiRequest("POST", `/api/creator/invitations/${id}/accept`, { type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/creator/brand/${brandId}/overview`] });
      queryClient.invalidateQueries({ queryKey: ['/api/creator/brands'] });
      toast({ title: "Convite aceito!", description: "Você agora faz parte da comunidade." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async ({ id, type }: { id: number; type: string }) => {
      return apiRequest("POST", `/api/creator/invitations/${id}/decline`, { type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/creator/brand/${brandId}/overview`] });
      toast({ title: "Convite recusado" });
      navigate('/brands');
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const handleCopyCoupon = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCoupon(true);
      toast({ title: "Cupom copiado!" });
      setTimeout(() => setCopiedCoupon(false), 2000);
    } catch (e) {
      toast({ title: "Erro ao copiar", variant: "destructive" });
    }
  };

  if (!match || !brandId) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-xl font-semibold mb-2">Marca não encontrada</h2>
        <p className="text-muted-foreground mb-4">Esta marca não existe ou você não tem acesso.</p>
        <Button onClick={() => navigate('/brands')} data-testid="button-back-brands">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Marcas
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-state">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (isError || !overview) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="error-state">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar dados</h3>
            <p className="text-muted-foreground max-w-sm text-center mb-6">
              Não foi possível carregar os dados da marca. Tente novamente.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/brands')} data-testid="button-back">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button onClick={() => refetch()} data-testid="button-retry">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { brand, membership, campaigns, pendingInvites, nextActions, performance, recentPointsEvents, unreadMessagesCount } = overview;

  const hasPendingCommunityInvite = pendingInvites.some(inv => inv.type === 'community');
  const communityInvite = pendingInvites.find(inv => inv.type === 'community');

  if (hasPendingCommunityInvite && communityInvite) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500" data-testid="invited-state">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/brands" className="hover:text-foreground transition-colors">
            Marcas
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{brand.name}</span>
        </div>

        <BrandHeader brand={brand} membership={null} />

        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Bell className="h-5 w-5" />
              Convite Pendente
            </CardTitle>
            <CardDescription>
              Você foi convidado para fazer parte da comunidade de criadores desta marca.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {brand.description && (
              <p className="text-muted-foreground">{brand.description}</p>
            )}
            <div className="flex gap-3">
              <Button
                onClick={() => acceptMutation.mutate({ id: communityInvite.id, type: 'community' })}
                disabled={acceptMutation.isPending || declineMutation.isPending}
                data-testid="button-accept-invite"
              >
                {acceptMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Aceitar Convite
              </Button>
              <Button
                variant="outline"
                onClick={() => declineMutation.mutate({ id: communityInvite.id, type: 'community' })}
                disabled={acceptMutation.isPending || declineMutation.isPending}
                data-testid="button-decline-invite"
              >
                {declineMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                Recusar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!membership || membership.status !== 'active') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500" data-testid="non-member-state">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/brands" className="hover:text-foreground transition-colors">
            Marcas
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{brand.name}</span>
        </div>

        <BrandHeader brand={brand} membership={null} />

        <Card>
          <CardHeader>
            <CardTitle>Sobre a Marca</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {brand.description && (
              <p className="text-muted-foreground">{brand.description}</p>
            )}
            <div className="flex flex-wrap gap-3">
              {brand.instagram && (
                <a
                  href={`https://instagram.com/${brand.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                  data-testid="link-instagram"
                >
                  <Instagram className="h-4 w-4" />
                  {brand.instagram}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {brand.website && (
                <a
                  href={brand.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                  data-testid="link-website"
                >
                  <Globe className="h-4 w-4" />
                  Website
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        {campaigns.available.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Campanhas Públicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {campaigns.available.slice(0, 5).map((camp) => (
                  <div
                    key={camp.campaignId}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    data-testid={`public-campaign-${camp.campaignId}`}
                  >
                    <div>
                      <p className="font-medium">{camp.campaignTitle}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {camp.budget && <span>{camp.budget}</span>}
                        {camp.deadline && (
                          <span>Até {format(new Date(camp.deadline), "d MMM", { locale: ptBR })}</span>
                        )}
                      </div>
                    </div>
                    <Link href={`/campaign/${camp.campaignId}`}>
                      <Button size="sm" data-testid={`button-view-campaign-${camp.campaignId}`}>
                        Ver campanha
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center">
          <Link href="/explore">
            <Button size="lg" data-testid="button-explore-campaigns">
              <Sparkles className="h-4 w-4 mr-2" />
              Explorar campanhas
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalActiveCampaigns = campaigns.active.length;
  const totalCampaigns = campaigns.open.length + campaigns.active.length + campaigns.completed.length;

  const tierProgress = membership.tier && membership.nextTier
    ? Math.min(100, Math.round((membership.points / membership.nextTier.minPoints) * 100))
    : membership.tier ? 100 : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="active-member-state">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/brands" className="hover:text-foreground transition-colors">
          Marcas
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{brand.name}</span>
      </div>

      <BrandHeader brand={brand} membership={membership} />

      {nextActions.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" />
              Próximas Ações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {nextActions.map((action, idx) => (
                <Link key={idx} href={action.href}>
                  <div 
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors cursor-pointer"
                    data-testid={`next-action-${idx}`}
                  >
                    <span className="text-sm">{action.label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-1" data-testid="tab-overview">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-1" data-testid="tab-campaigns">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Campanhas</span>
            {totalActiveCampaigns > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {totalActiveCampaigns}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ranking" className="flex items-center gap-1" data-testid="tab-ranking">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Ranking</span>
          </TabsTrigger>
          <TabsTrigger value="inspirations" className="flex items-center gap-1" data-testid="tab-inspirations">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Inspirações</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-1 relative" data-testid="tab-messages">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Mensagens</span>
            {unreadMessagesCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                {unreadMessagesCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="stat-active-campaigns">{totalActiveCampaigns}</p>
                    <p className="text-xs text-muted-foreground">Campanhas Ativas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Coins className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="stat-points">{membership?.points.toLocaleString('pt-BR') || 0}</p>
                    <p className="text-xs text-muted-foreground">Pontos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="stat-sales">{performance.totalSales}</p>
                    <p className="text-xs text-muted-foreground">Vendas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="stat-completed">{campaigns.completed.length}</p>
                    <p className="text-xs text-muted-foreground">Concluídas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {membership?.tier && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Seu Tier
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-3 rounded-full text-white"
                      style={{ backgroundColor: membership.tier.color || '#6366f1' }}
                    >
                      <span className="text-lg">{membership.tier.icon || '⭐'}</span>
                    </div>
                    <div>
                      <p className="font-bold text-lg" data-testid="tier-name">{membership.tier.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {membership.points.toLocaleString('pt-BR')} pontos
                      </p>
                    </div>
                  </div>

                  {membership.nextTier && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progresso para {membership.nextTier.name}</span>
                        <span className="font-medium">{tierProgress}%</span>
                      </div>
                      <Progress value={tierProgress} className="h-2" data-testid="tier-progress" />
                      <p className="text-xs text-muted-foreground text-right">
                        Faltam {(membership.nextTier.minPoints - membership.points).toLocaleString('pt-BR')} pontos
                      </p>
                    </div>
                  )}

                  {membership.tier.benefits && Object.keys(membership.tier.benefits).length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <p className="text-sm font-medium">Benefícios</p>
                      <div className="space-y-1">
                        {membership.tier.benefits.priorityCampaigns && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            Acesso prioritário a campanhas
                          </div>
                        )}
                        {membership.tier.benefits.fasterPayout && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            Pagamento mais rápido
                          </div>
                        )}
                        {membership.tier.benefits.exclusiveContent && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            Conteúdo exclusivo
                          </div>
                        )}
                        {membership.tier.benefits.customBenefits?.map((benefit, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            {benefit}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {membership?.couponCode && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Gift className="h-4 w-4" />
                    Seu Cupom
                  </CardTitle>
                  <CardDescription>Use este código para rastrear suas vendas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between gap-3 p-4 bg-primary/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Ticket className="h-6 w-6 text-primary" />
                      <span className="text-xl font-mono font-bold" data-testid="coupon-code">
                        {membership.couponCode}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyCoupon(membership.couponCode!)}
                      data-testid="button-copy-coupon"
                    >
                      {copiedCoupon ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {recentPointsEvents.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  Histórico de Pontos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentPointsEvents.slice(0, 5).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                      data-testid={`points-event-${event.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getEventTypeLabel(event.eventType)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(event.createdAt), "d MMM", { locale: ptBR })}
                        </span>
                      </div>
                      <span className={`font-medium ${event.deltaPoints >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {event.deltaPoints >= 0 ? '+' : ''}{event.deltaPoints.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {campaigns.active.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Campanhas Ativas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {campaigns.active.map((camp) => (
                    <CampaignRow key={camp.campaignId} campaign={camp} brandId={brandId} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {membership?.joinedAt && (
            <div className="text-sm text-muted-foreground text-center">
              Membro desde {format(new Date(membership.joinedAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6 mt-6">
          {pendingInvites.length > 0 && (
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4 text-amber-500" />
                  Convites Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pendingInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                      data-testid={`campaign-invite-${invite.id}`}
                    >
                      <div>
                        <p className="font-medium">{invite.campaignTitle || 'Convite para comunidade'}</p>
                        <p className="text-xs text-muted-foreground">
                          Recebido em {format(new Date(invite.createdAt), "d MMM", { locale: ptBR })}
                        </p>
                      </div>
                      <Link href="/creator/invites">
                        <Button size="sm" data-testid={`button-view-invite-${invite.id}`}>Ver convite</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {campaigns.available && campaigns.available.length > 0 && (
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Disponíveis ({campaigns.available.length})
                </CardTitle>
                <CardDescription>Campanhas abertas que você pode se candidatar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {campaigns.available.map((camp) => (
                    <div
                      key={camp.campaignId}
                      className={`flex items-center justify-between p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors ${!camp.eligible ? 'opacity-60' : ''}`}
                      data-testid={`available-campaign-${camp.campaignId}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${camp.eligible ? 'bg-primary/10' : 'bg-muted'}`}>
                          <Package className={`h-4 w-4 ${camp.eligible ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{camp.campaignTitle}</p>
                            {camp.isInternal && (
                              <Badge variant="secondary" className="text-xs">
                                <Users className="h-3 w-3 mr-1" />
                                Interno
                              </Badge>
                            )}
                            {!camp.eligible && camp.eligibilityReason && (
                              <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {camp.eligibilityReason}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {camp.budget && <span>{camp.budget}</span>}
                            {camp.deadline && (
                              <span>Até {format(new Date(camp.deadline), "d MMM", { locale: ptBR })}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Link href={`/campaign/${camp.campaignId}`}>
                        <Button 
                          size="sm" 
                          variant={camp.eligible ? "outline" : "ghost"} 
                          data-testid={`button-apply-${camp.campaignId}`}
                        >
                          <ArrowRight className="h-4 w-4 mr-1" />
                          {camp.eligible ? "Ver" : "Detalhes"}
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {campaigns.active.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Ativas ({campaigns.active.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {campaigns.active.map((camp) => (
                    <CampaignRow key={camp.campaignId} campaign={camp} brandId={brandId} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {campaigns.open.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Candidaturas Pendentes ({campaigns.open.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {campaigns.open.map((camp) => (
                    <CampaignRow key={camp.campaignId} campaign={camp} brandId={brandId} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {campaigns.completed.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Concluídas ({campaigns.completed.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {campaigns.completed.map((camp) => (
                    <CampaignRow key={camp.campaignId} campaign={camp} brandId={brandId} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {totalCampaigns === 0 && campaigns.available.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold mb-2">Nenhuma campanha</h3>
                <p className="text-muted-foreground text-sm text-center max-w-sm">
                  Você ainda não participou de nenhuma campanha com esta marca.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ranking" className="mt-6">
          <RankingSection brandId={brandId} />
        </TabsContent>

        <TabsContent value="inspirations" className="mt-6">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Lightbulb className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-2">Inspirações</h3>
              <p className="text-muted-foreground text-sm text-center max-w-sm">
                Referências e inspirações de conteúdo da marca estarão disponíveis aqui em breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="mt-6">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-2">Mensagens</h3>
              <p className="text-muted-foreground text-sm text-center max-w-sm mb-4">
                Converse diretamente com a equipe da marca.
              </p>
              <Link href="/messages">
                <Button data-testid="button-go-messages">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Ir para Mensagens
                  {unreadMessagesCount > 0 && (
                    <Badge variant="destructive" className="ml-2">{unreadMessagesCount}</Badge>
                  )}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BrandHeader({ brand, membership }: { brand: BrandOverview['brand']; membership: BrandOverview['membership'] }) {
  return (
    <Card className="overflow-hidden">
      <div className="h-24 bg-gradient-to-r from-primary/20 to-primary/5" />
      <CardContent className="relative pt-0">
        <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-10">
          <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
            {brand.logo ? (
              <AvatarImage src={brand.logo} alt={brand.name} />
            ) : null}
            <AvatarFallback className="text-2xl">
              <Building2 className="h-10 w-10" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold" data-testid="text-brand-name">{brand.name}</h1>
              {membership?.tier && (
                <Badge
                  style={{ backgroundColor: membership.tier.color || '#6366f1' }}
                  className="text-white"
                  data-testid="badge-tier"
                >
                  {membership.tier.icon} {membership.tier.name}
                </Badge>
              )}
              {membership?.status === 'active' && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Membro
                </Badge>
              )}
            </div>
            {brand.description && (
              <p className="text-muted-foreground mt-1 line-clamp-2">{brand.description}</p>
            )}
            <div className="flex flex-wrap gap-3 mt-2">
              {brand.instagram && (
                <a
                  href={`https://instagram.com/${brand.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <Instagram className="h-4 w-4" />
                  {brand.instagram}
                </a>
              )}
              {brand.website && (
                <a
                  href={brand.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <Globe className="h-4 w-4" />
                  Website
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
          {membership?.couponCode && (
            <div className="flex items-center gap-1 text-sm bg-primary/10 text-primary rounded-lg px-3 py-2">
              <Ticket className="h-4 w-4" />
              <span className="font-mono font-medium">{membership.couponCode}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CampaignRow({ campaign, brandId }: { campaign: CampaignSummary; brandId: number }) {
  const getStatusBadge = (workflowStatus: string, status: string) => {
    if (status === 'pending') {
      return <Badge variant="outline">Aguardando</Badge>;
    }
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      aceito: { label: 'Aceito', variant: 'default' },
      contrato: { label: 'Contrato', variant: 'secondary' },
      aguardando_produto: { label: 'Aguardando Produto', variant: 'secondary' },
      producao: { label: 'Produção', variant: 'default' },
      revisao: { label: 'Revisão', variant: 'secondary' },
      entregue: { label: 'Entregue', variant: 'outline' },
      completed: { label: 'Concluído', variant: 'outline' },
    };
    const config = statusMap[workflowStatus] || { label: workflowStatus, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Link href={`/brand/${brandId}/campaign/${campaign.campaignId}`} data-testid={`campaign-row-${campaign.campaignId}`}>
      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{campaign.campaignTitle}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            {campaign.budget && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                R$ {campaign.budget.toLocaleString('pt-BR')}
              </span>
            )}
            {campaign.deadline && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(campaign.deadline), "d MMM", { locale: ptBR })}
              </span>
            )}
          </div>
        </div>
        {getStatusBadge(campaign.workflowStatus, campaign.status)}
        <ChevronRight className="h-4 w-4 text-muted-foreground ml-2" />
      </div>
    </Link>
  );
}

function getEventTypeLabel(eventType: string): string {
  const labels: Record<string, string> = {
    post_created: 'Post',
    reel_created: 'Reels',
    story_created: 'Stories',
    sale_confirmed: 'Venda',
    delivery_approved: 'Entrega',
    ontime_bonus: 'Bônus Prazo',
    views_milestone: 'Views',
    like_milestone: 'Curtidas',
    comment_milestone: 'Comentários',
    course_completed: 'Curso',
    deliverable_approved: 'Entrega',
  };
  return labels[eventType] || eventType;
}

interface PointsSummary {
  totalPoints: number;
  pointsByEventType: Record<string, number>;
  rank: number;
  recentEntries: {
    id: number;
    deltaPoints: number;
    eventType: string;
    createdAt: string;
    notes: string | null;
  }[];
}

interface LeaderboardEntry {
  rank: number;
  points: number;
  creator: {
    id: number;
    name: string;
    avatar: string | null;
  } | null;
  isCurrentUser: boolean;
}

function RankingSection({ brandId }: { brandId: number }) {
  const [leaderboardRange, setLeaderboardRange] = useState<'week' | 'month' | 'all'>('month');
  
  const { data: pointsSummary, isLoading } = useQuery<PointsSummary>({
    queryKey: [`/api/creator/brand/${brandId}/points-summary`],
    retry: 1,
  });

  const { data: leaderboard = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: [`/api/creator/brand/${brandId}/leaderboard`, leaderboardRange],
    queryFn: async () => {
      const res = await fetch(`/api/creator/brand/${brandId}/leaderboard?range=${leaderboardRange}&limit=20`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    retry: 1,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!pointsSummary || pointsSummary.totalPoints === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Trophy className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold mb-2">Ranking da Marca</h3>
          <p className="text-muted-foreground text-sm text-center max-w-sm">
            Participe de campanhas e acumule pontos para aparecer no ranking.
          </p>
        </CardContent>
      </Card>
    );
  }

  const sortedEventTypes = Object.entries(pointsSummary.pointsByEventType)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sua Posição</p>
                <p className="text-2xl font-bold" data-testid="rank-position">
                  #{pointsSummary.rank || '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Coins className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Pontos</p>
                <p className="text-2xl font-bold" data-testid="total-points">
                  {pointsSummary.totalPoints.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Leaderboard
            </CardTitle>
            <div className="flex gap-1">
              {(['week', 'month', 'all'] as const).map((range) => (
                <Button
                  key={range}
                  variant={leaderboardRange === range ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setLeaderboardRange(range)}
                  data-testid={`btn-range-${range}`}
                >
                  {range === 'week' ? 'Semana' : range === 'month' ? 'Mês' : 'Total'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <p className="text-center text-muted-foreground py-4 text-sm">
              Nenhum dado no período selecionado.
            </p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div 
                  key={entry.rank} 
                  className={`flex items-center gap-3 p-2 rounded-lg ${entry.isCurrentUser ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'}`}
                  data-testid={`leaderboard-row-${entry.rank}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    entry.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                    entry.rank === 2 ? 'bg-gray-100 text-gray-700' :
                    entry.rank === 3 ? 'bg-amber-100 text-amber-700' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                  </div>
                  <Avatar className="h-8 w-8">
                    {entry.creator?.avatar && <AvatarImage src={entry.creator.avatar} />}
                    <AvatarFallback className="text-xs">
                      {entry.creator?.name?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${entry.isCurrentUser ? 'text-primary' : ''}`}>
                      {entry.creator?.name || 'Anônimo'}
                      {entry.isCurrentUser && <span className="text-xs ml-1">(você)</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{entry.points.toLocaleString('pt-BR')}</p>
                    <p className="text-xs text-muted-foreground">pts</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {sortedEventTypes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pontos por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedEventTypes.map(([eventType, points]) => (
                <div key={eventType} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {getEventTypeLabel(eventType)}
                  </span>
                  <span className="font-medium" data-testid={`points-${eventType}`}>
                    +{points.toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {pointsSummary.recentEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pointsSummary.recentEntries.slice(0, 10).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {getEventTypeLabel(entry.eventType)}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {format(new Date(entry.createdAt), "d MMM", { locale: ptBR })}
                    </span>
                  </div>
                  <span className={`font-medium ${entry.deltaPoints >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.deltaPoints >= 0 ? '+' : ''}{entry.deltaPoints.toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
