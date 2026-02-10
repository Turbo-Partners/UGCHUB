import { db } from "../db";
import { notifications, integrationLogs } from "@shared/schema";
import { lt, and, eq, sql } from "drizzle-orm";

const NOTIFICATION_TTL_DAYS = parseInt(process.env.CLEANUP_NOTIFICATION_TTL_DAYS || "90", 10);
const INTEGRATION_LOG_TTL_DAYS = parseInt(process.env.CLEANUP_LOG_TTL_DAYS || "30", 10);
const MAX_NOTIFICATIONS_PER_USER = parseInt(process.env.CLEANUP_MAX_NOTIFICATIONS || "500", 10);
const MAX_INTEGRATION_LOGS_PER_COMPANY = parseInt(process.env.CLEANUP_MAX_LOGS || "1000", 10);

export async function runCleanup(): Promise<{
  notificationsDeleted: number;
  integrationLogsDeleted: number;
  notificationsLimitEnforced: number;
  integrationLogsLimitEnforced: number;
}> {
  return await db.transaction(async (tx) => {
    const notifCutoff = new Date();
    notifCutoff.setDate(notifCutoff.getDate() - NOTIFICATION_TTL_DAYS);

    const deletedNotifs = await tx.delete(notifications)
      .where(
        and(
          lt(notifications.createdAt, notifCutoff),
          eq(notifications.isRead, true)
        )
      )
      .returning({ id: notifications.id });

    const logCutoff = new Date();
    logCutoff.setDate(logCutoff.getDate() - INTEGRATION_LOG_TTL_DAYS);

    const deletedLogs = await tx.delete(integrationLogs)
      .where(lt(integrationLogs.createdAt, logCutoff))
      .returning({ id: integrationLogs.id });

    const notifLimitResult = await tx.execute(sql`
      DELETE FROM notifications
      WHERE id IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC, id DESC) as rn
          FROM notifications
        ) ranked
        WHERE rn > ${MAX_NOTIFICATIONS_PER_USER}
      )
    `);

    const logLimitResult = await tx.execute(sql`
      DELETE FROM integration_logs
      WHERE id IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY company_id ORDER BY created_at DESC, id DESC) as rn
          FROM integration_logs
        ) ranked
        WHERE rn > ${MAX_INTEGRATION_LOGS_PER_COMPANY}
      )
    `);

    const result = {
      notificationsDeleted: deletedNotifs.length,
      integrationLogsDeleted: deletedLogs.length,
      notificationsLimitEnforced: Number(notifLimitResult.rowCount ?? 0),
      integrationLogsLimitEnforced: Number(logLimitResult.rowCount ?? 0),
    };

    console.log(`[Cleanup] Notifications TTL: ${result.notificationsDeleted} deleted, Limit: ${result.notificationsLimitEnforced} trimmed`);
    console.log(`[Cleanup] Integration logs TTL: ${result.integrationLogsDeleted} deleted, Limit: ${result.integrationLogsLimitEnforced} trimmed`);

    return result;
  });
}

let cleanupInterval: ReturnType<typeof setInterval> | null = null;

export function startCleanupScheduler(): void {
  runCleanup().catch(err => console.error("[Cleanup] Initial run failed:", err));

  cleanupInterval = setInterval(() => {
    runCleanup().catch(err => console.error("[Cleanup] Scheduled run failed:", err));
  }, 24 * 60 * 60 * 1000);

  console.log("[Cleanup] Scheduler started - runs every 24 hours");
}

export function stopCleanupScheduler(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log("[Cleanup] Scheduler stopped");
  }
}
