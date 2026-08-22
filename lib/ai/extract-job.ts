import { getOpenAIClient, AI_MODELS } from "@/lib/ai/client";
import {
  buildJobExtractionPrompt,
  validateJobExtractionResult,
} from "@/lib/ai/prompts/job-extract";
import type { AIJobExtraction } from "@/types/ai";

export async function extractJobWithAI(rawText: string): Promise<{
  data: AIJobExtraction;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
}> {
  if (!rawText || rawText.trim().length < 30) {
    throw new Error("Job description text is too short to parse");
  }

  const prompt = buildJobExtractionPrompt(rawText);
  const openai = getOpenAIClient();

  const response = await openai.chat.completions.create({
    model: AI_MODELS.EXTRACTION,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
    response_format: { type: "json_object" },
    max_tokens: 3000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI");

  const parsed = JSON.parse(content);
  const data = validateJobExtractionResult(parsed);

  const promptTokens = response.usage?.prompt_tokens ?? 0;
  const completionTokens = response.usage?.completion_tokens ?? 0;

  // GPT-4o-mini: $0.15/1M input, $0.60/1M output
  const costUsd =
    (promptTokens / 1_000_000) * 0.15 +
    (completionTokens / 1_000_000) * 0.6;

  return { data, promptTokens, completionTokens, costUsd };
}