import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Store, Loader2, Building2, MapPin, Phone, Mail, Globe, Instagram } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CreateCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CompanyFormData {
  name: string;
  tradeName: string;
  description: string;
  cnpj: string;
  phone: string;
  email: string;
  instagram: string;
  website: string;
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement: string;
}

export function CreateCompanyModal({ open, onOpenChange }: CreateCompanyModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<CompanyFormData>({
    name: "",
    tradeName: "",
    description: "",
    cnpj: "",
    phone: "",
    email: "",
    instagram: "",
    website: "",
    cep: "",
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    complement: "",
  });
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const formatCNPJ = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    return digits
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 10) {
      return digits
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  };

  const formatCEP = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    return digits.replace(/(\d{5})(\d)/, "$1-$2");
  };

  const handleCepBlur = async () => {
    const cepDigits = formData.cep.replace(/\D/g, "");
    if (cepDigits.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleInputChange = (field: keyof CompanyFormData, value: string) => {
    let formattedValue = value;
    if (field === "cnpj") formattedValue = formatCNPJ(value);
    if (field === "phone") formattedValue = formatPhone(value);
    if (field === "cep") formattedValue = formatCEP(value);
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const createCompanyMutation = useMutation({
    mutationFn: async (data: Partial<CompanyFormData>) => {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao criar loja");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Loja criada!",
        description: `A loja "${data.company.name}" foi criada com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/active-company"] });
      setFormData({
        name: "",
        tradeName: "",
        description: "",
        cnpj: "",
        phone: "",
        email: "",
        instagram: "",
        website: "",
        cep: "",
        street: "",
        number: "",
        neighborhood: "",
        city: "",
        state: "",
        complement: "",
      });
      onOpenChange(false);
      window.location.reload();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome da loja é obrigatório",
        variant: "destructive",
      });
      return;
    }
    
    const submitData: Partial<CompanyFormData> = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (value.trim()) {
        let val = value.trim();
        if (key === "instagram") {
          val = val.replace(/^@/, "");
        }
        submitData[key as keyof CompanyFormData] = val;
      }
    });

    createCompanyMutation.mutate(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Criar nova loja</DialogTitle>
              <DialogDescription>
                Preencha os dados da sua empresa para criar uma nova loja.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  Dados da Empresa
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Razão Social *</Label>
                    <Input
                      id="name"
                      placeholder="Nome registrado da empresa"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      disabled={createCompanyMutation.isPending}
                      data-testid="input-company-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tradeName">Nome Fantasia</Label>
                    <Input
                      id="tradeName"
                      placeholder="Nome comercial da empresa"
                      value={formData.tradeName}
                      onChange={(e) => handleInputChange("tradeName", e.target.value)}
                      disabled={createCompanyMutation.isPending}
                      data-testid="input-company-trade-name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      placeholder="00.000.000/0000-00"
                      value={formData.cnpj}
                      onChange={(e) => handleInputChange("cnpj", e.target.value)}
                      disabled={createCompanyMutation.isPending}
                      data-testid="input-company-cnpj"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Input
                      id="description"
                      placeholder="Breve descrição da empresa"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      disabled={createCompanyMutation.isPending}
                      data-testid="input-company-description"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  Contato
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      placeholder="(00) 00000-0000"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      disabled={createCompanyMutation.isPending}
                      data-testid="input-company-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contato@empresa.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      disabled={createCompanyMutation.isPending}
                      data-testid="input-company-email"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  Redes Sociais e Site
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="instagram"
                        className="pl-9"
                        placeholder="@usuario"
                        value={formData.instagram}
                        onChange={(e) => handleInputChange("instagram", e.target.value)}
                        disabled={createCompanyMutation.isPending}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="website"
                        className="pl-9"
                        placeholder="www.empresa.com.br"
                        value={formData.website}
                        onChange={(e) => handleInputChange("website", e.target.value)}
                        disabled={createCompanyMutation.isPending}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  Endereço
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      placeholder="00000-000"
                      value={formData.cep}
                      onChange={(e) => handleInputChange("cep", e.target.value)}
                      onBlur={handleCepBlur}
                      disabled={createCompanyMutation.isPending || isLoadingCep}
                      data-testid="input-company-cep"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="street">Logradouro</Label>
                    <Input
                      id="street"
                      placeholder="Rua, Avenida, etc."
                      value={formData.street}
                      onChange={(e) => handleInputChange("street", e.target.value)}
                      disabled={createCompanyMutation.isPending || isLoadingCep}
                      data-testid="input-company-street"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="number">Número</Label>
                    <Input
                      id="number"
                      placeholder="123"
                      value={formData.number}
                      onChange={(e) => handleInputChange("number", e.target.value)}
                      disabled={createCompanyMutation.isPending}
                      data-testid="input-company-number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      placeholder="Sala, Andar, etc."
                      value={formData.complement}
                      onChange={(e) => handleInputChange("complement", e.target.value)}
                      disabled={createCompanyMutation.isPending}
                      data-testid="input-company-complement"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      placeholder="Bairro"
                      value={formData.neighborhood}
                      onChange={(e) => handleInputChange("neighborhood", e.target.value)}
                      disabled={createCompanyMutation.isPending || isLoadingCep}
                      data-testid="input-company-neighborhood"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      placeholder="Cidade"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      disabled={createCompanyMutation.isPending || isLoadingCep}
                      data-testid="input-company-city"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      placeholder="UF"
                      value={formData.state}
                      onChange={(e) => handleInputChange("state", e.target.value.toUpperCase().slice(0, 2))}
                      disabled={createCompanyMutation.isPending || isLoadingCep}
                      maxLength={2}
                      data-testid="input-company-state"
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createCompanyMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createCompanyMutation.isPending || !formData.name.trim()}
              data-testid="button-submit-create-company"
            >
              {createCompanyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar loja"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
