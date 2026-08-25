"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/client";
import { getRequiredUserId } from "@/lib/auth/session";
import { deleteResumeFile } from "@/lib/storage/client";
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