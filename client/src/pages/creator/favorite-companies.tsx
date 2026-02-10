import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { toast } from 'sonner';
import { 
  Heart,
  Building2,
  MapPin,
  Loader2,
  ExternalLink,
  HeartOff,
  Sparkles,
  Briefcase,
  Star,
  Users,
  TrendingUp
} from 'lucide-react';
import { getAvatarUrl } from '@/lib/utils';
import type { Company } from '@shared/schema';

interface CompanyStatsPreview {
  activeCampaigns: number;
  totalCollaborations: number;
  avgRating: number;
  totalReviews: number;
}

interface FavoriteCompanyWithDetails {
  id: number;
  creatorId: number;
  companyId: number;
  createdAt: string;
  company: Company;
}

function CompanyStatsCard({ companyId }: { companyId: number }) {
  const { data: stats } = useQuery<{
    activeCampaigns: number;
    totalCollaborations: number;
    avgRating: number;
    totalReviews: number;
  }>({
    queryKey: [`/api/companies/${companyId}/public-stats`],
    select: (data: any) => ({
      activeCampaigns: data?.activeCampaigns || 0,
      totalCollaborations: data?.totalCollaborations || 0,
      avgRating: data?.avgRating || 0,
      totalReviews: data?.totalReviews || 0,
    }),
  });

  if (!stats) return null;

  return (
    <div className="grid grid-cols-3 gap-2 pt-2 border-t">
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 text-sm font-semibold">
          <Briefcase className="h-3 w-3 text-blue-500" />
          {stats.activeCampaigns}
        </div>
        <p className="text-[10px] text-muted-foreground">Campanhas</p>
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 text-sm font-semibold">
          <Users className="h-3 w-3 text-emerald-500" />
          {stats.totalCollaborations}
        </div>
        <p className="text-[10px] text-muted-foreground">Colaborações</p>
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 text-sm font-semibold">
          <Star className={`h-3 w-3 ${stats.avgRating > 0 ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />
          {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : 'N/A'}
        </div>
        <p className="text-[10px] text-muted-foreground">{stats.totalReviews} aval.</p>
      </div>
    </div>
  );
}

export default function FavoriteCompanies() {
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery<FavoriteCompanyWithDetails[]>({
    queryKey: ['/api/favorite-companies'],
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (companyId: number) => {
      const res = await fetch(`/api/favorite-companies/${companyId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to remove favorite');
    },
    onSuccess: (_, companyId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorite-companies'] });
      queryClient.invalidateQueries({ queryKey: [`/api/favorite-companies/${companyId}/check`] });
      toast.success('Empresa removida dos favoritos');
    },
    onError: () => {
      toast.error('Erro ao remover dos favoritos');
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-primary/20 rounded-full" />
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="mt-6 text-lg font-medium text-muted-foreground">Carregando favoritos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight flex items-center gap-3">
            <Heart className="h-8 w-8 text-red-500 fill-red-500" />
            Empresas Favoritas
          </h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe as empresas que você mais gosta de trabalhar
          </p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 bg-muted rounded-full mb-4">
              <HeartOff className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nenhuma empresa favorita</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Favorite empresas durante sua jornada para acompanhá-las e receber notificações quando criarem novas campanhas.
            </p>
            <Link href="/feed">
              <Button data-testid="button-explore-campaigns">
                <Sparkles className="h-4 w-4 mr-2" />
                Explorar Campanhas
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((favorite, index) => (
            <motion.div
              key={favorite.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 to-pink-500" />
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 ring-2 ring-primary/10">
                      <AvatarImage src={getAvatarUrl(favorite.company.logo)} />
                      <AvatarFallback className="text-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                        {favorite.company.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {favorite.company.tradeName || favorite.company.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Building2 className="h-3 w-3" />
                        Empresa
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {favorite.company.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {favorite.company.description}
                    </p>
                  )}
                  
                  <CompanyStatsCard companyId={favorite.companyId} />
                  
                  <div className="flex items-center gap-2 pt-2">
                    <Link href={`/company/${favorite.companyId}/profile`} className="flex-1">
                      <Button variant="outline" className="w-full" data-testid={`button-view-profile-${favorite.companyId}`}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver Perfil
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeFavoriteMutation.mutate(favorite.companyId)}
                      disabled={removeFavoriteMutation.isPending}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      data-testid={`button-remove-favorite-${favorite.companyId}`}
                    >
                      {removeFavoriteMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Heart className="h-4 w-4 fill-current" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
