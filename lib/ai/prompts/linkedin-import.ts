export function buildLinkedInProfileExtractionPrompt(rawText: string, linkedinUrl?: string): string {
  return `You are an expert AI recruiter and profile parser. Extract structured candidate profile data from the provided LinkedIn profile text or URL snippet.

RULES:
- Only extract real information present in the text.
- Standardize skills into clean industry names (e.g. "React", "TypeScript", "Node.js", "Python", "Docker", "PostgreSQL").
- Map technical skills to categories: "LANGUAGE", "FRAMEWORK", "DATABASE", "CLOUD", "TOOL", "SOFT", "AI", or "OTHER".
- Extract target engineering roles (e.g. "Software Engineer", "Frontend Developer", "Full Stack Developer", "Backend Developer").
- Extract education details with institution, degree, field of study, and years if available.
- If a field is missing, use null.

LinkedIn Profile Text / Snippet:
---
${rawText.slice(0, 12000)}
${linkedinUrl ? `\nLinkedIn Profile URL: ${linkedinUrl}` : ""}
---

Respond with ONLY valid JSON matching this exact structure:
{
  "name": "Full Name or null",
  "headline": "Professional headline / current title or null",
  "bio": "About summary or bio or null",
  "location": "City, State, Country or null",
  "phone": "Phone number or null",
  "currentRole": "Current role / job title or null",
  "yearsExperience": number or null,
  "targetRoles": ["string array of target roles like Frontend Developer, Software Engineer"],
  "linkedinUrl": "${linkedinUrl || ""}",
  "githubUrl": "GitHub profile URL if mentioned, else null",
  "portfolioUrl": "Portfolio URL if mentioned, else null",
  "skills": [
    {
      "name": "Skill Name",
      "category": "LANGUAGE" | "FRAMEWORK" | "DATABASE" | "CLOUD" | "TOOL" | "SOFT" | "AI" | "OTHER",
      "proficiency": "EXPERT" | "ADVANCED" | "INTERMEDIATE" | "BEGINNER"
    }
  ],
  "education": [
    {
      "institution": "University / College Name",
      "degree": "Degree (e.g. B.Tech, B.S., M.S.)",
      "field": "Computer Science / Field of Study or null",
      "startYear": number or null,
      "endYear": number or null
    }
  ]
}`;
}
