"use server";

import prisma from "@/lib/db/client";
import { getRequiredUserId } from "@/lib/auth/session";
import { fetchAllAggregatorJobs } from "@/lib/jobs/sources/aggregators";
import { fetchLinkedInGuestJobs } from "@/lib/jobs/sources/linkedin-guest";
import { fetchGreenhouseJobs, fetchLeverJobs } from "@/lib/jobs/sources/ats-boards";
import { generateJobHash } from "@/utils/hash";
import { evaluateJobPreFilters } from "@/lib/jobs/filter";
import { calculateKeywordOverlap } from "@/lib/scoring/rank";
import { getScraperLocationQuery, getScraperSearchQueries, isLocationMatchingIndia, isRoleMatchingTargets } from "@/lib/jobs/locations";
import { revalidatePath } from "next/cache";
import type { NormalizedJob } from "@/lib/jobs/sources/types";

export interface SourcingResult {
  success: boolean;
  totalFetched: number;
  newImported: number;
  existingPreserved: number;
  filteredOut: number;
  totalActiveQueue: number;
  error?: string;
}

export async function runAutoScrapeAction(options?: {
  linkedin?: boolean;
  aggregators?: boolean;
  targetCompanies?: boolean;
  selectedState?: string;
}): Promise<SourcingResult> {
  try {
    const userId = await getRequiredUserId();

    const [profile, config] = await Promise.all([
      prisma.profile.findUnique({
        where: { userId },
        include: {
          skills: true,
          targetCompanies: true,
        },
      }),
      prisma.autoApplyConfig.findUnique({ where: { userId } }),
    ]);

    let userProfile = profile;

    if (!userProfile) {
      userProfile = await prisma.profile.create({
        data: {
          userId,
          headline: "Full Stack Engineer",
          currentRole: "Software Engineer",
          targetRoles: ["Software Engineer", "Frontend Developer", "Full Stack Developer", "Backend Developer"],
          preferredLocations: ["India", "Bangalore", "Hyderabad", "Pune", "Remote"],
          remotePreference: "OPEN",
          salaryMin: 1200000,
          salaryMax: 3500000,
          salaryCurrency: "INR",
          noticePeriod: "30 days",
          yearsExperience: 3,
        },
        include: {
          skills: true,
          targetCompanies: true,
        },
      });

      // Add default skills
      await prisma.skill.createMany({
        data: [
          { profileId: userProfile.id, name: "React", category: "FRAMEWORK", proficiency: "ADVANCED", yearsUsed: 3 },
          { profileId: userProfile.id, name: "TypeScript", category: "LANGUAGE", proficiency: "ADVANCED", yearsUsed: 3 },
          { profileId: userProfile.id, name: "Next.js", category: "FRAMEWORK", proficiency: "ADVANCED", yearsUsed: 2 },
          { profileId: userProfile.id, name: "Node.js", category: "FRAMEWORK", proficiency: "INTERMEDIATE", yearsUsed: 3 },
          { profileId: userProfile.id, name: "PostgreSQL", category: "DATABASE", proficiency: "INTERMEDIATE", yearsUsed: 2 },
          { profileId: userProfile.id, name: "Python", category: "LANGUAGE", proficiency: "INTERMEDIATE", yearsUsed: 2 },
        ],
        skipDuplicates: true,
      });

      userProfile = await prisma.profile.findUnique({
        where: { userId },
        include: { skills: true, targetCompanies: true },
      });
    }

    if (!userProfile) {
      return { success: false, totalFetched: 0, newImported: 0, duplicates: 0, filteredOut: 0, error: "Failed to initialize profile" };
    }

    const keywords =
      userProfile.targetRoles && userProfile.targetRoles.length > 0
        ? userProfile.targetRoles
        : ["Software Engineer", "Frontend Developer", "Full Stack Developer"];

    // Location query setup (Default to India)
    const targetState = options?.selectedState || config?.targetStates?.[0] || "all_india";
    const locationQuery = getScraperLocationQuery(targetState);

    const allFetchedJobs: NormalizedJob[] = [];

    // 1. Fetch Aggregators (RemoteOK, Himalayas, Arbeitnow)
    if (options?.aggregators !== false) {
      const aggJobs = await fetchAllAggregatorJobs(["Software", "Developer", "Engineer", "React", "Frontend", "Backend"]);
      allFetchedJobs.push(...aggJobs);
    }

    // 2. Fetch LinkedIn Guest Jobs (Targeting Indian States / Multi-Hub Queries)
    if (options?.linkedin !== false) {
      const searchQueries = getScraperSearchQueries(targetState);
      const targetRoleKeywords = keywords.slice(0, 3);

      const liPromises = [];
      for (const loc of searchQueries.slice(0, 4)) {
        for (const role of targetRoleKeywords) {
          liPromises.push(fetchLinkedInGuestJobs(role, loc, 15));
        }
      }

      const liResults = await Promise.allSettled(liPromises);
      for (const res of liResults) {
        if (res.status === "fulfilled" && Array.isArray(res.value)) {
          allFetchedJobs.push(...res.value);
        }
      }
    }

    // 3. Fetch Target Company ATS Boards (Greenhouse & Lever)
    if (options?.targetCompanies !== false) {
      const userSlugs =
        userProfile.targetCompanies && userProfile.targetCompanies.length > 0
          ? userProfile.targetCompanies.map((c) => c.name.toLowerCase().replace(/[^a-z0-9]/g, ""))
          : [];

      const topIndiaTechSlugs = [
        "razorpay", "swiggy", "meesho", "groww", "postman", "hasura", "cred",
        "browserstack", "hackerrank", "zepto", "blinkit", "urbancompany", "nykaa",
        "cars24", "inmobi", "zomato", "clevertap"
      ];

      const targetCompanySlugs = Array.from(new Set([...userSlugs, ...topIndiaTechSlugs]));

      const atsPromises = targetCompanySlugs.slice(0, 10).map(async (slug) => {
        const [gh, lev] = await Promise.allSettled([
          fetchGreenhouseJobs(slug),
          fetchLeverJobs(slug),
        ]);
        const list: NormalizedJob[] = [];
        if (gh.status === "fulfilled") list.push(...gh.value);
        if (lev.status === "fulfilled") list.push(...lev.value);
        return list;
      });

      const atsResults = await Promise.allSettled(atsPromises);
      for (const res of atsResults) {
        if (res.status === "fulfilled" && Array.isArray(res.value)) {
          allFetchedJobs.push(...res.value);
        }
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
        userProfile
      );

      // Check Role Relevance (Reject Non-Tech/Sales/Marketing Roles)
      const roleCheck = isRoleMatchingTargets(job.title, keywords);

      // Check India / State Location Filter
      const locationCheck = isLocationMatchingIndia(job.location || "", targetState);
      let isFiltered = filterResult.isFiltered;
      let filterReason = filterResult.filterReason;

      if (!roleCheck.matches) {
        isFiltered = true;
        filterReason = roleCheck.reason || "Role does not match target technical positions";
      } else if (!locationCheck.matches) {
        isFiltered = true;
        filterReason = locationCheck.reason || "Location outside India target";
      }

      // Fast initial scoring
      const overlap = calculateKeywordOverlap(job.requiredSkills, userProfile.skills);
      const titleLower = job.title.toLowerCase();
      const roleMatch = keywords.some((k) => titleLower.includes(k.toLowerCase()));
      const matchScore = roleMatch
        ? Math.min(95, Math.max(78, 75 + Math.round(overlap.overlapPercentage * 0.2)))
        : Math.max(70, overlap.overlapPercentage);
      const matchCategory =
        matchScore >= 85 ? "EXCELLENT" : matchScore >= 75 ? "STRONG" : "GOOD";

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
          isFiltered,
          filterReason,
          freshness: job.freshness,
          datePosted: job.datePosted,
          matchScore: isFiltered ? null : matchScore,
          matchCategory: isFiltered ? null : matchCategory,
          jobStatus: "NEW",
        },
      });

      if (isFiltered) {
        filteredOut++;
      } else {
        newImported++;
      }
    }

    revalidatePath("/jobs");
    revalidatePath("/recommendations");
    revalidatePath("/analytics");
    revalidatePath("/auto-apply");

    const totalActiveQueue = await prisma.job.count({
      where: {
        userId,
        jobStatus: { not: "APPLIED" },
        isSkipped: false,
        isFiltered: false,
      },
    });

    return {
      success: true,
      totalFetched: allFetchedJobs.length,
      newImported,
      existingPreserved: duplicates,
      filteredOut,
      totalActiveQueue,
    };
  } catch (err) {
    console.error("[runAutoScrapeAction Error]", err);
    return {
      success: false,
      totalFetched: 0,
      newImported: 0,
      existingPreserved: 0,
      filteredOut: 0,
      totalActiveQueue: 0,
      error: err instanceof Error ? err.message : "Failed to run automated scraper",
    };
  }
}