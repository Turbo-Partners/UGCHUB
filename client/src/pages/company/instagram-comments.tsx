import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";
import {
  MessageSquare, Send, EyeOff, Eye, Trash2, Loader2,
  RefreshCw, Heart, ExternalLink, Sparkles,
  MessageCircle, Image
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLocation } from "wouter";

export default function InstagramComments() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sentiments, setSentiments] = useState<Record<string, { sentiment: string; emoji: string }>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filter, setFilter] = useState<"all" | "hidden">("all");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["/api/instagram/comments"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/instagram/comments?postsLimit=15&commentsPerPost=30");
      return res.json();
    },
  });

  const comments = data?.comments || [];
  const filteredComments = filter === "hidden"
    ? comments.filter((c: any) => c.hidden)
    : comments;

  const replyMutation = useMutation({
    mutationFn: async ({ commentId, message }: { commentId: string; message: string }) => {
      const res = await apiRequest("POST", `/api/instagram/comments/${commentId}/reply`, { message });
      return res.json();
    },
    onSuccess: () => {
      toast.success("Resposta enviada!");
      setReplyingTo(null);
      setReplyText("");
      refetch();
    },
    onError: (e: any) => toast.error(e.message || "Erro ao responder"),
  });

  const hideMutation = useMutation({
    mutationFn: async ({ commentId, hide }: { commentId: string; hide: boolean }) => {
      const res = await apiRequest("POST", `/api/instagram/comments/${commentId}/hide`, { hide });
      return res.json();
    },
    onSuccess: (_, vars) => {
      toast.success(vars.hide ? "Comentário ocultado" : "Comentário visível novamente");
      refetch();
    },
    onError: (e: any) => toast.error(e.message || "Erro"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const res = await apiRequest("DELETE", `/api/instagram/comments/${commentId}`);
      return res.json();
    },
    onSuccess: () => {
      toast.success("Comentário removido");
      refetch();
    },
    onError: (e: any) => toast.error(e.message || "Erro ao remover"),
  });

  const handleAnalyzeSentiment = async () => {
    const commentsToAnalyze = filteredComments.slice(0, 30).map((c: any) => ({
      id: c.id,
      text: c.text,
      username: c.username,
    }));

    if (commentsToAnalyze.length === 0) return;

    setIsAnalyzing(true);
    try {
      const res = await apiRequest("POST", "/api/instagram/comments/analyze-sentiment", { comments: commentsToAnalyze });
      const data = await res.json();

      const sentimentMap: Record<string, { sentiment: string; emoji: string }> = {};
      for (const s of data.sentiments || []) {
        const comment = commentsToAnalyze[s.index - 1];
        if (comment) {
          sentimentMap[comment.id] = { sentiment: s.sentiment, emoji: s.emoji };
        }
      }
      setSentiments(sentimentMap);
      toast.success(`${Object.keys(sentimentMap).length} comentários analisados!`);
    } catch (e: any) {
      toast.error("Erro na análise de sentimento");
    }
    setIsAnalyzing(false);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <PageHeader
        title="Comentários do Instagram"
        description="Gerencie e responda comentários dos seus posts"
      />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          data-testid="button-refresh-comments"
        >
          {isRefetching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Atualizar
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleAnalyzeSentiment}
          disabled={isAnalyzing || filteredComments.length === 0}
          data-testid="button-analyze-sentiment"
        >
          {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Analisar Sentimento
        </Button>

        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant={filter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
            data-testid="button-filter-all"
          >
            Todos ({comments.length})
          </Button>
          <Button
            variant={filter === "hidden" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("hidden")}
            data-testid="button-filter-hidden"
          >
            <EyeOff className="h-3 w-3 mr-1" />
            Ocultos
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Card key={i}>
              <CardContent className="py-4">
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredComments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground" data-testid="text-empty-comments">Nenhum comentário encontrado</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Os comentários dos seus posts aparecerão aqui
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredComments.map((comment: any) => (
            <Card
              key={comment.id}
              className={`transition-colors ${comment.hidden ? "opacity-60 border-yellow-500/30" : ""}`}
              data-testid={`comment-card-${comment.id}`}
            >
              <CardContent className="py-4">
                <div className="flex gap-3">
                  {comment.post && (
                    <div className="hidden sm:block w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {comment.post.mediaUrl || comment.post.thumbnailUrl ? (
                        <img
                          src={comment.post.thumbnailUrl || comment.post.mediaUrl}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="h-5 w-5 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-sm" data-testid={`text-username-${comment.id}`}>@{comment.username}</span>
                      {sentiments[comment.id] && (
                        <Badge variant="secondary" className="text-xs" data-testid={`badge-sentiment-${comment.id}`}>
                          {sentiments[comment.id].emoji} {sentiments[comment.id].sentiment}
                        </Badge>
                      )}
                      {comment.hidden && (
                        <Badge variant="outline" className="text-xs text-yellow-600" data-testid={`badge-hidden-${comment.id}`}>
                          <EyeOff className="h-3 w-3 mr-1" />
                          Oculto
                        </Badge>
                      )}
                      {comment.like_count > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1" data-testid={`text-likes-${comment.id}`}>
                          <Heart className="h-3 w-3" />
                          {comment.like_count}
                        </span>
                      )}
                    </div>

                    <p className="text-sm mb-1.5" data-testid={`text-comment-${comment.id}`}>{comment.text}</p>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                      <span data-testid={`text-timestamp-${comment.id}`}>
                        {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true, locale: ptBR })}
                      </span>
                      {comment.post?.permalink && (
                        <a
                          href={comment.post.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-primary"
                          data-testid={`link-post-${comment.id}`}
                        >
                          <ExternalLink className="h-3 w-3" />
                          Ver post
                        </a>
                      )}
                    </div>

                    {comment.replies?.data && comment.replies.data.length > 0 && (
                      <div className="ml-4 pl-4 border-l-2 border-muted space-y-2 mb-2">
                        {comment.replies.data.map((reply: any) => (
                          <div key={reply.id} className="text-sm" data-testid={`reply-${reply.id}`}>
                            <span className="font-medium">@{reply.username}</span>{" "}
                            <span className="text-muted-foreground">{reply.text}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {formatDistanceToNow(new Date(reply.timestamp), { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReplyingTo(replyingTo === comment.id ? null : comment.id);
                          setReplyText("");
                        }}
                        data-testid={`button-reply-${comment.id}`}
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Responder
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => hideMutation.mutate({ commentId: comment.id, hide: !comment.hidden })}
                        disabled={hideMutation.isPending}
                        data-testid={`button-hide-${comment.id}`}
                      >
                        {comment.hidden ? (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Mostrar
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Ocultar
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm("Tem certeza que deseja remover este comentário?")) {
                            deleteMutation.mutate(comment.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${comment.id}`}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remover
                      </Button>
                    </div>

                    {replyingTo === comment.id && (
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Escreva sua resposta..."
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && replyText.trim()) {
                              replyMutation.mutate({ commentId: comment.id, message: replyText.trim() });
                            }
                          }}
                          data-testid={`input-reply-${comment.id}`}
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if (replyText.trim()) {
                              replyMutation.mutate({ commentId: comment.id, message: replyText.trim() });
                            }
                          }}
                          disabled={!replyText.trim() || replyMutation.isPending}
                          data-testid={`button-send-reply-${comment.id}`}
                        >
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
    </div>
  );
}
