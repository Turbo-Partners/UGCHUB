import { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useMarketplace } from '@/lib/provider';
import { 
  Briefcase, 
  Building2, 
  Rocket, 
  ChevronRight, 
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  Package,
  Calendar,
  Mail,
  Check,
  X,
  FileText,
  Send,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAvatarUrl } from '@/lib/utils';

type CampaignsTab = 'active' | 'applications' | 'invites';

interface CampaignInvite {
  id: number;
  campaignId: number;
  campaignTitle: string;
  brandId: number;
  brandName: string;
  brandLogo: string | null;
  message: string | null;
  status: string;
  createdAt: string;
  expiresAt: string | null;
}

const WORKFLOW_STATUS_MAP: Record<string, { label: string; color: string }> = {
  aceito: { label: 'Aceito', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  contrato: { label: 'Contrato', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  aguardando_produto: { label: 'Aguardando Produto', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  producao: { label: 'Em Produção', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  revisao: { label: 'Em Revisão', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  entregue: { label: 'Entregue', color: 'bg-green-50 text-green-700 border-green-200' },
};

function getProgressPercentage(status: string | null): number {
  const steps = ['aceito', 'contrato', 'aguardando_produto', 'producao', 'revisao', 'entregue'];
  const index = status ? steps.indexOf(status) : 0;
  return ((index + 1) / steps.length) * 100;
}

export default function CreatorCampaignsHub() {
  const { user } = useMarketplace();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  
  const getTabFromUrl = (): CampaignsTab => {
    const params = new URLSearchParams(searchString);
    const tab = params.get('tab');
    if (tab === 'active' || tab === 'applications' || tab === 'invites') {
      return tab;
    }
    return 'active';
  };
  
  const [activeTab, setActiveTabState] = useState<CampaignsTab>(getTabFromUrl);
  
  useEffect(() => {
    setActiveTabState(getTabFromUrl());
  }, [searchString]);
  
  const setActiveTab = (tab: string) => {
    const validTab = tab as CampaignsTab;
    setActiveTabState(validTab);
    setLocation(`/campaigns?tab=${validTab}`, { replace: true });
  };

  const { data: activeCampaignsData = [], isLoading: activeLoading } = useQuery<any[]>({
    queryKey: ['/api/applications/active'],
    enabled: !!user && user.role === 'creator',
  });

  const { data: applicationsData = [], isLoading: applicationsLoading } = useQuery<any[]>({
    queryKey: ['/api/applications'],
    enabled: !!user && user.role === 'creator',
  });

  // Campaign invites (type === 'campaign')
  const { data: allInvitations = [] } = useQuery<any[]>({
    queryKey: ['/api/creator/invitations'],
    enabled: !!user && user.role === 'creator',
  });
  
  const campaignInvites = allInvitations.filter((inv: any) => inv.type === 'campaign');

  const acceptMutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await fetch(`/api/creator/invitations/${id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'campaign' }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Erro ao aceitar convite');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Convite aceito!', description: 'Você foi adicionado à campanha.' });
      queryClient.invalidateQueries({ queryKey: ['/api/creator/invitations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/applications/active'] });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Não foi possível aceitar o convite.', variant: 'destructive' });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await fetch(`/api/creator/invitations/${id}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'campaign' }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Erro ao recusar convite');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Convite recusado' });
      queryClient.invalidateQueries({ queryKey: ['/api/creator/invitations'] });
    },
  });

  const isLoading = activeLoading || applicationsLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filter applications by status
  const pendingApplications = applicationsData.filter((app: any) => app.status === 'pending');
  const acceptedApplications = applicationsData.filter((app: any) => app.status === 'accepted');
  const rejectedApplications = applicationsData.filter((app: any) => app.status === 'rejected');

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="creator-campaigns-page">
      <div>
        <h1 className="text-3xl font-bold font-heading tracking-tight" data-testid="text-page-title">
          Minhas Campanhas
        </h1>
        <p className="text-muted-foreground">
          Gerencie suas campanhas ativas, candidaturas e convites
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="active" className="gap-2" data-testid="tab-active">
            <Rocket className="h-4 w-4" />
            Ativas
            {activeCampaignsData.length > 0 && (
              <Badge variant="secondary" className="ml-1">{activeCampaignsData.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="applications" className="gap-2" data-testid="tab-applications">
            <FileText className="h-4 w-4" />
            Candidaturas
            {pendingApplications.length > 0 && (
              <Badge variant="secondary" className="ml-1">{pendingApplications.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="invites" className="gap-2" data-testid="tab-invites">
            <Mail className="h-4 w-4" />
            Convites
            {campaignInvites.length > 0 && (
              <Badge variant="destructive" className="ml-1">{campaignInvites.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Active Campaigns Tab */}
        <TabsContent value="active" className="space-y-6">
          {activeCampaignsData.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeCampaignsData.map((campaign: any) => {
                const statusInfo = WORKFLOW_STATUS_MAP[campaign.workflowStatus] || WORKFLOW_STATUS_MAP.aceito;
                const progress = getProgressPercentage(campaign.workflowStatus);
                return (
                  <Link 
                    key={campaign.applicationId || campaign.id}
                    href={`/campaign/${campaign.campaignId || campaign.campaign?.id}/workspace`}
                  >
                    <Card className="hover:shadow-lg transition-all cursor-pointer group h-full" data-testid={`campaign-card-${campaign.campaignId || campaign.campaign?.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <Avatar className="h-10 w-10 shrink-0">
                              <AvatarImage src={getAvatarUrl(campaign.brandLogo || campaign.campaign?.company?.logoUrl)} />
                              <AvatarFallback>
                                <Building2 className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                                {campaign.campaignTitle || campaign.campaign?.title}
                              </h3>
                              <p className="text-sm text-muted-foreground truncate">
                                {campaign.brandName || campaign.campaign?.company?.name}
                              </p>
                            </div>
                          </div>
                          <Badge className={`${statusInfo.color} border shrink-0 text-xs`}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 mt-4">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Progresso</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                        
                        {(campaign.deadline || campaign.campaign?.deadline) && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3">
                            <Calendar className="h-3 w-3" />
                            Prazo: {format(new Date(campaign.deadline || campaign.campaign?.deadline), "d 'de' MMM", { locale: ptBR })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Rocket className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma campanha ativa</h3>
                <p className="text-muted-foreground max-w-sm text-center mb-6">
                  Candidate-se a campanhas para começar a participar de projetos com marcas
                </p>
                <Link href="/explore">
                  <Button data-testid="button-explore">
                    Explorar Campanhas
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-6">
          {applicationsData.length > 0 ? (
            <div className="space-y-6">
              {/* Pending Applications */}
              {pendingApplications.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-500" />
                    <h2 className="text-lg font-semibold">Aguardando Resposta</h2>
                    <Badge variant="secondary">{pendingApplications.length}</Badge>
                  </div>
                  <div className="grid gap-3">
                    {pendingApplications.map((app: any) => (
                      <ApplicationCard key={app.id} application={app} />
                    ))}
                  </div>
                </div>
              )}

              {/* Accepted Applications (not yet active) */}
              {acceptedApplications.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <h2 className="text-lg font-semibold">Aceitas</h2>
                    <Badge variant="secondary">{acceptedApplications.length}</Badge>
                  </div>
                  <div className="grid gap-3">
                    {acceptedApplications.map((app: any) => (
                      <ApplicationCard key={app.id} application={app} />
                    ))}
                  </div>
                </div>
              )}

              {/* Rejected Applications */}
              {rejectedApplications.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <h2 className="text-lg font-semibold">Recusadas</h2>
                    <Badge variant="secondary">{rejectedApplications.length}</Badge>
                  </div>
                  <div className="grid gap-3">
                    {rejectedApplications.slice(0, 5).map((app: any) => (
                      <ApplicationCard key={app.id} application={app} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma candidatura</h3>
                <p className="text-muted-foreground max-w-sm text-center mb-6">
                  Você ainda não se candidatou a nenhuma campanha
                </p>
                <Link href="/explore">
                  <Button data-testid="button-explore-campaigns">
                    Explorar Campanhas
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Campaign Invites Tab */}
        <TabsContent value="invites" className="space-y-4">
          {campaignInvites.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {campaignInvites.map((invite: any) => (
                <Card key={invite.id} className="border-l-4 border-l-primary" data-testid={`campaign-invite-${invite.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={getAvatarUrl(invite.brandLogo)} />
                        <AvatarFallback>
                          <Building2 className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{invite.campaignTitle}</h3>
                        <p className="text-sm text-muted-foreground truncate">{invite.brandName}</p>
                        
                        {invite.message && (
                          <p className="text-sm text-muted-foreground mt-2 italic line-clamp-2">
                            "{invite.message}"
                          </p>
                        )}
                        
                        <p className="text-xs text-muted-foreground mt-2">
                          Enviado em {format(new Date(invite.createdAt), "d 'de' MMM", { locale: ptBR })}
                        </p>
                        
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            onClick={() => acceptMutation.mutate({ id: invite.id })}
                            disabled={acceptMutation.isPending || declineMutation.isPending}
                            data-testid={`accept-campaign-invite-${invite.id}`}
                          >
                            {acceptMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <Check className="h-4 w-4 mr-1" />
                            )}
                            Aceitar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => declineMutation.mutate({ id: invite.id })}
                            disabled={acceptMutation.isPending || declineMutation.isPending}
                            data-testid={`decline-campaign-invite-${invite.id}`}
                          >
                            {declineMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <X className="h-4 w-4 mr-1" />
                            )}
                            Recusar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Mail className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum convite de campanha</h3>
                <p className="text-muted-foreground max-w-sm text-center">
                  Quando marcas te convidarem diretamente para campanhas, você verá aqui
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ApplicationCard({ application }: { application: any }) {
  const campaign = application.campaign;
  const statusConfig = {
    pending: { icon: Clock, label: 'Pendente', variant: 'secondary' as const, color: 'text-amber-500' },
    accepted: { icon: CheckCircle, label: 'Aceita', variant: 'default' as const, color: 'text-green-500' },
    rejected: { icon: XCircle, label: 'Recusada', variant: 'destructive' as const, color: 'text-red-500' },
  };
  
  const status = statusConfig[application.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;
  
  return (
    <Link href={application.status === 'accepted' ? `/campaign/${application.campaignId}/workspace` : `/campaign/${application.campaignId}`}>
      <div 
        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
        data-testid={`application-card-${application.id}`}
      >
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={getAvatarUrl(campaign?.company?.logoUrl)} />
            <AvatarFallback>
              <Building2 className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{campaign?.title || 'Campanha'}</h3>
            <p className="text-sm text-muted-foreground">
              {campaign?.company?.name} • {application.createdAt && format(new Date(application.createdAt), "d 'de' MMM", { locale: ptBR })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status.variant} className="gap-1">
            <StatusIcon className={`h-3 w-3 ${status.color}`} />
            {status.label}
          </Badge>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </Link>
  );
}
