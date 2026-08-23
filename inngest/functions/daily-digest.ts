import { inngest } from "@/inngest/client";
import prisma from "@/lib/db/client";
import { analyzeJobCompatibility } from "@/lib/ai/analyze-job";
import { sendDailyDigestEmail } from "@/lib/email/send";
import type { Job, AIAnalysis } from "@prisma/client";

export const dailyDigestCron = inngest.createFunction(
  {
    id: "daily-digest-cron",
    name: "Send Daily Job & Application Digest",
    triggers: [{ cron: "0 8 * * *" }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ step }: any) => {
    // 1. Fetch all users
    const users = await step.run("fetch-active-users", async () => {
      return prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          profile: { select: { minMatchScore: true } },
        },
      });
    });

    const results = [];

    for (const user of users) {
      // 2. Analyze any unanalyzed jobs for this user
      await step.run(`analyze-new-jobs-${user.id}`, async () => {
        const unanalyzed = await prisma.job.findMany({
          where: { userId: user.id, jobStatus: "NEW" },
          take: 10,
          select: { id: true },
        });

        for (const j of unanalyzed) {
          await analyzeJobCompatibility(j.id, user.id);
        }
      });

      // 3. Gather top matches for today
      const topJobs = await step.run(`gather-top-matches-${user.id}`, async () => {
        return prisma.job.findMany({
          where: {
            userId: user.id,
            matchScore: { gte: 75 },
            isSkipped: false,
          },
          orderBy: { matchScore: "desc" },
          take: 5,
          include: { aiAnalysis: { select: { whyApply: true } } },
        });
      });

      // 4. Gather pending follow-ups
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const pendingFollowUps = await step.run(`gather-followups-${user.id}`, async () => {
        const apps = await prisma.application.findMany({
          where: {
            userId: user.id,
            appStatus: "APPLIED",
            appliedAt: { lte: sevenDaysAgo },
            followUpSent: false,
          },
          include: { job: { select: { title: true, companyName: true } } },
        });

        return apps.map((a) => ({
          id: a.id,
          jobTitle: a.job.title,
          companyName: a.job.companyName,
          appliedDate: a.appliedAt ? a.appliedAt.toLocaleDateString() : "Recently",
        }));
      });

      // 5. Send Digest Email & Notification
      if (topJobs.length > 0 || pendingFollowUps.length > 0) {
        await step.run(`send-digest-email-${user.id}`, async () => {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
          const dateStr = new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });

          await sendDailyDigestEmail({
            userId: user.id,
            userEmail: user.email,
            digestData: {
              userName: user.name?.split(" ")[0] || "there",
              dateStr,
              topMatches: topJobs.map((j: Job & { aiAnalysis?: Pick<AIAnalysis, "whyApply"> | null }) => ({
                id: j.id,
                title: j.title,
                companyName: j.companyName,
                location: j.location,
                remoteType: j.remoteType,
                matchScore: j.matchScore ?? 75,
                salaryText: j.salaryText,
                whyApply: j.aiAnalysis?.whyApply,
              })),
              pendingFollowUps,
              appUrl,
            },
          });
        });
      }

      results.push({ userId: user.id, matchesFound: topJobs.length });
    }

    return { processedUsers: users.length, results };
  }
);