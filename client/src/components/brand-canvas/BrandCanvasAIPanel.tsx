import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Check, X, Clock, Sparkles, AlertTriangle, RotateCcw } from "lucide-react";
import type { BrandCanvasProcessingStep, BrandCanvasStepStatus } from "@shared/schema";

interface BrandCanvasAIPanelProps {
  open: boolean;
  onClose: () => void;
  steps: BrandCanvasProcessingStep[];
  currentStep?: string;
  status: string;
  progress: number;
  errorMessage?: string;
  onRetry?: () => void;
}

const STEP_LABELS: Record<string, string> = {
  cnpj: "Dados CNPJ",
  website: "Análise do Website",
  visual: "Identidade Visual",
  social: "Redes Sociais",
  voice: "Tom de Voz",
  synthesis: "Síntese Final",
};

const STEP_DESCRIPTIONS: Record<string, string> = {
  cnpj: "Consultando ReceitaWS para dados da empresa",
  website: "Analisando conteúdo do website com Gemini Flash",
  visual: "Extraindo paleta de cores e estética visual",
  social: "Coletando métricas e bio do Instagram",
  voice: "Claude Sonnet analisando tom de voz da marca",
  synthesis: "Claude Sonnet consolidando estratégia de conteúdo",
};

function StepIcon({ status }: { status: BrandCanvasStepStatus }) {
  switch (status) {
    case 'completed': return <Check className="h-4 w-4 text-emerald-500" />;
    case 'running': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case 'failed': return <X className="h-4 w-4 text-red-500" />;
    case 'skipped': return <Clock className="h-4 w-4 text-gray-400" />;
    default: return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
  }
}

function stepLineColor(status: BrandCanvasStepStatus): string {
  switch (status) {
    case 'completed': return 'bg-emerald-400';
    case 'running': return 'bg-primary animate-pulse';
    case 'failed': return 'bg-red-400';
    default: return 'bg-gray-200 dark:bg-gray-700';
  }
}

function StatusBadge({ status }: { status: BrandCanvasStepStatus }) {
  const map: Record<BrandCanvasStepStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "Aguardando", variant: "outline" },
    running: { label: "Executando", variant: "default" },
    completed: { label: "Concluído", variant: "secondary" },
    failed: { label: "Falhou", variant: "destructive" },
    skipped: { label: "Pulado", variant: "outline" },
  };
  const { label, variant } = map[status] || map.pending;
  return <Badge variant={variant} className="text-[10px] h-5">{label}</Badge>;
}

export function BrandCanvasAIPanel({ open, onClose, steps, currentStep, status, progress, errorMessage, onRetry }: BrandCanvasAIPanelProps) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[380px] sm:w-[420px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-600" />
            Pipeline de IA
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-1">
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progresso</span>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <Progress
              value={progress}
              className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-violet-500 [&>div]:to-indigo-500"
            />
          </div>

          {/* Steps with stepper */}
          <div className="relative">
            {steps.map((step, i) => (
              <div key={step.name} className="relative flex gap-3">
                {/* Vertical stepper line + icon */}
                <div className="flex flex-col items-center">
                  <div className={`z-10 flex items-center justify-center h-8 w-8 rounded-full border-2 bg-background ${
                    step.status === 'completed' ? 'border-emerald-400' :
                    step.status === 'running' ? 'border-blue-500 animate-pulse' :
                    step.status === 'failed' ? 'border-red-400' :
                    'border-gray-300 dark:border-gray-600'
                  }`}>
                    <StepIcon status={step.status} />
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-0.5 flex-1 min-h-[16px] ${stepLineColor(step.status)}`} />
                  )}
                </div>

                {/* Step content */}
                <div className={`flex-1 min-w-0 pb-4 ${i === steps.length - 1 ? '' : ''}`}>
                  <div className={`p-3 rounded-lg transition-colors ${
                    step.status === 'running' ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800' :
                    step.status === 'completed' ? 'bg-emerald-50/50 dark:bg-emerald-950/20' :
                    step.status === 'failed' ? 'bg-red-50/50 dark:bg-red-950/20' :
                    ''
                  }`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{STEP_LABELS[step.name] || step.name}</span>
                      <StatusBadge status={step.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {STEP_DESCRIPTIONS[step.name] || ""}
                    </p>
                    {step.error && (
                      <p className="text-xs text-red-500 mt-1">{step.error}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Status message */}
          {status === 'completed' && (
            <div className="mt-6 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Análise concluída!
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Revise os resultados nos cards e aceite as sugestões que desejar.
              </p>
            </div>
          )}

          {status === 'failed' && (
            <div className="mt-6 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">
                  Pipeline falhou
                </span>
              </div>
              {errorMessage && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2 bg-red-100 dark:bg-red-900/30 p-2 rounded">
                  {errorMessage}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Dados parciais foram salvos. Verifique as configurações e tente novamente.
              </p>
              {onRetry && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 w-full border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
                  onClick={onRetry}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Tentar novamente
                </Button>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
