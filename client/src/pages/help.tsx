import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, HelpCircle, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { useMarketplace } from '@/lib/provider';
import { startCreatorTour } from '@/components/creator-onboarding-tour';

export default function HelpPage() {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();
  const { user } = useMarketplace();

  const reportMutation = useMutation({
    mutationFn: async (data: { subject: string; description: string }) => {
      const res = await fetch('/api/problem-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to submit report');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Problema relatado com sucesso!', {
        description: 'Nossa equipe irá analisar e responder em breve.',
      });
      setSubject('');
      setDescription('');
    },
    onError: () => {
      toast.error('Erro ao enviar relato', {
        description: 'Por favor, tente novamente.',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }
    reportMutation.mutate({ subject, description });
  };

  const handleRestartTour = () => {
    startCreatorTour();
    toast.success('Tutorial reiniciado!', {
      description: 'O tutorial está começando agora.',
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-100 rounded-lg">
          <HelpCircle className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-heading">Central de Ajuda</h1>
          <p className="text-muted-foreground">
            Relate problemas e receba suporte da nossa equipe
          </p>
        </div>
      </div>

      {user?.role === 'creator' && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <GraduationCap className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-1">Tutorial Interativo</h3>
                <p className="text-sm text-green-700 mb-3">
                  Quer rever como usar a plataforma? Reinicie o tutorial para aprender novamente sobre as principais funcionalidades.
                </p>
                <Button
                  onClick={handleRestartTour}
                  variant="outline"
                  className="bg-white border-green-300 text-green-700 hover:bg-green-100 hover:text-green-800"
                  data-testid="button-restart-tour"
                >
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Reiniciar Tutorial
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Relatar Problema
          </CardTitle>
          <CardDescription>
            Descreva o problema que você está enfrentando. Nossa equipe irá analisar e
            retornar em breve.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject" data-testid="label-subject">
                Assunto
              </Label>
              <Input
                id="subject"
                data-testid="input-subject"
                placeholder="Resumo do problema em poucas palavras"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" data-testid="label-description">
                Descrição detalhada
              </Label>
              <Textarea
                id="description"
                data-testid="textarea-description"
                placeholder="Descreva o problema com o máximo de detalhes possível..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={8}
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                data-testid="button-clear"
                onClick={() => {
                  setSubject('');
                  setDescription('');
                }}
              >
                Limpar
              </Button>
              <Button
                type="submit"
                data-testid="button-submit"
                disabled={reportMutation.isPending}
              >
                {reportMutation.isPending ? (
                  <>Enviando...</>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Enviar Relato
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-indigo-200 bg-indigo-50/50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="text-indigo-600 mt-1">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-indigo-900">
                Dicas para um relato eficiente
              </p>
              <ul className="text-sm text-indigo-700 space-y-1 list-disc list-inside">
                <li>Seja específico sobre o problema</li>
                <li>Inclua os passos para reproduzir o erro</li>
                <li>Mencione em qual página ou funcionalidade ocorreu</li>
                <li>Se possível, descreva o comportamento esperado</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
