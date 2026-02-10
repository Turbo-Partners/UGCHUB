import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge-2';
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  subtitle?: string;
  showMenu?: boolean;
  onMenuAction?: (action: string) => void;
}

export function StatsCard({
  title,
  value,
  change,
  changeLabel = 'vs último período',
  icon,
  trend,
  className,
  valuePrefix = '',
  valueSuffix = '',
  subtitle,
  showMenu = false,
  onMenuAction,
}: StatsCardProps) {
  const isPositive = trend === 'up' || (change !== undefined && change > 0);
  const isNegative = trend === 'down' || (change !== undefined && change < 0);

  return (
    <Card className={cn('relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 dark:hover:shadow-primary/10', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary relative transition-all duration-300 group-hover:bg-primary/15 group-hover:scale-110 dark:bg-primary/15 dark:group-hover:bg-primary/25">
              <div className="absolute inset-0 rounded-xl bg-primary/30 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 dark:bg-primary/40" />
              <span className="relative">{icon}</span>
            </div>
          )}
          <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300">
            {title}
          </CardTitle>
        </div>
        {showMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onMenuAction?.('view')}>
                Ver detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMenuAction?.('export')}>
                Exportar dados
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMenuAction?.('pin')}>
                Fixar no dashboard
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold tracking-tight transition-transform duration-300 group-hover:scale-105 origin-left">
            {valuePrefix}{typeof value === 'number' ? value.toLocaleString() : value}{valueSuffix}
          </span>
          {change !== undefined && (
            <Badge
              variant={isPositive ? 'success' : isNegative ? 'destructive' : 'secondary'}
              appearance="light"
              className="mb-1 transition-transform duration-300 group-hover:translate-x-0.5"
            >
              {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(change).toFixed(1)}%
            </Badge>
          )}
        </div>
        {(subtitle || changeLabel) && (
          <p className="text-xs text-muted-foreground mt-2">
            {subtitle || changeLabel}
          </p>
        )}
      </CardContent>
      {/* Premium hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-violet-500/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none dark:from-primary/8 dark:via-violet-500/3" />
      {/* Border glow on hover */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-[inset_0_0_0_1px_rgba(79,70,229,0.08)] dark:shadow-[inset_0_0_0_1px_rgba(99,102,241,0.15)]" />
    </Card>
  );
}

interface HeroStatProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  accentColor?: 'primary' | 'success' | 'warning' | 'destructive';
}

export function HeroStat({
  title,
  value,
  icon,
  description,
  action,
  className,
  accentColor = 'primary',
}: HeroStatProps) {
  const colorClasses = {
    primary: 'from-primary/20 via-primary/5 to-transparent border-primary/20 dark:from-primary/30 dark:via-primary/10',
    success: 'from-green-500/20 via-green-500/5 to-transparent border-green-500/20 dark:from-green-500/30 dark:via-green-500/10',
    warning: 'from-amber-500/20 via-amber-500/5 to-transparent border-amber-500/20 dark:from-amber-500/30 dark:via-amber-500/10',
    destructive: 'from-red-500/20 via-red-500/5 to-transparent border-red-500/20 dark:from-red-500/30 dark:via-red-500/10',
  };

  const iconClasses = {
    primary: 'bg-primary/15 text-primary dark:bg-primary/20',
    success: 'bg-green-500/15 text-green-600 dark:bg-green-500/20 dark:text-green-400',
    warning: 'bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
    destructive: 'bg-red-500/15 text-red-600 dark:bg-red-500/20 dark:text-red-400',
  };

  return (
    <Card className={cn(
      'relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl',
      colorClasses[accentColor],
      className
    )}>
      <div className={cn('absolute inset-0 bg-gradient-to-br pointer-events-none', colorClasses[accentColor])} />
      <CardContent className="relative pt-6 pb-6">
        <div className="flex items-start justify-between mb-4">
          {icon && (
            <div className={cn('p-3 rounded-xl', iconClasses[accentColor])}>
              {icon}
            </div>
          )}
          {action && (
            <Button variant="ghost" size="sm" onClick={action.onClick} className="text-xs">
              {action.label}
              <ArrowUp className="ml-1 h-3 w-3 rotate-45" />
            </Button>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-4xl font-bold tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {description && (
            <p className="text-sm text-muted-foreground mt-2">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface StatsGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function StatsGrid({ children, columns = 4, className }: StatsGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {children}
    </div>
  );
}

interface BalanceCardProps {
  balance: number;
  change?: number;
  currencies?: { code: string; percent: number; color: string }[];
  className?: string;
  onTopup?: () => void;
}

export function BalanceCard({
  balance,
  change,
  currencies = [],
  className,
  onTopup,
}: BalanceCardProps) {
  return (
    <Card className={cn('bg-card border-border rounded-2xl shadow-xl', className)}>
      <CardHeader className="border-0 pb-2 pt-6 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-muted-foreground">Balance</CardTitle>
        {onTopup && (
          <Button
            onClick={onTopup}
            variant="secondary"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Topup
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 mb-5">
          <span className="text-3xl font-bold tracking-tight text-foreground">
            ${balance.toLocaleString()}
          </span>
          {change !== undefined && (
            <span className={cn(
              "text-base font-semibold ms-2",
              change >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {change >= 0 ? '+' : ''}{change}%
            </span>
          )}
        </div>

        {currencies.length > 0 && (
          <>
            <div className="border-b border-border mb-6" />
            <div className="flex items-center gap-1.5 w-full mb-3">
              {currencies.map((cur) => (
                <div
                  key={cur.code}
                  className="space-y-2.5"
                  style={{ width: `${cur.percent}%` }}
                >
                  <div className={cn(cur.color, 'h-2.5 w-full overflow-hidden rounded-sm transition-all')} />
                  <div className="flex flex-col items-start flex-1">
                    <span className="text-xs text-muted-foreground font-medium">{cur.code}</span>
                    <span className="text-base font-semibold text-foreground">{cur.percent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
