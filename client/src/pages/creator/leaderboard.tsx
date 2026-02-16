import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Medal, 
  Award, 
  TrendingUp, 
  Star, 
  Crown, 
  Zap,
  Calendar,
  Users,
  Target,
  Lock,
  ChevronRight,
  Eye,
  ShoppingBag,
  MessageCircle,
  Image,
  Video,
  Clock,
  Flame,
  Gift,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  HelpCircle,
  X,
  Package
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { 
  MonthlyLeaderboard, 
  CreatorLevel, 
  Badge as BadgeType, 
  Competition,
  User,
  Application,
  Campaign
} from '@shared/schema';
import { useMarketplace } from '@/lib/provider';

interface LeaderboardEntry extends MonthlyLeaderboard {
  creator?: Partial<User>;
}

interface CreatorProgress {
  totalPoints: number;
  currentLevel: CreatorLevel | null;
  nextLevel: CreatorLevel | null;
  pointsToNextLevel: number;
  progressPercentage: number;
  badges: (BadgeType & { earnedAt: Date })[];
  rank: number | null;
  stats: {
    totalViews: number;
    totalSales: number;
    totalPosts: number;
    totalStories: number;
    totalReels: number;
    totalEngagement: number;
    currentStreak: number;
    longestStreak: number;
    campaignsCompleted: number;
    onTimeDeliveries: number;
  };
}

interface FeatureStatus {
  gamificationEnabled: boolean;
  leaderboardEnabled: boolean;
  competitionsEnabled: boolean;
}

interface CompetitionWithParticipation extends Competition {
  participantCount: number;
  isParticipating: boolean;
}

const LEVEL_CONFIGS = {
  bronze: {
    gradient: 'from-amber-600 via-orange-500 to-amber-700',
    bg: 'bg-gradient-to-br from-amber-100 to-orange-100',
    border: 'border-amber-300',
    icon: '🥉',
    glow: 'shadow-amber-200'
  },
  prata: {
    gradient: 'from-slate-400 via-gray-300 to-slate-500',
    bg: 'bg-gradient-to-br from-gray-100 to-slate-100',
    border: 'border-gray-300',
    icon: '🥈',
    glow: 'shadow-gray-200'
  },
  ouro: {
    gradient: 'from-yellow-400 via-amber-300 to-yellow-500',
    bg: 'bg-gradient-to-br from-yellow-100 to-amber-100',
    border: 'border-yellow-400',
    icon: '🥇',
    glow: 'shadow-yellow-200'
  },
  diamante: {
    gradient: 'from-cyan-400 via-blue-300 to-cyan-500',
    bg: 'bg-gradient-to-br from-cyan-50 to-blue-100',
    border: 'border-cyan-400',
    icon: '💎',
    glow: 'shadow-cyan-200'
  },
  lendario: {
    gradient: 'from-purple-500 via-pink-400 to-purple-600',
    bg: 'bg-gradient-to-br from-purple-100 to-pink-100',
    border: 'border-purple-400',
    icon: '👑',
    glow: 'shadow-purple-300'
  }
};

const POINT_ACTIONS = [
  { action: 'views_1k', label: '1.000 views', points: 10, icon: Eye, category: 'performance' },
  { action: 'views_10k', label: '10.000 views', points: 50, icon: Eye, category: 'performance' },
  { action: 'views_100k', label: '100.000 views', points: 200, icon: Eye, category: 'performance' },
  { action: 'sale_generated', label: 'Venda gerada', points: 100, icon: ShoppingBag, category: 'sales' },
  { action: 'post_published', label: 'Post publicado', points: 20, icon: Image, category: 'content' },
  { action: 'story_published', label: 'Story publicado', points: 10, icon: Clock, category: 'content' },
  { action: 'reels_published', label: 'Reels publicado', points: 30, icon: Video, category: 'content' },
  { action: 'comment_received', label: 'Comentário recebido', points: 2, icon: MessageCircle, category: 'engagement' },
  { action: 'engagement_bonus', label: 'Bônus engajamento', points: 25, icon: Sparkles, category: 'engagement' },
  { action: 'delivered_on_time', label: 'Entrega no prazo', points: 50, icon: CheckCircle2, category: 'achievement' },
  { action: 'early_delivery', label: 'Entrega antecipada', points: 75, icon: Zap, category: 'bonus' },
  { action: 'monthly_streak', label: 'Sequência mensal', points: 100, icon: Flame, category: 'bonus' },
  { action: 'campaign_goal_reached', label: 'Meta de campanha', points: 150, icon: Target, category: 'achievement' },
];

const ALL_BADGES = [
  { id: 'first_campaign', name: 'Primeira Campanha', description: 'Complete sua primeira campanha', icon: '🎉', requirement: 'complete_1_campaign' },
  { id: 'ten_campaigns', name: '10 Campanhas', description: 'Complete 10 campanhas', icon: '🏆', requirement: 'complete_10_campaigns' },
  { id: 'perfect_rating', name: 'Avaliação Perfeita', description: 'Receba nota 5 em uma campanha', icon: '⭐', requirement: 'perfect_rating' },
  { id: 'on_time_master', name: 'Mestre da Pontualidade', description: '10 entregas no prazo seguidas', icon: '⏰', requirement: 'on_time_streak_10' },
  { id: 'engagement_king', name: 'Rei do Engajamento', description: 'Alcance 10% de engajamento', icon: '👑', requirement: 'engagement_10_percent' },
  { id: 'viral_post', name: 'Post Viral', description: 'Alcance 100k views em um post', icon: '🚀', requirement: 'viral_100k' },
  { id: 'sales_champion', name: 'Campeão de Vendas', description: 'Gere 50 vendas', icon: '💰', requirement: 'sales_50' },
  { id: 'verified', name: 'Criador Verificado', description: 'Perfil verificado', icon: '✓', requirement: 'verified_profile' },
  { id: 'top_monthly', name: 'Top do Mês', description: 'Fique no top 3 do ranking mensal', icon: '🏅', requirement: 'top_3_monthly' },
  { id: 'streak_30', name: 'Sequência de 30 Dias', description: 'Mantenha atividade por 30 dias', icon: '🔥', requirement: 'streak_30' },
];

export default function CreatorLeaderboard() {
  const { user } = useMarketplace();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rankingPeriod, setRankingPeriod] = useState<'monthly' | 'weekly' | 'all'>('monthly');
  const [joiningCompetition, setJoiningCompetition] = useState<number | null>(null);
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const joinCompetitionMutation = useMutation({
    mutationFn: async (competitionId: number) => {
      const res = await fetch(`/api/gamification/competitions/${competitionId}/join`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await res.json();
          throw new Error(error.error || 'Erro ao participar');
        }
        throw new Error('Erro ao participar da competição');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Você entrou na competição!",
        description: "Boa sorte! Comece a acumular pontos para subir no ranking.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/gamification/competitions'] });
      setJoiningCompetition(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao participar",
        description: error.message,
        variant: "destructive",
      });
      setJoiningCompetition(null);
    },
  });

  const { data: featureStatus, isLoading: loadingStatus } = useQuery<FeatureStatus>({
    queryKey: ['/api/gamification/status'],
    queryFn: async () => {
      const res = await fetch('/api/gamification/status', { credentials: 'include' });
      if (!res.ok) return { gamificationEnabled: false, leaderboardEnabled: false, competitionsEnabled: false };
      return res.json();
    },
  });

  const { data: leaderboard, isLoading: loadingLeaderboard } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/gamification/leaderboard', currentMonth, currentYear, rankingPeriod],
    queryFn: async () => {
      const res = await fetch(`/api/gamification/leaderboard?month=${currentMonth}&year=${currentYear}&period=${rankingPeriod}`, { 
        credentials: 'include' 
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: featureStatus?.leaderboardEnabled,
  });

  const { data: myProgress, isLoading: loadingProgress } = useQuery<CreatorProgress>({
    queryKey: ['/api/gamification/my-progress'],
    queryFn: async () => {
      const res = await fetch('/api/gamification/my-progress', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch progress');
      return res.json();
    },
    enabled: featureStatus?.gamificationEnabled,
  });

  const { data: levels } = useQuery<CreatorLevel[]>({
    queryKey: ['/api/gamification/levels'],
    enabled: featureStatus?.gamificationEnabled,
  });

  const { data: competitions, isLoading: loadingCompetitions } = useQuery<CompetitionWithParticipation[]>({
    queryKey: ['/api/gamification/competitions'],
    enabled: featureStatus?.competitionsEnabled,
  });

  // Fetch creator's rewards
  interface CreatorReward {
    id: number;
    campaignId: number;
    companyId: number;
    creatorId: number;
    type: 'ranking_place' | 'milestone' | 'bonus';
    rewardType: 'cash' | 'product' | 'voucher' | 'custom';
    value: number | null;
    description: string | null;
    status: 'pending' | 'approved' | 'rejected' | 'cash_paid' | 'product_shipped' | 'completed' | 'cancelled';
    rankPosition: number | null;
    pointsThreshold: number | null;
    createdAt: string;
    campaign?: { id: number; title: string } | null;
    company?: { id: number; name: string } | null;
  }

  const { data: myRewards = [], isLoading: loadingRewards } = useQuery<CreatorReward[]>({
    queryKey: ['/api/creator/rewards'],
    queryFn: async () => {
      const res = await fetch('/api/creator/rewards', { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: featureStatus?.gamificationEnabled,
  });

  // Fetch creator's active campaigns (accepted applications)
  interface ActiveCampaign extends Application {
    campaign?: Campaign;
  }
  
  const { data: activeCampaigns, isLoading: loadingActiveCampaigns } = useQuery<ActiveCampaign[]>({
    queryKey: ['/api/applications/active'],
    queryFn: async () => {
      const res = await fetch('/api/applications/active', { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const getLevelConfig = (levelName: string | undefined) => {
    if (!levelName) return LEVEL_CONFIGS.bronze;
    const normalized = levelName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return LEVEL_CONFIGS[normalized as keyof typeof LEVEL_CONFIGS] || LEVEL_CONFIGS.bronze;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-7 w-7 text-yellow-500 drop-shadow-lg" />;
      case 2: return <Medal className="h-6 w-6 text-gray-400" />;
      case 3: return <Medal className="h-6 w-6 text-amber-600" />;
      default: return <span className="text-lg font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-100 dark:from-yellow-900/20 dark:via-amber-900/20 dark:to-yellow-900/30 border-2 border-yellow-400 shadow-lg shadow-yellow-100 dark:shadow-yellow-900/20';
      case 2: return 'bg-gradient-to-r from-gray-50 to-slate-100 dark:from-gray-800/50 dark:to-slate-800/50 border-2 border-gray-300 dark:border-gray-600';
      case 3: return 'bg-gradient-to-r from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-400 dark:border-amber-600';
      default: return 'bg-white dark:bg-card border border-gray-200 dark:border-border hover:border-gray-300 hover:shadow-sm';
    }
  };

  if (loadingStatus) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!featureStatus?.gamificationEnabled) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto overflow-hidden">
          <div className="bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 p-8 text-white text-center">
            <Lock className="h-16 w-16 mx-auto mb-4 opacity-80" />
            <h2 className="text-3xl font-bold mb-2">Em Breve!</h2>
            <p className="text-white/80 max-w-md mx-auto">
              O sistema de gamificação está sendo preparado. 
              Em breve você poderá acumular pontos, subir de nível e competir no ranking!
            </p>
          </div>
          <CardContent className="p-6 bg-gradient-to-b from-gray-50 to-white dark:from-card dark:to-background">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4">
                <Trophy className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                <p className="text-sm text-muted-foreground">Rankings Mensais</p>
              </div>
              <div className="p-4">
                <Award className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                <p className="text-sm text-muted-foreground">Conquistas</p>
              </div>
              <div className="p-4">
                <Target className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-sm text-muted-foreground">Competições</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentLevelConfig = getLevelConfig(myProgress?.currentLevel?.name);

  const statItems = [
    { icon: Eye, color: 'text-blue-500', bg: 'bg-blue-500/10 hover:bg-blue-500/20', value: (myProgress?.stats?.totalViews || 0).toLocaleString('pt-BR'), label: 'Views', tooltip: 'Total de visualizações nos seus conteúdos' },
    { icon: ShoppingBag, color: 'text-emerald-500', bg: 'bg-emerald-500/10 hover:bg-emerald-500/20', value: myProgress?.stats?.totalSales || 0, label: 'Vendas', tooltip: 'Vendas atribuídas aos seus cupons' },
    { icon: Image, color: 'text-violet-500', bg: 'bg-violet-500/10 hover:bg-violet-500/20', value: myProgress?.stats?.totalPosts || 0, label: 'Posts', tooltip: 'Posts publicados em campanhas' },
    { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10 hover:bg-amber-500/20', value: myProgress?.stats?.totalStories || 0, label: 'Stories', tooltip: 'Stories publicados em campanhas' },
    { icon: Video, color: 'text-pink-500', bg: 'bg-pink-500/10 hover:bg-pink-500/20', value: myProgress?.stats?.totalReels || 0, label: 'Reels', tooltip: 'Reels publicados em campanhas' },
  ];

  return (
    <TooltipProvider delayDuration={300}>
      <div className="container mx-auto px-4 py-6 space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent" data-testid="heading-leaderboard">
              Ranking & Conquistas
            </h1>
            <p className="text-muted-foreground mt-1">
              Acumule pontos, suba de nível e destaque-se entre os melhores criadores
            </p>
          </div>
        </div>

        {/* Hero Card - Redesigned */}
        {myProgress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="overflow-hidden border border-border/50 shadow-2xl bg-card relative" data-testid="card-my-progress">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-indigo-500/5" />
              <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/30 to-indigo-500/30 rounded-full blur-xl" />
                      <Avatar className="h-20 w-20 md:h-24 md:w-24 border-2 border-border/50 relative z-10 shadow-xl ring-4 ring-violet-500/10">
                        <AvatarImage src={user?.avatar || ''} />
                        <AvatarFallback className="bg-gradient-to-br from-violet-500/20 to-indigo-500/20 text-foreground text-2xl font-bold">
                          {user?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 -right-2 text-3xl z-20">
                        {currentLevelConfig.icon}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl md:text-3xl font-bold text-foreground">{user?.name}</h3>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge className="bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20">
                          {myProgress.currentLevel?.name || 'Iniciante'}
                        </Badge>
                        {myProgress.rank && (
                          <Badge variant="outline" className="text-muted-foreground border-border/50">
                            <Trophy className="h-3 w-3 mr-1 text-amber-500" />
                            #{myProgress.rank} no ranking
                          </Badge>
                        )}
                        {myProgress.stats?.currentStreak > 0 && (
                          <Badge className="bg-gradient-to-r from-orange-500/10 to-red-500/10 text-orange-400 border border-orange-500/20">
                            <Flame className="h-3 w-3 mr-1" />
                            {myProgress.stats.currentStreak} dias
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-left md:text-right bg-gradient-to-br from-violet-500/10 to-indigo-500/10 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-violet-500/20">
                    <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent tracking-tight">
                      {myProgress.totalPoints.toLocaleString('pt-BR')}
                    </div>
                    <div className="text-muted-foreground text-sm flex items-center md:justify-end gap-1 mt-1">
                      <Sparkles className="h-4 w-4 text-violet-400" />
                      pontos totais
                    </div>
                  </div>
                </div>

                {myProgress.nextLevel && (
                  <div className="mt-6 bg-muted/30 backdrop-blur-sm rounded-xl p-4 border border-border/50">
                    <div className="flex justify-between text-sm mb-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-muted-foreground flex items-center gap-2 cursor-help hover:text-foreground transition-colors">
                            <TrendingUp className="h-4 w-4 text-violet-400" />
                            Próximo nível: <strong className="text-foreground">{myProgress.nextLevel.name}</strong>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="w-80 p-0" sideOffset={8}>
                          <div className="p-3 border-b border-border">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-purple-500" />
                              Como Ganhar Pontos
                            </h4>
                          </div>
                          <div className="p-3 max-h-64 overflow-y-auto space-y-2">
                            {POINT_ACTIONS.slice(0, 8).map((action) => (
                              <div key={action.action} className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">{action.label}</span>
                                <Badge variant="secondary" className="text-xs font-semibold">
                                  +{action.points} pts
                                </Badge>
                              </div>
                            ))}
                            <div className="pt-2 border-t border-border text-xs text-muted-foreground text-center">
                              E mais {POINT_ACTIONS.length - 8} ações disponíveis!
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                      <span className="text-foreground font-medium">
                        {myProgress.pointsToNextLevel.toLocaleString('pt-BR')} pts restantes
                      </span>
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${myProgress.progressPercentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                    <div className="text-right mt-1 text-xs text-muted-foreground">
                      {myProgress.progressPercentage.toFixed(0)}% concluído
                    </div>
                  </div>
                )}
              </div>

              <CardContent className="p-6 bg-card">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {statItems.map((stat, index) => (
                    <Tooltip key={stat.label}>
                      <TooltipTrigger asChild>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.03, y: -2 }}
                          className={`text-center p-4 rounded-xl border cursor-default transition-all ${stat.bg}`}
                          data-testid={`stat-${stat.label.toLowerCase()}`}
                        >
                          <stat.icon className={`h-5 w-5 mx-auto ${stat.color} mb-2`} />
                          <div className="text-xl font-bold text-foreground">
                            {stat.value}
                          </div>
                          <div className="text-xs text-muted-foreground">{stat.label}</div>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{stat.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>

                {myProgress.badges.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Conquistas Recentes
                    </h4>
                    <div className="flex gap-2 flex-wrap">
                      {myProgress.badges.slice(0, 6).map((badge) => (
                        <Tooltip key={badge.id}>
                          <TooltipTrigger asChild>
                            <motion.div 
                              whileHover={{ scale: 1.05 }}
                              className="flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 border border-amber-200 dark:border-amber-700 shadow-sm cursor-default"
                            >
                              <span className="text-lg">{badge.icon}</span>
                              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">{badge.name}</span>
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{badge.description || badge.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                      {myProgress.badges.length > 6 && (
                        <div className="px-3 py-2 rounded-full bg-muted text-sm text-muted-foreground">
                          +{myProgress.badges.length - 6} mais
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Campanhas e Ranking - Side by Side */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Minhas Campanhas Ativas Section */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                Minhas Campanhas Ativas
              </CardTitle>
              <CardDescription>
                Campanhas em que você está participando atualmente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingActiveCampaigns ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-28 w-full" />
                  ))}
                </div>
              ) : activeCampaigns && activeCampaigns.length > 0 ? (
                <div className="space-y-4">
                  {activeCampaigns.map((application) => (
                    <motion.div 
                      key={application.id}
                      whileHover={{ scale: 1.02 }}
                      className="p-5 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 shadow-sm hover:shadow-md transition-all cursor-pointer"
                      data-testid={`active-campaign-${application.id}`}
                      onClick={() => window.location.href = `/creator/workspace/${application.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-green-800 dark:text-green-200">
                            {application.campaign?.title || 'Campanha'}
                          </h4>
                          <p className="text-sm text-green-600 dark:text-green-400 mt-1 line-clamp-2">
                            {application.campaign?.description || 'Sem descrição'}
                          </p>
                          <div className="flex items-center gap-3 mt-3 text-sm text-green-500">
                            {application.campaign?.deadline && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Até {format(new Date(application.campaign.deadline), 'dd/MM')}
                              </span>
                            )}
                            {application.creatorWorkflowStatus && (
                              <Badge className="bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-200">
                                {application.creatorWorkflowStatus === 'aceito' ? 'Aceito' :
                                 application.creatorWorkflowStatus === 'producao' ? 'Em produção' :
                                 application.creatorWorkflowStatus === 'revisao' ? 'Em revisão' :
                                 application.creatorWorkflowStatus === 'entregue' ? 'Entregue' :
                                 application.creatorWorkflowStatus}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="ghost"
                          size="icon"
                          className="text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
                          data-testid={`btn-view-campaign-${application.id}`}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Nenhuma campanha ativa no momento</p>
                  <p className="text-sm mt-1">Explore as campanhas das empresas no Feed e candidate-se!</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <a href="/feed">
                      Ver Campanhas
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ranking Section */}
          <Card className="h-fit">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Ranking {rankingPeriod === 'weekly' ? 'Semanal' : rankingPeriod === 'all' ? 'Geral' : `de ${format(currentDate, 'MMMM yyyy', { locale: ptBR })}`}
              </CardTitle>
              <CardDescription>
                {rankingPeriod === 'weekly' ? 'Os criadores com melhor desempenho esta semana' : 
                 rankingPeriod === 'all' ? 'Os melhores criadores de todos os tempos' : 
                 'Os criadores com melhor desempenho este mês'}
              </CardDescription>
            </div>
            <Select value={rankingPeriod} onValueChange={(v) => setRankingPeriod(v as any)}>
              <SelectTrigger className="w-32" data-testid="select-ranking-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly" data-testid="option-weekly">Semanal</SelectItem>
                <SelectItem value="monthly" data-testid="option-monthly">Mensal</SelectItem>
                <SelectItem value="all" data-testid="option-all">Geral</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {loadingLeaderboard ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : !featureStatus?.leaderboardEnabled ? (
              <div className="text-center py-12 text-muted-foreground">
                <Lock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">O ranking será liberado em breve!</p>
              </div>
            ) : leaderboard && leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.slice(0, 3).length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {[1, 0, 2].map((pos) => {
                      const entry = leaderboard[pos];
                      if (!entry) return <div key={pos} />;
                      const isFirst = pos === 0;
                      return (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: pos * 0.1 }}
                          className={`text-center p-4 rounded-2xl ${isFirst ? 'bg-gradient-to-b from-yellow-100 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/20 border-2 border-yellow-400 shadow-lg -mt-4' : 'bg-muted/50 border border-border'}`}
                        >
                          <div className="relative inline-block">
                            <Avatar className={`${isFirst ? 'h-20 w-20' : 'h-16 w-16'} border-4 ${isFirst ? 'border-yellow-400' : 'border-border'}`}>
                              <AvatarImage src={entry.creator?.avatar || ''} />
                              <AvatarFallback className={isFirst ? 'bg-yellow-200 dark:bg-yellow-800' : 'bg-muted'}>
                                {entry.creator?.name?.charAt(0) || 'C'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-2 -right-2 text-2xl">
                              {pos === 0 ? '🥇' : pos === 1 ? '🥈' : '🥉'}
                            </div>
                          </div>
                          <h4 className={`font-bold mt-3 ${isFirst ? 'text-lg' : 'text-sm'} truncate`}>
                            {entry.creator?.name || 'Criador'}
                          </h4>
                          <div className={`${isFirst ? 'text-2xl' : 'text-lg'} font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent`}>
                            {entry.points.toLocaleString('pt-BR')}
                          </div>
                          <div className="text-xs text-muted-foreground">pontos</div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
                
                {leaderboard.slice(3).map((entry, index) => (
                  <motion.div 
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${getRankStyle(entry.rank || index + 4)}`}
                    data-testid={`leaderboard-entry-${entry.id}`}
                  >
                    <div className="w-12 flex justify-center font-bold text-muted-foreground">
                      #{entry.rank || index + 4}
                    </div>
                    <Avatar className="h-12 w-12 border-2 border-border">
                      <AvatarImage src={entry.creator?.avatar || ''} />
                      <AvatarFallback>
                        {entry.creator?.name?.charAt(0) || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-semibold">{entry.creator?.name || 'Criador'}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-3">
                        <span>{entry.campaignsCompleted} campanhas</span>
                        {entry.avgRating && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            {entry.avgRating}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        {entry.points.toLocaleString('pt-BR')}
                      </div>
                      <div className="text-xs text-muted-foreground">pontos</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Nenhum criador no ranking ainda este mês</p>
                <p className="text-sm mt-1">Seja o primeiro a acumular pontos!</p>
              </div>
            )}
          </CardContent>
          </Card>
        </div>

        {/* Conquistas Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Conquistas
            </CardTitle>
            <CardDescription>
              Complete desafios e desbloqueie badges exclusivos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {ALL_BADGES.map((badge) => {
                const earned = myProgress?.badges?.find(b => b.name === badge.name);
                
                return (
                  <Tooltip key={badge.id}>
                    <TooltipTrigger asChild>
                      <motion.div 
                        whileHover={{ scale: 1.03 }}
                        className={`p-4 rounded-2xl text-center transition-all cursor-default ${
                          earned 
                            ? 'bg-gradient-to-b from-amber-100 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/20 border-2 border-amber-300 dark:border-amber-700 shadow-md' 
                            : 'bg-muted/50 border-2 border-dashed border-muted-foreground/20 opacity-60'
                        }`}
                        data-testid={`badge-${badge.id}`}
                      >
                        <div className={`text-4xl mb-3 ${earned ? '' : 'grayscale opacity-50'}`}>
                          {badge.icon}
                        </div>
                        <div className={`font-semibold text-sm ${earned ? 'text-amber-800 dark:text-amber-200' : 'text-muted-foreground'}`}>
                          {badge.name}
                        </div>
                        <div className={`text-xs mt-1 ${earned ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                          {badge.description}
                        </div>
                        {earned && (
                          <div className="text-xs text-amber-500 mt-2 flex items-center justify-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Conquistado
                          </div>
                        )}
                        {!earned && (
                          <div className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
                            <Lock className="h-3 w-3" />
                            Bloqueado
                          </div>
                        )}
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{badge.description}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Níveis Section - 2 Columns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              Níveis de Criador
            </CardTitle>
            <CardDescription>
              Acumule pontos para subir de nível e desbloquear benefícios exclusivos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {levels && levels.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {levels.map((level, index) => {
                  const isCurrentLevel = myProgress?.currentLevel?.id === level.id;
                  const isPastLevel = (myProgress?.totalPoints || 0) >= (level.maxPoints || Infinity);
                  const levelConfig = getLevelConfig(level.name);
                  
                  return (
                    <motion.div 
                      key={level.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-5 rounded-2xl border-2 transition-all ${
                        isCurrentLevel 
                          ? `${levelConfig.border} bg-card shadow-lg ring-2 ring-offset-2 ring-offset-background ${levelConfig.border.replace('border-', 'ring-')}` 
                          : isPastLevel 
                            ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/20' 
                            : 'border-border bg-card hover:border-primary/30'
                      }`}
                      data-testid={`level-${level.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br ${levelConfig.gradient} shadow-lg cursor-default`}
                            >
                              {levelConfig.icon}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Nível {level.name}</p>
                          </TooltipContent>
                        </Tooltip>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-lg font-bold text-foreground">{level.name}</span>
                            {isCurrentLevel && (
                              <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Atual
                              </Badge>
                            )}
                            {isPastLevel && !isCurrentLevel && (
                              <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Conquistado
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {level.minPoints.toLocaleString('pt-BR')} - {level.maxPoints ? level.maxPoints.toLocaleString('pt-BR') : '∞'} pontos
                          </div>
                          {level.benefits && level.benefits.length > 0 && (
                            <div className="flex gap-1.5 flex-wrap mt-2">
                              {level.benefits.slice(0, 2).map((benefit, i) => (
                                <Badge key={i} variant="outline" className="text-xs bg-background/80">
                                  {benefit}
                                </Badge>
                              ))}
                              {level.benefits.length > 2 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className="text-xs cursor-default bg-background/80">
                                      +{level.benefits.length - 2}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <ul className="text-sm">
                                      {level.benefits.slice(2).map((b, i) => (
                                        <li key={i}>{b}</li>
                                      ))}
                                    </ul>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Zap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Os níveis serão configurados em breve</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Minhas Recompensas Section */}
        {myRewards.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-emerald-500" />
                Minhas Recompensas
              </CardTitle>
              <CardDescription>
                Prêmios conquistados nas campanhas e competições
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {myRewards.slice(0, 10).map((reward) => {
                  const statusConfig = {
                    pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300', icon: Clock },
                    approved: { label: 'Aprovado', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300', icon: CheckCircle2 },
                    rejected: { label: 'Recusado', color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300', icon: X },
                    cash_paid: { label: 'Pago', color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', icon: CheckCircle2 },
                    product_shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300', icon: Package },
                    completed: { label: 'Concluído', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300', icon: CheckCircle2 },
                    cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300', icon: X },
                  };
                  const status = statusConfig[reward.status] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  
                  const rewardTypeConfig = {
                    cash: { label: 'Dinheiro', icon: '💰' },
                    product: { label: 'Produto', icon: '🎁' },
                    voucher: { label: 'Voucher', icon: '🎟️' },
                    custom: { label: 'Especial', icon: '✨' },
                  };
                  const rewardInfo = rewardTypeConfig[reward.rewardType] || rewardTypeConfig.custom;
                  
                  return (
                    <motion.div
                      key={reward.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors"
                      data-testid={`reward-${reward.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 flex items-center justify-center text-2xl">
                          {rewardInfo.icon}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            {reward.description || `${rewardInfo.label}${reward.value ? ` - R$ ${reward.value.toLocaleString('pt-BR')}` : ''}`}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                            {reward.campaign && (
                              <span>{reward.campaign.title}</span>
                            )}
                            {reward.rankPosition && (
                              <Badge variant="outline" className="text-xs">
                                #{reward.rankPosition}º lugar
                              </Badge>
                            )}
                            {reward.pointsThreshold && (
                              <Badge variant="outline" className="text-xs">
                                {reward.pointsThreshold.toLocaleString('pt-BR')} pts
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`${status.color} text-xs`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                    </motion.div>
                  );
                })}
                {myRewards.length > 10 && (
                  <p className="text-center text-sm text-muted-foreground pt-2">
                    E mais {myRewards.length - 10} recompensas...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Como Ganhar Pontos Section - Last */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Como Ganhar Pontos
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Complete ações para acumular pontos e subir no ranking. Quanto mais pontos, mais alto seu nível!</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <CardDescription>
              Cada ação conta! Veja como acumular pontos e subir no ranking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {['performance', 'content', 'engagement', 'sales', 'achievement', 'bonus'].map((category) => {
                const categoryActions = POINT_ACTIONS.filter(a => a.category === category);
                if (categoryActions.length === 0) return null;
                
                const categoryLabels: Record<string, { label: string; colorClass: string; bgClass: string; icon: any }> = {
                  performance: { label: 'Performance', colorClass: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-100 dark:bg-blue-900/50', icon: Eye },
                  content: { label: 'Conteúdo', colorClass: 'text-purple-600 dark:text-purple-400', bgClass: 'bg-purple-100 dark:bg-purple-900/50', icon: Image },
                  engagement: { label: 'Engajamento', colorClass: 'text-pink-600 dark:text-pink-400', bgClass: 'bg-pink-100 dark:bg-pink-900/50', icon: MessageCircle },
                  sales: { label: 'Vendas', colorClass: 'text-green-600 dark:text-green-400', bgClass: 'bg-green-100 dark:bg-green-900/50', icon: ShoppingBag },
                  achievement: { label: 'Conquistas', colorClass: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-100 dark:bg-amber-900/50', icon: Trophy },
                  bonus: { label: 'Bônus', colorClass: 'text-orange-600 dark:text-orange-400', bgClass: 'bg-orange-100 dark:bg-orange-900/50', icon: Gift },
                };
                
                const cat = categoryLabels[category];
                
                return (
                  <div key={category} className="space-y-3">
                    <h4 className={`text-sm font-semibold ${cat.colorClass} flex items-center gap-2`}>
                      <cat.icon className="h-4 w-4" />
                      {cat.label}
                    </h4>
                    <div className="space-y-2">
                      {categoryActions.map((action) => (
                        <Tooltip key={action.action}>
                          <TooltipTrigger asChild>
                            <div 
                              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-default"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${cat.bgClass}`}>
                                  <action.icon className={`h-4 w-4 ${cat.colorClass}`} />
                                </div>
                                <span className="font-medium text-sm">{action.label}</span>
                              </div>
                              <Badge variant="secondary" className="font-semibold">
                                +{action.points} pts
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Ganhe {action.points} pontos ao completar: {action.label}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
