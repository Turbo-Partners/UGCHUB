import { ReactNode, createContext, useContext, useEffect } from 'react';
import { User, Campaign, Application } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient, getQueryFn } from './queryClient';

export type UserRole = 'company' | 'creator' | 'admin';

interface MarketplaceContextType {
  user: User | null;
  creators: User[];
  login: (data: any) => Promise<void>;
  devLogin: (role?: UserRole) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  campaigns: Campaign[];
  applications: Application[];
  createCampaign: (data: any) => Promise<void>;
  applyToCampaign: (campaignId: number, message: string) => Promise<void>;
  cancelApplication: (applicationId: number) => Promise<void>;
  updateApplicationStatus: (applicationId: number, status: 'accepted' | 'rejected') => Promise<void>;
  getCampaignApplications: (campaignId: number) => Application[];
  getUserApplications: (userId: number) => Application[];
  getCreator: (creatorId: number) => User | undefined;
  isLoading: boolean;
  isImpersonating: boolean;
  stopImpersonation: () => Promise<void>;
}

export const MarketplaceContext = createContext<MarketplaceContextType | null>(null);

export function useMarketplace() {
  const context = useContext(MarketplaceContext);
  if (!context) throw new Error('useMarketplace must be used within a MarketplaceProvider');
  return context;
}

export function MarketplaceProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  // Queries
  const { data: user, isLoading: userLoading } = useQuery<User | null>({
    queryKey: ['/api/user'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ['/api/campaigns'],
    enabled: !!user
  });

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ['/api/applications'],
    enabled: !!user
  });

  const { data: creators = [] } = useQuery<User[]>({
    queryKey: ['/api/creators'],
    enabled: !!user && user.role === 'company'
  });

  // Mutations
  const loginMutation = useMutation({
    mutationFn: async (credentials: any) => {
      const res = await apiRequest('POST', '/api/login', credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(['/api/user'], user);
      // Invalidate all data queries to reload with new session context
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/active-company'] });
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      toast({
        title: `Bem-vindo(a) de volta, ${user.name}!`,
        description: "Login realizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no Login",
        description: "Usuário ou senha incorretos",
        variant: "destructive"
      });
    }
  });

  const devLoginMutation = useMutation({
    mutationFn: async (role: UserRole = 'company') => {
      const res = await apiRequest('POST', '/api/dev/login', { role });
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(['/api/user'], user);
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/active-company'] });
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      toast({
        title: `Login dev: ${user.name}`,
        description: "Sessão criada para desenvolvimento.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no Login Dev",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/register', data);
      return await res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Cadastro Realizado",
        description: "Por favor, verifique seu email para ativar sua conta.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Cadastro Falhou",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/logout');
    },
    onSuccess: () => {
      // Clear the company selection modal flag so it shows again on next login
      const userId = user?.id;
      if (userId) {
        sessionStorage.removeItem(`company_selection_shown_${userId}`);
      }
      
      queryClient.setQueryData(['/api/user'], null);
      queryClient.setQueryData(['/api/campaigns'], []);
      queryClient.setQueryData(['/api/applications'], []);
      toast({
        title: "Desconectado",
        description: "Até logo!",
      });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
        if (!user) throw new Error("Not logged in");
        const res = await apiRequest('PATCH', `/api/user/${user.id}`, data);
        return await res.json();
    },
    onSuccess: (updatedUser) => {
        queryClient.setQueryData(['/api/user'], updatedUser);
        toast({ title: "Perfil Atualizado", description: "Suas alterações foram salvas." });
    }
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: any) => {
        const res = await apiRequest('POST', '/api/campaigns', data);
        return await res.json();
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
        toast({ title: "Campanha Criada", description: "Sua oportunidade está ativa." });
    }
  });

  const applyMutation = useMutation({
    mutationFn: async ({ campaignId, message }: { campaignId: number, message: string }) => {
        const res = await apiRequest('POST', '/api/applications', { campaignId, message });
        return await res.json();
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
        toast({ title: "Candidatura Enviada!", description: "Boa sorte!" });
    },
    onError: (err: Error) => {
        toast({ title: "Falha ao Candidatar-se", description: err.message, variant: "destructive" });
    }
  });

  const updateAppStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: 'accepted' | 'rejected' }) => {
        const res = await apiRequest('PATCH', `/api/applications/${id}/status`, { status });
        return await res.json();
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
        toast({ title: "Status Atualizado" });
    }
  });

  const cancelApplicationMutation = useMutation({
    mutationFn: async (id: number) => {
        await apiRequest('DELETE', `/api/applications/${id}`);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
        toast({ title: "Candidatura Cancelada", description: "Sua candidatura foi removida." });
    },
    onError: (err: Error) => {
        toast({ title: "Falha ao Cancelar", description: err.message, variant: "destructive" });
    }
  });

  const stopImpersonationMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/admin/impersonate/stop');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      toast({ 
        title: "Modo de visualização encerrado", 
        description: "Você voltou à sua conta de admin." 
      });
    },
    onError: (err: Error) => {
      toast({ 
        title: "Erro ao sair", 
        description: err.message, 
        variant: "destructive" 
      });
    }
  });

  // Check if currently impersonating
  const isImpersonating = !!(user as any)?._isImpersonating;

  // Helpers
  const getCampaignApplications = (campaignId: number) => {
    return applications.filter(a => a.campaignId === campaignId);
  };

  const getUserApplications = (userId: number) => {
    return applications.filter(a => a.creatorId === userId);
  };

  // For company view of creator application, we might need to fetch user details if not in 'creators' list
  // But 'creators' query fetches all creators for company.
  const getCreator = (creatorId: number) => {
    return creators.find(u => u.id === creatorId) || (user?.id === creatorId ? user : undefined);
  };

  return (
    <MarketplaceContext.Provider value={{
      user: user || null,
      creators,
      login: async (data) => { await loginMutation.mutateAsync(data); },
      devLogin: async (role) => { await devLoginMutation.mutateAsync(role); },
      register: async (data) => { await registerMutation.mutateAsync(data); },
      logout: async () => { await logoutMutation.mutateAsync(); },
      updateUser: async (data) => { await updateUserMutation.mutateAsync(data); },
      campaigns,
      applications,
      createCampaign: async (data) => { await createCampaignMutation.mutateAsync(data); },
      applyToCampaign: async (campaignId, message) => { await applyMutation.mutateAsync({ campaignId, message }); },
      cancelApplication: async (id) => { await cancelApplicationMutation.mutateAsync(id); },
      updateApplicationStatus: async (id, status) => { await updateAppStatusMutation.mutateAsync({ id, status }); },
      getCampaignApplications,
      getUserApplications,
      getCreator,
      isLoading: userLoading,
      isImpersonating,
      stopImpersonation: async () => { await stopImpersonationMutation.mutateAsync(); }
    }}>
      {children}
    </MarketplaceContext.Provider>
  );
}
