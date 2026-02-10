import { LayoutGrid, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ViewMode } from '@/hooks/use-view-preference';
import { cn } from '@/lib/utils';

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ mode, onChange, className }: ViewToggleProps) {
  return (
    <TooltipProvider>
      <div className={cn("hidden md:flex items-center", className)} data-testid="view-toggle">
        <div className="flex items-center gap-1 rounded-md border p-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={mode === 'cards' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onChange('cards')}
              className="h-8 w-8 p-0"
              data-testid="button-view-cards"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Visualização em Cards</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={mode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onChange('table')}
              className="h-8 w-8 p-0"
              data-testid="button-view-table"
            >
              <Table className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Visualização em Tabela</p>
          </TooltipContent>
        </Tooltip>

        </div>
      </div>
    </TooltipProvider>
  );
}
