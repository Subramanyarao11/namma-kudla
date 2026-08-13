#!/usr/bin/env python3
"""Render the favicon set and the Open Graph card.

Kannada-script glyphs cannot be drawn by hand as SVG paths and Satori-style
runtime generation would need the font shipped to the edge, so the artwork is
baked once here: headless Chromium lays out real Noto Sans Kannada, and the
results are committed as PNGs that Next.js picks up through its file
conventions.

    python3 scripts/generate-brand-assets.py

Writes:
    src/app/icon.png              favicon (512, downscaled by the browser)
    src/app/apple-icon.png        iOS home screen (180)
    src/app/favicon.ico           /favicon.ico for crawlers that still ask
    src/app/opengraph-image.png   1200x630 social card
    src/app/twitter-image.png     same card, separate convention
    public/icons/icon-{192,512}.png, icon-maskable-512.png   web app manifest
"""

from __future__ import annotations

import base64
import struct
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / ".tmp-text-overlays"
APP = ROOT / "src" / "app"
ICONS = ROOT / "public" / "icons"

KANNADA_TTF = CACHE / "NotoSansKannada.ttf"
KANNADA_URL = (
    "https://github.com/google/fonts/raw/main/ofl/notosanskannada/"
    "NotoSansKannada%5Bwdth%2Cwght%5D.ttf"
)
INTER_TTF = CACHE / "Inter.ttf"
INTER_URL = "https://github.com/google/fonts/raw/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf"

BACKDROP = ROOT / "public" / "images" / "scenes" / "tulunad-porlu.png"

NAME_KN = "ನಮ್ಮ ಕುಡ್ಲ"
NAME_LATIN = "Namma Kudla"
TAGLINE_KN = "ಒಂಜೊಂಜಿ ಮೂಡ್‌ಗ್ ಒಂಜಿ ಪಾಟ್"
MOODS = [
    "ತುಳುನಾಡ್ ಪೊರ್ಲು",
    "ದೈವದ ನೇಮ",
    "ಯಕ್ಷಗಾನ ರಾತ್ರೆ",
]
PROVIDERS = "YouTube Music"

INK = "#fffaf0"
AMBER = "#efa637"
WARM = "#ffd9a0"
DEEP = "#0d2a30"

# A bare bicolour tile: sun gold over sea teal, the two colours the coast scene
# is built from. Same reasoning as any small mark — a letter only survives down
# to about 32px, while two fields of colour stay legible at tab size. It also
# has to be told apart from the sibling site's favicon at a glance, which rules
# out reusing the Karnataka flag that one uses.
SUN_GOLD = "#efa637"
SEA_TEAL = "#1e6f73"
GOLD_SHARE = 0.5


def cached_font(path: Path, url: str) -> str:
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        print(f"fetching {path.name}")
        with urllib.request.urlopen(url) as response:
            path.write_bytes(response.read())
    return base64.b64encode(path.read_bytes()).decode()


def face(family: str, b64: str) -> str:
    return (
        f"@font-face{{font-family:'{family}';"
        f"src:url(data:font/ttf;base64,{b64}) format('truetype');"
        "font-weight:100 900;font-style:normal;font-display:block}"
    )


def og_html(fonts: str, backdrop_b64: str) -> str:
    chips = "".join(
        f'<span class="chip">{mood}</span>' for mood in MOODS
    )
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
{fonts}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1200px;height:630px;overflow:hidden;background:{DEEP};position:relative;
  font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased}}
.art{{position:absolute;inset:0;background-image:url(data:image/png;base64,{backdrop_b64});
  background-size:cover;background-position:62% 45%}}
/* Near-neutral rather than the site's teal. A blue-green scrim over a golden
   sunset mixes to olive, which drained the warmth out of the whole right-hand
   side of the card; this keeps the left dark enough to carry the type and lets
   the sun read as the sun. */
.scrim{{position:absolute;inset:0;background:
  linear-gradient(100deg, rgba(7,12,14,0.95) 0%, rgba(8,13,15,0.84) 40%, rgba(9,14,16,0.26) 74%, rgba(10,15,17,0.1) 100%)}}
.vignette{{position:absolute;inset:0;background:
  radial-gradient(120% 90% at 30% 45%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)}}
.wrap{{position:absolute;inset:0;padding:70px 76px;display:flex;flex-direction:column;justify-content:space-between}}
.eyebrow{{font-size:23px;font-weight:600;letter-spacing:0.42em;text-transform:uppercase;
  color:{WARM};opacity:0.82}}
.name{{font-family:'NotoKannada',sans-serif;font-size:104px;font-weight:700;color:{INK};
  line-height:1.14;letter-spacing:-0.01em;margin-top:14px;
  text-shadow:0 3px 6px rgba(0,0,0,0.5),0 14px 44px rgba(0,0,0,0.55)}}
.rule{{width:96px;height:4px;border-radius:4px;background:{AMBER};margin:26px 0 22px;opacity:0.9}}
.tagline{{font-family:'NotoKannada',sans-serif;font-size:35px;font-weight:500;color:#ffe9bc;
  line-height:1.5;text-shadow:0 2px 5px rgba(0,0,0,0.6)}}
.chips{{display:flex;flex-wrap:wrap;gap:11px;margin-bottom:26px}}
/* Asymmetric padding is the optical correction, not a typo. Even padding
   leaves the words riding high, because Kannada's base consonants sit above
   the centre of their line box; the extra 4px on top drops that band onto
   the pill's midline. Centring the ink box instead would look wrong — it
   weighs the tall vowel signs and deep subscripts as if the eye read them
   as part of the body, and it does not. */
.chip{{font-family:'NotoKannada',sans-serif;font-size:21px;font-weight:500;color:#ffeccc;
  padding:13px 18px 9px;border-radius:999px;border:1px solid rgba(255,226,180,0.28);
  background:rgba(7,24,28,0.5);line-height:1}}
.providers{{font-size:22px;font-weight:600;color:{WARM};opacity:0.85;letter-spacing:0.02em}}
.live{{position:absolute;top:70px;right:76px;display:flex;align-items:center;gap:10px;
  padding:11px 20px;border-radius:999px;border:1px solid rgba(255,255,255,0.22);
  background:rgba(5,20,24,0.55)}}
.dot{{width:11px;height:11px;border-radius:999px;background:#4ade80;
  box-shadow:0 0 0 5px rgba(74,222,128,0.22)}}
.live span{{font-size:17px;font-weight:700;letter-spacing:0.2em;color:#e9fff1}}
</style></head><body>
<div class="art"></div><div class="scrim"></div><div class="vignette"></div>
<div class="live"><i class="dot"></i><span>LIVE</span></div>
<div class="wrap">
  <div>
    <div class="eyebrow">{NAME_LATIN}</div>
    <div class="name">{NAME_KN}</div>
    <div class="rule"></div>
    <div class="tagline">{TAGLINE_KN}</div>
  </div>
  <div>
    <div class="chips">{chips}</div>
    <div class="providers">{PROVIDERS}</div>
  </div>
</div></body></html>"""


def icon_html(fonts: str, size: int, maskable: bool) -> str:
    # Maskable icons get cropped to a circle by Android, so the tile bleeds to
    # the edges without a corner radius. The bicolour survives the crop either way.
    radius = 0 if maskable else round(size * 0.22)
    field = size * GOLD_SHARE
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
{fonts}
*{{margin:0;padding:0}}
body{{width:{size}px;height:{size}px;overflow:hidden;background:transparent}}
.tile{{width:{size}px;height:{size}px;border-radius:{radius}px;position:relative;overflow:hidden}}
.gold{{position:absolute;left:0;right:0;top:0;height:{field}px;
  background:linear-gradient(180deg,#ffc85e 0%,{SUN_GOLD} 100%)}}
.teal{{position:absolute;left:0;right:0;top:{field}px;bottom:0;
  background:linear-gradient(180deg,{SEA_TEAL} 0%,#0d3f43 100%)}}
</style></head><body><div class="tile">
<div class="gold"></div><div class="teal"></div>
</div></body></html>"""


def png_to_ico(png: bytes, size: int) -> bytes:
    """Wrap a PNG in an ICO container (PNG-in-ICO, universally supported now)."""
    dim = 0 if size >= 256 else size
    header = struct.pack("<HHH", 0, 1, 1)
    entry = struct.pack("<BBBBHHII", dim, dim, 0, 0, 1, 32, len(png), 6 + 16)
    return header + entry + png


def main() -> None:
    APP.mkdir(parents=True, exist_ok=True)
    ICONS.mkdir(parents=True, exist_ok=True)

    fonts = face("NotoKannada", cached_font(KANNADA_TTF, KANNADA_URL))
    fonts += face("Inter", cached_font(INTER_TTF, INTER_URL))
    backdrop = base64.b64encode(BACKDROP.read_bytes()).decode()

    with sync_playwright() as p:
        browser = p.chromium.launch()

        page = browser.new_page(viewport={"width": 1200, "height": 630}, device_scale_factor=1)
        page.set_content(og_html(fonts, backdrop), wait_until="load")
        page.wait_for_timeout(600)
        card = page.screenshot(type="png")
        (APP / "opengraph-image.png").write_bytes(card)
        (APP / "twitter-image.png").write_bytes(card)
        page.close()

        targets = [
            (APP / "icon.png", 512, False),
            (APP / "apple-icon.png", 180, False),
            (ICONS / "icon-192.png", 192, False),
            (ICONS / "icon-512.png", 512, False),
            (ICONS / "icon-maskable-512.png", 512, True),
        ]
        for path, size, maskable in targets:
            page = browser.new_page(viewport={"width": size, "height": size}, device_scale_factor=1)
            page.set_content(icon_html(fonts, size, maskable), wait_until="load")
            page.wait_for_timeout(250)
            path.write_bytes(page.screenshot(type="png", omit_background=True))
            page.close()
            print(f"wrote {path.relative_to(ROOT)} ({size}px)")

        page = browser.new_page(viewport={"width": 48, "height": 48}, device_scale_factor=1)
        page.set_content(icon_html(fonts, 48, False), wait_until="load")
        page.wait_for_timeout(250)
        # Must be RGBA: the ICO decoder rejects a PNG without an alpha channel,
        # and the rounded corners need to be transparent anyway.
        (APP / "favicon.ico").write_bytes(png_to_ico(page.screenshot(type="png", omit_background=True), 48))
        page.close()

        browser.close()

    print("wrote src/app/opengraph-image.png + twitter-image.png (1200x630)")
    print("wrote src/app/favicon.ico (48px)")


if __name__ == "__main__":
    main()
