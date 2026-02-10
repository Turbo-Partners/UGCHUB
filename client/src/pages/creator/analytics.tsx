import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
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
  Activity,
  Search,
  ArrowUpDown,
  Filter,
  Lock,
  X,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  Brain,
  ChevronRight,
  BookOpen,
  Film,
  Music
} from 'lucide-react';
import { getAvatarUrl } from '@/lib/utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { format, formatDistanceToNow, parseISO, getHours, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMarketplace } from '@/lib/provider';

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

interface PostAiInsight {
  id: number;
  postId: number;
  userId: number;
  platform: 'instagram' | 'tiktok';
  summary: string | null;
  strengths: string[] | null;
  improvements: string[] | null;
  hashtags: string[] | null;
  bestTimeToPost: string | null;
  audienceInsights: string | null;
  contentScore: number | null;
  engagementPrediction: string | null;
  recommendations: string[] | null;
  createdAt: string;
  updatedAt: string;
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
      totalViews?: number;
      avgEngagement: string;
      postsAnalyzed: number;
    };
    topHashtags: CreatorHashtag[];
    lastUpdated: string | null;
    history?: Array<{ date: string; followers: number; engagement?: number }>;
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

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00C49F'];
const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function TrendIndicator({ value, suffix = '' }: { value: number; suffix?: string }) {
  if (value === 0) {
    return <span className="text-xs text-muted-foreground">Sem variação</span>;
  }
  
  const isPositive = value > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
  const bgClass = isPositive ? 'bg-green-50' : 'bg-red-50';
  
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${colorClass} ${bgClass}`}>
      <Icon className="h-3 w-3" />
      {isPositive ? '+' : ''}{value.toFixed(1)}{suffix}
    </span>
  );
}

type PeriodOption = '7d' | '30d' | '90d';

interface GrowthMetrics {
  followersChange: number;
  followersChangePercent: number;
  engagementChange: number;
  likesChange: number;
  likesChangePercent: number;
  commentsChange: number;
  commentsChangePercent: number;
  trend: 'up' | 'down' | 'stable';
}

export default function CreatorAnalytics() {
  const { user } = useMarketplace();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'likes' | 'comments' | 'engagement' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'instagram' | 'tiktok'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('30d');
  const [selectedPost, setSelectedPost] = useState<CreatorPost | null>(null);
  const [isPostDrawerOpen, setIsPostDrawerOpen] = useState(false);
  const [aiInsightTab, setAiInsightTab] = useState<'metrics' | 'comments' | 'ai'>('metrics');

  const { data, isLoading, error } = useQuery<DeepAnalysisData>({
    queryKey: [`/api/creators/${user?.id}/deep-analysis`],
    enabled: !!user?.id && user?.role === 'creator',
  });

  const refreshMutation = useMutation({
    mutationFn: async (platform: 'instagram' | 'tiktok' | 'both') => {
      const res = await fetch(`/api/creators/${user?.id}/refresh-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ platform }),
      });
      if (!res.ok) throw new Error('Falha ao atualizar');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/creators/${user?.id}/deep-analysis`] });
      toast.success('Análise atualizada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar análise');
    },
  });

  const { data: postAiInsight, isLoading: isLoadingInsight } = useQuery<PostAiInsight>({
    queryKey: [`/api/posts/${selectedPost?.id}/ai-insight`],
    enabled: !!selectedPost?.id && isPostDrawerOpen,
  });

  // Fetch real-time Instagram insights from connected account
  const { data: instagramInsights, isLoading: isLoadingInstagramInsights, refetch: refetchInstagramInsights } = useQuery<{
    profile: {
      username: string;
      name: string;
      profilePictureUrl: string;
      followersCount: number;
      followsCount: number;
      mediaCount: number;
      biography: string;
    };
    insights: Array<{
      name: string;
      period: string;
      values: Array<{ value: number; end_time?: string }>;
      title: string;
      description: string;
    }>;
    period: string;
  }>({
    queryKey: ['/api/instagram/creator/insights'],
    enabled: user?.role === 'creator',
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch real-time Instagram media (posts)
  const { data: instagramMedia, isLoading: isLoadingInstagramMedia } = useQuery<{
    media: Array<{
      id: string;
      caption: string;
      media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
      media_url: string;
      thumbnail_url?: string;
      permalink: string;
      timestamp: string;
      like_count: number;
      comments_count: number;
    }>;
    paging: { cursors?: { after?: string; before?: string } } | null;
  }>({
    queryKey: ['/api/instagram/creator/media'],
    enabled: user?.role === 'creator',
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const generateAiInsightMutation = useMutation({
    mutationFn: async (post: CreatorPost) => {
      const res = await fetch(`/api/posts/${post.id}/generate-ai-insight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ postId: post.id }),
      });
      if (!res.ok) throw new Error('Falha ao gerar análise');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData([`/api/posts/${selectedPost?.id}/ai-insight`], data);
      toast.success('Análise de IA gerada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao gerar análise de IA');
    },
  });

  const handlePostClick = (post: CreatorPost) => {
    setSelectedPost(post);
    setIsPostDrawerOpen(true);
    setAiInsightTab('metrics');
  };

  const allPosts = useMemo(() => {
    if (!data) return [];
    const igPosts = data.instagram?.recentPosts || [];
    const ttPosts = data.tiktok?.recentPosts || [];
    return [...igPosts, ...ttPosts];
  }, [data]);

  const filteredAndSortedPosts = useMemo(() => {
    let posts = [...allPosts];
    
    if (platformFilter !== 'all') {
      posts = posts.filter(p => p.platform === platformFilter);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      posts = posts.filter(p => 
        p.caption?.toLowerCase().includes(term) ||
        p.hashtags?.some(h => h.toLowerCase().includes(term))
      );
    }
    
    posts.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'likes':
          comparison = (b.likes || 0) - (a.likes || 0);
          break;
        case 'comments':
          comparison = (b.comments || 0) - (a.comments || 0);
          break;
        case 'engagement':
          comparison = parseFloat(b.engagementRate || '0') - parseFloat(a.engagementRate || '0');
          break;
        case 'date':
          comparison = new Date(b.postedAt || 0).getTime() - new Date(a.postedAt || 0).getTime();
          break;
      }
      return sortOrder === 'desc' ? comparison : -comparison;
    });
    
    return posts;
  }, [allPosts, platformFilter, searchTerm, sortBy, sortOrder]);

  const bestTimesData = useMemo(() => {
    if (!allPosts.length) return { byHour: [], byDay: [] };
    
    const hourStats: { [key: number]: { total: number; engagement: number } } = {};
    const dayStats: { [key: number]: { total: number; engagement: number } } = {};
    
    allPosts.forEach(post => {
      if (!post.postedAt) return;
      const date = new Date(post.postedAt);
      const hour = getHours(date);
      const day = getDay(date);
      const engagement = (post.likes || 0) + (post.comments || 0);
      
      if (!hourStats[hour]) hourStats[hour] = { total: 0, engagement: 0 };
      hourStats[hour].total++;
      hourStats[hour].engagement += engagement;
      
      if (!dayStats[day]) dayStats[day] = { total: 0, engagement: 0 };
      dayStats[day].total++;
      dayStats[day].engagement += engagement;
    });
    
    const byHour = Object.entries(hourStats).map(([hour, stats]) => ({
      hour: `${hour}h`,
      avgEngagement: Math.round(stats.engagement / stats.total),
      posts: stats.total,
    })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
    
    const byDay = Object.entries(dayStats).map(([day, stats]) => ({
      day: DAYS_OF_WEEK[parseInt(day)],
      avgEngagement: Math.round(stats.engagement / stats.total),
      posts: stats.total,
    }));
    
    return { byHour, byDay };
  }, [allPosts]);

  const hashtagPerformance = useMemo(() => {
    if (!data) return [];
    
    const igHashtags = data.instagram?.topHashtags || [];
    const ttHashtags = data.tiktok?.topHashtags || [];
    const allHashtags = [...igHashtags, ...ttHashtags];
    const hashtagMap: { [key: string]: { count: number; avgEngagement: number } } = {};
    
    allHashtags.forEach(h => {
      if (!hashtagMap[h.hashtag]) {
        hashtagMap[h.hashtag] = { count: 0, avgEngagement: 0 };
      }
      hashtagMap[h.hashtag].count += h.usageCount;
      hashtagMap[h.hashtag].avgEngagement = parseFloat(h.avgEngagement || '0');
    });
    
    return Object.entries(hashtagMap)
      .map(([hashtag, stats]) => ({
        hashtag,
        usageCount: stats.count,
        avgEngagement: stats.avgEngagement.toFixed(2) + '%',
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 15);
  }, [data]);

  const periodDays = useMemo(() => {
    switch (selectedPeriod) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      default: return 30;
    }
  }, [selectedPeriod]);

  const growthData = useMemo(() => {
    if (!data?.analyticsHistory?.length) return [];
    
    return data.analyticsHistory
      .filter(h => h.platform === 'instagram')
      .map(h => ({
        date: format(new Date(h.recordedAt), 'dd/MM', { locale: ptBR }),
        followers: h.followers,
        engagement: parseFloat(h.engagementRate || '0'),
      }))
      .slice(-periodDays);
  }, [data, periodDays]);

  const growthMetrics = useMemo((): GrowthMetrics => {
    const defaultMetrics: GrowthMetrics = {
      followersChange: 0,
      followersChangePercent: 0,
      engagementChange: 0,
      likesChange: 0,
      likesChangePercent: 0,
      commentsChange: 0,
      commentsChangePercent: 0,
      trend: 'stable',
    };

    if (!data?.analyticsHistory?.length || data.analyticsHistory.length < 2) {
      return defaultMetrics;
    }

    const history = data.analyticsHistory
      .filter(h => h.platform === 'instagram')
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

    if (history.length < 2) return defaultMetrics;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);
    
    const recentHistory = history.filter(h => new Date(h.recordedAt) >= cutoffDate);
    
    if (recentHistory.length < 2) {
      const latest = history[history.length - 1];
      const oldest = history[0];
      const followersChange = latest.followers - oldest.followers;
      const followersChangePercent = oldest.followers > 0 
        ? ((followersChange / oldest.followers) * 100)
        : 0;
      const engagementChange = parseFloat(latest.engagementRate || '0') - parseFloat(oldest.engagementRate || '0');

      return {
        followersChange,
        followersChangePercent,
        engagementChange,
        likesChange: 0,
        likesChangePercent: 0,
        commentsChange: 0,
        commentsChangePercent: 0,
        trend: followersChange > 0 ? 'up' : followersChange < 0 ? 'down' : 'stable',
      };
    }

    const oldest = recentHistory[0];
    const latest = recentHistory[recentHistory.length - 1];
    
    const followersChange = latest.followers - oldest.followers;
    const followersChangePercent = oldest.followers > 0 
      ? ((followersChange / oldest.followers) * 100)
      : 0;
    const engagementChange = parseFloat(latest.engagementRate || '0') - parseFloat(oldest.engagementRate || '0');

    const igStats = data.instagram?.stats;
    const postsAnalyzed = igStats?.postsAnalyzed || 1;
    const avgLikesPerPost = (igStats?.totalLikes || 0) / postsAnalyzed;
    const avgCommentsPerPost = (igStats?.totalComments || 0) / postsAnalyzed;
    
    const likesChange = Math.round(avgLikesPerPost * (followersChangePercent / 100));
    const commentsChange = Math.round(avgCommentsPerPost * (followersChangePercent / 100));

    return {
      followersChange,
      followersChangePercent,
      engagementChange,
      likesChange,
      likesChangePercent: followersChangePercent,
      commentsChange,
      commentsChangePercent: followersChangePercent,
      trend: followersChange > 0 ? 'up' : followersChange < 0 ? 'down' : 'stable',
    };
  }, [data, periodDays]);

  const insights = useMemo(() => {
    const tips: { type: 'success' | 'warning' | 'info'; message: string }[] = [];
    
    if (!data) return tips;

    const engagementRate = parseFloat(data.instagram?.profile?.engagementRate || '0');
    const followers = data.instagram?.profile?.followers || 0;
    const following = data.instagram?.profile?.following || 0;
    const postsCount = data.instagram?.profile?.postsCount || 0;
    const igStats = data.instagram?.stats;
    const postsAnalyzed = igStats?.postsAnalyzed || 1;
    const avgLikes = (igStats?.totalLikes || 0) / postsAnalyzed;
    const avgComments = (igStats?.totalComments || 0) / postsAnalyzed;
    const avgViews = (igStats?.totalViews || 0) / postsAnalyzed;

    // Engagement insights
    if (engagementRate >= 5) {
      tips.push({ type: 'success', message: 'Excelente taxa de engajamento! Seu conteúdo está ressoando muito bem com sua audiência.' });
    } else if (engagementRate >= 3) {
      tips.push({ type: 'info', message: 'Boa taxa de engajamento. Continue criando conteúdo relevante para sua audiência.' });
    } else if (engagementRate > 0) {
      tips.push({ type: 'warning', message: 'Sua taxa de engajamento pode melhorar. Experimente postar em horários diferentes ou usar mais CTAs.' });
    }

    // Growth insights
    if (growthMetrics.trend === 'up') {
      tips.push({ type: 'success', message: `Crescimento de ${formatNumber(growthMetrics.followersChange)} seguidores no período. Seu conteúdo está atraindo novas pessoas!` });
    } else if (growthMetrics.trend === 'down') {
      tips.push({ type: 'warning', message: 'Você perdeu seguidores recentemente. Analise o que pode estar causando isso e ajuste sua estratégia.' });
    }

    // Follower tier insights
    if (followers >= 100000) {
      tips.push({ type: 'info', message: 'Com sua audiência, você pode negociar campanhas de maior valor e parcerias exclusivas.' });
    } else if (followers >= 10000) {
      tips.push({ type: 'info', message: 'Micro-influenciadores como você têm alta demanda por marcas buscando autenticidade e nichos específicos.' });
    } else if (followers >= 1000) {
      tips.push({ type: 'info', message: 'Nano-influenciadores têm as maiores taxas de engajamento. Foque em construir uma comunidade fiel.' });
    }

    // Comment-to-like ratio analysis
    if (avgLikes > 0 && avgComments > 0) {
      const commentToLikeRatio = (avgComments / avgLikes) * 100;
      if (commentToLikeRatio >= 5) {
        tips.push({ type: 'success', message: 'Ótima proporção de comentários! Sua audiência está altamente engajada e interativa.' });
      } else if (commentToLikeRatio < 1) {
        tips.push({ type: 'warning', message: 'Poucos comentários em relação às curtidas. Use perguntas nos posts para estimular conversas.' });
      }
    }

    // Views analysis for video content
    if (avgViews > 0 && followers > 0) {
      const viewRate = (avgViews / followers) * 100;
      if (viewRate >= 30) {
        tips.push({ type: 'success', message: 'Seus vídeos têm excelente alcance! O algoritmo está favorecendo seu conteúdo.' });
      } else if (viewRate < 10) {
        tips.push({ type: 'warning', message: 'Considere melhorar os primeiros 3 segundos dos seus vídeos para aumentar a retenção.' });
      }
    }

    // Following/Followers ratio
    if (followers > 0 && following > 0) {
      const ratio = followers / following;
      if (ratio >= 10) {
        tips.push({ type: 'success', message: 'Excelente proporção seguidores/seguindo. Isso demonstra autoridade no seu nicho.' });
      } else if (ratio < 1) {
        tips.push({ type: 'info', message: 'Considere seguir menos contas para melhorar sua proporção seguidores/seguindo.' });
      }
    }

    // Posting frequency
    if (postsCount > 0 && followers > 0) {
      const postsPerThousand = (postsCount / (followers / 1000));
      if (postsPerThousand < 0.5) {
        tips.push({ type: 'info', message: 'Você tem uma grande audiência para poucos posts. Aumente a frequência para manter o engajamento.' });
      }
    }

    // Average performance insights
    if (avgLikes > 0) {
      if (avgLikes >= 1000) {
        tips.push({ type: 'success', message: `Média de ${formatNumber(avgLikes)} curtidas por post! Seu conteúdo tem alto potencial viral.` });
      } else if (avgLikes >= 100) {
        tips.push({ type: 'info', message: 'Consistência é chave. Continue postando regularmente para aumentar seu alcance.' });
      }
    }

    // Monetization potential
    if (followers >= 5000 && engagementRate >= 3) {
      tips.push({ type: 'success', message: 'Você está pronto para monetizar! Com seu engajamento, marcas terão interesse em parcerias.' });
    }

    // Always add general tips if we have few insights
    const generalTips = [
      { type: 'info' as const, message: 'Poste nos melhores horários: 12h-14h e 19h-21h têm maior alcance no Instagram.' },
      { type: 'info' as const, message: 'Reels têm 2x mais alcance que posts estáticos. Priorize conteúdo em vídeo.' },
      { type: 'info' as const, message: 'Responda comentários nos primeiros 30 min para aumentar o alcance do algoritmo.' },
      { type: 'info' as const, message: 'Stories diários mantêm sua audiência engajada e você no topo do feed.' },
      { type: 'info' as const, message: 'Use 3-5 hashtags relevantes em vez de 30 genéricas para melhor alcance.' },
      { type: 'info' as const, message: 'Colaborações com outros criadores podem dobrar seu alcance rapidamente.' },
      { type: 'info' as const, message: 'CTAs claros (comente, salve, compartilhe) aumentam o engajamento em até 50%.' },
      { type: 'info' as const, message: 'Carrosséis têm a maior taxa de salvamento - ótimos para conteúdo educativo.' },
    ];

    // Add general tips until we have at least 6 insights
    while (tips.length < 6 && generalTips.length > 0) {
      const randomIndex = Math.floor(Math.random() * generalTips.length);
      tips.push(generalTips.splice(randomIndex, 1)[0]);
    }

    return tips.slice(0, 9);
  }, [data, growthMetrics]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-primary/20 rounded-full" />
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="mt-6 text-lg font-medium text-muted-foreground">Carregando analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="p-4 bg-red-50 rounded-full mb-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Erro ao carregar analytics</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          Não foi possível carregar suas métricas. Verifique se você tem Instagram ou TikTok conectado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="creator-analytics-page">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Meus Analytics
          </h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho das suas redes sociais
          </p>
        </div>
        <Button 
          onClick={() => refreshMutation.mutate('both')}
          disabled={refreshMutation.isPending}
          data-testid="btn-refresh-analytics"
        >
          {refreshMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Atualizar Dados
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" data-testid="tab-overview">Minha Rede</TabsTrigger>
          <TabsTrigger value="campaigns" data-testid="tab-campaigns" className="flex items-center gap-2">
            <Lock className="h-3 w-3" />
            Minhas Campanhas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Header with period selector */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Visão Geral da Sua Rede
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Período:</span>
              <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as PeriodOption)}>
                <SelectTrigger className="w-[120px]" data-testid="select-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 dias</SelectItem>
                  <SelectItem value="30d">30 dias</SelectItem>
                  <SelectItem value="90d">90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Real-time Instagram Insights from API */}
          {instagramInsights && (
            <Card className="border-pink-200/50 bg-gradient-to-r from-pink-50/50 to-rose-50/50 dark:from-pink-950/10 dark:to-rose-950/10">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                      <Instagram className="h-4 w-4 text-white" />
                    </div>
                    Insights em Tempo Real
                    <Badge variant="outline" className="ml-2 text-xs text-green-600 border-green-300">
                      <Activity className="h-3 w-3 mr-1" />
                      Live
                    </Badge>
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => refetchInstagramInsights()}
                    disabled={isLoadingInstagramInsights}
                    data-testid="button-refresh-instagram-insights"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingInstagramInsights ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                  <div className="text-center p-3 bg-white/50 dark:bg-white/5 rounded-lg">
                    <Users className="h-5 w-5 text-pink-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold">{formatNumber(instagramInsights.profile.followersCount)}</p>
                    <p className="text-xs text-muted-foreground">Seguidores</p>
                  </div>
                  <div className="text-center p-3 bg-white/50 dark:bg-white/5 rounded-lg">
                    <LayoutGrid className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold">{formatNumber(instagramInsights.profile.mediaCount)}</p>
                    <p className="text-xs text-muted-foreground">Publicações</p>
                  </div>
                  {instagramInsights.insights.find(i => i.name === 'reach') && (
                    <div className="text-center p-3 bg-white/50 dark:bg-white/5 rounded-lg">
                      <Eye className="h-5 w-5 text-green-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold">
                        {formatNumber(instagramInsights.insights.find(i => i.name === 'reach')?.values?.reduce((sum, v) => sum + v.value, 0) || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Alcance ({instagramInsights.period})</p>
                    </div>
                  )}
                  {instagramInsights.insights.find(i => i.name === 'impressions') && (
                    <div className="text-center p-3 bg-white/50 dark:bg-white/5 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold">
                        {formatNumber(instagramInsights.insights.find(i => i.name === 'impressions')?.values?.reduce((sum, v) => sum + v.value, 0) || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Impressões ({instagramInsights.period})</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats Row */}
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <Card className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 border-pink-200/50">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <Heart className="h-5 w-5 text-pink-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Média curtidas/post</p>
                    <p className="text-lg font-bold">
                      {formatNumber(Math.round((data.instagram?.stats?.totalLikes || 0) / Math.max(data.instagram?.stats?.postsAnalyzed || 1, 1)))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/50">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Média comentários/post</p>
                    <p className="text-lg font-bold">
                      {formatNumber(Math.round((data.instagram?.stats?.totalComments || 0) / Math.max(data.instagram?.stats?.postsAnalyzed || 1, 1)))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/50">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Alcance Total</p>
                    <p className="text-lg font-bold">
                      {formatNumber((data.instagram?.profile?.followers || 0) + (data.tiktok?.profile?.followers || 0))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border-purple-200/50">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Taxa de Interação</p>
                    <p className="text-lg font-bold">
                      {data.instagram?.profile?.followers && data.instagram.profile.followers > 0
                        ? (((data.instagram?.stats?.totalLikes || 0) + (data.instagram?.stats?.totalComments || 0)) / 
                           (data.instagram?.stats?.postsAnalyzed || 1) / 
                           (data.instagram.profile.followers) * 100).toFixed(2) + '%'
                        : '0%'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main stats grid - 2 columns for platform cards */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Instagram Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="h-full overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                        <Instagram className="h-5 w-5 text-white" />
                      </div>
                      Instagram
                      {data.instagram?.profile?.verified && (
                        <Badge variant="secondary" className="ml-2 text-xs">Verificado</Badge>
                      )}
                    </CardTitle>
                    {growthMetrics.followersChange !== 0 && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${growthMetrics.followersChange > 0 ? 'text-green-600 border-green-300 bg-green-50' : 'text-red-600 border-red-300 bg-red-50'}`}
                      >
                        {growthMetrics.followersChange > 0 ? '+' : ''}{formatNumber(growthMetrics.followersChange)} no período
                      </Badge>
                    )}
                  </div>
                  <CardDescription>@{data.creator?.instagram || 'não conectado'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="space-y-1 cursor-help">
                            <p className="text-xs text-muted-foreground">Seguidores</p>
                            <div className="flex items-center gap-2">
                              <p className="text-2xl font-bold">{formatNumber(data.instagram?.profile?.followers)}</p>
                              {/* Mini sparkline for followers */}
                              {data.instagram?.history && data.instagram.history.length > 1 && (
                                <svg width="40" height="20" className="opacity-60">
                                  {(() => {
                                    const historyData = data.instagram.history.slice(-7);
                                    const values = historyData.map((h: any) => h.followers);
                                    const min = Math.min(...values);
                                    const max = Math.max(...values);
                                    const range = max - min || 1;
                                    const points = values.map((v: number, i: number) => 
                                      `${(i / (values.length - 1)) * 40},${20 - ((v - min) / range) * 18}`
                                    ).join(' ');
                                    const isGrowing = values[values.length - 1] >= values[0];
                                    return (
                                      <polyline
                                        fill="none"
                                        stroke={isGrowing ? '#22c55e' : '#ef4444'}
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        points={points}
                                      />
                                    );
                                  })()}
                                </svg>
                              )}
                            </div>
                            <TrendIndicator value={growthMetrics.followersChangePercent} suffix="%" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <div className="space-y-1 text-sm">
                            <p className="font-semibold">Evolução no período</p>
                            {growthMetrics.followersChange !== 0 ? (
                              <>
                                <p>{growthMetrics.followersChange > 0 ? '+' : ''}{formatNumber(growthMetrics.followersChange)} seguidores</p>
                                <p className="text-xs text-muted-foreground">
                                  Variação de {growthMetrics.followersChangePercent.toFixed(1)}% nos últimos {selectedPeriod === '7d' ? '7 dias' : selectedPeriod === '30d' ? '30 dias' : '90 dias'}
                                </p>
                              </>
                            ) : (
                              <p className="text-xs text-muted-foreground">Sem dados históricos suficientes</p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Engajamento</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">{data.instagram?.profile?.engagementRate || '0%'}</p>
                        {/* Mini sparkline for engagement */}
                        {data.instagram?.history && data.instagram.history.length > 1 && (
                          <svg width="40" height="20" className="opacity-60">
                            {(() => {
                              const historyData = data.instagram.history.slice(-7);
                              const values = historyData.map((h: any) => parseFloat(h.engagementRate || '0'));
                              const min = Math.min(...values);
                              const max = Math.max(...values);
                              const range = max - min || 1;
                              const points = values.map((v: number, i: number) => 
                                `${(i / (values.length - 1)) * 40},${20 - ((v - min) / range) * 18}`
                              ).join(' ');
                              const isGrowing = values[values.length - 1] >= values[0];
                              return (
                                <polyline
                                  fill="none"
                                  stroke={isGrowing ? '#22c55e' : '#ef4444'}
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  points={points}
                                />
                              );
                            })()}
                          </svg>
                        )}
                      </div>
                      <TrendIndicator value={growthMetrics.engagementChange} suffix="pp" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Posts</p>
                      <p className="text-xl font-bold">{formatNumber(data.instagram?.profile?.postsCount)}</p>
                      <p className="text-xs text-muted-foreground">{data.instagram?.stats?.postsAnalyzed || 0} analisados</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-semibold">{formatNumber(data.instagram?.stats?.totalLikes)}</p>
                      <p className="text-xs text-muted-foreground">Curtidas</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{formatNumber(data.instagram?.stats?.totalComments)}</p>
                      <p className="text-xs text-muted-foreground">Comentários</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{formatNumber(data.instagram?.profile?.following)}</p>
                      <p className="text-xs text-muted-foreground">Seguindo</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* TikTok Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className={`h-full ${!data.tiktok?.profile ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center">
                      <TikTokIcon className="h-5 w-5 text-white" />
                    </div>
                    TikTok
                    {data.tiktok?.profile?.verified && (
                      <Badge variant="secondary" className="ml-2 text-xs">Verificado</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>@{data.creator?.tiktok || 'não conectado'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.tiktok?.profile ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Seguidores</p>
                          <p className="text-2xl font-bold">{formatNumber(data.tiktok?.profile?.followers)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Engajamento</p>
                          <p className="text-2xl font-bold">{data.tiktok?.profile?.engagementRate || '0%'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Curtidas Totais</p>
                          <p className="text-xl font-bold">{formatNumber(data.tiktok?.profile?.likes)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Vídeos</p>
                          <p className="text-xl font-bold">{formatNumber(data.tiktok?.profile?.videos)}</p>
                          <p className="text-xs text-muted-foreground">{data.tiktok?.stats?.postsAnalyzed || 0} analisados</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-lg font-semibold">{formatNumber(data.tiktok?.stats?.totalLikes)}</p>
                          <p className="text-xs text-muted-foreground">Curtidas</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{formatNumber(data.tiktok?.stats?.totalViews)}</p>
                          <p className="text-xs text-muted-foreground">Views</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{formatNumber(data.tiktok?.profile?.following)}</p>
                          <p className="text-xs text-muted-foreground">Seguindo</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <TikTokIcon className="h-12 w-12 text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Adicione seu TikTok no perfil para ver suas métricas
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Network Summary Card */}
          <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
            <CardContent className="py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Alcance Total</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatNumber((data.instagram?.profile?.followers || 0) + (data.tiktok?.profile?.followers || 0))}
                  </p>
                  <p className="text-xs text-muted-foreground">seguidores</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Posts Analisados</p>
                  <p className="text-2xl font-bold">
                    {(data.instagram?.stats?.postsAnalyzed || 0) + (data.tiktok?.stats?.postsAnalyzed || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">conteúdos</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Interações Totais</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(
                      (data.instagram?.stats?.totalLikes || 0) + 
                      (data.instagram?.stats?.totalComments || 0) +
                      (data.tiktok?.stats?.totalLikes || 0) +
                      (data.tiktok?.stats?.totalComments || 0)
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">curtidas + comentários</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Crescimento</p>
                  <p className={`text-2xl font-bold ${growthMetrics.trend === 'up' ? 'text-green-600' : growthMetrics.trend === 'down' ? 'text-red-600' : ''}`}>
                    {growthMetrics.followersChangePercent >= 0 ? '+' : ''}{growthMetrics.followersChangePercent.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedPeriod === '7d' ? 'últimos 7 dias' : selectedPeriod === '30d' ? 'últimos 30 dias' : 'últimos 90 dias'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>



          {/* Influencer Score Section */}
          <Separator className="my-4" />
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-primary" />
            Score de Influenciador
          </h2>
          {(() => {
            const followers = (data.instagram?.profile?.followers || 0) + (data.tiktok?.profile?.followers || 0);
            const engagement = parseFloat(data.instagram?.profile?.engagementRate || '0');
            const postsAnalyzed = (data.instagram?.stats?.postsAnalyzed || 0) + (data.tiktok?.stats?.postsAnalyzed || 0);
            const totalLikes = (data.instagram?.stats?.totalLikes || 0) + (data.tiktok?.stats?.totalLikes || 0);
            const totalComments = (data.instagram?.stats?.totalComments || 0) + (data.tiktok?.stats?.totalComments || 0);
            
            // New formula with 4 factors (total 100 points)
            // 1. Alcance (Reach) - 25 points max
            // Normalized by tier: nano (<10K) = up to 12, micro (10K-100K) = 12-19, mid (100K-500K) = 19-23, macro (500K+) = 23-25
            let reachScore = 0;
            if (followers < 10000) {
              reachScore = (followers / 10000) * 12;
            } else if (followers < 100000) {
              reachScore = 12 + ((followers - 10000) / 90000) * 7;
            } else if (followers < 500000) {
              reachScore = 19 + ((followers - 100000) / 400000) * 4;
            } else {
              reachScore = Math.min(23 + ((followers - 500000) / 500000) * 2, 25);
            }
            
            // 2. Engajamento (Engagement Quality) - 30 points max
            // Industry average is 1-3%, excellent is 5%+
            const engagementScore = Math.min(engagement * 6, 30);
            
            // 3. Consistência (Content Consistency) - 20 points max
            // Based on posts analyzed and interaction diversity
            const avgInteractionsPerPost = postsAnalyzed > 0 ? (totalLikes + totalComments) / postsAnalyzed : 0;
            const interactionQuality = Math.min(avgInteractionsPerPost / 1000, 1);
            const consistencyScore = Math.min(Math.min(postsAnalyzed / 20, 1) * 12 + interactionQuality * 8, 20);
            
            // 4. Momentum (Growth & Performance) - 25 points max
            // Based on follower growth and engagement trend
            const momentumFromGrowth = growthMetrics.followersChangePercent > 0 
              ? Math.min(growthMetrics.followersChangePercent * 2.5, 12.5) 
              : Math.max(growthMetrics.followersChangePercent, -6);
            const momentumFromEngagement = growthMetrics.engagementChange > 0 
              ? Math.min(growthMetrics.engagementChange * 4, 12.5) 
              : Math.max(growthMetrics.engagementChange * 2, -6);
            const momentumScore = Math.max(0, Math.min(12.5 + momentumFromGrowth + momentumFromEngagement, 25));
            
            // Ensure total never exceeds 100
            const rawScore = reachScore + engagementScore + consistencyScore + momentumScore;
            const totalScore = Math.min(Math.round(rawScore), 100);
            const scoreLevel = totalScore >= 80 ? 'Excelente' : totalScore >= 60 ? 'Muito Bom' : totalScore >= 40 ? 'Bom' : totalScore >= 20 ? 'Em Desenvolvimento' : 'Iniciante';
            const scoreColor = totalScore >= 80 ? 'text-green-600' : totalScore >= 60 ? 'text-blue-600' : totalScore >= 40 ? 'text-amber-600' : 'text-gray-600';
            const scoreBg = totalScore >= 80 ? 'from-green-50 to-emerald-50 dark:from-green-950/30' : totalScore >= 60 ? 'from-blue-50 to-indigo-50 dark:from-blue-950/30' : totalScore >= 40 ? 'from-amber-50 to-orange-50 dark:from-amber-950/30' : 'from-gray-50 to-slate-50 dark:from-gray-950/30';
            
            const scoreFactors = [
              { 
                name: 'Alcance', 
                value: reachScore, 
                max: 25, 
                icon: Users, 
                color: 'bg-blue-500',
                description: 'Baseado no total de seguidores, normalizado por tier (nano, micro, mid, macro)',
                tip: followers < 10000 ? 'Aumente seus seguidores para melhorar' : followers < 100000 ? 'Micro-influenciador: ótimo nicho!' : 'Grande alcance conquistado!'
              },
              { 
                name: 'Engajamento', 
                value: engagementScore, 
                max: 30, 
                icon: Heart, 
                color: 'bg-pink-500',
                description: `Taxa atual: ${engagement.toFixed(2)}% (média do setor: 1-3%)`,
                tip: engagement >= 5 ? 'Excelente engajamento!' : engagement >= 3 ? 'Bom engajamento, continue assim' : 'Foque em CTAs e interação'
              },
              { 
                name: 'Consistência', 
                value: consistencyScore, 
                max: 20, 
                icon: Activity, 
                color: 'bg-purple-500',
                description: `${postsAnalyzed} posts analisados, média de ${formatNumber(Math.round(avgInteractionsPerPost))} interações/post`,
                tip: postsAnalyzed >= 20 ? 'Ótima consistência!' : 'Poste regularmente para melhorar'
              },
              { 
                name: 'Momentum', 
                value: momentumScore, 
                max: 25, 
                icon: TrendingUp, 
                color: 'bg-amber-500',
                description: `Crescimento de ${growthMetrics.followersChangePercent >= 0 ? '+' : ''}${growthMetrics.followersChangePercent.toFixed(1)}% no período`,
                tip: growthMetrics.trend === 'up' ? 'Ótimo momento de crescimento!' : growthMetrics.trend === 'down' ? 'Analise o que pode melhorar' : 'Mantenha a consistência'
              },
            ];
            
            return (
              <div className="flex flex-col md:flex-row gap-4">
                {/* Score Display Card */}
                <Card className={`md:w-48 flex-shrink-0 border-2 ${
                  totalScore >= 80 ? 'border-green-500/30' : 
                  totalScore >= 60 ? 'border-blue-500/30' : 
                  totalScore >= 40 ? 'border-amber-500/30' : 
                  'border-muted'
                }`}>
                  <CardContent className="p-5 flex flex-col items-center justify-center">
                    <div className="relative mb-2">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="42"
                          stroke="currentColor"
                          strokeWidth="5"
                          fill="none"
                          className="text-muted/20"
                        />
                        <motion.circle
                          cx="48"
                          cy="48"
                          r="42"
                          stroke={totalScore >= 80 ? '#22c55e' : totalScore >= 60 ? '#3b82f6' : totalScore >= 40 ? '#f59e0b' : '#6b7280'}
                          strokeWidth="5"
                          fill="none"
                          strokeLinecap="round"
                          initial={{ strokeDasharray: "0 264" }}
                          animate={{ strokeDasharray: `${(totalScore / 100) * 264} 264` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span 
                          className={`text-2xl font-bold ${scoreColor}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          {totalScore}
                        </motion.span>
                        <span className="text-[10px] text-muted-foreground">de 100</span>
                      </div>
                    </div>
                    <Badge 
                      variant="outline"
                      className={`${
                        totalScore >= 80 ? 'border-green-500 text-green-600' : 
                        totalScore >= 60 ? 'border-blue-500 text-blue-600' : 
                        totalScore >= 40 ? 'border-amber-500 text-amber-600' : 
                        'border-muted text-muted-foreground'
                      }`}
                    >
                      {scoreLevel}
                    </Badge>
                  </CardContent>
                </Card>
                
                {/* Factors Card */}
                <Card className="flex-1">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Detalhamento do Score</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {scoreFactors.map((factor, index) => (
                      <TooltipProvider key={factor.name}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <motion.div 
                              className="cursor-help"
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.08 }}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <factor.icon className={`h-3.5 w-3.5 ${factor.color.replace('bg-', 'text-')}`} />
                                  <span className="text-sm">{factor.name}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {Math.round(factor.value)}/{factor.max}
                                </span>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(factor.value / factor.max) * 100}%` }}
                                  transition={{ duration: 0.6, delay: index * 0.08 }}
                                  className={`h-full ${factor.color} rounded-full`}
                                />
                              </div>
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-xs">
                            <p className="font-medium">{factor.name}</p>
                            <p className="text-xs text-muted-foreground">{factor.description}</p>
                            <p className="text-xs text-primary mt-1">{factor.tip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </CardContent>
                </Card>
              </div>
            );
          })()}

          {/* Audience Quality & Network Health Section */}
          <Separator className="my-4" />
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            Qualidade da Audiência
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Authenticity Score Card */}
            <Card className="border-green-500/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Score de Autenticidade</p>
                    <p className="text-xs text-muted-foreground">Qualidade dos seguidores</p>
                  </div>
                </div>
                {(() => {
                  const authenticityScore = data.instagram?.profile?.authenticityScore || 0;
                  const level = authenticityScore >= 80 ? 'Excelente' : authenticityScore >= 60 ? 'Bom' : authenticityScore >= 40 ? 'Moderado' : 'Baixo';
                  const color = authenticityScore >= 80 ? 'text-green-600' : authenticityScore >= 60 ? 'text-blue-600' : authenticityScore >= 40 ? 'text-amber-600' : 'text-red-600';
                  return (
                    <div className="space-y-2">
                      <div className="flex items-end gap-2">
                        <span className={`text-3xl font-bold ${color}`}>
                          {authenticityScore > 0 ? authenticityScore : '--'}
                        </span>
                        {authenticityScore > 0 && <span className="text-sm text-muted-foreground mb-1">/ 100</span>}
                      </div>
                      {authenticityScore > 0 ? (
                        <>
                          <Progress value={authenticityScore} className="h-2" />
                          <Badge variant="outline" className={color.replace('text-', 'border-')}>
                            {level}
                          </Badge>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">Atualize os dados para calcular</p>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Follower/Following Ratio Card */}
            <Card className="border-blue-500/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Proporção Seguidores</p>
                    <p className="text-xs text-muted-foreground">Seguidores vs Seguindo</p>
                  </div>
                </div>
                {(() => {
                  const followers = data.instagram?.profile?.followers || 0;
                  const following = data.instagram?.profile?.following || 1;
                  const ratio = followers / Math.max(following, 1);
                  const isHealthy = ratio >= 2;
                  const isExcellent = ratio >= 10;
                  return (
                    <div className="space-y-2">
                      <div className="flex items-end gap-2">
                        <span className={`text-3xl font-bold ${isExcellent ? 'text-green-600' : isHealthy ? 'text-blue-600' : 'text-amber-600'}`}>
                          {ratio.toFixed(1)}x
                        </span>
                        <span className="text-sm text-muted-foreground mb-1">mais seguidores</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatNumber(followers)} seguidores</span>
                        <span>/</span>
                        <span>{formatNumber(following)} seguindo</span>
                      </div>
                      <Badge variant="outline" className={isExcellent ? 'border-green-500 text-green-600' : isHealthy ? 'border-blue-500 text-blue-600' : 'border-amber-500 text-amber-600'}>
                        {isExcellent ? 'Influenciador Estabelecido' : isHealthy ? 'Proporção Saudável' : 'Em Crescimento'}
                      </Badge>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Community Engagement Health */}
            <Card className="border-purple-500/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <MessageCircle className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Saúde da Comunidade</p>
                    <p className="text-xs text-muted-foreground">Qualidade das interações</p>
                  </div>
                </div>
                {(() => {
                  const totalLikes = data.instagram?.stats?.totalLikes || 0;
                  const totalComments = data.instagram?.stats?.totalComments || 0;
                  const hasComments = totalComments > 0;
                  const likeToCommentRatio = hasComments ? totalLikes / totalComments : 0;
                  const isBalanced = hasComments && likeToCommentRatio >= 5 && likeToCommentRatio <= 50;
                  const hasHighEngagement = hasComments && likeToCommentRatio <= 30;
                  return (
                    <div className="space-y-2">
                      <div className="flex items-end gap-2">
                        <span className={`text-3xl font-bold ${hasHighEngagement ? 'text-purple-600' : 'text-muted-foreground'}`}>
                          {hasComments ? `${likeToCommentRatio.toFixed(0)}:1` : '--'}
                        </span>
                        <span className="text-sm text-muted-foreground mb-1">curtidas/comentário</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatNumber(totalLikes)} curtidas</span>
                        <span>/</span>
                        <span>{formatNumber(totalComments)} comentários</span>
                      </div>
                      <Badge variant="outline" className={isBalanced ? 'border-purple-500 text-purple-600' : 'border-muted'}>
                        {!hasComments ? 'Sem dados' : isBalanced ? 'Comunidade Ativa' : likeToCommentRatio > 50 ? 'Mais Interações Necessárias' : 'Muito Engajada'}
                      </Badge>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Platform Comparison Section */}
          {data.tiktok?.profile && (
            <>
              <Separator className="my-4" />
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-primary" />
                Comparativo de Plataformas
              </h2>
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {/* Followers Comparison */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Seguidores</span>
                        <span className="font-medium">
                          {formatNumber((data.instagram?.profile?.followers || 0) + (data.tiktok?.profile?.followers || 0))} total
                        </span>
                      </div>
                      <div className="flex h-8 rounded-lg overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white text-xs font-medium transition-all"
                          style={{ 
                            width: `${((data.instagram?.profile?.followers || 0) / Math.max((data.instagram?.profile?.followers || 0) + (data.tiktok?.profile?.followers || 0), 1)) * 100}%`,
                            minWidth: '60px'
                          }}
                        >
                          <Instagram className="h-3 w-3 mr-1" />
                          {formatNumber(data.instagram?.profile?.followers)}
                        </div>
                        <div 
                          className="bg-gradient-to-r from-gray-800 to-gray-600 flex items-center justify-center text-white text-xs font-medium transition-all"
                          style={{ 
                            width: `${((data.tiktok?.profile?.followers || 0) / Math.max((data.instagram?.profile?.followers || 0) + (data.tiktok?.profile?.followers || 0), 1)) * 100}%`,
                            minWidth: '60px'
                          }}
                        >
                          <TikTokIcon className="h-3 w-3 mr-1" />
                          {formatNumber(data.tiktok?.profile?.followers)}
                        </div>
                      </div>
                    </div>

                    {/* Engagement Comparison */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Taxa de Engajamento</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
                          <div className="flex items-center gap-2 mb-1">
                            <Instagram className="h-4 w-4 text-pink-500" />
                            <span className="text-sm">Instagram</span>
                          </div>
                          <p className="text-2xl font-bold text-pink-600">
                            {data.instagram?.profile?.engagementRate || '0%'}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-gray-500/10 border border-gray-500/20">
                          <div className="flex items-center gap-2 mb-1">
                            <TikTokIcon className="h-4 w-4" />
                            <span className="text-sm">TikTok</span>
                          </div>
                          <p className="text-2xl font-bold">
                            {data.tiktok?.profile?.engagementRate || '0%'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Content Volume Comparison */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Volume de Conteúdo</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                          <p className="text-2xl font-bold">{formatNumber(data.instagram?.profile?.postsCount)}</p>
                          <p className="text-xs text-muted-foreground">Posts no Instagram</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                          <p className="text-2xl font-bold">{formatNumber(data.tiktok?.profile?.videos)}</p>
                          <p className="text-xs text-muted-foreground">Vídeos no TikTok</p>
                        </div>
                      </div>
                    </div>

                    {/* Platform Recommendation */}
                    {(() => {
                      const igEngagement = parseFloat(data.instagram?.profile?.engagementRate || '0');
                      const ttEngagement = parseFloat(data.tiktok?.profile?.engagementRate || '0');
                      const igFollowers = data.instagram?.profile?.followers || 0;
                      const ttFollowers = data.tiktok?.profile?.followers || 0;
                      
                      let recommendation = '';
                      let platform = '';
                      let icon = null;
                      
                      if (igEngagement > ttEngagement && igFollowers > ttFollowers) {
                        recommendation = 'Seu Instagram está mais forte. Continue investindo nessa plataforma e use o TikTok para diversificar.';
                        platform = 'Instagram';
                        icon = <Instagram className="h-4 w-4 text-pink-500" />;
                      } else if (ttEngagement > igEngagement && ttFollowers > igFollowers) {
                        recommendation = 'Seu TikTok está performando melhor. Considere investir mais tempo em conteúdo de vídeo curto.';
                        platform = 'TikTok';
                        icon = <TikTokIcon className="h-4 w-4" />;
                      } else if (igEngagement > ttEngagement) {
                        recommendation = 'Seu engajamento é maior no Instagram. Foque em manter essa comunidade ativa enquanto cresce o TikTok.';
                        platform = 'Instagram (engajamento)';
                        icon = <Instagram className="h-4 w-4 text-pink-500" />;
                      } else {
                        recommendation = 'Suas plataformas estão equilibradas. Continue investindo em ambas para diversificar sua audiência.';
                        platform = 'Ambas';
                        icon = <Activity className="h-4 w-4 text-primary" />;
                      }
                      
                      return (
                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 mt-2">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="h-4 w-4 text-primary" />
                            <span className="font-medium text-sm">Análise Estratégica</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{recommendation}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {icon}
                            <Badge variant="secondary">{platform}</Badge>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Growth Velocity Section */}
          <Separator className="my-4" />
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-primary" />
            Velocidade de Crescimento
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Growth Metrics Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Métricas de Crescimento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${growthMetrics.trend === 'up' ? 'bg-green-500/10' : growthMetrics.trend === 'down' ? 'bg-red-500/10' : 'bg-muted'}`}>
                        {growthMetrics.trend === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : growthMetrics.trend === 'down' ? (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        ) : (
                          <Activity className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">Crescimento de Seguidores</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedPeriod === '7d' ? 'Últimos 7 dias' : selectedPeriod === '30d' ? 'Últimos 30 dias' : 'Últimos 90 dias'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${growthMetrics.followersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {growthMetrics.followersChange >= 0 ? '+' : ''}{formatNumber(growthMetrics.followersChange)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {growthMetrics.followersChangePercent >= 0 ? '+' : ''}{growthMetrics.followersChangePercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${growthMetrics.engagementChange >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                        <Heart className={`h-4 w-4 ${growthMetrics.engagementChange >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Variação do Engajamento</p>
                        <p className="text-xs text-muted-foreground">Pontos percentuais</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${growthMetrics.engagementChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {growthMetrics.engagementChange >= 0 ? '+' : ''}{growthMetrics.engagementChange.toFixed(2)}pp
                      </p>
                    </div>
                  </div>

                  {(() => {
                    const dailyGrowth = growthMetrics.followersChange / (selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90);
                    const projectedMonthly = dailyGrowth * 30;
                    const projectedYearly = dailyGrowth * 365;
                    const currentFollowers = (data.instagram?.profile?.followers || 0) + (data.tiktok?.profile?.followers || 0);
                    
                    return (
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <p className="text-xs text-muted-foreground mb-2">Projeção de Crescimento (mantendo ritmo atual)</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium">Em 1 mês</p>
                            <p className="text-lg font-bold text-primary">
                              {formatNumber(Math.round(currentFollowers + projectedMonthly))}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              +{formatNumber(Math.round(projectedMonthly))} seguidores
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Em 1 ano</p>
                            <p className="text-lg font-bold text-primary">
                              {formatNumber(Math.round(currentFollowers + projectedYearly))}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              +{formatNumber(Math.round(projectedYearly))} seguidores
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Benchmark Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Benchmark do Setor</CardTitle>
                <CardDescription className="text-xs">Como você se compara com outros criadores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    const followers = (data.instagram?.profile?.followers || 0);
                    const engagement = parseFloat(data.instagram?.profile?.engagementRate || '0');
                    
                    const tier = followers < 10000 ? 'Nano' : followers < 100000 ? 'Micro' : followers < 500000 ? 'Mid-Tier' : 'Macro';
                    const tierBenchmarks = {
                      'Nano': { avgEngagement: 5.0, goodEngagement: 7.0, description: 'Até 10K seguidores' },
                      'Micro': { avgEngagement: 3.5, goodEngagement: 5.0, description: '10K - 100K seguidores' },
                      'Mid-Tier': { avgEngagement: 2.5, goodEngagement: 3.5, description: '100K - 500K seguidores' },
                      'Macro': { avgEngagement: 1.5, goodEngagement: 2.5, description: '500K+ seguidores' },
                    };
                    
                    const benchmark = tierBenchmarks[tier as keyof typeof tierBenchmarks];
                    const isAboveAverage = engagement >= benchmark.avgEngagement;
                    const isExcellent = engagement >= benchmark.goodEngagement;
                    
                    return (
                      <>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Seu Tier</span>
                            <Badge variant="secondary">{tier}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{benchmark.description}</p>
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Seu engajamento vs média do tier</span>
                          </div>
                          <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="absolute left-0 top-0 h-full bg-muted-foreground/30"
                              style={{ width: '100%' }}
                            />
                            <div 
                              className={`absolute left-0 top-0 h-full ${isExcellent ? 'bg-green-500' : isAboveAverage ? 'bg-blue-500' : 'bg-amber-500'}`}
                              style={{ width: `${Math.min((engagement / benchmark.goodEngagement) * 100, 100)}%` }}
                            />
                            <div 
                              className="absolute top-0 h-full w-0.5 bg-white"
                              style={{ left: `${(benchmark.avgEngagement / benchmark.goodEngagement) * 100}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                            <span>0%</span>
                            <span>Média: {benchmark.avgEngagement}%</span>
                            <span>Top: {benchmark.goodEngagement}%</span>
                          </div>
                        </div>
                        
                        <div className={`p-3 rounded-lg ${isExcellent ? 'bg-green-500/10 border border-green-500/20' : isAboveAverage ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            {isExcellent ? (
                              <Award className="h-4 w-4 text-green-500" />
                            ) : isAboveAverage ? (
                              <ThumbsUp className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Target className="h-4 w-4 text-amber-500" />
                            )}
                            <span className="font-medium text-sm">
                              {isExcellent ? 'Top Performer!' : isAboveAverage ? 'Acima da Média' : 'Em Desenvolvimento'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {isExcellent 
                              ? 'Seu engajamento está entre os melhores do seu tier. Continue assim!' 
                              : isAboveAverage 
                                ? 'Você está acima da média. Foque em interações para subir ainda mais.'
                                : 'Há espaço para melhorar. Invista em conteúdo que gere conversas.'}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Posts Section */}
          {allPosts.length > 0 && (
            <>
              <Separator className="my-4" />
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                Top 3 Posts com Maior Engajamento
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {[...allPosts]
                  .sort((a, b) => ((b.likes || 0) + (b.comments || 0)) - ((a.likes || 0) + (a.comments || 0)))
                  .slice(0, 3)
                  .map((post, idx) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Card 
                        className="overflow-hidden relative cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                        onClick={() => handlePostClick(post)}
                      >
                        <div className="absolute top-2 left-2 z-10">
                          <Badge variant="default" className={idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-gray-400' : 'bg-amber-700'}>
                            #{idx + 1}
                          </Badge>
                        </div>
                        <div className="absolute top-2 right-2 z-10">
                          <Badge variant="secondary" className="bg-primary/90 text-white text-xs">
                            <Brain className="h-3 w-3 mr-1" />
                            Ver Análise
                          </Badge>
                        </div>
                        <div className="aspect-square bg-muted relative">
                          {post.thumbnailUrl ? (
                            <img 
                              src={post.thumbnailUrl} 
                              alt="" 
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full flex items-center justify-center absolute inset-0 fallback-icon ${post.thumbnailUrl ? 'hidden' : ''}`}>
                            {post.platform === 'instagram' ? (
                              <Instagram className="h-10 w-10 text-muted-foreground/50" />
                            ) : (
                              <TikTokIcon className="h-10 w-10 text-muted-foreground/50" />
                            )}
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 z-10">
                            <div className="flex items-center gap-4 text-white text-sm">
                              <span className="flex items-center gap-1">
                                <Heart className="h-4 w-4" /> {formatNumber(post.likes)}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="h-4 w-4" /> {formatNumber(post.comments)}
                              </span>
                              {post.views && (
                                <span className="flex items-center gap-1">
                                  <Eye className="h-4 w-4" /> {formatNumber(post.views)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {post.platform === 'instagram' ? (
                                <Instagram className="h-4 w-4 text-pink-500" />
                              ) : (
                                <TikTokIcon className="h-4 w-4" />
                              )}
                              <Badge variant="outline">{post.engagementRate || '0%'}</Badge>
                            </div>
                            <a href={post.postUrl} target="_blank" rel="noopener noreferrer">
                              <Badge variant="secondary" className="cursor-pointer">
                                <ExternalLink className="h-3 w-3" />
                              </Badge>
                            </a>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
              </div>
            </>
          )}

          {/* Insights Section */}
          {insights.length > 0 && (
            <>
              <Separator className="my-6" />
              <div data-testid="insights-section" className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Insights & Recomendações</h3>
                    <p className="text-sm text-muted-foreground">Dicas personalizadas baseadas nos seus dados</p>
                  </div>
                </div>
                
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {insights.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`relative overflow-hidden rounded-xl p-4 border backdrop-blur-sm ${
                        insight.type === 'success' 
                          ? 'bg-gradient-to-br from-emerald-500/5 to-green-500/10 border-emerald-500/20' 
                          : insight.type === 'warning'
                          ? 'bg-gradient-to-br from-amber-500/5 to-orange-500/10 border-amber-500/20'
                          : 'bg-gradient-to-br from-blue-500/5 to-indigo-500/10 border-blue-500/20'
                      }`}
                    >
                      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl ${
                        insight.type === 'success' 
                          ? 'bg-emerald-500/10' 
                          : insight.type === 'warning'
                          ? 'bg-amber-500/10'
                          : 'bg-blue-500/10'
                      }`} />
                      <div className="relative flex items-start gap-3">
                        <div className={`p-2 rounded-lg shrink-0 ${
                          insight.type === 'success' 
                            ? 'bg-emerald-500/10' 
                            : insight.type === 'warning'
                            ? 'bg-amber-500/10'
                            : 'bg-blue-500/10'
                        }`}>
                          {insight.type === 'success' ? (
                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                          ) : insight.type === 'warning' ? (
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                          ) : (
                            <Zap className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                        <p className="text-sm text-foreground/90 leading-relaxed">
                          {insight.message}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Posts Section - moved from posts tab */}
          <Separator className="my-6" />
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <LayoutGrid className="h-5 w-5 text-primary" />
            Explorar Posts
            <Badge variant="outline" className="ml-2">
              {allPosts.length} posts analisados
            </Badge>
          </h2>
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Clique em um post para ver análise detalhada</CardTitle>
                  <CardDescription>{filteredAndSortedPosts.length} posts {platformFilter !== 'all' ? `do ${platformFilter === 'instagram' ? 'Instagram' : 'TikTok'}` : ''} {searchTerm ? `contendo "${searchTerm}"` : ''}</CardDescription>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por caption ou hashtag..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-full sm:w-[200px]"
                      data-testid="input-search-posts"
                    />
                  </div>
                  <Select value={platformFilter} onValueChange={(v: any) => setPlatformFilter(v)}>
                    <SelectTrigger className="w-full sm:w-[140px]" data-testid="select-platform-filter">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Plataforma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                    <SelectTrigger className="w-full sm:w-[140px]" data-testid="select-sort-by">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Ordenar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Data</SelectItem>
                      <SelectItem value="likes">Curtidas</SelectItem>
                      <SelectItem value="comments">Comentários</SelectItem>
                      <SelectItem value="engagement">Engajamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredAndSortedPosts.map((post, idx) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="group"
                  >
                    <Card 
                      className="overflow-hidden hover:shadow-lg transition-all cursor-pointer hover:ring-2 hover:ring-primary/50"
                      onClick={() => handlePostClick(post)}
                      data-testid={`post-card-${post.id}`}
                    >
                      <div className="relative aspect-square bg-muted">
                        {post.thumbnailUrl ? (
                          <img 
                            src={post.thumbnailUrl} 
                            alt="" 
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center absolute inset-0 fallback-icon ${post.thumbnailUrl ? 'hidden' : ''}`}>
                          {post.platform === 'instagram' ? (
                            <Instagram className="h-10 w-10 text-muted-foreground/50" />
                          ) : (
                            <TikTokIcon className="h-10 w-10 text-muted-foreground/50" />
                          )}
                        </div>
                        <div className="absolute top-2 left-2 flex gap-1">
                          <Badge variant="secondary" className="text-xs">
                            {post.platform === 'instagram' ? (
                              <Instagram className="h-3 w-3 mr-1" />
                            ) : (
                              <TikTokIcon className="h-3 w-3 mr-1" />
                            )}
                            <PostTypeIcon type={post.postType} />
                          </Badge>
                        </div>
                        <a 
                          href={post.postUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Badge variant="secondary" className="cursor-pointer">
                            <ExternalLink className="h-3 w-3" />
                          </Badge>
                        </a>
                        <div className="absolute bottom-2 right-2">
                          <Badge variant="secondary" className="text-xs bg-primary/90 text-white">
                            <Brain className="h-3 w-3 mr-1" />
                            Ver Análise
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Heart className="h-3.5 w-3.5" />
                            <span>{formatNumber(post.likes)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span>{formatNumber(post.comments)}</span>
                          </div>
                          {post.views && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Eye className="h-3.5 w-3.5" />
                              <span>{formatNumber(post.views)}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {post.engagementRate || '0%'} eng.
                          </Badge>
                          {post.postedAt && (
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(post.postedAt), { addSuffix: true, locale: ptBR })}
                            </span>
                          )}
                        </div>
                        {post.caption && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{post.caption}</p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
              {filteredAndSortedPosts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum post encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timing Section - moved from timing tab */}
          <Separator className="my-6" />
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            Melhores Horários para Postar
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Melhores Horários
                </CardTitle>
                <CardDescription>Baseado no engajamento médio dos seus posts</CardDescription>
              </CardHeader>
              <CardContent>
                {bestTimesData.byHour.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={bestTimesData.byHour}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <RechartsTooltip 
                          formatter={(value: number) => [formatNumber(value), 'Engajamento']}
                        />
                        <Bar dataKey="avgEngagement" fill="#8884d8" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Atualize seus dados para ver os melhores horários</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Melhores Dias
                </CardTitle>
                <CardDescription>Dias da semana com melhor performance</CardDescription>
              </CardHeader>
              <CardContent>
                {bestTimesData.byDay.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={bestTimesData.byDay}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <RechartsTooltip 
                          formatter={(value: number) => [formatNumber(value), 'Engajamento']}
                        />
                        <Bar dataKey="avgEngagement" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Atualize seus dados para ver os melhores dias</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {bestTimesData.byHour.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Recomendações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(() => {
                    const topHours = [...bestTimesData.byHour]
                      .sort((a, b) => b.avgEngagement - a.avgEngagement)
                      .slice(0, 3);
                    const topDays = [...bestTimesData.byDay]
                      .sort((a, b) => b.avgEngagement - a.avgEngagement)
                      .slice(0, 2);
                    
                    return (
                      <>
                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="font-medium">Melhor Horário</span>
                          </div>
                          <p className="text-2xl font-bold text-primary">
                            {topHours[0]?.hour || '-'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatNumber(topHours[0]?.avgEngagement || 0)} engajamentos em média
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/10">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-green-500" />
                            <span className="font-medium">Melhor Dia</span>
                          </div>
                          <p className="text-2xl font-bold text-green-600">
                            {topDays[0]?.day || '-'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatNumber(topDays[0]?.avgEngagement || 0)} engajamentos em média
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/10">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="h-4 w-4 text-amber-500" />
                            <span className="font-medium">Horários Alternativos</span>
                          </div>
                          <p className="text-lg font-bold text-amber-600">
                            {topHours.slice(1).map(h => h.hour).join(', ') || '-'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Também apresentam bom desempenho
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-20 w-20 bg-muted rounded-2xl flex items-center justify-center mb-6">
                <Lock className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Em Breve!</h3>
              <p className="text-muted-foreground max-w-md mt-2">
                Aqui você poderá acompanhar o desempenho das suas campanhas com empresas, 
                incluindo métricas de vendas, comissões e engajamento por campanha.
              </p>
              <Badge variant="secondary" className="mt-4">
                <Sparkles className="h-3 w-3 mr-1" />
                Funcionalidade em desenvolvimento
              </Badge>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Post Detail Drawer */}
      <Sheet open={isPostDrawerOpen} onOpenChange={(open) => {
        setIsPostDrawerOpen(open);
        if (!open) {
          setSelectedPost(null);
        }
      }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto" data-testid="post-detail-drawer">
          {selectedPost && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center gap-2">
                  {selectedPost.platform === 'instagram' ? (
                    <Instagram className="h-5 w-5 text-pink-500" />
                  ) : (
                    <TikTokIcon className="h-5 w-5" />
                  )}
                  Análise do Post
                </SheetTitle>
                <SheetDescription>
                  {selectedPost.postedAt && format(new Date(selectedPost.postedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </SheetDescription>
              </SheetHeader>

              {/* Post Preview */}
              <div className="mb-6">
                <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
                  {selectedPost.thumbnailUrl ? (
                    <img 
                      src={selectedPost.thumbnailUrl} 
                      alt="" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
                {selectedPost.caption && (
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{selectedPost.caption}</p>
                )}
                <a 
                  href={selectedPost.postUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Ver post original <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Tab Navigation */}
              <div className="flex gap-1 mb-6 p-1 bg-muted rounded-lg">
                <button
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                    aiInsightTab === 'metrics' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                  }`}
                  onClick={() => setAiInsightTab('metrics')}
                  data-testid="tab-metrics"
                >
                  <BarChart3 className="h-4 w-4 inline mr-1" />
                  Métricas
                </button>
                <button
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                    aiInsightTab === 'comments' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                  }`}
                  onClick={() => setAiInsightTab('comments')}
                  data-testid="tab-comments"
                >
                  <MessageCircle className="h-4 w-4 inline mr-1" />
                  Comentários
                </button>
                <button
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                    aiInsightTab === 'ai' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                  }`}
                  onClick={() => setAiInsightTab('ai')}
                  data-testid="tab-ai"
                >
                  <Brain className="h-4 w-4 inline mr-1" />
                  IA
                </button>
              </div>

              {/* Metrics Tab */}
              {aiInsightTab === 'metrics' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Heart className="h-4 w-4 text-pink-500" />
                          <span className="text-xs text-muted-foreground">Curtidas</span>
                        </div>
                        <p className="text-2xl font-bold">{formatNumber(selectedPost.likes)}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageCircle className="h-4 w-4 text-blue-500" />
                          <span className="text-xs text-muted-foreground">Comentários</span>
                        </div>
                        <p className="text-2xl font-bold">{formatNumber(selectedPost.comments)}</p>
                      </CardContent>
                    </Card>
                    {selectedPost.views && (
                      <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Eye className="h-4 w-4 text-purple-500" />
                            <span className="text-xs text-muted-foreground">Visualizações</span>
                          </div>
                          <p className="text-2xl font-bold">{formatNumber(selectedPost.views)}</p>
                        </CardContent>
                      </Card>
                    )}
                    {selectedPost.shares && (
                      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Share2 className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-muted-foreground">Compartilhamentos</span>
                          </div>
                          <p className="text-2xl font-bold">{formatNumber(selectedPost.shares)}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Taxa de Engajamento</span>
                        <Badge variant="outline" className="text-lg font-bold">
                          {selectedPost.engagementRate || '0%'}
                        </Badge>
                      </div>
                      <Progress value={parseFloat(selectedPost.engagementRate || '0') * 10} className="h-2" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        Horário de Publicação
                      </h4>
                      {selectedPost.postedAt && (
                        <div className="text-sm text-muted-foreground">
                          <p>Dia: {format(new Date(selectedPost.postedAt), 'EEEE', { locale: ptBR })}</p>
                          <p>Horário: {format(new Date(selectedPost.postedAt), 'HH:mm')}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Comments Tab */}
              {aiInsightTab === 'comments' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-primary" />
                        Comentários do Post
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-3 bg-muted rounded-lg text-center">
                          <p className="text-2xl font-bold">{formatNumber(selectedPost.comments)}</p>
                          <p className="text-xs text-muted-foreground">Total de Comentários</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg text-center">
                          <p className="text-2xl font-bold">
                            {selectedPost.likes && selectedPost.comments 
                              ? (selectedPost.comments / selectedPost.likes * 100).toFixed(2) + '%'
                              : '0%'}
                          </p>
                          <p className="text-xs text-muted-foreground">Taxa de Comentários</p>
                        </div>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-2">
                          <Brain className="h-4 w-4 text-blue-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Análise na aba IA</p>
                            <p className="text-xs text-blue-600 dark:text-blue-500">Vá para a aba IA para ver análise detalhada dos comentários, incluindo sentimento e principais temas.</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {selectedPost.mentions && selectedPost.mentions.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          Menções no Post
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {selectedPost.mentions.map((mention, i) => (
                            <Badge key={i} variant="outline" className="text-sm">
                              @{mention}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              )}

              {/* AI Insights Tab */}
              {aiInsightTab === 'ai' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {isLoadingInsight ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                      <p className="text-sm text-muted-foreground">Carregando análise de IA...</p>
                    </div>
                  ) : postAiInsight ? (
                    <>
                      {postAiInsight.contentScore && (
                        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium flex items-center gap-2">
                                <Award className="h-4 w-4 text-primary" />
                                Score de Conteúdo
                              </span>
                              <span className="text-3xl font-bold text-primary">{postAiInsight.contentScore}/100</span>
                            </div>
                            <Progress value={postAiInsight.contentScore} className="h-2" />
                          </CardContent>
                        </Card>
                      )}

                      {postAiInsight.summary && (
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Brain className="h-4 w-4 text-primary" />
                              Resumo
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">{postAiInsight.summary}</p>
                          </CardContent>
                        </Card>
                      )}

                      {/* Viral Potential */}
                      {(postAiInsight as any).viralPotential > 0 && (
                        <Card className="border-purple-200 dark:border-purple-800">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2 text-purple-700 dark:text-purple-400">
                              <TrendingUp className="h-4 w-4" />
                              Potencial Viral
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg text-center min-w-[80px]">
                                <p className="text-2xl font-bold text-purple-600">{(postAiInsight as any).viralPotential}/10</p>
                                <p className="text-xs text-muted-foreground">Score Viral</p>
                              </div>
                              <Progress value={(postAiInsight as any).viralPotential * 10} className="flex-1 h-3" />
                            </div>
                            {(postAiInsight as any).viralAnalysis && (
                              <p className="text-sm text-muted-foreground">{(postAiInsight as any).viralAnalysis}</p>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {/* Hook Text Analysis */}
                      {(postAiInsight as any).hookAnalysis && (
                        <Card className="border-orange-200 dark:border-orange-800">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2 text-orange-700 dark:text-orange-400">
                              <Zap className="h-4 w-4" />
                              Análise do Hook Textual
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">{(postAiInsight as any).hookAnalysis}</p>
                          </CardContent>
                        </Card>
                      )}

                      {/* Storytelling Analysis */}
                      {(postAiInsight as any).storytellingAnalysis && (
                        <Card className="border-indigo-200 dark:border-indigo-800">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                              <BookOpen className="h-4 w-4" />
                              Análise de Storytelling
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">{(postAiInsight as any).storytellingAnalysis}</p>
                          </CardContent>
                        </Card>
                      )}

                      {/* Editing Tips */}
                      {(postAiInsight as any).editingTips && (postAiInsight as any).editingTips.length > 0 && (
                        <Card className="border-cyan-200 dark:border-cyan-800">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2 text-cyan-700 dark:text-cyan-400">
                              <Film className="h-4 w-4" />
                              Dicas de Edição
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {(postAiInsight as any).editingTips.map((tip: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <Video className="h-4 w-4 text-cyan-500 shrink-0 mt-0.5" />
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}

                      {/* Audio/Music Analysis */}
                      {(postAiInsight as any).audioAnalysis && (
                        <Card className="border-rose-200 dark:border-rose-800">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2 text-rose-700 dark:text-rose-400">
                              <Music className="h-4 w-4" />
                              Dicas de Áudio/Música
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">{(postAiInsight as any).audioAnalysis}</p>
                          </CardContent>
                        </Card>
                      )}

                      {/* Retention Analysis */}
                      {(postAiInsight as any).retentionAnalysis && (
                        <Card className="border-teal-200 dark:border-teal-800">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2 text-teal-700 dark:text-teal-400">
                              <TrendingUp className="h-4 w-4" />
                              Análise de Retenção
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">{(postAiInsight as any).retentionAnalysis}</p>
                          </CardContent>
                        </Card>
                      )}

                      {postAiInsight.strengths && postAiInsight.strengths.length > 0 && (
                        <Card className="border-green-200 dark:border-green-800">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2 text-green-700 dark:text-green-400">
                              <ThumbsUp className="h-4 w-4" />
                              Pontos Fortes
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {postAiInsight.strengths.map((strength, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                  <span>{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}

                      {postAiInsight.improvements && postAiInsight.improvements.length > 0 && (
                        <Card className="border-amber-200 dark:border-amber-800">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
                              <Lightbulb className="h-4 w-4" />
                              Sugestões de Melhoria
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {postAiInsight.improvements.map((improvement, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                  <ChevronRight className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                  <span>{improvement}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}

                      {postAiInsight.recommendations && postAiInsight.recommendations.length > 0 && (
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-primary" />
                              Recomendações
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {postAiInsight.recommendations.map((rec, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}

                      {(postAiInsight as any).commentAnalysis && (
                        <Card className="border-blue-200 dark:border-blue-800">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2 text-blue-700 dark:text-blue-400">
                              <MessageCircle className="h-4 w-4" />
                              Análise de Comentários
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="p-2 bg-muted rounded text-center">
                                <p className="text-lg font-bold">{(postAiInsight as any).commentAnalysis.totalComments}</p>
                                <p className="text-xs text-muted-foreground">Comentários</p>
                              </div>
                              <div className="p-2 bg-muted rounded text-center">
                                <p className="text-lg font-bold">{(postAiInsight as any).commentAnalysis.commentRatio}</p>
                                <p className="text-xs text-muted-foreground">Taxa</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Sentimento:</span>
                              <Badge variant={
                                (postAiInsight as any).commentAnalysis.sentiment === 'positivo' ? 'default' : 'secondary'
                              } className={(postAiInsight as any).commentAnalysis.sentiment === 'positivo' ? 'bg-green-500' : ''}>
                                {(postAiInsight as any).commentAnalysis.sentiment}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{(postAiInsight as any).commentAnalysis.analysis}</p>
                            {(postAiInsight as any).commentAnalysis.tips && (
                              <div className="pt-2 border-t">
                                <p className="text-xs font-medium mb-2">Dicas para mais comentários:</p>
                                <ul className="space-y-1">
                                  {(postAiInsight as any).commentAnalysis.tips.map((tip: string, i: number) => (
                                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                                      <span className="text-primary">•</span>
                                      {tip}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}

                    </>
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                        <h4 className="font-medium mb-2">Análise de IA não disponível</h4>
                        <p className="text-sm text-muted-foreground mb-4 max-w-[250px]">
                          Gere uma análise detalhada deste post usando inteligência artificial.
                        </p>
                        <Button
                          onClick={() => generateAiInsightMutation.mutate(selectedPost)}
                          disabled={generateAiInsightMutation.isPending}
                          data-testid="btn-generate-ai-insight"
                        >
                          {generateAiInsightMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4 mr-2" />
                          )}
                          Gerar Análise de IA
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
