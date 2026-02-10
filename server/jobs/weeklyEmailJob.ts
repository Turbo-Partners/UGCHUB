import { db } from "../db";
import { sendWeeklyReportEmail } from "../email";
import { companies, applications, campaigns, deliverables, users } from "@shared/schema";
import { eq, sql, and, gte, isNotNull } from "drizzle-orm";
import * as cron from "node-cron";

interface WeeklyEmailStats {
  companiesNotified: number;
  emailsSent: number;
  errors: string[];
}

async function sendWeeklyReportsToCompanies(): Promise<WeeklyEmailStats> {
  const result: WeeklyEmailStats = {
    companiesNotified: 0,
    emailsSent: 0,
    errors: [],
  };

  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const activeCompanies = await db
      .select({
        id: companies.id,
        name: companies.name,
        email: companies.email,
      })
      .from(companies)
      .where(isNotNull(companies.email));
    
    for (const company of activeCompanies) {
      try {
        const [appStats] = await db
          .select({
            totalNew: sql<number>`count(*) filter (where ${applications.appliedAt} >= ${oneWeekAgo})::int`,
            pending: sql<number>`count(*) filter (where ${applications.status} = 'pending')::int`,
            acceptedThisWeek: sql<number>`count(*) filter (where ${applications.status} = 'accepted' and ${applications.appliedAt} >= ${oneWeekAgo})::int`,
          })
          .from(applications)
          .innerJoin(campaigns, eq(campaigns.id, applications.campaignId))
          .where(eq(campaigns.companyId, company.id));

        const [deliverableStats] = await db
          .select({
            total: sql<number>`count(*)::int`,
            recentUploads: sql<number>`count(*) filter (where ${deliverables.uploadedAt} >= ${oneWeekAgo})::int`,
          })
          .from(deliverables)
          .innerJoin(applications, eq(applications.id, deliverables.applicationId))
          .innerJoin(campaigns, eq(campaigns.id, applications.campaignId))
          .where(eq(campaigns.companyId, company.id));

        const pendingApplicationsList = await db
          .select({
            creatorName: users.name,
            campaignTitle: campaigns.title,
            appliedAt: applications.appliedAt,
          })
          .from(applications)
          .innerJoin(campaigns, eq(campaigns.id, applications.campaignId))
          .innerJoin(users, eq(users.id, applications.creatorId))
          .where(and(
            eq(campaigns.companyId, company.id),
            eq(applications.status, 'pending')
          ))
          .limit(5);

        const recentDeliverablesList = await db
          .select({
            creatorName: users.name,
            campaignTitle: campaigns.title,
            deliverableType: deliverables.deliverableType,
          })
          .from(deliverables)
          .innerJoin(applications, eq(applications.id, deliverables.applicationId))
          .innerJoin(campaigns, eq(campaigns.id, applications.campaignId))
          .innerJoin(users, eq(users.id, applications.creatorId))
          .where(and(
            eq(campaigns.companyId, company.id),
            gte(deliverables.uploadedAt, oneWeekAgo)
          ))
          .limit(5);

        const stats = {
          totalApplications: appStats?.totalNew || 0,
          approvedCreators: appStats?.acceptedThisWeek || 0,
          pendingDeliverables: deliverableStats?.recentUploads || 0,
          completedCampaigns: 0,
          totalSpent: 'R$ 0',
          pendingApplications: appStats?.pending || 0,
        };

        const hasActivity = stats.totalApplications > 0 || stats.pendingApplications > 0 || stats.pendingDeliverables > 0;

        if (hasActivity && company.email) {
          const pendingItems = {
            applications: pendingApplicationsList.map(app => ({
              creatorName: app.creatorName || 'Creator',
              campaignTitle: app.campaignTitle,
              daysAgo: Math.floor((Date.now() - (app.appliedAt?.getTime() || Date.now())) / (1000 * 60 * 60 * 24)),
            })),
            deliverables: recentDeliverablesList.map(del => ({
              creatorName: del.creatorName || 'Creator',
              campaignTitle: del.campaignTitle,
              type: del.deliverableType || 'Conteúdo',
            })),
          };

          const sent = await sendWeeklyReportEmail(
            company.email,
            company.name,
            stats,
            pendingItems.applications.length > 0 || pendingItems.deliverables.length > 0 ? pendingItems : undefined
          );
          
          if (sent) {
            result.emailsSent++;
          }
          result.companiesNotified++;
        }
      } catch (companyError) {
        result.errors.push(`Company ${company.id}: ${companyError}`);
      }
    }
    
    console.log(`[WeeklyEmailJob] Sent ${result.emailsSent} weekly reports to ${result.companiesNotified} companies`);
    
  } catch (error) {
    console.error("[WeeklyEmailJob] Error sending weekly reports:", error);
    result.errors.push(`General error: ${error}`);
  }
  
  return result;
}

let cronTask: ReturnType<typeof cron.schedule> | null = null;

export function initWeeklyEmailJob(): void {
  console.log("[WeeklyEmailJob] Initializing weekly email scheduler with node-cron...");
  
  cronTask = cron.schedule('0 9 * * 1', async () => {
    console.log("[WeeklyEmailJob] Running weekly email job...");
    
    try {
      const result = await sendWeeklyReportsToCompanies();
      console.log(`[WeeklyEmailJob] Completed: ${result.emailsSent} emails sent, ${result.errors.length} errors`);
    } catch (error) {
      console.error("[WeeklyEmailJob] Error:", error);
    }
  }, {
    timezone: "America/Sao_Paulo"
  });
  
  console.log("[WeeklyEmailJob] Weekly email scheduled for every Monday at 9:00 AM (Brasília time)");
}

export function stopWeeklyEmailJob(): void {
  if (cronTask) {
    cronTask.stop();
    console.log("[WeeklyEmailJob] Weekly email job stopped");
  }
}

export { sendWeeklyReportsToCompanies };
