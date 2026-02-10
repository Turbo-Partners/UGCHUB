import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Share2, Copy, Check, Twitter, Linkedin } from 'lucide-react';
import { toast } from 'sonner';
import type { Campaign } from '@shared/schema';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

interface ShareCampaignButtonProps {
  campaign: Campaign;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export function ShareCampaignButton({ 
  campaign, 
  variant = 'outline',
  size = 'default',
  showLabel = true 
}: ShareCampaignButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const getCampaignUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/campaign/${campaign.id}`;
  };

  const getShareText = () => {
    return `Oportunidade de parceria! ${campaign.title} - Orçamento: ${campaign.budget}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getCampaignUrl());
      setIsCopied(true);
      toast.success('Link copiado!', {
        description: 'O link da campanha foi copiado para a área de transferência.'
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar', {
        description: 'Não foi possível copiar o link. Tente novamente.'
      });
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`${getShareText()}\n\n${getCampaignUrl()}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(getShareText());
    const url = encodeURIComponent(getCampaignUrl());
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(getCampaignUrl());
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} data-testid="button-share-campaign">
          <Share2 className="h-4 w-4" />
          {showLabel && <span className="ml-2">Compartilhar</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleCopyLink} data-testid="share-copy-link">
          {isCopied ? (
            <Check className="h-4 w-4 mr-2 text-green-500" />
          ) : (
            <Copy className="h-4 w-4 mr-2" />
          )}
          Copiar link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareWhatsApp} data-testid="share-whatsapp">
          <WhatsAppIcon className="h-4 w-4 mr-2" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareTwitter} data-testid="share-twitter">
          <Twitter className="h-4 w-4 mr-2" />
          Twitter / X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareLinkedIn} data-testid="share-linkedin">
          <Linkedin className="h-4 w-4 mr-2" />
          LinkedIn
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ShareCampaignModalContentProps {
  campaign: Campaign;
  onClose?: () => void;
}

export function ShareCampaignModalContent({ campaign, onClose }: ShareCampaignModalContentProps) {
  const [isCopied, setIsCopied] = useState(false);

  const getCampaignUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/campaign/${campaign.id}`;
  };

  const getShareText = () => {
    return `Oportunidade de parceria! ${campaign.title} - Orçamento: ${campaign.budget}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getCampaignUrl());
      setIsCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar');
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`${getShareText()}\n\n${getCampaignUrl()}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(getShareText());
    const url = encodeURIComponent(getCampaignUrl());
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(getCampaignUrl());
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Compartilhe sua campanha nas redes sociais para alcançar mais criadores.
      </p>
      
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="flex items-center justify-center gap-2 h-12"
          onClick={handleCopyLink}
          data-testid="modal-share-copy-link"
        >
          {isCopied ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : (
            <Copy className="h-5 w-5" />
          )}
          {isCopied ? 'Copiado!' : 'Copiar link'}
        </Button>
        
        <Button
          variant="outline"
          className="flex items-center justify-center gap-2 h-12 hover:bg-green-50 hover:border-green-300"
          onClick={handleShareWhatsApp}
          data-testid="modal-share-whatsapp"
        >
          <WhatsAppIcon className="h-5 w-5 text-green-600" />
          WhatsApp
        </Button>
        
        <Button
          variant="outline"
          className="flex items-center justify-center gap-2 h-12 hover:bg-blue-50 hover:border-blue-300"
          onClick={handleShareTwitter}
          data-testid="modal-share-twitter"
        >
          <Twitter className="h-5 w-5 text-blue-500" />
          Twitter / X
        </Button>
        
        <Button
          variant="outline"
          className="flex items-center justify-center gap-2 h-12 hover:bg-blue-50 hover:border-blue-300"
          onClick={handleShareLinkedIn}
          data-testid="modal-share-linkedin"
        >
          <Linkedin className="h-5 w-5 text-blue-700" />
          LinkedIn
        </Button>
      </div>
    </div>
  );
}
