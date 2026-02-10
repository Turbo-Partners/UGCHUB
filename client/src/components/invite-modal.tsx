import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Building2, CheckCircle, XCircle, Loader2, ExternalLink, X } from 'lucide-react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface InviteData {
  type: 'campaign_invite';
  title: string;
  message: string;
  actionUrl: string;
  inviteId: number;
  campaignId: number;
  campaignTitle: string;
  companyName: string;
}

interface InviteModalProps {
  invite: InviteData | null;
  onClose: () => void;
}

export function InviteModal({ invite, onClose }: InviteModalProps) {
  const [_, setLocation] = useLocation();
  const [processingAction, setProcessingAction] = useState<'accept' | 'decline' | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Sync visibility with invite prop
  useEffect(() => {
    if (invite) {
      setIsVisible(true);
    }
  }, [invite]);

  // Handle close with animation
  const handleClose = useCallback(() => {
    setIsVisible(false);
    // Small delay to allow animation before clearing invite
    setTimeout(() => {
      onClose();
    }, 150);
  }, [onClose]);

  const acceptInviteMutation = useMutation({
    mutationFn: async (inviteId: number) => {
      setProcessingAction('accept');
      const res = await fetch(`/api/invites/${inviteId}/accept`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to accept invite');
      }
      return res.json();
    },
    onSuccess: async (data) => {
      // Add application to cache immediately for instant UI update
      if (data.application) {
        queryClient.setQueryData(['/api/applications'], (old: any[] | undefined) => {
          const current = old ?? [];
          const exists = current.some((app: any) => app.id === data.application.id);
          return exists ? current : [...current, data.application];
        });
        queryClient.setQueryData(['/api/applications/active'], (old: any[] | undefined) => {
          const current = old ?? [];
          const exists = current.some((app: any) => app.id === data.application.id);
          return exists ? current : [...current, data.application];
        });
      }
      // Invalidate and refetch to ensure complete sync
      await queryClient.invalidateQueries({ queryKey: ['/api/applications'], exact: true, refetchType: 'all' });
      await queryClient.invalidateQueries({ queryKey: ['/api/applications/active'], exact: true, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['/api/invites'] });
      queryClient.invalidateQueries({ queryKey: ['/api/invites/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/invites/count'] });
      setProcessingAction(null);
      toast.success('Convite aceito!', {
        description: 'Você agora faz parte desta campanha.',
      });
      handleClose();
      setLocation('/active-campaigns');
    },
    onError: (error: Error) => {
      setProcessingAction(null);
      toast.error('Erro ao aceitar convite', {
        description: error.message,
      });
    },
  });

  const declineInviteMutation = useMutation({
    mutationFn: async (inviteId: number) => {
      setProcessingAction('decline');
      const res = await fetch(`/api/invites/${inviteId}/decline`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to decline invite');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invites'] });
      queryClient.invalidateQueries({ queryKey: ['/api/invites/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/invites/count'] });
      setProcessingAction(null);
      toast.success('Convite recusado', {
        description: 'O convite foi recusado.',
      });
      handleClose();
    },
    onError: (error: Error) => {
      setProcessingAction(null);
      toast.error('Erro ao recusar convite', {
        description: error.message,
      });
    },
  });

  // Don't render if no invite
  if (!invite) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className={cn(
          "fixed inset-0 z-50 bg-black/50 transition-opacity duration-200",
          isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={handleClose}
        aria-hidden="true"
      />
      
      {/* Modal Content */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-modal-title"
        className={cn(
          "fixed left-[50%] top-[50%] z-[60] w-full max-w-md translate-x-[-50%] translate-y-[-50%] border bg-background p-6 shadow-lg sm:rounded-lg transition-all duration-200",
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex flex-col space-y-1.5 text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h2 id="invite-modal-title" className="text-xl font-semibold leading-none tracking-tight">
            Novo Convite de Campanha!
          </h2>
          <p className="text-base text-muted-foreground">
            {invite.message}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {invite.campaignTitle}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{invite.companyName}</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Aceite o convite para participar desta campanha ou veja mais detalhes antes de decidir.
          </p>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => declineInviteMutation.mutate(invite.inviteId)}
            disabled={processingAction !== null}
            data-testid="modal-decline-invite"
          >
            {processingAction === 'decline' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4 mr-2" />
            )}
            Recusar
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              handleClose();
              setLocation('/creator/invites');
            }}
            disabled={processingAction !== null}
            data-testid="modal-view-details"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver Detalhes
          </Button>
          <Button
            className="flex-1"
            onClick={() => acceptInviteMutation.mutate(invite.inviteId)}
            disabled={processingAction !== null}
            data-testid="modal-accept-invite"
          >
            {processingAction === 'accept' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Aceitar
          </Button>
        </div>
        
        {/* Close button */}
        <button 
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}
