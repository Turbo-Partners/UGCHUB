import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, Plus, Search, FileText, Users, Megaphone, Inbox, FolderOpen, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'card' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  variant = 'default',
  size = 'md',
  className,
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: 'py-8',
      icon: 'h-12 w-12',
      iconWrapper: 'h-16 w-16',
      title: 'text-base',
      description: 'text-sm max-w-xs',
    },
    md: {
      container: 'py-12',
      icon: 'h-8 w-8',
      iconWrapper: 'h-20 w-20',
      title: 'text-lg',
      description: 'text-sm max-w-sm',
    },
    lg: {
      container: 'py-16',
      icon: 'h-10 w-10',
      iconWrapper: 'h-24 w-24',
      title: 'text-xl',
      description: 'text-base max-w-md',
    },
  };

  const ActionIcon = action?.icon || Plus;

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizeClasses[size].container,
        className
      )}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className={cn(
          'rounded-2xl bg-muted/50 flex items-center justify-center mb-6 relative group',
          sizeClasses[size].iconWrapper
        )}
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Icon className={cn('text-muted-foreground relative', sizeClasses[size].icon)} />
      </motion.div>
      
      <motion.h3
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className={cn('font-semibold font-heading text-foreground', sizeClasses[size].title)}
      >
        {title}
      </motion.h3>
      
      <motion.p
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.3 }}
        className={cn('text-muted-foreground mt-2 mb-6', sizeClasses[size].description)}
      >
        {description}
      </motion.p>
      
      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          {action && (
            <Button onClick={action.onClick} size={size === 'lg' ? 'lg' : 'default'}>
              <ActionIcon className="mr-2 h-4 w-4" />
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );

  if (variant === 'card') {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="p-0">
          {content}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
        {content}
      </div>
    );
  }

  return content;
}

interface LoadingStateProps {
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingState({
  title = 'Carregando...',
  description,
  size = 'md',
  className,
}: LoadingStateProps) {
  const sizeClasses = {
    sm: { container: 'py-8', spinner: 'h-8 w-8', title: 'text-sm' },
    md: { container: 'py-12', spinner: 'h-10 w-10', title: 'text-base' },
    lg: { container: 'py-16', spinner: 'h-12 w-12', title: 'text-lg' },
  };

  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center',
      sizeClasses[size].container,
      className
    )}>
      <div className="relative mb-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className={cn(
            'rounded-full border-2 border-primary/20 border-t-primary',
            sizeClasses[size].spinner
          )}
        />
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl" />
      </div>
      <p className={cn('font-medium text-foreground', sizeClasses[size].title)}>
        {title}
      </p>
      {description && (
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
}

export const emptyStatePresets = {
  campaigns: {
    icon: Megaphone,
    title: 'Nenhuma campanha ainda',
    description: 'Crie sua primeira campanha para começar a receber candidaturas de criadores talentosos.',
  },
  applications: {
    icon: FileText,
    title: 'Nenhuma candidatura',
    description: 'As candidaturas para suas campanhas aparecerão aqui.',
  },
  creators: {
    icon: Users,
    title: 'Nenhum criador encontrado',
    description: 'Tente ajustar seus filtros de busca para encontrar mais criadores.',
  },
  search: {
    icon: Search,
    title: 'Nenhum resultado encontrado',
    description: 'Tente buscar com outros termos ou ajuste seus filtros.',
  },
  notifications: {
    icon: Inbox,
    title: 'Nenhuma notificação',
    description: 'Você está em dia! Novas notificações aparecerão aqui.',
  },
  files: {
    icon: FolderOpen,
    title: 'Nenhum arquivo',
    description: 'Faça upload de arquivos para vê-los aqui.',
  },
  featured: {
    icon: Sparkles,
    title: 'Em breve',
    description: 'Esta funcionalidade estará disponível em breve.',
  },
};
