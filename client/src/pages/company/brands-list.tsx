import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building2, ChevronRight, Plus, Users, Megaphone, Star } from 'lucide-react';
import { setCurrentBrandId } from '@/lib/brand-context';

interface BrandStats {
  companyId: number;
  company: {
    id: number;
    name: string;
    logo: string | null;
  };
  role: string;
  memberCount?: number;
  campaignCount?: number;
}

export default function CompanyBrandsList() {
  const [, setLocation] = useLocation();

  const { data: companies = [], isLoading } = useQuery<BrandStats[]>({
    queryKey: ['/api/companies'],
  });

  const handleSelectBrand = (brandId: number) => {
    setCurrentBrandId(brandId);
    setLocation(`/company/brand/${brandId}/overview`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight" data-testid="text-page-title">
            Suas Marcas
          </h1>
          <p className="text-muted-foreground">
            Selecione uma marca para gerenciar
          </p>
        </div>
        <Button data-testid="button-create-brand">
          <Plus className="h-4 w-4 mr-2" />
          Nova Marca
        </Button>
      </div>

      {companies.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma marca cadastrada</h3>
            <p className="text-muted-foreground max-w-sm text-center mb-6">
              Crie sua primeira marca para começar a gerenciar campanhas e comunidades
            </p>
            <Button data-testid="button-create-first-brand">
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Marca
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((membership) => (
            <Card 
              key={membership.companyId}
              className="hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => handleSelectBrand(membership.companyId)}
              data-testid={`brand-card-${membership.companyId}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14 ring-2 ring-primary/10">
                    {membership.company.logo ? (
                      <AvatarImage src={membership.company.logo} alt={membership.company.name} />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground text-lg font-semibold">
                      {membership.company.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                      {membership.company.name}
                    </h3>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {membership.role === 'owner' ? 'Proprietário' : 
                       membership.role === 'admin' ? 'Administrador' : 'Membro'}
                    </Badge>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>

                <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span>{membership.memberCount || 0} membros</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Megaphone className="h-4 w-4" />
                    <span>{membership.campaignCount || 0} campanhas</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
