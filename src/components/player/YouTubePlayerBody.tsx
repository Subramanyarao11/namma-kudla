"use client";

import { useEffect } from "react";
import type { Station } from "@/data/stations";
import { getYoutubeMusicUrl } from "@/data/stations";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";
import { PlaybackProgress } from "./PlaybackProgress";
import { ExternalLinkIcon, NextIcon, PauseIcon, PlayIcon, PreviousIcon, SpinnerIcon } from "./TransportIcons";
import type { PlaybackControls } from "@/lib/playback-types";

interface YouTubePlayerBodyProps {
  station: Station;
  autoplayOnLoad: boolean;
  onControlsReady: (controls: PlaybackControls) => void;
}

export function YouTubePlayerBody({ station, autoplayOnLoad, onControlsReady }: YouTubePlayerBodyProps) {
  const { containerRef, state, controls } = useYouTubePlayer({
    playlistId: station.youtubePlaylistId,
    enabled: true,
    autoplayOnLoad,
  });

  useEffect(() => {
    onControlsReady(controls);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controls]);

  const isPlaying = state.status === "playing";
  const isLoading = state.status === "loading" || state.status === "idle";
  const hasTrack = Boolean(state.title);
  const accent = station.theme.accent;

  return (
    <div className="flex w-full flex-col gap-2.5">
      <div className="flex items-center gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/50 sm:h-16 sm:w-16">
          <div ref={containerRef} className="h-full w-full [&>iframe]:h-full [&>iframe]:w-full" />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <SpinnerIcon className="h-5 w-5 text-amber-100/70" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {state.status === "error" ? (
            <>
              <p className="truncate text-sm font-semibold text-amber-50">{station.nameEnglish}</p>
              <p className="truncate text-xs text-red-300/80">{state.errorMessage}</p>
            </>
          ) : hasTrack ? (
            <>
              <p className="truncate text-sm font-semibold text-amber-50">{state.title}</p>
              <p className="truncate text-xs text-amber-100/60">{state.artist || station.nameEnglish}</p>
            </>
          ) : (
            <>
              <div className="h-3.5 w-3/4 animate-pulse rounded bg-white/10" />
              <div className="mt-1.5 h-3 w-1/2 animate-pulse rounded bg-white/10" />
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={controls.previous}
            disabled={!state.canSkipPrevious}
            aria-label="Previous track"
            className="flex h-9 w-9 items-center justify-center rounded-full text-amber-50/80 transition-colors hover:bg-white/10 disabled:opacity-30"
          >
            <PreviousIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={controls.togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="flex h-11 w-11 items-center justify-center rounded-full text-[#140d0a] shadow-lg transition-transform active:scale-95"
            style={{ backgroundColor: accent }}
          >
            {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="ml-0.5 h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={controls.next}
            disabled={!state.canSkipNext}
            aria-label="Next track"
            className="flex h-9 w-9 items-center justify-center rounded-full text-amber-50/80 transition-colors hover:bg-white/10 disabled:opacity-30"
          >
            <NextIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <PlaybackProgress
          positionSeconds={state.positionSeconds}
          durationSeconds={state.durationSeconds}
          accent={accent}
          onSeek={controls.seek}
          interactive={state.durationSeconds > 0}
        />
        {/* An unlisted mood plays in place only — see Station.unlisted. The bar
            simply takes the freed width. */}
        {!station.unlisted && (
          <a
            href={getYoutubeMusicUrl(station)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] font-medium text-amber-100/70 transition-colors hover:text-amber-50"
          >
            YouTube Music
            <ExternalLinkIcon className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
