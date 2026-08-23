"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/client";
import { getRequiredUserId } from "@/lib/auth/session";
import type { ActionResult } from "./auth";
import type { CompanySentiment } from "@prisma/client";

export type { ActionResult };

export async function getCompanies() {
  const userId = await getRequiredUserId();

  return prisma.company.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: {
      jobs: {
        select: {
          id: true,
          title: true,
          matchScore: true,
          jobStatus: true,
        },
      },
    },
  });
}

export async function createCompanyAction(formData: FormData): Promise<ActionResult> {
  const userId = await getRequiredUserId();

  const name = (formData.get("name") as string)?.trim();
  const website = (formData.get("website") as string)?.trim() || null;
  const industry = (formData.get("industry") as string)?.trim() || null;
  const size = (formData.get("size") as string)?.trim() || null;
  const location = (formData.get("location") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!name) {
    return { success: false, error: "Company name is required." };
  }

  const existing = await prisma.company.findUnique({
    where: { userId_name: { userId, name } },
  });

  if (existing) {
    return { success: false, error: "A company with this name already exists." };
  }

  await prisma.company.create({
    data: {
      userId,
      name,
      website,
      industry,
      size,
      location,
      description,
      notes,
    },
  });

  revalidatePath("/companies");
  return { success: true };
}

export async function updateCompanySentimentAction(
  companyName: string,
  sentiment: CompanySentiment
): Promise<ActionResult> {
  const userId = await getRequiredUserId();

  const profile = await prisma.profile.findUnique({
    where: { userId },
  });

  if (!profile) return { success: false, error: "Profile not found" };

  const existing = await prisma.targetCompany.findFirst({
    where: { profileId: profile.id, name: companyName },
  });

  if (existing) {
    await prisma.targetCompany.update({
      where: { id: existing.id },
      data: { sentiment },
    });
  } else {
    await prisma.targetCompany.create({
      data: {
        profileId: profile.id,
        name: companyName,
        sentiment,
      },
    });
  }

  revalidatePath("/companies");
  return { success: true };
}

export async function deleteCompanyAction(companyId: string): Promise<ActionResult> {
  const userId = await getRequiredUserId();

  const company = await prisma.company.findFirst({
    where: { id: companyId, userId },
  });

  if (!company) return { success: false, error: "Company not found" };

  await prisma.company.delete({ where: { id: companyId } });

  revalidatePath("/companies");
  return { success: true };
}