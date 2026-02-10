import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Megaphone, Calendar, DollarSign, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { Campaign } from '@shared/schema';

interface InviteToCampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorId: number;
  creatorName: string;
}

export function InviteToCampaignModal({ 
  open, 
  onOpenChange, 
  creatorId, 
  creatorName 
}: InviteToCampaignModalProps) {
  const queryClient = useQueryClient();
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedCampaignId(null);
    }
    onOpenChange(newOpen);
  };

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ['/api/campaigns'],
    queryFn: async () => {
      const res = await fetch('/api/campaigns', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch campaigns');
      return res.json();
    },
    enabled: open,
  });

  const activeCampaigns = campaigns.filter(c => c.status === 'open');

  const sendInviteMutation = useMutation({
    mutationFn: async (campaignId: number) => {
      const res = await fetch(`/api/campaigns/${campaignId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ creatorId }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to send invite');
      }
      return res.json();
    },
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/invites`] });
      toast.success(`Convite enviado para ${creatorName}!`);
      onOpenChange(false);
      setSelectedCampaignId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao enviar convite');
    },
  });

  const handleInvite = () => {
    if (selectedCampaignId) {
      sendInviteMutation.mutate(selectedCampaignId);
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value) || 0;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return 'Sem prazo';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Convidar para Campanha</DialogTitle>
          <DialogDescription>
            Selecione uma campanha para convidar {creatorName}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : activeCampaigns.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Você não tem campanhas ativas.</p>
            <p className="text-sm mt-2">Crie uma campanha primeiro para poder convidar criadores.</p>
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2 pr-4">
                {activeCampaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    onClick={() => setSelectedCampaignId(campaign.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedCampaignId === campaign.id 
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                    data-testid={`campaign-option-${campaign.id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">{campaign.title}</h4>
                          {selectedCampaignId === campaign.id && (
                            <Check className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {campaign.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(campaign.budget)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(campaign.deadline)}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {campaign.visibility === 'private' ? 'Privada' : 'Pública'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => handleOpenChange(false)}
                data-testid="button-cancel-invite"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleInvite}
                disabled={!selectedCampaignId || sendInviteMutation.isPending}
                data-testid="button-confirm-invite"
              >
                {sendInviteMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Convite'
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
