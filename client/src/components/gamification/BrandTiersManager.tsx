import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Trophy, Plus, Pencil, Trash2, Users, Loader2, Crown, Medal, Award, Star, Gem } from 'lucide-react';

interface BrandTier {
  id: number;
  companyId: number;
  tierName: string;
  minPoints: number;
  color: string | null;
  icon: string | null;
  benefitsJson: any;
  sortOrder: number;
  creatorCount?: number;
}

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

export function BrandTiersManager() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<BrandTier | null>(null);
  const [deleteConfirmTier, setDeleteConfirmTier] = useState<BrandTier | null>(null);
  const [formData, setFormData] = useState({
    tierName: '',
    minPoints: 0,
    color: '#FFD700',
    icon: 'trophy',
    benefits: '',
  });

  const { data: tiers = [], isLoading } = useQuery<BrandTier[]>({
    queryKey: ['/api/brand/tiers'],
  });

  const createMutation = useMutation({
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
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Erro ao criar tier');
    },
  });

  const updateMutation = useMutation({
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
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Erro ao atualizar tier');
    },
  });

  const deleteMutation = useMutation({
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
      setDeleteConfirmTier(null);
    },
    onError: () => {
      toast.error('Erro ao excluir tier');
    },
  });

  const handleOpenCreate = () => {
    setEditingTier(null);
    setFormData({
      tierName: '',
      minPoints: 0,
      color: '#FFD700',
      icon: 'trophy',
      benefits: '',
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (tier: BrandTier) => {
    setEditingTier(tier);
    const benefits = tier.benefitsJson ? 
      (Array.isArray(tier.benefitsJson) ? tier.benefitsJson.join('\n') : '') : '';
    setFormData({
      tierName: tier.tierName,
      minPoints: tier.minPoints,
      color: tier.color || '#FFD700',
      icon: tier.icon || 'trophy',
      benefits,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTier(null);
  };

  const handleSubmit = () => {
    if (!formData.tierName.trim()) {
      toast.error('Nome do tier é obrigatório');
      return;
    }

    const benefitsArray = formData.benefits
      .split('\n')
      .map(b => b.trim())
      .filter(b => b.length > 0);

    const payload = {
      tierName: formData.tierName,
      minPoints: formData.minPoints,
      color: formData.color,
      icon: formData.icon,
      benefitsJson: benefitsArray.length > 0 ? benefitsArray : null,
      sortOrder: editingTier?.sortOrder || tiers.length,
    };

    if (editingTier) {
      updateMutation.mutate({ id: editingTier.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const getTierIcon = (iconName: string | null) => {
    const iconData = TIER_ICONS.find(i => i.value === iconName);
    return iconData?.Icon || Trophy;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Tiers da Minha Comunidade
              </CardTitle>
              <CardDescription>
                Configure níveis de fidelidade para seus criadores parceiros
              </CardDescription>
            </div>
            <Button onClick={handleOpenCreate} data-testid="button-add-tier">
              <Plus className="h-4 w-4 mr-2" />
              Novo Tier
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tiers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum tier configurado ainda.</p>
              <p className="text-sm">Crie tiers para recompensar seus melhores criadores!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tiers.map((tier) => {
                const TierIcon = getTierIcon(tier.icon);
                return (
                  <div
                    key={tier.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                    data-testid={`tier-card-${tier.id}`}
                  >
                    <div className="flex items-center gap-4">
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
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {tier.creatorCount || 0} criadores
                      </Badge>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(tier)}
                          data-testid={`button-edit-tier-${tier.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirmTier(tier)}
                          data-testid={`button-delete-tier-${tier.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
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
                value={formData.tierName}
                onChange={(e) => setFormData({ ...formData, tierName: e.target.value })}
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
                value={formData.minPoints}
                onChange={(e) => setFormData({ ...formData, minPoints: parseInt(e.target.value) || 0 })}
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
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === color.value ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                    data-testid={`button-color-${color.value}`}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="flex flex-wrap gap-2">
                {TIER_ICONS.map((icon) => (
                  <button
                    key={icon.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: icon.value })}
                    className={`p-2 rounded-lg border transition-all ${
                      formData.icon === icon.value
                        ? 'border-primary bg-primary/10'
                        : 'border-muted hover:border-primary/50'
                    }`}
                    title={icon.label}
                    data-testid={`button-icon-${icon.value}`}
                  >
                    <icon.Icon className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="benefits">Benefícios (um por linha)</Label>
              <Textarea
                id="benefits"
                value={formData.benefits}
                onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                placeholder="Acesso antecipado a campanhas&#10;Suporte prioritário&#10;Bônus em comissões"
                rows={4}
                data-testid="input-tier-benefits"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} data-testid="button-cancel-tier">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-tier"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingTier ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirmTier} onOpenChange={() => setDeleteConfirmTier(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tier</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o tier "{deleteConfirmTier?.tierName}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-tier">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmTier && deleteMutation.mutate(deleteConfirmTier.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-tier"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
