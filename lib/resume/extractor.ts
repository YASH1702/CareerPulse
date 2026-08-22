import { getOpenAIClient, AI_MODELS } from "@/lib/ai/client";
import {
  buildResumeExtractionPrompt,
  validateExtractionResult,
} from "@/lib/ai/prompts/resume-extraction";
import type { ResumeData } from "@/types/resume";

export async function extractResumeWithAI(rawText: string): Promise<{
  data: ResumeData;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
}> {
  if (!rawText || rawText.length < 50) {
    throw new Error("Resume text too short to extract");
  }

  const prompt = buildResumeExtractionPrompt(rawText);
  const openai = getOpenAIClient();

  const response = await openai.chat.completions.create({
    model: AI_MODELS.EXTRACTION,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
    response_format: { type: "json_object" },
    max_tokens: 4000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from AI");

  const parsed = JSON.parse(content);
  const data = validateExtractionResult(parsed);

  const promptTokens = response.usage?.prompt_tokens ?? 0;
  const completionTokens = response.usage?.completion_tokens ?? 0;

  // GPT-4o-mini pricing: $0.15/1M input, $0.60/1M output
  const costUsd =
    (promptTokens / 1_000_000) * 0.15 +
    (completionTokens / 1_000_000) * 0.6;

  return { data, promptTokens, completionTokens, costUsd };
}