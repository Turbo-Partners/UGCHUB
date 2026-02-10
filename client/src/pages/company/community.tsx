import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Copy, UserPlus, Users, Mail, Link, Clock, CheckCircle, XCircle, Search, Filter, Crown, ExternalLink, Trophy, Megaphone, MoreHorizontal, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BrandTiersManager } from "@/components/gamification/BrandTiersManager";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { lazy, Suspense } from "react";

const ContentLibrary = lazy(() => import("@/pages/company/content-library"));

interface CommunityInvite {
  id: number;
  companyId: number;
  token: string;
  email: string | null;
  name: string | null;
  creatorHandle: string | null;
  creatorId: number | null;
  status: "sent" | "opened" | "accepted" | "expired" | "cancelled";
  customMessage: string | null;
  expiresAt: string | null;
  createdAt: string;
  openedAt: string | null;
  acceptedAt: string | null;
  creator?: {
    id: number;
    name: string;
    instagram: string | null;
  } | null;
}

interface CommunityMember {
  id: number;
  creatorId: number;
  companyId: number;
  status: "invited" | "active" | "suspended" | "archived";
  tierId: number | null;
  totalPoints: number;
  tags: string[] | null;
  notes: string | null;
  source: string | null;
  joinedAt: string | null;
  creator: {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    instagram: string | null;
  };
  tier: {
    id: number;
    tierName: string;
    tierLevel: number;
    badgeColor: string | null;
    badgeIcon: string | null;
  } | null;
}

interface CommunityStats {
  totalMembers: number;
  activeMembers: number;
  pendingInvites: number;
}

interface BrandTier {
  id: number;
  companyId: number;
  tierName: string;
  tierLevel: number;
  minPoints: number;
  badgeColor: string | null;
  badgeIcon: string | null;
  benefits: string | null;
}

interface CreatorAdPartner {
  id: number;
  companyId: number;
  creatorId: number | null;
  instagramUsername: string;
  instagramUserId: string | null;
  status: string;
  accessToken: string | null;
}

interface PartnershipInvitation {
  id: number;
  token: string;
  instagramUsername: string | null;
  email: string | null;
  isUsed: boolean;
  expiresAt: string;
  url: string;
  isExpired: boolean;
}

const statusLabels: Record<string, string> = {
  sent: "Enviado",
  opened: "Visualizado",
  accepted: "Aceito",
  expired: "Expirado",
  cancelled: "Cancelado",
  invited: "Convidado",
  active: "Ativo",
  suspended: "Suspenso",
  archived: "Arquivado",
};

const statusColors: Record<string, string> = {
  sent: "bg-blue-100 text-blue-800",
  opened: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  expired: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
  invited: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  suspended: "bg-orange-100 text-orange-800",
  archived: "bg-gray-100 text-gray-800",
};

export default function CommunityPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [inviteForm, setInviteForm] = useState({
    email: "",
    name: "",
    creatorHandle: "",
    customMessage: "",
    expiresInDays: 30,
  });
  
  // Partnership invitation state - tracks which member is being invited
  const [invitingMemberId, setInvitingMemberId] = useState<number | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<CommunityStats>({
    queryKey: ["/api/community/stats"],
  });

  const { data: members = [], isLoading: membersLoading } = useQuery<CommunityMember[]>({
    queryKey: ["/api/community/members", statusFilter, tierFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (tierFilter !== "all") params.set("tierId", tierFilter);
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/community/members?${params.toString()}`);
      return res.json();
    },
  });

  const { data: invites = [], isLoading: invitesLoading } = useQuery<CommunityInvite[]>({
    queryKey: ["/api/community/invites"],
  });

  const { data: tiers = [] } = useQuery<BrandTier[]>({
    queryKey: ["/api/brand/tiers"],
  });

  // Partnership Ads queries
  const { data: partnershipData } = useQuery<{ partners: CreatorAdPartner[] }>({
    queryKey: ["/api/meta-marketing/creator-partners"],
  });

  const { data: invitationsData } = useQuery<{ invitations: PartnershipInvitation[] }>({
    queryKey: ["/api/partnership/invitations"],
  });

  // Helper to get partnership status for a member
  const getPartnershipStatus = (member: CommunityMember) => {
    const instagram = member.creator.instagram?.replace("@", "");
    if (!instagram) return { status: "no_instagram", label: "Sem Instagram" };
    
    // Check by creatorId first, then by username
    const partner = partnershipData?.partners?.find(
      p => p.creatorId === member.creatorId || 
           p.instagramUsername?.toLowerCase() === instagram.toLowerCase()
    );
    
    if (partner) {
      const statusMap: Record<string, { status: string; label: string }> = {
        active: { status: "active", label: "Autorizado" },
        request_sent: { status: "pending", label: "Pendente" },
        pending: { status: "pending", label: "Pendente" },
        expired: { status: "expired", label: "Expirado" },
        revoked: { status: "revoked", label: "Revogado" },
      };
      const mapped = statusMap[partner.status] || { status: "unknown", label: "Desconhecido" };
      return { ...mapped, partner };
    }
    
    // Check invitations by both creatorId (if exists) and username
    const invitation = invitationsData?.invitations?.find(i => {
      if (i.isUsed || i.isExpired) return false;
      return i.instagramUsername?.toLowerCase() === instagram.toLowerCase();
    });
    
    if (invitation) {
      return { status: "invited", label: "Convite Enviado", invitation };
    }
    
    return { status: "not_invited", label: "Não Convidado" };
  };

  const createInviteMutation = useMutation({
    mutationFn: async (data: typeof inviteForm) => {
      const res = await apiRequest("POST", "/api/community/invites", data);
      return res.json();
    },
    onSuccess: (invite) => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/invites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/stats"] });
      setIsInviteDialogOpen(false);
      setInviteForm({ email: "", name: "", creatorHandle: "", customMessage: "", expiresInDays: 30 });
      
      const inviteUrl = `${window.location.origin}/join/${invite.token}`;
      navigator.clipboard.writeText(inviteUrl);
      toast({ 
        title: "Convite criado", 
        description: "Link do convite copiado para a área de transferência" 
      });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar convite", description: error.message, variant: "destructive" });
    },
  });

  const cancelInviteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/community/invites/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/invites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/stats"] });
      toast({ title: "Convite cancelado" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao cancelar", description: error.message, variant: "destructive" });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { status?: string; tierId?: number | null } }) => {
      const res = await apiRequest("PATCH", `/api/community/members/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/members"] });
      toast({ title: "Membro atualizado" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    },
  });

  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/join/${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado" });
  };
  
  // Partnership invitation mutation
  const createPartnershipInviteMutation = useMutation({
    mutationFn: async ({ memberId, instagramUsername }: { memberId: number; instagramUsername: string }) => {
      setInvitingMemberId(memberId);
      const res = await apiRequest("POST", "/api/partnership/invitations", { instagramUsername });
      return res.json();
    },
    onSuccess: (data) => {
      setInvitingMemberId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/partnership/invitations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meta-marketing/creator-partners"] });
      if (data.invitation?.url) {
        navigator.clipboard.writeText(data.invitation.url);
        toast({
          title: "Convite para anúncios criado",
          description: "Link copiado para a área de transferência",
        });
      }
    },
    onError: (error: Error) => {
      setInvitingMemberId(null);
      toast({ title: "Erro ao criar convite", description: error.message, variant: "destructive" });
    },
  });

  const pendingInvites = invites.filter(i => i.status === "sent" || i.status === "opened");
  const pastInvites = invites.filter(i => i.status === "accepted" || i.status === "expired" || i.status === "cancelled");

  return (
    <div className="container mx-auto py-6 space-y-6" data-testid="community-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Minha Comunidade</h1>
          <p className="text-muted-foreground">
            Gerencie sua comunidade de criadores e convites
          </p>
        </div>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-invite">
              <UserPlus className="h-4 w-4 mr-2" />
              Convidar Criador
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Convidar para a comunidade</DialogTitle>
              <DialogDescription>
                Crie um link de convite para um criador se juntar à sua comunidade
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite-name">Nome do criador (opcional)</Label>
                <Input
                  id="invite-name"
                  data-testid="input-invite-name"
                  placeholder="Ex: Maria Silva"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-handle">@ do Instagram (opcional)</Label>
                <Input
                  id="invite-handle"
                  data-testid="input-invite-handle"
                  placeholder="@usuario_instagram"
                  value={inviteForm.creatorHandle}
                  onChange={(e) => {
                    const value = e.target.value.trim().replace(/^@+/, '');
                    setInviteForm({ ...inviteForm, creatorHandle: value });
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Se o criador já estiver cadastrado, o convite será associado automaticamente
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-email">E-mail (opcional)</Label>
                <Input
                  id="invite-email"
                  data-testid="input-invite-email"
                  type="email"
                  placeholder="maria@exemplo.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-message">Mensagem personalizada (opcional)</Label>
                <Textarea
                  id="invite-message"
                  data-testid="input-invite-message"
                  placeholder="Olá! Gostaríamos de convidá-lo(a) para fazer parte da nossa comunidade..."
                  value={inviteForm.customMessage}
                  onChange={(e) => setInviteForm({ ...inviteForm, customMessage: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-expires">Validade do convite</Label>
                <Select
                  value={String(inviteForm.expiresInDays)}
                  onValueChange={(v) => setInviteForm({ ...inviteForm, expiresInDays: parseInt(v) })}
                >
                  <SelectTrigger data-testid="select-invite-expires">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="15">15 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                    <SelectItem value="60">60 dias</SelectItem>
                    <SelectItem value="90">90 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsInviteDialogOpen(false)}
                data-testid="button-cancel-invite"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => createInviteMutation.mutate(inviteForm)}
                disabled={createInviteMutation.isPending}
                data-testid="button-confirm-invite"
              >
                {createInviteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Link className="h-4 w-4 mr-2" />
                )}
                Criar Link de Convite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-members">
              {statsLoading ? "..." : stats?.totalMembers || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membros Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-members">
              {statsLoading ? "..." : stats?.activeMembers || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Convites Pendentes</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-invites">
              {statsLoading ? "..." : stats?.pendingInvites || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="members" data-testid="tab-members">
            <Users className="h-4 w-4 mr-2" />
            Membros ({members.length})
          </TabsTrigger>
          <TabsTrigger value="invites" data-testid="tab-invites">
            <Mail className="h-4 w-4 mr-2" />
            Convites ({pendingInvites.length})
          </TabsTrigger>
          <TabsTrigger value="tiers" data-testid="tab-tiers">
            <Trophy className="h-4 w-4 mr-2" />
            Tiers
          </TabsTrigger>
          <TabsTrigger value="content" data-testid="tab-content">
            <FileText className="h-4 w-4 mr-2" />
            Conteúdo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, email ou @..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-members"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="suspended">Suspensos</SelectItem>
                      <SelectItem value="archived">Arquivados</SelectItem>
                    </SelectContent>
                  </Select>
                  {tiers.length > 0 && (
                    <Select value={tierFilter} onValueChange={setTierFilter}>
                      <SelectTrigger className="w-[150px]" data-testid="select-tier-filter">
                        <Crown className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {tiers.map((tier) => (
                          <SelectItem key={tier.id} value={String(tier.id)}>
                            {tier.tierName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum membro encontrado</h3>
                  <p className="text-muted-foreground mb-4">
                    Comece convidando criadores para sua comunidade
                  </p>
                  <Button onClick={() => setIsInviteDialogOpen(true)} data-testid="button-invite-first">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Convidar Criador
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Criador</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Pontos</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Anúncios</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => {
                      const partnershipStatus = getPartnershipStatus(member);
                      const instagram = member.creator.instagram?.replace("@", "");
                      
                      return (
                        <TableRow key={member.id} data-testid={`row-member-${member.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={member.creator.avatar || undefined} />
                                <AvatarFallback>
                                  {member.creator.name?.charAt(0) || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{member.creator.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {member.creator.instagram || member.creator.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {member.tier ? (
                              <Badge 
                                style={{ backgroundColor: member.tier.badgeColor || "#8b5cf6" }}
                                className="text-white"
                              >
                                {member.tier.tierName}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{member.totalPoints.toLocaleString()}</span>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[member.status]}>
                              {statusLabels[member.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {partnershipStatus.status === "active" && (
                                <Badge className="bg-green-100 text-green-800">
                                  <Megaphone className="h-3 w-3 mr-1" />
                                  {partnershipStatus.label}
                                </Badge>
                              )}
                              {partnershipStatus.status === "pending" && (
                                <Badge className="bg-yellow-100 text-yellow-800">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {partnershipStatus.label}
                                </Badge>
                              )}
                              {partnershipStatus.status === "invited" && (
                                <Badge className="bg-blue-100 text-blue-800">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {partnershipStatus.label}
                                </Badge>
                              )}
                              {partnershipStatus.status === "expired" && (
                                <Badge className="bg-gray-100 text-gray-800">
                                  {partnershipStatus.label}
                                </Badge>
                              )}
                              {partnershipStatus.status === "revoked" && (
                                <Badge className="bg-red-100 text-red-800">
                                  {partnershipStatus.label}
                                </Badge>
                              )}
                              {partnershipStatus.status === "not_invited" && instagram && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => createPartnershipInviteMutation.mutate({ memberId: member.id, instagramUsername: instagram })}
                                  disabled={invitingMemberId === member.id}
                                  data-testid={`button-invite-ads-${member.id}`}
                                >
                                  {invitingMemberId === member.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <>
                                      <Megaphone className="h-3 w-3 mr-1" />
                                      Convidar
                                    </>
                                  )}
                                </Button>
                              )}
                              {partnershipStatus.status === "no_instagram" && (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {member.joinedAt ? format(new Date(member.joinedAt), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" data-testid={`button-member-actions-${member.id}`}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {instagram && (
                                  <DropdownMenuItem 
                                    onClick={() => window.open(`https://instagram.com/${instagram}`, '_blank')}
                                    data-testid={`link-instagram-${member.id}`}
                                  >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Ver Instagram
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => updateMemberMutation.mutate({ id: member.id, data: { status: "active" } })}>
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                  Ativar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateMemberMutation.mutate({ id: member.id, data: { status: "suspended" } })}>
                                  <Clock className="h-4 w-4 mr-2 text-orange-500" />
                                  Suspender
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateMemberMutation.mutate({ id: member.id, data: { status: "archived" } })}>
                                  <XCircle className="h-4 w-4 mr-2 text-gray-500" />
                                  Arquivar
                                </DropdownMenuItem>
                                {instagram && partnershipStatus.status === "invited" && "invitation" in partnershipStatus && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => {
                                      const inv = partnershipStatus.invitation as PartnershipInvitation;
                                      navigator.clipboard.writeText(inv.url);
                                      toast({ title: "Link copiado" });
                                    }}>
                                      <Copy className="h-4 w-4 mr-2" />
                                      Copiar Link de Anúncios
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invites" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Convites Pendentes</CardTitle>
              <CardDescription>
                Links de convite aguardando aceitação
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invitesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : pendingInvites.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum convite pendente</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Destinatário</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Expira em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingInvites.map((invite) => (
                      <TableRow key={invite.id} data-testid={`row-invite-${invite.id}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{invite.name || "Convite aberto"}</div>
                            <div className="text-sm text-muted-foreground">
                              {invite.email || "Sem e-mail"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[invite.status]}>
                            {statusLabels[invite.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(invite.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {invite.expiresAt ? (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(invite.expiresAt), "dd/MM/yyyy", { locale: ptBR })}
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyInviteLink(invite.token)}
                              data-testid={`button-copy-invite-${invite.id}`}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => cancelInviteMutation.mutate(invite.id)}
                              disabled={cancelInviteMutation.isPending}
                              data-testid={`button-cancel-invite-${invite.id}`}
                            >
                              <XCircle className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {pastInvites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Convites</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Destinatário</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Resultado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pastInvites.map((invite) => (
                      <TableRow key={invite.id} data-testid={`row-past-invite-${invite.id}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{invite.name || "Convite aberto"}</div>
                            <div className="text-sm text-muted-foreground">
                              {invite.email || "Sem e-mail"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[invite.status]}>
                            {statusLabels[invite.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(invite.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {invite.acceptedAt ? (
                            <span className="text-green-600">
                              Aceito em {format(new Date(invite.acceptedAt), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          ) : invite.status === "expired" ? (
                            <span className="text-muted-foreground">Expirou</span>
                          ) : (
                            <span className="text-red-600">Cancelado</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tiers" className="space-y-4">
          <BrandTiersManager />
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }>
            <ContentLibrary />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
