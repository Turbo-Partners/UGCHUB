import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortDirection = 'asc' | 'desc' | null;

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
  getSortValue?: (item: T) => any;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Cache the active column to avoid repeated finds
  const activeColumn = sortColumn ? columns.find(col => col.key === sortColumn) : null;
  
  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn || !sortDirection || !activeColumn) return 0;

    const aValue = activeColumn.getSortValue ? activeColumn.getSortValue(a) : a[sortColumn];
    const bValue = activeColumn.getSortValue ? activeColumn.getSortValue(b) : b[sortColumn];

    // Handle null/undefined - push to end for asc, beginning for desc
    const nullMultiplier = sortDirection === 'asc' ? 1 : -1;
    if (aValue === null || aValue === undefined) return nullMultiplier;
    if (bValue === null || bValue === undefined) return -nullMultiplier;

    // Try to parse as dates if it looks like an ISO date string
    if (typeof aValue === 'string' && typeof bValue === 'string' && 
        aValue.match(/^\d{4}-\d{2}-\d{2}/) && bValue.match(/^\d{4}-\d{2}-\d{2}/)) {
      const aDate = new Date(aValue).getTime();
      const bDate = new Date(bValue).getTime();
      if (!isNaN(aDate) && !isNaN(bDate)) {
        return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
      }
    }

    // Handle numbers
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    // Handle strings
    const aString = String(aValue).toLowerCase();
    const bString = String(bValue).toLowerCase();

    if (sortDirection === 'asc') {
      return aString.localeCompare(bString);
    } else {
      return bString.localeCompare(aString);
    }
  });

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-40" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="ml-2 h-4 w-4" />;
    }
    if (sortDirection === 'desc') {
      return <ArrowDown className="ml-2 h-4 w-4" />;
    }
    return <ArrowUpDown className="ml-2 h-4 w-4 opacity-40" />;
  };

  return (
    <div className={cn(
      "rounded-xl border overflow-hidden relative",
      "dark:border-zinc-800/60 dark:bg-zinc-900/40 dark:backdrop-blur-xl",
      "dark:shadow-[0_0_40px_-15px_rgba(99,102,241,0.1)]",
      className
    )}>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none dark:block hidden" />
      
      <div className="overflow-x-auto relative z-10">
        <Table>
          <TableHeader className="sticky top-0 bg-white dark:bg-zinc-900/90 dark:backdrop-blur-xl z-40 shadow-sm dark:shadow-none dark:border-b dark:border-zinc-800/60">
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    column.className,
                    column.sortable && "cursor-pointer select-none hover:bg-muted/50 transition-colors"
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                  data-testid={`header-${column.key}`}
                >
                  <div className="flex items-center">
                    {column.label}
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhum resultado encontrado
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((item) => (
                <TableRow
                  key={keyExtractor(item)}
                  className={cn(
                    "transition-all duration-300",
                    "dark:hover:bg-white/[0.03] dark:hover:shadow-[inset_0_0_30px_rgba(99,102,241,0.03)]",
                    onRowClick && "cursor-pointer hover:bg-muted/50"
                  )}
                  onClick={() => onRowClick?.(item)}
                  data-testid={`row-${keyExtractor(item)}`}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.render ? column.render(item) : item[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
