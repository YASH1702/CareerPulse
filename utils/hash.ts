import { createHash } from "crypto";

/**
 * Generates a deterministic hash for job deduplication.
 * Normalizes strings before hashing to handle minor variations.
 */
export function generateJobHash(params: {
  companyName: string;
  title: string;
  location?: string | null;
  applicationUrl?: string | null;
}): string {
  const normalized = [
    normalizeString(params.companyName),
    normalizeString(params.title),
    normalizeString(params.location ?? ""),
    normalizeString(params.applicationUrl ?? ""),
  ].join("|");

  return createHash("sha256").update(normalized).digest("hex");
}

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
