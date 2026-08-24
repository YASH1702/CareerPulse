"use server";

import { generateRecruiterOutreach, RecruiterOutreachPackage } from "@/lib/ai/recruiter-outreach";
import { generateInterviewPrepGuide, InterviewPrepGuide } from "@/lib/ai/interview-prep";
import { getSalaryBenchmark, SalaryBenchmark } from "@/lib/scoring/salary-benchmark";
import prisma from "@/lib/db/client";
import { getRequiredUserId } from "@/lib/auth/session";

export async function getRecruiterOutreachAction(
  jobId: string,
  targetType: "ENGINEERING_MANAGER" | "TECHNICAL_RECRUITER" = "ENGINEERING_MANAGER"
): Promise<{ success: boolean; data?: RecruiterOutreachPackage; error?: string }> {
  try {
    const data = await generateRecruiterOutreach(jobId, targetType);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to generate outreach" };
  }
}

export async function getInterviewPrepAction(
  jobId: string
): Promise<{ success: boolean; data?: InterviewPrepGuide; error?: string }> {
  try {
    const data = await generateInterviewPrepGuide(jobId);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to generate interview prep" };
  }
}

export async function getSalaryBenchmarkAction(
  jobId: string
): Promise<{ success: boolean; data?: SalaryBenchmark; error?: string }> {
  try {
    const userId = await getRequiredUserId();
    const [job, profile] = await Promise.all([
      prisma.job.findUnique({ where: { id: jobId } }),
      prisma.profile.findUnique({ where: { userId } }),
    ]);

    if (!job) return { success: false, error: "Job not found" };

    const data = getSalaryBenchmark(
      job.title,
      job.salaryMin,
      job.salaryMax,
      job.salaryCurrency || profile?.salaryCurrency || "INR",
      profile?.yearsExperience || 3
    );

    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to calculate salary benchmark" };
  }
}