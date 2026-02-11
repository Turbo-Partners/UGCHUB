---
name: frontend-patterns
description: Padrões de data fetching com TanStack Query, hooks customizados, estrutura de componentes e estado global. Use quando criar ou modificar código frontend.
user-invocable: false
allowed-tools: Read, Grep, Glob
---

# Padrões Frontend

## Data Fetching com TanStack Query

### apiRequest Helper

Toda chamada API passa por `apiRequest()` em `client/src/lib/queryClient.ts`:

```typescript
import { apiRequest } from "@/lib/queryClient";

// Assinatura: apiRequest(method, url, data?)
// POST
const res = await apiRequest("POST", "/api/campaigns", formData);
const campaign = await res.json();

// PUT
await apiRequest("PUT", `/api/campaigns/${id}`, updates);

// DELETE
await apiRequest("DELETE", `/api/campaigns/${id}`);
```

**Configuração global do QueryClient**:
- `staleTime: Infinity` — dados só atualizam via invalidação manual
- `refetchOnWindowFocus: false`
- `retry: false`
- `credentials: "include"` em todas as requests

### useQuery (Leitura)

```typescript
import { useQuery } from "@tanstack/react-query";

function CampaignsList() {
  const { data: campaigns, isLoading, error } = useQuery({
    queryKey: ["/api/campaigns"],          // Key = URL da API
    queryFn: () => apiRequest("/api/campaigns"),
  });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState />;
  return <CampaignGrid campaigns={campaigns} />;
}
```

### useMutation (Escrita)

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";

function CreateCampaignForm() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: InsertCampaign) => {
      const res = await apiRequest("POST", "/api/campaigns", data);
      return await res.json();
    },
    onSuccess: () => {
      // Invalidar TODAS as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({ title: "Campanha criada!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
      <Button disabled={mutation.isPending}>
        {mutation.isPending ? "Salvando..." : "Criar"}
      </Button>
    </form>
  );
}
```

### Convenções de Query Keys

```typescript
// Padrão: usar a URL da API como key
queryKey: ["/api/campaigns"]                    // Lista
queryKey: ["/api/campaigns", id]                // Item único
queryKey: ["/api/campaigns", { status: "active" }]  // Com filtros
```

## Estrutura de Componentes

### Página

```typescript
// client/src/pages/campaign-details.tsx
export default function CampaignDetailsPage() {
  const { id } = useParams();  // Wouter params
  const { data, isLoading } = useQuery({ ... });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold">{data?.title}</h1>
      {/* conteúdo */}
    </div>
  );
}
```

### Componente Feature

```typescript
// client/src/components/campaign-card.tsx
interface CampaignCardProps {
  campaign: Campaign;
  onSelect?: (id: number) => void;
}

export function CampaignCard({ campaign, onSelect }: CampaignCardProps) {
  return (
    <Card className="cursor-pointer" onClick={() => onSelect?.(campaign.id)}>
      <CardHeader>
        <CardTitle>{campaign.title}</CardTitle>
      </CardHeader>
    </Card>
  );
}
```

## Routing com Wouter

```typescript
// client/src/lib/routes.ts
import { Route, Switch } from "wouter";

<Switch>
  <Route path="/" component={HomePage} />
  <Route path="/creator/dashboard" component={CreatorDashboard} />
  <Route path="/company/campaigns/:id" component={CampaignDetails} />
  <Route component={NotFound} />
</Switch>
```

### Rotas Protegidas

```typescript
// client/src/components/protected-route.tsx
<ProtectedRoute path="/company/dashboard" roles={["company", "admin"]}>
  <CompanyDashboard />
</ProtectedRoute>
```

## Lazy Loading

Todas as páginas são lazy-loaded com Suspense:

```typescript
const CompanyDashboard = lazy(() => import("@/pages/company/dashboard"));
const CreatorDashboard = lazy(() => import("@/pages/creator/dashboard"));

// Suspense boundaries aninhados
<Suspense fallback={<PageLoader />}>
  <Layout>
    <Suspense fallback={<PageLoader />}>
      <Switch>{/* routes */}</Switch>
    </Suspense>
  </Layout>
</Suspense>
```

## Estado Global

- **MarketplaceProvider** (`client/src/lib/provider.tsx`) — expõe `user`, `campaigns`, `applications`, `creators`, `login`, `logout`, etc.
- **BrandProvider** (`client/src/lib/brand-context.tsx`) — contexto da marca selecionada (persiste no localStorage)
- **ThemeProvider** — dark/light mode
- **Não usar Redux/Zustand** — React Query + Context é suficiente

```typescript
// Usar via hook:
const { user, campaigns, login, logout, isLoading } = useMarketplace();
const { brandId, setBrandId } = useBrand();
```

## Hooks Customizados

Ficam em `client/src/hooks/`:

```typescript
// client/src/hooks/use-auth.ts
export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
    queryFn: () => apiRequest("/api/user"),
  });
  return { user, isLoading, isAuthenticated: !!user };
}
```

## Styling

- **Tailwind CSS v4** para estilos
- **cn()** de `@/lib/utils` para merge de classes:
  ```typescript
  import { cn } from "@/lib/utils";
  <div className={cn("base-class", isActive && "active-class")} />
  ```
- **shadcn/ui** para componentes UI (ver skill `component-library`)
- **Não usar CSS modules** nem styled-components
