import { useQuery } from '@tanstack/react-query';
import { useMarketplace } from '@/lib/provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  BarChart3,
  Users,
  Target,
  TrendingUp,
  Clock,
  Star,
  Calendar,
  CheckCircle,
  Activity,
  Briefcase,
  Heart,
  Loader2,
  AlertCircle,
  UserCheck,
  PieChart,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';

interface CompanyAnalyticsData {
  company: {
    id: number;
    name: string;
    companyName: string | null;
    avatar: string | null;
    bio: string | null;
    city: string | null;
    createdAt: string;
  };
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalApplications: number;
  acceptedApplications: number;
  acceptanceRate: string;
  avgResponseTime: string;
  avgRating: number;
  totalReviews: number;
  totalCollaborations: number;
  campaignsByMonth: { month: string; count: number }[];
  collaborationsByMonth: { month: string; count: number }[];
  topCreators: {
    id: number;
    name: string;
    avatar: string | null;
    collaborations: number;
    avgRating: number;
  }[];
  favoriteCount: number;
}

function formatNumber(num: number | null | undefined): string {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString('pt-BR');
}

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00C49F', '#FFBB28', '#FF8042'];

export default function CompanyAnalytics() {
  const { user } = useMarketplace();
  const [activeTab, setActiveTab] = useState('overview');

  const { data, isLoading, error } = useQuery<CompanyAnalyticsData>({
    queryKey: [`/api/companies/${user?.id}/public-stats`],
    enabled: !!user?.id && user?.role === 'company',
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Carregando analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="p-4 rounded-full bg-red-100 mb-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Erro ao carregar analytics</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          Não foi possível carregar suas métricas.
        </p>
      </div>
    );
  }

  const rejectedApplications = data.totalApplications - data.acceptedApplications;
  const pendingApplications = 0;

  const applicationStatusData = [
    { name: 'Aceitas', value: data.acceptedApplications, color: '#22c55e' },
    { name: 'Recusadas', value: rejectedApplications, color: '#ef4444' },
  ].filter(item => item.value > 0);

  const campaignStatusData = [
    { name: 'Ativas', value: data.activeCampaigns, color: '#3b82f6' },
    { name: 'Concluídas', value: data.completedCampaigns, color: '#22c55e' },
    { name: 'Outras', value: data.totalCampaigns - data.activeCampaigns - data.completedCampaigns, color: '#94a3b8' },
  ].filter(item => item.value > 0);

  const combinedMonthlyData = data.campaignsByMonth?.map((item, index) => ({
    month: item.month,
    campaigns: item.count,
    collaborations: data.collaborationsByMonth?.[index]?.count || 0,
  })) || [];

  return (
    <div className="space-y-6" data-testid="company-analytics-page">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics da Empresa
          </h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho das suas campanhas e colaborações
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" data-testid="tab-overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="campaigns" data-testid="tab-campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="creators" data-testid="tab-creators">Criadores</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Campanhas</CardTitle>
                  <Target className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.totalCampaigns}</div>
                  <p className="text-xs text-muted-foreground">
                    {data.activeCampaigns} ativas
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Aplicações</CardTitle>
                  <Users className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.totalApplications}</div>
                  <p className="text-xs text-muted-foreground">
                    {data.acceptedApplications} aceitas
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Aceitação</CardTitle>
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.acceptanceRate}</div>
                  <Progress 
                    value={parseFloat(data.acceptanceRate) || 0} 
                    className="mt-2" 
                  />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tempo de Resposta</CardTitle>
                  <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.avgResponseTime}</div>
                  <p className="text-xs text-muted-foreground">
                    Média de resposta
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Colaborações</CardTitle>
                  <Briefcase className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.totalCollaborations}</div>
                  <p className="text-xs text-muted-foreground">
                    Projetos finalizados
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
                  <Star className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold flex items-center gap-1">
                    {data.avgRating.toFixed(1)}
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {data.totalReviews} avaliações
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Favoritos</CardTitle>
                  <Heart className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.favoriteCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Criadores que favoritaram
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
                  <Activity className="h-4 w-4 text-cyan-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.activeCampaigns}</div>
                  <p className="text-xs text-muted-foreground">
                    Recebendo aplicações
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {combinedMonthlyData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Evolução Mensal
                </CardTitle>
                <CardDescription>Campanhas criadas e colaborações por mês</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={combinedMonthlyData}>
                      <defs>
                        <linearGradient id="colorCampaigns" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorCollabs" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="campaigns" 
                        name="Campanhas"
                        stroke="#3b82f6" 
                        fillOpacity={1} 
                        fill="url(#colorCampaigns)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="collaborations" 
                        name="Colaborações"
                        stroke="#22c55e" 
                        fillOpacity={1} 
                        fill="url(#colorCollabs)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  Status das Campanhas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {campaignStatusData.length > 0 ? (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={campaignStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {campaignStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    Nenhuma campanha ainda
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  Aplicações por Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {applicationStatusData.length > 0 ? (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={applicationStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {applicationStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    Nenhuma aplicação ainda
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Campanhas por Mês
              </CardTitle>
              <CardDescription>Histórico de campanhas criadas</CardDescription>
            </CardHeader>
            <CardContent>
              {data.campaignsByMonth && data.campaignsByMonth.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.campaignsByMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" name="Campanhas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Conversão de Candidatos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Aplicações totais</span>
                    <span className="font-medium">{data.totalApplications}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Aceitas</span>
                    <span className="font-medium text-green-600">{data.acceptedApplications}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa de conversão</span>
                    <span className="font-medium">{data.acceptanceRate}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Eficiência</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tempo de resposta</span>
                    <span className="font-medium">{data.avgResponseTime}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Campanhas ativas</span>
                    <span className="font-medium">{data.activeCampaigns}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Concluídas</span>
                    <span className="font-medium">{data.completedCampaigns}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Reputação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avaliação média</span>
                    <span className="font-medium flex items-center gap-1">
                      {data.avgRating.toFixed(1)}
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total de avaliações</span>
                    <span className="font-medium">{data.totalReviews}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Favoritos</span>
                    <span className="font-medium flex items-center gap-1">
                      {data.favoriteCount || 0}
                      <Heart className="h-3 w-3 text-red-500" />
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="creators" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Top Criadores
              </CardTitle>
              <CardDescription>Criadores com mais colaborações com sua empresa</CardDescription>
            </CardHeader>
            <CardContent>
              {data.topCreators && data.topCreators.length > 0 ? (
                <div className="space-y-4">
                  {data.topCreators.map((creator, index) => (
                    <div 
                      key={creator.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={creator.avatar || undefined} />
                            <AvatarFallback>
                              {creator.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <Badge 
                            variant="secondary" 
                            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                          >
                            {index + 1}
                          </Badge>
                        </div>
                        <div>
                          <p className="font-medium">{creator.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {creator.collaborations} {creator.collaborations === 1 ? 'colaboração' : 'colaborações'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {creator.avgRating > 0 && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            {creator.avgRating.toFixed(1)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma colaboração concluída ainda</p>
                  <p className="text-sm">Os criadores aparecerão aqui após finalizar projetos</p>
                </div>
              )}
            </CardContent>
          </Card>

          {data.collaborationsByMonth && data.collaborationsByMonth.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Colaborações por Mês
                </CardTitle>
                <CardDescription>Histórico de parcerias aceitas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.collaborationsByMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        name="Colaborações"
                        stroke="#22c55e" 
                        strokeWidth={2}
                        dot={{ fill: '#22c55e' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Resumo de Parcerias</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total de colaborações</span>
                  <span className="font-bold">{data.totalCollaborations}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Aplicações aceitas</span>
                  <span className="font-bold">{data.acceptedApplications}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Criadores diferentes</span>
                  <span className="font-bold">{data.topCreators?.length || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Avaliações Recebidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Nota média</span>
                  <span className="font-bold flex items-center gap-1">
                    {data.avgRating.toFixed(1)}/5
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total de avaliações</span>
                  <span className="font-bold">{data.totalReviews}</span>
                </div>
                <Separator />
                <Progress 
                  value={(data.avgRating / 5) * 100} 
                  className="h-2"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
