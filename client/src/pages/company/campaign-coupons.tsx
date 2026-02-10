import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Plus, Ticket, Copy, Check, RefreshCw, ToggleLeft, ToggleRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Coupon {
  id: number;
  campaignId: number;
  creatorId: number | null;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses: number | null;
  currentUses: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  creator?: {
    id: number;
    name: string;
    instagram: string | null;
    avatar: string | null;
  };
}

interface Campaign {
  id: number;
  title: string;
  companyId: number;
}

export default function CampaignCoupons() {
  const [, params] = useRoute("/campaign/:id/coupons");
  const [, setLocation] = useLocation();
  const campaignId = parseInt(params?.id || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);

  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discountType: "percentage" as 'percentage' | 'fixed',
    discountValue: 10,
    maxUses: "",
    expiresAt: ""
  });

  const [generateConfig, setGenerateConfig] = useState({
    discountType: "percentage" as 'percentage' | 'fixed',
    discountValue: 10,
    maxUses: "",
    expiresAt: "",
    prefix: ""
  });

  const { data: campaign } = useQuery<Campaign>({
    queryKey: ["/api/campaigns", campaignId],
    queryFn: () => apiRequest("GET", `/api/campaigns/${campaignId}`).then(r => r.json()),
    enabled: !!campaignId
  });

  const { data: coupons = [], isLoading } = useQuery<Coupon[]>({
    queryKey: ["/api/campaigns", campaignId, "coupons"],
    queryFn: () => apiRequest("GET", `/api/campaigns/${campaignId}/coupons`).then(r => r.json()),
    enabled: !!campaignId
  });

  const createCouponMutation = useMutation({
    mutationFn: async (data: typeof newCoupon) => {
      const response = await apiRequest("POST", `/api/campaigns/${campaignId}/coupons`, {
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        maxUses: data.maxUses ? parseInt(data.maxUses) : null,
        expiresAt: data.expiresAt || null
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar cupom");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaignId, "coupons"] });
      setShowCreateDialog(false);
      setNewCoupon({ code: "", discountType: "percentage", discountValue: 10, maxUses: "", expiresAt: "" });
      toast({ title: "Cupom criado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });

  const generateCouponsMutation = useMutation({
    mutationFn: async (data: typeof generateConfig) => {
      const response = await apiRequest("POST", `/api/campaigns/${campaignId}/coupons/generate`, {
        discountType: data.discountType,
        discountValue: data.discountValue,
        maxUses: data.maxUses ? parseInt(data.maxUses) : null,
        expiresAt: data.expiresAt || null,
        prefix: data.prefix || null
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao gerar cupons");
      }
      return response.json();
    },
    onSuccess: (data: { created: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaignId, "coupons"] });
      setShowGenerateDialog(false);
      setGenerateConfig({ discountType: "percentage", discountValue: 10, maxUses: "", expiresAt: "", prefix: "" });
      toast({ title: `${data.created} cupons gerados com sucesso!` });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });

  const toggleCouponMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/coupons/${id}`, { isActive });
      if (!response.ok) throw new Error("Erro ao atualizar cupom");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaignId, "coupons"] });
    }
  });

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const totalUses = coupons.reduce((sum, c) => sum + c.currentUses, 0);
  const activeCoupons = coupons.filter(c => c.isActive).length;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => setLocation(`/campaign/${campaignId}/manage`)}
        data-testid="button-back"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar para Campanha
      </Button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ticket className="h-6 w-6" />
            Gestão de Cupons
          </h1>
          <p className="text-muted-foreground">{campaign?.title}</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-generate-coupons">
                <Users className="h-4 w-4 mr-2" />
                Gerar para Criadores
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gerar Cupons Automáticos</DialogTitle>
                <DialogDescription>
                  Gera um cupom único para cada criador aceito na campanha
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo de Desconto</Label>
                    <Select
                      value={generateConfig.discountType}
                      onValueChange={(v: 'percentage' | 'fixed') => setGenerateConfig(prev => ({ ...prev, discountType: v }))}
                    >
                      <SelectTrigger data-testid="select-generate-discount-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                        <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Valor</Label>
                    <Input
                      type="number"
                      value={generateConfig.discountValue}
                      onChange={(e) => setGenerateConfig(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                      data-testid="input-generate-discount-value"
                    />
                  </div>
                </div>
                <div>
                  <Label>Prefixo do Código (opcional)</Label>
                  <Input
                    placeholder="Ex: CAMP"
                    value={generateConfig.prefix}
                    onChange={(e) => setGenerateConfig(prev => ({ ...prev, prefix: e.target.value.toUpperCase() }))}
                    data-testid="input-generate-prefix"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Limite de Usos (opcional)</Label>
                    <Input
                      type="number"
                      placeholder="Ilimitado"
                      value={generateConfig.maxUses}
                      onChange={(e) => setGenerateConfig(prev => ({ ...prev, maxUses: e.target.value }))}
                      data-testid="input-generate-max-uses"
                    />
                  </div>
                  <div>
                    <Label>Validade (opcional)</Label>
                    <Input
                      type="date"
                      value={generateConfig.expiresAt}
                      onChange={(e) => setGenerateConfig(prev => ({ ...prev, expiresAt: e.target.value }))}
                      data-testid="input-generate-expires"
                    />
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => generateCouponsMutation.mutate(generateConfig)}
                  disabled={generateCouponsMutation.isPending}
                  data-testid="button-confirm-generate"
                >
                  {generateCouponsMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Users className="h-4 w-4 mr-2" />
                  )}
                  Gerar Cupons
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-coupon">
                <Plus className="h-4 w-4 mr-2" />
                Criar Cupom
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Cupom</DialogTitle>
                <DialogDescription>
                  Crie um cupom manual para uso geral
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Código do Cupom</Label>
                  <Input
                    placeholder="Ex: DESCONTO10"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    data-testid="input-coupon-code"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo de Desconto</Label>
                    <Select
                      value={newCoupon.discountType}
                      onValueChange={(v: 'percentage' | 'fixed') => setNewCoupon(prev => ({ ...prev, discountType: v }))}
                    >
                      <SelectTrigger data-testid="select-discount-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                        <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Valor</Label>
                    <Input
                      type="number"
                      value={newCoupon.discountValue}
                      onChange={(e) => setNewCoupon(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                      data-testid="input-discount-value"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Limite de Usos (opcional)</Label>
                    <Input
                      type="number"
                      placeholder="Ilimitado"
                      value={newCoupon.maxUses}
                      onChange={(e) => setNewCoupon(prev => ({ ...prev, maxUses: e.target.value }))}
                      data-testid="input-max-uses"
                    />
                  </div>
                  <div>
                    <Label>Validade (opcional)</Label>
                    <Input
                      type="date"
                      value={newCoupon.expiresAt}
                      onChange={(e) => setNewCoupon(prev => ({ ...prev, expiresAt: e.target.value }))}
                      data-testid="input-expires"
                    />
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => createCouponMutation.mutate(newCoupon)}
                  disabled={!newCoupon.code || createCouponMutation.isPending}
                  data-testid="button-confirm-create"
                >
                  {createCouponMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Criar Cupom
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Cupons</CardDescription>
            <CardTitle className="text-2xl" data-testid="text-total-coupons">{coupons.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cupons Ativos</CardDescription>
            <CardTitle className="text-2xl" data-testid="text-active-coupons">{activeCoupons}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Usos</CardDescription>
            <CardTitle className="text-2xl" data-testid="text-total-uses">{totalUses}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : coupons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum cupom criado</h3>
            <p className="text-muted-foreground mb-4">
              Crie cupons manuais ou gere automaticamente para os criadores aceitos
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => (
            <Card key={coupon.id} className={!coupon.isActive ? "opacity-60" : ""} data-testid={`card-coupon-${coupon.id}`}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 rounded-lg p-3">
                      <Ticket className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-bold text-lg" data-testid={`text-coupon-code-${coupon.id}`}>
                          {coupon.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(coupon.code)}
                          data-testid={`button-copy-${coupon.id}`}
                        >
                          {copiedCode === coupon.code ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {coupon.creator && (
                          <span className="flex items-center gap-1">
                            <span>@{coupon.creator.instagram || coupon.creator.name}</span>
                            <span>•</span>
                          </span>
                        )}
                        <span>
                          {coupon.discountType === 'percentage' 
                            ? `${coupon.discountValue}% off`
                            : `R$ ${coupon.discountValue.toFixed(2)} off`
                          }
                        </span>
                        <span>•</span>
                        <span>
                          {coupon.currentUses}{coupon.maxUses ? `/${coupon.maxUses}` : ''} usos
                        </span>
                        {coupon.expiresAt && (
                          <>
                            <span>•</span>
                            <span>
                              Expira {format(new Date(coupon.expiresAt), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={coupon.isActive ? "default" : "secondary"}>
                      {coupon.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCouponMutation.mutate({ id: coupon.id, isActive: !coupon.isActive })}
                      data-testid={`button-toggle-${coupon.id}`}
                    >
                      {coupon.isActive ? (
                        <ToggleRight className="h-5 w-5 text-green-500" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
