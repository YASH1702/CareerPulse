import type { Job, Profile, Skill, TargetCompany } from "@prisma/client";

export interface FilterResult {
  isFiltered: boolean;
  filterReason?: string;
  passedChecks: string[];
}

export function evaluateJobPreFilters(
  job: Pick<Job, "title" | "companyName" | "location" | "remoteType" | "description" | "requiredSkills" | "salaryMax">,
  profile: (Profile & {
    skills?: Skill[];
    targetCompanies?: TargetCompany[];
  }) | null
): FilterResult {
  const passedChecks: string[] = [];

  if (!profile) {
    return { isFiltered: false, passedChecks: ["No profile constraints set"] };
  }

  const jobText = [
    job.title,
    job.companyName,
    job.location ?? "",
    job.description ?? "",
    ...(job.requiredSkills || []),
  ].join(" ").toLowerCase();

  // 1. Check Excluded Keywords
  if (profile.excludedKeywords && profile.excludedKeywords.length > 0) {
    for (const kw of profile.excludedKeywords) {
      const keywordLower = kw.trim().toLowerCase();
      if (keywordLower && jobText.includes(keywordLower)) {
        return {
          isFiltered: true,
          filterReason: `Contains excluded keyword: "${kw}"`,
          passedChecks,
        };
      }
    }
  }
  passedChecks.push("Excluded keywords check passed");

  // 2. Check Excluded Roles
  if (profile.excludedRoles && profile.excludedRoles.length > 0) {
    const titleLower = job.title.toLowerCase();
    for (const role of profile.excludedRoles) {
      const roleLower = role.trim().toLowerCase();
      if (roleLower && titleLower.includes(roleLower)) {
        return {
          isFiltered: true,
          filterReason: `Job title matches excluded role: "${role}"`,
          passedChecks,
        };
      }
    }
  }
  passedChecks.push("Excluded roles check passed");

  // 3. Check Target Company Sentiment (AVOID)
  if (profile.targetCompanies && profile.targetCompanies.length > 0) {
    const companyLower = job.companyName.toLowerCase();
    const avoidCompany = profile.targetCompanies.find(
      (c) => c.name.toLowerCase() === companyLower && c.sentiment === "AVOID"
    );
    if (avoidCompany) {
      return {
        isFiltered: true,
        filterReason: `Company "${job.companyName}" is on your avoid list`,
        passedChecks,
      };
    }
  }
  passedChecks.push("Target company check passed");

  // 4. Check Remote Preferences
  if (profile.remotePreference === "REMOTE_ONLY" && job.remoteType === "ONSITE") {
    return {
      isFiltered: true,
      filterReason: "Job is strictly On-site, but your preference is Remote Only",
      passedChecks,
    };
  }
  passedChecks.push("Remote preference check passed");

  // 5. Check Salary Minimum (if job max salary is below profile minimum)
  if (
    typeof profile.salaryMin === "number" &&
    profile.salaryMin > 0 &&
    typeof job.salaryMax === "number" &&
    job.salaryMax > 0
  ) {
    // If job's max offering is less than 80% of user's desired minimum
    if (job.salaryMax < profile.salaryMin * 0.8) {
      return {
        isFiltered: true,
        filterReason: `Salary max (${job.salaryMax}) is below your desired minimum (${profile.salaryMin})`,
        passedChecks,
      };
    }
  }
  passedChecks.push("Salary compatibility check passed");

  return {
    isFiltered: false,
    passedChecks,
  };
}