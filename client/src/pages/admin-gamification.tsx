import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Coins, Gift, Clock, CheckCircle, XCircle, Package, TrendingUp, Users, Search } from "lucide-react";

interface Campaign {
  id: number;
  title: string;
  companyId: number;
}

interface LeaderboardEntry {
  id?: number;
  creatorId: number;
  totalPoints?: number;
  points?: number;
  rank?: number;
  creatorName?: string;
  creatorAvatar?: string | null;
  creatorUsername?: string | null;
  creator?: {
    id: number;
    name: string;
    avatar: string | null;
    instagram: string | null;
  };
}

interface LedgerEntry {
  id: number;
  campaignId: number;
  creatorId: number;
  deltaPoints: number;
  reason: string;
  refType: string | null;
  refId: number | null;
  notes: string | null;
  createdAt: string;
}

interface RewardEntitlement {
  id: number;
  campaignId: number;
  creatorId: number;
  prizeId: number;
  status: string;
  rewardKind: string;
  cashAmount: number | null;
  productSku: string | null;
  productDescription: string | null;
  createdAt: string;
  creator?: { name: string; instagram: string | null };
  campaign?: { title: string };
}

const reasonLabels: Record<string, string> = {
  deliverable_approved: "Entregável Aprovado",
  ontime_bonus: "Bônus No Prazo",
  views_delta: "Delta Views",
  like_delta: "Delta Likes",
  comment_delta: "Delta Comentários",
  sale_generated: "Venda Gerada",
  quality_bonus: "Bônus Qualidade",
  penalty_late: "Penalidade Atraso",
  manual_adjustment: "Ajuste Manual",
  milestone_reached: "Milestone Alcançado",
};

const statusBadge = (status: string) => {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    pending: { variant: "secondary", label: "Pendente" },
    approved: { variant: "default", label: "Aprovado" },
    rejected: { variant: "destructive", label: "Rejeitado" },
    cash_paid: { variant: "outline", label: "Pago" },
    product_shipped: { variant: "outline", label: "Enviado" },
    completed: { variant: "default", label: "Concluído" },
  };
  const config = variants[status] || { variant: "secondary" as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export function AdminGamificationContent() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [creatorSearch, setCreatorSearch] = useState("");
  const [activeTab, setActiveTab] = useState("leaderboard");

  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ["/api/admin/campaigns"],
    queryFn: async () => {
      const res = await fetch("/api/admin/campaigns", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: leaderboard = [], isLoading: loadingLeaderboard } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/admin/leaderboard", selectedCampaignId],
    queryFn: async () => {
      if (!selectedCampaignId) return [];
      const res = await fetch(`/api/admin/campaigns/${selectedCampaignId}/leaderboard`, { credentials: "include" });
      if (!res.ok) return [];
      const data = await res.json();
      return data.leaderboard || [];
    },
    enabled: !!selectedCampaignId,
  });

  const { data: ledger = [], isLoading: loadingLedger } = useQuery<LedgerEntry[]>({
    queryKey: ["/api/admin/ledger", selectedCampaignId],
    queryFn: async () => {
      if (!selectedCampaignId) return [];
      const res = await fetch(`/api/admin/campaigns/${selectedCampaignId}/points-ledger`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedCampaignId,
  });

  const { data: rewards = [], isLoading: loadingRewards } = useQuery<RewardEntitlement[]>({
    queryKey: ["/api/admin/rewards", selectedCampaignId],
    queryFn: async () => {
      if (!selectedCampaignId) return [];
      const res = await fetch(`/api/admin/campaigns/${selectedCampaignId}/rewards`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedCampaignId,
  });

  const filteredLedger = creatorSearch
    ? ledger.filter((e) => String(e.creatorId).includes(creatorSearch))
    : ledger;

  const formatCurrency = (cents: number | null) => {
    if (!cents) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const pendingCount = rewards.filter((r) => r.status === "pending").length;
  const approvedCount = rewards.filter((r) => r.status === "approved").length;
  const completedCount = rewards.filter((r) => ["cash_paid", "product_shipped", "completed"].includes(r.status)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gamification Admin</h1>
        <p className="text-muted-foreground">Monitore leaderboards, pontos e recompensas por campanha</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Selecione uma Campanha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedCampaignId?.toString() || ""}
            onValueChange={(v) => setSelectedCampaignId(parseInt(v))}
          >
            <SelectTrigger data-testid="select-campaign">
              <SelectValue placeholder="Escolha uma campanha..." />
            </SelectTrigger>
            <SelectContent>
              {campaigns.map((c) => (
                <SelectItem key={c.id} value={c.id.toString()}>
                  {c.title} (ID: {c.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedCampaignId && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Participantes</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {leaderboard.length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Rewards Pendentes</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2 text-yellow-600">
                  <Clock className="h-5 w-5" />
                  {pendingCount}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Rewards Aprovados</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2 text-blue-600">
                  <CheckCircle className="h-5 w-5" />
                  {approvedCount}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Rewards Concluídos</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2 text-green-600">
                  <Gift className="h-5 w-5" />
                  {completedCount}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="leaderboard" data-testid="tab-leaderboard">
                <Trophy className="h-4 w-4 mr-2" />
                Leaderboard
              </TabsTrigger>
              <TabsTrigger value="ledger" data-testid="tab-ledger">
                <Coins className="h-4 w-4 mr-2" />
                Points Ledger
              </TabsTrigger>
              <TabsTrigger value="rewards" data-testid="tab-rewards">
                <Gift className="h-4 w-4 mr-2" />
                Rewards
              </TabsTrigger>
            </TabsList>

            <TabsContent value="leaderboard" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Leaderboard da Campanha</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingLeaderboard ? (
                    <div className="text-center py-4 text-muted-foreground">Carregando...</div>
                  ) : leaderboard.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">Nenhum participante ainda</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Rank</TableHead>
                          <TableHead>Criador</TableHead>
                          <TableHead>Instagram</TableHead>
                          <TableHead className="text-right">Pontos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leaderboard.map((entry, idx) => {
                          const displayRank = entry.rank || idx + 1;
                          const displayName = entry.creatorName || entry.creator?.name || `Creator ${entry.creatorId}`;
                          const displayInstagram = entry.creatorUsername || entry.creator?.instagram || "-";
                          const displayPoints = entry.totalPoints ?? entry.points ?? 0;
                          return (
                            <TableRow key={entry.id || entry.creatorId} data-testid={`leaderboard-row-${entry.creatorId}`}>
                              <TableCell>
                                {displayRank <= 3 ? (
                                  <Badge variant={displayRank === 1 ? "default" : "secondary"}>
                                    #{displayRank}
                                  </Badge>
                                ) : (
                                  `#${displayRank}`
                                )}
                              </TableCell>
                              <TableCell className="font-medium">{displayName}</TableCell>
                              <TableCell className="text-muted-foreground">@{displayInstagram}</TableCell>
                              <TableCell className="text-right font-bold">{displayPoints.toLocaleString()}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ledger" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Histórico de Pontos</CardTitle>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="creator-filter" className="text-sm">Filtrar por Creator ID:</Label>
                      <Input
                        id="creator-filter"
                        value={creatorSearch}
                        onChange={(e) => setCreatorSearch(e.target.value)}
                        placeholder="Ex: 123"
                        className="w-32"
                        data-testid="input-filter-creator"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingLedger ? (
                    <div className="text-center py-4 text-muted-foreground">Carregando...</div>
                  ) : filteredLedger.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">Nenhum registro de pontos</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Creator ID</TableHead>
                          <TableHead>Motivo</TableHead>
                          <TableHead>Referência</TableHead>
                          <TableHead className="text-right">Pontos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLedger.slice(0, 100).map((entry) => (
                          <TableRow key={entry.id} data-testid={`ledger-row-${entry.id}`}>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(entry.createdAt).toLocaleString("pt-BR")}
                            </TableCell>
                            <TableCell>{entry.creatorId}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{reasonLabels[entry.reason] || entry.reason}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {entry.refType && entry.refId ? `${entry.refType}:${entry.refId}` : "-"}
                            </TableCell>
                            <TableCell className={`text-right font-medium ${entry.deltaPoints >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {entry.deltaPoints >= 0 ? "+" : ""}{entry.deltaPoints}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rewards" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recompensas Geradas</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingRewards ? (
                    <div className="text-center py-4 text-muted-foreground">Carregando...</div>
                  ) : rewards.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">Nenhuma recompensa gerada</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Creator</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Valor/Produto</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rewards.map((reward) => (
                          <TableRow key={reward.id} data-testid={`reward-row-${reward.id}`}>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(reward.createdAt).toLocaleString("pt-BR")}
                            </TableCell>
                            <TableCell>{reward.creator?.name || `Creator ${reward.creatorId}`}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {(reward.rewardKind === "cash" || reward.rewardKind === "both") && (
                                  <Coins className="h-4 w-4 text-green-600" />
                                )}
                                {(reward.rewardKind === "product" || reward.rewardKind === "both") && (
                                  <Package className="h-4 w-4 text-blue-600" />
                                )}
                                <span className="capitalize">{reward.rewardKind}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {reward.cashAmount ? formatCurrency(reward.cashAmount) : ""}
                              {reward.cashAmount && reward.productDescription ? " + " : ""}
                              {reward.productDescription || ""}
                            </TableCell>
                            <TableCell>{statusBadge(reward.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
