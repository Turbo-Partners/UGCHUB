import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMarketplace } from "@/lib/provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Copy, FileText } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useLocation } from "wouter";
import type { CampaignTemplate } from "@shared/schema";

export default function TemplatesPage() {
  const { user } = useMarketplace();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [_, setLocation] = useLocation();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteTemplateId, setDeleteTemplateId] = useState<number | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<CampaignTemplate | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    title: "",
    campaignDescription: "",
    requirements: "",
    budget: "",
    deadline: "",
    creatorsNeeded: 1,
    targetNiche: [] as string[],
    targetAgeRanges: [] as string[],
    targetGender: "" as "" | "masculino" | "feminino" | "outro" | "prefiro_nao_informar",
    briefingText: "",
  });

  const { data: templates = [], isLoading } = useQuery<CampaignTemplate[]>({
    queryKey: ["/api/templates"],
    enabled: !!user && user.role === "company",
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Template criado",
        description: "Template de campanha criado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o template",
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof formData> }) => {
      const res = await fetch(`/api/templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setIsEditDialogOpen(false);
      setEditingTemplate(null);
      resetForm();
      toast({
        title: "Template atualizado",
        description: "Template de campanha atualizado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o template",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/templates/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete template");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setDeleteTemplateId(null);
      toast({
        title: "Template excluído",
        description: "Template de campanha excluído com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o template",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      title: "",
      campaignDescription: "",
      requirements: "",
      budget: "",
      deadline: "",
      creatorsNeeded: 1,
      targetNiche: [],
      targetAgeRanges: [],
      targetGender: "",
      briefingText: "",
    });
  };

  const handleEdit = (template: CampaignTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      title: template.title,
      campaignDescription: template.campaignDescription,
      requirements: template.requirements.join("\n"),
      budget: template.budget,
      deadline: template.deadline,
      creatorsNeeded: template.creatorsNeeded,
      targetNiche: template.targetNiche || [],
      targetAgeRanges: template.targetAgeRanges || [],
      targetGender: (template.targetGender as any) || "",
      briefingText: template.briefingText || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUseTemplate = (template: CampaignTemplate) => {
    const campaignData = {
      title: template.title,
      description: template.campaignDescription,
      requirements: template.requirements,
      budget: template.budget,
      deadline: template.deadline,
      creatorsNeeded: template.creatorsNeeded,
      targetNiche: template.targetNiche,
      targetAgeRanges: template.targetAgeRanges,
      targetGender: template.targetGender,
      briefingText: template.briefingText,
    };
    
    localStorage.setItem("template-campaign-data", JSON.stringify(campaignData));
    setLocation("/create-campaign");
  };

  if (user?.role !== "company") {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Apenas empresas podem acessar templates de campanha.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Templates de Campanha</h1>
          <p className="text-muted-foreground mt-2">Crie e gerencie templates para lançar campanhas rapidamente</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-template">
              <Plus className="mr-2 h-4 w-4" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Template</DialogTitle>
              <DialogDescription>
                Crie um template reutilizável para suas campanhas
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-name">Nome do Template *</Label>
                <Input
                  id="template-name"
                  data-testid="input-template-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Lançamento de Produto"
                />
              </div>
              <div>
                <Label htmlFor="template-description">Descrição do Template</Label>
                <Textarea
                  id="template-description"
                  data-testid="input-template-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição breve do template"
                />
              </div>
              <div>
                <Label htmlFor="campaign-title">Título da Campanha *</Label>
                <Input
                  id="campaign-title"
                  data-testid="input-campaign-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Lançamento Novo Produto XYZ"
                />
              </div>
              <div>
                <Label htmlFor="campaign-description">Descrição da Campanha *</Label>
                <Textarea
                  id="campaign-description"
                  data-testid="input-campaign-description"
                  value={formData.campaignDescription}
                  onChange={(e) => setFormData({ ...formData, campaignDescription: e.target.value })}
                  placeholder="Descrição completa da campanha"
                />
              </div>
              <div>
                <Label htmlFor="requirements">Requisitos *</Label>
                <Textarea
                  id="requirements"
                  data-testid="input-requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="Requisitos para criadores"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget">Orçamento *</Label>
                  <Input
                    id="budget"
                    data-testid="input-budget"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="Ex: R$ 5.000"
                  />
                </div>
                <div>
                  <Label htmlFor="creators-needed">Criadores Necessários *</Label>
                  <Input
                    id="creators-needed"
                    data-testid="input-creators-needed"
                    type="number"
                    min="1"
                    value={formData.creatorsNeeded}
                    onChange={(e) => setFormData({ ...formData, creatorsNeeded: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="deadline">Prazo *</Label>
                <Input
                  id="deadline"
                  data-testid="input-deadline"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  placeholder="Ex: 30 dias"
                />
              </div>
              <div>
                <Label htmlFor="briefing">Briefing</Label>
                <Textarea
                  id="briefing"
                  data-testid="input-briefing"
                  value={formData.briefingText}
                  onChange={(e) => setFormData({ ...formData, briefingText: e.target.value })}
                  placeholder="Briefing detalhado (opcional)"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} data-testid="button-cancel">
                  Cancelar
                </Button>
                <Button
                  onClick={() => createTemplateMutation.mutate(formData)}
                  disabled={!formData.name || !formData.title || !formData.campaignDescription || !formData.requirements || !formData.budget || !formData.deadline}
                  data-testid="button-save-template"
                >
                  Criar Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum template criado</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro template para agilizar a criação de campanhas similares
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-template">
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} data-testid={`card-template-${template.id}`}>
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
                {template.description && (
                  <CardDescription>{template.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <p><strong>Título:</strong> {template.title}</p>
                  <p><strong>Orçamento:</strong> {template.budget}</p>
                  <p><strong>Criadores:</strong> {template.creatorsNeeded}</p>
                  <p><strong>Prazo:</strong> {template.deadline}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleUseTemplate(template)}
                    data-testid={`button-use-template-${template.id}`}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Usar Template
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                    data-testid={`button-edit-template-${template.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteTemplateId(template.id)}
                    data-testid={`button-delete-template-${template.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Template</DialogTitle>
            <DialogDescription>
              Atualize as informações do template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-template-name">Nome do Template *</Label>
              <Input
                id="edit-template-name"
                data-testid="input-edit-template-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-template-description">Descrição do Template</Label>
              <Textarea
                id="edit-template-description"
                data-testid="input-edit-template-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-campaign-title">Título da Campanha *</Label>
              <Input
                id="edit-campaign-title"
                data-testid="input-edit-campaign-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-campaign-description">Descrição da Campanha *</Label>
              <Textarea
                id="edit-campaign-description"
                data-testid="input-edit-campaign-description"
                value={formData.campaignDescription}
                onChange={(e) => setFormData({ ...formData, campaignDescription: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-requirements">Requisitos *</Label>
              <Textarea
                id="edit-requirements"
                data-testid="input-edit-requirements"
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-budget">Orçamento *</Label>
                <Input
                  id="edit-budget"
                  data-testid="input-edit-budget"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-creators-needed">Criadores Necessários *</Label>
                <Input
                  id="edit-creators-needed"
                  data-testid="input-edit-creators-needed"
                  type="number"
                  min="1"
                  value={formData.creatorsNeeded}
                  onChange={(e) => setFormData({ ...formData, creatorsNeeded: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-deadline">Prazo *</Label>
              <Input
                id="edit-deadline"
                data-testid="input-edit-deadline"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-briefing">Briefing</Label>
              <Textarea
                id="edit-briefing"
                data-testid="input-edit-briefing"
                value={formData.briefingText}
                onChange={(e) => setFormData({ ...formData, briefingText: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingTemplate(null); resetForm(); }} data-testid="button-cancel-edit">
                Cancelar
              </Button>
              <Button
                onClick={() => editingTemplate && updateTemplateMutation.mutate({ id: editingTemplate.id, data: formData })}
                disabled={!formData.name || !formData.title || !formData.campaignDescription || !formData.requirements || !formData.budget || !formData.deadline}
                data-testid="button-update-template"
              >
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTemplateId !== null} onOpenChange={() => setDeleteTemplateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Template</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTemplateId && deleteTemplateMutation.mutate(deleteTemplateId)}
              data-testid="button-confirm-delete"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
