import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, ExternalLink, Copy, Trash2, Pencil, Users, Eye, CheckCircle, XCircle, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BrandSettings {
  id: number;
  companyId: number;
  slug: string;
  brandName: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  tagline?: string;
  description?: string;
  welcomeMessage?: string;
  termsAndConditions?: string;
  privacyPolicy?: string;
  collectSocialProfiles: boolean;
  collectShippingAddress: boolean;
  collectPaymentInfo: boolean;
  collectClothingSize: boolean;
  collectContentPreferences: boolean;
  customFields?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Submission {
  id: number;
  brandSettingsId: number;
  fullName: string;
  email: string;
  phone?: string;
  instagramHandle?: string;
  status: 'pending' | 'approved' | 'rejected' | 'converted';
  createdAt: string;
}

const defaultBrandSettings = {
  slug: "",
  brandName: "",
  logoUrl: "",
  primaryColor: "#8b5cf6",
  secondaryColor: "#a78bfa",
  backgroundColor: "#f8fafc",
  textColor: "#1f2937",
  accentColor: "#a78bfa",
  tagline: "",
  description: "",
  welcomeMessage: "",
  termsAndConditions: "",
  privacyPolicy: "",
  collectSocialProfiles: true,
  collectShippingAddress: true,
  collectPaymentInfo: true,
  collectClothingSize: false,
  collectContentPreferences: true,
  isActive: true,
};

export default function LandingPagesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<BrandSettings | null>(null);
  const [viewingSubmissions, setViewingSubmissions] = useState<number | null>(null);
  const [formData, setFormData] = useState(defaultBrandSettings);

  const { data: brandSettings = [], isLoading } = useQuery<BrandSettings[]>({
    queryKey: ["/api/brand-settings"],
  });

  const { data: submissions = [] } = useQuery<Submission[]>({
    queryKey: ["/api/brand-settings", viewingSubmissions, "submissions"],
    queryFn: async () => {
      const res = await fetch(`/api/brand-settings/${viewingSubmissions}/submissions`);
      return res.json();
    },
    enabled: !!viewingSubmissions,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof defaultBrandSettings) => {
      const res = await apiRequest("POST", "/api/brand-settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand-settings"] });
      setIsCreateOpen(false);
      setFormData(defaultBrandSettings);
      toast({ title: "Landing page criada com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<BrandSettings> }) => {
      const res = await apiRequest("PATCH", `/api/brand-settings/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand-settings"] });
      setIsEditOpen(false);
      setSelectedBrand(null);
      toast({ title: "Landing page atualizada" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/brand-settings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand-settings"] });
      toast({ title: "Landing page excluída" });
    },
  });

  const updateSubmissionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/landing-submissions/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand-settings", viewingSubmissions, "submissions"] });
      toast({ title: "Status atualizado" });
    },
  });

  const copyUrl = (slug: string) => {
    const url = `${window.location.origin}/m/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "URL copiada!" });
  };

  const openEdit = (brand: BrandSettings) => {
    setSelectedBrand(brand);
    setFormData({
      slug: brand.slug,
      brandName: brand.brandName,
      logoUrl: brand.logoUrl || "",
      primaryColor: brand.primaryColor || "#8b5cf6",
      secondaryColor: brand.secondaryColor || "#a78bfa",
      backgroundColor: brand.backgroundColor || "#f8fafc",
      textColor: brand.textColor || "#1f2937",
      accentColor: brand.accentColor || "#a78bfa",
      tagline: brand.tagline || "",
      description: brand.description || "",
      welcomeMessage: brand.welcomeMessage || "",
      termsAndConditions: brand.termsAndConditions || "",
      privacyPolicy: brand.privacyPolicy || "",
      collectSocialProfiles: brand.collectSocialProfiles,
      collectShippingAddress: brand.collectShippingAddress,
      collectPaymentInfo: brand.collectPaymentInfo,
      collectClothingSize: brand.collectClothingSize,
      collectContentPreferences: brand.collectContentPreferences,
      isActive: brand.isActive,
    });
    setIsEditOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      case 'converted':
        return <Badge className="bg-blue-100 text-blue-700"><Users className="h-3 w-3 mr-1" />Convertido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="page-title">Landing Pages Personalizadas</h1>
          <p className="text-muted-foreground">Crie páginas de cadastro de influenciadores com a identidade da sua marca</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-landing">
              <Plus className="h-4 w-4 mr-2" /> Nova Landing Page
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Landing Page</DialogTitle>
              <DialogDescription>Configure sua página de captação de influenciadores</DialogDescription>
            </DialogHeader>
            <LandingPageForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={() => createMutation.mutate(formData)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {brandSettings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Você ainda não criou nenhuma landing page</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Criar primeira landing page
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brandSettings.map((brand) => (
            <Card key={brand.id} className={!brand.isActive ? "opacity-60" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{brand.brandName}</CardTitle>
                    <CardDescription className="text-sm">/m/{brand.slug}</CardDescription>
                  </div>
                  <Badge variant={brand.isActive ? "default" : "secondary"}>
                    {brand.isActive ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                {brand.tagline && <p className="text-sm text-muted-foreground mb-2">{brand.tagline}</p>}
                <div className="flex gap-2 flex-wrap text-xs">
                  {brand.collectSocialProfiles && <Badge variant="outline">Redes sociais</Badge>}
                  {brand.collectShippingAddress && <Badge variant="outline">Endereço</Badge>}
                  {brand.collectPaymentInfo && <Badge variant="outline">PIX</Badge>}
                </div>
              </CardContent>
              <CardFooter className="pt-3 border-t flex justify-between">
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => copyUrl(brand.slug)} data-testid={`button-copy-url-${brand.id}`}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={`/m/${brand.slug}`} target="_blank" rel="noopener noreferrer" data-testid={`button-preview-${brand.id}`}>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(brand)} data-testid={`button-edit-${brand.id}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive"
                    onClick={() => deleteMutation.mutate(brand.id)}
                    data-testid={`button-delete-${brand.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setViewingSubmissions(brand.id)}
                  data-testid={`button-submissions-${brand.id}`}
                >
                  <Users className="h-4 w-4 mr-1" /> Inscritos
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Landing Page</DialogTitle>
            <DialogDescription>Atualize as configurações da página</DialogDescription>
          </DialogHeader>
          <LandingPageForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={() => selectedBrand && updateMutation.mutate({ id: selectedBrand.id, data: formData })}
            isLoading={updateMutation.isPending}
            isEdit
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingSubmissions} onOpenChange={() => setViewingSubmissions(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Inscrições</DialogTitle>
            <DialogDescription>Gerencie os influenciadores inscritos</DialogDescription>
          </DialogHeader>
          {submissions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma inscrição ainda</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Instagram</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.fullName}</TableCell>
                    <TableCell>{sub.email}</TableCell>
                    <TableCell>{sub.instagramHandle || "-"}</TableCell>
                    <TableCell>{format(new Date(sub.createdAt), "dd/MM/yy", { locale: ptBR })}</TableCell>
                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                    <TableCell>
                      <Select
                        value={sub.status}
                        onValueChange={(status) => updateSubmissionMutation.mutate({ id: sub.id, status })}
                      >
                        <SelectTrigger className="w-32" data-testid={`select-status-${sub.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="approved">Aprovar</SelectItem>
                          <SelectItem value="rejected">Rejeitar</SelectItem>
                          <SelectItem value="converted">Convertido</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LandingPageForm({
  formData,
  setFormData,
  onSubmit,
  isLoading,
  isEdit = false,
}: {
  formData: typeof defaultBrandSettings;
  setFormData: (data: typeof defaultBrandSettings) => void;
  onSubmit: () => void;
  isLoading: boolean;
  isEdit?: boolean;
}) {
  const updateField = (field: keyof typeof defaultBrandSettings, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="basic">Básico</TabsTrigger>
        <TabsTrigger value="brand">Marca</TabsTrigger>
        <TabsTrigger value="content">Conteúdo</TabsTrigger>
        <TabsTrigger value="fields">Campos</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="brandName">Nome da marca *</Label>
            <Input
              id="brandName"
              data-testid="input-brandName"
              value={formData.brandName}
              onChange={(e) => updateField("brandName", e.target.value)}
              placeholder="Minha Marca"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">URL slug *</Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                /m/
              </span>
              <Input
                id="slug"
                data-testid="input-slug"
                className="rounded-l-none"
                value={formData.slug}
                onChange={(e) => updateField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="minha-marca"
              />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            data-testid="input-tagline"
            value={formData.tagline}
            onChange={(e) => updateField("tagline", e.target.value)}
            placeholder="Faça parte do nosso time de influenciadores"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            data-testid="input-description"
            value={formData.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Descreva seu programa de influenciadores..."
            rows={3}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="isActive">Landing page ativa</Label>
            <p className="text-xs text-muted-foreground">Se desativada, a página retornará erro 404</p>
          </div>
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => updateField("isActive", checked)}
            data-testid="switch-isActive"
          />
        </div>
      </TabsContent>

      <TabsContent value="brand" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="logoUrl">URL do logo</Label>
          <Input
            id="logoUrl"
            data-testid="input-logoUrl"
            value={formData.logoUrl}
            onChange={(e) => updateField("logoUrl", e.target.value)}
            placeholder="https://exemplo.com/logo.png"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Cor primária</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                id="primaryColor"
                value={formData.primaryColor}
                onChange={(e) => updateField("primaryColor", e.target.value)}
                className="w-12 h-10 p-1"
              />
              <Input
                value={formData.primaryColor}
                onChange={(e) => updateField("primaryColor", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondaryColor">Cor secundária</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                id="secondaryColor"
                value={formData.secondaryColor}
                onChange={(e) => updateField("secondaryColor", e.target.value)}
                className="w-12 h-10 p-1"
              />
              <Input
                value={formData.secondaryColor}
                onChange={(e) => updateField("secondaryColor", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="backgroundColor">Cor de fundo</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                id="backgroundColor"
                value={formData.backgroundColor}
                onChange={(e) => updateField("backgroundColor", e.target.value)}
                className="w-12 h-10 p-1"
              />
              <Input
                value={formData.backgroundColor}
                onChange={(e) => updateField("backgroundColor", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="textColor">Cor do texto</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                id="textColor"
                value={formData.textColor}
                onChange={(e) => updateField("textColor", e.target.value)}
                className="w-12 h-10 p-1"
              />
              <Input
                value={formData.textColor}
                onChange={(e) => updateField("textColor", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="accentColor">Cor de destaque</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                id="accentColor"
                value={formData.accentColor}
                onChange={(e) => updateField("accentColor", e.target.value)}
                className="w-12 h-10 p-1"
              />
              <Input
                value={formData.accentColor}
                onChange={(e) => updateField("accentColor", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        </div>
        {formData.logoUrl && (
          <div className="p-4 rounded-lg" style={{ backgroundColor: formData.backgroundColor }}>
            <p className="text-xs text-muted-foreground mb-2">Preview:</p>
            <img src={formData.logoUrl} alt="Logo preview" className="h-12" />
            <p style={{ color: formData.textColor }} className="mt-2">{formData.brandName || "Nome da Marca"}</p>
            <p style={{ color: formData.primaryColor }} className="text-sm">{formData.tagline || "Sua tagline aqui"}</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="content" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="welcomeMessage">Mensagem de boas-vindas</Label>
          <Textarea
            id="welcomeMessage"
            data-testid="input-welcomeMessage"
            value={formData.welcomeMessage}
            onChange={(e) => updateField("welcomeMessage", e.target.value)}
            placeholder="Bem-vindo ao nosso programa de influenciadores!"
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="termsAndConditions">Termos e condições</Label>
          <Textarea
            id="termsAndConditions"
            data-testid="input-termsAndConditions"
            value={formData.termsAndConditions}
            onChange={(e) => updateField("termsAndConditions", e.target.value)}
            placeholder="Descreva os termos do seu programa..."
            rows={4}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="privacyPolicy">Política de privacidade (opcional)</Label>
          <Textarea
            id="privacyPolicy"
            data-testid="input-privacyPolicy"
            value={formData.privacyPolicy}
            onChange={(e) => updateField("privacyPolicy", e.target.value)}
            placeholder="Descreva como os dados serão utilizados..."
            rows={3}
          />
        </div>
      </TabsContent>

      <TabsContent value="fields" className="space-y-4 mt-4">
        <p className="text-sm text-muted-foreground">Selecione quais informações coletar dos influenciadores:</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label htmlFor="collectSocialProfiles">Redes sociais</Label>
              <p className="text-xs text-muted-foreground">Instagram, TikTok, YouTube</p>
            </div>
            <Switch
              id="collectSocialProfiles"
              checked={formData.collectSocialProfiles}
              onCheckedChange={(checked) => updateField("collectSocialProfiles", checked)}
              data-testid="switch-collectSocialProfiles"
            />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label htmlFor="collectShippingAddress">Endereço para envio</Label>
              <p className="text-xs text-muted-foreground">Para envio de produtos (seeding)</p>
            </div>
            <Switch
              id="collectShippingAddress"
              checked={formData.collectShippingAddress}
              onCheckedChange={(checked) => updateField("collectShippingAddress", checked)}
              data-testid="switch-collectShippingAddress"
            />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label htmlFor="collectClothingSize">Tamanhos de roupa/calçado</Label>
              <p className="text-xs text-muted-foreground">Para envio de roupas personalizadas</p>
            </div>
            <Switch
              id="collectClothingSize"
              checked={formData.collectClothingSize}
              onCheckedChange={(checked) => updateField("collectClothingSize", checked)}
              data-testid="switch-collectClothingSize"
            />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label htmlFor="collectContentPreferences">Preferências de conteúdo</Label>
              <p className="text-xs text-muted-foreground">Tipos de conteúdo que o criador produz</p>
            </div>
            <Switch
              id="collectContentPreferences"
              checked={formData.collectContentPreferences}
              onCheckedChange={(checked) => updateField("collectContentPreferences", checked)}
              data-testid="switch-collectContentPreferences"
            />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label htmlFor="collectPaymentInfo">Dados de pagamento (PIX)</Label>
              <p className="text-xs text-muted-foreground">Para pagamento de comissões</p>
            </div>
            <Switch
              id="collectPaymentInfo"
              checked={formData.collectPaymentInfo}
              onCheckedChange={(checked) => updateField("collectPaymentInfo", checked)}
              data-testid="switch-collectPaymentInfo"
            />
          </div>
        </div>
      </TabsContent>

      <DialogFooter className="mt-6">
        <Button onClick={onSubmit} disabled={isLoading || !formData.slug || !formData.brandName} data-testid="button-save-landing">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {isEdit ? "Salvar alterações" : "Criar landing page"}
        </Button>
      </DialogFooter>
    </Tabs>
  );
}
