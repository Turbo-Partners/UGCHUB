import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles, Loader2, Check, ArrowDownToLine, Clock } from "lucide-react";
import type { BrandCanvasProcessingMeta } from "@shared/schema";

interface BrandCanvasHeaderProps {
  completionScore: number;
  processing?: BrandCanvasProcessingMeta;
  onGenerate: () => void;
  onApply: () => void;
  isGenerating: boolean;
  isApplying: boolean;
}

export function BrandCanvasHeader({
  completionScore,
  processing,
  onGenerate,
  onApply,
  isGenerating,
  isApplying,
}: BrandCanvasHeaderProps) {
  const isProcessing = processing?.status === 'processing' || isGenerating;
  const lastProcessed = processing?.lastProcessedAt
    ? new Date(processing.lastProcessedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-gray-200 dark:text-gray-700"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray={`${completionScore}, 100`}
              strokeLinecap="round"
              className={completionScore >= 75 ? "text-emerald-500" : completionScore >= 40 ? "text-amber-500" : "text-red-400"}
              style={{ transition: "stroke-dasharray 1s ease-out" }}
            />
          </svg>
          <span className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold leading-none">{completionScore}%</span>
            <span className="text-[9px] text-muted-foreground mt-0.5">Score</span>
          </span>
        </div>
        <div>
          <h1 className="text-xl font-bold">Brand Canvas</h1>
          <p className="text-sm text-muted-foreground">
            Identidade visual, voz e estratégia da sua marca
          </p>
          {lastProcessed && (
            <div className="flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Última análise: {lastProcessed}</span>
              {processing?.aiConfidenceScore && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-[10px] px-1 h-4 ml-1 cursor-help">
                        {processing.aiConfidenceScore}% confiança
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      Score de confiança da IA baseado na qualidade dos dados extraídos
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onApply}
                disabled={isApplying || isProcessing || completionScore < 20}
              >
                {isApplying ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <ArrowDownToLine className="h-3.5 w-3.5 mr-1.5" />}
                Aplicar
              </Button>
            </TooltipTrigger>
            <TooltipContent>Aplica dados do Canvas nas configurações da marca</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button
          size="sm"
          onClick={onGenerate}
          disabled={isProcessing}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
        >
          {isProcessing ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          )}
          {isProcessing ? "Gerando..." : "Gerar com IA"}
        </Button>
      </div>
    </div>
  );
}
