import { useState } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CompanyStats, OpenCampaign, RecentPartnership, PublicDeliverable, InstagramMetrics } from './types';
import { categoryLabels, getMarketTime } from './types';

export function useCompanyProfile() {
  const [matchCompany, paramsCompany] = useRoute('/company/:id/profile');
  const [matchBrand, paramsBrand] = useRoute('/brand/:id');
  const queryClient = useQueryClient();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [applySheetOpen, setApplySheetOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [applyStep, setApplyStep] = useState<'select' | 'message' | 'success'>('select');
  const [instagramMetrics, setInstagramMetrics] = useState<InstagramMetrics | null>(null);

  const params = paramsCompany || paramsBrand;
  const companyId = params?.id ? parseInt(params.id) : null;
  const isValidRoute = (matchCompany || matchBrand) && !!companyId;

  const { data: stats, isLoading, error } = useQuery<CompanyStats>({
    queryKey: [`/api/companies/${companyId}/public-stats`],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/public-stats`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch company stats');
      return res.json();
    },
    enabled: !!companyId,
  });

  const { data: favoriteStatus } = useQuery<{ isFavorite: boolean }>({
    queryKey: [`/api/favorite-companies/${companyId}/check`],
    queryFn: async () => {
      const res = await fetch(`/api/favorite-companies/${companyId}/check`, {
        credentials: 'include',
      });
      if (!res.ok) return { isFavorite: false };
      return res.json();
    },
    enabled: !!companyId,
  });

  const { data: openCampaigns = [] } = useQuery<OpenCampaign[]>({
    queryKey: [`/api/companies/${companyId}/public-campaigns`],
    enabled: !!companyId,
  });

  const { data: recentPartnerships = [] } = useQuery<RecentPartnership[]>({
    queryKey: [`/api/companies/${companyId}/recent-partnerships`],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/recent-partnerships`, {
        credentials: 'include',
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!companyId,
  });

  const { data: publicDeliverables = [] } = useQuery<PublicDeliverable[]>({
    queryKey: [`/api/companies/${companyId}/public-deliverables`],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/public-deliverables`, {
        credentials: 'include',
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!companyId,
  });

  useQuery({
    queryKey: [`instagram-metrics-${stats?.company?.instagram}`],
    queryFn: async () => {
      if (!stats?.company?.instagram) return null;
      const username = stats.company.instagram.replace('@', '').trim();
      if (!username) return null;

      const res = await fetch(`/api/enrichment/instagram/${encodeURIComponent(username)}`, {
        credentials: 'include',
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.success && data.data) {
        setInstagramMetrics(data.data);
      }
      return data;
    },
    enabled: !!stats?.company?.instagram,
    staleTime: 1000 * 60 * 30,
  });

  const { data: membershipStatus } = useQuery<{ isMember: boolean; status: string | null; joinedAt: string | null }>({
    queryKey: [`/api/companies/${companyId}/membership-status`],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/membership-status`, {
        credentials: 'include',
      });
      if (!res.ok) return { isMember: false, status: null, joinedAt: null };
      return res.json();
    },
    enabled: !!companyId,
  });

  const requestMembershipMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/request-membership`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao solicitar entrada');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/membership-status`] });
      toast.success('Solicitação enviada! A marca irá avaliar seu pedido.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const addFavoriteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/favorite-companies/${companyId}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to add favorite');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/favorite-companies/${companyId}/check`] });
      queryClient.invalidateQueries({ queryKey: ['/api/favorite-companies'] });
      toast.success('Marca adicionada aos favoritos!');
    },
    onError: () => {
      toast.error('Erro ao adicionar aos favoritos');
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/favorite-companies/${companyId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to remove favorite');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/favorite-companies/${companyId}/check`] });
      queryClient.invalidateQueries({ queryKey: ['/api/favorite-companies'] });
      toast.success('Marca removida dos favoritos');
    },
    onError: () => {
      toast.error('Erro ao remover dos favoritos');
    },
  });

  const applyMutation = useMutation({
    mutationFn: async ({ campaignId, message }: { campaignId: number; message: string }) => {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ campaignId, message }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao enviar candidatura');
      }
      return res.json();
    },
    onSuccess: () => {
      setApplyStep('success');
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/public-campaigns`] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const isFavorite = favoriteStatus?.isFavorite ?? false;
  const isFavoriteLoading = addFavoriteMutation.isPending || removeFavoriteMutation.isPending;

  const handleToggleFavorite = () => {
    if (isFavorite) {
      removeFavoriteMutation.mutate();
    } else {
      addFavoriteMutation.mutate();
    }
  };

  const handleOpenApplySheet = () => {
    setApplySheetOpen(true);
    setApplyStep('select');
    setSelectedCampaignId(null);
    setApplicationMessage('');
  };

  const handleSelectCampaign = (campaignId: number) => {
    setSelectedCampaignId(campaignId);
    setApplyStep('message');
  };

  const handleSubmitApplication = () => {
    if (!selectedCampaignId) return;
    applyMutation.mutate({ campaignId: selectedCampaignId, message: applicationMessage });
  };

  const handleCloseSheet = () => {
    setApplySheetOpen(false);
    setApplyStep('select');
    setSelectedCampaignId(null);
    setApplicationMessage('');
  };

  const displayName = stats?.company ? (stats.company.tradeName || stats.company.name) : '';
  const categoryLabel = stats?.company?.category ? categoryLabels[stats.company.category] || stats.company.category : null;
  const marketTime = stats?.company ? getMarketTime(stats.company.createdAt) : null;
  const selectedCampaign = openCampaigns.find(c => c.id === selectedCampaignId);

  return {
    isValidRoute,
    isLoading,
    error,
    stats,
    displayName,
    categoryLabel,
    marketTime,
    openCampaigns,
    recentPartnerships,
    publicDeliverables,
    instagramMetrics,
    membershipStatus,
    isFavorite,
    isFavoriteLoading,
    showFullDescription,
    setShowFullDescription,
    applySheetOpen,
    setApplySheetOpen,
    applyStep,
    setApplyStep,
    applicationMessage,
    setApplicationMessage,
    selectedCampaign,
    requestMembershipMutation,
    applyMutation,
    handleToggleFavorite,
    handleOpenApplySheet,
    handleSelectCampaign,
    handleSubmitApplication,
    handleCloseSheet,
  };
}
