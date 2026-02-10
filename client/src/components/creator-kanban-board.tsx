import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GripVertical, CheckCircle2, FileText, Package, Camera, Eye, Send, Calendar, DollarSign, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Application, Campaign, CreatorWorkflowStatus } from "@shared/schema";
import { Link } from "wouter";

type ApplicationWithCampaign = Application & { campaign: Campaign };

interface KanbanCard {
  application: ApplicationWithCampaign;
  campaign: Campaign;
}

const CREATOR_STAGES: { id: CreatorWorkflowStatus; name: string; color: string; icon: React.ReactNode }[] = [
  { id: "aceito", name: "Aceito", color: "#22c55e", icon: <CheckCircle2 className="h-4 w-4" /> },
  { id: "contrato", name: "Contrato", color: "#f59e0b", icon: <FileText className="h-4 w-4" /> },
  { id: "aguardando_produto", name: "Aguardando Produto", color: "#6366f1", icon: <Package className="h-4 w-4" /> },
  { id: "producao", name: "Produção", color: "#ec4899", icon: <Camera className="h-4 w-4" /> },
  { id: "revisao", name: "Revisão", color: "#06b6d4", icon: <Eye className="h-4 w-4" /> },
  { id: "entregue", name: "Entregue", color: "#14b8a6", icon: <Send className="h-4 w-4" /> },
];

interface CreatorKanbanBoardProps {
  applications: ApplicationWithCampaign[];
}

export function CreatorKanbanBoard({ applications }: CreatorKanbanBoardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [draggedCard, setDraggedCard] = useState<KanbanCard | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [movingCardId, setMovingCardId] = useState<number | null>(null);

  const updateCreatorWorkflowMutation = useMutation({
    mutationFn: async ({ applicationId, creatorWorkflowStatus }: { applicationId: number; creatorWorkflowStatus: string }) => {
      const response = await fetch(`/api/applications/${applicationId}/creator-workflow-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorWorkflowStatus }),
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Não foi possível atualizar o status.");
      }
      return response.json();
    },
    onMutate: async ({ applicationId, creatorWorkflowStatus }) => {
      setMovingCardId(applicationId);
      
      await queryClient.cancelQueries({ queryKey: ["/api/applications/active"] });
      
      const previousApplications = queryClient.getQueryData<ApplicationWithCampaign[]>(["/api/applications/active"]);
      
      queryClient.setQueryData<ApplicationWithCampaign[]>(["/api/applications/active"], (old) => {
        if (!old) return old;
        return old.map(app => 
          app.id === applicationId 
            ? { ...app, creatorWorkflowStatus: creatorWorkflowStatus as CreatorWorkflowStatus }
            : app
        );
      });
      
      return { previousApplications };
    },
    onSuccess: () => {
      toast({
        title: "Status atualizado",
        description: "O status da produção foi atualizado com sucesso.",
      });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousApplications) {
        queryClient.setQueryData(["/api/applications/active"], context.previousApplications);
      }
      toast({
        title: "Não é possível mover",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setMovingCardId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/applications/active"] });
    },
  });

  const kanbanCards: KanbanCard[] = applications.map(app => ({
    application: app,
    campaign: app.campaign,
  }));

  const getCardsForColumn = (stageId: CreatorWorkflowStatus) => {
    return kanbanCards.filter(card => {
      const currentStatus = card.application.creatorWorkflowStatus || card.application.workflowStatus;
      if (!currentStatus) {
        return stageId === "aceito";
      }
      return currentStatus === stageId;
    });
  };

  const handleDragStart = (e: React.DragEvent, card: KanbanCard) => {
    setDraggedCard(card);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== stageId) {
      setDragOverColumn(stageId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget?.closest('[data-column]')) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStageId: CreatorWorkflowStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    const currentStatus = draggedCard?.application.creatorWorkflowStatus || draggedCard?.application.workflowStatus || "aceito";
    
    if (draggedCard && currentStatus !== targetStageId) {
      updateCreatorWorkflowMutation.mutate({
        applicationId: draggedCard.application.id,
        creatorWorkflowStatus: targetStageId,
      });
    }
    setDraggedCard(null);
  };

  const handleDragEnd = () => {
    setDraggedCard(null);
    setDragOverColumn(null);
  };

  if (kanbanCards.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground text-center">
            Você ainda não tem campanhas ativas.<br />
            Quando sua candidatura for aceita, ela aparecerá aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {CREATOR_STAGES.map(stage => {
        const columnCards = getCardsForColumn(stage.id);
        const isDropTarget = dragOverColumn === stage.id && draggedCard;
        const currentCardStatus = draggedCard?.application.creatorWorkflowStatus || draggedCard?.application.workflowStatus || "aceito";
        const canDrop = isDropTarget && currentCardStatus !== stage.id;
        
        return (
          <div
            key={stage.id}
            className="flex-shrink-0 w-72"
            onDragOver={(e) => handleDragOver(e, stage.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage.id)}
            data-column={stage.id}
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
                    <span className="flex items-center gap-1">
                      {stage.icon}
                      {stage.name}
                    </span>
                  </div>
                  <Badge variant="secondary">{columnCards.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="h-[calc(100vh-340px)]">
                  <div className="flex flex-col gap-3 pr-4">
                    {canDrop && columnCards.length === 0 && (
                      <div className="border-2 border-dashed border-primary/50 rounded-lg p-4 text-center text-sm text-primary/70 animate-pulse">
                        Solte aqui para mover
                      </div>
                    )}
                    {columnCards.length === 0 && !canDrop ? (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        Nenhuma campanha nesta etapa
                      </div>
                    ) : (
                      columnCards.map(card => {
                        const isMoving = movingCardId === card.application.id;
                        return (
                          <Link key={card.application.id} href={`/campaign/${card.campaign.id}/workspace`}>
                            <Card
                              className={`cursor-pointer hover:shadow-md transition-all ${
                                isMoving ? "opacity-50 pointer-events-none" : ""
                              } ${draggedCard?.application.id === card.application.id ? "ring-2 ring-primary shadow-lg" : ""}`}
                              draggable={!isMoving}
                              onDragStart={(e) => {
                                e.stopPropagation();
                                handleDragStart(e, card);
                              }}
                              onDragEnd={handleDragEnd}
                              onClick={(e) => {
                                if (draggedCard) {
                                  e.preventDefault();
                                }
                              }}
                              data-testid={`card-application-${card.application.id}`}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-start gap-3">
                                  {isMoving ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                  ) : (
                                    <div className="cursor-grab active:cursor-grabbing text-muted-foreground">
                                      <GripVertical className="h-4 w-4" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{card.campaign.title}</p>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                      {card.campaign.deadline && (
                                        <span className="flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          {format(new Date(card.campaign.deadline), "dd MMM", { locale: ptBR })}
                                        </span>
                                      )}
                                      {card.campaign.budget && (
                                        <span className="flex items-center gap-1">
                                          <DollarSign className="h-3 w-3" />
                                          {card.campaign.budget}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
