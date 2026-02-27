import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useMarketplace } from '@/lib/provider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  Filter,
  Instagram,
  Youtube,
  ExternalLink,
  Heart,
  Users,
  ChevronDown,
  ChevronUp,
  X,
  MapPin,
  Send,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Image,
  Star,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { InviteToCampaignModal } from '@/components/InviteToCampaignModal';
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
import { toast } from 'sonner';
import { NICHE_OPTIONS, AGE_RANGE_OPTIONS, STATE_OPTIONS } from '@shared/constants';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DataTable, Column } from '@/components/data-table';
import { ViewToggle } from '@/components/view-toggle';
import { useViewPreference } from '@/hooks/use-view-preference';
import type { User } from '@shared/schema';
import { calculateAge } from '@shared/utils';
import { getAvatarUrl } from '@/lib/utils';

export default function CreatorsList() {
  const { creators } = useMarketplace();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [nicheFilter, setNicheFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [ageRangeFilter, setAgeRangeFilter] = useState<string>('all');
  const [minFollowers, setMinFollowers] = useState<string>('');
  const [minAuthenticityScore, setMinAuthenticityScore] = useState<string>('');
  const [minEngagement, setMinEngagement] = useState<string>('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useViewPreference('company-creators-view');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedCreatorForInvite, setSelectedCreatorForInvite] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchPicUrls, setBatchPicUrls] = useState<Map<string, string>>(new Map());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const ITEMS_PER_PAGE = 12;

  // Fetch discovery stats (campaigns, ratings)
  const { data: discoveryStats = [] } = useQuery<
    {
      id: number;
      campaignsCount: number;
      averageRating: number;
      reviewsCount: number;
    }[]
  >({
    queryKey: ['/api/creators/discovery-stats'],
    select: (data: any[]) =>
      data.map((d: any) => ({
        id: d.id,
        campaignsCount: d.campaignsCount || 0,
        averageRating: d.averageRating || 0,
        reviewsCount: d.reviewsCount || 0,
      })),
  });

  const statsMap = new Map(discoveryStats.map((s) => [s.id, s]));

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

  const getCreatorPicUrl = (creator: User): string | undefined => {
    // Foto salva (Object Storage ou outra URL válida)
    if (creator.instagramProfilePic && !creator.instagramProfilePic.includes('dicebear')) {
      return creator.instagramProfilePic;
    }
    // Batch cache
    if (creator.instagram) {
      const clean = creator.instagram.replace('@', '').trim().toLowerCase();
      const batchUrl = batchPicUrls.get(clean);
      if (batchUrl) return batchUrl;
    }
    // Sem instagram → avatar normal
    if (!creator.instagram) return getAvatarUrl(creator.avatar) || undefined;
    return undefined; // InstagramAvatar faz auto-fetch
  };

  // Fetch favorite creators
  const { data: favoriteIds = [] } = useQuery({
    queryKey: ['/api/favorites'],
    queryFn: async () => {
      const res = await fetch('/api/favorites', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch favorites');
      return res.json() as Promise<number[]>;
    },
  });

  // Toggle favorite mutation
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
      // Optimistically update the cache
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
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousFavorites) {
        queryClient.setQueryData(['/api/favorites'], context.previousFavorites);
      }
      toast.error('Erro ao atualizar favorito');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
    },
  });

  const [communityInviting, setCommunityInviting] = useState<number | null>(null);

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
        const text = await res.text();
        let errorMsg = 'Erro ao enviar convite';
        try {
          const data = JSON.parse(text);
          errorMsg = data.error || errorMsg;
        } catch {
          if (res.status === 403)
            errorMsg = 'Sem permissão. Verifique se você está logado como empresa.';
          else if (res.status === 400) errorMsg = 'Nenhuma empresa ativa selecionada.';
        }
        toast.error(errorMsg);
        return;
      }
      toast.success('Convite para comunidade enviado!');
    } catch {
      toast.error('Erro de conexão ao enviar convite.');
    } finally {
      setCommunityInviting(null);
    }
  };

  const filteredCreators = creators.filter((creator) => {
    if (!creator.instagram && !creator.tiktok) return false;

    // Search filter
    const matchesSearch =
      creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creator.bio?.toLowerCase().includes(searchTerm.toLowerCase());

    // Niche filter
    let matchesNiche = true;
    if (nicheFilter !== 'all') {
      if (!creator.niche || creator.niche.length === 0) {
        matchesNiche = false;
      } else {
        matchesNiche = creator.niche.some(
          (niche) => niche.toLowerCase() === nicheFilter.toLowerCase(),
        );
      }
    }

    // Gender filter
    let matchesGender = true;
    if (genderFilter !== 'all') {
      matchesGender = creator.gender === genderFilter;
    }

    // Age range filter
    let matchesAgeRange = true;
    if (ageRangeFilter !== 'all') {
      if (!creator.dateOfBirth) {
        matchesAgeRange = false;
      } else {
        const creatorAge = calculateAge(creator.dateOfBirth);
        const [min, max] = ageRangeFilter
          .split('-')
          .map((s) => (s === '+' ? Infinity : parseInt(s.replace('+', ''))));
        matchesAgeRange = creatorAge >= min && (max ? creatorAge <= max : true);
      }
    }

    // Min followers filter - only pass if creator has verified metrics and meets threshold
    let matchesFollowers = true;
    if (minFollowers) {
      const minFollowersNum = parseInt(minFollowers);
      if (creator.instagramFollowers === null || creator.instagramFollowers === undefined) {
        matchesFollowers = false;
      } else {
        matchesFollowers = creator.instagramFollowers >= minFollowersNum;
      }
    }

    // Min authenticity score filter - only pass if creator has verified metrics and meets threshold
    let matchesAuthenticity = true;
    if (minAuthenticityScore) {
      const minScoreNum = parseInt(minAuthenticityScore);
      if (
        creator.instagramAuthenticityScore === null ||
        creator.instagramAuthenticityScore === undefined
      ) {
        matchesAuthenticity = false;
      } else {
        matchesAuthenticity = creator.instagramAuthenticityScore >= minScoreNum;
      }
    }

    // Min engagement filter
    let matchesEngagement = true;
    if (minEngagement) {
      const minEngNum = parseFloat(minEngagement);
      if (!creator.instagramEngagementRate) {
        matchesEngagement = false;
      } else {
        matchesEngagement = parseFloat(creator.instagramEngagementRate) >= minEngNum;
      }
    }

    // State filter
    let matchesState = true;
    if (stateFilter !== 'all') {
      matchesState = creator.state === stateFilter;
    }

    // Favorites filter
    const matchesFavorites = !showFavoritesOnly || favoriteIds.includes(creator.id);

    return (
      matchesSearch &&
      matchesNiche &&
      matchesGender &&
      matchesAgeRange &&
      matchesFollowers &&
      matchesAuthenticity &&
      matchesEngagement &&
      matchesState &&
      matchesFavorites
    );
  });

  // Sort creators
  const sortedCreators = [...filteredCreators].sort((a, b) => {
    switch (sortBy) {
      case 'followers_desc':
        return (b.instagramFollowers || 0) - (a.instagramFollowers || 0);
      case 'followers_asc':
        return (a.instagramFollowers || 0) - (b.instagramFollowers || 0);
      case 'engagement_desc':
        return (
          parseFloat(b.instagramEngagementRate || '0') -
          parseFloat(a.instagramEngagementRate || '0')
        );
      case 'engagement_asc':
        return (
          parseFloat(a.instagramEngagementRate || '0') -
          parseFloat(b.instagramEngagementRate || '0')
        );
      case 'authenticity_desc':
        return (b.instagramAuthenticityScore || 0) - (a.instagramAuthenticityScore || 0);
      case 'name':
      default:
        return a.name.localeCompare(b.name);
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedCreators.length / ITEMS_PER_PAGE);
  const paginatedCreators = sortedCreators.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    nicheFilter,
    genderFilter,
    ageRangeFilter,
    minFollowers,
    minAuthenticityScore,
    minEngagement,
    stateFilter,
    sortBy,
    showFavoritesOnly,
  ]);

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedCreators.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedCreators.map((c) => c.id)));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Helper: format follower count compactly
  const formatFollowers = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  };

  // Define table columns
  const columns: Column<User>[] = [
    {
      key: 'select',
      label: '',
      render: (creator) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selectedIds.has(creator.id)}
            onCheckedChange={() => toggleSelect(creator.id)}
            data-testid={`checkbox-select-${creator.id}`}
          />
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Nome',
      sortable: true,
      render: (creator) => (
        <Link href={`/creator/${creator.id}/profile`}>
          <div className="flex items-center gap-3">
            {creator.instagram ? (
              <InstagramAvatar
                username={creator.instagram}
                initialPicUrl={getCreatorPicUrl(creator)}
                size="md"
                data-testid={`avatar-creator-${creator.id}`}
              />
            ) : (
              <Avatar className="h-10 w-10">
                <AvatarImage src={getAvatarUrl(creator.avatar)} />
                <AvatarFallback>{creator.name[0]}</AvatarFallback>
              </Avatar>
            )}
            <div>
              <div className="font-medium hover:underline flex items-center gap-1">
                {creator.name}
                <InstagramVerifiedBadge type="platform" size="sm" />
                {creator.instagramVerified && <InstagramVerifiedBadge type="meta" size="sm" />}
              </div>
              {creator.instagram && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Instagram className="h-3 w-3" />@{creator.instagram.replace('@', '')}
                </div>
              )}
            </div>
          </div>
        </Link>
      ),
    },
    {
      key: 'instagramFollowers',
      label: 'Seguidores',
      sortable: true,
      className: 'hidden md:table-cell',
      render: (creator) => (
        <div className="text-sm">
          {creator.instagramFollowers !== null && creator.instagramFollowers !== undefined ? (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">{formatFollowers(creator.instagramFollowers)}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'instagramPosts',
      label: 'Posts',
      className: 'hidden xl:table-cell',
      render: (creator) => (
        <div className="text-sm">
          {creator.instagramPosts ? (
            <div className="flex items-center gap-1">
              <Image className="h-3 w-3 text-muted-foreground" />
              <span>{creator.instagramPosts.toLocaleString()}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'campaignsCount',
      label: 'Campanhas',
      className: 'hidden lg:table-cell text-center',
      render: (creator) => {
        const stats = statsMap.get(creator.id);
        return (
          <div className="text-sm text-center">
            <span className="font-medium">{stats?.campaignsCount ?? 0}</span>
          </div>
        );
      },
    },
    {
      key: 'rating',
      label: 'Nota',
      className: 'hidden lg:table-cell text-center',
      render: (creator) => {
        const stats = statsMap.get(creator.id);
        if (!stats || stats.reviewsCount === 0) {
          return <span className="text-muted-foreground/50">—</span>;
        }
        return (
          <div className="flex items-center justify-center gap-1">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{stats.averageRating.toFixed(1)}</span>
          </div>
        );
      },
    },
    {
      key: 'city',
      label: 'Localização',
      className: 'hidden xl:table-cell',
      render: (creator) => (
        <div className="text-sm">
          {creator.city || creator.state ? (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span>{[creator.city, creator.state].filter(Boolean).join(', ')}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (creator) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Ver Perfil">
            <Link
              href={`/creator/${creator.id}/profile`}
              data-testid={`button-view-profile-${creator.id}`}
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                size="sm"
                onClick={(e) => e.stopPropagation()}
                data-testid={`button-invite-table-${creator.id}`}
              >
                <Send className="h-3 w-3 mr-1" />
                Convidar
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => {
                  setSelectedCreatorForInvite({ id: creator.id, name: creator.name });
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
                {communityInviting === creator.id ? 'Enviando...' : 'Convidar para Comunidade'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavoriteMutation.mutate({
                creatorId: creator.id,
                isFavorite: favoriteIds.includes(creator.id),
              });
            }}
            data-testid={`button-favorite-${creator.id}`}
          >
            <Heart
              className={`h-4 w-4 ${favoriteIds.includes(creator.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
            />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1
            className="text-3xl font-bold font-heading tracking-tight"
            data-testid="text-page-title"
          >
            Banco de Talentos
          </h1>
          <p className="text-muted-foreground">
            Encontre os criadores ideais para sua próxima campanha.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, bio ou keywords..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search"
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
            Filtros Avançados
            {showFilters ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </Button>
        </div>

        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleContent className="space-y-4 border rounded-lg p-4 bg-muted/30">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-sm">Filtros</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNicheFilter('all');
                  setGenderFilter('all');
                  setAgeRangeFilter('all');
                  setMinFollowers('');
                  setMinAuthenticityScore('');
                  setMinEngagement('');
                  setStateFilter('all');
                  setSortBy('name');
                }}
                data-testid="button-clear-filters"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  Gênero
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
                    <SelectItem value="prefiro_nao_informar">Não informado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Faixa Etária
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
                  Seguidores Mínimos (Instagram)
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
                  Score de Autenticidade Mínimo
                </label>
                <Input
                  type="number"
                  placeholder="0-100"
                  min="0"
                  max="100"
                  value={minAuthenticityScore}
                  onChange={(e) => setMinAuthenticityScore(e.target.value)}
                  data-testid="input-min-authenticity"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Engajamento Mínimo (%)
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
                  Ordenar por
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger data-testid="select-sort">
                    <SelectValue placeholder="Nome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nome (A-Z)</SelectItem>
                    <SelectItem value="followers_desc">Mais Seguidores</SelectItem>
                    <SelectItem value="followers_asc">Menos Seguidores</SelectItem>
                    <SelectItem value="engagement_desc">Maior Engajamento</SelectItem>
                    <SelectItem value="engagement_asc">Menor Engajamento</SelectItem>
                    <SelectItem value="authenticity_desc">Maior Autenticidade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="text-xs text-muted-foreground pt-2 border-t">
              Mostrando {sortedCreators.length} de {creators.length} criadores
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Conditional View: Table or Cards */}
      {viewMode === 'table' ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <Checkbox
              checked={sortedCreators.length > 0 && selectedIds.size === sortedCreators.length}
              onCheckedChange={toggleSelectAll}
              data-testid="checkbox-select-all"
            />
            <span className="text-sm text-muted-foreground">
              {selectedIds.size > 0 ? `${selectedIds.size} selecionado(s)` : 'Selecionar todos'}
            </span>
          </div>
          <DataTable
            columns={columns}
            data={sortedCreators}
            keyExtractor={(creator) => creator.id}
            data-testid="creators-table"
          />
          {selectedIds.size > 0 && (
            <div
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-300"
              data-testid="floating-action-bar"
            >
              <span className="text-sm font-medium">
                {selectedIds.size} criador(es) selecionado(s)
              </span>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full"
                onClick={() => {
                  const firstId = Array.from(selectedIds)[0];
                  const creator = sortedCreators.find((c) => c.id === firstId);
                  if (selectedIds.size === 1 && creator) {
                    setSelectedCreatorForInvite({ id: creator.id, name: creator.name });
                    setInviteModalOpen(true);
                  } else {
                    toast.info(`${selectedIds.size} criadores selecionados para convite`);
                  }
                }}
                data-testid="button-bulk-invite"
              >
                <Send className="h-4 w-4 mr-2" />
                Convidar {selectedIds.size} criador(es)
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary-foreground/10"
                onClick={() => setSelectedIds(new Set())}
                data-testid="button-clear-selection"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedCreators.map((creator) => (
            <Card
              key={creator.id}
              className="border border-border/50 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
            >
              <div className="h-20 bg-gradient-to-br from-purple-600/20 to-indigo-600/10"></div>
              <div className="px-6 -mt-12 flex justify-between items-end">
                {creator.instagram ? (
                  <InstagramAvatar
                    username={creator.instagram}
                    initialPicUrl={getCreatorPicUrl(creator)}
                    size="xl"
                    className="border-4 border-background shadow-sm"
                    data-testid={`avatar-creator-card-${creator.id}`}
                  />
                ) : (
                  <Avatar className="h-16 w-16 border-4 border-background shadow-sm">
                    <AvatarImage src={getAvatarUrl(creator.avatar)} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      {creator.name[0]}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="flex items-center gap-2 mb-4">
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
                  <InstagramVerifiedBadge type="platform" size="lg" />
                  {creator.instagramVerified && <InstagramVerifiedBadge type="meta" size="lg" />}
                </div>

                {/* Instagram Metrics */}
                {creator.instagram && creator.instagramFollowers !== null ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Instagram className="h-3 w-3 text-pink-600" />
                      <span className="text-muted-foreground">
                        @{creator.instagram.replace('@', '')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span className="font-semibold">
                        {formatFollowers(creator.instagramFollowers!)}
                      </span>
                    </div>

                    {/* Location */}
                    {(creator.city || creator.state) && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{[creator.city, creator.state].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{creator.followers || '0'} seguidores</span>
                    </div>
                    {(creator.city || creator.state) && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{[creator.city, creator.state].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
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
                      data-testid={`link-instagram-${creator.id}`}
                    >
                      <Instagram className="w-4 h-4" />
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
                      data-testid={`link-youtube-${creator.id}`}
                    >
                      <Youtube className="w-4 h-4" />
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
                      data-testid={`link-tiktok-${creator.id}`}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.73a8.19 8.19 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.16z" />
                      </svg>
                    </a>
                  )}
                </div>
              </CardContent>

              <CardFooter className="pt-2 border-t border-border/50 flex gap-2">
                <Button className="flex-1" variant="outline" size="sm" asChild>
                  <Link
                    href={`/creator/${creator.id}/profile`}
                    data-testid={`button-view-profile-${creator.id}`}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ver Perfil
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="default" size="sm" data-testid={`button-invite-${creator.id}`}>
                      <Send className="w-4 h-4 mr-1" />
                      Convidar
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() => {
                        setSelectedCreatorForInvite({ id: creator.id, name: creator.name });
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

          {paginatedCreators.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Nenhum criador encontrado com os filtros atuais.
            </div>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && viewMode === 'cards' && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            data-testid="button-prev-page"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  className="w-9 h-9"
                  onClick={() => setCurrentPage(pageNum)}
                  data-testid={`button-page-${pageNum}`}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            data-testid="button-next-page"
          >
            Próximo
            <ChevronRight className="h-4 w-4" />
          </Button>

          <span className="text-sm text-muted-foreground ml-4">
            {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
            {Math.min(currentPage * ITEMS_PER_PAGE, sortedCreators.length)} de{' '}
            {sortedCreators.length}
          </span>
        </div>
      )}

      {selectedCreatorForInvite && (
        <InviteToCampaignModal
          open={inviteModalOpen}
          onOpenChange={(open) => {
            setInviteModalOpen(open);
            if (!open) setSelectedCreatorForInvite(null);
          }}
          creatorId={selectedCreatorForInvite.id}
          creatorName={selectedCreatorForInvite.name}
        />
      )}
    </div>
  );
}
