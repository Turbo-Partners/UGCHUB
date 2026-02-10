import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Facebook, 
  RefreshCw, 
  Loader2, 
  Check, 
  AlertCircle, 
  Link as LinkIcon,
  DollarSign,
  TrendingUp,
  Eye,
  BarChart3
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

interface MetaAdAccount {
  id: number;
  metaUserId: string;
  metaUserName: string;
  metaUserEmail: string | null;
  isActive: boolean;
  lastSyncAt: string | null;
  expiresAt: string | null;
}

interface MetaBusinessManager {
  id: number;
  businessId: string;
  businessName: string;
}

interface MetaAdAccountListItem {
  id: number;
  adAccountId: string;
  adAccountName: string;
  currency: string | null;
  timezone: string | null;
  businessId: string | null;
}

interface MetaAccountResponse {
  connected: boolean;
  account?: MetaAdAccount;
  businessManagers?: MetaBusinessManager[];
  adAccounts?: MetaAdAccountListItem[];
}

export function MetaAdsConnection() {
  const [selectedAdAccount, setSelectedAdAccount] = useState<string | null>(null);

  const { data: metaData, isLoading, refetch } = useQuery<MetaAccountResponse>({
    queryKey: ["/api/meta/account"],
    queryFn: async () => {
      const res = await fetch("/api/meta/account", { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) return { connected: false };
        throw new Error("Erro ao carregar conta Meta");
      }
      return res.json();
    },
    staleTime: 30000,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/meta/auth/url", { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao gerar URL de autenticação");
      return res.json();
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error: any) => {
      toast.error("Erro ao conectar", { description: error.message });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/meta/sync", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao sincronizar");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Sincronização concluída!");
      refetch();
    },
    onError: (error: any) => {
      toast.error("Erro na sincronização", { description: error.message });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/meta/disconnect", {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao desconectar");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Conta Meta desconectada");
      queryClient.invalidateQueries({ queryKey: ["/api/meta/account"] });
    },
    onError: (error: any) => {
      toast.error("Erro ao desconectar", { description: error.message });
    },
  });

  const { data: insightsData, isLoading: isLoadingInsights } = useQuery({
    queryKey: ["/api/meta/insights", selectedAdAccount],
    queryFn: async () => {
      if (!selectedAdAccount) return null;
      const res = await fetch(`/api/meta/insights/${selectedAdAccount}?datePreset=last_30d`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao carregar insights");
      return res.json();
    },
    enabled: !!selectedAdAccount,
  });

  const formatCurrency = (value: number, currency = "BRL") => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("pt-BR").format(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const isConnected = metaData?.connected && metaData.account;
  const isTokenExpiring = metaData?.account?.expiresAt && 
    new Date(metaData.account.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <Card data-testid="card-meta-connection">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Facebook className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Meta Ads</CardTitle>
              <CardDescription>
                Gerencie campanhas do Facebook e Instagram Ads
              </CardDescription>
            </div>
          </div>
          {isConnected && (
            <Badge variant="outline" className="gap-1 text-green-700 border-green-300 bg-green-50">
              <Check className="h-3 w-3" />
              Conectado
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Conecte sua conta do Facebook para gerenciar anúncios, 
                visualizar métricas e otimizar campanhas.
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Métricas em tempo real
                </span>
                <span className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" /> Contas de anúncios
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> Gerenciar gastos
                </span>
              </div>
            </div>
            <Button
              data-testid="button-connect-meta"
              onClick={() => connectMutation.mutate()}
              disabled={connectMutation.isPending}
              className="gap-2"
            >
              {connectMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LinkIcon className="h-4 w-4" />
              )}
              Conectar conta Meta
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Facebook className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{metaData.account?.metaUserName}</p>
                  <p className="text-sm text-muted-foreground">
                    {metaData.account?.metaUserEmail || "Conta conectada"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isTokenExpiring && (
                  <Badge variant="outline" className="gap-1 text-amber-700 border-amber-300 bg-amber-50">
                    <AlertCircle className="h-3 w-3" />
                    Token expirando
                  </Badge>
                )}
                <Button
                  data-testid="button-sync-meta"
                  variant="outline"
                  size="sm"
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                >
                  {syncMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {metaData.adAccounts && metaData.adAccounts.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Contas de Anúncio</p>
                <div className="grid gap-2">
                  {metaData.adAccounts.map((acc) => (
                    <button
                      key={acc.id}
                      data-testid={`button-select-ad-account-${acc.adAccountId}`}
                      onClick={() => setSelectedAdAccount(
                        selectedAdAccount === acc.adAccountId ? null : acc.adAccountId
                      )}
                      className={`flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${
                        selectedAdAccount === acc.adAccountId
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div>
                        <p className="font-medium text-sm">{acc.adAccountName}</p>
                        <p className="text-xs text-muted-foreground">
                          ID: {acc.adAccountId} • {acc.currency} • {acc.timezone}
                        </p>
                      </div>
                      <Eye className={`h-4 w-4 ${
                        selectedAdAccount === acc.adAccountId ? "text-primary" : "text-muted-foreground"
                      }`} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedAdAccount && (
              <div className="space-y-3">
                <Separator />
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Insights (últimos 30 dias)</p>
                  {isLoadingInsights && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                {insightsData?.data?.[0] ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Impressões</p>
                      <p className="text-lg font-semibold">
                        {formatNumber(parseInt(insightsData.data[0].impressions || "0"))}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Alcance</p>
                      <p className="text-lg font-semibold">
                        {formatNumber(parseInt(insightsData.data[0].reach || "0"))}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Cliques</p>
                      <p className="text-lg font-semibold">
                        {formatNumber(parseInt(insightsData.data[0].clicks || "0"))}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Gasto</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(parseFloat(insightsData.data[0].spend || "0"))}
                      </p>
                    </div>
                  </div>
                ) : (
                  !isLoadingInsights && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum insight disponível para o período selecionado.
                    </p>
                  )
                )}
              </div>
            )}

            <Separator />

            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                {metaData.account?.lastSyncAt && (
                  <>Última sincronização: {new Date(metaData.account.lastSyncAt).toLocaleString("pt-BR")}</>
                )}
              </p>
              <Button
                data-testid="button-disconnect-meta"
                variant="ghost"
                size="sm"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                className="text-destructive hover:text-destructive"
              >
                {disconnectMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Desconectar"
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
