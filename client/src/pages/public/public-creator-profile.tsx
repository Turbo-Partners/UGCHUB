import { useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Instagram, 
  Users, 
  MapPin, 
  TrendingUp, 
  Hash, 
  ExternalLink, 
  Heart,
  MessageCircle,
  Star,
  Shield,
  Briefcase,
  Building2,
  CheckCircle2,
  BadgeCheck,
  Sparkles,
  Play,
  Award,
  ArrowRight,
  Globe
} from 'lucide-react';
import type { User, CreatorPost } from '@shared/schema';
import { getPublicAvatarUrl } from '@/lib/utils';

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

type PortfolioAsset = {
  id: number;
  url: string;
  type: string;
  title: string | null;
  status: string;
  createdAt: string;
};

type PublicCreatorProfile = User & {
  partnerships?: {
    count: number;
    partners: { id: number; name: string; logo: string | null }[];
    campaigns: {
      id: number;
      title: string;
      company: { id: number; name: string; logo: string | null };
      completedAt: string;
    }[];
  };
  portfolio?: PortfolioAsset[];
};

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
  return `${numRate.toFixed(2)}%`;
}

export default function PublicCreatorProfile() {
  const [match, params] = useRoute('/public/creator/:id');
  const [_, navigate] = useLocation();
  
  const creatorId = params?.id ? parseInt(params.id) : null;

  const { data: creator, isLoading, error } = useQuery<PublicCreatorProfile>({
    queryKey: [`/api/public/creator/${creatorId}`],
    queryFn: async () => {
      const res = await fetch(`/api/public/creator/${creatorId}`);
      if (!res.ok) throw new Error('Failed to fetch creator');
      return res.json();
    },
    enabled: !!creatorId,
  });

  const { data: creatorPosts } = useQuery<CreatorPost[]>({
    queryKey: [`/api/public/creator/${creatorId}/posts`],
    queryFn: async () => {
      const res = await fetch(`/api/public/creator/${creatorId}/posts`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!creatorId,
  });

  const { data: communities } = useQuery<CommunityMembership[]>({
    queryKey: [`/api/public/creator/${creatorId}/communities`],
    queryFn: async () => {
      const res = await fetch(`/api/public/creator/${creatorId}/communities`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!creatorId,
  });

  const { data: ratingData } = useQuery<RatingData>({
    queryKey: [`/api/public/creator/${creatorId}/rating`],
    queryFn: async () => {
      const res = await fetch(`/api/public/creator/${creatorId}/rating`);
      if (!res.ok) return { average: 0, count: 0 };
      return res.json();
    },
    enabled: !!creatorId,
  });

  // Force light theme
  useEffect(() => {
    const html = document.documentElement;
    const previousTheme = html.classList.contains('dark') ? 'dark' : 'light';
    html.classList.remove('dark');
    html.classList.add('light');
    
    return () => {
      html.classList.remove('light');
      if (previousTheme === 'dark') {
        html.classList.add('dark');
      }
    };
  }, []);

  // Update meta tags
  useEffect(() => {
    if (!creator) return;
    
    document.title = `${creator.name} - Criador de Conteúdo | CreatorConnect`;
    
    const createdMetas: HTMLMetaElement[] = [];
    
    const updateMeta = (property: string, content: string, isOg = false) => {
      const attr = isOg ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${property}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, property);
        document.head.appendChild(meta);
        createdMetas.push(meta);
      }
      meta.content = content;
    };
    
    const description = creator.bio || `${creator.name} é um criador de conteúdo verificado com ${formatNumber(creator.instagramFollowers)} seguidores no Instagram.`;
    const imageUrl = creator.avatar ? getPublicAvatarUrl(creator.avatar) : 'https://creatorconnect.com.br/og-default.png';
    
    updateMeta('description', description);
    updateMeta('og:type', 'profile', true);
    updateMeta('og:title', `${creator.name} - Criador de Conteúdo`, true);
    updateMeta('og:description', description, true);
    updateMeta('og:image', imageUrl, true);
    updateMeta('og:url', window.location.href, true);
    updateMeta('og:site_name', 'CreatorConnect', true);
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', `${creator.name} - Criador de Conteúdo`);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', imageUrl);
    
    return () => {
      document.title = 'CreatorConnect';
      createdMetas.forEach(meta => meta.remove());
    };
  }, [creator]);

  if (!match || !creatorId) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-6">
          <div className="w-40 h-40 rounded-full bg-gradient-to-br from-pink-500/30 to-purple-500/30" />
          <div className="h-6 w-48 bg-white/10 rounded-full" />
          <div className="h-4 w-32 bg-white/5 rounded-full" />
        </div>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <div className="text-center p-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center">
            <Users className="w-12 h-12 text-white/50" />
          </div>
          <h2 className="text-3xl font-bold mb-3">Criador não encontrado</h2>
          <p className="text-white/60 mb-8">Este perfil não está disponível ou foi removido.</p>
          <Button onClick={() => navigate('/')} size="lg" className="bg-white text-black hover:bg-white/90">
            Voltar para Início
          </Button>
        </div>
      </div>
    );
  }

  const avatarUrl = creator.avatar ? getPublicAvatarUrl(creator.avatar) : undefined;
  const partnershipsCount = creator.partnerships?.count || 0;
  const partnersCount = creator.partnerships?.partners?.length || 0;
  const completedCampaigns = creator.partnerships?.campaigns || [];
  const portfolioAssets = creator.portfolio || [];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-black to-pink-900/30" />
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(168, 85, 247, 0.4) 0%, transparent 50%),
                               radial-gradient(circle at 80% 50%, rgba(236, 72, 153, 0.4) 0%, transparent 50%),
                               radial-gradient(circle at 50% 80%, rgba(139, 92, 246, 0.3) 0%, transparent 40%)`,
            }}
          />
          {/* Mesh grid pattern */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center flex flex-col items-center">
          {/* Avatar */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full blur-2xl opacity-50 scale-110" />
            <Avatar className="relative h-44 w-44 border-4 border-white/20 shadow-2xl ring-4 ring-white/10">
              <AvatarImage src={avatarUrl} className="object-cover" />
              <AvatarFallback className="text-5xl bg-gradient-to-br from-pink-500 to-purple-600 text-white">
                {creator.name[0]}
              </AvatarFallback>
            </Avatar>
            {creator.instagramVerified && (
              <div className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-2 shadow-lg border-4 border-black">
                <BadgeCheck className="h-6 w-6 text-white" />
              </div>
            )}
          </div>

          {/* Verified Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-5 py-2.5 mb-6 border border-white/10">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-white/90">Perfil Verificado</span>
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          </div>
          
          {/* Name */}
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
            {creator.name}
          </h1>
          
          {/* Handle & Location */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
            {creator.instagram && (
              <a 
                href={`https://instagram.com/${creator.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-white/70 hover:text-pink-400 transition-colors"
                data-testid="link-instagram"
              >
                <Instagram className="h-5 w-5" />
                @{creator.instagram.replace('@', '')}
              </a>
            )}
            {creator.city && creator.state && (
              <span className="flex items-center gap-1.5 text-white/50">
                <MapPin className="h-4 w-4" />
                {creator.city}, {creator.state}
              </span>
            )}
          </div>
          
          {/* Niches */}
          {creator.niche && creator.niche.length > 0 && (
            <div className="flex gap-2 flex-wrap justify-center mb-10">
              {creator.niche.map((n, i) => (
                <Badge 
                  key={i} 
                  className="bg-white/10 text-white border-white/20 backdrop-blur-sm hover:bg-white/20 transition-colors px-4 py-1.5"
                >
                  {n}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Bio */}
          {creator.bio && (
            <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed mb-10">
              {creator.bio}
            </p>
          )}
          
          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            {creator.instagram && (
              <a 
                href={`https://instagram.com/${creator.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 px-8 h-12 text-base font-semibold gap-2">
                  <Instagram className="h-5 w-5" />
                  Seguir no Instagram
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative py-16 border-t border-white/10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Users className="h-8 w-8 text-pink-400 mx-auto mb-3" />
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                {formatNumber(creator.instagramFollowers)}
              </div>
              <div className="text-sm text-white/50 uppercase tracking-wider">Seguidores</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <TrendingUp className="h-8 w-8 text-green-400 mx-auto mb-3" />
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                {formatEngagementRate(creator.instagramEngagementRate)}
              </div>
              <div className="text-sm text-white/50 uppercase tracking-wider">Engajamento</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Briefcase className="h-8 w-8 text-purple-400 mx-auto mb-3" />
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                {partnershipsCount}
              </div>
              <div className="text-sm text-white/50 uppercase tracking-wider">Campanhas</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Building2 className="h-8 w-8 text-blue-400 mx-auto mb-3" />
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                {partnersCount}
              </div>
              <div className="text-sm text-white/50 uppercase tracking-wider">Marcas Parceiras</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Posts Section */}
      {creatorPosts && creatorPosts.length > 0 && (
        <div className="py-20 border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Sparkles className="h-8 w-8 text-pink-400" />
                  Top Posts
                </h2>
                <p className="text-white/50 mt-2">Conteúdo de maior destaque</p>
              </div>
              <Badge variant="outline" className="border-white/20 text-white/70 px-4 py-2">
                {creatorPosts.length} posts
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {creatorPosts.slice(0, 6).map((post, i) => (
                <a
                  key={post.id}
                  href={post.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-white/5"
                  data-testid={`card-top-post-${i}`}
                >
                  <img
                    src={post.thumbnailUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${post.postId}`}
                    alt={post.caption?.slice(0, 50) || `Post ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${post.postId}`;
                    }}
                  />
                  {/* Gradient overlay always visible */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  {/* Likes & Comments always visible */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center gap-4 text-white text-sm font-medium">
                      <span className="flex items-center gap-1.5">
                        <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                        {formatNumber(post.likes)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MessageCircle className="h-4 w-4" />
                        {formatNumber(post.comments)}
                      </span>
                    </div>
                  </div>
                  {/* External link icon on hover */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="h-5 w-5 text-white drop-shadow-lg" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Section */}
      {portfolioAssets && portfolioAssets.length > 0 && (
        <div className="py-20 border-t border-white/10 bg-gradient-to-b from-transparent to-purple-900/10">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Award className="h-8 w-8 text-amber-400" />
                  Portfólio UGC
                </h2>
                <p className="text-white/50 mt-2">Trabalhos realizados para marcas</p>
              </div>
              <Badge variant="outline" className="border-white/20 text-white/70 px-4 py-2">
                {portfolioAssets.length} trabalhos
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {portfolioAssets.slice(0, 6).map((asset, i) => (
                <div
                  key={asset.id}
                  className="relative aspect-square rounded-2xl overflow-hidden bg-white/5 group"
                >
                  {asset.type === 'video' ? (
                    <>
                      <video
                        src={asset.url}
                        className="w-full h-full object-cover"
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                          <Play className="h-7 w-7 text-black ml-1" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <img
                      src={asset.url}
                      alt={asset.title || `UGC ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  )}
                  {asset.title && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-white text-sm font-medium truncate">{asset.title}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Partners / Completed Campaigns */}
      {completedCampaigns && completedCampaigns.length > 0 && (
        <div className="py-20 border-t border-white/10">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-3">Marcas que Confiam</h2>
              <p className="text-white/50">Campanhas realizadas com sucesso</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6">
              {completedCampaigns.slice(0, 8).map((campaign, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full pl-2 pr-5 py-2 hover:bg-white/10 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={campaign.company?.logo ? getPublicAvatarUrl(campaign.company.logo) : undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 text-white text-sm">
                      {campaign.company?.name?.[0] || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-white font-medium">{campaign.company?.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hashtags */}
      {creator.instagramTopHashtags && creator.instagramTopHashtags.length > 0 && (
        <div className="py-16 border-t border-white/10">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center justify-center gap-2">
              <Hash className="h-5 w-5 text-purple-400" />
              Top Hashtags
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              {creator.instagramTopHashtags.slice(0, 12).map((tag, i) => (
                <span 
                  key={i} 
                  className="text-white/60 hover:text-pink-400 transition-colors cursor-default"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rating */}
      {ratingData && ratingData.count > 0 && (
        <div className="py-16 border-t border-white/10 bg-gradient-to-b from-transparent to-black">
          <div className="max-w-md mx-auto px-6 text-center">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
              <Star className="h-10 w-10 text-amber-400 mx-auto mb-4" />
              <div className="text-5xl font-bold text-white mb-2">
                {ratingData.average.toFixed(1)}
              </div>
              <div className="flex justify-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`h-5 w-5 ${star <= Math.round(ratingData.average) ? 'text-amber-400 fill-amber-400' : 'text-white/20'}`}
                  />
                ))}
              </div>
              <p className="text-white/50 text-sm">{ratingData.count} avaliação(ões) de marcas</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="py-12 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 text-white/40 mb-4">
            <Shield className="h-4 w-4" />
            <span className="text-sm">Perfil verificado por CreatorConnect</span>
          </div>
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} CreatorConnect. Plataforma de Marketing de Influenciadores.
          </p>
        </div>
      </div>
    </div>
  );
}
