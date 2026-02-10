import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle, RefreshCw, Home } from "lucide-react";

const errorMessages: Record<string, { title: string; description: string }> = {
  not_found: {
    title: "Convite não encontrado",
    description: "Este link de convite não existe ou foi removido.",
  },
  expired: {
    title: "Convite expirado",
    description: "Este convite expirou. Solicite um novo link para a marca.",
  },
  used: {
    title: "Convite já utilizado",
    description: "Este convite já foi usado. Cada link só pode ser usado uma vez.",
  },
  denied: {
    title: "Autorização negada",
    description: "Você cancelou a autorização no Instagram. Tente novamente se quiser.",
  },
  no_instagram: {
    title: "Conta Instagram não encontrada",
    description: "Não encontramos uma conta Instagram Business conectada. Verifique se sua conta é comercial.",
  },
  invalid: {
    title: "Erro de autenticação",
    description: "Houve um problema com a autenticação. Tente novamente.",
  },
  invalid_state: {
    title: "Sessão inválida",
    description: "A sessão de autenticação expirou. Por favor, clique no link de convite novamente.",
  },
  csrf_error: {
    title: "Erro de segurança",
    description: "Detectamos um problema de segurança. Por favor, clique no link de convite original novamente.",
  },
  token_error: {
    title: "Erro ao conectar",
    description: "Não foi possível conectar com o Instagram. Tente novamente.",
  },
  internal: {
    title: "Erro interno",
    description: "Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.",
  },
};

export default function PartnershipError() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const reason = params.get("reason") || "internal";
  
  const error = errorMessages[reason] || errorMessages.internal;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-4">
      <Card className="max-w-lg w-full shadow-xl">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="h-20 w-20 rounded-full mx-auto bg-red-100 flex items-center justify-center">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {error.title}
            </h1>
            <p className="text-muted-foreground">
              {error.description}
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <Button 
              className="w-full"
              onClick={() => window.history.back()}
              data-testid="button-try-again"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setLocation("/")}
              data-testid="button-go-home"
            >
              <Home className="h-4 w-4 mr-2" />
              Ir para o Início
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Se o problema persistir, entre em contato com a marca que enviou o convite.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
