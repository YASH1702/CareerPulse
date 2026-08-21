import OpenAI from "openai";

const globalForOpenAI = globalThis as unknown as {
  openai: OpenAI | undefined;
};

export const openai =
  globalForOpenAI.openai ??
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG_ID,
  });

if (process.env.NODE_ENV !== "production") globalForOpenAI.openai = openai;

// Model constants
export const AI_MODELS = {
  ANALYSIS: "gpt-4o",        // Deep semantic job matching
  EXTRACTION: "gpt-4o-mini", // Cheap structured extraction
  COVER_LETTER: "gpt-4o-mini",
  RESUME_TAILOR: "gpt-4o",
  INSIGHTS: "gpt-4o-mini",
} as const;

export default openai;
