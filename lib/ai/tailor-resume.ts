import { getOpenAIClient, AI_MODELS } from "@/lib/ai/client";
import { buildResumeTailorPrompt } from "@/lib/ai/prompts/resume-tailor";
import { validateTailoredResume } from "@/lib/ai/safety";
import type { ResumeData } from "@/types/resume";
import type { Job } from "@prisma/client";

export async function tailorResumeWithAI(params: {
  masterResume: ResumeData;
  job: Pick<Job, "title" | "companyName" | "requiredSkills" | "preferredSkills" | "responsibilities" | "description">;
  focusAreas?: string[];
}): Promise<{
  success: boolean;
  tailoredResume?: ResumeData;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  error?: string;
}> {
  const { masterResume, job, focusAreas } = params;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "sk-your-openai-api-key") {
    // If no OpenAI key configured, return master resume as baseline
    return {
      success: true,
      tailoredResume: masterResume,
      promptTokens: 0,
      completionTokens: 0,
      costUsd: 0,
    };
  }

  try {
    const prompt = buildResumeTailorPrompt({ masterResume, job, focusAreas });
    const openai = getOpenAIClient();

    const response = await openai.chat.completions.create({
      model: AI_MODELS.RESUME_TAILOR,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" },
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from AI resume tailoring");

    const parsed = JSON.parse(content) as ResumeData;

    // AI Safety Guard: Validate that no new companies or unverified items were added
    const safetyCheck = validateTailoredResume(
      parsed as unknown as Record<string, unknown>,
      masterResume as unknown as Record<string, unknown>
    );

    if (!safetyCheck.valid) {
      console.warn("[AI Safety] Violations detected in tailored resume:", safetyCheck.violations);
    }

    const promptTokens = response.usage?.prompt_tokens ?? 0;
    const completionTokens = response.usage?.completion_tokens ?? 0;
    const costUsd = (promptTokens / 1_000_000) * 2.50 + (completionTokens / 1_000_000) * 10.00;

    return {
      success: true,
      tailoredResume: parsed,
      promptTokens,
      completionTokens,
      costUsd,
    };
  } catch (err: unknown) {
    console.error("[Tailor Resume Error]", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to tailor resume",
      promptTokens: 0,
      completionTokens: 0,
      costUsd: 0,
    };
  }
}