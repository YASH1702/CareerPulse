import type { AIJobExtraction } from "@/types/ai";

export function buildJobExtractionPrompt(rawText: string): string {
  return `You are an expert job posting parser. Extract structured information from the following job posting text.

CRITICAL RULES:
- Extract ONLY what is explicitly stated in or directly inferred from the job posting.
- Do NOT fabricate qualifications or requirements.
- Standardize remoteType to one of: "REMOTE", "HYBRID", "ONSITE", "UNSPECIFIED".
- Standardize employmentType to one of: "FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE", "INTERNSHIP".
- Extract separate arrays for requiredSkills and preferredSkills (nice-to-have / bonus skills).
- If salary is provided, parse numerical salaryMin/salaryMax where possible (e.g. in LPA or annual numbers) and provide standard currency like "INR" or "USD". Also provide a clean human-readable salaryText.
- Extract clear responsibility bullet points.

Job posting text:
---
${rawText.slice(0, 15000)}
---

Respond with ONLY a valid JSON object matching this exact structure:
{
  "title": "string (Job Title)",
  "companyName": "string (Company Name, default to 'Unknown Company' if not found)",
  "location": "string or null",
  "remoteType": "REMOTE | HYBRID | ONSITE | UNSPECIFIED",
  "employmentType": "FULL_TIME | PART_TIME | CONTRACT | FREELANCE | INTERNSHIP",
  "requiredSkills": ["array of required skills/technologies"],
  "preferredSkills": ["array of preferred/nice-to-have skills"],
  "responsibilities": ["bullet points of key responsibilities"],
  "experienceRequired": "string or null (e.g. '3-5 years', 'Senior')",
  "educationRequired": "string or null (e.g. 'Bachelor in CS or related')",
  "salaryMin": number or null,
  "salaryMax": number or null,
  "salaryCurrency": "string (e.g. 'INR', 'USD')",
  "salaryText": "string or null (e.g. '₹12L - ₹18L / year', '$120k - $150k')",
  "benefits": ["array of perks/benefits"],
  "applicationUrl": "string or null"
}`;
}

export function validateJobExtractionResult(data: unknown): AIJobExtraction {
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid job extraction result: not an object");
  }
  const d = data as Record<string, unknown>;

  const remoteTypes = ["REMOTE", "HYBRID", "ONSITE", "UNSPECIFIED"];
  const employmentTypes = ["FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE", "INTERNSHIP"];

  return {
    title: typeof d.title === "string" && d.title.trim() ? d.title.trim() : "Software Engineer",
    companyName: typeof d.companyName === "string" && d.companyName.trim() ? d.companyName.trim() : "Unknown Company",
    location: typeof d.location === "string" ? d.location.trim() : undefined,
    remoteType: typeof d.remoteType === "string" && remoteTypes.includes(d.remoteType) ? d.remoteType : "UNSPECIFIED",
    employmentType: typeof d.employmentType === "string" && employmentTypes.includes(d.employmentType) ? d.employmentType : "FULL_TIME",
    requiredSkills: Array.isArray(d.requiredSkills) ? d.requiredSkills.map(String).filter(Boolean) : [],
    preferredSkills: Array.isArray(d.preferredSkills) ? d.preferredSkills.map(String).filter(Boolean) : [],
    responsibilities: Array.isArray(d.responsibilities) ? d.responsibilities.map(String).filter(Boolean) : [],
    experienceRequired: typeof d.experienceRequired === "string" ? d.experienceRequired : undefined,
    educationRequired: typeof d.educationRequired === "string" ? d.educationRequired : undefined,
    salaryMin: typeof d.salaryMin === "number" ? d.salaryMin : undefined,
    salaryMax: typeof d.salaryMax === "number" ? d.salaryMax : undefined,
    salaryCurrency: typeof d.salaryCurrency === "string" ? d.salaryCurrency : "INR",
    salaryText: typeof d.salaryText === "string" ? d.salaryText : undefined,
    benefits: Array.isArray(d.benefits) ? d.benefits.map(String).filter(Boolean) : [],
    applicationUrl: typeof d.applicationUrl === "string" ? d.applicationUrl : undefined,
  };
}