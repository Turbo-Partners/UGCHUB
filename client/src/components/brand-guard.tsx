import { useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useMarketplace } from '@/lib/provider';
import { useBrand } from '@/lib/brand-context';
import { Loader2 } from 'lucide-react';

interface BrandGuardProps {
  children: React.ReactNode;
}

export function BrandGuard({ children }: BrandGuardProps) {
  const { user } = useMarketplace();
  const { brandId: contextBrandId, setBrandId } = useBrand();
  const [location, setLocation] = useLocation();
  const params = useParams<{ brandId?: string }>();
  
  const { data: companies = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/companies'],
    enabled: user?.role === 'company',
  });

  const urlBrandId = params.brandId ? parseInt(params.brandId, 10) : null;
  
  useEffect(() => {
    if (isLoading || user?.role !== 'company') return;
    
    const isBrandRoute = location.startsWith('/company/brand/');
    
    if (isBrandRoute) {
      if (urlBrandId) {
        const hasAccess = companies.some((c: any) => c.companyId === urlBrandId);
        if (hasAccess) {
          if (contextBrandId !== urlBrandId) {
            setBrandId(urlBrandId);
          }
        } else {
          setLocation('/company/brands');
        }
      } else if (contextBrandId) {
        const hasAccess = companies.some((c: any) => c.companyId === contextBrandId);
        if (hasAccess) {
          const newPath = location.replace('/company/brand/', `/company/brand/${contextBrandId}/`);
          setLocation(newPath);
        } else {
          setLocation('/company/brands');
        }
      } else if (companies.length > 0) {
        const firstBrandId = companies[0].companyId;
        setBrandId(firstBrandId);
        setLocation(`/company/brand/${firstBrandId}/overview`);
      } else {
        setLocation('/company/brands');
      }
    }
  }, [location, urlBrandId, contextBrandId, companies, isLoading, user?.role, setLocation, setBrandId]);

  if (isLoading && user?.role === 'company') {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
