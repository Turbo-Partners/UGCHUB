import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardHeading, CardToolbar } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge-2";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Megaphone, Building2, Users, Calendar, ArrowUpDown, ArrowUp, ArrowDown, Eye, MoreHorizontal, CheckCircle, XCircle, Clock, FileText, DollarSign, Target, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { StatsCard, StatsGrid } from "@/components/ui/stats-card";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Campaign {
  id: number;
  title: string;
  description: string;
  budget: string;
  deadline: string;
  creatorsNeeded: number;
  status: 'open' | 'closed';
  visibility: 'public' | 'private';
  createdAt: string;
  company?: {
    id: number;
    name: string;
    logo: string | null;
  };
  _count?: {
    applications: number;
    acceptedApplications: number;
  };
}

interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalApplications: number;
  acceptedApplications: number;
  avgBudget: number;
  totalBudget: number;
}

type SortField = 'title' | 'budget' | 'deadline' | 'createdAt' | 'status';
type SortOrder = 'asc' | 'desc';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export function AdminCampaignsContent() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ['/api/admin/campaigns', { status: statusFilter, search: searchQuery, sortBy, sortOrder }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      
      const response = await fetch(`/api/admin/campaigns?${params}`);
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      return response.json();
    },
  });

  const { data: stats } = useQuery<CampaignStats>({
    queryKey: ['/api/admin/campaigns/stats'],
  });

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/50" />;
    return sortOrder === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4 text-primary" />
      : <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
  };

  const formatBudget = (budget: string) => {
    const value = parseFloat(budget.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (isNaN(value)) return budget;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const parseBudget = (budget: string): number => {
    return parseFloat(budget.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
  };

  const countByStatus = (status: 'open' | 'closed') => {
    return campaigns.filter(c => c.status === status).length;
  };

  return (
    <motion.div 
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants}>
        <h1 className="font-heading text-3xl font-bold text-foreground" data-testid="heading-admin-campaigns">
          Campanhas
        </h1>
        <p className="text-muted-foreground mt-1">Gerencie todas as campanhas da plataforma</p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <StatsGrid columns={4}>
          <StatsCard
            title="Total de Campanhas"
            value={stats?.totalCampaigns || campaigns.length}
            icon={<Megaphone className="h-5 w-5" />}
            data-testid="stat-total-campaigns"
          />
          <StatsCard
            title="Campanhas Ativas"
            value={stats?.activeCampaigns || countByStatus('open')}
            icon={<CheckCircle className="h-5 w-5" />}
            className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20"
            data-testid="stat-active-campaigns"
          />
          <StatsCard
            title="Total de Candidaturas"
            value={stats?.totalApplications || 0}
            icon={<FileText className="h-5 w-5" />}
            data-testid="stat-total-applications"
          />
          <StatsCard
            title="Orçamento Total"
            value={stats?.totalBudget ? formatBudget(String(stats.totalBudget)) : formatBudget(String(campaigns.reduce((acc, c) => acc + parseBudget(c.budget), 0)))}
            icon={<DollarSign className="h-5 w-5" />}
            className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20"
            data-testid="stat-total-budget"
          />
        </StatsGrid>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card data-testid="card-campaigns-table">
          <CardHeader className="border-b border-border">
            <CardHeading>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Megaphone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Lista de Campanhas</CardTitle>
                  <p className="text-sm text-muted-foreground">{campaigns.length} campanhas encontradas</p>
                </div>
              </div>
            </CardHeading>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar campanhas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-campaigns"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="open">Abertas</SelectItem>
                  <SelectItem value="closed">Encerradas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-[300px]">
                      <button
                        className="flex items-center font-medium hover:text-foreground transition-colors"
                        onClick={() => handleSort('title')}
                        data-testid="sort-title"
                      >
                        Campanha
                        <SortIcon field="title" />
                      </button>
                    </TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>
                      <button
                        className="flex items-center font-medium hover:text-foreground transition-colors"
                        onClick={() => handleSort('budget')}
                        data-testid="sort-budget"
                      >
                        Orçamento
                        <SortIcon field="budget" />
                      </button>
                    </TableHead>
                    <TableHead>Candidaturas</TableHead>
                    <TableHead>
                      <button
                        className="flex items-center font-medium hover:text-foreground transition-colors"
                        onClick={() => handleSort('status')}
                        data-testid="sort-status"
                      >
                        Status
                        <SortIcon field="status" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center font-medium hover:text-foreground transition-colors"
                        onClick={() => handleSort('createdAt')}
                        data-testid="sort-date"
                      >
                        Criada em
                        <SortIcon field="createdAt" />
                      </button>
                    </TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhuma campanha encontrada</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    campaigns.map((campaign) => (
                      <TableRow
                        key={campaign.id}
                        className="group hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedCampaign(campaign)}
                        data-testid={`campaign-row-${campaign.id}`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Megaphone className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{campaign.title}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">{campaign.description}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {campaign.company ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                {campaign.company.logo && <AvatarImage src={campaign.company.logo} />}
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {campaign.company.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{campaign.company.name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-foreground">{formatBudget(campaign.budget)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{campaign._count?.applications || 0}</span>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-sm text-muted-foreground">{campaign.creatorsNeeded} vagas</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={campaign.status === 'open' ? 'primary' : 'secondary'}
                            appearance="light"
                          >
                            {campaign.status === 'open' ? 'Aberta' : 'Encerrada'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(campaign.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`campaign-menu-${campaign.id}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedCampaign(campaign)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalhes
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Megaphone className="h-5 w-5 text-primary" />
              </div>
              <span>{selectedCampaign?.title}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedCampaign && (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Orçamento</p>
                    <p className="text-xl font-bold text-foreground">{formatBudget(selectedCampaign.budget)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Vagas</p>
                    <p className="text-xl font-bold text-foreground">{selectedCampaign.creatorsNeeded}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium text-foreground mb-2">Descrição</h4>
                  <p className="text-muted-foreground">{selectedCampaign.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Status</h4>
                    <Badge 
                      variant={selectedCampaign.status === 'open' ? 'primary' : 'secondary'}
                      appearance="light"
                    >
                      {selectedCampaign.status === 'open' ? 'Aberta' : 'Encerrada'}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Visibilidade</h4>
                    <Badge variant="outline">
                      {selectedCampaign.visibility === 'public' ? 'Pública' : 'Privada'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Prazo</h4>
                    <p className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {selectedCampaign.deadline}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Criada em</h4>
                    <p className="text-muted-foreground">
                      {format(new Date(selectedCampaign.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                {selectedCampaign.company && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Empresa</h4>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                      <Avatar className="h-10 w-10">
                        {selectedCampaign.company.logo && <AvatarImage src={selectedCampaign.company.logo} />}
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {selectedCampaign.company.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{selectedCampaign.company.name}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Total de Candidaturas</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedCampaign._count?.applications || 0}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <p className="text-sm text-green-600 dark:text-green-400 mb-1">Aceitas</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{selectedCampaign._count?.acceptedApplications || 0}</p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
