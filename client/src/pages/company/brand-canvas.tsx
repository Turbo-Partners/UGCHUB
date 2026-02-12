import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Building2, Image, ShoppingCart, Users, MessageSquare, Sparkles,
  Plus, X, Save, Loader2, ChevronRight, Lightbulb, GripVertical,
  Check, Ban, Trash2, UserPlus, Link2, Target, Megaphone, Wand2,
} from "lucide-react";
import { BRAND_VOICE_OPTIONS, IDEAL_CONTENT_TYPES } from "@shared/constants";
import type { BrandCanvas, BrandCanvasProduct, BrandCanvasPersona } from "@shared/schema";

// Cores e ícones por tab
const TAB_CONFIG = [
  { id: "marca", label: "Marca", icon: Building2, color: "blue" },
  { id: "referencias", label: "Referências", icon: Image, color: "purple" },
  { id: "produtos", label: "Produtos", icon: ShoppingCart, color: "emerald" },
  { id: "publico", label: "Público", icon: Users, color: "orange" },
  { id: "tom", label: "Tom & Estilo", icon: MessageSquare, color: "pink" },
  { id: "ganchos", label: "Ganchos", icon: Sparkles, color: "amber" },
] as const;

type TabId = typeof TAB_CONFIG[number]["id"];

// Gradient classes por cor
const GRADIENTS: Record<string, string> = {
  blue: "from-blue-500/20 to-blue-600/5",
  purple: "from-purple-500/20 to-purple-600/5",
  emerald: "from-emerald-500/20 to-emerald-600/5",
  orange: "from-orange-500/20 to-orange-600/5",
  pink: "from-pink-500/20 to-pink-600/5",
  amber: "from-amber-500/20 to-amber-600/5",
};

const ICON_GRADIENTS: Record<string, string> = {
  blue: "from-blue-500 to-blue-600",
  purple: "from-purple-500 to-purple-600",
  emerald: "from-emerald-500 to-emerald-600",
  orange: "from-orange-500 to-orange-600",
  pink: "from-pink-500 to-pink-600",
  amber: "from-amber-500 to-amber-600",
};

const ACTIVE_BORDER: Record<string, string> = {
  blue: "border-blue-500/50",
  purple: "border-purple-500/50",
  emerald: "border-emerald-500/50",
  orange: "border-orange-500/50",
  pink: "border-pink-500/50",
  amber: "border-amber-500/50",
};

interface CompanyInfo {
  id: number;
  name: string;
  tradeName?: string | null;
  cnpj?: string | null;
  website?: string | null;
  instagram?: string | null;
  category?: string | null;
  tagline?: string | null;
  city?: string | null;
  state?: string | null;
  enrichmentScore?: number | null;
}

interface CanvasResponse {
  brandCanvas: BrandCanvas | null;
  completionScore: number;
  enrichmentData: {
    websiteDescription?: string;
    websiteAbout?: string;
    websiteProducts?: string[];
    websiteKeywords?: string[];
    brandColors?: string[];
    brandLogo?: string;
    description?: string;
    tagline?: string;
    category?: string;
  };
}

// Estado vazio padrão
function emptyCanvas(): BrandCanvas {
  return {
    aboutBrand: "", whatWeDo: "", differentials: "",
    referenceCreators: "", competitorBrands: [], referenceUrls: [], brandAssets: [],
    products: [],
    targetAudience: "", personas: [],
    brandVoice: "", brandVoiceDescription: "", doList: [], dontList: [],
    idealContentTypes: [], avoidTopics: "",
    hooks: [], keyMessages: [], callToAction: "",
  };
}

export default function BrandCanvasPage() {
  const [activeTab, setActiveTab] = useState<TabId>("marca");
  const [canvas, setCanvas] = useState<BrandCanvas>(emptyCanvas());
  const [loaded, setLoaded] = useState(false);

  // Buscar company ativa
  const { data: activeCompany } = useQuery<{ company: CompanyInfo }>({
    queryKey: ["/api/active-company"],
  });
  const company = activeCompany?.company;
  const companyId = company?.id;

  // Buscar Brand Canvas
  const { data, isLoading } = useQuery<CanvasResponse>({
    queryKey: [`/api/companies/${companyId}/brand-canvas`],
    enabled: !!companyId,
    select: (d) => {
      if (!loaded && d.brandCanvas) {
        setCanvas({ ...emptyCanvas(), ...d.brandCanvas });
        setLoaded(true);
      } else if (!loaded) {
        setLoaded(true);
      }
      return d;
    },
  });

  const enrichment = data?.enrichmentData;

  // Mutation para salvar
  const saveMutation = useMutation({
    mutationFn: async (data: BrandCanvas) => {
      const res = await apiRequest("PUT", `/api/companies/${companyId}/brand-canvas`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/brand-canvas`] });
      queryClient.invalidateQueries({ queryKey: ["/api/active-company"] });
      toast.success("Brand Canvas salvo!");
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  // Helper para atualizar campo simples
  const set = useCallback(<K extends keyof BrandCanvas>(key: K, value: BrandCanvas[K]) => {
    setCanvas(prev => ({ ...prev, [key]: value }));
  }, []);

  // Calcular score localmente
  const completionScore = useMemo(() => {
    let filled = 0;
    const total = 12;
    if (canvas.aboutBrand?.trim()) filled++;
    if (canvas.whatWeDo?.trim()) filled++;
    if (canvas.differentials?.trim()) filled++;
    if (canvas.brandAssets?.length || canvas.referenceCreators?.trim() || canvas.referenceUrls?.length) filled++;
    if (canvas.products?.length) filled++;
    if (canvas.targetAudience?.trim()) filled++;
    if (canvas.personas?.length) filled++;
    if (canvas.brandVoice) filled++;
    if (canvas.doList?.length || canvas.dontList?.length) filled++;
    if (canvas.idealContentTypes?.length) filled++;
    if (canvas.hooks?.length) filled++;
    if (canvas.keyMessages?.length || canvas.callToAction?.trim()) filled++;
    return Math.round((filled / total) * 100);
  }, [canvas]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeConfig = TAB_CONFIG.find(t => t.id === activeTab)!;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Brand Canvas</h1>
            <p className="text-sm text-muted-foreground">Base de conhecimento da sua marca para briefings e campanhas</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1">
            <Progress value={completionScore} className="h-2" />
          </div>
          <span className="text-sm font-medium text-muted-foreground min-w-[3rem] text-right">
            {completionScore}%
          </span>
        </div>
      </div>

      {/* CTA Enriquecer Empresa com IA */}
      {company && <EnrichmentCTACard company={company} companyId={companyId!} />}

      {/* Tab navigation */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
        {TAB_CONFIG.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200
                ${isActive
                  ? `bg-gradient-to-b ${GRADIENTS[tab.color]} ${ACTIVE_BORDER[tab.color]} shadow-sm`
                  : "bg-card/50 border-border/50 hover:bg-muted/50"
                }
              `}
            >
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                isActive
                  ? `bg-gradient-to-br ${ICON_GRADIENTS[tab.color]} shadow-md`
                  : "bg-muted"
              }`}>
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-muted-foreground"}`} />
              </div>
              <span className={`text-xs font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="space-y-4 animate-in fade-in-0 duration-300" key={activeTab}>
        {activeTab === "marca" && (
          <TabMarca canvas={canvas} set={set} enrichment={enrichment} />
        )}
        {activeTab === "referencias" && (
          <TabReferencias canvas={canvas} set={set} enrichment={enrichment} />
        )}
        {activeTab === "produtos" && (
          <TabProdutos canvas={canvas} set={set} enrichment={enrichment} />
        )}
        {activeTab === "publico" && (
          <TabPublico canvas={canvas} set={set} enrichment={enrichment} />
        )}
        {activeTab === "tom" && (
          <TabTomEstilo canvas={canvas} set={set} enrichment={enrichment} />
        )}
        {activeTab === "ganchos" && (
          <TabGanchos canvas={canvas} set={set} />
        )}
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-lg p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className={`h-2 w-2 rounded-full ${saveMutation.isPending ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
            {saveMutation.isPending ? "Salvando..." : "Pronto para salvar"}
          </div>
          <Button
            onClick={() => saveMutation.mutate(canvas)}
            disabled={saveMutation.isPending}
            className="gap-2"
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Canvas
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Enriquecimento com IA
// ============================================================

function EnrichmentCTACard({ company, companyId }: { company: CompanyInfo; companyId: number }) {
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichStep, setEnrichStep] = useState("");

  const handleEnrich = async () => {
    setIsEnriching(true);
    let enrichedCount = 0;

    try {
      // 1. CNPJ enrichment
      const cnpjDigits = company.cnpj?.replace(/\D/g, "") || "";
      if (cnpjDigits.length === 14) {
        setEnrichStep("Consultando CNPJ...");
        try {
          const res = await fetch(`/api/enrichment/cnpj/${cnpjDigits}`, { credentials: "include" });
          if (res.ok) enrichedCount++;
        } catch { /* ignore */ }
      }

      // 2. Website enrichment
      if (company.website && company.website.length >= 5) {
        setEnrichStep("Analisando website...");
        let url = company.website;
        if (!url.startsWith("http")) url = "https://" + url;
        try {
          const res = await fetch("/api/enrichment/website", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ url }),
          });
          if (res.ok) enrichedCount++;
        } catch { /* ignore */ }
      }

      // 3. Instagram enrichment
      const igUser = company.instagram?.replace("@", "").trim();
      if (igUser && igUser.length > 0) {
        setEnrichStep("Validando Instagram...");
        try {
          const res = await fetch(`/api/enrichment/instagram/${encodeURIComponent(igUser)}`, { credentials: "include" });
          if (res.ok) enrichedCount++;
        } catch { /* ignore */ }
      }

      // 4. Generate briefing with AI
      setEnrichStep("Gerando briefing com IA...");
      try {
        await fetch("/api/enrichment/generate-description-v2", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            companyId: company.id,
            formData: {
              name: company.name,
              tradeName: company.tradeName,
              category: company.category,
              tagline: company.tagline,
              website: company.website,
              instagram: company.instagram,
              city: company.city,
              state: company.state,
            },
            includeBriefing: true,
          }),
        });
        enrichedCount++;
      } catch { /* ignore */ }

      // Refresh both company data and brand canvas
      queryClient.invalidateQueries({ queryKey: ["/api/active-company"] });
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/brand-canvas`] });

      if (enrichedCount > 0) {
        toast.success("Enriquecimento concluído!", {
          description: `${enrichedCount} fonte(s) processada(s). Dados atualizados.`,
        });
      } else {
        toast.error("Nenhum dado enriquecido", {
          description: "Preencha CNPJ, Website ou Instagram nas configurações antes de enriquecer.",
        });
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setIsEnriching(false);
      setEnrichStep("");
    }
  };

  return (
    <Card className="border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent overflow-hidden mb-6">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shrink-0">
            <Wand2 className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-semibold text-base">Enriquecer com IA</h3>
              {company.enrichmentScore != null && (
                <Badge variant="secondary" className="text-xs">
                  Score: {company.enrichmentScore}/100
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {isEnriching && enrichStep ? enrichStep : "Coleta automática via CNPJ, Website e Instagram para preencher o Canvas."}
            </p>
          </div>
          <Button
            onClick={handleEnrich}
            disabled={isEnriching}
            className="shrink-0 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-500/90 hover:to-purple-600/90 shadow-md"
            size="lg"
          >
            {isEnriching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enriquecendo...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Enriquecer Agora
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Componentes auxiliares
// ============================================================

interface TabProps {
  canvas: BrandCanvas;
  set: <K extends keyof BrandCanvas>(key: K, value: BrandCanvas[K]) => void;
  enrichment?: CanvasResponse["enrichmentData"];
}

function EnrichmentHint({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
      <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
      <span className="text-muted-foreground">{text}</span>
    </div>
  );
}

function SectionCard({ title, icon: Icon, color, children }: {
  title: string;
  icon: React.ElementType;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-none shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${ICON_GRADIENTS[color]} flex items-center justify-center`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <Separator className="mt-3" />
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

// ============================================================
// Tab 1 — Marca
// ============================================================
function TabMarca({ canvas, set, enrichment }: TabProps) {
  return (
    <div className="space-y-4">
      {enrichment?.websiteAbout && !canvas.aboutBrand?.trim() && (
        <EnrichmentHint text={`Extraído do seu site: "${enrichment.websiteAbout.slice(0, 150)}..."`} />
      )}

      <SectionCard title="Sobre a Marca" icon={Building2} color="blue">
        <div className="space-y-4">
          <div>
            <Label htmlFor="aboutBrand">Sobre a marca</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Conte a história da sua marca. Quem é, como surgiu, qual a missão.
            </p>
            <Textarea
              id="aboutBrand"
              value={canvas.aboutBrand || ""}
              onChange={e => set("aboutBrand", e.target.value)}
              placeholder="Nossa marca nasceu com o propósito de..."
              maxLength={500}
              rows={4}
              className="bg-muted/30 border-border/50 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{(canvas.aboutBrand || "").length}/500</p>
          </div>

          <div>
            <Label htmlFor="whatWeDo">O que fazemos</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Descreva seus produtos/serviços de forma clara e objetiva.
            </p>
            <Textarea
              id="whatWeDo"
              value={canvas.whatWeDo || ""}
              onChange={e => set("whatWeDo", e.target.value)}
              placeholder="Oferecemos produtos naturais para skincare..."
              maxLength={500}
              rows={3}
              className="bg-muted/30 border-border/50 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{(canvas.whatWeDo || "").length}/500</p>
          </div>

          <div>
            <Label htmlFor="differentials">Diferenciais</Label>
            <p className="text-xs text-muted-foreground mb-2">
              O que torna sua marca única? Por que os clientes escolhem você?
            </p>
            <Textarea
              id="differentials"
              value={canvas.differentials || ""}
              onChange={e => set("differentials", e.target.value)}
              placeholder="Somos a única marca que..."
              maxLength={500}
              rows={3}
              className="bg-muted/30 border-border/50 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{(canvas.differentials || "").length}/500</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ============================================================
// Tab 2 — Referências & Ativos
// ============================================================
function TabReferencias({ canvas, set }: TabProps) {
  const [newUrl, setNewUrl] = useState("");
  const [newCompetitor, setNewCompetitor] = useState("");

  const addUrl = () => {
    if (!newUrl.trim()) return;
    set("referenceUrls", [...(canvas.referenceUrls || []), newUrl.trim()]);
    setNewUrl("");
  };

  const addCompetitor = () => {
    if (!newCompetitor.trim()) return;
    set("competitorBrands", [...(canvas.competitorBrands || []), newCompetitor.trim()]);
    setNewCompetitor("");
  };

  return (
    <div className="space-y-4">
      <SectionCard title="Creators de Referência" icon={UserPlus} color="purple">
        <div>
          <Label htmlFor="refCreators">Quais creators/influencers representam o estilo da sua marca?</Label>
          <Textarea
            id="refCreators"
            value={canvas.referenceCreators || ""}
            onChange={e => set("referenceCreators", e.target.value)}
            placeholder="@creator1, @creator2 — descreva o estilo que gosta"
            rows={3}
            maxLength={500}
            className="bg-muted/30 border-border/50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
      </SectionCard>

      <SectionCard title="Marcas Concorrentes" icon={Target} color="purple">
        <div className="flex gap-2">
          <Input
            value={newCompetitor}
            onChange={e => setNewCompetitor(e.target.value)}
            placeholder="Nome da marca concorrente"
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCompetitor())}
            className="bg-muted/30 border-border/50"
          />
          <Button variant="outline" size="icon" onClick={addCompetitor}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(canvas.competitorBrands || []).map((brand, i) => (
            <Badge key={i} variant="secondary" className="gap-1 pr-1">
              {brand}
              <button
                onClick={() => set("competitorBrands", canvas.competitorBrands!.filter((_, j) => j !== i))}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="URLs de Referência" icon={Link2} color="purple">
        <p className="text-xs text-muted-foreground">
          Links de conteúdo, posts ou vídeos que representam o estilo desejado.
        </p>
        <div className="flex gap-2">
          <Input
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            placeholder="https://instagram.com/p/..."
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addUrl())}
            className="bg-muted/30 border-border/50"
          />
          <Button variant="outline" size="icon" onClick={addUrl}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {(canvas.referenceUrls || []).map((url, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
              <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm truncate flex-1">{url}</span>
              <button
                onClick={() => set("referenceUrls", canvas.referenceUrls!.filter((_, j) => j !== i))}
                className="hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ============================================================
// Tab 3 — Produtos
// ============================================================
function TabProdutos({ canvas, set, enrichment }: TabProps) {
  const products = canvas.products || [];

  const addProduct = () => {
    set("products", [...products, { name: "", description: "", benefits: "", valueProposition: "" }]);
  };

  const updateProduct = (index: number, field: keyof BrandCanvasProduct, value: string) => {
    const updated = [...products];
    updated[index] = { ...updated[index], [field]: value };
    set("products", updated);
  };

  const removeProduct = (index: number) => {
    set("products", products.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {enrichment?.websiteProducts?.length && !products.length ? (
        <EnrichmentHint text={`Produtos detectados no seu site: ${enrichment.websiteProducts.join(", ")}`} />
      ) : null}

      <SectionCard title="Produtos & Serviços" icon={ShoppingCart} color="emerald">
        <p className="text-xs text-muted-foreground">
          Cadastre seus principais produtos/serviços com detalhes para briefings mais precisos.
        </p>

        <div className="space-y-4">
          {products.map((product, i) => (
            <div key={i} className="p-4 rounded-xl border border-border/50 bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-xs text-white font-bold">
                    {i + 1}
                  </div>
                  <span className="text-sm font-medium">{product.name || `Produto ${i + 1}`}</span>
                </div>
                <button onClick={() => removeProduct(i)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Nome</Label>
                  <Input
                    value={product.name}
                    onChange={e => updateProduct(i, "name", e.target.value)}
                    placeholder="Nome do produto"
                    className="bg-muted/30 border-border/50 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Proposta de valor</Label>
                  <Input
                    value={product.valueProposition || ""}
                    onChange={e => updateProduct(i, "valueProposition", e.target.value)}
                    placeholder="O que torna único"
                    className="bg-muted/30 border-border/50 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Descrição</Label>
                  <Textarea
                    value={product.description || ""}
                    onChange={e => updateProduct(i, "description", e.target.value)}
                    placeholder="Descreva o produto"
                    rows={2}
                    className="bg-muted/30 border-border/50 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Benefícios</Label>
                  <Textarea
                    value={product.benefits || ""}
                    onChange={e => updateProduct(i, "benefits", e.target.value)}
                    placeholder="Principais benefícios"
                    rows={2}
                    className="bg-muted/30 border-border/50 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button variant="outline" onClick={addProduct} className="w-full gap-2 border-dashed">
          <Plus className="h-4 w-4" /> Adicionar produto
        </Button>
      </SectionCard>
    </div>
  );
}

// ============================================================
// Tab 4 — Público-Alvo
// ============================================================
function TabPublico({ canvas, set }: TabProps) {
  const personas = canvas.personas || [];

  const PERSONA_COLORS = ["violet", "sky", "rose", "lime", "cyan"];

  const addPersona = () => {
    set("personas", [...personas, { name: "", ageRange: "", painPoints: [], desires: [], blockers: [] }]);
  };

  const updatePersona = (index: number, field: keyof BrandCanvasPersona, value: any) => {
    const updated = [...personas];
    updated[index] = { ...updated[index], [field]: value };
    set("personas", updated);
  };

  const removePersona = (index: number) => {
    set("personas", personas.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <SectionCard title="Público-Alvo Geral" icon={Users} color="orange">
        <div>
          <Label htmlFor="targetAudience">Descrição do público-alvo</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Descreva quem é o cliente ideal da sua marca.
          </p>
          <Textarea
            id="targetAudience"
            value={canvas.targetAudience || ""}
            onChange={e => set("targetAudience", e.target.value)}
            placeholder="Mulheres de 25-40 anos, interessadas em skincare natural..."
            maxLength={500}
            rows={3}
            className="bg-muted/30 border-border/50 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
      </SectionCard>

      <SectionCard title="Personas" icon={Target} color="orange">
        <p className="text-xs text-muted-foreground">
          Crie personas detalhadas para guiar a criação de conteúdo.
        </p>

        <div className="space-y-4">
          {personas.map((persona, i) => {
            const color = PERSONA_COLORS[i % PERSONA_COLORS.length];
            return (
              <div key={i} className="p-4 rounded-xl border border-border/50 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full bg-gradient-to-br from-${color}-400 to-${color}-600 flex items-center justify-center text-white font-bold text-sm`}>
                      {(persona.name || "P")[0].toUpperCase()}
                    </div>
                    <div>
                      <Input
                        value={persona.name || ""}
                        onChange={e => updatePersona(i, "name", e.target.value)}
                        placeholder={`Persona ${i + 1}`}
                        className="bg-transparent border-none p-0 h-auto text-sm font-medium focus-visible:ring-0"
                      />
                      <Input
                        value={persona.ageRange || ""}
                        onChange={e => updatePersona(i, "ageRange", e.target.value)}
                        placeholder="Faixa etária: 25-35"
                        className="bg-transparent border-none p-0 h-auto text-xs text-muted-foreground focus-visible:ring-0"
                      />
                    </div>
                  </div>
                  <button onClick={() => removePersona(i)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <ListField
                    label="Dores"
                    items={persona.painPoints || []}
                    onChange={items => updatePersona(i, "painPoints", items)}
                    placeholder="Adicionar dor"
                    badgeColor="red"
                  />
                  <ListField
                    label="Desejos"
                    items={persona.desires || []}
                    onChange={items => updatePersona(i, "desires", items)}
                    placeholder="Adicionar desejo"
                    badgeColor="emerald"
                  />
                  <ListField
                    label="Bloqueios"
                    items={persona.blockers || []}
                    onChange={items => updatePersona(i, "blockers", items)}
                    placeholder="Adicionar bloqueio"
                    badgeColor="amber"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <Button variant="outline" onClick={addPersona} className="w-full gap-2 border-dashed">
          <UserPlus className="h-4 w-4" /> Adicionar persona
        </Button>
      </SectionCard>
    </div>
  );
}

// ============================================================
// Tab 5 — Tom & Estilo
// ============================================================
function TabTomEstilo({ canvas, set, enrichment }: TabProps) {
  return (
    <div className="space-y-4">
      <SectionCard title="Tom de Voz" icon={MessageSquare} color="pink">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Tom de voz principal</Label>
            <Select
              value={canvas.brandVoice || ""}
              onValueChange={v => set("brandVoice", v)}
            >
              <SelectTrigger className="bg-muted/30 border-border/50">
                <SelectValue placeholder="Selecione o tom" />
              </SelectTrigger>
              <SelectContent>
                {BRAND_VOICE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Descrição do tom</Label>
            <Input
              value={canvas.brandVoiceDescription || ""}
              onChange={e => set("brandVoiceDescription", e.target.value)}
              placeholder="Como uma amiga que entende de skincare"
              className="bg-muted/30 border-border/50"
            />
          </div>
        </div>
      </SectionCard>

      {/* DO's e DON'Ts lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-none shadow-md border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Check className="h-4 w-4 text-emerald-500" />
              </div>
              <CardTitle className="text-sm text-emerald-600 dark:text-emerald-400">DO's — Pode e deve</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ListField
              items={canvas.doList || []}
              onChange={items => set("doList", items)}
              placeholder="Adicionar DO"
              badgeColor="emerald"
            />
          </CardContent>
        </Card>

        <Card className="border-none shadow-md border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Ban className="h-4 w-4 text-red-500" />
              </div>
              <CardTitle className="text-sm text-red-600 dark:text-red-400">DON'Ts — Evitar</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ListField
              items={canvas.dontList || []}
              onChange={items => set("dontList", items)}
              placeholder="Adicionar DON'T"
              badgeColor="red"
            />
          </CardContent>
        </Card>
      </div>

      <SectionCard title="Tipos de Conteúdo Ideal" icon={Image} color="pink">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {IDEAL_CONTENT_TYPES.map(type => {
            const checked = (canvas.idealContentTypes || []).includes(type.value);
            return (
              <label
                key={type.value}
                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  checked ? "bg-pink-500/10 border-pink-500/30" : "border-border/50 hover:bg-muted/50"
                }`}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(c) => {
                    const current = canvas.idealContentTypes || [];
                    set("idealContentTypes", c
                      ? [...current, type.value]
                      : current.filter(v => v !== type.value)
                    );
                  }}
                />
                <span className="text-sm">{type.label}</span>
              </label>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="O que Evitar" icon={Ban} color="pink">
        <Textarea
          value={canvas.avoidTopics || ""}
          onChange={e => set("avoidTopics", e.target.value)}
          placeholder="Temas, palavras ou estilos que não combinam com a marca..."
          maxLength={500}
          rows={3}
          className="bg-muted/30 border-border/50 focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20"
        />
      </SectionCard>
    </div>
  );
}

// ============================================================
// Tab 6 — Ganchos & Messaging
// ============================================================
function TabGanchos({ canvas, set }: TabProps & { enrichment?: any }) {
  return (
    <div className="space-y-4">
      <SectionCard title="Ganchos que Funcionam" icon={Sparkles} color="amber">
        <p className="text-xs text-muted-foreground">
          Frases de abertura, hooks de vídeo e ganchos que performam bem com seu público.
        </p>
        <NumberedListField
          items={canvas.hooks || []}
          onChange={items => set("hooks", items)}
          placeholder="Ex: Você sabia que 90% das pessoas..."
          color="amber"
        />
      </SectionCard>

      <SectionCard title="Mensagens-Chave" icon={Megaphone} color="amber">
        <p className="text-xs text-muted-foreground">
          Mensagens que os creators devem transmitir ao falar da sua marca.
        </p>
        <NumberedListField
          items={canvas.keyMessages || []}
          onChange={items => set("keyMessages", items)}
          placeholder="Ex: Nosso produto é 100% natural"
          color="amber"
        />
      </SectionCard>

      <SectionCard title="Call to Action" icon={ChevronRight} color="amber">
        <div>
          <Label>CTA padrão</Label>
          <p className="text-xs text-muted-foreground mb-2">
            O que o público deve fazer após ver o conteúdo?
          </p>
          <Input
            value={canvas.callToAction || ""}
            onChange={e => set("callToAction", e.target.value)}
            placeholder="Use o cupom CREATOR20 e ganhe 20% off!"
            maxLength={300}
            className="bg-muted/30 border-border/50 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
      </SectionCard>
    </div>
  );
}

// ============================================================
// Componentes reutilizáveis
// ============================================================

function ListField({ label, items, onChange, placeholder, badgeColor }: {
  label?: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  badgeColor: string;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    if (!input.trim()) return;
    onChange([...items, input.trim()]);
    setInput("");
  };

  const colorMap: Record<string, string> = {
    red: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
    emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  };

  return (
    <div className="space-y-2">
      {label && <Label className="text-xs font-medium">{label}</Label>}
      <div className="flex gap-1.5">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={placeholder}
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), add())}
          className="bg-muted/30 border-border/50 text-sm h-8"
        />
        <Button variant="ghost" size="icon" onClick={add} className="h-8 w-8 shrink-0">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs ${colorMap[badgeColor] || ""}`}>
            {item}
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="hover:opacity-70">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function NumberedListField({ items, onChange, placeholder, color }: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  color: string;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    if (!input.trim()) return;
    onChange([...items, input.trim()]);
    setInput("");
  };

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-3 group">
          <div className={`h-7 w-7 rounded-full bg-gradient-to-br ${ICON_GRADIENTS[color]} flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5`}>
            {i + 1}
          </div>
          <div className="flex-1 p-2.5 rounded-lg bg-muted/30 border border-border/50 text-sm">
            {item}
          </div>
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive mt-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={placeholder}
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), add())}
          className="bg-muted/30 border-border/50"
        />
        <Button variant="outline" size="icon" onClick={add}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
