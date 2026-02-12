import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, Link } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useMarketplace } from '@/lib/provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { TagsInput } from '@/components/ui/tags-input';
import { ArrowLeft, Loader2, Save, Store, AlertTriangle, FileText, Plus, Globe, Lock, CheckCircle, Users, Sparkles } from 'lucide-react';
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from '@/hooks/use-toast';
import type { Company, CompanyMember, Campaign } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShareCampaignModalContent } from '@/components/share-campaign-button';
import { CreateCompanyModal } from '@/components/create-company-modal';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { NICHE_OPTIONS, AGE_RANGE_OPTIONS, STATE_OPTIONS, PLATFORM_OPTIONS, DELIVERABLE_TYPE_OPTIONS } from '@shared/constants';
import { DeliverableBuilder } from '@/components/deliverable-builder';
import { structuredDeliverableSchema, type StructuredDeliverable } from '@shared/schema';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, X } from 'lucide-react';

const campaignRewardSchema = z.object({
  place: z.coerce.number().min(1),
  rewardType: z.enum(['cash', 'product', 'points', 'coupon']),
  value: z.coerce.number().min(0),
  description: z.string().optional(),
});

const formSchema = z.object({
  title: z.string().min(5, "Título deve ter pelo menos 5 caracteres"),
  description: z.string().min(20, "Descrição deve ter pelo menos 20 caracteres"),
  requirements: z.array(z.string()).optional().default([]),
  deliverables: z.array(z.string()).optional().default([]),
  structuredDeliverables: z.array(structuredDeliverableSchema).optional().default([]),
  targetPlatforms: z.array(z.string()).optional().default([]),
  budget: z.string().min(1, "Orçamento é obrigatório"),
  deadline: z.string().min(1, "Prazo é obrigatório"),
  creatorsNeeded: z.coerce.number().min(1, "Pelo menos 1 criador é necessário"),
  targetNiche: z.array(z.string()).optional(),
  targetAgeRanges: z.array(z.string()).optional(),
  targetRegions: z.array(z.string()).optional(),
  targetGender: z.string().optional(),
  visibility: z.enum(["public", "private", "community_only"]).default("public"),
  minTierId: z.preprocess(
    (val) => (val === '' || val === null || val === undefined) ? null : Number(val),
    z.number().nullable().optional()
  ),
  minPoints: z.preprocess(
    (val) => (val === '' || val === null || val === undefined) ? null : Number(val),
    z.number().nullable().optional()
  ),
  allowedTiers: z.array(z.coerce.number()).optional().default([]),
  rewardMode: z.enum(["ranking", "threshold", "none"]).default("ranking"),
  rewardsJson: z.array(campaignRewardSchema).optional().default([]),
});

type CompanyMembership = CompanyMember & { company: Company };

export default function CreateCampaign() {
  const [_, setLocation] = useLocation();
  const { user } = useMarketplace();
  const { toast } = useToast();
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [selectedAgeRanges, setSelectedAgeRanges] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);
  const [isSaveTemplateDialogOpen, setIsSaveTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [creationMode, setCreationMode] = useState<"new" | "template" | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [createdCampaign, setCreatedCampaign] = useState<Campaign | null>(null);
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  const createCampaignMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/campaigns', data);
      return await res.json();
    },
    onSuccess: (campaign: Campaign) => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      setCreatedCampaign(campaign);
      setShowSuccessModal(true);
      form.reset();
      setSelectedNiches([]);
      setSelectedAgeRanges([]);
      setSelectedRegions([]);
      setCreationMode(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar campanha",
        description: error.message || "Não foi possível criar a campanha. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const { data: activeCompany, isLoading: loadingActiveCompany } = useQuery<CompanyMembership | null>({
    queryKey: ["/api/active-company"],
    queryFn: async () => {
      const res = await fetch("/api/active-company", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user && user.role === "company",
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      requirements: [],
      deliverables: [],
      structuredDeliverables: [],
      targetPlatforms: [],
      budget: "",
      deadline: "",
      creatorsNeeded: 1,
      targetNiche: [],
      targetAgeRanges: [],
      targetRegions: [],
      targetGender: "",
      visibility: "public",
      minTierId: null,
      minPoints: null,
      allowedTiers: [],
      rewardMode: "ranking",
      rewardsJson: [],
    },
  });

  useEffect(() => {
    const templateData = localStorage.getItem("template-campaign-data");
    if (templateData) {
      try {
        const data = JSON.parse(templateData);
        
        // Normalize requirements to array
        let normalizedRequirements: string[] = [];
        if (Array.isArray(data.requirements)) {
          normalizedRequirements = data.requirements;
        } else if (typeof data.requirements === 'string') {
          normalizedRequirements = data.requirements.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
        
        form.reset({
          title: data.title || "",
          description: data.description || "",
          requirements: normalizedRequirements,
          budget: data.budget || "",
          deadline: data.deadline || "",
          creatorsNeeded: data.creatorsNeeded || 1,
          targetNiche: data.targetNiche || [],
          targetAgeRanges: data.targetAgeRanges || [],
          targetRegions: data.targetRegions || [],
          targetGender: data.targetGender || "",
          visibility: "public",
        });
        setSelectedNiches(data.targetNiche || []);
        setSelectedAgeRanges(data.targetAgeRanges || []);
        setSelectedRegions(data.targetRegions || []);
        localStorage.removeItem("template-campaign-data");
        setCreationMode("template");
      } catch (error) {
        console.error("Error loading template data:", error);
      }
    }
    setIsLoadingTemplate(false);
  }, [form]);

  const toggleNiche = (value: string) => {
    setSelectedNiches(prev => {
      const updated = prev.includes(value) 
        ? prev.filter(n => n !== value)
        : [...prev, value];
      form.setValue('targetNiche', updated);
      return updated;
    });
  };

  const toggleAgeRange = (value: string) => {
    setSelectedAgeRanges(prev => {
      const updated = prev.includes(value)
        ? prev.filter(a => a !== value)
        : [...prev, value];
      form.setValue('targetAgeRanges', updated);
      return updated;
    });
  };

  const selectAllNiches = () => {
    const allNiches = NICHE_OPTIONS.map(opt => opt.value);
    setSelectedNiches(allNiches);
    form.setValue('targetNiche', allNiches);
  };

  const clearAllNiches = () => {
    setSelectedNiches([]);
    form.setValue('targetNiche', []);
  };

  const selectAllAgeRanges = () => {
    const allRanges = AGE_RANGE_OPTIONS.map(opt => opt.value);
    setSelectedAgeRanges(allRanges);
    form.setValue('targetAgeRanges', allRanges);
  };

  const clearAllAgeRanges = () => {
    setSelectedAgeRanges([]);
    form.setValue('targetAgeRanges', []);
  };

  const toggleState = (value: string) => {
    setSelectedRegions(prev => {
      const updated = prev.includes(value)
        ? prev.filter(r => r !== value)
        : [...prev, value];
      form.setValue('targetRegions', updated);
      return updated;
    });
  };

  const removeState = (value: string) => {
    setSelectedRegions(prev => {
      const updated = prev.filter(r => r !== value);
      form.setValue('targetRegions', updated);
      return updated;
    });
  };

  const clearAllStates = () => {
    setSelectedRegions([]);
    form.setValue('targetRegions', []);
  };

  const handleAutoFill = async () => {
    setIsAutoFilling(true);
    try {
      const title = form.getValues('title');
      const platforms = form.getValues('targetPlatforms');
      const res = await apiRequest('POST', '/api/campaigns/generate-briefing', {
        campaignTitle: title || undefined,
        targetPlatforms: platforms?.length ? platforms : undefined,
      });
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        if (d.description) form.setValue('description', d.description);
        if (d.briefingText) {
          // Use briefingText as additional requirements context
          const currentReqs = form.getValues('requirements') || [];
          if (d.requirements?.length) {
            form.setValue('requirements', [...currentReqs, ...d.requirements.filter((r: string) => !currentReqs.includes(r))]);
          }
        }
        if (d.suggestedNiches?.length) {
          setSelectedNiches(d.suggestedNiches);
          form.setValue('targetNiche', d.suggestedNiches);
        }
        if (d.suggestedRegions?.length) {
          setSelectedRegions(d.suggestedRegions);
          form.setValue('targetRegions', d.suggestedRegions);
        }
        toast({
          title: "Campos preenchidos com IA",
          description: "Revise e ajuste os dados gerados antes de publicar.",
        });
      }
    } catch (error: any) {
      const msg = error?.message || "Erro ao gerar briefing";
      toast({
        title: "Erro no auto-fill",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsAutoFilling(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const legacyDeliverables = (values.structuredDeliverables || []).map(d => {
      const label = DELIVERABLE_TYPE_OPTIONS.find(opt => opt.value === d.type)?.label || d.type;
      return d.notes ? `${d.quantity}x ${label} - ${d.notes}` : `${d.quantity}x ${label}`;
    });
    
    // Values are already coerced by z.preprocess/z.coerce in the schema
    // Just spread them directly without re-coercing (which could break zero values)
    await createCampaignMutation.mutateAsync({
      ...values,
      deliverables: legacyDeliverables,
    });
  }

  async function handleSaveAsTemplate() {
    const values = form.getValues();
    
    if (!values.title || !values.description || !values.budget || !values.deadline) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios da campanha antes de salvar como template",
        variant: "destructive",
      });
      return;
    }

    if (!templateName.trim()) {
      toast({
        title: "Nome do template obrigatório",
        description: "Digite um nome para identificar este template",
        variant: "destructive",
      });
      return;
    }

    setIsSavingTemplate(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName,
          description: templateDescription,
          title: values.title,
          campaignDescription: values.description,
          requirements: values.requirements,
          budget: values.budget,
          deadline: values.deadline,
          creatorsNeeded: values.creatorsNeeded,
          targetNiche: values.targetNiche,
          targetAgeRanges: values.targetAgeRanges,
          targetRegions: values.targetRegions,
          targetGender: values.targetGender,
        }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to save template");

      toast({
        title: "Template salvo!",
        description: "Campanha salva como template com sucesso",
      });

      setIsSaveTemplateDialogOpen(false);
      setTemplateName("");
      setTemplateDescription("");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o template",
        variant: "destructive",
      });
    } finally {
      setIsSavingTemplate(false);
    }
  }

  if (loadingActiveCompany || isLoadingTemplate) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!activeCompany) {
    return (
      <>
        <div className="max-w-lg mx-auto mt-20 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold font-heading">Nenhuma loja criada</h1>
            <p className="text-muted-foreground">
              Você precisa criar uma loja primeiro antes de poder criar campanhas.
            </p>
          </div>
          <Button size="lg" className="gap-2" onClick={() => setShowCreateCompanyModal(true)} data-testid="button-create-store">
            <Store className="h-4 w-4" />
            Criar Minha Loja
          </Button>
        </div>
        <CreateCompanyModal
          open={showCreateCompanyModal}
          onOpenChange={setShowCreateCompanyModal}
        />
      </>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <Button variant="ghost" onClick={() => creationMode ? setCreationMode(null) : setLocation('/dashboard')} className="pl-0 hover:pl-2 transition-all">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {creationMode ? "Voltar" : "Voltar ao Painel"}
      </Button>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-heading tracking-tight">Criar Nova Campanha</h1>
        <p className="text-muted-foreground">Preencha os detalhes para atrair os criadores certos para sua marca.</p>
      </div>

      {!creationMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card 
            className="border-2 hover:border-primary/50 cursor-pointer transition-all hover:shadow-lg"
            onClick={() => setCreationMode("new")}
            data-testid="card-new-campaign"
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">Nova Campanha</h3>
                  <p className="text-sm text-muted-foreground">
                    Comece do zero e crie uma campanha personalizada
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border-2 hover:border-primary/50 cursor-pointer transition-all hover:shadow-lg"
            onClick={() => setLocation('/templates')}
            data-testid="card-from-template"
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                  <FileText className="h-8 w-8 text-amber-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">A partir de Template</h3>
                  <p className="text-sm text-muted-foreground">
                    Use um template salvo para agilizar a criação
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {creationMode && (
      <Card className="border-none shadow-xl shadow-indigo-100/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Detalhes da Campanha</CardTitle>
              <CardDescription>
                Seja o mais específico possível para obter as melhores combinações.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleAutoFill}
              disabled={isAutoFilling}
              className="shrink-0 gap-2 border-violet-300 text-violet-700 hover:bg-violet-50"
            >
              {isAutoFilling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isAutoFilling ? "Gerando..." : "Preencher com IA"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Visibility Selector */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Visibilidade da Campanha</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      form.watch("visibility") === "public"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                    onClick={() => form.setValue("visibility", "public")}
                    data-testid="option-visibility-public"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${
                        form.watch("visibility") === "public" ? "bg-primary/10" : "bg-muted"
                      }`}>
                        <Globe className={`h-5 w-5 ${
                          form.watch("visibility") === "public" ? "text-primary" : "text-muted-foreground"
                        }`} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm">Pública</h4>
                        <p className="text-xs text-muted-foreground">
                          Visível para todos no feed
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      form.watch("visibility") === "private"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                    onClick={() => form.setValue("visibility", "private")}
                    data-testid="option-visibility-private"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${
                        form.watch("visibility") === "private" ? "bg-primary/10" : "bg-muted"
                      }`}>
                        <Lock className={`h-5 w-5 ${
                          form.watch("visibility") === "private" ? "text-primary" : "text-muted-foreground"
                        }`} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm">Privada</h4>
                        <p className="text-xs text-muted-foreground">
                          Só por convite ou link
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      form.watch("visibility") === "community_only"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                    onClick={() => form.setValue("visibility", "community_only")}
                    data-testid="option-visibility-community"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${
                        form.watch("visibility") === "community_only" ? "bg-primary/10" : "bg-muted"
                      }`}>
                        <Users className={`h-5 w-5 ${
                          form.watch("visibility") === "community_only" ? "text-primary" : "text-muted-foreground"
                        }`} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm">Comunidade</h4>
                        <p className="text-xs text-muted-foreground">
                          Apenas para membros
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Eligibility Fields - Only show for community_only */}
              {form.watch("visibility") === "community_only" && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <Label className="text-sm font-medium">Requisitos de Elegibilidade</Label>
                  <p className="text-xs text-muted-foreground">
                    Define quem da sua comunidade pode participar desta campanha
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="minPoints"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Pontos Mínimos</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              placeholder="0"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Gamification Section */}
              <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-amber-600" />
                  <Label className="text-sm font-medium">Gamificação e Prêmios</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Configure como os criadores serão recompensados além do pagamento base
                </p>
                
                {/* Reward Mode */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'ranking', label: 'Ranking', desc: 'Top performers ganham' },
                    { value: 'threshold', label: 'Threshold', desc: 'Atingir metas ganha' },
                    { value: 'none', label: 'Nenhum', desc: 'Sem gamificação' },
                  ].map((mode) => (
                    <div
                      key={mode.value}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        form.watch("rewardMode") === mode.value
                          ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                          : "border-muted hover:border-muted-foreground/30"
                      }`}
                      onClick={() => form.setValue("rewardMode", mode.value as "ranking" | "threshold" | "none")}
                      data-testid={`option-reward-mode-${mode.value}`}
                    >
                      <h4 className="font-medium text-sm">{mode.label}</h4>
                      <p className="text-xs text-muted-foreground">{mode.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Rewards Builder - only show if not "none" */}
                {form.watch("rewardMode") !== "none" && (
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Prêmios</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          const current = form.getValues("rewardsJson") || [];
                          const nextPlace = current.length + 1;
                          form.setValue("rewardsJson", [...current, {
                            place: nextPlace,
                            rewardType: 'cash',
                            value: 0,
                            description: ''
                          }]);
                        }}
                        data-testid="button-add-reward"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Adicionar Prêmio
                      </Button>
                    </div>

                    {(form.watch("rewardsJson") || []).length === 0 && (
                      <p className="text-xs text-muted-foreground italic text-center py-4 border rounded-lg">
                        Nenhum prêmio configurado. Clique em "Adicionar Prêmio" para começar.
                      </p>
                    )}

                    {(form.watch("rewardsJson") || []).map((reward, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-background">
                        <div className="flex items-center gap-1 min-w-[60px]">
                          <span className="text-xs font-medium">
                            {form.watch("rewardMode") === "ranking" ? `${reward.place}º Lugar` : `Meta ${reward.place}`}
                          </span>
                        </div>
                        
                        <select
                          value={reward.rewardType}
                          onChange={(e) => {
                            const current = [...(form.getValues("rewardsJson") || [])];
                            current[index] = { ...current[index], rewardType: e.target.value as 'cash' | 'product' | 'points' | 'coupon' };
                            form.setValue("rewardsJson", current);
                          }}
                          className="h-8 text-xs border rounded px-2"
                          data-testid={`select-reward-type-${index}`}
                        >
                          <option value="cash">Dinheiro</option>
                          <option value="product">Produto</option>
                          <option value="points">Pontos</option>
                          <option value="coupon">Cupom</option>
                        </select>

                        <Input
                          type="number"
                          min="0"
                          placeholder={reward.rewardType === 'cash' ? 'R$' : 'Valor'}
                          value={reward.value || ''}
                          onChange={(e) => {
                            const current = [...(form.getValues("rewardsJson") || [])];
                            current[index] = { ...current[index], value: parseInt(e.target.value) || 0 };
                            form.setValue("rewardsJson", current);
                          }}
                          className="h-8 w-24 text-xs"
                          data-testid={`input-reward-value-${index}`}
                        />

                        <Input
                          placeholder="Descrição (opcional)"
                          value={reward.description || ''}
                          onChange={(e) => {
                            const current = [...(form.getValues("rewardsJson") || [])];
                            current[index] = { ...current[index], description: e.target.value };
                            form.setValue("rewardsJson", current);
                          }}
                          className="h-8 flex-1 text-xs"
                          data-testid={`input-reward-description-${index}`}
                        />

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            const current = [...(form.getValues("rewardsJson") || [])];
                            current.splice(index, 1);
                            // Renumber places
                            current.forEach((r, i) => r.place = i + 1);
                            form.setValue("rewardsJson", current);
                          }}
                          data-testid={`button-remove-reward-${index}`}
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título da Campanha</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: Review de Lançamento de Produto Verão" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva os objetivos da campanha, o que o criador precisa fazer e o que você está procurando..." 
                        className="h-32 resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="creatorsNeeded"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Criadores Necessários</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Entregas estruturadas */}
              <FormField
                control={form.control}
                name="structuredDeliverables"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entregas</FormLabel>
                    <FormControl>
                      <DeliverableBuilder
                        value={field.value || []}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">
                      Defina o que o criador deve entregar. Estes itens aparecerão no contrato.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Plataformas */}
              <div className="space-y-2">
                <Label>Plataformas</Label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORM_OPTIONS.map((platform) => (
                    <div key={platform.value} className="flex items-center gap-2">
                      <Checkbox
                        id={`platform-${platform.value}`}
                        checked={form.watch('targetPlatforms')?.includes(platform.value)}
                        onCheckedChange={(checked) => {
                          const current = form.getValues('targetPlatforms') || [];
                          if (checked) {
                            form.setValue('targetPlatforms', [...current, platform.value]);
                          } else {
                            form.setValue('targetPlatforms', current.filter((p: string) => p !== platform.value));
                          }
                        }}
                        data-testid={`checkbox-platform-${platform.value}`}
                      />
                      <Label htmlFor={`platform-${platform.value}`} className="cursor-pointer font-normal text-sm">
                        {platform.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Orçamento por criador</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                          <Input 
                            placeholder="0,00" 
                            className="pl-10"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              if (!value) {
                                field.onChange('');
                                return;
                              }
                              const numberValue = parseInt(value, 10) / 100;
                              const formatted = numberValue.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              });
                              field.onChange(formatted);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prazo</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div>
                  <Label className="text-sm font-medium">Público-Alvo (Opcional)</Label>
                  <p className="text-xs text-muted-foreground mt-1">Especifique os nichos, faixas etárias e gênero desejados para os criadores desta campanha.</p>
                </div>

                {/* Nicho */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Nichos</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={selectAllNiches}
                        disabled={selectedNiches.length === NICHE_OPTIONS.length}
                        className="h-7 text-xs px-3"
                        data-testid="button-select-all-niches"
                      >
                        Selecionar Todos
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearAllNiches}
                        disabled={selectedNiches.length === 0}
                        className="h-7 text-xs px-3 text-muted-foreground hover:text-foreground"
                        data-testid="button-clear-niches"
                      >
                        Limpar
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border p-4 rounded-md max-h-48 overflow-y-auto">
                    {NICHE_OPTIONS.map(option => (
                      <div key={option.value} className="flex items-center gap-3">
                        <Checkbox 
                          id={`niche-${option.value}`}
                          checked={selectedNiches.includes(option.value)}
                          onCheckedChange={() => toggleNiche(option.value)}
                          data-testid={`checkbox-niche-${option.value}`}
                        />
                        <Label htmlFor={`niche-${option.value}`} className="cursor-pointer font-normal">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Faixa Etária */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Faixa Etária</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={selectAllAgeRanges}
                        disabled={selectedAgeRanges.length === AGE_RANGE_OPTIONS.length}
                        className="h-7 text-xs px-3"
                        data-testid="button-select-all-ages"
                      >
                        Selecionar Todas
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearAllAgeRanges}
                        disabled={selectedAgeRanges.length === 0}
                        className="h-7 text-xs px-3 text-muted-foreground hover:text-foreground"
                        data-testid="button-clear-ages"
                      >
                        Limpar
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border p-4 rounded-md">
                    {AGE_RANGE_OPTIONS.map(option => (
                      <div key={option.value} className="flex items-center gap-3">
                        <Checkbox 
                          id={`age-${option.value}`}
                          checked={selectedAgeRanges.includes(option.value)}
                          onCheckedChange={() => toggleAgeRange(option.value)}
                          data-testid={`checkbox-age-${option.value}`}
                        />
                        <Label htmlFor={`age-${option.value}`} className="cursor-pointer font-normal">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Estados */}
                <div className="space-y-2">
                  <Label>Estados</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between h-auto min-h-10 py-2"
                        data-testid="button-select-states"
                      >
                        <div className="flex flex-wrap gap-1 flex-1 text-left">
                          {selectedRegions.length === 0 ? (
                            <span className="text-muted-foreground">Qualquer estado</span>
                          ) : (
                            selectedRegions.map(state => (
                              <Badge
                                key={state}
                                variant="secondary"
                                className="text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeState(state);
                                }}
                              >
                                {state}
                                <X className="ml-1 h-3 w-3 cursor-pointer" />
                              </Badge>
                            ))
                          )}
                        </div>
                        <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-0" align="start">
                      <div className="p-2 border-b flex justify-between items-center">
                        <span className="text-sm font-medium">Selecionar estados</span>
                        {selectedRegions.length > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearAllStates}
                            className="h-6 text-xs px-2"
                            data-testid="button-clear-states"
                          >
                            Limpar
                          </Button>
                        )}
                      </div>
                      <div className="max-h-48 overflow-y-auto p-2">
                        {STATE_OPTIONS.map(option => (
                          <div
                            key={option.value}
                            className="flex items-center gap-2 py-1.5 px-2 hover:bg-accent rounded cursor-pointer"
                            onClick={() => toggleState(option.value)}
                            data-testid={`option-state-${option.value}`}
                          >
                            <Checkbox
                              checked={selectedRegions.includes(option.value)}
                              onCheckedChange={() => toggleState(option.value)}
                              className="pointer-events-none"
                            />
                            <span className="text-sm">{option.label}</span>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Gênero */}
                <FormField
                  control={form.control}
                  name="targetGender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gênero Alvo</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                          data-testid="select-target-gender"
                        >
                          <option value="">Qualquer</option>
                          <option value="masculino">Masculino</option>
                          <option value="feminino">Feminino</option>
                          <option value="outro">Outro</option>
                          <option value="prefiro_nao_informar">Prefiro não informar</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Requisitos desejáveis */}
              <FormField
                control={form.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requisitos desejáveis</FormLabel>
                    <FormControl>
                      <TagsInput 
                        value={field.value} 
                        onChange={field.onChange}
                        placeholder="ex: 10k+ seguidores (pressione Enter ou clique +)"
                        data-testid="input-requirements"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">
                      Qualificações ou características que você busca nos criadores.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-end">
                <Button 
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setIsSaveTemplateDialogOpen(true)}
                  data-testid="button-save-as-template"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Salvar como Template
                </Button>
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full sm:w-auto"
                  disabled={form.formState.isSubmitting}
                  data-testid="button-publish-campaign"
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publicando...
                    </>
                  ) : (
                    'Publicar Campanha'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      )}

      <Dialog open={showSuccessModal} onOpenChange={(open) => {
        if (!open) {
          setLocation('/dashboard');
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="text-center">Campanha Criada com Sucesso!</DialogTitle>
            <DialogDescription className="text-center">
              Sua campanha está ativa e pronta para receber candidaturas.
            </DialogDescription>
          </DialogHeader>
          {createdCampaign && (
            <ShareCampaignModalContent campaign={createdCampaign} />
          )}
          <DialogFooter className="mt-4">
            <Button
              className="w-full"
              onClick={() => setLocation('/dashboard')}
              data-testid="button-go-to-dashboard"
            >
              Ir para o Painel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSaveTemplateDialogOpen} onOpenChange={setIsSaveTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar como Template</DialogTitle>
            <DialogDescription>
              Salve esta campanha como template para reutilizar no futuro
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name">Nome do Template *</Label>
              <Input
                id="template-name"
                data-testid="input-template-name-dialog"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Ex: Lançamento de Produto"
              />
            </div>
            <div>
              <Label htmlFor="template-description">Descrição (opcional)</Label>
              <Textarea
                id="template-description"
                data-testid="input-template-description-dialog"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Breve descrição do template"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveTemplateDialogOpen(false)} data-testid="button-cancel-save-template">
              Cancelar
            </Button>
            <Button onClick={handleSaveAsTemplate} disabled={isSavingTemplate} data-testid="button-confirm-save-template">
              {isSavingTemplate ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Template'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
