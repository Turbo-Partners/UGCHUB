import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronRight, RefreshCw, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SectionCardProps {
  title: string;
  icon: LucideIcon;
  color: string;
  completionPercent: number;
  summary?: string;
  onClick: () => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

const COLOR_MAP: Record<string, { bg: string; border: string; icon: string; text: string; progress: string }> = {
  indigo: { bg: "bg-indigo-50 dark:bg-indigo-950/30", border: "border-indigo-200 dark:border-indigo-800", icon: "text-indigo-600", text: "text-indigo-700 dark:text-indigo-300", progress: "[&>div]:bg-indigo-500" },
  violet: { bg: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-200 dark:border-violet-800", icon: "text-violet-600", text: "text-violet-700 dark:text-violet-300", progress: "[&>div]:bg-violet-500" },
  teal: { bg: "bg-teal-50 dark:bg-teal-950/30", border: "border-teal-200 dark:border-teal-800", icon: "text-teal-600", text: "text-teal-700 dark:text-teal-300", progress: "[&>div]:bg-teal-500" },
};

export function SectionCard({ title, icon: Icon, color, completionPercent, summary, onClick, onRegenerate, isRegenerating }: SectionCardProps) {
  const colors = COLOR_MAP[color] || COLOR_MAP.indigo;
  const isComplete = completionPercent === 100;

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-1 hover:ring-2 hover:ring-primary/20 active:scale-[0.98] border ${
        isComplete ? "border-emerald-300 dark:border-emerald-700" : colors.border
      } ${colors.bg}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-white dark:bg-gray-900 shadow-sm">
              <Icon className={`h-4 w-4 ${colors.icon}`} />
            </div>
            <CardTitle className={`text-sm font-semibold ${colors.text}`}>{title}</CardTitle>
            {isComplete && (
              <Check className="h-4 w-4 text-emerald-500" />
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {onRegenerate && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
                      disabled={isRegenerating}
                    >
                      <RefreshCw className={`h-3 w-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Regenerar seção com IA</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {summary && (
          <p className="text-xs text-muted-foreground line-clamp-2">{summary}</p>
        )}
        <div className="flex items-center gap-2">
          <Progress
            value={completionPercent}
            className={`h-2 flex-1 ${isComplete ? "[&>div]:bg-emerald-500" : colors.progress}`}
          />
          <span className="text-[10px] font-medium text-muted-foreground">{completionPercent}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
