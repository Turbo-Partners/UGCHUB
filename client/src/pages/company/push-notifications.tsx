import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Send, Users, Target, Filter, Check, Search, Calendar, Mail } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Creator {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  instagramHandle?: string;
}

interface Campaign {
  id: number;
  title: string;
  creatorIds: number[];
}

interface PushNotification {
  id: number;
  companyId: number;
  title: string;
  message: string;
  targetType: string;
  targetCampaignId?: number;
  sentAt: string;
  recipientCount?: number;
}

export default function PushNotificationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState<"all" | "campaign" | "selected">("all");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [selectedCreatorIds, setSelectedCreatorIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: creatorsData } = useQuery<{
    creators: Creator[];
    campaigns: Campaign[];
    totalCreators: number;
  }>({
    queryKey: ["/api/push-notifications/creators"],
  });

  const { data: sentNotifications } = useQuery<PushNotification[]>({
    queryKey: ["/api/push-notifications"],
  });

  const sendMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      message: string;
      targetType: string;
      campaignId?: number;
      creatorIds?: number[];
    }) => {
      const res = await fetch("/api/push-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Falha ao enviar notificação");
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Notificação enviada!",
        description: `Enviada para ${data.recipientCount} criador(es).`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/push-notifications"] });
      setTitle("");
      setMessage("");
      setTargetType("all");
      setSelectedCampaignId("");
      setSelectedCreatorIds([]);
    },
    onError: () => {
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar a notificação.",
        variant: "destructive",
      });
    },
  });

  const creators = creatorsData?.creators || [];
  const campaigns = creatorsData?.campaigns || [];

  const filteredCreators = creators.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.instagramHandle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRecipientCount = () => {
    if (targetType === "all") return creators.length;
    if (targetType === "campaign" && selectedCampaignId) {
      const campaign = campaigns.find((c) => c.id === parseInt(selectedCampaignId));
      return campaign?.creatorIds.length || 0;
    }
    if (targetType === "selected") return selectedCreatorIds.length;
    return 0;
  };

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e a mensagem.",
        variant: "destructive",
      });
      return;
    }

    sendMutation.mutate({
      title,
      message,
      targetType,
      campaignId: targetType === "campaign" ? parseInt(selectedCampaignId) : undefined,
      creatorIds: targetType === "selected" ? selectedCreatorIds : undefined,
    });
  };

  const toggleCreator = (creatorId: number) => {
    setSelectedCreatorIds((prev) =>
      prev.includes(creatorId)
        ? prev.filter((id) => id !== creatorId)
        : [...prev, creatorId]
    );
  };

  const selectAllCreators = () => {
    if (selectedCreatorIds.length === filteredCreators.length) {
      setSelectedCreatorIds([]);
    } else {
      setSelectedCreatorIds(filteredCreators.map((c) => c.id));
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Bell className="h-8 w-8 text-primary" />
              Push Notifications
            </h1>
            <p className="text-muted-foreground mt-1">
              Envie mensagens diretamente para seus criadores de conteúdo
            </p>
          </div>
        </div>

        <Tabs defaultValue="send" className="space-y-6">
          <TabsList>
            <TabsTrigger value="send" data-testid="tab-send" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Enviar
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="send" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Compor Mensagem
                  </CardTitle>
                  <CardDescription>
                    Crie uma notificação para seus criadores
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      data-testid="input-title"
                      placeholder="Ex: Nova campanha disponível!"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Mensagem</Label>
                    <Textarea
                      id="message"
                      data-testid="input-message"
                      placeholder="Escreva sua mensagem aqui..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {message.length}/500 caracteres
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Destinatários
                  </CardTitle>
                  <CardDescription>
                    Escolha para quem enviar a notificação
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup
                    value={targetType}
                    onValueChange={(v) => setTargetType(v as typeof targetType)}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="all" id="all" data-testid="radio-all" />
                      <Label htmlFor="all" className="flex-1 cursor-pointer">
                        <div className="font-medium">Todos os criadores</div>
                        <div className="text-sm text-muted-foreground">
                          Enviar para todos os {creators.length} criadores aceitos em suas campanhas
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="campaign" id="campaign" data-testid="radio-campaign" />
                      <Label htmlFor="campaign" className="flex-1 cursor-pointer">
                        <div className="font-medium">Criadores de uma campanha</div>
                        <div className="text-sm text-muted-foreground">
                          Enviar para criadores de uma campanha específica
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="selected" id="selected" data-testid="radio-selected" />
                      <Label htmlFor="selected" className="flex-1 cursor-pointer">
                        <div className="font-medium">Criadores selecionados</div>
                        <div className="text-sm text-muted-foreground">
                          Escolher manualmente quem deve receber
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  {targetType === "campaign" && (
                    <div className="space-y-2 pt-2">
                      <Label>Selecionar Campanha</Label>
                      <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                        <SelectTrigger data-testid="select-campaign">
                          <SelectValue placeholder="Escolha uma campanha" />
                        </SelectTrigger>
                        <SelectContent>
                          {campaigns.map((campaign) => (
                            <SelectItem key={campaign.id} value={campaign.id.toString()}>
                              {campaign.title} ({campaign.creatorIds.length} criadores)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {getRecipientCount()} destinatário(s)
                      </span>
                    </div>
                    <Button
                      onClick={handleSend}
                      disabled={sendMutation.isPending || getRecipientCount() === 0}
                      data-testid="button-send"
                    >
                      {sendMutation.isPending ? (
                        "Enviando..."
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Enviar Notificação
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {targetType === "selected" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Selecionar Criadores
                  </CardTitle>
                  <CardDescription>
                    Escolha os criadores que devem receber a notificação
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por nome, email ou @instagram..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9"
                          data-testid="input-search-creators"
                        />
                      </div>
                      <Button
                        variant="outline"
                        onClick={selectAllCreators}
                        data-testid="button-select-all"
                      >
                        {selectedCreatorIds.length === filteredCreators.length
                          ? "Desmarcar todos"
                          : "Selecionar todos"}
                      </Button>
                    </div>

                    <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
                      {filteredCreators.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          Nenhum criador encontrado
                        </div>
                      ) : (
                        filteredCreators.map((creator) => (
                          <div
                            key={creator.id}
                            className={cn(
                              "flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors",
                              selectedCreatorIds.includes(creator.id) && "bg-primary/5"
                            )}
                            onClick={() => toggleCreator(creator.id)}
                            data-testid={`creator-row-${creator.id}`}
                          >
                            <Checkbox
                              checked={selectedCreatorIds.includes(creator.id)}
                              onCheckedChange={() => toggleCreator(creator.id)}
                            />
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={creator.avatar} />
                              <AvatarFallback>
                                {creator.name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {creator.name || "Sem nome"}
                              </div>
                              <div className="text-sm text-muted-foreground truncate">
                                {creator.email}
                              </div>
                            </div>
                            {creator.instagramHandle && (
                              <Badge variant="secondary">
                                @{creator.instagramHandle}
                              </Badge>
                            )}
                            {selectedCreatorIds.includes(creator.id) && (
                              <Check className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {selectedCreatorIds.length} de {filteredCreators.length} criador(es) selecionado(s)
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Notificações Enviadas</CardTitle>
                <CardDescription>
                  Histórico de todas as notificações enviadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!sentNotifications || sentNotifications.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma notificação enviada ainda</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sentNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="border rounded-lg p-4 space-y-2"
                        data-testid={`notification-history-${notification.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{notification.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {notification.targetType === "all"
                              ? "Todos"
                              : notification.targetType === "campaign"
                              ? "Campanha"
                              : "Selecionados"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            {format(new Date(notification.sentAt), "dd 'de' MMMM 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
