import { createHash } from "node:crypto";
import { getStationById } from "@/data/stations";
import { PRESENCE_KEY, PRESENCE_WINDOW_MS, HEARTBEAT_MS } from "@/lib/presence";
import { redisClient } from "@/lib/redis";
import { DAY_TTL_SECONDS, STATS_KEYS, localTime, statsDayKey } from "@/lib/stats";

/** Presence is a live count; a cached one would be meaningless. */
export const dynamic = "force-dynamic";

/**
 * Live listener count, and the listening time that falls out of it for free.
 *
 * Each listening tab POSTs here on a timer. Check-ins go into a sorted set
 * scored by timestamp, anything older than the window is dropped, and what
 * remains is the count. That keeps it self-healing: a listener who closes the
 * tab, sleeps their laptop or loses signal simply stops being counted, with no
 * disconnect event needed.
 *
 * Because that timer is already running, it is also the only honest place to
 * measure how long a mood is actually listened to: a "play" event says someone
 * pressed start, whereas a heartbeat still arriving twenty minutes later says
 * they stayed. Each check-in adds one interval to that mood's total.
 *
 * Every part of this degrades to "no count" rather than to a wrong count. If the
 * Upstash credentials are absent the route reports itself unconfigured and the
 * header just shows the LIVE dot, so the site deploys and runs fine without any
 * of this configured.
 */

const HEARTBEAT_SECONDS = Math.round(HEARTBEAT_MS / 1000);

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

/**
 * Which mood this tab is listening to, if any.
 *
 * Absent when nobody has picked one yet, so the presence count includes people
 * still on the overlay while the listening totals do not. Validated against the
 * station list because it becomes a hash field.
 */
async function listeningStationId(request: Request): Promise<string | null> {
  try {
    const body = (await request.json()) as { stationId?: unknown } | null;
    const id = body?.stationId;
    if (typeof id !== "string" || !getStationById(id)) return null;
    return id;
  } catch {
    // No body, or not JSON. A bare heartbeat is still a valid heartbeat.
    return null;
  }
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

    const stationId = await listeningStationId(request);
    const now = Date.now();
    const pipeline = redis.pipeline();
    pipeline.zadd(PRESENCE_KEY, { score: now, member: listenerId(request) });
    pipeline.zremrangebyscore(PRESENCE_KEY, 0, now - PRESENCE_WINDOW_MS);
    pipeline.zcard(PRESENCE_KEY);
    // Belt and braces: if the site goes quiet the whole key disappears rather
    // than lingering with stale members.
    pipeline.expire(PRESENCE_KEY, 600);

    if (stationId) {
      const { day } = localTime();
      const dayKey = statsDayKey(day);
      pipeline.hincrby(STATS_KEYS.listen, stationId, HEARTBEAT_SECONDS);
      pipeline.hincrby(STATS_KEYS.totals, "listenSeconds", HEARTBEAT_SECONDS);
      pipeline.hincrby(dayKey, "listenSeconds", HEARTBEAT_SECONDS);
      pipeline.expire(dayKey, DAY_TTL_SECONDS);
    }

    const results = await pipeline.exec();

    // Indexed rather than popped off the end: the listening commands above make
    // the pipeline's length vary, and zcard is the third command either way.
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
