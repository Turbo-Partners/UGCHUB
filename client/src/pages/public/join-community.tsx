import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, CheckCircle, XCircle, AlertCircle, LogIn, UserPlus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useMarketplace } from "@/lib/provider";

interface InviteDetails {
  id: number;
  companyName: string;
  companyLogo: string | null;
  invitedName: string | null;
  invitedEmail: string | null;
  customMessage: string | null;
}

export default function JoinCommunityPage() {
  const { token } = useParams<{ token: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useMarketplace();
  const [termsAccepted, setTermsAccepted] = useState(false);

  const { data: invite, isLoading, error } = useQuery<InviteDetails>({
    queryKey: ["/api/join", token],
    queryFn: async () => {
      const res = await fetch(`/api/join/${token}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao carregar convite");
      }
      return res.json();
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/join/${token}/accept`, {
        termsAccepted: termsAccepted,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao aceitar convite");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Bem-vindo(a) à comunidade!", 
        description: "Você agora faz parte da comunidade da marca." 
      });
      navigate("/minhas-comunidades");
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle>Convite Indisponível</CardTitle>
            <CardDescription>
              {(error as Error).message}
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button variant="outline" onClick={() => navigate("/")} data-testid="button-go-home">
              Voltar para a página inicial
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!invite) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
      <Card className="max-w-lg w-full" data-testid="join-community-card">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={invite.companyLogo || undefined} />
              <AvatarFallback className="text-xl">
                {invite.companyName?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-2xl">
            Junte-se à comunidade
          </CardTitle>
          <CardDescription className="text-lg">
            <span className="font-semibold text-foreground">{invite.companyName}</span> está convidando você para fazer parte da sua comunidade de criadores.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {invite.customMessage && (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm italic">"{invite.customMessage}"</p>
            </div>
          )}

          <div className="bg-primary/5 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Benefícios de fazer parte
            </h3>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                Acesso a campanhas exclusivas da comunidade
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                Cupom de desconto exclusivo
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                Sistema de pontos e níveis com recompensas
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                Relacionamento direto com a marca
              </li>
            </ul>
          </div>

          {user ? (
            user.role === "creator" ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="terms" 
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                    data-testid="checkbox-terms"
                  />
                  <Label htmlFor="terms" className="text-sm leading-normal">
                    Aceito os{" "}
                    <a href="/termos-uso" target="_blank" className="text-primary underline">
                      Termos de Uso
                    </a>{" "}
                    e a{" "}
                    <a href="/politica-privacidade" target="_blank" className="text-primary underline">
                      Política de Privacidade
                    </a>{" "}
                    da comunidade.
                  </Label>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => acceptMutation.mutate()}
                  disabled={!termsAccepted || acceptMutation.isPending}
                  data-testid="button-accept-invite"
                >
                  {acceptMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Aceitar Convite e Entrar
                </Button>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Conta de Empresa</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Você está logado com uma conta de empresa. Apenas criadores podem aceitar convites de comunidade.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-3"
                      onClick={() => navigate("/auth")}
                      data-testid="button-switch-account"
                    >
                      Entrar com outra conta
                    </Button>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-3">
              <p className="text-center text-sm text-muted-foreground">
                Faça login ou crie uma conta para aceitar o convite
              </p>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => navigate(`/auth?redirect=/join/${token}`)}
                  data-testid="button-login"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Entrar
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => navigate(`/auth?tab=register&redirect=/join/${token}`)}
                  data-testid="button-register"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar Conta
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
