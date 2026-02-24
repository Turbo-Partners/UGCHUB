import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { useToast } from "@/hooks/use-toast";
import { Store, Loader2, Globe, Instagram, Sparkles } from "lucide-react";

interface CreateCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CompanyFormData {
  name: string;
  cnpj: string;
  phone: string;
  instagram: string;
  website: string;
}

export function CreateCompanyModal({ open, onOpenChange }: CreateCompanyModalProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<CompanyFormData>({
    name: "",
    cnpj: "",
    phone: "",
    instagram: "",
    website: "",
  });
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);

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

  const handleCnpjBlur = async () => {
    const cnpjDigits = formData.cnpj.replace(/\D/g, "");
    if (cnpjDigits.length !== 14) return;

    setIsLoadingCnpj(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjDigits}`);
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({
          ...prev,
          name: prev.name || data.razao_social || "",
          phone: prev.phone || (data.ddd_telefone_1 ? formatPhone(data.ddd_telefone_1) : ""),
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar CNPJ:", error);
    } finally {
      setIsLoadingCnpj(false);
    }
  };

  const handleInputChange = (field: keyof CompanyFormData, value: string) => {
    let formattedValue = value;
    if (field === "cnpj") formattedValue = formatCNPJ(value);
    if (field === "phone") formattedValue = formatPhone(value);
    if (field === "instagram") formattedValue = value.replace(/^@/, "");

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
        cnpj: "",
        phone: "",
        instagram: "",
        website: "",
      });
      onOpenChange(false);
      setLocation("/company/onboarding");
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

    const submitData: Record<string, string> = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (value.trim()) {
        submitData[key] = value.trim();
      }
    });

    createCompanyMutation.mutate(submitData);
  };

  const isPending = createCompanyMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Criar nova loja</DialogTitle>
              <DialogDescription>
                Informe os dados principais e enriqueceremos automaticamente o perfil da sua loja.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Loja *</Label>
              <Input
                id="name"
                placeholder="Nome da sua loja ou empresa"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                disabled={isPending}
                data-testid="input-company-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                placeholder="00.000.000/0000-00"
                value={formData.cnpj}
                onChange={(e) => handleInputChange("cnpj", e.target.value)}
                onBlur={handleCnpjBlur}
                disabled={isPending || isLoadingCnpj}
                data-testid="input-company-cnpj"
              />
              {isLoadingCnpj && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Buscando dados do CNPJ...
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                disabled={isPending}
                data-testid="input-company-phone"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <span className="absolute left-9 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                  <Input
                    id="instagram"
                    className="pl-14"
                    placeholder="usuario"
                    value={formData.instagram}
                    onChange={(e) => handleInputChange("instagram", e.target.value)}
                    disabled={isPending}
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
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Com o CNPJ, Instagram ou website preenchidos, enriquecemos automaticamente o perfil
                com dados como endereço, descrição, categoria e foto de perfil.
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending || !formData.name.trim()}
              data-testid="button-submit-create-company"
            >
              {isPending ? (
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
