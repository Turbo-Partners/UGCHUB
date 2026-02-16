import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardToolbar, CardHeading } from "@/components/ui/card";
import { Users, Building2, Megaphone, FileText, AlertCircle, TrendingUp, Activity, Zap, Clock, MoreHorizontal, DollarSign, Wallet, CreditCard, ShoppingCart, Trophy, Target, PieChart, BarChart3, CheckCircle, XCircle, AlertTriangle, ArrowRight, Star } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, BarChart, Bar, Cell, PieChart as RechartsPieChart, Pie, Legend } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StatsCard, StatsGrid } from "@/components/ui/stats-card";
import { MiniChart } from "@/components/ui/mini-chart";
import { Badge } from "@/components/ui/badge-2";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn, getAvatarUrl } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

interface AdminStats {
  totalUsers: number;
  totalCreators: number;
  totalCompanies: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalApplications: number;
  pendingApplications: number;
  openProblemReports: number;
}

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

interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalApplications: number;
  acceptedApplications: number;
  avgBudget: number;
  totalBudget: number;
}

interface GrowthData {
  date: string;
  creators: number;
  companies: number;
}

interface Activity {
  type: string;
  description: string;
  createdAt: string;
  userId?: number;
  userName?: string;
}

interface TopCreator {
  id: number;
  name: string;
  avatar: string | null;
  totalSales: number;
  totalCommissions: number;
  ordersCount: number;
}

interface TopCampaign {
  id: number;
  title: string;
  companyId: number;
  companyName: string;
  companyLogo: string | null;
  status: string;
  participants: number;
  totalApplicants: number;
  totalViews: number;
  totalEngagement: number;
  totalSales: number;
  trackedPosts: number;
  engagementScore: number;
}

interface TopCompany {
  id: number;
  name: string;
  logo: string | null;
  slug: string | null;
  campaigns: number;
  activeCampaigns: number;
  totalParticipants: number;
  totalApplicants: number;
  totalViews: number;
  totalEngagement: number;
  totalSales: number;
  trackedPosts: number;
  engagementScore: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

export function AdminDashboardContent() {
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
  });

  const { data: growth } = useQuery<GrowthData[]>({
    queryKey: ['/api/admin/growth'],
  });

  const { data: activity } = useQuery<Activity[]>({
    queryKey: ['/api/admin/activity'],
  });

  const { data: financialStats } = useQuery<FinancialStats>({
    queryKey: ['/api/admin/financial/stats'],
  });

  const { data: campaignStats } = useQuery<CampaignStats>({
    queryKey: ['/api/admin/campaigns/stats'],
  });

  const { data: topCreators } = useQuery<TopCreator[]>({
    queryKey: ['/api/admin/financial/top-creators'],
  });

  const { data: topCampaigns } = useQuery<TopCampaign[]>({
    queryKey: ['/api/admin/campaigns/top-engagement'],
  });

  const { data: topCompanies } = useQuery<TopCompany[]>({
    queryKey: ['/api/admin/companies/top-engagement'],
  });

  const weeklyData = [
    { label: "S", value: 65 },
    { label: "T", value: 85 },
    { label: "Q", value: 45 },
    { label: "Q", value: 95 },
    { label: "S", value: 70 },
    { label: "S", value: 55 },
    { label: "D", value: 80 },
  ];

  const campaignStatusData = [
    { name: 'Ativas', value: campaignStats?.activeCampaigns || 0, color: '#10b981' },
    { name: 'Finalizadas', value: (campaignStats?.totalCampaigns || 0) - (campaignStats?.activeCampaigns || 0), color: '#6b7280' },
  ];

  const applicationFunnel = [
    { name: 'Candidaturas', value: campaignStats?.totalApplications || stats?.totalApplications || 0, color: '#8b5cf6' },
    { name: 'Aceitas', value: campaignStats?.acceptedApplications || 0, color: '#10b981' },
    { name: 'Pendentes', value: stats?.pendingApplications || 0, color: '#f59e0b' },
  ];

  const userDistribution = [
    { name: 'Criadores', value: stats?.totalCreators || 0, color: '#8b5cf6' },
    { name: 'Empresas', value: stats?.totalCompanies || 0, color: '#10b981' },
  ];

  const conversionRate = campaignStats?.totalApplications && campaignStats?.acceptedApplications 
    ? ((campaignStats.acceptedApplications / campaignStats.totalApplications) * 100).toFixed(1) 
    : '0';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
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
              <span className="font-medium text-foreground">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border shadow-xl rounded-lg p-3 pointer-events-none">
          <div className="flex items-center gap-2 text-sm">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: payload[0].payload.color }} 
            />
            <span className="text-foreground font-medium">{payload[0].name}:</span>
            <span className="text-foreground">{payload[0].value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants}>
        <h1 className="font-heading text-3xl font-bold text-foreground" data-testid="heading-admin-dashboard">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">Visão geral completa da plataforma</p>
      </motion.div>

      {/* Main Stats */}
      <motion.div variants={itemVariants}>
        <StatsGrid columns={4}>
          <StatsCard
            title="Total de Usuários"
            value={stats?.totalUsers || 0}
            change={12.5}
            icon={<Users className="h-5 w-5" />}
            trend="up"
            showMenu
            data-testid="stat-total-users"
          />
          <StatsCard
            title="Creators"
            value={stats?.totalCreators || 0}
            change={8.2}
            icon={<Users className="h-5 w-5" />}
            trend="up"
            showMenu
            data-testid="stat-creators"
          />
          <StatsCard
            title="Empresas"
            value={stats?.totalCompanies || 0}
            change={15.3}
            icon={<Building2 className="h-5 w-5" />}
            trend="up"
            showMenu
            data-testid="stat-companies"
          />
          <StatsCard
            title="Campanhas Ativas"
            value={stats?.activeCampaigns || 0}
            change={-2.1}
            icon={<Megaphone className="h-5 w-5" />}
            trend="down"
            showMenu
            data-testid="stat-campaigns"
          />
        </StatsGrid>
      </motion.div>

      {/* Financial Stats */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-500" />
          Métricas Financeiras
        </h2>
        <StatsGrid columns={4}>
          <StatsCard
            title="Vendas Totais"
            value={formatCurrency(financialStats?.totalSales || 0)}
            icon={<ShoppingCart className="h-5 w-5" />}
            className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20"
            data-testid="stat-total-sales"
          />
          <StatsCard
            title="Comissões Totais"
            value={formatCurrency(financialStats?.totalCommissions || 0)}
            icon={<Wallet className="h-5 w-5" />}
            className="bg-gradient-to-br from-purple-500/10 to-violet-500/5 border-purple-500/20"
            data-testid="stat-total-commissions"
          />
          <StatsCard
            title="Comissões Pendentes"
            value={formatCurrency(financialStats?.pendingCommissions || 0)}
            icon={<Clock className="h-5 w-5" />}
            className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20"
            data-testid="stat-pending-commissions"
          />
          <StatsCard
            title="Ticket Médio"
            value={formatCurrency(financialStats?.avgOrderValue || 0)}
            icon={<CreditCard className="h-5 w-5" />}
            className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/20"
            data-testid="stat-avg-order"
          />
        </StatsGrid>
      </motion.div>

      {/* Operations Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Candidaturas Pendentes"
          value={stats?.pendingApplications || 0}
          icon={<FileText className="h-5 w-5" />}
          subtitle="Aguardando análise"
          className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20"
          data-testid="stat-pending"
        />
        <StatsCard
          title="Problemas Abertos"
          value={stats?.openProblemReports || 0}
          icon={<AlertCircle className="h-5 w-5" />}
          subtitle="Requer atenção"
          className="bg-gradient-to-br from-red-500/10 to-pink-500/5 border-red-500/20"
          data-testid="stat-problems"
        />
        <StatsCard
          title="Taxa de Conversão"
          value={`${conversionRate}%`}
          icon={<Target className="h-5 w-5" />}
          subtitle="Candidaturas aceitas"
          className="bg-gradient-to-br from-emerald-500/10 to-green-500/5 border-emerald-500/20"
          data-testid="stat-conversion"
        />
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <Card className="overflow-hidden" data-testid="card-growth-chart">
          <CardHeader className="border-b border-border">
            <CardHeading>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Crescimento de Usuários</CardTitle>
                  <p className="text-sm text-muted-foreground">Últimos 30 dias</p>
                </div>
              </div>
            </CardHeading>
          </CardHeader>
          <CardContent className="pt-6">
            {growth && growth.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={growth}>
                  <defs>
                    <linearGradient id="gradientCreators" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gradientCompanies" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
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
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="creators" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2} 
                    fill="url(#gradientCreators)"
                    name="Creators"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="companies" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fill="url(#gradientCompanies)"
                    name="Empresas"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Carregando dados de crescimento...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Distribution Pie Chart */}
        <Card className="overflow-hidden" data-testid="card-user-distribution">
          <CardHeader className="border-b border-border">
            <CardHeading>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-violet-500/10">
                  <PieChart className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <CardTitle>Distribuição de Usuários</CardTitle>
                  <p className="text-sm text-muted-foreground">Por tipo de conta</p>
                </div>
              </div>
            </CardHeading>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={userDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {userDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {userDistribution.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm text-muted-foreground">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Application Funnel and Campaign Status */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Funnel */}
        <Card className="overflow-hidden" data-testid="card-funnel">
          <CardHeader className="border-b border-border">
            <CardHeading>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle>Funil de Candidaturas</CardTitle>
                  <p className="text-sm text-muted-foreground">Status das aplicações</p>
                </div>
              </div>
            </CardHeading>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {applicationFunnel.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-foreground font-medium">{item.name}</span>
                  </div>
                  <span className="text-muted-foreground">{item.value}</span>
                </div>
                <Progress 
                  value={applicationFunnel[0].value ? (item.value / applicationFunnel[0].value) * 100 : 0} 
                  className="h-2"
                  style={{ '--progress-color': item.color } as any}
                />
              </div>
            ))}
            <div className="pt-4 border-t border-border mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Taxa de Aprovação</span>
                <span className="text-foreground font-semibold">{conversionRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Campaign Status Distribution */}
        <Card className="overflow-hidden" data-testid="card-campaign-status">
          <CardHeader className="border-b border-border">
            <CardHeading>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Megaphone className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <CardTitle>Status das Campanhas</CardTitle>
                  <p className="text-sm text-muted-foreground">Distribuição por status</p>
                </div>
              </div>
            </CardHeading>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={campaignStatusData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 14, fill: 'hsl(var(--foreground))' }}
                  width={100}
                />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {campaignStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{campaignStats?.totalCampaigns || 0}</p>
                <p className="text-sm text-muted-foreground">Total de Campanhas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{formatCurrency(campaignStats?.avgBudget || 0)}</p>
                <p className="text-sm text-muted-foreground">Orçamento Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top Creators and Activity */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Creators */}
        <Card className="overflow-hidden" data-testid="card-top-creators">
          <CardHeader className="border-b border-border">
            <CardHeading>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <CardTitle>Top Creators</CardTitle>
                  <p className="text-sm text-muted-foreground">Por volume de vendas</p>
                </div>
              </div>
            </CardHeading>
          </CardHeader>
          <CardContent className="pt-4">
            {topCreators && topCreators.length > 0 ? (
              <div className="space-y-3">
                {topCreators.slice(0, 5).map((creator, index) => (
                  <motion.div
                    key={creator.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    data-testid={`top-creator-${creator.id}`}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      index === 0 ? "bg-yellow-500 text-yellow-950" :
                      index === 1 ? "bg-gray-400 text-gray-950" :
                      index === 2 ? "bg-amber-700 text-amber-100" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {index + 1}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={getAvatarUrl(creator.avatar, String(creator.id))} />
                      <AvatarFallback>{creator.name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{creator.name}</p>
                      <p className="text-xs text-muted-foreground">{creator.ordersCount} vendas</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(creator.totalSales)}</p>
                      <p className="text-xs text-green-500">{formatCurrency(creator.totalCommissions)} comissão</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">Nenhum dado de vendas disponível</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Activity */}
        <MiniChart 
          data={weeklyData} 
          title="Atividade Semanal"
          className="h-full"
        />
      </motion.div>

      {/* Top Campaigns by Engagement */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-orange-500" />
          Campanhas com Mais Engajamento
        </h2>
        <Card data-testid="card-top-campaigns-engagement">
          <CardContent className="pt-6">
            {topCampaigns && topCampaigns.length > 0 ? (
              <div className="space-y-3">
                {topCampaigns.slice(0, 5).map((campaign, index) => (
                  <motion.div
                    key={campaign.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    data-testid={`top-campaign-${campaign.id}`}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                      index === 0 ? "bg-orange-500 text-white" :
                      index === 1 ? "bg-orange-400 text-white" :
                      index === 2 ? "bg-orange-300 text-orange-900" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{campaign.title}</p>
                      <p className="text-xs text-muted-foreground">{campaign.companyName}</p>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-center shrink-0">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{campaign.participants}</p>
                        <p className="text-xs text-muted-foreground">Participantes</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{campaign.trackedPosts}</p>
                        <p className="text-xs text-muted-foreground">Posts</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{(campaign.totalViews / 1000).toFixed(1)}k</p>
                        <p className="text-xs text-muted-foreground">Views</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{campaign.totalEngagement.toLocaleString('pt-BR')}</p>
                        <p className="text-xs text-muted-foreground">Engajamento</p>
                      </div>
                    </div>
                    <Badge variant={campaign.status === 'open' ? 'secondary' : 'outline'} className="shrink-0">
                      {campaign.status === 'open' ? 'Ativa' : 'Finalizada'}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Megaphone className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">Nenhuma campanha com dados de engajamento</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Top Companies by Engagement */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-emerald-500" />
          Empresas com Mais Engajamento
        </h2>
        <Card data-testid="card-top-companies-engagement">
          <CardContent className="pt-6">
            {topCompanies && topCompanies.length > 0 ? (
              <div className="space-y-3">
                {topCompanies.slice(0, 5).map((company, index) => (
                  <motion.div
                    key={company.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    data-testid={`top-company-${company.id}`}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                      index === 0 ? "bg-emerald-500 text-white" :
                      index === 1 ? "bg-emerald-400 text-white" :
                      index === 2 ? "bg-emerald-300 text-emerald-900" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {index + 1}
                    </div>
                    {company.logo ? (
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={company.logo} />
                        <AvatarFallback>{company.name?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold shrink-0">
                        {company.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{company.name}</p>
                      <p className="text-xs text-muted-foreground">{company.campaigns} campanhas ({company.activeCampaigns} ativas)</p>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-center shrink-0">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{company.totalParticipants}</p>
                        <p className="text-xs text-muted-foreground">Participantes</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{company.trackedPosts}</p>
                        <p className="text-xs text-muted-foreground">Posts</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{(company.totalViews / 1000).toFixed(1)}k</p>
                        <p className="text-xs text-muted-foreground">Views</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{company.totalEngagement.toLocaleString('pt-BR')}</p>
                        <p className="text-xs text-muted-foreground">Engajamento</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">Nenhuma empresa com dados de engajamento</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Platform Health */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-cyan-500" />
          Saúde da Plataforma
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4" data-testid="health-problems">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-3 rounded-lg",
                (stats?.openProblemReports || 0) > 5 ? "bg-red-500/10" : 
                (stats?.openProblemReports || 0) > 0 ? "bg-amber-500/10" : "bg-green-500/10"
              )}>
                {(stats?.openProblemReports || 0) > 5 ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (stats?.openProblemReports || 0) > 0 ? (
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Problemas Abertos</p>
                <p className="text-xl font-bold text-foreground">{stats?.openProblemReports || 0}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4" data-testid="health-pending">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-3 rounded-lg",
                (stats?.pendingApplications || 0) > 20 ? "bg-amber-500/10" : "bg-green-500/10"
              )}>
                {(stats?.pendingApplications || 0) > 20 ? (
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fila de Análise</p>
                <p className="text-xl font-bold text-foreground">{stats?.pendingApplications || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4" data-testid="health-commissions">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-3 rounded-lg",
                (financialStats?.pendingCommissions || 0) > 1000 ? "bg-amber-500/10" : "bg-green-500/10"
              )}>
                {(financialStats?.pendingCommissions || 0) > 1000 ? (
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pagamentos Pendentes</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(financialStats?.pendingCommissions || 0)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4" data-testid="health-coupons">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Star className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cupons Utilizados</p>
                <p className="text-xl font-bold text-foreground">{financialStats?.totalCouponsUsed || 0}</p>
              </div>
            </div>
          </Card>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={itemVariants}>
        <Card data-testid="card-recent-activity">
          <CardHeader className="border-b border-border">
            <CardHeading>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Atividade Recente</CardTitle>
                  <p className="text-sm text-muted-foreground">Últimas ações na plataforma</p>
                </div>
              </div>
            </CardHeading>
            <CardToolbar>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" data-testid="button-view-all-activity">
                Ver tudo
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardToolbar>
          </CardHeader>
          <CardContent className="pt-6">
            {activity && activity.length > 0 ? (
              <div className="space-y-4">
                {activity.slice(0, 5).map((item: Activity, index: number) => (
                  <motion.div 
                    key={index} 
                    className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group"
                    data-testid={`activity-item-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className={cn(
                      "p-2 rounded-lg shrink-0",
                      item.type === 'campaign' 
                        ? 'bg-orange-500/10 text-orange-500' 
                        : item.type === 'application'
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'bg-primary/10 text-primary'
                    )}>
                      {item.type === 'campaign' ? (
                        <Megaphone className="w-4 h-4" />
                      ) : item.type === 'application' ? (
                        <FileText className="w-4 h-4" />
                      ) : (
                        <Users className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground font-medium">{item.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" appearance="light" className="text-xs">
                          {item.type === 'campaign' ? 'Campanha' : item.type === 'application' ? 'Candidatura' : 'Usuário'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(item.createdAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`button-activity-more-${index}`}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">Nenhuma atividade recente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
