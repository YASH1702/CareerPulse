"use server";

import prisma from "@/lib/db/client";
import { getRequiredUserId } from "@/lib/auth/session";
import { fetchAllAggregatorJobs } from "@/lib/jobs/sources/aggregators";
import { fetchLinkedInGuestJobs } from "@/lib/jobs/sources/linkedin-guest";
import { fetchGreenhouseJobs, fetchLeverJobs } from "@/lib/jobs/sources/ats-boards";
import { generateJobHash } from "@/utils/hash";
import { evaluateJobPreFilters } from "@/lib/jobs/filter";
import { revalidatePath } from "next/cache";
import type { NormalizedJob } from "@/lib/jobs/sources/types";

export interface SourcingResult {
  success: boolean;
  totalFetched: number;
  newImported: number;
  duplicates: number;
  filteredOut: number;
  error?: string;
}

export async function runAutoScrapeAction(sources?: {
  linkedin?: boolean;
  aggregators?: boolean;
  targetCompanies?: boolean;
}): Promise<SourcingResult> {
  try {
    const userId = await getRequiredUserId();

    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        skills: true,
        targetCompanies: true,
      },
    });

    if (!profile) {
      return { success: false, totalFetched: 0, newImported: 0, duplicates: 0, filteredOut: 0, error: "Profile not found" };
    }

    const keywords = profile.targetRoles.length > 0 ? profile.targetRoles : ["Software Engineer", "Frontend Developer"];
    const allFetchedJobs: NormalizedJob[] = [];

    // 1. Fetch Aggregators (RemoteOK, Himalayas, Arbeitnow)
    if (sources?.aggregators !== false) {
      const aggJobs = await fetchAllAggregatorJobs(keywords);
      allFetchedJobs.push(...aggJobs);
    }

    // 2. Fetch LinkedIn Guest Jobs
    if (sources?.linkedin !== false) {
      for (const role of keywords.slice(0, 2)) {
        const liJobs = await fetchLinkedInGuestJobs(role, profile.location || "Remote", 15);
        allFetchedJobs.push(...liJobs);
      }
    }

    // 3. Fetch Target Company ATS Boards
    if (sources?.targetCompanies !== false && profile.targetCompanies.length > 0) {
      for (const comp of profile.targetCompanies.slice(0, 5)) {
        const slug = comp.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        const [gh, lev] = await Promise.all([
          fetchGreenhouseJobs(slug),
          fetchLeverJobs(slug),
        ]);
        allFetchedJobs.push(...gh, ...lev);
      }
    }

    let newImported = 0;
    let duplicates = 0;
    let filteredOut = 0;

    for (const job of allFetchedJobs) {
      const contentHash = generateJobHash({
        companyName: job.companyName,
        title: job.title,
        location: job.location,
        applicationUrl: job.applicationUrl,
      });

      // Check duplicate
      const existing = await prisma.job.findFirst({
        where: { userId, contentHash },
      });

      if (existing) {
        duplicates++;
        continue;
      }

      // Check pre-filter
      const filterResult = evaluateJobPreFilters(
        {
          ...job,
          location: job.location ?? null,
          salaryMax: job.salaryMax ?? null,
        },
        profile
      );

      // Auto link company
      let company = await prisma.company.findFirst({
        where: { userId, name: { equals: job.companyName, mode: "insensitive" } },
      });

      if (!company) {
        company = await prisma.company.create({
          data: {
            userId,
            name: job.companyName,
            location: job.location,
          },
        });
      }

      await prisma.job.create({
        data: {
          userId,
          companyId: company.id,
          title: job.title,
          companyName: job.companyName,
          location: job.location,
          remoteType: job.remoteType,
          employmentType: job.employmentType || "FULL_TIME",
          description: job.description,
          rawDescription: job.rawDescription,
          requiredSkills: job.requiredSkills,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          salaryCurrency: job.salaryCurrency || "INR",
          salaryText: job.salaryText,
          source: job.source,
          sourceUrl: job.sourceUrl,
          sourceJobId: job.sourceJobId,
          applicationUrl: job.applicationUrl,
          contentHash,
          isFiltered: filterResult.isFiltered,
          filterReason: filterResult.filterReason,
          freshness: job.freshness,
          datePosted: job.datePosted,
          jobStatus: "NEW",
        },
      });

      if (filterResult.isFiltered) {
        filteredOut++;
      } else {
        newImported++;
      }
    }

    revalidatePath("/jobs");
    revalidatePath("/recommendations");
    revalidatePath("/analytics");

    return {
      success: true,
      totalFetched: allFetchedJobs.length,
      newImported,
      duplicates,
      filteredOut,
    };
  } catch (err) {
    console.error("[runAutoScrapeAction Error]", err);
    return {
      success: false,
      totalFetched: 0,
      newImported: 0,
      duplicates: 0,
      filteredOut: 0,
      error: err instanceof Error ? err.message : "Failed to run automated scraper",
    };
  }
}