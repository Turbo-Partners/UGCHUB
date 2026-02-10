import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Ticket,
  DollarSign,
  TrendingUp,
  Plus,
  Copy,
  Check,
  X,
  Loader2,
  Users,
  ShoppingCart,
  BarChart3,
  Calendar,
  Search,
  Download,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Instagram,
  Heart,
  MessageCircle,
  Eye,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface CouponData {
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
  creatorName?: string;
  campaignTitle?: string;
}

interface SaleData {
  id: number;
  companyId: number;
  campaignId: number | null;
  creatorId: number;
  couponCode: string | null;
  orderId: string;
  orderValue: number;
  commission: number | null;
  platform: string;
  status: string;
  trackedAt: string;
  creator?: { id: number; name: string | null; email: string };
  campaign?: { id: number; title: string };
}

interface SalesAnalytics {
  totalRevenue: number;
  totalSales: number;
  totalCommission: number;
  avgOrderValue: number;
  byCreator: { creatorId: number; creatorName: string; revenue: number; sales: number }[];
  byCampaign: { campaignId: number; campaignTitle: string; revenue: number; sales: number }[];
  byDate: { date: string; revenue: number; sales: number }[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f', '#ff6b6b', '#4ecdc4'];

export default function BrandTracking() {
  const params = useParams<{ brandId: string }>();
  const brandId = parseInt(params.brandId || '0');
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [manualSaleOpen, setManualSaleOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: salesRaw = [], isLoading: salesLoading, refetch: refetchSales } = useQuery<(SaleData & { creator?: { id: number; name: string | null; email: string }; campaign?: { id: number; title: string } })[]>({
    queryKey: [`/api/brand/sales`],
    queryFn: async () => {
      const res = await fetch(`/api/brand/sales`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!brandId,
  });

  const sales: SaleData[] = salesRaw.map(s => ({
    ...s,
    creator: s.creator || undefined,
    campaign: s.campaign || undefined,
  }));

  const { data: coupons = [], isLoading: couponsLoading } = useQuery<CouponData[]>({
    queryKey: [`/api/brand/${brandId}/coupons`],
    queryFn: async () => {
      const res = await fetch(`/api/brand/${brandId}/coupons`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!brandId,
  });

  const { data: creators = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: [`/api/company/brand/${brandId}/community/members`],
    queryFn: async () => {
      const res = await fetch(`/api/company/brand/${brandId}/community/members`, { credentials: 'include' });
      if (!res.ok) return [];
      const data = await res.json();
      return data.map((m: any) => ({ id: m.creatorId, name: m.creatorName || 'Creator' }));
    },
    enabled: !!brandId && manualSaleOpen,
  });

  // Posts de creators que mencionaram a marca
  const { data: taggedPosts, isLoading: isLoadingPosts, refetch: refetchPosts } = useQuery<{
    posts: Array<{
      id: string;
      username: string;
      mediaType: string;
      mediaUrl: string;
      permalink: string;
      caption: string;
      timestamp: string;
      likes: number;
      comments: number;
      impressions: number | null;
      reach: number | null;
      engagement: number | null;
      saved: number | null;
      emv: number;
      sentiment: "positive" | "neutral" | "negative" | null;
      sentimentScore: number | null;
      sentimentAnalysis: string | null;
      isNew?: boolean;
    }>;
    totalCount: number;
    accountUsername: string;
  }>({
    queryKey: ["/api/instagram/tagged-posts"],
    queryFn: async () => {
      const res = await fetch("/api/instagram/tagged-posts", { credentials: "include" });
      if (!res.ok) return { posts: [], totalCount: 0, accountUsername: "" };
      return res.json();
    },
    enabled: activeTab === "posts",
  });

  const getCreatorName = (sale: SaleData) => sale.creator?.name || sale.creator?.email || `Creator ${sale.creatorId}`;
  const getCampaignTitle = (sale: SaleData) => sale.campaign?.title || `Campanha ${sale.campaignId}`;

  const analytics: SalesAnalytics = {
    totalRevenue: sales.reduce((sum, s) => sum + s.orderValue, 0),
    totalSales: sales.length,
    totalCommission: sales.reduce((sum, s) => sum + (s.commission || 0), 0),
    avgOrderValue: sales.length > 0 ? sales.reduce((sum, s) => sum + s.orderValue, 0) / sales.length : 0,
    byCreator: Object.values(
      sales.reduce((acc: Record<number, any>, s) => {
        if (!acc[s.creatorId]) {
          acc[s.creatorId] = { creatorId: s.creatorId, creatorName: getCreatorName(s), revenue: 0, sales: 0 };
        }
        acc[s.creatorId].revenue += s.orderValue;
        acc[s.creatorId].sales += 1;
        return acc;
      }, {})
    ),
    byCampaign: Object.values(
      sales.filter(s => s.campaignId).reduce((acc: Record<number, any>, s) => {
        if (!acc[s.campaignId!]) {
          acc[s.campaignId!] = { campaignId: s.campaignId, campaignTitle: getCampaignTitle(s), revenue: 0, sales: 0 };
        }
        acc[s.campaignId!].revenue += s.orderValue;
        acc[s.campaignId!].sales += 1;
        return acc;
      }, {})
    ),
    byDate: Object.values(
      sales.reduce((acc: Record<string, any>, s) => {
        const date = format(new Date(s.trackedAt), 'dd/MM');
        if (!acc[date]) acc[date] = { date, revenue: 0, sales: 0 };
        acc[date].revenue += s.orderValue;
        acc[date].sales += 1;
        return acc;
      }, {})
    ),
  };

  const createManualSaleMutation = useMutation({
    mutationFn: async (data: { creatorId: number; revenue: number; couponCode?: string; campaignId?: number }) => {
      const res = await apiRequest('POST', '/api/brand/sales/manual', data);
      return res.json();
    },
    onSuccess: () => {
      toast.success('Venda registrada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['/api/brand/sales'] });
      setManualSaleOpen(false);
    },
    onError: () => toast.error('Erro ao registrar venda'),
  });

  const toggleCouponMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest('PATCH', `/api/coupons/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      toast.success('Cupom atualizado!');
      queryClient.invalidateQueries({ queryKey: [`/api/brand/${brandId}/coupons`] });
    },
    onError: () => toast.error('Erro ao atualizar cupom'),
  });

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Código copiado!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
  };

  const filteredSales = sales.filter(s => 
    !searchQuery || 
    s.couponCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getCreatorName(s).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="heading-brand-tracking">
            Cupons & Vendas
          </h1>
          <p className="text-gray-500 mt-1">
            Gerencie cupons e acompanhe vendas atribuídas aos creators
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => refetchSales()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Dialog open={manualSaleOpen} onOpenChange={setManualSaleOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-manual-sale">
                <Plus className="h-4 w-4 mr-2" />
                Registrar Venda
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Venda Manual</DialogTitle>
                <DialogDescription>
                  Registre uma venda atribuída a um creator
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createManualSaleMutation.mutate({
                  creatorId: parseInt(formData.get('creatorId') as string),
                  revenue: parseFloat(formData.get('revenue') as string),
                  couponCode: (formData.get('couponCode') as string) || undefined,
                });
              }}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="creatorId">Creator *</Label>
                    <Select name="creatorId" required>
                      <SelectTrigger data-testid="select-creator">
                        <SelectValue placeholder="Selecione o creator" />
                      </SelectTrigger>
                      <SelectContent>
                        {creators.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="revenue">Valor da Venda (R$) *</Label>
                    <Input
                      id="revenue"
                      name="revenue"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="100.00"
                      required
                      data-testid="input-revenue"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="couponCode">Código do Cupom</Label>
                    <Input
                      id="couponCode"
                      name="couponCode"
                      placeholder="CREATOR10"
                      data-testid="input-coupon-code"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setManualSaleOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createManualSaleMutation.isPending} data-testid="button-submit-sale">
                    {createManualSaleMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Registrar
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="posts" data-testid="tab-posts">
            <Instagram className="h-4 w-4 mr-2" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="coupons" data-testid="tab-coupons">
            <Ticket className="h-4 w-4 mr-2" />
            Cupons
          </TabsTrigger>
          <TabsTrigger value="sales" data-testid="tab-sales">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Vendas
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                    <h3 className="text-2xl font-bold" data-testid="metric-total-revenue">
                      {formatCurrency(analytics.totalRevenue)}
                    </h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Vendas Totais</p>
                    <h3 className="text-2xl font-bold" data-testid="metric-total-sales">
                      {analytics.totalSales}
                    </h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Comissões</p>
                    <h3 className="text-2xl font-bold" data-testid="metric-total-commission">
                      {formatCurrency(analytics.totalCommission)}
                    </h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
                    <h3 className="text-2xl font-bold" data-testid="metric-avg-order">
                      {formatCurrency(analytics.avgOrderValue)}
                    </h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {analytics.byDate.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Vendas por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.byDate}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={(v) => formatCurrency(v)} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Creators</CardTitle>
                <CardDescription>Por receita gerada</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.byCreator.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma venda registrada</p>
                ) : (
                  <div className="space-y-4">
                    {analytics.byCreator.slice(0, 5).map((c, i) => (
                      <div key={c.creatorId} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                          <div>
                            <p className="font-medium">{c.creatorName}</p>
                            <p className="text-sm text-muted-foreground">{c.sales} vendas</p>
                          </div>
                        </div>
                        <p className="font-semibold text-green-600">{formatCurrency(c.revenue)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cupons Ativos</CardTitle>
                <CardDescription>Cupons em uso</CardDescription>
              </CardHeader>
              <CardContent>
                {coupons.filter(c => c.isActive).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum cupom ativo</p>
                ) : (
                  <div className="space-y-3">
                    {coupons.filter(c => c.isActive).slice(0, 5).map((coupon) => (
                      <div key={coupon.id} className="flex items-center justify-between p-2 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Ticket className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-mono font-medium">{coupon.code}</p>
                            <p className="text-xs text-muted-foreground">
                              {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : formatCurrency(coupon.discountValue)} off
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">{coupon.currentUses} usos</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="coupons" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Cupons de Desconto</CardTitle>
                  <CardDescription>Gerencie cupons atribuídos aos creators</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {couponsLoading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : coupons.length === 0 ? (
                <div className="text-center py-12">
                  <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum cupom criado ainda</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Cupons são criados automaticamente nas campanhas
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {coupons.map((coupon) => (
                    <div key={coupon.id} className="flex items-center justify-between p-4 rounded-lg border" data-testid={`coupon-row-${coupon.id}`}>
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${coupon.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <Ticket className={`h-5 w-5 ${coupon.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-mono font-semibold">{coupon.code}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => copyToClipboard(coupon.code)}
                            >
                              {copiedCode === coupon.code ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : formatCurrency(coupon.discountValue)} de desconto
                            {coupon.campaignTitle && ` • ${coupon.campaignTitle}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">{coupon.currentUses} usos</p>
                          {coupon.maxUses && (
                            <p className="text-xs text-muted-foreground">de {coupon.maxUses} máx</p>
                          )}
                        </div>
                        <Badge variant={coupon.isActive ? "default" : "secondary"}>
                          {coupon.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleCouponMutation.mutate({ id: coupon.id, isActive: !coupon.isActive })}
                          disabled={toggleCouponMutation.isPending}
                        >
                          {coupon.isActive ? 'Desativar' : 'Ativar'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Histórico de Vendas</CardTitle>
                  <CardDescription>Vendas atribuídas aos creators</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por cupom, pedido..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-sales"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {salesLoading ? (
                <div className="space-y-4">
                  {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : filteredSales.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma venda registrada</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Registre vendas manualmente ou conecte sua loja
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between p-4 rounded-lg border" data-testid={`sale-row-${sale.id}`}>
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <ShoppingCart className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Pedido #{sale.orderId}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{getCreatorName(sale)}</span>
                            {sale.couponCode && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{sale.couponCode}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="font-semibold text-green-600">{formatCurrency(sale.orderValue)}</p>
                          {sale.commission && (
                            <p className="text-xs text-muted-foreground">Comissão: {formatCurrency(sale.commission)}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge variant={sale.status === 'confirmed' ? 'default' : sale.status === 'pending' ? 'secondary' : 'outline'}>
                            {sale.status === 'confirmed' ? 'Confirmada' : sale.status === 'pending' ? 'Pendente' : sale.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(sale.trackedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                        <Badge variant="outline" className="capitalize">{sale.platform}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Receita por Creator</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.byCreator.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">Sem dados para exibir</p>
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.byCreator.slice(0, 10)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                        <YAxis dataKey="creatorName" type="category" width={120} />
                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                        <Bar dataKey="revenue" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Receita por Campanha</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.byCampaign.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">Sem dados para exibir</p>
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.byCampaign}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          dataKey="revenue"
                          nameKey="campaignTitle"
                          label={({ campaignTitle, percent }) => `${campaignTitle.substring(0, 15)}${campaignTitle.length > 15 ? '...' : ''} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {analytics.byCampaign.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detalhamento por Creator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Creator</th>
                      <th className="text-right py-3 px-4 font-medium">Vendas</th>
                      <th className="text-right py-3 px-4 font-medium">Receita</th>
                      <th className="text-right py-3 px-4 font-medium">Ticket Médio</th>
                      <th className="text-right py-3 px-4 font-medium">% do Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.byCreator.map((c) => (
                      <tr key={c.creatorId} className="border-b last:border-0">
                        <td className="py-3 px-4">{c.creatorName}</td>
                        <td className="text-right py-3 px-4">{c.sales}</td>
                        <td className="text-right py-3 px-4 font-medium text-green-600">{formatCurrency(c.revenue)}</td>
                        <td className="text-right py-3 px-4">{formatCurrency(c.revenue / c.sales)}</td>
                        <td className="text-right py-3 px-4">
                          {analytics.totalRevenue > 0 ? ((c.revenue / analytics.totalRevenue) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posts" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Instagram className="h-5 w-5 text-pink-500" />
                  Posts de Creators
                </CardTitle>
                <CardDescription>
                  Posts onde sua marca foi @mencionada por creators
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchPosts()}
                disabled={isLoadingPosts}
                data-testid="button-refresh-posts"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingPosts ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingPosts ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : taggedPosts?.posts && taggedPosts.posts.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span>{taggedPosts.totalCount} posts encontrados</span>
                    <span>Conta: @{taggedPosts.accountUsername}</span>
                  </div>
                  <div className="grid gap-4">
                    {taggedPosts.posts.map((post) => (
                      <Card key={post.id} className="overflow-hidden" data-testid={`card-post-${post.id}`}>
                        <div className="flex flex-col md:flex-row">
                          {post.mediaUrl && (
                            <div className="w-full md:w-48 h-48 flex-shrink-0">
                              {post.mediaType === "VIDEO" ? (
                                <video
                                  src={post.mediaUrl}
                                  className="w-full h-full object-cover"
                                  controls={false}
                                />
                              ) : (
                                <img
                                  src={post.mediaUrl}
                                  alt="Post"
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                          )}
                          <div className="flex-1 p-4">
                            <div className="flex items-center justify-between mb-2">
                              <a
                                href={post.permalink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm font-medium hover:underline"
                                data-testid={`link-post-${post.id}`}
                              >
                                @{post.username}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              <span className="text-xs text-muted-foreground" data-testid={`text-date-${post.id}`}>
                                {new Date(post.timestamp).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            {post.caption && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                {post.caption}
                              </p>
                            )}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                              <div className="bg-muted/50 rounded-lg p-2" data-testid={`stat-likes-${post.id}`}>
                                <Heart className="h-4 w-4 mx-auto mb-1 text-red-500" />
                                <div className="text-sm font-medium">{post.likes.toLocaleString()}</div>
                                <div className="text-xs text-muted-foreground">Curtidas</div>
                              </div>
                              <div className="bg-muted/50 rounded-lg p-2" data-testid={`stat-comments-${post.id}`}>
                                <MessageCircle className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                                <div className="text-sm font-medium">{post.comments.toLocaleString()}</div>
                                <div className="text-xs text-muted-foreground">Comentários</div>
                              </div>
                              {post.impressions && (
                                <div className="bg-muted/50 rounded-lg p-2" data-testid={`stat-impressions-${post.id}`}>
                                  <Eye className="h-4 w-4 mx-auto mb-1 text-purple-500" />
                                  <div className="text-sm font-medium">{post.impressions.toLocaleString()}</div>
                                  <div className="text-xs text-muted-foreground">Impressões</div>
                                </div>
                              )}
                              {post.reach && (
                                <div className="bg-muted/50 rounded-lg p-2" data-testid={`stat-reach-${post.id}`}>
                                  <Users className="h-4 w-4 mx-auto mb-1 text-green-500" />
                                  <div className="text-sm font-medium">{post.reach.toLocaleString()}</div>
                                  <div className="text-xs text-muted-foreground">Alcance</div>
                                </div>
                              )}
                              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-2 border border-green-200 dark:border-green-800" data-testid={`stat-emv-${post.id}`}>
                                <DollarSign className="h-4 w-4 mx-auto mb-1 text-green-600" />
                                <div className="text-sm font-medium text-green-700 dark:text-green-400">
                                  R$ {post.emv.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                                <div className="text-xs text-green-600/70">EMV</div>
                              </div>
                            </div>
                            {post.sentiment && (
                              <div 
                                className={`mt-3 p-3 rounded-lg border ${
                                  post.sentiment === "positive" 
                                    ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800" 
                                    : post.sentiment === "negative"
                                    ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                                    : "bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-700"
                                }`}
                                data-testid={`sentiment-${post.id}`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-sm font-medium ${
                                    post.sentiment === "positive" 
                                      ? "text-green-700 dark:text-green-400"
                                      : post.sentiment === "negative"
                                      ? "text-red-700 dark:text-red-400"
                                      : "text-gray-700 dark:text-gray-400"
                                  }`}>
                                    {post.sentiment === "positive" ? "😊 Sentimento Positivo" 
                                      : post.sentiment === "negative" ? "😔 Sentimento Negativo" 
                                      : "😐 Sentimento Neutro"}
                                  </span>
                                  {post.sentimentScore !== null && (
                                    <Badge variant="secondary" className="text-xs">
                                      {post.sentimentScore > 0 ? "+" : ""}{post.sentimentScore}
                                    </Badge>
                                  )}
                                </div>
                                {post.sentimentAnalysis && (
                                  <p className="text-xs text-muted-foreground">{post.sentimentAnalysis}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Instagram className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="font-medium mb-2">Nenhum post encontrado</h3>
                  <p className="text-sm text-muted-foreground">
                    Quando creators mencionarem sua marca, os posts aparecerão aqui.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
