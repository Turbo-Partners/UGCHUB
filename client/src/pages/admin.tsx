import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Lock, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { ProblemReport } from '@shared/schema';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery<ProblemReport[]>({
    queryKey: ['/api/problem-reports'],
    queryFn: async () => {
      const res = await fetch('/api/problem-reports', {
        headers: {
          'x-admin-password': password,
        },
        credentials: 'include',
      });
      if (!res.ok) {
        if (res.status === 403) {
          setIsAuthenticated(false);
          throw new Error('Invalid password');
        }
        throw new Error('Failed to fetch reports');
      }
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'open' | 'resolved' }) => {
      const res = await fetch(`/api/problem-reports/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/problem-reports'] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar status');
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      toast.error('Digite a senha');
      return;
    }
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setPassword('');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md border-none shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
              <Lock className="h-6 w-6 text-indigo-600" />
            </div>
            <CardTitle className="text-2xl">Acesso Administrativo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" data-testid="label-password">
                  Senha de Administrador
                </Label>
                <Input
                  id="password"
                  type="password"
                  data-testid="input-password"
                  placeholder="Digite a senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" data-testid="button-login">
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading">Painel Administrativo</h1>
          <p className="text-muted-foreground">
            Gerenciamento de relatos de problemas
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
          Sair
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Carregando relatos...</div>
        </div>
      ) : reports && reports.length === 0 ? (
        <Card className="border-none shadow-lg">
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-1">Nenhum relato encontrado</h3>
            <p className="text-muted-foreground">
              Não há problemas relatados no momento
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports?.map((report) => (
            <Card
              key={report.id}
              className="border-none shadow-lg"
              data-testid={`card-report-${report.id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg" data-testid={`text-subject-${report.id}`}>
                        {report.subject}
                      </CardTitle>
                      <Badge
                        variant={report.status === 'resolved' ? 'default' : 'secondary'}
                        data-testid={`badge-status-${report.id}`}
                      >
                        {report.status === 'resolved' ? (
                          <>
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Resolvido
                          </>
                        ) : (
                          <>
                            <Clock className="mr-1 h-3 w-3" />
                            Aberto
                          </>
                        )}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Usuário ID: {report.userId} •{' '}
                      {format(new Date(report.createdAt), "dd/MM/yyyy 'às' HH:mm")}
                    </div>
                  </div>
                  <Button
                    variant={report.status === 'resolved' ? 'outline' : 'default'}
                    size="sm"
                    onClick={() =>
                      updateStatusMutation.mutate({
                        id: report.id,
                        status: report.status === 'resolved' ? 'open' : 'resolved',
                      })
                    }
                    disabled={updateStatusMutation.isPending}
                    data-testid={`button-toggle-status-${report.id}`}
                  >
                    {report.status === 'resolved' ? 'Reabrir' : 'Marcar como Resolvido'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm whitespace-pre-wrap" data-testid={`text-description-${report.id}`}>
                    {report.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
