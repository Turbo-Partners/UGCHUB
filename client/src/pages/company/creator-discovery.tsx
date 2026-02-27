import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { InstagramAvatar, batchFetchProfilePics } from '@/components/instagram-avatar';
import { InstagramVerifiedBadge } from '@/components/instagram-verified-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { ViewToggle } from '@/components/view-toggle';
import { useViewPreference } from '@/hooks/use-view-preference';
import { toast } from 'sonner';
import { NICHE_OPTIONS, AGE_RANGE_OPTIONS, STATE_OPTIONS } from '@shared/constants';
import {
  Search,
  Users,
  TrendingUp,
  CheckCircle,
  Instagram,
  Youtube,
  Loader2,
  Save,
  ExternalLink,
  UserPlus,
  ChevronDown,
  ChevronUp,
  Send,
  MapPin,
  Eye,
  ChevronLeft,
  ChevronRight,
  Star,
  Heart,
  Filter,
  X,
} from 'lucide-react';
import { getAvatarUrl } from '@/lib/utils';
import type { CreatorDiscoveryProfile } from '@shared/schema';
import { InviteToCampaignModal } from '@/components/InviteToCampaignModal';

interface InstagramProfile {
  exists: boolean;
  username: string;
  fullName?: string;
  followers?: number;
  following?: number;
  postsCount?: number;
  engagementRate?: string;
  authenticityScore?: number;
  bio?: string;
  isPrivate?: boolean;
  isVerified?: boolean;
  profilePicUrl?: string;
}

interface CreatorDiscoveryStat {
  id: number;
  name: string;
  avatar: string | null;
  instagram: string | null;
  instagramFollowers: number | null;
  instagramFollowing: number | null;
  instagramPosts: number | null;
  instagramEngagementRate: string | null;
  instagramAuthenticityScore: number | null;
  instagramVerified: boolean;
  instagramValidated?: boolean;
  bio: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  tiktok: string | null;
  youtube: string | null;
  city: string | null;
  state: string | null;
  niche: string[] | null;
  campaignsCount: number;
  communitiesCount: number;
  averageRating: number;
  reviewsCount: number;
}

type DiscoveryResponse = {
  data: CreatorDiscoveryStat[];
  total: number;
  page: number;
  totalPages: number;
};

const ITEMS_PER_PAGE = 25;

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function CreatorDiscoveryPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('platform');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useViewPreference('company-discovery-view');

  // Platform tab filters
  const [platformSearch, setPlatformSearch] = useState('');
  const [nicheFilter, setNicheFilter] = useState<string>('all');
  const [minFollowers, setMinFollowers] = useState<string>('');
  const [maxFollowers, setMaxFollowers] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [ageRangeFilter, setAgeRangeFilter] = useState<string>('all');
  const [minAuthenticityScore, setMinAuthenticityScore] = useState<string>('');
  const [minEngagement, setMinEngagement] = useState<string>('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('followers_desc');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const debouncedSearch = useDebounce(platformSearch, 300);

  // Discovery tab
  const [discoverySearch, setDiscoverySearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [discoveryResult, setDiscoveryResult] = useState<InstagramProfile | null>(null);

  // Shared
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedCreatorForInvite, setSelectedCreatorForInvite] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [communityInviting, setCommunityInviting] = useState<number | null>(null);
  const [batchPicUrls, setBatchPicUrls] = useState<Map<string, string>>(new Map());

  // Reset page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearch,
    nicheFilter,
    minFollowers,
    maxFollowers,
    genderFilter,
    ageRangeFilter,
    minAuthenticityScore,
    minEngagement,
    stateFilter,
    sortBy,
    showFavoritesOnly,
  ]);

  // Build query params for backend pagination
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(currentPage));
  queryParams.set('limit', String(ITEMS_PER_PAGE));
  if (debouncedSearch) queryParams.set('query', debouncedSearch);
  if (nicheFilter && nicheFilter !== 'all') queryParams.set('niche', nicheFilter);
  if (minFollowers) queryParams.set('minFollowers', minFollowers);
  if (maxFollowers) queryParams.set('maxFollowers', maxFollowers);
  if (genderFilter && genderFilter !== 'all') queryParams.set('gender', genderFilter);
  if (ageRangeFilter && ageRangeFilter !== 'all') queryParams.set('ageRange', ageRangeFilter);
  if (minAuthenticityScore) queryParams.set('minAuthenticity', minAuthenticityScore);
  if (minEngagement) queryParams.set('minEngagement', minEngagement);
  if (stateFilter && stateFilter !== 'all') queryParams.set('state', stateFilter);
  if (sortBy) queryParams.set('sortBy', sortBy);
  if (showFavoritesOnly) queryParams.set('favoritesOnly', 'true');

  const { data: discoveryData, isLoading: loadingCreators } = useQuery<DiscoveryResponse>({
    queryKey: [
      '/api/creators/discovery-stats',
      currentPage,
      debouncedSearch,
      nicheFilter,
      minFollowers,
      maxFollowers,
      genderFilter,
      ageRangeFilter,
      minAuthenticityScore,
      minEngagement,
      stateFilter,
      sortBy,
      showFavoritesOnly,
    ],
    queryFn: async () => {
      const res = await fetch(`/api/creators/discovery-stats?${queryParams.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch creators');
      return res.json();
    },
  });

  const creators = discoveryData?.data || [];
  const totalCreators = discoveryData?.total || 0;
  const totalPages = discoveryData?.totalPages || 0;

  const { data: savedProfiles = [], isLoading: loadingSavedProfiles } = useQuery<
    CreatorDiscoveryProfile[]
  >({
    queryKey: ['/api/discovery-profiles'],
    queryFn: async () => {
      const res = await fetch('/api/discovery-profiles', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch saved profiles');
      return res.json();
    },
  });

  // Favorites
  const { data: favoriteIds = [] } = useQuery({
    queryKey: ['/api/favorites'],
    queryFn: async () => {
      const res = await fetch('/api/favorites', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch favorites');
      return res.json() as Promise<number[]>;
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ creatorId, isFavorite }: { creatorId: number; isFavorite: boolean }) => {
      const method = isFavorite ? 'DELETE' : 'POST';
      const res = await fetch(`/api/favorites/${creatorId}`, {
        method,
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to toggle favorite');
      return { creatorId, isFavorite };
    },
    onMutate: async ({ creatorId, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/favorites'] });
      const previousFavorites = queryClient.getQueryData<number[]>(['/api/favorites']);
      if (isFavorite) {
        queryClient.setQueryData<number[]>(['/api/favorites'], (old = []) =>
          old.filter((id) => id !== creatorId),
        );
      } else {
        queryClient.setQueryData<number[]>(['/api/favorites'], (old = []) => [...old, creatorId]);
      }
      return { previousFavorites };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(['/api/favorites'], context.previousFavorites);
      }
      toast.error('Erro ao atualizar favorito');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
    },
  });

  const enrichTriggered = useRef(false);
  useEffect(() => {
    if (!loadingCreators && creators.length > 0 && !enrichTriggered.current) {
      enrichTriggered.current = true;
      fetch('/api/discovery/enrich-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ limit: 5 }),
      })
        .then((res) => {
          if (res.ok) {
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['/api/creators/discovery-stats'] });
            }, 30000);
          }
        })
        .catch((err) => console.error('[Discovery] Enrichment failed:', err));
    }
  }, [loadingCreators, creators.length]);

  // Batch fetch profile pics
  useEffect(() => {
    if (!creators || creators.length === 0) return;
    const usernames = creators.filter((c) => c.instagram).map((c) => c.instagram!);
    if (usernames.length === 0) return;
    batchFetchProfilePics(usernames).then((result) => {
      setBatchPicUrls(result);
      const found = result.size;
      if (found < usernames.length * 0.5 && usernames.length > 5) {
        setTimeout(() => {
          batchFetchProfilePics(usernames).then(setBatchPicUrls);
        }, 10000);
      }
    });
  }, [creators]);

  const saveProfileMutation = useMutation({
    mutationFn: async (profile: InstagramProfile) => {
      const res = await fetch('/api/discovery-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          instagramHandle: profile.username,
          displayName: profile.fullName || profile.username,
          avatarUrl: profile.profilePicUrl,
          bio: profile.bio,
          followers: profile.followers,
          following: profile.following,
          posts: profile.postsCount,
          engagementRate: profile.engagementRate,
          source: 'apify',
        }),
      });
      if (!res.ok) throw new Error('Failed to save profile');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/discovery-profiles'] });
      toast.success('Perfil salvo com sucesso!');
      setDiscoveryResult(null);
      setDiscoverySearch('');
    },
    onError: () => {
      toast.error('Erro ao salvar perfil');
    },
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDiscoverySearch = async () => {
    if (!discoverySearch.trim()) return;

    setIsSearching(true);
    setDiscoveryResult(null);

    try {
      const isHashtag = discoverySearch.startsWith('#');

      if (isHashtag) {
        toast.info('Busca por hashtag ainda nao disponivel');
      } else {
        const username = discoverySearch.replace('@', '').trim();
        const res = await fetch('/api/social/validate-instagram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ username }),
        });

        if (!res.ok) {
          throw new Error('Failed to validate profile');
        }

        const result = await res.json();
        setDiscoveryResult(result);

        if (!result.exists) {
          toast.error('Perfil nao encontrado');
        }
      }
    } catch {
      toast.error('Erro ao buscar perfil');
    } finally {
      setIsSearching(false);
    }
  };

  const handleInviteCommunity = async (creatorId: number) => {
    setCommunityInviting(creatorId);
    try {
      const res = await fetch('/api/community/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ creatorId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(
          data.error || 'Erro ao enviar convite. Verifique se voce tem uma empresa selecionada.',
        );
        return;
      }
      toast.success('Convite para comunidade enviado!');
    } catch {
      toast.error('Erro ao enviar convite');
    } finally {
      setCommunityInviting(null);
    }
  };

  const getCreatorPicUrl = (creator: CreatorDiscoveryStat): string | undefined => {
    if (creator.instagram) {
      const clean = creator.instagram.replace('@', '').trim().toLowerCase();
      const batchUrl = batchPicUrls.get(clean);
      if (batchUrl) return batchUrl;
    }
    return undefined;
  };

  const formatFollowers = (count?: number | null) => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getNicheLabel = (value: string) => {
    const option = NICHE_OPTIONS.find((n) => n.value.toLowerCase() === value.toLowerCase());
    return option?.label || value;
  };

  const clearAllFilters = () => {
    setNicheFilter('all');
    setGenderFilter('all');
    setAgeRangeFilter('all');
    setMinFollowers('');
    setMaxFollowers('');
    setMinAuthenticityScore('');
    setMinEngagement('');
    setStateFilter('all');
    setSortBy('followers_desc');
  };

  const hasActiveFilters =
    nicheFilter !== 'all' ||
    genderFilter !== 'all' ||
    ageRangeFilter !== 'all' ||
    minFollowers !== '' ||
    maxFollowers !== '' ||
    minAuthenticityScore !== '' ||
    minEngagement !== '' ||
    stateFilter !== 'all' ||
    sortBy !== 'followers_desc';

  const TikTokIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.73a8.19 8.19 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.16z" />
    </svg>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Banco de Talentos"
        description="Encontre os criadores ideais para sua proxima campanha."
        data-testid="page-header-discovery"
      />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
        data-testid="tabs-discovery"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="platform" data-testid="tab-platform">
            <CheckCircle className="h-4 w-4 mr-2" />
            Na Plataforma
            {totalCreators > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 text-[10px] px-1.5 py-0 h-5"
                data-testid="badge-creators-count"
              >
                {totalCreators}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="discover" data-testid="tab-discover">
            <Instagram className="h-4 w-4 mr-2" />
            Descobrir Novos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="platform" className="mt-6" data-testid="content-platform">
          {/* Search bar + View toggle + Favorites + Filters toggle */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou @instagram..."
                  value={platformSearch}
                  onChange={(e) => setPlatformSearch(e.target.value)}
                  className="pl-10"
                  data-testid="input-platform-search"
                />
              </div>
              <ViewToggle mode={viewMode} onChange={setViewMode} />
              <Button
                variant={showFavoritesOnly ? 'default' : 'outline'}
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className="w-full md:w-auto"
                data-testid="button-toggle-favorites"
              >
                <Heart className={`h-4 w-4 mr-2 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                Favoritos{favoriteIds.length > 0 ? ` (${favoriteIds.length})` : ''}
              </Button>
              <Button
                variant={showFilters ? 'default' : 'outline'}
                onClick={() => setShowFilters(!showFilters)}
                className="w-full md:w-auto"
                data-testid="button-toggle-filters"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">
                    !
                  </Badge>
                )}
                {showFilters ? (
                  <ChevronUp className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-2" />
                )}
              </Button>
            </div>

            {/* Collapsible advanced filters */}
            <Collapsible open={showFilters} onOpenChange={setShowFilters}>
              <CollapsibleContent className="space-y-4 border rounded-lg p-4 bg-muted/30">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-sm">Filtros Avancados</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    disabled={!hasActiveFilters}
                    data-testid="button-clear-filters"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Nicho
                    </label>
                    <Select value={nicheFilter} onValueChange={setNicheFilter}>
                      <SelectTrigger data-testid="select-niche">
                        <SelectValue placeholder="Todos os Nichos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Nichos</SelectItem>
                        {NICHE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Genero
                    </label>
                    <Select value={genderFilter} onValueChange={setGenderFilter}>
                      <SelectTrigger data-testid="select-gender">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                        <SelectItem value="prefiro_nao_informar">Nao informado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Faixa Etaria
                    </label>
                    <Select value={ageRangeFilter} onValueChange={setAgeRangeFilter}>
                      <SelectTrigger data-testid="select-age-range">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {AGE_RANGE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Estado
                    </label>
                    <Select value={stateFilter} onValueChange={setStateFilter}>
                      <SelectTrigger data-testid="select-state">
                        <SelectValue placeholder="Todos os Estados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Estados</SelectItem>
                        {STATE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Seguidores Min.
                    </label>
                    <Input
                      type="number"
                      placeholder="Ex: 10000"
                      value={minFollowers}
                      onChange={(e) => setMinFollowers(e.target.value)}
                      data-testid="input-min-followers"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Seguidores Max.
                    </label>
                    <Input
                      type="number"
                      placeholder="Ex: 100000"
                      value={maxFollowers}
                      onChange={(e) => setMaxFollowers(e.target.value)}
                      data-testid="input-max-followers"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Autenticidade Min. (0-100)
                    </label>
                    <Input
                      type="number"
                      placeholder="Ex: 70"
                      min="0"
                      max="100"
                      value={minAuthenticityScore}
                      onChange={(e) => setMinAuthenticityScore(e.target.value)}
                      data-testid="input-min-authenticity"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Engajamento Min. (%)
                    </label>
                    <Input
                      type="number"
                      placeholder="Ex: 2.5"
                      step="0.1"
                      min="0"
                      value={minEngagement}
                      onChange={(e) => setMinEngagement(e.target.value)}
                      data-testid="input-min-engagement"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Ordenar por
                  </label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full md:w-[240px]" data-testid="select-sort">
                      <SelectValue placeholder="Mais Seguidores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="followers_desc">Mais Seguidores</SelectItem>
                      <SelectItem value="followers_asc">Menos Seguidores</SelectItem>
                      <SelectItem value="engagement_desc">Maior Engajamento</SelectItem>
                      <SelectItem value="authenticity_desc">Maior Autenticidade</SelectItem>
                      <SelectItem value="name">Nome (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between mt-4 mb-4">
            <p className="text-sm text-muted-foreground" data-testid="text-total-results">
              {totalCreators} {totalCreators === 1 ? 'criador encontrado' : 'criadores encontrados'}
            </p>
          </div>

          {loadingCreators ? (
            <div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
              data-testid="skeleton-grid"
            >
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border/50 bg-card overflow-hidden animate-pulse"
                >
                  <div className="h-20 bg-muted" />
                  <div className="pt-10 pb-3 px-3 flex flex-col items-center gap-2">
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="h-3 w-16 bg-muted rounded" />
                    <div className="h-3 w-12 bg-muted rounded" />
                    <div className="h-5 w-20 bg-muted rounded-full" />
                  </div>
                  <div className="border-t border-border/40 h-10" />
                </div>
              ))}
            </div>
          ) : totalCreators === 0 ? (
            <div className="text-center py-16" data-testid="empty-platform">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
              <h3 className="text-lg font-medium mb-2">Nenhum criador encontrado</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {hasActiveFilters || platformSearch || showFavoritesOnly
                  ? 'Tente ajustar os filtros para encontrar mais criadores.'
                  : 'Ainda nao ha criadores cadastrados na plataforma.'}
              </p>
            </div>
          ) : (
            <>
              {viewMode === 'cards' ? (
                <div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  data-testid="grid-platform-creators"
                >
                  {creators.map((creator) => (
                    <Card
                      key={creator.id}
                      className="border border-border/50 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
                      data-testid={`card-creator-${creator.id}`}
                    >
                      <div className="h-20 bg-gradient-to-br from-purple-600/20 to-indigo-600/10"></div>
                      <div className="px-6 -mt-12 flex justify-between items-end">
                        {creator.instagram ? (
                          <InstagramAvatar
                            username={creator.instagram}
                            initialPicUrl={getCreatorPicUrl(creator)}
                            size="xl"
                            className="border-4 border-background shadow-sm"
                          />
                        ) : (
                          <Avatar className="h-16 w-16 border-4 border-background shadow-sm">
                            <AvatarImage src={getAvatarUrl(creator.avatar)} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                              {creator.name[0]}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex items-center gap-1 mb-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              toggleFavoriteMutation.mutate({
                                creatorId: creator.id,
                                isFavorite: favoriteIds.includes(creator.id),
                              })
                            }
                            data-testid={`button-favorite-${creator.id}`}
                            className="h-8 w-8"
                          >
                            <Heart
                              className={`h-5 w-5 ${favoriteIds.includes(creator.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                            />
                          </Button>
                        </div>
                      </div>

                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-lg font-bold truncate">{creator.name}</h3>
                          {creator.instagramValidated && (
                            <InstagramVerifiedBadge type="platform" size="lg" />
                          )}
                          {creator.instagramVerified && (
                            <InstagramVerifiedBadge type="meta" size="lg" />
                          )}
                        </div>

                        {creator.instagram && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Instagram className="h-3 w-3 text-pink-600" />
                              <span className="text-muted-foreground">
                                @{creator.instagram.replace('@', '')}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span className="font-semibold">
                                  {formatFollowers(creator.instagramFollowers)}
                                </span>
                              </span>
                              {creator.instagramEngagementRate && (
                                <span className="flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3" />
                                  <span>{creator.instagramEngagementRate}%</span>
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {(creator.city || creator.state) && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{[creator.city, creator.state].filter(Boolean).join(', ')}</span>
                          </div>
                        )}

                        {creator.reviewsCount > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">
                              {creator.averageRating.toFixed(1)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({creator.reviewsCount})
                            </span>
                          </div>
                        )}
                      </CardHeader>

                      <CardContent className="flex-1">
                        <div className="flex gap-2">
                          {creator.instagram && (
                            <a
                              href={`https://instagram.com/${creator.instagram.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-pink-50 text-pink-600 rounded-md hover:bg-pink-100 transition-colors"
                              title="Instagram"
                            >
                              <Instagram className="w-4 h-4" />
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
                              className="p-1.5 bg-gray-50 text-gray-800 rounded-md hover:bg-gray-100 transition-colors"
                              title="TikTok"
                            >
                              <TikTokIcon />
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
                              className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                              title="YouTube"
                            >
                              <Youtube className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </CardContent>

                      <CardFooter className="pt-2 border-t border-border/50 flex gap-2">
                        <Button className="flex-1" variant="outline" size="sm" asChild>
                          <Link href={`/creator/${creator.id}/profile`}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Ver Perfil
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="default"
                              size="sm"
                              data-testid={`button-invite-${creator.id}`}
                            >
                              <Send className="w-4 h-4 mr-1" />
                              Convidar
                              <ChevronDown className="w-3 h-3 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => {
                                setSelectedCreatorForInvite({
                                  id: creator.id,
                                  name: creator.name,
                                });
                                setInviteModalOpen(true);
                              }}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Convidar para Campanha
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={communityInviting === creator.id}
                              onSelect={() => handleInviteCommunity(creator.id)}
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              {communityInviting === creator.id
                                ? 'Enviando...'
                                : 'Convidar para Comunidade'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border" data-testid="table-platform-creators">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead className="hidden md:table-cell">Seguidores</TableHead>
                        <TableHead className="hidden lg:table-cell">Engajamento</TableHead>
                        <TableHead className="hidden lg:table-cell text-center">
                          Campanhas
                        </TableHead>
                        <TableHead className="hidden lg:table-cell text-center">Nota</TableHead>
                        <TableHead className="hidden xl:table-cell">Local</TableHead>
                        <TableHead className="text-right">Acoes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {creators.map((creator) => (
                        <TableRow key={creator.id} className="group">
                          <TableCell>
                            {creator.instagram ? (
                              <InstagramAvatar
                                username={creator.instagram}
                                initialPicUrl={getCreatorPicUrl(creator)}
                                size="sm"
                                className="h-8 w-8"
                              />
                            ) : (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={getAvatarUrl(creator.avatar)} />
                                <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-violet-500 to-pink-500 text-white">
                                  {creator.name[0]}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </TableCell>
                          <TableCell>
                            <Link href={`/creator/${creator.id}/profile`}>
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-sm hover:underline">
                                  {creator.name}
                                </span>
                                {creator.instagramValidated && (
                                  <InstagramVerifiedBadge type="platform" size="sm" />
                                )}
                                {creator.instagramVerified && (
                                  <InstagramVerifiedBadge type="meta" size="sm" />
                                )}
                              </div>
                              {creator.instagram && (
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Instagram className="h-3 w-3" />@
                                  {creator.instagram.replace('@', '')}
                                </div>
                              )}
                            </Link>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span className="text-sm font-semibold">
                              {formatFollowers(creator.instagramFollowers)}
                            </span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {creator.instagramEngagementRate ? (
                              <span className="text-sm">{creator.instagramEngagementRate}%</span>
                            ) : (
                              <span className="text-muted-foreground/50">-</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-center">
                            <span className="text-sm">{creator.campaignsCount}</span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-center">
                            {creator.reviewsCount > 0 ? (
                              <div className="flex items-center justify-center gap-1">
                                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium">
                                  {creator.averageRating.toFixed(1)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground/50">-</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {creator.city || creator.state ? (
                              <div className="flex items-center gap-1 text-sm">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <span>
                                  {[creator.city, creator.state].filter(Boolean).join(', ')}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground/50">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  toggleFavoriteMutation.mutate({
                                    creatorId: creator.id,
                                    isFavorite: favoriteIds.includes(creator.id),
                                  })
                                }
                              >
                                <Heart
                                  className={`h-4 w-4 ${favoriteIds.includes(creator.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                                />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                <Link href={`/creator/${creator.id}/profile`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                                    <Send className="h-3.5 w-3.5 mr-1" />
                                    Convidar
                                    <ChevronDown className="h-3 w-3 ml-0.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onSelect={() => {
                                      setSelectedCreatorForInvite({
                                        id: creator.id,
                                        name: creator.name,
                                      });
                                      setInviteModalOpen(true);
                                    }}
                                  >
                                    <Send className="h-4 w-4 mr-2" />
                                    Convidar para Campanha
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    disabled={communityInviting === creator.id}
                                    onSelect={() => handleInviteCommunity(creator.id)}
                                  >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    {communityInviting === creator.id
                                      ? 'Enviando...'
                                      : 'Convidar para Comunidade'}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div
                  className="flex items-center justify-between mt-6 pt-4 border-t"
                  data-testid="pagination"
                >
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                    {Math.min(currentPage * ITEMS_PER_PAGE, totalCreators)} de {totalCreators}{' '}
                    criadores
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {(() => {
                      const pages: number[] = [];
                      const start = Math.max(1, currentPage - 2);
                      const end = Math.min(totalPages, currentPage + 2);
                      for (let i = start; i <= end; i++) pages.push(i);
                      return pages.map((page) => (
                        <Button
                          key={page}
                          variant={page === currentPage ? 'default' : 'outline'}
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => handlePageChange(page)}
                          data-testid={`button-page-${page}`}
                        >
                          {page}
                        </Button>
                      ));
                    })()}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      data-testid="button-next-page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="discover" className="mt-6" data-testid="content-discover">
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="@username ou #hashtag"
                value={discoverySearch}
                onChange={(e) => setDiscoverySearch(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => e.key === 'Enter' && handleDiscoverySearch()}
                data-testid="input-discovery-search"
              />
            </div>
            <Button
              onClick={handleDiscoverySearch}
              disabled={isSearching || !discoverySearch.trim()}
              data-testid="button-search-discovery"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Buscar
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            Digite um nome de usuario do Instagram (sem @) para validar o perfil, ou uma hashtag (#)
            para descobrir criadores.
          </p>

          {isSearching && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Buscando perfil...</span>
            </div>
          )}

          {discoveryResult && discoveryResult.exists && (
            <Card className="max-w-lg mb-8" data-testid="card-discovery-result">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={discoveryResult.profilePicUrl} />
                    <AvatarFallback>{discoveryResult.username[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg" data-testid="text-discovery-name">
                      {discoveryResult.fullName || discoveryResult.username}
                    </h3>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Instagram className="h-4 w-4" />@{discoveryResult.username}
                      {discoveryResult.isVerified && (
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                      )}
                    </p>
                    {discoveryResult.isPrivate && (
                      <Badge variant="secondary" className="mt-1">
                        Perfil Privado
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pb-2">
                {discoveryResult.bio && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {discoveryResult.bio}
                  </p>
                )}

                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="font-semibold" data-testid="text-discovery-followers">
                      {formatFollowers(discoveryResult.followers)}
                    </span>
                    <span className="text-muted-foreground ml-1">seguidores</span>
                  </div>
                  <div>
                    <span className="font-semibold">
                      {formatFollowers(discoveryResult.following)}
                    </span>
                    <span className="text-muted-foreground ml-1">seguindo</span>
                  </div>
                  <div>
                    <span className="font-semibold">{discoveryResult.postsCount || 0}</span>
                    <span className="text-muted-foreground ml-1">posts</span>
                  </div>
                </div>

                {discoveryResult.engagementRate && (
                  <div className="mt-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      Engajamento: <strong>{discoveryResult.engagementRate}%</strong>
                    </span>
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-2">
                <Button
                  onClick={() => saveProfileMutation.mutate(discoveryResult)}
                  disabled={saveProfileMutation.isPending}
                  className="w-full"
                  data-testid="button-save-profile"
                >
                  {saveProfileMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar Perfil
                </Button>
              </CardFooter>
            </Card>
          )}

          {discoveryResult && !discoveryResult.exists && (
            <div className="text-center py-12 text-muted-foreground" data-testid="empty-discovery">
              <Instagram className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Perfil nao encontrado no Instagram.</p>
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Perfis Salvos</h2>

            {loadingSavedProfiles ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : savedProfiles.length === 0 ? (
              <div
                className="text-center py-8 text-muted-foreground"
                data-testid="empty-saved-profiles"
              >
                <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum perfil salvo ainda.</p>
                <p className="text-sm">Busque criadores acima e salve seus perfis.</p>
              </div>
            ) : (
              <div
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
                data-testid="grid-saved-profiles"
              >
                {savedProfiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="rounded-xl border border-border/50 bg-gradient-to-b from-primary/5 via-card to-card overflow-hidden transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
                    data-testid={`card-saved-profile-${profile.id}`}
                  >
                    <div className="h-12 bg-gradient-to-r from-violet-600/20 via-purple-500/15 to-pink-500/20 relative">
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
                        <Avatar className="h-12 w-12 ring-2 ring-card shadow-lg">
                          <AvatarImage src={profile.avatarUrl || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-pink-500 text-white font-bold">
                            {(profile.displayName || profile.instagramHandle)?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                    <div className="pt-8 pb-3 px-3 flex flex-col items-center text-center">
                      <h3 className="font-semibold text-sm truncate max-w-full">
                        {profile.displayName || profile.instagramHandle}
                      </h3>
                      <p className="text-xs text-muted-foreground">@{profile.instagramHandle}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-medium">
                          {formatFollowers(profile.followers)}
                        </span>
                      </div>
                      {profile.engagementRate && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {profile.engagementRate}% eng.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <InviteToCampaignModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        creatorId={selectedCreatorForInvite?.id || 0}
        creatorName={selectedCreatorForInvite?.name || ''}
      />
    </div>
  );
}
