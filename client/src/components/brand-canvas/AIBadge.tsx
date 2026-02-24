import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface AIBadgeProps {
  className?: string;
}

export function AIBadge({ className }: AIBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`text-[10px] px-1.5 py-0 h-5 bg-violet-50 border-violet-200 text-violet-600 dark:bg-violet-950 dark:border-violet-800 dark:text-violet-400 ${className || ''}`}
    >
      <Sparkles className="h-2.5 w-2.5 mr-0.5" />
      Sugestão IA
    </Badge>
  );
}
