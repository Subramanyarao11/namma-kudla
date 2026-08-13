/**
 * Prints the aggregate visitor statistics.
 *
 * Reads Redis directly rather than going through the site, which is why the app
 * exposes no GET endpoint for any of this: the numbers stay between you and the
 * database, and there is no public path to guess and no token to leak.
 *
 *   npm run stats            the default: totals, moods, geography, last 14 days
 *   npm run stats -- 30      a different number of days
 *
 * Everything read here is a counter or a HyperLogLog. There is no per-visitor
 * record to print, by design — see src/lib/stats.ts.
 */

const PREFIX = "stats:kudla";
const DAYS = Number(process.argv[2]) || 14;

const URL_BASE = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!URL_BASE || !TOKEN) {
  console.error("Missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN.");
  console.error("Run through npm so .env.local is loaded: npm run stats");
  process.exit(1);
}

/** One round trip for the whole report. */
async function pipeline(commands) {
  const response = await fetch(`${URL_BASE}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify(commands),
  });
  if (!response.ok) {
    throw new Error(`Upstash responded ${response.status}: ${await response.text()}`);
  }
  return (await response.json()).map((entry) => entry.result);
}

const IST = "Asia/Kolkata";
const todayIST = () => new Intl.DateTimeFormat("en-CA", { timeZone: IST, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

function recentDays(count) {
  const days = [];
  const now = new Date();
  for (let i = 0; i < count; i += 1) {
    const date = new Date(now.getTime() - i * 86_400_000);
    days.push(new Intl.DateTimeFormat("en-CA", { timeZone: IST, year: "numeric", month: "2-digit", day: "2-digit" }).format(date));
  }
  return days.reverse();
}

/** Upstash returns hashes as a flat array. */
function toObject(flat) {
  const out = {};
  if (!Array.isArray(flat)) return out;
  for (let i = 0; i < flat.length; i += 2) out[flat[i]] = Number(flat[i + 1]) || 0;
  return out;
}

function duration(seconds) {
  const total = Number(seconds) || 0;
  if (total < 60) return `${total}s`;
  const hours = Math.floor(total / 3600);
  const minutes = Math.round((total % 3600) / 60);
  if (!hours) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

function table(title, entries, { total, format = (n) => String(n), limit = 12 } = {}) {
  console.log(`\n${title}`);
  const rows = Object.entries(entries)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  if (!rows.length) {
    console.log("  (nothing recorded yet)");
    return;
  }

  const width = Math.max(...rows.map(([label]) => label.length));
  const denominator = total ?? rows.reduce((sum, [, value]) => sum + value, 0);
  for (const [label, value] of rows) {
    const share = denominator ? Math.round((value / denominator) * 100) : 0;
    const bar = "\u2588".repeat(Math.max(0, Math.round(share / 4)));
    console.log(`  ${label.padEnd(width)}  ${format(value).padStart(8)}  ${String(share).padStart(3)}%  ${bar}`);
  }
}

const days = recentDays(DAYS);
const today = todayIST();
const month = today.slice(0, 7);

const [
  totals,
  plays,
  listen,
  provider,
  country,
  region,
  city,
  device,
  browser,
  os,
  referrer,
  language,
  hour,
  uniqueAll,
  uniqueToday,
  uniqueMonth,
  liveListeners,
  ...dayResults
] = await pipeline([
  ["HGETALL", `${PREFIX}:totals`],
  ["HGETALL", `${PREFIX}:plays`],
  ["HGETALL", `${PREFIX}:listen`],
  ["HGETALL", `${PREFIX}:provider`],
  ["HGETALL", `${PREFIX}:country`],
  ["HGETALL", `${PREFIX}:region`],
  ["HGETALL", `${PREFIX}:city`],
  ["HGETALL", `${PREFIX}:device`],
  ["HGETALL", `${PREFIX}:browser`],
  ["HGETALL", `${PREFIX}:os`],
  ["HGETALL", `${PREFIX}:referrer`],
  ["HGETALL", `${PREFIX}:language`],
  ["HGETALL", `${PREFIX}:hour`],
  ["PFCOUNT", `${PREFIX}:uniq:all`],
  ["PFCOUNT", `${PREFIX}:uniq:day:${today}`],
  ["PFCOUNT", `${PREFIX}:uniq:month:${month}`],
  ["ZCARD", "presence:listeners:kudla"],
  ...days.map((day) => ["HGETALL", `${PREFIX}:day:${day}`]),
]);

const t = toObject(totals);

console.log("\n\u2500\u2500 \u0ca8\u0cae\u0ccd\u0cae \u0c95\u0cc1\u0ca1\u0ccd\u0cb2 \u2014 aggregate statistics \u2500\u2500");
console.log(`\n  visits            ${t.visits ?? 0}`);
console.log(`  unique visitors   ${uniqueAll ?? 0}  (all time, estimated)`);
console.log(`  moods started     ${t.plays ?? 0}`);
console.log(`  time listened     ${duration(t.listenSeconds)}`);
console.log(`  listening now     ${liveListeners ?? 0}`);
console.log(`\n  unique today      ${uniqueToday ?? 0}`);
console.log(`  unique this month ${uniqueMonth ?? 0}`);

const playCounts = toObject(plays);
const listenSeconds = toObject(listen);

table("Moods, by times started", playCounts);
table("Moods, by time listened", listenSeconds, { format: duration });
table("Provider", toObject(provider));

table("Countries", toObject(country));
table("Regions", toObject(region));
table("Cities", toObject(city));

table("Device", toObject(device));
table("Browser", toObject(browser));
table("Operating system", toObject(os));
table("Came from", toObject(referrer));
table("Browser language", toObject(language));

const hours = toObject(hour);
console.log("\nWhen people listen (IST)");
const hourPeak = Math.max(1, ...Object.values(hours));
for (let h = 0; h < 24; h += 1) {
  const value = hours[String(h)] ?? 0;
  const bar = "\u2588".repeat(Math.round((value / hourPeak) * 30));
  console.log(`  ${String(h).padStart(2, "0")}:00  ${String(value).padStart(5)}  ${bar}`);
}

console.log(`\nLast ${DAYS} days`);
const daily = days.map((day, index) => ({ day, ...toObject(dayResults[index]) }));
const dayPeak = Math.max(1, ...daily.map((entry) => entry.visits ?? 0));
for (const entry of daily) {
  const visits = entry.visits ?? 0;
  const bar = "\u2588".repeat(Math.round((visits / dayPeak) * 24));
  const listened = entry.listenSeconds ? `  ${duration(entry.listenSeconds)}` : "";
  console.log(`  ${entry.day}  ${String(visits).padStart(5)} visits  ${String(entry.plays ?? 0).padStart(4)} plays  ${bar}${listened}`);
}

console.log("\nNo per-visitor records are kept, so there are none to print.\n");
