import type { AIMatchResult } from "@/types/ai";
import type { Job, Profile, Skill, Education } from "@prisma/client";
import type { ResumeData } from "@/types/resume";

export function buildJobAnalysisPrompt(params: {
  job: Pick<Job, "title" | "companyName" | "location" | "remoteType" | "employmentType" | "description" | "requiredSkills" | "preferredSkills" | "responsibilities" | "experienceRequired" | "salaryText">;
  profile: (Profile & {
    skills: Skill[];
    education: Education[];
  }) | null;
  resumeData?: ResumeData | null;
}): string {
  const { job, profile, resumeData } = params;

  const candidateSkills = (profile?.skills || []).map((s) => `${s.name} (${s.proficiency}, ${s.category})`).join(", ") || "None specified";
  const candidateEdu = (profile?.education || []).map((e) => `${e.degree} from ${e.institution}`).join("; ") || "Not specified";
  const candidateExperience = resumeData?.experience?.map((exp) => `${exp.role} at ${exp.company} (${exp.startDate} - ${exp.endDate || "Present"})`).join(" | ") || "Not specified";

  return `You are a Senior Technical Recruiter and Career Advisor.
Evaluate the compatibility between this candidate and the job opening.

### CANDIDATE PROFILE:
- Name / Headline: ${profile?.headline || "Software Engineer"}
- Current Role: ${profile?.currentRole || "Not specified"} (${profile?.yearsExperience || 0} years experience)
- Skills on Profile: ${candidateSkills}
- Education: ${candidateEdu}
- Bio / Summary: ${profile?.bio || "Not specified"}
- Target Roles: ${(profile?.targetRoles || []).join(", ") || "Software Engineering"}
- Remote Preference: ${profile?.remotePreference || "OPEN"}
- Past Experience Overview: ${candidateExperience}

### JOB OPENING:
- Title: ${job.title}
- Company: ${job.companyName}
- Location: ${job.location || "Unspecified"} (${job.remoteType})
- Employment Type: ${job.employmentType}
- Required Skills: ${(job.requiredSkills || []).join(", ") || "None specified"}
- Preferred Skills: ${(job.preferredSkills || []).join(", ") || "None specified"}
- Experience Level Required: ${job.experienceRequired || "Not specified"}
- Salary: ${job.salaryText || "Not specified"}
- Responsibilities: ${(job.responsibilities || []).join(" | ") || "See description"}
- Description snippet: ${(job.description || "").slice(0, 5000)}

---
### EVALUATION RULES:
1. NEVER hallucinate skills for the candidate. Strengths MUST directly correspond to technologies or experiences present in the candidate profile or resume.
2. Be rigorous and honest. If there is a genuine gap in requirements, list it in "missingSkills" and "concerns".
3. Component score breakdowns must be integers 0-100:
   - technical: technical stack alignment
   - experience: years of experience & seniority level match
   - role: title & responsibility fit
   - location: remote / city compatibility
   - salary: financial alignment
   - careerGrowth: potential for candidate's growth
4. Overall "matchScore" should be a weighted combination (0-100).
5. "recommendation": "APPLY" (>= 75%), "CONSIDER" (55-74%), or "SKIP" (< 55%).
6. "category": "EXCELLENT" (>=90), "STRONG" (80-89), "GOOD" (70-79), "WEAK" (60-69), or "POOR" (<60).
7. "whyApply": 2 clear, punchy sentences summarizing why this is or isn't a great match.

Respond with ONLY valid JSON matching this schema:
{
  "matchScore": number,
  "recommendation": "APPLY | CONSIDER | SKIP",
  "confidence": number,
  "category": "EXCELLENT | STRONG | GOOD | WEAK | POOR",
  "scores": {
    "technical": number,
    "experience": number,
    "role": number,
    "location": number,
    "salary": number,
    "employmentType": number,
    "careerGrowth": number
  },
  "strengths": ["bullet point strings of verified matches"],
  "missingSkills": ["skills required by the job that candidate lacks"],
  "concerns": ["potential mismatches or dealbreakers"],
  "matchedRequirements": ["job requirements met"],
  "unmatchedRequirements": ["job requirements not met"],
  "whyApply": "string"
}`;
}

export function validateAnalysisResult(data: unknown): AIMatchResult {
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid AI analysis result: not an object");
  }
  const d = data as Record<string, unknown>;

  const scores = (typeof d.scores === "object" && d.scores !== null)
    ? (d.scores as Record<string, unknown>)
    : {};

  const matchScore = typeof d.matchScore === "number" ? Math.min(100, Math.max(0, Math.round(d.matchScore))) : 70;

  return {
    matchScore,
    recommendation: (d.recommendation === "APPLY" || d.recommendation === "CONSIDER" || d.recommendation === "SKIP")
      ? d.recommendation
      : matchScore >= 75 ? "APPLY" : matchScore >= 55 ? "CONSIDER" : "SKIP",
    confidence: typeof d.confidence === "number" ? Math.min(1, Math.max(0, d.confidence)) : 0.85,
    category: (d.category === "EXCELLENT" || d.category === "STRONG" || d.category === "GOOD" || d.category === "WEAK" || d.category === "POOR")
      ? d.category
      : matchScore >= 90 ? "EXCELLENT" : matchScore >= 80 ? "STRONG" : matchScore >= 70 ? "GOOD" : matchScore >= 60 ? "WEAK" : "POOR",
    scores: {
      technical: typeof scores.technical === "number" ? scores.technical : matchScore,
      experience: typeof scores.experience === "number" ? scores.experience : matchScore,
      role: typeof scores.role === "number" ? scores.role : matchScore,
      location: typeof scores.location === "number" ? scores.location : 80,
      salary: typeof scores.salary === "number" ? scores.salary : 80,
      employmentType: typeof scores.employmentType === "number" ? scores.employmentType : 90,
      careerGrowth: typeof scores.careerGrowth === "number" ? scores.careerGrowth : 75,
    },
    strengths: Array.isArray(d.strengths) ? d.strengths.map(String).filter(Boolean) : [],
    missingSkills: Array.isArray(d.missingSkills) ? d.missingSkills.map(String).filter(Boolean) : [],
    concerns: Array.isArray(d.concerns) ? d.concerns.map(String).filter(Boolean) : [],
    matchedRequirements: Array.isArray(d.matchedRequirements) ? d.matchedRequirements.map(String).filter(Boolean) : [],
    unmatchedRequirements: Array.isArray(d.unmatchedRequirements) ? d.unmatchedRequirements.map(String).filter(Boolean) : [],
    whyApply: typeof d.whyApply === "string" ? d.whyApply : undefined,
  };
}