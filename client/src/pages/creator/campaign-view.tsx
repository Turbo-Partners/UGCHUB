import { useState, useMemo } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useMarketplace } from '@/lib/provider';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  ArrowLeft, 
  CheckCircle, 
  Calendar, 
  DollarSign, 
  Users, 
  Share2, 
  X, 
  Loader2, 
  Check, 
  Globe, 
  Instagram, 
  Building2, 
  ExternalLink,
  FileText,
  Image,
  Link2,
  Package,
  Target,
  Clock,
  Sparkles,
  Eye,
  Video,
  Camera,
  MessageSquare,
  Star,
  Bookmark,
  ChevronRight,
  Info,
  Play
} from 'lucide-react';
import { Link } from 'wouter';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface CompanyInfo {
  id: number;
  name: string;
  tradeName: string | null;
  logo: string | null;
  description: string | null;
  website: string | null;
  instagram: string | null;
  email: string | null;
}

interface Deliverable {
  id: number;
  applicationId: number;
  type: string;
  title: string;
  description: string | null;
  contentUrl: string | null;
  thumbnailUrl: string | null;
  status: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewerComments: string | null;
  rating: number | null;
  createdAt: string;
}

interface Application {
  id: number;
  campaignId: number;
  creatorId: number;
  status: string;
  message: string | null;
  appliedAt: string;
  deliverables?: Deliverable[];
}

const getDeliverableIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'video':
    case 'reels':
    case 'tiktok':
      return <Video className="h-4 w-4" />;
    case 'photo':
    case 'imagem':
    case 'carrossel':
      return <Camera className="h-4 w-4" />;
    case 'story':
    case 'stories':
      return <Play className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getDeliverableStatusBadge = (status: string) => {
  const configs: Record<string, { label: string; className: string }> = {
    pending: { label: "Pendente", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
    submitted: { label: "Enviado", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
    approved: { label: "Aprovado", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
    rejected: { label: "Revisão", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  };
  const config = configs[status] || configs.pending;
  return <Badge className={config.className}>{config.label}</Badge>;
};

export default function CampaignView() {
  const [match, params] = useRoute('/campaign/:id');
  const [_, setLocation] = useLocation();
  const { campaigns, user, applyToCampaign, getCampaignApplications } = useMarketplace();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [showUnsubscribeDialog, setShowUnsubscribeDialog] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const campaignId = match && params ? parseInt(params.id) : null;

  const { data: companyInfo } = useQuery<CompanyInfo>({
    queryKey: [`/api/campaigns/${campaignId}/company`],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${campaignId}/company`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch company info');
      return res.json();
    },
    enabled: !!campaignId && !!user,
  });

  const { data: myApplicationData } = useQuery<Application>({
    queryKey: [`/api/campaigns/${campaignId}/my-application`],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${campaignId}/my-application`, { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!campaignId && !!user && user.role === 'creator',
  });

  const { data: myDeliverables = [] } = useQuery<Deliverable[]>({
    queryKey: [`/api/applications/${myApplicationData?.id}/deliverables`],
    queryFn: async () => {
      if (!myApplicationData?.id) return [];
      const res = await fetch(`/api/applications/${myApplicationData.id}/deliverables`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!myApplicationData?.id && myApplicationData?.status === 'accepted',
  });

  const getInitials = (name: string | null | undefined): string => {
    if (!name || !name.trim()) return "?";
    const words = name.trim().split(' ').filter(w => w);
    if (words.length === 0) return "?";
    if (words.length === 1) return words[0][0]?.toUpperCase() || "?";
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const applyMutation = useMutation({
    mutationFn: async (campaignId: number) => {
      await applyToCampaign(campaignId, message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/my-application`] });
      toast.success('Candidatura enviada com sucesso!');
      setIsApplyOpen(false);
      setMessage('');
    },
    onError: () => {
      toast.error('Erro ao enviar candidatura');
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to unsubscribe');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast.success('Candidatura cancelada com sucesso!');
      setShowUnsubscribeDialog(false);
      setLocation('/feed');
    },
    onError: () => {
      toast.error('Erro ao cancelar candidatura');
    },
  });

  const handleCopyLink = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      toast.success('Link copiado com sucesso!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  if (!match || !params || !campaignId) return null;

  const campaign = campaigns.find(c => c.id === campaignId);
  
  if (!campaign) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Campanha não encontrada</h1>
        <Button onClick={() => setLocation('/feed')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para o Feed
        </Button>
      </div>
    );
  }

  const isCreator = user?.role === 'creator';
  const myApplications = user ? getCampaignApplications(campaign.id).filter(a => a.creatorId === user.id) : [];
  const hasApplied = myApplications.length > 0;
  const myApplication = myApplications[0] || myApplicationData;
  const isAccepted = myApplication?.status === 'accepted';

  const briefingMaterials = campaign.briefingMaterials || [];
  const deliverables = campaign.deliverables || [];
  const requirements = Array.isArray(campaign.requirements) ? campaign.requirements : [];

  const deadlineDate = new Date(campaign.deadline);
  const isDeadlineClose = deadlineDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500" data-testid="page-campaign-view">
      <Button variant="ghost" onClick={() => setLocation(isCreator ? '/feed' : '/dashboard')} className="pl-0 hover:pl-2 transition-all">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para {isCreator ? 'Feed' : 'Painel'}
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 md:p-8 text-white"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        
        <div className="relative">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className="bg-white/20 text-white border-white/30">
                  {campaign.status === 'open' ? 'Campanha Ativa' : 'Fechada'}
                </Badge>
                <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                  Postado {campaign.createdAt ? formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true, locale: ptBR }) : 'recentemente'}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold font-heading tracking-tight mb-3">{campaign.title}</h1>
              
              {companyInfo && (
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-white/20">
                    {companyInfo.logo ? (
                      <AvatarImage src={companyInfo.logo} alt={companyInfo.name} />
                    ) : null}
                    <AvatarFallback className="bg-white/20 text-white font-semibold">
                      {getInitials(companyInfo.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{companyInfo.tradeName || companyInfo.name}</p>
                    <p className="text-white/70 text-sm flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      Empresa
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {isCreator && (
              <div className="flex-shrink-0 flex flex-wrap gap-2">
                {hasApplied ? (
                  <>
                    {isAccepted ? (
                      <Link href={`/campaign/${campaignId}/workspace`}>
                        <Button size="lg" className="bg-white text-indigo-600 hover:bg-white/90">
                          <Sparkles className="mr-2 h-5 w-5" /> Acessar Workspace
                        </Button>
                      </Link>
                    ) : (
                      <Button size="lg" disabled className="bg-white/20 text-white border-white/20">
                        <CheckCircle className="mr-2 h-5 w-5" /> Candidatou-se
                      </Button>
                    )}
                    {(myApplication?.status === 'pending' || myApplication?.status === 'rejected') && (
                      <Button 
                        size="lg" 
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/10"
                        onClick={() => setShowUnsubscribeDialog(true)}
                        data-testid="button-cancel-application"
                      >
                        <X className="mr-2 h-5 w-5" /> Cancelar
                      </Button>
                    )}
                  </>
                ) : (
                  <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
                    <DialogTrigger asChild>
                      <Button size="lg" className="bg-white text-indigo-600 hover:bg-white/90 shadow-lg" data-testid="button-apply">
                        Candidatar-se Agora
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Candidatar-se a {campaign.title}</DialogTitle>
                        <DialogDescription>
                          Apresente-se e explique por que você é ideal para esta campanha.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Textarea 
                          placeholder="Olá, estou muito interessado porque..." 
                          className="min-h-[150px]"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          data-testid="input-application-message"
                        />
                      </div>
                      <DialogFooter>
                        <Button 
                          onClick={() => applyMutation.mutate(campaign.id)} 
                          disabled={applyMutation.isPending}
                          data-testid="button-submit-application"
                        >
                          {applyMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            'Enviar Candidatura'
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                <DollarSign className="h-4 w-4" />
                Orçamento
              </div>
              <p className="font-bold text-xl">{campaign.budget}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                <Users className="h-4 w-4" />
                Vagas
              </div>
              <p className="font-bold text-xl">{campaign.creatorsNeeded} criadores</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                <Calendar className="h-4 w-4" />
                Prazo
              </div>
              <p className="font-bold text-xl">{format(deadlineDate, "dd/MM/yy")}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                <Package className="h-4 w-4" />
                Entregas
              </div>
              <p className="font-bold text-xl">{deliverables.length} itens</p>
            </div>
          </div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-xl" data-testid="tabs-campaign">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <Info className="h-4 w-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="briefing" data-testid="tab-briefing">
            <FileText className="h-4 w-4 mr-2" />
            Briefing
          </TabsTrigger>
          <TabsTrigger value="references" data-testid="tab-references">
            <Image className="h-4 w-4 mr-2" />
            Referências
          </TabsTrigger>
          <TabsTrigger value="deliverables" data-testid="tab-deliverables">
            <Package className="h-4 w-4 mr-2" />
            Entregas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-indigo-500" />
                      Sobre a Campanha
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {campaign.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                      Requisitos
                    </CardTitle>
                    <CardDescription>O que você precisa para participar</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {requirements.length > 0 ? (
                      <ul className="space-y-3">
                        {requirements.filter(r => r && r.trim()).map((req, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <div className="mt-1.5 h-2 w-2 rounded-full bg-indigo-500 flex-shrink-0" />
                            <span className="text-muted-foreground">{req.trim()}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-sm">Nenhum requisito específico informado.</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-purple-500" />
                      O que você vai entregar
                    </CardTitle>
                    <CardDescription>Entregas esperadas para esta campanha</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {deliverables.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {deliverables.filter(d => d && d.trim()).map((deliverable, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                            <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                              {getDeliverableIcon(deliverable)}
                            </div>
                            <span className="font-medium text-sm">{deliverable.trim()}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">Entregas serão definidas após aprovação.</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="space-y-6">
              {companyInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <Card data-testid="card-company-info">
                    <CardHeader>
                      <CardTitle className="text-base">Empresa</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          {companyInfo.logo ? (
                            <AvatarImage src={companyInfo.logo} alt={companyInfo.name} />
                          ) : null}
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {getInitials(companyInfo.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{companyInfo.tradeName || companyInfo.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            Empresa
                          </p>
                        </div>
                      </div>
                      
                      {companyInfo.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {companyInfo.description}
                        </p>
                      )}

                      <div className="space-y-2">
                        {companyInfo.website && (
                          <a 
                            href={companyInfo.website.startsWith('http') ? companyInfo.website : `https://${companyInfo.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                            data-testid="link-company-website"
                          >
                            <Globe className="h-4 w-4" />
                            {companyInfo.website.replace(/^https?:\/\//, '')}
                          </a>
                        )}
                        {companyInfo.instagram && (
                          <a 
                            href={`https://instagram.com/${companyInfo.instagram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                            data-testid="link-company-instagram"
                          >
                            <Instagram className="h-4 w-4" />
                            @{companyInfo.instagram.replace('@', '')}
                          </a>
                        )}
                      </div>
                      
                      <Link href={`/company/${companyInfo.id}/profile`}>
                        <Button variant="outline" className="w-full" data-testid="button-view-company-profile">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Ver Perfil da Empresa
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Card className={isDeadlineClose ? "border-amber-200 dark:border-amber-800" : ""}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className={`h-4 w-4 ${isDeadlineClose ? 'text-amber-500' : 'text-muted-foreground'}`} />
                      Prazo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{format(deadlineDate, "dd 'de' MMMM", { locale: ptBR })}</p>
                    <p className={`text-sm mt-1 ${isDeadlineClose ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-muted-foreground'}`}>
                      {formatDistanceToNow(deadlineDate, { addSuffix: true, locale: ptBR })}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <h3 className="font-semibold">Compartilhe</h3>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={handleCopyLink}
                      data-testid="button-copy-link"
                    >
                      {isCopied ? (
                        <>
                          <Check className="mr-2 h-4 w-4 text-green-600" /> Link Copiado!
                        </>
                      ) : (
                        <>
                          <Share2 className="mr-2 h-4 w-4" /> Copiar Link
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="briefing" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  Briefing da Campanha
                </CardTitle>
                <CardDescription>
                  Informações detalhadas sobre o que a empresa espera de você
                </CardDescription>
              </CardHeader>
              <CardContent>
                {campaign.briefingText ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap leading-relaxed">{campaign.briefingText}</p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Briefing ainda não disponível</p>
                    <p className="text-muted-foreground/70 text-sm mt-1">
                      {isAccepted 
                        ? "A empresa ainda não adicionou o briefing detalhado." 
                        : "O briefing completo estará disponível após sua aprovação."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {campaign.targetNiche && campaign.targetNiche.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Nichos Alvo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {campaign.targetNiche.map((niche, i) => (
                      <Badge key={i} variant="secondary">{niche}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="references" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5 text-pink-500" />
                  Materiais de Referência
                </CardTitle>
                <CardDescription>
                  Links e materiais que podem ajudar você a criar o conteúdo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {briefingMaterials.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {briefingMaterials.map((material, i) => (
                      <a
                        key={i}
                        href={material}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
                      >
                        <div className="h-10 w-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400">
                          <Link2 className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                            Material {i + 1}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{material}</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Image className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Nenhum material de referência</p>
                    <p className="text-muted-foreground/70 text-sm mt-1">
                      {isAccepted 
                        ? "A empresa ainda não adicionou materiais de referência." 
                        : "Os materiais estarão disponíveis após sua aprovação."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="deliverables" className="space-y-6">
          {isAccepted && myDeliverables.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-emerald-500" />
                        Suas Entregas
                      </CardTitle>
                      <CardDescription>Conteúdos que você já enviou para esta campanha</CardDescription>
                    </div>
                    <Link href={`/campaign/${campaignId}/workspace`}>
                      <Button>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Ir para Workspace
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {myDeliverables.map((deliverable) => (
                      <div
                        key={deliverable.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                            {deliverable.thumbnailUrl ? (
                              <img src={deliverable.thumbnailUrl} alt="" className="h-full w-full object-cover rounded-lg" />
                            ) : (
                              getDeliverableIcon(deliverable.type)
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{deliverable.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {deliverable.submittedAt 
                                ? `Enviado ${formatDistanceToNow(new Date(deliverable.submittedAt), { addSuffix: true, locale: ptBR })}`
                                : 'Não enviado'
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {deliverable.rating && (
                            <div className="flex items-center gap-1 text-amber-500">
                              <Star className="h-4 w-4 fill-current" />
                              <span className="font-medium">{deliverable.rating}</span>
                            </div>
                          )}
                          {getDeliverableStatusBadge(deliverable.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: isAccepted && myDeliverables.length > 0 ? 0.1 : 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-emerald-500" />
                  Entregas Esperadas
                </CardTitle>
                <CardDescription>O que você precisará entregar nesta campanha</CardDescription>
              </CardHeader>
              <CardContent>
                {deliverables.length > 0 ? (
                  <div className="space-y-3">
                    {deliverables.filter(d => d && d.trim()).map((deliverable, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-4 rounded-lg border"
                      >
                        <div className="h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                          {getDeliverableIcon(deliverable)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{deliverable.trim()}</p>
                        </div>
                        {isAccepted ? (
                          <Badge variant="outline">Pendente</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-muted-foreground">Após aprovação</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Entregas serão definidas pela empresa</p>
                    <p className="text-muted-foreground/70 text-sm mt-1">
                      {isAccepted 
                        ? "Acesse o workspace para ver as entregas definidas." 
                        : "As entregas específicas serão visíveis após sua aprovação."}
                    </p>
                  </div>
                )}

                {isAccepted && myDeliverables.length === 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <Link href={`/campaign/${campaignId}/workspace`}>
                      <Button className="w-full">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Acessar Workspace para Enviar Entregas
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={showUnsubscribeDialog} onOpenChange={setShowUnsubscribeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deseja realmente cancelar sua inscrição?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao cancelar, sua candidatura será removida e a campanha voltará a aparecer no feed de oportunidades. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-unsubscribe-dialog" disabled={unsubscribeMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => myApplication && unsubscribeMutation.mutate(myApplication.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-unsubscribe-dialog"
              disabled={unsubscribeMutation.isPending}
            >
              {unsubscribeMutation.isPending ? 'Removendo...' : 'Cancelar inscrição'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
