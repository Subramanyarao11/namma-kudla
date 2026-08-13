"use client";

import { useEffect } from "react";
import type { SpotifyStation } from "@/data/stations";
import { useSpotifyEmbed } from "@/hooks/useSpotifyEmbed";
import { ExternalLinkIcon, PauseIcon, PlayIcon, SpinnerIcon } from "./TransportIcons";
import { PlaybackProgress } from "./PlaybackProgress";
import type { PlaybackControls } from "@/lib/playback-types";

interface SpotifyPlayerBodyProps {
  station: SpotifyStation;
  onControlsReady: (controls: PlaybackControls) => void;
}

export function SpotifyPlayerBody({ station, onControlsReady }: SpotifyPlayerBodyProps) {
  const { containerRef, state, controls } = useSpotifyEmbed({
    playlistId: station.spotifyPlaylistId,
    enabled: true,
  });

  useEffect(() => {
    onControlsReady(controls);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controls]);

  const isPlaying = state.status === "playing";
  const isLoading = state.status === "loading" || state.status === "idle";
  const accent = station.theme.accent;
  const hasTimeline = state.durationSeconds > 0;

  /**
   * Spotify serves 30-second previews to anyone the embed cannot see a Premium
   * session for, and hands over full tracks only once the visitor is signed in
   * to Premium in this browser. There is no parameter that lifts that; the only
   * alternative is asking every listener to log in through OAuth. So the limit
   * gets explained rather than hidden, since a song stopping dead at 0:30
   * otherwise reads as our bug.
   */
  const isPreview = state.durationSeconds > 0 && state.durationSeconds <= 31;

  return (
    <div className="flex w-full flex-col gap-2.5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={controls.togglePlay}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#140d0a] shadow-lg transition-transform active:scale-95"
          style={{ backgroundColor: accent }}
        >
          {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="ml-0.5 h-5 w-5" />}
        </button>

        <div className="relative min-h-[80px] flex-1 overflow-hidden rounded-xl bg-black/30">
          <div ref={containerRef} className="w-full [&_iframe]:rounded-xl" />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <SpinnerIcon className="h-5 w-5 text-amber-100/70" />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Spotify only reports a position for playlists once something is
            actually playing. Rendering the bar before then would just show a
            dead "0:00 / 0:00", so the track hint takes that space instead. */}
        {hasTimeline ? (
          <PlaybackProgress
            positionSeconds={state.positionSeconds}
            durationSeconds={state.durationSeconds}
            accent={accent}
            interactive={false}
          />
        ) : (
          <p className="min-w-0 flex-1 truncate text-[11px] text-amber-100/45">Pick any track from the list above</p>
        )}
        <a
          href={station.spotifyPlaylistUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] font-medium text-amber-100/70 transition-colors hover:text-amber-50"
        >
          Open in Spotify
          <ExternalLinkIcon className="h-3 w-3" />
        </a>
      </div>

      <p className="text-[10.5px] leading-snug text-amber-100/40">
        {isPreview
          ? "Spotify is giving 30-second previews. Sign in to Spotify Premium in this browser, or switch to YouTube Music above, for full songs."
          : "Full songs on Spotify need a Premium session in this browser \u2014 otherwise it plays 30-second previews. YouTube Music plays them in full."}
      </p>
    </div>
  );
}
