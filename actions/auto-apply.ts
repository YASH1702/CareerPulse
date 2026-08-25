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

    const eligibility = await checkAutoApplyEligibility(userId, job.matchScore ?? 0);
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