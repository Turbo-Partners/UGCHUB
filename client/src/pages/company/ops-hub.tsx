import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMarketplace } from "@/lib/provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, 
  Package, 
  PackageCheck, 
  FileCheck, 
  AlertCircle, 
  Link2, 
  BarChart3, 
  Clock, 
  CheckCircle, 
  X,
  RefreshCw,
  ChevronRight,
  Filter,
  Inbox,
  SortAsc,
  SortDesc,
  Search,
  Building2,
  User,
  Wifi,
  WifiOff
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "wouter";

interface OpsTask {
  id: number;
  brandId: number;
  campaignId?: number;
  creatorId?: number;
  applicationId?: number;
  type: string;
  status: string;
  dueAt?: string;
  metadataJson?: {
    inviteId?: number;
    applicationId?: number;
    deliverableId?: number;
    couponCode?: string;
    daysPending?: number;
    creatorName?: string;
    campaignTitle?: string;
  };
  createdAt: string;
  completedAt?: string;
  brand?: { id: number; name: string; logo: string | null };
  creator?: { id: number; name: string; avatar: string | null };
  campaign?: { id: number; title: string };
}

const taskTypeLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  followup_invite: { 
    label: "Convite sem resposta", 
    icon: <Bell className="h-4 w-4" />,
    color: "bg-amber-100 text-amber-800"
  },
  ship_product: { 
    label: "Enviar produto", 
    icon: <Package className="h-4 w-4" />,
    color: "bg-blue-100 text-blue-800"
  },
  confirm_received: { 
    label: "Aguardando recebimento", 
    icon: <PackageCheck className="h-4 w-4" />,
    color: "bg-purple-100 text-purple-800"
  },
  review_deliverable: { 
    label: "Revisar entregável", 
    icon: <FileCheck className="h-4 w-4" />,
    color: "bg-green-100 text-green-800"
  },
  request_fix: { 
    label: "Reenvio necessário", 
    icon: <AlertCircle className="h-4 w-4" />,
    color: "bg-red-100 text-red-800"
  },
  collect_post_url: { 
    label: "Coletar URL do post", 
    icon: <Link2 className="h-4 w-4" />,
    color: "bg-cyan-100 text-cyan-800"
  },
  check_coupon_sales: { 
    label: "Verificar vendas", 
    icon: <BarChart3 className="h-4 w-4" />,
    color: "bg-emerald-100 text-emerald-800"
  },
};

type SortOption = 'newest' | 'oldest' | 'urgency';

export default function OpsHubPage() {
  const { toast } = useToast();
  const { user } = useMarketplace();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrandId, setSelectedBrandId] = useState<string>("all");
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;

    const cleanup = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.onclose = null;
        if (wsRef.current.readyState === WebSocket.OPEN || 
            wsRef.current.readyState === WebSocket.CONNECTING) {
          wsRef.current.close();
        }
        wsRef.current = null;
      }
    };

    const connect = () => {
      cleanup();
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/notifications`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[OpsHub WebSocket] Connected');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'ops:task_created' || 
              data.type === 'ops:task_updated' || 
              data.type === 'creator:workflow_changed') {
            queryClient.invalidateQueries({ queryKey: ["/api/company/ops-tasks"] });
            if (data.type === 'ops:task_created') {
              toast({
                title: "Nova tarefa",
                description: "Uma nova tarefa operacional foi criada.",
              });
            }
          }
        } catch (error) {
          console.error('[OpsHub WebSocket] Error parsing message:', error);
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('[OpsHub WebSocket] Disconnected');
        setIsConnected(false);
        if (wsRef.current === ws) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('[OpsHub WebSocket] Attempting to reconnect...');
            connect();
          }, 5000);
        }
      };
    };

    connect();

    return cleanup;
  }, [user, queryClient, toast]);

  const { data: tasks = [], isLoading, refetch } = useQuery<OpsTask[]>({
    queryKey: ["/api/company/ops-tasks", showCompleted ? "all" : "pending"],
    queryFn: async () => {
      const status = showCompleted ? undefined : "pending";
      const url = status ? `/api/company/ops-tasks?status=${status}` : "/api/company/ops-tasks";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const res = await fetch(`/api/ops-tasks/${taskId}/complete`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to complete task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/ops-tasks"] });
      toast({ title: "Tarefa concluída", description: "A tarefa foi marcada como concluída." });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const res = await fetch(`/api/ops-tasks/${taskId}/dismiss`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to dismiss task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/ops-tasks"] });
      toast({ title: "Tarefa dispensada", description: "A tarefa foi removida da lista." });
    },
  });

  const groupedByType = tasks.reduce((acc, task) => {
    if (!acc[task.type]) acc[task.type] = [];
    acc[task.type].push(task);
    return acc;
  }, {} as Record<string, OpsTask[]>);

  const uniqueBrands = Array.from(new Map(tasks.filter(t => t.brand).map(t => [t.brandId, t.brand!])).values());
  const uniqueCreators = Array.from(new Map(tasks.filter(t => t.creator).map(t => [t.creatorId, t.creator!])).values());

  const filteredTasks = tasks
    .filter(t => selectedType ? t.type === selectedType : true)
    .filter(t => selectedBrandId !== "all" ? t.brandId === parseInt(selectedBrandId) : true)
    .filter(t => selectedCreatorId !== "all" ? t.creatorId === parseInt(selectedCreatorId) : true)
    .filter(t => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        t.brand?.name?.toLowerCase().includes(search) ||
        t.creator?.name?.toLowerCase().includes(search) ||
        t.campaign?.title?.toLowerCase().includes(search) ||
        t.metadataJson?.creatorName?.toLowerCase().includes(search) ||
        t.metadataJson?.campaignTitle?.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'urgency':
          const aUrgency = a.metadataJson?.daysPending || 0;
          const bUrgency = b.metadataJson?.daysPending || 0;
          return bUrgency - aUrgency;
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const pendingCounts = Object.entries(groupedByType).map(([type, items]) => ({
    type,
    count: items.filter(t => t.status === "pending").length,
  }));

  const totalPending = pendingCounts.reduce((sum, { count }) => sum + count, 0);
  const hasActiveFilters = selectedType || selectedBrandId !== "all" || selectedCreatorId !== "all" || searchTerm;

  const clearAllFilters = () => {
    setSelectedType(null);
    setSelectedBrandId("all");
    setSelectedCreatorId("all");
    setSearchTerm("");
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Inbox className="h-6 w-6" />
            Inbox Operacional
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todas as pendências operacionais em um só lugar
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge variant="outline" className="gap-1.5 text-green-600 border-green-200 bg-green-50" data-testid="badge-connection-status">
              <Wifi className="h-3 w-3" />
              Tempo real
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1.5 text-muted-foreground" data-testid="badge-connection-status">
              <WifiOff className="h-3 w-3" />
              Reconectando...
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCompleted(!showCompleted)}
            data-testid="button-toggle-completed"
          >
            {showCompleted ? "Ver apenas pendentes" : "Mostrar concluídas"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        {Object.entries(taskTypeLabels).map(([type, { label, icon, color }]) => {
          const count = groupedByType[type]?.filter(t => t.status === "pending").length || 0;
          const isActive = selectedType === type;
          
          return (
            <Card 
              key={type}
              className={`cursor-pointer transition-all hover:shadow-md ${isActive ? "ring-2 ring-primary" : ""}`}
              onClick={() => setSelectedType(isActive ? null : type)}
              data-testid={`card-filter-${type}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded ${color}`}>
                    {icon}
                  </div>
                  <span className="text-2xl font-bold">{count}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Advanced Filters Bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tarefas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-tasks"
              />
            </div>

            {/* Brand Filter */}
            {uniqueBrands.length > 0 && (
              <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
                <SelectTrigger className="w-[180px]" data-testid="select-brand">
                  <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Todas as marcas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as marcas</SelectItem>
                  {uniqueBrands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id.toString()}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Creator Filter */}
            {uniqueCreators.length > 0 && (
              <Select value={selectedCreatorId} onValueChange={setSelectedCreatorId}>
                <SelectTrigger className="w-[180px]" data-testid="select-creator">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Todos os criadores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os criadores</SelectItem>
                  {uniqueCreators.map((creator) => (
                    <SelectItem key={creator.id} value={creator.id.toString()}>
                      {creator.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[160px]" data-testid="select-sort">
                {sortBy === 'newest' ? (
                  <SortDesc className="h-4 w-4 mr-2 text-muted-foreground" />
                ) : (
                  <SortAsc className="h-4 w-4 mr-2 text-muted-foreground" />
                )}
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mais recentes</SelectItem>
                <SelectItem value="oldest">Mais antigas</SelectItem>
                <SelectItem value="urgency">Mais urgentes</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} data-testid="button-clear-filters">
                <X className="h-4 w-4 mr-1" />
                Limpar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {selectedType && (
            <Badge variant="secondary" className="text-sm" data-testid="badge-filter-type">
              <Filter className="h-3 w-3 mr-1" />
              Tipo: {taskTypeLabels[selectedType]?.label}
              <button onClick={() => setSelectedType(null)} className="ml-1 hover:text-foreground" data-testid="button-clear-filter-type">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedBrandId !== "all" && (
            <Badge variant="secondary" className="text-sm" data-testid="badge-filter-brand">
              <Building2 className="h-3 w-3 mr-1" />
              Marca: {uniqueBrands.find(b => b.id.toString() === selectedBrandId)?.name}
              <button onClick={() => setSelectedBrandId("all")} className="ml-1 hover:text-foreground" data-testid="button-clear-filter-brand">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedCreatorId !== "all" && (
            <Badge variant="secondary" className="text-sm" data-testid="badge-filter-creator">
              <User className="h-3 w-3 mr-1" />
              Criador: {uniqueCreators.find(c => c.id.toString() === selectedCreatorId)?.name}
              <button onClick={() => setSelectedCreatorId("all")} className="ml-1 hover:text-foreground" data-testid="button-clear-filter-creator">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {searchTerm && (
            <Badge variant="secondary" className="text-sm" data-testid="badge-filter-search">
              <Search className="h-3 w-3 mr-1" />
              "{searchTerm}"
              <button onClick={() => setSearchTerm("")} className="ml-1 hover:text-foreground" data-testid="button-clear-filter-search">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <span className="text-sm text-muted-foreground ml-2">
            {filteredTasks.length} resultado{filteredTasks.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold">Tudo em dia!</h3>
            <p className="text-muted-foreground">
              {showCompleted ? "Nenhuma tarefa encontrada." : "Não há tarefas pendentes no momento."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const typeInfo = taskTypeLabels[task.type] || { label: task.type, icon: <Clock />, color: "bg-gray-100" };
            
            return (
              <Card key={task.id} className="hover:shadow-sm transition-shadow" data-testid={`card-task-${task.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                        {typeInfo.icon}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{typeInfo.label}</span>
                          {task.status === "completed" && (
                            <Badge variant="outline" className="text-green-600">Concluída</Badge>
                          )}
                          {task.status === "dismissed" && (
                            <Badge variant="outline" className="text-gray-500">Dispensada</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {task.brand && (
                            <span className="flex items-center gap-1">
                              {task.brand.logo ? (
                                <img src={task.brand.logo} alt="" className="h-4 w-4 rounded" />
                              ) : null}
                              {task.brand.name}
                            </span>
                          )}
                          
                          {task.creator && (
                            <span className="flex items-center gap-1">
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={task.creator.avatar || undefined} />
                                <AvatarFallback className="text-[8px]">
                                  {task.creator.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {task.metadataJson?.creatorName || task.creator.name}
                            </span>
                          )}
                          
                          {task.campaign && (
                            <span className="truncate max-w-[200px]">
                              {task.metadataJson?.campaignTitle || task.campaign.title}
                            </span>
                          )}
                        </div>
                        
                        {task.metadataJson?.daysPending && (
                          <p className="text-sm text-amber-600 mt-1">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {task.metadataJson.daysPending} dias aguardando
                          </p>
                        )}
                        
                        <p className="text-xs text-muted-foreground mt-2">
                          Criada {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    
                    {task.status === "pending" && (
                      <div className="flex items-center gap-2">
                        {task.applicationId && (
                          <Link href={`/company/campaigns/${task.campaignId}?tab=applicants`}>
                            <Button variant="ghost" size="sm" data-testid={`button-view-${task.id}`}>
                              Ver
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => completeMutation.mutate(task.id)}
                          disabled={completeMutation.isPending}
                          data-testid={`button-complete-${task.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Concluir
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dismissMutation.mutate(task.id)}
                          disabled={dismissMutation.isPending}
                          data-testid={`button-dismiss-${task.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {totalPending > 0 && !selectedType && (
        <div className="mt-8">
          <Card className="bg-muted/50">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">
                {totalPending} {totalPending === 1 ? "tarefa pendente" : "tarefas pendentes"} no total.
                Clique em um tipo acima para filtrar.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
