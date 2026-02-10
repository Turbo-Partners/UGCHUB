import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, Eye, EyeOff, Sparkles, Search, FileText, TrendingUp, Calendar, User, Loader2, Wand2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BlogPost {
  id: number;
  slug: string;
  type: "article" | "case";
  category: "cases" | "dicas" | "novidades";
  title: string;
  excerpt: string;
  content: string;
  image: string | null;
  author: string;
  authorAvatar: string | null;
  readTime: string | null;
  featured: boolean;
  published: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string[] | null;
  canonicalUrl: string | null;
  ogImage: string | null;
  structuredData: any;
  company: string | null;
  metricValue: string | null;
  metricLabel: string | null;
  createdAt: string;
  updatedAt: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

function PostEditor({ post, onClose, onSave }: { post?: BlogPost; onClose: () => void; onSave: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGeneratingSEO, setIsGeneratingSEO] = useState(false);
  
  const [formData, setFormData] = useState({
    slug: post?.slug || "",
    type: post?.type || "article",
    category: post?.category || "dicas",
    title: post?.title || "",
    excerpt: post?.excerpt || "",
    content: post?.content || "",
    image: post?.image || "",
    author: post?.author || "",
    authorAvatar: post?.authorAvatar || "",
    readTime: post?.readTime || "",
    featured: post?.featured || false,
    published: post?.published || false,
    metaTitle: post?.metaTitle || "",
    metaDescription: post?.metaDescription || "",
    metaKeywords: post?.metaKeywords?.join(", ") || "",
    canonicalUrl: post?.canonicalUrl || "",
    ogImage: post?.ogImage || "",
    company: post?.company || "",
    metricValue: post?.metricValue || "",
    metricLabel: post?.metricLabel || "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/blog/posts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/posts"] });
      toast({ title: "Post criado com sucesso!" });
      onSave();
    },
    onError: (error: any) => {
      toast({ title: "Erro ao criar post", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/admin/blog/posts/${post!.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/posts"] });
      toast({ title: "Post atualizado com sucesso!" });
      onSave();
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar post", description: error.message, variant: "destructive" });
    }
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title)
    }));
  };

  const generateSEO = async () => {
    if (!formData.title) {
      toast({ title: "Digite um título primeiro", variant: "destructive" });
      return;
    }

    setIsGeneratingSEO(true);
    try {
      const res = await apiRequest("POST", "/api/admin/blog/generate-seo", {
        title: formData.title,
        content: formData.content || formData.excerpt,
        type: formData.type
      });
      const seoData = await res.json();
      
      setFormData(prev => ({
        ...prev,
        metaTitle: seoData.metaTitle || prev.metaTitle,
        metaDescription: seoData.metaDescription || prev.metaDescription,
        metaKeywords: seoData.metaKeywords?.join(", ") || prev.metaKeywords,
      }));
      
      toast({ title: "SEO gerado com sucesso!", description: "Os campos foram preenchidos automaticamente." });
    } catch (error: any) {
      toast({ title: "Erro ao gerar SEO", description: error.message, variant: "destructive" });
    } finally {
      setIsGeneratingSEO(false);
    }
  };

  const handleSubmit = () => {
    const data: Record<string, any> = {
      slug: formData.slug,
      type: formData.type,
      category: formData.category,
      title: formData.title,
      excerpt: formData.excerpt,
      content: formData.content,
      author: formData.author,
      featured: formData.featured,
      published: formData.published,
      metaKeywords: formData.metaKeywords ? formData.metaKeywords.split(",").map(k => k.trim()).filter(Boolean) : null,
    };

    if (formData.image) data.image = formData.image;
    if (formData.authorAvatar) data.authorAvatar = formData.authorAvatar;
    if (formData.readTime) data.readTime = formData.readTime;
    if (formData.metaTitle) data.metaTitle = formData.metaTitle;
    if (formData.metaDescription) data.metaDescription = formData.metaDescription;
    if (formData.canonicalUrl) data.canonicalUrl = formData.canonicalUrl;
    if (formData.ogImage) data.ogImage = formData.ogImage;
    if (formData.company) data.company = formData.company;
    if (formData.metricValue) data.metricValue = formData.metricValue;
    if (formData.metricLabel) data.metricLabel = formData.metricLabel;

    if (post) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as any }))}>
            <SelectTrigger data-testid="select-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="article">Artigo</SelectItem>
              <SelectItem value="case">Case de Sucesso</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v as any }))}>
            <SelectTrigger data-testid="select-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cases">Cases de Sucesso</SelectItem>
              <SelectItem value="dicas">Dicas & Estratégias</SelectItem>
              <SelectItem value="novidades">Novidades</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Título</Label>
        <Input 
          value={formData.title} 
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Título do post"
          data-testid="input-title"
        />
      </div>

      <div className="space-y-2">
        <Label>Slug (URL)</Label>
        <Input 
          value={formData.slug} 
          onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
          placeholder="url-do-post"
          data-testid="input-slug"
        />
      </div>

      <div className="space-y-2">
        <Label>Resumo</Label>
        <Textarea 
          value={formData.excerpt} 
          onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
          placeholder="Breve descrição do post..."
          rows={2}
          data-testid="input-excerpt"
        />
      </div>

      <div className="space-y-2">
        <Label>Conteúdo</Label>
        <Textarea 
          value={formData.content} 
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          placeholder="Conteúdo completo do post (suporta markdown)..."
          rows={8}
          className="font-mono text-sm"
          data-testid="input-content"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Imagem de Capa (URL)</Label>
          <Input 
            value={formData.image} 
            onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
            placeholder="https://..."
            data-testid="input-image"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Tempo de Leitura</Label>
          <Input 
            value={formData.readTime} 
            onChange={(e) => setFormData(prev => ({ ...prev, readTime: e.target.value }))}
            placeholder="5 min"
            data-testid="input-readtime"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Autor</Label>
          <Input 
            value={formData.author} 
            onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
            placeholder="Nome do autor"
            data-testid="input-author"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Avatar do Autor (URL)</Label>
          <Input 
            value={formData.authorAvatar} 
            onChange={(e) => setFormData(prev => ({ ...prev, authorAvatar: e.target.value }))}
            placeholder="https://..."
            data-testid="input-author-avatar"
          />
        </div>
      </div>

      {formData.type === "case" && (
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <Label>Empresa</Label>
            <Input 
              value={formData.company} 
              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              placeholder="Nome da empresa"
              data-testid="input-company"
            />
          </div>
          <div className="space-y-2">
            <Label>Métrica (Valor)</Label>
            <Input 
              value={formData.metricValue} 
              onChange={(e) => setFormData(prev => ({ ...prev, metricValue: e.target.value }))}
              placeholder="170%"
              data-testid="input-metric-value"
            />
          </div>
          <div className="space-y-2">
            <Label>Métrica (Label)</Label>
            <Input 
              value={formData.metricLabel} 
              onChange={(e) => setFormData(prev => ({ ...prev, metricLabel: e.target.value }))}
              placeholder="Crescimento"
              data-testid="input-metric-label"
            />
          </div>
        </div>
      )}

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            SEO & Otimização
          </h4>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={generateSEO}
            disabled={isGeneratingSEO}
            data-testid="button-generate-seo"
          >
            {isGeneratingSEO ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4 mr-2" />
            )}
            Gerar com IA
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Meta Title (SEO)</Label>
            <Input 
              value={formData.metaTitle} 
              onChange={(e) => setFormData(prev => ({ ...prev, metaTitle: e.target.value }))}
              placeholder="Título otimizado para buscadores (max 60 caracteres)"
              maxLength={60}
              data-testid="input-meta-title"
            />
            <span className="text-xs text-muted-foreground">{formData.metaTitle.length}/60 caracteres</span>
          </div>

          <div className="space-y-2">
            <Label>Meta Description</Label>
            <Textarea 
              value={formData.metaDescription} 
              onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
              placeholder="Descrição para snippets de busca (max 160 caracteres)"
              maxLength={160}
              rows={2}
              data-testid="input-meta-description"
            />
            <span className="text-xs text-muted-foreground">{formData.metaDescription.length}/160 caracteres</span>
          </div>

          <div className="space-y-2">
            <Label>Palavras-chave (separadas por vírgula)</Label>
            <Input 
              value={formData.metaKeywords} 
              onChange={(e) => setFormData(prev => ({ ...prev, metaKeywords: e.target.value }))}
              placeholder="marketing de influência, criadores, UGC..."
              data-testid="input-meta-keywords"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>URL Canônica</Label>
              <Input 
                value={formData.canonicalUrl} 
                onChange={(e) => setFormData(prev => ({ ...prev, canonicalUrl: e.target.value }))}
                placeholder="https://creatorconnect.com.br/blog/..."
                data-testid="input-canonical-url"
              />
            </div>
            <div className="space-y-2">
              <Label>OG Image (URL)</Label>
              <Input 
                value={formData.ogImage} 
                onChange={(e) => setFormData(prev => ({ ...prev, ogImage: e.target.value }))}
                placeholder="https://... (imagem para compartilhamento social)"
                data-testid="input-og-image"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 py-4 border-t">
        <div className="flex items-center gap-2">
          <Switch 
            checked={formData.featured} 
            onCheckedChange={(v) => setFormData(prev => ({ ...prev, featured: v }))}
            data-testid="switch-featured"
          />
          <Label>Em Destaque</Label>
        </div>
        
        <div className="flex items-center gap-2">
          <Switch 
            checked={formData.published} 
            onCheckedChange={(v) => setFormData(prev => ({ ...prev, published: v }))}
            data-testid="switch-published"
          />
          <Label>Publicado</Label>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} data-testid="button-cancel">
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading} data-testid="button-save">
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {post ? "Salvar Alterações" : "Criar Post"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export function AdminContentContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/admin/blog/posts"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/blog/posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/posts"] });
      toast({ title: "Post excluído com sucesso!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao excluir post", description: error.message, variant: "destructive" });
    }
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: number; published: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/blog/posts/${id}`, { published });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/posts"] });
      toast({ title: "Status atualizado!" });
    }
  });

  const filteredPosts = posts?.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || post.type === typeFilter;
    return matchesSearch && matchesType;
  }) || [];

  const articles = posts?.filter(p => p.type === "article") || [];
  const cases = posts?.filter(p => p.type === "case") || [];
  const published = posts?.filter(p => p.published) || [];

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Conteúdo</h2>
          <p className="text-muted-foreground">Gerencie posts do blog e cases de sucesso</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-post">
              <Plus className="w-4 h-4 mr-2" />
              Novo Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Post</DialogTitle>
            </DialogHeader>
            <PostEditor 
              onClose={() => setIsCreateOpen(false)} 
              onSave={() => setIsCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{posts?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Total de Posts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <FileText className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{articles.length}</p>
                  <p className="text-sm text-muted-foreground">Artigos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{cases.length}</p>
                  <p className="text-sm text-muted-foreground">Cases</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Eye className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{published.length}</p>
                  <p className="text-sm text-muted-foreground">Publicados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Posts</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                  data-testid="input-search"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40" data-testid="select-filter-type">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="article">Artigos</SelectItem>
                  <SelectItem value="case">Cases</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum post encontrado</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar primeiro post
              </Button>
            </div>
          ) : (
            <motion.div 
              className="space-y-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredPosts.map((post) => (
                <motion.div
                  key={post.id}
                  variants={itemVariants}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  data-testid={`post-row-${post.id}`}
                >
                  {post.image && (
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{post.title}</h3>
                      <Badge variant={post.type === "case" ? "default" : "secondary"} className="flex-shrink-0">
                        {post.type === "case" ? "Case" : "Artigo"}
                      </Badge>
                      {post.featured && (
                        <Badge variant="outline" className="flex-shrink-0">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Destaque
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {post.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(post.createdAt), "dd MMM yyyy", { locale: ptBR })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => togglePublishMutation.mutate({ id: post.id, published: !post.published })}
                      data-testid={`button-toggle-publish-${post.id}`}
                    >
                      {post.published ? (
                        <Eye className="w-4 h-4 text-green-500" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setEditingPost(post)} data-testid={`button-edit-${post.id}`}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Editar Post</DialogTitle>
                        </DialogHeader>
                        <PostEditor 
                          post={post}
                          onClose={() => setEditingPost(null)} 
                          onSave={() => setEditingPost(null)}
                        />
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive" data-testid={`button-delete-${post.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Post</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir "{post.title}"? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteMutation.mutate(post.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default AdminContentContent;
