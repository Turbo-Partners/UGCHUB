import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { apiRequest, getQueryFn } from '@/lib/queryClient';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Search,
  Send,
  Package,
  ClipboardCheck,
  AlertTriangle,
  Loader2,
  Mail,
  Truck,
  Check,
  X,
  Clock,
  MapPin,
  ChevronRight,
  Eye,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';

interface OperationsSummary {
  discoveryCount: number;
  pendingInvites: number;
  seedingPending: number;
  seedingAddressNeeded: number;
  reviewPending: number;
  overdueCount: number;
}

export default function BrandOperations() {
  const params = useParams<{ brandId: string }>();
  const brandId = parseInt(params.brandId || '0');
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('reachout');
  const [markSentDialog, setMarkSentDialog] = useState<{ open: boolean; shipmentId: number | null }>({ open: false, shipmentId: null });
  const [trackingCode, setTrackingCode] = useState('');
  const [carrier, setCarrier] = useState('');

  const { data: summary, isLoading: summaryLoading } = useQuery<OperationsSummary>({
    queryKey: [`/api/company/brand/${brandId}/operations/summary`],
    enabled: !!brandId,
  });

  const { data: discoveryQueue = [], isLoading: discoveryLoading } = useQuery<any[]>({
    queryKey: [`/api/company/brand/${brandId}/operations/discovery`],
    enabled: !!brandId && activeTab === 'reachout',
  });

  const { data: invites = [], isLoading: invitesLoading } = useQuery<any[]>({
    queryKey: [`/api/company/brand/${brandId}/operations/invites`],
    enabled: !!brandId && activeTab === 'invites',
  });

  const { data: seeding = [], isLoading: seedingLoading } = useQuery<any[]>({
    queryKey: [`/api/company/brand/${brandId}/seeding`],
    enabled: !!brandId && activeTab === 'seeding',
  });

  const { data: reviewQueue = [], isLoading: reviewLoading } = useQuery<any[]>({
    queryKey: [`/api/company/brand/${brandId}/review-queue`],
    enabled: !!brandId && activeTab === 'review',
  });

  const { data: pendencias, isLoading: pendenciasLoading } = useQuery<{
    noResponse: any[];
    overdueDeliverables: any[];
  }>({
    queryKey: [`/api/company/brand/${brandId}/pendencias`],
    enabled: !!brandId && activeTab === 'pendencias',
  });

  const markSentMutation = useMutation({
    mutationFn: async ({ shipmentId, trackingCode, carrier }: { shipmentId: number; trackingCode: string; carrier: string }) => {
      const res = await apiRequest('POST', `/api/company/brand/${brandId}/seeding/${shipmentId}/mark-sent`, { trackingCode, carrier });
      return res.json();
    },
    onSuccess: () => {
      toast.success('Envio marcado como enviado!');
      queryClient.invalidateQueries({ queryKey: [`/api/company/brand/${brandId}/seeding`] });
      queryClient.invalidateQueries({ queryKey: [`/api/company/brand/${brandId}/operations/summary`] });
      setMarkSentDialog({ open: false, shipmentId: null });
      setTrackingCode('');
      setCarrier('');
    },
    onError: () => toast.error('Erro ao marcar envio'),
  });

  const markDeliveredMutation = useMutation({
    mutationFn: async (shipmentId: number) => {
      const res = await apiRequest('POST', `/api/company/brand/${brandId}/seeding/${shipmentId}/mark-delivered`);
      return res.json();
    },
    onSuccess: () => {
      toast.success('Envio marcado como entregue!');
      queryClient.invalidateQueries({ queryKey: [`/api/company/brand/${brandId}/seeding`] });
      queryClient.invalidateQueries({ queryKey: [`/api/company/brand/${brandId}/operations/summary`] });
    },
    onError: () => toast.error('Erro ao marcar entrega'),
  });

  const approveDeliverableMutation = useMutation({
    mutationFn: async (deliverableId: number) => {
      const res = await apiRequest('POST', `/api/company/deliverables/${deliverableId}/approve`);
      return res.json();
    },
    onSuccess: () => {
      toast.success('Entregável aprovado!');
      queryClient.invalidateQueries({ queryKey: [`/api/company/brand/${brandId}/review-queue`] });
      queryClient.invalidateQueries({ queryKey: [`/api/company/brand/${brandId}/operations/summary`] });
    },
    onError: () => toast.error('Erro ao aprovar entregável'),
  });

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'Pendente', variant: 'secondary' },
      address_needed: { label: 'Endereço Pendente', variant: 'destructive' },
      preparing: { label: 'Preparando', variant: 'outline' },
      sent: { label: 'Enviado', variant: 'default' },
      delivered: { label: 'Entregue', variant: 'default' },
      problem: { label: 'Problema', variant: 'destructive' },
    };
    const badge = badges[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={badge.variant} data-testid={`badge-status-${status}`}>{badge.label}</Badge>;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Operações</h1>
          <p className="text-muted-foreground">
            Gerencie toda a operação da comunidade em um único lugar
          </p>
        </div>

        {summaryLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setActiveTab('reachout')} data-testid="card-summary-discovery">
              <CardContent className="p-4 text-center">
                <Search className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{summary?.discoveryCount || 0}</div>
                <div className="text-xs text-muted-foreground">Descobertos</div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setActiveTab('invites')} data-testid="card-summary-invites">
              <CardContent className="p-4 text-center">
                <Mail className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold">{summary?.pendingInvites || 0}</div>
                <div className="text-xs text-muted-foreground">Convites Pendentes</div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setActiveTab('seeding')} data-testid="card-summary-seeding">
              <CardContent className="p-4 text-center">
                <Package className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                <div className="text-2xl font-bold">{(summary?.seedingPending || 0) + (summary?.seedingAddressNeeded || 0)}</div>
                <div className="text-xs text-muted-foreground">Envios Pendentes</div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setActiveTab('review')} data-testid="card-summary-review">
              <CardContent className="p-4 text-center">
                <ClipboardCheck className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{summary?.reviewPending || 0}</div>
                <div className="text-xs text-muted-foreground">Aguardando Revisão</div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setActiveTab('pendencias')} data-testid="card-summary-pendencias">
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-500" />
                <div className="text-2xl font-bold">{summary?.overdueCount || 0}</div>
                <div className="text-xs text-muted-foreground">Pendências</div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setActiveTab('seeding')} data-testid="card-summary-address">
              <CardContent className="p-4 text-center">
                <MapPin className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl font-bold">{summary?.seedingAddressNeeded || 0}</div>
                <div className="text-xs text-muted-foreground">Sem Endereço</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6" data-testid="tabs-operations">
            <TabsTrigger value="reachout" data-testid="tab-reachout">
              <Search className="h-4 w-4 mr-2" />
              Reach-out
            </TabsTrigger>
            <TabsTrigger value="invites" data-testid="tab-invites">
              <Mail className="h-4 w-4 mr-2" />
              Convites
            </TabsTrigger>
            <TabsTrigger value="seeding" data-testid="tab-seeding">
              <Package className="h-4 w-4 mr-2" />
              Seeding
            </TabsTrigger>
            <TabsTrigger value="review" data-testid="tab-review">
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Review Queue
            </TabsTrigger>
            <TabsTrigger value="pendencias" data-testid="tab-pendencias">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Pendências
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reachout">
            <Card>
              <CardHeader>
                <CardTitle>Discovery Queue</CardTitle>
                <CardDescription>Creators descobertos aguardando contato</CardDescription>
              </CardHeader>
              <CardContent>
                {discoveryLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : discoveryQueue.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum creator descoberto no momento</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {discoveryQueue.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`discovery-item-${item.id}`}>
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={item.creator?.profilePictureUrl} />
                            <AvatarFallback>{item.creator?.fullName?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{item.creator?.fullName}</div>
                            <div className="text-sm text-muted-foreground">@{item.creator?.instagramHandle}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" data-testid={`btn-view-profile-${item.id}`}>
                            <Eye className="h-4 w-4 mr-1" /> Ver Perfil
                          </Button>
                          <Button size="sm" data-testid={`btn-invite-${item.id}`}>
                            <Send className="h-4 w-4 mr-1" /> Convidar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invites">
            <Card>
              <CardHeader>
                <CardTitle>Convites Pendentes</CardTitle>
                <CardDescription>Convites enviados aguardando resposta</CardDescription>
              </CardHeader>
              <CardContent>
                {invitesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : invites.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum convite pendente</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invites.map((invite) => (
                      <div key={invite.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`invite-item-${invite.id}`}>
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={invite.creator?.profilePictureUrl} />
                            <AvatarFallback>{invite.creator?.fullName?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{invite.creator?.fullName}</div>
                            <div className="text-sm text-muted-foreground">
                              Campanha: {invite.campaign?.title}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Enviado {formatDistanceToNow(new Date(invite.createdAt), { addSuffix: true, locale: ptBR })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" /> Aguardando
                          </Badge>
                          <Button variant="ghost" size="sm" data-testid={`btn-resend-invite-${invite.id}`}>
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seeding">
            <Card>
              <CardHeader>
                <CardTitle>Envios de Produtos (Seeding)</CardTitle>
                <CardDescription>Acompanhe o envio de produtos para creators</CardDescription>
              </CardHeader>
              <CardContent>
                {seedingLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : seeding.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum envio cadastrado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {seeding.map((shipment) => (
                      <div key={shipment.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`seeding-item-${shipment.id}`}>
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={shipment.creator?.profilePictureUrl} />
                            <AvatarFallback>{shipment.creator?.fullName?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{shipment.creator?.fullName}</div>
                            {shipment.campaign && (
                              <div className="text-sm text-muted-foreground">
                                Campanha: {shipment.campaign.title}
                              </div>
                            )}
                            {shipment.products && (
                              <div className="text-sm text-muted-foreground">
                                Produtos: {shipment.products}
                              </div>
                            )}
                            {shipment.trackingCode && (
                              <div className="text-xs text-muted-foreground">
                                Rastreio: {shipment.trackingCode} ({shipment.carrier})
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(shipment.status)}
                          {shipment.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => setMarkSentDialog({ open: true, shipmentId: shipment.id })}
                              data-testid={`btn-mark-sent-${shipment.id}`}
                            >
                              <Truck className="h-4 w-4 mr-1" /> Marcar Enviado
                            </Button>
                          )}
                          {shipment.status === 'sent' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markDeliveredMutation.mutate(shipment.id)}
                              disabled={markDeliveredMutation.isPending}
                              data-testid={`btn-mark-delivered-${shipment.id}`}
                            >
                              <Check className="h-4 w-4 mr-1" /> Confirmar Entrega
                            </Button>
                          )}
                          {shipment.status === 'address_needed' && (
                            <Badge variant="destructive">
                              <MapPin className="h-3 w-3 mr-1" /> Solicitar Endereço
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="review">
            <Card>
              <CardHeader>
                <CardTitle>Review Queue</CardTitle>
                <CardDescription>Entregáveis aguardando revisão</CardDescription>
              </CardHeader>
              <CardContent>
                {reviewLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : reviewQueue.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum entregável aguardando revisão</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviewQueue.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`review-item-${item.id}`}>
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={item.creator?.profilePictureUrl} />
                            <AvatarFallback>{item.creator?.fullName?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{item.creator?.fullName}</div>
                            <div className="text-sm text-muted-foreground">
                              Campanha: {item.campaign?.title}
                            </div>
                            <div className="text-sm">
                              <Badge variant="outline">{item.type}</Badge>
                              {item.title && <span className="ml-2">{item.title}</span>}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Enviado {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: ptBR })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.contentUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={item.contentUrl} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-4 w-4 mr-1" /> Ver Conteúdo
                              </a>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => approveDeliverableMutation.mutate(item.id)}
                            disabled={approveDeliverableMutation.isPending}
                            data-testid={`btn-approve-${item.id}`}
                          >
                            <Check className="h-4 w-4 mr-1" /> Aprovar
                          </Button>
                          <Button variant="outline" size="sm" data-testid={`btn-request-changes-${item.id}`}>
                            <MessageSquare className="h-4 w-4 mr-1" /> Solicitar Alteração
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pendencias">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    Sem Resposta (3+ dias)
                  </CardTitle>
                  <CardDescription>Creators aceitos que não iniciaram trabalho</CardDescription>
                </CardHeader>
                <CardContent>
                  {pendenciasLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (pendencias?.noResponse?.length || 0) === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Check className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
                      <p>Todos os creators estão respondendo!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendencias?.noResponse.map((app) => (
                        <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg border-yellow-200 bg-yellow-50" data-testid={`pendencia-noresponse-${app.id}`}>
                          <div className="flex items-center gap-4">
                            <Avatar>
                              <AvatarImage src={app.creator?.profilePictureUrl} />
                              <AvatarFallback>{app.creator?.fullName?.[0] || '?'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{app.creator?.fullName}</div>
                              <div className="text-sm text-muted-foreground">
                                Campanha: {app.campaign?.title}
                              </div>
                              <div className="text-xs text-yellow-600">
                                Aceito {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true, locale: ptBR })}
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" data-testid={`btn-contact-${app.id}`}>
                            <MessageSquare className="h-4 w-4 mr-1" /> Contatar
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Entregáveis Atrasados
                  </CardTitle>
                  <CardDescription>Entregáveis com prazo vencido</CardDescription>
                </CardHeader>
                <CardContent>
                  {pendenciasLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (pendencias?.overdueDeliverables?.length || 0) === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Check className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
                      <p>Nenhum entregável atrasado!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendencias?.overdueDeliverables.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg border-red-200 bg-red-50" data-testid={`pendencia-overdue-${item.id}`}>
                          <div className="flex items-center gap-4">
                            <Avatar>
                              <AvatarImage src={item.creator?.profilePictureUrl} />
                              <AvatarFallback>{item.creator?.fullName?.[0] || '?'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{item.creator?.fullName}</div>
                              <div className="text-sm text-muted-foreground">
                                Campanha: {item.campaign?.title}
                              </div>
                              <div className="text-sm">
                                <Badge variant="outline">{item.type}</Badge>
                              </div>
                              <div className="text-xs text-red-600">
                                Prazo: {format(new Date(item.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" data-testid={`btn-remind-${item.id}`}>
                            <MessageSquare className="h-4 w-4 mr-1" /> Lembrar Creator
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={markSentDialog.open} onOpenChange={(open) => setMarkSentDialog({ open, shipmentId: markSentDialog.shipmentId })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Marcar como Enviado</DialogTitle>
              <DialogDescription>Informe os dados de rastreamento do envio</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Código de Rastreamento</label>
                <Input
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  placeholder="Ex: BR123456789BR"
                  data-testid="input-tracking-code"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Transportadora</label>
                <Input
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="Ex: Correios, Jadlog"
                  data-testid="input-carrier"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMarkSentDialog({ open: false, shipmentId: null })}>
                Cancelar
              </Button>
              <Button
                onClick={() => markSentDialog.shipmentId && markSentMutation.mutate({
                  shipmentId: markSentDialog.shipmentId,
                  trackingCode,
                  carrier
                })}
                disabled={markSentMutation.isPending}
                data-testid="btn-confirm-sent"
              >
                {markSentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Truck className="h-4 w-4 mr-2" />}
                Confirmar Envio
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
