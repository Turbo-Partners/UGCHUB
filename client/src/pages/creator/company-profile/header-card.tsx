import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  TrendingUp,
  CalendarDays,
  Sparkles,
  Clock,
  Users,
  Globe,
  Instagram,
  Heart,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAvatarUrl } from '@/lib/utils';
import type { CompanyStats } from './types';

interface HeaderCardProps {
  stats: CompanyStats;
  displayName: string;
  categoryLabel: string | null;
  openCampaigns: { id: number }[];
  membershipStatus: { isMember: boolean; status: string | null; joinedAt: string | null } | undefined;
  isFavorite: boolean;
  isFavoriteLoading: boolean;
  showFullDescription: boolean;
  setShowFullDescription: (v: boolean) => void;
  requestMembershipIsPending: boolean;
  onRequestMembership: () => void;
  onOpenApplySheet: () => void;
  onToggleFavorite: () => void;
}

export function HeaderCard({
  stats,
  displayName,
  categoryLabel,
  openCampaigns,
  membershipStatus,
  isFavorite,
  isFavoriteLoading,
  showFullDescription,
  setShowFullDescription,
  requestMembershipIsPending,
  onRequestMembership,
  onOpenApplySheet,
  onToggleFavorite,
}: HeaderCardProps) {
  return (
    <>
      <div className="flex flex-col sm:flex-row items-start gap-4 -mt-12 sm:-mt-16">
        <div className="relative">
          <Avatar className="h-24 w-24 sm:h-32 sm:w-32 ring-4 ring-white shadow-lg">
            <AvatarImage src={getAvatarUrl(stats.company.logo)} />
            <AvatarFallback className="text-3xl sm:text-4xl bg-gradient-to-br from-primary to-primary/80 text-white font-bold">
              {displayName[0]}
            </AvatarFallback>
          </Avatar>
          {stats.company.isFeatured && (
            <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1.5 rounded-full shadow-lg">
              <CheckCircle className="h-4 w-4" />
            </div>
          )}
        </div>

        <div className="flex-1 pt-4 sm:pt-16">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold font-heading">{displayName}</h1>
            {categoryLabel && (
              <Badge variant="secondary" className="text-sm bg-primary/10 text-primary border-primary/20">
                {categoryLabel}
              </Badge>
            )}
            {stats.company.isFeatured && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                <TrendingUp className="h-3 w-3 mr-1" />
                Em destaque
              </Badge>
            )}
          </div>

          {stats.company.tagline && (
            <p className="text-muted-foreground text-sm italic mb-2">"{stats.company.tagline}"</p>
          )}

          {stats.company.createdAt && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <CalendarDays className="h-3 w-3" />
              <span>Na plataforma desde {format(new Date(stats.company.createdAt), "MMMM 'de' yyyy", { locale: ptBR })}</span>
              {stats.totalCollaborations > 0 && (
                <>
                  <span className="text-muted-foreground/50">&bull;</span>
                  <span>{stats.totalCollaborations} parcerias realizadas</span>
                </>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-3">
            <Button
              size="lg"
              className="gap-2"
              onClick={onOpenApplySheet}
              disabled={openCampaigns.length === 0}
              data-testid="button-apply-partnership"
            >
              <Sparkles className="h-4 w-4" />
              Solicitar Parceria
            </Button>

            {membershipStatus?.isMember ? (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 py-1.5 px-3">
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                Membro da comunidade
              </Badge>
            ) : membershipStatus?.status === "invited" ? (
              <Badge variant="secondary" className="py-1.5 px-3">
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                Aguardando aprovação
              </Badge>
            ) : (
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
                onClick={onRequestMembership}
                disabled={requestMembershipIsPending}
                data-testid="button-join-community"
              >
                {requestMembershipIsPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Users className="h-4 w-4" />
                )}
                Entrar na Comunidade
              </Button>
            )}

            <div className="flex items-center gap-2">
              {stats.company.website && (
                <Button variant="outline" size="icon" asChild>
                  <a href={stats.company.website.startsWith('http') ? stats.company.website : `https://${stats.company.website}`} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {stats.company.instagram && (
                <Button variant="outline" size="icon" asChild>
                  <a href={`https://instagram.com/${stats.company.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                    <Instagram className="h-4 w-4" />
                  </a>
                </Button>
              )}
              <Button
                variant={isFavorite ? "default" : "outline"}
                size="icon"
                onClick={onToggleFavorite}
                disabled={isFavoriteLoading}
                className={isFavorite ? "bg-red-500 hover:bg-red-600 text-white" : ""}
                data-testid="button-toggle-favorite"
              >
                {isFavoriteLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      {stats.company.description && (
        <div className="space-y-2">
          <p className={`text-muted-foreground leading-relaxed ${!showFullDescription ? 'line-clamp-3' : ''}`}>
            {stats.company.description}
          </p>
          {stats.company.description.length > 200 && (
            <Button
              variant="link"
              className="p-0 h-auto text-primary"
              onClick={() => setShowFullDescription(!showFullDescription)}
            >
              {showFullDescription ? (
                <>Ver menos <ChevronUp className="h-4 w-4 ml-1" /></>
              ) : (
                <>Ver mais <ChevronDown className="h-4 w-4 ml-1" /></>
              )}
            </Button>
          )}
        </div>
      )}
    </>
  );
}
