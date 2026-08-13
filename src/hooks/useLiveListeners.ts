"use client";

import { useEffect, useState } from "react";
import { HEARTBEAT_MS } from "@/lib/presence";

/**
 * How many people are listening right now, or 0 when that is unknown.
 *
 * Returns 0 both before the first check-in and whenever presence isn't
 * configured, so the caller has one simple rule: no number, no badge. Nothing
 * here ever guesses — an invented listener count would be a lie told to every
 * visitor, so the honest fallback is silence.
 */
export function useLiveListeners(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;

    const beat = async () => {
      try {
        const response = await fetch("/api/presence", { method: "POST" });
        if (!response.ok) return;
        const data: { configured?: boolean; count?: number } = await response.json();
        if (active && data.configured) setCount(data.count ?? 0);
      } catch {
        // Offline or the route is down. Keep the last known number rather than
        // flashing the badge away on one failed request.
      }
    };

    void beat();
    const timer = window.setInterval(beat, HEARTBEAT_MS);

    // A backgrounded tab gets its timers throttled, so its check-ins can lapse
    // and the number goes stale. Refresh the moment it is looked at again.
    const onVisibility = () => {
      if (!document.hidden) void beat();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return count;
}
