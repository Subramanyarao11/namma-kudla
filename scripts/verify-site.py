#!/usr/bin/env python3
"""Screenshot the running site at the sizes that matter, and report console noise.

    python3 scripts/verify-site.py http://localhost:3188

Walks the first-visit picker, each mood, and the mood-change sheet, on desktop
and on a phone. Console errors are collected rather than ignored: a hydration
mismatch or a failed asset is invisible in a screenshot.
"""

from __future__ import annotations

import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3188"
OUT = Path(__file__).resolve().parent.parent / "tmp" / "verify"
OUT.mkdir(parents=True, exist_ok=True)

VIEWPORTS = [("desktop", 1440, 900), ("phone", 390, 844)]
MOODS = ["ತುಳುನಾಡ್‌ದ ಪೊರ್ಲು", "ದೈವದ ನೇಮ", "ಯಕ್ಷಗಾನ ರಾತ್ರೆ"]


def main() -> None:
    problems: list[str] = []

    with sync_playwright() as p:
        browser = p.chromium.launch()
        for label, width, height in VIEWPORTS:
            page = browser.new_page(viewport={"width": width, "height": height})
            page.on(
                "console",
                lambda msg: problems.append(f"[{label}] console.{msg.type}: {msg.text}")
                if msg.type in ("error", "warning")
                else None,
            )
            page.on("pageerror", lambda err: problems.append(f"[{label}] pageerror: {err}"))

            page.goto(URL, wait_until="networkidle")
            page.wait_for_timeout(2500)
            page.screenshot(path=OUT / f"{label}-1-picker.png")

            title = page.title()
            print(f"[{label}] title on entry: {title}")

            # Enter on the first mood, then walk the rest through the sheet.
            page.get_by_role("button", name=MOODS[0], exact=False).first.click()
            page.wait_for_timeout(3000)
            page.screenshot(path=OUT / f"{label}-2-{MOODS[0]}.png")
            print(f"[{label}] title after entering: {page.title()}")

            for index, mood in enumerate(MOODS[1:], start=3):
                page.get_by_role("button", name="ಬೇತೆ ಮೂಡ್", exact=False).first.click()
                page.wait_for_timeout(900)
                if index == 3:
                    page.screenshot(path=OUT / f"{label}-sheet.png")
                page.get_by_role("button", name=mood, exact=False).first.click()
                page.wait_for_timeout(3000)
                page.screenshot(path=OUT / f"{label}-{index}-{mood}.png")
                print(f"[{label}] title on {mood}: {page.title()}")

            page.close()
        browser.close()

    print(f"\nscreenshots -> {OUT}")
    if problems:
        print(f"\n{len(problems)} console problem(s):")
        for problem in dict.fromkeys(problems):
            print(f"  {problem}")
    else:
        print("\nno console errors or warnings")


if __name__ == "__main__":
    main()
