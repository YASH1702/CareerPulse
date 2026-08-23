import { Briefcase, Send, Users, Award, Sparkles, TrendingUp } from "lucide-react";

interface Props {
  totalJobs: number;
  totalApplied: number;
  totalInterviews: number;
  totalOffers: number;
  interviewRate: number;
  offerRate: number;
  avgMatchScore: number;
}

export function MetricsGrid({
  totalJobs,
  totalApplied,
  totalInterviews,
  totalOffers,
  interviewRate,
  offerRate,
  avgMatchScore,
}: Props) {
  const cards = [
    {
      label: "Jobs Discovered",
      value: totalJobs,
      sub: "in search pool",
      icon: Briefcase,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Applications Sent",
      value: totalApplied,
      sub: totalJobs > 0 ? `${Math.round((totalApplied / totalJobs) * 100)}% of discovered` : "0%",
      icon: Send,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
    },
    {
      label: "Interview Rate",
      value: `${interviewRate}%`,
      sub: `${totalInterviews} interviews secured`,
      icon: Users,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Offers Received",
      value: totalOffers,
      sub: `${offerRate}% interview conversion`,
      icon: Award,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Avg. Match Score",
      value: `${avgMatchScore}%`,
      sub: "across analyzed jobs",
      icon: Sparkles,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className="glass-card p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-medium">{c.label}</span>
              <div className={`w-7 h-7 rounded-lg ${c.bg} flex items-center justify-center ${c.color}`}>
                <Icon size={14} />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold text-white">{c.value}</p>
              <p className="text-slate-500 text-[11px] mt-0.5">{c.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}