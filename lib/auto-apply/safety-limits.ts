import prisma from "@/lib/db/client";

export interface EligibilityCheck {
  eligible: boolean;
  reason?: string;
  config?: {
    mode: "SEMI_AUTONOMOUS" | "FULL_AUTONOMOUS";
    minMatchScore: number;
    maxDailyApplies: number;
    todayAppliedCount: number;
  };
}

/**
 * Validates whether an auto-application is permitted under safety & quota constraints.
 */
export async function checkAutoApplyEligibility(
  userId: string,
  matchScore: number,
  options: { isManualApply?: boolean } = {}
): Promise<EligibilityCheck> {
  let config = await prisma.autoApplyConfig.findUnique({
    where: { userId },
  });

  if (!config) {
    config = await prisma.autoApplyConfig.create({
      data: {
        userId,
        isEnabled: false,
        mode: "SEMI_AUTONOMOUS",
        minMatchScore: 80,
        maxDailyApplies: 15,
        todayAppliedCount: 0,
      },
    });
  }

  // 1. Check if enabled (only blocks background automated loop, allows 1-click user applies)
  if (!options.isManualApply && !config.isEnabled) {
    return { eligible: false, reason: "Autonomous auto-apply is currently paused in settings. Toggle it ON to enable automated submissions.", config };
  }

  // 2. Check Match Score Threshold (only blocks background automated loop)
  if (!options.isManualApply && matchScore < config.minMatchScore) {
    return {
      eligible: false,
      reason: `Match score (${matchScore}%) is below your auto-apply threshold (${config.minMatchScore}%)`,
      config,
    };
  }

  // 3. Reset daily count if date changed
  const now = new Date();
  const lastReset = new Date(config.lastResetDate);
  const isSameDay =
    now.getDate() === lastReset.getDate() &&
    now.getMonth() === lastReset.getMonth() &&
    now.getFullYear() === lastReset.getFullYear();

  if (!isSameDay) {
    config = await prisma.autoApplyConfig.update({
      where: { userId },
      data: {
        todayAppliedCount: 0,
        lastResetDate: now,
      },
    });
  }

  // 4. Check Daily Quota Limit
  if (config.todayAppliedCount >= config.maxDailyApplies) {
    return {
      eligible: false,
      reason: `Daily quota limit reached (${config.todayAppliedCount}/${config.maxDailyApplies} applied today)`,
      config,
    };
  }

  return { eligible: true, config };
}

/**
 * Increments the daily applied counter.
 */
export async function recordSuccessfulAutoApply(userId: string): Promise<void> {
  await prisma.autoApplyConfig.update({
    where: { userId },
    data: {
      todayAppliedCount: { increment: 1 },
    },
  });
}