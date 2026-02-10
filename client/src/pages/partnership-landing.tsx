import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, Instagram, Shield, Clock, Building2 } from "lucide-react";

interface InvitationData {
  invitation: {
    token: string;
    expiresAt: string;
  };
  company: {
    id: number;
    name: string;
    logo: string | null;
  };
}

export default function PartnershipLanding() {
  const { token } = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<InvitationData | null>(null);
  const [authorizing, setAuthorizing] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Link de convite inválido");
      setLoading(false);
      return;
    }

    fetch(`/api/partnership/invite/${token}`)
      .then(res => {
        if (!res.ok) {
          if (res.status === 404) throw new Error("Convite não encontrado");
          if (res.status === 410) throw new Error("Convite expirado ou já utilizado");
          throw new Error("Erro ao carregar convite");
        }
        return res.json();
      })
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  const handleAuthorize = () => {
    setAuthorizing(true);
    window.location.href = `/api/partnership/auth/${token}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando convite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Ops! Algo deu errado</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button variant="outline" onClick={() => setLocation("/")}>
              Voltar para o início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const expiresAt = new Date(data.invitation.expiresAt);
  const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4">
      <Card className="max-w-lg w-full shadow-xl">
        <CardHeader className="text-center pb-2">
          {data.company.logo ? (
            <img 
              src={data.company.logo} 
              alt={data.company.name}
              className="h-20 w-20 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-lg"
            />
          ) : (
            <div className="h-20 w-20 rounded-full mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Building2 className="h-10 w-10 text-white" />
            </div>
          )}
          <CardTitle className="text-2xl">{data.company.name}</CardTitle>
          <CardDescription className="text-base">
            Quer você como parceiro para Partnership Ads
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-purple-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-purple-900">O que são Partnership Ads?</h3>
            <p className="text-sm text-purple-800">
              Partnership Ads permitem que marcas veiculem anúncios usando seu conteúdo do Instagram, 
              com seu @ aparecendo no anúncio. Você mantém o controle e pode revogar a permissão a qualquer momento.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Instagram className="h-5 w-5 text-pink-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Conecte seu Instagram</p>
                <p className="text-xs text-muted-foreground">
                  Você será redirecionado para o Instagram para autorizar
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Seguro e controlado</p>
                <p className="text-xs text-muted-foreground">
                  Revogue a permissão quando quiser nas configurações do Instagram
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Convite expira em {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}</p>
                <p className="text-xs text-muted-foreground">
                  Autorize antes de {expiresAt.toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          <Button 
            className="w-full h-12 text-base bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            onClick={handleAuthorize}
            disabled={authorizing}
            data-testid="button-authorize-partnership"
          >
            {authorizing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Redirecionando...
              </>
            ) : (
              <>
                <Instagram className="h-5 w-5 mr-2" />
                Autorizar com Instagram
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Ao clicar, você concorda em permitir que {data.company.name} use seu conteúdo em anúncios pagos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
