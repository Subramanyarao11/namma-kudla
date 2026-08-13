"use client";

import { useEffect, useState } from "react";

interface ClockValue {
  time: string;
  isReady: boolean;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Live 12-hour local time string, refreshed every minute (aligned to the minute boundary). */
export function useClock(): ClockValue {
  const [time, setTime] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      const now = new Date();
      setTime(formatTime(now));
      setIsReady(true);
      const msToNextMinute = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds());
      timeoutId = setTimeout(tick, msToNextMinute);
    };

    tick();
    return () => clearTimeout(timeoutId);
  }, []);

  return { time, isReady };
}
