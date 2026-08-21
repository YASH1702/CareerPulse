import { Metadata } from "next";

export const metadata: Metadata = { title: "Overview" };

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Good evening 👋</h1>
        <p className="text-slate-400 mt-1">
          Your job search, intelligently automated.
        </p>
      </div>

      {/* Stats cards — real data in Phase 17 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Jobs Found", value: "0", sub: "this week" },
          { label: "Applications", value: "0", sub: "total" },
          { label: "Interviews", value: "0", sub: "scheduled" },
          { label: "Response Rate", value: "—", sub: "awaiting data" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-5">
            <p className="text-slate-400 text-sm">{stat.label}</p>
            <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
            <p className="text-slate-500 text-xs mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-8 text-center">
        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🚀</span>
        </div>
        <h2 className="text-lg font-semibold mb-2">Get started</h2>
        <p className="text-slate-400 text-sm mb-4">
          Complete your profile and upload your master resume to begin.
        </p>
        <div className="flex gap-3 justify-center">
          <a
            href="/settings"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
          >
            Complete Profile
          </a>
          <a
            href="/resumes"
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm rounded-lg transition-colors border border-white/10"
          >
            Upload Resume
          </a>
        </div>
      </div>
    </div>
  );
}
