import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMarketplace } from './provider';

const BRAND_ID_KEY = 'creatorconnect_active_brand_id';

interface BrandContextType {
  brandId: number | null;
  setBrandId: (id: number | null) => void;
  isLoading: boolean;
}

const BrandContext = createContext<BrandContextType | null>(null);

let globalSetBrandId: ((id: number | null) => void) | null = null;

export function BrandProvider({ children }: { children: ReactNode }) {
  const { user } = useMarketplace();
  const [brandId, setBrandIdState] = useState<number | null>(() => {
    const saved = localStorage.getItem(BRAND_ID_KEY);
    return saved ? parseInt(saved, 10) : null;
  });

  const { data: activeCompany, isLoading } = useQuery<any>({
    queryKey: ['/api/active-company'],
    enabled: user?.role === 'company',
  });

  useEffect(() => {
    if (activeCompany?.companyId && !brandId) {
      setBrandIdState(activeCompany.companyId);
      localStorage.setItem(BRAND_ID_KEY, activeCompany.companyId.toString());
    }
  }, [activeCompany, brandId]);

  const setBrandId = useCallback((id: number | null) => {
    setBrandIdState(id);
    if (id) {
      localStorage.setItem(BRAND_ID_KEY, id.toString());
    } else {
      localStorage.removeItem(BRAND_ID_KEY);
    }
  }, []);

  useEffect(() => {
    globalSetBrandId = setBrandId;
    return () => {
      globalSetBrandId = null;
    };
  }, [setBrandId]);

  return (
    <BrandContext.Provider value={{ brandId, setBrandId, isLoading }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) {
    return { brandId: getCurrentBrandId(), setBrandId: setCurrentBrandId, isLoading: false };
  }
  return context;
}

export function getCurrentBrandId(): number | null {
  const saved = localStorage.getItem(BRAND_ID_KEY);
  return saved ? parseInt(saved, 10) : null;
}

export function setCurrentBrandId(id: number | null): void {
  if (id) {
    localStorage.setItem(BRAND_ID_KEY, id.toString());
  } else {
    localStorage.removeItem(BRAND_ID_KEY);
  }
  if (globalSetBrandId) {
    globalSetBrandId(id);
  }
}
