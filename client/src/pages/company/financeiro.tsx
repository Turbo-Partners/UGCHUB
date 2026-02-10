import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow, format, differenceInDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { 
  Wallet, 
  Plus, 
  Download, 
  Filter, 
  PiggyBank, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Settings,
  Users,
  Calendar,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Receipt,
  CircleDollarSign,
  Sparkles,
  ChevronRight,
  Eye,
  MoreHorizontal,
  Search,
  DollarSign,
  Banknote,
  Gift,
  FileText,
  ExternalLink
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

interface CompanyWallet {
  id: number;
  companyId: number;
  balance: number;
  reservedBalance: number;
  billingCycleStart: string | null;
  billingCycleEnd: string | null;
}

interface WalletBox {
  id: number;
  companyWalletId: number;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  targetAmount: number | null;
  currentAmount: number;
  isActive: boolean;
}

interface CreatorWithBalance {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  instagramHandle: string | null;
  totalPaid: number;
  pendingAmount: number;
  lastPayment: string | null;
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
    transfer_in: "Transferência recebida",
    transfer_out: "Transferência enviada",
    box_allocation: "Alocação caixinha",
  };
  return labels[type] || type;
};

const getTransactionIcon = (type: TransactionType, amount: number) => {
  if (amount > 0) {
    return <ArrowDownRight className="h-4 w-4 text-emerald-500" />;
  }
  
  const icons: Record<TransactionType, React.ReactNode> = {
    deposit: <Plus className="h-4 w-4 text-emerald-500" />,
    withdrawal: <ArrowUpRight className="h-4 w-4 text-red-500" />,
    payment_fixed: <CreditCard className="h-4 w-4 text-orange-500" />,
    payment_variable: <Banknote className="h-4 w-4 text-blue-500" />,
    commission: <CircleDollarSign className="h-4 w-4 text-purple-500" />,
    bonus: <Gift className="h-4 w-4 text-pink-500" />,
    refund: <ArrowDownRight className="h-4 w-4 text-emerald-500" />,
    transfer_in: <ArrowDownRight className="h-4 w-4 text-emerald-500" />,
    transfer_out: <ArrowUpRight className="h-4 w-4 text-red-500" />,
    box_allocation: <PiggyBank className="h-4 w-4 text-indigo-500" />,
  };
  return icons[type] || <DollarSign className="h-4 w-4" />;
};

const getStatusBadge = (status: TransactionStatus) => {
  const configs: Record<TransactionStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
    pending: { label: "Em aberto", variant: "secondary", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
    available: { label: "Disponível", variant: "default", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" },
    processing: { label: "Processando", variant: "outline", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
    completed: { label: "Concluído", variant: "default", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" },
    failed: { label: "Falhou", variant: "destructive" },
    cancelled: { label: "Cancelado", variant: "destructive" },
  };
  const config = configs[status];
  return <Badge variant={config.variant} className={config.className} data-testid={`badge-status-${status}`}>{config.label}</Badge>;
};

export default function Financeiro() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showPayCreatorDialog, setShowPayCreatorDialog] = useState(false);
  const [showBoxDialog, setShowBoxDialog] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositDescription, setDepositDescription] = useState("");
  const [selectedCreator, setSelectedCreator] = useState<CreatorWithBalance | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentType, setPaymentType] = useState("payment_variable");
  const [paymentDescription, setPaymentDescription] = useState("");
  const [boxName, setBoxName] = useState("");
  const [boxDescription, setBoxDescription] = useState("");
  const [boxTargetAmount, setBoxTargetAmount] = useState("");
  const [boxColor, setBoxColor] = useState("#6366f1");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCreator, setFilterCreator] = useState<string>("all");
  const [searchCreator, setSearchCreator] = useState("");

  const { data: walletData, isLoading: walletLoading } = useQuery<{ wallet: CompanyWallet; boxes: WalletBox[] }>({
    queryKey: ["/api/wallet"],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<WalletTransaction[]>({
    queryKey: ["/api/wallet/transactions"],
  });

  const { data: creatorsWithBalance = [] } = useQuery<CreatorWithBalance[]>({
    queryKey: ["/api/wallet/creators"],
  });

  const { data: creators = [] } = useQuery<any[]>({
    queryKey: ["/api/creators"],
  });

  const depositMutation = useMutation({
    mutationFn: async (data: { amount: number; description: string }) =>
      apiRequest("POST", "/api/wallet/deposit", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
      toast.success("Depósito realizado com sucesso!");
      setShowDepositDialog(false);
      setDepositAmount("");
      setDepositDescription("");
    },
    onError: () => {
      toast.error("Erro ao realizar depósito");
    },
  });

  const payCreatorMutation = useMutation({
    mutationFn: async (data: { creatorId: number; amount: number; type: string; description: string }) =>
      apiRequest("POST", "/api/wallet/pay-creator", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/creators"] });
      toast.success("Pagamento registrado com sucesso!");
      setShowPayCreatorDialog(false);
      setSelectedCreator(null);
      setPaymentAmount("");
      setPaymentDescription("");
    },
    onError: () => {
      toast.error("Erro ao registrar pagamento");
    },
  });

  const createBoxMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; targetAmount?: number; color: string }) =>
      apiRequest("POST", "/api/wallet/boxes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      toast.success("Caixinha criada com sucesso!");
      setShowBoxDialog(false);
      setBoxName("");
      setBoxDescription("");
      setBoxTargetAmount("");
    },
    onError: () => {
      toast.error("Erro ao criar caixinha");
    },
  });

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount.replace(",", "."));
    if (isNaN(amount) || amount <= 0) {
      toast.error("Valor inválido");
      return;
    }
    depositMutation.mutate({ amount, description: depositDescription || "Depósito" });
  };

  const handlePayCreator = () => {
    if (!selectedCreator) return;
    const amount = parseFloat(paymentAmount.replace(",", "."));
    if (isNaN(amount) || amount <= 0) {
      toast.error("Valor inválido");
      return;
    }
    payCreatorMutation.mutate({
      creatorId: selectedCreator.id,
      amount,
      type: paymentType,
      description: paymentDescription || "Pagamento",
    });
  };

  const handleCreateBox = () => {
    if (!boxName.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    const targetAmount = boxTargetAmount ? parseFloat(boxTargetAmount.replace(",", ".")) : undefined;
    createBoxMutation.mutate({
      name: boxName,
      description: boxDescription,
      targetAmount,
      color: boxColor,
    });
  };

  const wallet = walletData?.wallet;
  const boxes = walletData?.boxes || [];

  const now = new Date();
  const hasBillingCycle = wallet?.billingCycleStart && wallet?.billingCycleEnd;
  const cycleStart = hasBillingCycle ? new Date(wallet.billingCycleStart!) : null;
  const cycleEnd = hasBillingCycle ? new Date(wallet.billingCycleEnd!) : null;
  const daysRemaining = cycleEnd ? Math.max(0, differenceInDays(cycleEnd, now)) : 0;
  const cycleTotalDays = cycleStart && cycleEnd ? Math.max(1, differenceInDays(cycleEnd, cycleStart)) : 30;
  const cycleProgress = hasBillingCycle ? Math.min(100, Math.max(0, ((cycleTotalDays - daysRemaining) / cycleTotalDays) * 100)) : 0;

  const pendingPayments = transactions.filter(t => t.status === "pending" && t.amount < 0);
  const totalPending = pendingPayments.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const fixedPayments = pendingPayments.filter(t => t.type === "payment_fixed").reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const variablePayments = pendingPayments.filter(t => t.type === "payment_variable").reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const commissions = pendingPayments.filter(t => t.type === "commission").reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const bonuses = pendingPayments.filter(t => t.type === "bonus").reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalCreatorsPaid = creatorsWithBalance.reduce((sum, c) => sum + c.totalPaid, 0);
  const totalCreatorsPending = creatorsWithBalance.reduce((sum, c) => sum + c.pendingAmount, 0);
  const activeCreatorsCount = creatorsWithBalance.filter(c => c.totalPaid > 0 || c.pendingAmount > 0).length;

  const filteredTransactions = useMemo(() => 
    transactions.filter(t => {
      if (filterType !== "all" && t.type !== filterType) return false;
      if (filterCreator !== "all" && t.relatedUserId !== parseInt(filterCreator)) return false;
      return true;
    }), 
    [transactions, filterType, filterCreator]
  );

  const filteredCreators = useMemo(() => 
    creatorsWithBalance.filter(c => {
      if (searchCreator) {
        const search = searchCreator.toLowerCase();
        return c.name.toLowerCase().includes(search) || 
               c.email.toLowerCase().includes(search) ||
               c.instagramHandle?.toLowerCase().includes(search);
      }
      return true;
    }),
    [creatorsWithBalance, searchCreator]
  );

  if (walletLoading) {
    return (
      <div className="flex items-center justify-center h-96" data-testid="loading-spinner">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" data-testid="page-financeiro">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="page-title">Financeiro</h1>
          <p className="text-muted-foreground">Gerencie sua carteira e pagamentos de creators</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-lg" data-testid="tabs-list">
          <TabsTrigger value="overview" data-testid="tab-overview">Visão geral</TabsTrigger>
          <TabsTrigger value="invoices" data-testid="tab-invoices">Faturas</TabsTrigger>
          <TabsTrigger value="creators" data-testid="tab-creators">Carteira de Creators</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:col-span-2"
            >
              <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white shadow-2xl">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                
                <CardContent className="relative pt-6 pb-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-white/70 text-sm mb-2">
                        <Wallet className="h-4 w-4" />
                        <span>Saldo disponível</span>
                      </div>
                      <p className="text-4xl md:text-5xl font-bold tracking-tight" data-testid="wallet-balance">
                        {formatCurrency(wallet?.balance || 0)}
                      </p>
                      {wallet?.reservedBalance && wallet.reservedBalance > 0 && (
                        <p className="text-white/60 text-sm mt-2">
                          <Clock className="h-3 w-3 inline mr-1" />
                          Reservado: {formatCurrency(wallet.reservedBalance)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
                        <DialogTrigger asChild>
                          <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/20" data-testid="button-add-balance">
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar saldo
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Adicionar Saldo</DialogTitle>
                            <DialogDescription>Adicione saldo à sua carteira para pagar creators</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="deposit-amount">Valor (R$)</Label>
                              <Input
                                id="deposit-amount"
                                placeholder="0,00"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                                data-testid="input-deposit-amount"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="deposit-description">Descrição (opcional)</Label>
                              <Input
                                id="deposit-description"
                                placeholder="Ex: Crédito mensal"
                                value={depositDescription}
                                onChange={(e) => setDepositDescription(e.target.value)}
                                data-testid="input-deposit-description"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowDepositDialog(false)}>
                              Cancelar
                            </Button>
                            <Button onClick={handleDeposit} disabled={depositMutation.isPending} data-testid="button-confirm-deposit">
                              {depositMutation.isPending ? "Adicionando..." : "Adicionar"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={showPayCreatorDialog} onOpenChange={setShowPayCreatorDialog}>
                        <DialogTrigger asChild>
                          <Button className="bg-white text-indigo-600 hover:bg-white/90" data-testid="button-pay-creators">
                            <Users className="h-4 w-4 mr-2" />
                            Pagar creators
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Pagar Creator</DialogTitle>
                            <DialogDescription>Selecione um creator e registre o pagamento</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Selecione o Creator</Label>
                              <Select onValueChange={(val) => {
                                const creator = creators.find(c => c.id === parseInt(val));
                                if (creator) {
                                  setSelectedCreator({
                                    id: creator.id,
                                    name: creator.name || creator.email,
                                    email: creator.email,
                                    avatar: creator.avatar,
                                    instagramHandle: creator.instagramHandle,
                                    totalPaid: 0,
                                    pendingAmount: 0,
                                    lastPayment: null,
                                  });
                                }
                              }}>
                                <SelectTrigger data-testid="select-creator">
                                  <SelectValue placeholder="Escolha um creator" />
                                </SelectTrigger>
                                <SelectContent>
                                  {creators.map((creator: any) => (
                                    <SelectItem key={creator.id} value={creator.id.toString()}>
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                          <AvatarImage src={creator.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${creator.name || creator.email}`} />
                                          <AvatarFallback>{(creator.name || creator.email)?.[0]?.toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span>{creator.name || creator.email}</span>
                                        {creator.instagramHandle && <span className="text-muted-foreground text-xs">@{creator.instagramHandle}</span>}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {selectedCreator && (
                              <>
                                <div className="space-y-2">
                                  <Label>Tipo de Pagamento</Label>
                                  <Select value={paymentType} onValueChange={setPaymentType}>
                                    <SelectTrigger data-testid="select-payment-type">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="payment_fixed">Pagamento fixo</SelectItem>
                                      <SelectItem value="payment_variable">Pagamento avulso</SelectItem>
                                      <SelectItem value="bonus">Bônus</SelectItem>
                                      <SelectItem value="commission">Comissão</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="payment-amount">Valor (R$)</Label>
                                  <Input
                                    id="payment-amount"
                                    placeholder="0,00"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    data-testid="input-payment-amount"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="payment-description">Observação</Label>
                                  <Textarea
                                    id="payment-description"
                                    placeholder="Ex: Pagamento campanha X"
                                    value={paymentDescription}
                                    onChange={(e) => setPaymentDescription(e.target.value)}
                                    data-testid="input-payment-description"
                                  />
                                </div>
                              </>
                            )}
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowPayCreatorDialog(false)}>
                              Cancelar
                            </Button>
                            <Button 
                              onClick={handlePayCreator} 
                              disabled={!selectedCreator || payCreatorMutation.isPending}
                              data-testid="button-confirm-payment"
                            >
                              {payCreatorMutation.isPending ? "Processando..." : "Registrar Pagamento"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-indigo-500" />
                      Ciclo de Faturamento
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hasBillingCycle && cycleStart && cycleEnd ? (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground font-medium">
                          {format(cycleStart, "dd MMM", { locale: ptBR })} - {format(cycleEnd, "dd MMM", { locale: ptBR })}
                        </span>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                          <Clock className="h-3 w-3 mr-1" />
                          {daysRemaining}d restante{daysRemaining !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      
                      <div className="relative">
                        <Progress value={cycleProgress} className="h-3 bg-muted" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {Math.round(cycleProgress)}%
                          </span>
                        </div>
                      </div>

                      <Separator />
                    </>
                  ) : (
                    <div className="text-center py-2 text-muted-foreground text-sm">
                      Ciclo de faturamento não configurado
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Próxima fatura</span>
                      <span className="text-xl font-bold text-foreground" data-testid="next-invoice-amount">
                        {formatCurrency(totalPending)}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <CreditCard className="h-3 w-3" />
                          Pagamentos fixos
                        </span>
                        <span className="font-medium">{formatCurrency(fixedPayments)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Banknote className="h-3 w-3" />
                          Pagamentos avulsos
                        </span>
                        <span className="font-medium">{formatCurrency(variablePayments)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <CircleDollarSign className="h-3 w-3" />
                          Comissões
                        </span>
                        <span className="font-medium">{formatCurrency(commissions)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Gift className="h-3 w-3" />
                          Bônus
                        </span>
                        <span className="font-medium">{formatCurrency(bonuses)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <PiggyBank className="h-4 w-4 text-pink-500" />
                      Caixinhas
                    </CardTitle>
                    <Dialog open={showBoxDialog} onOpenChange={setShowBoxDialog}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" data-testid="button-manage-boxes">
                          <Plus className="h-4 w-4 mr-1" />
                          Nova
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Criar Caixinha</DialogTitle>
                          <DialogDescription>Crie uma caixinha para organizar seus fundos</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Nome</Label>
                            <Input
                              value={boxName}
                              onChange={(e) => setBoxName(e.target.value)}
                              placeholder="Ex: Campanha de Natal"
                              data-testid="input-box-name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Descrição (opcional)</Label>
                            <Textarea
                              value={boxDescription}
                              onChange={(e) => setBoxDescription(e.target.value)}
                              placeholder="Descreva o propósito desta caixinha"
                              data-testid="input-box-description"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Meta (R$) (opcional)</Label>
                            <Input
                              value={boxTargetAmount}
                              onChange={(e) => setBoxTargetAmount(e.target.value)}
                              placeholder="0,00"
                              data-testid="input-box-target"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Cor</Label>
                            <Input
                              type="color"
                              value={boxColor}
                              onChange={(e) => setBoxColor(e.target.value)}
                              className="h-10 w-20"
                              data-testid="input-box-color"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowBoxDialog(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleCreateBox} disabled={createBoxMutation.isPending} data-testid="button-create-box">
                            {createBoxMutation.isPending ? "Criando..." : "Criar Caixinha"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {boxes.length === 0 ? (
                    <div className="text-center py-6">
                      <PiggyBank className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">Nenhuma caixinha criada</p>
                      <p className="text-muted-foreground/70 text-xs mt-1">Organize seus fundos em caixinhas</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {boxes.map((box) => (
                        <div key={box.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors" data-testid={`box-${box.id}`}>
                          <div 
                            className="h-10 w-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: box.color + "20" }}
                          >
                            <PiggyBank className="h-5 w-5" style={{ color: box.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{box.name}</p>
                            <p className="text-muted-foreground text-xs">
                              {formatCurrency(box.currentAmount)}
                              {box.targetAmount && <span className="text-muted-foreground/60"> / {formatCurrency(box.targetAmount)}</span>}
                            </p>
                          </div>
                          {box.targetAmount && (
                            <div className="w-20">
                              <Progress 
                                value={Math.min(100, (box.currentAmount / box.targetAmount) * 100)} 
                                className="h-2"
                              />
                              <p className="text-[10px] text-muted-foreground text-right mt-1">
                                {Math.round((box.currentAmount / box.targetAmount) * 100)}%
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
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
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    Resumo de Pagamentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30">
                      <p className="text-xs text-muted-foreground">Total pago</p>
                      <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalCreatorsPaid)}</p>
                    </div>
                    <div className="space-y-1 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30">
                      <p className="text-xs text-muted-foreground">Pendente</p>
                      <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(totalCreatorsPending)}</p>
                    </div>
                    <div className="space-y-1 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30">
                      <p className="text-xs text-muted-foreground">Creators ativos</p>
                      <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{activeCreatorsCount}</p>
                    </div>
                    <div className="space-y-1 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30">
                      <p className="text-xs text-muted-foreground">Transações</p>
                      <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{transactions.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-muted-foreground" />
                    Extrato
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-40" data-testid="filter-type">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        <SelectItem value="deposit">Depósitos</SelectItem>
                        <SelectItem value="payment_fixed">Pagamento fixo</SelectItem>
                        <SelectItem value="payment_variable">Pagamento avulso</SelectItem>
                        <SelectItem value="commission">Comissões</SelectItem>
                        <SelectItem value="bonus">Bônus</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterCreator} onValueChange={setFilterCreator}>
                      <SelectTrigger className="w-48" data-testid="filter-creator">
                        <SelectValue placeholder="Creator" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os creators</SelectItem>
                        {creatorsWithBalance.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" data-testid="button-download-statement">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {filteredTransactions.length === 0 ? (
                      <div className="text-center py-12">
                        <Receipt className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">Nenhuma transação encontrada</p>
                        <p className="text-muted-foreground/70 text-sm mt-1">As transações aparecerão aqui</p>
                      </div>
                    ) : (
                      filteredTransactions.map((transaction) => (
                        <motion.div
                          key={transaction.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
                          data-testid={`transaction-${transaction.id}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              transaction.amount > 0 
                                ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                                : 'bg-muted'
                            }`}>
                              {getTransactionIcon(transaction.type, transaction.amount)}
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {transaction.description || getTransactionTypeLabel(transaction.type)}
                              </p>
                              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                                <span>{format(new Date(transaction.createdAt), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}</span>
                                <span className="text-muted-foreground/40">•</span>
                                <span>{getTransactionTypeLabel(transaction.type)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`font-semibold text-base ${
                              transaction.amount > 0 
                                ? 'text-emerald-600 dark:text-emerald-400' 
                                : 'text-foreground'
                            }`}>
                              {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                            </span>
                            {getStatusBadge(transaction.status)}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    Faturas
                  </CardTitle>
                  <CardDescription>Histórico de faturas e pagamentos</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar todas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhuma fatura disponível ainda</p>
                <p className="text-muted-foreground/70 text-sm mt-1">As faturas serão geradas ao final de cada ciclo</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="creators" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 border-emerald-200/50 dark:border-emerald-800/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total pago</p>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalCreatorsPaid)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 border-amber-200/50 dark:border-amber-800/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pendente</p>
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(totalCreatorsPending)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/20 dark:to-indigo-800/10 border-indigo-200/50 dark:border-indigo-800/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Creators ativos</p>
                      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{activeCreatorsCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      Carteira de Creators
                    </CardTitle>
                    <CardDescription>Veja os saldos e histórico de pagamentos por creator</CardDescription>
                  </div>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar creator..."
                      value={searchCreator}
                      onChange={(e) => setSearchCreator(e.target.value)}
                      className="pl-9"
                      data-testid="search-creator"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {creatorsWithBalance.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Nenhum pagamento realizado ainda</p>
                    <p className="text-muted-foreground/70 text-sm mt-1">Os creators aparecerão aqui após o primeiro pagamento</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Creator</TableHead>
                          <TableHead className="text-right">Total pago</TableHead>
                          <TableHead className="text-right">Pendente</TableHead>
                          <TableHead className="text-right">Último pagamento</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCreators.map((creator) => (
                          <TableRow key={creator.id} data-testid={`creator-balance-${creator.id}`} className="group">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={creator.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${creator.name}`} />
                                  <AvatarFallback>{creator.name?.[0]?.toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{creator.name}</p>
                                  <p className="text-muted-foreground text-sm">
                                    {creator.instagramHandle ? `@${creator.instagramHandle}` : creator.email}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(creator.totalPaid)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {creator.pendingAmount > 0 ? (
                                <span className="font-medium text-amber-600 dark:text-amber-400">
                                  {formatCurrency(creator.pendingAmount)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground text-sm">
                              {creator.lastPayment 
                                ? formatDistanceToNow(new Date(creator.lastPayment), { addSuffix: true, locale: ptBR })
                                : "-"
                              }
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
