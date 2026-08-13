import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";
import { PRESENCE_KEY, PRESENCE_WINDOW_MS } from "@/lib/presence";

/** Presence is a live count; a cached one would be meaningless. */
export const dynamic = "force-dynamic";

/**
 * Live listener count.
 *
 * Each listening tab POSTs here on a timer. Check-ins go into a sorted set
 * scored by timestamp, anything older than the window is dropped, and what
 * remains is the count. That keeps it self-healing: a listener who closes the
 * tab, sleeps their laptop or loses signal simply stops being counted, with no
 * disconnect event needed.
 *
 * Every part of this degrades to "no count" rather than to a wrong count. If the
 * Upstash credentials are absent the route reports itself unconfigured and the
 * header just shows the LIVE dot, so the site deploys and runs fine without any
 * of this configured.
 */
function redisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

/**
 * One entry per network, derived from the forwarded IP.
 *
 * Identifying by a client-supplied id would let anyone inflate the number just
 * by posting fresh ids in a loop, and the whole point of building this instead
 * of hardcoding a number is that it has to be true. The tradeoff is that a
 * shared connection counts once, and several tabs by one person also count once,
 * which is the more honest reading of "listeners" anyway.
 *
 * The IP is hashed and never stored raw, and the entry evaporates with the
 * window, so this keeps no meaningful record of who visited.
 */
function listenerId(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const salt = process.env.PRESENCE_SALT ?? "namma-kudla-radio";
  return createHash("sha256").update(`${salt}:${ip}`).digest("base64url").slice(0, 22);
}

/** The honest answer whenever a real count cannot be produced. */
function noCount(): Response {
  return Response.json({ configured: false, count: 0 }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  try {
    // Constructed inside the try on purpose: the client validates the URL and
    // throws on a malformed one, which is a misconfiguration like any other and
    // must degrade to "no count" rather than 500 at the page it decorates.
    const redis = redisClient();
    if (!redis) return noCount();

    const now = Date.now();
    const pipeline = redis.pipeline();
    pipeline.zadd(PRESENCE_KEY, { score: now, member: listenerId(request) });
    pipeline.zremrangebyscore(PRESENCE_KEY, 0, now - PRESENCE_WINDOW_MS);
    pipeline.zcard(PRESENCE_KEY);
    // Belt and braces: if the site goes quiet the whole key disappears rather
    // than lingering with stale members.
    pipeline.expire(PRESENCE_KEY, 600);
    const results = await pipeline.exec();

    const count = Number(results[2] ?? 0);
    return Response.json(
      { configured: true, count: Number.isFinite(count) ? count : 0 },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    // A presence outage must never break the page it decorates.
    console.error("presence heartbeat failed", error);
    return noCount();
  }
}
