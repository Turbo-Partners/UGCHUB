import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface CoverSectionProps {
  coverPhoto: string | null;
  displayName: string;
}

export function CoverSection({ coverPhoto, displayName }: CoverSectionProps) {
  return (
    <div className="relative">
      <div className="h-48 md:h-64 lg:h-80 w-full relative overflow-hidden">
        {coverPhoto ? (
          <img
            src={coverPhoto}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-violet-500/20 dark:from-primary/40 dark:via-slate-800 dark:to-violet-900/30">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
      </div>

      <div className="absolute top-4 left-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.history.back()}
          className="bg-black/40 hover:bg-black/60 text-white shadow-lg backdrop-blur-sm border-0"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    </div>
  );
}
