import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Building2, MapPin, Phone, Mail, Save, Loader2, Upload, Globe, Instagram, Image, Eye, ExternalLink, Compass } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CompanyData {
  id: number;
  name: string;
  tradeName: string | null;
  description: string | null;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  cep: string | null;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  complement: string | null;
  logo: string | null;
  slug: string | null;
  coverPhoto: string | null;
  category: string | null;
  tagline: string | null;
  isDiscoverable: boolean;
  isFeatured: boolean;
}

interface ActiveCompanyResponse {
  companyId: number;
  userId: number;
  role: string;
  company: CompanyData;
}

interface FormData {
  name: string;
  tradeName: string;
  description: string;
  cnpj: string;
  phone: string;
  email: string;
  website: string;
  instagram: string;
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement: string;
  tagline: string;
  category: string;
  isDiscoverable: boolean;
}

const categoryOptions = [
  { value: "saude", label: "Saúde" },
  { value: "beleza", label: "Beleza" },
  { value: "moda", label: "Moda" },
  { value: "tecnologia", label: "Tecnologia" },
  { value: "alimentos", label: "Alimentos" },
  { value: "bebidas", label: "Bebidas" },
  { value: "fitness", label: "Fitness" },
  { value: "casa", label: "Casa & Decoração" },
  { value: "pets", label: "Pets" },
  { value: "infantil", label: "Infantil" },
  { value: "servicos", label: "Serviços" },
  { value: "outros", label: "Outros" },
];

export default function CompanyProfile() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    tradeName: "",
    description: "",
    cnpj: "",
    phone: "",
    email: "",
    website: "",
    instagram: "",
    cep: "",
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    complement: "",
    tagline: "",
    category: "",
    isDiscoverable: false,
  });
  const [coverPhotoPreview, setCoverPhotoPreview] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: activeCompany, isLoading } = useQuery<ActiveCompanyResponse>({
    queryKey: ["/api/active-company"],
    queryFn: async () => {
      const res = await fetch("/api/active-company", { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao carregar empresa");
      return res.json();
    },
  });

  const company = activeCompany?.company;

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        tradeName: company.tradeName || "",
        description: company.description || "",
        cnpj: company.cnpj || "",
        phone: company.phone || "",
        email: company.email || "",
        website: company.website || "",
        instagram: company.instagram || "",
        cep: company.cep || "",
        street: company.street || "",
        number: company.number || "",
        neighborhood: company.neighborhood || "",
        city: company.city || "",
        state: company.state || "",
        complement: company.complement || "",
        tagline: company.tagline || "",
        category: company.category || "",
        isDiscoverable: company.isDiscoverable || false,
      });
      setLogoPreview(company.logo);
      setCoverPhotoPreview(company.coverPhoto);
    }
  }, [company]);

  const handleCoverPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Arquivo inválido", {
        description: "Por favor, selecione uma imagem.",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande", {
        description: "O tamanho máximo é 5MB.",
      });
      return;
    }

    setIsUploadingCover(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("avatar", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formDataUpload,
      });

      if (!res.ok) {
        throw new Error("Erro ao fazer upload");
      }

      const data = await res.json();
      setCoverPhotoPreview(data.url);

      if (company) {
        const updateRes = await fetch(`/api/companies/${company.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ 
            name: company.name,
            coverPhoto: data.url 
          }),
        });
        
        if (!updateRes.ok) {
          const error = await updateRes.json();
          throw new Error(error.error || "Erro ao salvar foto de capa");
        }
        
        queryClient.invalidateQueries({ queryKey: ["/api/active-company"] });
        queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
        toast.success("Foto de capa atualizada!", {
          description: "A foto de capa foi atualizada com sucesso.",
        });
      }
    } catch (error) {
      toast.error("Erro ao enviar imagem", {
        description: "Tente novamente mais tarde.",
      });
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Arquivo inválido", {
        description: "Por favor, selecione uma imagem.",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande", {
        description: "O tamanho máximo é 5MB.",
      });
      return;
    }

    setIsUploadingLogo(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("avatar", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formDataUpload,
      });

      if (!res.ok) {
        throw new Error("Erro ao fazer upload");
      }

      const data = await res.json();
      setLogoPreview(data.url);

      if (company) {
        const updateRes = await fetch(`/api/companies/${company.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ 
            name: company.name,
            logo: data.url 
          }),
        });
        
        if (!updateRes.ok) {
          const error = await updateRes.json();
          throw new Error(error.error || "Erro ao salvar logo");
        }
        
        queryClient.invalidateQueries({ queryKey: ["/api/active-company"] });
        queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
        toast.success("Logo atualizada!", {
          description: "A logo da sua loja foi atualizada.",
        });
      }
    } catch (error) {
      toast.error("Erro ao enviar imagem", {
        description: "Tente novamente mais tarde.",
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const formatCNPJ = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    return digits
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  const validateCNPJ = (cnpj: string): boolean => {
    const digits = cnpj.replace(/\D/g, "");
    if (digits.length !== 14) return false;
    if (/^(\d)\1+$/.test(digits)) return false;
    
    let sum = 0;
    let weight = 5;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(digits[i]) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    let remainder = sum % 11;
    const firstDigit = remainder < 2 ? 0 : 11 - remainder;
    if (parseInt(digits[12]) !== firstDigit) return false;

    sum = 0;
    weight = 6;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(digits[i]) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    remainder = sum % 11;
    const secondDigit = remainder < 2 ? 0 : 11 - remainder;
    return parseInt(digits[13]) === secondDigit;
  };

  const [cnpjError, setCnpjError] = useState<string | null>(null);
  const [isEnrichingCnpj, setIsEnrichingCnpj] = useState(false);
  const [isEnrichingWebsite, setIsEnrichingWebsite] = useState(false);
  const lastEnrichedCnpjRef = useRef<string>("");
  const lastEnrichedWebsiteRef = useRef<string>("");

  const handleCnpjBlur = async () => {
    const digits = formData.cnpj.replace(/\D/g, "");
    if (digits.length === 0) {
      setCnpjError(null);
      return;
    }
    if (digits.length !== 14) {
      setCnpjError("CNPJ deve ter 14 dígitos");
      return;
    }
    if (!validateCNPJ(formData.cnpj)) {
      setCnpjError("CNPJ inválido");
      return;
    }
    setCnpjError(null);
    
    if (lastEnrichedCnpjRef.current === digits) {
      return;
    }
    
    lastEnrichedCnpjRef.current = digits;
    setIsEnrichingCnpj(true);
    try {
      const res = await fetch(`/api/enrichment/cnpj/${digits}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setFormData(prev => ({
            ...prev,
            tradeName: data.data.razaoSocial || prev.tradeName,
            cep: data.data.cep ? formatCEP(data.data.cep) : prev.cep,
            street: data.data.logradouro || prev.street,
            number: data.data.numero || prev.number,
            neighborhood: data.data.bairro || prev.neighborhood,
            city: data.data.municipio || prev.city,
            state: data.data.uf || prev.state,
            phone: data.data.telefone ? formatPhone(data.data.telefone) : prev.phone,
            email: data.data.email || prev.email,
          }));
          toast.success("Dados enriquecidos!", {
            description: "Informações da empresa foram preenchidas automaticamente."
          });
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 429) {
          toast.error("Limite atingido", {
            description: "Aguarde 1 minuto antes de tentar novamente."
          });
        } else if (res.status === 404) {
          toast.error("CNPJ não encontrado", {
            description: errorData.error || "Verifique se o CNPJ está correto."
          });
        }
      }
    } catch (error) {
      console.error("Erro ao enriquecer CNPJ:", error);
    } finally {
      setIsEnrichingCnpj(false);
    }
  };

  const handleWebsiteBlur = async () => {
    const websiteValue = formData.website.trim();
    if (!websiteValue || websiteValue.length < 5) {
      return;
    }
    
    if (lastEnrichedWebsiteRef.current === websiteValue) {
      return;
    }
    
    let url = websiteValue;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    
    lastEnrichedWebsiteRef.current = websiteValue;
    setIsEnrichingWebsite(true);
    try {
      const res = await fetch("/api/enrichment/website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ url }),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const updates: Partial<FormData> = {};
          let fieldsUpdated = 0;
          
          if (data.data.description && !formData.description) {
            updates.description = data.data.description;
            fieldsUpdated++;
          }
          if (data.data.category && !formData.category) {
            updates.category = data.data.category;
            fieldsUpdated++;
          }
          if (data.data.tagline && !formData.tagline) {
            updates.tagline = data.data.tagline;
            fieldsUpdated++;
          }
          if (data.data.socialMedia?.instagram && !formData.instagram) {
            const ig = data.data.socialMedia.instagram;
            if (ig && ig !== "null") {
              updates.instagram = ig.startsWith("@") ? ig : `@${ig}`;
              fieldsUpdated++;
            }
          }
          
          if (Object.keys(updates).length > 0) {
            setFormData(prev => ({ ...prev, ...updates }));
          }
          
          toast.success("Site analisado com IA!", {
            description: fieldsUpdated > 0 
              ? `${fieldsUpdated} campo(s) preenchido(s) automaticamente.`
              : "Análise completa, mas os campos já estavam preenchidos.",
          });
        }
      } else {
        const error = await res.json();
        toast.error("Erro ao analisar site", {
          description: error.error || "Tente novamente mais tarde.",
        });
      }
    } catch (error) {
      console.error("Erro ao enriquecer website:", error);
      toast.error("Erro ao analisar site");
    } finally {
      setIsEnrichingWebsite(false);
    }
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 10) {
      return digits
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  };

  const formatCEP = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    return digits.replace(/(\d{5})(\d)/, "$1-$2");
  };

  const handleCepBlur = async () => {
    const cepDigits = formData.cep.replace(/\D/g, "");
    if (cepDigits.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    let formattedValue = value;
    if (field === "cnpj") formattedValue = formatCNPJ(value);
    if (field === "phone") formattedValue = formatPhone(value);
    if (field === "cep") formattedValue = formatCEP(value);
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!company) throw new Error("Empresa não encontrada");
      const res = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao atualizar dados");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Dados atualizados!", {
        description: "As informações da empresa foram salvas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/active-company"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
    },
    onError: (error: Error) => {
      toast.error("Erro ao salvar", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Erro", {
        description: "O nome da loja é obrigatório",
      });
      return;
    }
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Building2 className="h-16 w-16 text-muted-foreground" />
        <p className="text-muted-foreground">Nenhuma empresa selecionada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="company-profile-page">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-4 px-4 py-3 border-b mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="page-title">Perfil da Empresa</h1>
            <p className="text-muted-foreground">Gerencie as informações da sua loja</p>
          </div>
          <div className="flex items-center gap-2">
            {company && (
              <Link href={`/company/${company.id}/profile`}>
                <Button variant="outline" data-testid="button-view-public-profile">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Perfil Público
                </Button>
              </Link>
            )}
            <Button
              type="submit"
              form="company-profile-form"
              disabled={updateMutation.isPending}
              className="min-w-[160px]"
              size="lg"
              data-testid="button-save-top"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
          </div>
        </div>
      </div>

      <form id="company-profile-form" onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Image className="h-5 w-5" />
                Logo da Empresa
              </CardTitle>
              <CardDescription>
                Esta imagem será exibida no menu e nas suas campanhas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div 
                  className="h-24 w-24 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-dashed border-muted-foreground/25 cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploadingLogo ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : logoPreview ? (
                    <img 
                      src={logoPreview} 
                      alt="Logo" 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Upload className="h-6 w-6" />
                      <span className="text-xs">Upload</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  data-testid="input-logo-upload"
                />
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    data-testid="button-upload-logo"
                  >
                    {isUploadingLogo ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Escolher imagem
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG ou GIF. Máximo 5MB.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Compass className="h-5 w-5 text-primary" />
                Visibilidade para Criadores
              </CardTitle>
              <CardDescription>
                Configure como sua empresa aparece na seção "Explorar Marcas" para criadores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg border bg-background">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="isDiscoverable" className="text-base font-medium">Aparecer em "Explorar Marcas"</Label>
                    {formData.isDiscoverable && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Ativo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Criadores poderão descobrir sua empresa e ver seus perfis e campanhas
                  </p>
                </div>
                <Switch
                  id="isDiscoverable"
                  checked={formData.isDiscoverable}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDiscoverable: checked }))}
                  data-testid="switch-discoverable"
                />
              </div>

              {formData.isDiscoverable && (
                <>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="coverPhoto">Foto de Capa</Label>
                      <p className="text-xs text-muted-foreground">Imagem de destaque para o card da sua empresa (recomendado 4:3)</p>
                      <div 
                        className="relative h-48 w-full rounded-lg bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-muted-foreground/25 cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => coverFileInputRef.current?.click()}
                      >
                        {isUploadingCover ? (
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        ) : coverPhotoPreview ? (
                          <img 
                            src={coverPhotoPreview} 
                            alt="Capa" 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Upload className="h-8 w-8" />
                            <span className="text-sm">Clique para enviar foto de capa</span>
                          </div>
                        )}
                      </div>
                      <input
                        ref={coverFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCoverPhotoUpload}
                        className="hidden"
                        data-testid="input-cover-upload"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="tagline">Slogan / Tagline</Label>
                      <Input
                        id="tagline"
                        value={formData.tagline}
                        onChange={(e) => handleInputChange("tagline", e.target.value)}
                        placeholder="Ex: Transformando vidas através da beleza"
                        maxLength={100}
                        data-testid="input-tagline"
                      />
                      <p className="text-xs text-muted-foreground">{formData.tagline.length}/100 caracteres</p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Ajuda criadores a encontrar sua empresa por segmento</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5" />
                Dados da Empresa
              </CardTitle>
              <CardDescription>
                Informações principais da sua loja
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome da Loja *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Nome fantasia"
                  data-testid="input-name"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="tradeName">Razão Social</Label>
                  <Input
                    id="tradeName"
                    value={formData.tradeName}
                    onChange={(e) => handleInputChange("tradeName", e.target.value)}
                    placeholder="Razão social da empresa"
                    data-testid="input-trade-name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <div className="relative">
                    <Input
                      id="cnpj"
                      value={formData.cnpj}
                      onChange={(e) => handleInputChange("cnpj", e.target.value)}
                      onBlur={handleCnpjBlur}
                      placeholder="00.000.000/0001-00"
                      className={cnpjError ? "border-red-500" : ""}
                      data-testid="input-cnpj"
                    />
                    {isEnrichingCnpj && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {cnpjError && (
                    <p className="text-xs text-red-500">{cnpjError}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Descreva sua empresa..."
                  rows={3}
                  data-testid="input-description"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="(00) 00000-0000"
                    data-testid="input-phone"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="contato@empresa.com"
                    data-testid="input-email"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => handleInputChange("website", e.target.value)}
                      onBlur={handleWebsiteBlur}
                      placeholder="https://suaempresa.com"
                      className="pl-9"
                      data-testid="input-website"
                    />
                    {isEnrichingWebsite && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="instagram">Instagram</Label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="instagram"
                    value={formData.instagram}
                    onChange={(e) => handleInputChange("instagram", e.target.value)}
                    placeholder="@suaempresa"
                    className="pl-9"
                    data-testid="input-instagram"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5" />
                Endereço
              </CardTitle>
              <CardDescription>
                Endereço comercial da empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="relative">
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={(e) => handleInputChange("cep", e.target.value)}
                      onBlur={handleCepBlur}
                      placeholder="00000-000"
                      data-testid="input-cep"
                    />
                    {isLoadingCep && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="street">Rua</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => handleInputChange("street", e.target.value)}
                    placeholder="Nome da rua"
                    data-testid="input-street"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={formData.number}
                    onChange={(e) => handleInputChange("number", e.target.value)}
                    placeholder="123"
                    data-testid="input-number"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    value={formData.complement}
                    onChange={(e) => handleInputChange("complement", e.target.value)}
                    placeholder="Sala 1"
                    data-testid="input-complement"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => handleInputChange("neighborhood", e.target.value)}
                    placeholder="Centro"
                    data-testid="input-neighborhood"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="São Paulo"
                    data-testid="input-city"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    placeholder="SP"
                    maxLength={2}
                    data-testid="input-state"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </form>
    </div>
  );
}
