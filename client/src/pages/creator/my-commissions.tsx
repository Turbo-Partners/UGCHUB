import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, Clock, CheckCircle, DollarSign, Percent, Package } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { CreatorCommission, Campaign } from "@shared/schema";

type CommissionWithCampaign = CreatorCommission & { campaign?: Campaign };

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Aprovada", color: "bg-blue-100 text-blue-800" },
  paid: { label: "Paga", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelada", color: "bg-red-100 text-red-800" },
};

export default function MyCommissions() {
  const { data: commissions, isLoading } = useQuery<CommissionWithCampaign[]>({
    queryKey: ["/api/my-commissions"],
    queryFn: async () => {
      const res = await fetch("/api/my-commissions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch commissions");
      return res.json();
    },
  });

  const stats = {
    pending: commissions?.filter(c => c.status === "pending").reduce((sum, c) => sum + Number(c.amount), 0) || 0,
    approved: commissions?.filter(c => c.status === "approved").reduce((sum, c) => sum + Number(c.amount), 0) || 0,
    paid: commissions?.filter(c => c.status === "paid").reduce((sum, c) => sum + Number(c.amount), 0) || 0,
    total: commissions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0,
    count: commissions?.length || 0,
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);
  };

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-8">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
          Minhas Comissões
        </h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe suas comissões de vendas em campanhas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-amount">
              {formatCurrency(stats.pending)}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando aprovação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-approved-amount">
              {formatCurrency(stats.approved)}
            </div>
            <p className="text-xs text-muted-foreground">
              A receber
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagas</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-paid-amount">
              {formatCurrency(stats.paid)}
            </div>
            <p className="text-xs text-muted-foreground">
              Já recebidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-amount">
              {formatCurrency(stats.total)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.count} comissões
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Comissões</CardTitle>
          <CardDescription>
            Todas as suas comissões de vendas atribuídas através de cupons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all" data-testid="tab-all">Todas</TabsTrigger>
              <TabsTrigger value="pending" data-testid="tab-pending">Pendentes</TabsTrigger>
              <TabsTrigger value="approved" data-testid="tab-approved">Aprovadas</TabsTrigger>
              <TabsTrigger value="paid" data-testid="tab-paid">Pagas</TabsTrigger>
            </TabsList>

            {["all", "pending", "approved", "paid"].map((tab) => (
              <TabsContent key={tab} value={tab}>
                {commissions?.filter(c => tab === "all" || c.status === tab).length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma comissão encontrada</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {commissions
                      ?.filter(c => tab === "all" || c.status === tab)
                      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
                      .map((commission) => (
                        <div
                          key={commission.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                          data-testid={`commission-row-${commission.id}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-full bg-primary/10">
                              <Percent className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {commission.campaign?.title || `Campanha #${commission.campaignId}`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(commission.createdAt!), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge className={statusLabels[commission.status]?.color}>
                              {statusLabels[commission.status]?.label}
                            </Badge>
                            <div className="text-right">
                              <p className="font-semibold text-lg">
                                {formatCurrency(Number(commission.amount))}
                              </p>
                              {commission.paidAt && (
                                <p className="text-xs text-muted-foreground">
                                  Pago em {format(new Date(commission.paidAt), "dd/MM/yyyy")}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
