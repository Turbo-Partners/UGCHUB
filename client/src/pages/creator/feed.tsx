import { useState, useMemo, useEffect } from "react";
import { useMarketplace } from "@/lib/provider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  DollarSign,
  Calendar,
  Users,
  ArrowRight,
  CheckCircle,
  X,
  FileText,
  Building2,
  Star,
  ArrowUpDown,
  Clock,
  TrendingUp,
  Briefcase,
  Heart,
  HeartOff,
  MapPin,
  Loader2,
  ExternalLink,
  Sparkles,
  SlidersHorizontal,
  Compass,
  Package,
  Utensils,
  Coffee,
  Dumbbell,
  Home,
  Dog,
  Baby,
} from "lucide-react";
import { Link } from "wouter";
import { format, differenceInDays, addDays } from "date-fns";
import { DataTable, Column } from "@/components/data-table";
import { ViewToggle } from "@/components/view-toggle";
import { useViewPreference } from "@/hooks/use-view-preference";
import { getAvatarUrl } from "@/lib/utils";
import type { Campaign, Company } from "@shared/schema";

interface FavoriteCompanyWithDetails {
  id: number;
  creatorId: number;
  companyId: number;
  createdAt: string;
  company: Company;
}

function CompanyNameCell({ companyId, companiesMap }: { companyId: number; companiesMap: Map<number, { name: string; tradeName: string | null }> }) {
  const company = companiesMap.get(companyId);

  if (!company) return <span className="text-muted-foreground">Carregando...</span>;

  return (
    <Link href={`/company/${companyId}/profile`}>
      <div className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer">
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
          {(company.tradeName || company.name)[0]}
        </div>
        <span className="font-medium text-sm truncate max-w-[120px]">
          {company.tradeName || company.name}
        </span>
      </div>
    </Link>
  );
}

function CompanyStatsCard({ companyId }: { companyId: number }) {
  const { data: stats } = useQuery<{
    activeCampaigns: number;
    totalCollaborations: number;
    avgRating: number;
    totalReviews: number;
  }>({
    queryKey: [`/api/companies/${companyId}/public-stats`],
    select: (data: any) => ({
      activeCampaigns: data?.activeCampaigns || 0,
      totalCollaborations: data?.totalCollaborations || 0,
      avgRating: data?.avgRating || 0,
      totalReviews: data?.totalReviews || 0,
    }),
  });

  if (!stats) return null;

  return (
    <div className="grid grid-cols-3 gap-2 pt-2 border-t">
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 text-sm font-semibold">
          <Briefcase className="h-3 w-3 text-blue-500" />
          {stats.activeCampaigns}
        </div>
        <p className="text-[10px] text-muted-foreground">Campanhas</p>
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 text-sm font-semibold">
          <Users className="h-3 w-3 text-emerald-500" />
          {stats.totalCollaborations}
        </div>
        <p className="text-[10px] text-muted-foreground">Colaborações</p>
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 text-sm font-semibold">
          <Star className={`h-3 w-3 ${stats.avgRating > 0 ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />
          {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : 'N/A'}
        </div>
        <p className="text-[10px] text-muted-foreground">{stats.totalReviews} aval.</p>
      </div>
    </div>
  );
}

const AVAILABLE_NICHES = [
  "Moda",
  "Beleza", 
  "Fitness",
  "Lifestyle",
  "Gastronomia",
  "Tecnologia",
  "Games",
  "Educação",
  "Viagem",
  "Família",
  "Pets",
  "Decoração",
  "Finanças",
  "Saúde",
  "Música",
  "Arte",
  "Esportes",
  "Automóveis",
  "Humor",
  "Outros"
];

const BUDGET_RANGES = [
  { value: "all", label: "Qualquer orçamento" },
  { value: "0-500", label: "Até R$ 500", min: 0, max: 500 },
  { value: "500-1000", label: "R$ 500 - R$ 1.000", min: 500, max: 1000 },
  { value: "1000-3000", label: "R$ 1.000 - R$ 3.000", min: 1000, max: 3000 },
  { value: "3000-5000", label: "R$ 3.000 - R$ 5.000", min: 3000, max: 5000 },
  { value: "5000+", label: "Acima de R$ 5.000", min: 5000, max: Infinity },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Mais recentes", icon: Clock },
  { value: "budget_high", label: "Maior orçamento", icon: DollarSign },
  { value: "budget_low", label: "Menor orçamento", icon: DollarSign },
  { value: "deadline", label: "Prazo mais próximo", icon: Calendar },
];

const DEADLINE_OPTIONS = [
  { value: "all", label: "Qualquer prazo" },
  { value: "7", label: "Próximos 7 dias" },
  { value: "14", label: "Próximas 2 semanas" },
  { value: "30", label: "Próximo mês" },
];

interface TrendingCompany {
  id: number;
  name: string;
  tradeName: string | null;
  logo: string | null;
  description: string | null;
  avgRating: number;
  totalReviews: number;
  activeCampaigns: number;
  favoriteCount: number;
}

interface DiscoverableBrand {
  id: number;
  name: string;
  tradeName: string | null;
  slug: string | null;
  logo: string | null;
  coverPhoto: string | null;
  description: string | null;
  category: string | null;
  tagline: string | null;
  isFeatured: boolean;
  openCampaignsCount: number;
}

interface CategoryCount {
  category: string;
  count: number;
}

const categoryConfig: Record<string, { label: string; icon: React.ComponentType<any>; color: string }> = {
  saude: { label: 'Saúde', icon: Heart, color: 'text-red-500 bg-red-50 border-red-200' },
  beleza: { label: 'Beleza', icon: Sparkles, color: 'text-pink-500 bg-pink-50 border-pink-200' },
  moda: { label: 'Moda', icon: Building2, color: 'text-purple-500 bg-purple-50 border-purple-200' },
  tecnologia: { label: 'Tecnologia', icon: Package, color: 'text-blue-500 bg-blue-50 border-blue-200' },
  alimentos: { label: 'Alimentos', icon: Utensils, color: 'text-orange-500 bg-orange-50 border-orange-200' },
  bebidas: { label: 'Bebidas', icon: Coffee, color: 'text-amber-500 bg-amber-50 border-amber-200' },
  fitness: { label: 'Fitness', icon: Dumbbell, color: 'text-green-500 bg-green-50 border-green-200' },
  casa: { label: 'Casa', icon: Home, color: 'text-teal-500 bg-teal-50 border-teal-200' },
  pets: { label: 'Pets', icon: Dog, color: 'text-yellow-500 bg-yellow-50 border-yellow-200' },
  infantil: { label: 'Infantil', icon: Baby, color: 'text-cyan-500 bg-cyan-50 border-cyan-200' },
  servicos: { label: 'Serviços', icon: Briefcase, color: 'text-indigo-500 bg-indigo-50 border-indigo-200' },
  outros: { label: 'Outros', icon: Building2, color: 'text-gray-500 bg-gray-50 border-gray-200' },
};

type ExploreTab = "campaigns" | "brands" | "favorites";

export default function CreatorFeed() {
  const {
    campaigns,
    user,
    applications,
    applyToCampaign,
    cancelApplication,
    getCampaignApplications,
  } = useMarketplace();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  
  const getTabFromUrl = (): ExploreTab => {
    const params = new URLSearchParams(searchString);
    const tab = params.get("tab");
    if (tab === "brands" || tab === "favorites" || tab === "campaigns") {
      return tab;
    }
    return "campaigns";
  };
  
  const [activeTab, setActiveTabState] = useState<ExploreTab>(getTabFromUrl);
  
  useEffect(() => {
    setActiveTabState(getTabFromUrl());
  }, [searchString]);
  
  const setActiveTab = (tab: string) => {
    const validTab = tab as ExploreTab;
    setActiveTabState(validTab);
    setLocation(`/explore?tab=${validTab}`, { replace: true });
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"open" | "closed">("open");
  const [nicheFilter, setNicheFilter] = useState<string>("all");
  const [budgetFilter, setBudgetFilter] = useState<string>("all");
  const [deadlineFilter, setDeadlineFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [applyingToCampaignId, setApplyingToCampaignId] = useState<
    number | null
  >(null);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [submittingCampaignId, setSubmittingCampaignId] = useState<
    number | null
  >(null);
  const [viewMode, setViewMode] = useViewPreference("creator-feed-view");
  const [showTrending, setShowTrending] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [brandSearchTerm, setBrandSearchTerm] = useState("");

  const { data: trendingCompanies = [] } = useQuery<TrendingCompany[]>({
    queryKey: ['/api/trending-companies'],
    enabled: !!user && user.role === 'creator',
  });

  const { data: favorites = [], isLoading: favoritesLoading } = useQuery<FavoriteCompanyWithDetails[]>({
    queryKey: ['/api/favorite-companies'],
    enabled: !!user && user.role === 'creator',
  });

  const { data: discoverableBrands = [], isLoading: brandsLoading } = useQuery<DiscoverableBrand[]>({
    queryKey: ['/api/discover/brands', selectedCategory],
    queryFn: async () => {
      const url = selectedCategory 
        ? `/api/discover/brands?category=${selectedCategory}`
        : '/api/discover/brands';
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch brands');
      return res.json();
    },
    enabled: !!user && user.role === 'creator' && activeTab === 'brands',
  });

  const { data: featuredBrands = [] } = useQuery<DiscoverableBrand[]>({
    queryKey: ['/api/discover/featured'],
    queryFn: async () => {
      const res = await fetch('/api/discover/featured', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch featured brands');
      return res.json();
    },
    enabled: !!user && user.role === 'creator' && activeTab === 'brands',
  });

  const { data: brandCategories = [] } = useQuery<CategoryCount[]>({
    queryKey: ['/api/discover/categories'],
    queryFn: async () => {
      const res = await fetch('/api/discover/categories', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
    enabled: !!user && user.role === 'creator' && activeTab === 'brands',
  });

  const filteredBrands = useMemo(() => {
    if (!brandSearchTerm) return discoverableBrands;
    const search = brandSearchTerm.toLowerCase();
    return discoverableBrands.filter(brand => 
      brand.name.toLowerCase().includes(search) ||
      (brand.tradeName?.toLowerCase().includes(search)) ||
      (brand.description?.toLowerCase().includes(search))
    );
  }, [discoverableBrands, brandSearchTerm]);

  const companyIds = useMemo(() => {
    return Array.from(new Set(campaigns.map(c => c.companyId)));
  }, [campaigns]);

  const { data: companiesLookup = [] } = useQuery<{ id: number; name: string; tradeName: string | null; logo: string | null }[]>({
    queryKey: ['/api/companies-lookup', companyIds.join(',')],
    queryFn: async () => {
      if (companyIds.length === 0) return [];
      const res = await fetch(`/api/companies-lookup?ids=${companyIds.join(',')}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch companies');
      return res.json();
    },
    enabled: companyIds.length > 0 && !!user,
    staleTime: 1000 * 60 * 5,
  });

  const companiesMap = useMemo(() => {
    const map = new Map<number, { name: string; tradeName: string | null }>();
    companiesLookup.forEach(c => {
      map.set(c.id, { name: c.name, tradeName: c.tradeName });
    });
    return map;
  }, [companiesLookup]);

  const removeFavoriteMutation = useMutation({
    mutationFn: async (companyId: number) => {
      const res = await fetch(`/api/favorite-companies/${companyId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to remove favorite');
    },
    onSuccess: (_, companyId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorite-companies'] });
      queryClient.invalidateQueries({ queryKey: [`/api/favorite-companies/${companyId}/check`] });
      toast.success('Empresa removida dos favoritos');
    },
    onError: () => {
      toast.error('Erro ao remover dos favoritos');
    },
  });

  const filteredAndSortedCampaigns = useMemo(() => {
    let filtered = campaigns.filter((c) => {
      // Filter by status
      if (c.status !== statusFilter) return false;

      // Hide campaigns where user already has an application
      if (user) {
        const hasApplication = applications.some(
          (a) => a.campaignId === c.id && a.creatorId === user.id,
        );
        if (hasApplication) return false;
      }

      // Filter by niche
      if (nicheFilter !== "all") {
        const hasNiche = c.targetNiche?.some(
          (n) => n.toLowerCase() === nicheFilter.toLowerCase()
        );
        if (!hasNiche) return false;
      }

      // Filter by budget
      if (budgetFilter !== "all") {
        const range = BUDGET_RANGES.find(r => r.value === budgetFilter);
        if (range && range.min !== undefined) {
          const budget = Number(c.budget) || 0;
          if (budget < range.min || budget > range.max) return false;
        }
      }

      // Filter by deadline
      if (deadlineFilter !== "all" && c.deadline) {
        const days = parseInt(deadlineFilter);
        const deadlineDate = new Date(c.deadline);
        const maxDate = addDays(new Date(), days);
        if (deadlineDate > maxDate) return false;
      }

      // Filter by search term
      const matchesSearch =
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });

    // Sort campaigns
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "budget_high":
          return (Number(b.budget) || 0) - (Number(a.budget) || 0);
        case "budget_low":
          return (Number(a.budget) || 0) - (Number(b.budget) || 0);
        case "deadline":
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case "recent":
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });

    return filtered;
  }, [campaigns, statusFilter, user, applications, nicheFilter, budgetFilter, deadlineFilter, searchTerm, sortBy]);

  const filteredCampaigns = filteredAndSortedCampaigns;

  const handleApply = async (campaignId: number) => {
    setSubmittingCampaignId(campaignId);
    try {
      await applyToCampaign(campaignId, applicationMessage);
      setApplyingToCampaignId(null);
      setApplicationMessage("");
    } finally {
      setSubmittingCampaignId(null);
    }
  };

  const handleCancel = async (applicationId: number) => {
    if (!user) return;
    const application = applications.find(
      (a) => a.id === applicationId && a.creatorId === user.id,
    );
    if (!application) return;
    await cancelApplication(applicationId);
  };

  const getCampaignApplication = (campaignId: number) => {
    if (!user) return null;
    return applications.find(
      (a) => a.campaignId === campaignId && a.creatorId === user.id,
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-heading tracking-tight">
            Explorar
          </h1>
          <p className="text-muted-foreground">
            Descubra campanhas, marcas e oportunidades para crescer sua carreira.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="campaigns" className="gap-2" data-testid="tab-campaigns">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Campanhas</span>
            <span className="sm:hidden">Campanhas</span>
          </TabsTrigger>
          <TabsTrigger value="brands" className="gap-2" data-testid="tab-brands">
            <Compass className="h-4 w-4" />
            <span className="hidden sm:inline">Marcas</span>
            <span className="sm:hidden">Marcas</span>
          </TabsTrigger>
          <TabsTrigger value="favorites" className="gap-2" data-testid="tab-favorites">
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Favoritos</span>
            <span className="sm:hidden">Fav</span>
            {favorites.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {favorites.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          {/* Filters - Single Row */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar campanhas..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search"
              />
            </div>

            {/* Filters Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  data-testid="button-filters"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtros
                  {(statusFilter !== "open" || nicheFilter !== "all" || budgetFilter !== "all" || deadlineFilter !== "all") && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-primary text-primary-foreground">
                      {[statusFilter !== "open", nicheFilter !== "all", budgetFilter !== "all", deadlineFilter !== "all"].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filtros</h4>
                    {(statusFilter !== "open" || nicheFilter !== "all" || budgetFilter !== "all" || deadlineFilter !== "all") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setStatusFilter("open");
                          setNicheFilter("all");
                          setBudgetFilter("all");
                          setDeadlineFilter("all");
                        }}
                        className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                        data-testid="button-clear-filters"
                      >
                        Limpar tudo
                      </Button>
                    )}
                  </div>
                  <Separator />
                  
                  {/* Status */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Status</Label>
                    <Select
                      value={statusFilter}
                      onValueChange={(value) => setStatusFilter(value as "open" | "closed")}
                    >
                      <SelectTrigger data-testid="select-status-filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Campanhas Abertas</SelectItem>
                        <SelectItem value="closed">Campanhas Fechadas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Categoria</Label>
                    <Select
                      value={nicheFilter}
                      onValueChange={(value) => setNicheFilter(value)}
                    >
                      <SelectTrigger data-testid="select-niche-filter">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as Categorias</SelectItem>
                        {AVAILABLE_NICHES.map((niche) => (
                          <SelectItem key={niche} value={niche}>{niche}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Budget */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Orçamento</Label>
                    <Select
                      value={budgetFilter}
                      onValueChange={(value) => setBudgetFilter(value)}
                    >
                      <SelectTrigger data-testid="select-budget-filter">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUDGET_RANGES.map((range) => (
                          <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Deadline */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Prazo</Label>
                    <Select
                      value={deadlineFilter}
                      onValueChange={(value) => setDeadlineFilter(value)}
                    >
                      <SelectTrigger data-testid="select-deadline-filter">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEADLINE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Sort */}
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value)}
            >
              <SelectTrigger className="w-[160px]" data-testid="select-sort">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 flex-shrink-0" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <ViewToggle mode={viewMode} onChange={setViewMode} />
          </div>

      {/* Trending Companies Section */}
      {showTrending && trendingCompanies.length > 0 && (
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-lg">Empresas em Destaque</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTrending(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {trendingCompanies.slice(0, 5).map((company) => (
                <Link key={company.id} href={`/company/${company.id}/profile`}>
                  <div className="group flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {(company.tradeName || company.name)[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {company.tradeName || company.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {company.avgRating > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                            {company.avgRating.toFixed(1)}
                          </span>
                        )}
                        <span className="flex items-center gap-0.5">
                          <Briefcase className="h-3 w-3" />
                          {company.activeCampaigns}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table View */}
      {viewMode === "table" ? (
        <DataTable
          columns={
            [
              {
                key: "company",
                label: "Empresa",
                sortable: false,
                render: (campaign: Campaign) => (
                  <CompanyNameCell companyId={campaign.companyId} companiesMap={companiesMap} />
                ),
              },
              {
                key: "title",
                label: "Título",
                sortable: true,
                render: (campaign: Campaign) => (
                  <Link href={`/campaign/${campaign.id}`}>
                    <span className="font-medium hover:text-primary transition-colors cursor-pointer">
                      {campaign.title}
                    </span>
                  </Link>
                ),
              },
              {
                key: "budget",
                label: "Orçamento",
                sortable: false,
                className: "hidden md:table-cell",
              },
              {
                key: "deadline",
                label: "Prazo",
                sortable: true,
                className: "hidden lg:table-cell",
                render: (campaign: Campaign) =>
                  format(new Date(campaign.deadline), "dd/MM/yyyy"),
              },
              {
                key: "creatorsNeeded",
                label: "Vagas",
                sortable: true,
                className: "hidden md:table-cell text-center",
              },
              {
                key: "targetNiche",
                label: "Nicho",
                sortable: false,
                className: "hidden xl:table-cell",
                render: (campaign: Campaign) => (
                  <div className="flex gap-1 flex-wrap">
                    {campaign.targetNiche?.slice(0, 2).map((niche, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {niche}
                      </Badge>
                    ))}
                    {campaign.targetNiche &&
                      campaign.targetNiche.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{campaign.targetNiche.length - 2}
                        </Badge>
                      )}
                  </div>
                ),
              },
              {
                key: "actions",
                label: "Ações",
                className: "text-right",
                render: (campaign: Campaign) => {
                  const application = getCampaignApplication(campaign.id);
                  const hasApplied = !!application;

                  return (
                    <div className="flex gap-2 justify-end items-center">
                      <Link href={`/campaign/${campaign.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          data-testid={`button-details-${campaign.id}`}
                        >
                          Ver detalhes
                        </Button>
                      </Link>
                      {hasApplied ? (
                        <>
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            <CheckCircle className="mr-1 h-3 w-3" /> Candidatado
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              application && handleCancel(application.id);
                            }}
                            data-testid={`button-cancel-${campaign.id}`}
                            className="h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-3 w-3 mr-1" /> Cancelar
                          </Button>
                        </>
                      ) : (
                        <Dialog
                          open={applyingToCampaignId === campaign.id}
                          onOpenChange={(open) => {
                            if (!open) {
                              setApplyingToCampaignId(null);
                              setApplicationMessage("");
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setApplyingToCampaignId(campaign.id);
                              }}
                              data-testid={`button-apply-${campaign.id}`}
                            >
                              Candidatar-se
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                Candidatar-se a {campaign.title}
                              </DialogTitle>
                              <DialogDescription>
                                Apresente-se e explique por que você é ideal para
                                esta campanha.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <Textarea
                                placeholder="Olá, estou muito interessado porque..."
                                className="min-h-[150px]"
                                value={applicationMessage}
                                onChange={(e) =>
                                  setApplicationMessage(e.target.value)
                                }
                                data-testid="input-application-message"
                              />
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={() => handleApply(campaign.id)}
                                disabled={submittingCampaignId === campaign.id}
                                data-testid="button-submit-application"
                              >
                                {submittingCampaignId === campaign.id
                                  ? "Enviando..."
                                  : "Enviar Candidatura"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  );
                },
              },
            ] as Column<Campaign>[]
          }
          data={filteredCampaigns}
          keyExtractor={(campaign) => campaign.id}
        />
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCampaigns.map((campaign) => {
            const application = getCampaignApplication(campaign.id);
            const hasApplied = !!application;

            return (
              <Card
                key={campaign.id}
                className="group hover:shadow-xl transition-all duration-300 border-none shadow-sm bg-card/50 backdrop-blur-sm flex flex-col w-full min-w-0"
                data-testid={`card-campaign-${campaign.id}`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge
                      variant="secondary"
                      className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    >
                      Ativa
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">
                      {campaign.createdAt
                        ? format(new Date(campaign.createdAt), "dd MMM")
                        : ""}
                    </span>
                  </div>
                  <Link href={`/campaign/${campaign.id}`}>
                    <CardTitle className="line-clamp-1 text-xl group-hover:text-primary transition-colors cursor-pointer">
                      {campaign.title}
                    </CardTitle>
                  </Link>
                  <CardDescription className="line-clamp-2 h-10">
                    {campaign.description}
                  </CardDescription>
                  <Link href={`/company/${campaign.companyId}/profile`}>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer mt-2" data-testid={`link-company-profile-${campaign.id}`}>
                      <Building2 className="h-3 w-3" />
                      <span>Ver perfil da empresa</span>
                    </div>
                  </Link>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-muted-foreground mt-2">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4 text-primary/70" />
                      <span>{campaign.budget}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-primary/70" />
                      <span>{campaign.creatorsNeeded} Vagas</span>
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-primary/70" />
                      <span>
                        Vence em{" "}
                        {format(new Date(campaign.deadline), "dd/MM/yyyy")}
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-0 mt-auto flex-col gap-2">
                  {hasApplied ? (
                    <>
                      <Button
                        className="w-full bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
                        disabled
                        data-testid={`button-applied-${campaign.id}`}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" /> Candidatou-se
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          application && handleCancel(application.id)
                        }
                        data-testid={`button-cancel-${campaign.id}`}
                      >
                        <X className="mr-2 h-4 w-4" /> Cancelar Candidatura
                      </Button>
                    </>
                  ) : (
                    <>
                      <Dialog
                        open={applyingToCampaignId === campaign.id}
                        onOpenChange={(open) => {
                          if (!open) {
                            setApplyingToCampaignId(null);
                            setApplicationMessage("");
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            className="w-full"
                            onClick={() => setApplyingToCampaignId(campaign.id)}
                            data-testid={`button-apply-${campaign.id}`}
                          >
                            Candidatar-se
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              Candidatar-se a {campaign.title}
                            </DialogTitle>
                            <DialogDescription>
                              Apresente-se e explique por que você é ideal para
                              esta campanha.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Textarea
                              placeholder="Olá, estou muito interessado porque..."
                              className="min-h-[150px]"
                              value={applicationMessage}
                              onChange={(e) =>
                                setApplicationMessage(e.target.value)
                              }
                              data-testid="input-application-message"
                            />
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={() => handleApply(campaign.id)}
                              disabled={submittingCampaignId === campaign.id}
                              data-testid="button-submit-application"
                            >
                              {submittingCampaignId === campaign.id
                                ? "Enviando..."
                                : "Enviar Candidatura"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Link
                        href={`/campaign/${campaign.id}`}
                        className="w-full"
                      >
                        <Button
                          variant="outline"
                          className="w-full"
                          data-testid={`button-details-${campaign.id}`}
                        >
                          Ver Detalhes <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </>
                  )}
                </CardFooter>
              </Card>
            );
          })}

          {filteredCampaigns.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              Nenhuma campanha encontrada com sua busca.
            </div>
          )}
        </div>
      )}
        </TabsContent>

        <TabsContent value="brands" className="space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Descubra <span className="text-primary">marcas incríveis</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Encontre as melhores marcas para parcerias e colaborações
            </p>
          </div>

          {/* Category Pills */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => setSelectedCategory(null)}
              data-testid="btn-category-all"
            >
              Todas
            </Button>
            {Object.entries(categoryConfig).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <Button
                  key={key}
                  variant={selectedCategory === key ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setSelectedCategory(key)}
                  data-testid={`btn-category-${key}`}
                >
                  <Icon className="h-3.5 w-3.5 mr-1.5" />
                  {config.label}
                </Button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar marcas por nome..."
              className="pl-12 h-12 rounded-full text-base"
              value={brandSearchTerm}
              onChange={(e) => setBrandSearchTerm(e.target.value)}
              data-testid="input-search-brands"
            />
          </div>

          {/* Featured Brands - Horizontal Scroll OnBrand Style */}
          {!selectedCategory && featuredBrands.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-bold">Marcas em Destaque</h3>
                </div>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
                {featuredBrands.map((brand, idx) => {
                  const displayName = brand.tradeName || brand.name;
                  const config = brand.category ? categoryConfig[brand.category] : null;
                  return (
                    <motion.div
                      key={brand.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="snap-start flex-shrink-0 w-[200px]"
                    >
                      <Link href={`/company/${brand.id}/profile`}>
                        <div className="group cursor-pointer">
                          {/* Vertical Card OnBrand Style */}
                          <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-muted shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                            {brand.coverPhoto ? (
                              <img 
                                src={brand.coverPhoto} 
                                alt={displayName} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-background flex items-center justify-center">
                                <Building2 className="h-16 w-16 text-primary/30" />
                              </div>
                            )}
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            
                            {/* Logo */}
                            <div className="absolute bottom-16 left-3">
                              <div className="h-12 w-12 rounded-full bg-white shadow-lg border-2 border-white overflow-hidden">
                                {brand.logo ? (
                                  <img src={brand.logo} alt={displayName} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary/80 text-white font-bold text-lg">
                                    {displayName[0]}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Brand Info */}
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              <h4 className="font-bold text-white text-sm truncate">{displayName}</h4>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <Badge className="bg-amber-500/90 text-white border-0 text-[10px] px-1.5 py-0">
                                  Trending
                                </Badge>
                                {config && (
                                  <Badge className="bg-white/20 text-white border-0 text-[10px] px-1.5 py-0 backdrop-blur-sm">
                                    {config.label}
                                  </Badge>
                                )}
                              </div>
                              {brand.openCampaignsCount > 0 && (
                                <p className="text-white/80 text-[11px] mt-1.5">
                                  {brand.openCampaignsCount} {brand.openCampaignsCount === 1 ? 'campanha ativa' : 'campanhas ativas'}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Brands Grid */}
          {brandsLoading ? (
            <div className="flex flex-col items-center justify-center h-[30vh]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-muted-foreground">Carregando marcas...</p>
            </div>
          ) : filteredBrands.length === 0 ? (
            <Card className="border-dashed max-w-md mx-auto">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-muted p-6 mb-4">
                  <Building2 className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Nenhuma marca encontrada</h3>
                <p className="text-muted-foreground text-center">
                  {brandSearchTerm 
                    ? 'Tente buscar com outros termos' 
                    : 'Ainda não há marcas cadastradas nesta categoria'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-bold">
                    {selectedCategory ? categoryConfig[selectedCategory]?.label || 'Marcas' : 'Todas as Marcas'}
                  </h3>
                  <Badge variant="secondary" className="rounded-full">
                    {filteredBrands.length} marcas
                  </Badge>
                </div>
              </div>
              
              {/* OnBrand Style Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredBrands.map((brand, idx) => {
                  const displayName = brand.tradeName || brand.name;
                  const config = brand.category ? categoryConfig[brand.category] : null;
                  return (
                    <motion.div
                      key={brand.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                    >
                      <Link href={`/company/${brand.id}/profile`}>
                        <div className="group cursor-pointer">
                          {/* Vertical Card OnBrand Style */}
                          <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-muted shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                            {brand.coverPhoto ? (
                              <img 
                                src={brand.coverPhoto} 
                                alt={displayName} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-background flex items-center justify-center">
                                <Building2 className="h-12 w-12 text-primary/30" />
                              </div>
                            )}
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            
                            {/* Featured Badge */}
                            {brand.isFeatured && (
                              <div className="absolute top-2 right-2">
                                <Badge className="bg-amber-500 text-white border-0 text-[10px] px-1.5 py-0 shadow-lg">
                                  <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />
                                </Badge>
                              </div>
                            )}
                            
                            {/* Logo */}
                            <div className="absolute bottom-14 left-2.5">
                              <div className="h-10 w-10 rounded-full bg-white shadow-lg border-2 border-white overflow-hidden">
                                {brand.logo ? (
                                  <img src={brand.logo} alt={displayName} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary/80 text-white font-bold">
                                    {displayName[0]}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Brand Info */}
                            <div className="absolute bottom-0 left-0 right-0 p-2.5">
                              <h4 className="font-bold text-white text-sm truncate">{displayName}</h4>
                              <div className="flex items-center gap-1 mt-1 flex-wrap">
                                {config && (
                                  <Badge className="bg-white/20 text-white border-0 text-[10px] px-1.5 py-0 backdrop-blur-sm">
                                    {config.label}
                                  </Badge>
                                )}
                                {brand.openCampaignsCount > 0 && (
                                  <Badge className="bg-green-500/80 text-white border-0 text-[10px] px-1.5 py-0">
                                    {brand.openCampaignsCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTA Section */}
          <div className="text-center py-8 border-t">
            <p className="text-muted-foreground mb-2">Quer ver mais marcas?</p>
            <Button variant="outline" className="rounded-full" onClick={() => setActiveTab("campaigns")}>
              Ver todas as campanhas
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="favorites" className="space-y-6">
          {favoritesLoading ? (
            <div className="flex flex-col items-center justify-center h-[40vh]">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="mt-4 text-muted-foreground">Carregando favoritos...</p>
            </div>
          ) : favorites.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Heart className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Nenhuma empresa favorita</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  Quando você encontrar empresas interessantes, adicione-as aos favoritos
                  para acompanhar suas campanhas e novidades.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("campaigns")}
                  data-testid="button-explore-companies"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Explorar Oportunidades
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {favorites.map((favorite, index) => (
                <motion.div
                  key={favorite.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="group hover:shadow-lg transition-all duration-300 h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                            <AvatarImage src={getAvatarUrl(favorite.company.logo)} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                              {(favorite.company.tradeName || favorite.company.name)[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base group-hover:text-primary transition-colors">
                              {favorite.company.tradeName || favorite.company.name}
                            </CardTitle>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => removeFavoriteMutation.mutate(favorite.companyId)}
                          disabled={removeFavoriteMutation.isPending}
                          data-testid={`button-remove-favorite-${favorite.companyId}`}
                        >
                          {removeFavoriteMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <HeartOff className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {favorite.company.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {favorite.company.description}
                        </p>
                      )}
                      <CompanyStatsCard companyId={favorite.companyId} />
                    </CardContent>
                    <CardFooter>
                      <Link href={`/company/${favorite.companyId}/profile`} className="w-full">
                        <Button variant="outline" className="w-full" data-testid={`button-view-company-${favorite.companyId}`}>
                          Ver Perfil
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
