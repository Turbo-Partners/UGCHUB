---
name: error-handling
description: Padrões de tratamento de erro no backend e frontend, toasts, estados de erro e logging. Use quando implementar tratamento de erros.
user-invocable: false
allowed-tools: Read, Grep, Glob
---

# Padrões de Tratamento de Erros

## Backend (Express)

### Padrão em Endpoints

```typescript
app.post("/api/resource", async (req, res) => {
  // 1. Auth check
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  // 2. Validação Zod
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Dados inválidos",
      errors: parsed.error.errors,
    });
  }

  // 3. Lógica com try/catch
  try {
    const result = await storage.createResource(parsed.data);
    res.status(201).json(result);
  } catch (error) {
    console.error("Erro ao criar resource:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});
```

### Erros por Status Code

```typescript
// 400 — Validação falhou
return res.status(400).json({
  message: "Título deve ter no mínimo 3 caracteres",
  errors: zodErrors,
});

// 401 — Não autenticado
return res.status(401).json({ message: "Não autenticado" });

// 403 — Sem permissão
return res.status(403).json({ message: "Acesso negado" });

// 404 — Não encontrado
return res.status(404).json({ message: "Campanha não encontrada" });

// 409 — Conflito
return res.status(409).json({ message: "Email já cadastrado" });

// 429 — Rate limit
return res.status(429).json({ message: "Muitas requisições. Tente novamente em alguns minutos." });

// 500 — Erro interno (nunca expor detalhes ao cliente)
console.error("Detalhe interno:", error);
return res.status(500).json({ message: "Erro interno do servidor" });
```

### Logging

```typescript
// SEMPRE logar com contexto
console.error("Erro ao criar campanha:", {
  userId: req.user?.id,
  companyId: req.user?.companyId,
  body: req.body,
  error: error instanceof Error ? error.message : error,
});

// Para APIs externas, logar response
console.error("Meta API error:", {
  status: response.status,
  body: await response.text(),
  endpoint: url,
});
```

### Erros de APIs Externas

```typescript
// Instagram/Meta API
try {
  const response = await fetch(metaUrl);
  if (!response.ok) {
    const error = await response.json();
    console.error("Meta API error:", error);

    // Mapear erros Meta para HTTP
    if (error.error?.code === 190) {
      return res.status(401).json({ message: "Token Instagram expirado" });
    }
    if (error.error?.code === 4) {
      return res.status(429).json({ message: "Rate limit Instagram atingido" });
    }
    return res.status(502).json({ message: "Erro na API do Instagram" });
  }
} catch (error) {
  // Erro de rede/timeout
  console.error("Network error:", error);
  return res.status(503).json({ message: "Serviço temporariamente indisponível" });
}
```

## Frontend (React)

### Toast para Feedback

```typescript
import { useToast } from "@/hooks/use-toast";

const { toast } = useToast();

// Sucesso
toast({ title: "Campanha criada com sucesso!" });

// Erro
toast({
  title: "Erro ao criar campanha",
  description: error.message,
  variant: "destructive",
});

// Aviso
toast({
  title: "Atenção",
  description: "Você atingiu o limite de publicações",
});
```

### Erro em Mutations

```typescript
const mutation = useMutation({
  mutationFn: (data) => apiRequest("/api/endpoint", { method: "POST", body: JSON.stringify(data) }),
  onError: (error: Error) => {
    toast({
      title: "Erro",
      description: error.message,
      variant: "destructive",
    });
  },
});
```

### Estado de Erro em Queries

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ["/api/campaigns"],
});

if (isLoading) return <Skeleton className="h-40" />;

if (error) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Erro ao carregar</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  );
}
```

### Estado Vazio

```typescript
if (data?.length === 0) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <p>Nenhuma campanha encontrada</p>
      <Button className="mt-4">Criar primeira campanha</Button>
    </div>
  );
}
```

## Convenções

1. **Nunca expor stack traces** ao cliente — logar no servidor, retornar mensagem genérica
2. **Mensagens em português** para erros exibidos ao usuário
3. **Toast destrutivo** para erros de mutação
4. **Skeleton** para loading states, não spinner (exceto botões)
5. **Console.error com contexto** — incluir userId, endpoint, body quando possível
6. **Try/catch em todo endpoint** que faz operações async
7. **Validação Zod primeiro** — antes de qualquer operação de banco
