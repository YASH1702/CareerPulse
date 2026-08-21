export const MATCH_THRESHOLDS = {
  EXCELLENT: 90,
  STRONG: 80,
  GOOD: 70,
  WEAK: 60,
} as const;

export const MATCH_LABELS: Record<string, string> = {
  EXCELLENT: "Excellent Match",
  STRONG: "Strong Match",
  GOOD: "Good Match",
  WEAK: "Weak Match",
  POOR: "Poor Match",
};

export const MATCH_COLORS: Record<string, string> = {
  EXCELLENT: "#10b981", // emerald-500
  STRONG: "#3b82f6",   // blue-500
  GOOD: "#6366f1",     // indigo-500
  WEAK: "#f59e0b",     // amber-500
  POOR: "#ef4444",     // red-500
};
