"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/client";
import { getRequiredUserId } from "@/lib/auth/session";
import { generateCoverLetterWithAI, type CoverLetterTone } from "@/lib/ai/cover-letter";
import type { ResumeData } from "@/types/resume";
import type { ActionResult } from "./auth";
import type { ApplicationStatus } from "@prisma/client";

export type { ActionResult };

// ─── Get Applications ────────────────────────────────────────────────────────

export async function getApplications() {
  const userId = await getRequiredUserId();

  const applications = await prisma.application.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          companyName: true,
          location: true,
          remoteType: true,
          salaryText: true,
          applicationUrl: true,
          matchScore: true,
        },
      },
      resume: {
        select: {
          id: true,
          name: true,
          resumeType: true,
          fileUrl: true,
        },
      },
      interviews: {
        orderBy: { scheduledAt: "asc" },
      },
      events: {
        orderBy: { occurredAt: "desc" },
        take: 5,
      },
    },
  });

  return applications;
}

// ─── Get Single Application / Package ────────────────────────────────────────

export async function getApplicationById(applicationId: string) {
  const userId = await getRequiredUserId();

  return prisma.application.findFirst({
    where: { id: applicationId, userId },
    include: {
      job: {
        include: {
          aiAnalysis: true,
          company: true,
        },
      },
      resume: true,
      interviews: true,
      events: {
        orderBy: { occurredAt: "desc" },
      },
    },
  });
}

// ─── Generate & Save Cover Letter ────────────────────────────────────────────

export async function generateCoverLetterAction(params: {
  jobId: string;
  tone?: CoverLetterTone;
  customNotes?: string;
}): Promise<ActionResult & { coverLetterText?: string; applicationId?: string }> {
  const userId = await getRequiredUserId();
  const { jobId, tone = "PROFESSIONAL", customNotes } = params;

  const [job, profile, activeResume] = await Promise.all([
    prisma.job.findFirst({ where: { id: jobId, userId } }),
    prisma.profile.findUnique({
      where: { userId },
      include: { skills: true },
    }),
    prisma.resume.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!job) return { success: false, error: "Job not found" };

  const resumeData: ResumeData | null = activeResume ? {
    summary: activeResume.summary ?? undefined,
    skills: (activeResume.skills as unknown as ResumeData["skills"]) || { technical: [], soft: [] },
    experience: (activeResume.experience as unknown as ResumeData["experience"]) || [],
    projects: (activeResume.projects as unknown as ResumeData["projects"]) || [],
    education: (activeResume.education as unknown as ResumeData["education"]) || [],
    certifications: (activeResume.certifications as unknown as ResumeData["certifications"]) || [],
    achievements: (activeResume.achievements as unknown as string[]) || [],
  } : null;

  const res = await generateCoverLetterWithAI({
    job,
    profile,
    resumeData,
    tone,
    customNotes,
  });

  if (!res.success || !res.coverLetter) {
    return { success: false, error: res.error || "Failed to generate cover letter" };
  }

  const coverLetterText = res.coverLetter.fullText;

  // Save to application record
  let application = await prisma.application.findFirst({
    where: { userId, jobId },
  });

  if (application) {
    application = await prisma.application.update({
      where: { id: application.id },
      data: {
        coverLetterText,
        appStatus: application.appStatus === "NEW" ? "READY" : application.appStatus,
      },
    });
  } else {
    application = await prisma.application.create({
      data: {
        userId,
        jobId,
        coverLetterText,
        appStatus: "READY",
      },
    });
  }

  revalidatePath("/applications");
  revalidatePath("/jobs");

  return {
    success: true,
    coverLetterText,
    applicationId: application.id,
  };
}

// ─── Update Application Status & Audit Event ─────────────────────────────────

export async function updateApplicationStatusAction(
  applicationId: string,
  newStatus: ApplicationStatus,
  note?: string
): Promise<ActionResult> {
  const userId = await getRequiredUserId();

  const app = await prisma.application.findFirst({
    where: { id: applicationId, userId },
  });

  if (!app) return { success: false, error: "Application not found" };

  const prevStatus = app.appStatus;

  await prisma.$transaction([
    prisma.application.update({
      where: { id: applicationId },
      data: {
        appStatus: newStatus,
        appliedAt: newStatus === "APPLIED" && !app.appliedAt ? new Date() : app.appliedAt,
      },
    }),
    prisma.applicationEvent.create({
      data: {
        applicationId,
        eventType: "STATUS_CHANGED",
        description: note || `Moved status from ${prevStatus} to ${newStatus}`,
        metadata: { fromStatus: prevStatus, toStatus: newStatus },
      },
    }),
  ]);

  revalidatePath("/applications");
  revalidatePath("/jobs");
  revalidatePath("/");

  return { success: true };
}

// ─── Mark as Applied ─────────────────────────────────────────────────────────

export async function markJobAsAppliedAction(params: {
  jobId: string;
  appliedVia?: string;
  notes?: string;
}): Promise<ActionResult> {
  const userId = await getRequiredUserId();
  const { jobId, appliedVia, notes } = params;

  let app = await prisma.application.findFirst({
    where: { userId, jobId },
  });

  if (app) {
    await prisma.$transaction([
      prisma.application.update({
        where: { id: app.id },
        data: {
          appStatus: "APPLIED",
          appliedAt: new Date(),
          notes: notes ? `${app.notes ? app.notes + "\n" : ""}${notes}` : app.notes,
        },
      }),
      prisma.applicationEvent.create({
        data: {
          applicationId: app.id,
          eventType: "APPLIED",
          description: `Marked as applied via ${appliedVia || "Company Website"}`,
          metadata: { fromStatus: app.appStatus, toStatus: "APPLIED" },
        },
      }),
    ]);
  } else {
    app = await prisma.application.create({
      data: {
        userId,
        jobId,
        appStatus: "APPLIED",
        appliedAt: new Date(),
        notes,
      },
    });

    await prisma.applicationEvent.create({
      data: {
        applicationId: app.id,
        eventType: "APPLIED",
        description: `Direct applied via ${appliedVia || "Company Website"}`,
        metadata: { fromStatus: "NEW", toStatus: "APPLIED" },
      },
    });
  }

  // Update job status to APPLIED
  await prisma.job.update({
    where: { id: jobId },
    data: { jobStatus: "APPLIED" },
  });

  revalidatePath("/applications");
  revalidatePath("/jobs");
  revalidatePath("/");

  return { success: true };
}