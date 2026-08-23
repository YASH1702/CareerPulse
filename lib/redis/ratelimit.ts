import { Ratelimit } from "@upstash/ratelimit";
import redis from "./client";

/**
 * Creates an Upstash rate limiter or a graceful fallback for local development.
 */
export function getRateLimiter(limit = 20, window = "1 h"): {
  check: (identifier: string) => Promise<{ success: boolean; remaining: number }>;
} {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken || redisUrl.includes("your-upstash")) {
    // Graceful fallback for dev when Upstash is not configured
    return {
      check: async () => ({ success: true, remaining: limit }),
    };
  }

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window as "1 h" | "1 m" | "1 d"),
    analytics: true,
  });

  return {
    check: async (identifier: string) => {
      try {
        const res = await ratelimit.limit(identifier);
        return { success: res.success, remaining: res.remaining };
      } catch {
        // Non-fatal on network error
        return { success: true, remaining: limit };
      }
    },
  };
}