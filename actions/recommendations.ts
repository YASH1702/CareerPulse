"use server";

import prisma from "@/lib/db/client";
import { getRequiredUserId } from "@/lib/auth/session";

export async function getRecommendations() {
  const userId = await getRequiredUserId();

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { minMatchScore: true },
  });

  const minScore = profile?.minMatchScore ?? 65;

  const matches = await prisma.job.findMany({
    where: {
      userId,
      matchScore: { not: null },
      isSkipped: false,
    },
    orderBy: { matchScore: "desc" },
    include: {
      aiAnalysis: true,
      applications: {
        select: { id: true, appStatus: true },
      },
    },
  });

  const unanalyzedCount = await prisma.job.count({
    where: {
      userId,
      jobStatus: "NEW",
    },
  });

  const topMatches = matches.filter((j) => (j.matchScore ?? 0) >= 80);
  const goodMatches = matches.filter((j) => (j.matchScore ?? 0) >= 70 && (j.matchScore ?? 0) < 80);
  const considerMatches = matches.filter((j) => (j.matchScore ?? 0) >= minScore && (j.matchScore ?? 0) < 70);

  return {
    allMatches: matches,
    topMatches,
    goodMatches,
    considerMatches,
    unanalyzedCount,
    minScore,
  };
}