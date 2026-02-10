import { useState } from 'react';
import { useMarketplace } from '@/lib/provider';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardHeading, CardFooter, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Calendar, DollarSign, Briefcase, X, ArrowRight, TrendingUp, CheckCircle, Clock, FileText, MoreHorizontal, Eye, Mail, Users, XCircle, Building2, Loader2, ExternalLink, Inbox, Zap, Sparkles, Target, MessageSquare, Star } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { StatsCard, StatsGrid } from '@/components/ui/stats-card';
import { MiniChart } from '@/components/ui/mini-chart';
import { Badge } from '@/components/ui/badge-2';
import { Badge as BadgeUI } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { queryClient } from "@/lib/queryClient";
import type { Campaign, User, CampaignInvite } from "@shared/schema";

type InviteWithDetails = CampaignInvite & {
  campaign: Campaign;
  company: User;
};

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

export default function CreatorDashboard() {
  const { user, getUserApplications, campaigns } = useMarketplace();
  const queryClientHook = useQueryClient();
  const [applicationToDelete, setApplicationToDelete] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"candidaturas" | "convites">("candidaturas");
  const [inviteSubTab, setInviteSubTab] = useState<"pending" | "all">("pending");
  const [processingInviteId, setProcessingInviteId] = useState<number | null>(null);

  const { data: pendingInvites = [], isLoading: loadingPending } = useQuery<InviteWithDetails[]>({
    queryKey: ["/api/invites/pending"],
    queryFn: async () => {
      const res = await fetch("/api/invites/pending", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch pending invites");
      return res.json();
    },
    enabled: !!user && user.role === "creator",
  });

  const { data: allInvites = [], isLoading: loadingAll } = useQuery<InviteWithDetails[]>({
    queryKey: ["/api/invites"],
    queryFn: async () => {
      const res = await fetch("/api/invites", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch all invites");
      return res.json();
    },
    enabled: !!user && user.role === "creator" && inviteSubTab === "all",
  });

  const { data: userRating = { average: 0, count: 0 } } = useQuery<{ average: number; count: number }>({
    queryKey: [`/api/users/${user?.id}/rating`],
    queryFn: async () => {
      const res = await fetch(`/api/users/${user?.id}/rating`, { credentials: "include" });
      if (!res.ok) return { average: 0, count: 0 };
      return res.json();
    },
    enabled: !!user,
  });

  const { data: commissions = [] } = useQuery<Array<{
    id: number;
    campaignId: number;
    creatorId: number;
    saleId: number;
    amount: number;
    status: string;
    createdAt: string;
  }>>({
    queryKey: ["/api/creator/commissions"],
    queryFn: async () => {
      const res = await fetch("/api/creator/commissions", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user && user.role === "creator",
  });

  if (!user) return null;

  const totalEarnings = commissions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const pendingEarnings = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.amount || 0), 0);
  const paidEarnings = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.amount || 0), 0);

  const myApplications = getUserApplications(user.id);

  const unsubscribeMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to unsubscribe');
    },
    onSuccess: () => {
      queryClientHook.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClientHook.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast.success('Candidatura cancelada com sucesso!');
      setApplicationToDelete(null);
    },
    onError: () => {
      toast.error('Erro ao cancelar candidatura');
    },
  });

  const acceptInviteMutation = useMutation({
    mutationFn: async (inviteId: number) => {
      setProcessingInviteId(inviteId);
      const res = await fetch(`/api/invites/${inviteId}/accept`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to accept invite");
      }
      return res.json();
    },
    onSuccess: async (data) => {
      if (data.application) {
        queryClient.setQueryData(["/api/applications"], (old: any[] | undefined) => {
          const current = old ?? [];
          const exists = current.some((app: any) => app.id === data.application.id);
          return exists ? current : [...current, data.application];
        });
        queryClient.setQueryData(["/api/applications/active"], (old: any[] | undefined) => {
          const current = old ?? [];
          const exists = current.some((app: any) => app.id === data.application.id);
          return exists ? current : [...current, data.application];
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/applications"], exact: true, refetchType: 'all' });
      await queryClient.invalidateQueries({ queryKey: ["/api/applications/active"], exact: true, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["/api/invites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invites/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invites/count"] });
      setProcessingInviteId(null);
      toast.success("Convite aceito!", {
        description: "Você agora faz parte desta campanha. Acesse suas campanhas ativas.",
      });
    },
    onError: (error: Error) => {
      setProcessingInviteId(null);
      toast.error("Erro ao aceitar convite", {
        description: error.message,
      });
    },
  });

  const declineInviteMutation = useMutation({
    mutationFn: async (inviteId: number) => {
      setProcessingInviteId(inviteId);
      const res = await fetch(`/api/invites/${inviteId}/decline`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to decline invite");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invites/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invites/count"] });
      setProcessingInviteId(null);
      toast.success("Convite recusado", {
        description: "O convite foi recusado com sucesso.",
      });
    },
    onError: (error: Error) => {
      setProcessingInviteId(null);
      toast.error("Erro ao recusar convite", {
        description: error.message,
      });
    },
  });

  const acceptedCount = myApplications.filter(a => a.status === 'accepted').length;
  const pendingCount = myApplications.filter(a => a.status === 'pending').length;
  const rejectedCount = myApplications.filter(a => a.status === 'rejected').length;

  const weeklyData = [
    { label: "Seg", value: 20 },
    { label: "Ter", value: 45 },
    { label: "Qua", value: 30 },
    { label: "Qui", value: 60 },
    { label: "Sex", value: 75 },
    { label: "Sáb", value: 50 },
    { label: "Dom", value: 35 },
  ];

  const getInviteStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <BadgeUI variant="outline" className="border-amber-500 text-amber-600">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </BadgeUI>
        );
      case "accepted":
        return (
          <BadgeUI className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aceito
          </BadgeUI>
        );
      case "declined":
        return (
          <BadgeUI variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Recusado
          </BadgeUI>
        );
      default:
        return null;
    }
  };

  const invites = inviteSubTab === "pending" ? pendingInvites : allInvites;
  const isLoadingInvites = inviteSubTab === "pending" ? loadingPending : loadingAll;

  return (
    <motion.div 
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Minhas Candidaturas"
          description="Acompanhe o status das suas propostas e convites."
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "candidaturas" | "convites")} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="candidaturas" data-testid="tab-applications">
              <Briefcase className="h-4 w-4 mr-2" />
              Candidaturas
              {myApplications.length > 0 && (
                <BadgeUI variant="secondary" className="ml-2 h-5 px-1.5">
                  {myApplications.length}
                </BadgeUI>
              )}
            </TabsTrigger>
            <TabsTrigger value="convites" data-testid="tab-invites">
              <Mail className="h-4 w-4 mr-2" />
              Convites
              {pendingInvites.length > 0 && (
                <BadgeUI variant="default" className="ml-2 h-5 px-1.5">
                  {pendingInvites.length}
                </BadgeUI>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="candidaturas" className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatsCard
                title="Total Candidaturas"
                value={myApplications.length}
                icon={<FileText className="h-5 w-5" />}
                subtitle="Todas as aplicações"
              />
              <StatsCard
                title="Aceitas"
                value={acceptedCount}
                icon={<CheckCircle className="h-5 w-5" />}
                subtitle="Parcerias confirmadas"
                className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent"
              />
              <StatsCard
                title="Pendentes"
                value={pendingCount}
                icon={<Clock className="h-5 w-5" />}
                subtitle="Aguardando resposta"
                className={pendingCount > 0 ? "border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent" : ""}
              />
              <StatsCard
                title="Taxa de Sucesso"
                value={myApplications.length > 0 ? Math.round((acceptedCount / myApplications.length) * 100) : 0}
                valueSuffix="%"
                icon={<TrendingUp className="h-5 w-5" />}
                subtitle="Aprovações"
              />
              <StatsCard
                title="Sua Avaliação"
                value={userRating.average > 0 ? userRating.average.toFixed(1) : '-'}
                icon={<Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />}
                subtitle={userRating.count > 0 ? `${userRating.count} avaliações` : "Sem avaliações"}
                className={userRating.average >= 4 ? "border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent" : ""}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="border-b border-border">
                    <CardHeading>
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle>Candidaturas Recentes</CardTitle>
                          <p className="text-sm text-muted-foreground">Suas últimas aplicações</p>
                        </div>
                      </div>
                    </CardHeading>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                      {myApplications.slice(0, 5).map((app, index) => {
                        const campaign = campaigns.find(c => c.id === app.campaignId);
                        if (!campaign) return null;

                        return (
                          <motion.div
                            key={app.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group p-4 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border hover:border-primary/20 transition-all cursor-pointer"
                            onClick={() => window.location.href = app.status === 'accepted' ? `/campaign/${campaign.id}/workspace` : `/campaign/${campaign.id}`}
                            data-testid={`recent-application-${app.id}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                    {campaign.title}
                                  </h4>
                                  <StatusBadge status={app.status} />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{campaign.description}</p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {app.appliedAt ? format(app.appliedAt, 'dd MMM') : 'N/A'}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    {campaign.budget}
                                  </span>
                                </div>
                              </div>
                              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-2" />
                            </div>
                          </motion.div>
                        );
                      })}

                      {myApplications.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-50" />
                          <p className="font-medium">Nenhuma candidatura ainda</p>
                          <p className="text-sm mt-1">Explore as campanhas no Feed!</p>
                          <Button variant="outline" className="mt-4" asChild>
                            <Link href="/feed">
                              Ver Oportunidades
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      )}

                      {myApplications.length > 5 && (
                        <div className="text-center pt-2">
                          <Button variant="ghost" size="sm" className="text-primary" asChild>
                            <Link href="/applications">
                              Ver todas ({myApplications.length})
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="border-b border-border">
                  <CardHeading>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Candidaturas</CardTitle>
                        <p className="text-sm text-muted-foreground">Últimos 7 dias</p>
                      </div>
                    </div>
                  </CardHeading>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <MiniChart data={weeklyData} title="Visualizações" />
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                      <span className="text-sm text-muted-foreground">Aceitas</span>
                    </div>
                    <span className="font-bold text-foreground">{acceptedCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10">
                        <Clock className="w-4 h-4 text-amber-500" />
                      </div>
                      <span className="text-sm text-muted-foreground">Pendentes</span>
                    </div>
                    <span className="font-bold text-foreground">{pendingCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-red-500/10">
                        <X className="w-4 h-4 text-red-500" />
                      </div>
                      <span className="text-sm text-muted-foreground">Recusadas</span>
                    </div>
                    <span className="font-bold text-foreground">{rejectedCount}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Earnings and Active Campaigns Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader className="border-b border-border">
                  <CardHeading>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <DollarSign className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <CardTitle>Seus Ganhos</CardTitle>
                        <p className="text-sm text-muted-foreground">Comissões e pagamentos</p>
                      </div>
                    </div>
                  </CardHeading>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20">
                    <p className="text-sm text-muted-foreground mb-1">Total Ganho</p>
                    <p className="text-3xl font-bold text-green-600">
                      R$ {totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10">
                        <Clock className="w-4 h-4 text-amber-500" />
                      </div>
                      <span className="text-sm text-muted-foreground">Pendente</span>
                    </div>
                    <span className="font-bold text-amber-600">
                      R$ {pendingEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                      <span className="text-sm text-muted-foreground">Pago</span>
                    </div>
                    <span className="font-bold text-green-600">
                      R$ {paidEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/my-commissions">
                      Ver Detalhes
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader className="border-b border-border">
                  <CardHeading>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Target className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Campanhas Ativas</CardTitle>
                        <p className="text-sm text-muted-foreground">Progresso das suas parcerias</p>
                      </div>
                    </div>
                  </CardHeading>
                </CardHeader>
                <CardContent className="pt-6">
                  {myApplications.filter(a => a.status === 'accepted').length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma campanha ativa no momento</p>
                      <Button variant="outline" size="sm" className="mt-4" asChild>
                        <Link href="/feed">
                          Explorar Campanhas
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                      {myApplications.filter(a => a.status === 'accepted').slice(0, 5).map((app) => {
                        const campaign = campaigns.find(c => c.id === app.campaignId);
                        if (!campaign) return null;
                        
                        const workflowProgress = app.workflowStatus === 'entregue' ? 100 :
                          app.workflowStatus === 'produzindo' ? 60 :
                          app.workflowStatus === 'briefing' ? 30 :
                          app.workflowStatus === 'aceito' ? 15 : 0;
                        
                        return (
                          <div
                            key={app.id}
                            className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border hover:border-primary/20 transition-all cursor-pointer"
                            onClick={() => window.location.href = `/campaign/${campaign.id}/workspace`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-sm truncate">{campaign.title}</h4>
                              <BadgeUI variant="outline" className="text-xs capitalize">
                                {app.workflowStatus || 'aceito'}
                              </BadgeUI>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 mb-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${workflowProgress}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{workflowProgress}% completo</span>
                              <span>{campaign.budget}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </TabsContent>

          <TabsContent value="convites" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Convites de Campanha</h2>
                  <p className="text-muted-foreground text-sm">
                    Empresas que te convidaram para participar de campanhas
                  </p>
                </div>
              </div>
              {pendingInvites.length > 0 && (
                <BadgeUI variant="secondary" className="text-sm">
                  {pendingInvites.length} pendente{pendingInvites.length > 1 ? "s" : ""}
                </BadgeUI>
              )}
            </div>

            <Tabs value={inviteSubTab} onValueChange={(v) => setInviteSubTab(v as "pending" | "all")}>
              <TabsList>
                <TabsTrigger value="pending" data-testid="tab-pending-invites">
                  Pendentes
                  {pendingInvites.length > 0 && (
                    <BadgeUI variant="default" className="ml-2 h-5 px-1.5">
                      {pendingInvites.length}
                    </BadgeUI>
                  )}
                </TabsTrigger>
                <TabsTrigger value="all" data-testid="tab-all-invites">
                  Todos
                </TabsTrigger>
              </TabsList>

              <TabsContent value={inviteSubTab} className="mt-6">
                {isLoadingInvites ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : invites.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        {inviteSubTab === "pending"
                          ? "Nenhum convite pendente"
                          : "Nenhum convite recebido"}
                      </h3>
                      <p className="text-muted-foreground text-center max-w-md">
                        {inviteSubTab === "pending"
                          ? "Quando empresas te convidarem para campanhas, os convites aparecerão aqui."
                          : "Você ainda não recebeu nenhum convite de campanha."}
                      </p>
                      <Button asChild className="mt-4" variant="outline">
                        <Link href="/feed">
                          Explorar Campanhas Disponíveis
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {invites.map((invite) => (
                      <Card
                        key={invite.id}
                        className={`transition-all ${
                          invite.status === "pending"
                            ? "border-primary/50 shadow-md"
                            : ""
                        }`}
                        data-testid={`invite-card-${invite.id}`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={invite.company.avatar ?? undefined} />
                                <AvatarFallback>
                                  <Building2 className="h-6 w-6" />
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-lg">
                                  {invite.campaign.title}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {invite.company.companyName || invite.company.name}
                                </CardDescription>
                              </div>
                            </div>
                            {getInviteStatusBadge(invite.status)}
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {invite.campaign.description}
                          </p>

                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <DollarSign className="h-4 w-4" />
                              <span>{invite.campaign.budget}</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>{invite.campaign.deadline}</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>
                                {invite.campaign.creatorsNeeded} criador
                                {invite.campaign.creatorsNeeded > 1 ? "es" : ""}
                              </span>
                            </div>
                          </div>

                          {invite.campaign.targetNiche &&
                            invite.campaign.targetNiche.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {invite.campaign.targetNiche.map((niche, i) => (
                                  <BadgeUI key={i} variant="secondary" className="text-xs">
                                    {niche}
                                  </BadgeUI>
                                ))}
                              </div>
                            )}

                          <p className="text-xs text-muted-foreground">
                            Convite recebido em{" "}
                            {(() => {
                              try {
                                const date = invite.createdAt instanceof Date 
                                  ? invite.createdAt 
                                  : typeof invite.createdAt === 'string'
                                    ? parseISO(invite.createdAt)
                                    : new Date(invite.createdAt);
                                return format(date, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
                              } catch {
                                return 'data não disponível';
                              }
                            })()}
                          </p>
                        </CardContent>

                        <CardFooter className="flex gap-2 pt-4 border-t">
                          {invite.status === "pending" ? (
                            <>
                              <Button
                                className="flex-1"
                                onClick={() => acceptInviteMutation.mutate(invite.id)}
                                disabled={processingInviteId === invite.id}
                                data-testid={`button-accept-invite-${invite.id}`}
                              >
                                {processingInviteId === invite.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                )}
                                Aceitar Convite
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => declineInviteMutation.mutate(invite.id)}
                                disabled={processingInviteId === invite.id}
                                data-testid={`button-decline-invite-${invite.id}`}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Recusar
                              </Button>
                            </>
                          ) : invite.status === "accepted" ? (
                            <Button asChild className="flex-1">
                              <Link href="/active-campaigns">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Ver Campanhas Ativas
                              </Link>
                            </Button>
                          ) : (
                            <p className="text-sm text-muted-foreground w-full text-center">
                              Este convite foi recusado
                            </p>
                          )}
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </motion.div>

      <AlertDialog open={applicationToDelete !== null} onOpenChange={(open) => !open && setApplicationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Deseja realmente cancelar sua inscrição?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao cancelar, sua candidatura será removida e a campanha voltará a aparecer no feed de oportunidades. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-unsubscribe" disabled={unsubscribeMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => applicationToDelete && unsubscribeMutation.mutate(applicationToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-unsubscribe"
              disabled={unsubscribeMutation.isPending}
            >
              {unsubscribeMutation.isPending ? 'Removendo...' : 'Cancelar inscrição'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
