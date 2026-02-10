import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Users, Crown, Star, ExternalLink, Mail, Search, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Membership {
  id: number;
  creatorId: number;
  companyId: number;
  status: string;
  tierId: number | null;
  pointsCache: number;
  couponCode: string | null;
  joinedAt: string | null;
  brandName: string;
  brandLogo: string | null;
  company: {
    id: number;
    name: string;
    logo: string | null;
  };
  tier: {
    id: number;
    tierName: string;
    sortOrder: number;
    color: string | null;
    icon: string | null;
    minPoints: number;
  } | null;
}

const statusLabels: Record<string, string> = {
  active: "Ativo",
  suspended: "Suspenso",
  archived: "Arquivado",
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  suspended: "bg-orange-100 text-orange-800",
  archived: "bg-gray-100 text-gray-800",
};

export default function MyCommunitiesPage() {
  const { data: memberships = [], isLoading } = useQuery<Membership[]>({
    queryKey: ["/api/creator/communities"],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6" data-testid="my-communities-page">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Minhas Comunidades</h1>
        <p className="text-muted-foreground">
          Marcas das quais você faz parte
        </p>
      </div>

      {memberships.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-6">
              <Users className="h-16 w-16 mx-auto text-muted-foreground/50" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Nenhuma comunidade ainda</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Você ainda não faz parte de nenhuma comunidade de marca. 
                  Explore oportunidades ou verifique se há convites pendentes.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild>
                  <Link href="/creator/invites" data-testid="button-view-invites">
                    <Mail className="h-4 w-4 mr-2" />
                    Ver Convites
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/discovery" data-testid="button-explore-opportunities">
                    <Search className="h-4 w-4 mr-2" />
                    Explorar Oportunidades
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {memberships.map((membership) => (
            <Card key={membership.id} className="hover:shadow-md transition-shadow" data-testid={`card-community-${membership.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={membership.brandLogo || membership.company.logo || undefined} />
                    <AvatarFallback className="text-lg">
                      {(membership.brandName || membership.company.name)?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {membership.brandName || membership.company.name}
                    </CardTitle>
                    <Badge className={statusColors[membership.status]}>
                      {statusLabels[membership.status]}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">Tier</span>
                  </div>
                  {membership.tier ? (
                    <Badge 
                      style={{ backgroundColor: membership.tier.color || "#8b5cf6" }}
                      className="text-white"
                    >
                      {membership.tier.tierName}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">Bronze</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Pontos</span>
                  </div>
                  <span className="font-semibold">
                    {(membership.pointsCache || 0).toLocaleString()}
                  </span>
                </div>

                {membership.couponCode && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Cupom</span>
                    </div>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {membership.couponCode}
                    </code>
                  </div>
                )}

                {membership.tier && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progresso</span>
                      <span>{membership.tier.minPoints.toLocaleString()} pts</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          backgroundColor: membership.tier.color || "#8b5cf6",
                          width: `${Math.min(100, membership.tier.minPoints > 0 ? ((membership.pointsCache || 0) / membership.tier.minPoints) * 100 : 100)}%`
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 text-xs text-muted-foreground">
                  Membro desde {membership.joinedAt ? format(new Date(membership.joinedAt), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                </div>

                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/community/${membership.companyId}`} data-testid={`button-view-community-${membership.id}`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver Comunidade
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {memberships.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Continue ativo para subir de nível!</h3>
                <p className="text-sm text-muted-foreground">
                  Complete entregas e participe de campanhas para acumular pontos e desbloquear recompensas exclusivas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
