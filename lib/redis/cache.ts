import redis from "./client";

const CACHE_TTL = 60 * 60 * 24 * 7; // 7 days default

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get<T>(key);
    return data;
  } catch {
    return null;
  }
}

export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds = CACHE_TTL
): Promise<void> {
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch {
    // Cache failures are non-fatal
    console.error("[Cache] Failed to set cache:", key);
  }
}

export async function deleteCached(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch {
    console.error("[Cache] Failed to delete cache:", key);
  }
}

export function buildJobAnalysisCacheKey(
  jobHash: string,
  profileVersion: string
): string {
  return `careerpulse:analysis:${jobHash}:${profileVersion}`;
}
