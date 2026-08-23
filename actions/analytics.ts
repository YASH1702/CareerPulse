"use server";

import prisma from "@/lib/db/client";
import { getRequiredUserId } from "@/lib/auth/session";

export async function getAnalyticsData() {
  const userId = await getRequiredUserId();

  const [jobs, applications, profile, events] = await Promise.all([
    prisma.job.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        companyName: true,
        requiredSkills: true,
        matchScore: true,
        remoteType: true,
        salaryMax: true,
        salaryMin: true,
        jobStatus: true,
        createdAt: true,
      },
    }),
    prisma.application.findMany({
      where: { userId },
      select: {
        id: true,
        appStatus: true,
        matchScore: true,
        appliedAt: true,
        createdAt: true,
      },
    }),
    prisma.profile.findUnique({
      where: { userId },
      include: { skills: true },
    }),
    prisma.applicationEvent.findMany({
      where: { application: { userId } },
      orderBy: { occurredAt: "desc" },
      take: 10,
      include: {
        application: {
          include: { job: { select: { title: true, companyName: true } } },
        },
      },
    }),
  ]);

  // 1. Metric Totals
  const totalJobs = jobs.length;
  const totalApplied = applications.filter((a) => a.appStatus !== "NEW" && a.appStatus !== "READY").length;
  const totalInterviews = applications.filter((a) => a.appStatus === "INTERVIEW" || a.appStatus === "SCREENING").length;
  const totalOffers = applications.filter((a) => a.appStatus === "OFFER").length;

  const interviewRate = totalApplied > 0 ? Math.round((totalInterviews / totalApplied) * 100) : 0;
  const offerRate = totalInterviews > 0 ? Math.round((totalOffers / totalInterviews) * 100) : 0;

  const scoredJobs = jobs.filter((j) => typeof j.matchScore === "number");
  const avgMatchScore = scoredJobs.length > 0
    ? Math.round(scoredJobs.reduce((acc, j) => acc + (j.matchScore ?? 0), 0) / scoredJobs.length)
    : 0;

  // 2. Score Distribution
  const scoreDistribution = {
    excellent: jobs.filter((j) => (j.matchScore ?? 0) >= 90).length,
    strong: jobs.filter((j) => (j.matchScore ?? 0) >= 80 && (j.matchScore ?? 0) < 90).length,
    good: jobs.filter((j) => (j.matchScore ?? 0) >= 70 && (j.matchScore ?? 0) < 80).length,
    weak: jobs.filter((j) => (j.matchScore ?? 0) > 0 && (j.matchScore ?? 0) < 70).length,
    unscored: jobs.filter((j) => j.matchScore === null).length,
  };

  // 3. Market Skill Gap Analysis (Frequency of required skills across all user's jobs vs user profile)
  const userSkillSet = new Set((profile?.skills || []).map((s) => s.name.toLowerCase().trim()));
  const skillFrequency: Record<string, number> = {};

  jobs.forEach((job) => {
    (job.requiredSkills || []).forEach((skill) => {
      const cleanSkill = skill.trim();
      if (cleanSkill) {
        skillFrequency[cleanSkill] = (skillFrequency[cleanSkill] || 0) + 1;
      }
    });
  });

  const missingSkillsList = Object.entries(skillFrequency)
    .filter(([skill]) => !userSkillSet.has(skill.toLowerCase()))
    .map(([skill, count]) => ({
      skill,
      count,
      percentage: totalJobs > 0 ? Math.round((count / totalJobs) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const matchedSkillsList = Object.entries(skillFrequency)
    .filter(([skill]) => userSkillSet.has(skill.toLowerCase()))
    .map(([skill, count]) => ({
      skill,
      count,
      percentage: totalJobs > 0 ? Math.round((count / totalJobs) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalJobs,
    totalApplied,
    totalInterviews,
    totalOffers,
    interviewRate,
    offerRate,
    avgMatchScore,
    scoreDistribution,
    missingSkillsList,
    matchedSkillsList,
    events,
  };
}