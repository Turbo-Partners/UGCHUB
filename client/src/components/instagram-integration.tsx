import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Instagram, ExternalLink, Check, X, Users, Image, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface InstagramAccount {
  id: number;
  username: string;
  name?: string;
  profilePictureUrl?: string;
  followersCount?: number;
  followsCount?: number;
  mediaCount?: number;
  isActive: boolean;
  lastSyncAt?: string;
}

interface InstagramAccountResponse {
  connected: boolean;
  account?: InstagramAccount;
}

export function InstagramIntegration() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<InstagramAccountResponse>({
    queryKey: ["/api/instagram/account"],
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/instagram/account");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instagram/account"] });
      toast({
        title: "Instagram desconectado",
        description: "Sua conta do Instagram foi desconectada.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível desconectar o Instagram.",
        variant: "destructive",
      });
    },
  });

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      // Redirect directly to Instagram OAuth flow for creators
      window.location.href = "/api/auth/instagram/start?type=creator";
    } catch (err) {
      console.error("[Instagram] Connect error:", err);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a conexão com o Instagram.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5" />
            Instagram
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
            <Instagram className="h-5 w-5" />
            Instagram
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Não foi possível carregar as informações do Instagram.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!data?.connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5" />
            Instagram
          </CardTitle>
          <CardDescription>
            Conecte sua conta do Instagram para receber menções automaticamente e gerenciar DMs.
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
                Conectando...
              </>
            ) : (
              <>
                <Instagram className="mr-2 h-4 w-4" />
                Conectar Instagram
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const account = data.account!;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              <Instagram className="h-5 w-5" />
              Instagram
            </CardTitle>
            <Badge variant="outline" className="text-green-600 border-green-600">
              <Check className="mr-1 h-3 w-3" />
              Conectado
            </Badge>
          </div>
        </div>
        <CardDescription>
          Sua conta está conectada e recebendo menções em tempo real.
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

        <div className="mt-6 pt-4 border-t">
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
