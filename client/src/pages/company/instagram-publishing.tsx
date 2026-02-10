import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";
import {
  Send, Loader2, RefreshCw, Image, Film, Layers, Plus,
  Trash2, ExternalLink, Heart, MessageCircle, Upload,
  Eye, LayoutGrid, Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type PublishType = "image" | "carousel" | "reel" | "story";

interface CarouselItem {
  imageUrl?: string;
  videoUrl?: string;
  isVideo?: boolean;
}

export default function InstagramPublishing() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("publish");
  const [publishType, setPublishType] = useState<PublishType>("image");
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([
    { imageUrl: "" },
    { imageUrl: "" },
  ]);
  const [shareToFeed, setShareToFeed] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  const { data: limitData } = useQuery({
    queryKey: ["/api/instagram/publishing/limit"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/instagram/publishing/limit");
      return res.json();
    },
  });

  const { data: mediaData, isLoading: isLoadingMedia, refetch: refetchMedia } = useQuery({
    queryKey: ["/api/instagram/publishing/media"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/instagram/publishing/media?limit=12");
      return res.json();
    },
  });

  const recentMedia = mediaData?.media || [];
  const quotaUsage = limitData?.quota_usage || 0;
  const quotaTotal = limitData?.config?.quota_total || 25;

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      let endpoint = "";
      let body: any = {};

      switch (publishType) {
        case "image":
          if (!imageUrl.trim()) { toast.error("URL da imagem é obrigatória"); setIsPublishing(false); return; }
          endpoint = "/api/instagram/publish/image";
          body = { imageUrl: imageUrl.trim(), caption: caption.trim() || undefined };
          break;
        case "carousel":
          const validItems = carouselItems.filter(i => i.imageUrl?.trim() || i.videoUrl?.trim());
          if (validItems.length < 2) { toast.error("Mínimo de 2 itens para carrossel"); setIsPublishing(false); return; }
          endpoint = "/api/instagram/publish/carousel";
          body = { children: validItems, caption: caption.trim() || undefined };
          break;
        case "reel":
          if (!videoUrl.trim()) { toast.error("URL do vídeo é obrigatória"); setIsPublishing(false); return; }
          endpoint = "/api/instagram/publish/reel";
          body = { videoUrl: videoUrl.trim(), caption: caption.trim() || undefined, shareToFeed };
          break;
        case "story":
          if (!imageUrl.trim() && !videoUrl.trim()) { toast.error("URL da mídia é obrigatória"); setIsPublishing(false); return; }
          endpoint = "/api/instagram/publish/story";
          body = videoUrl.trim() ? { videoUrl: videoUrl.trim() } : { imageUrl: imageUrl.trim() };
          break;
      }

      const res = await apiRequest("POST", endpoint, body);
      const data = await res.json();

      if (data.success) {
        toast.success("Publicado com sucesso!");
        if (data.permalink) {
          toast.info(`Ver post: ${data.permalink}`);
        }
        setCaption("");
        setImageUrl("");
        setVideoUrl("");
        setCarouselItems([{ imageUrl: "" }, { imageUrl: "" }]);
        queryClient.invalidateQueries({ queryKey: ["/api/instagram/publishing/media"] });
        queryClient.invalidateQueries({ queryKey: ["/api/instagram/publishing/limit"] });
      } else {
        toast.error(data.error || "Erro ao publicar");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao publicar conteúdo");
    }
    setIsPublishing(false);
  };

  const addCarouselItem = () => {
    if (carouselItems.length >= 10) {
      toast.error("Máximo de 10 itens por carrossel");
      return;
    }
    setCarouselItems([...carouselItems, { imageUrl: "" }]);
  };

  const removeCarouselItem = (index: number) => {
    if (carouselItems.length <= 2) {
      toast.error("Mínimo de 2 itens no carrossel");
      return;
    }
    setCarouselItems(carouselItems.filter((_, i) => i !== index));
  };

  const updateCarouselItem = (index: number, field: string, value: string) => {
    const updated = [...carouselItems];
    if (field === "imageUrl") {
      updated[index] = { imageUrl: value, isVideo: false };
    } else {
      updated[index] = { videoUrl: value, isVideo: true };
    }
    setCarouselItems(updated);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <PageHeader
        title="Publicação de Conteúdo"
        description="Publique posts, carrosséis, reels e stories diretamente no Instagram"
      />

      <div className="flex items-center gap-3 mb-6">
        <Badge variant="outline" className="text-sm" data-testid="badge-publishing-quota">
          <Clock className="h-3 w-3 mr-1" />
          Publicações: {quotaUsage}/{quotaTotal} (24h)
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            refetchMedia();
            queryClient.invalidateQueries({ queryKey: ["/api/instagram/publishing/limit"] });
          }}
          data-testid="button-refresh-publishing"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
          <TabsTrigger value="publish" data-testid="tab-publish">
            <Upload className="h-4 w-4 mr-2" />
            Publicar
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">
            <LayoutGrid className="h-4 w-4 mr-2" />
            Publicações Recentes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="publish" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {[
              { type: "image" as PublishType, label: "Imagem", icon: Image },
              { type: "carousel" as PublishType, label: "Carrossel", icon: Layers },
              { type: "reel" as PublishType, label: "Reel", icon: Film },
              { type: "story" as PublishType, label: "Story", icon: Eye },
            ].map(({ type, label, icon: Icon }) => (
              <Button
                key={type}
                variant={publishType === type ? "default" : "outline"}
                className="flex flex-col gap-1 h-auto py-3"
                onClick={() => setPublishType(type)}
                data-testid={`button-type-${type}`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {publishType === "image" && "Publicar Imagem"}
                {publishType === "carousel" && "Publicar Carrossel"}
                {publishType === "reel" && "Publicar Reel"}
                {publishType === "story" && "Publicar Story"}
              </CardTitle>
              <CardDescription>
                {publishType === "image" && "Cole a URL pública de uma imagem para publicar no feed"}
                {publishType === "carousel" && "Adicione 2 a 10 imagens/vídeos para criar um carrossel"}
                {publishType === "reel" && "Cole a URL de um vídeo para publicar como Reel"}
                {publishType === "story" && "Publique uma imagem ou vídeo nos Stories"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {publishType === "image" && (
                <div className="space-y-2">
                  <Label>URL da Imagem *</Label>
                  <Input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://exemplo.com/imagem.jpg"
                    data-testid="input-image-url"
                  />
                  <p className="text-xs text-muted-foreground">
                    A imagem precisa ser pública e acessível via HTTPS. Formatos: JPEG, PNG.
                  </p>
                </div>
              )}

              {publishType === "carousel" && (
                <div className="space-y-3">
                  <Label>Itens do Carrossel ({carouselItems.length}/10)</Label>
                  {carouselItems.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <div className="flex-1">
                        <Input
                          value={item.imageUrl || item.videoUrl || ""}
                          onChange={(e) => updateCarouselItem(
                            index,
                            e.target.value.match(/\.(mp4|mov|avi)/i) ? "videoUrl" : "imageUrl",
                            e.target.value
                          )}
                          placeholder={`URL da mídia ${index + 1}`}
                          data-testid={`input-carousel-item-${index}`}
                        />
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {item.isVideo ? "Vídeo" : "Imagem"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCarouselItem(index)}
                        disabled={carouselItems.length <= 2}
                        data-testid={`button-remove-carousel-${index}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addCarouselItem}
                    disabled={carouselItems.length >= 10}
                    data-testid="button-add-carousel-item"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Item
                  </Button>
                </div>
              )}

              {publishType === "reel" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>URL do Vídeo *</Label>
                    <Input
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://exemplo.com/video.mp4"
                      data-testid="input-video-url"
                    />
                    <p className="text-xs text-muted-foreground">
                      Formatos: MP4, MOV. Duração: 3s a 15min. Resolução mínima: 720p.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="shareToFeed"
                      checked={shareToFeed}
                      onChange={(e) => setShareToFeed(e.target.checked)}
                      className="rounded"
                      data-testid="checkbox-share-to-feed"
                    />
                    <Label htmlFor="shareToFeed" className="text-sm font-normal cursor-pointer">
                      Compartilhar também no Feed
                    </Label>
                  </div>
                </div>
              )}

              {publishType === "story" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>URL da Mídia *</Label>
                    <Input
                      value={imageUrl || videoUrl}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.match(/\.(mp4|mov|avi)/i)) {
                          setVideoUrl(val);
                          setImageUrl("");
                        } else {
                          setImageUrl(val);
                          setVideoUrl("");
                        }
                      }}
                      placeholder="https://exemplo.com/midia.jpg"
                      data-testid="input-story-url"
                    />
                    <p className="text-xs text-muted-foreground">
                      Imagem (JPEG, PNG) ou vídeo (MP4, MOV). Stories desaparecem em 24h.
                    </p>
                  </div>
                </div>
              )}

              {publishType !== "story" && (
                <div className="space-y-2">
                  <Label>Legenda</Label>
                  <Textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Escreva a legenda do seu post..."
                    rows={4}
                    maxLength={2200}
                    data-testid="textarea-caption"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Dica: use hashtags e menções para alcançar mais pessoas</span>
                    <span>{caption.length}/2200</span>
                  </div>
                </div>
              )}

              {imageUrl && publishType === "image" && (
                <div className="space-y-2">
                  <Label>Pré-visualização</Label>
                  <div className="max-w-xs rounded-lg overflow-hidden border">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-auto max-h-64 object-cover"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={handlePublish}
                  disabled={isPublishing || quotaUsage >= quotaTotal}
                  className="min-w-32"
                  data-testid="button-publish"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Publicando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Publicar
                    </>
                  )}
                </Button>
                {quotaUsage >= quotaTotal && (
                  <p className="text-sm text-destructive">
                    Limite de publicações atingido (25/24h). Tente novamente mais tarde.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          {isLoadingMedia ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : recentMedia.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">Nenhuma publicação recente</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {recentMedia.map((media: any) => (
                <Card
                  key={media.id}
                  className="overflow-hidden group cursor-pointer"
                  data-testid={`media-card-${media.id}`}
                >
                  <div className="aspect-square relative bg-muted">
                    {media.media_url || media.thumbnail_url ? (
                      <img
                        src={media.thumbnail_url || media.media_url}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        <span className="text-sm font-medium">{media.like_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">{media.comments_count || 0}</span>
                      </div>
                    </div>

                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="text-xs bg-black/50 text-white border-0">
                        {media.media_type === "VIDEO" ? "Reel" : media.media_type === "CAROUSEL_ALBUM" ? "Carrossel" : "Foto"}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground mb-1">
                      {formatDistanceToNow(new Date(media.timestamp), { addSuffix: true, locale: ptBR })}
                    </p>
                    {media.caption && (
                      <p className="text-xs line-clamp-2">{media.caption}</p>
                    )}
                    {media.permalink && (
                      <a
                        href={media.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary flex items-center gap-1 mt-1 hover:underline"
                        data-testid={`link-permalink-${media.id}`}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Ver no Instagram
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
