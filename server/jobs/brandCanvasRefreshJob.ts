import * as cron from "node-cron";
import { db } from "../db";
import { companies } from "@shared/schema";
import { sql, lt, isNotNull } from "drizzle-orm";
import { runBrandCanvasPipeline } from "../services/brand-canvas";

let cronJob: ReturnType<typeof cron.schedule> | null = null;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Run brand canvas refresh batch.
 * Finds companies with canvas older than 30 days and re-runs the pipeline.
 */
async function runBrandCanvasRefreshBatch() {
  console.log("[BrandCanvasRefresh] Starting monthly refresh batch...");

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Find companies with brand canvas that hasn't been processed in 30+ days
    const staleCompanies = await db.select({
      id: companies.id,
      name: companies.name,
      brandCanvas: companies.brandCanvas,
      createdByUserId: companies.createdByUserId,
    }).from(companies)
      .where(
        isNotNull(companies.brandCanvas)
      )
      .limit(10);

    // Filter in JS — JSONB path filtering is complex with Drizzle
    const needsRefresh = staleCompanies.filter(c => {
      const canvas = c.brandCanvas as any;
      if (!canvas?.processing?.lastProcessedAt) return true;
      const lastProcessed = new Date(canvas.processing.lastProcessedAt);
      return lastProcessed < thirtyDaysAgo;
    });

    if (needsRefresh.length === 0) {
      console.log("[BrandCanvasRefresh] No companies need refresh.");
      return;
    }

    console.log(`[BrandCanvasRefresh] Found ${needsRefresh.length} companies to refresh.`);

    for (const company of needsRefresh) {
      try {
        console.log(`[BrandCanvasRefresh] Refreshing company ${company.id} (${company.name})`);
        await runBrandCanvasPipeline({
          companyId: company.id,
          userId: company.createdByUserId,
          force: true,
        });
        console.log(`[BrandCanvasRefresh] Company ${company.id} refreshed successfully.`);
      } catch (error) {
        console.error(`[BrandCanvasRefresh] Failed for company ${company.id}:`, error);
      }

      // 5s delay between companies to avoid rate limits
      await delay(5000);
    }

    console.log("[BrandCanvasRefresh] Batch completed.");
  } catch (error) {
    console.error("[BrandCanvasRefresh] Batch error:", error);
  }
}

/**
 * Initialize the brand canvas refresh cron job.
 * Runs on the 1st Sunday of each month at 4:00 AM BRT (7:00 UTC).
 */
export function initBrandCanvasRefreshJob(): void {
  // 1st Sunday of month at 4h BRT = 7h UTC
  // cron: minute hour dayOfMonth month dayOfWeek
  // "0 7 1-7 * 0" = at 07:00 UTC on days 1-7 of every month, only on Sundays
  cronJob = cron.schedule("0 7 1-7 * 0", () => {
    runBrandCanvasRefreshBatch();
  });

  console.log("[BrandCanvasRefresh] Cron job initialized (1st Sunday/month 4h BRT)");
}

export { runBrandCanvasRefreshBatch };
