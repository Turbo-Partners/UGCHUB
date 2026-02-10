import { useState, useEffect } from "react";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMarketplace } from "@/lib/provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  Filter, 
  FileText, 
  CheckCircle2, 
  GripVertical,
  ChevronRight,
  Instagram,
  Loader2,
  Settings,
  Star,
  Package,
  MessageCircle,
  Clock,
  Image,
  Video,
  File,
  TrendingUp,
  Eye,
  Heart,
  ShoppingCart,
  BarChart3,
  PlusCircle,
  Megaphone,
  MoreHorizontal,
  Pencil,
  Trash2,
  Calendar,
  DollarSign
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Company } from "@shared/schema";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";

interface WorkflowStage {
  id: number;
  companyId: number;
  name: string;
  position: number;
  color: string;
  isDefault: boolean;
}

interface Application {
  id: number;
  campaignId: number;
  creatorId: number;
  status: string;
  workflowStatus: string | null;
  creatorWorkflowStatus: string | null;
  message: string | null;
  appliedAt: string;
}

const CREATOR_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  "aceito": { label: "Aceito", color: "#22c55e" },
  "contrato": { label: "Contrato", color: "#f59e0b" },
  "aguardando_produto": { label: "Aguardando Produto", color: "#6366f1" },
  "producao": { label: "Produção", color: "#ec4899" },
  "revisao": { label: "Revisão", color: "#06b6d4" },
  "entregue": { label: "Entregue", color: "#14b8a6" },
};

interface Campaign {
  id: number;
  title: string;
  status: string;
}

interface Creator {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  instagram: string | null;
}

interface KanbanCard {
  application: Application;
  campaign: Campaign;
  creator: Creator;
}

interface Deliverable {
  id: number;
  applicationId: number;
  title: string;
  fileUrl: string;
  fileType: string;
  createdAt: string;
}

interface Message {
  id: number;
  applicationId: number;
  senderId: number;
  receiverId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface CreatorStats {
  id: number;
  campaignId: number;
  creatorId: number;
  points: number;
  rank: number | null;
  deliverablesCompleted: number;
  deliverablesOnTime: number;
  totalViews: number;
  totalEngagement: number;
  totalSales: number;
  qualityScore: number | null;
}

function MetricsForm({ applicationId, campaignId, creatorId }: { 
  applicationId: number; 
  campaignId: number;
  creatorId: number;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [views, setViews] = useState<string>('');
  const [engagement, setEngagement] = useState<string>('');
  const [sales, setSales] = useState<string>('');
  const [qualityScore, setQualityScore] = useState<string>('');
  const [initialized, setInitialized] = useState(false);

  const { data: stats } = useQuery<CreatorStats>({
    queryKey: [`/api/campaigns/${campaignId}/creator/${creatorId}/stats`],
    enabled: !!campaignId && !!creatorId,
  });

  React.useEffect(() => {
    if (stats && !initialized) {
      setViews(stats.totalViews?.toString() || '');
      setEngagement(stats.totalEngagement?.toString() || '');
      setSales(stats.totalSales?.toString() || '');
      setQualityScore(stats.qualityScore?.toString() || '');
      setInitialized(true);
    }
  }, [stats, initialized]);

  const updateMetricsMutation = useMutation({
    mutationFn: async (data: { views?: number; engagement?: number; sales?: number; qualityScore?: number }) => {
      const response = await apiRequest('PATCH', `/api/applications/${applicationId}/metrics`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Métricas atualizadas!", description: "Os pontos do ranking foram recalculados." });
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/leaderboard`] });
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/creator/${creatorId}/stats`] });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível atualizar as métricas.", variant: "destructive" });
    }
  });

  const handleSubmit = () => {
    const data: { views?: number; engagement?: number; sales?: number; qualityScore?: number } = {};
    
    if (views && !isNaN(parseInt(views)) && parseInt(views) >= 0) {
      data.views = parseInt(views);
    }
    if (engagement && !isNaN(parseInt(engagement)) && parseInt(engagement) >= 0) {
      data.engagement = parseInt(engagement);
    }
    if (sales && !isNaN(parseInt(sales)) && parseInt(sales) >= 0) {
      data.sales = parseInt(sales);
    }
    if (qualityScore && !isNaN(parseFloat(qualityScore))) {
      const qs = parseFloat(qualityScore);
      if (qs >= 0 && qs <= 5) {
        data.qualityScore = qs;
      }
    }
    
    if (Object.keys(data).length === 0) {
      toast({ title: "Atenção", description: "Insira pelo menos uma métrica válida.", variant: "destructive" });
      return;
    }
    
    updateMetricsMutation.mutate(data);
  };

  return (
    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center gap-2 text-blue-800 mb-3">
        <BarChart3 className="h-5 w-5" />
        <p className="font-medium text-sm">Métricas de Performance</p>
      </div>
      <p className="text-xs text-blue-700 mb-4">
        Registre as métricas para calcular pontos no ranking da campanha.
      </p>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="views" className="text-xs flex items-center gap-1">
            <Eye className="h-3 w-3" /> Views
          </Label>
          <Input
            id="views"
            type="number"
            placeholder={stats?.totalViews?.toString() || "0"}
            value={views}
            onChange={(e) => setViews(e.target.value)}
            className="h-8 text-sm"
            data-testid="input-views"
          />
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="engagement" className="text-xs flex items-center gap-1">
            <Heart className="h-3 w-3" /> Engajamento
          </Label>
          <Input
            id="engagement"
            type="number"
            placeholder={stats?.totalEngagement?.toString() || "0"}
            value={engagement}
            onChange={(e) => setEngagement(e.target.value)}
            className="h-8 text-sm"
            data-testid="input-engagement"
          />
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="sales" className="text-xs flex items-center gap-1">
            <ShoppingCart className="h-3 w-3" /> Vendas
          </Label>
          <Input
            id="sales"
            type="number"
            placeholder={stats?.totalSales?.toString() || "0"}
            value={sales}
            onChange={(e) => setSales(e.target.value)}
            className="h-8 text-sm"
            data-testid="input-sales"
          />
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="quality" className="text-xs flex items-center gap-1">
            <Star className="h-3 w-3" /> Qualidade (0-5)
          </Label>
          <Input
            id="quality"
            type="number"
            min="0"
            max="5"
            step="0.5"
            placeholder={stats?.qualityScore?.toString() || "0"}
            value={qualityScore}
            onChange={(e) => setQualityScore(e.target.value)}
            className="h-8 text-sm"
            data-testid="input-quality"
          />
        </div>
      </div>
      
      <Button 
        className="w-full mt-4" 
        size="sm"
        onClick={handleSubmit}
        disabled={updateMetricsMutation.isPending}
        data-testid="button-save-metrics"
      >
        {updateMetricsMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : (
          <TrendingUp className="h-4 w-4 mr-1" />
        )}
        Salvar Métricas
      </Button>
      
      {stats && stats.points > 0 && (
        <div className="mt-3 p-2 bg-white rounded border text-center">
          <p className="text-xs text-muted-foreground">Pontuação atual</p>
          <p className="text-lg font-bold text-primary">{stats.points} pts</p>
          {stats.rank && (
            <p className="text-xs text-muted-foreground">#{stats.rank} no ranking</p>
          )}
        </div>
      )}
    </div>
  );
}

// Draggable card component for @dnd-kit
function DraggableCard({ 
  card, 
  isMoving, 
  onClick 
}: { 
  card: KanbanCard; 
  isMoving: boolean; 
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.application.id,
    disabled: isMoving,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 1000 : undefined,
  } : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`w-full cursor-pointer hover:shadow-md transition-all ${
        isMoving ? "opacity-50 pointer-events-none" : ""
      } ${isDragging ? "ring-2 ring-primary shadow-lg opacity-80" : ""}`}
      onClick={onClick}
      data-testid={`card-application-${card.application.id}`}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <div 
            {...attributes} 
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground touch-none flex-shrink-0"
          >
            {isMoving ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <GripVertical className="h-4 w-4" />
            )}
          </div>
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={card.creator.avatar || undefined} />
            <AvatarFallback>
              {card.creator.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{card.creator.name}</p>
            {card.creator.instagram && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Instagram className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">@{card.creator.instagram}</span>
              </p>
            )}
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              <Badge variant="outline" className="text-xs truncate max-w-[120px]">
                {card.campaign.title}
              </Badge>
              {card.application.creatorWorkflowStatus && (
                <Badge 
                  className="text-xs text-white truncate max-w-[80px]" 
                  style={{ 
                    backgroundColor: CREATOR_STATUS_LABELS[card.application.creatorWorkflowStatus]?.color || "#64748b" 
                  }}
                >
                  {CREATOR_STATUS_LABELS[card.application.creatorWorkflowStatus]?.label || card.application.creatorWorkflowStatus}
                </Badge>
              )}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

// Droppable column component for @dnd-kit
function DroppableColumn({ 
  stage, 
  cards,
  movingCardId,
  onCardClick,
  isDragOver
}: { 
  stage: WorkflowStage; 
  cards: KanbanCard[];
  movingCardId: number | null;
  onCardClick: (card: KanbanCard) => void;
  isDragOver: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.name,
  });

  const canDrop = isOver || isDragOver;

  return (
    <div
      ref={setNodeRef}
      className="flex-shrink-0 w-64 sm:w-72"
      data-column={stage.name}
      data-testid={`column-${stage.id}`}
    >
      <Card className={`transition-all duration-200 ${
        canDrop 
          ? "bg-primary/10 ring-2 ring-primary ring-dashed" 
          : "bg-muted/30"
      }`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <div className="flex items-center gap-2">
              <div 
                className={`w-3 h-3 rounded-full transition-transform ${canDrop ? "scale-125" : ""}`}
                style={{ backgroundColor: stage.color }}
              />
              {stage.name}
            </div>
            <Badge variant="secondary">{cards.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="flex flex-col gap-3 pr-4">
              {canDrop && cards.length === 0 && (
                <div className="border-2 border-dashed border-primary/50 rounded-lg p-4 text-center text-sm text-primary/70 animate-pulse">
                  Solte aqui para mover
                </div>
              )}
              {cards.length === 0 && !canDrop ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Nenhum criador nesta etapa
                </div>
              ) : (
                cards.map(card => (
                  <DraggableCard
                    key={card.application.id}
                    card={card}
                    isMoving={movingCardId === card.application.id}
                    onClick={() => onCardClick(card)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default function KanbanPage() {
  const { user } = useMarketplace();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  const [draggedCard, setDraggedCard] = useState<KanbanCard | null>(null);
  const [movingCardId, setMovingCardId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [deletingCampaignId, setDeletingCampaignId] = useState<number | null>(null);

  const { data: activeCompany } = useQuery<Company>({
    queryKey: ["/api/active-company"],
    enabled: !!user && user.role === "company",
  });

  const { data: workflowStages = [], isLoading: loadingStages } = useQuery<WorkflowStage[]>({
    queryKey: ["workflow-stages", activeCompany?.id],
    queryFn: async () => {
      if (!activeCompany) return [];
      const response = await apiRequest("GET", `/api/companies/${activeCompany.id}/workflow-stages`);
      return response.json();
    },
    enabled: !!activeCompany,
  });

  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
    enabled: !!user && user.role === "company",
  });

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
    enabled: !!user && user.role === "company",
  });

  const { data: creators = [] } = useQuery<Creator[]>({
    queryKey: ["/api/creators"],
    enabled: !!user && user.role === "company",
  });

  // Fetch deliverables for selected application
  const { data: deliverables = [] } = useQuery<Deliverable[]>({
    queryKey: [`/api/applications/${selectedCard?.application.id}/deliverables`],
    queryFn: async () => {
      if (!selectedCard) return [];
      const res = await fetch(`/api/applications/${selectedCard.application.id}/deliverables`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedCard,
  });

  // Fetch messages for selected application
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: [`/api/applications/${selectedCard?.application.id}/messages`],
    queryFn: async () => {
      if (!selectedCard) return [];
      const res = await fetch(`/api/applications/${selectedCard.application.id}/messages`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedCard,
  });

  const updateWorkflowMutation = useMutation({
    mutationFn: async ({ applicationId, workflowStatus }: { applicationId: number; workflowStatus: string }) => {
      return apiRequest("PATCH", `/api/applications/${applicationId}/workflow-status-company`, { workflowStatus });
    },
    onMutate: ({ applicationId }) => {
      setMovingCardId(applicationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
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
    onSettled: () => {
      setMovingCardId(null);
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (campaignId: number) => {
      return apiRequest("DELETE", `/api/campaigns/${campaignId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Campanha excluída",
        description: "A campanha foi excluída com sucesso.",
      });
      setDeletingCampaignId(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a campanha.",
        variant: "destructive",
      });
    },
  });

  const acceptedApplications = applications.filter(app => app.status === "accepted");

  const kanbanCards: KanbanCard[] = acceptedApplications.map(app => {
    const campaign = campaigns.find(c => c.id === app.campaignId);
    const creator = creators.find(c => c.id === app.creatorId);
    return {
      application: app,
      campaign: campaign || { id: app.campaignId, title: "Campanha", status: "active" },
      creator: creator || { id: app.creatorId, name: "Criador", email: "", avatar: null, instagram: null },
    };
  });

  const filteredCards = selectedCampaign === "all" 
    ? kanbanCards 
    : kanbanCards.filter(card => card.campaign.id.toString() === selectedCampaign);

  const getCardsForColumn = (stageName: string) => {
    const validStageNames = workflowStages.map(s => s.name);
    const firstStageName = workflowStages[0]?.name;
    
    return filteredCards.filter(card => {
      const currentStatus = card.application.workflowStatus;
      
      // Se não tem status OU o status não corresponde a nenhuma etapa existente,
      // coloca na primeira etapa
      if (!currentStatus || !validStageNames.includes(currentStatus)) {
        return stageName === firstStageName;
      }
      
      return currentStatus === stageName;
    });
  };

  // Configure sensors for both mouse and touch
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // 8px movement before drag starts
    },
  });
  
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200, // 200ms hold before drag starts on touch
      tolerance: 5, // 5px movement tolerance during delay
    },
  });
  
  const sensors = useSensors(pointerSensor, touchSensor);

  const handleDndDragStart = (event: DragStartEvent) => {
    const cardId = event.active.id as number;
    const card = kanbanCards.find(c => c.application.id === cardId);
    if (card) {
      setDraggedCard(card);
    }
  };

  const handleDndDragOver = (event: any) => {
    const { over } = event;
    if (over) {
      setDragOverColumn(over.id as string);
    } else {
      setDragOverColumn(null);
    }
  };

  const handleDndDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const cardId = active.id as number;
      const targetStageName = over.id as string;
      const card = kanbanCards.find(c => c.application.id === cardId);
      
      if (card) {
        const validStageNames = workflowStages.map(s => s.name);
        const rawStatus = card.application.workflowStatus;
        const currentStatus = (!rawStatus || !validStageNames.includes(rawStatus)) 
          ? workflowStages[0]?.name 
          : rawStatus;
        
        if (currentStatus !== targetStageName) {
          updateWorkflowMutation.mutate({
            applicationId: cardId,
            workflowStatus: targetStageName,
          });
        }
      }
    }
    
    setDraggedCard(null);
    setDragOverColumn(null);
  };

  if (!user || user.role !== "company") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Acesso restrito a empresas.</p>
      </div>
    );
  }

  if (loadingStages) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Ativa</Badge>;
      case "paused":
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Pausada</Badge>;
      case "completed":
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">Concluída</Badge>;
      case "draft":
        return <Badge className="bg-gray-500/20 text-gray-600 border-gray-500/30">Rascunho</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="py-4 sm:py-6 px-3 sm:px-4">
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold" data-testid="text-page-title">Gerenciamento</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Gerencie suas campanhas e acompanhe o progresso dos criadores</p>
          </div>
          <Link href="/create-campaign">
            <Button data-testid="button-create-campaign">
              <PlusCircle className="h-4 w-4 mr-2" />
              Nova Campanha
            </Button>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
                <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                  <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-campaign-filter">
                    <SelectValue placeholder="Filtrar por campanha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as campanhas</SelectItem>
                    {campaigns.filter(c => c.status === "open").map(campaign => (
                      <SelectItem key={campaign.id} value={campaign.id.toString()}>
                        {campaign.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Link href="/workflow-settings">
                <Button variant="outline" size="sm" className="w-full sm:w-auto" data-testid="button-workflow-settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar Etapas
                </Button>
              </Link>
            </div>

            <DndContext
          sensors={sensors}
          onDragStart={handleDndDragStart}
          onDragOver={handleDndDragOver}
          onDragEnd={handleDndDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {workflowStages.map(stage => {
              const columnCards = getCardsForColumn(stage.name);
              const currentCardStatus = draggedCard?.application.workflowStatus || workflowStages[0]?.name;
              const isDragOver = dragOverColumn === stage.name && currentCardStatus !== stage.name;
              
              return (
                <DroppableColumn
                  key={stage.id}
                  stage={stage}
                  cards={columnCards}
                  movingCardId={movingCardId}
                  onCardClick={(card) => setSelectedCard(card)}
                  isDragOver={isDragOver}
                />
              );
            })}
          </div>
          
          {/* Drag overlay for better visual feedback */}
          <DragOverlay>
            {draggedCard ? (
              <Card className="w-72 shadow-2xl ring-2 ring-primary opacity-90">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={draggedCard.creator.avatar || undefined} />
                      <AvatarFallback>
                        {draggedCard.creator.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{draggedCard.creator.name}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {draggedCard.campaign.title}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <AlertDialog open={!!deletingCampaignId} onOpenChange={() => setDeletingCampaignId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir campanha</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCampaignId && deleteCampaignMutation.mutate(deletingCampaignId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <SheetContent className="w-full sm:w-[400px] md:w-[540px] overflow-y-auto">
          {selectedCard && (
            <>
              <SheetHeader>
                <SheetTitle>Detalhes do Criador</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-100px)] pr-4">
                <div className="mt-6 space-y-6">
                  {/* Header com avatar e info do criador */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={selectedCard.creator.avatar || undefined} />
                      <AvatarFallback className="text-lg">
                        {selectedCard.creator.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg">{selectedCard.creator.name}</h3>
                      {selectedCard.creator.instagram && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Instagram className="h-4 w-4" />
                          @{selectedCard.creator.instagram}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status atual do criador nessa campanha - DESTAQUE */}
                  <div className="p-4 rounded-lg border-2" style={{ 
                    borderColor: CREATOR_STATUS_LABELS[selectedCard.application.creatorWorkflowStatus || '']?.color || '#e5e7eb',
                    backgroundColor: `${CREATOR_STATUS_LABELS[selectedCard.application.creatorWorkflowStatus || '']?.color}10` || '#f9fafb'
                  }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Status do Criador</p>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: CREATOR_STATUS_LABELS[selectedCard.application.creatorWorkflowStatus || '']?.color || '#64748b' }}
                          />
                          <span className="font-semibold text-lg">
                            {CREATOR_STATUS_LABELS[selectedCard.application.creatorWorkflowStatus || '']?.label || 'Pendente'}
                          </span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {selectedCard.campaign.title}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  {/* Seu Workflow (da empresa) */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Seu Workflow
                    </h4>
                    <div className="flex gap-2 flex-wrap">
                      {workflowStages.map((stage, index) => {
                        const currentStatus = selectedCard.application.workflowStatus || workflowStages[0]?.name;
                        const isActive = currentStatus === stage.name;
                        const currentIndex = workflowStages.findIndex(s => s.name === currentStatus);
                        const isPast = currentIndex > index;
                        const isUpdating = movingCardId === selectedCard.application.id;
                        
                        return (
                          <button
                            key={stage.id}
                            disabled={isUpdating}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              isUpdating ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-105"
                            } ${isActive ? "ring-2 ring-offset-2" : ""}`}
                            style={{ 
                              backgroundColor: isActive || isPast ? stage.color : '#e5e7eb',
                              color: isActive || isPast ? 'white' : '#64748b',
                              '--tw-ring-color': isActive ? stage.color : undefined
                            } as React.CSSProperties}
                            onClick={() => {
                              if (isUpdating) return;
                              updateWorkflowMutation.mutate({
                                applicationId: selectedCard.application.id,
                                workflowStatus: stage.name,
                              });
                              setSelectedCard({
                                ...selectedCard,
                                application: { ...selectedCard.application, workflowStatus: stage.name }
                              });
                            }}
                            data-testid={`timeline-step-${stage.id}`}
                          >
                            {stage.name}
                            {isUpdating && isActive && (
                              <Loader2 className="h-3 w-3 animate-spin inline ml-1" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  {/* Últimas Entregas */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Entregas ({deliverables.length})
                    </h4>
                    {deliverables.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-3 text-center bg-muted/30 rounded-lg">
                        Nenhuma entrega enviada ainda
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {deliverables.slice(0, 5).map((deliverable) => (
                          <div 
                            key={deliverable.id} 
                            className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="p-1.5 rounded bg-primary/10 text-primary">
                              {deliverable.fileType?.includes('image') ? (
                                <Image className="h-4 w-4" />
                              ) : deliverable.fileType?.includes('video') ? (
                                <Video className="h-4 w-4" />
                              ) : (
                                <File className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{deliverable.title || 'Arquivo'}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(deliverable.createdAt), "dd MMM 'às' HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                            <a 
                              href={deliverable.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline"
                            >
                              Ver
                            </a>
                          </div>
                        ))}
                        {deliverables.length > 5 && (
                          <p className="text-xs text-muted-foreground text-center py-1">
                            +{deliverables.length - 5} mais entregas
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Últimas Mensagens */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Mensagens ({messages.length})
                    </h4>
                    {messages.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-3 text-center bg-muted/30 rounded-lg">
                        Nenhuma mensagem trocada ainda
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {messages.slice(-5).reverse().map((message) => {
                          const isFromCreator = message.senderId === selectedCard.creator.id;
                          return (
                            <div 
                              key={message.id} 
                              className={`p-2 rounded-lg text-sm ${
                                isFromCreator ? 'bg-muted/50 ml-0 mr-4' : 'bg-primary/10 ml-4 mr-0'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-xs">
                                  {isFromCreator ? selectedCard.creator.name : 'Você'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(message.createdAt), "dd MMM HH:mm", { locale: ptBR })}
                                </span>
                              </div>
                              <p className="text-sm line-clamp-2">{message.content}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Ações */}
                  <div className="flex flex-col gap-2">
                    <Link href={`/campaign/${selectedCard.campaign.id}/manage`}>
                      <Button className="w-full" variant="outline" data-testid="button-view-campaign">
                        <FileText className="h-4 w-4 mr-2" />
                        Ver Detalhes da Campanha
                      </Button>
                    </Link>
                    <Link href={`/creator/${selectedCard.creator.id}/profile`}>
                      <Button className="w-full" variant="outline" data-testid="button-view-creator">
                        <Users className="h-4 w-4 mr-2" />
                        Ver Perfil do Criador
                      </Button>
                    </Link>
                  </div>

                  {/* Projeto Concluído e Avaliação */}
                  {selectedCard.application.workflowStatus === 'entregue' && (
                    <>
                      <Separator />
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 text-green-800 mb-2">
                          <CheckCircle2 className="h-5 w-5" />
                          <p className="font-medium text-sm">Projeto Concluído!</p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* Métricas de Performance */}
                      <MetricsForm 
                        applicationId={selectedCard.application.id}
                        campaignId={selectedCard.campaign.id}
                        creatorId={selectedCard.creator.id}
                      />
                    </>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>

    </div>
  );
}
