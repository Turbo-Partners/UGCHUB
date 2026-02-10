import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { 
  Loader2, 
  Bell, 
  Rocket, 
  Users, 
  Wallet, 
  ArrowRight, 
  Check, 
  X, 
  Mail,
  Crown,
  Ticket,
  ChevronRight,
  Instagram,
  TrendingUp,
  TrendingDown,
  Heart,
  MessageCircle,
  Eye,
  Play,
  Search,
  Upload,
  Sparkles,
  ExternalLink,
  Plus,
  Zap,
  BarChart3,
  Target,
  Package,
  Star,
  GraduationCap
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMarketplace } from "@/lib/provider";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OverviewData {
  invitations: {
    items: Array<{
      id: number;
      type: "community" | "campaign";
      brandName: string;
      brandLogo: string | null;
      campaignTitle: string | null;
      createdAt: string;
    }>;
    pendingCount: number;
  };
  activeCampaigns: Array<{
    applicationId: number;
    campaignId: number;
    campaignTitle: string;
    brandName: string;
    workflowStatus: string;
    creatorWorkflowStatus: string;
    seedingStatus: string;
    nextAction: string;
  }>;
  activeCommunities: Array<{
    brandId: number;
    brandName: string;
    brandLogo: string | null;
    tierName: string;
    tierColor: string;
    points: number;
    couponCode: string | null;
  }>;
  walletSummary: {
    available: number;
    pending: number;
  };
  unreadMessagesCount: number;
  nextActions: Array<{
    type: string;
    label: string;
    href: string;
    priority: number;
  }>;
}

interface DeepAnalysisData {
  creator: {
    id: number;
    name: string;
    avatar: string | null;
    instagram: string | null;
    tiktok: string | null;
    instagramFollowers: number | null;
    instagramEngagementRate: string | null;
  };
  instagram: {
    profile: {
      followers: number | null;
      following: number | null;
      postsCount: number | null;
      engagementRate: string | null;
      verified: boolean | null;
      authenticityScore: number | null;
    };
    recentPosts: CreatorPost[];
    stats: {
      totalLikes: number;
      totalComments: number;
      avgEngagement: string;
      postsAnalyzed: number;
    };
    lastUpdated: string | null;
  };
  tiktok: {
    profile: {
      followers: number | null;
      following: number | null;
      likes: number | null;
      videos: number | null;
      engagementRate: string | null;
      verified: boolean | null;
    } | null;
    recentPosts: CreatorPost[];
    stats: {
      totalLikes: number;
      totalComments: number;
      totalViews: number;
      avgEngagement: string;
      postsAnalyzed: number;
    };
    lastUpdated: string | null;
  };
  analyticsHistory: AnalyticsHistoryEntry[];
}

interface CreatorPost {
  id: number;
  platform: 'instagram' | 'tiktok';
  postId: string;
  postUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  likes: number | null;
  comments: number | null;
  views: number | null;
  shares: number | null;
  engagementRate: string | null;
  hashtags: string[] | null;
  mentions: string[] | null;
  postedAt: string | null;
  postType: string | null;
}

interface AnalyticsHistoryEntry {
  platform: string;
  followers: number;
  engagementRate: string;
  recordedAt: string;
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
    </svg>
  );
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function formatNumber(num: number | null | undefined): string {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString('pt-BR');
}

function GrowthBadge({ value, suffix = '' }: { value: number; suffix?: string }) {
  if (value === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const isPositive = value > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
  const bgClass = isPositive ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30';
  
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${colorClass} ${bgClass}`}>
      <Icon className="h-3 w-3" />
      {isPositive ? '+' : ''}{value.toFixed(1)}{suffix}
    </span>
  );
}

export default function CreatorHomePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useMarketplace();
  
  const { data, isLoading } = useQuery<OverviewData>({
    queryKey: ["/api/creator/overview"],
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery<DeepAnalysisData>({
    queryKey: [`/api/creators/${user?.id}/deep-analysis`],
    enabled: !!user?.id,
  });

  const { data: academySummary } = useQuery<{
    inProgress: { courseId: number; courseTitle: string; progressPercentage: number; currentLessonTitle: string } | null;
    totalCourses: number;
    completedCourses: number;
  }>({
    queryKey: ["/api/creator/academy/summary"],
  });

  const acceptMutation = useMutation({
    mutationFn: async ({ id, type }: { id: number; type: string }) => {
      return apiRequest("POST", `/api/creator/invitations/${id}/accept`, { type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/creator/communities"] });
      toast({ title: "Convite aceito!" });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async ({ id, type }: { id: number; type: string }) => {
      return apiRequest("POST", `/api/creator/invitations/${id}/decline`, { type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/overview"] });
      toast({ title: "Convite recusado" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { invitations, activeCampaigns, activeCommunities, walletSummary, nextActions } = data;

  const igProfile = analyticsData?.instagram?.profile;
  const ttProfile = analyticsData?.tiktok?.profile;
  const hasConnectedNetworks = igProfile?.followers || ttProfile?.followers;
  const topPosts = [...(analyticsData?.instagram?.recentPosts || []), ...(analyticsData?.tiktok?.recentPosts || [])]
    .sort((a, b) => ((b.likes || 0) + (b.comments || 0)) - ((a.likes || 0) + (a.comments || 0)))
    .slice(0, 4);

  const calculateGrowth = (platform: 'instagram' | 'tiktok', days: number) => {
    if (!analyticsData?.analyticsHistory?.length) return 0;
    const history = analyticsData.analyticsHistory
      .filter(h => h.platform === platform)
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
    
    if (history.length < 2) return 0;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentHistory = history.filter(h => new Date(h.recordedAt) >= cutoffDate);
    if (recentHistory.length < 2) {
      const latest = history[history.length - 1];
      const oldest = history[0];
      return oldest.followers > 0 ? ((latest.followers - oldest.followers) / oldest.followers) * 100 : 0;
    }
    
    const oldest = recentHistory[0];
    const latest = recentHistory[recentHistory.length - 1];
    return oldest.followers > 0 ? ((latest.followers - oldest.followers) / oldest.followers) * 100 : 0;
  };

  const igGrowth7d = calculateGrowth('instagram', 7);
  const igGrowth30d = calculateGrowth('instagram', 30);
  const ttGrowth7d = calculateGrowth('tiktok', 7);
  const ttGrowth30d = calculateGrowth('tiktok', 30);

  return (
    <div className="container mx-auto py-6 space-y-8" data-testid="creator-home-page">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Início</h1>
        <p className="text-muted-foreground">
          Bem-vindo de volta{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! Veja o que está acontecendo.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/explore">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full" data-testid="quick-action-discover">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
              <div className="p-2 rounded-full bg-primary/10">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium">Explorar</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/hub">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full" data-testid="quick-action-hub">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
              <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-950/30">
                <Rocket className="h-5 w-5 text-orange-500" />
              </div>
              <span className="text-sm font-medium">Minhas Parcerias</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/hub?tab=brands">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full" data-testid="quick-action-brands">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-950/30">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <span className="text-sm font-medium">Minhas Marcas</span>
            </CardContent>
          </Card>
        </Link>
        {activeCampaigns.length > 0 ? (
          <Link href={`/campaign/${activeCampaigns[0].campaignId}/workspace`}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full" data-testid="quick-action-upload">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-950/30">
                  <Upload className="h-5 w-5 text-green-500" />
                </div>
                <span className="text-sm font-medium">Subir Entregável</span>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Link href="/explore">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full" data-testid="quick-action-find">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-950/30">
                  <Target className="h-5 w-5 text-green-500" />
                </div>
                <span className="text-sm font-medium">Buscar Campanha</span>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link href="/hub?tab=campaigns">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full" data-testid="card-active-campaigns">
            <CardContent className="p-4">
              <div className="flex flex-col">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-950/30 w-fit mb-2">
                  <Rocket className="h-5 w-5 text-orange-500" />
                </div>
                <p className="text-2xl font-bold">{activeCampaigns.length}</p>
                <p className="text-xs text-muted-foreground">Campanhas ativas</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/hub?tab=invites">
          <Card className={`hover:shadow-md transition-shadow cursor-pointer h-full ${invitations.pendingCount > 0 ? 'border-amber-300 dark:border-amber-700' : ''}`} data-testid="card-pending-invites">
            <CardContent className="p-4">
              <div className="flex flex-col">
                <div className={`p-2 rounded-lg w-fit mb-2 ${invitations.pendingCount > 0 ? 'bg-amber-100 dark:bg-amber-950/30' : 'bg-muted'}`}>
                  <Mail className={`h-5 w-5 ${invitations.pendingCount > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
                </div>
                <p className="text-2xl font-bold">{invitations.pendingCount}</p>
                <p className="text-xs text-muted-foreground">Convites pendentes</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/wallet">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full" data-testid="card-wallet">
            <CardContent className="p-4">
              <div className="flex flex-col">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950/30 w-fit mb-2">
                  <Wallet className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(walletSummary.available)}</p>
                <p className="text-xs text-muted-foreground">
                  {walletSummary.pending > 0 ? `+ ${formatCurrency(walletSummary.pending)} pendente` : 'Saldo disponível'}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/hub?tab=deliverables">
          <Card className={`hover:shadow-md transition-shadow cursor-pointer h-full ${activeCampaigns.some((c: any) => c.workflowStatus === 'producao') ? 'border-indigo-300 dark:border-indigo-700' : ''}`} data-testid="card-next-delivery">
            <CardContent className="p-4">
              <div className="flex flex-col">
                <div className={`p-2 rounded-lg w-fit mb-2 ${activeCampaigns.some((c: any) => c.workflowStatus === 'producao') ? 'bg-indigo-100 dark:bg-indigo-950/30' : 'bg-muted'}`}>
                  <Package className={`h-5 w-5 ${activeCampaigns.some((c: any) => c.workflowStatus === 'producao') ? 'text-indigo-500' : 'text-muted-foreground'}`} />
                </div>
                <p className="text-2xl font-bold">{activeCampaigns.filter((c: any) => c.workflowStatus === 'producao' || c.workflowStatus === 'revisao').length}</p>
                <p className="text-xs text-muted-foreground">Entregas pendentes</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/academy">
          <Card className={`hover:shadow-md transition-shadow cursor-pointer h-full ${academySummary?.inProgress ? 'border-violet-300 dark:border-violet-700' : ''}`} data-testid="card-academy">
            <CardContent className="p-4">
              <div className="flex flex-col">
                <div className={`p-2 rounded-lg w-fit mb-2 ${academySummary?.inProgress ? 'bg-violet-100 dark:bg-violet-950/30' : 'bg-muted'}`}>
                  <GraduationCap className={`h-5 w-5 ${academySummary?.inProgress ? 'text-violet-500' : 'text-muted-foreground'}`} />
                </div>
                {academySummary?.inProgress ? (
                  <>
                    <p className="text-sm font-medium line-clamp-1">{academySummary.inProgress.courseTitle}</p>
                    <p className="text-xs text-muted-foreground">{academySummary.inProgress.progressPercentage}% concluído</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold">{academySummary?.completedCourses || 0}</p>
                    <p className="text-xs text-muted-foreground">Cursos concluídos</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Next Actions */}
      {nextActions.length > 0 && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Próximas Ações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {nextActions.slice(0, 3).map((action, idx) => (
                <Link 
                  key={idx} 
                  href={action.href}
                  className="flex items-center justify-between p-3 rounded-lg bg-background hover:bg-muted transition-colors border"
                  data-testid={`action-item-${idx}`}
                >
                  <span className="font-medium">{action.label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Networks Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Minhas Redes
              </CardTitle>
              <CardDescription>Acompanhe o crescimento das suas redes sociais</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/creator/analytics" data-testid="link-analytics">
                Ver análise completa <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {hasConnectedNetworks ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Instagram Card */}
                {igProfile?.followers && (
                  <div className="p-4 rounded-lg border bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Instagram className="h-5 w-5 text-pink-500" />
                        <span className="font-semibold">Instagram</span>
                      </div>
                      <a 
                        href={`https://instagram.com/${analyticsData?.creator?.instagram}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-2xl font-bold">{formatNumber(igProfile.followers)}</p>
                        <p className="text-xs text-muted-foreground">Seguidores</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{igProfile.engagementRate || '0'}%</p>
                        <p className="text-xs text-muted-foreground">Engajamento</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">7 dias:</span>
                        <GrowthBadge value={igGrowth7d} suffix="%" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">30 dias:</span>
                        <GrowthBadge value={igGrowth30d} suffix="%" />
                      </div>
                    </div>
                  </div>
                )}

                {/* TikTok Card */}
                {ttProfile?.followers && (
                  <div className="p-4 rounded-lg border bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950/20 dark:to-slate-900/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <TikTokIcon className="h-5 w-5" />
                        <span className="font-semibold">TikTok</span>
                      </div>
                      <a 
                        href={`https://tiktok.com/@${analyticsData?.creator?.tiktok}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-2xl font-bold">{formatNumber(ttProfile.followers)}</p>
                        <p className="text-xs text-muted-foreground">Seguidores</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{ttProfile.engagementRate || '0'}%</p>
                        <p className="text-xs text-muted-foreground">Engajamento</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">7 dias:</span>
                        <GrowthBadge value={ttGrowth7d} suffix="%" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">30 dias:</span>
                        <GrowthBadge value={ttGrowth30d} suffix="%" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Top Posts Preview */}
              {topPosts.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm">Melhores Posts</h4>
                    <Link href="/creator/analytics" className="text-xs text-primary hover:underline">
                      Ver todos
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {topPosts.map((post) => (
                      <a 
                        key={post.id}
                        href={post.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative aspect-square rounded-lg overflow-hidden bg-muted"
                        data-testid={`top-post-${post.id}`}
                      >
                        {post.thumbnailUrl ? (
                          <img 
                            src={post.thumbnailUrl} 
                            alt="" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {post.postType === 'video' || post.postType === 'reel' ? (
                              <Play className="h-8 w-8 text-muted-foreground" />
                            ) : (
                              <Package className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-xs">
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {formatNumber(post.likes)}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" />
                                {formatNumber(post.comments)}
                              </span>
                            </div>
                            {post.platform === 'instagram' ? (
                              <Instagram className="h-4 w-4" />
                            ) : (
                              <TikTokIcon className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Conecte suas redes</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                Adicione seu Instagram ou TikTok para acompanhar o crescimento e analisar seus posts.
              </p>
              <Button asChild>
                <Link href="/settings" data-testid="button-connect-network">
                  <Plus className="h-4 w-4 mr-2" />
                  Conectar rede
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Highlights Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Destaques
              </CardTitle>
              <CardDescription>Seus melhores conteúdos por performance</CardDescription>
            </div>
            {topPosts.length > 0 && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/creator/analytics" data-testid="link-all-highlights">
                  Ver análise completa <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {topPosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {topPosts.slice(0, 4).map((post, idx) => (
                <a 
                  key={post.id}
                  href={post.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  data-testid={`highlight-post-${post.id}`}
                >
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {post.thumbnailUrl ? (
                      <img 
                        src={post.thumbnailUrl} 
                        alt="" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {post.postType === 'video' || post.postType === 'reel' ? (
                          <Play className="h-6 w-6 text-muted-foreground" />
                        ) : (
                          <Package className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                    )}
                    <div className="absolute top-1 right-1">
                      {post.platform === 'instagram' ? (
                        <div className="bg-gradient-to-br from-pink-500 to-purple-500 rounded-full p-1">
                          <Instagram className="h-3 w-3 text-white" />
                        </div>
                      ) : (
                        <div className="bg-black rounded-full p-1">
                          <TikTokIcon className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    {idx === 0 && (
                      <div className="absolute top-1 left-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        TOP
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2 mb-2">
                      {post.caption?.slice(0, 60) || 'Sem legenda'}
                      {post.caption && post.caption.length > 60 && '...'}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3 text-red-500" />
                        {formatNumber(post.likes)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3 text-blue-500" />
                        {formatNumber(post.comments)}
                      </span>
                      {post.views && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3 text-gray-500" />
                          {formatNumber(post.views)}
                        </span>
                      )}
                    </div>
                    {post.engagementRate && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {post.engagementRate}% engajamento
                      </Badge>
                    )}
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Sem destaques ainda</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                Conecte suas redes sociais para ver seus melhores conteúdos aqui.
              </p>
              <Button variant="outline" asChild>
                <Link href="/settings" data-testid="button-connect-tracking">
                  <Plus className="h-4 w-4 mr-2" />
                  Conectar tracking
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invites (if any) */}
      {invitations.pendingCount > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-500" />
                Convites Pendentes
                <Badge variant="secondary">{invitations.pendingCount}</Badge>
              </CardTitle>
              {invitations.pendingCount > 3 && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/hub?tab=invites" data-testid="link-all-invites">
                    Ver todos <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.items.slice(0, 3).map((invite) => (
                <div 
                  key={`${invite.type}-${invite.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border"
                  data-testid={`invite-${invite.type}-${invite.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={invite.brandLogo || undefined} />
                      <AvatarFallback>{invite.brandName?.charAt(0) || "?"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{invite.brandName}</p>
                      <p className="text-sm text-muted-foreground">
                        {invite.type === "campaign" ? invite.campaignTitle : "Convite para comunidade"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => declineMutation.mutate({ id: invite.id, type: invite.type })}
                      disabled={declineMutation.isPending}
                      data-testid={`button-decline-${invite.id}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => acceptMutation.mutate({ id: invite.id, type: invite.type })}
                      disabled={acceptMutation.isPending}
                      data-testid={`button-accept-${invite.id}`}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Aceitar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Communities Preview */}
      {activeCommunities.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                Minhas Marcas
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/hub?tab=brands" data-testid="link-all-communities">
                  Ver todas <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeCommunities.slice(0, 6).map((community) => (
                <Link 
                  key={community.brandId}
                  href={`/brand/${community.brandId}`}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  data-testid={`community-${community.brandId}`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={community.brandLogo || undefined} />
                    <AvatarFallback>{community.brandName?.charAt(0) || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{community.brandName}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge 
                        style={{ backgroundColor: community.tierColor }}
                        className="text-white text-xs"
                      >
                        <Crown className="h-3 w-3 mr-1" />
                        {community.tierName}
                      </Badge>
                      <span className="text-muted-foreground">{community.points} pts</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
