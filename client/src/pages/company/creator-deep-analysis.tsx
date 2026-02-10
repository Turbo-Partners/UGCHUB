import { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Instagram, 
  RefreshCw,
  Users,
  TrendingUp,
  Heart,
  MessageCircle,
  Eye,
  Share2,
  Hash,
  ExternalLink,
  Calendar,
  Play,
  Image as ImageIcon,
  Video,
  LayoutGrid,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  BarChart3,
  Target,
  Zap,
  Award,
  TrendingDown,
  Clock,
  ChevronDown,
  ChevronUp,
  Shield,
  Activity
} from 'lucide-react';
import { getAvatarUrl } from '@/lib/utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

interface CreatorHashtag {
  id: number;
  platform: 'instagram' | 'tiktok';
  hashtag: string;
  usageCount: number;
  avgEngagement: string | null;
}

interface AnalyticsHistoryEntry {
  platform: string;
  followers: number;
  engagementRate: string;
  recordedAt: string;
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
    topHashtags: CreatorHashtag[];
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
    topHashtags: CreatorHashtag[];
    lastUpdated: string | null;
  };
  analyticsHistory: AnalyticsHistoryEntry[];
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
    </svg>
  );
}

function formatNumber(num: number | null | undefined): string {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString('pt-BR');
}

function formatCompactNumber(num: number | null | undefined): string {
  if (!num) return '0';
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function PostTypeIcon({ type }: { type: string | null }) {
  switch (type) {
    case 'video':
      return <Video className="h-3 w-3" />;
    case 'reel':
      return <Play className="h-3 w-3" />;
    case 'carousel':
      return <LayoutGrid className="h-3 w-3" />;
    default:
      return <ImageIcon className="h-3 w-3" />;
  }
}

function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  subValue,
  gradient,
  delay = 0
}: { 
  icon: any; 
  label: string; 
  value: string; 
  subValue?: string;
  gradient: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className={`relative overflow-hidden border-0 shadow-lg ${gradient}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <CardContent className="pt-6 relative">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-white/80 mb-1">{label}</p>
              <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
              {subValue && (
                <p className="text-xs text-white/60 mt-1">{subValue}</p>
              )}
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AuthenticityGauge({ score }: { score: number | null }) {
  const value = score || 50;
  const getColor = () => {
    if (value >= 75) return 'text-emerald-500';
    if (value >= 50) return 'text-amber-500';
    return 'text-red-500';
  };
  const getLabel = () => {
    if (value >= 75) return 'Excelente';
    if (value >= 50) return 'Bom';
    return 'Baixo';
  };

  return (
    <div className="text-center">
      <div className="relative inline-flex items-center justify-center">
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            className="text-gray-200"
            strokeWidth="10"
            stroke="currentColor"
            fill="transparent"
            r="56"
            cx="64"
            cy="64"
          />
          <circle
            className={getColor()}
            strokeWidth="10"
            strokeDasharray={352}
            strokeDashoffset={352 - (352 * value) / 100}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="56"
            cx="64"
            cy="64"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={`text-3xl font-bold ${getColor()}`}>{value}</span>
          <span className="text-xs text-muted-foreground">de 100</span>
        </div>
      </div>
      <p className={`mt-2 font-semibold ${getColor()}`}>{getLabel()}</p>
      <p className="text-xs text-muted-foreground">Score de Autenticidade</p>
    </div>
  );
}

function PostGrid({ posts, platform }: { posts: CreatorPost[]; platform: 'instagram' | 'tiktok' }) {
  const [showAll, setShowAll] = useState(false);
  const displayPosts = showAll ? posts : posts.slice(0, 12);
  
  return (
    <div className="space-y-4">
      <div className={`grid gap-3 ${platform === 'tiktok' ? 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6' : 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6'}`}>
        <AnimatePresence>
          {displayPosts.map((post, i) => (
            <motion.a 
              key={post.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
              href={post.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`group relative rounded-xl overflow-hidden bg-muted border border-border/50 hover:border-primary/50 hover:shadow-xl transition-all duration-300 ${platform === 'tiktok' ? 'aspect-[9/16]' : 'aspect-square'}`}
              data-testid={`post-${platform}-${post.postId}`}
            >
              {post.thumbnailUrl ? (
                <img 
                  src={post.thumbnailUrl} 
                  alt={post.caption || 'Post'} 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  {platform === 'tiktok' ? (
                    <Video className="h-8 w-8 text-muted-foreground" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  {platform === 'tiktok' && post.views && (
                    <div className="flex items-center gap-1 mb-2 text-sm">
                      <Eye className="h-4 w-4" />
                      <span className="font-medium">{formatCompactNumber(post.views)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5" />
                      <span>{formatCompactNumber(post.likes)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>{formatCompactNumber(post.comments)}</span>
                    </div>
                    {platform === 'tiktok' && post.shares && (
                      <div className="flex items-center gap-1">
                        <Share2 className="h-3.5 w-3.5" />
                        <span>{formatCompactNumber(post.shares)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="absolute top-2 right-2">
                <div className="bg-black/60 backdrop-blur-sm rounded-full p-1.5">
                  <PostTypeIcon type={post.postType} />
                </div>
              </div>
              {post.engagementRate && parseFloat(post.engagementRate) > 5 && (
                <div className="absolute top-2 left-2">
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    Viral
                  </Badge>
                </div>
              )}
            </motion.a>
          ))}
        </AnimatePresence>
      </div>
      
      {posts.length > 12 && (
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={() => setShowAll(!showAll)}
            className="gap-2"
          >
            {showAll ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Mostrar menos
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Ver todos os {posts.length} posts
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function HashtagCloud({ hashtags }: { hashtags: CreatorHashtag[] }) {
  const maxCount = Math.max(...hashtags.map(h => h.usageCount));
  
  const getSize = (count: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.7) return 'text-lg font-bold';
    if (ratio > 0.4) return 'text-base font-semibold';
    return 'text-sm font-medium';
  };

  const colors = [
    'bg-gradient-to-r from-pink-500 to-rose-500',
    'bg-gradient-to-r from-violet-500 to-purple-500',
    'bg-gradient-to-r from-blue-500 to-cyan-500',
    'bg-gradient-to-r from-emerald-500 to-teal-500',
    'bg-gradient-to-r from-amber-500 to-orange-500',
  ];

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {hashtags.map((h, i) => (
        <motion.div
          key={h.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
        >
          <Badge 
            className={`${colors[i % colors.length]} text-white border-0 ${getSize(h.usageCount)} py-1.5 px-4 shadow-lg hover:shadow-xl transition-all cursor-default`}
          >
            #{h.hashtag}
            <span className="ml-2 bg-white/20 rounded-full px-2 py-0.5 text-xs">
              {h.usageCount}x
            </span>
          </Badge>
        </motion.div>
      ))}
    </div>
  );
}

function InsightCard({ icon: Icon, title, value, description, trend }: {
  icon: any;
  title: string;
  value: string;
  description: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted border border-border/50">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold">{title}</h4>
          {trend && (
            <span className={`flex items-center text-xs ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}>
              {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : trend === 'down' ? <TrendingDown className="h-3 w-3" /> : null}
            </span>
          )}
        </div>
        <p className="text-2xl font-bold text-primary mt-1">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}

function PlatformComparison({ instagram, tiktok }: { instagram: DeepAnalysisData['instagram']; tiktok: DeepAnalysisData['tiktok'] }) {
  const data = [
    { 
      metric: 'Seguidores', 
      instagram: instagram.profile.followers || 0, 
      tiktok: tiktok.profile?.followers || 0 
    },
    { 
      metric: 'Engajamento', 
      instagram: parseFloat(instagram.profile.engagementRate?.replace('%', '') || '0'),
      tiktok: parseFloat(tiktok.profile?.engagementRate?.replace('%', '') || '0')
    },
  ];

  const COLORS = ['#E1306C', '#000000'];

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Comparativo entre Plataformas
        </CardTitle>
        <CardDescription className="text-gray-300">
          Análise lado a lado do desempenho
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl">
                <Instagram className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold">Instagram</p>
                <p className="text-sm text-muted-foreground">{formatNumber(instagram.profile.followers)} seguidores</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Engajamento</span>
                <span className="font-semibold">{instagram.profile.engagementRate || '0%'}</span>
              </div>
              <Progress value={parseFloat(instagram.profile.engagementRate?.replace('%', '') || '0') * 10} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="font-bold text-lg">{formatCompactNumber(instagram.stats.totalLikes)}</p>
                <p className="text-muted-foreground">Curtidas</p>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="font-bold text-lg">{formatCompactNumber(instagram.stats.totalComments)}</p>
                <p className="text-muted-foreground">Comentários</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-black rounded-xl">
                <TikTokIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold">TikTok</p>
                <p className="text-sm text-muted-foreground">{formatNumber(tiktok.profile?.followers)} seguidores</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Engajamento</span>
                <span className="font-semibold">{tiktok.profile?.engagementRate || '0%'}</span>
              </div>
              <Progress value={parseFloat(tiktok.profile?.engagementRate?.replace('%', '') || '0') * 10} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="font-bold text-lg">{formatCompactNumber(tiktok.stats.totalViews)}</p>
                <p className="text-muted-foreground">Views</p>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="font-bold text-lg">{formatCompactNumber(tiktok.stats.totalLikes)}</p>
                <p className="text-muted-foreground">Curtidas</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface CreatorDeepAnalysisProps {
  embeddedCreatorId?: number;
  embedded?: boolean;
}

export default function CreatorDeepAnalysis({ embeddedCreatorId, embedded = false }: CreatorDeepAnalysisProps = {}) {
  const [match, params] = useRoute('/creator/:id/analysis');
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'instagram' | 'tiktok'>('instagram');
  
  const creatorId = embeddedCreatorId || (params?.id ? parseInt(params.id) : null);

  const { data: analysis, isLoading, error } = useQuery<DeepAnalysisData>({
    queryKey: [`/api/creators/${creatorId}/deep-analysis`],
    queryFn: async () => {
      const res = await fetch(`/api/creators/${creatorId}/deep-analysis`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch analysis');
      return res.json();
    },
    enabled: !!creatorId,
  });

  const refreshMutation = useMutation({
    mutationFn: async (platform: 'instagram' | 'tiktok' | 'both') => {
      const res = await fetch(`/api/creators/${creatorId}/refresh-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ platform }),
      });
      if (!res.ok) throw new Error('Failed to refresh analysis');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/creators/${creatorId}/deep-analysis`] });
      toast({
        title: 'Análise atualizada!',
        description: 'Os dados foram sincronizados com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar a análise. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  if ((!match && !embedded) || !creatorId) return null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-primary/20 rounded-full" />
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="mt-6 text-lg font-medium text-muted-foreground">Carregando análise...</p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="p-4 bg-red-50 rounded-full mb-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Análise não disponível</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          Não foi possível carregar os dados de análise. Isso pode acontecer se o criador ainda não foi analisado.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(`/creator/${creatorId}/profile`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao perfil
          </Button>
          <Button onClick={() => refreshMutation.mutate('both')} disabled={refreshMutation.isPending}>
            {refreshMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Iniciar análise
          </Button>
        </div>
      </div>
    );
  }

  const historyChartData = analysis.analyticsHistory
    .filter(h => h.platform === activeTab)
    .map(h => ({
      date: format(new Date(h.recordedAt), 'dd/MM', { locale: ptBR }),
      followers: h.followers,
      engagement: parseFloat(h.engagementRate?.replace('%', '') || '0'),
    }))
    .reverse()
    .slice(-30);

  const currentPlatformData = activeTab === 'instagram' ? analysis.instagram : analysis.tiktok;
  const hasPlatformData = currentPlatformData.recentPosts.length > 0 || 
    (activeTab === 'instagram' && analysis.instagram.profile.followers) ||
    (activeTab === 'tiktok' && analysis.tiktok.profile);

  const hasMultiplePlatforms = analysis.creator.instagram && analysis.creator.tiktok;

  return (
    <div className={`space-y-8 animate-in fade-in duration-500 ${embedded ? '' : 'pb-12'}`}>
      {!embedded && (
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(`/creator/${creatorId}/profile`)} 
            className="rounded-full"
            data-testid="button-back-profile"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-4 ring-primary/20">
              <AvatarImage src={getAvatarUrl(analysis.creator.avatar)} />
              <AvatarFallback className="text-xl bg-gradient-to-br from-primary to-primary/60 text-white">
                {analysis.creator.name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
                {analysis.creator.name}
                {(analysis.instagram.profile.verified || analysis.tiktok.profile?.verified) && (
                  <CheckCircle className="h-5 w-5 text-blue-500 fill-blue-500" />
                )}
              </h1>
              <div className="flex items-center gap-3 text-muted-foreground">
                {analysis.creator.instagram && (
                  <a 
                    href={`https://instagram.com/${analysis.creator.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-pink-500 transition-colors"
                  >
                    <Instagram className="h-4 w-4" />
                    @{analysis.creator.instagram}
                  </a>
                )}
                {analysis.creator.tiktok && (
                  <a 
                    href={`https://tiktok.com/@${analysis.creator.tiktok}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    <TikTokIcon className="h-4 w-4" />
                    @{analysis.creator.tiktok}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {currentPlatformData.lastUpdated && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Atualizado {formatDistanceToNow(new Date(currentPlatformData.lastUpdated), { locale: ptBR, addSuffix: true })}
            </p>
          )}
          <Button 
            onClick={() => refreshMutation.mutate('both')}
            disabled={refreshMutation.isPending}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
            data-testid="button-refresh-analysis"
          >
            {refreshMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Atualizar dados
          </Button>
        </div>
      </div>
      )}

      {embedded && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {currentPlatformData.lastUpdated && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Atualizado {formatDistanceToNow(new Date(currentPlatformData.lastUpdated), { locale: ptBR, addSuffix: true })}
              </p>
            )}
          </div>
          <Button 
            onClick={() => refreshMutation.mutate('both')}
            disabled={refreshMutation.isPending}
            size="sm"
            variant="outline"
            data-testid="button-refresh-analysis-embedded"
          >
            {refreshMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Atualizar
          </Button>
        </div>
      )}

      {hasMultiplePlatforms && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <PlatformComparison instagram={analysis.instagram} tiktok={analysis.tiktok} />
        </motion.div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'instagram' | 'tiktok')} className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger 
            value="instagram" 
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg px-6"
            data-testid="tab-instagram"
          >
            <Instagram className="h-4 w-4" />
            Instagram
          </TabsTrigger>
          <TabsTrigger 
            value="tiktok" 
            className="flex items-center gap-2 data-[state=active]:bg-black data-[state=active]:text-white rounded-lg px-6"
            data-testid="tab-tiktok"
          >
            <TikTokIcon className="h-4 w-4" />
            TikTok
          </TabsTrigger>
        </TabsList>

        <TabsContent value="instagram" className="space-y-8 mt-6">
          {embedded ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard 
                icon={Heart}
                label="Total Curtidas"
                value={formatNumber(analysis.instagram.stats.totalLikes)}
                subValue={`${analysis.instagram.stats.postsAnalyzed} posts analisados`}
                gradient="bg-gradient-to-br from-red-500 to-pink-600"
                delay={0}
              />
              <MetricCard 
                icon={MessageCircle}
                label="Total Comentários"
                value={formatNumber(analysis.instagram.stats.totalComments)}
                subValue="Interações recentes"
                gradient="bg-gradient-to-br from-blue-500 to-cyan-600"
                delay={0.1}
              />
              <MetricCard 
                icon={Target}
                label="Engajamento Médio"
                value={analysis.instagram.stats.avgEngagement || '0%'}
                subValue="Média nos posts analisados"
                gradient="bg-gradient-to-br from-violet-500 to-purple-600"
                delay={0.2}
              />
              <MetricCard 
                icon={LayoutGrid}
                label="Posts Analisados"
                value={String(analysis.instagram.stats.postsAnalyzed)}
                subValue={analysis.instagram.profile.postsCount ? `de ${formatNumber(analysis.instagram.profile.postsCount)} total` : undefined}
                gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                delay={0.3}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard 
                icon={Users}
                label="Seguidores"
                value={formatNumber(analysis.instagram.profile.followers)}
                subValue={analysis.instagram.profile.following ? `Seguindo ${formatNumber(analysis.instagram.profile.following)}` : undefined}
                gradient="bg-gradient-to-br from-pink-500 to-rose-600"
                delay={0}
              />
              <MetricCard 
                icon={TrendingUp}
                label="Engajamento"
                value={analysis.instagram.profile.engagementRate || '0%'}
                subValue="Taxa média por post"
                gradient="bg-gradient-to-br from-violet-500 to-purple-600"
                delay={0.1}
              />
              <MetricCard 
                icon={Heart}
                label="Total Curtidas"
                value={formatNumber(analysis.instagram.stats.totalLikes)}
                subValue={`${analysis.instagram.stats.postsAnalyzed} posts analisados`}
                gradient="bg-gradient-to-br from-red-500 to-pink-600"
                delay={0.2}
              />
              <MetricCard 
                icon={MessageCircle}
                label="Total Comentários"
                value={formatNumber(analysis.instagram.stats.totalComments)}
                subValue="Interações recentes"
                gradient="bg-gradient-to-br from-blue-500 to-cyan-600"
                delay={0.3}
              />
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Evolução de Seguidores
                </CardTitle>
                <CardDescription>Acompanhamento do crescimento ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                {historyChartData.length > 0 ? (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={historyChartData}>
                        <defs>
                          <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#E1306C" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#E1306C" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          fontSize={12} 
                          stroke="hsl(var(--muted-foreground))" 
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          fontSize={12} 
                          stroke="hsl(var(--muted-foreground))" 
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => formatCompactNumber(value)}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '12px',
                            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)'
                          }}
                          formatter={(value: number) => [formatNumber(value), 'Seguidores']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="followers" 
                          stroke="#E1306C" 
                          strokeWidth={3}
                          fill="url(#colorFollowers)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Histórico será gerado nas próximas atualizações</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Autenticidade
                </CardTitle>
                <CardDescription>Avaliação do perfil</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center py-4">
                <AuthenticityGauge score={analysis.instagram.profile.authenticityScore} />
              </CardContent>
            </Card>
          </div>

          {analysis.instagram.topHashtags.length > 0 && (
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5 text-violet-600" />
                  Hashtags Mais Usadas
                </CardTitle>
                <CardDescription>As tags mais frequentes nos últimos {analysis.instagram.stats.postsAnalyzed} posts</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <HashtagCloud hashtags={analysis.instagram.topHashtags} />
              </CardContent>
            </Card>
          )}

          {analysis.instagram.recentPosts.length > 0 && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <LayoutGrid className="h-5 w-5 text-primary" />
                      Posts Recentes
                    </CardTitle>
                    <CardDescription>{analysis.instagram.stats.postsAnalyzed} posts analisados</CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    Média: {analysis.instagram.stats.avgEngagement} engajamento
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <PostGrid posts={analysis.instagram.recentPosts} platform="instagram" />
              </CardContent>
            </Card>
          )}

          {!hasPlatformData && (
            <Card className="border-0 shadow-lg">
              <CardContent className="py-16 text-center">
                <div className="p-4 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Instagram className="h-10 w-10 text-pink-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Pronto para analisar</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Clique no botão abaixo para buscar dados detalhados do Instagram deste criador.
                </p>
                <Button 
                  onClick={() => refreshMutation.mutate('instagram')}
                  disabled={refreshMutation.isPending}
                  size="lg"
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                >
                  {refreshMutation.isPending ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-5 w-5" />
                  )}
                  Iniciar análise do Instagram
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tiktok" className="space-y-8 mt-6">
          {analysis.tiktok.profile ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard 
                  icon={Users}
                  label="Seguidores"
                  value={formatNumber(analysis.tiktok.profile.followers)}
                  subValue={analysis.tiktok.profile.following ? `Seguindo ${formatNumber(analysis.tiktok.profile.following)}` : undefined}
                  gradient="bg-gradient-to-br from-gray-800 to-gray-900"
                  delay={0}
                />
                <MetricCard 
                  icon={Heart}
                  label="Curtidas Totais"
                  value={formatNumber(analysis.tiktok.profile.likes)}
                  subValue="Em todos os vídeos"
                  gradient="bg-gradient-to-br from-pink-500 to-red-500"
                  delay={0.1}
                />
                <MetricCard 
                  icon={Eye}
                  label="Views Totais"
                  value={formatNumber(analysis.tiktok.stats.totalViews)}
                  subValue={`${analysis.tiktok.stats.postsAnalyzed} vídeos analisados`}
                  gradient="bg-gradient-to-br from-cyan-500 to-blue-500"
                  delay={0.2}
                />
                <MetricCard 
                  icon={TrendingUp}
                  label="Engajamento"
                  value={analysis.tiktok.profile.engagementRate || '0%'}
                  subValue="Taxa média por vídeo"
                  gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
                  delay={0.3}
                />
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <InsightCard 
                  icon={Video}
                  title="Vídeos Publicados"
                  value={formatNumber(analysis.tiktok.profile.videos)}
                  description="Total de vídeos no perfil"
                />
                <InsightCard 
                  icon={MessageCircle}
                  title="Comentários Recentes"
                  value={formatNumber(analysis.tiktok.stats.totalComments)}
                  description={`Nos últimos ${analysis.tiktok.stats.postsAnalyzed} vídeos`}
                />
              </div>
            </>
          ) : null}

          {analysis.tiktok.topHashtags.length > 0 && (
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-950/50 dark:to-slate-950/50">
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Hashtags Mais Usadas
                </CardTitle>
                <CardDescription>As tags mais frequentes nos últimos {analysis.tiktok.stats.postsAnalyzed} vídeos</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <HashtagCloud hashtags={analysis.tiktok.topHashtags} />
              </CardContent>
            </Card>
          )}

          {analysis.tiktok.recentPosts.length > 0 && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Video className="h-5 w-5 text-primary" />
                      Vídeos Recentes
                    </CardTitle>
                    <CardDescription>{analysis.tiktok.stats.postsAnalyzed} vídeos analisados</CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    Média: {analysis.tiktok.stats.avgEngagement} engajamento
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <PostGrid posts={analysis.tiktok.recentPosts} platform="tiktok" />
              </CardContent>
            </Card>
          )}

          {!analysis.tiktok.profile && analysis.tiktok.recentPosts.length === 0 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="py-16 text-center">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <TikTokIcon className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Pronto para analisar</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Clique no botão abaixo para buscar dados detalhados do TikTok deste criador.
                </p>
                <Button 
                  onClick={() => refreshMutation.mutate('tiktok')}
                  disabled={refreshMutation.isPending}
                  size="lg"
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  {refreshMutation.isPending ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-5 w-5" />
                  )}
                  Iniciar análise do TikTok
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
