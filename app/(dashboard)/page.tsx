import { Metadata } from "next";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export const metadata: Metadata = { title: "Overview | JobPilot AI" };

const stats = [
  { label: "Jobs Found", value: "0", sub: "this week" },
  { label: "Applications", value: "0", sub: "total" },
  { label: "Interviews", value: "0", sub: "scheduled" },
  { label: "Response Rate", value: "—", sub: "awaiting data" },
];

export default function DashboardPage() {
  return (
    <div>
      <DashboardHeader />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card p-5">
            <p className="text-slate-400 text-sm">{stat.label}</p>
            <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
            <p className="text-slate-500 text-xs mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Get started card */}
      <div className="glass-card p-8 text-center">
        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🚀</span>
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">
          Complete your setup
        </h2>
        <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
          Fill in your profile and upload your master resume to start getting
          AI-powered job matches.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/settings"
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors font-medium"
          >
            Complete Profile
          </Link>
          <Link
            href="/resumes"
            className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white text-sm rounded-lg transition-colors border border-white/10 font-medium"
          >
            Upload Resume
          </Link>
          <Link
            href="/jobs"
            className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white text-sm rounded-lg transition-colors border border-white/10 font-medium"
          >
            Add a Job
          </Link>
        </div>
      </div>

      {/* Coming soon sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <div className="glass-card p-6">
          <h3 className="text-sm font-medium text-slate-300 mb-3">
            🎯 Today&apos;s Top Matches
          </h3>
          <p className="text-slate-500 text-sm">
            Add your profile and jobs to see AI-ranked recommendations here.
          </p>
        </div>
        <div className="glass-card p-6">
          <h3 className="text-sm font-medium text-slate-300 mb-3">
            📋 Application Pipeline
          </h3>
          <p className="text-slate-500 text-sm">
            Your Kanban application tracker will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}