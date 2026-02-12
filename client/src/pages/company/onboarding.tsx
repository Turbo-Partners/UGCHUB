import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useMarketplace } from "@/lib/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  Building2, 
  Users, 
  ChevronRight, 
  ChevronLeft,
  Check,
  Loader2,
  Upload,
  UserPlus,
  Globe,
  ArrowRight,
  Sparkles,
  Phone,
  MapPin,
  Plug,
  Compass,
  Instagram
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { OnboardingIntegrations } from "@/components/onboarding-integrations";
import type { Company, CompanyMember } from "@shared/schema";
import { ANNUAL_REVENUE_OPTIONS } from "@shared/constants";

type ActiveCompanyResponse = CompanyMember & { company: Company };

interface FormData {
  name: string;
  tradeName: string;
  instagram: string;
  category: string;
  cnpj: string;
  phone: string;
  email: string;
  website: string;
  annualRevenue: string;
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement: string;
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

const brazilianStates = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
  { value: "EX", label: "Loja Estrangeira" },
];

const steps = [
  { id: 1, title: "Dados da Empresa", icon: Building2 },
  { id: 2, title: "Integrações", icon: Plug },
  { id: 3, title: "Equipe", icon: Users },
];

function matchCategory(cnaeDescription: string): string {
  if (!cnaeDescription) return "";
  const desc = cnaeDescription.toLowerCase();
  if (desc.includes("saude") || desc.includes("saúde") || desc.includes("farmac") || desc.includes("medic")) return "saude";
  if (desc.includes("beleza") || desc.includes("cosmet") || desc.includes("estetic")) return "beleza";
  if (desc.includes("moda") || desc.includes("vestuário") || desc.includes("roupa") || desc.includes("confec") || desc.includes("calçad")) return "moda";
  if (desc.includes("tecnologia") || desc.includes("informática") || desc.includes("software") || desc.includes("computad")) return "tecnologia";
  if (desc.includes("aliment") || desc.includes("comida") || desc.includes("restaur") || desc.includes("padaria") || desc.includes("chocolat")) return "alimentos";
  if (desc.includes("bebida") || desc.includes("cervej") || desc.includes("vinho")) return "bebidas";
  if (desc.includes("fitness") || desc.includes("academia") || desc.includes("esport") || desc.includes("suplement")) return "fitness";
  if (desc.includes("casa") || desc.includes("decoração") || desc.includes("moveis") || desc.includes("móveis")) return "casa";
  if (desc.includes("pet") || desc.includes("animal") || desc.includes("veterinár")) return "pets";
  if (desc.includes("infantil") || desc.includes("criança") || desc.includes("brinquedo")) return "infantil";
  return "outros";
}

export default function CompanyOnboarding() {
  const [, setLocation] = useLocation();
  const { user } = useMarketplace();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    tradeName: "",
    instagram: "",
    category: "",
    cnpj: "",
    phone: "",
    email: "",
    website: "",
    annualRevenue: "",
    cep: "",
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    complement: "",
    isDiscoverable: false,
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [cities, setCities] = useState<{ value: string; label: string }[]>([]);
  const citiesCache = useRef<Record<string, { value: string; label: string }[]>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");

  const { data: activeCompanyData, isLoading: loadingCompany } = useQuery<ActiveCompanyResponse>({
    queryKey: ["/api/active-company"],
    enabled: !!user && user.role === "company",
  });

  const companyId = activeCompanyData?.companyId;
  const company = activeCompanyData?.company;

  const fetchCities = useCallback(async (stateUf: string) => {
    if (stateUf === "EX" || !stateUf) {
      setCities([]);
      return;
    }
    if (citiesCache.current[stateUf]) {
      setCities(citiesCache.current[stateUf]);
      return;
    }
    setIsLoadingCities(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/ibge/municipios/v1/${stateUf}?providers=dados-abertos-br,gov,wikipedia`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const sorted = data
          .map((c: any) => ({ value: c.nome, label: c.nome }))
          .sort((a: any, b: any) => a.label.localeCompare(b.label));
        citiesCache.current[stateUf] = sorted;
        setCities(sorted);
      }
    } catch (error) {
      console.error("Erro ao buscar cidades:", error);
    } finally {
      setIsLoadingCities(false);
    }
  }, []);

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        tradeName: company.tradeName || "",
        instagram: (company as any).instagram || "",
        category: company.category || "",
        cnpj: company.cnpj || "",
        phone: company.phone || "",
        email: company.email || "",
        website: company.website || "",
        annualRevenue: company.annualRevenue || "",
        cep: company.cep || "",
        street: company.street || "",
        number: company.number || "",
        neighborhood: company.neighborhood || "",
        city: company.city || "",
        state: company.state || "",
        complement: company.complement || "",
        isDiscoverable: company.isDiscoverable || false,
      });
      setLogoPreview(company.logo || null);
      if (company.state && company.state !== "EX") {
        fetchCities(company.state);
      }
    }
  }, [company, fetchCities]);

  const updateCompanyMutation = useMutation({
    mutationFn: async (data: Partial<FormData & { logo?: string; onboardingCompleted?: boolean; description?: string; tagline?: string }>) => {
      const res = await fetch(`/api/companies/${companyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao salvar");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/active-company"] });
    },
  });

  const sendInviteMutation = useMutation({
    mutationFn: async (data: { email: string; role: "admin" | "member" }) => {
      const res = await fetch(`/api/companies/${companyId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao enviar convite");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Convite enviado!");
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "invites"] });
      setInviteEmail("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const { data: pendingInvites } = useQuery<any[]>({
    queryKey: ["/api/companies", companyId, "invites"],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/invites`, { credentials: "include" });
      if (!res.ok) return [];
      const data = await res.json();
      return data.filter((i: any) => i.status === "pending");
    },
    enabled: !!companyId && currentStep === 3,
  });

  const formatCNPJ = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    return digits
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
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

  const handleCnpjAutoFill = async (cnpjDigits: string) => {
    setIsLoadingCnpj(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjDigits}`);
      if (!res.ok) throw new Error("CNPJ não encontrado");
      const data = await res.json();

      const phoneRaw = data.ddd_telefone_1 || "";
      const formattedPhone = phoneRaw ? formatPhone(phoneRaw.replace(/\D/g, "")) : "";
      const matchedCategory = matchCategory(data.cnae_fiscal_descricao || "");
      const cepRaw = data.cep ? String(data.cep).replace(/\D/g, "") : "";

      setFormData(prev => ({
        ...prev,
        tradeName: data.razao_social || prev.tradeName,
        phone: formattedPhone || prev.phone,
        email: data.email || prev.email,
        city: data.municipio || prev.city,
        state: data.uf || prev.state,
        cep: cepRaw ? formatCEP(cepRaw) : prev.cep,
        street: data.logradouro || prev.street,
        number: data.numero || prev.number,
        neighborhood: data.bairro || prev.neighborhood,
        complement: data.complemento || prev.complement,
        category: matchedCategory || prev.category,
      }));

      if (data.uf && data.uf !== "EX") {
        fetchCities(data.uf);
      }

      toast.success("Dados preenchidos automaticamente!");
    } catch (error) {
      toast.error("Não foi possível buscar dados do CNPJ");
    } finally {
      setIsLoadingCnpj(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    if (typeof value === "boolean") {
      setFormData(prev => ({ ...prev, [field]: value }));
      return;
    }
    let formattedValue = value;
    if (field === "cnpj") {
      formattedValue = formatCNPJ(value);
      const digits = value.replace(/\D/g, "");
      if (digits.length === 14) {
        handleCnpjAutoFill(digits);
      }
    }
    if (field === "phone") formattedValue = formatPhone(value);
    if (field === "cep") formattedValue = formatCEP(value);
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const handleStateChange = (value: string) => {
    setFormData(prev => ({ ...prev, state: value, city: "" }));
    fetchCities(value);
  };

  const handleCepBlur = async () => {
    const cepDigits = formData.cep.replace(/\D/g, "");
    if (cepDigits.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        const newState = data.uf || formData.state;
        setFormData(prev => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: newState,
        }));
        if (newState && newState !== "EX") {
          fetchCities(newState);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Arquivo inválido", { description: "Por favor, selecione uma imagem." });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande", { description: "O tamanho máximo é 5MB." });
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

      if (!res.ok) throw new Error("Erro ao fazer upload");

      const data = await res.json();
      setLogoPreview(data.url);

      await updateCompanyMutation.mutateAsync({ name: formData.name || company?.name || "Minha Empresa", logo: data.url });
      toast.success("Logo atualizada!");
    } catch (error) {
      toast.error("Erro ao enviar imagem");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        toast.error("Nome da empresa é obrigatório");
        return;
      }
      try {
        const saveData = {
          ...formData,
          instagram: formData.instagram.replace(/^@/, ""),
        };
        await updateCompanyMutation.mutateAsync(saveData);
        setCurrentStep(2);
      } catch (error: any) {
        toast.error(error.message);
      }
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      const saveData = {
        ...formData,
        instagram: formData.instagram.replace(/^@/, ""),
      };
      await updateCompanyMutation.mutateAsync({ ...saveData, onboardingCompleted: true });
      await queryClient.invalidateQueries({ queryKey: ["/api/active-company"] });
      toast.success("Configuração concluída!");
      setLocation("/company/home");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSkip = async () => {
    try {
      await updateCompanyMutation.mutateAsync({ 
        name: formData.name || company?.name || "Minha Empresa",
        onboardingCompleted: true 
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/active-company"] });
      setLocation("/company/home");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSendInvite = () => {
    if (!inviteEmail.trim()) {
      toast.error("Email é obrigatório");
      return;
    }
    sendInviteMutation.mutate({ email: inviteEmail.trim(), role: inviteRole });
  };

  if (loadingCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Configure sua empresa</span>
          </motion.div>
          <h1 className="text-3xl font-bold font-heading mb-2">
            Bem-vindo ao CreatorConnect!
          </h1>
          <p className="text-muted-foreground">
            Vamos configurar sua empresa em poucos passos
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    currentStep >= step.id
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground/30 text-muted-foreground"
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 h-0.5 mx-2 transition-colors ${
                      currentStep > step.id ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 1 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      Dados da Empresa
                    </CardTitle>
                    <CardDescription>
                      Informações principais e contato
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <Avatar className="w-24 h-24">
                          <AvatarImage src={logoPreview || undefined} />
                          <AvatarFallback className="text-2xl">
                            {formData.name?.slice(0, 2).toUpperCase() || "EM"}
                          </AvatarFallback>
                        </Avatar>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingLogo}
                          className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                          data-testid="button-upload-logo"
                        >
                          {isUploadingLogo ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          data-testid="input-logo-upload"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">Clique para adicionar o logo</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome da Loja *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          placeholder="Nome fantasia"
                          data-testid="input-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cnpj">CNPJ</Label>
                        <div className="relative">
                          <Input
                            id="cnpj"
                            value={formData.cnpj}
                            onChange={(e) => handleInputChange("cnpj", e.target.value)}
                            placeholder="00.000.000/0001-00"
                            data-testid="input-cnpj"
                          />
                          {isLoadingCnpj && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="instagram" className="flex items-center gap-1">
                          <Instagram className="w-3.5 h-3.5" />
                          @Instagram
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                          <Input
                            id="instagram"
                            value={formData.instagram.replace(/^@/, "")}
                            onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value.replace(/^@/, "") }))}
                            placeholder="suaempresa"
                            className="pl-7"
                            data-testid="input-instagram"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={formData.website}
                          onChange={(e) => handleInputChange("website", e.target.value)}
                          placeholder="https://suaempresa.com"
                          data-testid="input-website"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          placeholder="(00) 00000-0000"
                          data-testid="input-phone"
                        />
                      </div>
                      <div className="space-y-2">
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tradeName">Razão Social</Label>
                        <Input
                          id="tradeName"
                          value={formData.tradeName}
                          onChange={(e) => handleInputChange("tradeName", e.target.value)}
                          placeholder="Razão social"
                          data-testid="input-trade-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Categoria</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({ ...formData, category: value })}
                        >
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {categoryOptions.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="annualRevenue">Faturamento Anual</Label>
                        <Select
                          value={formData.annualRevenue}
                          onValueChange={(value) => setFormData({ ...formData, annualRevenue: value })}
                        >
                          <SelectTrigger data-testid="select-annual-revenue">
                            <SelectValue placeholder="Selecionar faturamento" />
                          </SelectTrigger>
                          <SelectContent>
                            {ANNUAL_REVENUE_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Endereço
                    </CardTitle>
                    <CardDescription>
                      Endereço comercial da empresa
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
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
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="street">Rua</Label>
                        <Input
                          id="street"
                          value={formData.street}
                          onChange={(e) => handleInputChange("street", e.target.value)}
                          placeholder="Nome da rua"
                          data-testid="input-street"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="number">Número</Label>
                        <Input
                          id="number"
                          value={formData.number}
                          onChange={(e) => handleInputChange("number", e.target.value)}
                          placeholder="123"
                          data-testid="input-number"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="complement">Complemento</Label>
                        <Input
                          id="complement"
                          value={formData.complement}
                          onChange={(e) => handleInputChange("complement", e.target.value)}
                          placeholder="Sala 1"
                          data-testid="input-complement"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="neighborhood">Bairro</Label>
                        <Input
                          id="neighborhood"
                          value={formData.neighborhood}
                          onChange={(e) => handleInputChange("neighborhood", e.target.value)}
                          placeholder="Centro"
                          data-testid="input-neighborhood"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="state">Estado</Label>
                        <Select
                          value={formData.state}
                          onValueChange={handleStateChange}
                        >
                          <SelectTrigger data-testid="select-state">
                            <SelectValue placeholder="Selecione o estado" />
                          </SelectTrigger>
                          <SelectContent>
                            {brazilianStates.map((st) => (
                              <SelectItem key={st.value} value={st.value}>
                                {st.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">Cidade</Label>
                        {formData.state === "EX" ? (
                          <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => handleInputChange("city", e.target.value)}
                            placeholder="Nome da cidade"
                            data-testid="input-city"
                          />
                        ) : (
                          <div className="relative">
                            <Select
                              value={formData.city}
                              onValueChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
                              disabled={!formData.state || isLoadingCities}
                            >
                              <SelectTrigger data-testid="select-city">
                                <SelectValue placeholder={isLoadingCities ? "Carregando..." : "Selecione a cidade"} />
                              </SelectTrigger>
                              <SelectContent>
                                {cities.map((city) => (
                                  <SelectItem key={city.value} value={city.value}>
                                    {city.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {isLoadingCities && (
                              <div className="absolute right-10 top-1/2 -translate-y-1/2">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Compass className="w-5 h-5 text-primary" />
                      Visibilidade para Criadores
                    </CardTitle>
                    <CardDescription>
                      Configure como sua empresa aparece para criadores
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-background">
                      <div className="space-y-0.5">
                        <Label htmlFor="isDiscoverable" className="text-sm font-medium">Aparecer em "Explorar Marcas"</Label>
                        <p className="text-xs text-muted-foreground">Criadores poderão descobrir sua empresa</p>
                      </div>
                      <Switch
                        id="isDiscoverable"
                        checked={formData.isDiscoverable}
                        onCheckedChange={(checked) => handleInputChange("isDiscoverable", checked)}
                        data-testid="switch-discoverable"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plug className="w-5 h-5 text-primary" />
                    Integrações
                  </CardTitle>
                  <CardDescription>
                    Conecte suas redes sociais e lojas para gerenciar tudo em um só lugar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <OnboardingIntegrations />
                  <div className="mt-6 p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground text-center">
                      Você pode pular esta etapa e configurar integrações depois em Configurações → Integrações
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Convide sua Equipe
                  </CardTitle>
                  <CardDescription>
                    Adicione membros da sua equipe para colaborar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        placeholder="email@exemplo.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        data-testid="input-invite-email"
                      />
                    </div>
                    <Select
                      value={inviteRole}
                      onValueChange={(value: "admin" | "member") => setInviteRole(value)}
                    >
                      <SelectTrigger className="w-36" data-testid="select-invite-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Membro</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleSendInvite}
                      disabled={sendInviteMutation.isPending}
                      data-testid="button-send-invite"
                    >
                      {sendInviteMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {pendingInvites && pendingInvites.length > 0 && (
                    <div className="space-y-2">
                      <Label>Convites Pendentes</Label>
                      <div className="space-y-2">
                        {pendingInvites.map((invite) => (
                          <div
                            key={invite.id}
                            className="flex items-center justify-between p-3 rounded-lg border"
                            data-testid={`invite-pending-${invite.id}`}
                          >
                            <span className="text-sm">{invite.email}</span>
                            <Badge variant="secondary">{invite.role}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground text-center">
                      Você pode pular esta etapa e convidar membros depois em Configurações → Equipe
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between mt-8">
          <div>
            {currentStep > 1 && (
              <Button variant="outline" onClick={handleBack} data-testid="button-back">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            )}
          </div>
          
          <div className="flex gap-3">
            {currentStep < 3 && (
              <Button variant="ghost" onClick={handleSkip} data-testid="button-skip">
                Pular
              </Button>
            )}
            
            {currentStep < 3 ? (
              <Button onClick={handleNext} disabled={updateCompanyMutation.isPending} data-testid="button-next">
                {updateCompanyMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Continuar
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={updateCompanyMutation.isPending} data-testid="button-complete">
                {updateCompanyMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Concluir
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
