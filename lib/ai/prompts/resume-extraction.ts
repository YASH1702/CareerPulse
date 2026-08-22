import type { ResumeData } from "@/types/resume";

export function buildResumeExtractionPrompt(rawText: string): string {
  return `You are a precise resume parser. Extract structured data from this resume text.

RULES:
- Only extract information EXPLICITLY stated in the resume
- Never invent, infer, or hallucinate data
- If a field is not present, use null or empty array
- Dates: use "YYYY-MM" format where possible, or descriptive string
- Skills: extract ALL mentioned technologies, tools, languages, frameworks
- Be thorough with experience bullet points

Resume text:
---
${rawText.slice(0, 12000)}
---

Respond with ONLY valid JSON matching this exact structure:
{
  "summary": "string or null",
  "skills": {
    "technical": ["array of technical skills"],
    "soft": ["array of soft skills"]
  },
  "experience": [
    {
      "company": "string",
      "role": "string",
      "startDate": "string",
      "endDate": "string or null",
      "current": false,
      "location": "string or null",
      "bullets": ["achievement/responsibility strings"]
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["array"],
      "url": "string or null",
      "bullets": ["strings"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string or null",
      "startYear": number or null,
      "endYear": number or null,
      "grade": "string or null"
    }
  ],
  "certifications": [
    { "name": "string", "issuer": "string or null", "year": number or null }
  ],
  "achievements": ["string array of awards/recognitions"]
}`;
}

export function validateExtractionResult(data: unknown): ResumeData {
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid extraction result: not an object");
  }
  const d = data as Record<string, unknown>;

  return {
    summary: typeof d.summary === "string" ? d.summary : undefined,
    skills: typeof d.skills === "object" && d.skills !== null
      ? d.skills as ResumeData["skills"]
      : { technical: [], soft: [] },
    experience: Array.isArray(d.experience) ? d.experience : [],
    projects: Array.isArray(d.projects) ? d.projects : [],
    education: Array.isArray(d.education) ? d.education : [],
    certifications: Array.isArray(d.certifications) ? d.certifications : [],
    achievements: Array.isArray(d.achievements) ? d.achievements : [],
  };
}