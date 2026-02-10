import { useRoute, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { User, CreatorPost } from '@shared/schema';
import CreatorProfileView from '@/components/CreatorProfileView';

type CompletedJob = {
  id: number;
  campaignTitle: string;
  companyName: string;
  companyLogo: string | null;
  completedAt: string;
  payment: number | null;
};

type CommunityMembership = {
  id: number;
  companyId: number;
  companyName: string;
  companyLogo: string | null;
  status: string;
  joinedAt: string | null;
  tierName: string | null;
  points: number;
};

export default function CreatorProfile() {
  const [match, params] = useRoute('/creator/:id/profile');
  const [_, navigate] = useLocation();
  
  const creatorId = params?.id ? parseInt(params.id) : null;

  const { data: creator, isLoading } = useQuery<User>({
    queryKey: [`/api/users/${creatorId}`],
    queryFn: async () => {
      const res = await fetch(`/api/users/${creatorId}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch creator');
      return res.json();
    },
    enabled: !!creatorId,
  });

  const { data: ratingData } = useQuery<{ average: number; count: number }>({
    queryKey: [`/api/users/${creatorId}/rating`],
    queryFn: async () => {
      const res = await fetch(`/api/users/${creatorId}/rating`, { credentials: 'include' });
      if (!res.ok) return { average: 0, count: 0 };
      return res.json();
    },
    enabled: !!creatorId,
  });

  const { data: completedJobs } = useQuery<CompletedJob[]>({
    queryKey: [`/api/users/${creatorId}/completed-jobs`],
    queryFn: async () => {
      const res = await fetch(`/api/users/${creatorId}/completed-jobs`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!creatorId,
  });

  const { data: communities } = useQuery<CommunityMembership[]>({
    queryKey: [`/api/users/${creatorId}/communities`],
    queryFn: async () => {
      const res = await fetch(`/api/users/${creatorId}/communities`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!creatorId,
  });

  const { data: creatorPosts } = useQuery<CreatorPost[]>({
    queryKey: [`/api/users/${creatorId}/posts`],
    queryFn: async () => {
      const res = await fetch(`/api/users/${creatorId}/posts?platform=instagram&limit=12`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!creatorId,
  });

  if (!match || !creatorId) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-muted" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-xl font-semibold mb-2">Criador não encontrado</h2>
        <Button onClick={() => navigate('/creators')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Banco de Talentos
        </Button>
      </div>
    );
  }

  return (
    <CreatorProfileView
      creator={creator}
      creatorPosts={creatorPosts || []}
      completedJobs={completedJobs || []}
      communities={communities || []}
      ratingData={ratingData}
      isPublic={false}
      backUrl="/creators"
      backLabel="Voltar para Banco de Talentos"
    />
  );
}
