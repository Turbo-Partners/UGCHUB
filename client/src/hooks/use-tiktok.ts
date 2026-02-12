import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface TikTokAccount {
  id: number;
  uniqueId: string;
  nickname?: string;
  avatarUrl?: string;
  verified: boolean;
  followers: number;
  following: number;
  hearts: number;
  videoCount: number;
  signature?: string;
  lastSyncedAt?: string;
  connectedAt?: string;
  tokenExpired: boolean;
}

interface TikTokAccountResponse {
  connected: boolean;
  account?: TikTokAccount;
}

export function useTikTokAccount() {
  const { data, isLoading, error, refetch } = useQuery<TikTokAccountResponse>({
    queryKey: ["/api/tiktok/account"],
    refetchOnWindowFocus: true,
  });

  return {
    connected: data?.connected ?? false,
    account: data?.account ?? null,
    isLoading,
    error,
    refetch,
  };
}

export function useDisconnectTikTok() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/tiktok/oauth/disconnect");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tiktok/account"] });
      toast({
        title: "TikTok desconectado",
        description: "Sua conta do TikTok foi desconectada.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível desconectar o TikTok.",
        variant: "destructive",
      });
    },
  });
}

export function useSyncTikTok() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tiktok/sync");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tiktok/account"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tiktok/videos"] });
      toast({
        title: "TikTok sincronizado",
        description: "Dados atualizados com sucesso.",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Erro ao sincronizar",
        description: err.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });
}

export function useTikTokVideos(enabled: boolean = true) {
  return useQuery({
    queryKey: ["/api/tiktok/videos"],
    enabled,
  });
}
