import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import type { BrandProgram } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function ProgramSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: program, isLoading } = useQuery<BrandProgram | null>({
    queryKey: ["/api/brand/program"],
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    autoJoinCommunity: true,
    couponPrefix: "",
    couponGenerationRule: "prefix_username" as "prefix_username" | "prefix_random" | "custom",
    gamificationEnabled: true,
    defaultRewardMode: "ranking" as "ranking" | "threshold" | "none",
    requirementsJson: {
      minFollowers: undefined as number | undefined,
      minEngagementRate: undefined as number | undefined,
      minAuthenticityScore: undefined as number | undefined,
      verifiedOnly: false,
      niches: [] as string[],
      regions: [] as string[],
    },
  });

  useEffect(() => {
    if (program) {
      setFormData({
        name: program.name || "",
        description: program.description || "",
        autoJoinCommunity: program.autoJoinCommunity,
        couponPrefix: program.couponPrefix || "",
        couponGenerationRule: program.couponGenerationRule || "prefix_username",
        gamificationEnabled: program.gamificationEnabled,
        defaultRewardMode: program.defaultRewardMode || "ranking",
        requirementsJson: {
          minFollowers: program.requirementsJson?.minFollowers,
          minEngagementRate: program.requirementsJson?.minEngagementRate,
          minAuthenticityScore: program.requirementsJson?.minAuthenticityScore,
          verifiedOnly: program.requirementsJson?.verifiedOnly || false,
          niches: program.requirementsJson?.niches || [],
          regions: program.requirementsJson?.regions || [],
        },
      });
    }
  }, [program]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("PUT", "/api/brand/program", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand/program"] });
      toast({ title: "Programa salvo com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao salvar programa", variant: "destructive" });
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
            <Button variant="ghost" size="icon" data-testid="button-back-program">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-settings-title">
              Configurações do Programa
            </h1>
            <p className="text-muted-foreground">
              Configure as opções gerais do seu programa de creators
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Nome e descrição do seu programa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Programa</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Programa de Embaixadores"
                  data-testid="input-program-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o propósito e benefícios do seu programa..."
                  rows={3}
                  data-testid="input-program-description"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gamificação</CardTitle>
              <CardDescription>Configure como os creators ganham pontos e recompensas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Gamificação Habilitada</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativa sistema de pontos, rankings e prêmios
                  </p>
                </div>
                <Switch
                  checked={formData.gamificationEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, gamificationEnabled: checked })}
                  data-testid="switch-gamification"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rewardMode">Modo de Recompensa Padrão</Label>
                <Select
                  value={formData.defaultRewardMode}
                  onValueChange={(value: "ranking" | "threshold" | "none") => 
                    setFormData({ ...formData, defaultRewardMode: value })
                  }
                >
                  <SelectTrigger data-testid="select-reward-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ranking">Ranking (Top N)</SelectItem>
                    <SelectItem value="threshold">Threshold (Meta de pontos)</SelectItem>
                    <SelectItem value="none">Sem recompensas automáticas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comunidade</CardTitle>
              <CardDescription>Como creators entram no seu programa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-join na Comunidade</Label>
                  <p className="text-sm text-muted-foreground">
                    Creators que aceitam campanhas entram automaticamente na comunidade
                  </p>
                </div>
                <Switch
                  checked={formData.autoJoinCommunity}
                  onCheckedChange={(checked) => setFormData({ ...formData, autoJoinCommunity: checked })}
                  data-testid="switch-autojoin"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cupons</CardTitle>
              <CardDescription>Configuração de cupons para creators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="couponPrefix">Prefixo do Cupom</Label>
                <Input
                  id="couponPrefix"
                  value={formData.couponPrefix}
                  onChange={(e) => setFormData({ ...formData, couponPrefix: e.target.value.toUpperCase() })}
                  placeholder="Ex: MARCA"
                  maxLength={10}
                  data-testid="input-coupon-prefix"
                />
                <p className="text-sm text-muted-foreground">
                  Exemplo de cupom: {formData.couponPrefix || "MARCA"}_JOAO_ABC123
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="couponRule">Regra de Geração</Label>
                <Select
                  value={formData.couponGenerationRule}
                  onValueChange={(value: "prefix_username" | "prefix_random" | "custom") => 
                    setFormData({ ...formData, couponGenerationRule: value })
                  }
                >
                  <SelectTrigger data-testid="select-coupon-rule">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prefix_username">Prefixo + Username + Código</SelectItem>
                    <SelectItem value="prefix_random">Prefixo + Código Aleatório</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Requisitos Mínimos</CardTitle>
              <CardDescription>Defina requisitos para participar do programa (opcional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="minFollowers">Mínimo de Seguidores</Label>
                  <Input
                    id="minFollowers"
                    type="number"
                    value={formData.requirementsJson.minFollowers || ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      requirementsJson: {
                        ...formData.requirementsJson,
                        minFollowers: e.target.value ? parseInt(e.target.value) : undefined,
                      },
                    })}
                    placeholder="Ex: 1000"
                    data-testid="input-min-followers"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minEngagement">Taxa de Engajamento Mínima (%)</Label>
                  <Input
                    id="minEngagement"
                    type="number"
                    step="0.1"
                    value={formData.requirementsJson.minEngagementRate || ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      requirementsJson: {
                        ...formData.requirementsJson,
                        minEngagementRate: e.target.value ? parseFloat(e.target.value) : undefined,
                      },
                    })}
                    placeholder="Ex: 2.5"
                    data-testid="input-min-engagement"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Apenas Contas Verificadas</Label>
                  <p className="text-sm text-muted-foreground">
                    Aceitar apenas creators com conta verificada
                  </p>
                </div>
                <Switch
                  checked={formData.requirementsJson.verifiedOnly}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    requirementsJson: {
                      ...formData.requirementsJson,
                      verifiedOnly: checked,
                    },
                  })}
                  data-testid="switch-verified-only"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Link href="/company/program">
              <Button variant="outline" type="button" data-testid="button-cancel">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save-program">
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Programa
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
