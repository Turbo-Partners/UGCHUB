import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Trophy, Medal, Crown, Target, Gift, DollarSign, Package, TrendingUp, Loader2, Star, Eye, Heart, MessageCircle } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  creatorId: number;
  creatorName: string;
  creatorAvatar: string | null;
  totalPoints: number;
  prize?: {
    rewardKind: string;
    cashAmount?: number;
    productDescription?: string;
  };
}

interface PointsHistory {
  id: number;
  deltaPoints: number;
  reason: string;
  notes: string | null;
  createdAt: string;
}

interface GamificationConfig {
  enabled: boolean;
  mode: string;
  rulesJson: any;
}

interface CampaignPrize {
  type: string;
  rankPosition: number;
  rewardKind: string;
  cashAmount?: number;
  productDescription?: string;
}

interface CreatorCampaignRankingProps {
  campaignId: number;
  creatorId: number;
}

const REASON_LABELS: Record<string, string> = {
  deliverable_approved: 'Entrega aprovada',
  ontime_bonus: 'Bônus de prazo',
  view_milestone: 'Visualizações',
  engagement_milestone: 'Engajamento',
  sale_recorded: 'Venda registrada',
  manual_adjustment: 'Ajuste manual',
  performance_views: 'Views',
  performance_likes: 'Curtidas',
  performance_comments: 'Comentários',
};

export function CreatorCampaignRanking({ campaignId, creatorId }: CreatorCampaignRankingProps) {
  const { data: leaderboardData, isLoading: isLoadingLeaderboard } = useQuery<{
    leaderboard: LeaderboardEntry[];
    config: GamificationConfig;
    prizes: CampaignPrize[];
  }>({
    queryKey: [`/api/campaigns/${campaignId}/leaderboard`],
    enabled: !!campaignId,
  });

  const { data: myPointsData, isLoading: isLoadingMyPoints } = useQuery<{
    score: { totalPoints: number; rank: number | null };
    history: PointsHistory[];
  }>({
    queryKey: [`/api/creator/campaigns/${campaignId}/points`],
    enabled: !!campaignId,
  });

  const { data: scoringRules } = useQuery<{
    pointsPerDeliverable: number;
    pointsOnTimeBonus: number;
    pointsPer1kViews?: number;
    pointsPerLike?: number;
    pointsPerComment?: number;
  }>({
    queryKey: [`/api/campaigns/${campaignId}/scoring-rules`],
    enabled: !!campaignId,
  });

  const isLoading = isLoadingLeaderboard || isLoadingMyPoints;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!leaderboardData?.config?.enabled) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Trophy className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            Gamificação não está habilitada para esta campanha.
          </p>
        </CardContent>
      </Card>
    );
  }

  const myRank = myPointsData?.score?.rank || 0;
  const myPoints = myPointsData?.score?.totalPoints || 0;
  const topCreator = leaderboardData?.leaderboard?.[0];
  const progressToTop = topCreator && topCreator.totalPoints > 0 
    ? Math.min(100, (myPoints / topCreator.totalPoints) * 100) 
    : 0;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  };

  const getPrizeForRank = (rank: number) => {
    return leaderboardData?.prizes?.find(p => p.type === 'ranking_place' && p.rankPosition === rank);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Minha Performance
          </CardTitle>
          <CardDescription>
            Sua posição no ranking desta campanha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                {myRank > 0 ? (
                  <span className="text-2xl font-bold text-primary">#{myRank}</span>
                ) : (
                  <Target className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-3xl font-bold">{myPoints.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">pontos acumulados</p>
              </div>
            </div>
            {myRank > 0 && myRank <= 3 && getPrizeForRank(myRank) && (
              <Badge variant="default" className="flex items-center gap-1 py-1.5 px-3">
                <Gift className="h-4 w-4" />
                Você está na zona de premiação!
              </Badge>
            )}
          </div>

          {topCreator && topCreator.totalPoints > myPoints && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progresso até o 1º lugar</span>
                <span className="font-medium">{Math.round(progressToTop)}%</span>
              </div>
              <Progress value={progressToTop} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Faltam {(topCreator.totalPoints - myPoints).toLocaleString()} pontos para o topo
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {scoringRules && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              Regras de Pontuação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Star className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{scoringRules.pointsPerDeliverable} pts</p>
                  <p className="text-xs text-muted-foreground">Por entrega aprovada</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">+{scoringRules.pointsOnTimeBonus} pts</p>
                  <p className="text-xs text-muted-foreground">Bônus prazo</p>
                </div>
              </div>
            </div>
            
            {(scoringRules.pointsPer1kViews || scoringRules.pointsPerLike || scoringRules.pointsPerComment) && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Performance de Posts
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {scoringRules.pointsPer1kViews !== undefined && scoringRules.pointsPer1kViews > 0 && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <Eye className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="font-medium text-sm">{scoringRules.pointsPer1kViews} pts</p>
                          <p className="text-xs text-muted-foreground">Por 1k views</p>
                        </div>
                      </div>
                    )}
                    {scoringRules.pointsPerLike !== undefined && scoringRules.pointsPerLike > 0 && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <Heart className="h-4 w-4 text-red-500" />
                        <div>
                          <p className="font-medium text-sm">{scoringRules.pointsPerLike} pts</p>
                          <p className="text-xs text-muted-foreground">Por like</p>
                        </div>
                      </div>
                    )}
                    {scoringRules.pointsPerComment !== undefined && scoringRules.pointsPerComment > 0 && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <MessageCircle className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="font-medium text-sm">{scoringRules.pointsPerComment} pts</p>
                          <p className="text-xs text-muted-foreground">Por comentário</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {leaderboardData?.prizes && leaderboardData.prizes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="h-4 w-4" />
              Prêmios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboardData.prizes
                .filter(p => p.type === 'ranking_place')
                .sort((a, b) => (a.rankPosition || 0) - (b.rankPosition || 0))
                .map((prize, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {getRankIcon(prize.rankPosition || index + 1)}
                      <span className="font-medium">Top {prize.rankPosition}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {(prize.rewardKind === 'cash' || prize.rewardKind === 'both') && prize.cashAmount && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          R$ {(prize.cashAmount / 100).toFixed(2)}
                        </Badge>
                      )}
                      {(prize.rewardKind === 'product' || prize.rewardKind === 'both') && prize.productDescription && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {prize.productDescription}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Medal className="h-4 w-4" />
            Ranking da Campanha
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaderboardData?.leaderboard && leaderboardData.leaderboard.length > 0 ? (
            <div className="space-y-2">
              {leaderboardData.leaderboard.slice(0, 10).map((entry) => (
                <div
                  key={entry.creatorId}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    entry.creatorId === creatorId ? 'bg-primary/5 border-primary' : ''
                  }`}
                  data-testid={`leaderboard-entry-${entry.creatorId}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 flex justify-center">
                      {getRankIcon(entry.rank)}
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={entry.creatorAvatar || undefined} />
                      <AvatarFallback>{entry.creatorName?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <span className={`font-medium ${entry.creatorId === creatorId ? 'text-primary' : ''}`}>
                      {entry.creatorId === creatorId ? 'Você' : entry.creatorName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{entry.totalPoints.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground">pts</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma pontuação registrada ainda</p>
              <p className="text-sm">Complete entregas para aparecer no ranking!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {myPointsData?.history && myPointsData.history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Histórico de Pontos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {myPointsData.history.slice(0, 10).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{REASON_LABELS[entry.reason] || entry.reason}</p>
                    {entry.notes && (
                      <p className="text-xs text-muted-foreground">{entry.notes}</p>
                    )}
                  </div>
                  <Badge variant={entry.deltaPoints > 0 ? 'default' : 'destructive'}>
                    {entry.deltaPoints > 0 ? '+' : ''}{entry.deltaPoints}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
