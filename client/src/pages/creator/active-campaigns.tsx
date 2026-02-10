import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMarketplace } from '@/lib/provider';
import type { Application, Campaign } from '@shared/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Calendar, 
  DollarSign, 
  Building2, 
  ArrowRight, 
  CheckCircle2, 
  Clock,
  FileText,
  Package,
  Camera,
  Eye,
  Send,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DataTable, Column } from '@/components/data-table';
import { ViewToggle } from '@/components/view-toggle';
import { useViewPreference } from '@/hooks/use-view-preference';
import { CreatorKanbanBoard } from '@/components/creator-kanban-board';

type ApplicationWithCampaign = Application & { campaign: Campaign };
type WorkflowStatus = "aceito" | "contrato" | "aguardando_produto" | "producao" | "revisao" | "entregue";

const WORKFLOW_STEPS: { id: WorkflowStatus; label: string; icon: React.ReactNode; description: string }[] = [
  { id: "aceito", label: "Aceito", icon: <CheckCircle2 className="h-4 w-4" />, description: "Sua candidatura foi aceita" },
  { id: "contrato", label: "Contrato", icon: <FileText className="h-4 w-4" />, description: "Contrato disponível para revisão" },
  { id: "aguardando_produto", label: "Aguardando Produto", icon: <Package className="h-4 w-4" />, description: "Aguardando envio do produto" },
  { id: "producao", label: "Produção", icon: <Camera className="h-4 w-4" />, description: "Criando conteúdo" },
  { id: "revisao", label: "Revisão", icon: <Eye className="h-4 w-4" />, description: "Conteúdo em análise pela empresa" },
  { id: "entregue", label: "Entregue", icon: <Send className="h-4 w-4" />, description: "Campanha finalizada com sucesso" },
];

const WORKFLOW_STATUS_MAP = {
  aceito: { label: 'Aceito', icon: CheckCircle2, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  contrato: { label: 'Contrato', icon: CheckCircle2, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  aguardando_produto: { label: 'Aguardando Produto', icon: Clock, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  producao: { label: 'Em Produção', icon: Clock, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  revisao: { label: 'Em Revisão', icon: Clock, color: 'bg-orange-50 text-orange-700 border-orange-200' },
  entregue: { label: 'Entregue', icon: CheckCircle2, color: 'bg-green-50 text-green-700 border-green-200' },
};

function getStepIndex(status: WorkflowStatus | string | null): number {
  if (!status) return 0;
  return WORKFLOW_STEPS.findIndex(step => step.id === status);
}

function getProgressPercentage(status: WorkflowStatus | string | null): number {
  const index = getStepIndex(status);
  return ((index + 1) / WORKFLOW_STEPS.length) * 100;
}

export default function ActiveCampaigns() {
  const { user } = useMarketplace();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useViewPreference('creator-active-campaigns-view', 'kanban');
  
  const { data: activeCampaigns = [], isLoading, isError } = useQuery<ApplicationWithCampaign[]>({
    queryKey: ['/api/applications/active'],
    enabled: !!user && user.role === 'creator',
    retry: 2,
    staleTime: 30000,
  });

  const updateWorkflowMutation = useMutation({
    mutationFn: async ({ applicationId, workflowStatus }: { applicationId: number; workflowStatus: WorkflowStatus }) => {
      return apiRequest("PATCH", `/api/applications/${applicationId}/workflow-status-creator`, { workflowStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications/active"] });
      toast({
        title: "Status atualizado",
        description: "O status do workflow foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Clock className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando campanhas...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar campanhas</h3>
            <p className="text-muted-foreground max-w-sm text-center mb-6">
              Não foi possível carregar suas campanhas. Tente novamente.
            </p>
            <Button onClick={() => window.location.reload()} data-testid="button-retry">
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-heading tracking-tight" data-testid="text-page-title">Minhas Campanhas Ativas</h1>
        <p className="text-muted-foreground">
          Gerencie suas campanhas em andamento e acompanhe o progresso de cada projeto.
        </p>
      </div>

      <div className="flex justify-end mb-4">
        <ViewToggle mode={viewMode} onChange={setViewMode} />
      </div>

      {activeCampaigns.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma campanha ativa</h3>
            <p className="text-muted-foreground max-w-sm text-center mb-6">
              Você ainda não tem campanhas ativas. Explore o feed e candidate-se a oportunidades!
            </p>
            <Link href="/feed">
              <Button data-testid="button-explore-campaigns">
                Explorar Oportunidades
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : viewMode === 'kanban' ? (
        <CreatorKanbanBoard applications={activeCampaigns} />
      ) : viewMode === 'table' ? (
        <DataTable
          columns={[
            {
              key: 'title',
              label: 'Campanha',
              sortable: true,
              getSortValue: (app: ApplicationWithCampaign) => app.campaign.title,
              render: (app: ApplicationWithCampaign) => (
                <Link href={`/campaign/${app.campaign.id}/workspace`} data-testid={`link-campaign-${app.campaign.id}`}>
                  <span className="font-medium hover:text-primary transition-colors cursor-pointer">
                    {app.campaign.title}
                  </span>
                </Link>
              ),
            },
            {
              key: 'budget',
              label: 'Orçamento',
              sortable: false,
              className: 'hidden md:table-cell',
              render: (app: ApplicationWithCampaign) => app.campaign.budget,
            },
            {
              key: 'progress',
              label: 'Progresso',
              sortable: true,
              getSortValue: (app: ApplicationWithCampaign) => getStepIndex(app.workflowStatus as WorkflowStatus),
              render: (app: ApplicationWithCampaign) => {
                const progress = getProgressPercentage(app.workflowStatus as WorkflowStatus);
                return (
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <Progress value={progress} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground w-8">{Math.round(progress)}%</span>
                  </div>
                );
              },
            },
            {
              key: 'workflowStatus',
              label: 'Status',
              sortable: true,
              getSortValue: (app: ApplicationWithCampaign) => {
                const statusInfo = WORKFLOW_STATUS_MAP[app.workflowStatus as keyof typeof WORKFLOW_STATUS_MAP] || WORKFLOW_STATUS_MAP.aceito;
                return statusInfo.label;
              },
              render: (app: ApplicationWithCampaign) => {
                const statusInfo = WORKFLOW_STATUS_MAP[app.workflowStatus as keyof typeof WORKFLOW_STATUS_MAP] || WORKFLOW_STATUS_MAP.aceito;
                const StatusIcon = statusInfo.icon;
                return (
                  <Badge className={`${statusInfo.color} border`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusInfo.label}
                  </Badge>
                );
              },
            },
            {
              key: 'deadline',
              label: 'Prazo',
              sortable: true,
              getSortValue: (app: ApplicationWithCampaign) => app.campaign.deadline,
              className: 'hidden lg:table-cell',
              render: (app: ApplicationWithCampaign) => format(new Date(app.campaign.deadline), 'dd/MM/yyyy'),
            },
            {
              key: 'actions',
              label: 'Ações',
              className: 'text-right',
              render: (app: ApplicationWithCampaign) => (
                <Link href={`/campaign/${app.campaign.id}/workspace`}>
                  <Button size="sm" data-testid={`button-view-${app.campaign.id}`}>
                    Acessar Workspace
                  </Button>
                </Link>
              ),
            },
          ] as Column<ApplicationWithCampaign>[]}
          data={activeCampaigns}
          keyExtractor={(app) => app.id}
        />
      ) : (
        <div className="grid gap-6">
          {activeCampaigns.map((application) => {
            const campaign = application.campaign;
            if (!campaign) return null;

            const currentStepIndex = getStepIndex(application.workflowStatus as WorkflowStatus);
            const progress = getProgressPercentage(application.workflowStatus as WorkflowStatus);

            return (
              <Card key={application.id} data-testid={`card-campaign-${application.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{campaign.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {campaign.description && campaign.description.length > 100 
                          ? `${campaign.description.slice(0, 100)}...` 
                          : campaign.description}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={application.workflowStatus === "entregue" ? "default" : "secondary"}
                      className="flex-shrink-0"
                    >
                      {WORKFLOW_STEPS[currentStepIndex]?.label || "Aceito"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span>R$ {campaign.budget}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Prazo: {format(new Date(campaign.deadline), "dd/MM/yyyy", { locale: ptBR })}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Progresso</span>
                      <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                    {WORKFLOW_STEPS.map((step, index) => {
                      const isCompleted = index <= currentStepIndex;
                      const isCurrent = index === currentStepIndex;
                      const canAdvance = index === currentStepIndex + 1 && 
                        !["contrato", "revisao", "entregue"].includes(step.id);

                      return (
                        <div
                          key={step.id}
                          className={`p-3 rounded-lg border text-center transition-all ${
                            isCurrent 
                              ? "bg-primary/10 border-primary" 
                              : isCompleted 
                                ? "bg-muted/50 border-muted" 
                                : "border-dashed"
                          } ${canAdvance ? "cursor-pointer hover:bg-muted/50" : ""}`}
                          onClick={() => {
                            if (canAdvance) {
                              updateWorkflowMutation.mutate({
                                applicationId: application.id,
                                workflowStatus: step.id,
                              });
                            }
                          }}
                          data-testid={`step-${step.id}-${application.id}`}
                        >
                          <div className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                            isCompleted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          }`}>
                            {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : step.icon}
                          </div>
                          <p className={`text-xs font-medium ${isCurrent ? "text-primary" : ""}`}>
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <Separator />

                  <div className="flex flex-wrap gap-2">
                    <Link href={`/campaign/${campaign.id}/workspace`}>
                      <Button variant="default" size="sm" data-testid={`button-workspace-${application.id}`}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Abrir Workspace
                      </Button>
                    </Link>
                    <Link href={`/campaign/${campaign.id}`}>
                      <Button variant="outline" size="sm" data-testid={`button-details-${application.id}`}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
