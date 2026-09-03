"use server";

import prisma from "@/lib/db/client";
import { getRequiredUserId } from "@/lib/auth/session";
import { checkAutoApplyEligibility } from "@/lib/auto-apply/safety-limits";
import { submitDirectApplication } from "@/lib/auto-apply/ats-api-submitter";
import { revalidatePath } from "next/cache";
import type { AutoApplyConfig, AutoApplyMode } from "@prisma/client";

export async function getAutoApplyConfigAction(): Promise<AutoApplyConfig> {
  const userId = await getRequiredUserId();

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

  return config;
}

export async function updateAutoApplyConfigAction(data: {
  isEnabled: boolean;
  mode: AutoApplyMode;
  minMatchScore: number;
  maxDailyApplies: number;
  targetCountry?: string;
  targetStates?: string[];
  enableLinkedIn?: boolean;
  enableGreenhouse?: boolean;
  enableLever?: boolean;
  enableRemoteAPIs?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getRequiredUserId();

    await prisma.autoApplyConfig.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: {
        ...data,
      },
    });

    revalidatePath("/auto-apply");
    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to update configuration" };
  }
}

export async function executeAutoApplyForJobAction(
  jobId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getRequiredUserId();
    const job = await prisma.job.findUnique({ where: { id: jobId } });

    if (!job) return { success: false, error: "Job not found" };

    const eligibility = await checkAutoApplyEligibility(userId, job.matchScore ?? 0, { isManualApply: true });
    if (!eligibility.eligible) {
      return { success: false, error: eligibility.reason };
    }

    const res = await submitDirectApplication(jobId, userId);
    if (!res.success) {
      return { success: false, error: res.error };
    }

    revalidatePath("/applications");
    revalidatePath("/auto-apply");
    revalidatePath("/jobs");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Auto-apply execution failed" };
  }
}

export async function getAutoApplyQueueAction() {
  const userId = await getRequiredUserId();

  return prisma.job.findMany({
    where: {
      userId,
      jobStatus: { not: "APPLIED" },
      isSkipped: false,
      isFiltered: false,
    },
    orderBy: [
      { dateDiscovered: "desc" },
      { matchScore: "desc" },
    ],
    take: 500,
    include: {
      aiAnalysis: true,
      applications: true,
    },
  });
}

export async function runAutoPilotBatchAction(limit: number = 5): Promise<{
  success: boolean;
  appliedCount: number;
  totalAttempted: number;
  results: Array<{ jobId: string; companyName: string; title: string; success: boolean; error?: string }>;
  error?: string;
}> {
  try {
    const userId = await getRequiredUserId();

    // 1. Fetch top jobs matching in queue
    const queue = await prisma.job.findMany({
      where: {
        userId,
        jobStatus: { not: "APPLIED" },
        isSkipped: false,
        isFiltered: false,
      },
      orderBy: [
        { matchScore: "desc" },
        { dateDiscovered: "desc" },
      ],
      take: limit,
    });

    if (queue.length === 0) {
      return { success: false, appliedCount: 0, totalAttempted: 0, results: [], error: "No eligible jobs found in queue." };
    }

    const results: Array<{ jobId: string; companyName: string; title: string; success: boolean; error?: string }> = [];
    let appliedCount = 0;

    for (const job of queue) {
      const eligibility = await checkAutoApplyEligibility(userId, job.matchScore ?? 0, { isManualApply: true });
      if (!eligibility.eligible) {
        results.push({
          jobId: job.id,
          companyName: job.companyName,
          title: job.title,
          success: false,
          error: eligibility.reason,
        });
        continue;
      }

      // Submit application with active resume
      const res = await submitDirectApplication(job.id, userId);
      if (res.success) {
        appliedCount++;
        results.push({
          jobId: job.id,
          companyName: job.companyName,
          title: job.title,
          success: true,
        });
      } else {
        results.push({
          jobId: job.id,
          companyName: job.companyName,
          title: job.title,
          success: false,
          error: res.error,
        });
      }
    }

    revalidatePath("/applications");
    revalidatePath("/auto-apply");
    revalidatePath("/jobs");

    return {
      success: true,
      appliedCount,
      totalAttempted: queue.length,
      results,
    };
  } catch (err) {
    return {
      success: false,
      appliedCount: 0,
      totalAttempted: 0,
      results: [],
      error: err instanceof Error ? err.message : "Auto-pilot batch apply failed",
    };
  }
}