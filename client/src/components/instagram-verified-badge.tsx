import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const sizeMap = {
  sm: 14,
  md: 16,
  lg: 20,
} as const;

interface InstagramVerifiedBadgeProps {
  type: 'meta' | 'platform';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function MetaVerifiedIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className || ''}`}
    >
      <path
        d="M19.998 3.094L14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v6.354h6.234L14.638 40l5.36-3.094L25.358 40l2.972-5.15h6.234v-6.354L40 25.359 36.906 20 40 14.641l-5.436-3.137V5.15h-6.234L25.358 0l-5.36 3.094z"
        fill="#0095F6"
      />
      <path
        d="M17.204 27.822l-6.291-6.291 2.828-2.828 3.463 3.463 8.056-8.056 2.828 2.828-10.884 10.884z"
        fill="white"
      />
    </svg>
  );
}

function PlatformVerifiedIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className || ''}`}
    >
      <path
        d="M19.998 3.094L14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v6.354h6.234L14.638 40l5.36-3.094L25.358 40l2.972-5.15h6.234v-6.354L40 25.359 36.906 20 40 14.641l-5.436-3.137V5.15h-6.234L25.358 0l-5.36 3.094z"
        fill="#10B981"
      />
      <path
        d="M17.204 27.822l-6.291-6.291 2.828-2.828 3.463 3.463 8.056-8.056 2.828 2.828-10.884 10.884z"
        fill="white"
      />
    </svg>
  );
}

export function InstagramVerifiedBadge({
  type,
  size = 'sm',
  className = '',
}: InstagramVerifiedBadgeProps) {
  const pixelSize = sizeMap[size];
  const tooltipText =
    type === 'meta' ? 'Verificado pelo Instagram' : 'Perfil validado na CreatorConnect';

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            {type === 'meta' ? (
              <MetaVerifiedIcon size={pixelSize} className={className} />
            ) : (
              <PlatformVerifiedIcon size={pixelSize} className={className} />
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
