import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { setCurrentBrandId } from "@/lib/brand-context";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Building2, Megaphone, ChevronRight, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Company, CompanyMember } from "@shared/schema";

type CompanyWithStats = CompanyMember & { 
  company: Company;
  activeCampaignsCount: number;
  totalCampaignsCount: number;
};

interface CompanySelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompanySelected?: (companyId: number) => void;
}

export function CompanySelectionModal({ open, onOpenChange, onCompanySelected }: CompanySelectionModalProps) {
  const [, setLocation] = useLocation();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: companies = [], isLoading } = useQuery<CompanyWithStats[]>({
    queryKey: ["/api/companies-with-stats"],
    queryFn: async () => {
      const res = await fetch("/api/companies-with-stats", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open,
  });

  const switchCompanyMutation = useMutation({
    mutationFn: async (companyId: number) => {
      const res = await fetch(`/api/active-company/${companyId}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao selecionar loja");
      return { companyId };
    },
    onSuccess: (data) => {
      setCurrentBrandId(data.companyId);
      queryClient.invalidateQueries({ queryKey: ["/api/active-company"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      onOpenChange(false);
      onCompanySelected?.(data.companyId);
      setLocation(`/company/brand/${data.companyId}/overview`);
    },
  });

  const handleSelectCompany = (companyId: number) => {
    setSelectedId(companyId);
    switchCompanyMutation.mutate(companyId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden border-0 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="relative">
          {/* Decorative gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10 opacity-50" />
          
          {/* Header */}
          <div className="relative px-8 pt-8 pb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Selecione sua Empresa</h2>
                <p className="text-muted-foreground">Escolha em qual conta você deseja acessar</p>
              </div>
            </div>
          </div>

          {/* Companies Grid */}
          <div className="relative px-8 pb-8">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                  {companies.map((membership, index) => {
                    const isSelected = selectedId === membership.companyId;
                    const isLoading = isSelected && switchCompanyMutation.isPending;
                    
                    return (
                      <motion.div
                        key={membership.companyId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card
                          onClick={() => !switchCompanyMutation.isPending && handleSelectCompany(membership.companyId)}
                          className={cn(
                            "relative cursor-pointer transition-all duration-300 group",
                            "hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50",
                            "border-2 overflow-hidden",
                            isSelected && "border-primary shadow-lg shadow-primary/20",
                            switchCompanyMutation.isPending && !isSelected && "opacity-50 cursor-not-allowed"
                          )}
                          data-testid={`company-card-${membership.companyId}`}
                        >
                          {/* Hover gradient effect */}
                          <div className={cn(
                            "absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 transition-opacity",
                            "group-hover:opacity-100",
                            isSelected && "opacity-100"
                          )} />
                          
                          <div className="relative p-5">
                            <div className="flex items-start gap-4">
                              {/* Company Logo */}
                              <div className={cn(
                                "h-14 w-14 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0",
                                "bg-gradient-to-br from-primary/20 to-purple-500/20",
                                "border border-border/50 transition-all",
                                "group-hover:scale-105 group-hover:border-primary/30"
                              )}>
                                {membership.company.logo ? (
                                  <img 
                                    src={membership.company.logo} 
                                    alt={membership.company.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xl font-bold text-primary">
                                    {membership.company.name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              
                              {/* Company Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-lg truncate">
                                    {membership.company.name}
                                  </h3>
                                  {isLoading && (
                                    <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
                                  )}
                                </div>
                                
                                {/* Campaign stats badge */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge 
                                    variant="secondary" 
                                    className={cn(
                                      "gap-1.5 font-medium",
                                      membership.activeCampaignsCount > 0 
                                        ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" 
                                        : "bg-muted"
                                    )}
                                  >
                                    <Megaphone className="h-3 w-3" />
                                    {membership.activeCampaignsCount} {membership.activeCampaignsCount === 1 ? 'campanha ativa' : 'campanhas ativas'}
                                  </Badge>
                                </div>
                              </div>
                              
                              {/* Arrow indicator */}
                              <ChevronRight className={cn(
                                "h-5 w-5 text-muted-foreground/50 flex-shrink-0 transition-all",
                                "group-hover:text-primary group-hover:translate-x-1",
                                isSelected && "text-primary translate-x-1"
                              )} />
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {/* Subtle branding */}
            <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground/50">
              <Sparkles className="h-3 w-3" />
              <span>CreatorConnect</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
