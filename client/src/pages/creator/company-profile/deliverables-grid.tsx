import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { Eye, Play, Building2 } from 'lucide-react';
import { getAvatarUrl } from '@/lib/utils';
import type { PublicDeliverable } from './types';
import { deliverableTypeLabels } from './types';

interface DeliverablesGridProps {
  deliverables: PublicDeliverable[];
}

export function DeliverablesGrid({ deliverables }: DeliverablesGridProps) {
  if (deliverables.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          Trabalhos Realizados
        </h2>
        <span className="text-sm text-muted-foreground">{deliverables.length} entregas</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {deliverables.slice(0, 9).map((deliverable, idx) => {
          const isVideo = deliverable.fileType?.startsWith('video/') ||
            deliverable.fileUrl?.match(/\.(mp4|mov|webm)$/i);
          const typeLabel = deliverable.deliverableType
            ? deliverableTypeLabels[deliverable.deliverableType] || deliverable.deliverableType
            : null;

          return (
            <motion.div
              key={deliverable.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <Card className="overflow-hidden hover:shadow-md transition-all group">
                <div className="relative aspect-[4/5] bg-muted">
                  {isVideo ? (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-md">
                        <Play className="h-5 w-5 text-primary ml-1" />
                      </div>
                    </div>
                  ) : deliverable.fileUrl ? (
                    <img
                      src={deliverable.fileUrl}
                      alt={deliverable.description || deliverable.campaignTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                      <Building2 className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                  {typeLabel && (
                    <div className="absolute top-2 right-2">
                      <Badge className="text-[10px] px-1.5 py-0 bg-black/60 text-white border-0 backdrop-blur-sm">
                        {typeLabel}
                      </Badge>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2">
                    <Avatar className="h-7 w-7 ring-2 ring-white shadow">
                      <AvatarImage src={getAvatarUrl(deliverable.creatorAvatar)} />
                      <AvatarFallback className="text-[10px] bg-primary text-white">
                        {deliverable.creatorName[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <CardContent className="p-2.5">
                  <p className="text-xs font-medium truncate">{deliverable.creatorName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{deliverable.campaignTitle}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
