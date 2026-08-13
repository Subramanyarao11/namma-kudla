/**
 * Generates the illustrated scene art for every mood, in a flat gouache /
 * screen-print style rather than photorealism — the look that makes a site like
 * this feel like a designed world instead of stock footage.
 *
 * Two deliberate choices here, both about money:
 *
 *   - gpt-image-2, not gpt-image-1. It is the current model, it is cheaper at
 *     this aspect ratio ($0.165 vs $0.250 for a high-quality landscape), and
 *     gpt-image-1 retires on 23 October 2026.
 *   - 2048x1152 native 16:9. The scene frame is 16:9, so generating 3:2 and
 *     cropping meant paying for ~160px of illustration and then throwing it
 *     away.
 *
 * There is no video pipeline on this site. Motion comes from the CSS ambient
 * layer, the slow scene drift and the grain, which together cost nothing.
 *
 * Usage:
 *   node --env-file=.env.local scripts/generate-scene-art.mjs [--only=daivada-nema] [--quality=high|medium]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error("Missing OPENAI_API_KEY. Run with: node --env-file=.env.local scripts/generate-scene-art.mjs");
  process.exit(1);
}

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public/images/scenes");
mkdirSync(OUT_DIR, { recursive: true });

const MODEL = "gpt-image-2";
const SIZE = "2048x1152";
/** gpt-image-2 image output tokens, for turning usage into an actual figure. */
const USD_PER_OUTPUT_TOKEN = 30 / 1_000_000;

/**
 * One shared style contract so all four scenes read as one illustrated world.
 * Deliberately flat and painterly: bold colour planes, minimal gradients, a
 * faint paper tooth — no photorealism, no 3D render sheen, no neon glow.
 */
const STYLE = [
  "Flat gouache poster illustration, hand-painted Indian screen-print aesthetic.",
  "Bold flat planes of colour with crisp shape edges, minimal soft gradients, subtle visible paper grain texture.",
  "Confident simplified geometry, slightly stylised proportions, no photorealism, no 3D render look, no glossy highlights, no lens flare, no neon glow.",
  "Cinematic wide composition with clear depth layers: strong foreground silhouette, readable midground subject, simplified background skyline.",
  "Muted sophisticated palette, painterly light, generous negative space in the upper third for overlaid text.",
  // Image models produce Kannada-shaped glyphs that spell nothing, so every
  // real word on this site is DOM drawn on top of the illustration.
  "No lettering, no signage, no shop boards, no written text of any kind anywhere in the image.",
].join(" ");

/**
 * The ritual scenes are deliberately unpeopled. Bhoota Kola and Yakshagana are
 * living practice, not set dressing: the daiva and the performers are not ours
 * to render, and a generated approximation of either would be both wrong and
 * disrespectful. So we paint the place a moment before it begins — the
 * torchlight, the drums, the empty stage — which is also the part a listener is
 * standing in.
 */
const SCENES = [
  {
    name: "tulunad-porlu",
    prompt:
      "A coastal road in Tulu Nadu at golden hour, somewhere north of Mangaluru. Foreground right: a low laterite-stone parapet, and behind it a single house with a red Mangalore-tiled roof catching the last of the sun. Midground: a narrow tarmac road curving along the shore, three coconut palms leaning seaward, two wooden outrigger fishing boats drawn up on the sand. Background: the wide calm Arabian Sea with a low sun near the horizon and a distant headland. Palette: warm gold and terracotta against deep teal water, with cool blue-green shadows.",
  },
  {
    name: "daivada-nema",
    prompt:
      "A torchlit clearing in a coconut grove in coastal Karnataka late at night, prepared for a village ritual, with no people anywhere in the frame. Foreground: two tall bamboo torches burning, and a row of small clay oil lamps set along the packed red earth. Midground: a simple open thatched pavilion hung with fresh mango-leaf garlands and marigold, and a large cylindrical chende drum resting on a woven mat with its two sticks beside it. Background: dense dark coconut palms against a deep night sky. Palette: deep forest green and near-black, lit only by warm orange firelight and pools of amber lamplight.",
  },
  {
    name: "yakshagana-ratri",
    prompt:
      "An open-air Yakshagana stage in a harvested field at night, seen from the back of the audience, before the performance begins. Midground centre: a raised wooden stage under a strung canvas canopy, lit by warm hanging lamps, with a painted backdrop curtain and a chende and maddale drum set resting at its edge. The stage is empty. Foreground: the dark silhouetted backs of a seated audience on mats and plastic chairs, a few small lights among them. Background: silhouetted coconut palms and a deep indigo starry sky. Palette: deep indigo and violet night, warm gold stage light, a single crimson accent in the stage curtain.",
  },
  {
    name: "mood-selector",
    prompt:
      "A vintage wooden valve radio on a windowsill at night, seen in intimate three-quarter close-up. Its amber-lit tuning dial with printed frequency numbers and a slim red needle glows warmly, brass knobs catch the light, a woven speaker grille sits alongside. Through the window behind, an out-of-focus coastal night: scattered warm window lights, the silhouettes of coconut palms, and a dark sea horizon. A steel tumbler stands beside the radio. Palette: deep near-black teal background with rich amber and brass warmth, one muted sea-green accent.",
  },
];

const qualityArg = process.argv.find((a) => a.startsWith("--quality="));
const quality = qualityArg ? qualityArg.slice("--quality=".length) : "high";

const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const only = onlyArg ? onlyArg.slice("--only=".length).split(",") : null;
const selected = only ? SCENES.filter((s) => only.includes(s.name)) : SCENES;

async function generate(scene) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      prompt: `${STYLE}\n\nScene: ${scene.prompt}`,
      size: SIZE,
      quality,
      n: 1,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(data).slice(0, 400)}`);

  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error(`no image payload: ${JSON.stringify(data).slice(0, 300)}`);

  const outPath = path.join(OUT_DIR, `${scene.name}.png`);
  const buf = Buffer.from(b64, "base64");
  writeFileSync(outPath, buf);

  // Billed on output tokens, so the response can tell us what this actually
  // cost rather than us guessing from a pricing table.
  const outputTokens = data.usage?.output_tokens ?? 0;
  const usd = outputTokens * USD_PER_OUTPUT_TOKEN;
  console.log(
    `[${scene.name}] saved ${(buf.length / 1e6).toFixed(2)} MB · ${outputTokens} output tokens · $${usd.toFixed(4)}`,
  );
  return usd;
}

const results = await Promise.all(
  selected.map(async (scene, i) => {
    await new Promise((r) => setTimeout(r, i * 400));
    try {
      console.log(`[${scene.name}] generating ${SIZE} ${quality} art...`);
      const usd = await generate(scene);
      return { name: scene.name, ok: true, usd };
    } catch (err) {
      console.error(`[${scene.name}] ERROR: ${err.message}`);
      return { name: scene.name, ok: false, usd: 0, error: err.message };
    }
  }),
);

console.log("\n=== Summary ===");
for (const r of results) console.log(`${r.ok ? "OK  " : "FAIL"} ${r.name}${r.error ? " - " + r.error : ""}`);
const total = results.reduce((sum, r) => sum + r.usd, 0);
console.log(`\nSpent this run: $${total.toFixed(4)} (${MODEL}, ${SIZE}, ${quality})`);
process.exit(results.some((r) => !r.ok) ? 1 : 0);
