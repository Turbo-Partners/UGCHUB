import {
  users,
  campaigns,
  applications,
  notifications,
  deliverables,
  problemReports,
  favoriteCreators,
  favoriteCompanies,
  campaignInvites,
  deliverableComments,
  campaignTemplates,
  companies,
  companyMembers,
  companyUserInvites,
  workflowStages,
  creatorPosts,
  creatorAnalyticsHistory,
  tiktokProfiles,
  creatorHashtags,
  postAiInsights,
  featureFlags,
  creatorLevels,
  creatorPoints,
  badges,
  creatorBadges,
  campaignCreatorStats,
  campaignCoupons,
  salesTracking,
  creatorCommissions,
  brandSettings,
  companyWallets,
  walletBoxes,
  creatorBalances,
  walletTransactions,
  paymentBatches,
  brandPrograms,
  brandRewards,
  brandTierConfigs,
  campaignPrizes,
  pointsLedger,
  brandCreatorTiers,
  campaignMetricSnapshots,
  rewardEntitlements,
  brandCreatorMemberships,
  communityInvites,
  campaignPointsRules,
  creatorDiscoveryProfiles,
  inspirations,
  inspirationCollections,
  inspirationCollectionItems,
  creatorSavedInspirations,
  campaignInspirations,
  creatorAddresses,
  conversations,
  convMessages,
  messageReads,
  tags,
  creatorTags,
  brandTags,
  campaignTags,
  type User,
  type InsertUser,
  type Campaign,
  type InsertCampaign,
  type Application,
  type InsertApplication,
  type Notification,
  type InsertNotification,
  type Deliverable,
  type InsertDeliverable,
  type ProblemReport,
  type InsertProblemReport,
  type FavoriteCreator,
  type InsertFavoriteCreator,
  type FavoriteCompany,
  type InsertFavoriteCompany,
  type CampaignInvite,
  type InsertCampaignInvite,
  type DeliverableComment,
  type InsertDeliverableComment,
  type Tag,
  type CampaignTemplate,
  type InsertCampaignTemplate,
  type Company,
  type InsertCompany,
  type CompanyMember,
  type InsertCompanyMember,
  type CompanyUserInvite,
  type InsertCompanyUserInvite,
  type Inspiration,
  type InsertInspiration,
  type InspirationCollection,
  type InsertInspirationCollection,
  type InspirationCollectionItem,
  type InsertInspirationCollectionItem,
  type CreatorSavedInspiration,
  type InsertCreatorSavedInspiration,
  type CampaignInspiration,
  type InsertCampaignInspiration,
  type WorkflowStage,
  type InsertWorkflowStage,
  type CreatorPost,
  type InsertCreatorPost,
  type CreatorAnalyticsHistory,
  type InsertCreatorAnalyticsHistory,
  type TikTokProfile,
  type InsertTikTokProfile,
  type CreatorHashtag,
  type InsertCreatorHashtag,
  type PostAiInsight,
  type InsertPostAiInsight,
  type FeatureFlag,
  type InsertFeatureFlag,
  type CreatorLevel,
  type BrandProgram,
  type InsertBrandProgram,
  type BrandReward,
  type InsertBrandReward,
  type BrandTierConfig,
  type InsertBrandTierConfig,
  type CampaignPrize,
  type InsertCampaignPrize,
  type PointsLedgerEntry,
  type InsertPointsLedgerEntry,
  type BrandCreatorTier,
  type InsertBrandCreatorTier,
  type CampaignMetricSnapshot,
  type InsertCampaignMetricSnapshot,
  type RewardEntitlement,
  type InsertRewardEntitlement,
  type InsertCreatorLevel,
  type CreatorPointsEntry,
  type InsertCreatorPoints,
  type CompanyWallet,
  type InsertCompanyWallet,
  type WalletBox,
  type InsertWalletBox,
  type CreatorBalance,
  type InsertCreatorBalance,
  type WalletTransaction,
  type InsertWalletTransaction,
  type PaymentBatch,
  type InsertPaymentBatch,
  type Badge,
  type InsertBadge,
  type BrandSettings,
  type InsertBrandSettings,
  type CreatorBadge,
  type InsertCreatorBadge,
  type CampaignCreatorStats,
  type InsertCampaignCreatorStats,
  type CampaignCoupon,
  type InsertCampaignCoupon,
  type SalesTracking,
  type CreatorCommission,
  type BrandCreatorMembership,
  type InsertBrandCreatorMembership,
  type CommunityInvite,
  type InsertCommunityInvite,
  type CampaignPointsRules,
  type InsertCampaignPointsRules,
  type CreatorDiscoveryProfile,
  type InsertCreatorDiscoveryProfile,
  courses,
  courseModules,
  courseLessons,
  creatorCourseProgress,
  creatorLessonProgress,
  type Course,
  type InsertCourse,
  type CourseModule,
  type InsertCourseModule,
  type CourseLesson,
  type InsertCourseLesson,
  type CreatorCourseProgress,
  type InsertCreatorCourseProgress,
  type CreatorLessonProgress,
  type InsertCreatorLessonProgress,
  type CreatorAddress,
  type InsertCreatorAddress,
  type Conversation,
  type InsertConversation,
  type ConvMessage,
  type InsertConvMessage,
  type MessageRead,
  type InsertMessageRead,
  type ConversationType,
} from '@shared/schema';
import { calculateAge } from '@shared/utils';
import { getRegionForState } from '@shared/constants';
import { db } from './db';
import {
  eq,
  and,
  inArray,
  or,
  like,
  sql,
  desc,
  asc,
  ne,
  gte,
  lte,
  isNull,
  type SQL,
} from 'drizzle-orm';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { pool } from './db';

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User Operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByInstagram(handle: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  getCreators(): Promise<User[]>;
  getCreatorsForMatching(campaign: Campaign): Promise<User[]>;
  scoreCreatorForCampaign(
    creator: User,
    campaign: Campaign,
  ): { score: number; breakdown: Record<string, number>; reasons: string[] };

  // Campaign Operations
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  getCampaign(id: number): Promise<Campaign | undefined>;
  getCompanyCampaigns(companyId: number): Promise<Campaign[]>;
  getAllCampaigns(): Promise<Campaign[]>;
  getQualifiedCampaignsForCreator(
    creatorId: number,
  ): Promise<(Campaign & { matchScore?: number })[]>;
  updateCampaign(id: number, data: Partial<Campaign>): Promise<Campaign>;
  updateCampaignStatus(id: number, status: 'open' | 'closed'): Promise<Campaign>;
  deleteCampaign(id: number): Promise<void>;

  // Application Operations
  createApplication(application: InsertApplication): Promise<Application>;
  getApplication(id: number): Promise<Application | undefined>;
  getExistingApplication(campaignId: number, creatorId: number): Promise<Application | undefined>;
  getCampaignApplications(campaignId: number): Promise<Application[]>;
  getCompanyApplications(companyId: number): Promise<Application[]>;
  getCreatorApplications(creatorId: number): Promise<Application[]>;
  getCreatorAcceptedApplications(creatorId: number): Promise<Application[]>;
  updateApplicationStatus(id: number, status: 'accepted' | 'rejected'): Promise<Application>;
  updateApplicationWorkflowStatus(id: number, workflowStatus: string): Promise<Application>;
  updateApplicationCreatorWorkflowStatus(
    id: number,
    creatorWorkflowStatus: string,
  ): Promise<Application>;
  updateApplicationSeeding(
    id: number,
    seedingStatus: 'not_required' | 'pending' | 'sent' | 'received',
    trackingCode?: string,
    notes?: string,
  ): Promise<Application>;
  deleteApplication(id: number): Promise<void>;

  // Campaign Briefing Operations
  updateCampaignBriefing(
    id: number,
    briefingText: string | null,
    briefingMaterials: string[] | null,
  ): Promise<Campaign>;

  // Deliverable Operations
  createDeliverable(deliverable: InsertDeliverable): Promise<Deliverable>;
  getApplicationDeliverables(applicationId: number): Promise<Deliverable[]>;
  deleteDeliverable(id: number): Promise<void>;

  // Notification Operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: number, limit?: number): Promise<Notification[]>;
  getUnreadNotifications(userId: number): Promise<Notification[]>;
  getNotificationByIdForUser(id: number, userId: number): Promise<Notification | null>;
  markNotificationAsRead(id: number, userId: number): Promise<Notification | null>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  getUnreadCount(userId: number): Promise<number>;

  // Problem Report Operations
  createProblemReport(report: InsertProblemReport): Promise<ProblemReport>;
  getProblemReports(): Promise<ProblemReport[]>;
  updateProblemReportStatus(id: number, status: 'open' | 'resolved'): Promise<ProblemReport>;

  // Favorite Creator Operations
  addFavoriteCreator(companyId: number, creatorId: number): Promise<FavoriteCreator>;
  removeFavoriteCreator(companyId: number, creatorId: number): Promise<void>;
  getCompanyFavoriteCreators(companyId: number): Promise<number[]>;
  isFavorite(companyId: number, creatorId: number): Promise<boolean>;

  // Favorite Company Operations (for creators)
  addFavoriteCompany(creatorId: number, companyId: number): Promise<FavoriteCompany>;
  removeFavoriteCompany(creatorId: number, companyId: number): Promise<void>;
  getCreatorFavoriteCompanies(
    creatorId: number,
  ): Promise<(FavoriteCompany & { company: Company })[]>;
  isCompanyFavorite(creatorId: number, companyId: number): Promise<boolean>;
  getCompanyFavoriteCount(companyId: number): Promise<number>;
  getCreatorsWhoFavoritedCompany(companyId: number): Promise<User[]>;
  getCompanyRecentPartnerships(
    companyId: number,
    limit?: number,
  ): Promise<
    {
      id: number;
      campaignTitle: string;
      creatorName: string;
      creatorAvatar: string | null;
      creatorCity: string | null;
      creatorNiche: string | null;
      thumbnail: string | null;
      hasVideo: boolean;
      completedAt: string;
    }[]
  >;
  getCompanyPublicDeliverables(
    companyId: number,
    limit?: number,
  ): Promise<
    {
      id: number;
      fileUrl: string;
      fileType: string | null;
      deliverableType: string | null;
      description: string | null;
      uploadedAt: string;
      campaignTitle: string;
      creatorName: string;
      creatorAvatar: string | null;
    }[]
  >;

  // Trending Companies
  getTrendingCompanies(limit?: number): Promise<
    {
      id: number;
      name: string;
      tradeName: string | null;
      logo: string | null;
      description: string | null;
      avgRating: number;
      totalReviews: number;
      activeCampaigns: number;
      favoriteCount: number;
    }[]
  >;

  // Discovery Operations
  getDiscoverableBrands(options: {
    category?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<
    {
      id: number;
      name: string;
      tradeName: string | null;
      slug: string | null;
      logo: string | null;
      coverPhoto: string | null;
      description: string | null;
      category: string | null;
      tagline: string | null;
      isFeatured: boolean;
      openCampaignsCount: number;
    }[]
  >;
  getFeaturedBrands(limit?: number): Promise<
    {
      id: number;
      name: string;
      tradeName: string | null;
      slug: string | null;
      logo: string | null;
      coverPhoto: string | null;
      description: string | null;
      category: string | null;
      tagline: string | null;
      isFeatured: boolean;
      openCampaignsCount: number;
    }[]
  >;
  getBrandCategories(): Promise<{ category: string; count: number }[]>;

  // Campaign Invite Operations
  createCampaignInvite(invite: InsertCampaignInvite): Promise<CampaignInvite>;
  getCampaignInvite(id: number): Promise<CampaignInvite | undefined>;
  updateCampaignInvite(id: number, data: Partial<CampaignInvite>): Promise<CampaignInvite>;
  getExistingInvite(campaignId: number, creatorId: number): Promise<CampaignInvite | undefined>;
  getCreatorPendingInvites(
    creatorId: number,
  ): Promise<(CampaignInvite & { campaign: Campaign; company: User })[]>;
  getCreatorAllInvites(
    creatorId: number,
  ): Promise<(CampaignInvite & { campaign: Campaign; company: User })[]>;
  getCampaignInvites(campaignId: number): Promise<(CampaignInvite & { creator: User })[]>;
  updateInviteStatus(id: number, status: 'accepted' | 'declined'): Promise<CampaignInvite>;
  getCreatorPendingInviteCount(creatorId: number): Promise<number>;

  // Deliverable Comment Operations
  createDeliverableComment(comment: InsertDeliverableComment): Promise<DeliverableComment>;
  getDeliverable(id: number): Promise<Deliverable | undefined>;
  updateDeliverable(id: number, data: Partial<Deliverable>): Promise<Deliverable>;
  getDeliverableComments(deliverableId: number): Promise<(DeliverableComment & { user: User })[]>;

  // Campaign Template Operations
  createCampaignTemplate(template: InsertCampaignTemplate): Promise<CampaignTemplate>;
  getCampaignTemplate(id: number): Promise<CampaignTemplate | undefined>;
  getCompanyTemplates(companyId: number): Promise<CampaignTemplate[]>;
  updateCampaignTemplate(
    id: number,
    template: Partial<CampaignTemplate>,
  ): Promise<CampaignTemplate>;
  deleteCampaignTemplate(id: number): Promise<void>;

  // Admin Operations
  getAdminStats(): Promise<{
    totalUsers: number;
    totalCreators: number;
    totalCompanies: number;
    totalCampaigns: number;
    activeCampaigns: number;
    totalApplications: number;
    pendingApplications: number;
    openProblemReports: number;
  }>;
  getUsersWithFilters(filters?: {
    role?: string;
    search?: string;
    isBanned?: boolean;
    sortBy?: 'name' | 'email' | 'role' | 'createdAt' | 'isBanned';
    sortOrder?: 'asc' | 'desc';
  }): Promise<User[]>;
  updateUserBanStatus(id: number, isBanned: boolean): Promise<User>;
  getProblemReportsWithFilters(filters?: {
    status?: string;
  }): Promise<(ProblemReport & { user: User })[]>;
  updateProblemReport(
    id: number,
    updates: { status?: 'open' | 'in_progress' | 'resolved'; adminNotes?: string },
  ): Promise<ProblemReport>;
  getRecentActivity(limit?: number): Promise<
    Array<{
      type: string;
      description: string;
      createdAt: Date;
      userId?: number;
      userName?: string;
    }>
  >;
  getUserGrowthStats(
    days?: number,
  ): Promise<Array<{ date: string; creators: number; companies: number }>>;
  getAllApplications(): Promise<Application[]>;
  getAllSalesTracking(): Promise<SalesTracking[]>;
  getAllCreatorCommissions(): Promise<CreatorCommission[]>;

  // Multi-tenant Company Operations
  createCompany(company: InsertCompany): Promise<Company>;
  getCompany(id: number): Promise<Company | undefined>;
  getCompanyBySlug(slug: string): Promise<Company | undefined>;
  updateCompany(id: number, updates: Partial<Company>): Promise<Company>;
  deleteCompany(id: number): Promise<void>;
  getUserCompanies(userId: number): Promise<(CompanyMember & { company: Company })[]>;

  // Company Member Operations
  addCompanyMember(member: InsertCompanyMember): Promise<CompanyMember>;
  getCompanyMembers(companyId: number): Promise<(CompanyMember & { user: User })[]>;
  getCompanyMember(companyId: number, userId: number): Promise<CompanyMember | undefined>;
  updateCompanyMemberRole(
    companyId: number,
    userId: number,
    role: 'owner' | 'admin' | 'member',
  ): Promise<CompanyMember>;
  removeCompanyMember(companyId: number, userId: number): Promise<void>;
  isCompanyOwner(companyId: number, userId: number): Promise<boolean>;
  isCompanyAdmin(companyId: number, userId: number): Promise<boolean>;
  getCompanyOwner(companyId: number): Promise<User | undefined>;

  // Company User Invite Operations
  createCompanyUserInvite(invite: InsertCompanyUserInvite): Promise<CompanyUserInvite>;
  getCompanyUserInvite(id: number): Promise<CompanyUserInvite | undefined>;
  getCompanyUserInviteByToken(
    token: string,
  ): Promise<(CompanyUserInvite & { company: Company }) | undefined>;
  getCompanyPendingInvites(companyId: number): Promise<CompanyUserInvite[]>;
  acceptCompanyUserInvite(token: string, userId: number): Promise<CompanyUserInvite>;
  cancelCompanyUserInvite(id: number): Promise<void>;
  expireOldInvites(): Promise<void>;

  // Workflow Stage Operations
  createWorkflowStage(stage: InsertWorkflowStage): Promise<WorkflowStage>;
  getWorkflowStage(id: number): Promise<WorkflowStage | undefined>;
  getCompanyWorkflowStages(companyId: number): Promise<WorkflowStage[]>;
  updateWorkflowStage(id: number, updates: Partial<WorkflowStage>): Promise<WorkflowStage>;
  deleteWorkflowStage(id: number): Promise<void>;
  reorderWorkflowStages(companyId: number, stageIds: number[]): Promise<WorkflowStage[]>;
  createDefaultWorkflowStages(companyId: number): Promise<WorkflowStage[]>;
  getApplicationsCountByStage(stageId: number): Promise<number>;

  // Creator Profile Extra Data
  getCreatorCompletedJobs(creatorId: number): Promise<
    {
      id: number;
      campaignTitle: string;
      companyName: string;
      companyLogo: string | null;
      completedAt: string;
      payment: number | null;
    }[]
  >;
  getCreatorCommunities(creatorId: number): Promise<
    {
      id: number;
      companyId: number;
      companyName: string;
      companyLogo: string | null;
      status: string;
      joinedAt: string | null;
      tierName: string | null;
      points: number;
    }[]
  >;

  // Deep Analytics Operations
  upsertCreatorPost(post: InsertCreatorPost): Promise<CreatorPost>;
  getCreatorPosts(
    userId: number,
    platform?: 'instagram' | 'tiktok',
    limit?: number,
  ): Promise<CreatorPost[]>;
  deleteOldCreatorPosts(
    userId: number,
    platform: 'instagram' | 'tiktok',
    keepCount: number,
  ): Promise<void>;

  createAnalyticsHistoryEntry(
    entry: InsertCreatorAnalyticsHistory,
  ): Promise<CreatorAnalyticsHistory>;
  getCreatorAnalyticsHistory(
    userId: number,
    platform?: 'instagram' | 'tiktok',
    limit?: number,
  ): Promise<CreatorAnalyticsHistory[]>;

  upsertTiktokProfile(profile: InsertTikTokProfile): Promise<TikTokProfile>;
  getTiktokProfile(userId: number): Promise<TikTokProfile | undefined>;

  upsertCreatorHashtag(hashtag: InsertCreatorHashtag): Promise<CreatorHashtag>;
  getCreatorHashtags(
    userId: number,
    platform?: 'instagram' | 'tiktok',
    limit?: number,
  ): Promise<CreatorHashtag[]>;
  updateCreatorHashtagStats(
    userId: number,
    platform: 'instagram' | 'tiktok',
    hashtags: { hashtag: string; avgEngagement: string }[],
  ): Promise<void>;

  // Post AI Insights Operations
  createPostAiInsight(insight: InsertPostAiInsight): Promise<PostAiInsight>;
  getPostAiInsight(postId: number): Promise<PostAiInsight | undefined>;
  getPostAiInsightsByUser(userId: number, limit?: number): Promise<PostAiInsight[]>;
  updatePostAiInsight(
    postId: number,
    updates: Partial<InsertPostAiInsight>,
  ): Promise<PostAiInsight>;
  deletePostAiInsight(postId: number): Promise<void>;

  // Company Public Stats
  getCompanyPublicStats(companyId: number): Promise<{
    company: User;
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
    campaignsByMonth: { month: string; count: number }[];
    collaborationsByMonth: { month: string; count: number }[];
    topCreators: {
      id: number;
      name: string;
      avatar: string | null;
      collaborations: number;
      avgRating: number;
    }[];
    financialMetrics: {
      totalRevenue: number;
      totalCommissions: number;
      pendingCommissions: number;
      paidCommissions: number;
      totalSales: number;
      avgOrderValue: number;
      revenueByMonth: { month: string; revenue: number; commissions: number }[];
      salesByCreator: {
        creatorId: number;
        name: string;
        avatar: string | null;
        sales: number;
        revenue: number;
        commissions: number;
      }[];
    };
  }>;

  // Feature Flags Operations
  getFeatureFlags(): Promise<FeatureFlag[]>;
  getFeatureFlag(name: string): Promise<FeatureFlag | undefined>;
  getFeatureFlagsByModule(module: string): Promise<FeatureFlag[]>;
  isFeatureEnabled(name: string): Promise<boolean>;
  createFeatureFlag(flag: InsertFeatureFlag): Promise<FeatureFlag>;
  updateFeatureFlag(id: number, enabled: boolean): Promise<FeatureFlag>;
  initializeDefaultFeatureFlags(): Promise<void>;

  // Gamification Operations
  getCreatorLevels(): Promise<CreatorLevel[]>;
  getCreatorLevel(id: number): Promise<CreatorLevel | undefined>;
  createCreatorLevel(level: InsertCreatorLevel): Promise<CreatorLevel>;
  addCreatorPoints(entry: InsertCreatorPoints): Promise<CreatorPointsEntry>;
  getCreatorPointsHistory(creatorId: number, limit?: number): Promise<CreatorPointsEntry[]>;
  getBadges(): Promise<Badge[]>;
  getBadge(id: number): Promise<Badge | undefined>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  getCreatorBadges(creatorId: number): Promise<(CreatorBadge & { badge: Badge })[]>;
  awardBadge(creatorId: number, badgeId: number): Promise<CreatorBadge>;
  initializeDefaultLevelsAndBadges(): Promise<void>;
  recordGamificationEvent(
    companyId: number,
    creatorId: number,
    eventType: string,
    eventRefId: string,
    refType: string,
    refId: number,
    metadata?: any,
    campaignId?: number,
  ): Promise<PointsLedgerEntry | null>;
  getEffectiveScoringRules(campaignId: number, companyId: number): Promise<any>;
  getEffectiveCaps(campaignId: number, companyId: number): Promise<any>;
  getGamificationEnabledCampaigns(): Promise<{ id: number; companyId: number }[]>;
  getCreatorScore(campaignId: number, creatorId: number): Promise<{ totalPoints: number } | null>;
  recalculateCampaignRanks(campaignId: number): Promise<void>;

  // Campaign Creator Stats (Ranking per Campaign)
  getCampaignLeaderboardV1(
    campaignId: number,
  ): Promise<(CampaignCreatorStats & { creator: User })[]>;
  getCampaignCreatorStats(
    campaignId: number,
    creatorId: number,
  ): Promise<CampaignCreatorStats | undefined>;
  upsertCampaignCreatorStats(stats: InsertCampaignCreatorStats): Promise<CampaignCreatorStats>;
  updateCampaignCreatorPoints(
    campaignId: number,
    creatorId: number,
    pointsDelta: number,
  ): Promise<CampaignCreatorStats>;
  recalculateCampaignRankings(campaignId: number): Promise<void>;

  // Coupon Operations
  createCoupon(coupon: InsertCampaignCoupon): Promise<CampaignCoupon>;
  getCoupon(id: number): Promise<CampaignCoupon | undefined>;
  getCouponByCode(code: string): Promise<CampaignCoupon | undefined>;
  getCampaignCoupons(campaignId: number): Promise<(CampaignCoupon & { creator?: User })[]>;
  getBrandCoupons(
    brandId: number,
  ): Promise<(CampaignCoupon & { creatorName?: string; campaignTitle?: string })[]>;
  getCreatorCoupon(campaignId: number, creatorId: number): Promise<CampaignCoupon | undefined>;
  updateCoupon(id: number, updates: Partial<CampaignCoupon>): Promise<CampaignCoupon>;
  // Sales Tracking Operations
  createSaleWithCommission(sale: {
    companyId: number;
    campaignId?: number | null;
    creatorId: number;
    couponId?: number | null;
    couponCode?: string;
    orderId: string;
    externalOrderId?: string;
    orderValue: number;
    commission?: number;
    commissionRateBps?: number;
    platform: 'shopify' | 'woocommerce' | 'manual';
    rawJson?: Record<string, any>;
  }): Promise<SalesTracking>;
  getCampaignSales(campaignId: number): Promise<(SalesTracking & { creator: User })[]>;
  getCreatorSales(creatorId: number): Promise<(SalesTracking & { campaign: Campaign })[]>;
  updateSaleStatus(
    id: number,
    status: 'pending' | 'confirmed' | 'paid' | 'cancelled',
  ): Promise<SalesTracking>;

  // Commission Operations
  getCommission(id: number): Promise<CreatorCommission | undefined>;
  getCreatorCommissions(creatorId: number): Promise<(CreatorCommission & { campaign: Campaign })[]>;
  getCampaignCommissions(campaignId: number): Promise<(CreatorCommission & { creator: User })[]>;
  updateCommissionStatus(
    id: number,
    status: 'pending' | 'approved' | 'paid',
  ): Promise<CreatorCommission>;

  createBrandSettings(settings: InsertBrandSettings): Promise<BrandSettings>;
  getBrandSettings(id: number): Promise<BrandSettings | undefined>;
  getBrandSettingsBySlug(slug: string): Promise<BrandSettings | undefined>;
  getBrandSettingsByCompany(companyId: number): Promise<BrandSettings[]>;
  updateBrandSettings(id: number, data: Partial<BrandSettings>): Promise<BrandSettings>;
  deleteBrandSettings(id: number): Promise<void>;

  // Company Wallet Operations
  getCompanyWallet(companyId: number): Promise<CompanyWallet | undefined>;
  getOrCreateCompanyWallet(companyId: number): Promise<CompanyWallet>;
  updateCompanyWalletBalance(companyId: number, amount: number): Promise<CompanyWallet>;
  addToCompanyWallet(
    companyId: number,
    amount: number,
    description: string,
  ): Promise<WalletTransaction>;

  // Wallet Box Operations
  getWalletBoxes(companyWalletId: number): Promise<WalletBox[]>;
  createWalletBox(data: InsertWalletBox): Promise<WalletBox>;
  updateWalletBox(id: number, data: Partial<WalletBox>): Promise<WalletBox>;
  deleteWalletBox(id: number): Promise<void>;

  // Creator Balance Operations
  getCreatorBalance(userId: number): Promise<CreatorBalance | undefined>;
  getOrCreateCreatorBalance(userId: number): Promise<CreatorBalance>;
  updateCreatorBalance(userId: number, data: Partial<CreatorBalance>): Promise<CreatorBalance>;

  // Wallet Transaction Operations
  createWalletTransaction(data: InsertWalletTransaction): Promise<WalletTransaction>;
  getCompanyTransactions(
    companyWalletId: number,
    filters?: { type?: string; status?: string; userId?: number; limit?: number; offset?: number },
  ): Promise<WalletTransaction[]>;
  getCreatorTransactions(
    creatorBalanceId: number,
    limit?: number,
    offset?: number,
  ): Promise<WalletTransaction[]>;
  updateWalletTransactionStatus(id: number, status: string): Promise<WalletTransaction>;

  // Payment Batch Operations
  createPaymentBatch(data: InsertPaymentBatch): Promise<PaymentBatch>;
  getPaymentBatches(companyWalletId: number): Promise<PaymentBatch[]>;
  updatePaymentBatchStatus(id: number, status: string): Promise<PaymentBatch>;

  // Payment to Creator
  payCreator(
    companyId: number,
    creatorUserId: number,
    amount: number,
    type: string,
    description: string,
    campaignId?: number,
  ): Promise<{ companyTransaction: WalletTransaction; creatorTransaction: WalletTransaction }>;

  // Community Operations
  createCommunityInvite(data: InsertCommunityInvite): Promise<CommunityInvite>;
  getCommunityInvite(id: number): Promise<CommunityInvite | undefined>;
  getCommunityInviteByToken(token: string): Promise<CommunityInvite | undefined>;
  getCompanyCommunityInvites(companyId: number): Promise<CommunityInvite[]>;
  getCreatorPendingCommunityInvites(
    creatorId: number,
  ): Promise<(CommunityInvite & { company: Company })[]>;
  updateCommunityInvite(id: number, data: Partial<CommunityInvite>): Promise<CommunityInvite>;

  // Membership Operations
  createBrandCreatorMembership(data: InsertBrandCreatorMembership): Promise<BrandCreatorMembership>;
  getBrandCreatorMembership(id: number): Promise<BrandCreatorMembership | undefined>;
  getBrandCreatorMembershipByCreatorAndCompany(
    creatorId: number,
    companyId: number,
  ): Promise<BrandCreatorMembership | undefined>;
  getCompanyMemberships(
    companyId: number,
    filters?: { status?: string; tierId?: number; search?: string },
  ): Promise<(BrandCreatorMembership & { creator: User })[]>;
  getCreatorMemberships(
    creatorId: number,
  ): Promise<(BrandCreatorMembership & { company: Company })[]>;
  updateBrandCreatorMembership(
    id: number,
    data: Partial<BrandCreatorMembership>,
  ): Promise<BrandCreatorMembership>;
  getActiveMembershipCompanyIds(creatorId: number): Promise<number[]>;

  // Creator Discovery Profiles
  createOrUpdateDiscoveryProfile(
    data: InsertCreatorDiscoveryProfile,
  ): Promise<CreatorDiscoveryProfile>;
  getCompanyDiscoveryProfiles(
    companyId: number,
    filters?: {
      query?: string;
      connected?: 'all' | 'only' | 'none';
      niche?: string;
      minFollowers?: number;
    },
  ): Promise<
    (CreatorDiscoveryProfile & { isConnected: boolean; isMember: boolean; creatorId?: number })[]
  >;
  deleteDiscoveryProfile(id: number): Promise<void>;

  createOrGetConversation(companyId: number, creatorId: number): Promise<Conversation>;
  updateConversationStatus(conversationId: number, status: 'open' | 'resolved'): Promise<void>;
  markMessagesAsRead(conversationId: number, userId: number): Promise<void>;
  markConversationAsRead(conversationId: number, userId: number): Promise<void>;
  getConversation(id: number): Promise<Conversation | undefined>;
  getCreatorConversations(creatorId: number, typeFilter?: ConversationType): Promise<any>;
  getCompanyConversations(
    companyId: number,
    brandId: number,
    typeFilter?: ConversationType,
  ): Promise<any>;
  getConversationMessages(conversationId: number, limit?: number, offset?: number): Promise<any>;
  sendConversationMessage(
    conversationId: number,
    senderUserId: number,
    body: string,
  ): Promise<ConvMessage>;
  getUnreadConversationCount(
    userId: number,
    role: 'creator' | 'company',
    companyId?: number,
    brandId?: number,
  ): Promise<number>;
  getUnreadConversations(
    userId: number,
    role: 'creator' | 'company',
    companyId?: number,
  ): Promise<any[]>;
  getAllConversations(
    userId: number,
    role: 'creator' | 'company',
    companyId?: number,
  ): Promise<any[]>;

  // Taxonomy Operations
  getTags(type?: string): Promise<Tag[]>;
  getCreatorTags(creatorId: number): Promise<Tag[]>;
  setCreatorTags(creatorId: number, tagIds: number[]): Promise<void>;
  getBrandTags(brandId: number): Promise<Tag[]>;
  setBrandTags(brandId: number, tagIds: number[]): Promise<void>;
  getCampaignTags(campaignId: number): Promise<Tag[]>;
  setCampaignTags(campaignId: number, tagIds: number[]): Promise<void>;
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      schemaName: 'system',
      tableName: 'session',
      createTableIfMissing: process.env.SESSION_CREATE_TABLE !== 'false',
    });
  }

  // User Operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = lower(${email})`);
    return user;
  }

  async getUserByInstagram(handle: string): Promise<User | undefined> {
    const normalizedHandle = handle.replace('@', '').toLowerCase();
    const [user] = await db
      .select()
      .from(users)
      .where(sql`lower(replace(${users.instagram}, '@', '')) = ${normalizedHandle}`);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updateUser: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set(updateUser).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getCreators(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, 'creator'));
  }

  async getCreatorsForMatching(campaign: Campaign): Promise<User[]> {
    const conditions: SQL[] = [eq(users.role, 'creator')];

    // Pre-filter: must have at least niche or followers
    conditions.push(
      or(
        sql`${users.niche} IS NOT NULL AND jsonb_array_length(${users.niche}) > 0`,
        sql`${users.instagramFollowers} > 0`,
        sql`${users.tiktokFollowers} > 0`,
        sql`${users.youtubeSubscribers} > 0`,
      )!,
    );

    // If campaign has target niches, prioritize overlapping creators (but don't exclude others)
    if (campaign.targetNiche?.length) {
      const nicheValues = campaign.targetNiche.map((n) => n.toLowerCase());
      // Order by niche match first, limit to 200
      return await db
        .select()
        .from(users)
        .where(and(...conditions))
        .orderBy(
          sql`CASE WHEN EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(${users.niche}) AS n
            WHERE lower(n) = ANY(${nicheValues})
          ) THEN 0 ELSE 1 END`,
          desc(
            sql`COALESCE(${users.instagramFollowers}, 0) + COALESCE(${users.tiktokFollowers}, 0)`,
          ),
        )
        .limit(200);
    }

    return await db
      .select()
      .from(users)
      .where(and(...conditions))
      .orderBy(
        desc(sql`COALESCE(${users.instagramFollowers}, 0) + COALESCE(${users.tiktokFollowers}, 0)`),
      )
      .limit(200);
  }

  // Campaign Operations
  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db.insert(campaigns).values(insertCampaign).returning();
    return campaign;
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign;
  }

  async getCompanyCampaigns(companyId: number): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.companyId, companyId))
      .orderBy(campaigns.createdAt);
  }

  async getAllCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns).orderBy(campaigns.createdAt);
  }

  // Helper function to check if a creator is qualified for a campaign
  scoreCreatorForCampaign(
    creator: User,
    campaign: Campaign,
  ): { score: number; breakdown: Record<string, number>; reasons: string[] } {
    const breakdown: Record<string, number> = {};
    const reasons: string[] = [];
    let score = 0;

    // 1. Niche match (max 30 pts)
    if (campaign.targetNiche?.length && creator.niche?.length) {
      const matches = campaign.targetNiche.filter((cn) =>
        creator.niche!.some((crn) => crn.toLowerCase() === cn.toLowerCase()),
      );
      if (matches.length === campaign.targetNiche.length) {
        breakdown.niche = 30;
        reasons.push('Nicho compatível');
      } else if (matches.length > 0) {
        breakdown.niche = 15;
        reasons.push('Nicho parcialmente compatível');
      } else {
        breakdown.niche = 0;
      }
    } else {
      breakdown.niche = 15; // No niche filter = neutral
    }
    score += breakdown.niche;

    // 2. Location match (max 15 pts)
    if (campaign.targetRegions?.length && creator.state) {
      const creatorRegion = getRegionForState(creator.state);
      if (campaign.targetRegions.includes(creator.state)) {
        breakdown.location = 15;
        reasons.push(`Localização: ${creator.state}`);
      } else if (
        creatorRegion &&
        campaign.targetRegions.some((r) => getRegionForState(r) === creatorRegion)
      ) {
        breakdown.location = 10;
        reasons.push('Mesma região');
      } else {
        breakdown.location = 0;
      }
    } else {
      breakdown.location = 10; // No region filter = neutral
    }
    score += breakdown.location;

    // 3. Social metrics (max 25 pts)
    const platforms = campaign.targetPlatforms || [];
    let socialScore = 0;
    const socialReasons: string[] = [];

    const hasIG = platforms.length === 0 || platforms.includes('instagram');
    const hasTK = platforms.includes('tiktok');
    const hasYT = platforms.includes('youtube');

    if (hasIG && creator.instagramFollowers) {
      const f = creator.instagramFollowers;
      const engRate = parseFloat(creator.instagramEngagementRate || '0');
      if (f >= 100000) socialScore += 10;
      else if (f >= 10000) socialScore += 7;
      else if (f >= 1000) socialScore += 4;
      else socialScore += 2;
      if (engRate >= 5) socialScore += 5;
      else if (engRate >= 2) socialScore += 3;
      else if (engRate > 0) socialScore += 1;
      socialReasons.push(`IG: ${f >= 1000 ? `${(f / 1000).toFixed(0)}K` : f}`);
    }

    if (hasTK && creator.tiktokFollowers) {
      const f = creator.tiktokFollowers;
      if (f >= 100000) socialScore += 10;
      else if (f >= 10000) socialScore += 7;
      else if (f >= 1000) socialScore += 4;
      else socialScore += 2;
      socialReasons.push(`TK: ${f >= 1000 ? `${(f / 1000).toFixed(0)}K` : f}`);
    }

    if (hasYT && creator.youtubeSubscribers) {
      const f = creator.youtubeSubscribers;
      if (f >= 100000) socialScore += 10;
      else if (f >= 10000) socialScore += 7;
      else if (f >= 1000) socialScore += 4;
      else socialScore += 2;
      socialReasons.push(`YT: ${f >= 1000 ? `${(f / 1000).toFixed(0)}K` : f}`);
    }

    breakdown.social = Math.min(socialScore, 25);
    if (socialReasons.length) reasons.push(socialReasons.join(', '));
    score += breakdown.social;

    // 4. Profile completeness (max 10 pts)
    let completeness = 0;
    if (creator.avatar || creator.instagramProfilePic) completeness += 2;
    if (creator.bio) completeness += 2;
    if (creator.portfolioUrl) completeness += 2;
    if (creator.niche?.length) completeness += 2;
    if (creator.city && creator.state) completeness += 2;
    breakdown.completeness = Math.min(completeness, 10);
    score += breakdown.completeness;

    // 5. Bonus (reserved for V2 — history, past campaigns)
    breakdown.bonus = 0;

    return { score: Math.min(score, 100), breakdown, reasons };
  }

  private isCreatorQualifiedForCampaign(creator: User, campaign: Campaign): boolean {
    if (creator.role !== 'creator') {
      return false;
    }

    // Niche matching
    if (campaign.targetNiche && campaign.targetNiche.length > 0) {
      if (!creator.niche || creator.niche.length === 0) {
        return false;
      }
      // Check if there's any intersection between campaign niches and creator niches
      const hasNicheMatch = campaign.targetNiche.some((campaignNiche) =>
        creator.niche!.some(
          (creatorNiche) => creatorNiche.toLowerCase() === campaignNiche.toLowerCase(),
        ),
      );
      if (!hasNicheMatch) {
        return false;
      }
    }

    // Age range matching
    if (campaign.targetAgeRanges && campaign.targetAgeRanges.length > 0) {
      // Normalize and filter to get valid numeric ranges
      const validRanges: Array<{ min: number; max: number | undefined }> = [];
      let hasWildcard = false;

      for (const range of campaign.targetAgeRanges) {
        const normalized = range.trim().toLowerCase();

        // Check for wildcard values that mean "all ages"
        if (normalized === 'todas' || normalized === 'all' || !normalized) {
          hasWildcard = true;
          continue;
        }

        // Try to parse the range (e.g., "18-24" or "55+")
        const parts = normalized.split('-');
        const min = parseInt(parts[0].replace('+', ''));

        // Skip if min didn't parse
        if (isNaN(min)) {
          continue;
        }

        // Parse max if present
        let max: number | undefined = undefined;
        if (parts[1]) {
          const maxPart = parts[1].trim();
          if (maxPart === '+' || maxPart === '') {
            max = undefined; // "55+" means "55 and above", no upper limit
          } else {
            const parsedMax = parseInt(maxPart.replace('+', ''));
            if (isNaN(parsedMax)) {
              // Max didn't parse - skip this range entirely
              continue;
            }
            max = parsedMax;
            // Sanity check: min should be <= max
            if (min > max) {
              continue;
            }
          }
        }

        // All validations passed - add the range
        validRanges.push({ min, max });
      }

      // If wildcard found or no valid ranges remain, skip age filtering
      if (hasWildcard || validRanges.length === 0) {
        // No age filtering needed
      } else {
        // Creator must have dateOfBirth and match at least one valid range
        if (!creator.dateOfBirth) {
          return false;
        }

        const creatorAge = calculateAge(creator.dateOfBirth);
        const isInAgeRange = validRanges.some(({ min, max }) => {
          return (
            creatorAge >= min && (max === undefined || max === Infinity ? true : creatorAge <= max)
          );
        });

        if (!isInAgeRange) {
          return false;
        }
      }
    }

    // Gender matching
    if (campaign.targetGender) {
      if (creator.gender !== campaign.targetGender) {
        return false;
      }
    }

    return true;
  }

  async getQualifiedCampaignsForCreator(
    creatorId: number,
  ): Promise<(Campaign & { matchScore?: number })[]> {
    // Get creator profile
    const creator = await this.getUser(creatorId);
    if (!creator || creator.role !== 'creator') {
      return [];
    }

    // Get all open PUBLIC campaigns (private campaigns are only visible via direct link or invite)
    const allCampaigns = await db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.status, 'open'), eq(campaigns.visibility, 'public')))
      .orderBy(campaigns.createdAt);

    // Filter and score campaigns
    return allCampaigns
      .filter((campaign) => this.isCreatorQualifiedForCampaign(creator, campaign))
      .map((campaign) => {
        const { score } = this.scoreCreatorForCampaign(creator, campaign);
        return { ...campaign, matchScore: score };
      })
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }

  async getQualifiedCreatorsForCampaign(campaign: Campaign): Promise<User[]> {
    // Only notify for open PUBLIC campaigns (private campaigns don't send broadcast notifications)
    if (campaign.status !== 'open' || campaign.visibility === 'private') {
      return [];
    }

    // Get all creators
    const allCreators = await this.getCreators();

    // Filter creators that are qualified for this campaign
    return allCreators.filter((creator) => this.isCreatorQualifiedForCampaign(creator, campaign));
  }

  async updateCampaign(id: number, data: Partial<Campaign>): Promise<Campaign> {
    const [campaign] = await db.update(campaigns).set(data).where(eq(campaigns.id, id)).returning();
    return campaign;
  }

  async updateCampaignStatus(id: number, status: 'open' | 'closed'): Promise<Campaign> {
    const [campaign] = await db
      .update(campaigns)
      .set({ status })
      .where(eq(campaigns.id, id))
      .returning();
    return campaign;
  }

  async deleteCampaign(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      const campaignApplications = await tx
        .select()
        .from(applications)
        .where(eq(applications.campaignId, id));
      const applicationIds = campaignApplications.map((app) => app.id);

      if (applicationIds.length > 0) {
        await tx
          .delete(deliverableComments)
          .where(
            inArray(
              deliverableComments.deliverableId,
              tx
                .select({ id: deliverables.id })
                .from(deliverables)
                .where(inArray(deliverables.applicationId, applicationIds)),
            ),
          );

        await tx.delete(deliverables).where(inArray(deliverables.applicationId, applicationIds));
        await tx.delete(applications).where(eq(applications.campaignId, id));
      }

      await tx.delete(notifications).where(like(notifications.actionUrl, `%/campaign/${id}%`));

      await tx.delete(campaigns).where(eq(campaigns.id, id));
    });
  }

  // Application Operations
  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const [application] = await db.insert(applications).values(insertApplication).returning();
    return application;
  }

  async getApplication(id: number): Promise<Application | undefined> {
    const [application] = await db.select().from(applications).where(eq(applications.id, id));
    return application;
  }

  async getCampaignApplications(campaignId: number): Promise<Application[]> {
    return await db.query.applications.findMany({
      where: eq(applications.campaignId, campaignId),
      with: {
        creator: true,
        deliverables: true,
      },
    });
  }

  async getCompanyApplications(companyId: number): Promise<Application[]> {
    const myCampaigns = await this.getCompanyCampaigns(companyId);
    const campaignIds = myCampaigns.map((c) => c.id);

    if (campaignIds.length === 0) {
      return [];
    }

    return await db.query.applications.findMany({
      where: inArray(applications.campaignId, campaignIds),
      with: {
        creator: true,
        campaign: true,
      },
    });
  }

  async getCreatorApplications(creatorId: number): Promise<Application[]> {
    return await db.query.applications.findMany({
      where: eq(applications.creatorId, creatorId),
      with: {
        campaign: true,
      },
    });
  }

  async updateApplicationStatus(id: number, status: 'accepted' | 'rejected'): Promise<Application> {
    const updateData: any = { status };
    if (status === 'accepted') {
      updateData.workflowStatus = 'aceito';
    }
    const [application] = await db
      .update(applications)
      .set(updateData)
      .where(eq(applications.id, id))
      .returning();
    return application;
  }

  async getExistingApplication(
    campaignId: number,
    creatorId: number,
  ): Promise<Application | undefined> {
    const [application] = await db
      .select()
      .from(applications)
      .where(and(eq(applications.campaignId, campaignId), eq(applications.creatorId, creatorId)));
    return application;
  }

  async deleteApplication(id: number): Promise<void> {
    await db.delete(applications).where(eq(applications.id, id));
  }

  async getCreatorAcceptedApplications(creatorId: number): Promise<Application[]> {
    return await db.query.applications.findMany({
      where: and(eq(applications.creatorId, creatorId), eq(applications.status, 'accepted')),
      with: {
        campaign: true,
        deliverables: true,
      },
    });
  }

  async updateApplicationWorkflowStatus(id: number, workflowStatus: string): Promise<Application> {
    const [application] = await db
      .update(applications)
      .set({ workflowStatus: workflowStatus as any })
      .where(eq(applications.id, id))
      .returning();
    return application;
  }

  async updateApplicationSeeding(
    id: number,
    seedingStatus: 'not_required' | 'pending' | 'sent' | 'received',
    trackingCode?: string,
    notes?: string,
  ): Promise<Application> {
    const updates: any = { seedingStatus };
    if (seedingStatus === 'sent') {
      updates.seedingSentAt = new Date();
    } else if (seedingStatus === 'received') {
      updates.seedingReceivedAt = new Date();
    }
    if (trackingCode !== undefined) updates.seedingTrackingCode = trackingCode;
    if (notes !== undefined) updates.seedingNotes = notes;

    const [application] = await db
      .update(applications)
      .set(updates)
      .where(eq(applications.id, id))
      .returning();
    return application;
  }

  async updateApplicationCreatorWorkflowStatus(
    id: number,
    creatorWorkflowStatus: string,
  ): Promise<Application> {
    const [application] = await db
      .update(applications)
      .set({ creatorWorkflowStatus: creatorWorkflowStatus as any })
      .where(eq(applications.id, id))
      .returning();
    return application;
  }

  // Campaign Briefing Operations
  async updateCampaignBriefing(
    id: number,
    briefingText: string | null,
    briefingMaterials: string[] | null,
  ): Promise<Campaign> {
    const [campaign] = await db
      .update(campaigns)
      .set({ briefingText, briefingMaterials })
      .where(eq(campaigns.id, id))
      .returning();
    return campaign;
  }

  // Deliverable Operations
  async createDeliverable(insertDeliverable: InsertDeliverable): Promise<Deliverable> {
    const [deliverable] = await db.insert(deliverables).values(insertDeliverable).returning();
    return deliverable;
  }

  async getApplicationDeliverables(applicationId: number): Promise<Deliverable[]> {
    return await db
      .select()
      .from(deliverables)
      .where(eq(deliverables.applicationId, applicationId))
      .orderBy(deliverables.uploadedAt);
  }

  async deleteDeliverable(id: number): Promise<void> {
    await db.delete(deliverables).where(eq(deliverables.id, id));
  }

  // Notification Operations
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(insertNotification).returning();
    return notification;
  }

  async getUserNotifications(userId: number, limit: number = 20): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(notifications.createdAt)
      .limit(limit);
  }

  async getUnreadNotifications(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
      .orderBy(notifications.createdAt);
  }

  async getNotificationByIdForUser(id: number, userId: number): Promise<Notification | null> {
    const [notification] = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .limit(1);
    return notification || null;
  }

  async markNotificationAsRead(id: number, userId: number): Promise<Notification | null> {
    const [notification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();
    return notification || null;
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  }

  async getUnreadCount(userId: number): Promise<number> {
    const result = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result.length;
  }

  // Problem Report Operations
  async createProblemReport(insertReport: InsertProblemReport): Promise<ProblemReport> {
    const [report] = await db.insert(problemReports).values(insertReport).returning();
    return report;
  }

  async getProblemReports(): Promise<ProblemReport[]> {
    return await db.select().from(problemReports).orderBy(problemReports.createdAt);
  }

  async updateProblemReportStatus(id: number, status: 'open' | 'resolved'): Promise<ProblemReport> {
    const [report] = await db
      .update(problemReports)
      .set({ status })
      .where(eq(problemReports.id, id))
      .returning();
    return report;
  }

  // Favorite Creator Operations
  async addFavoriteCreator(companyId: number, creatorId: number): Promise<FavoriteCreator> {
    const [favorite] = await db
      .insert(favoriteCreators)
      .values({ companyId, creatorId })
      .returning();
    return favorite;
  }

  async removeFavoriteCreator(companyId: number, creatorId: number): Promise<void> {
    await db
      .delete(favoriteCreators)
      .where(
        and(eq(favoriteCreators.companyId, companyId), eq(favoriteCreators.creatorId, creatorId)),
      );
  }

  async getCompanyFavoriteCreators(companyId: number): Promise<number[]> {
    const favorites = await db
      .select()
      .from(favoriteCreators)
      .where(eq(favoriteCreators.companyId, companyId));
    return favorites.map((f) => f.creatorId);
  }

  async isFavorite(companyId: number, creatorId: number): Promise<boolean> {
    const [favorite] = await db
      .select()
      .from(favoriteCreators)
      .where(
        and(eq(favoriteCreators.companyId, companyId), eq(favoriteCreators.creatorId, creatorId)),
      )
      .limit(1);
    return !!favorite;
  }

  // Favorite Company Operations (for creators)
  async addFavoriteCompany(creatorId: number, companyId: number): Promise<FavoriteCompany> {
    const [favorite] = await db
      .insert(favoriteCompanies)
      .values({ creatorId, companyId })
      .returning();
    return favorite;
  }

  async removeFavoriteCompany(creatorId: number, companyId: number): Promise<void> {
    await db
      .delete(favoriteCompanies)
      .where(
        and(eq(favoriteCompanies.creatorId, creatorId), eq(favoriteCompanies.companyId, companyId)),
      );
  }

  async getCreatorFavoriteCompanies(
    creatorId: number,
  ): Promise<(FavoriteCompany & { company: Company })[]> {
    const favorites = await db
      .select()
      .from(favoriteCompanies)
      .innerJoin(companies, eq(favoriteCompanies.companyId, companies.id))
      .where(eq(favoriteCompanies.creatorId, creatorId))
      .orderBy(desc(favoriteCompanies.createdAt));

    return favorites.map((f) => ({
      ...f.favorite_companies,
      company: f.companies,
    }));
  }

  async isCompanyFavorite(creatorId: number, companyId: number): Promise<boolean> {
    const [favorite] = await db
      .select()
      .from(favoriteCompanies)
      .where(
        and(eq(favoriteCompanies.creatorId, creatorId), eq(favoriteCompanies.companyId, companyId)),
      )
      .limit(1);
    return !!favorite;
  }

  async getCompanyFavoriteCount(companyId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(favoriteCompanies)
      .where(eq(favoriteCompanies.companyId, companyId));
    return result[0]?.count ?? 0;
  }

  async getCreatorsWhoFavoritedCompany(companyId: number): Promise<User[]> {
    const results = await db
      .select({ user: users })
      .from(favoriteCompanies)
      .innerJoin(users, eq(favoriteCompanies.creatorId, users.id))
      .where(eq(favoriteCompanies.companyId, companyId));
    return results.map((r) => r.user);
  }

  async getCompanyRecentPartnerships(
    companyId: number,
    limit: number = 12,
  ): Promise<
    {
      id: number;
      campaignTitle: string;
      creatorName: string;
      creatorAvatar: string | null;
      creatorCity: string | null;
      creatorNiche: string | null;
      thumbnail: string | null;
      hasVideo: boolean;
      completedAt: string;
    }[]
  > {
    const result = await db.execute(sql`
      SELECT 
        a.id,
        camp.title as "campaignTitle",
        u.name as "creatorName",
        u.avatar as "creatorAvatar",
        u.city as "creatorCity",
        u.target_niche as "creatorNiche",
        (
          SELECT d.file_url FROM deliverables d
          WHERE d.application_id = a.id
          ORDER BY d.created_at DESC LIMIT 1
        ) as "thumbnail",
        EXISTS(
          SELECT 1 FROM deliverables d
          WHERE d.application_id = a.id
          AND (d.file_url LIKE '%.mp4' OR d.file_url LIKE '%.mov' OR d.file_url LIKE '%.webm')
        ) as "hasVideo",
        COALESCE(a.updated_at, a.created_at)::text as "completedAt"
      FROM applications a
      JOIN campaigns camp ON camp.id = a.campaign_id
      JOIN users u ON u.id = a.creator_id
      WHERE camp.company_id = ${companyId}
        AND a.status = 'accepted'
        AND a.workflow_status IN ('entregue', 'concluido')
      ORDER BY a.updated_at DESC NULLS LAST
      LIMIT ${limit}
    `);

    return (result.rows || []) as any[];
  }

  async getCompanyPublicDeliverables(
    companyId: number,
    limit: number = 20,
  ): Promise<
    {
      id: number;
      fileUrl: string;
      fileType: string | null;
      deliverableType: string | null;
      description: string | null;
      uploadedAt: string;
      campaignTitle: string;
      creatorName: string;
      creatorAvatar: string | null;
    }[]
  > {
    const result = await db.execute(sql`
      SELECT
        d.id,
        d.file_url as "fileUrl",
        d.file_type as "fileType",
        d.deliverable_type as "deliverableType",
        d.description,
        d.uploaded_at::text as "uploadedAt",
        camp.title as "campaignTitle",
        u.name as "creatorName",
        u.avatar as "creatorAvatar"
      FROM deliverables d
      JOIN applications a ON a.id = d.application_id
      JOIN campaigns camp ON camp.id = a.campaign_id
      JOIN users u ON u.id = a.creator_id
      WHERE camp.company_id = ${companyId}
        AND a.status = 'accepted'
        AND a.workflow_status IN ('entregue', 'concluido')
        AND d.file_url IS NOT NULL
      ORDER BY d.uploaded_at DESC NULLS LAST
      LIMIT ${limit}
    `);

    return (result.rows || []) as any[];
  }

  async getTrendingCompanies(limit: number = 5): Promise<
    {
      id: number;
      name: string;
      tradeName: string | null;
      logo: string | null;
      description: string | null;
      avgRating: number;
      totalReviews: number;
      activeCampaigns: number;
      favoriteCount: number;
    }[]
  > {
    const result = await db.execute(sql`
      WITH company_stats AS (
        SELECT 
          c.id,
          c.name,
          c.trade_name as "tradeName",
          c.logo,
          c.description,
          0::float as "avgRating",
          0::int as "totalReviews",
          COUNT(DISTINCT camp.id) FILTER (WHERE camp.status = 'open')::int as "activeCampaigns",
          COUNT(DISTINCT fc.id)::int as "favoriteCount"
        FROM companies c
        LEFT JOIN campaigns camp ON camp.company_id = c.id
        LEFT JOIN applications a ON a.campaign_id = camp.id AND a.status = 'accepted'
        
        LEFT JOIN favorite_companies fc ON fc.company_id = c.id
        GROUP BY c.id, c.name, c.trade_name, c.logo, c.description
        HAVING COUNT(DISTINCT camp.id) > 0
      )
      SELECT * FROM company_stats
      WHERE "avgRating" > 0 OR "activeCampaigns" > 0
      ORDER BY "avgRating" DESC, "favoriteCount" DESC, "activeCampaigns" DESC
      LIMIT ${limit}
    `);

    return (result.rows || []) as any[];
  }

  // Discovery Operations
  async getDiscoverableBrands(options: {
    category?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<
    {
      id: number;
      name: string;
      tradeName: string | null;
      slug: string | null;
      logo: string | null;
      coverPhoto: string | null;
      description: string | null;
      category: string | null;
      tagline: string | null;
      isFeatured: boolean;
      openCampaignsCount: number;
    }[]
  > {
    const { category, featured, limit = 20, offset = 0 } = options;

    let query = sql`
      SELECT 
        c.id,
        c.name,
        c.trade_name as "tradeName",
        c.slug,
        c.logo,
        c.cover_photo as "coverPhoto",
        c.description,
        c.category,
        c.tagline,
        c.is_featured as "isFeatured",
        COUNT(DISTINCT camp.id) FILTER (WHERE camp.status = 'open' AND camp.visibility = 'public')::int as "openCampaignsCount"
      FROM companies c
      LEFT JOIN campaigns camp ON camp.company_id = c.id
      WHERE c.is_discoverable = true
    `;

    if (category) {
      query = sql`${query} AND c.category = ${category}`;
    }

    if (featured) {
      query = sql`${query} AND c.is_featured = true`;
    }

    query = sql`${query} 
      GROUP BY c.id
      ORDER BY c.is_featured DESC, c.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const result = await db.execute(query);
    return (result.rows || []) as any[];
  }

  async getFeaturedBrands(limit: number = 8): Promise<
    {
      id: number;
      name: string;
      tradeName: string | null;
      slug: string | null;
      logo: string | null;
      coverPhoto: string | null;
      description: string | null;
      category: string | null;
      tagline: string | null;
      isFeatured: boolean;
      openCampaignsCount: number;
    }[]
  > {
    return this.getDiscoverableBrands({ featured: true, limit });
  }

  async getBrandCategories(): Promise<{ category: string; count: number }[]> {
    const result = await db.execute(sql`
      SELECT 
        c.category,
        COUNT(*)::int as count
      FROM companies c
      WHERE c.is_discoverable = true AND c.category IS NOT NULL
      GROUP BY c.category
      ORDER BY count DESC
    `);
    return (result.rows || []) as any[];
  }

  // Campaign Invite Operations
  async createCampaignInvite(invite: InsertCampaignInvite): Promise<CampaignInvite> {
    const [created] = await db.insert(campaignInvites).values(invite).returning();
    return created;
  }

  async getCampaignInvite(id: number): Promise<CampaignInvite | undefined> {
    const [invite] = await db.select().from(campaignInvites).where(eq(campaignInvites.id, id));
    return invite;
  }

  async updateCampaignInvite(id: number, data: Partial<CampaignInvite>): Promise<CampaignInvite> {
    const [updated] = await db
      .update(campaignInvites)
      .set(data)
      .where(eq(campaignInvites.id, id))
      .returning();
    return updated;
  }

  async getExistingInvite(
    campaignId: number,
    creatorId: number,
  ): Promise<CampaignInvite | undefined> {
    const [invite] = await db
      .select()
      .from(campaignInvites)
      .where(
        and(eq(campaignInvites.campaignId, campaignId), eq(campaignInvites.creatorId, creatorId)),
      );
    return invite;
  }

  async getCreatorPendingInvites(
    creatorId: number,
  ): Promise<(CampaignInvite & { campaign: Campaign; company: User })[]> {
    const results = await db.execute(sql`
      SELECT 
        ci.*,
        c.id as campaign_id,
        c.title as campaign_title,
        c.description as campaign_description,
        c.requirements as campaign_requirements,
        c.budget as campaign_budget,
        c.deadline as campaign_deadline,
        c.creators_needed as campaign_creators_needed,
        c.status as campaign_status,
        c.target_niche as campaign_target_niche,
        c.target_age_ranges as campaign_target_age_ranges,
        c.target_regions as campaign_target_regions,
        c.target_gender as campaign_target_gender,
        c.visibility as campaign_visibility,
        c.briefing_text as campaign_briefing_text,
        c.briefing_materials as campaign_briefing_materials,
        c.deliverables as campaign_deliverables,
        c.min_tier_id as campaign_min_tier_id,
        c.created_at as campaign_created_at,
        comp.id as company_id,
        comp.name as company_name,
        comp.logo as company_logo
      FROM campaign_invites ci
      JOIN campaigns c ON ci.campaign_id = c.id
      JOIN companies comp ON ci.company_id = comp.id
      WHERE ci.creator_id = ${creatorId}
        AND ci.status = 'pending'
        AND c.status = 'open'
      ORDER BY ci.created_at DESC
    `);

    return results.rows.map((row: any) => ({
      id: row.id,
      campaignId: row.campaign_id,
      companyId: row.company_id,
      creatorId: row.creator_id,
      status: row.status,
      createdAt: row.created_at,
      respondedAt: row.responded_at,
      campaign: {
        id: row.campaign_id,
        companyId: row.company_id,
        title: row.campaign_title,
        description: row.campaign_description,
        requirements: row.campaign_requirements,
        budget: row.campaign_budget,
        deadline: row.campaign_deadline,
        creatorsNeeded: row.campaign_creators_needed,
        status: row.campaign_status,
        targetNiche: row.campaign_target_niche,
        targetAgeRanges: row.campaign_target_age_ranges,
        targetRegions: row.campaign_target_regions,
        targetGender: row.campaign_target_gender,
        visibility: row.campaign_visibility,
        briefingText: row.campaign_briefing_text,
        briefingMaterials: row.campaign_briefing_materials,
        deliverables: row.campaign_deliverables,
        minTierId: row.campaign_min_tier_id,
        createdAt: row.campaign_created_at,
      } as any,
      company: {
        id: row.company_id,
        name: row.company_name,
        avatar: row.company_logo,
        companyName: row.company_name,
      } as User,
    }));
  }

  async getCreatorAllInvites(
    creatorId: number,
  ): Promise<(CampaignInvite & { campaign: Campaign; company: User })[]> {
    const results = await db.execute(sql`
      SELECT 
        ci.*,
        c.id as campaign_id,
        c.title as campaign_title,
        c.description as campaign_description,
        c.requirements as campaign_requirements,
        c.budget as campaign_budget,
        c.deadline as campaign_deadline,
        c.creators_needed as campaign_creators_needed,
        c.status as campaign_status,
        c.target_niche as campaign_target_niche,
        c.target_age_ranges as campaign_target_age_ranges,
        c.target_regions as campaign_target_regions,
        c.target_gender as campaign_target_gender,
        c.visibility as campaign_visibility,
        c.briefing_text as campaign_briefing_text,
        c.briefing_materials as campaign_briefing_materials,
        c.deliverables as campaign_deliverables,
        c.min_tier_id as campaign_min_tier_id,
        c.created_at as campaign_created_at,
        comp.id as company_id,
        comp.name as company_name,
        comp.logo as company_logo
      FROM campaign_invites ci
      JOIN campaigns c ON ci.campaign_id = c.id
      JOIN companies comp ON ci.company_id = comp.id
      WHERE ci.creator_id = ${creatorId}
      ORDER BY ci.created_at DESC
    `);

    return results.rows.map((row: any) => ({
      id: row.id,
      campaignId: row.campaign_id,
      companyId: row.company_id,
      creatorId: row.creator_id,
      status: row.status,
      createdAt: row.created_at,
      respondedAt: row.responded_at,
      campaign: {
        id: row.campaign_id,
        companyId: row.company_id,
        title: row.campaign_title,
        description: row.campaign_description,
        requirements: row.campaign_requirements,
        budget: row.campaign_budget,
        deadline: row.campaign_deadline,
        creatorsNeeded: row.campaign_creators_needed,
        status: row.campaign_status,
        targetNiche: row.campaign_target_niche,
        targetAgeRanges: row.campaign_target_age_ranges,
        targetRegions: row.campaign_target_regions,
        targetGender: row.campaign_target_gender,
        visibility: row.campaign_visibility,
        briefingText: row.campaign_briefing_text,
        briefingMaterials: row.campaign_briefing_materials,
        deliverables: row.campaign_deliverables,
        minTierId: row.campaign_min_tier_id,
        createdAt: row.campaign_created_at,
      } as any,
      company: {
        id: row.company_id,
        name: row.company_name,
        avatar: row.company_logo,
        companyName: row.company_name,
      } as User,
    }));
  }

  async getCampaignInvites(campaignId: number): Promise<(CampaignInvite & { creator: User })[]> {
    const results = await db.execute(sql`
      SELECT 
        ci.*,
        u.id as creator_user_id,
        u.name as creator_name,
        u.email as creator_email,
        u.avatar as creator_avatar,
        u.bio as creator_bio,
        u.niche as creator_niche,
        u.instagram as creator_instagram,
        u.instagram_followers as creator_instagram_followers
      FROM campaign_invites ci
      JOIN users u ON ci.creator_id = u.id
      WHERE ci.campaign_id = ${campaignId}
      ORDER BY ci.created_at DESC
    `);

    return results.rows.map((row: any) => ({
      id: row.id,
      campaignId: row.campaign_id,
      companyId: row.company_id,
      creatorId: row.creator_id,
      status: row.status,
      createdAt: row.created_at,
      respondedAt: row.responded_at,
      creator: {
        id: row.creator_user_id,
        name: row.creator_name,
        email: row.creator_email,
        avatar: row.creator_avatar,
        bio: row.creator_bio,
        niche: row.creator_niche,
        instagram: row.creator_instagram,
        instagramFollowers: row.creator_instagram_followers,
      } as User,
    }));
  }

  async updateInviteStatus(id: number, status: 'accepted' | 'declined'): Promise<CampaignInvite> {
    const [invite] = await db
      .update(campaignInvites)
      .set({ status, respondedAt: new Date() })
      .where(eq(campaignInvites.id, id))
      .returning();
    return invite;
  }

  async getCreatorPendingInviteCount(creatorId: number): Promise<number> {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM campaign_invites ci
      JOIN campaigns c ON ci.campaign_id = c.id
      WHERE ci.creator_id = ${creatorId}
        AND ci.status = 'pending'
        AND c.status = 'open'
    `);
    return parseInt(String(result.rows[0]?.count ?? '0'));
  }

  // Deliverable Comment Operations
  async createDeliverableComment(
    insertComment: InsertDeliverableComment,
  ): Promise<DeliverableComment> {
    const [comment] = await db.insert(deliverableComments).values(insertComment).returning();
    return comment;
  }

  async getDeliverable(id: number): Promise<Deliverable | undefined> {
    const [deliverable] = await db.select().from(deliverables).where(eq(deliverables.id, id));
    return deliverable;
  }

  async updateDeliverable(id: number, data: Partial<Deliverable>): Promise<Deliverable> {
    const [updated] = await db
      .update(deliverables)
      .set(data)
      .where(eq(deliverables.id, id))
      .returning();
    return updated;
  }

  async getDeliverableComments(
    deliverableId: number,
  ): Promise<(DeliverableComment & { user: User })[]> {
    const results = await db
      .select({
        comment: deliverableComments,
        user: users,
      })
      .from(deliverableComments)
      .leftJoin(users, eq(deliverableComments.userId, users.id))
      .where(eq(deliverableComments.deliverableId, deliverableId))
      .orderBy(deliverableComments.createdAt);

    return results.map((r) => ({ ...r.comment, user: r.user! }));
  }

  // Admin Operations
  async getAdminStats() {
    // Use count aggregations instead of fetching all rows
    const [usersStats, campaignsStats, appsStats, reportsStats] = await Promise.all([
      db
        .select({
          total: sql<number>`cast(count(*) as int)`,
          creators: sql<number>`cast(count(*) filter (where role = 'creator') as int)`,
          companies: sql<number>`cast(count(*) filter (where role = 'company') as int)`,
        })
        .from(users),
      db
        .select({
          total: sql<number>`cast(count(*) as int)`,
          active: sql<number>`cast(count(*) filter (where status = 'open') as int)`,
        })
        .from(campaigns),
      db
        .select({
          total: sql<number>`cast(count(*) as int)`,
          pending: sql<number>`cast(count(*) filter (where status = 'pending') as int)`,
        })
        .from(applications),
      db
        .select({
          open: sql<number>`cast(count(*) filter (where status = 'open') as int)`,
        })
        .from(problemReports),
    ]);

    return {
      totalUsers: usersStats[0].total,
      totalCreators: usersStats[0].creators,
      totalCompanies: usersStats[0].companies,
      totalCampaigns: campaignsStats[0].total,
      activeCampaigns: campaignsStats[0].active,
      totalApplications: appsStats[0].total,
      pendingApplications: appsStats[0].pending,
      openProblemReports: reportsStats[0].open,
    };
  }

  async getUsersWithFilters(filters?: {
    role?: string;
    search?: string;
    isBanned?: boolean;
    sortBy?: 'name' | 'email' | 'role' | 'createdAt' | 'isBanned';
    sortOrder?: 'asc' | 'desc';
  }): Promise<User[]> {
    const conditions = [];

    if (filters?.role && filters.role !== 'all') {
      conditions.push(eq(users.role, filters.role as any));
    }

    if (filters?.search) {
      conditions.push(
        or(like(users.name, `%${filters.search}%`), like(users.email, `%${filters.search}%`)),
      );
    }

    if (filters?.isBanned !== undefined) {
      conditions.push(eq(users.isBanned, filters.isBanned));
    }

    let query =
      conditions.length > 0
        ? db
            .select()
            .from(users)
            .where(and(...conditions))
        : db.select().from(users);

    // Apply sorting with safe defaults
    const sortBy = filters?.sortBy || 'createdAt';
    const sortOrder = filters?.sortOrder || 'desc';

    const columnMap = {
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      isBanned: users.isBanned,
    };

    const sortColumn = columnMap[sortBy as keyof typeof columnMap] ?? users.createdAt;

    query = query.orderBy(sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn)) as any;

    return await query;
  }

  async updateUserBanStatus(id: number, isBanned: boolean): Promise<User> {
    const [user] = await db.update(users).set({ isBanned }).where(eq(users.id, id)).returning();
    return user;
  }

  async getProblemReportsWithFilters(filters?: { status?: string }) {
    const conditions = [];

    if (filters?.status && filters.status !== 'all') {
      conditions.push(eq(problemReports.status, filters.status as any));
    }

    const query =
      conditions.length > 0
        ? db
            .select({
              report: problemReports,
              user: users,
            })
            .from(problemReports)
            .leftJoin(users, eq(problemReports.userId, users.id))
            .where(and(...conditions))
            .orderBy(desc(problemReports.createdAt))
        : db
            .select({
              report: problemReports,
              user: users,
            })
            .from(problemReports)
            .leftJoin(users, eq(problemReports.userId, users.id))
            .orderBy(desc(problemReports.createdAt));

    const results = await query;
    return results.map((r) => ({ ...r.report, user: r.user! }));
  }

  async updateProblemReport(
    id: number,
    updates: { status?: 'open' | 'in_progress' | 'resolved'; adminNotes?: string },
  ): Promise<ProblemReport> {
    const updateData: any = { updatedAt: new Date() };
    if (updates.status) updateData.status = updates.status;
    if (updates.adminNotes !== undefined) updateData.adminNotes = updates.adminNotes;

    const [report] = await db
      .update(problemReports)
      .set(updateData)
      .where(eq(problemReports.id, id))
      .returning();
    return report;
  }

  async getRecentActivity(limit: number = 10) {
    // Fetch applications with creator and campaign data using joins
    const recentApplicationsData = await db
      .select({
        type: sql<string>`'application'`,
        createdAt: applications.appliedAt,
        creatorName: users.name,
        campaignTitle: campaigns.title,
        userId: users.id,
      })
      .from(applications)
      .leftJoin(users, eq(applications.creatorId, users.id))
      .leftJoin(campaigns, eq(applications.campaignId, campaigns.id))
      .orderBy(desc(applications.appliedAt))
      .limit(limit);

    // Fetch recent campaigns with company data using joins
    const recentCampaignsData = await db
      .select({
        type: sql<string>`'campaign'`,
        createdAt: campaigns.createdAt,
        companyName: users.name,
        title: campaigns.title,
        userId: users.id,
      })
      .from(campaigns)
      .leftJoin(users, eq(campaigns.companyId, users.id))
      .orderBy(desc(campaigns.createdAt))
      .limit(limit);

    const activity: Array<{
      type: string;
      description: string;
      createdAt: Date;
      userId?: number;
      userName?: string;
    }> = [];

    // Map applications
    for (const app of recentApplicationsData) {
      const creatorName = app.creatorName || 'Usuário desconhecido';
      const campaignTitle = app.campaignTitle || 'Campanha';
      activity.push({
        type: 'application',
        description: `${creatorName} aplicou para "${campaignTitle}"`,
        createdAt: app.createdAt || new Date(),
        userId: app.userId || undefined,
        userName: creatorName,
      });
    }

    // Map campaigns
    for (const camp of recentCampaignsData) {
      const companyName = camp.companyName || 'Empresa';
      const title = camp.title || 'Campanha';
      activity.push({
        type: 'campaign',
        description: `${companyName} criou "${title}"`,
        createdAt: camp.createdAt || new Date(),
        userId: camp.userId || undefined,
        userName: companyName,
      });
    }

    return activity.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
  }

  async getUserGrowthStats(days: number = 30) {
    // Gera array de datas dos últimos N dias
    const dateMap = new Map<string, { creators: number; companies: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, { creators: 0, companies: 0 });
    }

    // Busca todos os usuários criados nos últimos N dias
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const recentUsers = await db
      .select()
      .from(users)
      .where(sql`${users.createdAt} >= ${startDate}`);

    // Conta usuários por dia e role
    for (const user of recentUsers) {
      if (!user.createdAt) continue;
      const dateStr = new Date(user.createdAt).toISOString().split('T')[0];
      if (dateMap.has(dateStr)) {
        const counts = dateMap.get(dateStr)!;
        if (user.role === 'creator') {
          counts.creators++;
        } else if (user.role === 'company') {
          counts.companies++;
        }
      }
    }

    // Converte para array ordenado
    return Array.from(dateMap.entries())
      .map(([date, counts]) => ({
        date,
        creators: counts.creators,
        companies: counts.companies,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getAllApplications(): Promise<Application[]> {
    return await db.select().from(applications);
  }

  async getAllSalesTracking(): Promise<SalesTracking[]> {
    return await db.select().from(salesTracking);
  }

  async getAllCreatorCommissions(): Promise<CreatorCommission[]> {
    return await db.select().from(creatorCommissions);
  }

  async createCampaignTemplate(template: InsertCampaignTemplate): Promise<CampaignTemplate> {
    const [newTemplate] = await db.insert(campaignTemplates).values(template).returning();
    return newTemplate;
  }

  async getCampaignTemplate(id: number): Promise<CampaignTemplate | undefined> {
    const [template] = await db
      .select()
      .from(campaignTemplates)
      .where(eq(campaignTemplates.id, id));
    return template;
  }

  async getCompanyTemplates(companyId: number): Promise<CampaignTemplate[]> {
    return await db
      .select()
      .from(campaignTemplates)
      .where(eq(campaignTemplates.companyId, companyId))
      .orderBy(desc(campaignTemplates.updatedAt));
  }

  async updateCampaignTemplate(
    id: number,
    template: Partial<CampaignTemplate>,
  ): Promise<CampaignTemplate> {
    const [updatedTemplate] = await db
      .update(campaignTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(campaignTemplates.id, id))
      .returning();
    return updatedTemplate;
  }

  async deleteCampaignTemplate(id: number): Promise<void> {
    await db.delete(campaignTemplates).where(eq(campaignTemplates.id, id));
  }

  // Multi-tenant Company Operations
  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db.insert(companies).values(company).returning();
    return newCompany;
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async getCompanyBySlug(slug: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.slug, slug));
    return company;
  }

  async updateCompany(id: number, updates: Partial<Company>): Promise<Company> {
    const [updatedCompany] = await db
      .update(companies)
      .set(updates)
      .where(eq(companies.id, id))
      .returning();
    return updatedCompany;
  }

  async deleteCompany(id: number): Promise<void> {
    await db.delete(companyMembers).where(eq(companyMembers.companyId, id));
    await db.delete(companyUserInvites).where(eq(companyUserInvites.companyId, id));
    await db.delete(companies).where(eq(companies.id, id));
  }

  async getUserCompanies(userId: number): Promise<(CompanyMember & { company: Company })[]> {
    const memberships = await db
      .select()
      .from(companyMembers)
      .where(eq(companyMembers.userId, userId));

    const result: (CompanyMember & { company: Company })[] = [];
    for (const membership of memberships) {
      const company = await this.getCompany(membership.companyId);
      if (company) {
        result.push({ ...membership, company });
      }
    }
    return result;
  }

  // Company Member Operations
  async addCompanyMember(member: InsertCompanyMember): Promise<CompanyMember> {
    const [newMember] = await db.insert(companyMembers).values(member).returning();
    return newMember;
  }

  async getCompanyMembers(companyId: number): Promise<(CompanyMember & { user: User })[]> {
    const members = await db
      .select()
      .from(companyMembers)
      .where(eq(companyMembers.companyId, companyId));

    const result: (CompanyMember & { user: User })[] = [];
    for (const member of members) {
      const user = await this.getUser(member.userId);
      if (user) {
        result.push({ ...member, user });
      }
    }
    return result;
  }

  async getCompanyMember(companyId: number, userId: number): Promise<CompanyMember | undefined> {
    const [member] = await db
      .select()
      .from(companyMembers)
      .where(and(eq(companyMembers.companyId, companyId), eq(companyMembers.userId, userId)));
    return member;
  }

  async updateCompanyMemberRole(
    companyId: number,
    userId: number,
    role: 'owner' | 'admin' | 'member',
  ): Promise<CompanyMember> {
    const [updatedMember] = await db
      .update(companyMembers)
      .set({ role })
      .where(and(eq(companyMembers.companyId, companyId), eq(companyMembers.userId, userId)))
      .returning();
    return updatedMember;
  }

  async removeCompanyMember(companyId: number, userId: number): Promise<void> {
    await db
      .delete(companyMembers)
      .where(and(eq(companyMembers.companyId, companyId), eq(companyMembers.userId, userId)));
  }

  async isCompanyOwner(companyId: number, userId: number): Promise<boolean> {
    const member = await this.getCompanyMember(companyId, userId);
    return member?.role === 'owner';
  }

  async isCompanyAdmin(companyId: number, userId: number): Promise<boolean> {
    const member = await this.getCompanyMember(companyId, userId);
    return member?.role === 'owner' || member?.role === 'admin';
  }

  async getCompanyOwner(companyId: number): Promise<User | undefined> {
    const [member] = await db
      .select()
      .from(companyMembers)
      .where(and(eq(companyMembers.companyId, companyId), eq(companyMembers.role, 'owner')));

    if (!member) return undefined;
    return this.getUser(member.userId);
  }

  // Company User Invite Operations
  async createCompanyUserInvite(invite: InsertCompanyUserInvite): Promise<CompanyUserInvite> {
    const [newInvite] = await db.insert(companyUserInvites).values(invite).returning();
    return newInvite;
  }

  async getCompanyUserInvite(id: number): Promise<CompanyUserInvite | undefined> {
    const [invite] = await db
      .select()
      .from(companyUserInvites)
      .where(eq(companyUserInvites.id, id));
    return invite;
  }

  async getCompanyUserInviteByToken(
    token: string,
  ): Promise<(CompanyUserInvite & { company: Company }) | undefined> {
    const [invite] = await db
      .select()
      .from(companyUserInvites)
      .where(eq(companyUserInvites.token, token));

    if (!invite) return undefined;

    const company = await this.getCompany(invite.companyId);
    if (!company) return undefined;

    return { ...invite, company };
  }

  async getCompanyPendingInvites(companyId: number): Promise<CompanyUserInvite[]> {
    return await db
      .select()
      .from(companyUserInvites)
      .where(
        and(eq(companyUserInvites.companyId, companyId), eq(companyUserInvites.status, 'pending')),
      )
      .orderBy(desc(companyUserInvites.createdAt));
  }

  async acceptCompanyUserInvite(token: string, userId: number): Promise<CompanyUserInvite> {
    const [updatedInvite] = await db
      .update(companyUserInvites)
      .set({
        status: 'accepted',
        acceptedByUserId: userId,
        acceptedAt: new Date(),
      })
      .where(eq(companyUserInvites.token, token))
      .returning();
    return updatedInvite;
  }

  async cancelCompanyUserInvite(id: number): Promise<void> {
    await db
      .update(companyUserInvites)
      .set({ status: 'cancelled' })
      .where(eq(companyUserInvites.id, id));
  }

  async expireOldInvites(): Promise<void> {
    await db
      .update(companyUserInvites)
      .set({ status: 'expired' })
      .where(
        and(eq(companyUserInvites.status, 'pending'), sql`${companyUserInvites.expiresAt} < NOW()`),
      );
  }

  // Workflow Stage Operations
  async createWorkflowStage(stage: InsertWorkflowStage): Promise<WorkflowStage> {
    const [created] = await db.insert(workflowStages).values(stage).returning();
    return created;
  }

  async getWorkflowStage(id: number): Promise<WorkflowStage | undefined> {
    const [stage] = await db.select().from(workflowStages).where(eq(workflowStages.id, id));
    return stage;
  }

  async getCompanyWorkflowStages(companyId: number): Promise<WorkflowStage[]> {
    return await db
      .select()
      .from(workflowStages)
      .where(eq(workflowStages.companyId, companyId))
      .orderBy(asc(workflowStages.position));
  }

  async updateWorkflowStage(id: number, updates: Partial<WorkflowStage>): Promise<WorkflowStage> {
    const [updated] = await db
      .update(workflowStages)
      .set(updates)
      .where(eq(workflowStages.id, id))
      .returning();
    return updated;
  }

  async deleteWorkflowStage(id: number): Promise<void> {
    await db.delete(workflowStages).where(eq(workflowStages.id, id));
  }

  async reorderWorkflowStages(companyId: number, stageIds: number[]): Promise<WorkflowStage[]> {
    const updates = stageIds.map((id, index) =>
      db
        .update(workflowStages)
        .set({ position: index })
        .where(and(eq(workflowStages.id, id), eq(workflowStages.companyId, companyId))),
    );
    await Promise.all(updates);
    return this.getCompanyWorkflowStages(companyId);
  }

  async createDefaultWorkflowStages(companyId: number): Promise<WorkflowStage[]> {
    const defaultStages = [
      { name: 'Novas', color: '#22c55e', position: 0, isDefault: true },
      { name: 'Em andamento', color: '#f59e0b', position: 1, isDefault: true },
      { name: 'Concluídas', color: '#6366f1', position: 2, isDefault: true },
    ];

    const created = await Promise.all(
      defaultStages.map((stage) => this.createWorkflowStage({ ...stage, companyId })),
    );
    return created;
  }

  async getApplicationsCountByStage(stageId: number): Promise<number> {
    const stage = await this.getWorkflowStage(stageId);
    if (!stage) return 0;

    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(applications)
      .where(eq(applications.workflowStatus, stage.name));

    return result[0]?.count || 0;
  }

  async getCreatorCompletedJobs(creatorId: number): Promise<
    {
      id: number;
      campaignTitle: string;
      companyName: string;
      companyLogo: string | null;
      completedAt: string;
      payment: number | null;
    }[]
  > {
    const result = await db
      .select({
        id: applications.id,
        campaignTitle: campaigns.title,
        companyName: companies.name,
        companyLogo: companies.logo,
        appliedAt: applications.appliedAt,
        budget: campaigns.budget,
      })
      .from(applications)
      .innerJoin(campaigns, eq(applications.campaignId, campaigns.id))
      .innerJoin(companies, eq(campaigns.companyId, companies.id))
      .where(
        and(
          eq(applications.creatorId, creatorId),
          or(
            eq(applications.creatorWorkflowStatus, 'entregue'),
            eq(applications.workflowStatus, 'completed'),
            eq(applications.workflowStatus, 'paid'),
          ),
        ),
      )
      .orderBy(desc(applications.appliedAt));

    return result.map((r) => ({
      id: r.id,
      campaignTitle: r.campaignTitle,
      companyName: r.companyName,
      companyLogo: r.companyLogo,
      completedAt: r.appliedAt?.toISOString() || new Date().toISOString(),
      payment: r.budget ? Number(r.budget) : null,
    }));
  }

  async getCreatorCommunities(creatorId: number): Promise<
    {
      id: number;
      companyId: number;
      companyName: string;
      companyLogo: string | null;
      status: string;
      joinedAt: string | null;
      tierName: string | null;
      points: number;
    }[]
  > {
    const result = await db
      .select({
        id: brandCreatorMemberships.id,
        companyId: brandCreatorMemberships.companyId,
        companyName: companies.name,
        companyLogo: companies.logo,
        status: brandCreatorMemberships.status,
        joinedAt: brandCreatorMemberships.joinedAt,
        tierId: brandCreatorMemberships.tierId,
        points: brandCreatorMemberships.pointsCache,
      })
      .from(brandCreatorMemberships)
      .innerJoin(companies, eq(brandCreatorMemberships.companyId, companies.id))
      .where(eq(brandCreatorMemberships.creatorId, creatorId))
      .orderBy(desc(brandCreatorMemberships.joinedAt));

    const tierIds = result.filter((r) => r.tierId).map((r) => r.tierId!);
    let tierMap: Record<number, string> = {};

    if (tierIds.length > 0) {
      const tiers = await db
        .select({ id: brandTierConfigs.id, tierName: brandTierConfigs.tierName })
        .from(brandTierConfigs)
        .where(inArray(brandTierConfigs.id, tierIds));
      tierMap = Object.fromEntries(tiers.map((t) => [t.id, t.tierName]));
    }

    return result.map((r) => ({
      id: r.id,
      companyId: r.companyId,
      companyName: r.companyName,
      companyLogo: r.companyLogo,
      status: r.status,
      joinedAt: r.joinedAt?.toISOString() || null,
      tierName: r.tierId ? tierMap[r.tierId] || null : null,
      points: r.points,
    }));
  }

  // Deep Analytics Operations
  async upsertCreatorPost(post: InsertCreatorPost): Promise<CreatorPost> {
    const [result] = await db
      .insert(creatorPosts)
      .values(post)
      .onConflictDoUpdate({
        target: [creatorPosts.userId, creatorPosts.platform, creatorPosts.postId],
        set: {
          thumbnailUrl: post.thumbnailUrl,
          caption: post.caption,
          likes: post.likes,
          comments: post.comments,
          shares: post.shares,
          views: post.views,
          saves: post.saves,
          engagementRate: post.engagementRate,
          hashtags: post.hashtags,
          mentions: post.mentions,
          postType: post.postType,
          analyzedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async getCreatorPosts(
    userId: number,
    platform?: 'instagram' | 'tiktok',
    limit: number = 12,
  ): Promise<CreatorPost[]> {
    const conditions = [eq(creatorPosts.userId, userId)];
    if (platform) {
      conditions.push(eq(creatorPosts.platform, platform));
    }

    return await db
      .select()
      .from(creatorPosts)
      .where(and(...conditions))
      .orderBy(desc(creatorPosts.postedAt))
      .limit(limit);
  }

  async deleteOldCreatorPosts(
    userId: number,
    platform: 'instagram' | 'tiktok',
    keepCount: number,
  ): Promise<void> {
    const postsToKeep = await db
      .select({ id: creatorPosts.id })
      .from(creatorPosts)
      .where(and(eq(creatorPosts.userId, userId), eq(creatorPosts.platform, platform)))
      .orderBy(desc(creatorPosts.postedAt))
      .limit(keepCount);

    const keepIds = postsToKeep.map((p) => p.id);

    if (keepIds.length > 0) {
      await db.delete(creatorPosts).where(
        and(
          eq(creatorPosts.userId, userId),
          eq(creatorPosts.platform, platform),
          sql`${creatorPosts.id} NOT IN (${sql.join(
            keepIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
        ),
      );
    }
  }

  async createAnalyticsHistoryEntry(
    entry: InsertCreatorAnalyticsHistory,
  ): Promise<CreatorAnalyticsHistory> {
    const [result] = await db.insert(creatorAnalyticsHistory).values(entry).returning();
    return result;
  }

  async getCreatorAnalyticsHistory(
    userId: number,
    platform?: 'instagram' | 'tiktok',
    limit: number = 30,
  ): Promise<CreatorAnalyticsHistory[]> {
    const conditions = [eq(creatorAnalyticsHistory.userId, userId)];
    if (platform) {
      conditions.push(eq(creatorAnalyticsHistory.platform, platform));
    }

    return await db
      .select()
      .from(creatorAnalyticsHistory)
      .where(and(...conditions))
      .orderBy(desc(creatorAnalyticsHistory.recordedAt))
      .limit(limit);
  }

  async upsertTiktokProfile(profile: InsertTikTokProfile): Promise<TikTokProfile> {
    const [result] = await db
      .insert(tiktokProfiles)
      .values(profile)
      .onConflictDoUpdate({
        target: [tiktokProfiles.uniqueId],
        set: {
          uniqueId: profile.uniqueId,
          userId: profile.userId,
          nickname: profile.nickname,
          avatarUrl: profile.avatarUrl,
          signature: profile.signature,
          verified: profile.verified,
          followers: profile.followers,
          following: profile.following,
          hearts: profile.hearts,
          videoCount: profile.videoCount,
          rawData: profile.rawData,
          lastFetchedAt: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async getTiktokProfile(userId: number): Promise<TikTokProfile | undefined> {
    const [profile] = await db
      .select()
      .from(tiktokProfiles)
      .where(eq(tiktokProfiles.connectedByUserId, userId));
    return profile;
  }

  async upsertCreatorHashtag(hashtag: InsertCreatorHashtag): Promise<CreatorHashtag> {
    const [result] = await db
      .insert(creatorHashtags)
      .values(hashtag)
      .onConflictDoUpdate({
        target: [creatorHashtags.userId, creatorHashtags.platform, creatorHashtags.hashtag],
        set: {
          usageCount: sql`${creatorHashtags.usageCount} + 1`,
          avgEngagement: hashtag.avgEngagement,
          lastUsed: new Date(),
        },
      })
      .returning();
    return result;
  }

  async getCreatorHashtags(
    userId: number,
    platform?: 'instagram' | 'tiktok',
    limit: number = 20,
  ): Promise<CreatorHashtag[]> {
    const conditions = [eq(creatorHashtags.userId, userId)];
    if (platform) {
      conditions.push(eq(creatorHashtags.platform, platform));
    }

    return await db
      .select()
      .from(creatorHashtags)
      .where(and(...conditions))
      .orderBy(desc(creatorHashtags.usageCount))
      .limit(limit);
  }

  async updateCreatorHashtagStats(
    userId: number,
    platform: 'instagram' | 'tiktok',
    hashtags: { hashtag: string; avgEngagement: string }[],
  ): Promise<void> {
    for (const { hashtag, avgEngagement } of hashtags) {
      await db
        .insert(creatorHashtags)
        .values({
          userId,
          platform,
          hashtag: hashtag.toLowerCase(),
          usageCount: 1,
          avgEngagement,
          lastUsed: new Date(),
        })
        .onConflictDoUpdate({
          target: [creatorHashtags.userId, creatorHashtags.platform, creatorHashtags.hashtag],
          set: {
            usageCount: sql`${creatorHashtags.usageCount} + 1`,
            avgEngagement,
            lastUsed: new Date(),
          },
        });
    }
  }

  // Post AI Insights Operations
  async createPostAiInsight(insight: InsertPostAiInsight): Promise<PostAiInsight> {
    const [result] = await db
      .insert(postAiInsights)
      .values(insight)
      .onConflictDoUpdate({
        target: [postAiInsights.postId],
        set: {
          summary: insight.summary,
          strengths: insight.strengths,
          improvements: insight.improvements,
          hashtags: insight.hashtags,
          bestTimeToPost: insight.bestTimeToPost,
          audienceInsights: insight.audienceInsights,
          contentScore: insight.contentScore,
          engagementPrediction: insight.engagementPrediction,
          recommendations: insight.recommendations,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async getPostAiInsight(postId: number): Promise<PostAiInsight | undefined> {
    const [result] = await db
      .select()
      .from(postAiInsights)
      .where(eq(postAiInsights.postId, postId));
    return result;
  }

  async getPostAiInsightsByUser(userId: number, limit: number = 20): Promise<PostAiInsight[]> {
    return await db
      .select()
      .from(postAiInsights)
      .where(eq(postAiInsights.userId, userId))
      .orderBy(desc(postAiInsights.createdAt))
      .limit(limit);
  }

  async updatePostAiInsight(
    postId: number,
    updates: Partial<InsertPostAiInsight>,
  ): Promise<PostAiInsight> {
    const [result] = await db
      .update(postAiInsights)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(postAiInsights.postId, postId))
      .returning();
    return result;
  }

  async deletePostAiInsight(postId: number): Promise<void> {
    await db.delete(postAiInsights).where(eq(postAiInsights.postId, postId));
  }

  async getCompanyPublicStats(companyId: number): Promise<{
    company: User;
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
    campaignsByMonth: { month: string; count: number }[];
    collaborationsByMonth: { month: string; count: number }[];
    topCreators: {
      id: number;
      name: string;
      avatar: string | null;
      collaborations: number;
      avgRating: number;
    }[];
    financialMetrics: {
      totalRevenue: number;
      totalCommissions: number;
      pendingCommissions: number;
      paidCommissions: number;
      totalSales: number;
      avgOrderValue: number;
      revenueByMonth: { month: string; revenue: number; commissions: number }[];
      salesByCreator: {
        creatorId: number;
        name: string;
        avatar: string | null;
        sales: number;
        revenue: number;
        commissions: number;
      }[];
    };
  }> {
    const company = await this.getUser(companyId);
    if (!company || company.role !== 'company') {
      throw new Error('Company not found');
    }

    const companyCampaigns = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.companyId, companyId));

    const campaignIds = companyCampaigns.map((c) => c.id);

    let allApplications: any[] = [];
    if (campaignIds.length > 0) {
      allApplications = await db
        .select()
        .from(applications)
        .where(
          sql`${applications.campaignId} IN (${sql.join(
            campaignIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
        );
    }

    const totalCampaigns = companyCampaigns.length;
    const activeCampaigns = companyCampaigns.filter((c) => c.status === 'open').length;
    const completedCampaigns = companyCampaigns.filter((c) => c.status === 'closed').length;

    const totalApplications = allApplications.length;
    const acceptedApplications = allApplications.filter((a) => a.status === 'accepted').length;
    const acceptanceRate =
      totalApplications > 0
        ? ((acceptedApplications / totalApplications) * 100).toFixed(1) + '%'
        : '0%';

    const completedCollaborations = allApplications.filter(
      (a) =>
        a.status === 'accepted' &&
        (a.workflowStatus === 'entregue' || a.workflowStatus === 'concluido'),
    ).length;

    const totalReviews = 0;
    const avgRating = 0;

    const campaignsByMonth: { month: string; count: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthCampaigns = companyCampaigns.filter((c) => {
        const created = new Date(c.createdAt!);
        return created >= monthDate && created <= monthEnd;
      });
      campaignsByMonth.push({
        month: monthDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        count: monthCampaigns.length,
      });
    }

    let avgResponseTime = 'N/A';
    const respondedApps = allApplications.filter(
      (a) => a.status !== 'pending' && a.appliedAt && a.updatedAt,
    );
    if (respondedApps.length > 0) {
      const totalHours = respondedApps.reduce((sum, a) => {
        const applied = new Date(a.appliedAt!).getTime();
        const updated = new Date(a.updatedAt!).getTime();
        return sum + (updated - applied) / (1000 * 60 * 60);
      }, 0);
      const avgHours = totalHours / respondedApps.length;
      if (avgHours < 24) {
        avgResponseTime = `${Math.round(avgHours)}h`;
      } else {
        avgResponseTime = `${Math.round(avgHours / 24)}d`;
      }
    }

    // Collaborations by month (accepted applications)
    const collaborationsByMonth: { month: string; count: number }[] = [];
    const acceptedApps = allApplications.filter((a) => a.status === 'accepted');
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthCollaborations = acceptedApps.filter((a) => {
        const updated = new Date(a.updatedAt || a.appliedAt!);
        return updated >= monthDate && updated <= monthEnd;
      });
      collaborationsByMonth.push({
        month: monthDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        count: monthCollaborations.length,
      });
    }

    // Top creators (most collaborations with this company)
    const creatorCollaborations: Map<number, number> = new Map();
    acceptedApps.forEach((app) => {
      const current = creatorCollaborations.get(app.creatorId) || 0;
      creatorCollaborations.set(app.creatorId, current + 1);
    });

    const topCreatorIds = Array.from(creatorCollaborations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    const topCreators: {
      id: number;
      name: string;
      avatar: string | null;
      collaborations: number;
      avgRating: number;
    }[] = [];
    for (const creatorId of topCreatorIds) {
      const creator = await this.getUser(creatorId);
      if (creator) {
        const creatorAvgRating = 0;

        topCreators.push({
          id: creator.id,
          name: creator.name,
          avatar: creator.avatar,
          collaborations: creatorCollaborations.get(creatorId) || 0,
          avgRating: Math.round(creatorAvgRating * 10) / 10,
        });
      }
    }

    // Financial Metrics
    let allSales: any[] = [];
    let allCommissions: any[] = [];

    if (campaignIds.length > 0) {
      allSales = await db
        .select()
        .from(salesTracking)
        .where(
          sql`${salesTracking.campaignId} IN (${sql.join(
            campaignIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
        );

      allCommissions = await db
        .select()
        .from(creatorCommissions)
        .where(
          sql`${creatorCommissions.campaignId} IN (${sql.join(
            campaignIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
        );
    }

    const totalRevenue = allSales.reduce((sum, s) => sum + (s.orderValue || 0), 0);
    const totalCommissionsAmount = allCommissions.reduce((sum, c) => sum + (c.amount || 0), 0);
    const pendingCommissions = allCommissions
      .filter((c) => c.status === 'pending')
      .reduce((sum, c) => sum + (c.amount || 0), 0);
    const paidCommissions = allCommissions
      .filter((c) => c.status === 'paid')
      .reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalSalesCount = allSales.length;
    const avgOrderValue = totalSalesCount > 0 ? Math.round(totalRevenue / totalSalesCount) : 0;

    // Revenue by month (last 6 months)
    const revenueByMonth: { month: string; revenue: number; commissions: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const monthSales = allSales.filter((s) => {
        const tracked = new Date(s.trackedAt!);
        return tracked >= monthDate && tracked <= monthEnd;
      });

      const monthCommissions = allCommissions.filter((c) => {
        const created = new Date(c.createdAt!);
        return created >= monthDate && created <= monthEnd;
      });

      revenueByMonth.push({
        month: monthDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        revenue: monthSales.reduce((sum, s) => sum + (s.orderValue || 0), 0),
        commissions: monthCommissions.reduce((sum, c) => sum + (c.amount || 0), 0),
      });
    }

    // Sales by creator (top performers)
    const creatorSalesMap: Map<number, { sales: number; revenue: number; commissions: number }> =
      new Map();
    allSales.forEach((sale) => {
      const current = creatorSalesMap.get(sale.creatorId) || {
        sales: 0,
        revenue: 0,
        commissions: 0,
      };
      current.sales += 1;
      current.revenue += sale.orderValue || 0;
      current.commissions += sale.commission || 0;
      creatorSalesMap.set(sale.creatorId, current);
    });

    const salesByCreatorIds = Array.from(creatorSalesMap.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5);

    const salesByCreator: {
      creatorId: number;
      name: string;
      avatar: string | null;
      sales: number;
      revenue: number;
      commissions: number;
    }[] = [];
    for (const [creatorId, data] of salesByCreatorIds) {
      const creator = await this.getUser(creatorId);
      if (creator) {
        salesByCreator.push({
          creatorId: creator.id,
          name: creator.name,
          avatar: creator.avatar,
          sales: data.sales,
          revenue: data.revenue,
          commissions: data.commissions,
        });
      }
    }

    const financialMetrics = {
      totalRevenue,
      totalCommissions: totalCommissionsAmount,
      pendingCommissions,
      paidCommissions,
      totalSales: totalSalesCount,
      avgOrderValue,
      revenueByMonth,
      salesByCreator,
    };

    return {
      company,
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      totalApplications,
      acceptedApplications,
      acceptanceRate,
      avgResponseTime,
      avgRating: Math.round(avgRating * 10) / 10,
      totalReviews,
      totalCollaborations: completedCollaborations,
      campaignsByMonth,
      collaborationsByMonth,
      topCreators,
      financialMetrics,
    };
  }

  // Feature Flags Operations
  async getFeatureFlags(): Promise<FeatureFlag[]> {
    return await db.select().from(featureFlags).orderBy(featureFlags.module, featureFlags.name);
  }

  async getFeatureFlag(name: string): Promise<FeatureFlag | undefined> {
    const [flag] = await db.select().from(featureFlags).where(eq(featureFlags.name, name));
    return flag;
  }

  async getFeatureFlagsByModule(module: string): Promise<FeatureFlag[]> {
    return await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.module, module as any));
  }

  async isFeatureEnabled(name: string): Promise<boolean> {
    const flag = await this.getFeatureFlag(name);
    return flag?.enabled ?? false;
  }

  async createFeatureFlag(flag: InsertFeatureFlag): Promise<FeatureFlag> {
    const [created] = await db.insert(featureFlags).values(flag).returning();
    return created;
  }

  async updateFeatureFlag(id: number, enabled: boolean): Promise<FeatureFlag> {
    const [updated] = await db
      .update(featureFlags)
      .set({ enabled, updatedAt: new Date() })
      .where(eq(featureFlags.id, id))
      .returning();
    return updated;
  }

  async initializeDefaultFeatureFlags(): Promise<void> {
    const defaultFlags: InsertFeatureFlag[] = [
      {
        name: 'gamification_enabled',
        description: 'Sistema de gamificação com pontos, níveis e badges',
        module: 'gamification',
        enabled: false,
      },
      {
        name: 'leaderboard_enabled',
        description: 'Ranking mensal de criadores',
        module: 'gamification',
        enabled: false,
      },
      {
        name: 'competitions_enabled',
        description: 'Competições entre criadores',
        module: 'gamification',
        enabled: false,
      },
      {
        name: 'advanced_analytics_enabled',
        description: 'Análises avançadas e ROI de campanhas',
        module: 'advanced_analytics',
        enabled: false,
      },
      {
        name: 'pdf_reports_enabled',
        description: 'Exportação de relatórios em PDF',
        module: 'advanced_analytics',
        enabled: false,
      },
      {
        name: 'ecommerce_integration_enabled',
        description: 'Integração com Shopify/WooCommerce',
        module: 'ecommerce',
        enabled: false,
      },
      {
        name: 'coupons_enabled',
        description: 'Sistema de cupons automáticos',
        module: 'ecommerce',
        enabled: false,
      },
      {
        name: 'sales_tracking_enabled',
        description: 'Rastreamento de vendas e comissões',
        module: 'ecommerce',
        enabled: false,
      },
      {
        name: 'social_listening_enabled',
        description: 'Monitoramento de menções à marca',
        module: 'social_listening',
        enabled: false,
      },
      {
        name: 'hashtag_tracking_enabled',
        description: 'Rastreamento de hashtags',
        module: 'social_listening',
        enabled: false,
      },
      {
        name: 'mention_alerts_enabled',
        description: 'Alertas de menções',
        module: 'social_listening',
        enabled: false,
      },
    ];

    for (const flag of defaultFlags) {
      const existing = await this.getFeatureFlag(flag.name);
      if (!existing) {
        await this.createFeatureFlag(flag);
      }
    }
  }

  // Gamification Operations
  async getCreatorLevels(): Promise<CreatorLevel[]> {
    return await db.select().from(creatorLevels).orderBy(creatorLevels.minPoints);
  }

  async getCreatorLevel(id: number): Promise<CreatorLevel | undefined> {
    const [level] = await db.select().from(creatorLevels).where(eq(creatorLevels.id, id));
    return level;
  }

  async createCreatorLevel(level: InsertCreatorLevel): Promise<CreatorLevel> {
    const [created] = await db.insert(creatorLevels).values(level).returning();
    return created;
  }

  async addCreatorPoints(entry: InsertCreatorPoints): Promise<CreatorPointsEntry> {
    const [created] = await db.insert(creatorPoints).values(entry).returning();
    return created;
  }

  async getCreatorPointsHistory(
    creatorId: number,
    limit: number = 50,
  ): Promise<CreatorPointsEntry[]> {
    return await db
      .select()
      .from(creatorPoints)
      .where(eq(creatorPoints.creatorId, creatorId))
      .orderBy(desc(creatorPoints.createdAt))
      .limit(limit);
  }

  async getBadges(): Promise<Badge[]> {
    return await db.select().from(badges).orderBy(badges.name);
  }

  async getBadge(id: number): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.id, id));
    return badge;
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [created] = await db.insert(badges).values(badge).returning();
    return created;
  }

  async getCreatorBadges(creatorId: number): Promise<(CreatorBadge & { badge: Badge })[]> {
    const result = await db
      .select()
      .from(creatorBadges)
      .innerJoin(badges, eq(creatorBadges.badgeId, badges.id))
      .where(eq(creatorBadges.creatorId, creatorId))
      .orderBy(desc(creatorBadges.earnedAt));

    return result.map((r) => ({ ...r.creator_badges, badge: r.badges }));
  }

  async awardBadge(creatorId: number, badgeId: number): Promise<CreatorBadge> {
    const [created] = await db
      .insert(creatorBadges)
      .values({ creatorId, badgeId })
      .onConflictDoNothing()
      .returning();
    return created;
  }

  async initializeDefaultLevelsAndBadges(): Promise<void> {
    const existingLevels = await this.getCreatorLevels();
    if (existingLevels.length === 0) {
      const defaultLevels: InsertCreatorLevel[] = [
        {
          name: 'Bronze',
          minPoints: 0,
          maxPoints: 999,
          icon: '🥉',
          color: '#CD7F32',
          benefits: ['Acesso básico'],
        },
        {
          name: 'Prata',
          minPoints: 1000,
          maxPoints: 4999,
          icon: '🥈',
          color: '#C0C0C0',
          benefits: ['Destaque no perfil', 'Badge Prata'],
        },
        {
          name: 'Ouro',
          minPoints: 5000,
          maxPoints: 14999,
          icon: '🥇',
          color: '#FFD700',
          benefits: ['Prioridade em campanhas', 'Suporte VIP'],
        },
        {
          name: 'Diamante',
          minPoints: 15000,
          maxPoints: 49999,
          icon: '💎',
          color: '#B9F2FF',
          benefits: ['Campanhas exclusivas', '+10% comissões'],
        },
        {
          name: 'Lendário',
          minPoints: 50000,
          maxPoints: null,
          icon: '👑',
          color: '#9B59B6',
          benefits: ['Acesso total', '+20% comissões', 'Perfil verificado'],
        },
      ];
      for (const level of defaultLevels) {
        await this.createCreatorLevel(level);
      }
    }

    const existingBadges = await this.getBadges();
    if (existingBadges.length === 0) {
      const defaultBadges: InsertBadge[] = [
        {
          name: 'Primeira Campanha',
          description: 'Complete sua primeira campanha',
          icon: '🎉',
          requirement: 'first_campaign',
          requiredValue: 1,
        },
        {
          name: '10 Campanhas',
          description: 'Complete 10 campanhas',
          icon: '🏆',
          requirement: 'campaigns_completed',
          requiredValue: 10,
        },
        {
          name: 'Avaliação Perfeita',
          description: 'Receba nota 5 estrelas',
          icon: '⭐',
          requirement: 'perfect_rating',
          requiredValue: 1,
        },
        {
          name: 'Mestre da Pontualidade',
          description: '10 entregas no prazo seguidas',
          icon: '⏰',
          requirement: 'on_time_deliveries',
          requiredValue: 10,
        },
        {
          name: 'Rei do Engajamento',
          description: 'Alcance 10% de engajamento',
          icon: '👑',
          requirement: 'engagement_10_percent',
          requiredValue: 10,
        },
        {
          name: 'Post Viral',
          description: 'Alcance 100k views em um post',
          icon: '🚀',
          requirement: 'viral_100k',
          requiredValue: 100000,
        },
        {
          name: 'Campeão de Vendas',
          description: 'Gere 50 vendas',
          icon: '💰',
          requirement: 'sales_50',
          requiredValue: 50,
        },
        {
          name: 'Criador Verificado',
          description: 'Perfil verificado',
          icon: '✓',
          color: '#1DA1F2',
          requirement: 'verified_profile',
          requiredValue: 1,
        },
        {
          name: 'Top do Mês',
          description: 'Fique no top 3 do ranking mensal',
          icon: '🏅',
          requirement: 'top_3_monthly',
          requiredValue: 1,
        },
        {
          name: 'Sequência de 30 Dias',
          description: 'Mantenha atividade por 30 dias',
          icon: '🔥',
          requirement: 'streak_30',
          requiredValue: 30,
        },
      ];
      for (const badge of defaultBadges) {
        await this.createBadge(badge);
      }
    }
  }

  // Advanced Analytics Operations

  // Campaign Creator Stats (Ranking per Campaign) - V1 Gamification (legacy)
  async getCampaignLeaderboardV1(
    campaignId: number,
  ): Promise<(CampaignCreatorStats & { creator: User })[]> {
    const stats = await db
      .select()
      .from(campaignCreatorStats)
      .where(eq(campaignCreatorStats.campaignId, campaignId))
      .orderBy(desc(campaignCreatorStats.points));

    const result: (CampaignCreatorStats & { creator: User })[] = [];
    for (const stat of stats) {
      const [creator] = await db.select().from(users).where(eq(users.id, stat.creatorId));
      if (creator) {
        result.push({ ...stat, creator });
      }
    }
    return result;
  }

  async getCampaignCreatorStats(
    campaignId: number,
    creatorId: number,
  ): Promise<CampaignCreatorStats | undefined> {
    const [stats] = await db
      .select()
      .from(campaignCreatorStats)
      .where(
        and(
          eq(campaignCreatorStats.campaignId, campaignId),
          eq(campaignCreatorStats.creatorId, creatorId),
        ),
      );
    return stats;
  }

  async upsertCampaignCreatorStats(
    stats: InsertCampaignCreatorStats,
  ): Promise<CampaignCreatorStats> {
    const existing = await this.getCampaignCreatorStats(stats.campaignId, stats.creatorId);

    if (existing) {
      const [updated] = await db
        .update(campaignCreatorStats)
        .set({ ...stats, updatedAt: new Date() })
        .where(eq(campaignCreatorStats.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(campaignCreatorStats).values(stats).returning();
      return created;
    }
  }

  async updateCampaignCreatorPoints(
    campaignId: number,
    creatorId: number,
    pointsDelta: number,
  ): Promise<CampaignCreatorStats> {
    const existing = await this.getCampaignCreatorStats(campaignId, creatorId);

    if (existing) {
      const [updated] = await db
        .update(campaignCreatorStats)
        .set({
          points: existing.points + pointsDelta,
          updatedAt: new Date(),
        })
        .where(eq(campaignCreatorStats.id, existing.id))
        .returning();

      await this.recalculateCampaignRankings(campaignId);
      return updated;
    } else {
      const [created] = await db
        .insert(campaignCreatorStats)
        .values({ campaignId, creatorId, points: pointsDelta })
        .returning();

      await this.recalculateCampaignRankings(campaignId);
      return created;
    }
  }

  async recalculateCampaignRankings(campaignId: number): Promise<void> {
    const stats = await db
      .select()
      .from(campaignCreatorStats)
      .where(eq(campaignCreatorStats.campaignId, campaignId))
      .orderBy(desc(campaignCreatorStats.points));

    for (let i = 0; i < stats.length; i++) {
      await db
        .update(campaignCreatorStats)
        .set({ rank: i + 1 })
        .where(eq(campaignCreatorStats.id, stats[i].id));
    }
  }

  // Coupon Operations
  async createCoupon(coupon: InsertCampaignCoupon): Promise<CampaignCoupon> {
    const [created] = await db.insert(campaignCoupons).values(coupon).returning();
    return created;
  }

  async getCoupon(id: number): Promise<CampaignCoupon | undefined> {
    const [coupon] = await db.select().from(campaignCoupons).where(eq(campaignCoupons.id, id));
    return coupon;
  }

  async getCouponByCode(code: string): Promise<CampaignCoupon | undefined> {
    const [coupon] = await db.select().from(campaignCoupons).where(eq(campaignCoupons.code, code));
    return coupon;
  }

  async getCampaignCoupons(campaignId: number): Promise<(CampaignCoupon & { creator?: User })[]> {
    const coupons = await db
      .select()
      .from(campaignCoupons)
      .where(eq(campaignCoupons.campaignId, campaignId));

    const result: (CampaignCoupon & { creator?: User })[] = [];
    for (const coupon of coupons) {
      if (coupon.creatorId) {
        const [creator] = await db.select().from(users).where(eq(users.id, coupon.creatorId));
        result.push({ ...coupon, creator });
      } else {
        result.push({ ...coupon, creator: undefined });
      }
    }
    return result;
  }

  async getBrandCoupons(
    brandId: number,
  ): Promise<(CampaignCoupon & { creatorName?: string; campaignTitle?: string })[]> {
    const allCoupons = await db
      .select({
        coupon: campaignCoupons,
        campaign: campaigns,
        creator: users,
      })
      .from(campaignCoupons)
      .innerJoin(campaigns, eq(campaignCoupons.campaignId, campaigns.id))
      .leftJoin(users, eq(campaignCoupons.creatorId, users.id))
      .where(eq(campaigns.companyId, brandId));

    return allCoupons.map((row) => ({
      ...row.coupon,
      creatorName: row.creator?.name || row.creator?.email,
      campaignTitle: row.campaign.title,
    }));
  }

  async getCreatorCoupon(
    campaignId: number,
    creatorId: number,
  ): Promise<CampaignCoupon | undefined> {
    const [coupon] = await db
      .select()
      .from(campaignCoupons)
      .where(
        and(eq(campaignCoupons.campaignId, campaignId), eq(campaignCoupons.creatorId, creatorId)),
      );
    return coupon;
  }

  async updateCoupon(id: number, updates: Partial<CampaignCoupon>): Promise<CampaignCoupon> {
    const [updated] = await db
      .update(campaignCoupons)
      .set(updates)
      .where(eq(campaignCoupons.id, id))
      .returning();
    return updated;
  }

  // Sales Tracking Operations (with transaction for atomic sale + commission creation)
  async createSaleWithCommission(sale: {
    companyId: number;
    campaignId?: number | null;
    creatorId: number;
    couponId?: number | null;
    couponCode?: string;
    orderId: string;
    externalOrderId?: string;
    orderValue: number;
    commission?: number;
    commissionRateBps?: number;
    platform: 'shopify' | 'woocommerce' | 'manual';
    rawJson?: Record<string, any>;
  }): Promise<SalesTracking> {
    return await db.transaction(async (tx) => {
      const commissionAmount =
        sale.commission ??
        (sale.commissionRateBps
          ? Math.round((sale.orderValue * sale.commissionRateBps) / 10000)
          : 0);

      const [created] = await tx
        .insert(salesTracking)
        .values({
          ...sale,
          commission: commissionAmount,
        })
        .returning();

      // Create commission entry if commission is provided
      if (commissionAmount > 0) {
        await tx.insert(creatorCommissions).values({
          companyId: sale.companyId,
          creatorId: sale.creatorId,
          campaignId: sale.campaignId ?? null,
          salesTrackingId: created.id,
          amount: commissionAmount,
          status: 'pending',
        });
      }

      return created;
    });
  }

  async getBrandSales(
    companyId: number,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<(SalesTracking & { creator: User })[]> {
    let query = db.select().from(salesTracking).where(eq(salesTracking.companyId, companyId));

    if (fromDate && toDate) {
      query = db
        .select()
        .from(salesTracking)
        .where(
          and(
            eq(salesTracking.companyId, companyId),
            gte(salesTracking.trackedAt, fromDate),
            lte(salesTracking.trackedAt, toDate),
          ),
        );
    }

    const sales = await query.orderBy(desc(salesTracking.trackedAt));

    const result: (SalesTracking & { creator: User })[] = [];
    for (const sale of sales) {
      const [creator] = await db.select().from(users).where(eq(users.id, sale.creatorId));
      if (creator) {
        result.push({ ...sale, creator });
      }
    }
    return result;
  }

  async getBrandCommissions(companyId: number): Promise<(CreatorCommission & { creator: User })[]> {
    const commissions = await db
      .select()
      .from(creatorCommissions)
      .where(eq(creatorCommissions.companyId, companyId))
      .orderBy(desc(creatorCommissions.createdAt));

    const result: (CreatorCommission & { creator: User })[] = [];
    for (const commission of commissions) {
      const [creator] = await db.select().from(users).where(eq(users.id, commission.creatorId));
      if (creator) {
        result.push({ ...commission, creator });
      }
    }
    return result;
  }

  async approveCommission(id: number): Promise<CreatorCommission> {
    const [updated] = await db
      .update(creatorCommissions)
      .set({ status: 'approved', approvedAt: new Date() })
      .where(eq(creatorCommissions.id, id))
      .returning();
    return updated;
  }

  async payCommission(id: number): Promise<CreatorCommission> {
    const [updated] = await db
      .update(creatorCommissions)
      .set({ status: 'paid', paidAt: new Date() })
      .where(eq(creatorCommissions.id, id))
      .returning();
    return updated;
  }

  async getCampaignSales(campaignId: number): Promise<(SalesTracking & { creator: User })[]> {
    const sales = await db
      .select()
      .from(salesTracking)
      .where(eq(salesTracking.campaignId, campaignId))
      .orderBy(desc(salesTracking.trackedAt));

    const result: (SalesTracking & { creator: User })[] = [];
    for (const sale of sales) {
      const [creator] = await db.select().from(users).where(eq(users.id, sale.creatorId));
      if (creator) {
        result.push({ ...sale, creator });
      }
    }
    return result;
  }

  async getCreatorSales(creatorId: number): Promise<(SalesTracking & { campaign: Campaign })[]> {
    const sales = await db
      .select()
      .from(salesTracking)
      .where(eq(salesTracking.creatorId, creatorId))
      .orderBy(desc(salesTracking.trackedAt));

    const result: (SalesTracking & { campaign: Campaign })[] = [];
    for (const sale of sales) {
      if (sale.campaignId) {
        const [campaign] = await db
          .select()
          .from(campaigns)
          .where(eq(campaigns.id, sale.campaignId));
        if (campaign) {
          result.push({ ...sale, campaign });
        }
      }
    }
    return result;
  }

  async updateSaleStatus(
    id: number,
    status: 'pending' | 'confirmed' | 'paid' | 'cancelled',
  ): Promise<SalesTracking> {
    const [updated] = await db
      .update(salesTracking)
      .set({ status })
      .where(eq(salesTracking.id, id))
      .returning();
    return updated;
  }

  // Commission Operations
  async getCommission(id: number): Promise<CreatorCommission | undefined> {
    const [commission] = await db
      .select()
      .from(creatorCommissions)
      .where(eq(creatorCommissions.id, id));
    return commission;
  }

  async getCreatorCommissions(
    creatorId: number,
  ): Promise<(CreatorCommission & { campaign: Campaign })[]> {
    const commissions = await db
      .select()
      .from(creatorCommissions)
      .where(eq(creatorCommissions.creatorId, creatorId))
      .orderBy(desc(creatorCommissions.createdAt));

    const result: (CreatorCommission & { campaign: Campaign })[] = [];
    for (const commission of commissions) {
      if (commission.campaignId) {
        const [campaign] = await db
          .select()
          .from(campaigns)
          .where(eq(campaigns.id, commission.campaignId));
        if (campaign) {
          result.push({ ...commission, campaign });
        }
      }
    }
    return result;
  }

  async getCampaignCommissions(
    campaignId: number,
  ): Promise<(CreatorCommission & { creator: User })[]> {
    const commissions = await db
      .select()
      .from(creatorCommissions)
      .where(eq(creatorCommissions.campaignId, campaignId))
      .orderBy(desc(creatorCommissions.createdAt));

    const result: (CreatorCommission & { creator: User })[] = [];
    for (const commission of commissions) {
      const [creator] = await db.select().from(users).where(eq(users.id, commission.creatorId));
      if (creator) {
        result.push({ ...commission, creator });
      }
    }
    return result;
  }

  async updateCommissionStatus(
    id: number,
    status: 'pending' | 'approved' | 'paid',
  ): Promise<CreatorCommission> {
    const updates: Partial<CreatorCommission> = { status };
    if (status === 'paid') {
      updates.paidAt = new Date();
    }
    const [updated] = await db
      .update(creatorCommissions)
      .set(updates)
      .where(eq(creatorCommissions.id, id))
      .returning();
    return updated;
  }

  // ==========================================

  // ==========================================
  async createBrandSettings(settings: InsertBrandSettings): Promise<BrandSettings> {
    const [newSettings] = await db.insert(brandSettings).values(settings).returning();
    return newSettings;
  }

  async getBrandSettings(id: number): Promise<BrandSettings | undefined> {
    const [settings] = await db.select().from(brandSettings).where(eq(brandSettings.id, id));
    return settings;
  }

  async getBrandSettingsBySlug(slug: string): Promise<BrandSettings | undefined> {
    const [settings] = await db.select().from(brandSettings).where(eq(brandSettings.slug, slug));
    return settings;
  }

  async getBrandSettingsByCompany(companyId: number): Promise<BrandSettings[]> {
    return db
      .select()
      .from(brandSettings)
      .where(eq(brandSettings.companyId, companyId))
      .orderBy(desc(brandSettings.createdAt));
  }

  async updateBrandSettings(id: number, data: Partial<BrandSettings>): Promise<BrandSettings> {
    const [updated] = await db
      .update(brandSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(brandSettings.id, id))
      .returning();
    return updated;
  }

  async deleteBrandSettings(id: number): Promise<void> {
    await db.delete(brandSettings).where(eq(brandSettings.id, id));
  }

  // ==========================================
  // LANDING PAGE SUBMISSIONS
  // ==========================================

  // ==========================================
  // WALLET & PAYMENT SYSTEM
  // ==========================================

  async getCompanyWallet(companyId: number): Promise<CompanyWallet | undefined> {
    const [wallet] = await db
      .select()
      .from(companyWallets)
      .where(eq(companyWallets.companyId, companyId));
    return wallet;
  }

  async getOrCreateCompanyWallet(companyId: number): Promise<CompanyWallet> {
    let wallet = await this.getCompanyWallet(companyId);
    if (!wallet) {
      const now = new Date();
      const cycleStart = new Date(now.getFullYear(), now.getMonth(), 10);
      const cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 10);

      const [created] = await db
        .insert(companyWallets)
        .values({
          companyId,
          balance: 0,
          reservedBalance: 0,
          billingCycleStart: cycleStart,
          billingCycleEnd: cycleEnd,
        })
        .returning();
      wallet = created;
    }
    return wallet;
  }

  async updateCompanyWalletBalance(companyId: number, amount: number): Promise<CompanyWallet> {
    const wallet = await this.getOrCreateCompanyWallet(companyId);
    const [updated] = await db
      .update(companyWallets)
      .set({
        balance: wallet.balance + amount,
        updatedAt: new Date(),
      })
      .where(eq(companyWallets.id, wallet.id))
      .returning();
    return updated;
  }

  async addToCompanyWallet(
    companyId: number,
    amount: number,
    description: string,
  ): Promise<WalletTransaction> {
    const wallet = await this.getOrCreateCompanyWallet(companyId);
    const newBalance = wallet.balance + amount;

    await db
      .update(companyWallets)
      .set({ balance: newBalance, updatedAt: new Date() })
      .where(eq(companyWallets.id, wallet.id));

    const [transaction] = await db
      .insert(walletTransactions)
      .values({
        companyWalletId: wallet.id,
        type: 'deposit',
        amount,
        balanceAfter: newBalance,
        description,
        status: 'available',
      })
      .returning();

    return transaction;
  }

  async getWalletBoxes(companyWalletId: number): Promise<WalletBox[]> {
    return db
      .select()
      .from(walletBoxes)
      .where(eq(walletBoxes.companyWalletId, companyWalletId))
      .orderBy(walletBoxes.name);
  }

  async createWalletBox(data: InsertWalletBox): Promise<WalletBox> {
    const [box] = await db.insert(walletBoxes).values(data).returning();
    return box;
  }

  async updateWalletBox(id: number, data: Partial<WalletBox>): Promise<WalletBox> {
    const [updated] = await db
      .update(walletBoxes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(walletBoxes.id, id))
      .returning();
    return updated;
  }

  async deleteWalletBox(id: number): Promise<void> {
    await db.delete(walletBoxes).where(eq(walletBoxes.id, id));
  }

  async getCreatorBalance(userId: number): Promise<CreatorBalance | undefined> {
    const [balance] = await db
      .select()
      .from(creatorBalances)
      .where(eq(creatorBalances.userId, userId));
    return balance;
  }

  async getOrCreateCreatorBalance(userId: number): Promise<CreatorBalance> {
    let balance = await this.getCreatorBalance(userId);
    if (!balance) {
      try {
        const [created] = await db
          .insert(creatorBalances)
          .values({
            userId,
            availableBalance: 0,
            pendingBalance: 0,
          })
          .returning();
        balance = created;
      } catch (error: any) {
        if (error.code === '23505') {
          balance = await this.getCreatorBalance(userId);
          if (!balance) {
            throw new Error('Failed to get or create creator balance');
          }
        } else {
          throw error;
        }
      }
    }
    return balance;
  }

  async updateCreatorBalance(
    userId: number,
    data: Partial<CreatorBalance>,
  ): Promise<CreatorBalance> {
    const balance = await this.getOrCreateCreatorBalance(userId);
    const [updated] = await db
      .update(creatorBalances)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(creatorBalances.id, balance.id))
      .returning();
    return updated;
  }

  async createWalletTransaction(data: InsertWalletTransaction): Promise<WalletTransaction> {
    const [transaction] = await db.insert(walletTransactions).values(data).returning();
    return transaction;
  }

  async getCompanyTransactions(
    companyWalletId: number,
    filters?: { type?: string; status?: string; userId?: number; limit?: number; offset?: number },
  ): Promise<WalletTransaction[]> {
    let query = db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.companyWalletId, companyWalletId))
      .orderBy(desc(walletTransactions.createdAt));

    if (filters?.limit) {
      query = query.limit(filters.limit) as typeof query;
    }
    if (filters?.offset) {
      query = query.offset(filters.offset) as typeof query;
    }

    const results = await query;

    let filtered = results;
    if (filters?.type) {
      filtered = filtered.filter((t) => t.type === filters.type);
    }
    if (filters?.status) {
      filtered = filtered.filter((t) => t.status === filters.status);
    }
    if (filters?.userId) {
      filtered = filtered.filter((t) => t.relatedUserId === filters.userId);
    }

    return filtered;
  }

  async getCreatorTransactions(
    creatorBalanceId: number,
    limit?: number,
    offset?: number,
  ): Promise<WalletTransaction[]> {
    let query = db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.creatorBalanceId, creatorBalanceId))
      .orderBy(desc(walletTransactions.createdAt));

    if (limit) {
      query = query.limit(limit) as typeof query;
    }
    if (offset) {
      query = query.offset(offset) as typeof query;
    }

    return query;
  }

  async updateWalletTransactionStatus(id: number, status: string): Promise<WalletTransaction> {
    const [updated] = await db
      .update(walletTransactions)
      .set({
        status: status as any,
        processedAt: status === 'completed' ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(walletTransactions.id, id))
      .returning();
    return updated;
  }

  async createPaymentBatch(data: InsertPaymentBatch): Promise<PaymentBatch> {
    const [batch] = await db.insert(paymentBatches).values(data).returning();
    return batch;
  }

  async getPaymentBatches(companyWalletId: number): Promise<PaymentBatch[]> {
    return db
      .select()
      .from(paymentBatches)
      .where(eq(paymentBatches.companyWalletId, companyWalletId))
      .orderBy(desc(paymentBatches.createdAt));
  }

  async updatePaymentBatchStatus(id: number, status: string): Promise<PaymentBatch> {
    const [updated] = await db
      .update(paymentBatches)
      .set({
        status: status as any,
        processedAt: status === 'completed' ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(paymentBatches.id, id))
      .returning();
    return updated;
  }

  async payCreator(
    companyId: number,
    creatorUserId: number,
    amount: number,
    type: string,
    description: string,
    campaignId?: number,
  ): Promise<{ companyTransaction: WalletTransaction; creatorTransaction: WalletTransaction }> {
    const wallet = await this.getOrCreateCompanyWallet(companyId);
    const creatorBalance = await this.getOrCreateCreatorBalance(creatorUserId);

    if (wallet.balance < amount) {
      throw new Error('Saldo insuficiente na carteira');
    }

    const newWalletBalance = wallet.balance - amount;
    const newCreatorBalance = creatorBalance.pendingBalance + amount;

    await db
      .update(companyWallets)
      .set({ balance: newWalletBalance, updatedAt: new Date() })
      .where(eq(companyWallets.id, wallet.id));

    await db
      .update(creatorBalances)
      .set({ pendingBalance: newCreatorBalance, updatedAt: new Date() })
      .where(eq(creatorBalances.id, creatorBalance.id));

    const [companyTransaction] = await db
      .insert(walletTransactions)
      .values({
        companyWalletId: wallet.id,
        type: type as any,
        amount: -amount,
        balanceAfter: newWalletBalance,
        description,
        relatedUserId: creatorUserId,
        relatedCampaignId: campaignId,
        status: 'pending',
      })
      .returning();

    const [creatorTransaction] = await db
      .insert(walletTransactions)
      .values({
        creatorBalanceId: creatorBalance.id,
        type: 'transfer_in',
        amount,
        balanceAfter: newCreatorBalance,
        description,
        relatedCampaignId: campaignId,
        status: 'pending',
      })
      .returning();

    return { companyTransaction, creatorTransaction };
  }

  // ==========================================
  // GAMIFICATION V2 - Brand/Campaign Configurable
  // ==========================================

  // Brand Program
  async getBrandProgram(companyId: number): Promise<BrandProgram | undefined> {
    const [program] = await db
      .select()
      .from(brandPrograms)
      .where(eq(brandPrograms.companyId, companyId));
    return program;
  }

  async createBrandProgram(program: InsertBrandProgram): Promise<BrandProgram> {
    const [created] = await db.insert(brandPrograms).values(program).returning();
    return created;
  }

  async updateBrandProgram(
    companyId: number,
    updates: Partial<BrandProgram>,
  ): Promise<BrandProgram> {
    const [updated] = await db
      .update(brandPrograms)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(brandPrograms.companyId, companyId))
      .returning();
    return updated;
  }

  async upsertBrandProgram(program: InsertBrandProgram): Promise<BrandProgram> {
    const existing = await this.getBrandProgram(program.companyId);
    if (existing) {
      return this.updateBrandProgram(program.companyId, program);
    }
    return this.createBrandProgram(program);
  }

  // Brand Rewards Catalog
  async getBrandRewards(companyId: number): Promise<BrandReward[]> {
    return db
      .select()
      .from(brandRewards)
      .where(eq(brandRewards.companyId, companyId))
      .orderBy(desc(brandRewards.createdAt));
  }

  async getBrandReward(id: number): Promise<BrandReward | undefined> {
    const [reward] = await db.select().from(brandRewards).where(eq(brandRewards.id, id));
    return reward;
  }

  async createBrandReward(reward: InsertBrandReward): Promise<BrandReward> {
    const [created] = await db.insert(brandRewards).values(reward).returning();
    return created;
  }

  async updateBrandReward(id: number, updates: Partial<BrandReward>): Promise<BrandReward> {
    const [updated] = await db
      .update(brandRewards)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(brandRewards.id, id))
      .returning();
    return updated;
  }

  async deleteBrandReward(id: number): Promise<void> {
    await db.delete(brandRewards).where(eq(brandRewards.id, id));
  }

  // Brand Tier Configs
  async getBrandTiers(companyId: number): Promise<BrandTierConfig[]> {
    return db
      .select()
      .from(brandTierConfigs)
      .where(eq(brandTierConfigs.companyId, companyId))
      .orderBy(asc(brandTierConfigs.sortOrder));
  }

  async getBrandTierConfig(id: number): Promise<BrandTierConfig | undefined> {
    const [tier] = await db.select().from(brandTierConfigs).where(eq(brandTierConfigs.id, id));
    return tier;
  }

  async createBrandTier(tier: InsertBrandTierConfig): Promise<BrandTierConfig> {
    const [created] = await db.insert(brandTierConfigs).values(tier).returning();
    return created;
  }

  async updateBrandTier(id: number, updates: Partial<BrandTierConfig>): Promise<BrandTierConfig> {
    const [updated] = await db
      .update(brandTierConfigs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(brandTierConfigs.id, id))
      .returning();
    return updated;
  }

  async deleteBrandTier(id: number): Promise<void> {
    await db.delete(brandTierConfigs).where(eq(brandTierConfigs.id, id));
  }

  async getBrandTierCreatorCounts(companyId: number): Promise<{ tierId: number; count: number }[]> {
    const results = await db
      .select({
        tierId: brandCreatorTiers.tierId,
        count: sql<number>`count(*)::int`,
      })
      .from(brandCreatorTiers)
      .where(eq(brandCreatorTiers.companyId, companyId))
      .groupBy(brandCreatorTiers.tierId);
    return results.filter((r) => r.tierId !== null) as { tierId: number; count: number }[];
  }

  // Campaign Prizes
  async getCampaignPrizes(campaignId: number): Promise<CampaignPrize[]> {
    return db
      .select()
      .from(campaignPrizes)
      .where(eq(campaignPrizes.campaignId, campaignId))
      .orderBy(asc(campaignPrizes.rankPosition));
  }

  async getCampaignPrize(id: number): Promise<CampaignPrize | undefined> {
    const [prize] = await db.select().from(campaignPrizes).where(eq(campaignPrizes.id, id));
    return prize;
  }

  async createCampaignPrize(prize: InsertCampaignPrize): Promise<CampaignPrize> {
    const [created] = await db.insert(campaignPrizes).values(prize).returning();
    return created;
  }

  async updateCampaignPrize(id: number, updates: Partial<CampaignPrize>): Promise<CampaignPrize> {
    const [updated] = await db
      .update(campaignPrizes)
      .set(updates)
      .where(eq(campaignPrizes.id, id))
      .returning();
    return updated;
  }

  async deleteCampaignPrize(id: number): Promise<void> {
    await db.delete(campaignPrizes).where(eq(campaignPrizes.id, id));
  }

  async replaceCampaignPrizes(
    campaignId: number,
    prizes: InsertCampaignPrize[],
  ): Promise<CampaignPrize[]> {
    await db.delete(campaignPrizes).where(eq(campaignPrizes.campaignId, campaignId));
    if (prizes.length === 0) return [];
    return db.insert(campaignPrizes).values(prizes).returning();
  }

  // Points Ledger
  async addPointsLedgerEntry(entry: InsertPointsLedgerEntry): Promise<PointsLedgerEntry | null> {
    // Idempotent insert - won't duplicate if same ref+eventType already exists
    const result = await db
      .insert(pointsLedger)
      .values(entry)
      .onConflictDoNothing({
        target: [
          pointsLedger.campaignId,
          pointsLedger.creatorId,
          pointsLedger.eventType,
          pointsLedger.refType,
          pointsLedger.refId,
        ],
      })
      .returning();

    if (result.length === 0) {
      // Entry already exists, skip updating score cache
      console.log(
        `[PointsLedger] Skipped duplicate entry: ${entry.eventType} for creator ${entry.creatorId}, ref ${entry.refType}:${entry.refId}`,
      );
      return null;
    }
    return result[0];
  }

  async getPointsLedgerForCampaign(campaignId: number): Promise<PointsLedgerEntry[]> {
    return db
      .select()
      .from(pointsLedger)
      .where(eq(pointsLedger.campaignId, campaignId))
      .orderBy(desc(pointsLedger.createdAt));
  }

  async getPointsLedgerForCreator(
    creatorId: number,
    campaignId?: number,
  ): Promise<PointsLedgerEntry[]> {
    const conditions = [eq(pointsLedger.creatorId, creatorId)];
    if (campaignId) {
      conditions.push(eq(pointsLedger.campaignId, campaignId));
    }
    return db
      .select()
      .from(pointsLedger)
      .where(and(...conditions))
      .orderBy(desc(pointsLedger.createdAt));
  }

  // Brand Creator Tiers
  async getBrandCreatorTier(
    companyId: number,
    creatorId: number,
  ): Promise<BrandCreatorTier | undefined> {
    const [result] = await db
      .select()
      .from(brandCreatorTiers)
      .where(
        and(eq(brandCreatorTiers.companyId, companyId), eq(brandCreatorTiers.creatorId, creatorId)),
      );
    return result;
  }

  async updateBrandCreatorPoints(
    companyId: number,
    creatorId: number,
    deltaPoints: number,
  ): Promise<BrandCreatorTier> {
    const existing = await this.getBrandCreatorTier(companyId, creatorId);

    if (existing) {
      const newTotal = existing.totalBrandPoints + deltaPoints;

      // Find appropriate tier
      const tiers = await this.getBrandTiers(companyId);
      let newTierId = null;
      for (const tier of tiers.sort((a, b) => b.minPoints - a.minPoints)) {
        if (newTotal >= tier.minPoints) {
          newTierId = tier.id;
          break;
        }
      }

      const [updated] = await db
        .update(brandCreatorTiers)
        .set({
          totalBrandPoints: newTotal,
          tierId: newTierId,
          updatedAt: new Date(),
        })
        .where(eq(brandCreatorTiers.id, existing.id))
        .returning();
      return updated;
    } else {
      // Find appropriate tier
      const tiers = await this.getBrandTiers(companyId);
      let tierId = null;
      for (const tier of tiers.sort((a, b) => b.minPoints - a.minPoints)) {
        if (deltaPoints >= tier.minPoints) {
          tierId = tier.id;
          break;
        }
      }

      const [created] = await db
        .insert(brandCreatorTiers)
        .values({ companyId, creatorId, totalBrandPoints: deltaPoints, tierId })
        .returning();
      return created;
    }
  }

  // Get effective scoring rules (campaign override or brand default)
  async getEffectiveScoringRules(
    campaignId: number,
    companyId: number,
  ): Promise<{
    pointsPerDeliverable: number;
    pointsPerDeliverableType: {
      post_feed?: number;
      reels?: number;
      stories?: number;
      tiktok?: number;
      youtube_video?: number;
      youtube_shorts?: number;
      twitter_post?: number;
      other?: number;
    };
    pointsOnTimeBonus: number;
    pointsPer1kViews: number;
    pointsPerComment: number;
    pointsPerLike: number;
    pointsPerSale: number;
    qualityMultiplier: number;
    allowedPlatforms: ('instagram' | 'tiktok')[];
  }> {
    const defaults = {
      pointsPerDeliverable: 100,
      pointsPerDeliverableType: {} as { [key: string]: number },
      pointsOnTimeBonus: 25,
      pointsPer1kViews: 1,
      pointsPerComment: 1,
      pointsPerLike: 0.1,
      pointsPerSale: 10,
      qualityMultiplier: 10,
      allowedPlatforms: ['instagram', 'tiktok'] as ('instagram' | 'tiktok')[],
    };

    const campaignRules = await this.getCampaignPointsRules(campaignId);
    const rulesJson = campaignRules?.rulesJson || {};

    const mergedTypePoints = {
      ...defaults.pointsPerDeliverableType,
      ...rulesJson.postTypes,
    };

    return {
      pointsPerDeliverable: rulesJson.postTypes?.post_feed ?? defaults.pointsPerDeliverable,
      pointsPerDeliverableType: mergedTypePoints,
      pointsOnTimeBonus: rulesJson.deliveryPoints?.onTimeBonus ?? defaults.pointsOnTimeBonus,
      pointsPer1kViews: rulesJson.viewsMilestone?.points ?? defaults.pointsPer1kViews,
      pointsPerComment: rulesJson.commentsMilestone?.points ?? defaults.pointsPerComment,
      pointsPerLike: rulesJson.likesMilestone?.points ?? defaults.pointsPerLike,
      pointsPerSale: rulesJson.salesPoints?.pointsPerSale ?? defaults.pointsPerSale,
      qualityMultiplier: defaults.qualityMultiplier, // Not in new schema, use default
      allowedPlatforms: defaults.allowedPlatforms, // Not in new schema, use default
    };
  }

  // Get effective caps (campaign override or brand default)
  async getEffectiveCaps(
    campaignId: number,
    companyId: number,
  ): Promise<{
    maxPointsPerPost: number;
    maxPointsPerDay: number;
    maxPointsTotalCampaign: number;
    countingWindowDays: number;
  }> {
    const defaults = {
      maxPointsPerPost: 1000,
      maxPointsPerDay: 5000,
      maxPointsTotalCampaign: 50000,
      countingWindowDays: 7,
    };

    // capsJson was removed from campaignPointsRules schema
    // Future: implement caps as separate table or field if needed
    return defaults;
  }

  // Campaign Metric Snapshots
  async getMetricSnapshot(
    campaignId: number,
    postId: string,
    platform: string,
  ): Promise<CampaignMetricSnapshot | undefined> {
    const [result] = await db
      .select()
      .from(campaignMetricSnapshots)
      .where(
        and(
          eq(campaignMetricSnapshots.campaignId, campaignId),
          eq(campaignMetricSnapshots.postId, postId),
          eq(campaignMetricSnapshots.platform, platform as 'instagram' | 'tiktok'),
        ),
      );
    return result;
  }

  async upsertMetricSnapshot(data: InsertCampaignMetricSnapshot): Promise<CampaignMetricSnapshot> {
    const existing = await this.getMetricSnapshot(data.campaignId, data.postId, data.platform);

    if (existing) {
      const [updated] = await db
        .update(campaignMetricSnapshots)
        .set({
          ...data,
          lastSnapshotAt: new Date(),
        })
        .where(eq(campaignMetricSnapshots.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(campaignMetricSnapshots).values(data).returning();
      return created;
    }
  }

  async getCampaignSnapshots(campaignId: number): Promise<CampaignMetricSnapshot[]> {
    return db
      .select()
      .from(campaignMetricSnapshots)
      .where(eq(campaignMetricSnapshots.campaignId, campaignId))
      .orderBy(desc(campaignMetricSnapshots.lastSnapshotAt));
  }

  async getCreatorCampaignSnapshots(
    campaignId: number,
    creatorId: number,
  ): Promise<CampaignMetricSnapshot[]> {
    return db
      .select()
      .from(campaignMetricSnapshots)
      .where(
        and(
          eq(campaignMetricSnapshots.campaignId, campaignId),
          eq(campaignMetricSnapshots.creatorId, creatorId),
        ),
      )
      .orderBy(desc(campaignMetricSnapshots.lastSnapshotAt));
  }

  async getFlaggedSnapshots(campaignId?: number): Promise<CampaignMetricSnapshot[]> {
    const conditions = [eq(campaignMetricSnapshots.flaggedForReview, true)];
    if (campaignId) {
      conditions.push(eq(campaignMetricSnapshots.campaignId, campaignId));
    }
    return db
      .select()
      .from(campaignMetricSnapshots)
      .where(and(...conditions))
      .orderBy(desc(campaignMetricSnapshots.lastSnapshotAt));
  }

  async clearSnapshotFlag(snapshotId: number): Promise<CampaignMetricSnapshot> {
    const [updated] = await db
      .update(campaignMetricSnapshots)
      .set({ flaggedForReview: false, flagReason: null })
      .where(eq(campaignMetricSnapshots.id, snapshotId))
      .returning();
    return updated;
  }

  async resetDailyPointsCounters(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await db
      .update(campaignMetricSnapshots)
      .set({ pointsAwardedToday: 0 })
      .where(
        or(
          sql`${campaignMetricSnapshots.lastPointsDate} IS NULL`,
          sql`${campaignMetricSnapshots.lastPointsDate} < ${today}`,
        ),
      );
  }

  // Get campaigns with gamification enabled for processing

  // Get creator posts for a campaign (posts by accepted creators)
  async getCreatorPostsForCampaign(
    campaignId: number,
    allowedPlatforms: string[],
    windowDays: number,
  ): Promise<(CreatorPost & { creatorId: number })[]> {
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - windowDays);

    const acceptedApps = await db
      .select({ creatorId: applications.creatorId })
      .from(applications)
      .where(and(eq(applications.campaignId, campaignId), eq(applications.status, 'accepted')));

    if (acceptedApps.length === 0) return [];

    const creatorIds = acceptedApps.map((a) => a.creatorId);

    const posts = await db
      .select()
      .from(creatorPosts)
      .where(
        and(
          inArray(creatorPosts.userId, creatorIds),
          inArray(creatorPosts.platform, allowedPlatforms as ('instagram' | 'tiktok')[]),
          sql`${creatorPosts.postedAt} >= ${windowStart}`,
        ),
      );

    return posts.map((p) => ({ ...p, creatorId: p.userId }));
  }

  // Process metric delta and award points with anti-fraud checks
  // Uses transactional approach with row-level locking
  async processMetricDelta(
    campaignId: number,
    companyId: number,
    creatorId: number,
    post: CreatorPost,
    rules: {
      pointsPer1kViews: number;
      pointsPerComment: number;
      pointsPerLike: number;
    },
    caps: {
      maxPointsPerPost: number;
      maxPointsPerDay: number;
      maxPointsTotalCampaign: number;
    },
  ): Promise<{ pointsAwarded: number; flagged: boolean; flagReason?: string }> {
    const MIN_BASELINE_SAMPLES = 3;
    const now = new Date();

    // Use transaction for atomicity
    return await db.transaction(async (tx) => {
      // Lock and fetch snapshot with FOR UPDATE
      const snapshotResult = await tx
        .select()
        .from(campaignMetricSnapshots)
        .where(
          and(
            eq(campaignMetricSnapshots.campaignId, campaignId),
            eq(campaignMetricSnapshots.postId, post.postId),
            eq(campaignMetricSnapshots.platform, post.platform),
          ),
        )
        .for('update')
        .limit(1);

      const snapshot = snapshotResult[0] || null;

      // Calculate deltas from last awarded counts (idempotent)
      const viewsDelta = Math.max(0, (post.views || 0) - (snapshot?.lastAwardedViews || 0));
      const likesDelta = Math.max(0, (post.likes || 0) - (snapshot?.lastAwardedLikes || 0));
      const commentsDelta = Math.max(
        0,
        (post.comments || 0) - (snapshot?.lastAwardedComments || 0),
      );

      // Skip if no positive delta
      if (viewsDelta <= 0 && likesDelta <= 0 && commentsDelta <= 0) {
        return { pointsAwarded: 0, flagged: false };
      }

      // Calculate new baseline stats (always include current delta)
      const newUpdateCount = (snapshot?.updateCount || 0) + 1;
      const newSumViewsDeltas = (snapshot?.sumViewsDeltas || 0) + viewsDelta;
      const newSumLikesDeltas = (snapshot?.sumLikesDeltas || 0) + likesDelta;
      const newSumCommentsDeltas = (snapshot?.sumCommentsDeltas || 0) + commentsDelta;

      // Determine if we're in seeding phase (no points awarded yet)
      const isSeeding = newUpdateCount <= MIN_BASELINE_SAMPLES;

      // Calculate points (0 during seeding)
      let viewsPoints = 0;
      let likesPoints = 0;
      let commentsPoints = 0;
      let flagged = false;
      let flagReason: string | undefined;

      if (!isSeeding) {
        // Calculate raw points
        viewsPoints = Math.floor((viewsDelta / 1000) * rules.pointsPer1kViews);
        likesPoints = Math.floor(likesDelta * rules.pointsPerLike);
        commentsPoints = Math.floor(commentsDelta * rules.pointsPerComment);

        // Anti-fraud: detect spikes using historical average (excludes current delta)
        const historicalCount = snapshot!.updateCount;
        const avgViewsDelta = snapshot!.sumViewsDeltas / historicalCount;
        const avgLikesDelta = snapshot!.sumLikesDeltas / historicalCount;

        if (avgViewsDelta > 0 && viewsDelta > avgViewsDelta * 10) {
          flagged = true;
          flagReason = `Abnormal views spike: ${viewsDelta} vs avg ${Math.round(avgViewsDelta)}`;
        } else if (avgLikesDelta > 0 && likesDelta > avgLikesDelta * 10) {
          flagged = true;
          flagReason = `Abnormal likes spike: ${likesDelta} vs avg ${Math.round(avgLikesDelta)}`;
        }

        // Apply per-post cap
        let totalPostPoints = viewsPoints + likesPoints + commentsPoints;
        if (totalPostPoints > caps.maxPointsPerPost) {
          const ratio = caps.maxPointsPerPost / totalPostPoints;
          viewsPoints = Math.floor(viewsPoints * ratio);
          likesPoints = Math.floor(likesPoints * ratio);
          commentsPoints = Math.floor(commentsPoints * ratio);
        }

        // Apply per-day cap
        const pointsToday = snapshot?.pointsAwardedToday || 0;
        const remainingDayPoints = Math.max(0, caps.maxPointsPerDay - pointsToday);
        totalPostPoints = viewsPoints + likesPoints + commentsPoints;
        if (totalPostPoints > remainingDayPoints) {
          const ratio = remainingDayPoints / totalPostPoints;
          viewsPoints = Math.floor(viewsPoints * ratio);
          likesPoints = Math.floor(likesPoints * ratio);
          commentsPoints = Math.floor(commentsPoints * ratio);
        }

        // Apply campaign total cap
        const totalAwarded = snapshot?.totalPointsAwarded || 0;
        const remainingCampaignPoints = Math.max(0, caps.maxPointsTotalCampaign - totalAwarded);
        totalPostPoints = viewsPoints + likesPoints + commentsPoints;
        if (totalPostPoints > remainingCampaignPoints) {
          const ratio = remainingCampaignPoints / totalPostPoints;
          viewsPoints = Math.floor(viewsPoints * ratio);
          likesPoints = Math.floor(likesPoints * ratio);
          commentsPoints = Math.floor(commentsPoints * ratio);
        }
      }

      const totalPostPoints = viewsPoints + likesPoints + commentsPoints;

      // Create ledger entries within transaction (only if points > 0)
      if (viewsPoints > 0) {
        await tx.insert(pointsLedger).values({
          companyId,
          campaignId,
          creatorId,
          deltaPoints: viewsPoints,
          eventType: 'views_milestone',
          refType: 'post',
          refId: post.id,
          notes: `+${viewsDelta} views on ${post.platform}`,
        });
      }

      if (likesPoints > 0) {
        await tx.insert(pointsLedger).values({
          companyId,
          campaignId,
          creatorId,
          deltaPoints: likesPoints,
          eventType: 'like_milestone',
          refType: 'post',
          refId: post.id,
          notes: `+${likesDelta} likes on ${post.platform}`,
        });
      }

      if (commentsPoints > 0) {
        await tx.insert(pointsLedger).values({
          companyId,
          campaignId,
          creatorId,
          deltaPoints: commentsPoints,
          eventType: 'comment_milestone',
          refType: 'post',
          refId: post.id,
          notes: `+${commentsDelta} comments on ${post.platform}`,
        });
      }

      // Upsert snapshot within transaction (always update)
      if (snapshot) {
        await tx
          .update(campaignMetricSnapshots)
          .set({
            views: post.views || 0,
            likes: post.likes || 0,
            comments: post.comments || 0,
            lastAwardedViews: post.views || 0,
            lastAwardedLikes: post.likes || 0,
            lastAwardedComments: post.comments || 0,
            updateCount: newUpdateCount,
            sumViewsDeltas: newSumViewsDeltas,
            sumLikesDeltas: newSumLikesDeltas,
            sumCommentsDeltas: newSumCommentsDeltas,
            totalPointsAwarded: (snapshot.totalPointsAwarded || 0) + totalPostPoints,
            pointsAwardedToday: (snapshot.pointsAwardedToday || 0) + totalPostPoints,
            lastPointsDate: totalPostPoints > 0 ? now : snapshot.lastPointsDate,
            flaggedForReview: flagged,
            flagReason: flagReason || null,
            lastSnapshotAt: now,
          })
          .where(eq(campaignMetricSnapshots.id, snapshot.id));
      } else {
        await tx.insert(campaignMetricSnapshots).values({
          campaignId,
          creatorId,
          postId: post.postId,
          platform: post.platform,
          postUrl: post.postUrl,
          views: post.views || 0,
          likes: post.likes || 0,
          comments: post.comments || 0,
          lastAwardedViews: post.views || 0,
          lastAwardedLikes: post.likes || 0,
          lastAwardedComments: post.comments || 0,
          updateCount: newUpdateCount,
          sumViewsDeltas: newSumViewsDeltas,
          sumLikesDeltas: newSumLikesDeltas,
          sumCommentsDeltas: newSumCommentsDeltas,
          totalPointsAwarded: totalPostPoints,
          pointsAwardedToday: totalPostPoints,
          lastPointsDate: totalPostPoints > 0 ? now : null,
          flaggedForReview: flagged,
          flagReason: flagReason || null,
          postedAt: post.postedAt,
        });
      }

      // Atomically increment creator score using raw SQL for proper locking
      // This uses INSERT ON CONFLICT with INCREMENT instead of SET to avoid race conditions
      if (totalPostPoints > 0) {
        await tx.execute(sql`
          INSERT INTO creator_scores (company_id, campaign_id, creator_id, total_points, last_updated_at)
          VALUES (${companyId}, ${campaignId}, ${creatorId}, ${totalPostPoints}, ${now})
          ON CONFLICT (campaign_id, creator_id)
          DO UPDATE SET 
            total_points = creator_scores.total_points + ${totalPostPoints},
            last_updated_at = ${now}
        `);
      }

      return { pointsAwarded: totalPostPoints, flagged, flagReason };
    });
  }

  // ==========================================
  // REWARD ENTITLEMENTS - Milestones & Prizes
  // ==========================================

  async getRewardEntitlements(filters: {
    companyId?: number;
    campaignId?: number;
    creatorId?: number;
    status?: string;
  }): Promise<RewardEntitlement[]> {
    const conditions = [];
    if (filters.companyId) conditions.push(eq(rewardEntitlements.companyId, filters.companyId));
    if (filters.campaignId) conditions.push(eq(rewardEntitlements.campaignId, filters.campaignId));
    if (filters.creatorId) conditions.push(eq(rewardEntitlements.creatorId, filters.creatorId));
    if (filters.status) conditions.push(eq(rewardEntitlements.status, filters.status as any));

    return db
      .select()
      .from(rewardEntitlements)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(rewardEntitlements.createdAt));
  }

  async getRewardEntitlement(id: number): Promise<RewardEntitlement | undefined> {
    const [entitlement] = await db
      .select()
      .from(rewardEntitlements)
      .where(eq(rewardEntitlements.id, id));
    return entitlement;
  }

  async createRewardEntitlement(data: InsertRewardEntitlement): Promise<RewardEntitlement> {
    const [created] = await db.insert(rewardEntitlements).values(data).returning();
    return created;
  }

  async approveRewardEntitlement(id: number, approvedBy: number): Promise<RewardEntitlement> {
    const [entitlement] = await db
      .select()
      .from(rewardEntitlements)
      .where(eq(rewardEntitlements.id, id));

    if (!entitlement) throw new Error('Reward entitlement not found');

    const previousStatus = entitlement.status;
    const [updated] = await db
      .update(rewardEntitlements)
      .set({
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(rewardEntitlements.id, id))
      .returning();
    return updated;
  }

  async rejectRewardEntitlement(
    id: number,
    rejectedBy: number,
    reason?: string,
  ): Promise<RewardEntitlement> {
    const [entitlement] = await db
      .select()
      .from(rewardEntitlements)
      .where(eq(rewardEntitlements.id, id));

    if (!entitlement) throw new Error('Reward entitlement not found');

    const previousStatus = entitlement.status;
    const [updated] = await db
      .update(rewardEntitlements)
      .set({
        status: 'rejected',
        rejectedBy,
        rejectedAt: new Date(),
        rejectionReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(rewardEntitlements.id, id))
      .returning();
    return updated;
  }

  async processCashReward(entitlementId: number, performedBy: number): Promise<void> {
    const [entitlement] = await db
      .select()
      .from(rewardEntitlements)
      .where(eq(rewardEntitlements.id, entitlementId));

    if (!entitlement) throw new Error('Reward entitlement not found');
    if (!entitlement.cashAmount) throw new Error('No cash amount defined for this reward');

    // Get company wallet
    const [wallet] = await db
      .select()
      .from(companyWallets)
      .where(eq(companyWallets.companyId, entitlement.companyId));

    if (!wallet) throw new Error('Company wallet not found');
    if (wallet.balance < entitlement.cashAmount) throw new Error('Insufficient balance');

    // Create pending wallet transaction for the creator
    const [transaction] = await db
      .insert(walletTransactions)
      .values({
        companyWalletId: wallet.id,
        type: 'bonus',
        amount: entitlement.cashAmount,
        relatedUserId: entitlement.creatorId,
        relatedCampaignId: entitlement.campaignId,
        description: `Prêmio de campanha - ${entitlement.productDescription || 'Gamification reward'}`,
        status: 'pending',
      })
      .returning();

    // Update entitlement with transaction reference
    const previousStatus = entitlement.status;
    await db
      .update(rewardEntitlements)
      .set({
        walletTransactionId: transaction.id,
        status: 'cash_paid',
        updatedAt: new Date(),
      })
      .where(eq(rewardEntitlements.id, entitlementId));
  }

  async processProductReward(entitlementId: number, performedBy: number): Promise<void> {
    const [entitlement] = await db
      .select()
      .from(rewardEntitlements)
      .where(eq(rewardEntitlements.id, entitlementId));

    if (!entitlement) throw new Error('Reward entitlement not found');

    // Update status to product_shipped (actual shipment handled separately)
    const previousStatus = entitlement.status;
    await db
      .update(rewardEntitlements)
      .set({
        status: 'product_shipped',
        updatedAt: new Date(),
      })
      .where(eq(rewardEntitlements.id, entitlementId));
  }

  async completeRewardEntitlement(id: number, performedBy: number): Promise<RewardEntitlement> {
    const [entitlement] = await db
      .select()
      .from(rewardEntitlements)
      .where(eq(rewardEntitlements.id, id));

    if (!entitlement) throw new Error('Reward entitlement not found');

    const previousStatus = entitlement.status;
    const [updated] = await db
      .update(rewardEntitlements)
      .set({ status: 'completed', updatedAt: new Date() })
      .where(eq(rewardEntitlements.id, id))
      .returning();
    return updated;
  }

  async getGamificationEnabledCampaigns(): Promise<{ id: number; companyId: number }[]> {
    const activeCampaigns = await db
      .select({ id: campaigns.id, companyId: campaigns.companyId })
      .from(campaigns)
      .where(eq(campaigns.status, 'open'));
    return activeCampaigns;
  }

  async getCreatorScore(
    campaignId: number,
    creatorId: number,
  ): Promise<{ totalPoints: number } | null> {
    const result = await db
      .select({
        totalPoints: sql<number>`COALESCE(SUM(${pointsLedger.deltaPoints}), 0)::int`,
      })
      .from(pointsLedger)
      .where(and(eq(pointsLedger.campaignId, campaignId), eq(pointsLedger.creatorId, creatorId)));
    if (!result[0] || result[0].totalPoints === 0) return null;
    return { totalPoints: result[0].totalPoints };
  }

  async recalculateCampaignRanks(campaignId: number): Promise<void> {
    // Ranks are now calculated on-the-fly from points_ledger, no separate table needed
    return;
  }

  // Check and create milestone rewards when creator reaches threshold
  async checkMilestoneRewards(
    companyId: number,
    campaignId: number,
    creatorId: number,
    currentPoints: number,
  ): Promise<number> {
    // Get all milestone prizes for this campaign
    const prizes = await db
      .select()
      .from(campaignPrizes)
      .where(and(eq(campaignPrizes.campaignId, campaignId), eq(campaignPrizes.type, 'milestone')))
      .orderBy(asc(campaignPrizes.milestonePoints));

    let rewardsCreated = 0;

    for (const prize of prizes) {
      if (!prize.milestonePoints) continue;

      // Check if creator has reached this milestone
      if (currentPoints >= prize.milestonePoints) {
        // Check if reward already exists
        const [existing] = await db
          .select()
          .from(rewardEntitlements)
          .where(
            and(
              eq(rewardEntitlements.creatorId, creatorId),
              eq(rewardEntitlements.prizeId, prize.id),
            ),
          );

        if (!existing) {
          // Create new reward entitlement
          await this.createRewardEntitlement({
            companyId,
            campaignId,
            creatorId,
            prizeId: prize.id,
            sourceType: 'milestone_reached',
            pointsAtTime: currentPoints,
            rewardKind: prize.rewardKind,
            cashAmount: prize.cashAmount,
            productSku: prize.productSku,
            productDescription: prize.productDescription,
            status: 'pending',
          });
          rewardsCreated++;

          // Add ledger entry for milestone reached (0 points, just audit)
          await db.insert(pointsLedger).values({
            companyId,
            campaignId,
            creatorId,
            deltaPoints: 0,
            eventType: 'milestone_reached',
            refType: 'prize',
            refId: prize.id,
            notes: `Milestone ${prize.milestonePoints} points reached`,
          });
        }
      }
    }

    return rewardsCreated;
  }

  // Campaign closeout - create rewards for Top N ranking places

  // Bulk approve rewards
  async bulkApproveRewards(ids: number[], approvedBy: number): Promise<number> {
    let approved = 0;
    for (const id of ids) {
      try {
        await this.approveRewardEntitlement(id, approvedBy);
        approved++;
      } catch (error) {
        console.error(`Failed to approve reward ${id}:`, error);
      }
    }
    return approved;
  }

  // Process approved rewards (execute payments/shipments)
  async executeApprovedReward(id: number, performedBy: number): Promise<void> {
    const [entitlement] = await db
      .select()
      .from(rewardEntitlements)
      .where(eq(rewardEntitlements.id, id));

    if (!entitlement) throw new Error('Reward entitlement not found');
    if (entitlement.status !== 'approved') throw new Error('Reward must be approved first');

    if (entitlement.rewardKind === 'cash' || entitlement.rewardKind === 'both') {
      await this.processCashReward(id, performedBy);
    }

    if (entitlement.rewardKind === 'product' || entitlement.rewardKind === 'both') {
      await this.processProductReward(id, performedBy);
    }

    if (entitlement.rewardKind === 'none') {
      // Badge/tier boost only - mark as completed
      await this.completeRewardEntitlement(id, performedBy);
    }
  }

  // ==========================================
  // COMMUNITY OPERATIONS
  // ==========================================

  async createCommunityInvite(data: InsertCommunityInvite): Promise<CommunityInvite> {
    const [invite] = await db.insert(communityInvites).values(data).returning();
    return invite;
  }

  async getCommunityInvite(id: number): Promise<CommunityInvite | undefined> {
    const [invite] = await db.select().from(communityInvites).where(eq(communityInvites.id, id));
    return invite;
  }

  async getCommunityInviteByToken(token: string): Promise<CommunityInvite | undefined> {
    const [invite] = await db
      .select()
      .from(communityInvites)
      .where(eq(communityInvites.token, token));
    return invite;
  }

  async getCompanyCommunityInvites(companyId: number): Promise<CommunityInvite[]> {
    return db
      .select()
      .from(communityInvites)
      .where(eq(communityInvites.companyId, companyId))
      .orderBy(desc(communityInvites.createdAt));
  }

  async getCreatorPendingCommunityInvites(
    creatorId: number,
  ): Promise<(CommunityInvite & { company: Company })[]> {
    const invites = await db
      .select()
      .from(communityInvites)
      .where(and(eq(communityInvites.creatorId, creatorId), eq(communityInvites.status, 'sent')))
      .orderBy(desc(communityInvites.createdAt));

    const result: (CommunityInvite & { company: Company })[] = [];

    for (const invite of invites) {
      const [company] = await db.select().from(companies).where(eq(companies.id, invite.companyId));

      if (company) {
        result.push({ ...invite, company });
      }
    }

    return result;
  }

  async updateCommunityInvite(
    id: number,
    data: Partial<CommunityInvite>,
  ): Promise<CommunityInvite> {
    const [updated] = await db
      .update(communityInvites)
      .set(data)
      .where(eq(communityInvites.id, id))
      .returning();
    return updated;
  }

  // ==========================================
  // MEMBERSHIP OPERATIONS
  // ==========================================

  async createBrandCreatorMembership(
    data: InsertBrandCreatorMembership,
  ): Promise<BrandCreatorMembership> {
    const [membership] = await db
      .insert(brandCreatorMemberships)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return membership;
  }

  async getBrandCreatorMembership(id: number): Promise<BrandCreatorMembership | undefined> {
    const [membership] = await db
      .select()
      .from(brandCreatorMemberships)
      .where(eq(brandCreatorMemberships.id, id));
    return membership;
  }

  async getBrandCreatorMembershipByCreatorAndCompany(
    creatorId: number,
    companyId: number,
  ): Promise<BrandCreatorMembership | undefined> {
    const [membership] = await db
      .select()
      .from(brandCreatorMemberships)
      .where(
        and(
          eq(brandCreatorMemberships.creatorId, creatorId),
          eq(brandCreatorMemberships.companyId, companyId),
        ),
      );
    return membership;
  }

  async getCompanyMemberships(
    companyId: number,
    filters?: { status?: string; tierId?: number; search?: string },
  ): Promise<(BrandCreatorMembership & { creator: User })[]> {
    const conditions = [eq(brandCreatorMemberships.companyId, companyId)];

    if (filters?.status) {
      conditions.push(eq(brandCreatorMemberships.status, filters.status as any));
    }
    if (filters?.tierId) {
      conditions.push(eq(brandCreatorMemberships.tierId, filters.tierId));
    }

    const memberships = await db
      .select()
      .from(brandCreatorMemberships)
      .where(and(...conditions))
      .orderBy(desc(brandCreatorMemberships.joinedAt));

    const result: (BrandCreatorMembership & { creator: User })[] = [];

    for (const membership of memberships) {
      const [creator] = await db.select().from(users).where(eq(users.id, membership.creatorId));

      if (creator) {
        if (filters?.search) {
          const searchLower = filters.search.toLowerCase();
          if (
            !creator.name.toLowerCase().includes(searchLower) &&
            !creator.email.toLowerCase().includes(searchLower) &&
            !creator.instagram?.toLowerCase().includes(searchLower)
          ) {
            continue;
          }
        }
        result.push({ ...membership, creator });
      }
    }

    return result;
  }

  async getCreatorMemberships(
    creatorId: number,
  ): Promise<(BrandCreatorMembership & { company: Company })[]> {
    const memberships = await db
      .select()
      .from(brandCreatorMemberships)
      .where(eq(brandCreatorMemberships.creatorId, creatorId))
      .orderBy(desc(brandCreatorMemberships.joinedAt));

    const result: (BrandCreatorMembership & { company: Company })[] = [];

    for (const membership of memberships) {
      const [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, membership.companyId));

      if (company) {
        result.push({ ...membership, company });
      }
    }

    return result;
  }

  async updateBrandCreatorMembership(
    id: number,
    data: Partial<BrandCreatorMembership>,
  ): Promise<BrandCreatorMembership> {
    const [updated] = await db
      .update(brandCreatorMemberships)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(brandCreatorMemberships.id, id))
      .returning();
    return updated;
  }

  async getActiveMembershipCompanyIds(creatorId: number): Promise<number[]> {
    const memberships = await db
      .select({ companyId: brandCreatorMemberships.companyId })
      .from(brandCreatorMemberships)
      .where(
        and(
          eq(brandCreatorMemberships.creatorId, creatorId),
          eq(brandCreatorMemberships.status, 'active'),
        ),
      );

    return memberships.map((m) => m.companyId);
  }

  // ==========================================
  // BRAND POINTS RULES
  // ==========================================

  // ==========================================
  // CAMPAIGN POINTS RULES
  // ==========================================

  async getCampaignPointsRules(campaignId: number): Promise<CampaignPointsRules | undefined> {
    const [rules] = await db
      .select()
      .from(campaignPointsRules)
      .where(eq(campaignPointsRules.campaignId, campaignId));
    return rules;
  }

  async upsertCampaignPointsRules(
    campaignId: number,
    rulesJson: CampaignPointsRules['rulesJson'],
    overridesBrand: boolean = false,
  ): Promise<CampaignPointsRules> {
    const existing = await this.getCampaignPointsRules(campaignId);
    if (existing) {
      const [updated] = await db
        .update(campaignPointsRules)
        .set({ rulesJson, overridesBrand, updatedAt: new Date() })
        .where(eq(campaignPointsRules.campaignId, campaignId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(campaignPointsRules)
        .values({ campaignId, rulesJson, overridesBrand })
        .returning();
      return created;
    }
  }

  // ==========================================
  // LEADERBOARD & POINTS SUMMARY
  // ==========================================

  async getBrandLeaderboard(
    companyId: number,
    range: 'week' | 'month' | 'all',
    campaignId?: number,
    limit: number = 10,
  ): Promise<
    {
      creatorId: number;
      totalPoints: number;
      rank: number;
      creator?: User;
    }[]
  > {
    const conditions: any[] = [eq(pointsLedger.companyId, companyId)];

    if (campaignId) {
      conditions.push(eq(pointsLedger.campaignId, campaignId));
    }

    if (range === 'week') {
      conditions.push(sql`${pointsLedger.createdAt} >= NOW() - INTERVAL '7 days'`);
    } else if (range === 'month') {
      conditions.push(sql`${pointsLedger.createdAt} >= NOW() - INTERVAL '30 days'`);
    }

    const results = await db
      .select({
        creatorId: pointsLedger.creatorId,
        totalPoints: sql<number>`SUM(${pointsLedger.deltaPoints})::int`,
      })
      .from(pointsLedger)
      .where(and(...conditions))
      .groupBy(pointsLedger.creatorId)
      .orderBy(desc(sql`SUM(${pointsLedger.deltaPoints})`))
      .limit(limit);

    const leaderboard = await Promise.all(
      results.map(async (r, i) => {
        const creator = await this.getUser(r.creatorId);
        return {
          creatorId: r.creatorId,
          totalPoints: r.totalPoints,
          rank: i + 1,
          creator,
        };
      }),
    );

    return leaderboard;
  }

  async getCreatorPointsSummary(
    creatorId: number,
    companyId: number,
  ): Promise<{
    totalPoints: number;
    pointsByEventType: Record<string, number>;
    rank: number;
    recentEntries: PointsLedgerEntry[];
  }> {
    // Get total points
    const [totalResult] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${pointsLedger.deltaPoints}), 0)::int`,
      })
      .from(pointsLedger)
      .where(and(eq(pointsLedger.creatorId, creatorId), eq(pointsLedger.companyId, companyId)));

    // Get points by event type
    const eventTypeResults = await db
      .select({
        eventType: pointsLedger.eventType,
        points: sql<number>`SUM(${pointsLedger.deltaPoints})::int`,
      })
      .from(pointsLedger)
      .where(and(eq(pointsLedger.creatorId, creatorId), eq(pointsLedger.companyId, companyId)))
      .groupBy(pointsLedger.eventType);

    const pointsByEventType: Record<string, number> = {};
    for (const result of eventTypeResults) {
      if (result.eventType) {
        pointsByEventType[result.eventType] = result.points;
      }
    }

    // Get rank
    const allCreatorPoints = await db
      .select({
        creatorId: pointsLedger.creatorId,
        totalPoints: sql<number>`SUM(${pointsLedger.deltaPoints})::int`,
      })
      .from(pointsLedger)
      .where(eq(pointsLedger.companyId, companyId))
      .groupBy(pointsLedger.creatorId)
      .orderBy(desc(sql`SUM(${pointsLedger.deltaPoints})`));

    const rank = allCreatorPoints.findIndex((c) => c.creatorId === creatorId) + 1;

    // Get recent entries
    const recentEntries = await db
      .select()
      .from(pointsLedger)
      .where(and(eq(pointsLedger.creatorId, creatorId), eq(pointsLedger.companyId, companyId)))
      .orderBy(desc(pointsLedger.createdAt))
      .limit(20);

    return {
      totalPoints: totalResult.total,
      pointsByEventType,
      rank: rank || 0,
      recentEntries,
    };
  }

  async recordGamificationEvent(
    companyId: number,
    creatorId: number,
    eventType: string,
    eventRefId: string,
    refType: string,
    refId: number,
    metadata?: any,
    campaignId?: number,
  ): Promise<PointsLedgerEntry | null> {
    // Get applicable rules (campaign overrides brand)
    let rules: any = null;

    if (campaignId) {
      const campaignRules = await this.getCampaignPointsRules(campaignId);
      if (campaignRules?.overridesBrand) {
        rules = campaignRules.rulesJson;
      }
    }

    // Calculate points based on event type and rules
    let deltaPoints = 0;

    switch (eventType) {
      case 'post_created':
        deltaPoints = rules?.postTypes?.post_feed || 100;
        break;
      case 'reel_created':
        deltaPoints = rules?.postTypes?.reels || 150;
        break;
      case 'story_created':
        deltaPoints = rules?.postTypes?.stories || 50;
        break;
      case 'views_milestone':
        deltaPoints = rules?.viewsMilestone?.points || 10;
        break;
      case 'like_milestone':
        deltaPoints = rules?.likesMilestone?.points || 5;
        break;
      case 'comment_milestone':
        deltaPoints = rules?.commentsMilestone?.points || 10;
        break;
      case 'sale_confirmed':
        deltaPoints = rules?.salesPoints?.pointsPerSale || 100;
        break;
      case 'delivery_approved':
        deltaPoints = rules?.deliveryPoints?.approved || 100;
        break;
      case 'ontime_bonus':
        deltaPoints = rules?.deliveryPoints?.onTimeBonus || 25;
        break;
      case 'course_completed':
        deltaPoints = rules?.courseCompletionPoints || 200;
        break;
      default:
        deltaPoints = 0;
    }

    if (deltaPoints === 0) return null;

    // Insert ledger entry (eventType needs to be cast properly)
    const entry = await db
      .insert(pointsLedger)
      .values({
        companyId,
        campaignId,
        creatorId,
        deltaPoints,
        eventType: eventType as any,
        eventRefId,
        refType,
        refId,
        metadata,
      })
      .onConflictDoNothing()
      .returning();

    if (entry.length === 0) return null;
    return entry[0];
  }

  // Creator Discovery Profiles
  async createOrUpdateDiscoveryProfile(
    data: InsertCreatorDiscoveryProfile,
  ): Promise<CreatorDiscoveryProfile> {
    const existing = await db
      .select()
      .from(creatorDiscoveryProfiles)
      .where(
        and(
          eq(creatorDiscoveryProfiles.companyId, data.companyId),
          eq(creatorDiscoveryProfiles.instagramHandle, data.instagramHandle),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(creatorDiscoveryProfiles)
        .set({ ...data, lastFetchedAt: new Date() })
        .where(eq(creatorDiscoveryProfiles.id, existing[0].id))
        .returning();
      return updated;
    }

    const [profile] = await db.insert(creatorDiscoveryProfiles).values(data).returning();
    return profile;
  }

  async getCompanyDiscoveryProfiles(
    companyId: number,
    filters?: {
      query?: string;
      connected?: 'all' | 'only' | 'none';
      niche?: string;
      minFollowers?: number;
    },
  ): Promise<
    (CreatorDiscoveryProfile & { isConnected: boolean; isMember: boolean; creatorId?: number })[]
  > {
    const profiles = await db
      .select()
      .from(creatorDiscoveryProfiles)
      .where(eq(creatorDiscoveryProfiles.companyId, companyId))
      .orderBy(desc(creatorDiscoveryProfiles.followers));

    const results = await Promise.all(
      profiles.map(async (profile) => {
        const normalizedHandle = profile.instagramHandle.replace('@', '').toLowerCase();
        const linkedCreator = await db
          .select()
          .from(users)
          .where(sql`lower(replace(${users.instagram}, '@', '')) = ${normalizedHandle}`)
          .limit(1);

        const isConnected = linkedCreator.length > 0;
        const creatorId = linkedCreator[0]?.id;

        let isMember = false;
        if (isConnected && creatorId) {
          const membership = await db
            .select()
            .from(brandCreatorMemberships)
            .where(
              and(
                eq(brandCreatorMemberships.companyId, companyId),
                eq(brandCreatorMemberships.creatorId, creatorId),
                eq(brandCreatorMemberships.status, 'active'),
              ),
            )
            .limit(1);
          isMember = membership.length > 0;
        }

        return { ...profile, isConnected, isMember, creatorId };
      }),
    );

    let filtered = results;

    if (filters?.query) {
      const q = filters.query.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.instagramHandle.toLowerCase().includes(q) || p.displayName?.toLowerCase().includes(q),
      );
    }

    if (filters?.connected === 'only') {
      filtered = filtered.filter((p) => p.isConnected);
    } else if (filters?.connected === 'none') {
      filtered = filtered.filter((p) => !p.isConnected);
    }

    if (filters?.niche) {
      filtered = filtered.filter((p) => p.nicheTags?.includes(filters.niche!));
    }

    if (filters?.minFollowers) {
      filtered = filtered.filter((p) => (p.followers || 0) >= filters.minFollowers!);
    }

    return filtered;
  }

  async deleteDiscoveryProfile(id: number): Promise<void> {
    await db.delete(creatorDiscoveryProfiles).where(eq(creatorDiscoveryProfiles.id, id));
  }

  async createOrGetConversation(companyId: number, creatorId: number): Promise<Conversation> {
    const existing = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.companyId, companyId),
          eq(conversations.creatorId, creatorId),
          eq(conversations.type, 'brand'),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    const [conv] = await db
      .insert(conversations)
      .values({
        type: 'brand' as const,
        companyId,
        creatorId,
        brandId: companyId,
      })
      .returning();
    return conv;
  }

  async markMessagesAsRead(conversationId: number, userId: number): Promise<void> {
    await this.markConversationAsRead(conversationId, userId);
  }

  // ===================== ACADEMY METHODS =====================

  async getPublishedCourses(): Promise<Course[]> {
    return db
      .select()
      .from(courses)
      .where(eq(courses.isPublished, true))
      .orderBy(asc(courses.createdAt));
  }

  async getCourse(courseId: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, courseId));
    return course;
  }

  async getCourseBySlug(slug: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.slug, slug));
    return course;
  }

  async getCourseWithStructure(courseId: number): Promise<{
    course: Course;
    modules: (CourseModule & { lessons: CourseLesson[] })[];
  } | null> {
    const [course] = await db.select().from(courses).where(eq(courses.id, courseId));
    if (!course) return null;

    const mods = await db
      .select()
      .from(courseModules)
      .where(eq(courseModules.courseId, courseId))
      .orderBy(asc(courseModules.order));

    const modulesWithLessons = await Promise.all(
      mods.map(async (mod) => {
        const lessons = await db
          .select()
          .from(courseLessons)
          .where(eq(courseLessons.moduleId, mod.id))
          .orderBy(asc(courseLessons.order));
        return { ...mod, lessons };
      }),
    );

    return { course, modules: modulesWithLessons };
  }

  async getCreatorCoursesWithProgress(creatorId: number): Promise<
    {
      course: Course;
      progress: CreatorCourseProgress | null;
      totalLessons: number;
      completedLessons: number;
    }[]
  > {
    const allCourses = await this.getPublishedCourses();

    return Promise.all(
      allCourses.map(async (course) => {
        const [progress] = await db
          .select()
          .from(creatorCourseProgress)
          .where(
            and(
              eq(creatorCourseProgress.creatorId, creatorId),
              eq(creatorCourseProgress.courseId, course.id),
            ),
          );

        // Count total lessons
        const modules = await db
          .select()
          .from(courseModules)
          .where(eq(courseModules.courseId, course.id));
        const moduleIds = modules.map((m) => m.id);

        let totalLessons = 0;
        let completedLessons = 0;

        if (moduleIds.length > 0) {
          const lessons = await db
            .select()
            .from(courseLessons)
            .where(inArray(courseLessons.moduleId, moduleIds));
          totalLessons = lessons.length;

          const lessonIds = lessons.map((l) => l.id);
          if (lessonIds.length > 0) {
            const completedList = await db
              .select()
              .from(creatorLessonProgress)
              .where(
                and(
                  eq(creatorLessonProgress.creatorId, creatorId),
                  inArray(creatorLessonProgress.lessonId, lessonIds),
                ),
              );
            completedLessons = completedList.length;
          }
        }

        return { course, progress: progress || null, totalLessons, completedLessons };
      }),
    );
  }

  async startCourseForCreator(creatorId: number, courseId: number): Promise<CreatorCourseProgress> {
    // Check if already started
    const [existing] = await db
      .select()
      .from(creatorCourseProgress)
      .where(
        and(
          eq(creatorCourseProgress.creatorId, creatorId),
          eq(creatorCourseProgress.courseId, courseId),
        ),
      );

    if (existing) return existing;

    // Get first lesson
    const modules = await db
      .select()
      .from(courseModules)
      .where(eq(courseModules.courseId, courseId))
      .orderBy(asc(courseModules.order))
      .limit(1);

    let firstLessonId: number | null = null;
    if (modules.length > 0) {
      const [firstLesson] = await db
        .select()
        .from(courseLessons)
        .where(eq(courseLessons.moduleId, modules[0].id))
        .orderBy(asc(courseLessons.order))
        .limit(1);
      firstLessonId = firstLesson?.id || null;
    }

    const [progress] = await db
      .insert(creatorCourseProgress)
      .values({
        creatorId,
        courseId,
        progressPct: 0,
        currentLessonId: firstLessonId,
      })
      .returning();

    return progress;
  }

  async completeLessonForCreator(
    creatorId: number,
    lessonId: number,
  ): Promise<{ lessonProgress: CreatorLessonProgress; courseProgress: CreatorCourseProgress }> {
    // Get lesson and its module/course
    const [lesson] = await db.select().from(courseLessons).where(eq(courseLessons.id, lessonId));
    if (!lesson) throw new Error('Lição não encontrada');

    const [module] = await db
      .select()
      .from(courseModules)
      .where(eq(courseModules.id, lesson.moduleId));
    if (!module) throw new Error('Módulo não encontrado');

    const courseId = module.courseId;

    // Mark lesson complete (upsert)
    const [existingLessonProgress] = await db
      .select()
      .from(creatorLessonProgress)
      .where(
        and(
          eq(creatorLessonProgress.creatorId, creatorId),
          eq(creatorLessonProgress.lessonId, lessonId),
        ),
      );

    let lessonProgress: CreatorLessonProgress;
    if (existingLessonProgress) {
      lessonProgress = existingLessonProgress;
    } else {
      [lessonProgress] = await db
        .insert(creatorLessonProgress)
        .values({
          creatorId,
          lessonId,
        })
        .returning();
    }

    // Recalculate course progress
    const allModules = await db
      .select()
      .from(courseModules)
      .where(eq(courseModules.courseId, courseId));
    const moduleIds = allModules.map((m) => m.id);

    const allLessons = await db
      .select()
      .from(courseLessons)
      .where(inArray(courseLessons.moduleId, moduleIds))
      .orderBy(asc(courseModules.order), asc(courseLessons.order));
    const totalLessons = allLessons.length;

    const completedLessons = await db
      .select()
      .from(creatorLessonProgress)
      .where(
        and(
          eq(creatorLessonProgress.creatorId, creatorId),
          inArray(
            creatorLessonProgress.lessonId,
            allLessons.map((l) => l.id),
          ),
        ),
      );

    const progressPct =
      totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0;
    const completedAt = progressPct >= 100 ? new Date() : null;

    // Find next incomplete lesson
    const completedLessonIds = new Set(completedLessons.map((c) => c.lessonId));
    const nextLesson = allLessons.find((l) => !completedLessonIds.has(l.id));

    // Ensure course progress exists
    let [courseProgress] = await db
      .select()
      .from(creatorCourseProgress)
      .where(
        and(
          eq(creatorCourseProgress.creatorId, creatorId),
          eq(creatorCourseProgress.courseId, courseId),
        ),
      );

    if (!courseProgress) {
      [courseProgress] = await db
        .insert(creatorCourseProgress)
        .values({
          creatorId,
          courseId,
          progressPct,
          currentLessonId: nextLesson?.id || null,
          completedAt,
        })
        .returning();
    } else {
      [courseProgress] = await db
        .update(creatorCourseProgress)
        .set({
          progressPct,
          currentLessonId: nextLesson?.id || null,
          completedAt,
          updatedAt: new Date(),
        })
        .where(eq(creatorCourseProgress.id, courseProgress.id))
        .returning();
    }

    return { lessonProgress, courseProgress };
  }

  async getCreatorLessonProgress(creatorId: number, courseId: number): Promise<number[]> {
    const modules = await db
      .select()
      .from(courseModules)
      .where(eq(courseModules.courseId, courseId));
    const moduleIds = modules.map((m) => m.id);

    if (moduleIds.length === 0) return [];

    const lessons = await db
      .select()
      .from(courseLessons)
      .where(inArray(courseLessons.moduleId, moduleIds));
    const lessonIds = lessons.map((l) => l.id);

    if (lessonIds.length === 0) return [];

    const completed = await db
      .select()
      .from(creatorLessonProgress)
      .where(
        and(
          eq(creatorLessonProgress.creatorId, creatorId),
          inArray(creatorLessonProgress.lessonId, lessonIds),
        ),
      );

    return completed.map((c) => c.lessonId);
  }

  async getCreatorAcademySummary(creatorId: number): Promise<{
    coursesInProgress: number;
    coursesCompleted: number;
    totalMinutesLearned: number;
    nextCourse: { id: number; title: string; progressPct: number } | null;
  }> {
    const coursesWithProgress = await this.getCreatorCoursesWithProgress(creatorId);

    let coursesInProgress = 0;
    let coursesCompleted = 0;
    let totalMinutesLearned = 0;
    let nextCourse: { id: number; title: string; progressPct: number } | null = null;

    for (const { course, progress, totalLessons, completedLessons } of coursesWithProgress) {
      if (progress) {
        if (progress.completedAt) {
          coursesCompleted++;
          totalMinutesLearned += course.estimatedMinutes;
        } else {
          coursesInProgress++;
          const pct = totalLessons > 0 ? completedLessons / totalLessons : 0;
          totalMinutesLearned += Math.round(course.estimatedMinutes * pct);

          // Set as next course if not set or has higher progress
          if (!nextCourse || pct > 0) {
            nextCourse = { id: course.id, title: course.title, progressPct: Math.round(pct * 100) };
          }
        }
      }
    }

    // If no course in progress, suggest first unstarted course
    if (!nextCourse) {
      const unstarted = coursesWithProgress.find((c) => !c.progress);
      if (unstarted) {
        nextCourse = { id: unstarted.course.id, title: unstarted.course.title, progressPct: 0 };
      }
    }

    return { coursesInProgress, coursesCompleted, totalMinutesLearned, nextCourse };
  }

  async getAllCourses(): Promise<Course[]> {
    return await db.select().from(courses).orderBy(desc(courses.createdAt));
  }

  async createCourse(data: InsertCourse): Promise<Course> {
    const [course] = await db.insert(courses).values(data).returning();
    return course;
  }

  async updateCourse(id: number, data: Partial<InsertCourse>): Promise<Course | undefined> {
    const [updated] = await db.update(courses).set(data).where(eq(courses.id, id)).returning();
    return updated;
  }

  async deleteCourse(id: number): Promise<void> {
    await db.delete(courses).where(eq(courses.id, id));
  }

  async createCourseModule(data: InsertCourseModule): Promise<CourseModule> {
    const [module] = await db.insert(courseModules).values(data).returning();
    return module;
  }

  async updateCourseModule(
    id: number,
    data: Partial<InsertCourseModule>,
  ): Promise<CourseModule | undefined> {
    const [updated] = await db
      .update(courseModules)
      .set(data)
      .where(eq(courseModules.id, id))
      .returning();
    return updated;
  }

  async deleteCourseModule(id: number): Promise<void> {
    await db.delete(courseModules).where(eq(courseModules.id, id));
  }

  async createCourseLesson(data: InsertCourseLesson): Promise<CourseLesson> {
    const [lesson] = await db.insert(courseLessons).values(data).returning();
    return lesson;
  }

  async updateCourseLesson(
    id: number,
    data: Partial<InsertCourseLesson>,
  ): Promise<CourseLesson | undefined> {
    const [updated] = await db
      .update(courseLessons)
      .set(data)
      .where(eq(courseLessons.id, id))
      .returning();
    return updated;
  }

  async deleteCourseLesson(id: number): Promise<void> {
    await db.delete(courseLessons).where(eq(courseLessons.id, id));
  }

  async getLesson(lessonId: number): Promise<CourseLesson | undefined> {
    const [lesson] = await db.select().from(courseLessons).where(eq(courseLessons.id, lessonId));
    return lesson;
  }

  // ========== INSPIRATIONS (Swipe File) ==========
  async listInspirations(filters: {
    query?: string;
    platform?: string;
    format?: string;
    tag?: string;
    niche?: string;
    scope?: string;
    brandId?: number;
  }): Promise<Inspiration[]> {
    const query = db.select().from(inspirations);
    const conditions: SQL[] = [];

    if (filters.scope) {
      conditions.push(sql`${inspirations.scope} = ${filters.scope}`);
    }
    if (filters.brandId) {
      conditions.push(sql`${inspirations.brandId} = ${filters.brandId}`);
    }
    if (filters.platform) {
      conditions.push(sql`${inspirations.platform} = ${filters.platform}`);
    }
    if (filters.format) {
      conditions.push(sql`${inspirations.format} = ${filters.format}`);
    }
    if (filters.query) {
      conditions.push(
        or(
          sql`${inspirations.title} ILIKE ${'%' + filters.query + '%'}`,
          sql`${inspirations.description} ILIKE ${'%' + filters.query + '%'}`,
        )!,
      );
    }
    if (filters.tag) {
      conditions.push(sql`${filters.tag} = ANY(${inspirations.tags})`);
    }
    if (filters.niche) {
      conditions.push(sql`${filters.niche} = ANY(${inspirations.nicheTags})`);
    }

    if (conditions.length > 0) {
      return await db
        .select()
        .from(inspirations)
        .where(and(...conditions))
        .orderBy(desc(inspirations.createdAt));
    }
    return await db.select().from(inspirations).orderBy(desc(inspirations.createdAt));
  }

  async getInspiration(id: number): Promise<Inspiration | undefined> {
    const [inspiration] = await db.select().from(inspirations).where(eq(inspirations.id, id));
    return inspiration;
  }

  async createInspiration(data: InsertInspiration): Promise<Inspiration> {
    const [inspiration] = await db.insert(inspirations).values(data).returning();
    return inspiration;
  }

  async updateInspiration(
    id: number,
    data: Partial<InsertInspiration>,
  ): Promise<Inspiration | undefined> {
    const [updated] = await db
      .update(inspirations)
      .set(data)
      .where(eq(inspirations.id, id))
      .returning();
    return updated;
  }

  async deleteInspiration(id: number): Promise<void> {
    await db.delete(inspirations).where(eq(inspirations.id, id));
  }

  async getBrandInspirations(brandId: number): Promise<Inspiration[]> {
    return await db
      .select()
      .from(inspirations)
      .where(and(eq(inspirations.scope, 'brand'), eq(inspirations.brandId, brandId)))
      .orderBy(desc(inspirations.createdAt));
  }

  async saveInspiration(
    creatorId: number,
    inspirationId: number,
  ): Promise<CreatorSavedInspiration> {
    const existing = await db
      .select()
      .from(creatorSavedInspirations)
      .where(
        and(
          eq(creatorSavedInspirations.creatorId, creatorId),
          eq(creatorSavedInspirations.inspirationId, inspirationId),
        ),
      );
    if (existing.length > 0) {
      return existing[0];
    }
    const [saved] = await db
      .insert(creatorSavedInspirations)
      .values({ creatorId, inspirationId })
      .returning();
    return saved;
  }

  async unsaveInspiration(creatorId: number, inspirationId: number): Promise<void> {
    await db
      .delete(creatorSavedInspirations)
      .where(
        and(
          eq(creatorSavedInspirations.creatorId, creatorId),
          eq(creatorSavedInspirations.inspirationId, inspirationId),
        ),
      );
  }

  async getCreatorSavedInspirations(
    creatorId: number,
  ): Promise<(CreatorSavedInspiration & { inspiration: Inspiration })[]> {
    const saved = await db
      .select({
        saved: creatorSavedInspirations,
        inspiration: inspirations,
      })
      .from(creatorSavedInspirations)
      .innerJoin(inspirations, eq(creatorSavedInspirations.inspirationId, inspirations.id))
      .where(eq(creatorSavedInspirations.creatorId, creatorId))
      .orderBy(desc(creatorSavedInspirations.createdAt));
    return saved.map((s) => ({ ...s.saved, inspiration: s.inspiration }));
  }

  async isInspirationSaved(creatorId: number, inspirationId: number): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(creatorSavedInspirations)
      .where(
        and(
          eq(creatorSavedInspirations.creatorId, creatorId),
          eq(creatorSavedInspirations.inspirationId, inspirationId),
        ),
      );
    return !!existing;
  }

  // Collections
  async createInspirationCollection(
    creatorId: number,
    title: string,
  ): Promise<InspirationCollection> {
    const [collection] = await db
      .insert(inspirationCollections)
      .values({ creatorId, title })
      .returning();
    return collection;
  }

  async getCreatorCollections(
    creatorId: number,
  ): Promise<(InspirationCollection & { itemCount: number })[]> {
    const collections = await db
      .select()
      .from(inspirationCollections)
      .where(eq(inspirationCollections.creatorId, creatorId))
      .orderBy(desc(inspirationCollections.createdAt));

    const result = [];
    for (const collection of collections) {
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(inspirationCollectionItems)
        .where(eq(inspirationCollectionItems.collectionId, collection.id));
      result.push({ ...collection, itemCount: Number(countResult?.count || 0) });
    }
    return result;
  }

  async getCollectionWithItems(
    collectionId: number,
    creatorId: number,
  ): Promise<{
    collection: InspirationCollection;
    items: (InspirationCollectionItem & { inspiration: Inspiration })[];
  } | null> {
    const [collection] = await db
      .select()
      .from(inspirationCollections)
      .where(
        and(
          eq(inspirationCollections.id, collectionId),
          eq(inspirationCollections.creatorId, creatorId),
        ),
      );
    if (!collection) return null;

    const items = await db
      .select({
        item: inspirationCollectionItems,
        inspiration: inspirations,
      })
      .from(inspirationCollectionItems)
      .innerJoin(inspirations, eq(inspirationCollectionItems.inspirationId, inspirations.id))
      .where(eq(inspirationCollectionItems.collectionId, collectionId))
      .orderBy(desc(inspirationCollectionItems.createdAt));

    return {
      collection,
      items: items.map((i) => ({ ...i.item, inspiration: i.inspiration })),
    };
  }

  async addToCollection(
    collectionId: number,
    inspirationId: number,
    creatorId: number,
  ): Promise<InspirationCollectionItem | null> {
    const [collection] = await db
      .select()
      .from(inspirationCollections)
      .where(
        and(
          eq(inspirationCollections.id, collectionId),
          eq(inspirationCollections.creatorId, creatorId),
        ),
      );
    if (!collection) return null;

    const existing = await db
      .select()
      .from(inspirationCollectionItems)
      .where(
        and(
          eq(inspirationCollectionItems.collectionId, collectionId),
          eq(inspirationCollectionItems.inspirationId, inspirationId),
        ),
      );
    if (existing.length > 0) return existing[0];

    const [item] = await db
      .insert(inspirationCollectionItems)
      .values({ collectionId, inspirationId })
      .returning();
    return item;
  }

  async removeFromCollection(
    collectionId: number,
    inspirationId: number,
    creatorId: number,
  ): Promise<void> {
    const [collection] = await db
      .select()
      .from(inspirationCollections)
      .where(
        and(
          eq(inspirationCollections.id, collectionId),
          eq(inspirationCollections.creatorId, creatorId),
        ),
      );
    if (!collection) return;

    await db
      .delete(inspirationCollectionItems)
      .where(
        and(
          eq(inspirationCollectionItems.collectionId, collectionId),
          eq(inspirationCollectionItems.inspirationId, inspirationId),
        ),
      );
  }

  async deleteCollection(collectionId: number, creatorId: number): Promise<void> {
    await db
      .delete(inspirationCollections)
      .where(
        and(
          eq(inspirationCollections.id, collectionId),
          eq(inspirationCollections.creatorId, creatorId),
        ),
      );
  }

  async updateCollection(
    collectionId: number,
    creatorId: number,
    title: string,
  ): Promise<InspirationCollection | null> {
    const [updated] = await db
      .update(inspirationCollections)
      .set({ title })
      .where(
        and(
          eq(inspirationCollections.id, collectionId),
          eq(inspirationCollections.creatorId, creatorId),
        ),
      )
      .returning();
    return updated || null;
  }

  // Campaign inspirations (for companies)
  async addInspirationToCampaign(
    campaignId: number,
    inspirationId: number,
  ): Promise<CampaignInspiration> {
    const existing = await db
      .select()
      .from(campaignInspirations)
      .where(
        and(
          eq(campaignInspirations.campaignId, campaignId),
          eq(campaignInspirations.inspirationId, inspirationId),
        ),
      );
    if (existing.length > 0) return existing[0];

    const [item] = await db
      .insert(campaignInspirations)
      .values({ campaignId, inspirationId })
      .returning();
    return item;
  }

  async removeInspirationFromCampaign(campaignId: number, inspirationId: number): Promise<void> {
    await db
      .delete(campaignInspirations)
      .where(
        and(
          eq(campaignInspirations.campaignId, campaignId),
          eq(campaignInspirations.inspirationId, inspirationId),
        ),
      );
  }

  async getCampaignInspirations(
    campaignId: number,
  ): Promise<(CampaignInspiration & { inspiration: Inspiration })[]> {
    const items = await db
      .select({
        campaignInspiration: campaignInspirations,
        inspiration: inspirations,
      })
      .from(campaignInspirations)
      .innerJoin(inspirations, eq(campaignInspirations.inspirationId, inspirations.id))
      .where(eq(campaignInspirations.campaignId, campaignId))
      .orderBy(desc(campaignInspirations.createdAt));
    return items.map((i) => ({ ...i.campaignInspiration, inspiration: i.inspiration }));
  }

  // ==========================================
  // OPERATIONS: SEEDING & ADDRESSES
  // ==========================================

  async getCreatorAddress(creatorId: number): Promise<CreatorAddress | undefined> {
    const [address] = await db
      .select()
      .from(creatorAddresses)
      .where(eq(creatorAddresses.creatorId, creatorId))
      .orderBy(desc(creatorAddresses.isDefault))
      .limit(1);
    return address;
  }

  async createCreatorAddress(data: InsertCreatorAddress): Promise<CreatorAddress> {
    const [address] = await db.insert(creatorAddresses).values(data).returning();
    return address;
  }

  async updateCreatorAddress(
    id: number,
    creatorId: number,
    data: Partial<InsertCreatorAddress>,
  ): Promise<CreatorAddress | undefined> {
    const [address] = await db
      .update(creatorAddresses)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(creatorAddresses.id, id), eq(creatorAddresses.creatorId, creatorId)))
      .returning();
    return address;
  }

  async getBrandReviewQueue(
    companyId: number,
  ): Promise<(Deliverable & { application: Application; campaign: Campaign; creator: User })[]> {
    const results = await db
      .select({
        deliverable: deliverables,
        application: applications,
        campaign: campaigns,
        creator: users,
      })
      .from(deliverables)
      .innerJoin(applications, eq(deliverables.applicationId, applications.id))
      .innerJoin(campaigns, eq(applications.campaignId, campaigns.id))
      .innerJoin(users, eq(applications.creatorId, users.id))
      .where(eq(campaigns.companyId, companyId))
      .orderBy(asc(deliverables.uploadedAt));
    return results.map((r) => ({
      ...r.deliverable,
      application: r.application,
      campaign: r.campaign,
      creator: r.creator,
    }));
  }

  async getBrandPendencias(companyId: number): Promise<{
    noResponse: (Application & { campaign: Campaign; creator: User })[];
    overdueDeliverables: (Deliverable & {
      application: Application;
      campaign: Campaign;
      creator: User;
    })[];
  }> {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Get applications that are accepted but haven't progressed (still in 'aceito' status for 3+ days)
    const noResponseResults = await db
      .select({
        application: applications,
        campaign: campaigns,
        creator: users,
      })
      .from(applications)
      .innerJoin(campaigns, eq(applications.campaignId, campaigns.id))
      .innerJoin(users, eq(applications.creatorId, users.id))
      .where(
        and(
          eq(campaigns.companyId, companyId),
          eq(applications.status, 'accepted'),
          lte(applications.appliedAt, threeDaysAgo),
          eq(applications.creatorWorkflowStatus, 'aceito'),
        ),
      )
      .orderBy(asc(applications.appliedAt));

    // Deliverables table doesn't have status/dueDate, so we return empty for now
    // This can be enhanced when deliverable review status is added to the schema
    const overdueResults: {
      deliverable: Deliverable;
      application: Application;
      campaign: Campaign;
      creator: User;
    }[] = [];

    return {
      noResponse: noResponseResults.map((r) => ({
        ...r.application,
        campaign: r.campaign,
        creator: r.creator,
      })),
      overdueDeliverables: overdueResults.map((r) => ({
        ...r.deliverable,
        application: r.application,
        campaign: r.campaign,
        creator: r.creator,
      })),
    };
  }

  async getBrandPendingInvites(
    companyId: number,
  ): Promise<(CampaignInvite & { campaign: Campaign; creator: User })[]> {
    const results = await db
      .select({
        invite: campaignInvites,
        campaign: campaigns,
        creator: users,
      })
      .from(campaignInvites)
      .innerJoin(campaigns, eq(campaignInvites.campaignId, campaigns.id))
      .innerJoin(users, eq(campaignInvites.creatorId, users.id))
      .where(and(eq(campaigns.companyId, companyId), eq(campaignInvites.status, 'pending')))
      .orderBy(desc(campaignInvites.createdAt));
    return results.map((r) => ({ ...r.invite, campaign: r.campaign, creator: r.creator }));
  }

  async getBrandDiscoveryQueue(
    companyId: number,
  ): Promise<(CreatorDiscoveryProfile & { creator: User })[]> {
    // Get discovery profiles that haven't been linked to a creator yet
    const profiles = await db
      .select()
      .from(creatorDiscoveryProfiles)
      .where(
        and(
          eq(creatorDiscoveryProfiles.companyId, companyId),
          isNull(creatorDiscoveryProfiles.linkedCreatorId),
        ),
      )
      .orderBy(desc(creatorDiscoveryProfiles.createdAt));

    // Return profiles without linked creator data (since they're not linked)
    return profiles.map((profile) => ({
      ...profile,
      creator: null as unknown as User,
    }));
  }

  // ============================================================
  // UNIFIED MESSAGING SYSTEM
  // ============================================================

  async getOrCreateConversation(
    type: ConversationType,
    creatorId: number,
    companyId: number,
    brandId?: number,
    campaignId?: number,
  ): Promise<Conversation> {
    let whereClause;
    if (type === 'brand' && brandId) {
      whereClause = and(
        eq(conversations.type, 'brand'),
        eq(conversations.brandId, brandId),
        eq(conversations.creatorId, creatorId),
      );
    } else if (type === 'campaign' && campaignId) {
      whereClause = and(
        eq(conversations.type, 'campaign'),
        eq(conversations.campaignId, campaignId),
        eq(conversations.creatorId, creatorId),
      );
    } else {
      throw new Error('Invalid conversation parameters');
    }

    const [existing] = await db.select().from(conversations).where(whereClause);
    if (existing) return existing;

    const [created] = await db
      .insert(conversations)
      .values({
        type,
        creatorId,
        companyId,
        brandId: type === 'brand' ? brandId : null,
        campaignId: type === 'campaign' ? campaignId : null,
      })
      .returning();
    return created;
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conv;
  }

  async updateConversationStatus(
    conversationId: number,
    status: 'open' | 'resolved',
  ): Promise<void> {
    await db.update(conversations).set({ status }).where(eq(conversations.id, conversationId));
  }

  async getCreatorConversations(
    creatorId: number,
    typeFilter?: ConversationType,
  ): Promise<
    {
      conversation: Conversation;
      otherUser: { id: number; name: string; avatar: string | null };
      lastMessage: { body: string; createdAt: Date } | null;
      unreadCount: number;
      campaignTitle?: string;
      brandName?: string;
    }[]
  > {
    let whereClause = eq(conversations.creatorId, creatorId);
    if (typeFilter) {
      whereClause = and(whereClause, eq(conversations.type, typeFilter)) as any;
    }

    const convList = await db
      .select()
      .from(conversations)
      .where(whereClause)
      .orderBy(desc(conversations.lastMessageAt));

    const results = [];
    for (const conv of convList) {
      const [company] = await db.select().from(companies).where(eq(companies.id, conv.companyId));
      const [lastMsg] = await db
        .select()
        .from(convMessages)
        .where(eq(convMessages.conversationId, conv.id))
        .orderBy(desc(convMessages.createdAt))
        .limit(1);

      const [readRecord] = await db
        .select()
        .from(messageReads)
        .where(and(eq(messageReads.conversationId, conv.id), eq(messageReads.userId, creatorId)));

      const unreadCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(convMessages)
        .where(
          and(
            eq(convMessages.conversationId, conv.id),
            readRecord ? sql`${convMessages.createdAt} > ${readRecord.lastReadAt}` : sql`1=1`,
            ne(convMessages.senderUserId, creatorId),
          ),
        );

      let campaignTitle, brandName;
      if (conv.type === 'campaign' && conv.campaignId) {
        const [campaign] = await db
          .select()
          .from(campaigns)
          .where(eq(campaigns.id, conv.campaignId));
        campaignTitle = campaign?.title;
      }
      if (conv.brandId) {
        const [brand] = await db.select().from(companies).where(eq(companies.id, conv.brandId));
        brandName = brand?.name;
      }

      results.push({
        conversation: conv,
        otherUser: { id: company.id, name: company.name, avatar: company.logo },
        lastMessage: lastMsg ? { body: lastMsg.body, createdAt: lastMsg.createdAt } : null,
        unreadCount: Number(unreadCount[0]?.count || 0),
        campaignTitle,
        brandName,
      });
    }
    return results;
  }

  async getCompanyConversations(
    companyId: number,
    brandId: number,
    typeFilter?: ConversationType,
  ): Promise<
    {
      conversation: Conversation;
      creator: { id: number; name: string; avatar: string | null; instagramHandle: string | null };
      lastMessage: { body: string; createdAt: Date } | null;
      unreadCount: number;
      campaignTitle?: string;
    }[]
  > {
    const convList = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.companyId, companyId),
          eq(conversations.brandId, brandId),
          typeFilter ? eq(conversations.type, typeFilter) : sql`1=1`,
        ),
      )
      .orderBy(desc(conversations.lastMessageAt));

    const results = [];
    for (const conv of convList) {
      const [creator] = await db.select().from(users).where(eq(users.id, conv.creatorId));
      const [lastMsg] = await db
        .select()
        .from(convMessages)
        .where(eq(convMessages.conversationId, conv.id))
        .orderBy(desc(convMessages.createdAt))
        .limit(1);

      const [companyUser] = await db
        .select()
        .from(companyMembers)
        .where(eq(companyMembers.companyId, companyId));

      const [readRecord] = await db
        .select()
        .from(messageReads)
        .where(
          and(
            eq(messageReads.conversationId, conv.id),
            companyUser ? eq(messageReads.userId, companyUser.userId) : sql`1=0`,
          ),
        );

      const unreadCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(convMessages)
        .where(
          and(
            eq(convMessages.conversationId, conv.id),
            readRecord ? sql`${convMessages.createdAt} > ${readRecord.lastReadAt}` : sql`1=1`,
            ne(convMessages.senderUserId, companyUser?.userId || 0),
          ),
        );

      let campaignTitle;
      if (conv.type === 'campaign' && conv.campaignId) {
        const [campaign] = await db
          .select()
          .from(campaigns)
          .where(eq(campaigns.id, conv.campaignId));
        campaignTitle = campaign?.title;
      }

      results.push({
        conversation: conv,
        creator: {
          id: creator.id,
          name: creator.name,
          avatar: creator.avatar,
          instagramHandle: creator.instagram,
        },
        lastMessage: lastMsg ? { body: lastMsg.body, createdAt: lastMsg.createdAt } : null,
        unreadCount: Number(unreadCount[0]?.count || 0),
        campaignTitle,
      });
    }
    return results;
  }

  async getConversationMessages(
    conversationId: number,
    limit = 50,
    offset = 0,
  ): Promise<(ConvMessage & { sender: { id: number; name: string; avatar: string | null } })[]> {
    const msgs = await db
      .select({
        message: convMessages,
        sender: users,
      })
      .from(convMessages)
      .innerJoin(users, eq(convMessages.senderUserId, users.id))
      .where(eq(convMessages.conversationId, conversationId))
      .orderBy(desc(convMessages.createdAt))
      .limit(limit)
      .offset(offset);

    return msgs
      .map((m) => ({
        ...m.message,
        sender: { id: m.sender.id, name: m.sender.name, avatar: m.sender.avatar },
      }))
      .reverse();
  }

  async sendConversationMessage(
    conversationId: number,
    senderUserId: number,
    body: string,
  ): Promise<ConvMessage> {
    const [msg] = await db
      .insert(convMessages)
      .values({
        conversationId,
        senderUserId,
        body,
      })
      .returning();

    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conversationId));

    return msg;
  }

  async markConversationAsRead(conversationId: number, userId: number): Promise<void> {
    await db
      .insert(messageReads)
      .values({ conversationId, userId, lastReadAt: new Date() })
      .onConflictDoUpdate({
        target: [messageReads.conversationId, messageReads.userId],
        set: { lastReadAt: new Date() },
      });
  }

  async getUnreadConversationCount(
    userId: number,
    role: 'creator' | 'company',
    companyId?: number,
    brandId?: number,
  ): Promise<number> {
    let convList;
    if (role === 'creator') {
      convList = await db.select().from(conversations).where(eq(conversations.creatorId, userId));
    } else if (companyId && brandId) {
      convList = await db
        .select()
        .from(conversations)
        .where(and(eq(conversations.companyId, companyId), eq(conversations.brandId, brandId)));
    } else if (companyId) {
      convList = await db
        .select()
        .from(conversations)
        .where(eq(conversations.companyId, companyId));
    } else {
      return 0;
    }

    let total = 0;
    for (const conv of convList) {
      const [readRecord] = await db
        .select()
        .from(messageReads)
        .where(and(eq(messageReads.conversationId, conv.id), eq(messageReads.userId, userId)));

      const [unread] = await db
        .select({ count: sql<number>`count(*)` })
        .from(convMessages)
        .where(
          and(
            eq(convMessages.conversationId, conv.id),
            readRecord ? sql`${convMessages.createdAt} > ${readRecord.lastReadAt}` : sql`1=1`,
            ne(convMessages.senderUserId, userId),
          ),
        );
      total += Number(unread?.count || 0);
    }
    return total;
  }

  async getUnreadConversations(
    userId: number,
    role: 'creator' | 'company',
    companyId?: number,
  ): Promise<any[]> {
    let whereClause;
    if (role === 'creator') {
      whereClause = eq(conversations.creatorId, userId);
    } else if (companyId) {
      whereClause = eq(conversations.companyId, companyId);
    } else {
      return [];
    }

    const userConvs = await db.select().from(conversations).where(whereClause);

    const results: any[] = [];
    for (const conv of userConvs) {
      const [readRecord] = await db
        .select()
        .from(messageReads)
        .where(and(eq(messageReads.conversationId, conv.id), eq(messageReads.userId, userId)));

      const [unreadResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(convMessages)
        .where(
          and(
            eq(convMessages.conversationId, conv.id),
            readRecord ? sql`${convMessages.createdAt} > ${readRecord.lastReadAt}` : sql`1=1`,
            ne(convMessages.senderUserId, userId),
          ),
        );

      const unreadCount = Number(unreadResult?.count || 0);
      if (unreadCount === 0) continue;

      const [latestMsg] = await db
        .select()
        .from(convMessages)
        .where(eq(convMessages.conversationId, conv.id))
        .orderBy(desc(convMessages.createdAt))
        .limit(1);

      const sender = latestMsg
        ? await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, latestMsg.senderUserId))
            .then((r) => r[0])
        : null;

      let applicationId = null;
      if (conv.campaignId) {
        const [app] = await db
          .select({ id: applications.id })
          .from(applications)
          .where(
            and(
              eq(applications.campaignId, conv.campaignId),
              eq(applications.creatorId, conv.creatorId),
            ),
          )
          .limit(1);
        applicationId = app?.id || null;
      }

      results.push({
        conversationId: conv.id,
        campaignId: conv.campaignId,
        applicationId,
        lastMessage: latestMsg?.body || null,
        senderName: sender?.name || 'Desconhecido',
        unreadCount,
        lastMessageAt: conv.lastMessageAt,
      });
    }

    return results.sort((a, b) => {
      const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  async getAllConversations(
    userId: number,
    role: 'creator' | 'company',
    companyId?: number,
  ): Promise<any[]> {
    let whereClause;
    if (role === 'creator') {
      whereClause = eq(conversations.creatorId, userId);
    } else if (companyId) {
      whereClause = eq(conversations.companyId, companyId);
    } else {
      return [];
    }

    const userConvs = await db.select().from(conversations).where(whereClause);

    const results: any[] = [];
    for (const conv of userConvs) {
      const [latestMsg] = await db
        .select()
        .from(convMessages)
        .where(eq(convMessages.conversationId, conv.id))
        .orderBy(desc(convMessages.createdAt))
        .limit(1);

      const sender = latestMsg
        ? await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, latestMsg.senderUserId))
            .then((r) => r[0])
        : null;

      const [readRecord] = await db
        .select()
        .from(messageReads)
        .where(and(eq(messageReads.conversationId, conv.id), eq(messageReads.userId, userId)));

      const [unreadResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(convMessages)
        .where(
          and(
            eq(convMessages.conversationId, conv.id),
            readRecord ? sql`${convMessages.createdAt} > ${readRecord.lastReadAt}` : sql`1=1`,
            ne(convMessages.senderUserId, userId),
          ),
        );

      results.push({
        conversationId: conv.id,
        campaignId: conv.campaignId,
        type: conv.type,
        status: conv.status,
        lastMessage: latestMsg?.body || null,
        senderName: sender?.name || null,
        unreadCount: Number(unreadResult?.count || 0),
        lastMessageAt: conv.lastMessageAt,
        createdAt: conv.createdAt,
      });
    }

    return results.sort((a, b) => {
      const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  // Taxonomy Operations
  async getTags(type?: string): Promise<Tag[]> {
    if (type) {
      return await db
        .select()
        .from(tags)
        .where(eq(tags.type, type as any))
        .orderBy(tags.name);
    }
    return await db.select().from(tags).orderBy(tags.type, tags.name);
  }

  async getCreatorTags(creatorId: number): Promise<Tag[]> {
    const results = await db
      .select({ tag: tags })
      .from(creatorTags)
      .innerJoin(tags, eq(creatorTags.tagId, tags.id))
      .where(eq(creatorTags.creatorId, creatorId));
    return results.map((r) => r.tag);
  }

  async setCreatorTags(creatorId: number, tagIds: number[]): Promise<void> {
    await db.delete(creatorTags).where(eq(creatorTags.creatorId, creatorId));
    if (tagIds.length > 0) {
      await db.insert(creatorTags).values(tagIds.map((tagId) => ({ creatorId, tagId })));
    }
  }

  async getBrandTags(brandId: number): Promise<Tag[]> {
    const results = await db
      .select({ tag: tags })
      .from(brandTags)
      .innerJoin(tags, eq(brandTags.tagId, tags.id))
      .where(eq(brandTags.brandId, brandId));
    return results.map((r) => r.tag);
  }

  async setBrandTags(brandId: number, tagIds: number[]): Promise<void> {
    await db.delete(brandTags).where(eq(brandTags.brandId, brandId));
    if (tagIds.length > 0) {
      await db.insert(brandTags).values(tagIds.map((tagId) => ({ brandId, tagId })));
    }
  }

  async getCampaignTags(campaignId: number): Promise<Tag[]> {
    const results = await db
      .select({ tag: tags })
      .from(campaignTags)
      .innerJoin(tags, eq(campaignTags.tagId, tags.id))
      .where(eq(campaignTags.campaignId, campaignId));
    return results.map((r) => r.tag);
  }

  async setCampaignTags(campaignId: number, tagIds: number[]): Promise<void> {
    await db.delete(campaignTags).where(eq(campaignTags.campaignId, campaignId));
    if (tagIds.length > 0) {
      await db.insert(campaignTags).values(tagIds.map((tagId) => ({ campaignId, tagId })));
    }
  }
}

export const storage = new DatabaseStorage();
