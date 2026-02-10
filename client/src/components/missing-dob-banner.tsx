import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export function MissingDateOfBirthBanner() {
  const [, navigate] = useLocation();

  return (
    <Alert className="rounded-none border-x-0 border-t-0 bg-yellow-50 border-yellow-200" data-testid="banner-missing-dob">
      <AlertCircle className="h-5 w-5 text-yellow-600" />
      <AlertTitle className="text-yellow-900 font-semibold">
        Complete seu perfil
      </AlertTitle>
      <AlertDescription className="text-yellow-800 flex items-center justify-between gap-4">
        <span>
          Por favor, atualize seu perfil com sua data de nascimento para continuar usando todas as funcionalidades da plataforma.
        </span>
        <Button 
          onClick={() => navigate('/profile')}
          variant="default"
          size="sm"
          className="bg-yellow-600 hover:bg-yellow-700 text-white shrink-0"
          data-testid="button-go-to-profile"
        >
          Atualizar Perfil
        </Button>
      </AlertDescription>
    </Alert>
  );
}
