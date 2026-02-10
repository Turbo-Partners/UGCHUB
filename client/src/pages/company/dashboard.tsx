import { Link, useLocation, Redirect } from 'wouter';
import { useQuery } from "@tanstack/react-query";
import { useMarketplace } from "@/lib/provider";
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Plus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnalyticsContent } from "@/components/analytics-content";
import type { Company, CompanyMember } from "@shared/schema";

type ActiveCompanyResponse = CompanyMember & { company: Company };

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function CompanyDashboard() {
  const { user } = useMarketplace();
  
  const { data: activeCompanyData, isLoading } = useQuery<ActiveCompanyResponse>({
    queryKey: ["/api/active-company"],
    enabled: !!user && user.role === "company",
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (activeCompanyData?.company && !activeCompanyData.company.onboardingCompleted) {
    return <Redirect to="/company/onboarding" />;
  }

  return (
    <motion.div 
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Painel"
          description="Acompanhe os analytics da sua empresa."
        >
          <Link href="/create-campaign">
            <Button className="shadow-lg shadow-primary/20 transition-transform hover:scale-105">
              <Plus className="mr-2 h-4 w-4" />
              Nova Campanha
            </Button>
          </Link>
        </PageHeader>
      </motion.div>

      <motion.div variants={itemVariants}>
        <AnalyticsContent />
      </motion.div>
    </motion.div>
  );
}
