import { Ratelimit } from "@upstash/ratelimit";
import redis from "./client";

// AI endpoint: 20 requests per minute per user
export const aiRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  analytics: true,
  prefix: "jobpilot:ai",
});

// General API: 100 requests per minute
export const apiRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true,
  prefix: "jobpilot:api",
});
