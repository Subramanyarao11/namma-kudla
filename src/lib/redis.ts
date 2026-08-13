import "server-only";
import { Redis } from "@upstash/redis";

/**
 * The Upstash client, or null when the credentials aren't set.
 *
 * Returning null rather than throwing is what lets every caller degrade to
 * "no data" instead of a 500: the site is a radio, and neither a listener count
 * nor a page-view counter is worth failing a request over. It also means the
 * whole app clones and runs with no environment configured at all.
 */
export function redisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}
