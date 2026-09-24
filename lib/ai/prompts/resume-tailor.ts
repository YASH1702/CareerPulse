import type { ResumeData } from "@/types/resume";
import type { Job } from "@prisma/client";

export function buildResumeTailorPrompt(params: {
  masterResume: ResumeData;
  job: Pick<Job, "title" | "companyName" | "requiredSkills" | "preferredSkills" | "responsibilities" | "description">;
  focusAreas?: string[];
}): string {
  const { masterResume, job, focusAreas } = params;

  return `You are a World-Class Executive Resume Writer and ATS Optimization Specialist.
Your task is to TAILOR the candidate's existing master resume to best emphasize their relevance for the specified target job.

### STRICT ETHICAL & ACCURACY RULES:
1. NEVER fabricate or invent new companies, employment history, degrees, dates, certifications, or past employers.
2. KEEP THE LANGUAGE COMPLETELY NATURAL AND HUMAN. Do NOT use obvious AI buzzwords like "spearheaded cross-functional paradigms", "elevating synergistic capabilities", or stuffing technologies in parentheses. Write like a real, competent software engineer with 1+ years of experience.
3. STRICT 1-PAGE RESUME LENGTH BUDGET: A long resume hurts ATS scores and recruiter readability.
   - Keep Professional Summary to exactly 2 concise sentences (~35-45 words).
   - GYMYAK role: exactly 3-4 concise bullets maximum.
   - Grras role: exactly 3 concise bullets maximum.
   - Projects: strictly 2 concise bullets per project.
   - Total word count MUST stay between 400 and 500 words to strictly guarantee 1-page fit.
4. Seamlessly incorporate relevant target skills into existing bullet points and technical skills where authentic.
5. You MUST preserve the exact company names and employment dates.

---
### TARGET JOB:
- Role: ${job.title} at ${job.companyName}
- Required Skills: ${(job.requiredSkills || []).join(", ") || "General"}
- Preferred Skills: ${(job.preferredSkills || []).join(", ") || "General"}
- Responsibilities / Description: ${(job.responsibilities || []).slice(0, 5).join(" | ")}
${focusAreas && focusAreas.length > 0 ? `- Specific candidate focus requested: ${focusAreas.join(", ")}` : ""}

---
### CANDIDATE MASTER RESUME DATA:
${JSON.stringify(masterResume, null, 2)}

---
### OUTPUT REQUIREMENTS:
Respond with ONLY a valid JSON object matching this exact ResumeData structure:
{
  "summary": "Tailored 2-3 sentence professional summary highlighting the candidate's background relevant to this specific role",
  "skills": {
    "technical": ["prioritized array of candidate's verified technical skills, leading with matching ones"],
    "soft": ["array of verified soft skills"]
  },
  "experience": [
    {
      "company": "Exact existing company name",
      "role": "Exact existing role",
      "startDate": "Exact existing start date",
      "endDate": "Exact existing end date or null",
      "current": false,
      "location": "location string or null",
      "bullets": [
        "Tailored high-impact bullet point focusing on achievements and matching tech stack",
        "Tailored bullet point with strong action verb and measurable result"
      ]
    }
  ],
  "projects": [
    {
      "name": "Exact existing project name",
      "description": "Tailored description emphasizing relevant architecture/features",
      "technologies": ["technologies used"],
      "url": "url string or null",
      "bullets": ["highlighting key technical complexity"]
    }
  ],
  "education": ${JSON.stringify(masterResume.education || [])},
  "certifications": ${JSON.stringify(masterResume.certifications || [])},
  "achievements": ${JSON.stringify(masterResume.achievements || [])}
}`;
}