import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useMarketplace } from '@/lib/provider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Instagram, Youtube, Linkedin, Mail, ExternalLink, Heart, Users, TrendingUp, Shield, ChevronDown, ChevronUp, X, MapPin, Send, ChevronLeft, ChevronRight, BadgeCheck } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { InviteToCampaignModal } from '@/components/InviteToCampaignModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { InstagramAvatar, batchFetchProfilePics } from '@/components/instagram-avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [selectedCreatorForInvite, setSelectedCreatorForInvite] = useState<{ id: number; name: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchPicUrls, setBatchPicUrls] = useState<Map<string, string>>(new Map());
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    if (!creators || creators.length === 0) return;
    const usernames = creators
      .filter(c => c.instagram)
      .map(c => c.instagram!);
    if (usernames.length === 0) return;

    batchFetchProfilePics(usernames).then(picMap => {
      setBatchPicUrls(picMap);
    });
  }, [creators]);

  const getCreatorPicUrl = (creator: User): string | undefined => {
    if (creator.instagramProfilePic?.startsWith('/api/storage/')) {
      return creator.instagramProfilePic;
    }
    if (creator.instagram) {
      const clean = creator.instagram.replace('@', '').trim().toLowerCase();
      const batchUrl = batchPicUrls.get(clean);
      if (batchUrl) return batchUrl;
    }
    const avatarUrl = getAvatarUrl(creator.avatar);
    return avatarUrl || undefined;
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
          old.filter(id => id !== creatorId)
        );
      } else {
        queryClient.setQueryData<number[]>(['/api/favorites'], (old = []) => 
          [...old, creatorId]
        );
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

  const filteredCreators = creators.filter(creator => {
    if (!creator.instagram && !creator.tiktok) return false;

    // Search filter
    const matchesSearch = creator.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          creator.bio?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Niche filter
    let matchesNiche = true;
    if (nicheFilter !== 'all') {
      if (!creator.niche || creator.niche.length === 0) {
        matchesNiche = false;
      } else {
        matchesNiche = creator.niche.some(niche => 
          niche.toLowerCase() === nicheFilter.toLowerCase()
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
        const [min, max] = ageRangeFilter.split('-').map(s => s === '+' ? Infinity : parseInt(s.replace('+', '')));
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
      if (creator.instagramAuthenticityScore === null || creator.instagramAuthenticityScore === undefined) {
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

    return matchesSearch && matchesNiche && matchesGender && matchesAgeRange && matchesFollowers && matchesAuthenticity && matchesEngagement && matchesState;
  });

  // Sort creators
  const sortedCreators = [...filteredCreators].sort((a, b) => {
    switch (sortBy) {
      case 'followers_desc':
        return (b.instagramFollowers || 0) - (a.instagramFollowers || 0);
      case 'followers_asc':
        return (a.instagramFollowers || 0) - (b.instagramFollowers || 0);
      case 'engagement_desc':
        return parseFloat(b.instagramEngagementRate || '0') - parseFloat(a.instagramEngagementRate || '0');
      case 'engagement_asc':
        return parseFloat(a.instagramEngagementRate || '0') - parseFloat(b.instagramEngagementRate || '0');
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
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, nicheFilter, genderFilter, ageRangeFilter, minFollowers, minAuthenticityScore, minEngagement, stateFilter, sortBy]);

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedCreators.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedCreators.map(c => c.id)));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
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
              <div className="font-medium hover:underline">{creator.name}</div>
              {creator.instagram && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Instagram className="h-3 w-3" />
                  @{creator.instagram.replace('@', '')}
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
              <span className="font-medium">{creator.instagramFollowers.toLocaleString()}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'instagramEngagementRate',
      label: 'Engajamento',
      sortable: true,
      className: 'hidden lg:table-cell',
      render: (creator) => (
        <div className="text-sm">
          {creator.instagramEngagementRate ? (
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <span>{creator.instagramEngagementRate}%</span>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'city',
      label: 'Localização',
      className: 'hidden xl:table-cell',
      render: (creator) => (
        <div className="text-sm">
          {creator.state ? (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span>{creator.state}</span>
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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            asChild
            title="Ver Perfil"
          >
            <Link href={`/creator/${creator.id}/profile`} data-testid={`button-view-profile-${creator.id}`}>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCreatorForInvite({ id: creator.id, name: creator.name });
              setInviteModalOpen(true);
            }}
            data-testid={`button-invite-table-${creator.id}`}
          >
            <Send className="h-3 w-3 mr-1" />
            Convidar
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavoriteMutation.mutate({
                creatorId: creator.id,
                isFavorite: favoriteIds.includes(creator.id)
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
          <h1 className="text-3xl font-bold font-heading tracking-tight" data-testid="text-page-title">Banco de Talentos</h1>
          <p className="text-muted-foreground">Encontre os criadores ideais para sua próxima campanha.</p>
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
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="w-full md:w-auto"
            data-testid="button-toggle-filters"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros Avançados
            {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
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
                    {NICHE_OPTIONS.map(option => (
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
                    {AGE_RANGE_OPTIONS.map(option => (
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
                    {STATE_OPTIONS.map(option => (
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
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-300" data-testid="floating-action-bar">
              <span className="text-sm font-medium">{selectedIds.size} criador(es) selecionado(s)</span>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full"
                onClick={() => {
                  const firstId = Array.from(selectedIds)[0];
                  const creator = sortedCreators.find(c => c.id === firstId);
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
          <Card key={creator.id} className="border border-border/50 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
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
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">{creator.name[0]}</AvatarFallback>
                </Avatar>
              )}
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleFavoriteMutation.mutate({
                    creatorId: creator.id,
                    isFavorite: favoriteIds.includes(creator.id)
                  })}
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
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold truncate">{creator.name}</h3>
                <div className="shrink-0 group relative" data-testid={`badge-verified-${creator.id}`}>
                  <BadgeCheck className="h-5 w-5 text-green-500" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-popover border rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    Verificado CreatorConnect
                  </div>
                </div>
              </div>
              
              {/* Instagram Metrics if verified */}
              {creator.instagram && creator.instagramFollowers !== null ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Instagram className="h-3 w-3 text-pink-600" />
                    <span className="text-muted-foreground">@{creator.instagram.replace('@', '')}</span>
                    {creator.instagramVerified && (
                      <Shield className="h-3 w-3 text-blue-600" />
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span className="font-semibold">{creator.instagramFollowers?.toLocaleString()}</span>
                    </div>
                    {creator.instagramEngagementRate && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>{creator.instagramEngagementRate}% eng.</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Authenticity Score - Only visible to companies */}
                  {creator.instagramFollowers !== null && creator.instagramAuthenticityScore !== null && creator.instagramAuthenticityScore !== undefined && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-medium text-muted-foreground">Autenticidade</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold">{creator.instagramAuthenticityScore}/100</span>
                          {creator.instagramAuthenticityScore >= 80 && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 text-[10px] px-1 py-0">
                              Excelente
                            </Badge>
                          )}
                          {creator.instagramAuthenticityScore >= 60 && creator.instagramAuthenticityScore < 80 && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] px-1 py-0">
                              Bom
                            </Badge>
                          )}
                          {creator.instagramAuthenticityScore >= 40 && creator.instagramAuthenticityScore < 60 && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 text-[10px] px-1 py-0">
                              Regular
                            </Badge>
                          )}
                          {creator.instagramAuthenticityScore < 40 && (
                            <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200 text-[10px] px-1 py-0">
                              Baixo
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            creator.instagramAuthenticityScore >= 80 ? 'bg-green-500' :
                            creator.instagramAuthenticityScore >= 60 ? 'bg-blue-500' :
                            creator.instagramAuthenticityScore >= 40 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${creator.instagramAuthenticityScore}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{creator.followers || '0'} seguidores</span>
                  {creator.niche && creator.niche.length > 1 && (
                    <Badge variant="outline" className="text-xs">
                      +{creator.niche.length - 1} mais
                    </Badge>
                  )}
                </div>
              )}
              
            </CardHeader>
            
            <CardContent className="flex-1">
              <div className="flex gap-2">
                {creator.instagram && (
                  <a 
                    href={creator.instagram.startsWith('http') ? creator.instagram : `https://instagram.com/${creator.instagram.replace('@', '')}`}
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
                    href={creator.youtube.startsWith('http') ? creator.youtube : `https://youtube.com/@${creator.youtube.replace('@', '')}`}
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
                    href={creator.tiktok.startsWith('http') ? creator.tiktok : `https://tiktok.com/@${creator.tiktok.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                    title="TikTok"
                    data-testid={`link-tiktok-${creator.id}`}
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="pt-2 border-t border-border/50 flex gap-2">
              <Button 
                className="flex-1" 
                variant="outline"
                size="sm"
                asChild
              >
                <Link href={`/creator/${creator.id}/profile`} data-testid={`button-view-profile-${creator.id}`}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver Perfil
                </Link>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setSelectedCreatorForInvite({ id: creator.id, name: creator.name });
                  setInviteModalOpen(true);
                }}
                data-testid={`button-invite-${creator.id}`}
                title="Convidar para campanha"
              >
                <Send className="w-4 h-4 mr-1" />
                Convidar
              </Button>
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
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
                  variant={currentPage === pageNum ? "default" : "outline"}
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
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            data-testid="button-next-page"
          >
            Próximo
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <span className="text-sm text-muted-foreground ml-4">
            {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, sortedCreators.length)} de {sortedCreators.length}
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
