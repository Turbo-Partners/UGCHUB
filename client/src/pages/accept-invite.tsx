import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMarketplace } from "@/lib/provider";
import { Store, Loader2, CheckCircle, XCircle, AlertTriangle, Mail } from "lucide-react";
import { Logo } from "@/components/layout";

type InviteInfo = {
  id: number;
  email: string;
  role: string;
  company: {
    id: number;
    name: string;
    logo?: string | null;
  };
  invitedBy: {
    name: string;
  };
  status: string;
  expiresAt: string;
};

export default function AcceptInvitePage() {
  const { user, updateUser } = useMarketplace();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/invite/:token");
  const token = params?.token;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { data: invite, isLoading, error } = useQuery<InviteInfo>({
    queryKey: ["/api/invites", token],
    queryFn: async () => {
      const res = await fetch(`/api/invites/${token}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Convite não encontrado");
      }
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (invite?.email) {
      setEmail(invite.email);
    }
  }, [invite?.email]);

  const acceptInviteMutation = useMutation({
    mutationFn: async (data: { name?: string; email?: string; password?: string }) => {
      const res = await fetch(`/api/team-invites/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao aceitar convite");
      }
      return res.json();
    },
    onSuccess: async (data) => {
      toast({
        title: "Convite aceito!",
        description: `Você agora faz parte da equipe ${invite?.company.name}`,
      });
      if (data.user) {
        updateUser(data.user);
      }
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAcceptAsExistingUser = () => {
    acceptInviteMutation.mutate({});
  };

  const handleAcceptAsNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Erro",
        description: "O nome é obrigatório",
        variant: "destructive",
      });
      return;
    }
    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não conferem",
        variant: "destructive",
      });
      return;
    }
    acceptInviteMutation.mutate({
      name: name.trim(),
      email,
      password,
    });
  };

  const isExpired = invite ? new Date(invite.expiresAt) < new Date() : false;
  const isAlreadyAccepted = invite?.status === "accepted";
  const isAlreadyCancelled = invite?.status === "cancelled";
  const userEmailMatches = user?.email?.toLowerCase() === invite?.email.toLowerCase();
  const isExistingUserInvite = user && userEmailMatches;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Carregando convite...</p>
        </div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Convite inválido</CardTitle>
            <CardDescription>
              {(error as Error)?.message || "Este convite não existe ou já foi removido."}
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button variant="outline" onClick={() => navigate("/")}>
              Voltar ao início
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isAlreadyAccepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <CardTitle>Convite já aceito</CardTitle>
            <CardDescription>
              Este convite já foi aceito anteriormente.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={() => navigate(user ? "/dashboard" : "/auth")}>
              {user ? "Ir para o painel" : "Fazer login"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isAlreadyCancelled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Convite cancelado</CardTitle>
            <CardDescription>
              Este convite foi cancelado pelo remetente.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button variant="outline" onClick={() => navigate("/")}>
              Voltar ao início
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <CardTitle>Convite expirado</CardTitle>
            <CardDescription>
              Este convite expirou em {new Date(invite.expiresAt).toLocaleDateString("pt-BR")}.
              Entre em contato com {invite.invitedBy.name} para solicitar um novo convite.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button variant="outline" onClick={() => navigate("/")}>
              Voltar ao início
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (user && !userEmailMatches) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <CardTitle>Email diferente</CardTitle>
            <CardDescription>
              Este convite foi enviado para <strong>{invite.email}</strong>, mas você está logado como <strong>{user.email}</strong>.
              <br /><br />
              Por favor, saia da sua conta atual e faça login com o email correto, ou use um navegador anônimo.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center gap-2">
            <Button variant="outline" onClick={() => navigate("/")}>
              Voltar
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Logo />
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              {invite.company.logo ? (
                <img 
                  src={invite.company.logo} 
                  alt={invite.company.name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <Store className="h-8 w-8 text-primary" />
              )}
            </div>
            <CardTitle>Você foi convidado!</CardTitle>
            <CardDescription>
              <strong>{invite.invitedBy.name}</strong> convidou você para fazer parte da equipe <strong>{invite.company.name}</strong> como <strong>{invite.role === "admin" ? "Administrador" : "Membro"}</strong>.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isExistingUserInvite ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleAcceptAsExistingUser}
                  disabled={acceptInviteMutation.isPending}
                  data-testid="button-accept-invite"
                >
                  {acceptInviteMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Aceitando...
                    </>
                  ) : (
                    "Aceitar convite"
                  )}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleAcceptAsNewUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Seu nome</Label>
                  <Input
                    id="name"
                    placeholder="Como você quer ser chamado"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={acceptInviteMutation.isPending}
                    data-testid="input-invite-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted"
                    data-testid="input-invite-email"
                  />
                  <p className="text-xs text-muted-foreground">
                    Este é o email para o qual o convite foi enviado
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Crie uma senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={acceptInviteMutation.isPending}
                    data-testid="input-invite-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirme a senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Digite a senha novamente"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={acceptInviteMutation.isPending}
                    data-testid="input-invite-confirm-password"
                  />
                </div>
                <Button 
                  type="submit"
                  className="w-full"
                  disabled={acceptInviteMutation.isPending}
                  data-testid="button-accept-invite-create"
                >
                  {acceptInviteMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    "Criar conta e aceitar convite"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
          
          <CardFooter className="flex-col gap-2 text-center text-sm text-muted-foreground">
            <p>
              Ao aceitar este convite, você terá acesso às campanhas e recursos da loja {invite.company.name}.
            </p>
            {!user && (
              <p>
                Já tem uma conta?{" "}
                <Button 
                  variant="link" 
                  className="p-0 h-auto"
                  onClick={() => navigate("/auth")}
                >
                  Faça login
                </Button>
              </p>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
