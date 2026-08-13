"use client";

import { useCallback, useEffect, useRef } from "react";
import { hasSpotify, type ProviderId, type Station } from "@/data/stations";
import type { PlaybackControls } from "@/lib/playback-types";
import { ProviderLogo } from "../ProviderLogo";
import { SpotifyPlayerBody } from "./SpotifyPlayerBody";
import { YouTubePlayerBody } from "./YouTubePlayerBody";

interface PlayerProps {
  station: Station;
  provider: ProviderId;
  onOpenSelector: () => void;
  isSelectorOpen: boolean;
}

export function Player({ station, provider, onOpenSelector, isSelectorOpen }: PlayerProps) {
  const controlsRef = useRef<PlaybackControls | null>(null);

  const handleControlsReady = useCallback((controls: PlaybackControls) => {
    controlsRef.current = controls;
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      const active = document.activeElement;
      const isInteractiveElement =
        active instanceof HTMLElement &&
        (active.tagName === "BUTTON" ||
          active.tagName === "A" ||
          active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.isContentEditable ||
          active.getAttribute("role") === "slider");
      if (isInteractiveElement || isSelectorOpen) return;
      event.preventDefault();
      controlsRef.current?.togglePlay();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSelectorOpen]);

  // The bar spans the viewport to centre the pill, so it must not capture
  // clicks in its transparent margins — the footer credit sits under one.
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-0 sm:pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div
        className="glass-panel animate-player-enter pointer-events-auto w-full max-w-[680px] rounded-[26px] p-3.5 sm:p-4"
        role="region"
        aria-label="Music player"
      >
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: station.theme.accent }}
              aria-hidden="true"
            />
            <span className="font-kannada kn-optical truncate text-xs font-medium text-amber-100/85 sm:text-sm">
              {station.nameTulu}
            </span>
            <span className="ml-1 flex shrink-0 items-center gap-1 rounded-full border border-white/12 pl-1 pr-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-amber-100/60">
              <ProviderLogo provider={provider} className="h-3 w-3" />
              {provider === "spotify" ? "Spotify" : "YouTube"}
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenSelector}
            aria-haspopup="dialog"
            aria-expanded={isSelectorOpen}
            className="flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-amber-50/85 transition-colors hover:bg-white/10 sm:text-xs"
          >
            {/* REVIEW (Tulu): intended as "change mood". */}
            <span className="font-kannada kn-optical">ಮೂಡ್ ಬದಲ್</span>
            <svg viewBox="0 0 12 8" className="h-2 w-2.5" fill="none" aria-hidden="true">
              <path d="M1 1.5l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {provider === "spotify" && hasSpotify(station) ? (
          <SpotifyPlayerBody key={`spotify-${station.id}`} station={station} onControlsReady={handleControlsReady} />
        ) : (
          <YouTubePlayerBody
            key={`youtube-${station.id}`}
            station={station}
            autoplayOnLoad
            onControlsReady={handleControlsReady}
          />
        )}
      </div>
    </div>
  );
}
