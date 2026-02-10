import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Copy, ExternalLink, ShoppingBag, Store, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { EcommerceIntegration } from "@shared/schema";

const platformInfo = {
  shopify: {
    name: "Shopify",
    icon: ShoppingBag,
    color: "bg-green-100 text-green-800",
    webhookPath: "/api/webhooks/shopify/",
  },
  woocommerce: {
    name: "WooCommerce",
    icon: Store,
    color: "bg-purple-100 text-purple-800",
    webhookPath: "/api/webhooks/woocommerce/",
  },
};

export default function EcommerceIntegrations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newPlatform, setNewPlatform] = useState<"shopify" | "woocommerce">("shopify");
  const [newShopUrl, setNewShopUrl] = useState("");

  const { data: integrations, isLoading } = useQuery<EcommerceIntegration[]>({
    queryKey: ["/api/ecommerce-integrations"],
    queryFn: async () => {
      const res = await fetch("/api/ecommerce-integrations", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch integrations");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { platform: string; shopUrl: string }) => {
      const res = await fetch("/api/ecommerce-integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao criar integração");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecommerce-integrations"] });
      setIsAddingNew(false);
      setNewShopUrl("");
      toast({ title: "Integração criada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar integração", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await fetch(`/api/ecommerce-integrations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar integração");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecommerce-integrations"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/ecommerce-integrations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao excluir integração");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecommerce-integrations"] });
      toast({ title: "Integração removida" });
    },
  });

  const copyWebhookUrl = (integration: EcommerceIntegration) => {
    const baseUrl = window.location.origin;
    const platform = platformInfo[integration.platform as keyof typeof platformInfo];
    const webhookUrl = `${baseUrl}${platform.webhookPath}${encodeURIComponent(integration.shopUrl)}`;
    navigator.clipboard.writeText(webhookUrl);
    toast({ title: "URL do webhook copiada!" });
  };

  const handleSubmit = () => {
    if (!newShopUrl.trim()) {
      toast({ title: "URL da loja é obrigatória", variant: "destructive" });
      return;
    }
    createMutation.mutate({ platform: newPlatform, shopUrl: newShopUrl.trim() });
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <Skeleton className="h-10 w-64 mb-8" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
            Integrações E-commerce
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure webhooks para rastrear vendas automaticamente
          </p>
        </div>
        <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-integration">
              <Plus className="h-4 w-4 mr-2" />
              Nova Integração
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Integração</DialogTitle>
              <DialogDescription>
                Configure o webhook para sua loja virtual receber vendas automaticamente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Plataforma</Label>
                <Select value={newPlatform} onValueChange={(v) => setNewPlatform(v as any)}>
                  <SelectTrigger data-testid="select-platform">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shopify">Shopify</SelectItem>
                    <SelectItem value="woocommerce">WooCommerce</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>URL da Loja</Label>
                <Input
                  placeholder="minha-loja.myshopify.com"
                  value={newShopUrl}
                  onChange={(e) => setNewShopUrl(e.target.value)}
                  data-testid="input-shop-url"
                />
                <p className="text-xs text-muted-foreground">
                  Use a URL completa ou identificador único da sua loja
                </p>
              </div>
              <Button 
                onClick={handleSubmit} 
                className="w-full"
                disabled={createMutation.isPending}
                data-testid="button-save-integration"
              >
                {createMutation.isPending ? "Salvando..." : "Salvar Integração"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {integrations?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Nenhuma integração configurada</h3>
            <p className="text-muted-foreground mb-4">
              Adicione sua loja Shopify ou WooCommerce para rastrear vendas automaticamente
            </p>
            <Button onClick={() => setIsAddingNew(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeira Integração
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {integrations?.map((integration) => {
            const platform = platformInfo[integration.platform as keyof typeof platformInfo];
            const Icon = platform.icon;
            const baseUrl = window.location.origin;
            const webhookUrl = `${baseUrl}${platform.webhookPath}${encodeURIComponent(integration.shopUrl)}`;

            return (
              <Card key={integration.id} data-testid={`integration-card-${integration.id}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${platform.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {platform.name}
                        {integration.isActive ? (
                          <Badge variant="outline" className="text-green-600 border-green-300">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            Inativo
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{integration.shopUrl}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={integration.isActive}
                      onCheckedChange={(checked) => 
                        updateMutation.mutate({ id: integration.id, isActive: checked })
                      }
                      data-testid={`switch-active-${integration.id}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(integration.id)}
                      data-testid={`button-delete-${integration.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium mb-1">URL do Webhook</p>
                        <code className="text-xs bg-background px-2 py-1 rounded break-all">
                          {webhookUrl}
                        </code>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyWebhookUrl(integration)}
                        data-testid={`button-copy-${integration.id}`}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar
                      </Button>
                    </div>
                    <div className="mt-4 text-xs text-muted-foreground">
                      <p className="font-medium mb-1">Como configurar:</p>
                      {integration.platform === "shopify" ? (
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Acesse: Configurações → Notificações → Webhooks</li>
                          <li>Clique em "Criar webhook"</li>
                          <li>Evento: "Criação de pedido"</li>
                          <li>Cole a URL acima</li>
                        </ol>
                      ) : (
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Acesse: WooCommerce → Configurações → Avançado → Webhooks</li>
                          <li>Clique em "Adicionar webhook"</li>
                          <li>Tópico: "Pedido criado"</li>
                          <li>Cole a URL acima</li>
                          <li>Segredo: {integration.webhookSecret?.slice(0, 8)}...</li>
                        </ol>
                      )}
                    </div>
                    {integration.lastSyncAt && (
                      <p className="text-xs text-muted-foreground mt-3">
                        Última sincronização: {format(new Date(integration.lastSyncAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Como funciona?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>
            <strong>1. Configure o webhook:</strong> Adicione a URL do webhook na sua loja Shopify ou WooCommerce.
          </p>
          <p>
            <strong>2. Vendas automáticas:</strong> Quando um cliente usa um cupom, a venda é registrada automaticamente.
          </p>
          <p>
            <strong>3. Comissões calculadas:</strong> A comissão do criador é calculada com base na taxa configurada no cupom.
          </p>
          <p>
            <strong>4. Acompanhe em tempo real:</strong> Veja todas as vendas e comissões na aba de vendas da campanha.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
