import { getOpenAIClient, AI_MODELS } from "@/lib/ai/client";
import { buildCoverLetterPrompt, type CoverLetterTone } from "@/lib/ai/prompts/cover-letter";
import type { ResumeData } from "@/types/resume";
import type { Job, Profile, Skill } from "@prisma/client";

export type { CoverLetterTone };

export interface CoverLetterOutput {
  subject: string;
  salutation: string;
  opening: string;
  body: string;
  closing: string;
  signOff: string;
  fullText: string;
}

export async function generateCoverLetterWithAI(params: {
  job: Pick<Job, "title" | "companyName" | "requiredSkills" | "preferredSkills" | "responsibilities" | "description">;
  profile: (Profile & { skills: Skill[] }) | null;
  resumeData?: ResumeData | null;
  tone?: CoverLetterTone;
  customNotes?: string;
}): Promise<{
  success: boolean;
  coverLetter?: CoverLetterOutput;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  error?: string;
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "sk-your-openai-api-key") {
    // Return standard template if no API key
    const candidateName = params.profile?.headline || "Software Engineer";
    const template: CoverLetterOutput = {
      subject: `Application for ${params.job.title} - ${params.job.companyName}`,
      salutation: `Dear Hiring Team at ${params.job.companyName},`,
      opening: `I am writing to express my strong interest in the ${params.job.title} role at ${params.job.companyName}.`,
      body: `With hands-on experience in ${(params.job.requiredSkills || []).slice(0, 3).join(", ") || "modern software engineering"}, I have delivered scalable web applications and high-performance user experiences.`,
      closing: `I would welcome the opportunity to discuss how my technical skills can contribute to your team. Thank you for your time and consideration.`,
      signOff: `Sincerely,\n${candidateName}`,
      fullText: `Dear Hiring Team at ${params.job.companyName},\n\nI am writing to express my strong interest in the ${params.job.title} role at ${params.job.companyName}.\n\nWith hands-on experience in ${(params.job.requiredSkills || []).slice(0, 3).join(", ") || "modern software engineering"}, I have delivered scalable web applications and high-performance user experiences.\n\nI would welcome the opportunity to discuss how my technical skills can contribute to your team.\n\nSincerely,\n${candidateName}`,
    };
    return {
      success: true,
      coverLetter: template,
      promptTokens: 0,
      completionTokens: 0,
      costUsd: 0,
    };
  }

  try {
    const prompt = buildCoverLetterPrompt(params);
    const openai = getOpenAIClient();

    const response = await openai.chat.completions.create({
      model: AI_MODELS.COVER_LETTER,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" },
      max_tokens: 2500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from AI cover letter generator");

    const parsed = JSON.parse(content) as CoverLetterOutput;
    const promptTokens = response.usage?.prompt_tokens ?? 0;
    const completionTokens = response.usage?.completion_tokens ?? 0;
    const costUsd = (promptTokens / 1_000_000) * 0.15 + (completionTokens / 1_000_000) * 0.60;

    return {
      success: true,
      coverLetter: parsed,
      promptTokens,
      completionTokens,
      costUsd,
    };
  } catch (err: unknown) {
    console.error("[Cover Letter Error]", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to generate cover letter",
      promptTokens: 0,
      completionTokens: 0,
      costUsd: 0,
    };
  }
}