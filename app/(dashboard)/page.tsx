import { Metadata } from "next";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import prisma from "@/lib/db/client";
import { auth } from "@/auth";
import { Sparkles, ArrowRight, Briefcase, FileText, CheckCircle2, Building2 } from "lucide-react";

export const metadata: Metadata = { title: "Overview | CareerPulse" };

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  let totalJobs = 0;
  let totalApps = 0;
  let totalInterviews = 0;
  let topMatches: Array<{
    id: string;
    title: string;
    companyName: string;
    location: string | null;
    remoteType: string;
    matchScore: number | null;
    salaryText: string | null;
  }> = [];

  if (userId) {
    const [jobCount, appCount, interviewCount, topJobs] = await Promise.all([
      prisma.job.count({ where: { userId } }),
      prisma.application.count({ where: { userId } }),
      prisma.interview.count({
        where: { application: { userId }, outcome: "PENDING" },
      }),
      prisma.job.findMany({
        where: { userId, matchScore: { gte: 75 }, isSkipped: false },
        orderBy: { matchScore: "desc" },
        take: 3,
        select: {
          id: true,
          title: true,
          companyName: true,
          location: true,
          remoteType: true,
          matchScore: true,
          salaryText: true,
        },
      }),
    ]);

    totalJobs = jobCount;
    totalApps = appCount;
    totalInterviews = interviewCount;
    topMatches = topJobs;
  }

  const stats = [
    { label: "Jobs Discovered", value: String(totalJobs), sub: "total in database" },
    { label: "Applications", value: String(totalApps), sub: "in tracker" },
    { label: "Interviews", value: String(totalInterviews), sub: "scheduled / pending" },
    {
      label: "Top Matches",
      value: String(topMatches.length),
      sub: "score ≥ 75%",
    },
  ];

  return (
    <div className="space-y-6">
      <DashboardHeader />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card p-5">
            <p className="text-slate-400 text-xs font-medium">{stat.label}</p>
            <p className="text-3xl font-bold text-white mt-1.5">{stat.value}</p>
            <p className="text-slate-500 text-xs mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Setup or Main Hub */}
      <div className="glass-card p-6 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent border-blue-500/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles size={18} className="text-blue-400" />
              Automated Job Search Assistant
            </h2>
            <p className="text-slate-300 text-xs mt-1 max-w-xl">
              Add new job opportunities, run instant AI matching against your profile, and generate tailored application packages.
            </p>
          </div>
          <div className="flex gap-2.5 flex-wrap">
            <Link
              href="/jobs"
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <Briefcase size={14} />
              <span>Explore Jobs</span>
            </Link>
            <Link
              href="/recommendations"
              className="btn-ghost text-xs flex items-center gap-1.5"
            >
              <Sparkles size={14} className="text-blue-400" />
              <span>View Recommendations</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Today's Top Matches & Applications Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Matches */}
        <div className="glass-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles size={15} className="text-blue-400" />
                <span>Today&apos;s Top Matches</span>
              </h3>
              <Link
                href="/recommendations"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
              >
                <span>View all</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {topMatches.length === 0 ? (
              <div className="py-8 text-center text-slate-500 space-y-2">
                <p className="text-xs">No analyzed high-match jobs yet.</p>
                <Link
                  href="/jobs"
                  className="text-xs text-blue-400 hover:underline inline-block"
                >
                  Add a job or run AI match analysis →
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {topMatches.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs`}
                    className="p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] rounded-xl flex items-center justify-between gap-3 transition-colors block"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white line-clamp-1">
                        {job.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{job.companyName}</span>
                        {job.location && <span>· {job.location}</span>}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {job.matchScore}%
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Application Pipeline */}
        <div className="glass-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileText size={15} className="text-blue-400" />
                <span>Application Tracker</span>
              </h3>
              <Link
                href="/applications"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
              >
                <span>Open Kanban</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            <div className="py-6 text-center text-slate-500 space-y-2">
              <p className="text-xs">
                {totalApps === 0
                  ? "No active applications tracked yet."
                  : `${totalApps} applications currently in your pipeline.`}
              </p>
              <Link
                href="/applications"
                className="text-xs text-blue-400 hover:underline inline-block"
              >
                Manage application pipeline & Kanban →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}