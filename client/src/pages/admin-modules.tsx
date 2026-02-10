import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Gamepad2, 
  BarChart3, 
  ShoppingCart, 
  Radio, 
  Settings2, 
  Loader2,
  Trophy,
  Medal,
  Target,
  PieChart,
  FileText,
  Link2,
  Tag,
  DollarSign,
  Hash,
  Bell,
  Search
} from 'lucide-react';
import type { FeatureFlag } from '@shared/schema';

interface ModuleInfo {
  key: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

const modules: ModuleInfo[] = [
  {
    key: 'gamification',
    title: 'Gamificação',
    description: 'Sistema de pontos, níveis, badges e ranking para criadores',
    icon: Gamepad2,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  {
    key: 'advanced_analytics',
    title: 'Analytics Avançado',
    description: 'Métricas de ROI, relatórios detalhados e exportação em PDF',
    icon: BarChart3,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    key: 'ecommerce',
    title: 'E-commerce & CRM',
    description: 'Integração com Shopify/WooCommerce, cupons e rastreamento de vendas',
    icon: ShoppingCart,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  {
    key: 'social_listening',
    title: 'Social Listening',
    description: 'Monitoramento de menções, hashtags e alertas de marca',
    icon: Radio,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  }
];

const flagIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'gamification_enabled': Trophy,
  'leaderboard_enabled': Medal,
  'competitions_enabled': Target,
  'advanced_analytics_enabled': PieChart,
  'pdf_reports_enabled': FileText,
  'ecommerce_integration_enabled': Link2,
  'coupons_enabled': Tag,
  'sales_tracking_enabled': DollarSign,
  'social_listening_enabled': Search,
  'hashtag_tracking_enabled': Hash,
  'mention_alerts_enabled': Bell,
};

export function AdminModulesContent() {
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();

  const { data: flags, isLoading } = useQuery<FeatureFlag[]>({
    queryKey: ['/api/admin/feature-flags'],
  });

  const updateFlagMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      const res = await fetch(`/api/admin/feature-flags/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error('Failed to update flag');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/feature-flags'] });
      toast.success('Configuração atualizada!');
    },
    onError: () => {
      toast.error('Erro ao atualizar configuração');
    },
  });

  const initializeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/feature-flags/initialize', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to initialize');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/feature-flags'] });
      toast.success('Feature flags inicializados!');
    },
    onError: () => {
      toast.error('Erro ao inicializar feature flags');
    },
  });

  const initializeGamificationMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/gamification/initialize', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to initialize');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Níveis e badges inicializados!');
    },
    onError: () => {
      toast.error('Erro ao inicializar gamificação');
    },
  });

  const getFlagsByModule = (moduleKey: string) => {
    return flags?.filter(f => f.module === moduleKey) || [];
  };

  const getModuleStatus = (moduleKey: string) => {
    const moduleFlags = getFlagsByModule(moduleKey);
    const enabledCount = moduleFlags.filter(f => f.enabled).length;
    if (enabledCount === 0) return 'disabled';
    if (enabledCount === moduleFlags.length) return 'enabled';
    return 'partial';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!flags || flags.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="heading-admin-modules">Módulos da Plataforma</h1>
          <p className="text-gray-500 mt-1">Gerenciamento de funcionalidades avançadas</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings2 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Feature Flags não configurados</h3>
            <p className="text-gray-500 mb-4 text-center">
              Clique no botão abaixo para inicializar os feature flags padrão.
            </p>
            <Button 
              onClick={() => initializeMutation.mutate()}
              disabled={initializeMutation.isPending}
              data-testid="button-initialize-flags"
            >
              {initializeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Inicializar Feature Flags
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="heading-admin-modules">Módulos da Plataforma</h1>
          <p className="text-gray-500 mt-1">Gerenciamento de funcionalidades avançadas</p>
        </div>
        <Button 
          variant="outline"
          onClick={() => initializeGamificationMutation.mutate()}
          disabled={initializeGamificationMutation.isPending}
          data-testid="button-init-gamification"
        >
          {initializeGamificationMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Inicializar Níveis & Badges
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" data-testid="tab-overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="gamification" data-testid="tab-gamification">Gamificação</TabsTrigger>
          <TabsTrigger value="advanced_analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
          <TabsTrigger value="ecommerce" data-testid="tab-ecommerce">E-commerce</TabsTrigger>
          <TabsTrigger value="social_listening" data-testid="tab-social">Social</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.map((module) => {
              const status = getModuleStatus(module.key);
              const moduleFlags = getFlagsByModule(module.key);
              const enabledCount = moduleFlags.filter(f => f.enabled).length;

              return (
                <Card key={module.key} data-testid={`card-module-${module.key}`}>
                  <CardHeader className="flex flex-row items-start gap-4">
                    <div className={`p-3 rounded-lg ${module.bgColor}`}>
                      <module.icon className={`h-6 w-6 ${module.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{module.title}</CardTitle>
                        <Badge 
                          variant={status === 'enabled' ? 'default' : status === 'partial' ? 'secondary' : 'outline'}
                          data-testid={`badge-status-${module.key}`}
                        >
                          {status === 'enabled' ? 'Ativo' : status === 'partial' ? 'Parcial' : 'Desativado'}
                        </Badge>
                      </div>
                      <CardDescription className="mt-1">{module.description}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-500">
                      {enabledCount} de {moduleFlags.length} recursos ativos
                    </div>
                    <div className="mt-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setActiveTab(module.key)}
                        data-testid={`button-config-${module.key}`}
                      >
                        Configurar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {modules.map((module) => (
          <TabsContent key={module.key} value={module.key} className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${module.bgColor}`}>
                    <module.icon className={`h-5 w-5 ${module.color}`} />
                  </div>
                  <div>
                    <CardTitle>{module.title}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {getFlagsByModule(module.key).map((flag) => {
                  const FlagIcon = flagIcons[flag.name] || Settings2;
                  return (
                    <div 
                      key={flag.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`flag-${flag.name}`}
                    >
                      <div className="flex items-center gap-3">
                        <FlagIcon className="h-5 w-5 text-gray-500" />
                        <div>
                          <div className="font-medium">{flag.description}</div>
                          <div className="text-sm text-gray-500">{flag.name}</div>
                        </div>
                      </div>
                      <Switch
                        checked={flag.enabled}
                        onCheckedChange={(enabled) => updateFlagMutation.mutate({ id: flag.id, enabled })}
                        disabled={updateFlagMutation.isPending}
                        data-testid={`switch-${flag.name}`}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default function AdminModulesPage() {
  return <AdminModulesContent />;
}
