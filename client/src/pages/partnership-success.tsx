import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Instagram, ExternalLink } from "lucide-react";

export default function PartnershipSuccess() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const username = params.get("username");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4">
      <Card className="max-w-lg w-full shadow-xl">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="h-20 w-20 rounded-full mx-auto bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Autorização Concluída!
            </h1>
            <p className="text-muted-foreground">
              Sua conta foi conectada com sucesso para Partnership Ads.
            </p>
          </div>

          {username && (
            <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center gap-3">
              <Instagram className="h-6 w-6 text-pink-500" />
              <span className="font-medium">@{username}</span>
            </div>
          )}

          <div className="bg-blue-50 rounded-lg p-4 text-left space-y-2">
            <h3 className="font-semibold text-blue-900">O que acontece agora?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• A marca pode usar seu conteúdo em anúncios</li>
              <li>• Seu @ aparecerá nos anúncios junto com a marca</li>
              <li>• Você pode revogar a permissão a qualquer momento</li>
            </ul>
          </div>

          <div className="space-y-3 pt-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.open("https://www.instagram.com/accounts/manage_access/", "_blank")}
              data-testid="button-manage-permissions"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Gerenciar Permissões no Instagram
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => setLocation("/")}
              data-testid="button-go-home"
            >
              Ir para o CreatorConnect
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Você pode fechar esta página com segurança.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
