import "server-only";
import { createHash } from "node:crypto";

/**
 * Aggregate visitor statistics.
 *
 * The rule this file follows: count people, don't identify them. Nothing here
 * writes a raw IP address, a full user-agent string or any other value that
 * could single someone out. Every key is either a counter or a HyperLogLog, so
 * what lands in Redis is arithmetic — you can read "412 visits from Karnataka
 * on Chrome" out of it, and you cannot read any individual visit back out.
 *
 * That is a deliberate design constraint rather than an oversight. Raw IPs and
 * user-agents are personal data under the DPDP Act and the GDPR, which would
 * put a notice-and-consent obligation on a site that otherwise needs none, and
 * would turn a leaked Upstash token into a disclosure incident. Aggregates
 * carry the same product insight with none of that attached.
 */

/**
 * Both radios share one Upstash database, so every key is prefixed by site.
 * An unqualified key would have the two sites adding up into each other.
 */
export const STATS_PREFIX = "stats:kudla";

/** Long-lived rollups. No TTL: these are the totals since launch. */
export const STATS_KEYS = {
  /** visits, plays, listenSeconds. */
  totals: `${STATS_PREFIX}:totals`,
  /** stationId -> times started. */
  plays: `${STATS_PREFIX}:plays`,
  /** stationId -> seconds actually listened. */
  listen: `${STATS_PREFIX}:listen`,
  provider: `${STATS_PREFIX}:provider`,
  country: `${STATS_PREFIX}:country`,
  region: `${STATS_PREFIX}:region`,
  city: `${STATS_PREFIX}:city`,
  device: `${STATS_PREFIX}:device`,
  browser: `${STATS_PREFIX}:browser`,
  os: `${STATS_PREFIX}:os`,
  /** Referring host only, never the full URL: paths carry search terms. */
  referrer: `${STATS_PREFIX}:referrer`,
  /** Primary language subtag only, so "en-IN" and "en-GB" both count as "en". */
  language: `${STATS_PREFIX}:language`,
  /** Hour of day, 0-23, in IST — the question is when this coast listens. */
  hour: `${STATS_PREFIX}:hour`,
  /** All-time unique visitors. */
  uniqueAll: `${STATS_PREFIX}:uniq:all`,
} as const;

export const statsDayKey = (day: string) => `${STATS_PREFIX}:day:${day}`;
export const statsUniqueDayKey = (day: string) => `${STATS_PREFIX}:uniq:day:${day}`;
export const statsUniqueMonthKey = (month: string) => `${STATS_PREFIX}:uniq:month:${month}`;

/** Roughly thirteen months, so year-on-year comparisons survive. */
export const DAY_TTL_SECONDS = 400 * 24 * 60 * 60;
/** Long enough to chart a quarter, short enough not to hoard. */
export const UNIQUE_DAY_TTL_SECONDS = 95 * 24 * 60 * 60;
export const UNIQUE_MONTH_TTL_SECONDS = 800 * 24 * 60 * 60;

/** The audience is on this coast, so days and hours are bucketed in its own time. */
const TIME_ZONE = "Asia/Kolkata";

export interface LocalTime {
  /** YYYY-MM-DD in IST. */
  day: string;
  /** YYYY-MM in IST. */
  month: string;
  /** 0-23 in IST. */
  hour: number;
}

export function localTime(now: Date = new Date()): LocalTime {
  // en-CA formats as YYYY-MM-DD, which sorts correctly as a string.
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, hour: "2-digit", hour12: false }).format(now),
  );

  return { day, month: day.slice(0, 7), hour: Number.isFinite(hour) ? hour % 24 : 0 };
}

/**
 * A visitor identifier that expires on purpose.
 *
 * The input includes the period, so the value for one person changes every day
 * (and separately, every month). That is what keeps this from being a stable
 * pseudonymous id — it cannot follow anyone past the window it was minted for.
 * It is also only ever written into a HyperLogLog, which stores estimator
 * registers rather than members, so even these short-lived hashes are not
 * recoverable from what is stored.
 */
export function rotatingVisitorId(request: Request, period: string): string {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const uaFamily = `${browserFamily(request)}/${osFamily(request)}`;
  const salt = process.env.STATS_SALT ?? "namma-kudla-stats";
  return createHash("sha256").update(`${salt}:${period}:${ip}:${uaFamily}`).digest("base64url").slice(0, 22);
}

/**
 * Anything used as a hash field is bounded first.
 *
 * Header values are attacker-controlled, and a hash field taken straight from
 * one is an invitation to grow a key until it costs money. Unknown shapes
 * collapse to a single bucket rather than creating a field each.
 */
function safeLabel(value: string | null | undefined, maxLength = 32): string | null {
  if (!value) return null;
  const cleaned = value.trim().slice(0, maxLength);
  if (!cleaned) return null;
  return /^[A-Za-z0-9 .:_-]+$/.test(cleaned) ? cleaned : null;
}

function userAgent(request: Request): string {
  return request.headers.get("user-agent") ?? "";
}

/** Coarse class only. The full string is a fingerprint; "mobile" is not. */
export function deviceClass(request: Request): "mobile" | "tablet" | "desktop" {
  const hint = request.headers.get("sec-ch-ua-mobile");
  const ua = userAgent(request);
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return "tablet";
  if (hint === "?1") return "mobile";
  if (/Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua)) return "mobile";
  return "desktop";
}

export function browserFamily(request: Request): string {
  const ua = userAgent(request);
  // Order matters: most of these also claim to be Chrome or Safari.
  if (/SamsungBrowser/i.test(ua)) return "Samsung Internet";
  if (/Edg\//i.test(ua)) return "Edge";
  if (/OPR\/|Opera/i.test(ua)) return "Opera";
  if (/Firefox\/|FxiOS/i.test(ua)) return "Firefox";
  if (/CriOS/i.test(ua)) return "Chrome iOS";
  if (/Chrome\//i.test(ua)) return "Chrome";
  if (/Safari\//i.test(ua)) return "Safari";
  if (!ua) return "unknown";
  return "other";
}

export function osFamily(request: Request): string {
  const ua = userAgent(request);
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Mac OS X/i.test(ua)) return "macOS";
  if (/Windows/i.test(ua)) return "Windows";
  if (/CrOS/i.test(ua)) return "ChromeOS";
  if (/Linux/i.test(ua)) return "Linux";
  if (!ua) return "unknown";
  return "other";
}

/**
 * Where a visit came from, as a bare hostname.
 *
 * Deliberately not the full referrer: a search or social URL carries the query
 * that led here, which is about the person rather than the traffic.
 */
export function referrerHost(request: Request): string {
  const referer = request.headers.get("referer");
  if (!referer) return "direct";
  try {
    const host = new URL(referer).hostname.replace(/^www\./, "");
    const self = request.headers.get("host")?.replace(/^www\./, "");
    if (host === self) return "internal";
    return safeLabel(host, 64) ?? "other";
  } catch {
    return "other";
  }
}

export function primaryLanguage(request: Request): string {
  const header = request.headers.get("accept-language");
  if (!header) return "unknown";
  const first = header.split(",")[0]?.split(";")[0]?.trim() ?? "";
  const primary = first.split("-")[0]?.toLowerCase() ?? "";
  return safeLabel(primary, 8) ?? "unknown";
}

export interface Geo {
  country: string;
  region: string;
  city: string;
}

/** Vercel resolves these at the edge; they are city-level at best. */
export function geoFrom(request: Request): Geo {
  const country = safeLabel(request.headers.get("x-vercel-ip-country"), 2) ?? "unknown";
  const region = safeLabel(request.headers.get("x-vercel-ip-country-region"), 8) ?? "unknown";
  const rawCity = request.headers.get("x-vercel-ip-city");
  let city = "unknown";
  if (rawCity) {
    try {
      city = safeLabel(decodeURIComponent(rawCity), 40) ?? "unknown";
    } catch {
      city = safeLabel(rawCity, 40) ?? "unknown";
    }
  }
  return { country, region, city };
}
