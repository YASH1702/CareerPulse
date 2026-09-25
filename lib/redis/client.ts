import { Redis } from "@upstash/redis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || "https://unconfigured-redis.upstash.io";
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || "unconfigured-token";

export const redis =
  globalForRedis.redis ??
  new Redis({
    url: redisUrl,
    token: redisToken,
  });

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

export default redis;
