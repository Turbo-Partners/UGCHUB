import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Instagram,
  Youtube,
  Users,
  Mail,
  MapPin,
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
  Copy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { User, CreatorPost } from '@shared/schema';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { getAvatarUrl, getPublicAvatarUrl } from '@/lib/utils';
import StarRating from '@/components/StarRating';
import { InviteToCampaignModal } from '@/components/InviteToCampaignModal';
import { InstagramAvatar } from '@/components/instagram-avatar';
import { lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ReviewModal } from '@/components/review-modal';
const CreatorDeepAnalysis = lazy(() => import('@/pages/company/creator-deep-analysis'));

function formatNumber(num: number | null | undefined): string {
  if (!num) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toLocaleString();
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
  if (!bio) return true;
  const normalized = bio.trim().toLowerCase().replace(/\.$/, '');
  if (normalized.length < 5) return true;
  if (normalized.length < 15 && !normalized.includes(' ')) return true;
  return GENERIC_BIOS.some((g) => normalized === g);
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

type CreatorReviewData = {
  id: number;
  creatorId: number;
  companyId: number;
  campaignId: number | null;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  companyName: string;
  campaignTitle: string | null;
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
  backLabel = 'Voltar para Banco de Talentos',
}: CreatorProfileViewProps) {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CreatorPost | null>(null);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [failedThumbs, setFailedThumbs] = useState<Set<number>>(new Set());
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const { data: creatorReviews = [] } = useQuery<CreatorReviewData[]>({
    queryKey: [`/api/users/${creator.id}/reviews`],
    queryFn: async () => {
      const res = await fetch(`/api/users/${creator.id}/reviews`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !isPublic,
  });

  // Accept any valid profile pic URL (except dicebear fallbacks)
  const instagramPicUrl =
    creator.instagramProfilePic && !creator.instagramProfilePic.includes('dicebear')
      ? creator.instagramProfilePic
      : null;
  const fallbackAvatarUrl = isPublic
    ? getPublicAvatarUrl(creator.avatar)
    : getAvatarUrl(creator.avatar);

  const handleShareProfile = async () => {
    const publicUrl = `${window.location.origin}/public/creator/${creator.id}`;

    try {
      await navigator.clipboard.writeText(publicUrl);
      toast({
        title: 'Link copiado!',
        description: 'O link do perfil público foi copiado para a área de transferência.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o link.',
        variant: 'destructive',
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
        title: 'Erro na análise',
        description: 'Não foi possível analisar o post com IA.',
        variant: 'destructive',
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
        toast({
          title:
            data.error || 'Erro ao enviar convite. Verifique se você tem uma empresa selecionada.',
          variant: 'destructive',
        });
        return;
      }
      toast({ title: 'Convite para comunidade enviado!' });
    } catch {
      toast({ title: 'Erro ao enviar convite', variant: 'destructive' });
    } finally {
      setCommunityInviting(false);
    }
  };

  const [bioExpanded, setBioExpanded] = useState(false);

  const invalidProfile = creator.instagram && !hasValidInstagramData(creator);
  const effectiveBio = (creator as any).instagramBio || creator.bio;
  const genericBio = isGenericBio(effectiveBio);
  const shortBio = effectiveBio && !genericBio && effectiveBio.length < 120;
  const longBio = effectiveBio && !genericBio && effectiveBio.length >= 120;

  const hasContactInfo =
    !isPublic && (creator.pixKey || creator.email || creator.phone || creator.cep);

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
            <>
              <Button
                onClick={handleInviteCommunity}
                disabled={communityInviting}
                variant="outline"
                className="shadow-sm"
                data-testid="button-invite-community-top"
              >
                {communityInviting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Users className="mr-2 h-4 w-4" />
                )}
                Convidar para comunidade
              </Button>
              <Button
                onClick={() => setInviteModalOpen(true)}
                className="shadow-sm"
                data-testid="button-invite-campaign"
              >
                <Send className="mr-2 h-4 w-4" />
                Convidar para campanha
              </Button>
            </>
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
        <div
          className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800"
          data-testid="warning-invalid-profile"
        >
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">
              Dados do Instagram não verificados
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Não foi possível verificar a conta{' '}
              <strong>@{creator.instagram?.replace('@', '')}</strong> no Instagram. O perfil pode
              não existir, estar privado ou ter sido alterado. Os dados exibidos podem estar
              desatualizados.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="h-36 bg-gradient-to-r from-slate-900 via-purple-900/80 to-indigo-900/70 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(120,80,200,0.3),transparent_60%)]" />
              <div className="absolute -bottom-4 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -top-4 -left-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            </div>
            <CardContent className="pt-0 px-6 pb-6">
              <div className="flex flex-col sm:flex-row gap-4 -mt-16">
                {creator.instagram ? (
                  <InstagramAvatar
                    username={creator.instagram}
                    initialPicUrl={instagramPicUrl}
                    size="xl"
                    className="h-28 w-28 border-4 border-background shadow-2xl ring-2 ring-primary/20"
                  />
                ) : (
                  <Avatar className="h-28 w-28 border-4 border-background shadow-2xl ring-2 ring-primary/20">
                    <AvatarImage src={fallbackAvatarUrl || undefined} />
                    <AvatarFallback className="text-4xl bg-gradient-to-br from-pink-500 to-purple-600 text-white">
                      {creator.name[0]}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className="flex-1 pt-18 sm:pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold tracking-tight text-white">
                          {creator.name}
                        </h1>
                        {creator.instagramVerified && (
                          <BadgeCheck className="h-6 w-6 text-blue-500 fill-blue-500" />
                        )}
                      </div>
                      {creator.instagram && (
                        <a
                          href={`https://instagram.com/${creator.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/70 hover:text-pink-400 transition-colors flex items-center gap-1"
                        >
                          <Instagram className="h-4 w-4" />@{creator.instagram.replace('@', '')}
                        </a>
                      )}
                      {shortBio && <p className="text-sm text-white/60 mt-1">{effectiveBio}</p>}
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {creator.city && creator.state && (
                          <p className="text-sm text-white/60 flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {creator.city}, {creator.state}
                          </p>
                        )}
                        {ratingData && ratingData.count > 0 && (
                          <StarRating
                            rating={ratingData.average}
                            count={ratingData.count}
                            size="sm"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {!invalidProfile && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                  <div className="rounded-xl p-4 text-center bg-card border shadow-sm hover:shadow-md transition-shadow">
                    <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 mb-2">
                      <Users className="h-5 w-5 text-pink-600" />
                    </div>
                    <div className="text-2xl font-bold tracking-tight">
                      {formatNumber(creator.instagramFollowers)}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">Seguidores</div>
                  </div>
                  <div className="rounded-xl p-4 text-center bg-card border shadow-sm hover:shadow-md transition-shadow">
                    <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 mb-2">
                      <ImageIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold tracking-tight">
                      {formatNumber(creator.instagramPosts)}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">Posts</div>
                  </div>
                  <div className="rounded-xl p-4 text-center bg-card border shadow-sm hover:shadow-md transition-shadow">
                    <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 mb-2">
                      <Briefcase className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold tracking-tight">{completedJobs.length}</div>
                    <div className="text-xs text-muted-foreground font-medium">Campanhas</div>
                  </div>
                  <div className="rounded-xl p-4 text-center bg-card border shadow-sm hover:shadow-md transition-shadow">
                    <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 mb-2">
                      <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                    </div>
                    <div className="text-2xl font-bold tracking-tight">
                      {ratingData && ratingData.count > 0 ? ratingData.average.toFixed(1) : 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      Nota{ratingData && ratingData.count > 0 ? ` (${ratingData.count})` : ''}
                    </div>
                  </div>
                </div>
              )}

              {/* SOBRE - Inline content without tabs */}
              <div className="mt-6 pt-6 border-t space-y-5">
                {longBio && (
                  <div>
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Sobre
                    </h4>
                    <div className="relative">
                      <p
                        className={`text-muted-foreground leading-relaxed ${!bioExpanded ? 'line-clamp-3' : ''}`}
                      >
                        {effectiveBio}
                      </p>
                      {effectiveBio!.length > 200 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-1 h-auto p-0 text-xs text-primary hover:text-primary/80"
                          onClick={() => setBioExpanded(!bioExpanded)}
                        >
                          {bioExpanded ? (
                            <>
                              <ChevronUp className="h-3 w-3 mr-1" /> Ver menos
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3 mr-1" /> Ver mais
                            </>
                          )}
                        </Button>
                      )}
                      {(creator as any).instagramExternalUrl && (
                        <a
                          href={
                            (creator as any).instagramExternalUrl.startsWith('http')
                              ? (creator as any).instagramExternalUrl
                              : `https://${(creator as any).instagramExternalUrl}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-sm text-primary hover:underline"
                        >
                          <Link2 className="h-3.5 w-3.5" />
                          {(creator as any).instagramExternalUrl
                            .replace(/^https?:\/\//, '')
                            .replace(/\/$/, '')}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {genericBio && (effectiveBio || (creator as any).instagramExternalUrl) && (
                  <div className="space-y-2">
                    {effectiveBio && (
                      <p className="text-sm text-muted-foreground">{effectiveBio}</p>
                    )}
                    {(creator as any).instagramExternalUrl && (
                      <a
                        href={
                          (creator as any).instagramExternalUrl.startsWith('http')
                            ? (creator as any).instagramExternalUrl
                            : `https://${(creator as any).instagramExternalUrl}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        <Link2 className="h-3.5 w-3.5" />
                        {(creator as any).instagramExternalUrl
                          .replace(/^https?:\/\//, '')
                          .replace(/\/$/, '')}
                      </a>
                    )}
                  </div>
                )}

                {creator.portfolioUrl && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                      Mídia Kit
                    </h4>
                    <a
                      href={
                        creator.portfolioUrl.startsWith('http')
                          ? creator.portfolioUrl
                          : `https://${creator.portfolioUrl}`
                      }
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
                        <p className="text-xs text-muted-foreground truncate">
                          {creator.portfolioUrl}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  </div>
                )}

                {!invalidProfile &&
                  creator.instagramTopHashtags &&
                  creator.instagramTopHashtags.length > 0 && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium flex items-center gap-2 mb-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        Top Hashtags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {creator.instagramTopHashtags.slice(0, 10).map((tag, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                          >
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
                      <Badge variant="secondary" className="ml-1">
                        {completedJobs.length}
                      </Badge>
                    </h4>
                    <div className="space-y-2">
                      {completedJobs.slice(0, 5).map((job) => (
                        <div
                          key={job.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                          data-testid={`card-completed-job-${job.id}`}
                        >
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={job.companyLogo ? getAvatarUrl(job.companyLogo) : undefined}
                            />
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
                      <Badge variant="secondary" className="ml-1">
                        {communities.length}
                      </Badge>
                    </h4>
                    <div className="space-y-2">
                      {communities.map((community) => (
                        <div
                          key={community.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20"
                          data-testid={`card-community-${community.id}`}
                        >
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={
                                community.companyLogo
                                  ? getAvatarUrl(community.companyLogo)
                                  : undefined
                              }
                            />
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
                            className={
                              community.status === 'active'
                                ? 'bg-green-50 text-green-700 border-green-200 text-xs'
                                : 'bg-gray-50 text-gray-600 text-xs'
                            }
                          >
                            {community.status === 'active' ? 'Ativo' : community.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reviews section (company view only) */}
                {!isPublic && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-500" />
                        Avaliacoes
                        {creatorReviews.length > 0 && (
                          <Badge variant="secondary" className="ml-1">
                            {creatorReviews.length}
                          </Badge>
                        )}
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReviewModalOpen(true)}
                        data-testid="button-open-review-modal"
                      >
                        <Star className="h-3.5 w-3.5 mr-1" />
                        Avaliar
                      </Button>
                    </div>
                    {creatorReviews.length > 0 ? (
                      <div className="space-y-2">
                        {creatorReviews.slice(0, 3).map((review) => (
                          <div
                            key={review.id}
                            className="flex items-start gap-3 p-3 rounded-lg border bg-amber-50/50 dark:bg-amber-950/20"
                            data-testid={`review-item-${review.id}`}
                          >
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <Building2 className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{review.companyName}</span>
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      className={`h-3 w-3 ${
                                        s <= review.rating
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              {review.comment && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {review.comment}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        ))}
                        {creatorReviews.length > 3 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-muted-foreground"
                            onClick={() => setReviewModalOpen(true)}
                          >
                            Ver todas ({creatorReviews.length})
                          </Button>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nenhuma avaliacao ainda. Seja o primeiro a avaliar!
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ANÁLISE - Inline section */}
          {!isPublic && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Análise
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense
                  fallback={
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="mt-4 text-sm text-muted-foreground">Carregando análise...</p>
                    </div>
                  }
                >
                  <CreatorDeepAnalysis embeddedCreatorId={creator.id} embedded={true} />
                </Suspense>
              </CardContent>
            </Card>
          )}

          {!invalidProfile && creatorPosts && creatorPosts.length > 0 && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-pink-600" />
                    Posts
                  </CardTitle>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{creatorPosts.length} posts</span>
                    {(() => {
                      const avgEng =
                        creatorPosts.reduce(
                          (sum, p) => sum + parseFloat(p.engagementRate || '0'),
                          0,
                        ) / creatorPosts.length;
                      return avgEng > 0 ? (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3.5 w-3.5" />
                          {avgEng.toFixed(2)}% eng.
                        </span>
                      ) : null;
                    })()}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {creatorPosts.slice(0, 12).map((post, i) => {
                    const hasThumb = !!post.thumbnailUrl;
                    const isVideo = post.postType === 'video' || post.postType === 'reel';
                    const engRate = parseFloat(post.engagementRate || '0');
                    const postTypeLabel =
                      post.postType === 'reel'
                        ? 'Reel'
                        : post.postType === 'video'
                          ? 'Vídeo'
                          : post.postType === 'carousel'
                            ? 'Carrossel'
                            : 'Imagem';
                    return (
                      <div
                        key={post.id}
                        className="group rounded-xl overflow-hidden bg-card shadow-sm border hover:shadow-md transition-all cursor-pointer"
                        data-testid={`card-post-${i}`}
                        onClick={() => handleOpenPost(post)}
                      >
                        <div className="relative aspect-square">
                          {hasThumb && !failedThumbs.has(post.id) ? (
                            <img
                              src={post.thumbnailUrl!}
                              alt={post.caption?.slice(0, 50) || `Post ${i + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              loading="lazy"
                              onError={() => {
                                setFailedThumbs((prev) => new Set(prev).add(post.id));
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 gap-2">
                              {isVideo ? (
                                <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-full">
                                  <Sparkles className="h-6 w-6 text-pink-600" />
                                </div>
                              ) : (
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                  <ImageIcon className="h-6 w-6 text-blue-600" />
                                </div>
                              )}
                              <span className="text-xs text-muted-foreground font-medium">
                                {postTypeLabel}
                              </span>
                            </div>
                          )}
                          {/* Badges */}
                          <div className="absolute top-2 left-2 flex gap-1">
                            <Badge className="bg-black/60 backdrop-blur-sm text-white text-[10px] border-0 py-0.5 px-1.5">
                              {postTypeLabel}
                            </Badge>
                            {engRate > 5 && (
                              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] border-0 py-0.5 px-1.5">
                                Viral
                              </Badge>
                            )}
                          </div>
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-xs">
                              <div className="flex items-center gap-2">
                                <span className="flex items-center gap-0.5">
                                  <Heart className="h-3 w-3" /> {formatNumber(post.likes)}
                                </span>
                                <span className="flex items-center gap-0.5">
                                  <MessageCircle className="h-3 w-3" />{' '}
                                  {formatNumber(post.comments)}
                                </span>
                              </div>
                              {post.engagementRate && (
                                <span className="flex items-center gap-0.5">
                                  <TrendingUp className="h-3 w-3" /> {post.engagementRate}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="p-2.5 space-y-1.5">
                          {post.caption && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {post.caption}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1 text-pink-600">
                                <Heart className="h-3 w-3 fill-pink-600" />{' '}
                                {formatNumber(post.likes)}
                              </span>
                              <span className="flex items-center gap-1 text-blue-600">
                                <MessageCircle className="h-3 w-3" /> {formatNumber(post.comments)}
                              </span>
                            </div>
                            {post.engagementRate && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <TrendingUp className="h-3 w-3" /> {post.engagementRate}
                              </span>
                            )}
                          </div>
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
                    <p className="text-sm text-muted-foreground">
                      @{creator.instagram.replace('@', '')}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              )}

              {creator.youtube && (
                <a
                  href={
                    creator.youtube.startsWith('http')
                      ? creator.youtube
                      : `https://youtube.com/@${creator.youtube.replace('@', '')}`
                  }
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
                  href={
                    creator.tiktok.startsWith('http')
                      ? creator.tiktok
                      : `https://tiktok.com/@${creator.tiktok.replace('@', '')}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-slate-950/50 transition-colors group"
                  data-testid="link-tiktok"
                >
                  <div className="p-2 bg-black rounded-lg text-white">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
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
                        toast({ title: 'Chave PIX copiada!' });
                      } catch {
                        toast({ title: 'Não foi possível copiar', variant: 'destructive' });
                      }
                    }}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        try {
                          await navigator.clipboard.writeText(creator.pixKey!);
                          toast({ title: 'Chave PIX copiada!' });
                        } catch {
                          toast({ title: 'Não foi possível copiar', variant: 'destructive' });
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
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg border"
                    data-testid="text-address"
                  >
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
        </div>
      </div>

      {!isPublic && creator && (
        <>
          <InviteToCampaignModal
            open={inviteModalOpen}
            onOpenChange={setInviteModalOpen}
            creatorId={creator.id}
            creatorName={creator.name}
          />
          <ReviewModal
            open={reviewModalOpen}
            onOpenChange={setReviewModalOpen}
            creatorId={creator.id}
            creatorName={creator.name}
          />
        </>
      )}

      <Dialog open={postModalOpen} onOpenChange={setPostModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Instagram className="h-5 w-5 text-pink-600" />
              Detalhes do Post
            </DialogTitle>
            <DialogDescription>
              {isPublic
                ? 'Métricas do post'
                : 'Veja métricas detalhadas e análise com inteligência artificial'}
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
                      <Button onClick={handleAnalyzePost} disabled={isAnalyzing} className="flex-1">
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
                    <Button variant="outline" asChild className={isPublic ? 'flex-1' : ''}>
                      <a href={selectedPost.postUrl} target="_blank" rel="noopener noreferrer">
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
                    <Badge variant="outline" className="text-xs ml-auto">
                      Salvo
                    </Badge>
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
