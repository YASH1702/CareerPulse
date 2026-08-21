export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  REVIEW: "Under Review",
  READY: "Ready to Apply",
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

export const APPLICATION_STATUS_COLORS: Record<string, string> = {
  NEW: "bg-slate-500/20 text-slate-400",
  REVIEW: "bg-blue-500/20 text-blue-400",
  READY: "bg-indigo-500/20 text-indigo-400",
  APPLIED: "bg-violet-500/20 text-violet-400",
  SCREENING: "bg-amber-500/20 text-amber-400",
  INTERVIEW: "bg-emerald-500/20 text-emerald-400",
  OFFER: "bg-green-500/20 text-green-400",
  REJECTED: "bg-red-500/20 text-red-400",
  WITHDRAWN: "bg-slate-500/20 text-slate-300",
};

export const JOB_STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  ANALYZED: "Analyzed",
  RECOMMENDED: "Recommended",
  SAVED: "Saved",
  SKIPPED: "Skipped",
  APPLIED: "Applied",
  EXPIRED: "Expired",
};
