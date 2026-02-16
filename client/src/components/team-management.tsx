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
import { useToast } from "@/hooks/use-toast";
import { useMarketplace } from "@/lib/provider";
import { Users, UserPlus, Mail, Clock, Trash2, Shield, Crown, Loader2, Copy, Check, ChevronDown, Eye, ArrowRightLeft } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { CompanyMember, CompanyUserInvite, Company } from "@shared/schema";

type MemberWithUser = CompanyMember & {
  user: {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
  };
};

type InviteWithInviter = CompanyUserInvite & {
  invitedByUser?: {
    id: number;
    name: string;
  };
};

export function TeamManagement() {
  const { user } = useMarketplace();
  const { toast } = useToast();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member" | "reader">("member");
  const [deleteInviteId, setDeleteInviteId] = useState<number | null>(null);
  const [removeMemberId, setRemoveMemberId] = useState<number | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<number | null>(null);
  const [transferOwnershipId, setTransferOwnershipId] = useState<number | null>(null);

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
    mutationFn: async (data: { email: string; role: "admin" | "member" | "reader" }) => {
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

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: "owner" | "admin" | "member" | "reader" }) => {
      const res = await fetch(`/api/companies/${companyId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const text = await res.text();
        try {
          const error = JSON.parse(text);
          throw new Error(error.error || "Erro ao atualizar função");
        } catch {
          throw new Error("Erro ao atualizar função");
        }
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Função atualizada",
        description: "A função do membro foi atualizada com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "members"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const transferOwnershipMutation = useMutation({
    mutationFn: async (targetUserId: number) => {
      const res = await fetch(`/api/companies/${companyId}/transfer-ownership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ targetUserId }),
      });
      if (!res.ok) {
        const text = await res.text();
        try {
          const error = JSON.parse(text);
          throw new Error(error.error || "Erro ao transferir propriedade");
        } catch {
          throw new Error("Erro ao transferir propriedade");
        }
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Propriedade transferida",
        description: "Você agora é Administrador e o membro selecionado é o novo Dono",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "members"] });
      setTransferOwnershipId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      setTransferOwnershipId(null);
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
      case "reader":
        return (
          <Badge variant="outline" className="border-blue-300 text-blue-600">
            <Eye className="w-3 h-3 mr-1" />
            Leitor
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

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Gerenciar Equipe</h2>
            <p className="text-muted-foreground text-sm">
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
                        <AvatarImage src={member.user.avatar || undefined} />
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
                      {isAdmin && member.role !== "owner" && member.userId !== user?.id ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-auto p-0 hover:bg-transparent"
                              data-testid={`dropdown-role-${member.userId}`}
                            >
                              <div className="flex items-center gap-1">
                                {getRoleBadge(member.role)}
                                <ChevronDown className="w-3 h-3 text-muted-foreground" />
                              </div>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {isOwner && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => updateRoleMutation.mutate({ userId: member.userId, role: "owner" })}
                                  className=""
                                  data-testid={`role-owner-${member.userId}`}
                                >
                                  <Crown className="w-4 h-4 mr-2" />
                                  Dono (Co-proprietário)
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => updateRoleMutation.mutate({ userId: member.userId, role: "admin" })}
                                  className={member.role === "admin" ? "bg-accent" : ""}
                                  data-testid={`role-admin-${member.userId}`}
                                >
                                  <Shield className="w-4 h-4 mr-2" />
                                  Administrador
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem
                              onClick={() => updateRoleMutation.mutate({ userId: member.userId, role: "member" })}
                              className={member.role === "member" ? "bg-accent" : ""}
                              data-testid={`role-member-${member.userId}`}
                            >
                              <Users className="w-4 h-4 mr-2" />
                              Membro
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateRoleMutation.mutate({ userId: member.userId, role: "reader" })}
                              className={member.role === "reader" ? "bg-accent" : ""}
                              data-testid={`role-reader-${member.userId}`}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Leitor
                            </DropdownMenuItem>
                            {isOwner && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setTransferOwnershipId(member.userId)}
                                  className="text-orange-600"
                                  data-testid={`transfer-ownership-${member.userId}`}
                                >
                                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                                  Transferir propriedade
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        getRoleBadge(member.role)
                      )}
                      {(() => {
                        const ownerCount = members?.filter(m => m.role === "owner").length || 0;
                        const canRemoveOwner = isOwner && member.role === "owner" && ownerCount > 1 && member.userId !== user?.id;
                        const canRemoveNonOwner = ((isOwner && member.role !== "owner") || (isAdmin && !isOwner && member.role !== "owner" && member.role !== "admin")) && member.userId !== user?.id;

                        if (canRemoveOwner || canRemoveNonOwner) {
                          return (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setRemoveMemberId(member.userId)}
                              data-testid={`button-remove-member-${member.userId}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                ))}

                {/* Pending Invites Section */}
                {pendingInvites.length > 0 && (
                  <>
                    <div className="flex items-center gap-3 pt-4">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        Convites Pendentes ({pendingInvites.length})
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    {pendingInvites.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-dashed border-yellow-500/40 bg-yellow-500/5"
                        data-testid={`invite-row-${invite.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                            <Mail className="w-4 h-4 text-yellow-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{invite.email}</p>
                              <Badge variant="outline" className="text-[10px] text-yellow-600 border-yellow-500/40">
                                Pendente
                              </Badge>
                            </div>
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
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
                  onValueChange={(value: "admin" | "member" | "reader") => setInviteRole(value)}
                  disabled={sendInviteMutation.isPending}
                >
                  <SelectTrigger data-testid="select-invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reader">Leitor</SelectItem>
                    <SelectItem value="member">Membro</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {inviteRole === "admin"
                    ? "Administradores podem gerenciar campanhas e convidar outros membros."
                    : inviteRole === "reader"
                    ? "Leitores podem apenas visualizar informações da loja."
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

      <AlertDialog open={transferOwnershipId !== null} onOpenChange={() => setTransferOwnershipId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transferir propriedade?</AlertDialogTitle>
            <AlertDialogDescription>
              Você será rebaixado para Administrador e esta pessoa se tornará o único Dono da loja. 
              Esta ação pode ser desfeita pelo novo proprietário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => transferOwnershipId && transferOwnershipMutation.mutate(transferOwnershipId)}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              {transferOwnershipMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Transferindo...
                </>
              ) : (
                "Transferir propriedade"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
