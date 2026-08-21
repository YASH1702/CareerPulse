import { format, formatDistanceToNow, isValid } from "date-fns";

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (!isValid(d)) return "—";
  return format(d, "MMM d, yyyy");
}

export function formatRelativeDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (!isValid(d)) return "—";
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatSalary(
  min?: number | null,
  max?: number | null,
  currency = "INR"
): string {
  if (!min && !max) return "Not specified";

  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

  // Convert to LPA for INR if values look like annual rupees
  if (currency === "INR") {
    const minLPA = min ? (min / 100000).toFixed(0) : null;
    const maxLPA = max ? (max / 100000).toFixed(0) : null;
    if (minLPA && maxLPA) return `${minLPA}–${maxLPA} LPA`;
    if (minLPA) return `${minLPA}+ LPA`;
    if (maxLPA) return `Up to ${maxLPA} LPA`;
  }

  if (min && max) return `${formatter.format(min)} – ${formatter.format(max)}`;
  if (min) return `${formatter.format(min)}+`;
  return `Up to ${formatter.format(max!)}`;
}

export function formatMatchScore(score: number): string {
  return `${score}%`;
}

export function getMatchCategory(score: number): {
  label: string;
  color: string;
} {
  if (score >= 90) return { label: "Excellent Match", color: "text-emerald-400" };
  if (score >= 80) return { label: "Strong Match", color: "text-blue-400" };
  if (score >= 70) return { label: "Good Match", color: "text-indigo-400" };
  if (score >= 60) return { label: "Weak Match", color: "text-yellow-400" };
  return { label: "Poor Match", color: "text-red-400" };
}
