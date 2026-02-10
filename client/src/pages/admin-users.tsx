import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardHeading, CardToolbar } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge-2";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search, Ban, CheckCircle, Mail, MapPin, Instagram, Youtube, Calendar, ArrowUpDown, ArrowUp, ArrowDown, Users, Building2, Shield, MoreHorizontal, Eye, UserX, UserCheck, User as UserIcon, Cake, Hash, Link as LinkIcon, TrendingUp, BadgeCheck, BarChart3, Clock, CreditCard, Wallet, LogIn } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { User } from "@shared/schema";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { StatsCard, StatsGrid } from "@/components/ui/stats-card";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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

type SortField = 'name' | 'email' | 'role' | 'createdAt' | 'isBanned';
type SortOrder = 'asc' | 'desc';

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

export function AdminUsersContent() {
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/admin/users', { role: roleFilter, search: searchQuery, sortBy, sortOrder }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (searchQuery) params.append('search', searchQuery);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      
      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });

  const banMutation = useMutation({
    mutationFn: async ({ userId, isBanned }: { userId: number; isBanned: boolean }) => {
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBanned }),
      });
      if (!response.ok) throw new Error('Failed to update ban status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast.success('Status de usuário atualizado');
      setSelectedUser(null);
    },
    onError: () => {
      toast.error('Erro ao atualizar status');
    },
  });

  const impersonateMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/admin/impersonate/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to impersonate');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      // Redirect to the appropriate dashboard based on user role
      const impersonatedUser = data.impersonatedUser;
      if (impersonatedUser.role === 'creator') {
        window.location.href = '/feed';
      } else if (impersonatedUser.role === 'company') {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/';
      }
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleBanToggle = (user: User) => {
    banMutation.mutate({
      userId: user.id,
      isBanned: !user.isBanned,
    });
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="w-4 h-4 ml-1 text-primary" />
      : <ArrowDown className="w-4 h-4 ml-1 text-primary" />;
  };

  const creatorsCount = users.filter(u => u.role === 'creator').length;
  const companiesCount = users.filter(u => u.role === 'company').length;
  const bannedCount = users.filter(u => u.isBanned).length;

  return (
    <>
      <motion.div 
        className="space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <h1 className="font-heading text-3xl font-bold text-foreground" data-testid="heading-admin-users">
            Gestão de Usuários
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie usuários da plataforma</p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <StatsGrid columns={4}>
            <StatsCard
              title="Total Usuários"
              value={users.length}
              icon={<Users className="h-5 w-5" />}
              subtitle="Usuários cadastrados"
            />
            <StatsCard
              title="Creators"
              value={creatorsCount}
              icon={<Users className="h-5 w-5" />}
              subtitle="Criadores de conteúdo"
            />
            <StatsCard
              title="Empresas"
              value={companiesCount}
              icon={<Building2 className="h-5 w-5" />}
              subtitle="Contas empresariais"
            />
            <StatsCard
              title="Banidos"
              value={bannedCount}
              icon={<UserX className="h-5 w-5" />}
              subtitle="Usuários bloqueados"
              className={bannedCount > 0 ? "border-red-500/20" : ""}
            />
          </StatsGrid>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border">
              <CardHeading>
                <div className="flex flex-col md:flex-row gap-4 w-full">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar por nome ou email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-muted/50"
                      data-testid="input-search-users"
                    />
                  </div>
                  
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full md:w-[200px] bg-muted/50" data-testid="select-role-filter">
                      <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="creator">Creators</SelectItem>
                      <SelectItem value="company">Empresas</SelectItem>
                      <SelectItem value="admin">Administradores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeading>
            </CardHeader>

            <CardContent className="p-0">
              {users.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground">Nenhum usuário encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('name')}
                            className="font-semibold flex items-center hover:bg-transparent p-0 text-muted-foreground hover:text-foreground"
                            data-testid="sort-name"
                          >
                            Nome
                            <SortIcon field="name" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('email')}
                            className="font-semibold flex items-center hover:bg-transparent p-0 text-muted-foreground hover:text-foreground"
                            data-testid="sort-email"
                          >
                            Email
                            <SortIcon field="email" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('role')}
                            className="font-semibold flex items-center hover:bg-transparent p-0 text-muted-foreground hover:text-foreground"
                            data-testid="sort-role"
                          >
                            Tipo
                            <SortIcon field="role" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('createdAt')}
                            className="font-semibold flex items-center hover:bg-transparent p-0 text-muted-foreground hover:text-foreground"
                            data-testid="sort-created-at"
                          >
                            Inscrição
                            <SortIcon field="createdAt" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('isBanned')}
                            className="font-semibold flex items-center hover:bg-transparent p-0 text-muted-foreground hover:text-foreground"
                            data-testid="sort-status"
                          >
                            Status
                            <SortIcon field="isBanned" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user, index) => (
                        <motion.tr
                          key={user.id}
                          data-testid={`user-row-${user.id}`}
                          className="group border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => setSelectedUser(user)}
                        >
                          <TableCell>
                            <Avatar className="w-10 h-10 ring-2 ring-border">
                              <AvatarImage src={user.avatar || undefined} alt={user.name || ""} />
                              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-medium text-foreground" data-testid={`user-name-${user.id}`}>
                            {user.name}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground" data-testid={`user-email-${user.id}`}>
                            {user.email}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={user.role === 'creator' ? 'primary' : user.role === 'admin' ? 'secondary' : 'outline'} 
                              appearance="light"
                              data-testid={`user-role-${user.id}`}
                            >
                              {user.role === 'creator' ? (
                                <>
                                  <Users className="w-3 h-3 mr-1" />
                                  Creator
                                </>
                              ) : user.role === 'company' ? (
                                <>
                                  <Building2 className="w-3 h-3 mr-1" />
                                  Empresa
                                </>
                              ) : (
                                <>
                                  <Shield className="w-3 h-3 mr-1" />
                                  Admin
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground" data-testid={`user-created-${user.id}`}>
                            {user.createdAt ? format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                          </TableCell>
                          <TableCell>
                            {user.isBanned ? (
                              <Badge variant="destructive" appearance="light" data-testid={`user-status-${user.id}`}>
                                <UserX className="w-3 h-3 mr-1" />
                                Banido
                              </Badge>
                            ) : (
                              <Badge variant="success" appearance="light" data-testid={`user-status-${user.id}`}>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Ativo
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                  data-testid={`button-actions-${user.id}`}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedUser(user)} data-testid={`menu-view-details-${user.id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Ver detalhes
                                </DropdownMenuItem>
                                {user.role !== 'admin' && (
                                  <>
                                    <DropdownMenuItem 
                                      onClick={() => impersonateMutation.mutate(user.id)}
                                      className="text-blue-600"
                                      data-testid={`menu-impersonate-${user.id}`}
                                    >
                                      <LogIn className="w-4 h-4 mr-2" />
                                      Entrar como usuário
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handleBanToggle(user)}
                                      className={user.isBanned ? "text-green-600" : "text-destructive"}
                                      data-testid={`menu-ban-toggle-${user.id}`}
                                    >
                                      {user.isBanned ? (
                                        <>
                                          <UserCheck className="w-4 h-4 mr-2" />
                                          Desbanir usuário
                                        </>
                                      ) : (
                                        <>
                                          <UserX className="w-4 h-4 mr-2" />
                                          Banir usuário
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-2xl" data-testid="dialog-user-details">
            <DialogHeader>
              <DialogTitle className="font-heading">Detalhes do Usuário</DialogTitle>
              <DialogDescription>
                Informações completas de {selectedUser.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                <Avatar className="w-20 h-20 ring-4 ring-border">
                  <AvatarImage src={selectedUser.avatar || undefined} alt={selectedUser.name || ""} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
                    {getInitials(selectedUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold font-heading text-foreground">{selectedUser.name}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={selectedUser.role === 'creator' ? 'primary' : 'secondary'} appearance="light">
                      {selectedUser.role === 'creator' ? 'Creator' : selectedUser.role === 'company' ? 'Empresa' : 'Admin'}
                    </Badge>
                    {selectedUser.isBanned && (
                      <Badge variant="destructive" appearance="light">Banido</Badge>
                    )}
                  </div>
                </div>
              </div>

              {selectedUser.role === 'creator' && (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  {/* Bio */}
                  <div className="p-4 rounded-xl bg-muted/30">
                    <h4 className="font-semibold mb-2 text-foreground">Bio</h4>
                    <p className="text-sm text-muted-foreground">{selectedUser.bio || 'Não informado'}</p>
                  </div>

                  {/* Dados Demográficos */}
                  <div className="p-4 rounded-xl bg-muted/30">
                    <h4 className="font-semibold mb-3 text-foreground">Dados Pessoais</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                          <Cake className="w-4 h-4 text-purple-500" />
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Data de Nascimento / Idade</span>
                          <p className="text-sm font-medium text-foreground">
                            {selectedUser.dateOfBirth 
                              ? `${format(new Date(selectedUser.dateOfBirth), 'dd/MM/yyyy', { locale: ptBR })} (${Math.floor((new Date().getTime() - new Date(selectedUser.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} anos)`
                              : 'Não informado'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <UserIcon className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Gênero</span>
                          <p className="text-sm font-medium text-foreground">
                            {selectedUser.gender 
                              ? selectedUser.gender === 'masculino' ? 'Masculino' 
                                : selectedUser.gender === 'feminino' ? 'Feminino' 
                                : selectedUser.gender === 'outro' ? 'Outro' 
                                : 'Prefere não informar'
                              : 'Não informado'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nichos */}
                  <div className="p-4 rounded-xl bg-muted/30">
                    <h4 className="font-semibold mb-2 text-foreground">Nichos</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.niche && selectedUser.niche.length > 0 ? (
                        selectedUser.niche.map((n, i) => (
                          <Badge key={i} variant="outline" appearance="light">{n}</Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">Não informado</span>
                      )}
                    </div>
                  </div>

                  {/* Redes Sociais */}
                  <div className="p-4 rounded-xl bg-muted/30">
                    <h4 className="font-semibold mb-3 text-foreground">Redes Sociais</h4>
                    <div className="space-y-3 text-sm">
                      {selectedUser.instagram && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                          <div className="p-2 rounded-lg bg-pink-500/10">
                            <Instagram className="w-4 h-4 text-pink-500" />
                          </div>
                          <div className="flex-1">
                            <span className="font-medium text-foreground">@{selectedUser.instagram}</span>
                            {selectedUser.instagramFollowers && (
                              <p className="text-muted-foreground text-xs">
                                {selectedUser.instagramFollowers.toLocaleString('pt-BR')} seguidores
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      {selectedUser.youtube && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                          <div className="p-2 rounded-lg bg-red-500/10">
                            <Youtube className="w-4 h-4 text-red-500" />
                          </div>
                          <span className="font-medium text-foreground">{selectedUser.youtube}</span>
                        </div>
                      )}
                      {selectedUser.tiktok && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                          <div className="p-2 rounded-lg bg-zinc-900/10 dark:bg-white/10">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                            </svg>
                          </div>
                          <span className="font-medium text-foreground">@{selectedUser.tiktok}</span>
                        </div>
                      )}
                      {selectedUser.portfolioUrl && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                          <div className="p-2 rounded-lg bg-emerald-500/10">
                            <LinkIcon className="w-4 h-4 text-emerald-500" />
                          </div>
                          <a 
                            href={selectedUser.portfolioUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium text-primary hover:underline truncate"
                          >
                            {selectedUser.portfolioUrl}
                          </a>
                        </div>
                      )}
                      {selectedUser.followers && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                          <div className="p-2 rounded-lg bg-amber-500/10">
                            <Users className="w-4 h-4 text-amber-500" />
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Seguidores (informado)</span>
                            <p className="font-medium text-foreground">{selectedUser.followers}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Métricas Verificadas do Instagram */}
                  {selectedUser.instagram && (selectedUser.instagramFollowers || selectedUser.instagramEngagementRate || selectedUser.instagramAuthenticityScore) && (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-pink-500/5 to-purple-500/5 border border-pink-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <BadgeCheck className="w-4 h-4 text-pink-500" />
                        <h4 className="font-semibold text-foreground">Métricas Verificadas do Instagram</h4>
                        {selectedUser.instagramLastUpdated && (
                          <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(selectedUser.instagramLastUpdated), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="p-3 rounded-lg bg-background text-center">
                          <p className="text-lg font-bold text-foreground">
                            {selectedUser.instagramFollowers?.toLocaleString('pt-BR') || '-'}
                          </p>
                          <span className="text-xs text-muted-foreground">Seguidores</span>
                        </div>
                        <div className="p-3 rounded-lg bg-background text-center">
                          <p className="text-lg font-bold text-foreground">
                            {selectedUser.instagramFollowing?.toLocaleString('pt-BR') || '-'}
                          </p>
                          <span className="text-xs text-muted-foreground">Seguindo</span>
                        </div>
                        <div className="p-3 rounded-lg bg-background text-center">
                          <p className="text-lg font-bold text-foreground">
                            {selectedUser.instagramPosts?.toLocaleString('pt-BR') || '-'}
                          </p>
                          <span className="text-xs text-muted-foreground">Posts</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                          <div className="p-2 rounded-lg bg-green-500/10">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Taxa de Engajamento</span>
                            <p className="text-sm font-bold text-foreground">
                              {selectedUser.instagramEngagementRate || '-'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                          <div className="p-2 rounded-lg bg-blue-500/10">
                            <BarChart3 className="w-4 h-4 text-blue-500" />
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Score Autenticidade</span>
                            <p className="text-sm font-bold text-foreground">
                              {selectedUser.instagramAuthenticityScore != null ? `${selectedUser.instagramAuthenticityScore}%` : '-'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {selectedUser.instagramVerified && (
                        <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-blue-500/10">
                          <BadgeCheck className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Conta Verificada no Instagram</span>
                        </div>
                      )}

                      {selectedUser.instagramTopHashtags && selectedUser.instagramTopHashtags.length > 0 && (
                        <div className="mt-3">
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                            <Hash className="w-3 h-3" />
                            Top Hashtags
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {selectedUser.instagramTopHashtags.slice(0, 10).map((tag, i) => (
                              <Badge key={i} variant="secondary" appearance="light" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedUser.instagramTopPosts && Array.isArray(selectedUser.instagramTopPosts) && selectedUser.instagramTopPosts.length > 0 && (
                        <div className="mt-4">
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                            <Instagram className="w-3 h-3" />
                            Top Posts
                          </span>
                          <div className="grid grid-cols-3 gap-2">
                            {(selectedUser.instagramTopPosts as Array<{id: string; url: string; imageUrl: string; caption: string; likes: number; comments: number; timestamp: string;}>).slice(0, 6).map((post, i) => (
                              <a 
                                key={post.id || i}
                                href={post.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="group relative aspect-square rounded-lg overflow-hidden bg-muted hover:ring-2 hover:ring-primary transition-all"
                              >
                                <img 
                                  src={post.imageUrl} 
                                  alt={post.caption?.slice(0, 50) || 'Post'} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs">
                                  <div className="flex items-center gap-2">
                                    <span>❤️ {post.likes?.toLocaleString('pt-BR') || 0}</span>
                                    <span>💬 {post.comments?.toLocaleString('pt-BR') || 0}</span>
                                  </div>
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Localização */}
                  {(selectedUser.city || selectedUser.state) && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <MapPin className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Localização</h4>
                        <p className="text-sm text-muted-foreground">
                          {[selectedUser.city, selectedUser.state].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Informações Bancárias (Pix) */}
                  {selectedUser.pixKey && (
                    <div className="p-4 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-2 mb-3">
                        <Wallet className="w-4 h-4 text-emerald-500" />
                        <h4 className="font-semibold text-foreground">Informações Bancárias</h4>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                          <CreditCard className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="flex-1">
                          <span className="text-xs text-muted-foreground">Chave Pix</span>
                          <p className="text-sm font-medium text-foreground font-mono">
                            {selectedUser.pixKey}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Data de Cadastro */}
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30">
                    <div className="p-2 rounded-lg bg-zinc-500/10">
                      <Calendar className="w-4 h-4 text-zinc-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Membro desde</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedUser.createdAt 
                          ? format(new Date(selectedUser.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                          : 'Data não disponível'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedUser.role === 'company' && (
                <div className="p-4 rounded-xl bg-muted/30">
                  <h4 className="font-semibold mb-2 text-foreground">Nome da Empresa</h4>
                  <p className="text-sm text-muted-foreground">{selectedUser.companyName || 'Não informado'}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedUser(null)}>
                Fechar
              </Button>
              {selectedUser.role !== 'admin' && (
                <Button 
                  variant={selectedUser.isBanned ? "default" : "destructive"}
                  onClick={() => handleBanToggle(selectedUser)}
                >
                  {selectedUser.isBanned ? (
                    <>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Desbanir
                    </>
                  ) : (
                    <>
                      <UserX className="w-4 h-4 mr-2" />
                      Banir
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
