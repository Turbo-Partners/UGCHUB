import { useState, useEffect, useRef, useCallback } from 'react';
import { useRoute, useLocation, useSearch } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useMarketplace } from '@/lib/provider';
import type { Application, Campaign, Deliverable, UgcAsset } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar, 
  DollarSign, 
  Building2, 
  ArrowLeft,
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  ChevronRight,
  Loader2,
  X,
  Image,
  Video,
  File,
  Crown,
  Ticket,
  Trophy,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { queryClient } from '@/lib/queryClient';
import { Chat } from '@/components/Chat';
import { DeliverableComments } from '@/components/DeliverableComments';
import { Link } from 'wouter';
import { CreatorCampaignRanking } from '@/components/gamification/CreatorCampaignRanking';

type ApplicationWithCampaign = Application & { campaign: Campaign; deliverables: Deliverable[] };

interface BrandContext {
  brandId: number;
  brandName: string;
  brandLogo: string | null;
  tier: { name: string; color: string; icon: string } | null;
  points: number;
  couponCode: string | null;
  isMember: boolean;
}

const WORKFLOW_STATUSES = [
  { key: 'aceito', label: 'Aceito' },
  { key: 'aguardando_produto', label: 'Aguardando Produto' },
  { key: 'producao', label: 'Produção' },
  { key: 'revisao', label: 'Revisão' },
  { key: 'entregue', label: 'Entregue' },
];

export default function CampaignWorkspace() {
  const [_, navigate] = useLocation();
  const [matchWorkspace, paramsWorkspace] = useRoute('/campaign/:id/workspace');
  const [matchBrandCampaign, paramsBrandCampaign] = useRoute('/brand/:brandId/campaign/:campaignId');
  const searchString = useSearch();
  const { user } = useMarketplace();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('info');
  const [deliverableDescription, setDeliverableDescription] = useState('');
  const [deliverableUrl, setDeliverableUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const match = matchWorkspace || matchBrandCampaign;
  const campaignId = paramsWorkspace?.id ? parseInt(paramsWorkspace.id) : 
                     paramsBrandCampaign?.campaignId ? parseInt(paramsBrandCampaign.campaignId) : null;
  const brandId = paramsBrandCampaign?.brandId ? parseInt(paramsBrandCampaign.brandId) : null;

  // Read tab from URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const tab = params.get('tab');
    if (tab && ['info', 'briefing', 'deliverables', 'messages'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchString]);

  // Fetch the active campaign application
  const { data: activeCampaigns = [] } = useQuery<ApplicationWithCampaign[]>({
    queryKey: ['/api/applications/active'],
    enabled: !!user && user.role === 'creator',
  });

  const application = activeCampaigns.find(app => app.campaign?.id === campaignId);
  const campaign = application?.campaign;

  const companyId = campaign?.companyId;
  const { data: brandContext } = useQuery<BrandContext>({
    queryKey: [`/api/creator/brand/${companyId}/context`],
    queryFn: async () => {
      const res = await fetch(`/api/creator/brand/${companyId}/context`, { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!companyId && !!user && user.role === 'creator',
  });

  // Update workflow status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!application) throw new Error('No application found');
      const res = await fetch(`/api/applications/${application.id}/workflow-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ workflowStatus: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/applications/active'] });
      toast({
        title: 'Status atualizado',
        description: 'O status da campanha foi atualizado com sucesso.',
      });
    },
  });

  // Fetch UGC assets for this campaign
  const { data: ugcAssets = [], refetch: refetchAssets } = useQuery<UgcAsset[]>({
    queryKey: [`/api/creator/campaigns/${campaignId}/assets`],
    queryFn: async () => {
      const res = await fetch(`/api/creator/campaigns/${campaignId}/assets`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!campaignId,
  });

  // Add UGC asset mutation
  const addAssetMutation = useMutation({
    mutationFn: async (data: { type: string; url: string; title: string; description?: string; tags?: string[] }) => {
      const res = await fetch(`/api/creator/campaigns/${campaignId}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add asset');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/creator/campaigns/${campaignId}/assets`] });
      setDeliverableDescription('');
      setDeliverableUrl('');
      toast({
        title: 'Conteúdo enviado!',
        description: 'O conteúdo foi adicionado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const backUrl = brandId ? `/brand/${brandId}` : '/active-campaigns';
  const backLabel = brandId ? 'Voltar para Marca' : 'Voltar para Campanhas Ativas';

  // All useCallback hooks must be called before early return to satisfy Rules of Hooks
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        toast({
          title: 'Arquivo muito grande',
          description: 'O tamanho máximo permitido é 100MB.',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
    }
  }, [toast]);

  if (!match || !campaignId || !application || !campaign) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-xl font-semibold mb-2">Campanha não encontrada</h2>
        <p className="text-muted-foreground mb-4">Esta campanha não existe ou você não tem acesso a ela.</p>
        <Button onClick={() => navigate(backUrl)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {backLabel}
        </Button>
      </div>
    );
  }

  const currentStatusIndex = WORKFLOW_STATUSES.findIndex(s => s.key === application.workflowStatus);
  
  const canAdvance = currentStatusIndex >= 0 && currentStatusIndex < WORKFLOW_STATUSES.length - 1;

  const handleAdvanceStatus = () => {
    if (canAdvance) {
      const nextStatus = WORKFLOW_STATUSES[currentStatusIndex + 1];
      updateStatusMutation.mutate(nextStatus.key);
    }
  };

  const handleAddDeliverable = () => {
    if (!deliverableUrl) {
      toast({
        title: 'Erro',
        description: 'Por favor, forneça um URL válido.',
        variant: 'destructive',
      });
      return;
    }

    // Detect content type from URL
    const url = deliverableUrl.toLowerCase();
    let type: 'video' | 'image' | 'doc' | 'link' = 'link';
    if (url.match(/\.(mp4|mov|avi|webm|mkv)$/)) type = 'video';
    else if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) type = 'image';
    else if (url.match(/\.(pdf|doc|docx|txt|xls|xlsx)$/)) type = 'doc';
    
    const title = deliverableUrl.split('/').pop() || 'Conteúdo';
    addAssetMutation.mutate({
      type,
      url: deliverableUrl,
      title,
      description: deliverableDescription || undefined,
    });
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !application) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('description', deliverableDescription || '');

    try {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      await new Promise<UgcAsset>((resolve, reject) => {
        // Use the new UGC upload endpoint that creates the asset directly
        xhr.open('POST', `/api/creator/campaigns/${campaignId}/assets/upload`);
        xhr.withCredentials = true;
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch {
              reject(new Error('Invalid response from server'));
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.error || 'Upload failed'));
            } catch {
              reject(new Error(xhr.responseText || 'Upload failed'));
            }
          }
        };
        
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(formData);
      });

      // Invalidate queries to refresh the assets list
      queryClient.invalidateQueries({ queryKey: [`/api/creator/campaigns/${campaignId}/assets`] });
      setSelectedFile(null);
      setDeliverableDescription('');
      setUploadProgress(0);
      toast({
        title: 'Conteúdo enviado!',
        description: 'O arquivo foi adicionado com sucesso.',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Erro no upload',
        description: error instanceof Error ? error.message : 'Não foi possível enviar o arquivo. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        toast({
          title: 'Arquivo muito grande',
          description: 'O tamanho máximo permitido é 100MB.',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-8 w-8 text-blue-500" />;
    if (file.type.startsWith('video/')) return <Video className="h-8 w-8 text-purple-500" />;
    return <File className="h-8 w-8 text-gray-500" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(backUrl)}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading tracking-tight">{campaign.title}</h1>
          <p className="text-muted-foreground">{campaign.description}</p>
          <Link href={`/company/${campaign.companyId}/profile`}>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer mt-2" data-testid="link-company-profile">
              <Building2 className="h-4 w-4" />
              <span>Ver perfil da empresa</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Brand Context Card */}
      {brandContext && brandContext.isMember && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20" data-testid="brand-context-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                  {brandContext.brandLogo ? (
                    <AvatarImage src={brandContext.brandLogo} alt={brandContext.brandName} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10">
                    <Building2 className="h-6 w-6 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{brandContext.brandName}</span>
                    {brandContext.tier && (
                      <Badge 
                        variant="outline" 
                        className="gap-1"
                        style={{ borderColor: brandContext.tier.color, color: brandContext.tier.color }}
                      >
                        <Crown className="h-3 w-3" />
                        {brandContext.tier.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    {brandContext.points > 0 && (
                      <span className="flex items-center gap-1">
                        <Trophy className="h-3.5 w-3.5 text-amber-500" />
                        {brandContext.points} pts
                      </span>
                    )}
                    {brandContext.couponCode && (
                      <span className="flex items-center gap-1 font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        <Ticket className="h-3 w-3" />
                        {brandContext.couponCode}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Link href={`/brand/${brandContext.brandId}`}>
                <Button variant="outline" size="sm" className="gap-1" data-testid="button-view-brand">
                  Ver marca
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Status do Projeto</CardTitle>
          <CardDescription>Acompanhe o progresso da campanha</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {WORKFLOW_STATUSES.map((status, index) => {
              const isActive = index === currentStatusIndex;
              const isCompleted = index < currentStatusIndex;
              
              return (
                <div key={status.key} className="flex items-center">
                  <div className="flex flex-col items-center min-w-[80px] sm:min-w-[120px]">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                      ${isActive ? 'border-primary bg-primary text-primary-foreground' : 
                        isCompleted ? 'border-green-500 bg-green-500 text-white' : 
                        'border-muted-foreground/30 bg-background'}
                    `}>
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : isActive ? (
                        <Clock className="h-5 w-5" />
                      ) : (
                        <span className="text-xs font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <span className={`mt-2 text-xs text-center ${isActive ? 'font-semibold' : ''}`}>
                      {status.label}
                    </span>
                  </div>
                  {index < WORKFLOW_STATUSES.length - 1 && (
                    <ChevronRight className="h-5 w-5 text-muted-foreground/30 mx-1 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
          
          {canAdvance && currentStatusIndex < WORKFLOW_STATUSES.length - 2 && (
            <div className="mt-4 pt-4 border-t">
              <Button 
                onClick={handleAdvanceStatus}
                disabled={updateStatusMutation.isPending}
                data-testid="button-advance-status"
              >
                Avançar para: {WORKFLOW_STATUSES[currentStatusIndex + 1].label}
              </Button>
            </div>
          )}
          
          {application.workflowStatus === 'entregue' && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 p-4 bg-green-50 text-green-800 rounded-lg border border-green-200">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Projeto Concluído!</p>
                  <p className="text-xs">Parabéns pela entrega.</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="briefing">Briefing</TabsTrigger>
          <TabsTrigger value="deliverables">Conteúdos</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="messages">Mensagens</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Campanha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Orçamento</p>
                    <p className="font-semibold">{campaign.budget}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Prazo</p>
                    <p className="font-semibold">{format(new Date(campaign.deadline), 'dd/MM/yyyy', { locale: ptBR })}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Requisitos</p>
                <p className="text-sm whitespace-pre-wrap">{campaign.requirements}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="briefing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Briefing da Empresa</CardTitle>
              <CardDescription>Direcionamentos e materiais de apoio fornecidos pela empresa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {campaign.briefingText ? (
                <div>
                  <p className="text-sm font-medium mb-2">Instruções:</p>
                  <p className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-lg">{campaign.briefingText}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">A empresa ainda não forneceu um briefing para esta campanha.</p>
              )}

              {campaign.briefingMaterials && campaign.briefingMaterials.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Materiais de Apoio:</p>
                  <div className="space-y-2">
                    {campaign.briefingMaterials.map((url, index) => (
                      <a 
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm truncate">{url}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deliverables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seus Conteúdos</CardTitle>
              <CardDescription>Adicione os arquivos e materiais produzidos para esta campanha</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new deliverable */}
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Adicionar Novo Entregável</h4>
                  <div className="flex gap-2">
                    <Button
                      variant={uploadMode === 'file' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setUploadMode('file')}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Upload
                    </Button>
                    <Button
                      variant={uploadMode === 'url' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setUploadMode('url')}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      URL
                    </Button>
                  </div>
                </div>

                {uploadMode === 'file' ? (
                  <div className="space-y-3">
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*,video/*,.pdf,.zip"
                      onChange={handleFileSelect}
                    />
                    
                    {/* Drag & Drop Area */}
                    {!selectedFile ? (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
                          ${isDragOver 
                            ? 'border-primary bg-primary/10' 
                            : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50'
                          }
                        `}
                        data-testid="dropzone"
                      >
                        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm font-medium">
                          Arraste e solte seu arquivo aqui
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          ou clique para selecionar
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Formatos: Imagens, Vídeos, PDF (máx. 100MB)
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* File Preview */}
                        <div className="flex items-center gap-4 p-4 border rounded-lg bg-card">
                          {getFileIcon(selectedFile)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Arquivo'}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedFile(null)}
                            disabled={isUploading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Image/Video Preview */}
                        {selectedFile.type.startsWith('image/') && (
                          <div className="relative rounded-lg overflow-hidden bg-muted aspect-video flex items-center justify-center">
                            <img
                              src={URL.createObjectURL(selectedFile)}
                              alt="Preview"
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                        )}
                        {selectedFile.type.startsWith('video/') && (
                          <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                            <video
                              src={URL.createObjectURL(selectedFile)}
                              controls
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <Textarea
                      placeholder="Descrição do arquivo (opcional)"
                      value={deliverableDescription}
                      onChange={(e) => setDeliverableDescription(e.target.value)}
                      rows={2}
                      disabled={isUploading}
                      data-testid="input-deliverable-description-file"
                    />

                    {isUploading && (
                      <div className="space-y-2">
                        <Progress value={uploadProgress} className="h-2" />
                        <p className="text-xs text-center text-muted-foreground">
                          Enviando... {uploadProgress}%
                        </p>
                      </div>
                    )}

                    <Button 
                      onClick={handleFileUpload}
                      disabled={!selectedFile || isUploading}
                      className="w-full"
                      data-testid="button-upload-file"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Enviar Arquivo
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Input
                      placeholder="URL do arquivo (ex: link do Google Drive, Dropbox, etc.)"
                      value={deliverableUrl}
                      onChange={(e) => setDeliverableUrl(e.target.value)}
                      data-testid="input-deliverable-url"
                    />
                    <Textarea
                      placeholder="Descrição (opcional)"
                      value={deliverableDescription}
                      onChange={(e) => setDeliverableDescription(e.target.value)}
                      rows={2}
                      data-testid="input-deliverable-description"
                    />
                    <Button 
                      onClick={handleAddDeliverable}
                      disabled={addAssetMutation.isPending || !deliverableUrl}
                      className="w-full"
                      data-testid="button-add-deliverable"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Adicionar Conteúdo
                    </Button>
                  </div>
                )}
              </div>

              {/* UGC Assets list */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Conteúdos Enviados</h4>
                {ugcAssets && ugcAssets.length > 0 ? (
                  <div className="space-y-4">
                    {ugcAssets.map((asset) => (
                      <div 
                        key={asset.id}
                        className="space-y-3"
                        data-testid={`asset-${asset.id}`}
                      >
                        <div className="flex items-start gap-3 p-3 border rounded-lg bg-card">
                          {asset.type === 'video' ? (
                            <Video className="h-5 w-5 text-purple-500 mt-0.5" />
                          ) : asset.type === 'image' ? (
                            <Image className="h-5 w-5 text-blue-500 mt-0.5" />
                          ) : (
                            <FileText className="h-5 w-5 text-primary mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <a 
                                href={asset.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium hover:underline truncate"
                              >
                                {asset.title}
                              </a>
                              <Badge 
                                variant={
                                  asset.status === 'approved' ? 'default' :
                                  asset.status === 'rejected' ? 'destructive' :
                                  asset.status === 'needs_changes' ? 'secondary' :
                                  'outline'
                                }
                                className="text-xs"
                              >
                                {asset.status === 'submitted' ? 'Enviado' :
                                 asset.status === 'approved' ? 'Aprovado' :
                                 asset.status === 'rejected' ? 'Rejeitado' :
                                 'Precisa de Alterações'}
                              </Badge>
                            </div>
                            {asset.description && (
                              <p className="text-xs text-muted-foreground mt-1">{asset.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {asset.createdAt && format(new Date(asset.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum conteúdo enviado ainda.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ranking" className="space-y-4">
          {user && campaignId && (
            <CreatorCampaignRanking campaignId={campaignId} creatorId={user.id} />
          )}
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversa com a Empresa</CardTitle>
              <CardDescription>
                Alinhe detalhes da campanha e tire dúvidas diretamente com a empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user && <Chat applicationId={application.id} currentUserId={user.id} />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

