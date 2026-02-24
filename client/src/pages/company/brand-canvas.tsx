import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { TagsInput } from "@/components/ui/tags-input";
import { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Save, Building2, Paintbrush, MessageSquare, ShoppingCart, Users, Sparkles, Image, Zap } from "lucide-react";
import type {
  BrandCanvasV2,
  BrandCanvasVisualIdentity,
  BrandCanvasVoice,
  BrandCanvasContentStrategy,
  BrandCanvasReference,
  BrandCanvasProduct,
  BrandCanvasPersona,
  BrandCanvasProcessingMeta,
  BrandCanvasProcessingStep,
} from "@shared/schema";

// Components
import { BrandCanvasHeader } from "@/components/brand-canvas/BrandCanvasHeader";
import { BrandCanvasAIPanel } from "@/components/brand-canvas/BrandCanvasAIPanel";
import { SectionCard } from "@/components/brand-canvas/SectionCard";
import { FieldWithAI } from "@/components/brand-canvas/FieldWithAI";
import { BrandCanvasVisualIdentitySheet } from "@/components/brand-canvas/BrandCanvasVisualIdentity";
import { BrandCanvasVoiceSheet } from "@/components/brand-canvas/BrandCanvasVoice";
import { BrandCanvasProductsSheet } from "@/components/brand-canvas/BrandCanvasProducts";
import { BrandCanvasAudienceSheet } from "@/components/brand-canvas/BrandCanvasAudience";
import { BrandCanvasContentSheet } from "@/components/brand-canvas/BrandCanvasContent";
import { BrandCanvasReferencesSheet } from "@/components/brand-canvas/BrandCanvasReferences";
import { BrandCanvasAnglesSheet } from "@/components/brand-canvas/BrandCanvasAngles";

// Sheet types
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

// ==========================================
// Types
// ==========================================

interface CanvasResponse {
  brandCanvas: BrandCanvasV2 | null;
  completionScore: number;
  processingStatus: BrandCanvasProcessingMeta;
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

type SectionSheet = 'identity' | 'visual' | 'voice' | 'products' | 'audience' | 'angles' | 'content' | 'references' | null;

function emptyCanvas(): BrandCanvasV2 {
  return {
    aboutBrand: "", whatWeDo: "", differentials: "",
    mission: "", vision: "", coreValues: [], slogan: "", marketPositioning: "",
    visualIdentity: { colors: {}, typography: {} },
    voice: { doList: [], dontList: [], personalityTraits: [], keywords: [], exampleCaptions: [] },
    products: [],
    targetAudience: "", demographics: "", personas: [], painPoints: [], desiredEmotions: [],
    problemsAndDesires: [], transformationStories: "", valueProposition: "", commercialStrategies: "",
    contentStrategy: { idealContentTypes: [], hooks: [], keyMessages: [], hashtagStrategy: [] },
    references: { referenceCreators: "", competitorBrands: [], competitors: [], referenceUrls: [], brandAssets: [], avoidWords: [] },
    processing: { version: 2, status: 'idle' },
  };
}

// ==========================================
// Section completion helpers
// ==========================================

function identityCompletion(c: BrandCanvasV2): number {
  // Aligned with backend: 5 identity checks
  const checks = [
    !!c.aboutBrand?.trim(), !!c.whatWeDo?.trim(), !!c.differentials?.trim(),
    !!c.mission?.trim(), !!(c.coreValues?.length),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function visualCompletion(c: BrandCanvasV2): number {
  const vi = c.visualIdentity || {};
  const checks = [!!vi.colors?.primary, !!vi.logoUrl, !!vi.visualAesthetic];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function voiceCompletion(c: BrandCanvasV2): number {
  const v = c.voice || {};
  // Aligned with backend: 3 voice checks (no personalityTraits)
  const checks = [
    !!(v.toneType || c.brandVoice),
    !!(v.doList?.length || c.doList?.length),
    !!(v.exampleCaptions?.length),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function productsCompletion(c: BrandCanvasV2): number {
  return c.products?.length ? 100 : 0;
}

function audienceCompletion(c: BrandCanvasV2): number {
  const checks = [
    !!c.targetAudience?.trim(), !!(c.personas?.length),
    !!(c.painPoints?.length), !!(c.desiredEmotions?.length),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function anglesCompletion(c: BrandCanvasV2): number {
  const checks = [
    !!(c.problemsAndDesires?.length), !!c.valueProposition?.trim(),
    !!c.commercialStrategies?.trim(),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function contentCompletion(c: BrandCanvasV2): number {
  const cs = c.contentStrategy || {};
  const checks = [
    !!(cs.idealContentTypes?.length || c.idealContentTypes?.length),
    !!(cs.hooks?.length || c.hooks?.length),
    !!(cs.keyMessages?.length || c.keyMessages?.length),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function referencesCompletion(c: BrandCanvasV2): number {
  const r = c.references || {};
  // Aligned with backend: competitors + referenceBrands
  const checks = [
    !!(r.competitors?.length),
    !!(r.referenceBrands?.length),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function identitySummary(c: BrandCanvasV2): string {
  return c.slogan?.trim() || c.aboutBrand?.trim() || c.whatWeDo?.trim() || "Missão, visão, valores e essência da marca";
}

function visualSummary(c: BrandCanvasV2): string {
  const parts: string[] = [];
  if (c.visualIdentity?.visualAesthetic) parts.push(c.visualIdentity.visualAesthetic);
  if (c.visualIdentity?.colors?.primary) parts.push(c.visualIdentity.colors.primary);
  return parts.length ? parts.join(" · ") : "Configure cores, logo e estética";
}

function voiceSummary(c: BrandCanvasV2): string {
  return c.voice?.toneType || c.brandVoice || "Defina o tom de voz da marca";
}

function productsSummary(c: BrandCanvasV2): string {
  if (!c.products?.length) return "Adicione produtos e serviços";
  return c.products.slice(0, 3).map(p => p.name).join(", ");
}

function audienceSummary(c: BrandCanvasV2): string {
  const parts: string[] = [];
  if (c.personas?.length) parts.push(`${c.personas.length} persona(s)`);
  if (c.painPoints?.length) parts.push(`${c.painPoints.length} dor(es)`);
  if (parts.length) return parts.join(" · ");
  return c.targetAudience?.trim()?.substring(0, 80) || "Cliente ideal, dores e emoções";
}

function anglesSummary(c: BrandCanvasV2): string {
  if (c.valueProposition?.trim()) return c.valueProposition.substring(0, 80);
  if (c.problemsAndDesires?.length) return `${c.problemsAndDesires.length} ângulo(s)`;
  return "Gatilhos, proposta de valor e estratégias";
}

function contentSummary(c: BrandCanvasV2): string {
  const types = c.contentStrategy?.idealContentTypes || c.idealContentTypes || [];
  if (types.length) return types.slice(0, 4).join(", ");
  return "Configure estratégia de conteúdo";
}

function referencesSummary(c: BrandCanvasV2): string {
  const r = c.references || {};
  const parts: string[] = [];
  if (r.competitors?.length) parts.push(`${r.competitors.length} concorrente(s)`);
  if (r.avoidWords?.length) parts.push(`${r.avoidWords.length} termo(s) a evitar`);
  if (r.referenceBrands?.length) parts.push(`${r.referenceBrands.length} ref.`);
  return parts.length ? parts.join(" · ") : "Concorrentes, referências e termos a evitar";
}

// ==========================================
// Main Component
// ==========================================

export default function BrandCanvasPage() {
  const [canvas, setCanvas] = useState<BrandCanvasV2>(emptyCanvas());
  const [activeSheet, setActiveSheet] = useState<SectionSheet>(null);
  const [aiPanelOpen, setAIPanelOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch active company
  const { data: companyData } = useQuery<any>({
    queryKey: ["/api/active-company"],
  });
  // company.id is always the Company table ID; companyData.id may be the companyMember.id
  const companyId = companyData?.company?.id ?? companyData?.companyId;

  // Fetch canvas data
  const { data: canvasData, isLoading } = useQuery<CanvasResponse>({
    queryKey: [`/api/companies/${companyId}/brand-canvas`],
    enabled: !!companyId,
  });

  // Load canvas data — skip if user has unsaved local edits
  useEffect(() => {
    if (canvasData?.brandCanvas && !isDirty) {
      setCanvas({ ...emptyCanvas(), ...canvasData.brandCanvas });
    }
  }, [canvasData]);

  // Polling for processing status
  const isPollingActive = !!companyId && (canvasData?.processingStatus?.status === 'processing' || canvas.processing?.status === 'processing' || isGenerating);

  const { data: statusData } = useQuery({
    queryKey: [`/api/companies/${companyId}/brand-canvas/status`],
    enabled: isPollingActive,
    refetchInterval: 2000,
  });

  // When processing completes or fails via polling, refetch canvas
  useEffect(() => {
    if (!statusData) return;
    const s = statusData as any;
    if (s.status === 'completed' || s.status === 'failed') {
      setIsGenerating(false);
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/brand-canvas`] });
      if (s.status === 'failed') {
        toast.error("Erro na análise de IA", { description: s.error || "Pipeline falhou. Tente novamente." });
      }
    }
  }, [statusData, companyId]);

  // Polling timeout — stop after 3 minutes
  useEffect(() => {
    if (!isGenerating) return;
    const timer = setTimeout(() => {
      setIsGenerating(false);
      toast.error("Timeout na geração", {
        description: "O pipeline demorou mais de 3 minutos. Tente novamente.",
        action: {
          label: "Tentar novamente",
          onClick: () => generateMutation.mutate({}),
        },
      });
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/brand-canvas`] });
    }, 180_000); // 3 minutes
    return () => clearTimeout(timer);
    // generateMutation is stable by ref (TanStack Query) — no need in deps
  }, [isGenerating, companyId]);

  // WebSocket listener for real-time updates
  useEffect(() => {
    if (!companyId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let ws: WebSocket | null = null;

    try {
      ws = new WebSocket(`${protocol}//${window.location.host}/ws/notifications`);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'brand_canvas:processing' && data.companyId === companyId) {
            setCanvas(prev => ({
              ...prev,
              processing: {
                ...prev.processing!,
                status: 'processing',
                currentStep: data.step,
                steps: prev.processing?.steps?.map(s =>
                  s.name === data.step ? { ...s, status: data.status } : s
                ),
              },
            }));
          }
          if (data.type === 'brand_canvas:completed' && data.companyId === companyId) {
            setIsGenerating(false);
            queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/brand-canvas`] });
            toast.success("Análise de IA concluída!", { description: `Score de confiança: ${data.confidenceScore}%` });
            setAIPanelOpen(false);
          }
          if (data.type === 'brand_canvas:failed' && data.companyId === companyId) {
            setIsGenerating(false);
            toast.error("Erro na análise de IA", {
              description: data.error || "Pipeline falhou. Verifique as configurações.",
              action: {
                label: "Tentar novamente",
                onClick: () => generateMutation.mutate({}),
              },
            });
            queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/brand-canvas`] });
          }
        } catch {}
      };
    } catch {}

    return () => { ws?.close(); };
  }, [companyId]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: BrandCanvasV2) => {
      if (!companyId) throw new Error("Company not loaded");
      const res = await apiRequest('PUT', `/api/companies/${companyId}/brand-canvas`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/brand-canvas`] });
      queryClient.invalidateQueries({ queryKey: ["/api/active-company"] });
      toast.success("Brand Canvas salvo!");
      setIsDirty(false);
    },
    onError: () => toast.error("Erro ao salvar Brand Canvas"),
  });

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: async (context?: { questionnaire?: any }) => {
      const res = await apiRequest('POST', `/api/companies/${companyId}/brand-canvas/generate`, context || {});
      return res.json();
    },
    onSuccess: () => {
      setAIPanelOpen(true);
      // Set initial processing state locally
      setCanvas(prev => ({
        ...prev,
        processing: {
          version: 2,
          status: 'processing',
          steps: [
            { name: 'cnpj', status: 'pending' },
            { name: 'website', status: 'pending' },
            { name: 'visual', status: 'pending' },
            { name: 'social', status: 'pending' },
            { name: 'voice', status: 'pending' },
            { name: 'synthesis', status: 'pending' },
          ],
        },
      }));
      toast.info("Pipeline de IA iniciado...");
    },
    onError: (error: any) => {
      console.error("[BrandCanvas] Generate error:", error);
      toast.error("Erro ao gerar Brand Canvas", { description: error?.message });
    },
  });

  // Apply mutation
  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("Company not loaded");
      const res = await apiRequest('POST', `/api/companies/${companyId}/brand-canvas/apply`);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/active-company"] });
      toast.success(`${data.appliedFields?.length || 0} campos aplicados!`);
    },
    onError: () => toast.error("Erro ao aplicar Brand Canvas"),
  });

  // Regenerate section mutation
  const regenerateMutation = useMutation({
    mutationFn: async (section: string) => {
      const res = await apiRequest('POST', `/api/companies/${companyId}/brand-canvas/generate-section`, { section });
      return res.json();
    },
    onSuccess: () => toast.info("Regenerando seção..."),
    onError: () => toast.error("Erro ao regenerar seção"),
  });

  // Canvas update helpers
  const updateCanvas = useCallback((partial: Partial<BrandCanvasV2>) => {
    setCanvas(prev => ({ ...prev, ...partial }));
    setIsDirty(true);
  }, []);

  const handleSave = () => saveMutation.mutate(canvas);

  // Auto-save when closing a sheet
  const handleSheetClose = useCallback(() => {
    setActiveSheet(null);
    if (isDirty) {
      saveMutation.mutate(canvas);
    }
  }, [isDirty, canvas, saveMutation]);

  const isProcessing = canvas.processing?.status === 'processing' || generateMutation.isPending;
  const completionScore = canvasData?.completionScore ?? 0;
  const processing = canvas.processing || canvasData?.processingStatus || { version: 2, status: 'idle' as const };
  // Processing progress for AI panel
  const processingSteps = processing.steps || [];
  const completedStepsCount = processingSteps.filter((s: BrandCanvasProcessingStep) => s.status === 'completed').length;
  const processingProgress = processingSteps.length > 0 ? Math.round((completedStepsCount / processingSteps.length) * 100) : 0;

  // Section cards config — 3 color categories
  const sections = [
    {
      id: 'identity' as SectionSheet,
      title: "Identidade",
      icon: Building2,
      color: "indigo",
      completion: identityCompletion(canvas),
      summary: identitySummary(canvas),
    },
    {
      id: 'visual' as SectionSheet,
      title: "Visual",
      icon: Paintbrush,
      color: "indigo",
      completion: visualCompletion(canvas),
      summary: visualSummary(canvas),
      section: 'visual' as const,
    },
    {
      id: 'voice' as SectionSheet,
      title: "Voz da Marca",
      icon: MessageSquare,
      color: "violet",
      completion: voiceCompletion(canvas),
      summary: voiceSummary(canvas),
      section: 'voice' as const,
    },
    {
      id: 'content' as SectionSheet,
      title: "Conteúdo",
      icon: Sparkles,
      color: "violet",
      completion: contentCompletion(canvas),
      summary: contentSummary(canvas),
      section: 'content' as const,
    },
    {
      id: 'products' as SectionSheet,
      title: "Produtos",
      icon: ShoppingCart,
      color: "teal",
      completion: productsCompletion(canvas),
      summary: productsSummary(canvas),
    },
    {
      id: 'audience' as SectionSheet,
      title: "Público-Alvo",
      icon: Users,
      color: "teal",
      completion: audienceCompletion(canvas),
      summary: audienceSummary(canvas),
      section: 'audience' as const,
    },
    {
      id: 'angles' as SectionSheet,
      title: "Ângulos & Gatilhos",
      icon: Zap,
      color: "teal",
      completion: anglesCompletion(canvas),
      summary: anglesSummary(canvas),
      section: 'angles' as const,
    },
    {
      id: 'references' as SectionSheet,
      title: "Referências",
      icon: Image,
      color: "teal",
      completion: referencesCompletion(canvas),
      summary: referencesSummary(canvas),
    },
  ];

  // Skeleton loading state
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Separator />
        {/* Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <BrandCanvasHeader
        completionScore={completionScore}
        processing={processing as BrandCanvasProcessingMeta}
        onGenerate={() => {
          if (!companyId) {
            toast.error("Empresa não carregada. Recarregue a página.");
            return;
          }
          setIsGenerating(true);
          generateMutation.mutate({});
        }}
        onApply={() => applyMutation.mutate()}
        isGenerating={isProcessing}
        isApplying={applyMutation.isPending}
      />

      <Separator />

      {/* Empty state */}
      {completionScore === 0 && !processing?.lastProcessedAt && (
        <div className="rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 p-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Seu Brand Canvas está vazio</h2>
            <p className="text-sm text-muted-foreground mt-1">
              A IA pode analisar seu site, Instagram e dados da empresa para preencher automaticamente.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={() => { setIsGenerating(true); generateMutation.mutate({}); }}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
            >
              <Sparkles className="h-4 w-4 mr-2" /> Gerar com IA
            </Button>
            <Button variant="outline" onClick={() => setActiveSheet('identity')}>
              Preencher manualmente
            </Button>
          </div>
        </div>
      )}

      {/* Grid of section cards with stagger animation */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" staggerDelay={0.06}>
        {sections.map(sec => (
          <StaggerItem key={sec.id}>
            <SectionCard
              title={sec.title}
              icon={sec.icon}
              color={sec.color}
              completionPercent={sec.completion}
              summary={sec.summary}
              onClick={() => setActiveSheet(sec.id)}
              onRegenerate={sec.section ? () => regenerateMutation.mutate(sec.section!) : undefined}
              isRegenerating={regenerateMutation.isPending}
            />
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Save bar with animation */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t shadow-lg p-3 flex items-center justify-center gap-3 z-50"
          >
            <span className="text-sm text-muted-foreground">Alterações não salvas</span>
            <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
              Salvar Canvas
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Pipeline Panel */}
      <BrandCanvasAIPanel
        open={aiPanelOpen}
        onClose={() => setAIPanelOpen(false)}
        steps={processingSteps as BrandCanvasProcessingStep[]}
        currentStep={processing.currentStep}
        status={processing.status || 'idle'}
        progress={processingProgress}
        errorMessage={processing.error}
        onRetry={() => {
          setIsGenerating(true);
          generateMutation.mutate({});
        }}
      />

      {/* Identity Sheet (inline — expanded with mission/vision/values) */}
      <Sheet open={activeSheet === 'identity'} onOpenChange={(v) => !v && handleSheetClose()}>
        <SheetContent className="w-[520px] sm:w-[680px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-600" />
              Identidade da Marca
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-5">
            <FieldWithAI
              label="Sobre a Marca"
              value={canvas.aboutBrand || ""}
              onChange={(v) => updateCanvas({ aboutBrand: v })}
              multiline
              maxLength={500}
              placeholder="Conte a história da marca, seu propósito..."
            />
            <div className="grid grid-cols-2 gap-3">
              <FieldWithAI
                label="Missão"
                value={canvas.mission || ""}
                onChange={(v) => updateCanvas({ mission: v })}
                multiline
                maxLength={500}
                placeholder="Propósito da marca..."
              />
              <FieldWithAI
                label="Visão"
                value={canvas.vision || ""}
                onChange={(v) => updateCanvas({ vision: v })}
                multiline
                maxLength={500}
                placeholder="Onde a marca quer chegar..."
              />
            </div>
            <FieldWithAI
              label="O que fazemos"
              value={canvas.whatWeDo || ""}
              onChange={(v) => updateCanvas({ whatWeDo: v })}
              multiline
              maxLength={500}
              placeholder="O que a empresa faz e vende..."
            />
            <FieldWithAI
              label="Diferenciais"
              value={canvas.differentials || ""}
              onChange={(v) => updateCanvas({ differentials: v })}
              multiline
              maxLength={500}
              placeholder="O que diferencia a marca dos concorrentes..."
            />
            <FieldWithAI
              label="Slogan ou Frase-chave"
              value={canvas.slogan || ""}
              onChange={(v) => updateCanvas({ slogan: v })}
              maxLength={300}
              placeholder="Ex: 'Beleza e bem-estar com constância'"
            />
            <FieldWithAI
              label="Posicionamento de Mercado"
              value={canvas.marketPositioning || ""}
              onChange={(v) => updateCanvas({ marketPositioning: v })}
              multiline
              maxLength={500}
              placeholder="Ex: Premium acessível, líder em inovação..."
            />
            <div>
              <label className="text-sm font-medium mb-1.5 block">Valores Principais</label>
              <TagsInput
                value={canvas.coreValues || []}
                onChange={(v) => updateCanvas({ coreValues: v })}
                placeholder="Digite um valor e pressione Enter..."
                maxTags={15}
              />
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-background border-t pt-3 mt-6 flex justify-end">
              <Button onClick={handleSheetClose}>Salvar e Fechar</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Visual Identity Sheet */}
      <BrandCanvasVisualIdentitySheet
        open={activeSheet === 'visual'}
        onClose={handleSheetClose}
        data={canvas.visualIdentity || {}}
        onChange={(vi) => updateCanvas({ visualIdentity: vi })}
      />

      {/* Voice Sheet */}
      <BrandCanvasVoiceSheet
        open={activeSheet === 'voice'}
        onClose={handleSheetClose}
        data={canvas.voice || {}}
        onChange={(voice) => updateCanvas({ voice })}
      />

      {/* Products Sheet */}
      <BrandCanvasProductsSheet
        open={activeSheet === 'products'}
        onClose={handleSheetClose}
        products={canvas.products || []}
        onChange={(products) => updateCanvas({ products })}
      />

      {/* Audience Sheet */}
      <BrandCanvasAudienceSheet
        open={activeSheet === 'audience'}
        onClose={handleSheetClose}
        targetAudience={canvas.targetAudience || ""}
        demographics={canvas.demographics || ""}
        personas={canvas.personas || []}
        painPoints={canvas.painPoints || []}
        desiredEmotions={canvas.desiredEmotions || []}
        onChangeAudience={(v) => updateCanvas({ targetAudience: v })}
        onChangeDemographics={(v) => updateCanvas({ demographics: v })}
        onChangePersonas={(v) => updateCanvas({ personas: v })}
        onChangePainPoints={(v) => updateCanvas({ painPoints: v })}
        onChangeDesiredEmotions={(v) => updateCanvas({ desiredEmotions: v })}
      />

      {/* Angles & Triggers Sheet */}
      <BrandCanvasAnglesSheet
        open={activeSheet === 'angles'}
        onClose={handleSheetClose}
        problemsAndDesires={canvas.problemsAndDesires || []}
        transformationStories={canvas.transformationStories || ""}
        valueProposition={canvas.valueProposition || ""}
        commercialStrategies={canvas.commercialStrategies || ""}
        onChangeProblemsAndDesires={(v) => updateCanvas({ problemsAndDesires: v })}
        onChangeTransformationStories={(v) => updateCanvas({ transformationStories: v })}
        onChangeValueProposition={(v) => updateCanvas({ valueProposition: v })}
        onChangeCommercialStrategies={(v) => updateCanvas({ commercialStrategies: v })}
      />

      {/* Content Strategy Sheet */}
      <BrandCanvasContentSheet
        open={activeSheet === 'content'}
        onClose={handleSheetClose}
        data={canvas.contentStrategy || {}}
        onChange={(contentStrategy) => updateCanvas({ contentStrategy })}
      />

      {/* References Sheet */}
      <BrandCanvasReferencesSheet
        open={activeSheet === 'references'}
        onClose={handleSheetClose}
        data={canvas.references || {}}
        onChange={(references) => updateCanvas({ references })}
      />

    </div>
  );
}
