import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Hash, Plus, Trash2, RefreshCw, Loader2, Eye, Heart, MessageSquare, ExternalLink, Search, TrendingUp, Clock, AlertTriangle } from "lucide-react";

interface CampaignHashtagTrackingProps {
  campaignId: number;
}

export function CampaignHashtagTracking({ campaignId }: CampaignHashtagTrackingProps) {
  const queryClient = useQueryClient();
  const [newHashtag, setNewHashtag] = useState("");
  const [selectedHashtagId, setSelectedHashtagId] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<any>(null);

  const { data: campaignHashtags = [], isLoading } = useQuery({
    queryKey: ["/api/instagram/hashtags/campaign", campaignId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/instagram/hashtags/campaign/${campaignId}`);
      return res.json();
    },
  });

  const { data: usage } = useQuery({
    queryKey: ["/api/instagram/hashtags/usage"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/instagram/hashtags/usage");
      return res.json();
    },
  });

  const { data: hashtagPosts = [], isLoading: isLoadingPosts } = useQuery({
    queryKey: ["/api/instagram/hashtags/campaign", selectedHashtagId, "posts"],
    queryFn: async () => {
      if (!selectedHashtagId) return [];
      const res = await apiRequest("GET", `/api/instagram/hashtags/campaign/${selectedHashtagId}/posts`);
      return res.json();
    },
    enabled: !!selectedHashtagId,
  });

  const addHashtagMutation = useMutation({
    mutationFn: async (hashtag: string) => {
      const res = await apiRequest("POST", "/api/instagram/hashtags/campaign", { campaignId, hashtag });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instagram/hashtags/campaign", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["/api/instagram/hashtags/usage"] });
      setNewHashtag("");
      toast.success("Hashtag adicionada ao monitoramento!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao adicionar hashtag");
    },
  });

  const removeHashtagMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/instagram/hashtags/campaign/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instagram/hashtags/campaign", campaignId] });
      toast.success("Hashtag removida");
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/instagram/hashtags/campaign/${id}/refresh`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/instagram/hashtags/campaign", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["/api/instagram/hashtags/campaign", selectedHashtagId, "posts"] });
      toast.success(`Encontrados ${data.topMedia + data.recentMedia} posts!`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar hashtag");
    },
  });

  const searchHashtagMutation = useMutation({
    mutationFn: async (hashtag: string) => {
      const res = await apiRequest("POST", "/api/instagram/hashtags/search", { hashtag });
      return res.json();
    },
    onSuccess: (data) => {
      setSearchResults(data);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao buscar hashtag");
    },
  });

  const handleAddHashtag = () => {
    if (!newHashtag.trim()) return;
    addHashtagMutation.mutate(newHashtag.trim());
  };

  const handleSearch = () => {
    if (!newHashtag.trim()) return;
    searchHashtagMutation.mutate(newHashtag.trim());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            Monitoramento de Hashtags
          </h3>
          <p className="text-sm text-muted-foreground">
            Acompanhe posts que usam as hashtags da sua campanha
          </p>
        </div>
        {usage && (
          <Badge variant={usage.remaining <= 5 ? "destructive" : "secondary"} className="text-sm" data-testid="badge-hashtag-usage">
            {usage.remaining <= 5 && <AlertTriangle className="h-3 w-3 mr-1" />}
            {usage.used}/{usage.limit} buscas esta semana
          </Badge>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={newHashtag}
                onChange={(e) => setNewHashtag(e.target.value.replace(/\s/g, ""))}
                placeholder="Digite uma hashtag..."
                className="pl-9"
                onKeyDown={(e) => e.key === "Enter" && handleAddHashtag()}
                data-testid="input-hashtag"
              />
            </div>
            <Button
              onClick={handleSearch}
              variant="outline"
              disabled={!newHashtag.trim() || searchHashtagMutation.isPending}
              data-testid="button-search-hashtag"
            >
              {searchHashtagMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Buscar</span>
            </Button>
            <Button
              onClick={handleAddHashtag}
              disabled={!newHashtag.trim() || addHashtagMutation.isPending}
              data-testid="button-add-hashtag"
            >
              {addHashtagMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Monitorar</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {searchResults && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Resultados para #{searchResults.hashtag?.name}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSearchResults(null)}>
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="top">
              <TabsList className="mb-4">
                <TabsTrigger value="top" data-testid="tab-top-media">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Top ({searchResults.topMedia?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="recent" data-testid="tab-recent-media">
                  <Clock className="h-3 w-3 mr-1" />
                  Recentes ({searchResults.recentMedia?.length || 0})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="top">
                <PostsGrid posts={searchResults.topMedia || []} />
              </TabsContent>
              <TabsContent value="recent">
                <PostsGrid posts={searchResults.recentMedia || []} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : campaignHashtags.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Hash className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">Nenhuma hashtag monitorada</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Adicione hashtags para acompanhar posts da sua campanha
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaignHashtags.map((ht: any) => (
            <Card 
              key={ht.id} 
              className={`cursor-pointer transition-colors hover:border-primary/50 ${selectedHashtagId === ht.id ? "border-primary" : ""}`}
              onClick={() => setSelectedHashtagId(selectedHashtagId === ht.id ? null : ht.id)}
              data-testid={`card-hashtag-${ht.id}`}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Hash className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">#{ht.hashtag}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {ht.totalPostsFound || 0} posts
                        </span>
                        {ht.lastCheckedAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Atualizado {new Date(ht.lastCheckedAt).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        refreshMutation.mutate(ht.id);
                      }}
                      disabled={refreshMutation.isPending}
                      data-testid={`button-refresh-hashtag-${ht.id}`}
                    >
                      {refreshMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                      <span className="ml-1 hidden sm:inline">Atualizar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeHashtagMutation.mutate(ht.id);
                      }}
                      className="text-destructive hover:text-destructive"
                      data-testid={`button-remove-hashtag-${ht.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedHashtagId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Posts encontrados
            </CardTitle>
            <CardDescription>
              Posts que utilizaram esta hashtag no Instagram
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPosts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : hashtagPosts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum post encontrado ainda. Clique em "Atualizar" para buscar posts.
              </p>
            ) : (
              <PostsGrid posts={hashtagPosts} showSource />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PostsGrid({ posts, showSource = false }: { posts: any[]; showSource?: boolean }) {
  if (!posts || posts.length === 0) {
    return <p className="text-center text-muted-foreground py-4">Nenhum post encontrado</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {posts.map((post: any, index: number) => (
        <div
          key={post.id || post.mediaId || index}
          className="group relative aspect-square rounded-lg overflow-hidden bg-muted border"
          data-testid={`post-card-${post.id || post.mediaId || index}`}
        >
          {(post.media_url || post.mediaUrl) ? (
            post.media_type === "VIDEO" || post.mediaType === "VIDEO" ? (
              <video
                src={post.media_url || post.mediaUrl}
                className="w-full h-full object-cover"
                muted
              />
            ) : (
              <img
                src={post.media_url || post.mediaUrl}
                alt={post.caption?.slice(0, 50) || "Post"}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Hash className="h-8 w-8 text-muted-foreground/30" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-sm gap-2">
            <div className="flex items-center gap-4">
              {(post.like_count !== undefined || post.likeCount !== undefined) && (
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {(post.like_count || post.likeCount || 0).toLocaleString()}
                </span>
              )}
              {(post.comments_count !== undefined || post.commentsCount !== undefined) && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {(post.comments_count || post.commentsCount || 0).toLocaleString()}
                </span>
              )}
            </div>
            {(post.username) && (
              <span className="text-xs opacity-80">@{post.username}</span>
            )}
            {showSource && post.source && (
              <Badge variant="secondary" className="text-xs">
                {post.source === "top" ? "Top" : "Recente"}
              </Badge>
            )}
            {(post.permalink) && (
              <a
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3" />
                Ver no Instagram
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
