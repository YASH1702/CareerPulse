"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/client";
import { getRequiredUserId } from "@/lib/auth/session";
import { tailorResumeWithAI } from "@/lib/ai/tailor-resume";
import type { ResumeData } from "@/types/resume";
import type { ActionResult } from "./auth";

export type { ActionResult };

export async function tailorResumeAction(
  jobId: string,
  focusAreas?: string[]
): Promise<ActionResult & { tailoredResume?: ResumeData }> {
  const userId = await getRequiredUserId();

  const [job, activeResume] = await Promise.all([
    prisma.job.findFirst({ where: { id: jobId, userId } }),
    prisma.resume.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!job) return { success: false, error: "Job not found" };
  if (!activeResume) {
    return {
      success: false,
      error: "No active resume found. Please upload your master resume first.",
    };
  }

  const masterResume: ResumeData = {
    summary: activeResume.summary ?? undefined,
    skills: (activeResume.skills as unknown as ResumeData["skills"]) || { technical: [], soft: [] },
    experience: (activeResume.experience as unknown as ResumeData["experience"]) || [],
    projects: (activeResume.projects as unknown as ResumeData["projects"]) || [],
    education: (activeResume.education as unknown as ResumeData["education"]) || [],
    certifications: (activeResume.certifications as unknown as ResumeData["certifications"]) || [],
    achievements: (activeResume.achievements as unknown as string[]) || [],
  };

  const res = await tailorResumeWithAI({ masterResume, job, focusAreas });

  if (!res.success || !res.tailoredResume) {
    return { success: false, error: res.error || "Failed to tailor resume" };
  }

  return {
    success: true,
    tailoredResume: res.tailoredResume,
  };
}

export async function saveTailoredResumeAction(
  jobId: string,
  tailoredData: ResumeData,
  resumeName?: string
): Promise<ActionResult & { resumeId?: string; applicationId?: string }> {
  const userId = await getRequiredUserId();

  const job = await prisma.job.findFirst({ where: { id: jobId, userId } });
  if (!job) return { success: false, error: "Job not found" };

  const name = resumeName || `Tailored: ${job.title} at ${job.companyName}`;

  // 1. Create Tailored Resume in DB
  const savedResume = await prisma.resume.create({
    data: {
      userId,
      name,
      resumeType: "TAILORED",
      targetRole: job.title,
      summary: tailoredData.summary ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      skills: (tailoredData.skills ?? undefined) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      experience: (tailoredData.experience ?? undefined) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      projects: (tailoredData.projects ?? undefined) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      education: (tailoredData.education ?? undefined) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      certifications: (tailoredData.certifications ?? undefined) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      achievements: (tailoredData.achievements ?? undefined) as any,
      isActive: true,
    },
  });

  // 2. Link or Create Application
  let application = await prisma.application.findFirst({
    where: { userId, jobId },
  });

  if (application) {
    application = await prisma.application.update({
      where: { id: application.id },
      data: {
        resumeId: savedResume.id,
        tailoredResumeId: savedResume.id,
        tailoredSummary: tailoredData.summary || null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tailoredSkills: tailoredData.skills as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tailoredExp: tailoredData.experience as any,
        appStatus: application.appStatus === "NEW" ? "READY" : application.appStatus,
      },
    });
  } else {
    application = await prisma.application.create({
      data: {
        userId,
        jobId,
        resumeId: savedResume.id,
        tailoredResumeId: savedResume.id,
        tailoredSummary: tailoredData.summary || null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tailoredSkills: tailoredData.skills as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tailoredExp: tailoredData.experience as any,
        appStatus: "READY",
      },
    });
  }

  revalidatePath("/resumes");
  revalidatePath("/applications");
  revalidatePath("/jobs");

  return {
    success: true,
    resumeId: savedResume.id,
    applicationId: application.id,
  };
}