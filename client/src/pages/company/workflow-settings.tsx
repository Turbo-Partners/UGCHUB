import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMarketplace } from '@/lib/provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Plus,
  GripVertical,
  Trash2,
  Pencil,
  AlertTriangle,
  Settings,
  Users,
  Plug,
  Lock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Company } from '@shared/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TeamManagement } from '@/components/team-management';
import { CompanyProfileSettings } from '@/components/company-profile-settings';
import { IntegrationsFullContent } from '@/pages/company/integrations';
import { BillingSettings } from '@/components/billing-settings';
import { Building2, CreditCard } from 'lucide-react';

interface WorkflowStage {
  id: number;
  companyId: number;
  name: string;
  position: number;
  color: string;
  isDefault: boolean;
  createdAt: string;
}

const PRESET_COLORS = [
  '#22c55e',
  '#f59e0b',
  '#6366f1',
  '#ef4444',
  '#06b6d4',
  '#ec4899',
  '#8b5cf6',
  '#14b8a6',
  '#f97316',
  '#64748b',
];

interface SortableStageProps {
  stage: WorkflowStage;
  onEdit: (stage: WorkflowStage) => void;
  onDelete: (stage: WorkflowStage) => void;
  canDelete: boolean;
}

function SortableStage({ stage, onEdit, onDelete, canDelete }: SortableStageProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 bg-card border rounded-lg ${isDragging ? 'shadow-lg ring-2 ring-primary/20' : ''}`}
      data-testid={`stage-item-${stage.id}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
        data-testid={`stage-drag-handle-${stage.id}`}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>

      <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />

      <span className="flex-1 font-medium">{stage.name}</span>

      {stage.isDefault && (
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">Padrão</span>
      )}

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(stage)}
          data-testid={`stage-edit-${stage.id}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(stage)}
          disabled={!canDelete}
          className={!canDelete ? 'opacity-50' : ''}
          data-testid={`stage-delete-${stage.id}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function WorkflowSettings() {
  const { user } = useMarketplace();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const initialTab = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && ['company', 'team', 'workflow', 'integrations', 'billing'].includes(tab)) {
      return tab;
    }
    return 'company';
  }, []);

  const { data: activeCompany } = useQuery<Company>({
    queryKey: ['/api/active-company'],
    enabled: !!user && user.role === 'company',
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<WorkflowStage | null>(null);
  const [deleteConfirmStage, setDeleteConfirmStage] = useState<WorkflowStage | null>(null);
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState(PRESET_COLORS[0]);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const { data: stages = [], isLoading } = useQuery<WorkflowStage[]>({
    queryKey: ['workflow-stages', activeCompany?.id],
    queryFn: async () => {
      if (!activeCompany) return [];
      const response = await apiRequest(
        'GET',
        `/api/companies/${activeCompany.id}/workflow-stages`,
      );
      return response.json();
    },
    enabled: !!activeCompany,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      const response = await apiRequest(
        'POST',
        `/api/companies/${activeCompany!.id}/workflow-stages`,
        data,
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-stages'] });
      setIsCreateOpen(false);
      setNewStageName('');
      setNewStageColor(PRESET_COLORS[0]);
      toast({ title: 'Etapa criada com sucesso!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar etapa',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name?: string; color?: string } }) => {
      const response = await apiRequest(
        'PATCH',
        `/api/companies/${activeCompany!.id}/workflow-stages/${id}`,
        data,
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-stages'] });
      setEditingStage(null);
      toast({ title: 'Etapa atualizada com sucesso!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar etapa',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/companies/${activeCompany!.id}/workflow-stages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-stages'] });
      setDeleteConfirmStage(null);
      toast({ title: 'Etapa deletada com sucesso!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao deletar etapa',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (stageIds: number[]) => {
      const response = await apiRequest(
        'POST',
        `/api/companies/${activeCompany!.id}/workflow-stages/reorder`,
        { stageIds },
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-stages'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao reordenar etapas',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = stages.findIndex((s) => s.id === active.id);
    const newIndex = stages.findIndex((s) => s.id === over.id);
    const newOrder = arrayMove(stages, oldIndex, newIndex);

    reorderMutation.mutate(newOrder.map((s) => s.id));
  };

  const handleCreate = () => {
    if (!newStageName.trim()) return;
    createMutation.mutate({ name: newStageName.trim(), color: newStageColor });
  };

  const handleEdit = (stage: WorkflowStage) => {
    setEditingStage(stage);
    setEditName(stage.name);
    setEditColor(stage.color);
  };

  const handleUpdate = () => {
    if (!editingStage || !editName.trim()) return;
    updateMutation.mutate({
      id: editingStage.id,
      data: { name: editName.trim(), color: editColor },
    });
  };

  const handleDelete = () => {
    if (!deleteConfirmStage) return;
    deleteMutation.mutate(deleteConfirmStage.id);
  };

  if (!user || user.role !== 'company') {
    return null;
  }

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Selecione uma loja para configurar as etapas</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const canDeleteStages = stages.length > 2;

  return (
    <div className="container py-8" data-testid="workflow-settings-page">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações da sua conta e equipe.</p>
      </div>

      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="grid w-full max-w-3xl grid-cols-4 mb-6">
          <TabsTrigger
            value="company"
            className="flex items-center gap-2"
            data-testid="tab-company"
          >
            <Building2 className="h-4 w-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2" data-testid="tab-team">
            <Users className="h-4 w-4" />
            Equipe
          </TabsTrigger>
          <TabsTrigger
            value="integrations"
            className="flex items-center gap-2"
            data-testid="tab-integrations"
          >
            <Plug className="h-4 w-4" />
            Integrações
          </TabsTrigger>
          <TabsTrigger
            value="billing"
            disabled
            className="flex items-center gap-2 opacity-50 cursor-not-allowed"
            data-testid="tab-billing"
          >
            <Lock className="h-4 w-4" />
            Faturamento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team">
          <TeamManagement />
        </TabsContent>

        <TabsContent value="company">
          <CompanyProfileSettings />
        </TabsContent>

        <TabsContent value="integrations">
          <IntegrationsFullContent embedded />
        </TabsContent>

        <TabsContent value="billing">
          <BillingSettings />
        </TabsContent>
      </Tabs>

      <Dialog open={!!editingStage} onOpenChange={(open) => !open && setEditingStage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Etapa</DialogTitle>
            <DialogDescription>Modifique o nome e a cor da etapa</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome da Etapa</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                data-testid="input-edit-stage-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full transition-all ${
                      editColor === color
                        ? 'ring-2 ring-offset-2 ring-primary scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setEditColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStage(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!editName.trim() || updateMutation.isPending}
              data-testid="button-confirm-edit"
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteConfirmStage}
        onOpenChange={(open) => !open && setDeleteConfirmStage(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a etapa "{deleteConfirmStage?.name}"? Esta ação não
              pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmStage(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
