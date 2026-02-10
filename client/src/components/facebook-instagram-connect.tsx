import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Instagram, Check, X, Users, Image, ExternalLink, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface InstagramAccount {
  id: number;
  username: string;
  name?: string;
  profilePictureUrl?: string;
  followersCount?: number;
  mediaCount?: number;
  isActive: boolean;
  lastSyncAt?: string;
}

interface InstagramAccountResponse {
  connected: boolean;
  account?: InstagramAccount;
}

interface FacebookInstagramConnectProps {
  connectionType?: "business" | "creator";
}

export function FacebookInstagramConnect({ connectionType = "business" }: FacebookInstagramConnectProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');
  const [syncResult, setSyncResult] = useState<{ postsSync: number; totalPages: number } | null>(null);

  const { data: accountData, isLoading: accountLoading } = useQuery<InstagramAccountResponse>({
    queryKey: ["/api/instagram/account"],
  });

  // Handle OAuth callback messages from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const instagramConnected = urlParams.get("instagram_connected");
    const username = urlParams.get("username");
    const error = urlParams.get("error");
    const message = urlParams.get("message");

    if (instagramConnected === "true" && username) {
      toast({
        title: "Instagram conectado!",
        description: `Conta @${username} conectada com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/instagram/account"] });

      const startSync = urlParams.get("start_sync");
      if (startSync === "true") {
        setSyncStatus('syncing');
        fetch("/api/instagram/sync-full", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        })
          .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
          })
          .then(data => {
            if (!data.success) throw new Error(data.error || "Sync failed");
            setSyncStatus('done');
            setSyncResult(data);
            toast({
              title: "Sincronização concluída!",
              description: `${data.postsSync} posts importados do Instagram.`,
            });
            queryClient.invalidateQueries({ queryKey: ["/api/instagram/account"] });
          })
          .catch(err => {
            setSyncStatus('error');
            console.error("Sync failed:", err);
            toast({
              title: "Erro na sincronização",
              description: "Você pode tentar novamente mais tarde.",
              variant: "destructive",
            });
          });
      }

      window.history.replaceState({}, "", window.location.pathname);
    } else if (error) {
      toast({
        title: "Erro ao conectar Instagram",
        description: message ? decodeURIComponent(message) : `Erro: ${error}`,
        variant: "destructive",
      });
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [location, toast, queryClient]);

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/instagram/account", {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to disconnect");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instagram/account"] });
      toast({
        title: "Instagram desconectado",
        description: "Sua conta foi desconectada.",
      });
    },
  });

  const handleConnect = () => {
    setIsConnecting(true);
    window.location.href = `/api/auth/instagram/start?type=${connectionType}`;
  };

  const handleManualSync = () => {
    setSyncStatus('syncing');
    setSyncResult(null);
    fetch("/api/instagram/sync-full", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (!data.success) throw new Error(data.error || "Sync failed");
        setSyncStatus('done');
        setSyncResult(data);
        toast({
          title: "Sincronização concluída!",
          description: `${data.postsSync} posts importados do Instagram.`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/instagram/account"] });
      })
      .catch(err => {
        setSyncStatus('error');
        console.error("Sync failed:", err);
        toast({
          title: "Erro na sincronização",
          description: "Você pode tentar novamente mais tarde.",
          variant: "destructive",
        });
      });
  };

  if (accountLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5" />
            Instagram Business
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!accountData?.connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5" />
            Instagram Business
          </CardTitle>
          <CardDescription>
            Conecte sua conta do Instagram Business para receber menções e gerenciar DMs automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            data-testid="button-connect-instagram"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecionando...
              </>
            ) : (
              <>
                <Instagram className="mr-2 h-4 w-4" />
                Conectar Instagram
              </>
            )}
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            Você será redirecionado para o Instagram para autorizar a conexão.
          </p>
        </CardContent>
      </Card>
    );
  }

  const account = accountData.account!;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              <Instagram className="h-5 w-5" />
              Instagram Business
            </CardTitle>
            <Badge variant="outline" className="text-green-600 border-green-600">
              <Check className="mr-1 h-3 w-3" />
              Conectado
            </Badge>
          </div>
        </div>
        <CardDescription>
          Sua conta está conectada e recebendo webhooks.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4">
          {account.profilePictureUrl ? (
            <img
              src={account.profilePictureUrl}
              alt={account.username}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Instagram className="h-8 w-8 text-white" />
            </div>
          )}

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">@{account.username}</span>
              <a
                href={`https://instagram.com/${account.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            {account.name && (
              <p className="text-muted-foreground">{account.name}</p>
            )}

            <div className="flex gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {account.followersCount?.toLocaleString() || 0} seguidores
              </span>
              <span className="flex items-center gap-1">
                <Image className="h-4 w-4" />
                {account.mediaCount?.toLocaleString() || 0} posts
              </span>
            </div>

            {account.lastSyncAt && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                Última sincronização: {new Date(account.lastSyncAt).toLocaleString("pt-BR")}
              </p>
            )}
          </div>
        </div>

        {syncStatus === 'syncing' && (
          <Card className="mt-4 border-blue-200 bg-blue-50">
            <CardContent className="flex items-center gap-3 py-4">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-sm text-blue-700" data-testid="text-sync-progress">
                Sincronizando histórico do Instagram... Isso pode levar alguns minutos.
              </span>
            </CardContent>
          </Card>
        )}

        {syncStatus === 'done' && syncResult && (
          <Card className="mt-4 border-green-200 bg-green-50">
            <CardContent className="flex items-center gap-3 py-4">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-700" data-testid="text-sync-done">
                Sincronização concluída! {syncResult.postsSync} posts importados.
              </span>
            </CardContent>
          </Card>
        )}

        {syncStatus === 'error' && (
          <Card className="mt-4 border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm text-red-700" data-testid="text-sync-error">
                Erro na sincronização. Tente novamente.
              </span>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 pt-4 border-t flex items-center gap-3">
          {syncStatus !== 'syncing' && (
            <Button
              variant="outline"
              onClick={handleManualSync}
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              data-testid="button-sync-instagram"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Sincronizar Posts
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => disconnectMutation.mutate()}
            disabled={disconnectMutation.isPending}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            data-testid="button-disconnect-instagram"
          >
            {disconnectMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Desconectando...
              </>
            ) : (
              <>
                <X className="mr-2 h-4 w-4" />
                Desconectar Instagram
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
