import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Trophy, Gift, DollarSign, Package, Plus, Trash2, Loader2, Settings2, Target, Medal, Eye, Heart, MessageCircle, Clock, Shield, Flag } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface GamificationConfig {
  campaignId: number;
  enabled: boolean;
  mode: string;
  rulesJson: any;
  capsJson: any;
  windowStart?: string;
  windowEnd?: string;
}

interface CampaignPrize {
  id?: number;
  campaignId: number;
  type: string;
  rankPosition?: number;
  milestonePoints?: number;
  rewardKind: string;
  cashAmount?: number;
  productSku?: string;
  productDescription?: string;
  notes?: string;
}

interface PointsPerDeliverableType {
  post_feed?: number;
  reels?: number;
  stories?: number;
  tiktok?: number;
  youtube_video?: number;
  youtube_shorts?: number;
  twitter_post?: number;
  other?: number;
}

interface ScoringRules {
  pointsPerDeliverable: number;
  pointsPerDeliverableType?: PointsPerDeliverableType;
  pointsOnTimeBonus: number;
  pointsPer1kViews: number;
  pointsPerLike: number;
  pointsPerComment: number;
  pointsPerSale: number;
  qualityMultiplier: number;
  allowedPlatforms: ("instagram" | "tiktok")[];
}

const deliverableTypeLabels: Record<string, string> = {
  post_feed: "Post Feed",
  reels: "Reels",
  stories: "Stories",
  tiktok: "TikTok",
  youtube_video: "YouTube Video",
  youtube_shorts: "YouTube Shorts",
  twitter_post: "Twitter/X Post",
  other: "Outro"
};

interface ScoringCaps {
  maxPointsPerPost: number;
  maxPointsPerDay: number;
  maxPointsTotalCampaign: number;
  countingWindowDays: number;
}

interface CampaignGamificationEditorProps {
  campaignId: number;
}

export function CampaignGamificationEditor({ campaignId }: CampaignGamificationEditorProps) {
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState('ranking');
  const [prizes, setPrizes] = useState<CampaignPrize[]>([]);
  const [rules, setRules] = useState<ScoringRules>({
    pointsPerDeliverable: 100,
    pointsOnTimeBonus: 25,
    pointsPer1kViews: 1,
    pointsPerLike: 0.1,
    pointsPerComment: 1,
    pointsPerSale: 10,
    qualityMultiplier: 10,
    allowedPlatforms: ["instagram", "tiktok"],
  });
  const [caps, setCaps] = useState<ScoringCaps>({
    maxPointsPerPost: 1000,
    maxPointsPerDay: 5000,
    maxPointsTotalCampaign: 50000,
    countingWindowDays: 7,
  });

  const { data: gamificationData, isLoading } = useQuery<{ config: GamificationConfig; prizes: CampaignPrize[] }>({
    queryKey: [`/api/campaigns/${campaignId}/gamification`],
    enabled: !!campaignId,
  });

  const { data: scoringRules } = useQuery<ScoringRules>({
    queryKey: [`/api/campaigns/${campaignId}/scoring-rules`],
    enabled: !!campaignId,
  });

  const { data: scoringCaps } = useQuery<ScoringCaps>({
    queryKey: [`/api/campaigns/${campaignId}/scoring-caps`],
    enabled: !!campaignId,
  });

  useEffect(() => {
    if (gamificationData) {
      setEnabled(gamificationData.config.enabled);
      setMode(gamificationData.config.mode || 'ranking');
      setPrizes(gamificationData.prizes || []);
      if (gamificationData.config.rulesJson) {
        setRules(prev => ({ ...prev, ...gamificationData.config.rulesJson }));
      }
      if (gamificationData.config.capsJson) {
        setCaps(prev => ({ ...prev, ...gamificationData.config.capsJson }));
      }
    }
  }, [gamificationData]);

  useEffect(() => {
    if (scoringRules && !gamificationData?.config.rulesJson) {
      setRules(prev => ({ ...prev, ...scoringRules }));
    }
  }, [scoringRules, gamificationData]);

  useEffect(() => {
    if (scoringCaps && !gamificationData?.config.capsJson) {
      setCaps(prev => ({ ...prev, ...scoringCaps }));
    }
  }, [scoringCaps, gamificationData]);

  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/campaigns/${campaignId}/gamification`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          enabled,
          mode,
          rulesJson: rules,
          capsJson: caps,
        }),
      });
      if (!res.ok) throw new Error('Erro ao salvar configuração');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/gamification`] });
      toast.success('Configuração de gamificação salva!');
    },
    onError: () => {
      toast.error('Erro ao salvar configuração');
    },
  });

  const savePrizesMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/campaigns/${campaignId}/prizes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prizes }),
      });
      if (!res.ok) throw new Error('Erro ao salvar prêmios');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/gamification`] });
      toast.success('Prêmios salvos com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao salvar prêmios');
    },
  });

  const [closeRankingDialogOpen, setCloseRankingDialogOpen] = useState(false);

  const closeRankingMutation = useMutation({
    mutationFn: () => apiRequest('POST', `/api/campaigns/${campaignId}/close-ranking`),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      setCloseRankingDialogOpen(false);
      toast.success(`Ranking encerrado! ${data.winnersCreated} vencedores premiados.`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao encerrar ranking');
    },
  });

  const handleSaveAll = async () => {
    await saveConfigMutation.mutateAsync();
    if (prizes.length > 0) {
      await savePrizesMutation.mutateAsync();
    }
  };

  const addPrize = () => {
    const nextPosition = prizes.length + 1;
    setPrizes([...prizes, {
      campaignId,
      type: 'ranking_place',
      rankPosition: nextPosition,
      rewardKind: 'none',
    }]);
  };

  const removePrize = (index: number) => {
    setPrizes(prizes.filter((_, i) => i !== index));
  };

  const updatePrize = (index: number, updates: Partial<CampaignPrize>) => {
    setPrizes(prizes.map((p, i) => i === index ? { ...p, ...updates } : p));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
              <Trophy className="h-5 w-5 text-primary" />
              Recompensas e Gamificação
            </CardTitle>
            <CardDescription>
              Configure pontuação, ranking e prêmios para motivar os criadores
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="gamification-toggle" className="text-sm">
              Gamificação ativa
            </Label>
            <Switch
              id="gamification-toggle"
              checked={enabled}
              onCheckedChange={setEnabled}
              data-testid="switch-gamification-enabled"
            />
          </div>
        </div>
      </CardHeader>
      
      {enabled && (
        <CardContent className="space-y-6">
          <Accordion type="single" collapsible defaultValue="rules">
            <AccordionItem value="rules">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Regras de Pontuação
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-3">Entregáveis</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pointsPerDeliverable">Pontos padrão por entregável</Label>
                      <Input
                        id="pointsPerDeliverable"
                        type="number"
                        min={0}
                        value={rules.pointsPerDeliverable}
                        onChange={(e) => setRules({ ...rules, pointsPerDeliverable: parseInt(e.target.value) || 0 })}
                        data-testid="input-points-per-deliverable"
                      />
                      <p className="text-xs text-muted-foreground">Usado quando não há pontuação específica por tipo</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pointsOnTimeBonus">Bônus por entrega no prazo</Label>
                      <Input
                        id="pointsOnTimeBonus"
                        type="number"
                        min={0}
                        value={rules.pointsOnTimeBonus}
                        onChange={(e) => setRules({ ...rules, pointsOnTimeBonus: parseInt(e.target.value) || 0 })}
                        data-testid="input-points-ontime-bonus"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <h5 className="text-sm font-medium mb-3">Pontos por tipo de entregável (opcional)</h5>
                    <p className="text-xs text-muted-foreground mb-3">
                      Configure pontuação diferenciada por tipo de conteúdo. Deixe em branco para usar o valor padrão.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(deliverableTypeLabels).map(([key, label]) => (
                        <div key={key} className="space-y-1">
                          <Label htmlFor={`points-type-${key}`} className="text-xs">{label}</Label>
                          <Input
                            id={`points-type-${key}`}
                            type="number"
                            min={0}
                            placeholder={String(rules.pointsPerDeliverable)}
                            value={rules.pointsPerDeliverableType?.[key as keyof PointsPerDeliverableType] ?? ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                              setRules({
                                ...rules,
                                pointsPerDeliverableType: {
                                  ...rules.pointsPerDeliverableType,
                                  [key]: value
                                }
                              });
                            }}
                            className="h-8 text-sm"
                            data-testid={`input-points-type-${key}`}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Ex: Reels = 20pts, Stories = 5pts
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Performance de Posts
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pointsPer1kViews">Pontos por 1.000 views</Label>
                      <Input
                        id="pointsPer1kViews"
                        type="number"
                        min={0}
                        step={0.1}
                        value={rules.pointsPer1kViews}
                        onChange={(e) => setRules({ ...rules, pointsPer1kViews: parseFloat(e.target.value) || 0 })}
                        data-testid="input-points-per-1k-views"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pointsPerLike">Pontos por like</Label>
                      <Input
                        id="pointsPerLike"
                        type="number"
                        min={0}
                        step={0.01}
                        value={rules.pointsPerLike}
                        onChange={(e) => setRules({ ...rules, pointsPerLike: parseFloat(e.target.value) || 0 })}
                        data-testid="input-points-per-like"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pointsPerComment">Pontos por comentário</Label>
                      <Input
                        id="pointsPerComment"
                        type="number"
                        min={0}
                        step={0.1}
                        value={rules.pointsPerComment}
                        onChange={(e) => setRules({ ...rules, pointsPerComment: parseFloat(e.target.value) || 0 })}
                        data-testid="input-points-per-comment"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Pontos são calculados automaticamente a cada 15 minutos via social listening
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">Plataformas Permitidas</h4>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="platform-instagram"
                        checked={rules.allowedPlatforms?.includes("instagram") ?? true}
                        onCheckedChange={(checked) => {
                          const platforms = rules.allowedPlatforms || ["instagram", "tiktok"];
                          if (checked) {
                            setRules({ ...rules, allowedPlatforms: [...platforms.filter(p => p !== "instagram"), "instagram"] });
                          } else {
                            setRules({ ...rules, allowedPlatforms: platforms.filter(p => p !== "instagram") });
                          }
                        }}
                        data-testid="checkbox-platform-instagram"
                      />
                      <Label htmlFor="platform-instagram">Instagram</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="platform-tiktok"
                        checked={rules.allowedPlatforms?.includes("tiktok") ?? true}
                        onCheckedChange={(checked) => {
                          const platforms = rules.allowedPlatforms || ["instagram", "tiktok"];
                          if (checked) {
                            setRules({ ...rules, allowedPlatforms: [...platforms.filter(p => p !== "tiktok"), "tiktok"] });
                          } else {
                            setRules({ ...rules, allowedPlatforms: platforms.filter(p => p !== "tiktok") });
                          }
                        }}
                        data-testid="checkbox-platform-tiktok"
                      />
                      <Label htmlFor="platform-tiktok">TikTok</Label>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="prizes">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Prêmios Top N
                  {prizes.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{prizes.length}</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                {prizes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum prêmio configurado. Adicione prêmios para motivar os criadores!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {prizes.map((prize, index) => (
                      <div key={index} className="p-4 rounded-lg border bg-muted/30 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Medal className="h-5 w-5 text-primary" />
                            <span className="font-medium">Top {prize.rankPosition}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removePrize(index)}
                            data-testid={`button-remove-prize-${index}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Tipo de Recompensa</Label>
                            <Select
                              value={prize.rewardKind}
                              onValueChange={(value) => updatePrize(index, { rewardKind: value })}
                            >
                              <SelectTrigger data-testid={`select-reward-kind-${index}`}>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Nenhum</SelectItem>
                                <SelectItem value="cash">Dinheiro</SelectItem>
                                <SelectItem value="product">Produto</SelectItem>
                                <SelectItem value="both">Ambos</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Posição no Ranking</Label>
                            <Input
                              type="number"
                              min={1}
                              value={prize.rankPosition}
                              onChange={(e) => updatePrize(index, { rankPosition: parseInt(e.target.value) || 1 })}
                              data-testid={`input-rank-position-${index}`}
                            />
                          </div>
                        </div>

                        {(prize.rewardKind === 'cash' || prize.rewardKind === 'both') && (
                          <div className="space-y-2">
                            <Label>Valor em Dinheiro (R$)</Label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                value={(prize.cashAmount || 0) / 100}
                                onChange={(e) => updatePrize(index, { cashAmount: Math.round(parseFloat(e.target.value || '0') * 100) })}
                                className="pl-10"
                                placeholder="0,00"
                                data-testid={`input-cash-amount-${index}`}
                              />
                            </div>
                          </div>
                        )}

                        {(prize.rewardKind === 'product' || prize.rewardKind === 'both') && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>SKU do Produto</Label>
                              <Input
                                value={prize.productSku || ''}
                                onChange={(e) => updatePrize(index, { productSku: e.target.value })}
                                placeholder="SKU-001"
                                data-testid={`input-product-sku-${index}`}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Descrição do Produto</Label>
                              <Input
                                value={prize.productDescription || ''}
                                onChange={(e) => updatePrize(index, { productDescription: e.target.value })}
                                placeholder="Kit exclusivo..."
                                data-testid={`input-product-description-${index}`}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                <Button
                  variant="outline"
                  onClick={addPrize}
                  className="w-full"
                  data-testid="button-add-prize"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Prêmio
                </Button>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="caps">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Limites e Anti-fraude
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Configure limites para evitar abusos e proteger a integridade da competição.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxPointsPerPost">Máx. pontos por post</Label>
                    <Input
                      id="maxPointsPerPost"
                      type="number"
                      min={0}
                      value={caps.maxPointsPerPost}
                      onChange={(e) => setCaps({ ...caps, maxPointsPerPost: parseInt(e.target.value) || 0 })}
                      data-testid="input-max-points-per-post"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxPointsPerDay">Máx. pontos por dia</Label>
                    <Input
                      id="maxPointsPerDay"
                      type="number"
                      min={0}
                      value={caps.maxPointsPerDay}
                      onChange={(e) => setCaps({ ...caps, maxPointsPerDay: parseInt(e.target.value) || 0 })}
                      data-testid="input-max-points-per-day"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxPointsTotalCampaign">Máx. pontos total na campanha</Label>
                    <Input
                      id="maxPointsTotalCampaign"
                      type="number"
                      min={0}
                      value={caps.maxPointsTotalCampaign}
                      onChange={(e) => setCaps({ ...caps, maxPointsTotalCampaign: parseInt(e.target.value) || 0 })}
                      data-testid="input-max-points-total"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="countingWindowDays" className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      Janela de contagem (dias)
                    </Label>
                    <Input
                      id="countingWindowDays"
                      type="number"
                      min={1}
                      max={90}
                      value={caps.countingWindowDays}
                      onChange={(e) => setCaps({ ...caps, countingWindowDays: parseInt(e.target.value) || 7 })}
                      data-testid="input-counting-window-days"
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Posts fora da janela de contagem não geram mais pontos. Picos anormais são automaticamente sinalizados para revisão.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Separator />

          <div className="flex justify-between">
            {mode === 'ranking' && prizes.some(p => p.type === 'ranking_place') && (
              <Button
                variant="outline"
                onClick={() => setCloseRankingDialogOpen(true)}
                data-testid="button-close-ranking"
              >
                <Flag className="h-4 w-4 mr-2" />
                Encerrar Ranking
              </Button>
            )}
            <div className="flex-1" />
            <Button
              onClick={handleSaveAll}
              disabled={saveConfigMutation.isPending || savePrizesMutation.isPending}
              data-testid="button-save-gamification"
            >
              {(saveConfigMutation.isPending || savePrizesMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      )}

      <Dialog open={closeRankingDialogOpen} onOpenChange={setCloseRankingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Encerrar Ranking da Campanha</DialogTitle>
            <DialogDescription>
              Esta ação irá finalizar o ranking e criar recompensas pendentes para os vencedores (Top N).
              As recompensas precisarão ser aprovadas antes de serem executadas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseRankingDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => closeRankingMutation.mutate()}
              disabled={closeRankingMutation.isPending}
              data-testid="button-confirm-close-ranking"
            >
              {closeRankingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Encerramento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!enabled && (
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Ative a gamificação para configurar pontuação e prêmios</p>
            <p className="text-sm">Criadores competirão pelo topo do ranking!</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
