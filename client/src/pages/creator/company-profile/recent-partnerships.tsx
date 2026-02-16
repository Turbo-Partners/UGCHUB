import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { Star, Play, Building2, MapPin, Users } from 'lucide-react';
import { getAvatarUrl } from '@/lib/utils';
import type { RecentPartnership } from './types';

interface RecentPartnershipsProps {
  partnerships: RecentPartnership[];
}

export function RecentPartnerships({ partnerships }: RecentPartnershipsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500" />
          Parcerias Recentes
        </h2>
        {partnerships.length > 0 && (
          <span className="text-sm text-muted-foreground">{partnerships.length} colaborações</span>
        )}
      </div>

      {partnerships.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {partnerships.map((partnership, idx) => (
            <motion.div
              key={partnership.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="overflow-hidden hover:shadow-md transition-all cursor-pointer group">
                <div className="relative aspect-[4/5] bg-muted">
                  {partnership.thumbnail ? (
                    <img
                      src={partnership.thumbnail}
                      alt={partnership.creatorName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                      <Building2 className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                  {partnership.hasVideo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="h-5 w-5 text-primary ml-1" />
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2">
                    <Avatar className="h-8 w-8 ring-2 ring-white shadow">
                      <AvatarImage src={getAvatarUrl(partnership.creatorAvatar)} />
                      <AvatarFallback className="text-xs bg-primary text-white">
                        {partnership.creatorName[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <CardContent className="p-3">
                  <div className="flex flex-wrap items-center gap-1 mb-1">
                    {partnership.creatorCity && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        <MapPin className="h-2.5 w-2.5 mr-0.5" />
                        {partnership.creatorCity}
                      </Badge>
                    )}
                    {partnership.creatorNiche && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        {partnership.creatorNiche}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{partnership.creatorName}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Ainda sem parcerias</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Esta marca está começando agora. Seja o primeiro a colaborar!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
