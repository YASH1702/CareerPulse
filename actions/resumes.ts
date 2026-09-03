"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/client";
import { getRequiredUserId } from "@/lib/auth/session";
import { deleteResumeFile } from "@/lib/storage/client";
import { formatResumeToRawText } from "./tailor";
import { estimateWordCount } from "@/lib/resume/parser";
import type { ActionResult } from "./auth";

export type { ActionResult };

export async function getResumes() {
  const userId = await getRequiredUserId();
  return prisma.resume.findMany({
    where: { userId },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      resumeType: true,
      fileName: true,
      fileUrl: true,
      fileType: true,
      wordCount: true,
      atsScore: true,
      targetRole: true,
      description: true,
      summary: true,
      skills: true,
      experience: true,
      projects: true,
      education: true,
      certifications: true,
      achievements: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getResumeById(id: string) {
  const userId = await getRequiredUserId();
  return prisma.resume.findFirst({
    where: { id, userId },
  });
}

export async function updateResumeNameAction(
  resumeId: string,
  name: string
): Promise<ActionResult> {
  const userId = await getRequiredUserId();
  const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId } });
  if (!resume) return { success: false, error: "Resume not found" };

  await prisma.resume.update({ where: { id: resumeId }, data: { name } });
  revalidatePath("/resumes");
  return { success: true };
}

export async function updateResumeContentAction(
  resumeId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
): Promise<ActionResult> {
  const userId = await getRequiredUserId();
  const [resume, user, profile] = await Promise.all([
    prisma.resume.findFirst({ where: { id: resumeId, userId } }),
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.profile.findUnique({ where: { userId } }),
  ]);

  if (!resume) return { success: false, error: "Resume not found" };

  const rawText = formatResumeToRawText(
    data,
    user?.name,
    profile?.headline,
    profile ? `${profile.location || ""} · ${profile.phone || ""}` : null
  );
  const wordCount = estimateWordCount(rawText);

  await prisma.resume.update({
    where: { id: resumeId },
    data: {
      rawText,
      wordCount,
      summary: data.summary || null,
      skills: data.skills || undefined,
      experience: data.experience || undefined,
      projects: data.projects || undefined,
      education: data.education || undefined,
      certifications: data.certifications || undefined,
      achievements: data.achievements || undefined,
    },
  });

  // Sync technical skills to candidate Profile
  const techSkills = data.skills?.technical || [];
  if (techSkills.length > 0 && profile) {
    for (const skill of techSkills) {
      const existing = await prisma.profileSkill.findFirst({
        where: { profileId: profile.id, name: { equals: skill, mode: "insensitive" } },
      });
      if (!existing) {
        await prisma.profileSkill.create({
          data: {
            profileId: profile.id,
            name: skill,
            level: "INTERMEDIATE",
          },
        });
      }
    }
  }

  revalidatePath("/resumes");
  revalidatePath(`/resumes/${resumeId}`);
  revalidatePath("/profile");
  revalidatePath("/auto-apply");
  return { success: true };
}

export async function deleteResumeAction(resumeId: string): Promise<ActionResult> {
  const userId = await getRequiredUserId();
  const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId } });
  if (!resume) return { success: false, error: "Resume not found" };

  // Delete from storage
  if (resume.fileUrl) {
    await deleteResumeFile(resume.fileUrl);
  }

  // Delete from database
  await prisma.resume.delete({
    where: { id: resumeId },
  });

  // If deleted resume was active, activate the most recent remaining resume
  const nextResume = await prisma.resume.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  if (nextResume) {
    await prisma.resume.update({
      where: { id: nextResume.id },
      data: { isActive: true },
    });
  }

  revalidatePath("/resumes");
  revalidatePath("/auto-apply");
  return { success: true };
}

export async function setActiveResumeAction(resumeId: string): Promise<ActionResult> {
  const userId = await getRequiredUserId();
  const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId } });
  if (!resume) return { success: false, error: "Resume not found" };

  // Set all resumes inactive, then activate this one
  await prisma.resume.updateMany({
    where: { userId },
    data: { isActive: false },
  });
  await prisma.resume.update({
    where: { id: resumeId },
    data: { isActive: true },
  });

  revalidatePath("/resumes");
  revalidatePath("/auto-apply");
  return { success: true };
}