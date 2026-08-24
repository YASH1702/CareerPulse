export interface SalaryBenchmark {
  marketMin: number;
  marketMedian: number;
  marketMax: number;
  currency: string;
  recommendedAnswer: string;
  recommendedValue: number;
  confidence: "HIGH" | "MEDIUM" | "ESTIMATED";
  negotiationTip: string;
}

const ROLE_MEDIAN_RATES_INR: Record<string, { min: number; median: number; max: number }> = {
  frontend: { min: 1400000, median: 2200000, max: 3500000 },
  backend: { min: 1600000, median: 2500000, max: 4000000 },
  fullstack: { min: 1500000, median: 2400000, max: 3800000 },
  devops: { min: 1800000, median: 2800000, max: 4500000 },
  data: { min: 1500000, median: 2400000, max: 3800000 },
  ai: { min: 2000000, median: 3200000, max: 5500000 },
  mobile: { min: 1400000, median: 2200000, max: 3400000 },
  engineering_manager: { min: 3500000, median: 5000000, max: 8000000 },
};

/**
 * Calculates optimal salary benchmarking advice for job screening questions.
 */
export function getSalaryBenchmark(
  roleTitle: string,
  declaredMin?: number | null,
  declaredMax?: number | null,
  currency = "INR",
  yearsExp = 3
): SalaryBenchmark {
  const cleanTitle = roleTitle.toLowerCase();
  let matchedKey = "fullstack";

  if (cleanTitle.includes("front") || cleanTitle.includes("react") || cleanTitle.includes("ui")) {
    matchedKey = "frontend";
  } else if (cleanTitle.includes("back") || cleanTitle.includes("node") || cleanTitle.includes("python") || cleanTitle.includes("go") || cleanTitle.includes("java")) {
    matchedKey = "backend";
  } else if (cleanTitle.includes("devops") || cleanTitle.includes("cloud") || cleanTitle.includes("sre") || cleanTitle.includes("infra")) {
    matchedKey = "devops";
  } else if (cleanTitle.includes("ai") || cleanTitle.includes("ml") || cleanTitle.includes("machine learning") || cleanTitle.includes("llm")) {
    matchedKey = "ai";
  } else if (cleanTitle.includes("manager") || cleanTitle.includes("lead") || cleanTitle.includes("director")) {
    matchedKey = "engineering_manager";
  }

  const base = ROLE_MEDIAN_RATES_INR[matchedKey] || ROLE_MEDIAN_RATES_INR.fullstack;

  // Adjust for years of experience (5% compounding per year over 3)
  const expMultiplier = Math.max(0.7, 1 + (yearsExp - 3) * 0.08);

  let marketMin = Math.round(base.min * expMultiplier);
  let marketMedian = Math.round(base.median * expMultiplier);
  let marketMax = Math.round(base.max * expMultiplier);
  let confidence: "HIGH" | "MEDIUM" | "ESTIMATED" = "ESTIMATED";

  // If the job posting itself declared a range, anchor to it
  if (declaredMin && declaredMax && declaredMin > 0 && declaredMax > 0) {
    marketMin = declaredMin;
    marketMax = declaredMax;
    marketMedian = Math.round((declaredMin + declaredMax) / 2);
    confidence = "HIGH";
  } else if (declaredMin && declaredMin > 0) {
    marketMin = declaredMin;
    marketMedian = Math.round(declaredMin * 1.25);
    marketMax = Math.round(declaredMin * 1.5);
    confidence = "MEDIUM";
  }

  // Recommended anchor is 70th percentile of the band
  const recommendedValue = Math.round(marketMin + (marketMax - marketMin) * 0.7);

  const formattedRecommended = currency === "INR"
    ? `₹${(recommendedValue / 100000).toFixed(1)} LPA (₹${recommendedValue.toLocaleString("en-IN")})`
    : `$${recommendedValue.toLocaleString("en-US")}`;

  return {
    marketMin,
    marketMedian,
    marketMax,
    currency,
    recommendedAnswer: formattedRecommended,
    recommendedValue,
    confidence,
    negotiationTip: confidence === "HIGH"
      ? "Job disclosed clear salary bands. Pitch at the 70th percentile to leave room for negotiation."
      : "Estimated from tech market medians. Adjust higher if you have specialized high-demand competencies.",
  };
}