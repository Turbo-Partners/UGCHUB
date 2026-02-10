import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardHeading, CardToolbar } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge-2";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertCircle, CheckCircle, Clock, Mail, MessageSquare, FileText, MoreHorizontal, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ProblemReport, User } from "@shared/schema";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { StatsCard, StatsGrid } from "@/components/ui/stats-card";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getInitials(name: string | null | undefined): string {
  if (!name || !name.trim()) return "?";
  return name
    .trim()
    .split(" ")
    .filter((n) => n.length > 0)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
}

type ProblemReportWithUser = ProblemReport & { user: User };

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export function AdminSupportContent() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<ProblemReportWithUser | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const queryClient = useQueryClient();

  const { data: reports = [] } = useQuery<ProblemReportWithUser[]>({
    queryKey: ['/api/admin/problem-reports', { status: statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await fetch(`/api/admin/problem-reports?${params}`);
      if (!response.ok) throw new Error('Failed to fetch reports');
      return response.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ 
      reportId, 
      status, 
      adminNotes 
    }: { 
      reportId: number; 
      status?: string; 
      adminNotes?: string 
    }) => {
      const response = await fetch(`/api/admin/problem-reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes }),
      });
      if (!response.ok) throw new Error('Failed to update report');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/problem-reports'] });
      toast.success('Relatório atualizado');
      setSelectedReport(null);
      setAdminNotes("");
    },
    onError: () => {
      toast.error('Erro ao atualizar relatório');
    },
  });

  const handleStatusChange = (reportId: number, newStatus: string) => {
    updateMutation.mutate({ reportId, status: newStatus });
  };

  const handleSaveNotes = () => {
    if (!selectedReport) return;
    updateMutation.mutate({ 
      reportId: selectedReport.id, 
      adminNotes 
    });
  };

  const openCount = reports.filter(r => r.status === 'open').length;
  const inProgressCount = reports.filter(r => r.status === 'in_progress').length;
  const resolvedCount = reports.filter(r => r.status === 'resolved').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <Badge variant="destructive" appearance="light">
            <AlertCircle className="w-3 h-3 mr-1" />
            Aberto
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="warning" appearance="light">
            <Clock className="w-3 h-3 mr-1" />
            Em Progresso
          </Badge>
        );
      case 'resolved':
        return (
          <Badge variant="success" appearance="light">
            <CheckCircle className="w-3 h-3 mr-1" />
            Resolvido
          </Badge>
        );
      default:
        return <Badge variant="secondary" appearance="light">{status}</Badge>;
    }
  };

  return (
    <>
      <motion.div 
        className="space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground" data-testid="heading-admin-support">
              Central de Suporte
            </h1>
            <p className="text-muted-foreground mt-1">Gerencie relatórios de problemas</p>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px] bg-muted/50" data-testid="select-status-filter">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="open">Abertos</SelectItem>
              <SelectItem value="in_progress">Em Progresso</SelectItem>
              <SelectItem value="resolved">Resolvidos</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        <motion.div variants={itemVariants}>
          <StatsGrid columns={3}>
            <StatsCard
              title="Abertos"
              value={openCount}
              icon={<AlertCircle className="h-5 w-5" />}
              subtitle="Aguardando resposta"
              className={openCount > 0 ? "border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent" : ""}
            />
            <StatsCard
              title="Em Progresso"
              value={inProgressCount}
              icon={<Clock className="h-5 w-5" />}
              subtitle="Sendo analisados"
              className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent"
            />
            <StatsCard
              title="Resolvidos"
              value={resolvedCount}
              icon={<CheckCircle className="h-5 w-5" />}
              subtitle="Finalizados"
              className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent"
            />
          </StatsGrid>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-4">
          {reports.length === 0 ? (
            <Card>
              <CardContent className="py-16">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground">Nenhum relatório encontrado</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            reports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className="group hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer overflow-hidden"
                  onClick={() => {
                    setSelectedReport(report);
                    setAdminNotes(report.adminNotes || "");
                  }}
                  data-testid={`report-item-${report.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-heading font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                            {report.subject}
                          </h3>
                          {getStatusBadge(report.status)}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={report.user.avatar || undefined} />
                              <AvatarFallback className="text-xs">{getInitials(report.user.name)}</AvatarFallback>
                            </Avatar>
                            {report.user.name}
                          </div>
                          <span className="text-muted-foreground/50">•</span>
                          <span>
                            {format(new Date(report.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            data-testid={`button-report-menu-${report.id}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={() => handleStatusChange(report.id, 'open')} data-testid={`menu-status-open-${report.id}`}>
                            <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                            Marcar como Aberto
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(report.id, 'in_progress')} data-testid={`menu-status-progress-${report.id}`}>
                            <Clock className="w-4 h-4 mr-2 text-amber-500" />
                            Marcar como Em Progresso
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(report.id, 'resolved')} data-testid={`menu-status-resolved-${report.id}`}>
                            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                            Marcar como Resolvido
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground line-clamp-2">{report.description}</p>
                    {report.adminNotes && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <FileText className="w-3 h-3" />
                          <span className="font-medium">Notas internas disponíveis</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>
      </motion.div>

      {selectedReport && (
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="max-w-2xl" data-testid="dialog-report-details">
            <DialogHeader>
              <DialogTitle className="font-heading">{selectedReport.subject}</DialogTitle>
              <DialogDescription>
                Relatado por {selectedReport.user.name} em {format(new Date(selectedReport.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-muted/50">
                <h4 className="font-semibold mb-3 text-foreground">Status do Relatório</h4>
                <Select 
                  value={selectedReport.status} 
                  onValueChange={(value) => handleStatusChange(selectedReport.id, value)}
                >
                  <SelectTrigger data-testid="select-report-status" className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        Aberto
                      </div>
                    </SelectItem>
                    <SelectItem value="in_progress">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500" />
                        Em Progresso
                      </div>
                    </SelectItem>
                    <SelectItem value="resolved">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Resolvido
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 rounded-xl bg-muted/50">
                <h4 className="font-semibold mb-3 text-foreground">Informações do Usuário</h4>
                <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                  <Avatar className="w-12 h-12 ring-2 ring-border">
                    <AvatarImage src={selectedReport.user.avatar || undefined} alt={selectedReport.user.name || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getInitials(selectedReport.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{selectedReport.user.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedReport.user.email}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Mail className="w-4 h-4 mr-2" />
                    Contatar
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/50">
                <h4 className="font-semibold mb-3 text-foreground">Descrição do Problema</h4>
                <div className="p-4 bg-background rounded-lg border border-border">
                  <p className="text-foreground whitespace-pre-wrap">{selectedReport.description}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/50">
                <h4 className="font-semibold mb-3 text-foreground">Notas Administrativas</h4>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Adicione notas internas sobre este relatório..."
                  rows={4}
                  className="bg-background"
                  data-testid="textarea-admin-notes"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedReport(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveNotes} data-testid="button-save-notes">
                Salvar Notas
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
