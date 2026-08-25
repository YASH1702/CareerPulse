"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/client";
import { getRequiredUserId } from "@/lib/auth/session";
import { extractLinkedInProfileWithAI } from "@/lib/ai/linkedin-import";

export async function importLinkedInProfileAction(data: {
  rawText?: string;
  linkedinUrl?: string;
}) {
  try {
    const userId = await getRequiredUserId();
    const { rawText = "", linkedinUrl = "" } = data;

    if (!rawText.trim() && !linkedinUrl.trim()) {
      return { success: false, error: "Please provide your LinkedIn profile URL or paste your profile text." };
    }

    // AI / Heuristic Extraction
    const extracted = await extractLinkedInProfileWithAI(rawText || linkedinUrl, linkedinUrl);

    // Update User Name
    if (extracted.name) {
      await prisma.user.update({
        where: { id: userId },
        data: { name: extracted.name },
      });
    }

    // Upsert Profile
    const profile = await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        headline: extracted.headline,
        bio: extracted.bio,
        location: extracted.location || "India",
        phone: extracted.phone,
        currentRole: extracted.currentRole,
        yearsExperience: extracted.yearsExperience,
        targetRoles: extracted.targetRoles,
        linkedinUrl: extracted.linkedinUrl || linkedinUrl,
        githubUrl: extracted.githubUrl,
        portfolioUrl: extracted.portfolioUrl,
        preferredLocations: ["Bangalore", "Hyderabad", "Pune", "Delhi NCR", "Remote"],
      },
      update: {
        headline: extracted.headline ?? undefined,
        bio: extracted.bio ?? undefined,
        location: extracted.location ?? undefined,
        phone: extracted.phone ?? undefined,
        currentRole: extracted.currentRole ?? undefined,
        yearsExperience: extracted.yearsExperience ?? undefined,
        targetRoles: extracted.targetRoles.length > 0 ? extracted.targetRoles : undefined,
        linkedinUrl: extracted.linkedinUrl || linkedinUrl || undefined,
        githubUrl: extracted.githubUrl ?? undefined,
        portfolioUrl: extracted.portfolioUrl ?? undefined,
      },
    });

    // Ingest Skills
    if (extracted.skills && extracted.skills.length > 0) {
      for (const s of extracted.skills) {
        await prisma.skill.upsert({
          where: {
            profileId_name: {
              profileId: profile.id,
              name: s.name,
            },
          },
          create: {
            profileId: profile.id,
            name: s.name,
            category: s.category,
            proficiency: s.proficiency,
          },
          update: {
            category: s.category,
            proficiency: s.proficiency,
          },
        });
      }
    }

    // Ingest Education
    if (extracted.education && extracted.education.length > 0) {
      for (const edu of extracted.education) {
        const existing = await prisma.education.findFirst({
          where: {
            profileId: profile.id,
            institution: edu.institution,
            degree: edu.degree,
          },
        });

        if (!existing) {
          await prisma.education.create({
            data: {
              profileId: profile.id,
              institution: edu.institution,
              degree: edu.degree,
              field: edu.field,
              startYear: edu.startYear,
              endYear: edu.endYear,
            },
          });
        }
      }
    }

    revalidatePath("/profile");
    revalidatePath("/auto-apply");
    revalidatePath("/recommendations");

    return {
      success: true,
      extracted,
    };
  } catch (err) {
    console.error("[importLinkedInProfileAction Error]", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to import LinkedIn profile data.",
    };
  }
}
