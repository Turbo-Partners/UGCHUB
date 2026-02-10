import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useMarketplace } from "@/lib/provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  Calendar,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Loader2,
  ExternalLink,
  Inbox,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { toast } from "sonner";
import type { Campaign, User, CampaignInvite } from "@shared/schema";

type InviteWithDetails = CampaignInvite & {
  campaign: Campaign;
  company: User;
};

export default function CreatorInvites() {
  const { user } = useMarketplace();
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");
  const [processingInviteId, setProcessingInviteId] = useState<number | null>(null);

  const { data: pendingInvites = [], isLoading: loadingPending } = useQuery<InviteWithDetails[]>({
    queryKey: ["/api/invites/pending"],
    queryFn: async () => {
      const res = await fetch("/api/invites/pending", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch pending invites");
      return res.json();
    },
    enabled: !!user && user.role === "creator",
  });

  const { data: allInvites = [], isLoading: loadingAll } = useQuery<InviteWithDetails[]>({
    queryKey: ["/api/invites"],
    queryFn: async () => {
      const res = await fetch("/api/invites", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch all invites");
      return res.json();
    },
    enabled: !!user && user.role === "creator" && activeTab === "all",
  });

  const acceptInviteMutation = useMutation({
    mutationFn: async (inviteId: number) => {
      setProcessingInviteId(inviteId);
      const res = await fetch(`/api/invites/${inviteId}/accept`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to accept invite");
      }
      return res.json();
    },
    onSuccess: async (data) => {
      // Add application to cache immediately for instant UI update
      if (data.application) {
        queryClient.setQueryData(["/api/applications"], (old: any[] | undefined) => {
          const current = old ?? [];
          const exists = current.some((app: any) => app.id === data.application.id);
          return exists ? current : [...current, data.application];
        });
        queryClient.setQueryData(["/api/applications/active"], (old: any[] | undefined) => {
          const current = old ?? [];
          const exists = current.some((app: any) => app.id === data.application.id);
          return exists ? current : [...current, data.application];
        });
      }
      // Invalidate and refetch to ensure complete sync
      await queryClient.invalidateQueries({ queryKey: ["/api/applications"], exact: true, refetchType: 'all' });
      await queryClient.invalidateQueries({ queryKey: ["/api/applications/active"], exact: true, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["/api/invites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invites/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invites/count"] });
      setProcessingInviteId(null);
      toast.success("Convite aceito!", {
        description: "Você agora faz parte desta campanha. Acesse suas campanhas ativas.",
      });
    },
    onError: (error: Error) => {
      setProcessingInviteId(null);
      toast.error("Erro ao aceitar convite", {
        description: error.message,
      });
    },
  });

  const declineInviteMutation = useMutation({
    mutationFn: async (inviteId: number) => {
      setProcessingInviteId(inviteId);
      const res = await fetch(`/api/invites/${inviteId}/decline`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to decline invite");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invites/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invites/count"] });
      setProcessingInviteId(null);
      toast.success("Convite recusado", {
        description: "O convite foi recusado com sucesso.",
      });
    },
    onError: (error: Error) => {
      setProcessingInviteId(null);
      toast.error("Erro ao recusar convite", {
        description: error.message,
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="border-amber-500 text-amber-600">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case "accepted":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aceito
          </Badge>
        );
      case "declined":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Recusado
          </Badge>
        );
      default:
        return null;
    }
  };

  const invites = activeTab === "pending" ? pendingInvites : allInvites;
  const isLoading = activeTab === "pending" ? loadingPending : loadingAll;

  if (!user || user.role !== "creator") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Convites de Campanha</h1>
              <p className="text-muted-foreground">
                Empresas que te convidaram para participar de campanhas
              </p>
            </div>
          </div>
          {pendingInvites.length > 0 && (
            <Badge variant="secondary" className="text-sm">
              {pendingInvites.length} pendente{pendingInvites.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pending" | "all")}>
          <TabsList>
            <TabsTrigger value="pending" data-testid="tab-pending-invites">
              Pendentes
              {pendingInvites.length > 0 && (
                <Badge variant="default" className="ml-2 h-5 px-1.5">
                  {pendingInvites.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" data-testid="tab-all-invites">
              Todos
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : invites.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {activeTab === "pending"
                      ? "Nenhum convite pendente"
                      : "Nenhum convite recebido"}
                  </h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    {activeTab === "pending"
                      ? "Quando empresas te convidarem para campanhas, os convites aparecerão aqui."
                      : "Você ainda não recebeu nenhum convite de campanha."}
                  </p>
                  <Button asChild className="mt-4" variant="outline">
                    <Link href="/creator/feed">
                      Explorar Campanhas Disponíveis
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {invites.map((invite) => (
                  <Card
                    key={invite.id}
                    className={`transition-all ${
                      invite.status === "pending"
                        ? "border-primary/50 shadow-md"
                        : ""
                    }`}
                    data-testid={`invite-card-${invite.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={invite.company.avatar ?? undefined} />
                            <AvatarFallback>
                              <Building2 className="h-6 w-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">
                              {invite.campaign.title}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {invite.company.companyName || invite.company.name}
                            </CardDescription>
                          </div>
                        </div>
                        {getStatusBadge(invite.status)}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {invite.campaign.description}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          <span>{invite.campaign.budget}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{invite.campaign.deadline}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>
                            {invite.campaign.creatorsNeeded} criador
                            {invite.campaign.creatorsNeeded > 1 ? "es" : ""}
                          </span>
                        </div>
                      </div>

                      {invite.campaign.targetNiche &&
                        invite.campaign.targetNiche.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {invite.campaign.targetNiche.map((niche, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {niche}
                              </Badge>
                            ))}
                          </div>
                        )}

                      <p className="text-xs text-muted-foreground">
                        Convite recebido em{" "}
                        {(() => {
                          try {
                            const date = invite.createdAt instanceof Date 
                              ? invite.createdAt 
                              : typeof invite.createdAt === 'string'
                                ? parseISO(invite.createdAt)
                                : new Date(invite.createdAt);
                            return format(date, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
                          } catch {
                            return 'data não disponível';
                          }
                        })()}
                      </p>
                    </CardContent>

                    <CardFooter className="flex gap-2 pt-4 border-t">
                      {invite.status === "pending" ? (
                        <>
                          <Button
                            className="flex-1"
                            onClick={() => acceptInviteMutation.mutate(invite.id)}
                            disabled={processingInviteId === invite.id}
                            data-testid={`button-accept-invite-${invite.id}`}
                          >
                            {processingInviteId === invite.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            Aceitar Convite
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => declineInviteMutation.mutate(invite.id)}
                            disabled={processingInviteId === invite.id}
                            data-testid={`button-decline-invite-${invite.id}`}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Recusar
                          </Button>
                        </>
                      ) : invite.status === "accepted" ? (
                        <Button asChild className="flex-1">
                          <Link href="/creator/active-campaigns">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Ver Campanhas Ativas
                          </Link>
                        </Button>
                      ) : (
                        <p className="text-sm text-muted-foreground w-full text-center">
                          Este convite foi recusado
                        </p>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
