"use client";

import { useClock } from "@/hooks/useClock";
import { useLiveListeners } from "@/hooks/useLiveListeners";
import { MIN_VISIBLE_LISTENERS } from "@/lib/presence";
import { HAS_ANY_SPOTIFY, type ProviderId } from "@/data/stations";
import { ProviderLogo } from "./ProviderLogo";

interface HeaderProps {
  activeProvider: ProviderId;
  /** False on a mood that has no Spotify playlist behind it. */
  isSpotifyAvailable: boolean;
  onProviderChange: (provider: ProviderId) => void;
}

export function Header({ activeProvider, isSpotifyAvailable, onProviderChange }: HeaderProps) {
  const { time, isReady } = useClock();
  const listeners = useLiveListeners();
  const showListeners = listeners >= MIN_VISIBLE_LISTENERS;

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-start justify-between gap-3 p-4 pt-[max(1rem,env(safe-area-inset-top))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:p-6 sm:pt-[max(1.5rem,env(safe-area-inset-top))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))]">
      <div className="pointer-events-auto text-shadow-soft">
        {/* The clock, the LIVE badge and the provider pills all centre on one
            46px band — the provider group's own height — so the top bar reads
            as a single row instead of three boxes sharing a top edge. */}
        <p
          className="flex h-[46px] items-center font-sans text-xl font-semibold tabular-nums text-amber-50 sm:text-2xl"
          suppressHydrationWarning
        >
          {isReady ? time : "\u2014\u2014"}
        </p>
        {/* The Kannada script rides high in its line box, so without the nudge
            this row crowds the clock above it. */}
        <p className="kn-optical -mt-2 font-kannada text-[11px] leading-tight text-amber-100/80 sm:text-xs">
          ಕುಡ್ಲ, ತುಳುನಾಡ್
        </p>
      </div>

      <div className="pointer-events-auto absolute left-1/2 top-[max(1rem,env(safe-area-inset-top))] flex h-[46px] -translate-x-1/2 items-center sm:top-[max(1.5rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/25 px-3 py-1.5 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-emerald-400" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[11px] font-semibold tracking-[0.18em] text-emerald-50/90">LIVE</span>
          {/* Only appears once the room is genuinely busy; see MIN_VISIBLE_LISTENERS. */}
          {showListeners && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-50/70">
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{listeners}</span>
              <span className="hidden sm:inline">listening</span>
              <span className="sr-only">people listening right now</span>
            </span>
          )}
        </div>
      </div>

      {HAS_ANY_SPOTIFY ? (
        <div
          className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/15 bg-black/25 p-1 backdrop-blur-sm"
          role="group"
          aria-label="Choose music provider"
        >
          {/* Dimmed rather than removed on a YouTube-only mood: a pill that
              vanishes and returns as the listener changes moods reads as a bug,
              and shifts the pills the LIVE badge is centred against. */}
          <button
            type="button"
            onClick={() => onProviderChange("spotify")}
            disabled={!isSpotifyAvailable}
            aria-pressed={activeProvider === "spotify"}
            aria-label={
              isSpotifyAvailable ? "Listen through Spotify" : "This mood is only on YouTube Music"
            }
            title={isSpotifyAvailable ? undefined : "This mood is only on YouTube Music"}
            className={`flex min-h-[36px] items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 ${
              activeProvider === "spotify"
                ? "bg-emerald-500 text-emerald-950"
                : "text-amber-50/70 enabled:hover:text-amber-50"
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            <ProviderLogo
              provider="spotify"
              tone={activeProvider === "spotify" ? "mono" : "brand"}
              className="h-4 w-4 shrink-0"
            />
            {/* Label drops on phones: with it, these pills grew wide enough to sit
                on top of the centred LIVE badge. The logo alone still identifies it. */}
            <span className="hidden sm:inline">Spotify</span>
          </button>
          <button
            type="button"
            onClick={() => onProviderChange("youtube")}
            aria-pressed={activeProvider === "youtube"}
            aria-label="Listen through YouTube Music"
            className={`flex min-h-[36px] items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 ${
              activeProvider === "youtube"
                ? "bg-red-500 text-red-50"
                : "text-amber-50/70 hover:text-amber-50"
            }`}
          >
            <ProviderLogo
              provider="youtube"
              tone={activeProvider === "youtube" ? "mono" : "brand"}
              className="h-4 w-4 shrink-0"
            />
            <span className="hidden sm:inline">YouTube Music</span>
          </button>
        </div>
      ) : (
        /* Nothing in the Tulu catalogue has a Spotify counterpart, so there is
           no choice to offer. This says where the music comes from without
           putting up a control that can only ever refuse the click. */
        <div className="pointer-events-none flex h-[46px] items-center">
          <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/25 px-3 py-1.5 backdrop-blur-sm">
            <ProviderLogo provider="youtube" tone="brand" className="h-4 w-4 shrink-0" />
            <span className="text-[11px] font-medium text-amber-50/75" lang="en">
              YouTube Music
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
