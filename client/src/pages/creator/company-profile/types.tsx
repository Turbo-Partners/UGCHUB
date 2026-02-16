import type { StructuredBriefing, BrandCanvas } from '@shared/schema';

export interface CompanyProfile {
  id: number;
  name: string;
  tradeName: string | null;
  logo: string | null;
  coverPhoto: string | null;
  description: string | null;
  category: string | null;
  tagline: string | null;
  city: string | null;
  state: string | null;
  website: string | null;
  instagram: string | null;
  tiktok: string | null;
  email: string | null;
  phone: string | null;
  cnpj: string | null;
  isFeatured: boolean;
  isDiscoverable: boolean;
  createdAt: string | null;
  companyBriefing: string | null;
  structuredBriefing: StructuredBriefing | null;
  brandColors: string[] | null;
  brandLogo: string | null;
  websiteProducts: string[] | null;
  brandCanvas: BrandCanvas | null;
  websiteTitle: string | null;
  websiteDescription: string | null;
  websiteKeywords: string[] | null;
  websiteSocialLinks: Record<string, string> | null;
  websiteFaq: { question: string; answer: string }[] | null;
  ecommercePlatform: string | null;
  ecommerceProductCount: number | null;
  ecommerceCategories: string[] | null;
  enrichmentScore: number | null;
  instagramBio: string | null;
  websiteAbout: string | null;
  aiContextSummary: string | null;
}

export interface InstagramMetrics {
  exists: boolean;
  username?: string;
  followers?: number;
  followersDisplay?: string;
  engagementRate?: number;
  engagementDisplay?: string;
  isVerified?: boolean;
  bio?: string;
  postsCount?: number;
}

export interface CompanyStats {
  company: CompanyProfile;
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalApplications: number;
  acceptedApplications: number;
  acceptanceRate: string;
  avgResponseTime: string;
  avgRating: number;
  totalReviews: number;
  totalCollaborations: number;
  favoriteCount: number;
  topCreators: {
    id: number;
    name: string;
    avatar: string | null;
    collaborations: number;
    avgRating: number;
  }[];
}

export interface RecentPartnership {
  id: number;
  campaignTitle: string;
  creatorName: string;
  creatorAvatar: string | null;
  creatorCity: string | null;
  creatorNiche: string | null;
  thumbnail: string | null;
  hasVideo: boolean;
  completedAt: string;
}

export interface OpenCampaign {
  id: number;
  title: string;
  description: string;
  budget: number | null;
  deadline: string;
  targetNiche: string[] | null;
  creatorsNeeded: number | null;
  applicationsCount: number;
}

export interface PublicDeliverable {
  id: number;
  fileUrl: string;
  fileType: string | null;
  deliverableType: string | null;
  description: string | null;
  uploadedAt: string;
  campaignTitle: string;
  creatorName: string;
  creatorAvatar: string | null;
}

export const deliverableTypeLabels: Record<string, string> = {
  post_feed: 'Feed',
  reels: 'Reels',
  stories: 'Stories',
  tiktok: 'TikTok',
  youtube_video: 'YouTube',
  youtube_shorts: 'Shorts',
  twitter_post: 'Twitter',
  other: 'Outro',
};

export const categoryLabels: Record<string, string> = {
  saude: 'Saúde',
  beleza: 'Beleza',
  moda: 'Moda',
  tecnologia: 'Tecnologia',
  alimentos: 'Alimentos',
  bebidas: 'Bebidas',
  fitness: 'Fitness',
  casa: 'Casa',
  pets: 'Pets',
  infantil: 'Infantil',
  servicos: 'Serviços',
  outros: 'Outros',
};

export function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  );
}

export function getMarketTime(createdAt: string | null): string | null {
  if (!createdAt) return null;
  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffMonths = (now.getFullYear() - createdDate.getFullYear()) * 12 + (now.getMonth() - createdDate.getMonth());
  if (diffMonths < 1) return "Novo na plataforma";
  if (diffMonths < 12) return `${diffMonths} ${diffMonths === 1 ? 'mês' : 'meses'} na plataforma`;
  const years = Math.floor(diffMonths / 12);
  return `${years} ${years === 1 ? 'ano' : 'anos'} na plataforma`;
}
