import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { useCompanyProfile } from './use-company-profile';
import { CoverSection } from './cover-section';
import { HeaderCard } from './header-card';
import { AboutCompanySection } from './about-company-section';
import { CampaignsCard } from './campaigns-card';
import { DeliverablesGrid } from './deliverables-grid';
import { RecentPartnerships } from './recent-partnerships';
import { SidebarCard } from './sidebar-card';
import { ApplyPartnershipSheet } from './apply-partnership-sheet';

export default function CompanyProfile() {
  const {
    isValidRoute,
    isLoading,
    error,
    stats,
    displayName,
    categoryLabel,
    openCampaigns,
    recentPartnerships,
    publicDeliverables,
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
  } = useCompanyProfile();

  if (!isValidRoute) return null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-primary/20 rounded-full" />
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="mt-6 text-lg font-medium text-muted-foreground">Carregando perfil...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="p-4 bg-red-50 rounded-full mb-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Perfil não encontrado</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          Não foi possível carregar as informações desta marca.
        </p>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 pb-12 -mx-4 sm:-mx-6 lg:-mx-8">
      <CoverSection coverPhoto={stats.company.coverPhoto} displayName={displayName} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 md:-mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-visible shadow-xl border-0">
              <CardContent className="p-6 pt-0">
                <HeaderCard
                  stats={stats}
                  displayName={displayName}
                  categoryLabel={categoryLabel}
                  openCampaigns={openCampaigns}
                  membershipStatus={membershipStatus}
                  isFavorite={isFavorite}
                  isFavoriteLoading={isFavoriteLoading}
                  showFullDescription={showFullDescription}
                  setShowFullDescription={setShowFullDescription}
                  requestMembershipIsPending={requestMembershipMutation.isPending}
                  onRequestMembership={() => requestMembershipMutation.mutate()}
                  onOpenApplySheet={handleOpenApplySheet}
                  onToggleFavorite={handleToggleFavorite}
                />

                <AboutCompanySection company={stats.company} />
              </CardContent>
            </Card>

            <CampaignsCard
              openCampaigns={openCampaigns}
              completedCampaigns={stats.completedCampaigns}
            />

            <DeliverablesGrid deliverables={publicDeliverables} />

            <RecentPartnerships partnerships={recentPartnerships} />
          </div>

          <div className="space-y-4">
            <SidebarCard
              stats={stats}
              openCampaigns={openCampaigns}
              isFavorite={isFavorite}
              isFavoriteLoading={isFavoriteLoading}
              membershipStatus={membershipStatus}
              requestMembershipIsPending={requestMembershipMutation.isPending}
              onRequestMembership={() => requestMembershipMutation.mutate()}
              onOpenApplySheet={handleOpenApplySheet}
              onToggleFavorite={handleToggleFavorite}
            />
          </div>
        </div>
      </div>

      <ApplyPartnershipSheet
        open={applySheetOpen}
        onOpenChange={setApplySheetOpen}
        companyLogo={stats.company.logo}
        displayName={displayName}
        applyStep={applyStep}
        setApplyStep={setApplyStep}
        openCampaigns={openCampaigns}
        selectedCampaign={selectedCampaign}
        applicationMessage={applicationMessage}
        setApplicationMessage={setApplicationMessage}
        applyIsPending={applyMutation.isPending}
        onSelectCampaign={handleSelectCampaign}
        onSubmitApplication={handleSubmitApplication}
        onClose={handleCloseSheet}
      />
    </div>
  );
}
