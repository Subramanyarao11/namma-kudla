import { getStationById, type ProviderId } from "@/data/stations";
import { redisClient } from "@/lib/redis";
import {
  DAY_TTL_SECONDS,
  UNIQUE_DAY_TTL_SECONDS,
  UNIQUE_MONTH_TTL_SECONDS,
  STATS_KEYS,
  geoFrom,
  browserFamily,
  deviceClass,
  localTime,
  osFamily,
  primaryLanguage,
  referrerHost,
  rotatingVisitorId,
  statsDayKey,
  statsUniqueDayKey,
  statsUniqueMonthKey,
} from "@/lib/stats";

/** Counters must not be answered from a cache. */
export const dynamic = "force-dynamic";

/**
 * Aggregate statistics collection.
 *
 * Two events, both fire-and-forget from the browser: `visit` once per tab
 * session, and `play` whenever a mood is started. Everything else — country,
 * device, browser, referrer — is read from the request's own headers on the
 * server, so the client never sends anything about itself and cannot lie about
 * more than which mood it picked.
 *
 * There is no GET here on purpose. Reading these numbers back over the public
 * internet would either leak the site's traffic to anyone who guessed the path
 * or need an auth token that then has to live somewhere; `npm run stats` reads
 * them from Redis directly instead, on your own machine.
 */

type Event = { type: "visit" } | { type: "play"; stationId: string; provider: ProviderId };

/** Always 204: a counter is not something the page should react to. */
function accepted(): Response {
  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
}

function parseEvent(body: unknown): Event | null {
  if (typeof body !== "object" || body === null) return null;
  const candidate = body as { type?: unknown; stationId?: unknown; provider?: unknown };

  if (candidate.type === "visit") return { type: "visit" };

  if (candidate.type === "play") {
    // Validated against the real station list, not just for shape: an unchecked
    // id becomes a hash field, and a hash whose fields come from request bodies
    // is a key an outsider can grow without limit.
    if (typeof candidate.stationId !== "string" || !getStationById(candidate.stationId)) return null;
    const provider: ProviderId = candidate.provider === "spotify" ? "spotify" : "youtube";
    return { type: "play", stationId: candidate.stationId, provider };
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const redis = redisClient();
    if (!redis) return accepted();

    const event = parseEvent(await request.json().catch(() => null));
    if (!event) return accepted();

    const { day, month, hour } = localTime();
    const dayKey = statsDayKey(day);
    const pipeline = redis.pipeline();

    if (event.type === "visit") {
      const geo = geoFrom(request);

      pipeline.hincrby(STATS_KEYS.totals, "visits", 1);
      pipeline.hincrby(dayKey, "visits", 1);
      pipeline.hincrby(STATS_KEYS.hour, String(hour), 1);
      pipeline.hincrby(STATS_KEYS.country, geo.country, 1);
      pipeline.hincrby(STATS_KEYS.region, `${geo.country}-${geo.region}`, 1);
      pipeline.hincrby(STATS_KEYS.city, geo.city, 1);
      pipeline.hincrby(STATS_KEYS.device, deviceClass(request), 1);
      pipeline.hincrby(STATS_KEYS.browser, browserFamily(request), 1);
      pipeline.hincrby(STATS_KEYS.os, osFamily(request), 1);
      pipeline.hincrby(STATS_KEYS.referrer, referrerHost(request), 1);
      pipeline.hincrby(STATS_KEYS.language, primaryLanguage(request), 1);

      // Distinct-visitor estimates. The id differs per period by construction,
      // so the daily and monthly sets need their own.
      pipeline.pfadd(statsUniqueDayKey(day), rotatingVisitorId(request, day));
      pipeline.pfadd(statsUniqueMonthKey(month), rotatingVisitorId(request, month));
      pipeline.pfadd(STATS_KEYS.uniqueAll, rotatingVisitorId(request, month));

      pipeline.expire(dayKey, DAY_TTL_SECONDS);
      pipeline.expire(statsUniqueDayKey(day), UNIQUE_DAY_TTL_SECONDS);
      pipeline.expire(statsUniqueMonthKey(month), UNIQUE_MONTH_TTL_SECONDS);
    } else {
      pipeline.hincrby(STATS_KEYS.totals, "plays", 1);
      pipeline.hincrby(dayKey, "plays", 1);
      pipeline.hincrby(STATS_KEYS.plays, event.stationId, 1);
      pipeline.hincrby(STATS_KEYS.provider, event.provider, 1);
      pipeline.expire(dayKey, DAY_TTL_SECONDS);
    }

    await pipeline.exec();
    return accepted();
  } catch (error) {
    // Statistics are the least important thing on this page.
    console.error("stats event failed", error);
    return accepted();
  }
}
