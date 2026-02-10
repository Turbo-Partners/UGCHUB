import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, Copy, RefreshCw, Users, TrendingUp, Instagram,
  CheckCircle2, AlertCircle, Clock, Loader2, Megaphone,
  Eye, DollarSign, MousePointer, Percent, BarChart3, 
  Link2, Send, Play, Pause, Target, Image, UserPlus
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CreatorPartner {
  id: number;
  companyId: number;
  creatorId: number | null;
  instagramUserId: string | null;
  instagramUsername: string | null;
  instagramProfilePic: string | null;
  status: "pending" | "request_sent" | "active" | "expired" | "revoked";
  authorizedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface Campaign {
  id: number;
  name: string;
  status: "draft" | "pending" | "active" | "paused" | "completed" | "failed";
  objective: string;
  dailyBudget: number | null;
  lifetimeBudget: number | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

interface DashboardData {
  connected: boolean;
  adAccountName: string | null;
  currency: string;
  partnersSummary: {
    total: number;
    active: number;
    pending: number;
  };
  campaignsSummary: {
    total: number;
    active: number;
    draft: number;
  };
  performance: {
    impressions: number;
    reach: number;
    clicks: number;
    spend: string;
    ctr: string;
    cpc: string;
    conversions: number;
    roas: string;
    engagement: number;
  } | null;
}

interface PartnersResponse {
  partners: CreatorPartner[];
  summary: { total: number; active: number; pending: number; expired: number };
}

interface CampaignsResponse {
  campaigns: Campaign[];
  summary: { total: number; active: number; draft: number; paused: number };
}

interface PerformanceData {
  summary: {
    totalAds: number;
    activeAds: number;
    impressions: number;
    reach: number;
    clicks: number;
    spend: string;
    ctr: string;
    purchases: number;
    revenue: string;
    roas: string;
  };
  ads: Array<{
    id: string;
    name: string;
    status: string;
    impressions: number;
    reach: number;
    clicks: number;
    spend: string;
    ctr: string;
    cpc: string;
    purchases: number;
    revenue: string;
    roas: string;
  }>;
  currency: string;
}

export default function MetaAdsSuite() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [newPartnerUsername, setNewPartnerUsername] = useState("");
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignObjective, setNewCampaignObjective] = useState("conversions");
  const [newCampaignBudget, setNewCampaignBudget] = useState("");

  const { data: dashboardData, isLoading: isLoadingDashboard, refetch: refetchDashboard } = useQuery<DashboardData>({
    queryKey: ["/api/meta-marketing/dashboard"],
  });

  const { data: partnersData, isLoading: isLoadingPartners, refetch: refetchPartners } = useQuery<PartnersResponse>({
    queryKey: ["/api/meta-marketing/creator-partners"],
  });

  const { data: campaignsData, isLoading: isLoadingCampaigns } = useQuery<CampaignsResponse>({
    queryKey: ["/api/meta-marketing/campaigns"],
  });

  const { data: performanceData, isLoading: isLoadingPerformance, refetch: refetchPerformance } = useQuery<PerformanceData>({
    queryKey: ["/api/meta-marketing/partnership-performance"],
  });

  const generateAuthLinkMutation = useMutation({
    mutationFn: async (data: { instagramUsername: string }) => {
      const res = await apiRequest("POST", "/api/partnership/invitations", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Link gerado!",
        description: "Link de convite copiado para a área de transferência. Envie para o criador!",
      });
      navigator.clipboard.writeText(data.invitation.url);
      setNewPartnerUsername("");
      queryClient.invalidateQueries({ queryKey: ["/api/meta-marketing/creator-partners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partnership/invitations"] });
    },
  });

  const sendPartnershipRequestMutation = useMutation({
    mutationFn: async (data: { creatorInstagramUserId: string; partnerId: number }) => {
      const res = await apiRequest("POST", "/api/meta-marketing/partnership-request", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Solicitação enviada!",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/meta-marketing/creator-partners"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar solicitação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const syncPartnershipStatusMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/meta-marketing/partnership-status", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to sync");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Status sincronizado!" });
      queryClient.invalidateQueries({ queryKey: ["/api/meta-marketing/creator-partners"] });
    },
  });

  const addPartnerMutation = useMutation({
    mutationFn: async (data: { instagramUsername: string; status: string }) => {
      const res = await apiRequest("POST", "/api/meta-marketing/creator-partners", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Criador adicionado!" });
      setIsAddPartnerOpen(false);
      setNewPartnerUsername("");
      queryClient.invalidateQueries({ queryKey: ["/api/meta-marketing/creator-partners"] });
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: { name: string; objective: string; dailyBudget?: string }) => {
      const res = await apiRequest("POST", "/api/meta-marketing/campaigns", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Campanha criada!" });
      setIsCreateCampaignOpen(false);
      setNewCampaignName("");
      setNewCampaignBudget("");
      queryClient.invalidateQueries({ queryKey: ["/api/meta-marketing/campaigns"] });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      active: { label: "Ativo", variant: "default" },
      pending: { label: "Pendente", variant: "secondary" },
      request_sent: { label: "Solicitação Enviada", variant: "secondary" },
      expired: { label: "Expirado", variant: "destructive" },
      revoked: { label: "Revogado", variant: "destructive" },
      draft: { label: "Rascunho", variant: "outline" },
      paused: { label: "Pausado", variant: "secondary" },
      completed: { label: "Finalizado", variant: "default" },
      failed: { label: "Falhou", variant: "destructive" },
    };
    const config = statusConfig[status] || { label: status, variant: "outline" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meta Ads Suite</h1>
          <p className="text-muted-foreground">
            Gerencie Partnership Ads com criadores autenticados
          </p>
        </div>
        <Button variant="outline" onClick={() => refetchDashboard()} data-testid="button-refresh-dashboard">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {!dashboardData?.connected && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-10 w-10 text-amber-600" />
              <div>
                <h3 className="font-semibold">Conecte sua conta Meta Business</h3>
                <p className="text-sm text-muted-foreground">
                  Para usar o Meta Ads Suite, você precisa conectar sua conta na página de Integrações.
                </p>
                <Button variant="link" className="p-0 h-auto mt-1" onClick={() => window.location.href = "/company/integrations"}>
                  Ir para Integrações →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="dashboard" data-testid="tab-dashboard">
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="creators" data-testid="tab-creators">
            <Users className="h-4 w-4 mr-2" />
            Criadores
          </TabsTrigger>
          <TabsTrigger value="campaigns" data-testid="tab-campaigns">
            <Megaphone className="h-4 w-4 mr-2" />
            Campanhas
          </TabsTrigger>
          <TabsTrigger value="builder" data-testid="tab-builder">
            <Plus className="h-4 w-4 mr-2" />
            Criar Anúncio
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {isLoadingDashboard ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full bg-blue-100">
                        <Instagram className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{dashboardData?.partnersSummary?.active || 0}</p>
                        <p className="text-sm text-muted-foreground">Criadores Ativos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full bg-green-100">
                        <Megaphone className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{dashboardData?.campaignsSummary?.active || 0}</p>
                        <p className="text-sm text-muted-foreground">Campanhas Ativas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full bg-purple-100">
                        <Eye className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {dashboardData?.performance?.impressions?.toLocaleString() || "0"}
                        </p>
                        <p className="text-sm text-muted-foreground">Impressões (30d)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full bg-amber-100">
                        <TrendingUp className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{dashboardData?.performance?.roas || "0.00"}x</p>
                        <p className="text-sm text-muted-foreground">ROAS (30d)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Performance de Partnership Ads (30 dias)</CardTitle>
                      <CardDescription>Métricas consolidadas de anúncios com branded content</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => refetchPerformance()} data-testid="button-refresh-performance">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Atualizar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingPerformance ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : performanceData?.summary ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <Eye className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xl font-bold">{performanceData.summary.reach.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Alcance</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <MousePointer className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xl font-bold">{performanceData.summary.clicks.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Cliques</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <Percent className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xl font-bold">{performanceData.summary.ctr}%</p>
                        <p className="text-xs text-muted-foreground">CTR</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <DollarSign className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xl font-bold">R$ {performanceData.summary.spend}</p>
                        <p className="text-xs text-muted-foreground">Gasto</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <Target className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xl font-bold">{performanceData.summary.purchases}</p>
                        <p className="text-xs text-muted-foreground">Compras</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <TrendingUp className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xl font-bold">R$ {performanceData.summary.revenue}</p>
                        <p className="text-xs text-muted-foreground">Receita</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>Nenhum Partnership Ad ativo</p>
                      <p className="text-sm mt-1">Crie anúncios com conteúdo de criadores para ver métricas</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="creators" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Criadores Autorizados</h2>
              <p className="text-sm text-muted-foreground">
                Gerencie criadores com permissão para Partnership Ads
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => syncPartnershipStatusMutation.mutate()}
                disabled={syncPartnershipStatusMutation.isPending}
                data-testid="button-sync-status"
              >
                {syncPartnershipStatusMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Sincronizar Status
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-generate-auth-link">
                    <Link2 className="h-4 w-4 mr-2" />
                    Gerar Link de Autenticação
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Gerar Link de Autenticação</DialogTitle>
                    <DialogDescription>
                      Crie um link único para o criador autorizar Partnership Ads com um clique
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Username do Instagram</Label>
                      <Input
                        placeholder="@username"
                        value={newPartnerUsername}
                        onChange={(e) => setNewPartnerUsername(e.target.value)}
                        data-testid="input-auth-username"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => generateAuthLinkMutation.mutate({ instagramUsername: newPartnerUsername })}
                      disabled={!newPartnerUsername || generateAuthLinkMutation.isPending}
                      data-testid="button-generate-link"
                    >
                      {generateAuthLinkMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Copy className="h-4 w-4 mr-2" />
                      )}
                      Gerar e Copiar Link
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isAddPartnerOpen} onOpenChange={setIsAddPartnerOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-partner">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adicionar Criador
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Criador</DialogTitle>
                    <DialogDescription>
                      Adicione manualmente um criador como parceiro de anúncios
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Username do Instagram</Label>
                      <Input
                        placeholder="@username"
                        value={newPartnerUsername}
                        onChange={(e) => setNewPartnerUsername(e.target.value)}
                        data-testid="input-partner-username"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => addPartnerMutation.mutate({ instagramUsername: newPartnerUsername, status: "pending" })}
                      disabled={!newPartnerUsername || addPartnerMutation.isPending}
                      data-testid="button-save-partner"
                    >
                      {addPartnerMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Adicionar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-100">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{partnersData?.summary?.active || 0}</p>
                    <p className="text-sm text-muted-foreground">Ativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-amber-100">
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{partnersData?.summary?.pending || 0}</p>
                    <p className="text-sm text-muted-foreground">Pendentes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-red-100">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{partnersData?.summary?.expired || 0}</p>
                    <p className="text-sm text-muted-foreground">Expirados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              {isLoadingPartners ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : partnersData?.partners && partnersData.partners.length > 0 ? (
                <div className="space-y-3">
                  {partnersData.partners.map((partner: CreatorPartner) => (
                    <div key={partner.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        {partner.instagramProfilePic?.startsWith('/api/storage/') ? (
                          <img src={partner.instagramProfilePic} alt="" className="w-10 h-10 rounded-full" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Instagram className="h-5 w-5 text-white" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">@{partner.instagramUsername}</p>
                          <p className="text-sm text-muted-foreground">
                            {partner.authorizedAt 
                              ? `Autorizado em ${format(new Date(partner.authorizedAt), "dd/MM/yyyy", { locale: ptBR })}`
                              : `Adicionado em ${format(new Date(partner.createdAt), "dd/MM/yyyy", { locale: ptBR })}`
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(partner.status)}
                        {partner.status === "pending" && partner.instagramUserId && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => sendPartnershipRequestMutation.mutate({
                              creatorInstagramUserId: partner.instagramUserId!,
                              partnerId: partner.id,
                            })}
                            disabled={sendPartnershipRequestMutation.isPending}
                            data-testid={`button-send-request-${partner.id}`}
                          >
                            {sendPartnershipRequestMutation.isPending ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4 mr-2" />
                            )}
                            Enviar Solicitação
                          </Button>
                        )}
                        {partner.status === "active" && (
                          <Button variant="outline" size="sm" data-testid={`button-create-ad-${partner.id}`}>
                            <Megaphone className="h-4 w-4 mr-2" />
                            Criar Anúncio
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum criador autorizado ainda</p>
                  <p className="text-sm mt-2">Gere um link de autenticação para convidar criadores</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Campanhas de Partnership Ads</h2>
              <p className="text-sm text-muted-foreground">
                Crie e gerencie campanhas com conteúdo de criadores
              </p>
            </div>
            <Button onClick={() => setIsCreateCampaignOpen(true)} data-testid="button-create-campaign">
              <Plus className="h-4 w-4 mr-2" />
              Nova Campanha
            </Button>
          </div>

          <Dialog open={isCreateCampaignOpen} onOpenChange={setIsCreateCampaignOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Campanha</DialogTitle>
                <DialogDescription>
                  Configure uma nova campanha de Partnership Ads
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome da Campanha</Label>
                  <Input
                    placeholder="Ex: Black Friday Influencers"
                    value={newCampaignName}
                    onChange={(e) => setNewCampaignName(e.target.value)}
                    data-testid="input-campaign-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Objetivo</Label>
                  <Select value={newCampaignObjective} onValueChange={setNewCampaignObjective}>
                    <SelectTrigger data-testid="select-campaign-objective">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conversions">Conversões</SelectItem>
                      <SelectItem value="traffic">Tráfego</SelectItem>
                      <SelectItem value="engagement">Engajamento</SelectItem>
                      <SelectItem value="reach">Alcance</SelectItem>
                      <SelectItem value="awareness">Reconhecimento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Orçamento Diário (R$)</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 100"
                    value={newCampaignBudget}
                    onChange={(e) => setNewCampaignBudget(e.target.value)}
                    data-testid="input-campaign-budget"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => createCampaignMutation.mutate({
                    name: newCampaignName,
                    objective: newCampaignObjective,
                    dailyBudget: newCampaignBudget,
                  })}
                  disabled={!newCampaignName || createCampaignMutation.isPending}
                  data-testid="button-save-campaign"
                >
                  {createCampaignMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Criar Campanha
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-100">
                    <Play className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{campaignsData?.summary?.active || 0}</p>
                    <p className="text-sm text-muted-foreground">Ativas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-gray-100">
                    <Pause className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{campaignsData?.summary?.draft || 0}</p>
                    <p className="text-sm text-muted-foreground">Rascunhos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-100">
                    <Megaphone className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{campaignsData?.summary?.total || 0}</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              {isLoadingCampaigns ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : campaignsData?.campaigns && campaignsData.campaigns.length > 0 ? (
                <div className="space-y-3">
                  {campaignsData.campaigns.map((campaign: Campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
                          <Megaphone className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="capitalize">{campaign.objective}</span>
                            {campaign.dailyBudget && (
                              <span>R$ {campaign.dailyBudget}/dia</span>
                            )}
                            <span>
                              Criada em {format(new Date(campaign.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(campaign.status)}
                        <Button variant="outline" size="sm" data-testid={`button-edit-campaign-${campaign.id}`}>
                          Editar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma campanha criada ainda</p>
                  <p className="text-sm mt-2">Clique em "Nova Campanha" para começar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="builder" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Criar Partnership Ad
              </CardTitle>
              <CardDescription>
                Selecione um criador e configure seu anúncio passo a passo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-6 rounded-lg border-2 border-dashed border-primary bg-primary/5">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">1</span>
                  </div>
                  <h3 className="font-medium mb-1">Selecionar Criador</h3>
                  <p className="text-sm text-muted-foreground">Escolha um criador autorizado</p>
                </div>
                <div className="text-center p-6 rounded-lg border-2 border-dashed opacity-50">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-lg font-bold text-muted-foreground">2</span>
                  </div>
                  <h3 className="font-medium mb-1">Escolher Post</h3>
                  <p className="text-sm text-muted-foreground">Selecione o conteúdo</p>
                </div>
                <div className="text-center p-6 rounded-lg border-2 border-dashed opacity-50">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-lg font-bold text-muted-foreground">3</span>
                  </div>
                  <h3 className="font-medium mb-1">Configurar Targeting</h3>
                  <p className="text-sm text-muted-foreground">Defina o público-alvo</p>
                </div>
                <div className="text-center p-6 rounded-lg border-2 border-dashed opacity-50">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-lg font-bold text-muted-foreground">4</span>
                  </div>
                  <h3 className="font-medium mb-1">Publicar</h3>
                  <p className="text-sm text-muted-foreground">Revise e envie</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">1. Selecione um Criador Autorizado</h3>
                {partnersData?.partners && partnersData.partners.filter((p: CreatorPartner) => p.status === "active").length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {partnersData.partners.filter((p: CreatorPartner) => p.status === "active").map((partner: CreatorPartner) => (
                      <div 
                        key={partner.id} 
                        className="p-4 rounded-lg border hover:border-primary hover:bg-primary/5 cursor-pointer transition-all"
                        data-testid={`select-creator-${partner.id}`}
                      >
                        <div className="flex items-center gap-3">
                          {partner.instagramProfilePic?.startsWith('/api/storage/') ? (
                            <img src={partner.instagramProfilePic} alt="" className="w-12 h-12 rounded-full" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                              <Instagram className="h-6 w-6 text-white" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">@{partner.instagramUsername}</p>
                            <Badge variant="default" className="text-xs">Ativo</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground bg-muted/50 rounded-lg">
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>Nenhum criador ativo disponível</p>
                    <p className="text-sm mt-1">Adicione criadores na aba "Criadores"</p>
                  </div>
                )}
              </div>

              <div className="space-y-4 opacity-50">
                <h3 className="font-medium">2. Escolha o Post do Criador</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                      <Image className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 opacity-50">
                <h3 className="font-medium">3. Configure o Display Handle</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <input type="radio" name="display" id="both" disabled />
                      <label htmlFor="both" className="font-medium">Criador + Marca</label>
                    </div>
                    <p className="text-sm text-muted-foreground">Ex: "nicole and superglow"</p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <input type="radio" name="display" id="creator" disabled />
                      <label htmlFor="creator" className="font-medium">Apenas Criador</label>
                    </div>
                    <p className="text-sm text-muted-foreground">Ex: "nicole"</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
