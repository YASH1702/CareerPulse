import type { Job, Profile, Skill } from "@prisma/client";
import type { ResumeData } from "@/types/resume";

export type CoverLetterTone = "PROFESSIONAL" | "STARTUP" | "ENTHUSIASTIC" | "EXECUTIVE";

export function buildCoverLetterPrompt(params: {
  job: Pick<Job, "title" | "companyName" | "requiredSkills" | "preferredSkills" | "responsibilities" | "description">;
  profile: (Profile & { skills: Skill[] }) | null;
  resumeData?: ResumeData | null;
  tone?: CoverLetterTone;
  customNotes?: string;
}): string {
  const { job, profile, resumeData, tone = "PROFESSIONAL", customNotes } = params;

  const candidateSkills = (profile?.skills || []).map((s) => s.name).join(", ");
  const candidateProjects = (resumeData?.projects || []).map((p) => `${p.name}: ${p.description}`).join(" | ");
  const candidateExperience = (resumeData?.experience || []).map((e) => `${e.role} at ${e.company}`).join(", ");

  const toneInstructions: Record<CoverLetterTone, string> = {
    PROFESSIONAL: "Crisp, polished, confident, and focused on tangible engineering achievements and business impact.",
    STARTUP: "Direct, high-agency, passionate about building products quickly, and thriving in dynamic environments.",
    ENTHUSIASTIC: "Energetic, deeply excited about the company mission, showcasing genuine technical passion.",
    EXECUTIVE: "Strategic, focused on technical leadership, architecture, system reliability, and mentoring.",
  };

  return `You are a Top-Tier Career Strategist writing a standout cover letter for a candidate.

### STRICT RULES:
1. DO NOT use generic clichés like "I am writing to express my interest in..." or "I believe I am the ideal candidate...".
2. Hook the reader immediately with a compelling opening reflecting excitement about what ${job.companyName} is building.
3. Mention 2-3 genuine achievements / technical skills from the candidate's actual background that directly solve problems mentioned in the job description.
4. Tone Style: ${toneInstructions[tone]}
5. Keep it concise (approx. 250 - 350 words, 3-4 structured paragraphs).

---
### TARGET ROLE & COMPANY:
- Company: ${job.companyName}
- Role: ${job.title}
- Key Requirements / Tech: ${(job.requiredSkills || []).join(", ")}
- Job Description Summary: ${(job.description || "").slice(0, 4000)}

---
### CANDIDATE BACKGROUND:
- Headline: ${profile?.headline || "Full Stack Software Engineer"}
- Verified Skills: ${candidateSkills}
- Past Roles: ${candidateExperience}
- Key Projects: ${candidateProjects}
${customNotes ? `- Custom candidate note to weave in: "${customNotes}"` : ""}

---
Respond with ONLY a JSON object matching this schema:
{
  "subject": "string (Email subject or document title, e.g. Full Stack Engineer Application - [Name])",
  "salutation": "string (e.g. Dear Hiring Team at [Company],)",
  "opening": "string (Engaging first paragraph)",
  "body": "string (1-2 strong paragraphs connecting candidate's proven experience to the job's key technical challenges)",
  "closing": "string (Call to action / interview invitation paragraph)",
  "signOff": "string (e.g. Sincerely,)",
  "fullText": "string (Complete markdown formatted cover letter ready to copy)"
}`;
}