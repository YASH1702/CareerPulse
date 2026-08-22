"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/client";
import { getRequiredUserId } from "@/lib/auth/session";
import { analyzeJobCompatibility } from "@/lib/ai/analyze-job";
import type { ActionResult } from "./auth";

export type { ActionResult };

export async function runJobAnalysisAction(jobId: string): Promise<ActionResult & { matchScore?: number }> {
  const userId = await getRequiredUserId();

  const res = await analyzeJobCompatibility(jobId, userId);

  if (!res.success) {
    return { success: false, error: res.error || "Analysis failed" };
  }

  revalidatePath("/jobs");
  revalidatePath("/recommendations");
  revalidatePath("/");

  return {
    success: true,
    matchScore: res.result?.matchScore ?? (res.isFiltered ? 30 : 70),
  };
}

export async function batchAnalyzeNewJobsAction(): Promise<ActionResult & { analyzedCount?: number }> {
  const userId = await getRequiredUserId();

  // Find all unanalyzed jobs
  const newJobs = await prisma.job.findMany({
    where: {
      userId,
      jobStatus: "NEW",
    },
    take: 10,
    select: { id: true },
  });

  if (newJobs.length === 0) {
    return { success: true, error: "No unanalyzed jobs found.", analyzedCount: 0 };
  }

  let count = 0;
  for (const j of newJobs) {
    const res = await analyzeJobCompatibility(j.id, userId);
    if (res.success) count++;
  }

  revalidatePath("/jobs");
  revalidatePath("/recommendations");
  revalidatePath("/");

  return { success: true, analyzedCount: count };
}