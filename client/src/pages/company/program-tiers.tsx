import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, Plus, Edit, Trash2, Loader2, Crown, Users } from "lucide-react";
import { useState } from "react";
import type { BrandTierConfig } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const defaultColors = ["#CD7F32", "#C0C0C0", "#FFD700", "#B9F2FF"];
const defaultIcons = ["🥉", "🥈", "🥇", "💎"];

export default function ProgramTiersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<BrandTierConfig | null>(null);

  const [formData, setFormData] = useState({
    tierName: "",
    minPoints: 0,
    color: "#CD7F32",
    icon: "🥉",
    benefitsJson: {
      priorityCampaigns: false,
      fasterPayout: false,
      exclusiveContent: false,
      badgeVisible: true,
      customBenefits: [] as string[],
    },
    sortOrder: 0,
  });

  const { data: tiers = [], isLoading } = useQuery<(BrandTierConfig & { creatorCount?: number })[]>({
    queryKey: ["/api/brand/tiers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/brand/tiers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand/tiers"] });
      toast({ title: "Tier criado com sucesso!" });
      resetForm();
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Erro ao criar tier", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      return apiRequest("PUT", `/api/brand/tiers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand/tiers"] });
      toast({ title: "Tier atualizado com sucesso!" });
      resetForm();
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Erro ao atualizar tier", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/brand/tiers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand/tiers"] });
      toast({ title: "Tier removido com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao remover tier", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      tierName: "",
      minPoints: 0,
      color: defaultColors[tiers.length % 4],
      icon: defaultIcons[tiers.length % 4],
      benefitsJson: {
        priorityCampaigns: false,
        fasterPayout: false,
        exclusiveContent: false,
        badgeVisible: true,
        customBenefits: [],
      },
      sortOrder: tiers.length,
    });
    setEditingTier(null);
  };

  const openEditDialog = (tier: BrandTierConfig) => {
    setEditingTier(tier);
    setFormData({
      tierName: tier.tierName,
      minPoints: tier.minPoints,
      color: tier.color || "#CD7F32",
      icon: tier.icon || "🥉",
      benefitsJson: {
        priorityCampaigns: tier.benefitsJson?.priorityCampaigns || false,
        fasterPayout: tier.benefitsJson?.fasterPayout || false,
        exclusiveContent: tier.benefitsJson?.exclusiveContent || false,
        badgeVisible: tier.benefitsJson?.badgeVisible ?? true,
        customBenefits: tier.benefitsJson?.customBenefits || [],
      },
      sortOrder: tier.sortOrder,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTier) {
      updateMutation.mutate({ id: editingTier.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/company/program">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-tiers-title">
                Tiers de Creators
              </h1>
              <p className="text-muted-foreground">
                Configure níveis para classificar creators baseado em pontos
              </p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-tier">
                <Plus className="h-4 w-4 mr-2" />
                Novo Tier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingTier ? "Editar Tier" : "Novo Tier"}</DialogTitle>
                <DialogDescription>
                  {editingTier ? "Atualize as informações do tier" : "Crie um novo nível para seus creators"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tierName">Nome do Tier</Label>
                  <Input
                    id="tierName"
                    value={formData.tierName}
                    onChange={(e) => setFormData({ ...formData, tierName: e.target.value })}
                    placeholder="Ex: Bronze, Prata, Ouro..."
                    required
                    data-testid="input-tier-name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minPoints">Pontos Mínimos</Label>
                    <Input
                      id="minPoints"
                      type="number"
                      value={formData.minPoints}
                      onChange={(e) => setFormData({ ...formData, minPoints: parseInt(e.target.value) || 0 })}
                      min={0}
                      data-testid="input-min-points"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sortOrder">Ordem</Label>
                    <Input
                      id="sortOrder"
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                      min={0}
                      data-testid="input-sort-order"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="color">Cor</Label>
                    <div className="flex gap-2">
                      <Input
                        id="color"
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-12 h-10 p-1"
                        data-testid="input-color"
                      />
                      <Input
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        placeholder="#000000"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="icon">Ícone</Label>
                    <Input
                      id="icon"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="🥇"
                      maxLength={4}
                      data-testid="input-icon"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Benefícios</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Prioridade em campanhas</span>
                      <Switch
                        checked={formData.benefitsJson.priorityCampaigns}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          benefitsJson: { ...formData.benefitsJson, priorityCampaigns: checked }
                        })}
                        data-testid="switch-priority"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Pagamento mais rápido</span>
                      <Switch
                        checked={formData.benefitsJson.fasterPayout}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          benefitsJson: { ...formData.benefitsJson, fasterPayout: checked }
                        })}
                        data-testid="switch-faster-payout"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Conteúdo exclusivo</span>
                      <Switch
                        checked={formData.benefitsJson.exclusiveContent}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          benefitsJson: { ...formData.benefitsJson, exclusiveContent: checked }
                        })}
                        data-testid="switch-exclusive"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Badge visível no perfil</span>
                      <Switch
                        checked={formData.benefitsJson.badgeVisible}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          benefitsJson: { ...formData.benefitsJson, badgeVisible: checked }
                        })}
                        data-testid="switch-badge"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-tier">
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    {editingTier ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {tiers.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Crown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum tier configurado</h3>
              <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                Crie tiers para classificar seus creators e oferecer benefícios exclusivos por nível.
              </p>
              <Button onClick={() => setDialogOpen(true)} data-testid="button-create-first-tier">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Tier
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tiers.map((tier) => (
              <Card key={tier.id} data-testid={`card-tier-${tier.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                        style={{ backgroundColor: `${tier.color}20`, border: `2px solid ${tier.color}` }}
                      >
                        {tier.icon || "🏆"}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{tier.tierName}</CardTitle>
                        <CardDescription>{tier.minPoints.toLocaleString()}+ pontos</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(tier)} data-testid={`button-edit-tier-${tier.id}`}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteMutation.mutate(tier.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-tier-${tier.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Users className="h-4 w-4" />
                    <span>{(tier as any).creatorCount || 0} creators</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    {tier.benefitsJson?.priorityCampaigns && (
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Prioridade em campanhas</span>
                      </div>
                    )}
                    {tier.benefitsJson?.fasterPayout && (
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Pagamento mais rápido</span>
                      </div>
                    )}
                    {tier.benefitsJson?.exclusiveContent && (
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Conteúdo exclusivo</span>
                      </div>
                    )}
                    {tier.benefitsJson?.badgeVisible && (
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Badge visível</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
