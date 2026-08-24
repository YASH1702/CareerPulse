import { FreshnessScore } from "@prisma/client";

export interface FreshnessAnalysis {
  score: FreshnessScore;
  label: string;
  badgeColor: string;
  callbackMultiplier: number;
  reason: string;
}

/**
 * Evaluates whether a job posting is Fresh, Standard, or a Stale/Ghost listing.
 */
export function evaluateJobFreshness(
  postedDate?: Date | string | null,
  repostCount = 0
): FreshnessAnalysis {
  if (!postedDate) {
    return {
      score: FreshnessScore.STANDARD,
      label: "Recent",
      badgeColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      callbackMultiplier: 1.0,
      reason: "Date not explicitly declared by board",
    };
  }

  const posted = typeof postedDate === "string" ? new Date(postedDate) : postedDate;
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24));

  if (repostCount >= 3 || diffDays > 30) {
    return {
      score: FreshnessScore.STALE_GHOST,
      label: "Stale / Ghost Risk",
      badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      callbackMultiplier: 0.35,
      reason: diffDays > 30
        ? `Posted ${diffDays} days ago — low hiring velocity`
        : `Reposted ${repostCount} times over long duration`,
    };
  }

  if (diffDays <= 2) {
    return {
      score: FreshnessScore.FRESH,
      label: "🔥 Fresh (<48h)",
      badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      callbackMultiplier: 3.8,
      reason: "Early applicant window — 3.8x higher callback probability",
    };
  }

  return {
    score: FreshnessScore.STANDARD,
    label: `${diffDays}d ago`,
    badgeColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    callbackMultiplier: 1.0,
    reason: "Active application window",
  };
}