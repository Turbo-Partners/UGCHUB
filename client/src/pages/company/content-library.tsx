import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Grid, List, Download, Eye, MessageSquare, Check, X, Clock, Play, Image, FileText, Link, Search, Filter, Calendar, User, MoreVertical, Tag, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useBrand } from "@/lib/brand-context";
import type { UgcAsset, UsageRights, AssetComment } from "@shared/schema";

interface AssetWithDetails extends UgcAsset {
  creator: { id: number; name: string; avatar: string | null; instagramHandle: string | null };
  campaign?: { id: number; title: string };
}

interface AssetDetails {
  asset: UgcAsset;
  comments: (AssetComment & { user: { id: number; name: string; avatar: string | null } })[];
}

export default function ContentLibrary() {
  const { brandId } = useBrand();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [creatorFilter, setCreatorFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<AssetWithDetails | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newComment, setNewComment] = useState("");

  const { data: assets, isLoading } = useQuery<AssetWithDetails[]>({
    queryKey: ["/api/company/brand", brandId, "content/assets", statusFilter, campaignFilter, creatorFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (campaignFilter !== "all") params.set("campaignId", campaignFilter);
      if (creatorFilter !== "all") params.set("creatorId", creatorFilter);
      const res = await apiRequest("GET", `/api/company/brand/${brandId}/content/assets?${params}`);
      return res.json();
    },
    enabled: !!brandId,
  });

  const { data: assetDetails, isLoading: loadingDetails } = useQuery<AssetDetails>({
    queryKey: ["/api/company/brand", brandId, "content/assets", selectedAsset?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/company/brand/${brandId}/content/assets/${selectedAsset?.id}`);
      return res.json();
    },
    enabled: !!brandId && !!selectedAsset?.id,
  });

  const { data: campaigns } = useQuery<{ id: number; title: string }[]>({
    queryKey: ["/api/company/campaigns"],
    enabled: !!brandId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PUT", `/api/company/brand/${brandId}/content/assets/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/brand", brandId, "content/assets"] });
      toast({ title: "Status atualizado" });
    },
  });

  const updateUsageRightsMutation = useMutation({
    mutationFn: async ({ id, usageRights }: { id: number; usageRights: UsageRights }) => {
      const res = await apiRequest("PUT", `/api/company/brand/${brandId}/content/assets/${id}/usage-rights`, { usageRights });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/brand", brandId, "content/assets"] });
      toast({ title: "Direitos de uso atualizados" });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: string }) => {
      const res = await apiRequest("POST", `/api/company/brand/${brandId}/content/assets/${id}/comments`, { body });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/brand", brandId, "content/assets", selectedAsset?.id] });
      setNewComment("");
      toast({ title: "Comentário adicionado" });
    },
  });

  const filteredAssets = assets?.filter((asset) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        asset.title.toLowerCase().includes(query) ||
        asset.creator.name.toLowerCase().includes(query) ||
        asset.tags?.some((t) => t.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    submitted: { label: "Enviado", color: "bg-blue-100 text-blue-800", icon: <Clock className="h-3 w-3" /> },
    needs_changes: { label: "Precisa de Ajustes", color: "bg-yellow-100 text-yellow-800", icon: <AlertCircle className="h-3 w-3" /> },
    approved: { label: "Aprovado", color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3 w-3" /> },
    rejected: { label: "Rejeitado", color: "bg-red-100 text-red-800", icon: <XCircle className="h-3 w-3" /> },
  };

  const typeConfig: Record<string, { label: string; icon: React.ReactNode }> = {
    video: { label: "Vídeo", icon: <Play className="h-4 w-4" /> },
    image: { label: "Imagem", icon: <Image className="h-4 w-4" /> },
    doc: { label: "Documento", icon: <FileText className="h-4 w-4" /> },
    link: { label: "Link", icon: <Link className="h-4 w-4" /> },
  };

  const openAssetDrawer = (asset: AssetWithDetails) => {
    setSelectedAsset(asset);
    setDrawerOpen(true);
  };

  const handleStatusChange = (status: string) => {
    if (selectedAsset) {
      updateStatusMutation.mutate({ id: selectedAsset.id, status });
    }
  };

  const handleUsageRightsChange = (field: keyof UsageRights, value: boolean) => {
    if (selectedAsset && assetDetails?.asset) {
      const currentRights = assetDetails.asset.usageRights as UsageRights;
      updateUsageRightsMutation.mutate({
        id: selectedAsset.id,
        usageRights: { ...currentRights, [field]: value },
      });
    }
  };

  const handleAddComment = () => {
    if (selectedAsset && newComment.trim()) {
      addCommentMutation.mutate({ id: selectedAsset.id, body: newComment.trim() });
    }
  };

  if (!brandId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Selecione uma marca para ver a biblioteca de conteúdo</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="page-title">Biblioteca de Conteúdo</h1>
          <p className="text-muted-foreground">Gerencie todos os conteúdos UGC da sua marca</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
            data-testid="view-grid"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
            data-testid="view-list"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, creator ou tags..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="search-input"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="filter-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="submitted">Enviado</SelectItem>
                <SelectItem value="needs_changes">Precisa de Ajustes</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={campaignFilter} onValueChange={setCampaignFilter}>
              <SelectTrigger className="w-[180px]" data-testid="filter-campaign">
                <SelectValue placeholder="Campanha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as campanhas</SelectItem>
                {campaigns?.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !filteredAssets?.length ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Image className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg">Nenhum conteúdo encontrado</h3>
              <p className="text-muted-foreground">Os creators ainda não enviaram conteúdos para esta marca.</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="group relative bg-muted rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                  onClick={() => openAssetDrawer(asset)}
                  data-testid={`asset-card-${asset.id}`}
                >
                  <div className="aspect-square bg-gradient-to-br from-muted to-muted-foreground/10 flex items-center justify-center">
                    {asset.type === "video" ? (
                      <Play className="h-12 w-12 text-muted-foreground" />
                    ) : asset.type === "image" ? (
                      <img
                        src={asset.url}
                        alt={asset.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                    ) : (
                      typeConfig[asset.type]?.icon || <FileText className="h-12 w-12 text-muted-foreground" />
                    )}
                    <Image className="h-12 w-12 text-muted-foreground hidden" />
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge className={statusConfig[asset.status]?.color}>
                      {statusConfig[asset.status]?.icon}
                    </Badge>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <p className="font-medium text-sm truncate">{asset.title}</p>
                      <p className="text-xs opacity-80 truncate">@{asset.creator.instagramHandle || asset.creator.name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => openAssetDrawer(asset)}
                  data-testid={`asset-row-${asset.id}`}
                >
                  <div className="w-16 h-16 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    {asset.type === "image" ? (
                      <img src={asset.url} alt="" className="w-full h-full object-cover rounded" />
                    ) : (
                      typeConfig[asset.type]?.icon
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{asset.title}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={asset.creator.avatar || undefined} />
                        <AvatarFallback>{asset.creator.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span>@{asset.creator.instagramHandle || asset.creator.name}</span>
                      {asset.campaign && (
                        <>
                          <span>•</span>
                          <span>{asset.campaign.title}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge className={statusConfig[asset.status]?.color}>
                    {statusConfig[asset.status]?.icon}
                    <span className="ml-1">{statusConfig[asset.status]?.label}</span>
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {asset.createdAt ? format(new Date(asset.createdAt), "dd/MM/yy", { locale: ptBR }) : '-'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
          {loadingDetails ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : selectedAsset && assetDetails ? (
            <div className="grid md:grid-cols-2 h-full">
              <div className="bg-muted flex items-center justify-center p-4 min-h-[300px]">
                {selectedAsset.type === "video" ? (
                  <video src={selectedAsset.url} controls className="max-w-full max-h-[400px] rounded" />
                ) : selectedAsset.type === "image" ? (
                  <img src={selectedAsset.url} alt={selectedAsset.title} className="max-w-full max-h-[400px] object-contain rounded" />
                ) : (
                  <div className="text-center">
                    {typeConfig[selectedAsset.type]?.icon}
                    <p className="mt-2 text-muted-foreground">Preview não disponível</p>
                    <Button variant="outline" className="mt-2" asChild>
                      <a href={selectedAsset.url} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4 mr-2" /> Abrir
                      </a>
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-col h-full overflow-hidden">
                <DialogHeader className="p-4 border-b flex-shrink-0">
                  <DialogTitle>{selectedAsset.title}</DialogTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedAsset.creator.avatar || undefined} />
                      <AvatarFallback>{selectedAsset.creator.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{selectedAsset.creator.name}</p>
                      <p className="text-xs text-muted-foreground">@{selectedAsset.creator.instagramHandle}</p>
                    </div>
                  </div>
                </DialogHeader>

                <ScrollArea className="flex-1 p-4">
                  <Tabs defaultValue="details" className="w-full">
                    <TabsList className="w-full mb-4">
                      <TabsTrigger value="details" className="flex-1">Detalhes</TabsTrigger>
                      <TabsTrigger value="rights" className="flex-1">Direitos</TabsTrigger>
                      <TabsTrigger value="comments" className="flex-1">
                        Comentários ({assetDetails.comments.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Descrição</Label>
                        <p className="text-sm">{selectedAsset.description || "Sem descrição"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Campanha</Label>
                        <p className="text-sm">{selectedAsset.campaign?.title || "Sem campanha vinculada"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Tags</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedAsset.tags?.length ? (
                            selectedAsset.tags.map((tag) => (
                              <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">Nenhuma tag</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Status</Label>
                        <Select
                          value={assetDetails.asset.status}
                          onValueChange={handleStatusChange}
                        >
                          <SelectTrigger data-testid="select-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="submitted">Enviado</SelectItem>
                            <SelectItem value="needs_changes">Precisa de Ajustes</SelectItem>
                            <SelectItem value="approved">Aprovado</SelectItem>
                            <SelectItem value="rejected">Rejeitado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="pt-4">
                        <Button variant="outline" className="w-full" asChild>
                          <a href={selectedAsset.url} download target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" /> Baixar Conteúdo
                          </a>
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="rights" className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Configure as permissões de uso deste conteúdo
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">Uso em Ads</p>
                            <p className="text-xs text-muted-foreground">Permitir uso em anúncios pagos</p>
                          </div>
                          <Switch
                            checked={(assetDetails.asset.usageRights as UsageRights)?.ads}
                            onCheckedChange={(v) => handleUsageRightsChange("ads", v)}
                            data-testid="switch-ads"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">Uso Orgânico</p>
                            <p className="text-xs text-muted-foreground">Permitir postagem no feed/stories</p>
                          </div>
                          <Switch
                            checked={(assetDetails.asset.usageRights as UsageRights)?.organic}
                            onCheckedChange={(v) => handleUsageRightsChange("organic", v)}
                            data-testid="switch-organic"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">Whitelist / Dark Post</p>
                            <p className="text-xs text-muted-foreground">Permitir impulsionar do perfil do creator</p>
                          </div>
                          <Switch
                            checked={(assetDetails.asset.usageRights as UsageRights)?.whitelist}
                            onCheckedChange={(v) => handleUsageRightsChange("whitelist", v)}
                            data-testid="switch-whitelist"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="comments" className="space-y-4">
                      {assetDetails.comments.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Nenhum comentário ainda
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {assetDetails.comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={comment.user.avatar || undefined} />
                                <AvatarFallback>{comment.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{comment.user.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {comment.createdAt ? format(new Date(comment.createdAt), "dd/MM HH:mm", { locale: ptBR }) : ''}
                                  </span>
                                </div>
                                <p className="text-sm">{comment.body}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 pt-4 border-t">
                        <Input
                          placeholder="Adicionar comentário..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                          data-testid="input-comment"
                        />
                        <Button
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || addCommentMutation.isPending}
                          data-testid="btn-add-comment"
                        >
                          {addCommentMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MessageSquare className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </ScrollArea>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
