import { Switch, Route, useLocation } from "wouter";
import { Suspense, lazy } from "react";
import { MarketplaceProvider } from "./lib/provider";
import { Toaster } from "@/components/ui/toaster";
import { CookieBanner } from "@/components/ui/cookie-banner";
import { Layout } from "@/components/layout";
import { ProtectedRoute } from "@/components/protected-route";
import { AdminLayout } from "@/components/admin-layout";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "@/components/theme-provider";
import { Redirect } from "@/components/redirect";
import { BrandProvider } from "@/lib/brand-context";
import { BrandGuard } from "@/components/brand-guard";

const PageLoader = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

const AdminContentLoader = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

const SettingsRedirect = lazy(() => import("@/components/settings-redirect"));

const LandingPage = lazy(() => import("@/pages/landing"));
const ParaCriadoresPage = lazy(() => import("@/pages/para-criadores"));
const AuthPage = lazy(() => import("@/pages/auth"));
const NotFound = lazy(() => import("@/pages/not-found"));
const CompanyDashboard = lazy(() => import("@/pages/company/dashboard"));
const CreateCampaign = lazy(() => import("@/pages/company/create-campaign"));
const CampaignDetails = lazy(() => import("@/pages/company/campaign-details"));
const CreatorsList = lazy(() => import("@/pages/company/creators-list"));
const CompanyCreatorProfile = lazy(() => import("@/pages/company/creator-profile"));
const CreatorDeepAnalysis = lazy(() => import("@/pages/company/creator-deep-analysis"));
const CreatorDashboard = lazy(() => import("@/pages/creator/dashboard"));
const CreatorFeed = lazy(() => import("@/pages/creator/feed"));
const ActiveCampaigns = lazy(() => import("@/pages/creator/active-campaigns"));
const CreatorInvites = lazy(() => import("@/pages/creator/invites"));
const CampaignWorkspace = lazy(() => import("@/pages/creator/campaign-workspace"));
const CampaignView = lazy(() => import("@/pages/creator/campaign-view"));
const CreatorOnboarding = lazy(() => import("@/pages/creator/onboarding"));
const CreatorProfile = lazy(() => import("@/pages/creator/profile"));
const CompanyPublicProfile = lazy(() => import("@/pages/creator/company-profile"));
const FavoriteCompanies = lazy(() => import("@/pages/creator/favorite-companies"));
const CreatorAnalytics = lazy(() => import("@/pages/creator/analytics"));
const CreatorLeaderboard = lazy(() => import("@/pages/creator/leaderboard"));
const MyCommissions = lazy(() => import("@/pages/creator/my-commissions"));
const MeusGanhos = lazy(() => import("@/pages/creator/meus-ganhos"));
const MyCommunities = lazy(() => import("@/pages/creator/my-communities"));
const CreatorHome = lazy(() => import("@/pages/creator/home"));
const CreatorBrands = lazy(() => import("@/pages/creator/brands"));
const BrandHub = lazy(() => import("@/pages/creator/brand-hub"));
const CreatorExplore = lazy(() => import("@/pages/creator/explore"));
const CreatorHub = lazy(() => import("@/pages/creator/hub"));
const CreatorWallet = lazy(() => import("@/pages/creator/wallet"));
const CreatorRanking = lazy(() => import("@/pages/creator/ranking"));
const CreatorSettings = lazy(() => import("@/pages/creator/settings"));
const CreatorAcademy = lazy(() => import("@/pages/creator/academy"));
const CampaignLeaderboard = lazy(() => import("@/pages/campaign-leaderboard"));
const CompanyAnalytics = lazy(() => import("@/pages/company/analytics"));
const TermsPage = lazy(() => import("@/pages/terms"));
const PrivacyPolicyPage = lazy(() => import("@/pages/privacy-policy"));
const HelpPage = lazy(() => import("@/pages/help"));
const AdminDashboardContent = lazy(() => import("@/pages/admin-dashboard").then(m => ({ default: m.AdminDashboardContent })));
const AdminUsersContent = lazy(() => import("@/pages/admin-users").then(m => ({ default: m.AdminUsersContent })));
const AdminSupportContent = lazy(() => import("@/pages/admin-support").then(m => ({ default: m.AdminSupportContent })));
const AdminModulesContent = lazy(() => import("@/pages/admin-modules").then(m => ({ default: m.AdminModulesContent })));
const AdminContentContent = lazy(() => import("@/pages/admin-content").then(m => ({ default: m.AdminContentContent })));
const AdminCampaignsContent = lazy(() => import("@/pages/admin-campaigns").then(m => ({ default: m.AdminCampaignsContent })));
const AdminFinancialContent = lazy(() => import("@/pages/admin-financial").then(m => ({ default: m.AdminFinancialContent })));
const AdminGamificationContent = lazy(() => import("@/pages/admin-gamification").then(m => ({ default: m.AdminGamificationContent })));
const PublicCreatorProfile = lazy(() => import("@/pages/public/public-creator-profile"));
const TemplatesPage = lazy(() => import("@/pages/templates"));
const CompanyMembers = lazy(() => import("@/pages/company-members"));
const CompanyKanban = lazy(() => import("@/pages/company/kanban"));
const CompanyCampaigns = lazy(() => import("@/pages/company/campaigns"));
const CompanyProfile = lazy(() => import("@/pages/company/profile"));
const CompanyUserProfile = lazy(() => import("@/pages/company/user-profile"));
const WorkflowSettings = lazy(() => import("@/pages/company/workflow-settings"));
const CompanyOnboarding = lazy(() => import("@/pages/company/onboarding"));
const CampaignCoupons = lazy(() => import("@/pages/company/campaign-coupons"));
const CampaignSales = lazy(() => import("@/pages/company/campaign-sales"));
const EcommerceIntegrations = lazy(() => import("@/pages/company/ecommerce-integrations"));
const CompanyIntegrations = lazy(() => import("@/pages/company/integrations"));
const SocialListening = lazy(() => import("@/pages/company/social-listening"));
const LandingPages = lazy(() => import("@/pages/company/landing-pages"));
const Financeiro = lazy(() => import("@/pages/company/financeiro"));
const PushNotifications = lazy(() => import("@/pages/company/push-notifications"));
const CommunityPage = lazy(() => import("@/pages/company/community"));
const CommunitySettingsPage = lazy(() => import("@/pages/company/community-settings"));
const ProgramPage = lazy(() => import("@/pages/company/program"));
const ProgramSettingsPage = lazy(() => import("@/pages/company/program-settings"));
const ProgramTiersPage = lazy(() => import("@/pages/company/program-tiers"));
const ProgramRewardsPage = lazy(() => import("@/pages/company/program-rewards"));
const ProgramGamificationPage = lazy(() => import("@/pages/company/program-gamification"));
const ProgramCoursesPage = lazy(() => import("@/pages/company/program-courses"));
const BrandTracking = lazy(() => import("@/pages/company/brand-tracking"));
const CompanyBrandsList = lazy(() => import("@/pages/company/brands-list"));
const OpsHub = lazy(() => import("@/pages/company/ops-hub"));
const InstagramInbox = lazy(() => import("@/pages/company/instagram-inbox"));
const DmTemplates = lazy(() => import("@/pages/company/dm-templates"));
const MetaAdsSuite = lazy(() => import("@/pages/company/meta-ads-suite"));
const CreatorDiscovery = lazy(() => import("@/pages/company/creator-discovery"));
const AcceptInvite = lazy(() => import("@/pages/accept-invite"));
const VerifyRequest = lazy(() => import("@/pages/auth/verify-request"));
const VerifyResult = lazy(() => import("@/pages/auth/verify-result"));
const ForgotPassword = lazy(() => import("@/pages/auth/forgot-password"));
const ResetPassword = lazy(() => import("@/pages/auth/reset-password"));
const CasesPage = lazy(() => import("@/pages/cases"));
const CaseDetailPage = lazy(() => import("@/pages/case-detail"));
const BlogPage = lazy(() => import("@/pages/blog"));
const BlogPostPage = lazy(() => import("@/pages/blog-post"));
const NotificationsPage = lazy(() => import("@/pages/notifications"));
const MessagesPage = lazy(() => import("@/pages/messages"));
const BrandedLandingPage = lazy(() => import("@/pages/public/branded-landing"));
const JoinCommunityPage = lazy(() => import("@/pages/public/join-community"));
const PartnershipLanding = lazy(() => import("@/pages/partnership-landing"));
const PartnershipSuccess = lazy(() => import("@/pages/partnership-success"));
const PartnershipError = lazy(() => import("@/pages/partnership-error"));
const HelpCenterPage = lazy(() => import("@/pages/help-center"));

function AdminRouter() {
  return (
    <AdminLayout>
      <Suspense fallback={<AdminContentLoader />}>
        <Switch>
          <Route path="/admin/users" component={AdminUsersContent} />
          <Route path="/admin/support" component={AdminSupportContent} />
          <Route path="/admin/modules" component={AdminModulesContent} />
          <Route path="/admin/content" component={AdminContentContent} />
          <Route path="/admin/campaigns" component={AdminCampaignsContent} />
          <Route path="/admin/financial" component={AdminFinancialContent} />
          <Route path="/admin/gamification" component={AdminGamificationContent} />
          <Route path="/admin" component={AdminDashboardContent} />
          <Route>
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-900">Página não encontrada</h2>
              <p className="text-gray-500 mt-2">A página que você está procurando não existe.</p>
            </div>
          </Route>
        </Switch>
      </Suspense>
    </AdminLayout>
  );
}

function Router() {
  const [location] = useLocation();
  const isAdminPath = /^\/admin(\/|$|\?|#)/.test(location) || location === '/admin';

  if (isAdminPath) {
    return <AdminRouter />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Switch>
                {/* Public Routes */}
                <Route path="/" component={LandingPage} />
                <Route path="/auth" component={AuthPage} />
                <Route path="/verify-request" component={VerifyRequest} />
                <Route path="/verify-result" component={VerifyResult} />
                <Route path="/forgot-password" component={ForgotPassword} />
                <Route path="/reset-password" component={ResetPassword} />
                <Route path="/terms" component={TermsPage} />
                <Route path="/termos-uso" component={TermsPage} />
                <Route path="/politica-privacidade" component={PrivacyPolicyPage} />
                <Route path="/public/creator/:id" component={PublicCreatorProfile} />
                <Route path="/para-criadores" component={ParaCriadoresPage} />
                <Route path="/cases" component={CasesPage} />
                <Route path="/case/:slug" component={CaseDetailPage} />
                <Route path="/blog" component={BlogPage} />
                <Route path="/blog/:slug" component={BlogPostPage} />
                <Route path="/m/:slug" component={BrandedLandingPage} />
                <Route path="/join/:token" component={JoinCommunityPage} />
                <Route path="/invite/:token" component={AcceptInvite} />
                <Route path="/partnership/:token" component={PartnershipLanding} />
                <Route path="/partnership/success" component={PartnershipSuccess} />
                <Route path="/partnership/error" component={PartnershipError} />
                <Route path="/central-ajuda/:rest*" component={HelpCenterPage} />
                <Route path="/central-ajuda" component={HelpCenterPage} />
                
                {/* Protected Routes - Onboarding */}
                <Route path="/onboarding">
                  <ProtectedRoute>
                    <CreatorOnboarding />
                  </ProtectedRoute>
                </Route>
                
                {/* Protected Routes - Company (New Navigation) */}
                <Route path="/company/onboarding">
                  <ProtectedRoute>
                    <CompanyOnboarding />
                  </ProtectedRoute>
                </Route>
                <Route path="/company/brands">
                  <ProtectedRoute>
                    <CompanyBrandsList />
                  </ProtectedRoute>
                </Route>
                <Route path="/company/home">
                  <ProtectedRoute>
                    <CompanyDashboard />
                  </ProtectedRoute>
                </Route>
                <Route path="/company/hub">
                  <ProtectedRoute>
                    <CompanyCampaigns />
                  </ProtectedRoute>
                </Route>
                <Route path="/company/creators">
                  <ProtectedRoute>
                    <CreatorsList />
                  </ProtectedRoute>
                </Route>
                <Route path="/company/creator-discovery">
                  <ProtectedRoute>
                    <CreatorDiscovery />
                  </ProtectedRoute>
                </Route>
                <Route path="/company/ops">
                  <ProtectedRoute>
                    <OpsHub />
                  </ProtectedRoute>
                </Route>
                <Route path="/company/kanban">
                  <ProtectedRoute>
                    <CompanyKanban />
                  </ProtectedRoute>
                </Route>
                <Route path="/company/wallet">
                  <ProtectedRoute>
                    <Financeiro />
                  </ProtectedRoute>
                </Route>
                <Route path="/company/settings">
                  <ProtectedRoute>
                    <WorkflowSettings />
                  </ProtectedRoute>
                </Route>
                <Route path="/company/integrations">
                  <ProtectedRoute>
                    <CompanyIntegrations />
                  </ProtectedRoute>
                </Route>
                <Route path="/company/meta-ads-suite">
                  <ProtectedRoute>
                    <MetaAdsSuite />
                  </ProtectedRoute>
                </Route>
                <Route path="/company/settings/integrations">
                  <ProtectedRoute>
                    <CompanyIntegrations />
                  </ProtectedRoute>
                </Route>
                <Route path="/company/instagram-inbox">
                  <ProtectedRoute>
                    <InstagramInbox />
                  </ProtectedRoute>
                </Route>
                <Route path="/company/dm-templates">
                  <ProtectedRoute>
                    <DmTemplates />
                  </ProtectedRoute>
                </Route>
                
                {/* Protected Routes - Company (Legacy redirects) */}
                <Route path="/dashboard">
                  <ProtectedRoute>
                    <Redirect to="/company/home" />
                  </ProtectedRoute>
                </Route>
                <Route path="/create-campaign">
                  <ProtectedRoute>
                    <CreateCampaign />
                  </ProtectedRoute>
                </Route>
                <Route path="/templates">
                  <ProtectedRoute>
                    <TemplatesPage />
                  </ProtectedRoute>
                </Route>
                <Route path="/creators">
                  <ProtectedRoute>
                    <Redirect to="/company/creators" />
                  </ProtectedRoute>
                </Route>
                <Route path="/creator/:id/profile">
                  <ProtectedRoute>
                    <CompanyCreatorProfile />
                  </ProtectedRoute>
                </Route>
                <Route path="/creator/:id/analysis">
                  <ProtectedRoute>
                    <CreatorDeepAnalysis />
                  </ProtectedRoute>
                </Route>
                <Route path="/campaign/:id/manage">
                  <ProtectedRoute>
                    <CampaignDetails />
                  </ProtectedRoute>
                </Route>
                <Route path="/campaign/:id/leaderboard">
                  <ProtectedRoute>
                    <CampaignLeaderboard />
                  </ProtectedRoute>
                </Route>
                <Route path="/campaign/:id/coupons">
                  <ProtectedRoute>
                    <CampaignCoupons />
                  </ProtectedRoute>
                </Route>
                <Route path="/campaign/:id/sales">
                  <ProtectedRoute>
                    <CampaignSales />
                  </ProtectedRoute>
                </Route>
                <Route path="/team">
                  <ProtectedRoute>
                    <CompanyMembers />
                  </ProtectedRoute>
                </Route>
                <Route path="/kanban">
                  <ProtectedRoute>
                    <Redirect to="/company/ops" />
                  </ProtectedRoute>
                </Route>
                <Route path="/company/profile">
                  <ProtectedRoute>
                    <CompanyProfile />
                  </ProtectedRoute>
                </Route>
                <Route path="/workflow-settings">
                  <ProtectedRoute>
                    <Redirect to="/company/settings" />
                  </ProtectedRoute>
                </Route>
                <Route path="/company/program">
                  <ProtectedRoute>
                    <ProgramPage />
                  </ProtectedRoute>
                </Route>
                <Route path="/company/program/settings">
                  <ProtectedRoute>
                    <ProgramSettingsPage />
                  </ProtectedRoute>
                </Route>
                <Route path="/company/program/tiers">
                  <ProtectedRoute>
                    <ProgramTiersPage />
                  </ProtectedRoute>
                </Route>
                <Route path="/company/program/rewards">
                  <ProtectedRoute>
                    <ProgramRewardsPage />
                  </ProtectedRoute>
                </Route>
                <Route path="/company/program/gamification-rules">
                  <ProtectedRoute>
                    <ProgramGamificationPage />
                  </ProtectedRoute>
                </Route>
                <Route path="/company/program/courses">
                  <ProtectedRoute>
                    <ProgramCoursesPage />
                  </ProtectedRoute>
                </Route>
                <Route path="/ecommerce-integrations">
                  <ProtectedRoute>
                    <EcommerceIntegrations />
                  </ProtectedRoute>
                </Route>
                <Route path="/social-listening">
                  <ProtectedRoute>
                    <SocialListening />
                  </ProtectedRoute>
                </Route>
                <Route path="/landing-pages">
                  <ProtectedRoute>
                    <LandingPages />
                  </ProtectedRoute>
                </Route>
                <Route path="/financeiro">
                  <ProtectedRoute>
                    <Redirect to="/company/wallet" />
                  </ProtectedRoute>
                </Route>
                <Route path="/push-notifications">
                  <ProtectedRoute>
                    <PushNotifications />
                  </ProtectedRoute>
                </Route>
                <Route path="/comunidade">
                  <ProtectedRoute>
                    <CommunityPage />
                  </ProtectedRoute>
                </Route>
                <Route path="/community-settings">
                  <ProtectedRoute>
                    <CommunitySettingsPage />
                  </ProtectedRoute>
                </Route>
                {/* Company Brand Hub Routes - wrapped with BrandGuard */}
                <Route path="/company/brand/:brandId/overview">
                  <ProtectedRoute>
                    <BrandGuard>
                      <CompanyDashboard />
                    </BrandGuard>
                  </ProtectedRoute>
                </Route>
                <Route path="/company/brand/:brandId/community">
                  <ProtectedRoute>
                    <BrandGuard>
                      <CommunityPage />
                    </BrandGuard>
                  </ProtectedRoute>
                </Route>
                <Route path="/company/brand/:brandId/discovery">
                  <ProtectedRoute>
                    <BrandGuard>
                      <CreatorsList />
                    </BrandGuard>
                  </ProtectedRoute>
                </Route>
                <Route path="/company/brand/:brandId/campaigns">
                  <ProtectedRoute>
                    <BrandGuard>
                      <CompanyCampaigns />
                    </BrandGuard>
                  </ProtectedRoute>
                </Route>
                <Route path="/company/brand/:brandId/tracking">
                  <ProtectedRoute>
                    <BrandGuard>
                      <BrandTracking />
                    </BrandGuard>
                  </ProtectedRoute>
                </Route>
                <Route path="/company/brand/:brandId/messages">
                  <ProtectedRoute>
                    <BrandGuard>
                      <MessagesPage />
                    </BrandGuard>
                  </ProtectedRoute>
                </Route>
                <Route path="/company/brand/:brandId/settings">
                  <ProtectedRoute>
                    <BrandGuard>
                      <CommunitySettingsPage />
                    </BrandGuard>
                  </ProtectedRoute>
                </Route>
                <Route path="/company/brand/:brandId/program">
                  <ProtectedRoute>
                    <BrandGuard>
                      <ProgramPage />
                    </BrandGuard>
                  </ProtectedRoute>
                </Route>
                <Route path="/company/analytics">
                  <ProtectedRoute>
                    <CompanyAnalytics />
                  </ProtectedRoute>
                </Route>
                
                {/* Protected Routes - Creator (New Navigation) */}
                <Route path="/explore">
                  <ProtectedRoute>
                    <CreatorExplore />
                  </ProtectedRoute>
                </Route>
                <Route path="/hub">
                  <ProtectedRoute>
                    <Redirect to="/campaigns" />
                  </ProtectedRoute>
                </Route>
                <Route path="/wallet">
                  <ProtectedRoute>
                    <CreatorWallet />
                  </ProtectedRoute>
                </Route>
                <Route path="/ranking">
                  <ProtectedRoute>
                    <CreatorRanking />
                  </ProtectedRoute>
                </Route>
                <Route path="/academy">
                  <ProtectedRoute>
                    <CreatorAcademy />
                  </ProtectedRoute>
                </Route>
                <Route path="/settings">
                  <ProtectedRoute>
                    <SettingsRedirect />
                  </ProtectedRoute>
                </Route>
                
                <Route path="/campaigns">
                  <ProtectedRoute>
                    <CreatorHub />
                  </ProtectedRoute>
                </Route>
                
                {/* Protected Routes - Creator (Legacy redirects for compatibility) */}
                <Route path="/feed">
                  <ProtectedRoute>
                    <Redirect to="/explore" />
                  </ProtectedRoute>
                </Route>
                <Route path="/applications">
                  <ProtectedRoute>
                    <Redirect to="/campaigns?tab=applications" />
                  </ProtectedRoute>
                </Route>
                <Route path="/active-campaigns">
                  <ProtectedRoute>
                    <Redirect to="/campaigns?tab=active" />
                  </ProtectedRoute>
                </Route>
                <Route path="/favorite-companies">
                  <ProtectedRoute>
                    <FavoriteCompanies />
                  </ProtectedRoute>
                </Route>
                <Route path="/home">
                  <ProtectedRoute>
                    <CreatorHome />
                  </ProtectedRoute>
                </Route>
                <Route path="/analytics">
                  <ProtectedRoute>
                    <CreatorAnalytics />
                  </ProtectedRoute>
                </Route>
                <Route path="/creator/analytics">
                  <ProtectedRoute>
                    <CreatorAnalytics />
                  </ProtectedRoute>
                </Route>
                <Route path="/leaderboard">
                  <ProtectedRoute>
                    <Redirect to="/ranking" />
                  </ProtectedRoute>
                </Route>
                <Route path="/my-commissions">
                  <ProtectedRoute>
                    <MyCommissions />
                  </ProtectedRoute>
                </Route>
                <Route path="/meus-ganhos">
                  <ProtectedRoute>
                    <Redirect to="/wallet" />
                  </ProtectedRoute>
                </Route>
                <Route path="/minhas-comunidades">
                  <ProtectedRoute>
                    <Redirect to="/brands" />
                  </ProtectedRoute>
                </Route>
                <Route path="/brands">
                  <ProtectedRoute>
                    <CreatorBrands />
                  </ProtectedRoute>
                </Route>
                <Route path="/brands/:brandId">
                  <ProtectedRoute>
                    <BrandHub />
                  </ProtectedRoute>
                </Route>
                <Route path="/minhas-marcas">
                  <ProtectedRoute>
                    <Redirect to="/brands" />
                  </ProtectedRoute>
                </Route>
                <Route path="/profile">
                  <ProtectedRoute>
                    <CompanyUserProfile />
                  </ProtectedRoute>
                </Route>
                <Route path="/brand/:brandId/campaign/:campaignId">
                  <ProtectedRoute>
                    <CampaignWorkspace />
                  </ProtectedRoute>
                </Route>
                <Route path="/brand/:brandId">
                  <ProtectedRoute>
                    <BrandHub />
                  </ProtectedRoute>
                </Route>
                <Route path="/creator/invites">
                  <ProtectedRoute>
                    <CreatorInvites />
                  </ProtectedRoute>
                </Route>
                <Route path="/profile">
                  <ProtectedRoute>
                    <CreatorProfile />
                  </ProtectedRoute>
                </Route>
                <Route path="/campaign/:id/workspace">
                  <ProtectedRoute>
                    <CampaignWorkspace />
                  </ProtectedRoute>
                </Route>
                <Route path="/campaign/:id">
                  <ProtectedRoute>
                    <CampaignView />
                  </ProtectedRoute>
                </Route>
                <Route path="/company/:id/profile">
                  <ProtectedRoute>
                    <CompanyPublicProfile />
                  </ProtectedRoute>
                </Route>
                <Route path="/brand/:id">
                  <ProtectedRoute>
                    <CompanyPublicProfile />
                  </ProtectedRoute>
                </Route>
                
                {/* Protected Routes - Shared */}
                <Route path="/help">
                  <ProtectedRoute>
                    <HelpPage />
                  </ProtectedRoute>
                </Route>
                <Route path="/notifications">
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                </Route>
                <Route path="/messages">
                  <ProtectedRoute>
                    <MessagesPage />
                  </ProtectedRoute>
                </Route>

                <Route component={NotFound} />
              </Switch>
            </Suspense>
          </Layout>
        </Suspense>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="creatorconnect-theme">
      <QueryClientProvider client={queryClient}>
        <MarketplaceProvider>
          <BrandProvider>
            <Router />
            <Toaster />
            <CookieBanner />
          </BrandProvider>
        </MarketplaceProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
