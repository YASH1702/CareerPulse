/**
 * AI Safety Guards
 * 
 * Enforces that AI output never claims skills/experience
 * the user does not actually have in their profile.
 */

export interface ProfileSkills {
  names: string[];
}

export interface AIMatchResult {
  matchScore: number;
  recommendation: "APPLY" | "CONSIDER" | "SKIP";
  confidence: number;
  strengths: string[];
  missingSkills: string[];
  concerns: string[];
  matchedRequirements: string[];
  unmatchedRequirements: string[];
}

/**
 * Validates that all strengths claimed by the AI actually exist in the user profile.
 * Removes any hallucinated skills silently and logs them.
 */
export function validateMatchResult(
  result: AIMatchResult,
  profileSkills: ProfileSkills
): AIMatchResult {
  const skillsLower = profileSkills.names.map((s) => s.toLowerCase());

  const validatedStrengths = result.strengths.filter((strength) => {
    // Check if any profile skill is mentioned in this strength string
    const mentionsRealSkill = skillsLower.some((skill) =>
      strength.toLowerCase().includes(skill)
    );
    if (!mentionsRealSkill) {
      console.warn(
        `[AI Safety] Removed hallucinated strength: "${strength}"`
      );
    }
    return mentionsRealSkill;
  });

  return {
    ...result,
    strengths: validatedStrengths,
  };
}

/**
 * Validates that tailored resume content does not add skills/experience
 * that are not present in the original resume JSON.
 */
export function validateTailoredResume(
  tailored: Record<string, unknown>,
  original: Record<string, unknown>
): { valid: boolean; violations: string[] } {
  const violations: string[] = [];

  // Check that no new companies appear in experience
  const originalCompanies = extractCompanyNames(original);
  const tailoredCompanies = extractCompanyNames(tailored);

  tailoredCompanies.forEach((company) => {
    if (!originalCompanies.includes(company.toLowerCase())) {
      violations.push(`New company added: "${company}"`);
    }
  });

  return {
    valid: violations.length === 0,
    violations,
  };
}

function extractCompanyNames(resume: Record<string, unknown>): string[] {
  const experience = resume.experience as Array<{ company?: string }> | undefined;
  if (!Array.isArray(experience)) return [];
  return experience
    .map((e) => (e.company ?? "").toLowerCase())
    .filter(Boolean);
}
