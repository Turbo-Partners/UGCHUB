import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ExternalLink, Check, X, Users, Play, RefreshCw, Heart } from "lucide-react";
import { useTikTokAccount, useDisconnectTikTok, useSyncTikTok } from "@/hooks/use-tiktok";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.19 8.19 0 0 0 4.76 1.52V6.84a4.84 4.84 0 0 1-1-.15z" />
    </svg>
  );
}

export function TikTokIntegration() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { connected, account, isLoading, error } = useTikTokAccount();
  const disconnectMutation = useDisconnectTikTok();
  const syncMutation = useSyncTikTok();

  const handleConnect = () => {
    setIsConnecting(true);
    window.location.href = "/api/tiktok/oauth/authorize?returnTo=/settings";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TikTokIcon className="h-5 w-5" />
            TikTok
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TikTokIcon className="h-5 w-5" />
            TikTok
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Não foi possível carregar as informações do TikTok.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!connected || !account) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TikTokIcon className="h-5 w-5" />
            TikTok
          </CardTitle>
          <CardDescription>
            Conecte sua conta do TikTok para sincronizar métricas e acompanhar performance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <TikTokIcon className="mr-2 h-4 w-4" />
                Conectar TikTok
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              <TikTokIcon className="h-5 w-5" />
              TikTok
            </CardTitle>
            <Badge variant="outline" className="text-green-600 border-green-600">
              <Check className="mr-1 h-3 w-3" />
              Conectado
            </Badge>
          </div>
        </div>
        <CardDescription>
          Sua conta está conectada e sincronizando dados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4">
          {account.avatarUrl ? (
            <img
              src={account.avatarUrl}
              alt={account.uniqueId}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-black flex items-center justify-center">
              <TikTokIcon className="h-8 w-8 text-white" />
            </div>
          )}

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">@{account.uniqueId}</span>
              <a
                href={`https://tiktok.com/@${account.uniqueId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            {account.nickname && (
              <p className="text-muted-foreground">{account.nickname}</p>
            )}

            <div className="flex gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {account.followers.toLocaleString()} seguidores
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {account.hearts.toLocaleString()} curtidas
              </span>
              <span className="flex items-center gap-1">
                <Play className="h-4 w-4" />
                {account.videoCount.toLocaleString()} vídeos
              </span>
            </div>

            {account.lastSyncedAt && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                Última sincronização: {new Date(account.lastSyncedAt).toLocaleString("pt-BR")}
              </p>
            )}

            {account.tokenExpired && (
              <Alert className="mt-2">
                <AlertDescription className="text-sm">
                  Token expirado. Reconecte sua conta para continuar sincronizando.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending || account.tokenExpired}
          >
            {syncMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sincronizar Agora
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => disconnectMutation.mutate()}
            disabled={disconnectMutation.isPending}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {disconnectMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Desconectando...
              </>
            ) : (
              <>
                <X className="mr-2 h-4 w-4" />
                Desconectar
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { TikTokIcon };
