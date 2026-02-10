import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, ArrowRight, CheckCircle, Instagram, Globe, MapPin, CreditCard, Package, Shirt, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";

interface BrandSettings {
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
  customFields?: Array<{ name: string; label: string; type: string; required: boolean; options?: string[] }>;
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  instagramHandle: string;
  tiktokHandle: string;
  youtubeHandle: string;
  website: string;
  bio: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  clothingSize: string;
  shoeSize: string;
  contentPreferences: string[];
  pixKey: string;
  pixKeyType: string;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
  customFields: Record<string, string>;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

const brazilianStates = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const clothingSizes = ["PP", "P", "M", "G", "GG", "XG", "XXG"];
const shoeSizes = ["34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"];
const contentTypes = [
  { id: "photo", label: "Fotos" },
  { id: "video", label: "Vídeos" },
  { id: "reels", label: "Reels/Shorts" },
  { id: "stories", label: "Stories" },
  { id: "unboxing", label: "Unboxing" },
  { id: "review", label: "Reviews" },
  { id: "tutorial", label: "Tutoriais" },
  { id: "lifestyle", label: "Lifestyle" },
];

export default function BrandedLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    instagramHandle: "",
    tiktokHandle: "",
    youtubeHandle: "",
    website: "",
    bio: "",
    addressStreet: "",
    addressNumber: "",
    addressComplement: "",
    addressCity: "",
    addressState: "",
    addressZip: "",
    clothingSize: "",
    shoeSize: "",
    contentPreferences: [],
    pixKey: "",
    pixKeyType: "",
    agreeToTerms: false,
    agreeToPrivacy: false,
    customFields: {},
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFormData(prev => ({
      ...prev,
      utmSource: params.get("utm_source") || undefined,
      utmMedium: params.get("utm_medium") || undefined,
      utmCampaign: params.get("utm_campaign") || undefined,
      utmContent: params.get("utm_content") || undefined,
      utmTerm: params.get("utm_term") || undefined,
    }));
  }, []);

  const { data: brandSettings, isLoading, error } = useQuery<BrandSettings>({
    queryKey: ["/api/m", slug],
    queryFn: async () => {
      const res = await fetch(`/api/m/${slug}`);
      if (!res.ok) throw new Error("Página não encontrada");
      return res.json();
    },
    enabled: !!slug,
  });

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", `/api/m/${slug}/submit`, data);
      return response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleContentPreference = (id: string) => {
    setFormData(prev => ({
      ...prev,
      contentPreferences: prev.contentPreferences.includes(id)
        ? prev.contentPreferences.filter(p => p !== id)
        : [...prev.contentPreferences, id]
    }));
  };

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!formData.fullName || !formData.email) {
        toast({ title: "Preencha os campos obrigatórios", description: "Nome e email são obrigatórios", variant: "destructive" });
        return false;
      }
      if (!formData.email.includes("@")) {
        toast({ title: "Email inválido", description: "Digite um email válido", variant: "destructive" });
        return false;
      }
      if (brandSettings?.collectSocialProfiles && !formData.instagramHandle && !formData.tiktokHandle) {
        toast({ title: "Redes sociais obrigatórias", description: "Informe pelo menos uma rede social", variant: "destructive" });
        return false;
      }
    }
    if (currentStep === 2 && brandSettings?.collectShippingAddress) {
      if (!formData.addressStreet || !formData.addressNumber || !formData.addressCity || !formData.addressState || !formData.addressZip) {
        toast({ title: "Endereço incompleto", description: "Preencha todos os campos obrigatórios do endereço", variant: "destructive" });
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    if (!formData.agreeToTerms) {
      toast({ title: "Aceite os termos", description: "Você precisa aceitar os termos para continuar", variant: "destructive" });
      return;
    }
    submitMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error || !brandSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Página não encontrada</h1>
            <p className="text-gray-500">Esta landing page não existe ou foi desativada.</p>
            <Button className="mt-4" onClick={() => navigate("/")}>Voltar ao início</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const bgColor = brandSettings.backgroundColor || "#f8fafc";
  const primaryColor = brandSettings.primaryColor || "#8b5cf6";
  const textColor = brandSettings.textColor || "#1f2937";
  const accentColor = brandSettings.accentColor || "#a78bfa";

  const totalSteps = 3;
  const showStep2 = brandSettings.collectShippingAddress || brandSettings.collectClothingSize || brandSettings.collectContentPreferences;
  const showStep3 = brandSettings.collectPaymentInfo || brandSettings.termsAndConditions;

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: bgColor }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: primaryColor }}>
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: textColor }}>Inscrição enviada!</h1>
          <p className="text-gray-600 mb-6">
            Obrigado por se inscrever no programa de {brandSettings.brandName}. 
            Entraremos em contato em breve!
          </p>
          {brandSettings.logoUrl && (
            <img src={brandSettings.logoUrl} alt={brandSettings.brandName} className="h-12 mx-auto" />
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: bgColor }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          {brandSettings.logoUrl ? (
            <img 
              src={brandSettings.logoUrl} 
              alt={brandSettings.brandName} 
              className="h-16 mx-auto mb-4"
              data-testid="brand-logo"
            />
          ) : (
            <h1 className="text-3xl font-bold mb-4" style={{ color: textColor }} data-testid="brand-name">
              {brandSettings.brandName}
            </h1>
          )}
          {brandSettings.tagline && (
            <p className="text-xl font-medium mb-2" style={{ color: primaryColor }} data-testid="brand-tagline">
              {brandSettings.tagline}
            </p>
          )}
          {brandSettings.description && (
            <p className="text-gray-600" data-testid="brand-description">{brandSettings.description}</p>
          )}
        </div>

        <div className="mb-6">
          <Progress value={(step / totalSteps) * 100} className="h-2" />
          <div className="flex justify-between mt-2 text-sm text-gray-500">
            <span className={step >= 1 ? "font-medium" : ""} style={step >= 1 ? { color: primaryColor } : undefined}>
              1. Dados básicos
            </span>
            <span className={step >= 2 ? "font-medium" : ""} style={step >= 2 ? { color: primaryColor } : undefined}>
              2. Endereço e preferências
            </span>
            <span className={step >= 3 ? "font-medium" : ""} style={step >= 3 ? { color: primaryColor } : undefined}>
              3. Pagamento
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" style={{ color: primaryColor }} />
                    Dados Básicos
                  </CardTitle>
                  <CardDescription>
                    {brandSettings.welcomeMessage || "Preencha seus dados para se inscrever no programa de influenciadores."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nome completo *</Label>
                      <Input
                        id="fullName"
                        data-testid="input-fullName"
                        value={formData.fullName}
                        onChange={(e) => updateField("fullName", e.target.value)}
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        data-testid="input-email"
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      data-testid="input-phone"
                      value={formData.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  {brandSettings.collectSocialProfiles && (
                    <>
                      <div className="border-t pt-4 mt-4">
                        <h3 className="font-medium mb-3 flex items-center gap-2">
                          <Instagram className="h-4 w-4" style={{ color: primaryColor }} />
                          Redes Sociais
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="instagram">Instagram *</Label>
                            <Input
                              id="instagram"
                              data-testid="input-instagram"
                              value={formData.instagramHandle}
                              onChange={(e) => updateField("instagramHandle", e.target.value)}
                              placeholder="@seuinsta"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="tiktok">TikTok</Label>
                            <Input
                              id="tiktok"
                              data-testid="input-tiktok"
                              value={formData.tiktokHandle}
                              onChange={(e) => updateField("tiktokHandle", e.target.value)}
                              placeholder="@seutiktok"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="youtube">YouTube</Label>
                            <Input
                              id="youtube"
                              data-testid="input-youtube"
                              value={formData.youtubeHandle}
                              onChange={(e) => updateField("youtubeHandle", e.target.value)}
                              placeholder="@seucanal"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="website">Website / Blog</Label>
                            <Input
                              id="website"
                              data-testid="input-website"
                              value={formData.website}
                              onChange={(e) => updateField("website", e.target.value)}
                              placeholder="https://seusite.com"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">Sobre você</Label>
                        <Textarea
                          id="bio"
                          data-testid="input-bio"
                          value={formData.bio}
                          onChange={(e) => updateField("bio", e.target.value)}
                          placeholder="Conte um pouco sobre você e seu conteúdo..."
                          rows={3}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter className="justify-end">
                  <Button onClick={nextStep} style={{ backgroundColor: primaryColor }} data-testid="button-next-step1">
                    Próximo <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" style={{ color: primaryColor }} />
                    Endereço e Preferências
                  </CardTitle>
                  <CardDescription>
                    Informações para envio de produtos e preferências de conteúdo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {brandSettings.collectShippingAddress && (
                    <div className="space-y-4">
                      <h3 className="font-medium flex items-center gap-2">
                        <Package className="h-4 w-4" style={{ color: primaryColor }} />
                        Endereço para envio
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="street">Rua / Avenida *</Label>
                          <Input
                            id="street"
                            data-testid="input-street"
                            value={formData.addressStreet}
                            onChange={(e) => updateField("addressStreet", e.target.value)}
                            placeholder="Nome da rua"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="number">Número *</Label>
                          <Input
                            id="number"
                            data-testid="input-number"
                            value={formData.addressNumber}
                            onChange={(e) => updateField("addressNumber", e.target.value)}
                            placeholder="123"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="complement">Complemento</Label>
                          <Input
                            id="complement"
                            data-testid="input-complement"
                            value={formData.addressComplement}
                            onChange={(e) => updateField("addressComplement", e.target.value)}
                            placeholder="Apto, bloco..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="zip">CEP *</Label>
                          <Input
                            id="zip"
                            data-testid="input-zip"
                            value={formData.addressZip}
                            onChange={(e) => updateField("addressZip", e.target.value)}
                            placeholder="00000-000"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">Cidade *</Label>
                          <Input
                            id="city"
                            data-testid="input-city"
                            value={formData.addressCity}
                            onChange={(e) => updateField("addressCity", e.target.value)}
                            placeholder="São Paulo"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">Estado *</Label>
                          <Select value={formData.addressState} onValueChange={(v) => updateField("addressState", v)}>
                            <SelectTrigger id="state" data-testid="select-state">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {brazilianStates.map(state => (
                                <SelectItem key={state} value={state}>{state}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {brandSettings.collectClothingSize && (
                    <div className="border-t pt-4">
                      <h3 className="font-medium mb-3 flex items-center gap-2">
                        <Shirt className="h-4 w-4" style={{ color: primaryColor }} />
                        Tamanhos (para envio de produtos)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="clothingSize">Tamanho de roupa</Label>
                          <Select value={formData.clothingSize} onValueChange={(v) => updateField("clothingSize", v)}>
                            <SelectTrigger id="clothingSize" data-testid="select-clothingSize">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {clothingSizes.map(size => (
                                <SelectItem key={size} value={size}>{size}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="shoeSize">Tamanho de calçado</Label>
                          <Select value={formData.shoeSize} onValueChange={(v) => updateField("shoeSize", v)}>
                            <SelectTrigger id="shoeSize" data-testid="select-shoeSize">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {shoeSizes.map(size => (
                                <SelectItem key={size} value={size}>{size}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {brandSettings.collectContentPreferences && (
                    <div className="border-t pt-4">
                      <h3 className="font-medium mb-3">Tipos de conteúdo que você produz</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {contentTypes.map(type => (
                          <div
                            key={type.id}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                              formData.contentPreferences.includes(type.id)
                                ? "border-current bg-opacity-10"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            style={formData.contentPreferences.includes(type.id) ? { borderColor: primaryColor, backgroundColor: `${primaryColor}10` } : undefined}
                            onClick={() => toggleContentPreference(type.id)}
                            data-testid={`content-type-${type.id}`}
                          >
                            <span className="text-sm font-medium">{type.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="justify-between">
                  <Button variant="outline" onClick={prevStep} data-testid="button-prev-step2">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                  </Button>
                  <Button onClick={nextStep} style={{ backgroundColor: primaryColor }} data-testid="button-next-step2">
                    Próximo <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            )}

            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" style={{ color: primaryColor }} />
                    Pagamento e Aceites
                  </CardTitle>
                  <CardDescription>
                    Informações para recebimento de comissões.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {brandSettings.collectPaymentInfo && (
                    <div className="space-y-4">
                      <h3 className="font-medium">Dados PIX</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="pixKeyType">Tipo de chave PIX</Label>
                          <Select value={formData.pixKeyType} onValueChange={(v) => updateField("pixKeyType", v)}>
                            <SelectTrigger id="pixKeyType" data-testid="select-pixKeyType">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cpf">CPF</SelectItem>
                              <SelectItem value="cnpj">CNPJ</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="phone">Telefone</SelectItem>
                              <SelectItem value="random">Chave aleatória</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pixKey">Chave PIX</Label>
                          <Input
                            id="pixKey"
                            data-testid="input-pixKey"
                            value={formData.pixKey}
                            onChange={(e) => updateField("pixKey", e.target.value)}
                            placeholder="Sua chave PIX"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4 space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" style={{ color: primaryColor }} />
                      Termos e Aceites
                    </h3>
                    
                    {brandSettings.termsAndConditions && (
                      <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto text-sm text-gray-600">
                        {brandSettings.termsAndConditions}
                      </div>
                    )}

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="terms"
                        checked={formData.agreeToTerms}
                        onCheckedChange={(checked) => updateField("agreeToTerms", checked)}
                        data-testid="checkbox-terms"
                      />
                      <label htmlFor="terms" className="text-sm">
                        Li e aceito os <span className="font-medium" style={{ color: primaryColor }}>Termos e Condições</span> do programa de influenciadores de {brandSettings.brandName} *
                      </label>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="privacy"
                        checked={formData.agreeToPrivacy}
                        onCheckedChange={(checked) => updateField("agreeToPrivacy", checked)}
                        data-testid="checkbox-privacy"
                      />
                      <label htmlFor="privacy" className="text-sm">
                        Li e aceito a <span className="font-medium" style={{ color: primaryColor }}>Política de Privacidade</span>
                      </label>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-between">
                  <Button variant="outline" onClick={prevStep} data-testid="button-prev-step3">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={submitMutation.isPending || !formData.agreeToTerms}
                    style={{ backgroundColor: primaryColor }}
                    data-testid="button-submit"
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                      </>
                    ) : (
                      "Enviar inscrição"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        <p className="text-center text-xs text-gray-400 mt-8">
          Powered by CreatorConnect
        </p>
      </div>
    </div>
  );
}
