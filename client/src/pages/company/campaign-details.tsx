import { useState, useEffect } from 'react';
import { useRoute, useLocation, useSearch } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useMarketplace } from '@/lib/provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Users, 
  Calendar, 
  DollarSign,
  Loader2,
  FileText,
  Plus,
  Trash2,
  Save,
  Heart,
  Send,
  UserPlus,
  Search,
  ChevronLeft,
  ChevronRight,
  Link2,
  Check,
  Info,
  Pencil,
  X,
  Trophy,
  Medal,
  Crown,
  Target,
  TrendingUp,
  Eye,
  ShoppingCart,
  Ticket,
  Clock,
  Download,
  FileSpreadsheet,
  Hash
} from 'lucide-react';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { queryClient } from '@/lib/queryClient';
import { toast as sonnerToast } from 'sonner';
import { motion } from 'framer-motion';
import type { Campaign, Application, User, Deliverable } from '@shared/schema';
import { NICHE_OPTIONS, AGE_RANGE_OPTIONS } from '@shared/constants';
import { Chat } from '@/components/Chat';
import { TagsInput } from '@/components/ui/tags-input';
import { DeliverableComments } from '@/components/DeliverableComments';
import { ShareCampaignButton } from '@/components/share-campaign-button';
import { getAvatarUrl } from '@/lib/utils';
import StarRating from '@/components/StarRating';
import { CampaignGamificationEditor } from '@/components/gamification/CampaignGamificationEditor';
import { CampaignHashtagTracking } from '@/components/campaign-hashtag-tracking';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

type ApplicationWithCreatorAndDeliverables = Application & { 
  creator: User; 
  deliverables: Deliverable[];
};

export default function CampaignDetails() {
  const [match, params] = useRoute('/campaign/:id/manage');
  const [_, setLocation] = useLocation();
  const searchString = useSearch();
  const { user } = useMarketplace();
  const { toast } = useToast();
  const [briefingText, setBriefingText] = useState('');
  const [briefingMaterials, setBriefingMaterials] = useState<string[]>([]);
  const [newMaterialUrl, setNewMaterialUrl] = useState('');
  const [isEditingBriefing, setIsEditingBriefing] = useState(false);
  const [creatorFilter, setCreatorFilter] = useState<'all' | 'favorites'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [processingApplicationId, setProcessingApplicationId] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [editedRequirements, setEditedRequirements] = useState<string[]>([]);
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [activeTab, setActiveTab] = useState('candidatos');
  const creatorsPerPage = 12;

  // Read tab from URL params on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(searchString);
    const tab = urlParams.get('tab');
    if (tab && ['candidatos', 'briefing', 'entregaveis', 'hashtags'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchString]);

  if (!match || !params) return null;

  const campaignId = parseInt(params.id);

  const { data: campaign } = useQuery<Campaign>({
    queryKey: [`/api/campaigns/${campaignId}`],
    enabled: !!user && user.role === 'company',
  });

  const { data: applications = [] } = useQuery<ApplicationWithCreatorAndDeliverables[]>({
    queryKey: [`/api/campaigns/${campaignId}/applications`],
    enabled: !!user && user.role === 'company',
  });

  const { data: creators = [] } = useQuery<User[]>({
    queryKey: ['/api/creators'],
    queryFn: async () => {
      const res = await fetch('/api/creators', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch creators');
      return res.json();
    },
    enabled: !!user && user.role === 'company',
  });

  const { data: favoriteIds = [] } = useQuery<number[]>({
    queryKey: ['/api/favorites'],
    queryFn: async () => {
      const res = await fetch('/api/favorites', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch favorites');
      return res.json();
    },
    enabled: !!user && user.role === 'company',
  });

  const { data: existingInvites = [] } = useQuery<{ id: number; creatorId: number; status: string }[]>({
    queryKey: [`/api/campaigns/${campaignId}/invites`],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${campaignId}/invites`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch invites');
      return res.json();
    },
    enabled: !!user && user.role === 'company' && !!campaignId,
  });

  const [sendingInviteToCreatorId, setSendingInviteToCreatorId] = useState<number | null>(null);
  const [selectedCreatorIds, setSelectedCreatorIds] = useState<Set<number>>(new Set());
  const [isSendingBulkInvites, setIsSendingBulkInvites] = useState(false);

  const sendInviteMutation = useMutation({
    mutationFn: async (creatorId: number) => {
      setSendingInviteToCreatorId(creatorId);
      const res = await fetch(`/api/campaigns/${campaignId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ creatorId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to send invite');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/invites`] });
      setSendingInviteToCreatorId(null);
      sonnerToast.success('Convite enviado!', {
        description: 'O criador receberá uma notificação sobre o convite.'
      });
    },
    onError: (error: Error) => {
      setSendingInviteToCreatorId(null);
      sonnerToast.error('Erro ao enviar convite', {
        description: error.message || 'Não foi possível enviar o convite. Tente novamente.'
      });
    },
  });

  const getCreatorInviteStatus = (creatorId: number) => {
    const invite = existingInvites.find(inv => inv.creatorId === creatorId);
    return invite?.status;
  };

  const hasCreatorApplied = (creatorId: number) => {
    return applications.some(app => app.creatorId === creatorId);
  };

  // Check if a creator can be invited (not already invited or applied)
  const canInviteCreator = (creatorId: number) => {
    return !hasCreatorApplied(creatorId) && !getCreatorInviteStatus(creatorId);
  };

  // Toggle creator selection
  const toggleCreatorSelection = (creatorId: number) => {
    setSelectedCreatorIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(creatorId)) {
        newSet.delete(creatorId);
      } else {
        newSet.add(creatorId);
      }
      return newSet;
    });
  };

  // Select all eligible creators on current page
  const selectAllEligible = () => {
    const eligibleIds = paginatedCreators
      .filter(c => canInviteCreator(c.id))
      .map(c => c.id);
    setSelectedCreatorIds(prev => {
      const newSet = new Set(prev);
      eligibleIds.forEach(id => newSet.add(id));
      return newSet;
    });
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedCreatorIds(new Set());
  };

  // Bulk invite mutation
  const sendBulkInvitesMutation = useMutation({
    mutationFn: async (creatorIds: number[]) => {
      setIsSendingBulkInvites(true);
      const res = await fetch(`/api/campaigns/${campaignId}/invites/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ creatorIds }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Falha ao enviar convites');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/invites`] });
      setIsSendingBulkInvites(false);
      setSelectedCreatorIds(new Set());
      
      const { summary } = data;
      if (summary.sent > 0) {
        sonnerToast.success(`${summary.sent} convite(s) enviado(s)!`, {
          description: summary.skipped > 0 
            ? `${summary.skipped} criador(es) já tinham convite ou candidatura.`
            : 'Os criadores receberão notificações sobre os convites.'
        });
      } else {
        sonnerToast.info('Nenhum convite enviado', {
          description: 'Todos os criadores selecionados já possuem convite ou candidatura.'
        });
      }
    },
    onError: (error: Error) => {
      setIsSendingBulkInvites(false);
      sonnerToast.error('Erro ao enviar convites', {
        description: error.message || 'Não foi possível enviar os convites. Tente novamente.'
      });
    },
  });

  const handleBulkInvite = () => {
    const ids = Array.from(selectedCreatorIds);
    if (ids.length > 0) {
      sendBulkInvitesMutation.mutate(ids);
    }
  };

  const updateBriefingMutation = useMutation({
    mutationFn: async (data: { briefingText?: string; briefingMaterials?: string[] }) => {
      const res = await fetch(`/api/campaigns/${campaignId}/briefing`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update briefing');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}`] });
      setIsEditingBriefing(false);
      toast({
        title: 'Briefing atualizado',
        description: 'O briefing da campanha foi atualizado com sucesso.',
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: number; status: string }) => {
      setProcessingApplicationId(applicationId);
      const res = await fetch(`/api/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/applications`] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      setProcessingApplicationId(null);
      toast({
        title: 'Status atualizado',
        description: 'O status da candidatura foi atualizado.',
      });
    },
    onError: () => {
      setProcessingApplicationId(null);
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete campaign');
    },
    onSuccess: () => {
      sonnerToast.success('Campanha deletada!', {
        description: 'A campanha foi removida com sucesso.'
      });
      setLocation('/dashboard');
    },
    onError: () => {
      sonnerToast.error('Erro ao deletar campanha', {
        description: 'Não foi possível deletar a campanha. Tente novamente.'
      });
    }
  });

  const handleUpdateStatus = (applicationId: number, status: string) => {
    updateStatusMutation.mutate({ applicationId, status });
  };

  const handleSaveBriefing = () => {
    updateBriefingMutation.mutate({
      briefingText: briefingText || undefined,
      briefingMaterials: briefingMaterials.length > 0 ? briefingMaterials : undefined,
    });
  };

  const handleStartEditingBriefing = () => {
    if (campaign) {
      setBriefingText(campaign.briefingText || '');
      setBriefingMaterials(campaign.briefingMaterials || []);
      setIsEditingBriefing(true);
    }
  };

  const handleAddMaterial = () => {
    if (newMaterialUrl.trim()) {
      setBriefingMaterials([...briefingMaterials, newMaterialUrl.trim()]);
      setNewMaterialUrl('');
    }
  };

  const handleRemoveMaterial = (index: number) => {
    setBriefingMaterials(briefingMaterials.filter((_, i) => i !== index));
  };

  const filteredCreators = creators.filter(creator => {
    if (creatorFilter === 'favorites' && !favoriteIds.includes(creator.id)) {
      return false;
    }
    
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      const matchesName = creator.name.toLowerCase().includes(search);
      const matchesBio = creator.bio?.toLowerCase().includes(search);
      
      let matchesNiche = false;
      if (creator.niche) {
        const nicheArray = Array.isArray(creator.niche) ? creator.niche : [creator.niche as unknown as string];
        matchesNiche = nicheArray.some((n: string) => n.toLowerCase().includes(search));
      }
      
      return matchesName || matchesBio || matchesNiche;
    }
    
    return true;
  });

  const totalPages = Math.ceil(filteredCreators.length / creatorsPerPage);
  const startIndex = (currentPage - 1) * creatorsPerPage;
  const endIndex = startIndex + creatorsPerPage;
  const paginatedCreators = filteredCreators.slice(startIndex, endIndex);

  const handleFilterChange = (filter: 'all' | 'favorites') => {
    setCreatorFilter(filter);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/campaign/${campaignId}`;
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      sonnerToast.success('Link copiado!', {
        description: 'O link da campanha foi copiado para a área de transferência.'
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      sonnerToast.error('Erro ao copiar link', {
        description: 'Não foi possível copiar o link. Tente novamente.'
      });
    }
  };

  const handleSaveDescription = async () => {
    if (!campaign) return;
    setIsSavingDescription(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          description: editedDescription,
          requirements: editedRequirements 
        }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update');
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/applications`] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      setIsEditingDescription(false);
      sonnerToast.success('Descrição e requisitos atualizados!');
    } catch (err) {
      sonnerToast.error('Erro ao salvar alterações');
    } finally {
      setIsSavingDescription(false);
    }
  };

  const startEditingDescription = () => {
    if (!campaign) return;
    setEditedDescription(campaign.description);
    const reqs = campaign.requirements as string[] | string | null | undefined;
    if (Array.isArray(reqs)) {
      setEditedRequirements(reqs);
    } else if (typeof reqs === 'string' && reqs.trim()) {
      setEditedRequirements([reqs]);
    } else {
      setEditedRequirements([]);
    }
    setIsEditingDescription(true);
  };

  const generateWhatsAppUrl = (creator: User) => {
    const campaignUrl = `${window.location.origin}/campaign/${campaignId}`;
    
    const safeName = creator.name.replace(/[<>]/g, '');
    const safeTitle = campaign?.title.replace(/[<>]/g, '') || '';
    
    const message = `Olá ${safeName}! Gostaríamos de convidá-lo(a) para participar da nossa campanha "${safeTitle}". Confira mais detalhes e candidate-se: ${campaignUrl}`;
    const encodedMessage = encodeURIComponent(message);
    
    let phone = creator.phone || '';
    phone = phone.replace(/\D/g, '');
    
    if (phone.startsWith('0')) {
      phone = phone.substring(1);
    }
    
    if (phone && phone.length >= 10) {
      if (!phone.startsWith('55') && phone.length <= 11) {
        phone = '55' + phone;
      }
      return `https://wa.me/${phone}?text=${encodedMessage}`;
    }
    return `https://wa.me/?text=${encodedMessage}`;
  };

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-xl font-semibold mb-2">Campanha não encontrada</h2>
        <Button onClick={() => setLocation('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Painel
        </Button>
      </div>
    );
  }

  const acceptedApplications = applications.filter(app => app.status === 'accepted');

  const daysUntilDeadline = differenceInDays(new Date(campaign.deadline), new Date());
  const deadlineText = daysUntilDeadline > 0 
    ? `${daysUntilDeadline} dias restantes`
    : daysUntilDeadline === 0 
      ? 'Prazo hoje!'
      : 'Prazo encerrado';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Button variant="ghost" onClick={() => setLocation('/dashboard')} className="pl-0 hover:pl-2 transition-all">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar ao Painel
      </Button>

      {/* Modern Gradient Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-violet-500/10 to-pink-500/10 dark:from-primary/20 dark:via-violet-500/20 dark:to-pink-500/20 p-6 md:p-8"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-violet-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-500/20 to-primary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 md:gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <StatusBadge status={campaign.status} className="text-sm px-3 py-1" />
                {daysUntilDeadline > 0 && daysUntilDeadline <= 7 && (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                    <Clock className="h-3 w-3 mr-1" />
                    {deadlineText}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold font-heading tracking-tight">{campaign.title}</h1>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full hover:bg-primary/10"
                  onClick={() => setShowInfoModal(true)}
                  data-testid="button-campaign-info"
                >
                  <Info className="h-5 w-5 text-muted-foreground" />
                </Button>
              </div>
              
              <p className="text-muted-foreground max-w-xl line-clamp-2">
                {campaign.description?.slice(0, 150) || 'Campanha de conteúdo'}
                {(campaign.description?.length || 0) > 150 && '...'}
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <ShareCampaignButton campaign={campaign} size="sm" />
              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                data-testid="button-delete-campaign"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Deletar
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="flex items-center gap-3 bg-background/60 backdrop-blur-sm rounded-xl p-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Prazo</p>
                <p className="font-semibold">{format(new Date(campaign.deadline), 'dd MMM', { locale: ptBR })}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-background/60 backdrop-blur-sm rounded-xl p-4">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Orçamento</p>
                <p className="font-semibold">{campaign.budget || 'A combinar'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-background/60 backdrop-blur-sm rounded-xl p-4">
              <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Criadores</p>
                <p className="font-semibold">{acceptedApplications.length}/{campaign.creatorsNeeded}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-background/60 backdrop-blur-sm rounded-xl p-4">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Candidaturas</p>
                <p className="font-semibold">{applications.length}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Campaign Info Modal - accessible from all screens */}
      <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Informações da Campanha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Prazo:</span>
              <span>{format(new Date(campaign.deadline), 'dd/MM/yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Orçamento:</span>
              <span>{campaign.budget}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Criadores:</span>
              <span>{campaign.creatorsNeeded}</span>
            </div>
            {campaign.targetNiche && campaign.targetNiche.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium">Nichos:</span>
                <div className="flex flex-wrap gap-1">
                  {campaign.targetNiche.map((niche, i) => {
                    const nicheOption = NICHE_OPTIONS.find(n => n.value === niche || n.label === niche);
                    const nicheLabel = nicheOption?.label || niche;
                    return (
                      <Badge key={i} variant="secondary" className="text-xs">{nicheLabel}</Badge>
                    );
                  })}
                </div>
              </div>
            )}
            {campaign.targetAgeRanges && campaign.targetAgeRanges.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium">Faixa Etária:</span>
                <div className="flex flex-wrap gap-1">
                  {campaign.targetAgeRanges.map((age, i) => {
                    const ageOption = AGE_RANGE_OPTIONS.find(a => a.value === age || a.label === age);
                    const ageLabel = ageOption?.label || age;
                    return (
                      <Badge key={i} variant="outline" className="text-xs">{ageLabel}</Badge>
                    );
                  })}
                </div>
              </div>
            )}
            {campaign.targetGender && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Gênero:</span>
                <span className="capitalize">{campaign.targetGender.replace('_', ' ')}</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* DESKTOP LAYOUT: Tabs + Sidebar */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start mb-6">
              <TabsTrigger value="candidatos" className="flex-1">
                <Users className="h-4 w-4 mr-2" />
                Candidatos ({applications.length})
              </TabsTrigger>
              <TabsTrigger value="ranking" className="flex-1">
                <Trophy className="h-4 w-4 mr-2" />
                Ranking
              </TabsTrigger>
              <TabsTrigger value="briefing" className="flex-1">
                <FileText className="h-4 w-4 mr-2" />
                Briefing
              </TabsTrigger>
              <TabsTrigger value="entregaveis" className="flex-1">
                <FileText className="h-4 w-4 mr-2" />
                Entregáveis
              </TabsTrigger>
              <TabsTrigger value="ecommerce" className="flex-1">
                <Ticket className="h-4 w-4 mr-2" />
                E-commerce
              </TabsTrigger>
              <TabsTrigger value="gamification" className="flex-1">
                <Trophy className="h-4 w-4 mr-2" />
                Gamificação
              </TabsTrigger>
              <TabsTrigger value="hashtags" className="flex-1">
                <Hash className="h-4 w-4 mr-2" />
                Hashtags
              </TabsTrigger>
            </TabsList>

            <TabsContent value="candidatos" className="space-y-4">
              <CandidatosContent 
                applications={applications}
                processingApplicationId={processingApplicationId}
                currentUserId={user?.id}
                onUpdateStatus={handleUpdateStatus}
                onOpenInviteModal={() => setIsInviteModalOpen(true)}
                campaign={campaign}
              />
            </TabsContent>

            <TabsContent value="ranking" className="space-y-4">
              <CampaignRankingContent campaignId={campaignId} />
            </TabsContent>

            <TabsContent value="briefing" className="space-y-4">
              <BriefingContent 
                campaign={campaign}
                isEditingBriefing={isEditingBriefing}
                briefingText={briefingText}
                setBriefingText={setBriefingText}
                briefingMaterials={briefingMaterials}
                newMaterialUrl={newMaterialUrl}
                setNewMaterialUrl={setNewMaterialUrl}
                handleAddMaterial={handleAddMaterial}
                handleRemoveMaterial={handleRemoveMaterial}
                handleSaveBriefing={handleSaveBriefing}
                handleStartEditingBriefing={handleStartEditingBriefing}
                setIsEditingBriefing={setIsEditingBriefing}
                isPending={updateBriefingMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="entregaveis" className="space-y-4">
              <EntregaveisContent 
                acceptedApplications={acceptedApplications}
                currentUserId={user?.id}
              />
            </TabsContent>

            <TabsContent value="ecommerce" className="space-y-4">
              <EcommerceContent campaignId={campaignId} />
            </TabsContent>

            <TabsContent value="gamification" className="space-y-4">
              <CampaignGamificationEditor campaignId={campaignId} />
            </TabsContent>

            <TabsContent value="hashtags" className="space-y-4">
              <CampaignHashtagTracking campaignId={campaignId} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <ResumoCard 
            campaign={campaign}
            isEditingDescription={isEditingDescription}
            editedDescription={editedDescription}
            setEditedDescription={setEditedDescription}
            editedRequirements={editedRequirements}
            setEditedRequirements={setEditedRequirements}
            isSavingDescription={isSavingDescription}
            handleSaveDescription={handleSaveDescription}
            startEditingDescription={startEditingDescription}
            setIsEditingDescription={setIsEditingDescription}
          />
        </div>
      </div>

      {/* MOBILE LAYOUT: Accordion */}
      <div className="lg:hidden space-y-4">
        <Accordion type="single" collapsible defaultValue="resumo" className="w-full">
          <AccordionItem value="resumo" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span className="font-semibold">Resumo da Campanha</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ResumoCard 
                campaign={campaign}
                isEditingDescription={isEditingDescription}
                editedDescription={editedDescription}
                setEditedDescription={setEditedDescription}
                editedRequirements={editedRequirements}
                setEditedRequirements={setEditedRequirements}
                isSavingDescription={isSavingDescription}
                handleSaveDescription={handleSaveDescription}
                startEditingDescription={startEditingDescription}
                setIsEditingDescription={setIsEditingDescription}
                isMobile={true}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="candidatos" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="font-semibold">Candidatos ({applications.length})</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <CandidatosContent 
                applications={applications}
                processingApplicationId={processingApplicationId}
                currentUserId={user?.id}
                onUpdateStatus={handleUpdateStatus}
                onOpenInviteModal={() => setIsInviteModalOpen(true)}
                isMobile={true}
                campaign={campaign}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="briefing" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="font-semibold">Briefing</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <BriefingContent 
                campaign={campaign}
                isEditingBriefing={isEditingBriefing}
                briefingText={briefingText}
                setBriefingText={setBriefingText}
                briefingMaterials={briefingMaterials}
                newMaterialUrl={newMaterialUrl}
                setNewMaterialUrl={setNewMaterialUrl}
                handleAddMaterial={handleAddMaterial}
                handleRemoveMaterial={handleRemoveMaterial}
                handleSaveBriefing={handleSaveBriefing}
                handleStartEditingBriefing={handleStartEditingBriefing}
                setIsEditingBriefing={setIsEditingBriefing}
                isPending={updateBriefingMutation.isPending}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="entregaveis" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="font-semibold">Entregáveis</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <EntregaveisContent 
                acceptedApplications={acceptedApplications}
                currentUserId={user?.id}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="hashtags" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                <span className="font-semibold">Hashtags</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <CampaignHashtagTracking campaignId={campaignId} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Invite Modal - Single instance at the end */}
      <Dialog open={isInviteModalOpen} onOpenChange={(open) => {
        setIsInviteModalOpen(open);
        if (!open) {
          setSelectedCreatorIds(new Set());
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Convidar Criadores</DialogTitle>
            <DialogDescription>
              Selecione múltiplos criadores para enviar convites em massa
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, nicho ou bio..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-creators"
                />
              </div>
              
              <div className="flex items-center justify-between gap-2">
                <Select value={creatorFilter} onValueChange={(value) => handleFilterChange(value as 'all' | 'favorites')}>
                  <SelectTrigger className="w-[180px]" data-testid="select-creator-filter-modal">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Criadores</SelectItem>
                    <SelectItem value="favorites">Apenas Favoritos</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllEligible}
                    disabled={paginatedCreators.filter(c => canInviteCreator(c.id)).length === 0}
                    data-testid="button-select-all"
                  >
                    Selecionar Página
                  </Button>
                  {selectedCreatorIds.size > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={deselectAll}
                      data-testid="button-deselect-all"
                    >
                      Limpar ({selectedCreatorIds.size})
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Bulk action bar */}
            {selectedCreatorIds.size > 0 && (
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                <span className="text-sm font-medium">
                  {selectedCreatorIds.size} criador(es) selecionado(s)
                </span>
                <Button
                  size="sm"
                  onClick={handleBulkInvite}
                  disabled={isSendingBulkInvites}
                  data-testid="button-bulk-invite"
                >
                  {isSendingBulkInvites ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Enviar Convites
                </Button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-2">
              {paginatedCreators.map((creator) => {
                const canInvite = canInviteCreator(creator.id);
                const isSelected = selectedCreatorIds.has(creator.id);
                
                return (
                  <div
                    key={creator.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      isSelected ? 'bg-primary/5 border-primary/30' : 'bg-card hover:bg-accent/50'
                    }`}
                  >
                    {/* Checkbox for eligible creators */}
                    {canInvite ? (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleCreatorSelection(creator.id)}
                        disabled={isSendingBulkInvites}
                        data-testid={`checkbox-creator-${creator.id}`}
                      />
                    ) : (
                      <div className="w-4" />
                    )}
                    
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={getAvatarUrl(creator.avatar)} />
                      <AvatarFallback>{creator.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{creator.name}</p>
                        {favoriteIds.includes(creator.id) && (
                          <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {creator.niche && (
                          <Badge variant="secondary" className="text-xs">
                            {Array.isArray(creator.niche) ? creator.niche[0] : creator.niche}
                          </Badge>
                        )}
                        {hasCreatorApplied(creator.id) && (
                          <Badge variant="default" className="text-xs bg-green-500">
                            Já candidatou
                          </Badge>
                        )}
                        {getCreatorInviteStatus(creator.id) === 'pending' && (
                          <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                            Convite enviado
                          </Badge>
                        )}
                        {getCreatorInviteStatus(creator.id) === 'accepted' && (
                          <Badge variant="default" className="text-xs bg-green-500">
                            Convite aceito
                          </Badge>
                        )}
                        {getCreatorInviteStatus(creator.id) === 'declined' && (
                          <Badge variant="destructive" className="text-xs">
                            Convite recusado
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canInvite && !isSelected && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => sendInviteMutation.mutate(creator.id)}
                          disabled={sendingInviteToCreatorId === creator.id || isSendingBulkInvites}
                          data-testid={`button-platform-invite-${creator.id}`}
                        >
                          {sendingInviteToCreatorId === creator.id ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <UserPlus className="h-3 w-3 mr-1" />
                          )}
                          Convidar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-300"
                        data-testid={`button-whatsapp-invite-${creator.id}`}
                      >
                        <a
                          href={generateWhatsAppUrl(creator)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Enviar via WhatsApp"
                        >
                          <WhatsAppIcon className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                );
              })}
              
              {filteredCreators.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {creatorFilter === 'favorites' 
                    ? 'Nenhum criador favorito encontrado.'
                    : searchTerm 
                      ? 'Nenhum criador encontrado para esta busca.'
                      : 'Nenhum criador disponível.'}
                </p>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages} ({filteredCreators.length} criadores)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    data-testid="button-next-page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar a campanha <strong>"{campaign.title}"</strong>?
              Esta ação não pode ser desfeita e todas as candidaturas associadas serão removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-dialog">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCampaignMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-dialog"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EcommerceContent({ campaignId }: { campaignId: number }) {
  const [, setLocation] = useLocation();
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Gestão de E-commerce
          </CardTitle>
          <CardDescription>
            Gerencie cupons, vendas e comissões para esta campanha
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => setLocation(`/campaign/${campaignId}/coupons`)}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 rounded-lg p-3">
                    <Ticket className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Cupons de Desconto</h3>
                    <p className="text-sm text-muted-foreground">
                      Crie e gerencie cupons para criadores
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => setLocation(`/campaign/${campaignId}/sales`)}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 rounded-lg p-3">
                    <ShoppingCart className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Vendas e Comissões</h3>
                    <p className="text-sm text-muted-foreground">
                      Registre vendas e gerencie comissões
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setLocation(`/campaign/${campaignId}/coupons`)}
              data-testid="button-manage-coupons"
            >
              <Ticket className="h-4 w-4 mr-2" />
              Gerenciar Cupons
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setLocation(`/campaign/${campaignId}/sales`)}
              data-testid="button-manage-sales"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Gerenciar Vendas
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface CampaignLeaderboardEntry {
  rank: number;
  creatorId: number;
  creatorName: string;
  creatorAvatar: string | null;
  creatorUsername: string | null;
  points: number;
  deliverablesCompleted: number;
  deliverablesOnTime: number;
  totalViews: number;
  totalEngagement: number;
  totalSales: number;
  qualityScore: number | null;
}

interface CampaignLeaderboardData {
  campaignId: number;
  campaignTitle: string;
  totalParticipants: number;
  leaderboard: CampaignLeaderboardEntry[];
}

function CampaignRankingContent({ campaignId }: { campaignId: number }) {
  const { data, isLoading } = useQuery<CampaignLeaderboardData>({
    queryKey: [`/api/campaigns/${campaignId}/leaderboard`],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${campaignId}/leaderboard`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      return res.json();
    },
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Medal className="h-5 w-5 text-amber-600" />;
      default: return <span className="text-lg font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-50 to-amber-100 border-2 border-yellow-400 shadow-lg';
      case 2: return 'bg-gradient-to-r from-gray-50 to-slate-100 border-2 border-gray-300';
      case 3: return 'bg-gradient-to-r from-amber-50 to-orange-100 border-2 border-amber-400';
      default: return 'bg-white border border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.leaderboard.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Ranking da Campanha
          </CardTitle>
          <CardDescription>Acompanhe a performance dos criadores</CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center text-gray-500">
          <Target className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Nenhum criador no ranking ainda</p>
          <p className="text-sm mt-1">Os pontos serão calculados quando houver entregas e engajamento</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Ranking da Campanha
            </CardTitle>
            <CardDescription>
              {data.totalParticipants} criador{data.totalParticipants !== 1 ? 'es' : ''} participando
            </CardDescription>
          </div>
          <a href={`/campaign/${campaignId}/leaderboard`}>
            <Button variant="outline" size="sm" data-testid="button-view-full-leaderboard">
              Ver Ranking Completo
            </Button>
          </a>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.leaderboard.map((entry) => (
          <div
            key={entry.creatorId}
            className={`p-4 rounded-lg flex items-center gap-4 transition-all ${getRankStyle(entry.rank)}`}
            data-testid={`ranking-entry-${entry.creatorId}`}
          >
            <div className="flex-shrink-0 w-10 flex items-center justify-center">
              {getRankIcon(entry.rank)}
            </div>
            <Avatar className="h-12 w-12 border-2 border-white shadow">
              <AvatarImage src={entry.creatorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.creatorId}`} />
              <AvatarFallback>{entry.creatorName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{entry.creatorName}</p>
              {entry.creatorUsername && (
                <p className="text-sm text-gray-500">@{entry.creatorUsername}</p>
              )}
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center hidden sm:block">
                <p className="text-gray-500 text-xs">Entregas</p>
                <p className="font-semibold">{entry.deliverablesCompleted}</p>
              </div>
              <div className="text-center hidden md:block">
                <p className="text-gray-500 text-xs flex items-center gap-1">
                  <Eye className="h-3 w-3" /> Views
                </p>
                <p className="font-semibold">{entry.totalViews.toLocaleString()}</p>
              </div>
              <div className="text-center hidden md:block">
                <p className="text-gray-500 text-xs flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Engajamento
                </p>
                <p className="font-semibold">{entry.totalEngagement.toLocaleString()}</p>
              </div>
              <div className="text-center hidden lg:block">
                <p className="text-gray-500 text-xs flex items-center gap-1">
                  <ShoppingCart className="h-3 w-3" /> Vendas
                </p>
                <p className="font-semibold">{entry.totalSales}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-500 text-xs">Pontos</p>
                <p className="font-bold text-primary text-lg">{entry.points}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function CandidatosContent({ 
  applications, 
  processingApplicationId, 
  currentUserId, 
  onUpdateStatus,
  onOpenInviteModal,
  isMobile = false,
  campaign
}: { 
  applications: ApplicationWithCreatorAndDeliverables[];
  processingApplicationId: number | null;
  currentUserId?: number;
  onUpdateStatus: (id: number, status: string) => void;
  onOpenInviteModal: () => void;
  isMobile?: boolean;
  campaign?: Campaign;
}) {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportStatus, setExportStatus] = useState<string[]>(['pending', 'accepted', 'rejected']);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!campaign) return;
    setIsExporting(true);
    try {
      const statusQuery = exportStatus.join(',');
      const url = `/api/campaigns/${campaign.id}/applications/export?format=${format}&status=${statusQuery}`;
      
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Erro ao exportar');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `candidatos-${campaign.id}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      
      setIsExportOpen(false);
      sonnerToast.success('Exportação concluída!');
    } catch (error) {
      sonnerToast.error('Erro ao exportar candidatos');
    } finally {
      setIsExporting(false);
    }
  };

  const toggleStatus = (status: string) => {
    setExportStatus(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">
          {applications.length} candidatura{applications.length !== 1 ? 's' : ''}
        </p>
        <div className="flex gap-2">
          <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                variant="outline"
                data-testid="button-export-applicants"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Exportar Candidatos</DialogTitle>
                <DialogDescription>
                  Selecione quais status deseja exportar e o formato do arquivo.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-3">
                  <p className="text-sm font-medium">Filtrar por status:</p>
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox 
                        checked={exportStatus.includes('pending')}
                        onCheckedChange={() => toggleStatus('pending')}
                        data-testid="checkbox-export-pending"
                      />
                      <span className="text-sm">Pendentes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox 
                        checked={exportStatus.includes('accepted')}
                        onCheckedChange={() => toggleStatus('accepted')}
                        data-testid="checkbox-export-accepted"
                      />
                      <span className="text-sm">Aceitos</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox 
                        checked={exportStatus.includes('rejected')}
                        onCheckedChange={() => toggleStatus('rejected')}
                        data-testid="checkbox-export-rejected"
                      />
                      <span className="text-sm">Recusados</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleExport('csv')}
                    disabled={isExporting || exportStatus.length === 0}
                    data-testid="button-export-csv"
                  >
                    {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
                    Planilha (CSV)
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleExport('pdf')}
                    disabled={isExporting || exportStatus.length === 0}
                    data-testid="button-export-pdf"
                  >
                    {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                    PDF
                  </Button>
                </div>
                {exportStatus.length === 0 && (
                  <p className="text-sm text-destructive">Selecione pelo menos um status para exportar.</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onOpenInviteModal}
            data-testid="button-open-invite-modal"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Convidar Criadores
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <div className={isMobile ? "" : "overflow-x-auto"}>
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="all" className="text-xs md:text-sm">Todos</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs md:text-sm">Pendentes</TabsTrigger>
            <TabsTrigger value="accepted" className="text-xs md:text-sm">Aceitos</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="space-y-4 mt-4">
          {applications.map(app => (
            <CandidateCard 
              key={app.id} 
              app={app} 
              onUpdateStatus={onUpdateStatus}
              isUpdating={processingApplicationId === app.id}
              currentUserId={currentUserId}
              campaign={campaign}
            />
          ))}
          {applications.length === 0 && <EmptyState />}
        </TabsContent>
        
        <TabsContent value="pending" className="space-y-4 mt-4">
          {applications.filter(a => a.status === 'pending').map(app => (
            <CandidateCard 
              key={app.id} 
              app={app} 
              onUpdateStatus={onUpdateStatus}
              isUpdating={processingApplicationId === app.id}
              currentUserId={currentUserId}
              campaign={campaign}
            />
          ))}
          {applications.filter(a => a.status === 'pending').length === 0 && <EmptyState message="Nenhum candidato pendente" />}
        </TabsContent>
        
        <TabsContent value="accepted" className="space-y-4 mt-4">
          {applications.filter(a => a.status === 'accepted').map(app => (
            <CandidateCard 
              key={app.id} 
              app={app} 
              onUpdateStatus={onUpdateStatus}
              isUpdating={processingApplicationId === app.id}
              currentUserId={currentUserId}
              campaign={campaign}
            />
          ))}
          {applications.filter(a => a.status === 'accepted').length === 0 && <EmptyState message="Nenhum candidato aceito ainda" />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BriefingContent({ 
  campaign,
  isEditingBriefing,
  briefingText,
  setBriefingText,
  briefingMaterials,
  newMaterialUrl,
  setNewMaterialUrl,
  handleAddMaterial,
  handleRemoveMaterial,
  handleSaveBriefing,
  handleStartEditingBriefing,
  setIsEditingBriefing,
  isPending
}: { 
  campaign: Campaign;
  isEditingBriefing: boolean;
  briefingText: string;
  setBriefingText: (text: string) => void;
  briefingMaterials: string[];
  newMaterialUrl: string;
  setNewMaterialUrl: (url: string) => void;
  handleAddMaterial: () => void;
  handleRemoveMaterial: (index: number) => void;
  handleSaveBriefing: () => void;
  handleStartEditingBriefing: () => void;
  setIsEditingBriefing: (value: boolean) => void;
  isPending: boolean;
}) {
  return (
    <Card className="border-none shadow-lg bg-secondary/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Briefing</CardTitle>
          {!isEditingBriefing && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleStartEditingBriefing}
              data-testid="button-edit-briefing"
            >
              Editar
            </Button>
          )}
        </div>
        <CardDescription>Instruções e materiais para os criadores aceitos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditingBriefing ? (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">Instruções</label>
              <Textarea
                value={briefingText}
                onChange={(e) => setBriefingText(e.target.value)}
                placeholder="Forneça instruções detalhadas para os criadores..."
                rows={5}
                data-testid="input-briefing-text"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Materiais de Apoio (URLs)</label>
              <div className="space-y-2">
                {briefingMaterials.map((url, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input value={url} readOnly className="flex-1" />
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleRemoveMaterial(index)}
                      data-testid={`button-remove-material-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newMaterialUrl}
                    onChange={(e) => setNewMaterialUrl(e.target.value)}
                    placeholder="https://..."
                    data-testid="input-new-material-url"
                  />
                  <Button 
                    size="sm" 
                    onClick={handleAddMaterial}
                    data-testid="button-add-material"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                onClick={handleSaveBriefing}
                disabled={isPending}
                data-testid="button-save-briefing"
              >
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsEditingBriefing(false)}
                data-testid="button-cancel-briefing"
              >
                Cancelar
              </Button>
            </div>
          </>
        ) : (
          <>
            {campaign.briefingText || campaign.briefingMaterials?.length ? (
              <>
                {campaign.briefingText && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Instruções</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {campaign.briefingText}
                    </p>
                  </div>
                )}
                
                {campaign.briefingMaterials && campaign.briefingMaterials.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Materiais de Apoio</h4>
                    <div className="space-y-1">
                      {campaign.briefingMaterials.map((url, index) => (
                        <a 
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <FileText className="h-3 w-3" />
                          {url}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum briefing criado ainda. Clique em "Editar" para adicionar instruções.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function EntregaveisContent({ 
  acceptedApplications, 
  currentUserId 
}: { 
  acceptedApplications: ApplicationWithCreatorAndDeliverables[];
  currentUserId?: number;
}) {
  const hasDeliverables = acceptedApplications.some(app => app.deliverables && app.deliverables.length > 0);

  if (acceptedApplications.length === 0) {
    return <EmptyState message="Nenhum criador aceito ainda. Aceite candidatos para ver entregáveis." />;
  }

  if (!hasDeliverables) {
    return <EmptyState message="Nenhum entregável recebido ainda." />;
  }

  return (
    <div className="space-y-6">
      {acceptedApplications.map(app => {
        if (!app.deliverables || app.deliverables.length === 0) return null;
        
        return (
          <Card key={app.id} className="border-none shadow-lg bg-secondary/10">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={getAvatarUrl(app.creator.avatar)} />
                  <AvatarFallback>{app.creator.name[0]}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{app.creator.name}</span>
              </div>
              <div className="space-y-4 ml-10">
                {app.deliverables.map(deliverable => (
                  <div key={deliverable.id} className="space-y-3">
                    <a
                      href={deliverable.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline p-2 rounded hover:bg-muted/50 transition-colors"
                      data-testid={`deliverable-${deliverable.id}`}
                    >
                      <FileText className="h-4 w-4" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{deliverable.fileName}</div>
                        {deliverable.description && (
                          <div className="text-xs text-muted-foreground">{deliverable.description}</div>
                        )}
                      </div>
                    </a>
                    {currentUserId && (
                      <DeliverableComments 
                        deliverableId={deliverable.id} 
                        currentUserId={currentUserId} 
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ResumoCard({ 
  campaign,
  isEditingDescription,
  editedDescription,
  setEditedDescription,
  editedRequirements,
  setEditedRequirements,
  isSavingDescription,
  handleSaveDescription,
  startEditingDescription,
  setIsEditingDescription,
  isMobile = false
}: { 
  campaign: Campaign;
  isEditingDescription: boolean;
  editedDescription: string;
  setEditedDescription: (desc: string) => void;
  editedRequirements: string[];
  setEditedRequirements: (reqs: string[]) => void;
  isSavingDescription: boolean;
  handleSaveDescription: () => void;
  startEditingDescription: () => void;
  setIsEditingDescription: (value: boolean) => void;
  isMobile?: boolean;
}) {
  return (
    <Card className={isMobile ? "border-none shadow-none bg-transparent" : "border-none shadow-lg bg-secondary/10"}>
      <CardHeader className={isMobile ? "px-0 pt-0" : ""}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Resumo da Campanha</CardTitle>
          {!isEditingDescription && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={startEditingDescription}
              data-testid="button-edit-description"
            >
              <Pencil className="h-4 w-4 mr-1" />
              Editar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className={isMobile ? "px-0 space-y-4" : "space-y-4"}>
        {isEditingDescription ? (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">Descrição</label>
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Descreva a campanha..."
                rows={4}
                data-testid="input-edit-description"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Requisitos</label>
              <TagsInput
                value={editedRequirements}
                onChange={setEditedRequirements}
                placeholder="Digite e pressione Enter..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setIsEditingDescription(false)}
                data-testid="button-cancel-edit-description"
              >
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
              <Button 
                size="sm" 
                onClick={handleSaveDescription}
                disabled={isSavingDescription}
                data-testid="button-save-description"
              >
                {isSavingDescription ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Salvar
              </Button>
            </div>
          </>
        ) : (
          <>
            <div>
              <h4 className="font-medium text-sm mb-1">Descrição</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {campaign.description}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-1">Requisitos</h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {(() => {
                  const reqs = campaign.requirements as string[] | string | null | undefined;
                  if (Array.isArray(reqs) && reqs.length > 0) {
                    return reqs.map((req, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {req}
                      </Badge>
                    ));
                  } else if (typeof reqs === 'string' && reqs.trim()) {
                    return (
                      <p className="text-sm text-muted-foreground">
                        {reqs}
                      </p>
                    );
                  } else {
                    return (
                      <p className="text-sm text-muted-foreground italic">
                        Nenhum requisito especificado
                      </p>
                    );
                  }
                })()}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function CandidateCard({ app, onUpdateStatus, isUpdating, currentUserId, campaign }: { 
  app: ApplicationWithCreatorAndDeliverables; 
  onUpdateStatus: (id: number, status: string) => void;
  isUpdating?: boolean;
  currentUserId?: number;
  campaign?: Campaign;
}) {
  const [chatOpen, setChatOpen] = useState(false);
  const [__, setLocation] = useLocation();
  const creator = app.creator;
  
  const { data: ratingData } = useQuery<{ average: number; count: number }>({
    queryKey: [`/api/users/${creator?.id}/rating`],
    queryFn: async () => {
      const res = await fetch(`/api/users/${creator?.id}/rating`, { credentials: 'include' });
      if (!res.ok) return { average: 0, count: 0 };
      return res.json();
    },
    enabled: !!creator?.id,
  });
  
  if (!creator) return null;

  const handleNavigateToProfile = () => {
    setLocation(`/creator/${creator.id}/profile`);
  };

  return (
    <Card className="overflow-hidden border-l-4 border-l-transparent hover:border-l-primary transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <Avatar 
            className="h-16 w-16 border-2 border-white shadow-sm cursor-pointer hover:ring-2 hover:ring-primary transition-all"
            onClick={handleNavigateToProfile}
            data-testid={`avatar-creator-${creator.id}`}
          >
            <AvatarImage src={getAvatarUrl(creator.avatar)} />
            <AvatarFallback>{creator.name[0]}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 
                  className="font-bold text-lg cursor-pointer hover:text-primary transition-colors"
                  onClick={handleNavigateToProfile}
                  data-testid={`name-creator-${creator.id}`}
                >
                  {creator.name}
                </h3>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">{creator.niche} • {creator.followers} Seguidores</p>
                  <StarRating 
                    rating={ratingData?.average || 0} 
                    count={ratingData?.count || 0} 
                    size="sm"
                  />
                </div>
              </div>
              <StatusBadge status={app.status} />
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2">
              {creator.bio}
            </p>

            {app.message && (
              <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm italic text-slate-600 flex gap-2">
                <MessageSquare className="h-4 w-4 flex-shrink-0 mt-0.5" />
                "{app.message}"
              </div>
            )}

            {app.status === 'pending' && (
              <div className="pt-4 flex gap-3">
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700" 
                  onClick={() => onUpdateStatus(app.id, 'accepted')}
                  disabled={isUpdating}
                  data-testid={`button-accept-${app.id}`}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-1.5 h-4 w-4" /> Aceitar
                    </>
                  )}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" 
                  onClick={() => onUpdateStatus(app.id, 'rejected')}
                  disabled={isUpdating}
                  data-testid={`button-reject-${app.id}`}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Processando...
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-1.5 h-4 w-4" /> Recusar
                    </>
                  )}
                </Button>
              </div>
            )}

            {app.status === 'accepted' && currentUserId && (
              <div className="pt-4 flex gap-2">
                <Dialog open={chatOpen} onOpenChange={setChatOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="outline"
                      data-testid={`button-chat-${app.id}`}
                    >
                      <MessageSquare className="mr-1.5 h-4 w-4" /> Chat
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Chat com {creator.name}</DialogTitle>
                      <DialogDescription>
                        Converse sobre a campanha e alinhamento de entregas
                      </DialogDescription>
                    </DialogHeader>
                    <Chat applicationId={app.id} currentUserId={currentUserId} />
                  </DialogContent>
                </Dialog>
              </div>
            )}

          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ConversationCard({ app, currentUserId, campaign }: {
  app: ApplicationWithCreatorAndDeliverables;
  currentUserId?: number;
  campaign?: Campaign;
}) {
  const [chatOpen, setChatOpen] = useState(false);
  const [__, setLocation] = useLocation();
  const creator = app.creator;
  if (!creator || !currentUserId) return null;

  const handleNavigateToProfile = () => {
    setLocation(`/creator/${creator.id}/profile`);
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <Avatar 
            className="h-14 w-14 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
            onClick={handleNavigateToProfile}
            data-testid={`conversation-avatar-${creator.id}`}
          >
            <AvatarImage src={getAvatarUrl(creator.avatar)} />
            <AvatarFallback>{creator.name[0]}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h4 
              className="font-semibold cursor-pointer hover:text-primary transition-colors"
              onClick={handleNavigateToProfile}
            >
              {creator.name}
            </h4>
            <p className="text-sm text-muted-foreground truncate">
              {creator.niche} • {creator.followers} Seguidores
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Dialog open={chatOpen} onOpenChange={setChatOpen}>
              <DialogTrigger asChild>
                <Button 
                  size="lg"
                  data-testid={`button-open-chat-${app.id}`}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Abrir Chat
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl h-[600px] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Chat com {creator.name}</DialogTitle>
                  <DialogDescription>
                    Converse sobre a campanha e alinhamento de entregas
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-hidden">
                  <Chat applicationId={app.id} currentUserId={currentUserId} />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
      
    </Card>
  );
}

function EmptyState({ message = "Nenhum candidato encontrado" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl bg-slate-50/50">
      <Users className="h-10 w-10 text-slate-300 mb-2" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
