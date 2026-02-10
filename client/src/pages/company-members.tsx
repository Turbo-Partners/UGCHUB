import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMarketplace } from "@/lib/provider";
import { Users, UserPlus, Mail, Clock, Trash2, Shield, Crown, Loader2, Copy, Check } from "lucide-react";
import type { CompanyMember, CompanyUserInvite, Company } from "@shared/schema";

type MemberWithUser = CompanyMember & {
  user: {
    id: number;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
};

type InviteWithInviter = CompanyUserInvite & {
  invitedByUser?: {
    id: number;
    name: string;
  };
};

export default function CompanyMembersPage() {
  const { user } = useMarketplace();
  const { toast } = useToast();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [deleteInviteId, setDeleteInviteId] = useState<number | null>(null);
  const [removeMemberId, setRemoveMemberId] = useState<number | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<number | null>(null);

  type ActiveCompanyResponse = CompanyMember & { company: Company };
  
  const { data: activeCompanyData } = useQuery<ActiveCompanyResponse>({
    queryKey: ["/api/active-company"],
    enabled: !!user && user.role === "company",
  });

  const companyId = activeCompanyData?.companyId;
  const activeCompany = activeCompanyData?.company;

  const { data: members, isLoading: loadingMembers } = useQuery<MemberWithUser[]>({
    queryKey: ["/api/companies", companyId, "members"],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/members`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao carregar membros");
      return res.json();
    },
    enabled: !!companyId,
  });

  const { data: invites, isLoading: loadingInvites } = useQuery<InviteWithInviter[]>({
    queryKey: ["/api/companies", companyId, "invites"],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/invites`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao carregar convites");
      return res.json();
    },
    enabled: !!companyId,
  });

  const currentMember = members?.find(m => m.userId === user?.id);
  const isOwner = currentMember?.role === "owner";
  const isAdmin = currentMember?.role === "admin" || isOwner;

  const sendInviteMutation = useMutation({
    mutationFn: async (data: { email: string; role: "admin" | "member" }) => {
      const res = await fetch(`/api/companies/${companyId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao enviar convite");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Convite enviado!",
        description: `Um convite foi enviado para ${inviteEmail}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "invites"] });
      setInviteModalOpen(false);
      setInviteEmail("");
      setInviteRole("member");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const cancelInviteMutation = useMutation({
    mutationFn: async (inviteId: number) => {
      const res = await fetch(`/api/companies/${companyId}/invites/${inviteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        try {
          const error = JSON.parse(text);
          throw new Error(error.error || "Erro ao cancelar convite");
        } catch {
          throw new Error("Erro ao cancelar convite");
        }
      }
      return null;
    },
    onSuccess: () => {
      toast({
        title: "Convite cancelado",
        description: "O convite foi removido com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "invites"] });
      setDeleteInviteId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(`/api/companies/${companyId}/members/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        try {
          const error = JSON.parse(text);
          throw new Error(error.error || "Erro ao remover membro");
        } catch {
          throw new Error("Erro ao remover membro");
        }
      }
      return null;
    },
    onSuccess: () => {
      toast({
        title: "Membro removido",
        description: "O membro foi removido da loja com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "members"] });
      setRemoveMemberId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast({
        title: "Erro",
        description: "O email é obrigatório",
        variant: "destructive",
      });
      return;
    }
    sendInviteMutation.mutate({ email: inviteEmail.trim(), role: inviteRole });
  };

  const copyInviteLink = async (invite: InviteWithInviter) => {
    const baseUrl = window.location.origin;
    const inviteLink = `${baseUrl}/invite/${invite.token}`;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedInviteId(invite.id);
      setTimeout(() => setCopiedInviteId(null), 2000);
      toast({
        title: "Link copiado!",
        description: "O link de convite foi copiado para a área de transferência",
      });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link",
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return (
          <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">
            <Crown className="w-3 h-3 mr-1" />
            Dono
          </Badge>
        );
      case "admin":
        return (
          <Badge variant="secondary">
            <Shield className="w-3 h-3 mr-1" />
            Administrador
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Users className="w-3 h-3 mr-1" />
            Membro
          </Badge>
        );
    }
  };

  const pendingInvites = invites?.filter(i => i.status === "pending") || [];

  if (!user || user.role !== "company") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Acesso não autorizado</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-heading">Equipe</h1>
            <p className="text-muted-foreground">
              Gerencie os membros e convites da sua loja
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => setInviteModalOpen(true)} data-testid="button-invite-member">
              <UserPlus className="w-4 h-4 mr-2" />
              Convidar membro
            </Button>
          )}
        </div>

        <Tabs defaultValue="members" className="w-full">
          <TabsList>
            <TabsTrigger value="members" className="gap-2">
              <Users className="w-4 h-4" />
              Membros ({members?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="invites" className="gap-2">
              <Mail className="w-4 h-4" />
              Convites pendentes ({pendingInvites.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Membros da equipe</CardTitle>
                <CardDescription>
                  Pessoas com acesso à loja {activeCompany?.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingMembers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : members?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum membro encontrado
                  </div>
                ) : (
                  <div className="space-y-4">
                    {members?.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 rounded-lg border"
                        data-testid={`member-row-${member.userId}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.user.avatarUrl || undefined} />
                            <AvatarFallback>
                              {member.user.name?.slice(0, 2).toUpperCase() || "??"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.user.name}</p>
                            <p className="text-sm text-muted-foreground">{member.user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getRoleBadge(member.role)}
                          {isOwner && member.role !== "owner" && member.userId !== user.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setRemoveMemberId(member.userId)}
                              data-testid={`button-remove-member-${member.userId}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invites" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Convites pendentes</CardTitle>
                <CardDescription>
                  Convites aguardando aceitação
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingInvites ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : pendingInvites.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum convite pendente</p>
                    {isAdmin && (
                      <Button
                        variant="link"
                        className="mt-2"
                        onClick={() => setInviteModalOpen(true)}
                      >
                        Convidar alguém
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingInvites.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between p-4 rounded-lg border"
                        data-testid={`invite-row-${invite.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{invite.email}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>
                                Expira em {new Date(invite.expiresAt).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getRoleBadge(invite.role)}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyInviteLink(invite)}
                            data-testid={`button-copy-invite-${invite.id}`}
                          >
                            {copiedInviteId === invite.id ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteInviteId(invite.id)}
                              data-testid={`button-cancel-invite-${invite.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Invite Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convidar membro</DialogTitle>
            <DialogDescription>
              Envie um convite por email para adicionar alguém à sua equipe.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendInvite}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={sendInviteMutation.isPending}
                  data-testid="input-invite-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(value: "admin" | "member") => setInviteRole(value)}
                  disabled={sendInviteMutation.isPending}
                >
                  <SelectTrigger data-testid="select-invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Membro</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {inviteRole === "admin"
                    ? "Administradores podem gerenciar campanhas e convidar outros membros."
                    : "Membros podem visualizar e gerenciar campanhas."}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteModalOpen(false)}
                disabled={sendInviteMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={sendInviteMutation.isPending || !inviteEmail.trim()}
                data-testid="button-send-invite"
              >
                {sendInviteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar convite"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel Invite Confirmation */}
      <AlertDialog open={deleteInviteId !== null} onOpenChange={() => setDeleteInviteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar convite?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O link de convite deixará de funcionar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter convite</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteInviteId && cancelInviteMutation.mutate(deleteInviteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelInviteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Cancelar convite"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Member Confirmation */}
      <AlertDialog open={removeMemberId !== null} onOpenChange={() => setRemoveMemberId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta pessoa perderá acesso à loja e todas as suas permissões serão revogadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter membro</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeMemberId && removeMemberMutation.mutate(removeMemberId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMemberMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removendo...
                </>
              ) : (
                "Remover membro"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
