import type { Job, Skill } from "@prisma/client";

/**
 * Calculates a fast keyword overlap score between user skills and job required/preferred skills.
 */
export function calculateKeywordOverlap(
  jobSkills: string[],
  userSkills: Pick<Skill, "name">[]
): {
  matchedSkills: string[];
  missingSkills: string[];
  overlapPercentage: number;
} {
  if (!jobSkills || jobSkills.length === 0) {
    return { matchedSkills: [], missingSkills: [], overlapPercentage: 100 };
  }

  const userSkillNames = new Set(userSkills.map((s) => s.name.toLowerCase().trim()));

  const matched: string[] = [];
  const missing: string[] = [];

  for (const jobSkill of jobSkills) {
    const norm = jobSkill.toLowerCase().trim();
    if (userSkillNames.has(norm) || Array.from(userSkillNames).some((u) => u.includes(norm) || norm.includes(u))) {
      matched.push(jobSkill);
    } else {
      missing.push(jobSkill);
    }
  }

  const overlapPercentage = Math.round((matched.length / jobSkills.length) * 100);

  return {
    matchedSkills: matched,
    missingSkills: missing,
    overlapPercentage,
  };
}