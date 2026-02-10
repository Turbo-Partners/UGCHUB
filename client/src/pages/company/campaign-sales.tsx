import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Plus, ShoppingCart, DollarSign, RefreshCw, Check, Clock, Ban, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Sale {
  id: number;
  campaignId: number;
  creatorId: number;
  orderId: string;
  orderValue: number;
  commission: number | null;
  commissionRateBps: number | null;
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled';
  platform: 'shopify' | 'woocommerce' | 'manual';
  trackedAt: string;
  creator: {
    id: number;
    name: string;
    instagram: string | null;
    avatar: string | null;
  };
}

interface Commission {
  id: number;
  creatorId: number;
  campaignId: number;
  salesTrackingId: number | null;
  amount: number;
  status: 'pending' | 'approved' | 'paid';
  createdAt: string;
  paidAt: string | null;
  creator: {
    id: number;
    name: string;
    instagram: string | null;
    avatar: string | null;
  };
}

interface Application {
  id: number;
  creatorId: number;
  status: string;
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

export default function CampaignSales() {
  const [, params] = useRoute("/campaign/:id/sales");
  const [, setLocation] = useLocation();
  const campaignId = parseInt(params?.id || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSaleDialog, setShowSaleDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("sales");

  const [newSale, setNewSale] = useState({
    creatorId: "",
    orderId: "",
    orderValue: "",
    commissionRateBps: "1000",
    couponCode: ""
  });

  const { data: campaign } = useQuery<Campaign>({
    queryKey: ["/api/campaigns", campaignId],
    queryFn: () => apiRequest("GET", `/api/campaigns/${campaignId}`).then(r => r.json()),
    enabled: !!campaignId
  });

  const { data: sales = [], isLoading: salesLoading } = useQuery<Sale[]>({
    queryKey: ["/api/campaigns", campaignId, "sales"],
    queryFn: () => apiRequest("GET", `/api/campaigns/${campaignId}/sales`).then(r => r.json()),
    enabled: !!campaignId
  });

  const { data: commissions = [], isLoading: commissionsLoading } = useQuery<Commission[]>({
    queryKey: ["/api/campaigns", campaignId, "commissions"],
    queryFn: () => apiRequest("GET", `/api/campaigns/${campaignId}/commissions`).then(r => r.json()),
    enabled: !!campaignId
  });

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/campaigns", campaignId, "applications"],
    queryFn: () => apiRequest("GET", `/api/campaigns/${campaignId}/applications`).then(r => r.json()),
    enabled: !!campaignId
  });

  const acceptedCreators = applications.filter(a => a.status === 'accepted');

  const createSaleMutation = useMutation({
    mutationFn: async (data: typeof newSale) => {
      const response = await apiRequest("POST", `/api/campaigns/${campaignId}/sales`, {
        creatorId: parseInt(data.creatorId),
        orderId: data.orderId,
        orderValue: parseFloat(data.orderValue) * 100,
        commissionRateBps: parseInt(data.commissionRateBps),
        couponCode: data.couponCode || null
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao registrar venda");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaignId, "sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaignId, "commissions"] });
      setShowSaleDialog(false);
      setNewSale({ creatorId: "", orderId: "", orderValue: "", commissionRateBps: "1000", couponCode: "" });
      toast({ title: "Venda registrada com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });

  const updateCommissionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'pending' | 'approved' | 'paid' }) => {
      const response = await apiRequest("PATCH", `/api/commissions/${id}`, { status });
      if (!response.ok) throw new Error("Erro ao atualizar comissão");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaignId, "commissions"] });
      toast({ title: "Status atualizado!" });
    }
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100);
  };

  const totalSales = sales.reduce((sum, s) => sum + s.orderValue, 0);
  const totalCommissions = commissions.reduce((sum, c) => sum + c.amount, 0);
  const pendingCommissions = commissions.filter(c => c.status === 'pending' || c.status === 'approved').reduce((sum, c) => sum + c.amount, 0);
  const paidCommissions = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'approved': return <Badge variant="outline" className="text-blue-600 border-blue-600"><Check className="h-3 w-3 mr-1" />Aprovada</Badge>;
      case 'paid': return <Badge className="bg-green-500"><DollarSign className="h-3 w-3 mr-1" />Paga</Badge>;
      case 'confirmed': return <Badge className="bg-green-500"><Check className="h-3 w-3 mr-1" />Confirmada</Badge>;
      case 'cancelled': return <Badge variant="destructive"><Ban className="h-3 w-3 mr-1" />Cancelada</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

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
            <ShoppingCart className="h-6 w-6" />
            Vendas e Comissões
          </h1>
          <p className="text-muted-foreground">{campaign?.title}</p>
        </div>
        <Dialog open={showSaleDialog} onOpenChange={setShowSaleDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-register-sale">
              <Plus className="h-4 w-4 mr-2" />
              Registrar Venda
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Venda Manual</DialogTitle>
              <DialogDescription>
                Registre uma venda atribuída a um criador
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Criador</Label>
                <Select
                  value={newSale.creatorId}
                  onValueChange={(v) => setNewSale(prev => ({ ...prev, creatorId: v }))}
                >
                  <SelectTrigger data-testid="select-creator">
                    <SelectValue placeholder="Selecione um criador" />
                  </SelectTrigger>
                  <SelectContent>
                    {acceptedCreators.map((app) => (
                      <SelectItem key={app.creatorId} value={String(app.creatorId)}>
                        {app.creator?.instagram || app.creator?.name || `Criador ${app.creatorId}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ID do Pedido</Label>
                  <Input
                    placeholder="Ex: #12345"
                    value={newSale.orderId}
                    onChange={(e) => setNewSale(prev => ({ ...prev, orderId: e.target.value }))}
                    data-testid="input-order-id"
                  />
                </div>
                <div>
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="99.90"
                    value={newSale.orderValue}
                    onChange={(e) => setNewSale(prev => ({ ...prev, orderValue: e.target.value }))}
                    data-testid="input-order-value"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Comissão (%)</Label>
                  <Select
                    value={newSale.commissionRateBps}
                    onValueChange={(v) => setNewSale(prev => ({ ...prev, commissionRateBps: v }))}
                  >
                    <SelectTrigger data-testid="select-commission-rate">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="500">5%</SelectItem>
                      <SelectItem value="1000">10%</SelectItem>
                      <SelectItem value="1500">15%</SelectItem>
                      <SelectItem value="2000">20%</SelectItem>
                      <SelectItem value="2500">25%</SelectItem>
                      <SelectItem value="3000">30%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cupom Usado (opcional)</Label>
                  <Input
                    placeholder="CODIGO"
                    value={newSale.couponCode}
                    onChange={(e) => setNewSale(prev => ({ ...prev, couponCode: e.target.value.toUpperCase() }))}
                    data-testid="input-coupon-code"
                  />
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => createSaleMutation.mutate(newSale)}
                disabled={!newSale.creatorId || !newSale.orderId || !newSale.orderValue || createSaleMutation.isPending}
                data-testid="button-confirm-sale"
              >
                {createSaleMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Registrar Venda
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Vendas</CardDescription>
            <CardTitle className="text-2xl" data-testid="text-total-sales">{sales.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Valor Total</CardDescription>
            <CardTitle className="text-2xl" data-testid="text-total-value">{formatCurrency(totalSales)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Comissões Pendentes</CardDescription>
            <CardTitle className="text-2xl text-orange-500" data-testid="text-pending-commissions">{formatCurrency(pendingCommissions)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Comissões Pagas</CardDescription>
            <CardTitle className="text-2xl text-green-500" data-testid="text-paid-commissions">{formatCurrency(paidCommissions)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="sales">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Vendas ({sales.length})
          </TabsTrigger>
          <TabsTrigger value="commissions">
            <DollarSign className="h-4 w-4 mr-2" />
            Comissões ({commissions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          {salesLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sales.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma venda registrada</h3>
                <p className="text-muted-foreground mb-4">
                  Registre vendas manualmente ou configure webhooks
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sales.map((sale) => (
                <Card key={sale.id} data-testid={`card-sale-${sale.id}`}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={sale.creator.avatar || undefined} />
                          <AvatarFallback>{sale.creator.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{sale.creator.instagram || sale.creator.name}</span>
                            <span className="text-muted-foreground">•</span>
                            <code className="text-sm bg-muted px-2 py-0.5 rounded">{sale.orderId}</code>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{format(new Date(sale.trackedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                            <span>•</span>
                            <span className="capitalize">{sale.platform}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{formatCurrency(sale.orderValue)}</div>
                        {sale.commission && (
                          <div className="text-sm text-muted-foreground">
                            Comissão: {formatCurrency(sale.commission)}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="commissions">
          {commissionsLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : commissions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma comissão gerada</h3>
                <p className="text-muted-foreground mb-4">
                  Comissões são geradas automaticamente ao registrar vendas
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {commissions.map((commission) => (
                <Card key={commission.id} data-testid={`card-commission-${commission.id}`}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={commission.creator.avatar || undefined} />
                          <AvatarFallback>{commission.creator.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{commission.creator.instagram || commission.creator.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(commission.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                            {commission.paidAt && ` • Pago em ${format(new Date(commission.paidAt), "dd/MM/yyyy", { locale: ptBR })}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-bold text-lg">{formatCurrency(commission.amount)}</div>
                          {getStatusBadge(commission.status)}
                        </div>
                        {commission.status !== 'paid' && (
                          <Select
                            value={commission.status}
                            onValueChange={(v: 'pending' | 'approved' | 'paid') => 
                              updateCommissionMutation.mutate({ id: commission.id, status: v })
                            }
                          >
                            <SelectTrigger className="w-32" data-testid={`select-commission-status-${commission.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="approved">Aprovada</SelectItem>
                              <SelectItem value="paid">Paga</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
