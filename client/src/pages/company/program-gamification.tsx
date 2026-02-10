import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, Save, Loader2, Trophy, Eye, Heart, ShoppingCart, Clock, Package } from "lucide-react";
import { useState, useEffect } from "react";
import type { BrandScoringDefaults } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function ProgramGamificationPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: scoringDefaults, isLoading } = useQuery<BrandScoringDefaults | null>({
    queryKey: ["/api/brand/scoring-defaults"],
  });

  const [formData, setFormData] = useState({
    rulesJson: {
      pointsPerDeliverable: 100,
      pointsOnTimeBonus: 25,
      pointsPer1kViews: 1,
      pointsPerComment: 0,
      pointsPerLike: 0,
      pointsPerSale: 10,
      qualityMultiplier: 1,
    },
    capsJson: {
      maxPointsPerPost: undefined as number | undefined,
      maxPointsPerDay: undefined as number | undefined,
      maxPointsTotalCampaign: undefined as number | undefined,
    },
  });

  useEffect(() => {
    if (scoringDefaults) {
      setFormData({
        rulesJson: {
          pointsPerDeliverable: scoringDefaults.rulesJson?.pointsPerDeliverable ?? 100,
          pointsOnTimeBonus: scoringDefaults.rulesJson?.pointsOnTimeBonus ?? 25,
          pointsPer1kViews: scoringDefaults.rulesJson?.pointsPer1kViews ?? 1,
          pointsPerComment: scoringDefaults.rulesJson?.pointsPerComment ?? 0,
          pointsPerLike: scoringDefaults.rulesJson?.pointsPerLike ?? 0,
          pointsPerSale: scoringDefaults.rulesJson?.pointsPerSale ?? 10,
          qualityMultiplier: scoringDefaults.rulesJson?.qualityMultiplier ?? 1,
        },
        capsJson: {
          maxPointsPerPost: scoringDefaults.capsJson?.maxPointsPerPost,
          maxPointsPerDay: scoringDefaults.capsJson?.maxPointsPerDay,
          maxPointsTotalCampaign: scoringDefaults.capsJson?.maxPointsTotalCampaign,
        },
      });
    }
  }, [scoringDefaults]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("PUT", "/api/brand/scoring-defaults", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand/scoring-defaults"] });
      toast({ title: "Regras salvas com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao salvar regras", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
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
        <div className="flex items-center gap-4">
          <Link href="/company/program">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-gamification-title">
              Regras de Pontuação
            </h1>
            <p className="text-muted-foreground">
              Defina como creators ganham pontos no seu programa
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Pontos por Entregável
              </CardTitle>
              <CardDescription>Pontos ganhos quando o creator entrega conteúdo aprovado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pointsPerDeliverable">Pontos por Entregável</Label>
                  <Input
                    id="pointsPerDeliverable"
                    type="number"
                    value={formData.rulesJson.pointsPerDeliverable}
                    onChange={(e) => setFormData({
                      ...formData,
                      rulesJson: { ...formData.rulesJson, pointsPerDeliverable: parseInt(e.target.value) || 0 }
                    })}
                    data-testid="input-points-deliverable"
                  />
                  <p className="text-xs text-muted-foreground">Pontos base por cada entrega aprovada</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pointsOnTimeBonus" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Bônus por Entrega no Prazo
                  </Label>
                  <Input
                    id="pointsOnTimeBonus"
                    type="number"
                    value={formData.rulesJson.pointsOnTimeBonus}
                    onChange={(e) => setFormData({
                      ...formData,
                      rulesJson: { ...formData.rulesJson, pointsOnTimeBonus: parseInt(e.target.value) || 0 }
                    })}
                    data-testid="input-ontime-bonus"
                  />
                  <p className="text-xs text-muted-foreground">Pontos extras quando entrega antes do prazo</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Pontos por Performance
              </CardTitle>
              <CardDescription>Pontos baseados em métricas de engajamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="pointsPer1kViews" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Pontos por 1k Views
                  </Label>
                  <Input
                    id="pointsPer1kViews"
                    type="number"
                    value={formData.rulesJson.pointsPer1kViews}
                    onChange={(e) => setFormData({
                      ...formData,
                      rulesJson: { ...formData.rulesJson, pointsPer1kViews: parseInt(e.target.value) || 0 }
                    })}
                    data-testid="input-points-views"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pointsPerLike" className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Pontos por Like
                  </Label>
                  <Input
                    id="pointsPerLike"
                    type="number"
                    step="0.1"
                    value={formData.rulesJson.pointsPerLike}
                    onChange={(e) => setFormData({
                      ...formData,
                      rulesJson: { ...formData.rulesJson, pointsPerLike: parseFloat(e.target.value) || 0 }
                    })}
                    data-testid="input-points-likes"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pointsPerComment">Pontos por Comentário</Label>
                  <Input
                    id="pointsPerComment"
                    type="number"
                    step="0.1"
                    value={formData.rulesJson.pointsPerComment}
                    onChange={(e) => setFormData({
                      ...formData,
                      rulesJson: { ...formData.rulesJson, pointsPerComment: parseFloat(e.target.value) || 0 }
                    })}
                    data-testid="input-points-comments"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Pontos por Vendas
              </CardTitle>
              <CardDescription>Pontos ganhos por vendas atribuídas ao creator</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pointsPerSale">Pontos por Venda</Label>
                  <Input
                    id="pointsPerSale"
                    type="number"
                    value={formData.rulesJson.pointsPerSale}
                    onChange={(e) => setFormData({
                      ...formData,
                      rulesJson: { ...formData.rulesJson, pointsPerSale: parseInt(e.target.value) || 0 }
                    })}
                    data-testid="input-points-sale"
                  />
                  <p className="text-xs text-muted-foreground">Pontos por cada venda gerada</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qualityMultiplier">Multiplicador de Qualidade</Label>
                  <Input
                    id="qualityMultiplier"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="5"
                    value={formData.rulesJson.qualityMultiplier}
                    onChange={(e) => setFormData({
                      ...formData,
                      rulesJson: { ...formData.rulesJson, qualityMultiplier: parseFloat(e.target.value) || 1 }
                    })}
                    data-testid="input-quality-multiplier"
                  />
                  <p className="text-xs text-muted-foreground">Multiplicador baseado na avaliação de qualidade</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limites de Pontuação</CardTitle>
              <CardDescription>Defina caps para evitar abuso do sistema (deixe em branco para ilimitado)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="maxPointsPerPost">Máximo por Post</Label>
                  <Input
                    id="maxPointsPerPost"
                    type="number"
                    value={formData.capsJson.maxPointsPerPost || ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      capsJson: { ...formData.capsJson, maxPointsPerPost: e.target.value ? parseInt(e.target.value) : undefined }
                    })}
                    placeholder="Ilimitado"
                    data-testid="input-max-per-post"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPointsPerDay">Máximo por Dia</Label>
                  <Input
                    id="maxPointsPerDay"
                    type="number"
                    value={formData.capsJson.maxPointsPerDay || ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      capsJson: { ...formData.capsJson, maxPointsPerDay: e.target.value ? parseInt(e.target.value) : undefined }
                    })}
                    placeholder="Ilimitado"
                    data-testid="input-max-per-day"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPointsTotalCampaign">Máximo por Campanha</Label>
                  <Input
                    id="maxPointsTotalCampaign"
                    type="number"
                    value={formData.capsJson.maxPointsTotalCampaign || ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      capsJson: { ...formData.capsJson, maxPointsTotalCampaign: e.target.value ? parseInt(e.target.value) : undefined }
                    })}
                    placeholder="Ilimitado"
                    data-testid="input-max-per-campaign"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Link href="/company/program">
              <Button variant="outline" type="button" data-testid="button-cancel">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save-rules">
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Regras
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
