import { Link } from 'wouter';
import { useMarketplace } from '@/lib/provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Users, Calendar, ArrowRight, Link2, Trash2, Megaphone, Clock, MoreHorizontal, Eye, Search, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Campaign } from '@shared/schema';
import { DataTable, Column } from '@/components/data-table';
import { ViewToggle } from '@/components/view-toggle';
import { useViewPreference } from '@/hooks/use-view-preference';
import { StatusBadge } from '@/components/status-badge';
import { motion } from 'framer-motion';
import { StatsCard, StatsGrid } from '@/components/ui/stats-card';
import { Badge } from '@/components/ui/badge-2';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type CampaignWithStats = Campaign & {
  applicationsCount: number;
  acceptedCount: number;
  pendingCount: number;
};

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

export default function CampaignsPage() {
  const { campaigns, getCampaignApplications } = useMarketplace();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useViewPreference('campaigns-view');
  const [searchQuery, setSearchQuery] = useState('');

  const deleteCampaignMutation = useMutation({
    mutationFn: async (campaignId: number) => {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete campaign');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast.success('Campanha deletada!', {
        description: 'A campanha foi removida com sucesso.'
      });
      setCampaignToDelete(null);
    },
    onError: () => {
      toast.error('Erro ao deletar campanha', {
        description: 'Não foi possível deletar a campanha. Tente novamente.'
      });
    }
  });

  const copyLinkToClipboard = async (campaignId: number) => {
    const url = `${window.location.origin}/campaign/${campaignId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(campaignId);
      toast.success('Link copiado!', {
        description: 'O link da campanha foi copiado para a área de transferência.'
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error('Erro ao copiar link', {
        description: 'Não foi possível copiar o link. Tente novamente.'
      });
    }
  };

  const campaignsData = campaigns.map(campaign => {
    const applications = getCampaignApplications(campaign.id);
    const acceptedCount = applications.filter(a => a.status === 'accepted').length;
    return {
      ...campaign,
      applicationsCount: applications.length,
      acceptedCount,
      pendingCount: applications.filter(a => a.status === 'pending').length,
    };
  });

  const filteredCampaigns = campaigns.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCampaignsData = campaignsData.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCampaigns = campaigns.filter(c => c.status === 'open').length;
  const totalApplications = campaignsData.reduce((sum, c) => sum + c.applicationsCount, 0);
  const pendingApplications = campaignsData.reduce((sum, c) => sum + c.pendingCount, 0);
  const acceptedCreators = campaignsData.reduce((sum, c) => sum + c.acceptedCount, 0);

  const columns: Column<CampaignWithStats>[] = [
    {
      key: 'title',
      label: 'Campanha',
      sortable: true,
      render: (campaign) => (
        <Link href={`/campaign/${campaign.id}/manage`}>
          <button className="text-left hover:underline font-medium text-foreground" data-testid={`link-campaign-${campaign.id}`}>
            {campaign.title}
          </button>
        </Link>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      getSortValue: (campaign) => {
        const labels = {
          pending: "Análise Pendente",
          accepted: "Aceito",
          rejected: "Recusado",
          open: "Ativo",
          closed: "Fechado"
        };
        return labels[campaign.status] || campaign.status;
      },
      render: (campaign) => (
        <StatusBadge status={campaign.status} data-testid={`badge-status-${campaign.id}`} />
      ),
    },
    {
      key: 'applicationsCount',
      label: 'Aplicações',
      sortable: true,
      render: (campaign) => (
        <span data-testid={`text-applications-${campaign.id}`} className="text-muted-foreground">{campaign.applicationsCount}</span>
      ),
    },
    {
      key: 'acceptedCount',
      label: 'Aceitos/Necessários',
      sortable: true,
      render: (campaign) => (
        <span data-testid={`text-accepted-${campaign.id}`} className="text-muted-foreground">
          {campaign.acceptedCount}/{campaign.creatorsNeeded}
        </span>
      ),
    },
    {
      key: 'deadline',
      label: 'Prazo',
      sortable: true,
      className: 'hidden lg:table-cell',
      render: (campaign) => (
        <span data-testid={`text-deadline-${campaign.id}`} className="text-muted-foreground">
          {format(new Date(campaign.deadline), 'dd/MM/yyyy')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (campaign) => (
        <Link href={`/campaign/${campaign.id}/manage`}>
          <Button variant="ghost" size="sm" data-testid={`button-manage-${campaign.id}`}>
            Gerenciar
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <motion.div 
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Campanhas"
          description="Gerencie todas as suas campanhas de marketing."
        >
          <Link href="/create-campaign">
            <Button className="shadow-lg shadow-primary/20 transition-transform hover:scale-105">
              <Plus className="mr-2 h-4 w-4" />
              Nova Campanha
            </Button>
          </Link>
        </PageHeader>
      </motion.div>

      <motion.div variants={itemVariants}>
        <StatsGrid columns={4}>
          <StatsCard
            title="Candidaturas Pendentes"
            value={pendingApplications}
            icon={<Clock className="h-5 w-5" />}
            subtitle={pendingApplications > 0 ? "Ações requeridas" : "Tudo em dia!"}
            className={pendingApplications > 0 ? "border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent" : "border-green-500/20 bg-gradient-to-br from-green-500/10 to-transparent"}
          />
          <StatsCard
            title="Campanhas Ativas"
            value={activeCampaigns}
            icon={<Megaphone className="h-5 w-5" />}
            subtitle="Em andamento"
          />
          <StatsCard
            title="Total Candidaturas"
            value={totalApplications}
            change={12.5}
            icon={<FileText className="h-5 w-5" />}
            trend="up"
          />
          <StatsCard
            title="Creators Aceitos"
            value={acceptedCreators}
            change={8.3}
            icon={<Users className="h-5 w-5" />}
            trend="up"
          />
        </StatsGrid>
      </motion.div>

      {campaigns.length > 0 && (
        <motion.div variants={itemVariants} className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold font-heading text-foreground">Suas Campanhas</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar campanhas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-[200px] rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                data-testid="input-search-campaigns"
              />
            </div>
            <ViewToggle mode={viewMode} onChange={setViewMode} />
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        {viewMode === 'table' && campaigns.length > 0 ? (
          <Card className="overflow-hidden">
            <DataTable
              columns={columns}
              data={filteredCampaignsData}
              keyExtractor={(campaign) => campaign.id}
              data-testid="campaigns-table"
            />
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="campaigns-grid">
            {filteredCampaigns.map((campaign, index) => {
              const applications = getCampaignApplications(campaign.id);
              const pendingCount = applications.filter(a => a.status === 'pending').length;

              return (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="group hover:shadow-xl hover:border-primary/20 transition-all duration-300 overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <Badge 
                          variant={campaign.status === 'open' ? 'success' : 'secondary'} 
                          appearance="light"
                        >
                          {campaign.status === 'open' ? 'Ativa' : 'Fechada'}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              data-testid={`button-campaign-menu-${campaign.id}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => copyLinkToClipboard(campaign.id)} data-testid={`menu-copy-link-${campaign.id}`}>
                              <Link2 className="w-4 h-4 mr-2" />
                              Copiar link
                            </DropdownMenuItem>
                            <Link href={`/campaign/${campaign.id}/manage`}>
                              <DropdownMenuItem data-testid={`menu-manage-${campaign.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                Gerenciar
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setCampaignToDelete(campaign)}
                              className="text-destructive"
                              data-testid={`menu-delete-${campaign.id}`}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Deletar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardTitle className="line-clamp-1 text-xl group-hover:text-primary transition-colors">
                        {campaign.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 h-10">
                        {campaign.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(campaign.deadline), 'dd/MM/yyyy')}</span>
                        </div>
                        <span className="text-muted-foreground/50">•</span>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          <span>{applications.length} candidatos</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center gap-2">
                          {pendingCount > 0 && (
                            <Badge variant="warning" appearance="light" className="text-xs">
                              {pendingCount} novos
                            </Badge>
                          )}
                        </div>
                        <Link href={`/campaign/${campaign.id}/manage`}>
                          <Button variant="ghost" size="sm" className="group-hover:translate-x-1 transition-transform">
                            Gerenciar <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
            
            {campaigns.length === 0 && (
              <div className="col-span-full">
                <Card className="border-2 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-16 w-16 bg-muted rounded-2xl flex items-center justify-center mb-6">
                      <Plus className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold font-heading text-foreground">Nenhuma campanha ainda</h3>
                    <p className="text-muted-foreground max-w-sm mt-2 mb-6">
                      Crie sua primeira campanha para começar a receber candidaturas de criadores talentosos.
                    </p>
                    <Link href="/create-campaign">
                      <Button size="lg">
                        <Plus className="mr-2 h-4 w-4" />
                        Criar Campanha
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </motion.div>

      <AlertDialog open={!!campaignToDelete} onOpenChange={(open) => !open && setCampaignToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar a campanha <strong>"{campaignToDelete?.title}"</strong>?
              Esta ação não pode ser desfeita e todas as candidaturas associadas serão removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => campaignToDelete && deleteCampaignMutation.mutate(campaignToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
