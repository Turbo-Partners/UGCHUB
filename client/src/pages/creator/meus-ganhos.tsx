import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Wallet, 
  ArrowDownRight, 
  Clock, 
  CheckCircle2, 
  CreditCard,
  TrendingUp,
  Settings
} from "lucide-react";
import { toast } from "sonner";

type TransactionType = 
  | "deposit" 
  | "withdrawal" 
  | "payment_fixed" 
  | "payment_variable" 
  | "commission" 
  | "bonus" 
  | "refund" 
  | "transfer_in" 
  | "transfer_out" 
  | "box_allocation";

type TransactionStatus = "pending" | "available" | "processing" | "completed" | "failed" | "cancelled";

interface WalletTransaction {
  id: number;
  companyWalletId: number | null;
  creatorBalanceId: number | null;
  type: TransactionType;
  amount: number;
  balanceAfter: number | null;
  relatedUserId: number | null;
  relatedCampaignId: number | null;
  walletBoxId: number | null;
  description: string | null;
  notes: string | null;
  tags: string[] | null;
  status: TransactionStatus;
  scheduledFor: string | null;
  processedAt: string | null;
  createdAt: string;
}

interface CreatorBalance {
  id: number;
  userId: number;
  availableBalance: number;
  pendingBalance: number;
  pixKey: string | null;
  pixKeyType: string | null;
}

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
};

const getTransactionTypeLabel = (type: TransactionType): string => {
  const labels: Record<TransactionType, string> = {
    deposit: "Depósito",
    withdrawal: "Saque",
    payment_fixed: "Pagamento fixo",
    payment_variable: "Pagamento avulso",
    commission: "Comissão",
    bonus: "Bônus",
    refund: "Reembolso",
    transfer_in: "Pagamento recebido",
    transfer_out: "Transferência enviada",
    box_allocation: "Alocação caixinha",
  };
  return labels[type] || type;
};

const getStatusBadge = (status: TransactionStatus) => {
  const configs: Record<TransactionStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "Pendente", variant: "secondary" },
    available: { label: "Disponível", variant: "default" },
    processing: { label: "Processando", variant: "outline" },
    completed: { label: "Pago", variant: "default" },
    failed: { label: "Falhou", variant: "destructive" },
    cancelled: { label: "Cancelado", variant: "destructive" },
  };
  const config = configs[status];
  return <Badge variant={config.variant} data-testid={`badge-status-${status}`}>{config.label}</Badge>;
};

export default function MeusGanhos() {
  const queryClient = useQueryClient();
  const [showPixDialog, setShowPixDialog] = useState(false);
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState("cpf");

  const { data: balance, isLoading: balanceLoading } = useQuery<CreatorBalance>({
    queryKey: ["/api/creator/balance"],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<WalletTransaction[]>({
    queryKey: ["/api/creator/transactions"],
  });

  const updatePixMutation = useMutation({
    mutationFn: async (data: { pixKey: string; pixKeyType: string }) =>
      apiRequest("PATCH", "/api/creator/balance/pix", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/balance"] });
      setShowPixDialog(false);
      toast.success("Dados PIX atualizados!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar dados PIX");
    },
  });

  const handleUpdatePix = () => {
    if (!pixKey.trim()) {
      toast.error("Informe a chave PIX");
      return;
    }
    updatePixMutation.mutate({ pixKey, pixKeyType });
  };

  const totalEarned = transactions
    .filter(t => t.amount > 0 && (t.status === 'completed' || t.status === 'available'))
    .reduce((sum, t) => sum + t.amount, 0);

  if (balanceLoading) {
    return (
      <div className="flex items-center justify-center h-96" data-testid="loading-spinner">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" data-testid="page-meus-ganhos">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="page-title">Carteira</h1>
          <p className="text-muted-foreground">Acompanhe seus recebimentos e saldo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Wallet className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-sm text-muted-foreground">Saldo Disponível</span>
            </div>
            <p className="text-2xl font-bold text-green-600" data-testid="available-balance">
              {formatCurrency(balance?.availableBalance || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <span className="text-sm text-muted-foreground">Saldo Pendente</span>
            </div>
            <p className="text-2xl font-bold text-amber-600" data-testid="pending-balance">
              {formatCurrency(balance?.pendingBalance || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Aguardando liberação</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/20">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Total Recebido</span>
            </div>
            <p className="text-2xl font-bold" data-testid="total-earned">
              {formatCurrency(totalEarned)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Dados para Recebimento
              </CardTitle>
              <CardDescription>Configure sua chave PIX para receber pagamentos</CardDescription>
            </div>
            <Dialog open={showPixDialog} onOpenChange={setShowPixDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-edit-pix">
                  <Settings className="h-4 w-4 mr-2" />
                  {balance?.pixKey ? "Editar" : "Configurar"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dados PIX</DialogTitle>
                  <DialogDescription>Configure sua chave PIX para receber pagamentos</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Tipo de Chave</Label>
                    <Select value={pixKeyType} onValueChange={setPixKeyType}>
                      <SelectTrigger data-testid="select-pix-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="cnpj">CNPJ</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                        <SelectItem value="phone">Telefone</SelectItem>
                        <SelectItem value="random">Chave aleatória</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Chave PIX</Label>
                    <Input
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      placeholder={
                        pixKeyType === "cpf" ? "000.000.000-00" :
                        pixKeyType === "cnpj" ? "00.000.000/0000-00" :
                        pixKeyType === "email" ? "email@exemplo.com" :
                        pixKeyType === "phone" ? "+55 11 99999-9999" :
                        "Chave aleatória"
                      }
                      data-testid="input-pix-key"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowPixDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleUpdatePix} disabled={updatePixMutation.isPending} data-testid="button-save-pix">
                    {updatePixMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {balance?.pixKey ? (
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">PIX Configurado</p>
                <p className="text-sm text-muted-foreground">
                  Tipo: {balance.pixKeyType?.toUpperCase()} • {balance.pixKey.substring(0, 10)}...
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-amber-600">PIX não configurado</p>
                <p className="text-sm text-muted-foreground">
                  Configure seu PIX para receber pagamentos
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
          <CardDescription>Todas as suas transações</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {transactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhuma transação ainda
                </p>
              ) : (
                transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    data-testid={`transaction-${transaction.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-green-500/10">
                        <ArrowDownRight className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {transaction.description || getTransactionTypeLabel(transaction.type)}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {format(new Date(transaction.createdAt), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {getTransactionTypeLabel(transaction.type)}
                      </span>
                      <span className="font-medium text-green-600">
                        +{formatCurrency(transaction.amount)}
                      </span>
                      {getStatusBadge(transaction.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
