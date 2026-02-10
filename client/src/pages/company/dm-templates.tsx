import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, MessageSquare, Copy, Eye, Send } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DmTemplate } from "@shared/schema";

const templateTypeLabels: Record<string, { label: string; color: string }> = {
  campaign_invite: { label: "Convite Campanha", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  community_invite: { label: "Convite Comunidade", color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
  follow_up: { label: "Follow-up", color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  welcome: { label: "Boas-vindas", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  custom: { label: "Personalizado", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
};

const availableVariables = [
  { name: "nome_criador", description: "Nome do criador de conteúdo" },
  { name: "nome_campanha", description: "Nome da campanha" },
  { name: "valor", description: "Valor do pagamento/comissão" },
  { name: "link_campanha", description: "Link para a campanha" },
  { name: "marca", description: "Nome da marca/empresa" },
  { name: "prazo", description: "Prazo de entrega" },
];

const defaultFormData = {
  name: "",
  type: "custom" as const,
  content: "",
  isDefault: false,
};

export default function DmTemplatesPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DmTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<DmTemplate | null>(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});

  const { data: templates = [], isLoading } = useQuery<DmTemplate[]>({
    queryKey: ["/api/dm-templates"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof defaultFormData) => {
      const res = await fetch("/api/dm-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Falha ao criar template");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dm-templates"] });
      setIsCreateOpen(false);
      setFormData(defaultFormData);
      toast.success("Template criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar template", { description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof defaultFormData> }) => {
      const res = await fetch(`/api/dm-templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Falha ao atualizar template");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dm-templates"] });
      setIsEditOpen(false);
      setSelectedTemplate(null);
      setFormData(defaultFormData);
      toast.success("Template atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar template", { description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/dm-templates/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Falha ao deletar template");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dm-templates"] });
      setTemplateToDelete(null);
      toast.success("Template deletado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao deletar template");
    },
  });

  const openEdit = (template: DmTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      type: template.type as any,
      content: template.content,
      isDefault: template.isDefault || false,
    });
    setIsEditOpen(true);
  };

  const openPreview = (template: DmTemplate) => {
    setSelectedTemplate(template);
    setPreviewVariables({
      nome_criador: "Maria Silva",
      nome_campanha: "Campanha de Verão",
      valor: "R$ 500,00",
      link_campanha: "https://exemplo.com/campanha",
      marca: "Sua Marca",
      prazo: "15 de março",
    });
    setIsPreviewOpen(true);
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copiado para a área de transferência!");
  };

  const getPreviewContent = (content: string, variables: Record<string, string>) => {
    let preview = content;
    for (const [key, value] of Object.entries(variables)) {
      preview = preview.replace(new RegExp(`\\{${key}\\}`, "g"), value);
    }
    return preview;
  };

  const insertVariable = (variable: string) => {
    const textarea = document.querySelector('textarea[name="content"]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = formData.content.slice(0, start) + `{${variable}}` + formData.content.slice(end);
      setFormData({ ...formData, content: newContent });
    } else {
      setFormData({ ...formData, content: formData.content + `{${variable}}` });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader
          title="Templates de Mensagem"
          description="Crie e gerencie templates de mensagens para convidar criadores para campanhas e comunidades."
        />
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-template">
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Template de Mensagem</DialogTitle>
              <DialogDescription>
                Crie um template de mensagem para usar em convites e comunicações com criadores.
              </DialogDescription>
            </DialogHeader>
            <TemplateForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={() => createMutation.mutate(formData)}
              isLoading={createMutation.isPending}
              onInsertVariable={insertVariable}
            />
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <Card data-testid="empty-state">
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum template criado</h3>
            <p className="text-muted-foreground mb-4">
              Crie templates de mensagem para agilizar suas comunicações com criadores.
            </p>
            <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-template">
              <Plus className="h-4 w-4 mr-2" />
              Criar primeiro template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="flex flex-col" data-testid={`card-template-${template.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-medium line-clamp-1" data-testid={`text-template-name-${template.id}`}>
                    {template.name}
                  </CardTitle>
                  {template.isDefault && (
                    <Badge variant="secondary" className="shrink-0">Padrão</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={templateTypeLabels[template.type]?.color || templateTypeLabels.custom.color}>
                    {templateTypeLabels[template.type]?.label || template.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 pb-3">
                <p className="text-sm text-muted-foreground line-clamp-3" data-testid={`text-template-content-${template.id}`}>
                  {template.content}
                </p>
                {template.variables && template.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {template.variables.map((variable) => (
                      <Badge key={variable} variant="outline" className="text-xs">
                        {`{${variable}}`}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-3 border-t flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(template.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openPreview(template)}
                    data-testid={`button-preview-${template.id}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(template.content)}
                    data-testid={`button-copy-${template.id}`}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(template)}
                    data-testid={`button-edit-${template.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTemplateToDelete(template)}
                    data-testid={`button-delete-${template.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Template</DialogTitle>
            <DialogDescription>
              Atualize as informações do template de mensagem.
            </DialogDescription>
          </DialogHeader>
          <TemplateForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={() => selectedTemplate && updateMutation.mutate({ id: selectedTemplate.id, data: formData })}
            isLoading={updateMutation.isPending}
            onInsertVariable={insertVariable}
            isEdit
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pré-visualização do Template</DialogTitle>
            <DialogDescription>
              Veja como a mensagem ficará com as variáveis substituídas.
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 border">
                <p className="whitespace-pre-wrap text-sm" data-testid="preview-content">
                  {getPreviewContent(selectedTemplate.content, previewVariables)}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Valores de exemplo:</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(previewVariables).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{`{${key}}`}</Badge>
                      <span className="text-xs text-muted-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Fechar
            </Button>
            <Button onClick={() => selectedTemplate && copyToClipboard(getPreviewContent(selectedTemplate.content, previewVariables))}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar Mensagem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!templateToDelete} onOpenChange={() => setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Template</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o template "{templateToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => templateToDelete && deleteMutation.mutate(templateToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TemplateForm({
  formData,
  setFormData,
  onSubmit,
  isLoading,
  onInsertVariable,
  isEdit = false,
}: {
  formData: typeof defaultFormData;
  setFormData: (data: typeof defaultFormData) => void;
  onSubmit: () => void;
  isLoading: boolean;
  onInsertVariable: (variable: string) => void;
  isEdit?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Template</Label>
        <Input
          id="name"
          name="name"
          placeholder="Ex: Convite para campanha de verão"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          data-testid="input-template-name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Tipo</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value as any })}
        >
          <SelectTrigger data-testid="select-template-type">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="campaign_invite">Convite Campanha</SelectItem>
            <SelectItem value="community_invite">Convite Comunidade</SelectItem>
            <SelectItem value="follow_up">Follow-up</SelectItem>
            <SelectItem value="welcome">Boas-vindas</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Conteúdo da Mensagem</Label>
        <Textarea
          id="content"
          name="content"
          placeholder="Olá {nome_criador}! Gostaria de convidar você para participar da nossa {nome_campanha}..."
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          rows={6}
          data-testid="textarea-template-content"
        />
        <p className="text-xs text-muted-foreground">
          Use variáveis como {"{nome_criador}"} para personalizar a mensagem automaticamente.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Variáveis Disponíveis</Label>
        <div className="flex flex-wrap gap-2">
          {availableVariables.map((v) => (
            <Button
              key={v.name}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onInsertVariable(v.name)}
              className="h-7 text-xs"
              data-testid={`button-variable-${v.name}`}
            >
              {`{${v.name}}`}
            </Button>
          ))}
        </div>
        <div className="mt-2 p-3 bg-muted/50 rounded-md">
          <p className="text-xs font-medium mb-1">Significado das variáveis:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            {availableVariables.map((v) => (
              <li key={v.name}>
                <span className="font-mono text-primary">{`{${v.name}}`}</span> - {v.description}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {formData.content && (
        <div className="space-y-2">
          <Label>Pré-visualização</Label>
          <div className="bg-muted/50 rounded-lg p-4 border">
            <p className="whitespace-pre-wrap text-sm" data-testid="preview-text">
              {formData.content
                .replace(/\{nome_criador\}/g, "Maria Silva")
                .replace(/\{nome_campanha\}/g, "Campanha de Verão")
                .replace(/\{valor\}/g, "R$ 500,00")
                .replace(/\{link_campanha\}/g, "https://exemplo.com/campanha")
                .replace(/\{marca\}/g, "Sua Marca")
                .replace(/\{prazo\}/g, "15 de março")}
            </p>
          </div>
        </div>
      )}

      <DialogFooter className="pt-4">
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isLoading || !formData.name.trim() || !formData.content.trim()}
          data-testid="button-submit-template"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {isEdit ? "Salvar Alterações" : "Criar Template"}
        </Button>
      </DialogFooter>
    </div>
  );
}
