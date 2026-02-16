import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  ShieldCheck,
  Star,
  Heart,
  Globe,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Sparkles,
  Briefcase,
  Users,
  Loader2,
  Facebook,
  Linkedin,
  Twitter,
  Youtube,
} from 'lucide-react';
import { getAvatarUrl } from '@/lib/utils';
import { STATE_OPTIONS } from '@shared/constants';
import type { CompanyStats, OpenCampaign } from './types';
import { TikTokIcon } from './types';

interface SidebarCardProps {
  stats: CompanyStats;
  openCampaigns: OpenCampaign[];
  isFavorite: boolean;
  isFavoriteLoading: boolean;
  membershipStatus: { isMember: boolean; status: string | null; joinedAt: string | null } | undefined;
  requestMembershipIsPending: boolean;
  onRequestMembership: () => void;
  onOpenApplySheet: () => void;
  onToggleFavorite: () => void;
}

export function SidebarCard({
  stats,
  openCampaigns,
  isFavorite,
  isFavoriteLoading,
  membershipStatus,
  requestMembershipIsPending,
  onRequestMembership,
  onOpenApplySheet,
  onToggleFavorite,
}: SidebarCardProps) {
  return (
    <Card className="sticky top-4 shadow-lg">
      <CardContent className="p-6 space-y-6">
        {stats.company.cnpj && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-lg shadow-md">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-700 dark:text-emerald-300">Marca Verificada</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                CNPJ verificado no sistema
              </p>
            </div>
          </div>
        )}

        <Separator />

        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Estatísticas</h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
              <p className="text-2xl font-bold text-primary">{stats.activeCampaigns}</p>
              <p className="text-xs text-muted-foreground mt-1">Campanhas Ativas</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-violet-500/10 to-violet-500/5 rounded-xl border border-violet-500/20">
              <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{stats.totalCollaborations}</p>
              <p className="text-xs text-muted-foreground mt-1">Colaborações</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <span className="text-muted-foreground flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                Avaliação
              </span>
              <span className="font-semibold flex items-center gap-1">
                {stats.avgRating.toFixed(1)}
                <span className="text-muted-foreground font-normal text-xs">({stats.totalReviews})</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <span className="text-muted-foreground flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                Favoritos
              </span>
              <span className="font-semibold">{stats.favoriteCount}</span>
            </div>
          </div>
        </div>

        {(stats.company.website || stats.company.email || stats.company.phone || stats.company.tiktok || (stats.company.city || stats.company.state) || (stats.company.websiteSocialLinks && Object.keys(stats.company.websiteSocialLinks).length > 0)) && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Contato & Redes Sociais</h3>

              <div className="space-y-2">
                {stats.company.website && (
                  <a
                    href={stats.company.website.startsWith('http') ? stats.company.website : `https://${stats.company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/70 transition-all group"
                  >
                    <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                      <Globe className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                        {stats.company.website.replace(/^https?:\/\//, '')}
                      </p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}

                {stats.company.email && (
                  <a
                    href={`mailto:${stats.company.email}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/70 transition-all group"
                  >
                    <div className="p-2 rounded-md bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                        {stats.company.email}
                      </p>
                    </div>
                  </a>
                )}

                {stats.company.phone && (
                  <div className="flex items-center gap-3 p-2.5 rounded-lg">
                    <div className="p-2 rounded-md bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{stats.company.phone}</p>
                    </div>
                  </div>
                )}

                {stats.company.tiktok && (
                  <a
                    href={`https://tiktok.com/@${stats.company.tiktok.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/70 transition-all group"
                  >
                    <div className="p-2 rounded-md bg-black dark:bg-white/90 text-white dark:text-black">
                      <TikTokIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                        {stats.company.tiktok.startsWith('@') ? stats.company.tiktok : `@${stats.company.tiktok}`}
                      </p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}

                {stats.company.websiteSocialLinks && Object.entries(stats.company.websiteSocialLinks).map(([platform, url]) => {
                  if (platform === 'instagram' || platform === 'tiktok') return null;

                  const getSocialIcon = () => {
                    switch (platform.toLowerCase()) {
                      case 'facebook': return <Facebook className="h-4 w-4" />;
                      case 'linkedin': return <Linkedin className="h-4 w-4" />;
                      case 'twitter': return <Twitter className="h-4 w-4" />;
                      case 'youtube': return <Youtube className="h-4 w-4" />;
                      default: return <Globe className="h-4 w-4" />;
                    }
                  };

                  const getIconBg = () => {
                    switch (platform.toLowerCase()) {
                      case 'facebook': return 'bg-blue-600 text-white';
                      case 'linkedin': return 'bg-blue-700 text-white';
                      case 'twitter': return 'bg-sky-500 text-white';
                      case 'youtube': return 'bg-red-600 text-white';
                      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
                    }
                  };

                  return (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/70 transition-all group"
                    >
                      <div className={`p-2 rounded-md ${getIconBg()}`}>
                        {getSocialIcon()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate group-hover:text-primary transition-colors capitalize">
                          {platform}
                        </p>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  );
                })}

                {(stats.company.city || stats.company.state) && (() => {
                  const stateName = stats.company.state
                    ? STATE_OPTIONS.find(s => s.value === stats.company.state)?.label || stats.company.state
                    : null;
                  return (
                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 mt-3">
                      <div className="p-2 rounded-md bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {[stats.company.city, stateName].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </>
        )}

        {stats.topCreators.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Top Criadores</h3>
              <div className="space-y-2">
                {stats.topCreators.slice(0, 4).map((creator) => (
                  <div key={creator.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={getAvatarUrl(creator.avatar)} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {creator.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{creator.name}</p>
                      <p className="text-xs text-muted-foreground">{creator.collaborations} parcerias</p>
                    </div>
                    {creator.avgRating > 0 && (
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        {creator.avgRating.toFixed(1)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="space-y-2">
          {openCampaigns.length > 0 ? (
            <Button
              className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all"
              size="lg"
              onClick={onOpenApplySheet}
              data-testid="button-apply-sidebar"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Solicitar Parceria
            </Button>
          ) : (
            <Button
              className="w-full"
              size="lg"
              variant="secondary"
              disabled
              data-testid="button-apply-sidebar"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Sem campanhas abertas
            </Button>
          )}

          {!membershipStatus?.isMember && membershipStatus?.status !== "invited" && (
            <Button
              className="w-full"
              variant="outline"
              size="lg"
              onClick={onRequestMembership}
              disabled={requestMembershipIsPending}
            >
              {requestMembershipIsPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Users className="h-4 w-4 mr-2" />
              )}
              Entrar na Comunidade
            </Button>
          )}

          <Button
            className="w-full"
            variant="outline"
            onClick={onToggleFavorite}
            disabled={isFavoriteLoading}
          >
            {isFavorite ? (
              <>
                <Heart className="h-4 w-4 mr-2 fill-current text-red-500" />
                Favoritada
              </>
            ) : (
              <>
                <Heart className="h-4 w-4 mr-2" />
                Adicionar aos favoritos
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
