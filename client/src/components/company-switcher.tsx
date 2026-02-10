import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useLocation } from "wouter";
import { Check, ChevronDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { setCurrentBrandId } from "@/lib/brand-context";
import type { Company, CompanyMember } from "@shared/schema";

type CompanyMembership = CompanyMember & { company: Company };

interface CompanySwitcherProps {
  isOpen?: boolean;
  onCreateClick?: () => void;
  onDropdownOpenChange?: (open: boolean) => void;
  compact?: boolean;
}

export function CompanySwitcher({ isOpen = true, onCreateClick, onDropdownOpenChange, compact = false }: CompanySwitcherProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [, setLocation] = useLocation();

  const handleDropdownOpenChange = (open: boolean) => {
    setDropdownOpen(open);
    onDropdownOpenChange?.(open);
  };

  const { data: activeCompany, isLoading: loadingActive } = useQuery<CompanyMembership | null>({
    queryKey: ["/api/active-company"],
    queryFn: async () => {
      const res = await fetch("/api/active-company", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: companies = [] } = useQuery<CompanyMembership[]>({
    queryKey: ["/api/companies"],
    queryFn: async () => {
      const res = await fetch("/api/companies", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const switchCompanyMutation = useMutation({
    mutationFn: async (companyId: number) => {
      const res = await fetch(`/api/active-company/${companyId}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao trocar de loja");
      return { companyId };
    },
    onSuccess: (data) => {
      setCurrentBrandId(data.companyId);
      queryClient.invalidateQueries({ queryKey: ["/api/active-company"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      setLocation(`/company/brand/${data.companyId}/overview`);
    },
  });

  const handleSwitch = (companyId: number) => {
    if (activeCompany?.companyId !== companyId) {
      switchCompanyMutation.mutate(companyId);
    }
    handleDropdownOpenChange(false);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "owner": return "Proprietário";
      case "admin": return "Administrador";
      case "member": return "Membro";
      default: return role;
    }
  };

  if (loadingActive) {
    return (
      <div className="py-2">
        <div className={cn(
          "bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse",
          isOpen ? "h-10" : "h-5 w-5"
        )} />
      </div>
    );
  }

  if (!activeCompany) {
    return (
      <div className="py-2">
        <button
          onClick={onCreateClick}
          className="flex items-center justify-start gap-2 py-2 px-2 rounded-md hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50 transition-colors w-full"
          data-testid="button-create-first-company"
        >
          <Plus className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
          {isOpen && <span className="text-sm text-neutral-700 dark:text-neutral-200">Criar primeira loja</span>}
        </button>
      </div>
    );
  }

  return (
    <div className="py-2">
      <DropdownMenu open={dropdownOpen} onOpenChange={handleDropdownOpenChange}>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center justify-start gap-2 py-2 px-2 rounded-md bg-neutral-200/50 dark:bg-neutral-700/50 hover:bg-neutral-200/70 dark:hover:bg-neutral-700/70 transition-colors cursor-pointer w-full"
            data-testid="button-company-switcher"
          >
            <div className="h-5 w-5 flex-shrink-0 rounded bg-primary/10 flex items-center justify-center overflow-hidden">
              {activeCompany.company.logo ? (
                <img 
                  src={activeCompany.company.logo} 
                  alt={activeCompany.company.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-[10px] font-semibold text-primary uppercase">
                  {activeCompany.company.name.charAt(0)}
                </span>
              )}
            </div>
            {isOpen && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200 truncate">
                    {activeCompany.company.name}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {getRoleLabel(activeCompany.role)}
                  </p>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 text-neutral-500 transition-transform flex-shrink-0",
                  dropdownOpen && "rotate-180"
                )} />
              </>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className="w-64 mb-2">
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
            Suas lojas
          </DropdownMenuLabel>
          {companies.map((membership) => (
            <DropdownMenuItem
              key={membership.companyId}
              onClick={() => handleSwitch(membership.companyId)}
              className="cursor-pointer"
              data-testid={`company-option-${membership.companyId}`}
            >
              <div className="flex items-center gap-2 w-full">
                <div className="h-8 w-8 flex-shrink-0 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                  {membership.company.logo ? (
                    <img 
                      src={membership.company.logo} 
                      alt={membership.company.name}
                      className="h-full w-full rounded-lg object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-primary uppercase">
                      {membership.company.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{membership.company.name}</p>
                  <p className="text-xs text-muted-foreground">{getRoleLabel(membership.role)}</p>
                </div>
                {activeCompany.companyId === membership.companyId && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              handleDropdownOpenChange(false);
              onCreateClick?.();
            }}
            className="cursor-pointer"
            data-testid="button-create-new-company"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>Criar nova loja</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
