import { storage } from "../storage";

interface ProcessingResult {
  campaignId: number;
  postsProcessed: number;
  totalPointsAwarded: number;
  flaggedPosts: number;
  errors: string[];
}

export async function processMetricsForAllCampaigns(): Promise<ProcessingResult[]> {
  const results: ProcessingResult[] = [];
  
  try {
    const campaigns = await storage.getGamificationEnabledCampaigns();
    
    for (const campaign of campaigns) {
      const result = await processMetricsForCampaign(campaign.id, campaign.companyId);
      results.push(result);
    }
    
    return results;
  } catch (error) {
    console.error("[MetricsProcessor] Error processing campaigns:", error);
    return results;
  }
}

export async function processMetricsForCampaign(
  campaignId: number, 
  companyId: number
): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    campaignId,
    postsProcessed: 0,
    totalPointsAwarded: 0,
    flaggedPosts: 0,
    errors: [],
  };

  try {
    const rules = await storage.getEffectiveScoringRules(campaignId, companyId);
    const caps = await storage.getEffectiveCaps(campaignId, companyId);

    if (!rules.pointsPer1kViews && !rules.pointsPerLike && !rules.pointsPerComment) {
      return result;
    }

    const posts = await storage.getCreatorPostsForCampaign(
      campaignId,
      rules.allowedPlatforms,
      caps.countingWindowDays
    );

    for (const post of posts) {
      try {
        const deltaResult = await storage.processMetricDelta(
          campaignId,
          companyId,
          post.creatorId,
          post,
          {
            pointsPer1kViews: rules.pointsPer1kViews,
            pointsPerComment: rules.pointsPerComment,
            pointsPerLike: rules.pointsPerLike,
          },
          {
            maxPointsPerPost: caps.maxPointsPerPost,
            maxPointsPerDay: caps.maxPointsPerDay,
            maxPointsTotalCampaign: caps.maxPointsTotalCampaign,
          }
        );

        result.postsProcessed++;
        result.totalPointsAwarded += deltaResult.pointsAwarded;
        if (deltaResult.flagged) {
          result.flaggedPosts++;
        }

        // Check for milestone rewards if points were awarded
        if (deltaResult.pointsAwarded > 0) {
          const score = await storage.getCreatorScore(campaignId, post.creatorId);
          if (score) {
            await storage.checkMilestoneRewards(companyId, campaignId, post.creatorId, score.totalPoints);
          }
        }
      } catch (postError) {
        result.errors.push(`Post ${post.postId}: ${postError}`);
      }
    }

    // Recalculate ranks after all posts processed (scores updated within transactions)
    if (result.totalPointsAwarded > 0) {
      await storage.recalculateCampaignRanks(campaignId);
    }

    console.log(`[MetricsProcessor] Campaign ${campaignId}: ${result.postsProcessed} posts, ${result.totalPointsAwarded} points, ${result.flaggedPosts} flagged`);

  } catch (error) {
    result.errors.push(`Campaign error: ${error}`);
    console.error(`[MetricsProcessor] Error processing campaign ${campaignId}:`, error);
  }

  return result;
}

let processingInterval: NodeJS.Timeout | null = null;
let midnightResetTimeout: NodeJS.Timeout | null = null;

function scheduleMidnightReset(): void {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const msUntilMidnight = tomorrow.getTime() - now.getTime();

  midnightResetTimeout = setTimeout(async () => {
    console.log("[MetricsProcessor] Midnight reset: resetting daily points counters");
    try {
      await storage.resetDailyPointsCounters();
      console.log("[MetricsProcessor] Daily counters reset successfully");
    } catch (error) {
      console.error("[MetricsProcessor] Error resetting daily counters:", error);
    }
    scheduleMidnightReset();
  }, msUntilMidnight);

  console.log(`[MetricsProcessor] Next daily reset scheduled in ${Math.round(msUntilMidnight / 1000 / 60)} minutes`);
}

export function startMetricsProcessor(intervalMinutes: number = 15): void {
  if (processingInterval) {
    console.log("[MetricsProcessor] Already running");
    return;
  }

  console.log(`[MetricsProcessor] Starting with ${intervalMinutes} minute interval`);
  
  scheduleMidnightReset();

  processingInterval = setInterval(async () => {
    console.log("[MetricsProcessor] Running scheduled processing...");
    const results = await processMetricsForAllCampaigns();
    console.log(`[MetricsProcessor] Completed: ${results.length} campaigns processed`);
  }, intervalMinutes * 60 * 1000);

  setTimeout(async () => {
    console.log("[MetricsProcessor] Running initial processing...");
    await processMetricsForAllCampaigns();
  }, 5000);
}

export function stopMetricsProcessor(): void {
  if (processingInterval) {
    clearInterval(processingInterval);
    processingInterval = null;
  }
  if (midnightResetTimeout) {
    clearTimeout(midnightResetTimeout);
    midnightResetTimeout = null;
  }
  console.log("[MetricsProcessor] Stopped");
}
