"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/client";
import { getRequiredUserId } from "@/lib/auth/session";
import { type ActionResult } from "./auth";
export type { ActionResult };

// ─── Schemas ─────────────────────────────────────────────────────────────────

const basicInfoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  location: z.string().optional(),
  headline: z.string().max(120).optional(),
  bio: z.string().max(1000).optional(),
  currentRole: z.string().optional(),
  yearsExperience: z.coerce.number().min(0).max(50).optional(),
  linkedinUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  githubUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  portfolioUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  websiteUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

const jobPrefsSchema = z.object({
  remotePreference: z.enum(["REMOTE_ONLY", "HYBRID_PREFERRED", "OPEN", "ONSITE_PREFERRED"]),
  salaryMin: z.coerce.number().min(0).optional(),
  salaryMax: z.coerce.number().min(0).optional(),
  salaryCurrency: z.string().default("INR"),
  noticePeriod: z.string().optional(),
  minMatchScore: z.coerce.number().min(0).max(100).default(70),
});

// ─── Get Profile ─────────────────────────────────────────────────────────────

export async function getProfile() {
  const userId = await getRequiredUserId();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: {
          skills: { orderBy: { category: "asc" } },
          education: { orderBy: { endYear: "desc" } },
          certifications: true,
          targetCompanies: true,
        },
      },
    },
  });

  return user;
}

// ─── Upsert Basic Info ────────────────────────────────────────────────────────

export async function updateBasicInfoAction(
  prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await getRequiredUserId();

  const raw = {
    name: formData.get("name") as string,
    phone: formData.get("phone") as string,
    location: formData.get("location") as string,
    headline: formData.get("headline") as string,
    bio: formData.get("bio") as string,
    currentRole: formData.get("currentRole") as string,
    yearsExperience: formData.get("yearsExperience") as string,
    linkedinUrl: formData.get("linkedinUrl") as string,
    githubUrl: formData.get("githubUrl") as string,
    portfolioUrl: formData.get("portfolioUrl") as string,
    websiteUrl: formData.get("websiteUrl") as string,
  };

  const parsed = basicInfoSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, ...profileData } = parsed.data;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { name },
    }),
    prisma.profile.upsert({
      where: { userId },
      create: { userId, ...profileData },
      update: profileData,
    }),
  ]);

  revalidatePath("/profile");
  revalidatePath("/");
  return { success: true };
}

// ─── Job Preferences ─────────────────────────────────────────────────────────

export async function updateJobPrefsAction(
  prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const userId = await getRequiredUserId();

  const rawSalaryMin = formData.get("salaryMin") ? Number(formData.get("salaryMin")) : null;
  const rawSalaryMax = formData.get("salaryMax") ? Number(formData.get("salaryMax")) : null;

  // Convert LPA input into absolute INR (e.g. 4 LPA -> 400,000 INR; if user entered >= 1000, treat as absolute)
  const salaryMin = rawSalaryMin !== null && !isNaN(rawSalaryMin) && rawSalaryMin > 0
    ? (rawSalaryMin < 200 ? Math.round(rawSalaryMin * 100000) : Math.round(rawSalaryMin))
    : null;

  const salaryMax = rawSalaryMax !== null && !isNaN(rawSalaryMax) && rawSalaryMax > 0
    ? (rawSalaryMax < 200 ? Math.round(rawSalaryMax * 100000) : Math.round(rawSalaryMax))
    : null;

  const raw = {
    remotePreference: formData.get("remotePreference"),
    salaryMin: salaryMin ?? undefined,
    salaryMax: salaryMax ?? undefined,
    salaryCurrency: formData.get("salaryCurrency") || "INR",
    noticePeriod: formData.get("noticePeriod"),
    minMatchScore: formData.get("minMatchScore") || "70",
  };

  const parsed = jobPrefsSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Parse array fields from comma-separated strings
  const targetRoles = ((formData.get("targetRoles") as string) || "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  const preferredLocations = ((formData.get("preferredLocations") as string) || "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  const excludedKeywords = ((formData.get("excludedKeywords") as string) || "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  const priorityKeywords = ((formData.get("priorityKeywords") as string) || "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  const employmentTypes = formData.getAll("employmentTypes") as string[];

  await prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      ...parsed.data,
      salaryMin,
      salaryMax,
      targetRoles,
      preferredLocations,
      excludedKeywords,
      priorityKeywords,
      employmentTypes: employmentTypes as never[],
    },
    update: {
      ...parsed.data,
      salaryMin,
      salaryMax,
      targetRoles,
      preferredLocations,
      excludedKeywords,
      priorityKeywords,
      employmentTypes: employmentTypes as never[],
    },
  });

  revalidatePath("/profile");
  return { success: true };
}

// ─── Skills ───────────────────────────────────────────────────────────────────

export async function addSkillAction(formData: FormData): Promise<ActionResult> {
  const userId = await getRequiredUserId();

  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) {
    await prisma.profile.create({ data: { userId } });
  }

  const profileRecord = await prisma.profile.findUnique({ where: { userId } });
  if (!profileRecord) return { success: false, error: "Profile not found" };

  const name = (formData.get("name") as string)?.trim();
  const category = formData.get("category") as string;
  const proficiency = formData.get("proficiency") as string;
  const yearsUsed = formData.get("yearsUsed") ? Number(formData.get("yearsUsed")) : null;

  if (!name || !category || !proficiency) {
    return { success: false, error: "Name, category and proficiency are required" };
  }

  await prisma.skill.upsert({
    where: { profileId_name: { profileId: profileRecord.id, name } },
    create: {
      profileId: profileRecord.id,
      name,
      category: category as never,
      proficiency: proficiency as never,
      yearsUsed,
    },
    update: { category: category as never, proficiency: proficiency as never, yearsUsed },
  });

  revalidatePath("/profile");
  return { success: true };
}

export async function deleteSkillAction(skillId: string): Promise<ActionResult> {
  const userId = await getRequiredUserId();
  const skill = await prisma.skill.findFirst({
    where: { id: skillId, profile: { userId } },
  });
  if (!skill) return { success: false, error: "Skill not found" };

  await prisma.skill.delete({ where: { id: skillId } });
  revalidatePath("/profile");
  return { success: true };
}

// ─── Education ────────────────────────────────────────────────────────────────

export async function addEducationAction(formData: FormData): Promise<ActionResult> {
  const userId = await getRequiredUserId();

  let profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) {
    profile = await prisma.profile.create({ data: { userId } });
  }

  await prisma.education.create({
    data: {
      profileId: profile.id,
      institution: formData.get("institution") as string,
      degree: formData.get("degree") as string,
      field: (formData.get("field") as string) || null,
      startYear: formData.get("startYear") ? Number(formData.get("startYear")) : null,
      endYear: formData.get("endYear") ? Number(formData.get("endYear")) : null,
      grade: (formData.get("grade") as string) || null,
    },
  });

  revalidatePath("/profile");
  return { success: true };
}

export async function deleteEducationAction(id: string): Promise<ActionResult> {
  const userId = await getRequiredUserId();
  await prisma.education.deleteMany({
    where: { id, profile: { userId } },
  });
  revalidatePath("/profile");
  return { success: true };
}