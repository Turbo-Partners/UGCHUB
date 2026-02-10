import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMarketplace } from '@/lib/provider';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  ChevronRight,
  Crown,
  Package,
  Bell,
  Loader2,
  AlertCircle,
  RefreshCw,
  Star,
  Ticket,
  Check,
  X,
  Mail,
  Users,
} from 'lucide-react';

interface Brand {
  brandId: number;
  brandName: string;
  brandLogo: string | null;
  membershipStatus: 'member' | 'pending' | 'none';
  membershipId: number | null;
  points: number;
  tier: string | null;
  couponCode: string | null;
  joinedAt: string | null;
  openCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  pendingInvites: number;
  unreadMessages: number;
}

interface PendingInvite {
  id: number;
  type: 'community' | 'campaign';
  brandId: number;
  brandName: string;
  brandLogo: string | null;
  campaignId: number | null;
  campaignTitle: string | null;
  status: string;
  createdAt: string;
  expiresAt: string | null;
  message: string | null;
}

export default function CreatorBrands() {
  const { user } = useMarketplace();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: brands = [], isLoading, isError, refetch } = useQuery<Brand[]>({
    queryKey: ['/api/creator/brands'],
    enabled: !!user && user.role === 'creator',
    retry: 2,
    staleTime: 30000,
  });

  const { data: invitations = [] } = useQuery<PendingInvite[]>({
    queryKey: ['/api/creator/invitations'],
    enabled: !!user && user.role === 'creator',
  });

  const [activeTab, setActiveTab] = useState<string>("brands");
  
  useEffect(() => {
    if (invitations.length > 0) {
      setActiveTab("invites");
    }
  }, [invitations.length]);

  const acceptMutation = useMutation({
    mutationFn: async ({ id, type }: { id: number; type: 'community' | 'campaign' }) => {
      const res = await fetch(`/api/creator/invitations/${id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao aceitar convite');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Convite aceito!', description: 'Você agora faz parte da comunidade.' });
      queryClient.invalidateQueries({ queryKey: ['/api/creator/brands'] });
      queryClient.invalidateQueries({ queryKey: ['/api/creator/invitations'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async ({ id, type }: { id: number; type: 'community' | 'campaign' }) => {
      const res = await fetch(`/api/creator/invitations/${id}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao recusar convite');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Convite recusado' });
      queryClient.invalidateQueries({ queryKey: ['/api/creator/invitations'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando marcas...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar marcas</h3>
            <p className="text-muted-foreground max-w-sm text-center mb-6">
              Não foi possível carregar suas marcas. Tente novamente.
            </p>
            <Button onClick={() => refetch()} data-testid="button-retry">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const memberBrands = brands.filter(b => b.membershipStatus === 'member');
  const pendingBrands = brands.filter(b => b.membershipStatus === 'pending');
  const campaignOnlyBrands = brands.filter(b => b.membershipStatus === 'none');
  const allBrands = [...memberBrands, ...pendingBrands, ...campaignOnlyBrands];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-heading tracking-tight" data-testid="text-page-title">
          Minhas Marcas
        </h1>
        <p className="text-muted-foreground">
          Marcas com as quais você colabora ou tem convites pendentes
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="brands" className="gap-2" data-testid="tab-brands">
            <Users className="h-4 w-4" />
            Minhas Marcas
            {allBrands.length > 0 && (
              <Badge variant="secondary" className="ml-1">{allBrands.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="invites" className="gap-2" data-testid="tab-invites">
            <Mail className="h-4 w-4" />
            Convites
            {invitations.length > 0 && (
              <Badge variant="destructive" className="ml-1">{invitations.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="brands" className="space-y-6">
          {allBrands.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Building2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma marca ainda</h3>
                <p className="text-muted-foreground max-w-sm text-center mb-6">
                  Você ainda não faz parte de nenhuma comunidade de marca. Explore campanhas para começar!
                </p>
                <Link href="/feed">
                  <Button data-testid="button-explore">
                    Explorar Campanhas
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              {memberBrands.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Minhas Comunidades</h2>
                    <Badge variant="secondary">{memberBrands.length}</Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {memberBrands.map((brand) => (
                      <BrandCard key={brand.brandId} brand={brand} />
                    ))}
                  </div>
                </div>
              )}

              {pendingBrands.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-amber-500" />
                    <h2 className="text-lg font-semibold">Memberships Pendentes</h2>
                    <Badge variant="secondary">{pendingBrands.length}</Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pendingBrands.map((brand) => (
                      <BrandCard key={brand.brandId} brand={brand} isPending />
                    ))}
                  </div>
                </div>
              )}

              {campaignOnlyBrands.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-lg font-semibold">Campanhas Avulsas</h2>
                    <Badge variant="secondary">{campaignOnlyBrands.length}</Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {campaignOnlyBrands.map((brand) => (
                      <BrandCard key={brand.brandId} brand={brand} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="invites" className="space-y-4">
          {invitations.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Mail className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum convite pendente</h3>
                <p className="text-muted-foreground max-w-sm text-center">
                  Você não tem convites aguardando resposta no momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {invitations.map((invite) => (
                <InviteCard 
                  key={`${invite.type}-${invite.id}`} 
                  invite={invite}
                  onAccept={() => acceptMutation.mutate({ id: invite.id, type: invite.type })}
                  onDecline={() => declineMutation.mutate({ id: invite.id, type: invite.type })}
                  isAccepting={acceptMutation.isPending}
                  isDeclining={declineMutation.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface InviteCardProps {
  invite: PendingInvite;
  onAccept: () => void;
  onDecline: () => void;
  isAccepting: boolean;
  isDeclining: boolean;
}

function InviteCard({ invite, onAccept, onDecline, isAccepting, isDeclining }: InviteCardProps) {
  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20" data-testid={`invite-card-${invite.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            {invite.brandLogo ? (
              <AvatarImage src={invite.brandLogo} alt={invite.brandName} />
            ) : null}
            <AvatarFallback>
              <Building2 className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{invite.brandName}</h3>
              <Badge variant="outline" className="shrink-0 text-amber-600 border-amber-300">
                {invite.type === 'community' ? 'Comunidade' : 'Campanha'}
              </Badge>
            </div>
            
            {invite.campaignTitle && (
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {invite.campaignTitle}
              </p>
            )}
            
            {invite.message && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                "{invite.message}"
              </p>
            )}
            
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                onClick={(e) => { e.preventDefault(); onAccept(); }}
                disabled={isAccepting || isDeclining}
                data-testid={`button-accept-invite-${invite.id}`}
              >
                {isAccepting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                Aceitar
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => { e.preventDefault(); onDecline(); }}
                disabled={isAccepting || isDeclining}
                data-testid={`button-decline-invite-${invite.id}`}
              >
                {isDeclining ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <X className="h-4 w-4 mr-1" />}
                Recusar
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BrandCard({ brand, isPending = false }: { brand: Brand; isPending?: boolean }) {
  const totalCampaigns = brand.activeCampaigns + brand.completedCampaigns;
  
  return (
    <Link href={`/brand/${brand.brandId}`} data-testid={`brand-card-${brand.brandId}`}>
      <Card className={`hover:shadow-md transition-all cursor-pointer ${isPending ? 'border-amber-200 bg-amber-50/50 dark:bg-amber-950/20' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12">
              {brand.brandLogo ? (
                <AvatarImage src={brand.brandLogo} alt={brand.brandName} />
              ) : null}
              <AvatarFallback>
                <Building2 className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{brand.brandName}</h3>
                {brand.tier && (
                  <Badge variant="outline" className="shrink-0">
                    {brand.tier}
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
                {brand.activeCampaigns > 0 && (
                  <span className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {brand.activeCampaigns} ativa{brand.activeCampaigns !== 1 ? 's' : ''}
                  </span>
                )}
                {brand.pendingInvites > 0 && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <Bell className="h-3 w-3" />
                    {brand.pendingInvites} convite{brand.pendingInvites !== 1 ? 's' : ''}
                  </span>
                )}
                {brand.points > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {brand.points} pts
                  </span>
                )}
              </div>

              {brand.couponCode && (
                <div className="flex items-center gap-1 mt-2 text-xs bg-primary/10 text-primary rounded px-2 py-1 w-fit">
                  <Ticket className="h-3 w-3" />
                  <span className="font-mono">{brand.couponCode}</span>
                </div>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
