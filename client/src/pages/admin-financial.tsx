import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardHeading, CardToolbar } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge-2";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard, BarChart3, PieChart, ArrowUpRight, ArrowDownRight, ShoppingCart, Users, Calendar, Download, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { StatsCard, StatsGrid } from "@/components/ui/stats-card";
import { cn } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FinancialStats {
  totalSales: number;
  totalCommissions: number;
  pendingCommissions: number;
  paidCommissions: number;
  totalCouponsUsed: number;
  avgOrderValue: number;
  salesGrowth: number;
  commissionsGrowth: number;
}

interface SalesData {
  date: string;
  sales: number;
  commissions: number;
}

interface TopCreator {
  id: number;
  name: string;
  avatar: string | null;
  totalSales: number;
  totalCommissions: number;
  ordersCount: number;
}

interface CommissionEntry {
  id: number;
  creatorId: number;
  creatorName: string;
  creatorAvatar: string | null;
  campaignTitle: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid';
  createdAt: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

export function AdminFinancialContent() {
  const [period, setPeriod] = useState<string>("30");
  const [commissionStatus, setCommissionStatus] = useState<string>("all");

  const { data: stats } = useQuery<FinancialStats>({
    queryKey: ['/api/admin/financial/stats', { period }],
  });

  const { data: salesData = [] } = useQuery<SalesData[]>({
    queryKey: ['/api/admin/financial/sales-chart', { period }],
  });

  const { data: topCreators = [] } = useQuery<TopCreator[]>({
    queryKey: ['/api/admin/financial/top-creators', { period }],
  });

  const { data: commissions = [] } = useQuery<CommissionEntry[]>({
    queryKey: ['/api/admin/financial/commissions', { status: commissionStatus }],
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border shadow-xl rounded-lg p-3 pointer-events-none">
          <p className="text-sm font-medium text-foreground mb-1">
            {format(new Date(label), 'dd MMM', { locale: ptBR })}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }} 
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium text-foreground">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const pieData = [
    { name: 'Pendentes', value: stats?.pendingCommissions || 0 },
    { name: 'Aprovadas', value: (stats?.totalCommissions || 0) - (stats?.pendingCommissions || 0) - (stats?.paidCommissions || 0) },
    { name: 'Pagas', value: stats?.paidCommissions || 0 },
  ].filter(d => d.value > 0);

  return (
    <motion.div 
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground" data-testid="heading-admin-financial">
            Financeiro
          </h1>
          <p className="text-muted-foreground mt-1">Métricas financeiras e comissões</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]" data-testid="select-period">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="365">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      <motion.div variants={itemVariants}>
        <StatsGrid columns={4}>
          <StatsCard
            title="Total em Vendas"
            value={formatCurrency(stats?.totalSales || 0)}
            change={stats?.salesGrowth || 0}
            trend={stats?.salesGrowth && stats.salesGrowth >= 0 ? 'up' : 'down'}
            icon={<ShoppingCart className="h-5 w-5" />}
            className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20"
            data-testid="stat-total-sales"
          />
          <StatsCard
            title="Total Comissões"
            value={formatCurrency(stats?.totalCommissions || 0)}
            change={stats?.commissionsGrowth || 0}
            trend={stats?.commissionsGrowth && stats.commissionsGrowth >= 0 ? 'up' : 'down'}
            icon={<Wallet className="h-5 w-5" />}
            data-testid="stat-total-commissions"
          />
          <StatsCard
            title="Comissões Pendentes"
            value={formatCurrency(stats?.pendingCommissions || 0)}
            icon={<CreditCard className="h-5 w-5" />}
            className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20"
            data-testid="stat-pending-commissions"
          />
          <StatsCard
            title="Ticket Médio"
            value={formatCurrency(stats?.avgOrderValue || 0)}
            icon={<DollarSign className="h-5 w-5" />}
            data-testid="stat-avg-order"
          />
        </StatsGrid>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" data-testid="card-sales-chart">
          <CardHeader className="border-b border-border">
            <CardHeading>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Vendas vs Comissões</CardTitle>
                  <p className="text-sm text-muted-foreground">Evolução no período</p>
                </div>
              </div>
            </CardHeading>
          </CardHeader>
          <CardContent className="pt-6">
            {salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="gradientSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gradientCommissions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: ptBR })}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `R$${value.toFixed(0)}`}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    fill="url(#gradientSales)"
                    name="Vendas"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="commissions" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fill="url(#gradientCommissions)"
                    name="Comissões"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum dado disponível</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-commissions-pie">
          <CardHeader className="border-b border-border">
            <CardHeading>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <PieChart className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Status Comissões</CardTitle>
                  <p className="text-sm text-muted-foreground">Distribuição</p>
                </div>
              </div>
            </CardHeading>
          </CardHeader>
          <CardContent className="pt-6">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPie>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <PieChart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Sem dados de comissões</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-top-creators">
          <CardHeader className="border-b border-border">
            <CardHeading>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Top Creators</CardTitle>
                  <p className="text-sm text-muted-foreground">Por volume de vendas</p>
                </div>
              </div>
            </CardHeading>
          </CardHeader>
          <CardContent className="pt-6">
            {topCreators.length > 0 ? (
              <div className="space-y-4">
                {topCreators.slice(0, 5).map((creator, index) => (
                  <div 
                    key={creator.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    data-testid={`top-creator-${creator.id}`}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                    <Avatar className="h-10 w-10">
                      {creator.avatar && <AvatarImage src={creator.avatar} />}
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {creator.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{creator.name}</p>
                      <p className="text-sm text-muted-foreground">{creator.ordersCount} pedidos</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{formatCurrency(creator.totalSales)}</p>
                      <p className="text-sm text-green-600 dark:text-green-400">{formatCurrency(creator.totalCommissions)} comissão</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum creator com vendas</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-commissions-list">
          <CardHeader className="border-b border-border">
            <CardHeading>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Comissões Recentes</CardTitle>
                  <p className="text-sm text-muted-foreground">Últimas transações</p>
                </div>
              </div>
            </CardHeading>
            <CardToolbar>
              <Select value={commissionStatus} onValueChange={setCommissionStatus}>
                <SelectTrigger className="w-[140px]" data-testid="select-commission-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="approved">Aprovadas</SelectItem>
                  <SelectItem value="paid">Pagas</SelectItem>
                </SelectContent>
              </Select>
            </CardToolbar>
          </CardHeader>
          <CardContent className="pt-6">
            {commissions.length > 0 ? (
              <div className="space-y-3">
                {commissions.slice(0, 6).map((commission) => (
                  <div 
                    key={commission.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    data-testid={`commission-${commission.id}`}
                  >
                    <Avatar className="h-8 w-8">
                      {commission.creatorAvatar && <AvatarImage src={commission.creatorAvatar} />}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {commission.creatorName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{commission.creatorName}</p>
                      <p className="text-xs text-muted-foreground truncate">{commission.campaignTitle}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">{formatCurrency(commission.amount)}</p>
                      <Badge 
                        variant={
                          commission.status === 'paid' ? 'primary' : 
                          commission.status === 'approved' ? 'secondary' : 'outline'
                        }
                        appearance="light"
                        className="text-xs"
                      >
                        {commission.status === 'pending' ? 'Pendente' : 
                         commission.status === 'approved' ? 'Aprovada' : 'Paga'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma comissão encontrada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card data-testid="card-coupons-usage">
          <CardHeader className="border-b border-border">
            <CardHeading>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Resumo de Cupons</CardTitle>
                  <p className="text-sm text-muted-foreground">Uso de cupons no período</p>
                </div>
              </div>
            </CardHeading>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/20">
                <p className="text-sm text-violet-600 dark:text-violet-400 mb-2">Cupons Utilizados</p>
                <p className="text-3xl font-bold text-violet-600 dark:text-violet-400">{stats?.totalCouponsUsed || 0}</p>
              </div>
              <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20">
                <p className="text-sm text-green-600 dark:text-green-400 mb-2">Vendas com Cupom</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{formatCurrency(stats?.totalSales || 0)}</p>
              </div>
              <div className="p-6 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20">
                <p className="text-sm text-amber-600 dark:text-amber-400 mb-2">Taxa de Conversão</p>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {stats?.totalCouponsUsed && stats.totalSales ? 
                    `${((stats.totalCommissions / stats.totalSales) * 100).toFixed(1)}%` : 
                    '0%'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
