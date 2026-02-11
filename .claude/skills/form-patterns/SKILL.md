---
name: form-patterns
description: Como criar formulários com react-hook-form + Zod + shadcn/ui. Use quando precisar criar ou modificar formulários no frontend.
user-invocable: false
allowed-tools: Read, Grep, Glob
---

# Padrões de Formulários

## Stack

- **react-hook-form** — gerenciamento de estado do form
- **@hookform/resolvers/zod** — integração com Zod
- **Zod** — validação de schema (shared com backend)
- **shadcn/ui Form** — componentes visuais

## Formulário Completo (Template)

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// 1. Schema Zod (importar de @shared/schema ou definir local)
const formSchema = z.object({
  title: z.string().min(3, "Mínimo 3 caracteres").max(255),
  description: z.string().optional(),
  budget: z.coerce.number().min(0, "Budget deve ser positivo"),
  status: z.enum(["draft", "active"]),
});

type FormValues = z.infer<typeof formSchema>;

// 2. Componente
export function CampaignForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 3. Inicializar form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      budget: 0,
      status: "draft",
    },
  });

  // 4. Mutation para submit
  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/campaigns", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({ title: "Campanha criada!" });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 5. Submit handler
  function onSubmit(data: FormValues) {
    mutation.mutate(data);
  }

  // 6. Render
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Nome da campanha" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="budget"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Budget (R$)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Salvando..." : "Criar Campanha"}
        </Button>
      </form>
    </Form>
  );
}
```

## Tipos de Campo

### Input de Texto

```typescript
<FormField
  control={form.control}
  name="title"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Título</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Textarea

```typescript
<FormControl>
  <Textarea placeholder="Descreva..." rows={4} {...field} />
</FormControl>
```

### Select

```typescript
<FormControl>
  <Select onValueChange={field.onChange} defaultValue={field.value}>
    <SelectTrigger>
      <SelectValue placeholder="Selecione..." />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="draft">Rascunho</SelectItem>
      <SelectItem value="active">Ativo</SelectItem>
    </SelectContent>
  </Select>
</FormControl>
```

### Checkbox

```typescript
<FormControl>
  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
</FormControl>
```

### Switch

```typescript
<FormControl>
  <Switch checked={field.value} onCheckedChange={field.onChange} />
</FormControl>
```

### Date Picker

```typescript
<FormControl>
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline">
        {field.value ? format(field.value, "dd/MM/yyyy") : "Selecione"}
      </Button>
    </PopoverTrigger>
    <PopoverContent>
      <Calendar
        mode="single"
        selected={field.value}
        onSelect={field.onChange}
      />
    </PopoverContent>
  </Popover>
</FormControl>
```

## Formulário de Edição (com dados existentes)

```typescript
// Buscar dados existentes
const { data: campaign } = useQuery({
  queryKey: ["/api/campaigns", id],
});

// Setar valores quando dados chegam
const form = useForm<FormValues>({
  resolver: zodResolver(formSchema),
  values: campaign ? {
    title: campaign.title,
    budget: campaign.budget,
    status: campaign.status,
  } : undefined,
});

// PUT ao invés de POST
const mutation = useMutation({
  mutationFn: async (data: FormValues) => {
    const res = await apiRequest("PUT", `/api/campaigns/${id}`, data);
    return await res.json();
  },
});
```

## Validações Zod Comuns

```typescript
z.string().min(1, "Obrigatório")
z.string().email("Email inválido")
z.string().url("URL inválida")
z.coerce.number().min(0).max(1000000)
z.enum(["option1", "option2"])
z.string().regex(/^\d{11}$/, "CPF inválido")
z.string().optional()
z.array(z.string()).min(1, "Selecione pelo menos um")
```

## Convenções

1. **Schemas Zod compartilhados**: importar de `@shared/schema` quando existir
2. **Mensagens em português**: validações devem ter mensagens em PT-BR
3. **defaultValues obrigatório**: sempre inicializar todos os campos
4. **Toast no onSuccess/onError**: feedback visual obrigatório
5. **Invalidar queries**: sempre invalidar cache relevante após mutação
6. **Desabilitar botão**: `disabled={mutation.isPending}` durante submit
