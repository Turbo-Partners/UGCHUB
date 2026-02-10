import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useMarketplace } from '@/lib/provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Users, Target, TrendingUp, Clock, Star, CheckCircle,
  Activity, Briefcase, Heart, Loader2, AlertCircle,
  DollarSign, ShoppingCart, Wallet, ArrowUpRight,
  ArrowDownRight, Zap, Award, Eye, ChevronRight,
  Sparkles, Trophy, BarChart3, PieChart, TrendingDown,
  MessageSquare, Instagram, Send, EyeOff, Trash2,
  RefreshCw, Image, Film, Layers, Plus, ExternalLink,
  MessageCircle, Upload, LayoutGrid, Globe,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
  PieChart as RechartsPieChart, Pie, Cell,
  ComposedChart, Line,
} from 'recharts';
import { getAvatarUrl } from '@/lib/utils';
import { Link } from 'wouter';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  financialMetrics?: {
    totalRevenue: number;
    totalCommissions: number;
    pendingCommissions: number;
    paidCommissions: number;
    totalSales: number;
    avgOrderValue: number;
    revenueByMonth: { month: string; revenue: number; commissions: number }[];
    salesByCreator: { creatorId: number; name: string; avatar: string | null; sales: number; revenue: number; commissions: number }[];
  };
}

interface MessagingAnalytics {
  totalConversations: number;
  totalMessages: number;
  incomingMessages: number;
  outgoingMessages: number;
  avgResponseTime: number | null;
  conversationsToday: number;
  conversationsThisWeek: number;
  conversationsThisMonth: number;
  messagesToday: number;
  messagesThisWeek: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-xl p-3">
        <p className="font-medium text-foreground mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

interface MetricBadgeProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  color: string;
}

function MetricBadge({ label, value, icon, trend, color }: MetricBadgeProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
      <div className={`p-2.5 rounded-xl ${color}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">{value}</span>
          {trend !== undefined && trend !== 0 && (
            <span className={`text-xs font-medium flex items-center ${trend > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface InsightCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  type: 'success' | 'warning' | 'info';
  action?: { label: string; href: string };
}

function InsightCard({ title, description, icon, type, action }: InsightCardProps) {
  const colors = {
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl border ${colors[type]}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-background/50">
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-foreground">{title}</h4>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          {action && (
            <Link href={action.href}>
              <Button variant="link" className="p-0 h-auto mt-2 text-xs">
                {action.label}
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function SectionHeader({ icon, title, description }: { icon: React.ReactNode; title: string; description?: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2.5 rounded-xl bg-primary/10">
        {icon}
      </div>
      <div>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

type PublishType = "image" | "carousel" | "reel" | "story";

interface CarouselItem {
  imageUrl?: string;
  videoUrl?: string;
  isVideo?: boolean;
}

function VisaoGeralTab({ data, insights, financialMetrics }: { data: CompanyAnalyticsData; insights: InsightCardProps[]; financialMetrics?: CompanyAnalyticsData['financialMetrics'] }) {
  const acceptanceRateNum = parseFloat(data.acceptanceRate) || 0;
  const pendingApplications = data.totalApplications - data.acceptedApplications;
  const completionRate = data.acceptedApplications > 0 ? ((data.totalCollaborations / data.acceptedApplications) * 100) : 0;

  const combinedMonthlyData = data.campaignsByMonth?.map((item, index) => ({
    month: item.month,
    campaigns: item.count,
    collaborations: data.collaborationsByMonth?.[index]?.count || 0,
  })) || [];

  const campaignStatusData = [
    { name: 'Ativas', value: data.activeCampaigns, color: '#3b82f6' },
    { name: 'Concluídas', value: data.completedCampaigns, color: '#22c55e' },
    { name: 'Outras', value: Math.max(0, data.totalCampaigns - data.activeCampaigns - data.completedCampaigns), color: '#94a3b8' },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-8" data-testid="tab-visao-geral">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3"
      >
        <MetricBadge label="Campanhas" value={data.totalCampaigns} icon={<Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />} color="bg-blue-500/10" />
        <MetricBadge label="Ativas" value={data.activeCampaigns} icon={<Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />} color="bg-emerald-500/10" />
        <MetricBadge label="Aplicações" value={data.totalApplications} icon={<Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />} color="bg-purple-500/10" />
        <MetricBadge label="Aceitas" value={data.acceptedApplications} icon={<CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />} color="bg-green-500/10" />
        <MetricBadge label="Colaborações" value={data.totalCollaborations} icon={<Briefcase className="h-4 w-4 text-amber-600 dark:text-amber-400" />} color="bg-amber-500/10" />
        <MetricBadge label="Avaliação" value={`${data.avgRating.toFixed(1)} ★`} icon={<Star className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />} color="bg-yellow-500/10" />
        <MetricBadge label="Favoritos" value={data.favoriteCount || 0} icon={<Heart className="h-4 w-4 text-red-600 dark:text-red-400" />} color="bg-red-500/10" />
        <MetricBadge label="Resposta" value={data.avgResponseTime} icon={<Clock className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />} color="bg-cyan-500/10" />
      </motion.div>

      {insights.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <SectionHeader icon={<Sparkles className="h-5 w-5 text-primary" />} title="Insights" description="Recomendações baseadas nos seus dados" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {insights.map((insight, index) => (
              <InsightCard key={index} {...insight} />
            ))}
          </div>
        </motion.section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <Card className="border border-border h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Evolução Mensal</CardTitle>
                    <CardDescription>Campanhas e colaborações ao longo do tempo</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-muted-foreground">Campanhas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground">Colaborações</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {combinedMonthlyData.length > 0 ? (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={combinedMonthlyData}>
                      <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="campaigns" name="Campanhas" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#areaGradient)" />
                      <Line type="monotone" dataKey="collaborations" name="Colaborações" stroke="#22c55e" strokeWidth={3} dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum dado disponível ainda</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border border-border h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <PieChart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle>Status das Campanhas</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {campaignStatusData.length > 0 ? (
                <>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie data={campaignStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                          {campaignStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-2">
                    {campaignStatusData.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-muted-foreground">{item.name}</span>
                        <span className="text-xs font-bold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma campanha ainda</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border border-border h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <CardTitle>Top Criadores</CardTitle>
                    <CardDescription>Melhores parceiros por colaborações</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {data.topCreators && data.topCreators.length > 0 ? (
                <div className="space-y-3">
                  {data.topCreators.slice(0, 5).map((creator, index) => (
                    <motion.div
                      key={creator.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10 ring-2 ring-background">
                            <AvatarImage src={getAvatarUrl(creator.avatar, creator.name)} />
                            <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                              {creator.name?.charAt(0)?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {index < 3 && (
                            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${
                              index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                            }`}>
                              {index + 1}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{creator.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{creator.collaborations} projetos</span>
                            <span>•</span>
                            <div className="flex items-center gap-0.5">
                              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                              <span>{creator.avgRating?.toFixed(1) || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="font-bold">
                          {creator.collaborations}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma colaboração registrada ainda</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border border-border h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <CardTitle>Métricas de Performance</CardTitle>
                  <CardDescription>Indicadores-chave do seu desempenho</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Taxa de Aceitação</span>
                    <span className="text-sm font-medium text-foreground">{data.acceptanceRate}</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${acceptanceRateNum}%` }} transition={{ duration: 1, delay: 0.6 }} className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Satisfação (Avaliações)</span>
                    <span className="text-sm font-medium text-foreground">{(data.avgRating * 20).toFixed(0)}%</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${data.avgRating * 20}%` }} transition={{ duration: 1, delay: 0.7 }} className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Taxa de Conclusão</span>
                    <span className="text-sm font-medium text-foreground">{completionRate.toFixed(0)}%</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${completionRate}%` }} transition={{ duration: 1, delay: 0.8 }} className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full" />
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-muted/50">
                    <p className="text-xl font-bold text-foreground">{data.totalReviews}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Avaliações</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50">
                    <p className="text-xl font-bold text-foreground">{data.topCreators?.length || 0}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Criadores</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50">
                    <p className="text-xl font-bold text-foreground">{pendingApplications}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pendentes</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>

      {financialMetrics && (
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <SectionHeader icon={<DollarSign className="h-5 w-5 text-primary" />} title="Financeiro" description="Receitas e comissões das suas campanhas" />
          <div className="space-y-6" data-testid="tab-financeiro">
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10"><DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /></div>
                    <div>
                      <p className="text-xs text-muted-foreground">Receita Total</p>
                      <p className="text-xl font-bold text-foreground">R$ {(financialMetrics.totalRevenue / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10"><Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div>
                    <div>
                      <p className="text-xs text-muted-foreground">Comissões Pagas</p>
                      <p className="text-xl font-bold text-foreground">R$ {(financialMetrics.paidCommissions / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10"><Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" /></div>
                    <div>
                      <p className="text-xs text-muted-foreground">Pendentes</p>
                      <p className="text-xl font-bold text-foreground">R$ {(financialMetrics.pendingCommissions / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/10"><ShoppingCart className="h-5 w-5 text-purple-600 dark:text-purple-400" /></div>
                    <div>
                      <p className="text-xs text-muted-foreground">Ticket Médio</p>
                      <p className="text-xl font-bold text-foreground">R$ {(financialMetrics.avgOrderValue / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {financialMetrics.revenueByMonth && financialMetrics.revenueByMonth.length > 0 && (
              <Card className="border border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Receita vs Comissões</CardTitle>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-muted-foreground text-xs">Receita</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-muted-foreground text-xs">Comissões</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={financialMetrics.revenueByMonth.map(item => ({ ...item, revenue: item.revenue / 100, commissions: item.commissions / 100 }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickFormatter={(value) => `R$${value}`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="revenue" name="Receita" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="commissions" name="Comissões" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.section>
      )}
    </div>
  );
}

function MinhasRedesTab() {
  const queryClient = useQueryClient();

  const [publishType, setPublishType] = useState<PublishType>("image");
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([{ imageUrl: "" }, { imageUrl: "" }]);
  const [shareToFeed, setShareToFeed] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sentiments, setSentiments] = useState<Record<string, { sentiment: string; emoji: string }>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [commentFilter, setCommentFilter] = useState<"all" | "hidden">("all");
  const [activeSection, setActiveSection] = useState<"posts" | "comments" | "messages">("posts");

  const { data: limitData } = useQuery({
    queryKey: ["/api/instagram/publishing/limit"],
    queryFn: async () => { const res = await apiRequest("GET", "/api/instagram/publishing/limit"); return res.json(); },
  });

  const { data: mediaData, isLoading: isLoadingMedia, refetch: refetchMedia } = useQuery({
    queryKey: ["/api/instagram/publishing/media"],
    queryFn: async () => { const res = await apiRequest("GET", "/api/instagram/publishing/media?limit=12"); return res.json(); },
  });

  const { data: commentsData, isLoading: isLoadingComments, refetch: refetchComments, isRefetching: isRefetchingComments } = useQuery({
    queryKey: ["/api/instagram/comments"],
    queryFn: async () => { const res = await apiRequest("GET", "/api/instagram/comments?postsLimit=15&commentsPerPost=30"); return res.json(); },
  });

  const { data: messagingData, isLoading: isLoadingMessaging } = useQuery<MessagingAnalytics>({
    queryKey: ['/api/instagram/analytics/messages'],
  });

  const recentMedia = mediaData?.media || [];
  const quotaUsage = limitData?.quota_usage || 0;
  const quotaTotal = limitData?.config?.quota_total || 25;
  const comments = commentsData?.comments || [];
  const filteredComments = commentFilter === "hidden" ? comments.filter((c: any) => c.hidden) : comments;

  const sortedMedia = [...recentMedia].sort((a: any, b: any) => {
    const engA = (a.like_count || 0) + (a.comments_count || 0);
    const engB = (b.like_count || 0) + (b.comments_count || 0);
    return engB - engA;
  });

  const totalLikes = recentMedia.reduce((sum: number, m: any) => sum + (m.like_count || 0), 0);
  const totalComments = recentMedia.reduce((sum: number, m: any) => sum + (m.comments_count || 0), 0);
  const avgEngagement = recentMedia.length > 0 ? Math.round((totalLikes + totalComments) / recentMedia.length) : 0;
  const bestType = (() => {
    const typeMap: Record<string, number> = {};
    recentMedia.forEach((m: any) => {
      const type = m.media_type === "VIDEO" ? "Reel" : m.media_type === "CAROUSEL_ALBUM" ? "Carrossel" : "Foto";
      typeMap[type] = (typeMap[type] || 0) + (m.like_count || 0) + (m.comments_count || 0);
    });
    let best = "—";
    let bestVal = 0;
    for (const [type, val] of Object.entries(typeMap)) {
      if (val > bestVal) { best = type; bestVal = val; }
    }
    return best;
  })();
  const maxEngagement = sortedMedia.length > 0 ? (sortedMedia[0]?.like_count || 0) + (sortedMedia[0]?.comments_count || 0) : 0;

  const sortedComments = (() => {
    const hasSentiments = Object.keys(sentiments).length > 0;
    if (!hasSentiments) return filteredComments;
    return [...filteredComments].sort((a: any, b: any) => {
      const sA = sentiments[a.id]?.sentiment?.toLowerCase() || '';
      const sB = sentiments[b.id]?.sentiment?.toLowerCase() || '';
      const order: Record<string, number> = { negativo: 0, negative: 0, neutro: 1, neutral: 1, positivo: 2, positive: 2 };
      return (order[sA] ?? 1) - (order[sB] ?? 1);
    });
  })();

  const sentimentStats = (() => {
    let positivo = 0, neutro = 0, negativo = 0;
    for (const s of Object.values(sentiments)) {
      const lower = s.sentiment?.toLowerCase() || '';
      if (lower.includes('positiv')) positivo++;
      else if (lower.includes('negativ')) negativo++;
      else neutro++;
    }
    return { positivo, neutro, negativo };
  })();

  const getSentimentBg = (commentId: string) => {
    const s = sentiments[commentId]?.sentiment?.toLowerCase() || '';
    if (s.includes('negativ')) return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50';
    if (s.includes('positiv')) return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50';
    return '';
  };

  const isNegative = (commentId: string) => {
    const s = sentiments[commentId]?.sentiment?.toLowerCase() || '';
    return s.includes('negativ');
  };

  const replyMutation = useMutation({
    mutationFn: async ({ commentId, message }: { commentId: string; message: string }) => {
      const res = await apiRequest("POST", `/api/instagram/comments/${commentId}/reply`, { message });
      return res.json();
    },
    onSuccess: () => { toast.success("Resposta enviada!"); setReplyingTo(null); setReplyText(""); refetchComments(); },
    onError: (e: any) => toast.error(e.message || "Erro ao responder"),
  });

  const hideMutation = useMutation({
    mutationFn: async ({ commentId, hide }: { commentId: string; hide: boolean }) => {
      const res = await apiRequest("POST", `/api/instagram/comments/${commentId}/hide`, { hide });
      return res.json();
    },
    onSuccess: (_, vars) => { toast.success(vars.hide ? "Comentário ocultado" : "Comentário visível novamente"); refetchComments(); },
    onError: (e: any) => toast.error(e.message || "Erro"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const res = await apiRequest("DELETE", `/api/instagram/comments/${commentId}`);
      return res.json();
    },
    onSuccess: () => { toast.success("Comentário removido"); refetchComments(); },
    onError: (e: any) => toast.error(e.message || "Erro ao remover"),
  });

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      let endpoint = "";
      let body: any = {};

      switch (publishType) {
        case "image":
          if (!imageUrl.trim()) { toast.error("URL da imagem é obrigatória"); setIsPublishing(false); return; }
          endpoint = "/api/instagram/publish/image";
          body = { imageUrl: imageUrl.trim(), caption: caption.trim() || undefined };
          break;
        case "carousel":
          const validItems = carouselItems.filter(i => i.imageUrl?.trim() || i.videoUrl?.trim());
          if (validItems.length < 2) { toast.error("Mínimo de 2 itens para carrossel"); setIsPublishing(false); return; }
          endpoint = "/api/instagram/publish/carousel";
          body = { children: validItems, caption: caption.trim() || undefined };
          break;
        case "reel":
          if (!videoUrl.trim()) { toast.error("URL do vídeo é obrigatória"); setIsPublishing(false); return; }
          endpoint = "/api/instagram/publish/reel";
          body = { videoUrl: videoUrl.trim(), caption: caption.trim() || undefined, shareToFeed };
          break;
        case "story":
          if (!imageUrl.trim() && !videoUrl.trim()) { toast.error("URL da mídia é obrigatória"); setIsPublishing(false); return; }
          endpoint = "/api/instagram/publish/story";
          body = videoUrl.trim() ? { videoUrl: videoUrl.trim() } : { imageUrl: imageUrl.trim() };
          break;
      }

      const res = await apiRequest("POST", endpoint, body);
      const data = await res.json();

      if (data.success) {
        toast.success("Publicado com sucesso!");
        if (data.permalink) toast.info(`Ver post: ${data.permalink}`);
        setCaption(""); setImageUrl(""); setVideoUrl("");
        setCarouselItems([{ imageUrl: "" }, { imageUrl: "" }]);
        setPublishDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ["/api/instagram/publishing/media"] });
        queryClient.invalidateQueries({ queryKey: ["/api/instagram/publishing/limit"] });
      } else {
        toast.error(data.error || "Erro ao publicar");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao publicar conteúdo");
    }
    setIsPublishing(false);
  };

  const addCarouselItem = () => {
    if (carouselItems.length >= 10) { toast.error("Máximo de 10 itens por carrossel"); return; }
    setCarouselItems([...carouselItems, { imageUrl: "" }]);
  };

  const removeCarouselItem = (index: number) => {
    if (carouselItems.length <= 2) { toast.error("Mínimo de 2 itens no carrossel"); return; }
    setCarouselItems(carouselItems.filter((_, i) => i !== index));
  };

  const updateCarouselItem = (index: number, field: string, value: string) => {
    const updated = [...carouselItems];
    if (field === "imageUrl") {
      updated[index] = { imageUrl: value, isVideo: false };
    } else {
      updated[index] = { videoUrl: value, isVideo: true };
    }
    setCarouselItems(updated);
  };

  const handleAnalyzeSentiment = async () => {
    const commentsToAnalyze = filteredComments.slice(0, 30).map((c: any) => ({ id: c.id, text: c.text, username: c.username }));
    if (commentsToAnalyze.length === 0) return;
    setIsAnalyzing(true);
    try {
      const res = await apiRequest("POST", "/api/instagram/comments/analyze-sentiment", { comments: commentsToAnalyze });
      const data = await res.json();
      const sentimentMap: Record<string, { sentiment: string; emoji: string }> = {};
      for (const s of data.sentiments || []) {
        const comment = commentsToAnalyze[s.index - 1];
        if (comment) sentimentMap[comment.id] = { sentiment: s.sentiment, emoji: s.emoji };
      }
      setSentiments(sentimentMap);
      toast.success(`${Object.keys(sentimentMap).length} comentários analisados!`);
    } catch {
      toast.error("Erro na análise de sentimento");
    }
    setIsAnalyzing(false);
  };

  const handleDeleteAllNegative = async () => {
    const negativeIds = Object.entries(sentiments)
      .filter(([_, s]) => s.sentiment?.toLowerCase().includes('negativ'))
      .map(([id]) => id);
    if (negativeIds.length === 0) { toast.info("Nenhum comentário negativo para excluir"); return; }
    if (!confirm(`Tem certeza que deseja excluir ${negativeIds.length} comentário(s) negativo(s)?`)) return;
    for (const id of negativeIds) {
      try { await apiRequest("DELETE", `/api/instagram/comments/${id}`); } catch {}
    }
    toast.success(`${negativeIds.length} comentário(s) negativo(s) removido(s)`);
    refetchComments();
  };

  return (
    <div className="space-y-6" data-testid="tab-minhas-redes">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={activeSection === "posts" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveSection("posts")}
          data-testid="section-posts"
        >
          <LayoutGrid className="h-4 w-4 mr-2" />
          Posts
        </Button>
        <Button
          variant={activeSection === "comments" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveSection("comments")}
          data-testid="section-comments"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Comentários ({comments.length})
        </Button>
        <Button
          variant={activeSection === "messages" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveSection("messages")}
          data-testid="section-messages"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Mensagens
        </Button>
        <div className="ml-auto">
          <Button onClick={() => setPublishDialogOpen(true)} data-testid="button-open-publish-dialog">
            <Upload className="h-4 w-4 mr-2" />
            Publicar Conteúdo
          </Button>
        </div>
      </div>

      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Publicar Conteúdo</DialogTitle>
            <DialogDescription>Publique posts, carrosséis, reels e stories direto no Instagram</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-sm" data-testid="badge-publishing-quota">
                <Clock className="h-3 w-3 mr-1" />
                Publicações: {quotaUsage}/{quotaTotal} (24h)
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {([
                { type: "image" as PublishType, label: "Imagem", icon: Image },
                { type: "carousel" as PublishType, label: "Carrossel", icon: Layers },
                { type: "reel" as PublishType, label: "Reel", icon: Film },
                { type: "story" as PublishType, label: "Story", icon: Eye },
              ]).map(({ type, label, icon: Icon }) => (
                <Button key={type} variant={publishType === type ? "default" : "outline"} className="flex flex-col gap-1 h-auto py-3" onClick={() => setPublishType(type)} data-testid={`button-type-${type}`}>
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{label}</span>
                </Button>
              ))}
            </div>

            {publishType === "image" && (
              <div className="space-y-2">
                <Label>URL da Imagem *</Label>
                <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://exemplo.com/imagem.jpg" data-testid="input-image-url" />
                <p className="text-xs text-muted-foreground">A imagem precisa ser pública e acessível via HTTPS. Formatos: JPEG, PNG.</p>
              </div>
            )}

            {publishType === "carousel" && (
              <div className="space-y-3">
                <Label>Itens do Carrossel ({carouselItems.length}/10)</Label>
                {carouselItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <Input value={item.imageUrl || item.videoUrl || ""} onChange={(e) => updateCarouselItem(index, e.target.value.match(/\.(mp4|mov|avi)/i) ? "videoUrl" : "imageUrl", e.target.value)} placeholder={`URL da mídia ${index + 1}`} data-testid={`input-carousel-item-${index}`} />
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">{item.isVideo ? "Vídeo" : "Imagem"}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => removeCarouselItem(index)} disabled={carouselItems.length <= 2} data-testid={`button-remove-carousel-${index}`}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addCarouselItem} disabled={carouselItems.length >= 10} data-testid="button-add-carousel-item">
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Item
                </Button>
              </div>
            )}

            {publishType === "reel" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>URL do Vídeo *</Label>
                  <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://exemplo.com/video.mp4" data-testid="input-video-url" />
                  <p className="text-xs text-muted-foreground">Formatos: MP4, MOV. Duração: 3s a 15min. Resolução mínima: 720p.</p>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="shareToFeed" checked={shareToFeed} onChange={(e) => setShareToFeed(e.target.checked)} className="rounded" data-testid="checkbox-share-to-feed" />
                  <Label htmlFor="shareToFeed" className="text-sm font-normal cursor-pointer">Compartilhar também no Feed</Label>
                </div>
              </div>
            )}

            {publishType === "story" && (
              <div className="space-y-2">
                <Label>URL da Mídia *</Label>
                <Input value={imageUrl || videoUrl} onChange={(e) => { const val = e.target.value; if (val.match(/\.(mp4|mov|avi)/i)) { setVideoUrl(val); setImageUrl(""); } else { setImageUrl(val); setVideoUrl(""); } }} placeholder="https://exemplo.com/midia.jpg" data-testid="input-story-url" />
                <p className="text-xs text-muted-foreground">Imagem (JPEG, PNG) ou vídeo (MP4, MOV). Stories desaparecem em 24h.</p>
              </div>
            )}

            {publishType !== "story" && (
              <div className="space-y-2">
                <Label>Legenda</Label>
                <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Escreva a legenda do seu post..." rows={3} maxLength={2200} data-testid="textarea-caption" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Dica: use hashtags e menções para alcançar mais pessoas</span>
                  <span>{caption.length}/2200</span>
                </div>
              </div>
            )}

            {imageUrl && publishType === "image" && (
              <div className="space-y-2">
                <Label>Pré-visualização</Label>
                <div className="max-w-xs rounded-lg overflow-hidden border">
                  <img src={imageUrl} alt="Preview" className="w-full h-auto max-h-64 object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handlePublish} disabled={isPublishing || quotaUsage >= quotaTotal} className="min-w-32" data-testid="button-publish">
                {isPublishing ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" />Publicando...</>) : (<><Send className="h-4 w-4 mr-2" />Publicar</>)}
              </Button>
              {quotaUsage >= quotaTotal && (
                <p className="text-sm text-destructive">Limite de publicações atingido (25/24h).</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {activeSection === "posts" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Button variant="outline" size="sm" onClick={() => { refetchMedia(); queryClient.invalidateQueries({ queryKey: ["/api/instagram/publishing/limit"] }); }} data-testid="button-refresh-publishing">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>

          {recentMedia.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="posts-summary-bar">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                <div className="p-2 rounded-lg bg-pink-500/10"><Heart className="h-4 w-4 text-pink-600 dark:text-pink-400" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Curtidas</p>
                  <p className="text-lg font-bold">{totalLikes.toLocaleString('pt-BR')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                <div className="p-2 rounded-lg bg-blue-500/10"><MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Comentários</p>
                  <p className="text-lg font-bold">{totalComments.toLocaleString('pt-BR')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                <div className="p-2 rounded-lg bg-amber-500/10"><TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Engajamento Médio</p>
                  <p className="text-lg font-bold">{avgEngagement}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                <div className="p-2 rounded-lg bg-purple-500/10"><Trophy className="h-4 w-4 text-purple-600 dark:text-purple-400" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Melhor Formato</p>
                  <p className="text-lg font-bold">{bestType}</p>
                </div>
              </div>
            </div>
          )}

          <SectionHeader icon={<LayoutGrid className="h-5 w-5 text-primary" />} title="Análise de Conteúdo" description="Posts ordenados por engajamento" />
          {isLoadingMedia ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (<Skeleton key={i} className="aspect-square rounded-lg" />))}
            </div>
          ) : sortedMedia.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">Nenhuma publicação recente</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sortedMedia.map((media: any, index: number) => {
                const engagement = (media.like_count || 0) + (media.comments_count || 0);
                const isTopPost = index === 0 && engagement > 0;
                const isHighEngagement = engagement > avgEngagement * 1.5 && engagement > 0;
                return (
                  <Card key={media.id} className={`overflow-hidden group cursor-pointer ${isTopPost ? 'ring-2 ring-amber-500/50' : ''}`} data-testid={`media-card-${media.id}`}>
                    <div className="aspect-square relative bg-muted">
                      {media.media_url || media.thumbnail_url ? (
                        <img src={media.thumbnail_url || media.media_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Image className="h-8 w-8 text-muted-foreground/30" /></div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                        <div className="flex items-center gap-1"><Heart className="h-4 w-4" /><span className="text-sm font-medium">{media.like_count || 0}</span></div>
                        <div className="flex items-center gap-1"><MessageCircle className="h-4 w-4" /><span className="text-sm font-medium">{media.comments_count || 0}</span></div>
                      </div>
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {isTopPost && (
                          <Badge className="text-[10px] bg-amber-500 text-white border-0" data-testid={`badge-top-post-${media.id}`}>
                            <Trophy className="h-3 w-3 mr-0.5" />Top Post
                          </Badge>
                        )}
                        {isHighEngagement && !isTopPost && (
                          <Badge className="text-[10px] bg-emerald-500 text-white border-0" data-testid={`badge-high-engagement-${media.id}`}>
                            <Zap className="h-3 w-3 mr-0.5" />Alto Engajamento
                          </Badge>
                        )}
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-xs bg-black/50 text-white border-0">
                          {media.media_type === "VIDEO" ? "Reel" : media.media_type === "CAROUSEL_ALBUM" ? "Carrossel" : "Foto"}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="flex items-center gap-1 text-xs font-semibold text-pink-600 dark:text-pink-400"><Heart className="h-3 w-3" />{media.like_count || 0}</span>
                        <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400"><MessageCircle className="h-3 w-3" />{media.comments_count || 0}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{formatDistanceToNow(new Date(media.timestamp), { addSuffix: true, locale: ptBR })}</span>
                      </div>
                      {media.caption && <p className="text-xs line-clamp-2">{media.caption}</p>}
                      {media.permalink && (
                        <a href={media.permalink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 mt-1 hover:underline" data-testid={`link-permalink-${media.id}`}>
                          <ExternalLink className="h-3 w-3" />Ver no Instagram
                        </a>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {activeSection === "comments" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => refetchComments()} disabled={isRefetchingComments} data-testid="button-refresh-comments">
              {isRefetchingComments ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Atualizar
            </Button>
            <Button size="sm" onClick={handleAnalyzeSentiment} disabled={isAnalyzing || filteredComments.length === 0} data-testid="button-analyze-sentiment">
              {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Analisar Sentimento
            </Button>
            {sentimentStats.negativo > 0 && (
              <Button variant="destructive" size="sm" onClick={handleDeleteAllNegative} data-testid="button-delete-all-negative">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Negativos ({sentimentStats.negativo})
              </Button>
            )}
            <div className="flex items-center gap-1 ml-auto">
              <Button variant={commentFilter === "all" ? "default" : "ghost"} size="sm" onClick={() => setCommentFilter("all")} data-testid="button-filter-all">
                Todos ({comments.length})
              </Button>
              <Button variant={commentFilter === "hidden" ? "default" : "ghost"} size="sm" onClick={() => setCommentFilter("hidden")} data-testid="button-filter-hidden">
                <EyeOff className="h-3 w-3 mr-1" />Ocultos
              </Button>
            </div>
          </div>

          {Object.keys(sentiments).length > 0 && (
            <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/40" data-testid="sentiment-stats">
              <span className="text-sm font-medium text-muted-foreground">Sentimento:</span>
              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">{sentimentStats.positivo} positivos</Badge>
              <Badge variant="secondary">{sentimentStats.neutro} neutros</Badge>
              <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800">{sentimentStats.negativo} negativos</Badge>
            </div>
          )}

          {isLoadingComments ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Card key={i}><CardContent className="py-4"><div className="flex gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-full" /><Skeleton className="h-3 w-32" /></div></div></CardContent></Card>
              ))}
            </div>
          ) : filteredComments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground" data-testid="text-empty-comments">Nenhum comentário encontrado</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Os comentários dos seus posts aparecerão aqui</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sortedComments.map((comment: any) => (
                <Card key={comment.id} className={`transition-colors ${comment.hidden ? "opacity-60 border-yellow-500/30" : ""} ${getSentimentBg(comment.id)}`} data-testid={`comment-card-${comment.id}`}>
                  <CardContent className="py-4">
                    <div className="flex gap-3">
                      {comment.post && (
                        <div className="hidden sm:block w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {comment.post.mediaUrl || comment.post.thumbnailUrl ? (
                            <img src={comment.post.thumbnailUrl || comment.post.mediaUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Image className="h-5 w-5 text-muted-foreground/30" /></div>
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-sm" data-testid={`text-username-${comment.id}`}>@{comment.username}</span>
                          {sentiments[comment.id] && (
                            <Badge variant="secondary" className="text-xs" data-testid={`badge-sentiment-${comment.id}`}>{sentiments[comment.id].emoji} {sentiments[comment.id].sentiment}</Badge>
                          )}
                          {comment.hidden && (
                            <Badge variant="outline" className="text-xs text-yellow-600" data-testid={`badge-hidden-${comment.id}`}><EyeOff className="h-3 w-3 mr-1" />Oculto</Badge>
                          )}
                          {comment.like_count > 0 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1" data-testid={`text-likes-${comment.id}`}><Heart className="h-3 w-3" />{comment.like_count}</span>
                          )}
                        </div>
                        <p className="text-sm mb-1.5" data-testid={`text-comment-${comment.id}`}>{comment.text}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                          <span data-testid={`text-timestamp-${comment.id}`}>{formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true, locale: ptBR })}</span>
                          {comment.post?.permalink && (
                            <a href={comment.post.permalink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary" data-testid={`link-post-${comment.id}`}>
                              <ExternalLink className="h-3 w-3" />Ver post
                            </a>
                          )}
                        </div>
                        {comment.replies?.data && comment.replies.data.length > 0 && (
                          <div className="ml-4 pl-4 border-l-2 border-muted space-y-2 mb-2">
                            {comment.replies.data.map((reply: any) => (
                              <div key={reply.id} className="text-sm" data-testid={`reply-${reply.id}`}>
                                <span className="font-medium">@{reply.username}</span>{" "}
                                <span className="text-muted-foreground">{reply.text}</span>
                                <span className="text-xs text-muted-foreground ml-2">{formatDistanceToNow(new Date(reply.timestamp), { addSuffix: true, locale: ptBR })}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => { setReplyingTo(replyingTo === comment.id ? null : comment.id); setReplyText(""); }} data-testid={`button-reply-${comment.id}`}>
                            <MessageCircle className="h-3 w-3 mr-1" />Responder
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => hideMutation.mutate({ commentId: comment.id, hide: !comment.hidden })} disabled={hideMutation.isPending} data-testid={`button-hide-${comment.id}`}>
                            {comment.hidden ? (<><Eye className="h-3 w-3 mr-1" />Mostrar</>) : (<><EyeOff className="h-3 w-3 mr-1" />Ocultar</>)}
                          </Button>
                          <Button
                            variant={isNegative(comment.id) ? "destructive" : "ghost"}
                            size="sm"
                            className={isNegative(comment.id) ? "" : "text-destructive hover:text-destructive"}
                            onClick={() => { if (confirm("Tem certeza que deseja remover este comentário?")) deleteMutation.mutate(comment.id); }}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${comment.id}`}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />Remover
                          </Button>
                        </div>
                        {replyingTo === comment.id && (
                          <div className="flex gap-2 mt-2">
                            <Input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Escreva sua resposta..." onKeyDown={(e) => { if (e.key === "Enter" && replyText.trim()) replyMutation.mutate({ commentId: comment.id, message: replyText.trim() }); }} data-testid={`input-reply-${comment.id}`} />
                            <Button size="sm" onClick={() => { if (replyText.trim()) replyMutation.mutate({ commentId: comment.id, message: replyText.trim() }); }} disabled={!replyText.trim() || replyMutation.isPending} data-testid={`button-send-reply-${comment.id}`}>
                              {replyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {activeSection === "messages" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <SectionHeader icon={<MessageSquare className="h-5 w-5 text-primary" />} title="Mensagens Instagram" description="Métricas das suas conversas" />
          {isLoadingMessaging ? (
            <div className="flex items-center justify-center py-8" data-testid="messaging-loading"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : messagingData ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-testid="messaging-analytics-grid">
              <Card className="border border-border" data-testid="card-response-time">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10"><Clock className="h-5 w-5 text-cyan-600 dark:text-cyan-400" /></div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tempo Médio de Resposta</p>
                      <p className="text-xl font-bold text-foreground">{messagingData.avgResponseTime !== null ? `${messagingData.avgResponseTime} min` : '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-border" data-testid="card-conversations-month">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/10"><Users className="h-5 w-5 text-purple-600 dark:text-purple-400" /></div>
                    <div>
                      <p className="text-xs text-muted-foreground">Conversas Este Mês</p>
                      <p className="text-xl font-bold text-foreground">{messagingData.conversationsThisMonth}</p>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        <span>Semana: {messagingData.conversationsThisWeek}</span>
                        <span>Hoje: {messagingData.conversationsToday}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-border" data-testid="card-messages-exchanged">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10"><MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div>
                    <div>
                      <p className="text-xs text-muted-foreground">Mensagens Trocadas</p>
                      <p className="text-xl font-bold text-foreground">{messagingData.totalMessages}</p>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        <span>Recebidas: {messagingData.incomingMessages}</span>
                        <span>Enviadas: {messagingData.outgoingMessages}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-border" data-testid="card-messages-quick-metrics">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Mensagens hoje</span>
                      <span className="text-sm font-bold text-foreground">{messagingData.messagesToday}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Mensagens esta semana</span>
                      <span className="text-sm font-bold text-foreground">{messagingData.messagesThisWeek}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border border-border" data-testid="messaging-no-data">
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum dado de mensagens disponível</p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}

export function AnalyticsContent() {
  const { user } = useMarketplace();

  const { data, isLoading, error } = useQuery<CompanyAnalyticsData>({
    queryKey: [`/api/companies/${user?.id}/public-stats`],
    enabled: !!user?.id && user?.role === 'company',
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[40vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Carregando analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[40vh]">
        <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
          <AlertCircle className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Erro ao carregar analytics</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Não foi possível carregar suas métricas.
        </p>
      </div>
    );
  }

  const acceptanceRateNum = parseFloat(data.acceptanceRate) || 0;
  const completionRate = data.acceptedApplications > 0 ? ((data.totalCollaborations / data.acceptedApplications) * 100) : 0;

  const insights: InsightCardProps[] = [];

  if (acceptanceRateNum < 30 && data.totalApplications > 5) {
    insights.push({
      title: 'Taxa de aceitação baixa',
      description: `Sua taxa de ${data.acceptanceRate} está abaixo da média. Considere revisar os critérios das campanhas.`,
      icon: <TrendingDown className="h-4 w-4" />,
      type: 'warning',
      action: { label: 'Ver campanhas', href: '/campaigns' },
    });
  }

  if (data.activeCampaigns === 0 && data.totalCampaigns > 0) {
    insights.push({
      title: 'Nenhuma campanha ativa',
      description: 'Você não tem campanhas recebendo aplicações. Crie uma nova para atrair criadores.',
      icon: <Target className="h-4 w-4" />,
      type: 'info',
      action: { label: 'Criar campanha', href: '/create-campaign' },
    });
  }

  if (data.avgRating >= 4.5 && data.totalReviews >= 5) {
    insights.push({
      title: 'Excelente reputação!',
      description: `Sua avaliação de ${data.avgRating.toFixed(1)} estrelas é excepcional. Continue assim!`,
      icon: <Star className="h-4 w-4" />,
      type: 'success',
    });
  }

  if (completionRate >= 80 && data.acceptedApplications >= 3) {
    insights.push({
      title: 'Alta taxa de conclusão',
      description: `${completionRate.toFixed(0)}% das colaborações são finalizadas com sucesso.`,
      icon: <CheckCircle className="h-4 w-4" />,
      type: 'success',
    });
  }

  return (
    <div data-testid="analytics-content">
      <Tabs defaultValue="visao-geral" className="w-full">
        <TabsList className="grid w-full max-w-lg mb-8 grid-cols-2">
          <TabsTrigger value="visao-geral" data-testid="tab-trigger-visao-geral">
            <BarChart3 className="h-4 w-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="minhas-redes" data-testid="tab-trigger-minhas-redes">
            <Instagram className="h-4 w-4 mr-2" />
            Minhas Redes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral">
          <VisaoGeralTab data={data} insights={insights} financialMetrics={data.financialMetrics} />
        </TabsContent>

        <TabsContent value="minhas-redes">
          <MinhasRedesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
