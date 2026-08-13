"use client";

import { formatTime } from "@/lib/format-time";

interface PlaybackProgressProps {
  positionSeconds: number;
  durationSeconds: number;
  accent: string;
  onSeek?: (seconds: number) => void;
  interactive: boolean;
}

export function PlaybackProgress({
  positionSeconds,
  durationSeconds,
  accent,
  onSeek,
  interactive,
}: PlaybackProgressProps) {
  const ratio = durationSeconds > 0 ? Math.min(1, positionSeconds / durationSeconds) : 0;

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !onSeek || durationSeconds <= 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const clickRatio = (event.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(1, clickRatio)) * durationSeconds);
  };

  return (
    <div className="flex w-full items-center gap-2">
      <span className="w-9 shrink-0 text-right text-[10px] tabular-nums text-amber-100/55">
        {formatTime(positionSeconds)}
      </span>
      <div
        role={interactive ? "slider" : undefined}
        aria-label={interactive ? "Seek playback position" : undefined}
        aria-valuemin={interactive ? 0 : undefined}
        aria-valuemax={interactive ? Math.round(durationSeconds) : undefined}
        aria-valuenow={interactive ? Math.round(positionSeconds) : undefined}
        tabIndex={interactive ? 0 : -1}
        onClick={handleClick}
        onKeyDown={(event) => {
          if (!interactive || !onSeek) return;
          if (event.key === "ArrowRight") onSeek(Math.min(durationSeconds, positionSeconds + 5));
          if (event.key === "ArrowLeft") onSeek(Math.max(0, positionSeconds - 5));
        }}
        className={`relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/12 ${
          interactive ? "cursor-pointer" : ""
        }`}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-200"
          style={{ width: `${ratio * 100}%`, backgroundColor: accent }}
        />
      </div>
      <span className="w-9 shrink-0 text-[10px] tabular-nums text-amber-100/55">
        {formatTime(durationSeconds)}
      </span>
    </div>
  );
}
