import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Headphones, Send, Loader2, CheckCircle, Paperclip, X, Phone, FileText } from "lucide-react";

const supportFormSchema = z.object({
  subject: z.string().min(5, "O assunto deve ter pelo menos 5 caracteres"),
  category: z.enum(["bug", "feature", "billing", "account", "other"]),
  message: z.string().min(20, "A mensagem deve ter pelo menos 20 caracteres"),
  requestCallback: z.boolean().optional(),
  phone: z.string().optional(),
});

type SupportFormData = z.infer<typeof supportFormSchema>;

const categoryLabels: Record<SupportFormData["category"], string> = {
  bug: "Problema / Bug",
  feature: "Sugestão de melhoria",
  billing: "Financeiro / Pagamentos",
  account: "Conta / Perfil",
  other: "Outro assunto",
};

interface SupportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupportModal({ open, onOpenChange }: SupportModalProps) {
  const { toast } = useToast();
  const [success, setSuccess] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [requestCallback, setRequestCallback] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<SupportFormData>({
    resolver: zodResolver(supportFormSchema),
    defaultValues: {
      subject: "",
      category: "other",
      message: "",
      requestCallback: false,
      phone: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: SupportFormData) => {
      const formData = new FormData();
      formData.append("subject", data.subject);
      formData.append("category", data.category);
      formData.append("message", data.message);
      formData.append("requestCallback", String(requestCallback));
      if (requestCallback && data.phone) {
        formData.append("phone", data.phone);
      }
      if (attachedFile) {
        formData.append("attachment", attachedFile);
      }

      const res = await fetch("/api/support/tickets", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to submit ticket");
      return res.json();
    },
    onSuccess: () => {
      setSuccess(true);
      form.reset();
      setAttachedFile(null);
      setRequestCallback(false);
      setTimeout(() => {
        setSuccess(false);
        onOpenChange(false);
      }, 2000);
    },
    onError: () => {
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar sua mensagem. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SupportFormData) => {
    mutation.mutate(data);
  };

  const handleClose = (open: boolean) => {
    if (!mutation.isPending) {
      setSuccess(false);
      setAttachedFile(null);
      setRequestCallback(false);
      form.reset();
      onOpenChange(open);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 10MB.",
          variant: "destructive",
        });
        return;
      }
      setAttachedFile(file);
    }
  };

  const removeFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg" data-testid="modal-support">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Headphones className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Fale com o Suporte</DialogTitle>
              <DialogDescription>
                Envie uma mensagem e nossa equipe responderá em breve.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {success ? (
          <div className="py-8 flex flex-col items-center gap-4 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {requestCallback ? "Solicitação enviada!" : "Mensagem enviada!"}
              </h3>
              <p className="text-muted-foreground text-sm mt-1">
                {requestCallback 
                  ? "Entraremos em contato por telefone em breve."
                  : "Responderemos em breve pelo seu e-mail cadastrado."}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={form.watch("category")}
                onValueChange={(value) => form.setValue("category", value as SupportFormData["category"])}
              >
                <SelectTrigger data-testid="select-support-category">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.category && (
                <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Assunto</Label>
              <Input
                id="subject"
                placeholder="Resumo do seu problema ou dúvida"
                {...form.register("subject")}
                data-testid="input-support-subject"
              />
              {form.formState.errors.subject && (
                <p className="text-sm text-destructive">{form.formState.errors.subject.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                placeholder="Descreva em detalhes como podemos ajudar..."
                rows={4}
                {...form.register("message")}
                data-testid="textarea-support-message"
              />
              {form.formState.errors.message && (
                <p className="text-sm text-destructive">{form.formState.errors.message.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Anexo (opcional)</Label>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                onChange={handleFileSelect}
                data-testid="input-support-file"
              />
              {attachedFile ? (
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm truncate flex-1">{attachedFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(attachedFile.size / 1024).toFixed(0)} KB
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={removeFile}
                    data-testid="button-remove-file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-attach-file"
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  Anexar arquivo
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                Imagens, PDF, documentos ou ZIP (máx. 10MB)
              </p>
            </div>

            <div className="border-t pt-4">
              <div 
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  requestCallback 
                    ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30" 
                    : "hover:bg-muted/50"
                }`}
                onClick={() => setRequestCallback(!requestCallback)}
                data-testid="toggle-request-callback"
              >
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  requestCallback 
                    ? "bg-green-100 dark:bg-green-500/20" 
                    : "bg-muted"
                }`}>
                  <Phone className={`h-5 w-5 ${requestCallback ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Receber ligação do suporte</p>
                  <p className="text-xs text-muted-foreground">
                    Nossa equipe técnica entrará em contato por telefone
                  </p>
                </div>
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                  requestCallback 
                    ? "border-green-500 bg-green-500" 
                    : "border-muted-foreground"
                }`}>
                  {requestCallback && <CheckCircle className="h-3 w-3 text-white" />}
                </div>
              </div>

              {requestCallback && (
                <div className="mt-3 space-y-2">
                  <Label htmlFor="phone">Telefone para contato</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    {...form.register("phone")}
                    data-testid="input-support-phone"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={mutation.isPending}
                data-testid="button-support-cancel"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                data-testid="button-support-submit"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
