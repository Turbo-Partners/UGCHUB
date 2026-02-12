import * as cron from "node-cron";
import { db } from "../db";
import { companies } from "@shared/schema";
import { sql, or, isNull, lt } from "drizzle-orm";
import {
  enrichCompanyCnpj,
  enrichCompanyWebsite,
  enrichCompanyInstagram,
  regenerateStructuredBriefing,
} from "../services/company-enrichment";

let cronJob: ReturnType<typeof cron.schedule> | null = null;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Run the company enrichment batch.
 * Finds companies that haven't been enriched recently and re-enriches them.
 */
async function runCompanyEnrichmentBatch() {
  console.log("[CompanyEnrichJob] Starting weekly enrichment batch...");

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Find companies needing re-enrichment (lastEnrichedAt > 7 days or null), limit 20
    const staleCompanies = await db.select().from(companies)
      .where(
        or(
          isNull(companies.lastEnrichedAt),
          lt(companies.lastEnrichedAt, sevenDaysAgo)
        )
      )
      .limit(20);

    if (staleCompanies.length === 0) {
      console.log("[CompanyEnrichJob] No companies need re-enrichment.");
      return;
    }

    console.log(`[CompanyEnrichJob] Found ${staleCompanies.length} companies to re-enrich.`);

    for (const company of staleCompanies) {
      let hadChanges = false;

      try {
        // CNPJ: re-enrich if cnpjLastUpdated > 30 days
        if (company.cnpj) {
          const cnpjNeedsUpdate = !company.cnpjLastUpdated || company.cnpjLastUpdated < thirtyDaysAgo;
          if (cnpjNeedsUpdate) {
            const updated = await enrichCompanyCnpj(company.id, company.cnpj);
            if (updated) hadChanges = true;
            await delay(3000); // Rate limit: ReceitaWS allows 3/min
          }
        }

        // Website: re-enrich if websiteLastUpdated > 7 days
        if (company.website) {
          const websiteNeedsUpdate = !company.websiteLastUpdated || company.websiteLastUpdated < sevenDaysAgo;
          if (websiteNeedsUpdate) {
            const updated = await enrichCompanyWebsite(company.id, company.website);
            if (updated) hadChanges = true;
            await delay(3000);
          }
        }

        // Instagram: re-enrich if instagramLastUpdated > 7 days
        if (company.instagram) {
          const igNeedsUpdate = !company.instagramLastUpdated || company.instagramLastUpdated < sevenDaysAgo;
          if (igNeedsUpdate) {
            const updated = await enrichCompanyInstagram(company.id, company.instagram);
            if (updated) hadChanges = true;
            await delay(3000);
          }
        }

        // Regenerate structured briefing if any data changed
        if (hadChanges) {
          await regenerateStructuredBriefing(company.id);
          await delay(2000);
        }

        // Update lastEnrichedAt regardless
        await db.update(companies).set({
          lastEnrichedAt: new Date(),
        }).where(sql`${companies.id} = ${company.id}`);

        console.log(`[CompanyEnrichJob] Company ${company.id} (${company.name}) processed. Changes: ${hadChanges}`);
      } catch (error) {
        console.error(`[CompanyEnrichJob] Error processing company ${company.id}:`, error);
      }

      // Rate limiting between companies
      await delay(3000);
    }

    console.log("[CompanyEnrichJob] Batch complete.");
  } catch (error) {
    console.error("[CompanyEnrichJob] Batch error:", error);
  }
}

/**
 * Initialize the weekly company enrichment cron job.
 * Runs every Sunday at 3 AM (Brazil time).
 */
export function initCompanyEnrichmentJob() {
  if (cronJob) return;

  // '0 3 * * 0' = Sunday at 3:00 AM
  cronJob = cron.schedule("0 3 * * 0", () => {
    runCompanyEnrichmentBatch();
  }, {
    timezone: "America/Sao_Paulo",
  });

  console.log("[CompanyEnrichJob] Weekly enrichment job scheduled (Sundays 3 AM BRT)");
}

export function stopCompanyEnrichmentJob() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log("[CompanyEnrichJob] Job stopped.");
  }
}
