import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, Plus, Edit, Trash2, Loader2, Gift, DollarSign, Package, Star, Sparkles } from "lucide-react";
import { useState } from "react";
import type { BrandReward } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const typeIcons: Record<string, React.ReactNode> = {
  cash: <DollarSign className="h-5 w-5" />,
  product: <Package className="h-5 w-5" />,
  benefit: <Star className="h-5 w-5" />,
  experience: <Sparkles className="h-5 w-5" />,
};

const typeLabels: Record<string, string> = {
  cash: "Dinheiro",
  product: "Produto",
  benefit: "Benefício",
  experience: "Experiência",
};

export default function ProgramRewardsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<BrandReward | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "product" as "cash" | "product" | "benefit" | "experience",
    value: undefined as number | undefined,
    imageUrl: "",
    sku: "",
    stock: undefined as number | undefined,
    isActive: true,
    tierRequired: undefined as number | undefined,
    pointsCost: undefined as number | undefined,
  });

  const { data: rewards = [], isLoading } = useQuery<BrandReward[]>({
    queryKey: ["/api/brand/rewards"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/brand/rewards", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand/rewards"] });
      toast({ title: "Prêmio criado com sucesso!" });
      resetForm();
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Erro ao criar prêmio", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      return apiRequest("PUT", `/api/brand/rewards/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand/rewards"] });
      toast({ title: "Prêmio atualizado com sucesso!" });
      resetForm();
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Erro ao atualizar prêmio", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/brand/rewards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand/rewards"] });
      toast({ title: "Prêmio removido com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao remover prêmio", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "product",
      value: undefined,
      imageUrl: "",
      sku: "",
      stock: undefined,
      isActive: true,
      tierRequired: undefined,
      pointsCost: undefined,
    });
    setEditingReward(null);
  };

  const openEditDialog = (reward: BrandReward) => {
    setEditingReward(reward);
    setFormData({
      name: reward.name,
      description: reward.description || "",
      type: reward.type as any,
      value: reward.value || undefined,
      imageUrl: reward.imageUrl || "",
      sku: reward.sku || "",
      stock: reward.stock || undefined,
      isActive: reward.isActive,
      tierRequired: reward.tierRequired || undefined,
      pointsCost: reward.pointsCost || undefined,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingReward) {
      updateMutation.mutate({ id: editingReward.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const formatValue = (reward: BrandReward) => {
    if (reward.type === "cash" && reward.value) {
      return `R$ ${(reward.value / 100).toFixed(2)}`;
    }
    if (reward.pointsCost) {
      return `${reward.pointsCost} pontos`;
    }
    return null;
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
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-rewards-title">
                Catálogo de Prêmios
              </h1>
              <p className="text-muted-foreground">
                Gerencie os prêmios disponíveis para seus creators
              </p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-reward">
                <Plus className="h-4 w-4 mr-2" />
                Novo Prêmio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingReward ? "Editar Prêmio" : "Novo Prêmio"}</DialogTitle>
                <DialogDescription>
                  {editingReward ? "Atualize as informações do prêmio" : "Adicione um novo prêmio ao catálogo"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Prêmio</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Kit de Produtos"
                    required
                    data-testid="input-reward-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva o prêmio..."
                    rows={2}
                    data-testid="input-reward-description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "cash" | "product" | "benefit" | "experience") => 
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger data-testid="select-reward-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="product">Produto</SelectItem>
                      <SelectItem value="benefit">Benefício</SelectItem>
                      <SelectItem value="experience">Experiência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="value">{formData.type === "cash" ? "Valor (R$)" : "Valor Estimado (R$)"}</Label>
                    <Input
                      id="value"
                      type="number"
                      step="0.01"
                      value={formData.value ? formData.value / 100 : ""}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : undefined })}
                      placeholder="0,00"
                      data-testid="input-reward-value"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pointsCost">Custo em Pontos</Label>
                    <Input
                      id="pointsCost"
                      type="number"
                      value={formData.pointsCost || ""}
                      onChange={(e) => setFormData({ ...formData, pointsCost: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="Ex: 1000"
                      data-testid="input-points-cost"
                    />
                  </div>
                </div>
                {formData.type === "product" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        placeholder="SKU-001"
                        data-testid="input-reward-sku"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock">Estoque</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock || ""}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value ? parseInt(e.target.value) : undefined })}
                        placeholder="Ilimitado"
                        data-testid="input-reward-stock"
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <Label>Prêmio Ativo</Label>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    data-testid="switch-reward-active"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-reward">
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    {editingReward ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {rewards.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum prêmio cadastrado</h3>
              <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                Crie prêmios para recompensar seus creators por performance.
              </p>
              <Button onClick={() => setDialogOpen(true)} data-testid="button-create-first-reward">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Prêmio
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rewards.map((reward) => (
              <Card key={reward.id} className={!reward.isActive ? "opacity-60" : ""} data-testid={`card-reward-${reward.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        {typeIcons[reward.type]}
                      </div>
                      <div>
                        <CardTitle className="text-base">{reward.name}</CardTitle>
                        <Badge variant="outline" className="text-xs mt-1">
                          {typeLabels[reward.type]}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(reward)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteMutation.mutate(reward.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {reward.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{reward.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formatValue(reward) || "Sem valor definido"}
                    </span>
                    {reward.stock !== null && (
                      <span className="text-muted-foreground">
                        Estoque: {reward.stock}
                      </span>
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
