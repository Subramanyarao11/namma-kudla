# ನಮ್ಮ ಕುಡ್ಲ — Namma Kudla

A cinematic, single-page Tulu mood radio. ಕುಡ್ಲ is what Tulu speakers call
Mangaluru — the name locals use among themselves, which is the register the
whole site is written in. The viewport is an original illustrated Tulu Nadu
scene that changes per mood, with a floating glass player wired to real
YouTube playlists.

Namma Kudla is how the site is titled, shared and found; the scene itself is
headed ತುಳುನಾಡ್‌ದ ರೇಡಿಯೋ, because the hero reads as part of the illustration and
should describe what you are listening to rather than repeat the brand.

## The Tulu copy needs a native review

Every Tulu string in this repo was written by a non-speaker working from
reference, and is marked `REVIEW` at its definition. They are concentrated in
two files — `src/data/stations.ts` (the mood names and the per-mood footer
asides) and `src/lib/site.ts` (the hero, tagline and meta description) — plus
three UI strings in `Player`, `StationSelector` and `FirstVisitOverlay`. Fix
them before this is shown to anyone from Tulu Nadu.

Two have already come back from a native speaker: "change mood" was ಮೂಡ್ ಬದಲ್,
which is not a Tulu imperative, and is now ಬೇತೆ ಮೂಡ್ ("another mood"); and
ತುಳುನಾಡ್ takes the genitive ದ when it modifies a noun, so the hero is
ತುಳುನಾಡ್‌ದ ರೇಡಿಯೋ and the mood is ತುಳುನಾಡ್‌ದ ಪೊರ್ಲು. The bare form survives only
in `Header`, where ಕುಡ್ಲ, ತುಳುನಾಡ್ is a place label rather than a modifier.

Tulu is written in Kannada script here, which is what Tulu speakers actually
use. The Tulu-Tigalari Unicode block exists but has effectively no font support.
So `font-kannada` throughout the app names the script, not the language.

`<html lang>` should be `tcy-Knda` and isn't — it says `kn-IN`. Nothing in a
browser can act on `tcy`: Chrome's translator reports `unavailable` for both
`tcy` and `tcy-Knda` while `kn` is `downloadable`, so the accurate tag silently
costs every reader the "translate this page" prompt, and there is no Tulu
screen-reader voice for it to buy instead. A Kannada voice reading Kannada
glyphs is the closest this text gets to being pronounced right. The honest claim
still ships where it is machine-readable and acted on — `StructuredData` sets
`inLanguage: tcy-Knda`. Worth revisiting if Chrome ever ships a `tcy` model:

```sh
# in the browser console, on the deployed site
await Translator.availability({ sourceLanguage: 'tcy', targetLanguage: 'en' })
```

## The site says "from Tulu Nadu", not "in Tulu", on purpose

ತುಳುನಾಡ್‌ದ ಪೊರ್ಲು is Tulu-language throughout and ದೈವದ ನೇಮ is Tulu devotional, but
ಯಕ್ಷಗಾನ ರಾತ್ರೆ is sung in Kannada. Yakshagana belongs to this coast without
belonging to the language. It is also the deepest playlist of the three at 79
tracks, so it stays — and the meta copy describes the region rather than
claiming every song is in Tulu.

Worth knowing if you swap playlists later: these are community playlists with
loose tagging. The devotional list can drift into Kannada bhajans a few tracks
deep, which matters here because each mood opens at a random index by design.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS v4
- YouTube IFrame Player API (official embed + playback controller)

No authentication, database, backend or payments — this is a static,
client-rendered single page.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm run start   # run the production build
npm run lint    # eslint
```

### Optional: live listener count

The `LIVE` badge shows a real listener count once at least
`MIN_VISIBLE_LISTENERS` (5) people are on the site. It needs somewhere to track
presence; without it the badge is just the pulsing dot, and everything else
works unchanged. There is deliberately no fallback number — an invented count
would mislead every visitor.

Create a free [Upstash](https://upstash.com) Redis database and add to
`.env.local`:

```bash
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
PRESENCE_SALT=any-random-string   # optional, salts the hashed IPs
```

Listening tabs POST to `/api/presence` every 20s. Check-ins land in a sorted set
scored by timestamp; anything older than 50s is dropped and the remainder is the
count, so a closed tab or a dead connection drops out on its own. Entries are
keyed by a salted hash of the caller's IP — never the raw IP, and never a
client-supplied id, which anyone could loop to inflate the number.

`PRESENCE_KEY` is namespaced (`presence:listeners:kudla`). If you point this at
an Upstash database another one of these radios already uses, an unqualified key
would have each site counting the other's listeners as its own.

### Visitor statistics

The same Upstash database, if configured, also collects aggregate statistics —
visits, unique visitors, which moods get started, how long each one is actually
listened to, and coarse country, device, browser and referrer breakdowns. Read
them with:

```bash
npm run stats        # totals, moods, geography, hour of day, last 14 days
npm run stats -- 30  # a different number of days
```

That script talks to Redis directly, which is why the app exposes no endpoint for
reading any of this: there is no public path to guess and no token to leak.

**What is deliberately not stored:** no raw IP addresses, no user-agent strings,
no per-visitor records of any kind. Every key is a counter or a HyperLogLog, so
you can read *"412 visits from Karnataka on Chrome"* out of it and cannot read
any individual visit back out. Unique visitors are counted with a hash that
includes the period it belongs to, so the value for one person changes every day
and cannot follow them past it.

This is a constraint worth keeping. Raw IPs and user-agents are personal data
under India's DPDP Act and the GDPR, which would put a notice-and-consent
obligation on a site that otherwise needs none, and would turn a leaked Upstash
token into a disclosure incident. Aggregates carry the same insight with none of
that attached.

Listening time piggybacks on the presence heartbeat that is already running, so
it costs one extra Redis command per check-in rather than a timer of its own.
`STATS_SALT` is optional and salts the visitor hashes, like `PRESENCE_SALT`.

### Canonical URL

Canonical tags, Open Graph URLs, `robots.txt` and the sitemap all need an
origin. On Vercel each deployment falls back to its own URL, so previews are
correct with no configuration. Once a custom domain exists, set it:

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Deploying

The project is a stock Next.js app with no build configuration to carry over, so
Vercel needs nothing beyond the repository. Copy the Upstash pair into the
project's environment variables if you want the live listener count; leave them
out and the header simply shows the LIVE dot. `OPENAI_API_KEY` belongs only in
`.env.local` — the scene artwork is generated offline and committed, so the
running site never needs it.

Analytics and Speed Insights are mounted in the root layout via
`@vercel/analytics` and `@vercel/speed-insights`. Both no-op off Vercel and in
development, so there is no key to configure and local runs stay clean. Enable
each one in the project's dashboard for data to start arriving.

## Why there are no ambient videos

The sibling Kannada site ships a generated ambient video per mood. Those clips
were about 95% of what that build cost to make, and about 38 MB of what it costs
to serve. This site is stills only: motion comes from the CSS ambient layer, the
slow scene drift, the light flicker and the grain, which together cost nothing to
produce and nothing to transfer.

The mechanism is still here rather than ripped out — add a loop at the
conventional path and list it in `SCENES_WITH_VIDEO` and `SceneMedia` will use
it. `SCENES_WITH_VIDEO` is empty on purpose.

## Metadata and SEO

`src/lib/site.ts` is the single source of truth for the name, tagline,
descriptions and author identity; `src/lib/site-url.ts` resolves the origin and
is `server-only` so the Vercel variables can never be read during client render.

Next.js file conventions generate the rest: `opengraph-image.png`,
`twitter-image.png`, `icon.png`, `apple-icon.png`, `favicon.ico`, `manifest.ts`,
`sitemap.ts` and `robots.ts`. `StructuredData` emits one JSON-LD graph —
`Person`, `WebSite`, `WebApplication` and `LISTED_STATIONS` as `MusicPlaylist`
items. The author's `sameAs` profiles are mirrored as `rel="me"` links in the
document head, which is where search engines look for them; the footer carries a
single byline rather than a row of profile links.

The icon is a bare bicolour tile, sun gold over sea teal — the two colours the
coast scene is built from. A letter only survives down to about 32px, while two
fields of colour stay legible at tab size, and it has to be told apart from the
sibling site's favicon at a glance.

The tab title and description follow the mood the listener picks, in both
scripts (`ದೈವದ ನೇಮ — Daiva Nema · ನಮ್ಮ ಕುಡ್ಲ`). Crawlers and link unfurlers only
ever see the server-rendered defaults, which describe the whole site.

## Project structure

- `src/data/stations.ts` — the single source of truth for every mood station:
  Tulu/English names, description, colour theme, and playlist IDs. Never
  hardcode a playlist URL anywhere else. Two fields are optional, and both
  change how a station behaves rather than just how it looks:
  - The Spotify pair may be omitted for a mood that only exists on YouTube
    Music, which today is all of them. `hasSpotify` narrows the type and the
    player renders the YouTube body. `HAS_ANY_SPOTIFY` is what hides the
    provider switch entirely: with no Spotify playlist anywhere, a dimmed
    Spotify pill is a control that can only ever refuse the click. Adding one
    Spotify playlist to this file brings the switch back on its own.
  - `unlisted` keeps a station out of everything that publishes the catalogue:
    the JSON-LD graph, the meta copy, and the outbound "open the playlist"
    link. Nothing here sets it — these are community playlists, and linking
    back to the source is the right way to carry someone else's curation.
- `src/components/scene/` — the illustrated background, ambient motion and grain.
- `src/components/player/` — the floating glass player shell plus the
  Spotify/YouTube playback bodies and shared hooks.
- `src/hooks/` — `useYouTubePlayer`, `useSpotifyEmbed`, `useClock`,
  `usePersistedValue` (SSR-safe localStorage via `useSyncExternalStore`), and
  `usePrefersReducedMotion`.
- `public/images/scenes/` — one original illustration per mood, plus the mood
  picker's backdrop.

## Notes on playback

- **YouTube**: uses the official IFrame Player API with
  `listType=playlist&list=<id>`. Title, artist, duration and position come
  from `getVideoData()` / `getDuration()` / `getCurrentTime()`. Play, pause,
  next, previous and seeking are all wired to the real player.
- Autoplay only ever starts from a direct user gesture (the first-visit mood
  picker or the in-page controls), per browser autoplay policy.
- **Returning to a mood opens on a different song.** A playlist's length is only
  knowable once YouTube has loaded it, so the hook cues the playlist, waits for
  the ready/cued event, reads `getPlaylist()` and re-loads at a random index.
  Cueing rather than loading keeps that jump silent, and track metadata is
  withheld until it lands so the player never flashes track one. `playVideoAt()`
  looks like the obvious call here and is quietly ignored at that point in the
  lifecycle; `loadPlaylist({ index })` is what actually honours the index.
- **A blocked opening track does not kill the mood.** Community playlists carry
  videos whose owners disabled embedding, which surfaces as `ERROR 150` and an
  empty playlist if it happens on the first track. The hook retries at later
  indices and skips past unplayable tracks rather than showing a dead player.
- The Spotify path is retained but unreachable while no station carries a
  Spotify playlist. Spotify has Tulu compilations and albums but no mood
  playlists worth pointing at.

## Scene artwork

Four illustrated stills: one per mood, plus the mood picker's backdrop.

```bash
node --env-file=.env.local scripts/generate-scene-art.mjs   # stills (gpt-image-2)
python3 scripts/generate-brand-assets.py                    # favicons + Open Graph card
```

The art script prints what each image actually cost, read from the `usage` the
API returns rather than guessed from a pricing table. Two choices in there are
about money: `gpt-image-2` over `gpt-image-1`, which is both better and cheaper
at this aspect ratio and does not retire in October 2026; and a native 16:9
`2048x1152`, because the scene frame is 16:9 and generating 3:2 meant paying for
illustration that was then cropped away.

One diagnostic, which wants network throttling because none of these faults are
visible on a fast connection:

```bash
python3 scripts/scene-filmstrip.py <url>   # what paints first on a cold visit
```

Image models cannot spell Kannada script — they produce Kannada-shaped glyphs
that mean nothing — so the prompts ask for no signage and all real text is DOM
on top of the illustration.

The favicon and the Open Graph card are baked with headless Chromium for the
same reason: Kannada-script glyphs cannot be hand-written as SVG paths, and
generating them at runtime would mean shipping the font to the edge.
