import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { 
  MessageCircle, Send, RefreshCw, User, Clock, CheckCheck, 
  ArrowLeft, Instagram, Inbox, Search, UserCircle, ExternalLink,
  Heart, MessageSquare, Users, Image, Globe
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { getAvatarUrl } from "@/lib/utils";

interface Conversation {
  conversationId: string;
  participantId: string;
  participantUsername: string | null;
  participantProfilePic: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  isIncoming: boolean;
}

interface MessageAttachment {
  type: string;
  url?: string;
  preview?: string;
  width?: number;
  height?: number;
}

interface Message {
  id: number;
  conversationId: string;
  messageId: string;
  senderId: string;
  senderUsername: string | null;
  recipientId: string;
  recipientUsername: string | null;
  messageText: string | null;
  messageType: string | null;
  attachments: MessageAttachment[] | null;
  isIncoming: boolean;
  isRead: boolean;
  sentAt: string | null;
  createdAt: string;
}

interface ProfileData {
  username: string;
  fullName: string | null;
  bio: string | null;
  profilePicUrl: string | null;
  followers: number | null;
  following: number | null;
  postsCount: number | null;
  isVerified: boolean;
  isPrivate: boolean;
  externalUrl: string | null;
  topPosts?: any[];
  recentPosts?: any[];
  engagementRate: string | null;
}

function ProfileModal({ username, open, onClose }: { username: string; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [enriched, setEnriched] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/instagram/profile", username],
    queryFn: async () => {
      const res = await fetch(`/api/instagram/profile/${encodeURIComponent(username)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
    enabled: open && !!username,
    staleTime: 7 * 24 * 60 * 60 * 1000,
  });

  const enrichMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/instagram/profile/${encodeURIComponent(username)}/enrich`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to enrich");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/instagram/profile", username], data);
      setEnriched(true);
    },
  });

  const profile = data?.profile;
  const recentPosts = profile?.recentPosts || profile?.topPosts || [];
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    if (isLoading) {
      setLoadProgress(0);
      const steps = [15, 30, 50, 70, 85, 95];
      let i = 0;
      const interval = setInterval(() => {
        if (i < steps.length) {
          setLoadProgress(steps[i]);
          i++;
        }
      }, 400);
      return () => clearInterval(interval);
    } else {
      setLoadProgress(100);
    }
  }, [isLoading]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0" data-testid="profile-modal">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 space-y-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-400 animate-pulse" />
              <Instagram className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-white" />
            </div>
            <div className="w-full max-w-xs space-y-2">
              <Progress value={loadProgress} className="h-2" />
              <p className="text-center text-sm text-muted-foreground">
                Carregando perfil de @{username}...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <UserCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Perfil não encontrado</h3>
            <p className="text-muted-foreground text-sm">
              Não foi possível carregar os dados de @{username}. 
              O perfil pode ser privado ou não ser uma conta business.
            </p>
          </div>
        ) : profile ? (
          <div>
            <div className="relative bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 h-32 rounded-t-lg">
              <div className="absolute -bottom-12 left-6">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                  <AvatarImage src={profile.profilePicUrl} alt={username} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                    {username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            <div className="pt-16 px-6 pb-4">
              {data?.source && (
                <div className="mb-2">
                  <Badge variant="outline" className="text-xs" data-testid="badge-data-source">
                    {data.source === 'cache' ? 'Dados locais' : 
                     data.source === 'api' ? 'Instagram API' :
                     data.source === 'apify' ? 'Apify (detalhado)' :
                     data.source === 'messages' ? 'Dados da conversa' :
                     data.source === 'none' ? 'Sem dados' : data.source}
                  </Badge>
                </div>
              )}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2" data-testid="text-profile-name">
                    {profile.fullName || `@${username}`}
                    {profile.isVerified && (
                      <Badge variant="secondary" className="text-blue-500">✓</Badge>
                    )}
                  </h2>
                  <p className="text-muted-foreground" data-testid="text-profile-username">@{username}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://instagram.com/${username}`, '_blank')}
                  data-testid="button-open-instagram"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Instagram
                </Button>
              </div>

              {profile.bio && (
                <p className="mt-3 text-sm whitespace-pre-wrap" data-testid="text-profile-bio">
                  {profile.bio}
                </p>
              )}

              {profile.externalUrl && (
                <a 
                  href={profile.externalUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-2 text-sm text-blue-500 hover:underline flex items-center gap-1"
                >
                  <Globe className="h-3 w-3" />
                  {profile.externalUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              )}

              <div className="grid grid-cols-3 gap-4 mt-6 p-4 bg-muted/50 rounded-lg" data-testid="profile-stats">
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {profile.followers != null ? (profile.followers >= 1000 ? `${(profile.followers / 1000).toFixed(1)}k` : profile.followers) : '-'}
                  </p>
                  <p className="text-xs text-muted-foreground">Seguidores</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {profile.following != null ? (profile.following >= 1000 ? `${(profile.following / 1000).toFixed(1)}k` : profile.following) : '-'}
                  </p>
                  <p className="text-xs text-muted-foreground">Seguindo</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {profile.postsCount != null ? (profile.postsCount >= 1000 ? `${(profile.postsCount / 1000).toFixed(1)}k` : profile.postsCount) : '-'}
                  </p>
                  <p className="text-xs text-muted-foreground">Posts</p>
                </div>
              </div>

              {!enriched && data?.source !== 'apify' && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Análise detalhada</p>
                      <p className="text-xs text-muted-foreground">
                        Busca engajamento, hashtags e top posts via Apify
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => enrichMutation.mutate()}
                      disabled={enrichMutation.isPending}
                      data-testid="button-enrich-profile"
                      className="border-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                    >
                      {enrichMutation.isPending ? (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          Analisando...
                        </>
                      ) : (
                        <>
                          <Search className="h-3 w-3 mr-1" />
                          Analisar (~R$0,03)
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {profile.engagementRate && (
                <div className="mt-3 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-500" />
                  <span className="text-sm">Taxa de engajamento: <strong>{profile.engagementRate}%</strong></span>
                </div>
              )}

              {(enriched || data?.source === 'apify') && profile.topHashtags && profile.topHashtags.length > 0 && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <h4 className="text-sm font-semibold mb-2">Top Hashtags</h4>
                  <div className="flex flex-wrap gap-1">
                    {profile.topHashtags.map((tag: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs" data-testid={`badge-hashtag-${i}`}>
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {(enriched || data?.source === 'apify') && profile.avgLikes != null && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="p-2 bg-muted/50 rounded-lg text-center">
                    <p className="text-lg font-bold">{profile.avgLikes >= 1000 ? `${(profile.avgLikes / 1000).toFixed(1)}k` : profile.avgLikes}</p>
                    <p className="text-xs text-muted-foreground">Média de curtidas</p>
                  </div>
                  {profile.avgComments != null && (
                    <div className="p-2 bg-muted/50 rounded-lg text-center">
                      <p className="text-lg font-bold">{profile.avgComments >= 1000 ? `${(profile.avgComments / 1000).toFixed(1)}k` : profile.avgComments}</p>
                      <p className="text-xs text-muted-foreground">Média de comentários</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {recentPosts.length > 0 && (
              <div className="px-6 pb-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Posts recentes
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {recentPosts.slice(0, 9).map((post: any, i: number) => (
                    <a
                      key={post.id || i}
                      href={post.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative aspect-square rounded-md overflow-hidden bg-muted group"
                      data-testid={`post-thumbnail-${i}`}
                    >
                      {(post.mediaUrl || post.thumbnailUrl) ? (
                        <img 
                          src={post.thumbnailUrl || post.mediaUrl} 
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-xs">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" /> {post.likeCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" /> {post.commentsCount || 0}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export default function InstagramInbox() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState<{ page: number; totalConversations: number; synced: number; errors: number; done: boolean } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Store selected conversation in ref to avoid WebSocket reconnections
  const selectedConversationRef = useRef<Conversation | null>(null);
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // WebSocket for real-time notifications
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/notifications`;
    let reconnectTimeout: NodeJS.Timeout;
    let isClosing = false;
    
    const connectWebSocket = () => {
      if (isClosing) return;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[Instagram Inbox] WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'instagram_dm') {
            queryClient.invalidateQueries({ queryKey: ["/api/instagram/conversations"] });
            
            const currentConversation = selectedConversationRef.current;
            if (currentConversation && currentConversation.conversationId === message.data.conversationId) {
              queryClient.invalidateQueries({ 
                queryKey: ["/api/instagram/conversations", currentConversation.conversationId, "messages"] 
              });
            }

            toast({
              title: "Nova mensagem recebida",
              description: message.data.messageText?.substring(0, 50) + (message.data.messageText?.length > 50 ? '...' : ''),
            });
          }

          if (message.type === 'dm_sync_progress') {
            setSyncProgress(message.data);
            if (message.data.synced > 0 || message.data.done) {
              queryClient.invalidateQueries({ queryKey: ["/api/instagram/conversations"] });
            }
            if (message.data.done) {
              setTimeout(() => setSyncProgress(null), 3000);
            }
          }
        } catch (e) {
          console.error('[Instagram Inbox] WebSocket message parse error:', e);
        }
      };

      ws.onclose = () => {
        if (!isClosing) {
          console.log('[Instagram Inbox] WebSocket disconnected, reconnecting...');
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error('[Instagram Inbox] WebSocket error:', error);
      };
    };

    connectWebSocket();

    return () => {
      isClosing = true;
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [queryClient, toast]);

  const { data: conversationsData, isLoading: isLoadingConversations, refetch: refetchConversations } = useQuery({
    queryKey: ["/api/instagram/conversations"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/instagram/conversations");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { data: messagesData, isLoading: isLoadingMessages, refetch: refetchMessages } = useQuery({
    queryKey: ["/api/instagram/conversations", selectedConversation?.conversationId, "messages"],
    queryFn: async () => {
      if (!selectedConversation) return null;
      const res = await apiRequest("GET", `/api/instagram/conversations/${encodeURIComponent(selectedConversation.conversationId)}/messages`);
      return res.json();
    },
    enabled: !!selectedConversation,
    refetchInterval: 10000,
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/instagram/conversations/sync");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.status === 'sync_started') {
        setSyncProgress({ page: 0, totalConversations: 0, synced: 0, errors: 0, done: false });
      } else if (data.status !== 'already_syncing') {
        refetchConversations();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao sincronizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ recipientId, message, conversationId }: { recipientId: string; message: string; conversationId: string }) => {
      const res = await apiRequest("POST", "/api/instagram/messages/send", {
        recipientId,
        message,
        conversationId,
      });
      return res.json();
    },
    onSuccess: () => {
      setMessageInput("");
      refetchMessages();
      refetchConversations();
      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const prevMessageCountRef = useRef(0);
  useEffect(() => {
    const currentCount = messagesData?.messages?.length || 0;
    if (currentCount > prevMessageCountRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    prevMessageCountRef.current = currentCount;
  }, [messagesData]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate({
      recipientId: selectedConversation.participantId,
      message: messageInput,
      conversationId: selectedConversation.conversationId,
    });
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return "Hoje";
    if (date.toDateString() === yesterday.toDateString()) return "Ontem";
    return format(date, "d 'de' MMMM", { locale: ptBR });
  };

  const filteredConversations = (conversationsData?.conversations || []).filter((conv: Conversation) => {
    if (!searchQuery) return true;
    return conv.participantUsername?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const conversations = conversationsData?.conversations || [];
  const messages = messagesData?.messages || [];
  const unreadCount = conversationsData?.unreadCount || 0;
  const instagramUsername = conversationsData?.instagramUsername;

  if (!conversationsData && !isLoadingConversations) {
    return (
      <div className="container mx-auto py-8 max-w-6xl" data-testid="instagram-inbox-empty">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Instagram className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Instagram não conectado</h2>
            <p className="text-muted-foreground mb-4">
              Conecte sua conta do Instagram para receber e enviar mensagens diretas.
            </p>
            <Button onClick={() => window.location.href = "/company/integrations"} data-testid="button-connect-instagram">
              Conectar Instagram
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl" data-testid="instagram-inbox-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Instagram className="h-6 w-6" />
            Mensagens do Instagram
          </h1>
          <p className="text-muted-foreground">
            {instagramUsername && (
              <span className="flex items-center gap-1">
                @{instagramUsername} • {unreadCount} não lida{unreadCount !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending || (syncProgress !== null && !syncProgress.done)}
          data-testid="button-sync-conversations"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${(syncMutation.isPending || (syncProgress !== null && !syncProgress.done)) ? 'animate-spin' : ''}`} />
          Sincronizar
        </Button>
      </div>

      {syncProgress && (
        <div className="flex items-center gap-3 px-4 py-2.5 mb-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm animate-in fade-in duration-300" data-testid="sync-progress-bar">
          <RefreshCw className="h-4 w-4 text-blue-500 animate-spin flex-shrink-0" />
          <div className="flex-1 min-w-0">
            {syncProgress.done ? (
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                Sincronização concluída! {syncProgress.synced > 0 ? `${syncProgress.synced} novas mensagens` : 'Tudo atualizado'}
              </span>
            ) : (
              <span className="text-blue-600 dark:text-blue-400">
                Sincronizando mensagens do Instagram...
                {syncProgress.synced > 0 && ` (${syncProgress.synced} novas)`}
                {syncProgress.page > 0 && ` • Página ${syncProgress.page}`}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-200px)]" data-testid="inbox-container">
        <Card className={`md:col-span-1 flex flex-col ${selectedConversation ? 'hidden md:flex' : ''}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Inbox className="h-5 w-5" />
              Conversas
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar conversa..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-conversations"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              {isLoadingConversations ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm">
                    {searchQuery ? "Nenhuma conversa encontrada" : "Nenhuma conversa ainda"}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredConversations.map((conv: Conversation) => (
                    <button
                      key={conv.conversationId}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                        selectedConversation?.conversationId === conv.conversationId ? "bg-muted" : ""
                      }`}
                      data-testid={`conversation-item-${conv.conversationId}`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {conv.participantProfilePic ? (
                            <AvatarImage 
                              src={getAvatarUrl(conv.participantProfilePic)} 
                              alt={conv.participantUsername || ""}
                            />
                          ) : null}
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold">
                            {(conv.participantUsername?.charAt(0) || "U").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`font-medium truncate ${conv.unreadCount > 0 ? "font-semibold" : ""}`}>
                              {conv.participantUsername || "Usuário desconhecido"}
                            </span>
                            {conv.unreadCount > 0 && (
                              <Badge variant="default" className="ml-2 h-5 min-w-5 flex items-center justify-center">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.lastMessage || (conv.isIncoming ? "📎 Mídia recebida" : "📎 Mídia enviada")}
                          </p>
                          {conv.lastMessageAt && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true, locale: ptBR })}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className={`md:col-span-2 flex flex-col ${!selectedConversation ? 'hidden md:flex' : ''}`}>
          {!selectedConversation ? (
            <CardContent className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
              <p className="text-muted-foreground">
                Escolha uma conversa na lista para visualizar as mensagens
              </p>
            </CardContent>
          ) : (
            <>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="md:hidden"
                    onClick={() => setSelectedConversation(null)}
                    data-testid="button-back-to-list"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-10 w-10">
                    {selectedConversation.participantProfilePic ? (
                      <AvatarImage 
                        src={getAvatarUrl(selectedConversation.participantProfilePic)} 
                        alt={selectedConversation.participantUsername || ""}
                      />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold">
                      {(selectedConversation.participantUsername?.charAt(0) || "U").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {selectedConversation.participantUsername || "Usuário desconhecido"}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <Instagram className="h-3 w-3" />
                      via Instagram
                    </CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setProfileUsername(selectedConversation.participantUsername)}
                    disabled={!selectedConversation.participantUsername}
                    data-testid="button-view-profile"
                  >
                    <UserCircle className="h-4 w-4 mr-1" />
                    Ver perfil
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => refetchMessages()}
                    data-testid="button-refresh-messages"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-[calc(100vh-380px)] p-4">
                  {isLoadingMessages ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                          <Skeleton className="h-12 w-48 rounded-lg" />
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageCircle className="h-12 w-12 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">Nenhuma mensagem nesta conversa</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg: Message, index: number) => {
                        const msgDate = msg.sentAt || msg.createdAt;
                        const prevMsg = index > 0 ? messages[index - 1] : null;
                        const prevDate = prevMsg ? (prevMsg.sentAt || prevMsg.createdAt) : null;
                        const showDateSeparator = !prevDate || 
                          new Date(msgDate).toDateString() !== new Date(prevDate).toDateString();
                        
                        return (
                          <div key={msg.id}>
                            {showDateSeparator && (
                              <div className="flex items-center justify-center my-4" data-testid={`date-separator-${msg.id}`}>
                                <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground font-medium">
                                  {getDateLabel(msgDate)}
                                </div>
                              </div>
                            )}
                            <div 
                              className={`flex ${msg.isIncoming ? "justify-start" : "justify-end"}`}
                              data-testid={`message-item-${msg.id}`}
                            >
                          <div 
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              msg.isIncoming 
                                ? "bg-muted text-foreground" 
                                : "bg-primary text-primary-foreground"
                            }`}
                          >
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mb-2 space-y-2">
                                {msg.attachments.map((att, idx) => {
                                  const attUrl = att.url || att.preview;
                                  if (!attUrl) return null;
                                  
                                  if (att.type === "image" || att.type === "animated_image") {
                                    return (
                                      <a key={idx} href={attUrl} target="_blank" rel="noopener noreferrer" className="block">
                                        <img 
                                          src={attUrl} 
                                          alt="Imagem" 
                                          className="rounded-md max-w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                          loading="lazy"
                                        />
                                      </a>
                                    );
                                  }
                                  
                                  if (att.type === "video") {
                                    return (
                                      <video 
                                        key={idx}
                                        src={attUrl} 
                                        controls 
                                        className="rounded-md max-w-full max-h-64"
                                        preload="metadata"
                                      />
                                    );
                                  }
                                  
                                  if (att.type === "audio") {
                                    return (
                                      <audio key={idx} src={attUrl} controls className="max-w-full" preload="metadata" />
                                    );
                                  }
                                  
                                  if (att.type === "share") {
                                    return (
                                      <a key={idx} href={attUrl} target="_blank" rel="noopener noreferrer" 
                                        className="flex items-center gap-2 text-xs underline opacity-80 hover:opacity-100">
                                        <ExternalLink className="h-3 w-3" />
                                        Compartilhamento
                                      </a>
                                    );
                                  }
                                  
                                  return (
                                    <a key={idx} href={attUrl} target="_blank" rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-xs underline opacity-80 hover:opacity-100">
                                      <Image className="h-3 w-3" />
                                      Anexo
                                    </a>
                                  );
                                })}
                              </div>
                            )}
                            {msg.messageText && (
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {msg.messageText}
                              </p>
                            )}
                            {!msg.messageText && (!msg.attachments || msg.attachments.length === 0) && (
                              <p className="text-sm italic opacity-60">
                                {msg.messageType === "story_mention" ? "Mencionou em um story" :
                                 msg.messageType === "story_reply" ? "Respondeu ao story" :
                                 msg.messageType === "share" ? "Compartilhamento" :
                                 "[Mídia não disponível]"}
                              </p>
                            )}
                            <div className={`flex items-center gap-1 mt-1 text-xs ${
                              msg.isIncoming ? "text-muted-foreground" : "text-primary-foreground/70"
                            }`}>
                              <Clock className="h-3 w-3" />
                              {msg.sentAt && format(new Date(msg.sentAt), "HH:mm", { locale: ptBR })}
                              {!msg.isIncoming && (
                                <CheckCheck className={`h-3 w-3 ml-1 ${msg.isRead ? "text-blue-400" : ""}`} />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </CardContent>

              <div className="p-4 border-t">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                  className="flex items-center gap-2"
                >
                  <Input 
                    placeholder="Digite sua mensagem..." 
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    disabled={sendMessageMutation.isPending}
                    className="flex-1"
                    data-testid="input-message"
                  />
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={!messageInput.trim() || sendMessageMutation.isPending}
                    data-testid="button-send-message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </Card>
      </div>
      {profileUsername && (
        <ProfileModal 
          username={profileUsername} 
          open={!!profileUsername} 
          onClose={() => setProfileUsername(null)} 
        />
      )}
    </div>
  );
}
