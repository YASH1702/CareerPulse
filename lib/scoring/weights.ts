export const SCORING_WEIGHTS = {
  TECHNICAL_SKILLS: 0.40,  // 40%
  EXPERIENCE_LEVEL: 0.20,  // 20%
  ROLE_FIT: 0.15,          // 15%
  LOCATION_REMOTE: 0.10,   // 10%
  SALARY: 0.10,            // 10%
  CAREER_GROWTH: 0.05,     // 5%
} as const;

export function calculateWeightedMatchScore(scores: {
  technical: number;
  experience: number;
  role: number;
  location: number;
  salary: number;
  careerGrowth: number;
}): number {
  const total =
    scores.technical * SCORING_WEIGHTS.TECHNICAL_SKILLS +
    scores.experience * SCORING_WEIGHTS.EXPERIENCE_LEVEL +
    scores.role * SCORING_WEIGHTS.ROLE_FIT +
    scores.location * SCORING_WEIGHTS.LOCATION_REMOTE +
    scores.salary * SCORING_WEIGHTS.SALARY +
    scores.careerGrowth * SCORING_WEIGHTS.CAREER_GROWTH;

  return Math.min(100, Math.max(0, Math.round(total)));
}

export function getMatchCategoryFromScore(score: number): "EXCELLENT" | "STRONG" | "GOOD" | "WEAK" | "POOR" {
  if (score >= 90) return "EXCELLENT";
  if (score >= 80) return "STRONG";
  if (score >= 70) return "GOOD";
  if (score >= 60) return "WEAK";
  return "POOR";
}