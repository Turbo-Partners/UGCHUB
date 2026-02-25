import { useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();

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
      const res = await fetch(`/api/users/${creatorId}/posts?platform=instagram&limit=12`, {
        credentials: 'include',
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!creatorId,
  });

  // Re-fetch posts after background thumbnail migration (CDN → GCS)
  useEffect(() => {
    if (creatorPosts && creatorPosts.length > 0) {
      const cdnThumbs = creatorPosts.filter(
        (p) => !p.thumbnailUrl || p.thumbnailUrl.startsWith('http'),
      );
      if (cdnThumbs.length > creatorPosts.length * 0.5) {
        const timer = setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: [`/api/users/${creatorId}/posts`] });
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [
    creatorPosts?.length,
    creatorPosts?.filter((p) => p.thumbnailUrl?.startsWith('/objects')).length,
  ]);

  // Trigger profile pic fetch when creator has Instagram but no GCS-stored pic
  useEffect(() => {
    if (
      creator?.instagram &&
      (!creator.instagramProfilePic || !creator.instagramProfilePic.startsWith('/api/storage/'))
    ) {
      const username = creator.instagram.replace('@', '').trim().toLowerCase();
      fetch(`/api/instagram/profile-pic/${encodeURIComponent(username)}`, {
        credentials: 'include',
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.profilePicUrl) {
            queryClient.invalidateQueries({ queryKey: [`/api/users/${creatorId}`] });
          }
        })
        .catch(() => {});
    }
  }, [creator?.id, creator?.instagramProfilePic]);

  if (!match || !creatorId) return null;

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 animate-pulse">
        {/* Hero skeleton */}
        <div className="rounded-xl overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-muted to-muted/60" />
          <div className="bg-card p-6">
            <div className="flex flex-col sm:flex-row gap-4 -mt-16">
              <div className="h-32 w-32 rounded-full bg-muted border-4 border-background" />
              <div className="flex-1 pt-6 space-y-3">
                <div className="h-6 w-48 bg-muted rounded" />
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded" />
              </div>
            </div>
            {/* Stat cards skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl p-4 bg-muted/50 space-y-2">
                  <div className="h-5 w-5 bg-muted rounded mx-auto" />
                  <div className="h-7 w-16 bg-muted rounded mx-auto" />
                  <div className="h-3 w-20 bg-muted rounded mx-auto" />
                </div>
              ))}
            </div>
          </div>
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
