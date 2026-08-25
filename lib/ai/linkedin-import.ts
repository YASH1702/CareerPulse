import { getOpenAIClient, AI_MODELS } from "./client";
import { buildLinkedInProfileExtractionPrompt } from "./prompts/linkedin-import";
import { SkillCategory, SkillLevel } from "@prisma/client";

export interface ExtractedLinkedInProfile {
  name?: string | null;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  phone?: string | null;
  currentRole?: string | null;
  yearsExperience?: number | null;
  targetRoles: string[];
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  skills: Array<{
    name: string;
    category: SkillCategory;
    proficiency: SkillLevel;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field?: string | null;
    startYear?: number | null;
    endYear?: number | null;
  }>;
}

const COMMON_TECH_SKILLS: Record<string, SkillCategory> = {
  "React": SkillCategory.FRAMEWORK,
  "Next.js": SkillCategory.FRAMEWORK,
  "TypeScript": SkillCategory.LANGUAGE,
  "JavaScript": SkillCategory.LANGUAGE,
  "HTML/CSS": SkillCategory.LANGUAGE,
  "Tailwind CSS": SkillCategory.FRAMEWORK,
  "Vue.js": SkillCategory.FRAMEWORK,
  "Angular": SkillCategory.FRAMEWORK,
  "Node.js": SkillCategory.FRAMEWORK,
  "Python": SkillCategory.LANGUAGE,
  "Go": SkillCategory.LANGUAGE,
  "Java": SkillCategory.LANGUAGE,
  "Express.js": SkillCategory.FRAMEWORK,
  "FastAPI": SkillCategory.FRAMEWORK,
  "Django": SkillCategory.FRAMEWORK,
  "PostgreSQL": SkillCategory.DATABASE,
  "MySQL": SkillCategory.DATABASE,
  "MongoDB": SkillCategory.DATABASE,
  "Redis": SkillCategory.DATABASE,
  "Prisma": SkillCategory.TOOL,
  "Docker": SkillCategory.TOOL,
  "Kubernetes": SkillCategory.TOOL,
  "AWS": SkillCategory.CLOUD,
  "GCP": SkillCategory.CLOUD,
  "Azure": SkillCategory.CLOUD,
  "CI/CD": SkillCategory.TOOL,
  "Git": SkillCategory.TOOL,
  "Machine Learning": SkillCategory.AI,
  "AI / LLMs": SkillCategory.AI,
};

/**
 * Heuristic fallback parser when AI API key is unavailable.
 */
function heuristicLinkedInParse(rawText: string, linkedinUrl?: string): ExtractedLinkedInProfile {
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  const name = lines[0] || "Candidate";
  const headline = lines[1] || "Software Engineer";

  const foundSkills: ExtractedLinkedInProfile["skills"] = [];
  const lower = rawText.toLowerCase();

  for (const [skill, cat] of Object.entries(COMMON_TECH_SKILLS)) {
    if (lower.includes(skill.toLowerCase())) {
      foundSkills.push({
        name: skill,
        category: cat,
        proficiency: SkillLevel.ADVANCED,
      });
    }
  }

  return {
    name,
    headline,
    bio: rawText.slice(0, 500),
    location: "India",
    currentRole: headline,
    yearsExperience: 2,
    targetRoles: ["Software Engineer", "Frontend Developer", "Full Stack Developer"],
    linkedinUrl: linkedinUrl || null,
    githubUrl: null,
    portfolioUrl: null,
    skills: foundSkills.length > 0 ? foundSkills : [
      { name: "React", category: SkillCategory.FRAMEWORK, proficiency: SkillLevel.ADVANCED },
      { name: "TypeScript", category: SkillCategory.LANGUAGE, proficiency: SkillLevel.ADVANCED },
      { name: "Node.js", category: SkillCategory.FRAMEWORK, proficiency: SkillLevel.INTERMEDIATE },
    ],
    education: [],
  };
}

/**
 * Extracts structured LinkedIn profile using OpenAI/Gemini AI with heuristic fallback.
 */
export async function extractLinkedInProfileWithAI(
  rawText: string,
  linkedinUrl?: string
): Promise<ExtractedLinkedInProfile> {
  try {
    const openai = getOpenAIClient();
    const prompt = buildLinkedInProfileExtractionPrompt(rawText, linkedinUrl);

    const response = await openai.chat.completions.create({
      model: AI_MODELS.EXTRACTION,
      messages: [
        {
          role: "system",
          content: "You are an expert resume and LinkedIn profile extraction engine. Output only valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    const parsed = JSON.parse(content);
    return {
      name: parsed.name || null,
      headline: parsed.headline || null,
      bio: parsed.bio || null,
      location: parsed.location || "India",
      phone: parsed.phone || null,
      currentRole: parsed.currentRole || null,
      yearsExperience: typeof parsed.yearsExperience === "number" ? parsed.yearsExperience : 2,
      targetRoles: Array.isArray(parsed.targetRoles) && parsed.targetRoles.length > 0
        ? parsed.targetRoles
        : ["Software Engineer", "Frontend Developer", "Full Stack Developer"],
      linkedinUrl: parsed.linkedinUrl || linkedinUrl || null,
      githubUrl: parsed.githubUrl || null,
      portfolioUrl: parsed.portfolioUrl || null,
      skills: Array.isArray(parsed.skills)
        ? parsed.skills.map((s: { name: string; category?: string; proficiency?: string }) => ({
            name: s.name,
            category: (s.category as SkillCategory) || SkillCategory.OTHER,
            proficiency: (s.proficiency as SkillLevel) || SkillLevel.INTERMEDIATE,
          }))
        : [],
      education: Array.isArray(parsed.education) ? parsed.education : [],
    };
  } catch (err) {
    console.warn("[extractLinkedInProfileWithAI] AI extraction fallback to heuristics:", err);
    return heuristicLinkedInParse(rawText, linkedinUrl);
  }
}
