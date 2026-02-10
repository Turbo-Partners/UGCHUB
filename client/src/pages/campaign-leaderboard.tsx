import { useQuery } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Medal, 
  Award, 
  TrendingUp, 
  Star,
  Crown,
  Eye,
  ShoppingBag,
  MessageCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Users
} from 'lucide-react';
import { useMarketplace } from '@/lib/provider';

interface LeaderboardEntry {
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
  leaderboard: LeaderboardEntry[];
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-6 w-6 text-yellow-500" />;
    case 2:
      return <Medal className="h-6 w-6 text-gray-400" />;
    case 3:
      return <Award className="h-6 w-6 text-amber-600" />;
    default:
      return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  }
};

const getRankStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300 shadow-yellow-100';
    case 2:
      return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300 shadow-gray-100';
    case 3:
      return 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 shadow-amber-100';
    default:
      return 'bg-white border-gray-200';
  }
};

export default function CampaignLeaderboard() {
  const [, params] = useRoute('/campaign/:id/leaderboard');
  const campaignId = params?.id ? parseInt(params.id) : null;
  const { user } = useMarketplace();

  const { data, isLoading, error } = useQuery<CampaignLeaderboardData>({
    queryKey: [`/api/campaigns/${campaignId}/leaderboard`],
    enabled: !!campaignId,
  });

  const backPath = user?.role === 'company' 
    ? `/campaign/${campaignId}/manage` 
    : `/campaign/${campaignId}/workspace`;

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
            <p className="text-muted-foreground mb-4">
              Você precisa ser participante desta campanha para ver o ranking.
            </p>
            <Link href={user?.role === 'company' ? '/dashboard' : '/creator/dashboard'}>
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const myEntry = data.leaderboard.find(e => e.creatorId === user?.id);

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href={backPath}>
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-campaign-title">{data.campaignTitle}</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Ranking da Campanha
            <Badge variant="secondary" className="ml-2">
              <Users className="h-3 w-3 mr-1" />
              {data.totalParticipants} participantes
            </Badge>
          </p>
        </div>
      </div>

      {user?.role === 'creator' && myEntry && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20">
                    {getRankIcon(myEntry.rank)}
                  </div>
                  <div>
                    <p className="font-semibold">Sua Posição</p>
                    <p className="text-sm text-muted-foreground">
                      {myEntry.points} pontos
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">#{myEntry.rank}</p>
                  <p className="text-xs text-muted-foreground">de {data.totalParticipants}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Ranking Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sem dados ainda</h3>
              <p className="text-muted-foreground">
                O ranking será atualizado conforme as entregas forem realizadas.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.leaderboard.map((entry, index) => (
                <motion.div
                  key={entry.creatorId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  data-testid={`row-leaderboard-${entry.creatorId}`}
                  className={`p-4 rounded-lg border-2 transition-all ${getRankStyle(entry.rank)} ${
                    entry.creatorId === user?.id ? 'ring-2 ring-primary ring-offset-2' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10">
                      {getRankIcon(entry.rank)}
                    </div>

                    <Avatar className="h-12 w-12 border-2 border-white shadow">
                      <AvatarImage src={entry.creatorAvatar || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white">
                        {entry.creatorName?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate" data-testid={`text-creator-name-${entry.creatorId}`}>
                          {entry.creatorName}
                        </p>
                        {entry.creatorId === user?.id && (
                          <Badge variant="outline" className="text-xs">Você</Badge>
                        )}
                      </div>
                      {entry.creatorUsername && (
                        <p className="text-sm text-muted-foreground">@{entry.creatorUsername}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground" title="Views">
                        <Eye className="h-4 w-4" />
                        <span>{entry.totalViews.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground" title="Engajamento">
                        <MessageCircle className="h-4 w-4" />
                        <span>{entry.totalEngagement.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground" title="Vendas">
                        <ShoppingBag className="h-4 w-4" />
                        <span>{entry.totalSales}</span>
                      </div>
                      {entry.qualityScore !== null && (
                        <div className="flex items-center gap-1 text-amber-500" title="Qualidade">
                          <Star className="h-4 w-4 fill-amber-500" />
                          <span>{entry.qualityScore.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold text-primary" data-testid={`text-points-${entry.creatorId}`}>
                        {entry.points}
                      </p>
                      <p className="text-xs text-muted-foreground">pontos</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-dashed">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      <span>{entry.deliverablesCompleted} entregas</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 text-blue-500" />
                      <span>{entry.deliverablesOnTime} no prazo</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Como ganhar pontos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Entrega: +100pts</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>No prazo: +25pts</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-purple-500" />
              <span>1K views: +1pt</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-pink-500" />
              <span>100 interações: +1pt</span>
            </div>
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-orange-500" />
              <span>Venda: +10pts</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              <span>Qualidade: +10pts/⭐</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
