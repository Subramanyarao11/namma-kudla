"use client";

import { useEffect } from "react";
import type { ProviderId } from "@/data/stations";

/**
 * Client half of the aggregate statistics.
 *
 * Sends two things and nothing else: that a session started, and that a mood
 * was started. It deliberately reports nothing *about* the visitor — no screen
 * size, no timezone, no stored id — because everything worth counting is
 * already on the request the server receives anyway, and anything extra sent
 * from here would only be a fingerprint the server did not ask for.
 */

/** Session-scoped, so a reload during one sitting is not a second visit. */
const VISIT_FLAG = "nbr:visit-counted";

function send(event: Record<string, unknown>): void {
  // keepalive: a mood is often picked immediately before the tab is closed or
  // navigated away from, and without it the browser cancels the request.
  void fetch("/api/stats", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(event),
    keepalive: true,
  }).catch(() => {
    // A dropped counter is not worth surfacing, or retrying.
  });
}

/** Counts this session once, on mount. */
export function useVisitOnce(): void {
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(VISIT_FLAG)) return;
      window.sessionStorage.setItem(VISIT_FLAG, "1");
    } catch {
      // Private mode or a full quota. Counting the visit twice is a better
      // failure than dropping every visit from browsers that refuse storage.
    }
    send({ type: "visit" });
  }, []);
}

export function recordPlay(stationId: string, provider: ProviderId): void {
  send({ type: "play", stationId, provider });
}
