import { useState, useMemo, useEffect, useRef } from 'react';
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
import { toast } from 'sonner';
import { NICHE_OPTIONS } from '@shared/constants';
import {
  Search,
  Users,
  TrendingUp,
  CheckCircle,
  Instagram,
  Loader2,
  Save,
  ExternalLink,
  UserPlus,
  ChevronDown,
  Send,
  MapPin,
  Eye,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
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
  city: string | null;
  state: string | null;
  niche: string[] | null;
  campaignsCount: number;
  communitiesCount: number;
  instagramValidated?: boolean;
}

const ITEMS_PER_PAGE = 25;

export default function CreatorDiscoveryPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('platform');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const [platformSearch, setPlatformSearch] = useState('');
  const [nicheFilter, setNicheFilter] = useState<string>('all');
  const [minFollowers, setMinFollowers] = useState<string>('');
  const [maxFollowers, setMaxFollowers] = useState<string>('');

  const [discoverySearch, setDiscoverySearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [discoveryResult, setDiscoveryResult] = useState<InstagramProfile | null>(null);

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedCreatorForInvite, setSelectedCreatorForInvite] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [communityInviting, setCommunityInviting] = useState<number | null>(null);
  const [batchPicUrls, setBatchPicUrls] = useState<Map<string, string>>(new Map());

  const { data: creators = [], isLoading: loadingCreators } = useQuery<CreatorDiscoveryStat[]>({
    queryKey: ['/api/creators/discovery-stats'],
    queryFn: async () => {
      const res = await fetch('/api/creators/discovery-stats', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch creators');
      return res.json();
    },
  });

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
        .catch(() => {});
    }
  }, [loadingCreators, creators.length]);

  // Batch fetch profile pics for all creators with instagram
  useEffect(() => {
    if (!creators || creators.length === 0) return;
    const usernames = creators.filter((c) => c.instagram).map((c) => c.instagram!);
    if (usernames.length === 0) return;
    batchFetchProfilePics(usernames).then(setBatchPicUrls);
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

  const filteredCreators = useMemo(() => {
    return creators.filter((creator) => {
      if (
        creator.instagram &&
        !creator.instagramValidated &&
        (!creator.instagramFollowers || creator.instagramFollowers === 0)
      ) {
        return false;
      }

      const matchesSearch =
        platformSearch === '' ||
        creator.name.toLowerCase().includes(platformSearch.toLowerCase()) ||
        creator.instagram?.toLowerCase().includes(platformSearch.toLowerCase());

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

      let matchesMinFollowers = true;
      if (minFollowers) {
        const minNum = parseInt(minFollowers);
        matchesMinFollowers = (creator.instagramFollowers || 0) >= minNum;
      }

      let matchesMaxFollowers = true;
      if (maxFollowers) {
        const maxNum = parseInt(maxFollowers);
        matchesMaxFollowers = (creator.instagramFollowers || 0) <= maxNum;
      }

      return matchesSearch && matchesNiche && matchesMinFollowers && matchesMaxFollowers;
    });
  }, [creators, platformSearch, nicheFilter, minFollowers, maxFollowers]);

  const totalPages = Math.ceil(filteredCreators.length / ITEMS_PER_PAGE);
  const paginatedCreators = filteredCreators.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

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
        toast.info('Busca por hashtag ainda não disponível');
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
          toast.error('Perfil não encontrado');
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
          data.error || 'Erro ao enviar convite. Verifique se você tem uma empresa selecionada.',
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Banco de Talentos"
        description="Encontre os criadores ideais para sua próxima campanha."
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
            {filteredCreators.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 text-[10px] px-1.5 py-0 h-5"
                data-testid="badge-creators-count"
              >
                {filteredCreators.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="discover" data-testid="tab-discover">
            <Instagram className="h-4 w-4 mr-2" />
            Descobrir Novos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="platform" className="mt-6" data-testid="content-platform">
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, bio ou keywords..."
                value={platformSearch}
                onChange={(e) => {
                  setPlatformSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
                data-testid="input-platform-search"
              />
            </div>

            <Select
              value={nicheFilter}
              onValueChange={(v) => {
                setNicheFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]" data-testid="select-niche">
                <SelectValue placeholder="Nicho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os nichos</SelectItem>
                {NICHE_OPTIONS.map((niche) => (
                  <SelectItem key={niche.value} value={niche.value}>
                    {niche.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Seguidores mín"
              value={minFollowers}
              onChange={(e) => {
                setMinFollowers(e.target.value);
                setCurrentPage(1);
              }}
              className="w-[130px]"
              data-testid="input-min-followers"
            />

            <Input
              type="number"
              placeholder="Seguidores máx"
              value={maxFollowers}
              onChange={(e) => {
                setMaxFollowers(e.target.value);
                setCurrentPage(1);
              }}
              className="w-[130px]"
              data-testid="input-max-followers"
            />
          </div>

          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground" data-testid="text-total-results">
              {filteredCreators.length}{' '}
              {filteredCreators.length === 1 ? 'criador encontrado' : 'criadores encontrados'}
            </p>
            <div
              className="flex items-center gap-1 border rounded-lg p-0.5"
              data-testid="view-mode-toggle"
            >
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'cards' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                data-testid="button-view-cards"
                title="Visualizar como cards"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                data-testid="button-view-table"
                title="Visualizar como tabela"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {loadingCreators ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredCreators.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground" data-testid="empty-platform">
              Nenhum criador encontrado com os filtros selecionados.
            </div>
          ) : (
            <>
              {viewMode === 'cards' ? (
                <div
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
                  data-testid="grid-platform-creators"
                >
                  {paginatedCreators.map((creator) => (
                    <div
                      key={creator.id}
                      className="group relative rounded-xl border border-border/50 bg-gradient-to-b from-primary/5 via-card to-card overflow-hidden transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
                      data-testid={`card-creator-${creator.id}`}
                    >
                      <div className="h-16 bg-gradient-to-r from-violet-600/20 via-purple-500/15 to-pink-500/20 relative">
                        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2">
                          {creator.instagram ? (
                            <InstagramAvatar
                              username={creator.instagram}
                              initialPicUrl={getCreatorPicUrl(creator)}
                              size="md"
                              className="h-14 w-14 ring-3 ring-card shadow-lg"
                            />
                          ) : (
                            <Avatar className="h-14 w-14 ring-3 ring-card shadow-lg">
                              <AvatarImage src={getAvatarUrl(creator.avatar)} />
                              <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-violet-500 to-pink-500 text-white">
                                {creator.name[0]}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </div>

                      <div className="pt-10 pb-3 px-3 flex flex-col items-center text-center">
                        <h3
                          className="font-semibold text-sm leading-tight flex items-center gap-1"
                          data-testid={`text-name-${creator.id}`}
                        >
                          <span className="truncate max-w-[140px]">
                            {creator.name.split(' ').slice(0, 2).join(' ')}
                          </span>
                          {creator.instagramValidated && (
                            <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          )}
                        </h3>

                        {creator.instagram && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            @{creator.instagram.replace('@', '')}
                          </p>
                        )}

                        <div className="flex items-center gap-1 mt-2">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span
                            className="text-sm font-semibold"
                            data-testid={`text-followers-${creator.id}`}
                          >
                            {formatFollowers(creator.instagramFollowers)}
                          </span>
                        </div>

                        {creator.city && creator.state && (
                          <p className="text-[11px] text-muted-foreground/70 flex items-center gap-0.5 mt-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {creator.city}, {creator.state}
                            </span>
                          </p>
                        )}

                        {(creator.campaignsCount > 0 || creator.communitiesCount > 0) && (
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap justify-center">
                            {creator.campaignsCount > 0 && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 h-5"
                                data-testid={`text-campaigns-${creator.id}`}
                              >
                                {creator.campaignsCount}{' '}
                                {creator.campaignsCount === 1 ? 'campanha' : 'campanhas'}
                              </Badge>
                            )}
                            {creator.communitiesCount > 0 && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 h-5"
                                data-testid={`text-communities-${creator.id}`}
                              >
                                {creator.communitiesCount}{' '}
                                {creator.communitiesCount === 1 ? 'comunidade' : 'comunidades'}
                              </Badge>
                            )}
                          </div>
                        )}

                        {creator.instagram && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center">
                              <Instagram className="h-3 w-3 text-white" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-border/40 grid grid-cols-2 divide-x divide-border/40">
                        <Link href={`/creator/${creator.id}/profile`}>
                          <button
                            className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                            data-testid={`button-view-${creator.id}`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Ver Perfil
                          </button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-primary hover:text-primary/80 hover:bg-primary/5 transition-colors cursor-pointer"
                              data-testid={`button-invite-${creator.id}`}
                            >
                              <Send className="h-3.5 w-3.5" />
                              Convidar
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedCreatorForInvite({ id: creator.id, name: creator.name });
                                setInviteModalOpen(true);
                              }}
                              data-testid={`action-invite-campaign-${creator.id}`}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Convidar para Campanha
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleInviteCommunity(creator.id)}
                              disabled={communityInviting === creator.id}
                              data-testid={`action-invite-community-${creator.id}`}
                            >
                              {communityInviting === creator.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Users className="h-4 w-4 mr-2" />
                              )}
                              Convidar para Comunidade
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border" data-testid="table-platform-creators">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>@Instagram</TableHead>
                        <TableHead>Seguidores</TableHead>
                        <TableHead>Cidade/Estado</TableHead>
                        <TableHead>Nicho</TableHead>
                        <TableHead className="text-center">Campanhas</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedCreators.map((creator) => (
                        <TableRow
                          key={creator.id}
                          className="group"
                          data-testid={`row-creator-${creator.id}`}
                        >
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
                            <div className="flex items-center gap-1.5">
                              <span
                                className="font-medium text-sm"
                                data-testid={`text-table-name-${creator.id}`}
                              >
                                {creator.name.split(' ').slice(0, 2).join(' ')}
                              </span>
                              {creator.instagramValidated && (
                                <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {creator.instagram ? (
                              <span
                                className="text-sm text-muted-foreground"
                                data-testid={`text-table-instagram-${creator.id}`}
                              >
                                @{creator.instagram.replace('@', '')}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground/50">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span
                              className="text-sm font-semibold"
                              data-testid={`text-table-followers-${creator.id}`}
                            >
                              {formatFollowers(creator.instagramFollowers)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {creator.city && creator.state ? (
                              <span
                                className="text-sm text-muted-foreground"
                                data-testid={`text-table-location-${creator.id}`}
                              >
                                {creator.city}, {creator.state}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground/50">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 flex-wrap">
                              {creator.niche && creator.niche.length > 0 ? (
                                creator.niche.slice(0, 2).map((n, i) => (
                                  <Badge
                                    key={i}
                                    variant="secondary"
                                    className="text-[10px] px-1.5 py-0 h-5"
                                    data-testid={`badge-niche-${creator.id}-${i}`}
                                  >
                                    {getNicheLabel(n)}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-sm text-muted-foreground/50">—</span>
                              )}
                              {creator.niche && creator.niche.length > 2 && (
                                <span className="text-[10px] text-muted-foreground">
                                  +{creator.niche.length - 2}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className="text-sm"
                              data-testid={`text-table-campaigns-${creator.id}`}
                            >
                              {creator.campaignsCount}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link href={`/creator/${creator.id}/profile`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  data-testid={`button-table-view-${creator.id}`}
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  Ver Perfil
                                </Button>
                              </Link>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-primary"
                                    data-testid={`button-table-invite-${creator.id}`}
                                  >
                                    <Send className="h-3.5 w-3.5 mr-1" />
                                    Convidar
                                    <ChevronDown className="h-3 w-3 ml-0.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedCreatorForInvite({
                                        id: creator.id,
                                        name: creator.name,
                                      });
                                      setInviteModalOpen(true);
                                    }}
                                    data-testid={`action-table-invite-campaign-${creator.id}`}
                                  >
                                    <Send className="h-4 w-4 mr-2" />
                                    Convidar para Campanha
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleInviteCommunity(creator.id)}
                                    disabled={communityInviting === creator.id}
                                    data-testid={`action-table-invite-community-${creator.id}`}
                                  >
                                    {communityInviting === creator.id ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <Users className="h-4 w-4 mr-2" />
                                    )}
                                    Convidar para Comunidade
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

              {totalPages > 1 && (
                <div
                  className="flex items-center justify-between mt-6 pt-4 border-t"
                  data-testid="pagination"
                >
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredCreators.length)} de{' '}
                    {filteredCreators.length} criadores
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
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                    ))}
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
            Digite um nome de usuário do Instagram (sem @) para validar o perfil, ou uma hashtag (#)
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
              <p>Perfil não encontrado no Instagram.</p>
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
