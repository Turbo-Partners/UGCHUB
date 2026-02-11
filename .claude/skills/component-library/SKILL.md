---
name: component-library
description: Catálogo de componentes shadcn/ui disponíveis no projeto e quando usar cada um. Use quando precisar escolher componentes para UI.
user-invocable: false
allowed-tools: Read, Grep, Glob
---

# Biblioteca de Componentes

## Stack UI

- **shadcn/ui** (New York style) — componentes base
- **Radix UI** — primitivos acessíveis (base do shadcn)
- **Tailwind CSS v4** — styling
- **Lucide React** — ícones

## Adicionar Novo Componente shadcn

```bash
npx shadcn@latest add <component-name>
# Componente é copiado para client/src/components/ui/
```

## Componentes Disponíveis (~72)

### Layout e Containers
| Componente | Quando usar |
|-----------|-------------|
| `card` | Container com borda para agrupar conteúdo |
| `dialog` | Modal/popup para ações focadas |
| `drawer` | Painel lateral deslizante |
| `sheet` | Painel lateral (similar ao drawer) |
| `tabs` | Navegar entre seções de conteúdo |
| `accordion` | Conteúdo colapsável em seções |
| `collapsible` | Toggle show/hide de conteúdo |
| `separator` | Linha divisória |
| `scroll-area` | Scroll customizado |
| `resizable` | Painéis redimensionáveis |

### Formulários
| Componente | Quando usar |
|-----------|-------------|
| `form` | Wrapper para react-hook-form |
| `input` | Campo de texto |
| `textarea` | Campo de texto multilinha |
| `select` | Dropdown de seleção |
| `checkbox` | Opção on/off |
| `radio-group` | Seleção exclusiva |
| `switch` | Toggle on/off |
| `slider` | Seleção de range |
| `date-picker` | Seleção de data |
| `calendar` | Calendário inline |
| `input-otp` | Código de verificação |

### Botões e Ações
| Componente | Quando usar |
|-----------|-------------|
| `button` | Ação primária/secundária |
| `toggle` | Botão on/off |
| `toggle-group` | Grupo de toggles |
| `dropdown-menu` | Menu contextual com ações |
| `context-menu` | Menu de clique direito |
| `menubar` | Barra de menus |

### Dados e Feedback
| Componente | Quando usar |
|-----------|-------------|
| `table` | Dados tabulares |
| `data-table` | Tabela avançada (sort, filter, pagination) — custom |
| `badge` | Label/tag pequeno |
| `avatar` | Foto/iniciais de usuário |
| `progress` | Barra de progresso |
| `skeleton` | Placeholder de loading |
| `spinner` | Loading indicator |
| `toast` / `sonner` | Notificações temporárias |
| `alert` | Mensagem de destaque |
| `alert-dialog` | Confirmação de ação destrutiva |

### Navegação
| Componente | Quando usar |
|-----------|-------------|
| `navigation-menu` | Menu de navegação principal |
| `breadcrumb` | Trilha de navegação |
| `pagination` | Navegação entre páginas |
| `sidebar` | Menu lateral |
| `command` | Paleta de comandos (Cmd+K) |

### Overlay
| Componente | Quando usar |
|-----------|-------------|
| `tooltip` | Texto explicativo ao hover |
| `popover` | Conteúdo flutuante ao clicar |
| `hover-card` | Preview ao hover |

### Tipografia
| Componente | Quando usar |
|-----------|-------------|
| `label` | Label de form field |
| `aspect-ratio` | Manter proporção de imagem/vídeo |

## Componentes Custom do Projeto

Além do shadcn, o projeto tem componentes específicos:

| Componente | Arquivo | Uso |
|-----------|---------|-----|
| `StatusBadge` | `status-badge.tsx` | Badge com cores por status |
| `StarRating` | `StarRating.tsx` | Rating com estrelas |
| `InstagramAvatar` | `instagram-avatar.tsx` | Avatar com foto do IG |
| `NotificationBell` | `notification-bell.tsx` | Sino com contador |
| `ObjectUploader` | `ObjectUploader.tsx` | Upload para GCS |
| `DataTable` | `data-table.tsx` | Tabela com sort/filter/pagination |
| `ShareCampaignButton` | `share-campaign-button.tsx` | Botão de compartilhar |
| `CompanySwitcher` | `company-switcher.tsx` | Trocar empresa ativa |

## Padrões de Uso

### Import

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
```

### Toast (Notificações)

```typescript
const { toast } = useToast();

// Sucesso
toast({ title: "Salvo com sucesso!" });

// Erro
toast({
  title: "Erro",
  description: "Não foi possível salvar",
  variant: "destructive",
});
```

### Confirmação de Ação Destrutiva

```typescript
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Excluir</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
      <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```
