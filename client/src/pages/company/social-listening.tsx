import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Heart, MessageCircle, Eye, Share2, Play, Image as ImageIcon,
  Plus, Trash2, ExternalLink, Users, Grid3X3, List, Filter,
  TrendingUp, Hash, Search, Download, 
  Instagram, Youtube, Music2, AtSign, Link2, Calendar, User
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { BrandMention, Campaign} from "@shared/schema";
import { getAvatarUrl } from "@/lib/utils";

const platformIcons: Record<string, any> = {
  instagram: Instagram,
  tiktok: Music2,
  youtube: Youtube,
};

const postTypeLabels: Record<string, string> = {
  reels: "Reels",
  story: "Story",
  feed: "Feed",
  video: "Vídeo",
  carousel: "Carrossel",
};

const mentionTypeLabels: Record<string, { label: string; color: string }> = {
  tag: { label: "Marcação @", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  hashtag: { label: "Hashtag #", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  collab: { label: "Collab", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400" },
  mention: { label: "Menção", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  manual: { label: "Manual", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400" },
};

interface CreatorPost extends BrandMention {
  creatorName?: string;
  creatorAvatar?: string;
  campaignTitle?: string;
}

export default function SocialListening() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("posts");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isAddingPost, setIsAddingPost] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [selectedCreator, setSelectedCreator] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [newPost, setNewPost] = useState({
    campaignId: "",
    platform: "instagram",
    postUrl: "",
    authorUsername: "",
    caption: "",
    mentionType: "manual",
    postType: "reels",
    thumbnailUrl: "",
    likes: 0,
    comments: 0,
    shares: 0,
    views: 0,
    postedAt: "",
  });

  // Fetch campaigns for filtering
  const { data: campaigns } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
    queryFn: async () => {
      const res = await fetch("/api/campaigns", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch posts/mentions with campaign and creator filter
  const { data: posts, isLoading: postsLoading } = useQuery<CreatorPost[]>({
    queryKey: ["/api/social-listening/mentions", selectedCampaign, selectedCreator],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCampaign && selectedCampaign !== "all") {
        params.set("campaignId", selectedCampaign);
      }
      if (selectedCreator && selectedCreator !== "all") {
        params.set("creatorId", selectedCreator);
      }
      const res = await fetch(`/api/social-listening/mentions?${params}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Get unique creators from posts for filtering
  const uniqueCreators = posts ? Array.from(
    new Map(
      posts
        .filter(p => p.creatorId && p.creatorName)
        .map(p => [p.creatorId, { id: p.creatorId, name: p.creatorName || "", username: p.authorUsername || "" }])
    ).values()
  ) : [];

  // Stats
  const stats = {
    totalPosts: posts?.length || 0,
    totalViews: posts?.reduce((sum, p) => sum + (p.views || 0), 0) || 0,
    totalLikes: posts?.reduce((sum, p) => sum + (p.likes || 0), 0) || 0,
    totalComments: posts?.reduce((sum, p) => sum + (p.comments || 0), 0) || 0,
    totalShares: posts?.reduce((sum, p) => sum + (p.shares || 0), 0) || 0,
    avgEngagement: posts?.length ? 
      Math.round(posts.reduce((sum, p) => sum + (p.likes || 0) + (p.comments || 0) + (p.shares || 0), 0) / posts.length) : 0,
  };

  const createPostMutation = useMutation({
    mutationFn: async (data: typeof newPost) => {
      const res = await fetch("/api/social-listening/mentions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          campaignId: data.campaignId ? parseInt(data.campaignId) : null,
          postedAt: data.postedAt ? new Date(data.postedAt).toISOString() : null,
        }),
      });
      if (!res.ok) throw new Error("Erro ao registrar post");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-listening/mentions"] });
      setIsAddingPost(false);
      setNewPost({
        campaignId: "",
        platform: "instagram",
        postUrl: "",
        authorUsername: "",
        caption: "",
        mentionType: "manual",
        postType: "reels",
        thumbnailUrl: "",
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0,
        postedAt: "",
      });
      toast({ title: "Post registrado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao registrar post", variant: "destructive" });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/social-listening/mentions/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao excluir");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-listening/mentions"] });
      toast({ title: "Post removido" });
    },
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const filteredPosts = posts?.filter(p => 
    !searchQuery || 
    p.authorUsername?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.caption?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (postsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-7xl py-6">
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="grid grid-cols-6 gap-4 mb-6">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">
              Tracking de Conteúdo
            </h1>
            <p className="text-muted-foreground mt-1">
              Acompanhe os posts dos criadores nas suas campanhas
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={isAddingPost} onOpenChange={setIsAddingPost}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="button-add-post">
                  <Plus className="h-4 w-4" />
                  Registrar Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Registrar Post de Criador</DialogTitle>
                  <DialogDescription>
                    Adicione um post que um criador fez para sua campanha
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Campanha</Label>
                    <Select 
                      value={newPost.campaignId}
                      onValueChange={(v) => setNewPost(prev => ({ ...prev, campaignId: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a campanha" />
                      </SelectTrigger>
                      <SelectContent>
                        {campaigns?.map(c => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Plataforma</Label>
                      <Select 
                        value={newPost.platform}
                        onValueChange={(v) => setNewPost(prev => ({ ...prev, platform: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="tiktok">TikTok</SelectItem>
                          <SelectItem value="youtube">YouTube</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Post</Label>
                      <Select 
                        value={newPost.postType}
                        onValueChange={(v) => setNewPost(prev => ({ ...prev, postType: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="reels">Reels</SelectItem>
                          <SelectItem value="story">Story</SelectItem>
                          <SelectItem value="feed">Feed</SelectItem>
                          <SelectItem value="video">Vídeo</SelectItem>
                          <SelectItem value="carousel">Carrossel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de Menção</Label>
                    <Select 
                      value={newPost.mentionType}
                      onValueChange={(v) => setNewPost(prev => ({ ...prev, mentionType: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tag">Marcação @marca</SelectItem>
                        <SelectItem value="hashtag">Hashtag #campanha</SelectItem>
                        <SelectItem value="collab">Publicação em Parceria</SelectItem>
                        <SelectItem value="mention">Menção no texto</SelectItem>
                        <SelectItem value="manual">Registro manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>URL do Post</Label>
                    <Input 
                      placeholder="https://instagram.com/p/..."
                      value={newPost.postUrl}
                      onChange={(e) => setNewPost(prev => ({ ...prev, postUrl: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>@ do Criador</Label>
                    <Input 
                      placeholder="@nomedocriador"
                      value={newPost.authorUsername}
                      onChange={(e) => setNewPost(prev => ({ ...prev, authorUsername: e.target.value.replace('@', '') }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Legenda / Descrição</Label>
                    <Textarea 
                      placeholder="Texto do post..."
                      value={newPost.caption}
                      onChange={(e) => setNewPost(prev => ({ ...prev, caption: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Data de Publicação</Label>
                    <Input 
                      type="date"
                      value={newPost.postedAt}
                      onChange={(e) => setNewPost(prev => ({ ...prev, postedAt: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>URL da Thumbnail (opcional)</Label>
                    <Input 
                      placeholder="https://..."
                      value={newPost.thumbnailUrl}
                      onChange={(e) => setNewPost(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Curtidas</Label>
                      <Input 
                        type="number"
                        value={newPost.likes}
                        onChange={(e) => setNewPost(prev => ({ ...prev, likes: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Comentários</Label>
                      <Input 
                        type="number"
                        value={newPost.comments}
                        onChange={(e) => setNewPost(prev => ({ ...prev, comments: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Compartilhamentos</Label>
                      <Input 
                        type="number"
                        value={newPost.shares}
                        onChange={(e) => setNewPost(prev => ({ ...prev, shares: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Visualizações</Label>
                      <Input 
                        type="number"
                        value={newPost.views}
                        onChange={(e) => setNewPost(prev => ({ ...prev, views: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button variant="outline" onClick={() => setIsAddingPost(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={() => createPostMutation.mutate(newPost)}
                    disabled={!newPost.postUrl || createPostMutation.isPending}
                  >
                    {createPostMutation.isPending ? "Salvando..." : "Registrar Post"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-card border border-border">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Hash className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Posts</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalPosts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border border-border">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                  <Eye className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Views</p>
                  <p className="text-2xl font-bold text-foreground">{formatNumber(stats.totalViews)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border border-border">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                  <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Curtidas</p>
                  <p className="text-2xl font-bold text-foreground">{formatNumber(stats.totalLikes)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border border-border">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Comentários</p>
                  <p className="text-2xl font-bold text-foreground">{formatNumber(stats.totalComments)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border border-border">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <Share2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Shares</p>
                  <p className="text-2xl font-bold text-foreground">{formatNumber(stats.totalShares)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border border-border">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Engaj. Médio</p>
                  <p className="text-2xl font-bold text-foreground">{formatNumber(stats.avgEngagement)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger className="w-[200px]" data-testid="select-campaign-filter">
                  <SelectValue placeholder="Todas as campanhas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as campanhas</SelectItem>
                  {campaigns?.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {uniqueCreators.length > 0 && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedCreator} onValueChange={setSelectedCreator}>
                  <SelectTrigger className="w-[180px]" data-testid="select-creator-filter">
                    <SelectValue placeholder="Todos criadores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos criadores</SelectItem>
                    {uniqueCreators.map(c => (
                      <SelectItem key={c.id} value={c.id?.toString() || ""}>
                        {c.name || `@${c.username}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por criador..."
                className="pl-9 w-[200px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-creator"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
            <Button 
              variant={viewMode === "grid" ? "secondary" : "ghost"} 
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === "list" ? "secondary" : "ghost"} 
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Posts Grid/List */}
        {filteredPosts && filteredPosts.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => {
                const PlatformIcon = platformIcons[post.platform] || Instagram;
                const mentionInfo = mentionTypeLabels[post.mentionType || "manual"];
                
                return (
                  <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`card-post-${post.id}`}>
                    {/* Thumbnail */}
                    <div className="aspect-video bg-muted relative">
                      {post.thumbnailUrl ? (
                        <img 
                          src={post.thumbnailUrl} 
                          alt="Post thumbnail"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <Badge className={mentionInfo.color}>
                          {mentionInfo.label}
                        </Badge>
                      </div>
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <div className="p-1.5 bg-black/50 rounded-full">
                          <PlatformIcon className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      {post.postType && (
                        <div className="absolute bottom-3 left-3">
                          <Badge variant="secondary" className="bg-black/50 text-white border-none">
                            {postTypeLabels[post.postType] || post.postType}
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-4 space-y-4">
                      {/* Creator info */}
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={getAvatarUrl(post.creatorAvatar)} />
                          <AvatarFallback>{post.authorUsername?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            @{post.authorUsername || "desconhecido"}
                          </p>
                          {post.campaignTitle && (
                            <p className="text-xs text-muted-foreground truncate">
                              {post.campaignTitle}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Caption preview */}
                      {post.caption && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {post.caption}
                        </p>
                      )}
                      
                      {/* Metrics */}
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div>
                          <p className="text-lg font-bold text-foreground">{formatNumber(post.views || 0)}</p>
                          <p className="text-[10px] text-muted-foreground">Views</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-foreground">{formatNumber(post.likes || 0)}</p>
                          <p className="text-[10px] text-muted-foreground">Likes</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-foreground">{formatNumber(post.comments || 0)}</p>
                          <p className="text-[10px] text-muted-foreground">Coment.</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-foreground">{formatNumber(post.shares || 0)}</p>
                          <p className="text-[10px] text-muted-foreground">Shares</p>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        {post.postedAt && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(post.postedAt), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          <a
                            href={post.postUrl || undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deletePostMutation.mutate(post.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-medium text-muted-foreground">Criador</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Campanha</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Tipo</th>
                        <th className="text-right p-4 font-medium text-muted-foreground">Views</th>
                        <th className="text-right p-4 font-medium text-muted-foreground">Likes</th>
                        <th className="text-right p-4 font-medium text-muted-foreground">Coment.</th>
                        <th className="text-right p-4 font-medium text-muted-foreground">Data</th>
                        <th className="text-right p-4 font-medium text-muted-foreground">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredPosts.map((post) => {
                        const PlatformIcon = platformIcons[post.platform] || Instagram;
                        const mentionInfo = mentionTypeLabels[post.mentionType || "manual"];
                        
                        return (
                          <tr key={post.id} className="hover:bg-muted/30">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="p-1.5 rounded-full bg-muted">
                                  <PlatformIcon className="h-4 w-4" />
                                </div>
                                <span className="font-medium">@{post.authorUsername || "?"}</span>
                              </div>
                            </td>
                            <td className="p-4 text-muted-foreground">{post.campaignTitle || "-"}</td>
                            <td className="p-4">
                              <Badge className={mentionInfo.color} variant="secondary">
                                {mentionInfo.label}
                              </Badge>
                            </td>
                            <td className="p-4 text-right font-medium">{formatNumber(post.views || 0)}</td>
                            <td className="p-4 text-right font-medium">{formatNumber(post.likes || 0)}</td>
                            <td className="p-4 text-right font-medium">{formatNumber(post.comments || 0)}</td>
                            <td className="p-4 text-right text-muted-foreground">
                              {post.postedAt ? format(new Date(post.postedAt), "dd/MM/yy") : "-"}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <a href={post.postUrl || undefined} target="_blank" rel="noopener noreferrer">
                                  <Button variant="ghost" size="sm">
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </a>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => deletePostMutation.mutate(post.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Hash className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum post registrado
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Comece a trackear os posts dos criadores nas suas campanhas. 
                Registre posts com marcações @, hashtags ou publicações em parceria.
              </p>
              <Button onClick={() => setIsAddingPost(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Registrar Primeiro Post
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
