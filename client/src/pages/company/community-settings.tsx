import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/queryClient';
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
import {
  Settings,
  Loader2,
  Save,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Trophy,
  Crown,
  Medal,
  Award,
  Star,
  Gem,
  Ticket,
  Users,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import type { BrandProgram, BrandTierConfig, BrandScoringDefaults } from '@shared/schema';

const TIER_ICONS = [
  { value: 'trophy', label: 'Troféu', Icon: Trophy },
  { value: 'crown', label: 'Coroa', Icon: Crown },
  { value: 'medal', label: 'Medalha', Icon: Medal },
  { value: 'award', label: 'Prêmio', Icon: Award },
  { value: 'star', label: 'Estrela', Icon: Star },
  { value: 'gem', label: 'Diamante', Icon: Gem },
];

const TIER_COLORS = [
  { value: '#CD7F32', label: 'Bronze' },
  { value: '#C0C0C0', label: 'Prata' },
  { value: '#FFD700', label: 'Ouro' },
  { value: '#E5E4E2', label: 'Platina' },
  { value: '#4169E1', label: 'Azul Real' },
  { value: '#9B59B6', label: 'Púrpura' },
];

interface TierFormData {
  tierName: string;
  minPoints: number;
  color: string;
  icon: string;
  priorityCampaigns: boolean;
  fasterPayout: boolean;
  exclusiveContent: boolean;
  badgeVisible: boolean;
  customBenefits: string[];
}

interface SortableTierProps {
  tier: BrandTierConfig;
  onEdit: (tier: BrandTierConfig) => void;
  onDelete: (tier: BrandTierConfig) => void;
}

function SortableTier({ tier, onEdit, onDelete }: SortableTierProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tier.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getTierIcon = (iconName: string | null) => {
    const iconData = TIER_ICONS.find(i => i.value === iconName);
    return iconData?.Icon || Trophy;
  };

  const TierIcon = getTierIcon(tier.icon);
  const benefits = tier.benefitsJson as {
    priorityCampaigns?: boolean;
    fasterPayout?: boolean;
    exclusiveContent?: boolean;
    badgeVisible?: boolean;
    customBenefits?: string[];
  } | null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-4 rounded-lg border bg-card"
      data-testid={`tier-card-${tier.id}`}
    >
      <div className="flex items-center gap-4">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
          data-testid={`tier-drag-handle-${tier.id}`}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
        <div
          className="h-12 w-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: tier.color || '#FFD700' }}
        >
          <TierIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h4 className="font-semibold">{tier.tierName}</h4>
          <p className="text-sm text-muted-foreground">
            Mínimo: {tier.minPoints.toLocaleString()} pontos
          </p>
          {benefits?.customBenefits && benefits.customBenefits.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {benefits.customBenefits.length} benefício(s) personalizado(s)
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(tier)}
          data-testid={`button-edit-tier-${tier.id}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(tier)}
          data-testid={`button-delete-tier-${tier.id}`}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

export default function CommunitySettingsPage() {
  const queryClient = useQueryClient();

  const { data: program, isLoading: programLoading } = useQuery<BrandProgram | null>({
    queryKey: ['/api/brand/program'],
  });

  const { data: tiers = [], isLoading: tiersLoading } = useQuery<BrandTierConfig[]>({
    queryKey: ['/api/brand/tiers'],
  });

  const { data: scoringDefaults, isLoading: scoringLoading } = useQuery<BrandScoringDefaults | null>({
    queryKey: ['/api/brand/scoring-defaults'],
  });

  const [programForm, setProgramForm] = useState({
    gamificationEnabled: true,
    autoJoinCommunity: true,
    couponPrefix: '',
    couponGenerationRule: 'prefix_username' as 'prefix_username' | 'prefix_random' | 'custom',
  });

  const [scoringForm, setScoringForm] = useState({
    pointsPerDeliverable: 100,
    pointsOnTimeBonus: 50,
    pointsPer1kViews: 10,
    pointsPerComment: 2,
    pointsPerLike: 1,
    pointsPerSale: 500,
    qualityMultiplier: 1.0,
    maxPointsPerPost: 1000,
    maxPointsPerDay: 5000,
    maxPointsTotalCampaign: 50000,
    countingWindowDays: 30,
  });

  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<BrandTierConfig | null>(null);
  const [deleteTier, setDeleteTier] = useState<BrandTierConfig | null>(null);
  const [newCustomBenefit, setNewCustomBenefit] = useState('');
  const [tierForm, setTierForm] = useState<TierFormData>({
    tierName: '',
    minPoints: 0,
    color: '#FFD700',
    icon: 'trophy',
    priorityCampaigns: false,
    fasterPayout: false,
    exclusiveContent: false,
    badgeVisible: true,
    customBenefits: [],
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (program) {
      setProgramForm({
        gamificationEnabled: program.gamificationEnabled,
        autoJoinCommunity: program.autoJoinCommunity,
        couponPrefix: program.couponPrefix || '',
        couponGenerationRule: program.couponGenerationRule || 'prefix_username',
      });
    }
  }, [program]);

  useEffect(() => {
    if (scoringDefaults) {
      const rules = scoringDefaults.rulesJson as any || {};
      const caps = scoringDefaults.capsJson as any || {};
      setScoringForm({
        pointsPerDeliverable: rules.pointsPerDeliverable ?? 100,
        pointsOnTimeBonus: rules.pointsOnTimeBonus ?? 50,
        pointsPer1kViews: rules.pointsPer1kViews ?? 10,
        pointsPerComment: rules.pointsPerComment ?? 2,
        pointsPerLike: rules.pointsPerLike ?? 1,
        pointsPerSale: rules.pointsPerSale ?? 500,
        qualityMultiplier: rules.qualityMultiplier ?? 1.0,
        maxPointsPerPost: caps.maxPointsPerPost ?? 1000,
        maxPointsPerDay: caps.maxPointsPerDay ?? 5000,
        maxPointsTotalCampaign: caps.maxPointsTotalCampaign ?? 50000,
        countingWindowDays: caps.countingWindowDays ?? 30,
      });
    }
  }, [scoringDefaults]);

  const saveProgramMutation = useMutation({
    mutationFn: async (data: typeof programForm) => {
      return apiRequest('PUT', '/api/brand/program', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/brand/program'] });
      toast.success('Configurações da comunidade salvas!');
    },
    onError: () => {
      toast.error('Erro ao salvar configurações');
    },
  });

  const saveScoringMutation = useMutation({
    mutationFn: async (data: typeof scoringForm) => {
      const rulesJson = {
        pointsPerDeliverable: data.pointsPerDeliverable,
        pointsOnTimeBonus: data.pointsOnTimeBonus,
        pointsPer1kViews: data.pointsPer1kViews,
        pointsPerComment: data.pointsPerComment,
        pointsPerLike: data.pointsPerLike,
        pointsPerSale: data.pointsPerSale,
        qualityMultiplier: data.qualityMultiplier,
      };
      const capsJson = {
        maxPointsPerPost: data.maxPointsPerPost,
        maxPointsPerDay: data.maxPointsPerDay,
        maxPointsTotalCampaign: data.maxPointsTotalCampaign,
        countingWindowDays: data.countingWindowDays,
      };
      return apiRequest('PUT', '/api/brand/scoring-defaults', { rulesJson, capsJson });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/brand/scoring-defaults'] });
      toast.success('Regras de pontuação salvas!');
    },
    onError: () => {
      toast.error('Erro ao salvar regras de pontuação');
    },
  });

  const createTierMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/brand/tiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Erro ao criar tier');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/brand/tiers'] });
      toast.success('Tier criado com sucesso!');
      closeTierDialog();
    },
    onError: () => {
      toast.error('Erro ao criar tier');
    },
  });

  const updateTierMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/brand/tiers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Erro ao atualizar tier');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/brand/tiers'] });
      toast.success('Tier atualizado com sucesso!');
      closeTierDialog();
    },
    onError: () => {
      toast.error('Erro ao atualizar tier');
    },
  });

  const deleteTierMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/brand/tiers/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Erro ao excluir tier');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/brand/tiers'] });
      toast.success('Tier excluído com sucesso!');
      setDeleteTier(null);
    },
    onError: () => {
      toast.error('Erro ao excluir tier');
    },
  });

  const reorderTiersMutation = useMutation({
    mutationFn: async (tierIds: number[]) => {
      const res = await fetch('/api/brand/tiers/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tierIds }),
      });
      if (!res.ok) throw new Error('Erro ao reordenar tiers');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/brand/tiers'] });
    },
    onError: () => {
      toast.error('Erro ao reordenar tiers');
    },
  });

  const openCreateTierDialog = () => {
    setEditingTier(null);
    setTierForm({
      tierName: '',
      minPoints: 0,
      color: '#FFD700',
      icon: 'trophy',
      priorityCampaigns: false,
      fasterPayout: false,
      exclusiveContent: false,
      badgeVisible: true,
      customBenefits: [],
    });
    setNewCustomBenefit('');
    setTierDialogOpen(true);
  };

  const openEditTierDialog = (tier: BrandTierConfig) => {
    setEditingTier(tier);
    const benefits = tier.benefitsJson as {
      priorityCampaigns?: boolean;
      fasterPayout?: boolean;
      exclusiveContent?: boolean;
      badgeVisible?: boolean;
      customBenefits?: string[];
    } | null;
    setTierForm({
      tierName: tier.tierName,
      minPoints: tier.minPoints,
      color: tier.color || '#FFD700',
      icon: tier.icon || 'trophy',
      priorityCampaigns: benefits?.priorityCampaigns ?? false,
      fasterPayout: benefits?.fasterPayout ?? false,
      exclusiveContent: benefits?.exclusiveContent ?? false,
      badgeVisible: benefits?.badgeVisible ?? true,
      customBenefits: benefits?.customBenefits || [],
    });
    setNewCustomBenefit('');
    setTierDialogOpen(true);
  };

  const closeTierDialog = () => {
    setTierDialogOpen(false);
    setEditingTier(null);
  };

  const handleTierSubmit = () => {
    if (!tierForm.tierName.trim()) {
      toast.error('Nome do tier é obrigatório');
      return;
    }

    const payload = {
      tierName: tierForm.tierName,
      minPoints: tierForm.minPoints,
      color: tierForm.color,
      icon: tierForm.icon,
      benefitsJson: {
        priorityCampaigns: tierForm.priorityCampaigns,
        fasterPayout: tierForm.fasterPayout,
        exclusiveContent: tierForm.exclusiveContent,
        badgeVisible: tierForm.badgeVisible,
        customBenefits: tierForm.customBenefits.filter(b => b.trim()),
      },
      sortOrder: editingTier?.sortOrder ?? tiers.length,
    };

    if (editingTier) {
      updateTierMutation.mutate({ id: editingTier.id, data: payload });
    } else {
      createTierMutation.mutate(payload);
    }
  };

  const addCustomBenefit = () => {
    if (newCustomBenefit.trim()) {
      setTierForm({
        ...tierForm,
        customBenefits: [...tierForm.customBenefits, newCustomBenefit.trim()],
      });
      setNewCustomBenefit('');
    }
  };

  const removeCustomBenefit = (index: number) => {
    setTierForm({
      ...tierForm,
      customBenefits: tierForm.customBenefits.filter((_, i) => i !== index),
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tiers.findIndex((t) => t.id === active.id);
      const newIndex = tiers.findIndex((t) => t.id === over.id);
      const newOrder = arrayMove(tiers, oldIndex, newIndex);
      reorderTiersMutation.mutate(newOrder.map(t => t.id));
    }
  };

  const isLoading = programLoading || tiersLoading || scoringLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
            Configurações da Comunidade
          </h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            Configure como funciona sua comunidade de criadores, gamificação, cupons e níveis de fidelidade.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Comunidade
            </CardTitle>
            <CardDescription>
              Configurações gerais de gamificação e entrada na comunidade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Gamificação Ativa</Label>
                <p className="text-sm text-muted-foreground">
                  Habilita sistema de pontos, níveis e recompensas para criadores
                </p>
              </div>
              <Switch
                checked={programForm.gamificationEnabled}
                onCheckedChange={(checked) => setProgramForm({ ...programForm, gamificationEnabled: checked })}
                data-testid="switch-gamification-enabled"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Creators entram automaticamente na comunidade</Label>
                <p className="text-sm text-muted-foreground">
                  Quando um creator é aceito em uma campanha, ele é adicionado automaticamente à comunidade
                </p>
              </div>
              <Switch
                checked={programForm.autoJoinCommunity}
                onCheckedChange={(checked) => setProgramForm({ ...programForm, autoJoinCommunity: checked })}
                data-testid="switch-auto-join-community"
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => saveProgramMutation.mutate(programForm)}
                disabled={saveProgramMutation.isPending}
                data-testid="button-save-community-settings"
              >
                {saveProgramMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Configurações
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Cupom Padrão
            </CardTitle>
            <CardDescription>
              Configure como os cupons são gerados para os criadores da comunidade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="couponPrefix">Prefixo do Cupom</Label>
                <Input
                  id="couponPrefix"
                  value={programForm.couponPrefix}
                  onChange={(e) => setProgramForm({ ...programForm, couponPrefix: e.target.value.toUpperCase() })}
                  placeholder="Ex: MARCA"
                  maxLength={10}
                  data-testid="input-coupon-prefix"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="couponRule">Regra de Geração</Label>
                <Select
                  value={programForm.couponGenerationRule}
                  onValueChange={(value: 'prefix_username' | 'prefix_random' | 'custom') => 
                    setProgramForm({ ...programForm, couponGenerationRule: value })
                  }
                >
                  <SelectTrigger data-testid="select-coupon-generation-rule">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prefix_username">Prefixo + Username</SelectItem>
                    <SelectItem value="prefix_random">Prefixo + Código Aleatório</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
              <p className="font-medium mb-1">Como o cupom é gerado:</p>
              {programForm.couponGenerationRule === 'prefix_username' && (
                <p>Exemplo: <code className="bg-background px-1 rounded">{programForm.couponPrefix || 'MARCA'}_JOAO</code></p>
              )}
              {programForm.couponGenerationRule === 'prefix_random' && (
                <p>Exemplo: <code className="bg-background px-1 rounded">{programForm.couponPrefix || 'MARCA'}_A1B2C3</code></p>
              )}
              {programForm.couponGenerationRule === 'custom' && (
                <p>O cupom será definido manualmente para cada criador</p>
              )}
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => saveProgramMutation.mutate(programForm)}
                disabled={saveProgramMutation.isPending}
                data-testid="button-save-coupon-settings"
              >
                {saveProgramMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Cupom
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Tiers
                </CardTitle>
                <CardDescription>
                  Configure os níveis de fidelidade e seus benefícios. Arraste para reordenar.
                </CardDescription>
              </div>
              <Button onClick={openCreateTierDialog} data-testid="button-add-tier">
                <Plus className="h-4 w-4 mr-2" />
                Novo Tier
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {tiers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground" data-testid="empty-tiers-state">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum tier configurado ainda.</p>
                <p className="text-sm">Crie tiers para recompensar seus melhores criadores!</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={tiers.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3" data-testid="tiers-list">
                    {tiers.map((tier) => (
                      <SortableTier
                        key={tier.id}
                        tier={tier}
                        onEdit={openEditTierDialog}
                        onDelete={setDeleteTier}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Pontos Padrão
            </CardTitle>
            <CardDescription>
              Configure as regras de pontuação para seus criadores
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Regras de Pontuação
              </h4>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="pointsPerDeliverable">Pontos por Entrega</Label>
                  <Input
                    id="pointsPerDeliverable"
                    type="number"
                    min={0}
                    value={scoringForm.pointsPerDeliverable}
                    onChange={(e) => setScoringForm({ ...scoringForm, pointsPerDeliverable: parseInt(e.target.value) || 0 })}
                    data-testid="input-points-per-deliverable"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pointsOnTimeBonus">Bônus Entrega no Prazo</Label>
                  <Input
                    id="pointsOnTimeBonus"
                    type="number"
                    min={0}
                    value={scoringForm.pointsOnTimeBonus}
                    onChange={(e) => setScoringForm({ ...scoringForm, pointsOnTimeBonus: parseInt(e.target.value) || 0 })}
                    data-testid="input-points-on-time-bonus"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pointsPer1kViews">Pontos por 1k Views</Label>
                  <Input
                    id="pointsPer1kViews"
                    type="number"
                    min={0}
                    value={scoringForm.pointsPer1kViews}
                    onChange={(e) => setScoringForm({ ...scoringForm, pointsPer1kViews: parseInt(e.target.value) || 0 })}
                    data-testid="input-points-per-1k-views"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pointsPerComment">Pontos por Comentário</Label>
                  <Input
                    id="pointsPerComment"
                    type="number"
                    min={0}
                    value={scoringForm.pointsPerComment}
                    onChange={(e) => setScoringForm({ ...scoringForm, pointsPerComment: parseInt(e.target.value) || 0 })}
                    data-testid="input-points-per-comment"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pointsPerLike">Pontos por Like</Label>
                  <Input
                    id="pointsPerLike"
                    type="number"
                    min={0}
                    value={scoringForm.pointsPerLike}
                    onChange={(e) => setScoringForm({ ...scoringForm, pointsPerLike: parseInt(e.target.value) || 0 })}
                    data-testid="input-points-per-like"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pointsPerSale">Pontos por Venda</Label>
                  <Input
                    id="pointsPerSale"
                    type="number"
                    min={0}
                    value={scoringForm.pointsPerSale}
                    onChange={(e) => setScoringForm({ ...scoringForm, pointsPerSale: parseInt(e.target.value) || 0 })}
                    data-testid="input-points-per-sale"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qualityMultiplier">Multiplicador de Qualidade</Label>
                  <Input
                    id="qualityMultiplier"
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={scoringForm.qualityMultiplier}
                    onChange={(e) => setScoringForm({ ...scoringForm, qualityMultiplier: parseFloat(e.target.value) || 1.0 })}
                    data-testid="input-quality-multiplier"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Limites de Pontuação
              </h4>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="maxPointsPerPost">Máx. Pontos por Post</Label>
                  <Input
                    id="maxPointsPerPost"
                    type="number"
                    min={0}
                    value={scoringForm.maxPointsPerPost}
                    onChange={(e) => setScoringForm({ ...scoringForm, maxPointsPerPost: parseInt(e.target.value) || 0 })}
                    data-testid="input-max-points-per-post"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPointsPerDay">Máx. Pontos por Dia</Label>
                  <Input
                    id="maxPointsPerDay"
                    type="number"
                    min={0}
                    value={scoringForm.maxPointsPerDay}
                    onChange={(e) => setScoringForm({ ...scoringForm, maxPointsPerDay: parseInt(e.target.value) || 0 })}
                    data-testid="input-max-points-per-day"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPointsTotalCampaign">Máx. Total por Campanha</Label>
                  <Input
                    id="maxPointsTotalCampaign"
                    type="number"
                    min={0}
                    value={scoringForm.maxPointsTotalCampaign}
                    onChange={(e) => setScoringForm({ ...scoringForm, maxPointsTotalCampaign: parseInt(e.target.value) || 0 })}
                    data-testid="input-max-points-total-campaign"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="countingWindowDays">Janela de Contagem (dias)</Label>
                  <Input
                    id="countingWindowDays"
                    type="number"
                    min={1}
                    value={scoringForm.countingWindowDays}
                    onChange={(e) => setScoringForm({ ...scoringForm, countingWindowDays: parseInt(e.target.value) || 30 })}
                    data-testid="input-counting-window-days"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => saveScoringMutation.mutate(scoringForm)}
                disabled={saveScoringMutation.isPending}
                data-testid="button-save-scoring-settings"
              >
                {saveScoringMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Regras de Pontuação
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={tierDialogOpen} onOpenChange={setTierDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTier ? 'Editar Tier' : 'Novo Tier'}</DialogTitle>
            <DialogDescription>
              Configure os detalhes do nível de fidelidade
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tierName">Nome do Tier *</Label>
              <Input
                id="tierName"
                value={tierForm.tierName}
                onChange={(e) => setTierForm({ ...tierForm, tierName: e.target.value })}
                placeholder="Ex: Ouro, Diamante, VIP..."
                data-testid="input-tier-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minPoints">Pontos Mínimos</Label>
              <Input
                id="minPoints"
                type="number"
                min={0}
                value={tierForm.minPoints}
                onChange={(e) => setTierForm({ ...tierForm, minPoints: parseInt(e.target.value) || 0 })}
                data-testid="input-tier-min-points"
              />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {TIER_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setTierForm({ ...tierForm, color: color.value })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      tierForm.color === color.value ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                    data-testid={`button-tier-color-${color.value.replace('#', '')}`}
                  />
                ))}
                <Input
                  type="color"
                  value={tierForm.color}
                  onChange={(e) => setTierForm({ ...tierForm, color: e.target.value })}
                  className="w-8 h-8 p-0 border-0 cursor-pointer"
                  data-testid="input-tier-color-custom"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="flex flex-wrap gap-2">
                {TIER_ICONS.map((icon) => (
                  <button
                    key={icon.value}
                    type="button"
                    onClick={() => setTierForm({ ...tierForm, icon: icon.value })}
                    className={`p-2 rounded-lg border transition-all ${
                      tierForm.icon === icon.value
                        ? 'border-primary bg-primary/10'
                        : 'border-muted hover:border-primary/50'
                    }`}
                    title={icon.label}
                    data-testid={`button-tier-icon-${icon.value}`}
                  >
                    <icon.Icon className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Label>Benefícios</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="priorityCampaigns"
                    checked={tierForm.priorityCampaigns}
                    onCheckedChange={(checked) => setTierForm({ ...tierForm, priorityCampaigns: checked === true })}
                    data-testid="checkbox-priority-campaigns"
                  />
                  <Label htmlFor="priorityCampaigns" className="text-sm font-normal">Acesso prioritário a campanhas</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fasterPayout"
                    checked={tierForm.fasterPayout}
                    onCheckedChange={(checked) => setTierForm({ ...tierForm, fasterPayout: checked === true })}
                    data-testid="checkbox-faster-payout"
                  />
                  <Label htmlFor="fasterPayout" className="text-sm font-normal">Pagamento mais rápido</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="exclusiveContent"
                    checked={tierForm.exclusiveContent}
                    onCheckedChange={(checked) => setTierForm({ ...tierForm, exclusiveContent: checked === true })}
                    data-testid="checkbox-exclusive-content"
                  />
                  <Label htmlFor="exclusiveContent" className="text-sm font-normal">Conteúdo exclusivo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="badgeVisible"
                    checked={tierForm.badgeVisible}
                    onCheckedChange={(checked) => setTierForm({ ...tierForm, badgeVisible: checked === true })}
                    data-testid="checkbox-badge-visible"
                  />
                  <Label htmlFor="badgeVisible" className="text-sm font-normal">Badge visível no perfil</Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Benefícios Personalizados</Label>
              <div className="flex gap-2">
                <Input
                  value={newCustomBenefit}
                  onChange={(e) => setNewCustomBenefit(e.target.value)}
                  placeholder="Adicionar benefício..."
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomBenefit())}
                  data-testid="input-custom-benefit"
                />
                <Button type="button" variant="outline" onClick={addCustomBenefit} data-testid="button-add-custom-benefit">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tierForm.customBenefits.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tierForm.customBenefits.map((benefit, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm"
                    >
                      <span>{benefit}</span>
                      <button
                        type="button"
                        onClick={() => removeCustomBenefit(index)}
                        className="text-muted-foreground hover:text-foreground"
                        data-testid={`button-remove-custom-benefit-${index}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeTierDialog} data-testid="button-cancel-tier">
              Cancelar
            </Button>
            <Button
              onClick={handleTierSubmit}
              disabled={createTierMutation.isPending || updateTierMutation.isPending}
              data-testid="button-save-tier"
            >
              {(createTierMutation.isPending || updateTierMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingTier ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTier} onOpenChange={() => setDeleteTier(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tier</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o tier "{deleteTier?.tierName}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-tier">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTier && deleteTierMutation.mutate(deleteTier.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-tier"
            >
              {deleteTierMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
