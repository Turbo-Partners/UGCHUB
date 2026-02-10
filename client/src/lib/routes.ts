export const ROUTES = {
  // Creator routes
  creator: {
    home: '/home',
    explore: '/explore',
    brands: '/brands',
    brandHub: (brandId: number | string) => `/brands/${brandId}`,
    campaigns: '/campaigns',
    campaignWorkspace: (campaignId: number | string) => `/campaigns/${campaignId}/workspace`,
    messages: '/messages',
    wallet: '/wallet',
    academy: '/academy',
    academyCourse: (courseId: number | string) => `/academy/${courseId}`,
    inspirations: '/inspirations',
    settings: '/settings',
    notifications: '/notifications',
    invites: '/invites',
    profile: '/profile',
  },
  // Company routes
  company: {
    home: '/company/home',
    brands: '/company/brands',
    settings: '/company/settings',
    brand: {
      overview: (brandId: number | string) => `/company/brand/${brandId}/overview`,
      community: (brandId: number | string) => `/company/brand/${brandId}/community`,
      discovery: (brandId: number | string) => `/company/brand/${brandId}/discovery`,
      campaigns: (brandId: number | string) => `/company/brand/${brandId}/campaigns`,
      operations: (brandId: number | string) => `/company/brand/${brandId}/operations`,
      tracking: (brandId: number | string) => `/company/brand/${brandId}/tracking`,
      content: (brandId: number | string) => `/company/brand/${brandId}/content`,
      inspirations: (brandId: number | string) => `/company/brand/${brandId}/inspirations`,
      messages: (brandId: number | string) => `/company/brand/${brandId}/messages`,
      program: (brandId: number | string) => `/company/brand/${brandId}/program`,
      settings: (brandId: number | string) => `/company/brand/${brandId}/settings`,
    },
  },
  // Admin routes
  admin: {
    dashboard: '/admin',
    users: '/admin/users',
    support: '/admin/support',
    modules: '/admin/modules',
    content: '/admin/content',
    campaigns: '/admin/campaigns',
    financial: '/admin/financial',
    gamification: '/admin/gamification',
  },
  // Public routes
  public: {
    landing: '/',
    auth: '/auth',
    blog: '/blog',
    cases: '/cases',
    terms: '/terms',
    privacy: '/politica-privacidade',
    creatorProfile: (id: number | string) => `/public/creator/${id}`,
    brandedLanding: (slug: string) => `/m/${slug}`,
    joinCommunity: (token: string) => `/join/${token}`,
  },
} as const;

export const REDIRECTS = {
  creator: {
    '/feed': '/explore',
    '/applications': '/campaigns?tab=applications',
    '/active-campaigns': '/campaigns?tab=active',
    '/minhas-comunidades': '/brands',
    '/minhas-marcas': '/brands',
    '/leaderboard': '/ranking',
    '/meus-ganhos': '/wallet',
    '/profile': '/settings',
    '/creator/invites': '/campaigns?tab=invites',
    '/hub': '/campaigns',
  },
  company: {
    '/dashboard': '/company/home',
    '/kanban': '/company/ops',
    '/campaigns': '/company/hub',
    '/creators': '/company/creators',
    '/financeiro': '/company/wallet',
    '/workflow-settings': '/company/settings',
    '/comunidade': '/company/brand/:brandId/community',
    '/community-settings': '/company/brand/:brandId/settings',
  },
} as const;

export type CreatorRoutes = typeof ROUTES.creator;
export type CompanyRoutes = typeof ROUTES.company;
