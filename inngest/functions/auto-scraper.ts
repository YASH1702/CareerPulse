import { inngest } from "@/inngest/client";
import prisma from "@/lib/db/client";
import { fetchAllAggregatorJobs } from "@/lib/jobs/sources/aggregators";
import { fetchLinkedInGuestJobs } from "@/lib/jobs/sources/linkedin-guest";
import { generateJobHash } from "@/utils/hash";
import { evaluateJobPreFilters } from "@/lib/jobs/filter";
import { analyzeJobCompatibility } from "@/lib/ai/analyze-job";

export const autoScraperCron = inngest.createFunction(
  {
    id: "auto-scraper-cron",
    name: "Autonomous Multi-Source Job Ingestion & Pre-Filter",
    triggers: [{ cron: "0 */4 * * *" }], // Every 4 hours
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ step }: any) => {
    // 1. Fetch active profiles
    const users = await step.run("fetch-active-profiles", async () => {
      return prisma.user.findMany({
        select: {
          id: true,
          profile: {
            include: { skills: true, targetCompanies: true },
          },
        },
      });
    });

    const summary: Record<string, number> = { totalScraped: 0, totalNew: 0 };

    for (const user of users) {
      if (!user.profile) continue;

      const profile = user.profile;
      const targetRoles = profile.targetRoles.length > 0 ? profile.targetRoles : ["Software Engineer"];

      // 2. Fetch jobs
      const jobs = await step.run(`fetch-sources-${user.id}`, async () => {
        const [aggJobs, liJobs] = await Promise.all([
          fetchAllAggregatorJobs(targetRoles),
          fetchLinkedInGuestJobs(targetRoles[0] || "Software Engineer", profile.location || "Remote", 20),
        ]);
        return [...aggJobs, ...liJobs];
      });

      summary.totalScraped += jobs.length;

      // 3. Save & Dedup
      const newJobIds = await step.run(`dedup-and-save-${user.id}`, async () => {
        const ids: string[] = [];

        for (const j of jobs) {
          const contentHash = generateJobHash({
            companyName: j.companyName,
            title: j.title,
            location: j.location,
            applicationUrl: j.applicationUrl,
          });

          const existing = await prisma.job.findFirst({
            where: { userId: user.id, contentHash },
          });

          if (existing) continue;

          const filterResult = evaluateJobPreFilters(j, profile);

          const created = await prisma.job.create({
            data: {
              userId: user.id,
              title: j.title,
              companyName: j.companyName,
              location: j.location,
              remoteType: j.remoteType,
              employmentType: j.employmentType || "FULL_TIME",
              description: j.description,
              requiredSkills: j.requiredSkills,
              salaryMin: j.salaryMin,
              salaryMax: j.salaryMax,
              salaryCurrency: j.salaryCurrency || "INR",
              salaryText: j.salaryText,
              source: j.source,
              sourceUrl: j.sourceUrl,
              applicationUrl: j.applicationUrl,
              contentHash,
              isFiltered: filterResult.isFiltered,
              filterReason: filterResult.filterReason,
              freshness: j.freshness,
              datePosted: j.datePosted,
              jobStatus: "NEW",
            },
          });

          if (!filterResult.isFiltered) {
            ids.push(created.id);
          }
        }

        return ids;
      });

      summary.totalNew += newJobIds.length;

      // 4. Trigger AI analysis on top 5 new non-filtered jobs
      await step.run(`analyze-top-new-jobs-${user.id}`, async () => {
        for (const jId of newJobIds.slice(0, 5)) {
          await analyzeJobCompatibility(jId, user.id);
        }
      });
    }

    return summary;
  }
);