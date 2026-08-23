interface Props {
  totalJobs: number;
  totalApplied: number;
  totalInterviews: number;
  totalOffers: number;
}

export function ApplicationFunnel({
  totalJobs,
  totalApplied,
  totalInterviews,
  totalOffers,
}: Props) {
  const stages = [
    { label: "Discovered", value: totalJobs, color: "bg-blue-500", pct: 100 },
    {
      label: "Applied",
      value: totalApplied,
      color: "bg-indigo-500",
      pct: totalJobs > 0 ? Math.round((totalApplied / totalJobs) * 100) : 0,
    },
    {
      label: "Interviewing",
      value: totalInterviews,
      color: "bg-amber-500",
      pct: totalJobs > 0 ? Math.round((totalInterviews / totalJobs) * 100) : 0,
    },
    {
      label: "Offers 🎉",
      value: totalOffers,
      color: "bg-emerald-500",
      pct: totalJobs > 0 ? Math.round((totalOffers / totalJobs) * 100) : 0,
    },
  ];

  return (
    <div className="glass-card p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-white">Application Conversion Funnel</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Tracking the progress of jobs from discovery to offer.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stages.map((st) => (
          <div key={st.label} className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400">{st.label}</span>
              <span className="text-sm font-bold text-white">{st.value}</span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={`h-full ${st.color} rounded-full`}
                style={{ width: `${Math.max(5, st.pct)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 text-right">{st.pct}% of total</p>
          </div>
        ))}
      </div>
    </div>
  );
}