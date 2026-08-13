#!/usr/bin/env python3
"""Film the first seconds of a cold visit, so background load order is a
measurement rather than a guess: which scene paints first, and what replaces it.

Throttled to a realistic mobile connection, where an ordering bug that is
invisible on a laptop stretches into seconds.

Usage: python3 scripts/scene-filmstrip.py <url> [out_dir]
"""

from __future__ import annotations

import glob
import os
import shutil
import sys
import time
from urllib.parse import unquote

from playwright.sync_api import sync_playwright

FRAMES = 24
INTERVAL_MS = 400


def chromium_path() -> str:
    for pattern in (
        "~/.cache/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-mac-*/chrome-headless-shell",
        "~/.cache/ms-playwright/chromium-*/chrome-mac/Chromium.app/Contents/MacOS/Chromium",
    ):
        hits = glob.glob(os.path.expanduser(pattern))
        if hits:
            return sorted(hits)[-1]
    sys.exit("Chromium missing. Run: python3 -m playwright install chromium")


def label(url: str) -> str:
    text = unquote(url)
    for marker in ("scenes/", "/videos/", "/images/"):
        if marker in text:
            tail = text.split("scenes/")[-1] if "scenes/" in text else text
            return "scenes/" + tail.split("&")[0].split("?")[0] if "scenes/" in text else tail
    return text[:80]


def interesting(url: str) -> bool:
    return "/_next/image" in url or "/videos/" in url or "/images/" in url


def main() -> None:
    url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
    out_dir = sys.argv[2] if len(sys.argv) > 2 else "tmp/filmstrip"

    shutil.rmtree(out_dir, ignore_errors=True)
    os.makedirs(out_dir, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=chromium_path())
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        session = context.new_cdp_session(page)
        session.send("Network.enable")
        session.send(
            "Network.emulateNetworkConditions",
            {
                "offline": False,
                "latency": 300,
                "downloadThroughput": int(1.2 * 1024 * 1024 / 8),  # ~1.2 Mbps
                "uploadThroughput": int(1024 * 1024 / 8),
            },
        )

        started = time.monotonic()
        events: list[tuple[int, str, str]] = []

        def stamp() -> int:
            return int((time.monotonic() - started) * 1000)

        page.on(
            "request",
            lambda r: events.append((stamp(), "start", label(r.url))) if interesting(r.url) else None,
        )
        page.on(
            "response",
            lambda r: events.append((stamp(), "done ", label(r.url))) if interesting(r.url) else None,
        )

        page.goto(url, wait_until="commit")

        for i in range(FRAMES):
            page.screenshot(path=f"{out_dir}/{i:02d}-{i * INTERVAL_MS}ms.png")
            page.wait_for_timeout(INTERVAL_MS)

        print("--- network timeline (ms since navigation) ---")
        for at, phase, what in events:
            print(f"{at:6d}  {phase}  {what}")

        browser.close()


if __name__ == "__main__":
    main()
