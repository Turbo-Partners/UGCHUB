import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, MapPin, Save, Loader2, Upload, Globe, Image, Eye, Compass, Instagram, Sparkles, ShoppingCart, ExternalLink } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ANNUAL_REVENUE_OPTIONS } from "@shared/constants";

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
  annualRevenue: string | null;
  isDiscoverable: boolean;
  isFeatured: boolean;
  // Enrichment fields
  brandColors: string[] | null;
  brandLogo: string | null;
  companyBriefing: string | null;
  structuredBriefing: {
    whatWeDo?: string;
    targetAudience?: string;
    brandVoice?: string;
    differentials?: string;
    idealContentTypes?: string[];
    avoidTopics?: string;
    referenceCreators?: string;
  } | null;
  aiContextSummary: string | null;
  websiteProducts: string[] | null;
  enrichmentScore: number | null;
  // CNPJ enrichment
  cnpjRazaoSocial: string | null;
  cnpjNomeFantasia: string | null;
  cnpjSituacao: string | null;
  cnpjAtividadePrincipal: string | null;
  cnpjDataAbertura: string | null;
  cnpjCapitalSocial: string | null;
  cnpjNaturezaJuridica: string | null;
  cnpjQsa: { nome: string; qual: string }[] | null;
  // Website enrichment
  websiteTitle: string | null;
  websiteDescription: string | null;
  websiteKeywords: string[] | null;
  websiteSocialLinks: Record<string, string> | null;
  websiteFaq: { question: string; answer: string }[] | null;
  // E-commerce enrichment
  ecommercePlatform: string | null;
  ecommerceProductCount: number | null;
  ecommerceCategories: string[] | null;
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
  annualRevenue: string;
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

const brazilianStates = [
  { value: "AC", label: "Acre (AC)" },
  { value: "AL", label: "Alagoas (AL)" },
  { value: "AM", label: "Amazonas (AM)" },
  { value: "AP", label: "Amapá (AP)" },
  { value: "BA", label: "Bahia (BA)" },
  { value: "CE", label: "Ceará (CE)" },
  { value: "DF", label: "Distrito Federal (DF)" },
  { value: "ES", label: "Espírito Santo (ES)" },
  { value: "GO", label: "Goiás (GO)" },
  { value: "MA", label: "Maranhão (MA)" },
  { value: "MG", label: "Minas Gerais (MG)" },
  { value: "MS", label: "Mato Grosso do Sul (MS)" },
  { value: "MT", label: "Mato Grosso (MT)" },
  { value: "PA", label: "Pará (PA)" },
  { value: "PB", label: "Paraíba (PB)" },
  { value: "PE", label: "Pernambuco (PE)" },
  { value: "PI", label: "Piauí (PI)" },
  { value: "PR", label: "Paraná (PR)" },
  { value: "RJ", label: "Rio de Janeiro (RJ)" },
  { value: "RN", label: "Rio Grande do Norte (RN)" },
  { value: "RO", label: "Rondônia (RO)" },
  { value: "RR", label: "Roraima (RR)" },
  { value: "RS", label: "Rio Grande do Sul (RS)" },
  { value: "SC", label: "Santa Catarina (SC)" },
  { value: "SE", label: "Sergipe (SE)" },
  { value: "SP", label: "São Paulo (SP)" },
  { value: "TO", label: "Tocantins (TO)" },
];

export function CompanyProfileSettings() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    tradeName: "",
    description: "",
    cnpj: "",
    phone: "",
    email: "",
    website: "",
    instagram: "",
    annualRevenue: "",
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
  const [isEnrichingCnpj, setIsEnrichingCnpj] = useState(false);
  const [isEnrichingWebsite, setIsEnrichingWebsite] = useState(false);
  const [isEnrichingInstagram, setIsEnrichingInstagram] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  const [instagramData, setInstagramData] = useState<{
    exists: boolean;
    followers?: number;
    followersDisplay?: string;
    bio?: string;
    isVerified?: boolean;
    engagementRate?: string;
  } | null>(null);
  const lastEnrichedCnpjRef = useRef<string>("");
  const lastEnrichedWebsiteRef = useRef<string>("");
  const lastEnrichedInstagramRef = useRef<string>("");
  const [coverPhotoPreview, setCoverPhotoPreview] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formInitializedRef = useRef(false);

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
    if (company && !formInitializedRef.current) {
      formInitializedRef.current = true;
      setFormData({
        name: company.name || "",
        tradeName: company.tradeName || "",
        description: company.description || "",
        cnpj: company.cnpj || "",
        phone: company.phone || "",
        email: company.email || "",
        website: company.website || "",
        instagram: company.instagram || "",
        annualRevenue: company.annualRevenue || "",
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
      lastEnrichedCnpjRef.current = company.cnpj?.replace(/\D/g, "") || "";
      lastEnrichedWebsiteRef.current = company.website || "";
      lastEnrichedInstagramRef.current = company.instagram?.replace("@", "") || "";
      setLogoPreview(company.logo);
      setCoverPhotoPreview(company.coverPhoto);
    }
  }, [company]);

  useEffect(() => {
    if (formData.state) {
      setIsLoadingCities(true);
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.state}/municipios?orderBy=nome`)
        .then(res => res.json())
        .then((data: Array<{ nome: string }>) => {
          const cityNames = data.map(c => c.nome);
          setCities(cityNames);
          // Match existing city value case-insensitively with IBGE list
          if (formData.city) {
            const match = cityNames.find(c => c.toLowerCase() === formData.city.toLowerCase());
            if (match && match !== formData.city) {
              setFormData(prev => ({ ...prev, city: match }));
            }
          }
        })
        .catch(() => {
          setCities([]);
        })
        .finally(() => {
          setIsLoadingCities(false);
        });
    } else {
      setCities([]);
    }
  }, [formData.state]);

  const handleCoverPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsUploadingCover(true);
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
      setCoverPhotoPreview(data.url);

      if (company) {
        const updateRes = await fetch(`/api/companies/${company.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name: company.name, coverPhoto: data.url }),
        });
        
        if (!updateRes.ok) {
          const error = await updateRes.json();
          throw new Error(error.error || "Erro ao salvar foto de capa");
        }
        
        queryClient.invalidateQueries({ queryKey: ["/api/active-company"] });
        queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
        toast.success("Foto de capa atualizada!");
      }
    } catch (error) {
      toast.error("Erro ao enviar imagem", { description: "Tente novamente mais tarde." });
    } finally {
      setIsUploadingCover(false);
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

      if (company) {
        const updateRes = await fetch(`/api/companies/${company.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name: company.name, logo: data.url }),
        });
        
        if (!updateRes.ok) {
          const error = await updateRes.json();
          throw new Error(error.error || "Erro ao salvar logo");
        }
        
        queryClient.invalidateQueries({ queryKey: ["/api/active-company"] });
        queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
        toast.success("Logo atualizado!");
      }
    } catch (error) {
      toast.error("Erro ao enviar imagem", { description: "Tente novamente mais tarde." });
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

  const validateCNPJ = (cnpj: string): boolean => {
    const digits = cnpj.replace(/\D/g, "");
    if (digits.length !== 14) return false;
    if (/^(\d)\1+$/.test(digits)) return false;
    let sum = 0;
    let weight = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 12; i++) {
      sum += parseInt(digits[i]) * weight[i];
    }
    let remainder = sum % 11;
    const firstDigit = remainder < 2 ? 0 : 11 - remainder;
    if (parseInt(digits[12]) !== firstDigit) return false;
    sum = 0;
    weight = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 13; i++) {
      sum += parseInt(digits[i]) * weight[i];
    }
    remainder = sum % 11;
    const secondDigit = remainder < 2 ? 0 : 11 - remainder;
    return parseInt(digits[13]) === secondDigit;
  };

  // Função de enriquecimento de CNPJ - pode ser chamada manualmente
  const enrichCnpj = async (forceRefresh = false) => {
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
    
    // Só pula se não for forceRefresh e já foi enriquecido
    if (!forceRefresh && lastEnrichedCnpjRef.current === digits) {
      return;
    }
    
    const previousCnpj = lastEnrichedCnpjRef.current;
    lastEnrichedCnpjRef.current = digits;
    setIsEnrichingCnpj(true);
    try {
      const res = await fetch(`/api/enrichment/cnpj/${digits}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const updates: Partial<FormData> = {
            tradeName: data.data.razaoSocial || formData.tradeName,
            cep: data.data.cep ? formatCEP(data.data.cep) : formData.cep,
            street: data.data.logradouro || formData.street,
            number: data.data.numero || formData.number,
            neighborhood: data.data.bairro || formData.neighborhood,
            city: data.data.municipio || formData.city,
            state: data.data.uf || formData.state,
            phone: data.data.telefone ? formatPhone(data.data.telefone) : formData.phone,
            email: data.data.email || formData.email,
          };
          
          // Use suggested category from CNAE if no category set
          if (!formData.category && data.data.suggestedCategory) {
            updates.category = data.data.suggestedCategory;
          }
          
          setFormData(prev => ({ ...prev, ...updates }));
          
          // Build detailed success message
          let description = "Informações da empresa foram preenchidas automaticamente.";
          const details: string[] = [];
          if (data.data.tempoMercado) details.push(data.data.tempoMercado);
          if (data.data.porte) details.push(`Porte: ${data.data.porte}`);
          if (data.data.situacaoOk === false) details.push("⚠️ CNPJ não está ativo");
          if (details.length > 0) description = details.join(" • ");
          
          toast.success("Dados enriquecidos!", { description });

          // Trigger automatic description generation if we have enough data
          if (!formData.description && (data.data.razaoSocial || updates.category)) {
            setTimeout(() => {
              generateDescriptionWithContext({
                cnpjData: {
                  razaoSocial: data.data.razaoSocial,
                  atividade: data.data.atividadePrincipal,
                  tempoMercado: data.data.tempoMercado,
                  porte: data.data.porte,
                }
              });
            }, 500);
          }
        }
      } else if (res.status === 429) {
        lastEnrichedCnpjRef.current = previousCnpj;
        toast.error("Limite atingido", {
          description: "Aguarde 1 minuto antes de tentar novamente."
        });
      } else if (res.status === 404) {
        toast.error("CNPJ não encontrado", {
          description: "Verifique se o CNPJ está correto."
        });
      } else if (res.status === 401) {
        lastEnrichedCnpjRef.current = previousCnpj;
        toast.error("Sessão expirada", {
          description: "Por favor, recarregue a página e tente novamente."
        });
      }
    } catch (error) {
      console.error("Erro ao enriquecer CNPJ:", error);
      lastEnrichedCnpjRef.current = previousCnpj;
      toast.error("Erro de conexão", {
        description: "Não foi possível conectar ao servidor."
      });
    } finally {
      setIsEnrichingCnpj(false);
    }
  };

  const handleCnpjBlur = async () => {
    await enrichCnpj(false);
  };

  // Função de enriquecimento de Website - pode ser chamada manualmente
  const enrichWebsite = async (forceRefresh = false) => {
    const websiteValue = formData.website.trim();
    if (!websiteValue || websiteValue.length < 5) {
      return;
    }
    
    // Só pula se não for forceRefresh e já foi enriquecido
    if (!forceRefresh && lastEnrichedWebsiteRef.current === websiteValue) {
      return;
    }
    
    let url = websiteValue;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    
    const previousWebsite = lastEnrichedWebsiteRef.current;
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
          
          // Se forceRefresh, sobrescreve campos existentes; caso contrário, só preenche vazios
          if (data.data.description && data.data.description !== "null" && (forceRefresh || !formData.description)) {
            updates.description = data.data.description;
            fieldsUpdated++;
          }
          if (data.data.category && data.data.category !== "null" && data.data.category !== null && (forceRefresh || !formData.category)) {
            updates.category = data.data.category;
            fieldsUpdated++;
          }
          if (data.data.tagline && data.data.tagline !== "null" && data.data.tagline !== null && (forceRefresh || !formData.tagline)) {
            updates.tagline = data.data.tagline;
            fieldsUpdated++;
          }
          if (data.data.socialMedia?.instagram && (forceRefresh || !formData.instagram)) {
            const ig = data.data.socialMedia.instagram;
            if (ig && ig !== "null" && ig !== null) {
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

          // Trigger automatic description generation with briefing if description is empty
          if (!formData.description && !updates.description && (data.data.description || data.data.products)) {
            setTimeout(() => {
              generateDescriptionWithContext({
                websiteData: {
                  description: data.data.description,
                  products: data.data.products,
                  ecommerce: data.data.isEcommerce,
                }
              });
            }, 500);
          }
        }
      } else if (res.status === 429) {
        lastEnrichedWebsiteRef.current = previousWebsite;
        toast.error("Limite atingido", {
          description: "Aguarde alguns minutos antes de tentar novamente."
        });
      } else if (res.status === 404) {
        toast.error("Site não encontrado", {
          description: "Verifique se a URL está correta e acessível."
        });
      } else if (res.status === 401) {
        lastEnrichedWebsiteRef.current = previousWebsite;
        toast.error("Sessão expirada", {
          description: "Por favor, recarregue a página e tente novamente."
        });
      } else {
        const error = await res.json();
        toast.error("Erro ao analisar site", {
          description: error.error || "Tente novamente mais tarde.",
        });
      }
    } catch (error) {
      console.error("Erro ao enriquecer website:", error);
      lastEnrichedWebsiteRef.current = previousWebsite;
      toast.error("Erro de conexão", {
        description: "Não foi possível conectar ao servidor."
      });
    } finally {
      setIsEnrichingWebsite(false);
    }
  };

  const handleWebsiteBlur = async () => {
    await enrichWebsite(false);
  };

  const enrichInstagram = async (forceRefresh = false) => {
    const usernameValue = formData.instagram?.replace("@", "").trim();
    if (!usernameValue || usernameValue.length < 1) return;
    
    if (!forceRefresh && lastEnrichedInstagramRef.current === usernameValue) {
      return;
    }
    
    const previousInstagram = lastEnrichedInstagramRef.current;
    lastEnrichedInstagramRef.current = usernameValue;
    setIsEnrichingInstagram(true);
    setInstagramData(null);
    
    try {
      const res = await fetch(`/api/enrichment/instagram/${encodeURIComponent(usernameValue)}`, {
        credentials: "include",
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setInstagramData({
            exists: true,
            followers: data.data.followers,
            followersDisplay: data.data.followersDisplay,
            bio: data.data.bio,
            isVerified: data.data.isVerified,
            engagementRate: data.data.engagementRate,
          });
          
          if (!formData.instagram.startsWith("@")) {
            setFormData(prev => ({ ...prev, instagram: `@${usernameValue}` }));
          }
          
          toast.success("Instagram validado!", {
            description: data.data.followersDisplay 
              ? `${data.data.followersDisplay} seguidores • ${data.data.engagementRate || "0%"} engajamento`
              : "Perfil encontrado com sucesso.",
          });
          
          // Trigger automatic description generation if description is empty
          if (!formData.description && (data.data.bio || data.data.followers)) {
            setTimeout(() => {
              generateDescriptionWithContext({
                instagramData: {
                  followers: data.data.followers,
                  bio: data.data.bio,
                  isVerified: data.data.isVerified,
                }
              });
            }, 500);
          }
        }
      } else if (res.status === 404) {
        setInstagramData({ exists: false });
        toast.error("Instagram não encontrado", {
          description: "Verifique se o @ está correto."
        });
      } else if (res.status === 429) {
        lastEnrichedInstagramRef.current = previousInstagram;
        toast.error("Limite atingido", {
          description: "Aguarde alguns minutos antes de tentar novamente."
        });
      } else {
        lastEnrichedInstagramRef.current = previousInstagram;
      }
    } catch (error) {
      console.error("Erro ao validar Instagram:", error);
      lastEnrichedInstagramRef.current = previousInstagram;
    } finally {
      setIsEnrichingInstagram(false);
    }
  };

  const handleInstagramBlur = async () => {
    await enrichInstagram(false);
  };

  const generateDescriptionWithContext = async (enrichmentContext?: {
    cnpjData?: { razaoSocial?: string; atividade?: string; tempoMercado?: string; porte?: string };
    websiteData?: { description?: string; products?: string[]; ecommerce?: boolean };
    instagramData?: { followers?: number; bio?: string; isVerified?: boolean };
  }) => {
    if (!company?.id) return;
    
    setIsGeneratingDescription(true);
    try {
      const contextData = {
        companyId: company.id,
        formData: {
          name: formData.name,
          tradeName: formData.tradeName,
          category: formData.category,
          tagline: formData.tagline,
          website: formData.website,
          instagram: formData.instagram,
          city: formData.city,
          state: formData.state,
        },
        enrichmentContext,
        includeBriefing: true,
      };
      
      const res = await fetch("/api/enrichment/generate-description-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(contextData),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const updates: Partial<FormData> = {};
          if (data.data.description) {
            updates.description = data.data.description;
          }
          if (data.data.tagline) {
            updates.tagline = data.data.tagline;
          }
          if (Object.keys(updates).length > 0) {
            setFormData(prev => ({ ...prev, ...updates }));
            toast.success("Descrição e tagline geradas com IA!", {
              description: "Revise os textos e faça ajustes se necessário."
            });
          }
        }
      } else {
        console.error("Erro ao gerar descrição");
      }
    } catch (error) {
      console.error("Erro ao gerar descrição:", error);
    } finally {
      setIsGeneratingDescription(false);
    }
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
      toast.success("Dados atualizados!");
      queryClient.invalidateQueries({ queryKey: ["/api/active-company"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      // Trigger enrichment after save if fields have values that weren't enriched yet
      const cnpjDigits = formData.cnpj.replace(/\D/g, "");
      if (cnpjDigits.length === 14 && lastEnrichedCnpjRef.current !== cnpjDigits) {
        setTimeout(() => enrichCnpj(false), 300);
      }
      if (formData.website && lastEnrichedWebsiteRef.current !== formData.website) {
        setTimeout(() => enrichWebsite(false), 600);
      }
    },
    onError: (error: Error) => {
      toast.error("Erro ao salvar", { description: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Erro", { description: "O nome da loja é obrigatório" });
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
    <div className="space-y-6" data-testid="company-profile-settings">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-4 px-4 py-3 border-b mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Perfil da Empresa</h2>
            <p className="text-muted-foreground text-sm">Gerencie as informações da sua loja</p>
          </div>
          <div className="flex items-center gap-2">
            {company && (
              <Link href={`/company/${company.id}/profile`}>
                <Button variant="outline" size="sm" data-testid="button-view-public-profile">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Perfil Público
                </Button>
              </Link>
            )}
            <Button 
              type="submit" 
              form="profile-settings-form"
              disabled={updateMutation.isPending} 
              size="lg"
              className="min-w-[160px]" 
              data-testid="button-save-profile-top"
            >
              {updateMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" />Salvar Alterações</>
              )}
            </Button>
          </div>
        </div>
      </div>

      <form id="profile-settings-form" onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Image className="h-5 w-5" />
                Identidade Visual
              </CardTitle>
              <CardDescription>Logo e foto de capa da empresa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div 
                  className="h-20 w-20 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-dashed border-muted-foreground/25 cursor-pointer hover:border-primary/50 transition-colors shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploadingLogo ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <Upload className="h-5 w-5 text-muted-foreground" />
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
                <div className="flex-1">
                  <Label className="text-sm font-medium">Logo</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG ou GIF. Máximo 5MB.</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Foto de Capa</Label>
                <div 
                  className="relative h-32 w-full rounded-lg bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-muted-foreground/25 cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => coverFileInputRef.current?.click()}
                >
                  {isUploadingCover ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : coverPhotoPreview ? (
                    <img src={coverPhotoPreview} alt="Capa" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Upload className="h-5 w-5" />
                      <span className="text-xs">Clique para enviar</span>
                    </div>
                  )}
                </div>
                <input ref={coverFileInputRef} type="file" accept="image/*" onChange={handleCoverPhotoUpload} className="hidden" data-testid="input-cover-upload" />
                <p className="text-xs text-muted-foreground mt-1">Recomendado: 1200x400px</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5" />
                Dados da Empresa
              </CardTitle>
              <CardDescription>Informações principais e contato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Loja *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} placeholder="Nome fantasia" data-testid="input-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <div className="relative">
                    <Input
                      id="cnpj"
                      value={formData.cnpj}
                      onChange={(e) => handleInputChange("cnpj", e.target.value)}
                      onBlur={handleCnpjBlur}
                      placeholder="00.000.000/0001-00"
                      className={cnpjError ? "border-red-500 pr-10" : "pr-10"}
                      data-testid="input-cnpj"
                    />
                    {isEnrichingCnpj && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {cnpjError && <p className="text-xs text-red-500">{cnpjError}</p>}
                  {isEnrichingCnpj && (
                    <p className="text-xs text-muted-foreground">Buscando dados na Receita Federal...</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="instagram"
                      value={formData.instagram}
                      onChange={(e) => handleInputChange("instagram", e.target.value)}
                      onBlur={handleInstagramBlur}
                      placeholder="@suaempresa"
                      className={`pl-9 pr-10 ${instagramData?.exists === false ? "border-red-500" : instagramData?.exists ? "border-green-500" : ""}`}
                      data-testid="input-instagram"
                    />
                    {isEnrichingInstagram && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {isEnrichingInstagram && (
                    <p className="text-xs text-muted-foreground">Validando Instagram...</p>
                  )}
                  {instagramData?.exists && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      {instagramData.isVerified && (
                        <span className="text-blue-500 font-medium">✓ Verificado</span>
                      )}
                      {instagramData.followersDisplay && (
                        <span>{instagramData.followersDisplay} seguidores</span>
                      )}
                      {instagramData.engagementRate && (
                        <span>{instagramData.engagementRate} engajamento</span>
                      )}
                    </div>
                  )}
                  {instagramData?.exists === false && (
                    <p className="text-xs text-red-500">Perfil não encontrado.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => handleInputChange("website", e.target.value)}
                      onBlur={handleWebsiteBlur}
                      placeholder="https://suaempresa.com"
                      className="pl-9 pr-10"
                      data-testid="input-website"
                    />
                    {isEnrichingWebsite && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {isEnrichingWebsite && (
                    <p className="text-xs text-muted-foreground">Analisando site...</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} placeholder="(00) 00000-0000" data-testid="input-phone" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} placeholder="contato@empresa.com" data-testid="input-email" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tradeName">Razão Social</Label>
                  <Input id="tradeName" value={formData.tradeName} onChange={(e) => handleInputChange("tradeName", e.target.value)} placeholder="Razão social" data-testid="input-tradename" />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger data-testid="select-category"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Faturamento Anual</Label>
                  <Select value={formData.annualRevenue} onValueChange={(value) => setFormData(prev => ({ ...prev, annualRevenue: value }))}>
                    <SelectTrigger data-testid="select-annual-revenue"><SelectValue placeholder="Selecionar faturamento" /></SelectTrigger>
                    <SelectContent>
                      {ANNUAL_REVENUE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              <CardDescription>Endereço comercial da empresa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="relative">
                    <Input id="cep" value={formData.cep} onChange={(e) => handleInputChange("cep", e.target.value)} onBlur={handleCepBlur} placeholder="00000-000" data-testid="input-cep" />
                    {isLoadingCep && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>}
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="street">Rua</Label>
                  <Input id="street" value={formData.street} onChange={(e) => handleInputChange("street", e.target.value)} placeholder="Nome da rua" data-testid="input-street" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number">Número</Label>
                  <Input id="number" value={formData.number} onChange={(e) => handleInputChange("number", e.target.value)} placeholder="123" data-testid="input-number" />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="complement">Complemento</Label>
                  <Input id="complement" value={formData.complement} onChange={(e) => handleInputChange("complement", e.target.value)} placeholder="Sala 1" data-testid="input-complement" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input id="neighborhood" value={formData.neighborhood} onChange={(e) => handleInputChange("neighborhood", e.target.value)} placeholder="Centro" data-testid="input-neighborhood" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Select value={formData.state} onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, state: value, city: "" }));
                  }}>
                    <SelectTrigger data-testid="select-state">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {brazilianStates.map((st) => (
                        <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  {formData.state && cities.length > 0 ? (
                    <Select value={cities.includes(formData.city) ? formData.city : ""} onValueChange={(value) => setFormData(prev => ({ ...prev, city: value }))}>
                      <SelectTrigger data-testid="select-city">
                        <SelectValue placeholder={isLoadingCities ? "Carregando..." : formData.city || "Selecione a cidade"} />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input id="city" value={formData.city} onChange={(e) => handleInputChange("city", e.target.value)} placeholder={formData.state ? "Carregando cidades..." : "Selecione o estado primeiro"} disabled={!formData.state} data-testid="input-city" />
                  )}
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
              <CardDescription>Configure como sua empresa aparece para criadores</CardDescription>
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
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDiscoverable: checked }))}
                  data-testid="switch-discoverable"
                />
              </div>

            </CardContent>
          </Card>

        </div>
      </form>

      {/* Link para Brand Canvas */}
      <Card className="border-none shadow-md bg-gradient-to-r from-violet-500/10 to-purple-500/10">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Brand Canvas</h3>
                <p className="text-sm text-muted-foreground">Configure a inteligência da sua marca para briefings e campanhas</p>
              </div>
            </div>
            <Link href="/company/brand-canvas">
              <Button variant="outline" className="gap-2">
                Abrir Canvas
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
