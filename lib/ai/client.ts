import OpenAI from "openai";

// ─── Lazy singleton — only created at request time, not at build time ─────────

const globalForOpenAI = globalThis as unknown as {
  openai: OpenAI | undefined;
};

export function getOpenAIClient(): OpenAI {
  if (globalForOpenAI.openai) return globalForOpenAI.openai;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to .env.local to enable AI features."
    );
  }

  const client = new OpenAI({
    apiKey,
    organization: process.env.OPENAI_ORG_ID,
  });

  if (process.env.NODE_ENV !== "production") {
    globalForOpenAI.openai = client;
  }

  return client;
}

// Keep default export for backward compat — but callers should prefer getOpenAIClient()
// This won't throw at module evaluation; it throws only when called
const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getOpenAIClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export default openai;

// ─── Model constants ──────────────────────────────────────────────────────────

export const AI_MODELS = {
  ANALYSIS: "gpt-4o",         // Deep semantic job matching
  EXTRACTION: "gpt-4o-mini",  // Cheap structured extraction
  COVER_LETTER: "gpt-4o-mini",
  RESUME_TAILOR: "gpt-4o",
  INSIGHTS: "gpt-4o-mini",
} as const;