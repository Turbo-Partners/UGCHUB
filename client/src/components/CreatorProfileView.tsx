import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Instagram, 
  Youtube, 
  Users,
  Mail,
  MapPin,
  Shield,
  TrendingUp,
  Image as ImageIcon,
  Hash,
  Link2,
  Share2,
  Heart,
  MessageCircle,
  ExternalLink,
  Send,
  BarChart3,
  BadgeCheck,
  Sparkles,
  UserCheck,
  FileText,
  Briefcase,
  Building2,
  CheckCircle2,
  Star,
  Wallet,
  Loader2,
  Bot,
  Phone,
  AlertTriangle,
  Home,
  Copy
} from 'lucide-react';
import type { User, CreatorPost } from '@shared/schema';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getAvatarUrl, getPublicAvatarUrl } from '@/lib/utils';
import StarRating from '@/components/StarRating';
import { InviteToCampaignModal } from '@/components/InviteToCampaignModal';
import { InstagramAvatar } from '@/components/instagram-avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { lazy, Suspense } from 'react';
const CreatorDeepAnalysis = lazy(() => import('@/pages/company/creator-deep-analysis'));

function formatNumber(num: number | null | undefined): string {
  if (!num) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toLocaleString();
}

function formatEngagementRate(rate: string | number | null | undefined): string {
  if (rate === null || rate === undefined) return 'N/A';
  const numRate = typeof rate === 'string' ? parseFloat(rate) : rate;
  if (isNaN(numRate)) return 'N/A';
  return `${numRate.toFixed(1)}%`;
}

function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

const GENERIC_BIOS = [
  'criador de conteúdo e influenciador digital',
  'criador de conteúdo',
  'influenciador digital',
  'content creator',
  'digital influencer',
  'criador(a) de conteúdo',
];

function isGenericBio(bio: string | null | undefined): boolean {
  if (!bio) return false;
  const normalized = bio.trim().toLowerCase().replace(/\.$/, '');
  return GENERIC_BIOS.some(g => normalized === g);
}

function hasValidInstagramData(creator: User): boolean {
  if (!creator.instagram) return false;
  if (!creator.instagramFollowers && !creator.instagramPosts) return false;
  return true;
}

type CompletedJob = {
  id: number;
  campaignTitle: string;
  companyName: string;
  companyLogo: string | null;
  completedAt: string;
  payment?: number | null;
};

type CommunityMembership = {
  id: number;
  companyId: number;
  companyName: string;
  companyLogo: string | null;
  status: string;
  joinedAt: string | null;
  tierName: string | null;
  points: number;
};

type RatingData = {
  average: number;
  count: number;
};

interface CreatorProfileViewProps {
  creator: User;
  creatorPosts?: CreatorPost[];
  completedJobs?: CompletedJob[];
  communities?: CommunityMembership[];
  ratingData?: RatingData;
  isPublic?: boolean;
  backUrl?: string;
  backLabel?: string;
}

export default function CreatorProfileView({
  creator,
  creatorPosts = [],
  completedJobs = [],
  communities = [],
  ratingData,
  isPublic = false,
  backUrl = '/creators',
  backLabel = 'Voltar para Banco de Talentos'
}: CreatorProfileViewProps) {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CreatorPost | null>(null);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [failedThumbs, setFailedThumbs] = useState<Set<number>>(new Set());

  const avatarUrl = isPublic ? getPublicAvatarUrl(creator.avatar) : getAvatarUrl(creator.avatar);

  const handleShareProfile = async () => {
    const publicUrl = `${window.location.origin}/public/creator/${creator.id}`;
    
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast({
        title: "Link copiado!",
        description: "O link do perfil público foi copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link.",
        variant: "destructive"
      });
    }
  };

  const handleOpenPost = (post: CreatorPost) => {
    setSelectedPost(post);
    setAiAnalysis((post as any).aiAnalysis || null);
    setPostModalOpen(true);
  };

  const handleAnalyzePost = async () => {
    if (!selectedPost || isPublic) return;
    
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/ai/analyze-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          postId: selectedPost.id,
          caption: selectedPost.caption,
          likes: selectedPost.likes,
          comments: selectedPost.comments,
          views: selectedPost.views,
          engagementRate: selectedPost.engagementRate,
          hashtags: selectedPost.hashtags,
          postType: selectedPost.postType,
          creatorName: creator?.name,
          creatorFollowers: creator?.instagramFollowers,
        }),
      });
      
      if (!res.ok) throw new Error('Falha na análise');
      const data = await res.json();
      setAiAnalysis(data.analysis);
    } catch (error) {
      toast({
        title: "Erro na análise",
        description: "Não foi possível analisar o post com IA.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const [communityInviting, setCommunityInviting] = useState(false);
  const handleInviteCommunity = async () => {
    setCommunityInviting(true);
    try {
      const res = await fetch('/api/community/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ creatorId: creator.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast({ title: data.error || "Erro ao enviar convite. Verifique se você tem uma empresa selecionada.", variant: "destructive" });
        return;
      }
      toast({ title: "Convite para comunidade enviado!" });
    } catch {
      toast({ title: "Erro ao enviar convite", variant: "destructive" });
    } finally {
      setCommunityInviting(false);
    }
  };

  const authenticityScore = creator.instagramAuthenticityScore || 0;
  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-green-500', text: 'text-green-700', label: 'Excelente', badge: 'bg-green-100 text-green-700 border-green-200' };
    if (score >= 60) return { bg: 'bg-blue-500', text: 'text-blue-700', label: 'Bom', badge: 'bg-blue-100 text-blue-700 border-blue-200' };
    if (score >= 40) return { bg: 'bg-yellow-500', text: 'text-yellow-700', label: 'Regular', badge: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
    return { bg: 'bg-red-500', text: 'text-red-700', label: 'Baixo', badge: 'bg-red-100 text-red-700 border-red-200' };
  };
  const scoreStyle = getScoreColor(authenticityScore);

  const invalidProfile = creator.instagram && !hasValidInstagramData(creator);
  const genericBio = isGenericBio(creator.bio);

  const hasContactInfo = !isPublic && (creator.pixKey || creator.email || creator.phone || creator.cep);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        {!isPublic && (
          <Button 
            variant="ghost" 
            onClick={() => navigate(backUrl)} 
            className="pl-0 hover:pl-2 transition-all"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Button>
        )}
        {isPublic && <div />}
        
        <div className="flex items-center gap-2">
          {!isPublic && (
            <Button 
              onClick={() => setInviteModalOpen(true)}
              className="shadow-sm"
              data-testid="button-invite-campaign"
            >
              <Send className="mr-2 h-4 w-4" />
              Convidar para campanha
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={handleShareProfile}
            className="shadow-sm"
            data-testid="button-share-profile"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Compartilhar perfil
          </Button>
        </div>
      </div>

      {invalidProfile && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800" data-testid="warning-invalid-profile">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">Dados do Instagram não verificados</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Não foi possível verificar a conta <strong>@{creator.instagram?.replace('@', '')}</strong> no Instagram. 
              O perfil pode não existir, estar privado ou ter sido alterado. Os dados exibidos podem estar desatualizados.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500" />
            <CardContent className="pt-0 px-6 pb-6">
              <div className="flex flex-col sm:flex-row gap-4 -mt-12">
                {creator.instagram ? (
                  <InstagramAvatar
                    username={creator.instagram}
                    initialPicUrl={avatarUrl}
                    size="xl"
                    className="h-28 w-28 border-4 border-background shadow-xl"
                  />
                ) : (
                  <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-pink-500 to-purple-600 text-white">
                      {creator.name[0]}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className="flex-1 pt-14 sm:pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold">{creator.name}</h1>
                        {creator.instagramVerified && (
                          <BadgeCheck className="h-5 w-5 text-blue-500 fill-blue-500" />
                        )}
                      </div>
                      {creator.instagram && (
                        <a 
                          href={`https://instagram.com/${creator.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-pink-600 transition-colors flex items-center gap-1"
                        >
                          <Instagram className="h-4 w-4" />
                          @{creator.instagram.replace('@', '')}
                        </a>
                      )}
                      {creator.city && creator.state && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {creator.city}, {creator.state}
                        </p>
                      )}
                    </div>
                    
                    {creator.niche && creator.niche.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        {creator.niche.map((n, i) => (
                          <Badge key={i} className="bg-primary/10 text-primary border-0">
                            {n}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {!invalidProfile && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                  <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 rounded-xl p-4 text-center border border-pink-100 dark:border-pink-900/50">
                    <Users className="h-5 w-5 text-pink-600 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-pink-900 dark:text-pink-100">
                      {formatNumber(creator.instagramFollowers)}
                    </div>
                    <div className="text-xs text-pink-700 dark:text-pink-300 font-medium">Seguidores</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 rounded-xl p-4 text-center border border-purple-100 dark:border-purple-900/50">
                    <UserCheck className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      {formatNumber(creator.instagramFollowing)}
                    </div>
                    <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">Seguindo</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-xl p-4 text-center border border-blue-100 dark:border-blue-900/50">
                    <ImageIcon className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {formatNumber(creator.instagramPosts)}
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">Posts</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl p-4 text-center border border-green-100 dark:border-green-900/50">
                    <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {formatEngagementRate(creator.instagramEngagementRate)}
                    </div>
                    <div className="text-xs text-green-700 dark:text-green-300 font-medium">Engajamento</div>
                  </div>
                </div>
              )}

              <Tabs defaultValue="sobre" className="mt-6 pt-6 border-t">
                <TabsList className="mb-4">
                  <TabsTrigger value="sobre" data-testid="tab-sobre">
                    <FileText className="h-4 w-4 mr-1.5" />
                    Sobre
                  </TabsTrigger>
                  {!isPublic && (
                    <TabsTrigger value="analise" data-testid="tab-analise-profunda">
                      <BarChart3 className="h-4 w-4 mr-1.5" />
                      Análise Profunda
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="sobre" className="space-y-0">
                  {creator.bio && !genericBio && (
                    <div className="mb-4">
                      <h4 className="font-medium flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Sobre
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {creator.bio}
                      </p>
                    </div>
                  )}

                  {genericBio && (
                    <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-dashed">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Bio genérica detectada — o criador ainda não personalizou sua bio.
                      </p>
                    </div>
                  )}

                  {creator.portfolioUrl && (
                    <div className="mb-4 pt-4 border-t">
                      <h4 className="font-medium flex items-center gap-2 mb-2">
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                        Mídia Kit
                      </h4>
                      <a 
                        href={creator.portfolioUrl.startsWith('http') ? creator.portfolioUrl : `https://${creator.portfolioUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
                        data-testid="link-media-kit"
                      >
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                          <Link2 className="h-4 w-4 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">Mídia Kit</p>
                          <p className="text-xs text-muted-foreground truncate">{creator.portfolioUrl}</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </a>
                    </div>
                  )}

                  {!invalidProfile && creator.instagramTopHashtags && creator.instagramTopHashtags.length > 0 && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium flex items-center gap-2 mb-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        Top Hashtags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {creator.instagramTopHashtags.slice(0, 10).map((tag, i) => (
                          <Badge key={i} variant="secondary" className="bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {completedJobs && completedJobs.length > 0 && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium flex items-center gap-2 mb-3">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        Campanhas Concluídas
                        <Badge variant="secondary" className="ml-1">{completedJobs.length}</Badge>
                      </h4>
                      <div className="space-y-2">
                        {completedJobs.slice(0, 5).map((job) => (
                          <div 
                            key={job.id}
                            className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                            data-testid={`card-completed-job-${job.id}`}
                          >
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={job.companyLogo ? getAvatarUrl(job.companyLogo) : undefined} />
                              <AvatarFallback className="bg-amber-100 text-amber-700 text-xs">
                                {job.companyName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{job.campaignTitle}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {job.companyName}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Concluído
                              </div>
                              {job.completedAt && (
                                <p className="text-xs text-muted-foreground">
                                  {new Date(job.completedAt).toLocaleDateString('pt-BR')}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {communities && communities.length > 0 && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium flex items-center gap-2 mb-3">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        Comunidades
                        <Badge variant="secondary" className="ml-1">{communities.length}</Badge>
                      </h4>
                      <div className="space-y-2">
                        {communities.map((community) => (
                          <div 
                            key={community.id}
                            className="flex items-center gap-3 p-3 rounded-lg border bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20"
                            data-testid={`card-community-${community.id}`}
                          >
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={community.companyLogo ? getAvatarUrl(community.companyLogo) : undefined} />
                              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
                                {community.companyName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{community.companyName}</p>
                              <div className="flex items-center gap-2">
                                {community.tierName && (
                                  <Badge variant="outline" className="text-xs">
                                    {community.tierName}
                                  </Badge>
                                )}
                                {community.points > 0 && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                    {community.points} pts
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={community.status === 'active' ? 'bg-green-50 text-green-700 border-green-200 text-xs' : 'bg-gray-50 text-gray-600 text-xs'}
                            >
                              {community.status === 'active' ? 'Ativo' : community.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {!isPublic && (
                  <TabsContent value="analise" className="space-y-4">
                    <Suspense fallback={
                      <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="mt-4 text-sm text-muted-foreground">Carregando análise...</p>
                      </div>
                    }>
                      <CreatorDeepAnalysis embeddedCreatorId={creator.id} embedded={true} />
                    </Suspense>
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>

          {!invalidProfile && creatorPosts && creatorPosts.length > 0 && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-pink-600" />
                  Top Posts
                  <Badge variant="secondary" className="ml-2">{creatorPosts.length} posts</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {creatorPosts.slice(0, 6).map((post, i) => {
                    const hasThumb = !!post.thumbnailUrl;
                    const isVideo = post.postType === 'video' || post.postType === 'reel';
                    return (
                      <div
                        key={post.id}
                        className="group rounded-xl overflow-hidden bg-muted shadow-sm border hover:shadow-md transition-all cursor-pointer"
                        data-testid={`card-top-post-${i}`}
                        onClick={() => handleOpenPost(post)}
                      >
                        <div className="relative aspect-square">
                          {hasThumb && !failedThumbs.has(post.id) ? (
                            <img
                              src={post.thumbnailUrl!}
                              alt={post.caption?.slice(0, 50) || `Top post ${i + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              loading="lazy"
                              onError={() => {
                                setFailedThumbs(prev => new Set(prev).add(post.id));
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 gap-2">
                              {isVideo ? (
                                <>
                                  <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-full">
                                    <Sparkles className="h-6 w-6 text-pink-600" />
                                  </div>
                                  <span className="text-xs text-muted-foreground font-medium">
                                    {post.postType === 'reel' ? 'Reel' : 'Vídeo'}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                    <ImageIcon className="h-6 w-6 text-blue-600" />
                                  </div>
                                  <span className="text-xs text-muted-foreground font-medium">
                                    {post.postType === 'carousel' ? 'Carrossel' : 'Imagem'}
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                          {(post as any).aiAnalysis && (
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-purple-600/90 text-white text-xs border-0">
                                <Bot className="h-3 w-3 mr-1" />
                                Analisado
                              </Badge>
                            </div>
                          )}
                          {!isPublic && !(post as any).aiAnalysis && (
                            <div className="absolute top-2 right-2 flex gap-1">
                              <Badge className="bg-black/60 text-white text-xs">
                                <Bot className="h-3 w-3 mr-1" />
                                Analisar
                              </Badge>
                            </div>
                          )}
                          <a
                            href={post.postUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute bottom-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-black/80"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3 w-3 text-white" />
                          </a>
                        </div>
                        <div className="p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1 text-pink-600">
                                <Heart className="h-4 w-4 fill-pink-600" />
                                {formatNumber(post.likes)}
                              </span>
                              <span className="flex items-center gap-1 text-blue-600">
                                <MessageCircle className="h-4 w-4" />
                                {formatNumber(post.comments)}
                              </span>
                              {post.views && post.views > 0 && (
                                <span className="flex items-center gap-1 text-gray-600">
                                  <TrendingUp className="h-4 w-4" />
                                  {formatNumber(post.views)}
                                </span>
                              )}
                            </div>
                            {post.engagementRate && (
                              <Badge variant="outline" className="text-xs">
                                {post.engagementRate}
                              </Badge>
                            )}
                          </div>
                          {post.caption && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {post.caption}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          {/* Sidebar profile avatar */}
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              {creator.instagram ? (
                <InstagramAvatar
                  username={creator.instagram}
                  initialPicUrl={avatarUrl}
                  size="xl"
                  className="h-20 w-20 border-2 border-primary/20 shadow-md"
                />
              ) : (
                <Avatar className="h-20 w-20 border-2 border-primary/20 shadow-md">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-pink-500 to-purple-600 text-white">
                    {creator.name[0]}
                  </AvatarFallback>
                </Avatar>
              )}
              <h3 className="font-semibold mt-3">{creator.name}</h3>
              {creator.instagram && (
                <p className="text-sm text-muted-foreground">@{creator.instagram.replace('@', '')}</p>
              )}
              {ratingData && ratingData.count > 0 && (
                <div className="mt-2">
                  <StarRating 
                    rating={ratingData.average} 
                    count={ratingData.count} 
                    size="sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Social Networks */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Instagram className="h-5 w-5 text-pink-600" />
                Redes Sociais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {creator.instagram && (
                <a 
                  href={`https://instagram.com/${creator.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 hover:from-pink-100 hover:to-purple-100 dark:hover:from-pink-950/50 dark:hover:to-purple-950/50 transition-colors group"
                  data-testid="link-instagram"
                >
                  <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg text-white">
                    <Instagram className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Instagram</p>
                    <p className="text-sm text-muted-foreground">@{creator.instagram.replace('@', '')}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              )}

              {creator.youtube && (
                <a 
                  href={creator.youtube.startsWith('http') ? creator.youtube : `https://youtube.com/@${creator.youtube.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors group"
                  data-testid="link-youtube"
                >
                  <div className="p-2 bg-red-600 rounded-lg text-white">
                    <Youtube className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">YouTube</p>
                    <p className="text-sm text-muted-foreground">{creator.youtube}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              )}

              {creator.tiktok && (
                <a 
                  href={creator.tiktok.startsWith('http') ? creator.tiktok : `https://tiktok.com/@${creator.tiktok.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-slate-950/50 transition-colors group"
                  data-testid="link-tiktok"
                >
                  <div className="p-2 bg-black rounded-lg text-white">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">TikTok</p>
                    <p className="text-sm text-muted-foreground">{creator.tiktok}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              )}

              {!creator.instagram && !creator.youtube && !creator.tiktok && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhuma rede social cadastrada.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Unified Contact & Payment Card */}
          {hasContactInfo && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="h-5 w-5 text-blue-600" />
                  Contato & Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {creator.pixKey && (
                  <div 
                    role="button"
                    tabIndex={0}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors cursor-pointer"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(creator.pixKey!);
                        toast({ title: "Chave PIX copiada!" });
                      } catch {
                        toast({ title: "Não foi possível copiar", variant: "destructive" });
                      }
                    }}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        try {
                          await navigator.clipboard.writeText(creator.pixKey!);
                          toast({ title: "Chave PIX copiada!" });
                        } catch {
                          toast({ title: "Não foi possível copiar", variant: "destructive" });
                        }
                      }
                    }}
                    data-testid="button-copy-pix"
                  >
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Wallet className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Chave PIX</p>
                      <p className="text-sm font-medium truncate">{creator.pixKey}</p>
                    </div>
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}

                {creator.email && (
                  <a 
                    href={`mailto:${creator.email}`}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
                    data-testid="link-email-contact"
                  >
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Mail className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium truncate">{creator.email}</p>
                    </div>
                  </a>
                )}

                {creator.phone && (
                  <a 
                    href={`https://wa.me/55${creator.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
                    data-testid="link-phone-contact"
                  >
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Phone className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Telefone / WhatsApp</p>
                      <p className="text-sm font-medium">{formatPhone(creator.phone)}</p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </a>
                )}

                {creator.cep && (
                  <div className="flex items-center gap-3 p-3 rounded-lg border" data-testid="text-address">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                      <Home className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Endereço</p>
                      <p className="text-sm font-medium">
                        {[creator.street, creator.city, creator.state].filter(Boolean).join(', ')}
                      </p>
                      <p className="text-xs text-muted-foreground">CEP: {creator.cep}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Authenticity Score */}
          {!invalidProfile && creator.instagramAuthenticityScore !== null && creator.instagramAuthenticityScore !== undefined && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Autenticidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-4xl font-bold">{authenticityScore}</span>
                  <Badge variant="outline" className={scoreStyle.badge + " text-sm px-3 py-1"}>
                    {scoreStyle.label}
                  </Badge>
                </div>
                <Progress value={authenticityScore} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground">
                  Baseado em análise de seguidores e padrões de engajamento
                </p>
              </CardContent>
            </Card>
          )}

          {!isPublic && (
            <Button 
              onClick={handleInviteCommunity}
              disabled={communityInviting}
              variant="outline"
              className="w-full shadow-lg"
              size="lg"
              data-testid="button-invite-community"
            >
              {communityInviting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Users className="mr-2 h-4 w-4" />
              )}
              Convidar para comunidade
            </Button>
          )}
        </div>
      </div>

      {!isPublic && creator && (
        <InviteToCampaignModal
          open={inviteModalOpen}
          onOpenChange={setInviteModalOpen}
          creatorId={creator.id}
          creatorName={creator.name}
        />
      )}

      <Dialog open={postModalOpen} onOpenChange={setPostModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Instagram className="h-5 w-5 text-pink-600" />
              Detalhes do Post
            </DialogTitle>
            <DialogDescription>
              {isPublic ? 'Métricas do post' : 'Veja métricas detalhadas e análise com inteligência artificial'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPost && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-xl overflow-hidden bg-muted">
                  {selectedPost.thumbnailUrl ? (
                    <img
                      src={selectedPost.thumbnailUrl}
                      alt="Post"
                      className="w-full aspect-square object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full aspect-square flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 gap-3">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Imagem não disponível</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-pink-50 dark:bg-pink-950 rounded-lg p-3 text-center">
                      <Heart className="h-5 w-5 mx-auto text-pink-600 fill-pink-600 mb-1" />
                      <p className="text-2xl font-bold">{formatNumber(selectedPost.likes)}</p>
                      <p className="text-xs text-muted-foreground">Curtidas</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 text-center">
                      <MessageCircle className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                      <p className="text-2xl font-bold">{formatNumber(selectedPost.comments)}</p>
                      <p className="text-xs text-muted-foreground">Comentários</p>
                    </div>
                    {selectedPost.views && selectedPost.views > 0 && (
                      <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-3 text-center">
                        <TrendingUp className="h-5 w-5 mx-auto text-purple-600 mb-1" />
                        <p className="text-2xl font-bold">{formatNumber(selectedPost.views)}</p>
                        <p className="text-xs text-muted-foreground">Visualizações</p>
                      </div>
                    )}
                    {selectedPost.engagementRate && (
                      <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 text-center">
                        <BarChart3 className="h-5 w-5 mx-auto text-green-600 mb-1" />
                        <p className="text-2xl font-bold">{selectedPost.engagementRate}</p>
                        <p className="text-xs text-muted-foreground">Engajamento</p>
                      </div>
                    )}
                  </div>

                  {selectedPost.caption && (
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Caption</p>
                      <p className="text-sm">{selectedPost.caption}</p>
                    </div>
                  )}

                  {selectedPost.hashtags && selectedPost.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedPost.hashtags.slice(0, 10).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {!isPublic && (
                      <Button
                        onClick={handleAnalyzePost}
                        disabled={isAnalyzing}
                        className="flex-1"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analisando...
                          </>
                        ) : aiAnalysis ? (
                          <>
                            <Bot className="mr-2 h-4 w-4" />
                            Reanalisar com IA
                          </>
                        ) : (
                          <>
                            <Bot className="mr-2 h-4 w-4" />
                            Analisar com IA
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      asChild
                      className={isPublic ? 'flex-1' : ''}
                    >
                      <a
                        href={selectedPost.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver no Instagram
                      </a>
                    </Button>
                  </div>
                </div>
              </div>

              {aiAnalysis && !isPublic && (
                <div className="border rounded-xl p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
                  <div className="flex items-center gap-2 mb-3">
                    <Bot className="h-5 w-5 text-purple-600" />
                    <h4 className="font-semibold">Análise com IA</h4>
                    <Badge variant="outline" className="text-xs ml-auto">Salvo</Badge>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap text-sm">{aiAnalysis}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
