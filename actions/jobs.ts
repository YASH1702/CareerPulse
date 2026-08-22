"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/client";
import { getRequiredUserId } from "@/lib/auth/session";
import { generateJobHash } from "@/utils/hash";
import { extractJobWithAI } from "@/lib/ai/extract-job";
import type { ActionResult } from "./auth";
import type { JobSource, JobStatus, RemoteType, EmploymentType } from "@prisma/client";

export type { ActionResult };

export interface JobQueryFilters {
  search?: string;
  status?: string;
  remoteType?: string;
  minScore?: number;
  savedOnly?: boolean;
  sortBy?: "date" | "score" | "company";
}

// ─── Get Jobs with Filters ───────────────────────────────────────────────────

export async function getJobs(filters: JobQueryFilters = {}) {
  const userId = await getRequiredUserId();

  const whereClause: Record<string, unknown> = {
    userId,
  };

  if (filters.search && filters.search.trim()) {
    const q = filters.search.trim();
    whereClause.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { companyName: { contains: q, mode: "insensitive" } },
      { requiredSkills: { hasSome: [q] } },
      { location: { contains: q, mode: "insensitive" } },
    ];
  }

  if (filters.status && filters.status !== "ALL") {
    whereClause.jobStatus = filters.status as JobStatus;
  }

  if (filters.remoteType && filters.remoteType !== "ALL") {
    whereClause.remoteType = filters.remoteType as RemoteType;
  }

  if (filters.savedOnly) {
    whereClause.isSaved = true;
  }

  if (typeof filters.minScore === "number" && filters.minScore > 0) {
    whereClause.matchScore = { gte: filters.minScore };
  }

  let orderBy: Record<string, "asc" | "desc"> = { createdAt: "desc" };
  if (filters.sortBy === "score") {
    orderBy = { matchScore: "desc" };
  } else if (filters.sortBy === "company") {
    orderBy = { companyName: "asc" };
  }

  return prisma.job.findMany({
    where: whereClause,
    orderBy,
    include: {
      aiAnalysis: {
        select: {
          matchScore: true,
          category: true,
          recommendation: true,
          strengths: true,
          missingSkills: true,
          whyApply: true,
        },
      },
      applications: {
        select: {
          id: true,
          appStatus: true,
          appliedAt: true,
        },
      },
    },
  });
}

// ─── Get Single Job ─────────────────────────────────────────────────────────

export async function getJobById(id: string) {
  const userId = await getRequiredUserId();

  return prisma.job.findFirst({
    where: { id, userId },
    include: {
      company: true,
      aiAnalysis: true,
      applications: {
        include: {
          resume: { select: { id: true, name: true, fileUrl: true } },
          interviews: true,
        },
      },
    },
  });
}

// ─── AI Extraction Server Action ─────────────────────────────────────────────

export async function extractJobFromTextAction(rawText: string) {
  await getRequiredUserId();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "sk-your-openai-api-key") {
    return {
      success: false,
      error: "OpenAI API key not configured. Please fill in details manually.",
    };
  }

  try {
    const result = await extractJobWithAI(rawText);
    return {
      success: true,
      data: result.data,
      costUsd: result.costUsd,
    };
  } catch (err: unknown) {
    console.error("[Job Extract Action Error]", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to extract job information.",
    };
  }
}

// ─── Create or Import Job ────────────────────────────────────────────────────

export async function createJobAction(formData: FormData): Promise<ActionResult & { jobId?: string }> {
  const userId = await getRequiredUserId();

  const title = (formData.get("title") as string)?.trim();
  const companyName = (formData.get("companyName") as string)?.trim();
  const location = (formData.get("location") as string)?.trim() || null;
  const remoteType = (formData.get("remoteType") as RemoteType) || "UNSPECIFIED";
  const employmentType = (formData.get("employmentType") as EmploymentType) || "FULL_TIME";
  const applicationUrl = (formData.get("applicationUrl") as string)?.trim() || null;
  const rawDescription = (formData.get("rawDescription") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || rawDescription || null;
  const experienceRequired = (formData.get("experienceRequired") as string)?.trim() || null;
  const salaryText = (formData.get("salaryText") as string)?.trim() || null;
  const salaryMin = formData.get("salaryMin") ? Number(formData.get("salaryMin")) : null;
  const salaryMax = formData.get("salaryMax") ? Number(formData.get("salaryMax")) : null;
  const salaryCurrency = (formData.get("salaryCurrency") as string) || "INR";
  const source = ((formData.get("source") as JobSource) || "MANUAL");
  const sourceUrl = (formData.get("sourceUrl") as string)?.trim() || applicationUrl || null;

  if (!title || !companyName) {
    return { success: false, error: "Job title and company name are required." };
  }

  // Parse skill arrays
  const requiredSkills = ((formData.get("requiredSkills") as string) || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const preferredSkills = ((formData.get("preferredSkills") as string) || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const responsibilities = ((formData.get("responsibilities") as string) || "")
    .split("\n")
    .map((s) => s.trim().replace(/^[-*•]\s*/, ""))
    .filter(Boolean);

  // Compute hash for deduplication
  const contentHash = generateJobHash({
    companyName,
    title,
    location,
    applicationUrl,
  });

  // Check if existing duplicate
  const existingJob = await prisma.job.findFirst({
    where: { userId, contentHash },
  });

  if (existingJob) {
    return {
      success: false,
      error: `This job appears to be already saved ("${existingJob.title}" at ${existingJob.companyName}).`,
    };
  }

  // Find or create company
  let company = await prisma.company.findUnique({
    where: { userId_name: { userId, name: companyName } },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        userId,
        name: companyName,
        location: location ?? undefined,
      },
    });
  }

  // Create job
  const job = await prisma.job.create({
    data: {
      userId,
      companyId: company.id,
      title,
      companyName,
      location,
      remoteType,
      employmentType,
      rawDescription,
      description,
      requiredSkills,
      preferredSkills,
      responsibilities,
      experienceRequired,
      salaryMin,
      salaryMax,
      salaryCurrency,
      salaryText,
      source,
      sourceUrl,
      applicationUrl,
      contentHash,
      jobStatus: "NEW",
    },
  });

  revalidatePath("/jobs");
  revalidatePath("/");
  return { success: true, jobId: job.id };
}

// ─── Toggle Save ─────────────────────────────────────────────────────────────

export async function toggleSaveJobAction(jobId: string): Promise<ActionResult> {
  const userId = await getRequiredUserId();

  const job = await prisma.job.findFirst({ where: { id: jobId, userId } });
  if (!job) return { success: false, error: "Job not found" };

  await prisma.job.update({
    where: { id: jobId },
    data: { isSaved: !job.isSaved },
  });

  revalidatePath("/jobs");
  return { success: true };
}

// ─── Toggle Skip ─────────────────────────────────────────────────────────────

export async function toggleSkipJobAction(jobId: string): Promise<ActionResult> {
  const userId = await getRequiredUserId();

  const job = await prisma.job.findFirst({ where: { id: jobId, userId } });
  if (!job) return { success: false, error: "Job not found" };

  const nextSkipped = !job.isSkipped;
  await prisma.job.update({
    where: { id: jobId },
    data: {
      isSkipped: nextSkipped,
      jobStatus: nextSkipped ? "SKIPPED" : "NEW",
    },
  });

  revalidatePath("/jobs");
  return { success: true };
}

// ─── Delete Job ──────────────────────────────────────────────────────────────

export async function deleteJobAction(jobId: string): Promise<ActionResult> {
  const userId = await getRequiredUserId();

  const job = await prisma.job.findFirst({ where: { id: jobId, userId } });
  if (!job) return { success: false, error: "Job not found" };

  await prisma.job.delete({ where: { id: jobId } });

  revalidatePath("/jobs");
  revalidatePath("/");
  return { success: true };
}