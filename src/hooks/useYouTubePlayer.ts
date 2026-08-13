"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PlaybackControls, PlaybackState } from "@/lib/playback-types";
import { IDLE_PLAYBACK_STATE } from "@/lib/playback-types";

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<void> | null = null;

/** The player throws rather than returning empty until it is fully wired up. */
function readPlaylist(player: YT.Player | null): string[] {
  try {
    const list = player?.getPlaylist?.();
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** Loads the official YouTube IFrame Player API script exactly once per page. */
function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      resolve();
    };

    if (document.querySelector('script[data-yt-iframe-api="true"]')) return;
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.dataset.ytIframeApi = "true";
    document.head.appendChild(script);
  });

  return youtubeApiPromise;
}

interface UseYouTubePlayerOptions {
  playlistId: string;
  /** Only creates/loads the player once true — used to lazy-load the embed. */
  enabled: boolean;
  /** Whether playback should begin as soon as the player/playlist is ready. */
  autoplayOnLoad: boolean;
}

interface UseYouTubePlayerResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  state: PlaybackState;
  controls: PlaybackControls;
}

/**
 * How far into a playlist we will look for a track that is allowed to play in an
 * embed before giving up, and how many unplayable tracks we will step over once
 * playback is under way. Curated playlists routinely contain a few uploads the
 * rights holder has blocked from embedding; a handful of attempts clears them
 * without any risk of spinning through a playlist that is blocked outright.
 */
const MAX_HEAD_SKIPS = 4;
const MAX_TRACK_SKIPS = 3;

export function useYouTubePlayer({
  playlistId,
  enabled,
  autoplayOnLoad,
}: UseYouTubePlayerOptions): UseYouTubePlayerResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadedPlaylistRef = useRef<string | null>(null);
  // Set when a playlist has been cued but not yet dropped on a random track,
  // and cleared the moment we act, so re-cueing cannot recurse.
  const needsRandomStartRef = useRef(true);
  // How many tracks at the head of this playlist turned out to be unplayable, and
  // so the first index worth starting from.
  const blockedHeadRef = useRef(0);
  const trackSkipsRef = useRef(0);

  /**
   * Coming back to a mood should not always open on the same song. A playlist's
   * length is only knowable once YouTube has it loaded, so this hangs off the
   * ready/cued events rather than running at request time.
   *
   * `playVideoAt()` is the call this looks like it wants; at this point in the
   * lifecycle YouTube ignores it and starts from the top regardless.
   * `loadPlaylist({ index })` is what actually honours the index.
   */
  const startAtRandomTrack = useCallback(
    (autoplay: boolean) => {
      const attempt = (triesLeft: number) => {
        const player = playerRef.current;
        if (!player || !needsRandomStartRef.current) return;

        const list = readPlaylist(player);

        if (list.length === 0) {
          // The array lands a beat after the event on a cold load; give it a few.
          if (triesLeft > 0) setTimeout(() => attempt(triesLeft - 1), 250);
          return;
        }

        needsRandomStartRef.current = false;
        // Never land back on a head we already know YouTube refuses to play.
        const floor = Math.min(blockedHeadRef.current, list.length - 1);
        const index = floor + Math.floor(Math.random() * (list.length - floor));

        try {
          const target = { list: playlistId, listType: "playlist" as const, index };
          if (autoplay) {
            player.loadPlaylist(target);
          } else if (index > 0) {
            // Cue rather than load, so nothing starts before the user asks.
            player.cuePlaylist(target);
          }
        } catch {
          /* player not ready */
        }
      };

      attempt(6);
    },
    [playlistId],
  );
  // This hook is only ever mounted client-side (after the user has entered the
  // experience), so it's safe to seed the initial status without an effect.
  const [state, setState] = useState<PlaybackState>(() => ({ ...IDLE_PLAYBACK_STATE, status: "loading" }));

  const refreshVideoData = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    // While a random start is still pending the player is sitting on track one,
    // and publishing that would flash the wrong song before the jump lands.
    // The skeleton stays up instead.
    if (needsRandomStartRef.current) return;
    try {
      const data = player.getVideoData?.();
      const duration = player.getDuration?.() ?? 0;
      const position = player.getCurrentTime?.() ?? 0;
      setState((previous) => ({
        ...previous,
        title: data?.title || previous.title,
        artist: data?.author || previous.artist,
        artworkUrl: data?.video_id
          ? `https://i.ytimg.com/vi/${data.video_id}/hqdefault.jpg`
          : previous.artworkUrl,
        durationSeconds: duration,
        positionSeconds: position,
      }));
    } catch {
      /* player not fully ready yet */
    }
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(refreshVideoData, 500);
  }, [refreshVideoData, stopPolling]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let player: YT.Player | null = null;

    loadYouTubeApi().then(() => {
      if (cancelled || !containerRef.current || !window.YT) return;

      player = new window.YT.Player(containerRef.current, {
        height: "100%",
        width: "100%",
        playerVars: {
          listType: "playlist",
          list: playlistId,
          playsinline: 1,
          modestbranding: 1,
          rel: 0,
          controls: 0,
          autoplay: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            loadedPlaylistRef.current = playlistId;
            refreshVideoData();
            setState((previous) => ({
              ...previous,
              status: "cued",
              canSkipNext: true,
              canSkipPrevious: true,
            }));
            startAtRandomTrack(autoplayOnLoad);
          },
          onStateChange: (event: YT.OnStateChangeEvent) => {
            refreshVideoData();
            const YTState = window.YT.PlayerState;
            if (event.data === YTState.PLAYING) {
              // A track that plays clears the skip budget, so the cap counts
              // consecutive dead tracks rather than a whole session's worth.
              trackSkipsRef.current = 0;
              setState((previous) => ({ ...previous, status: "playing", errorMessage: null }));
              startPolling();
            } else if (event.data === YTState.PAUSED) {
              setState((previous) => ({ ...previous, status: "paused" }));
              stopPolling();
            } else if (event.data === YTState.ENDED) {
              setState((previous) => ({ ...previous, status: "ended" }));
              stopPolling();
            } else if (event.data === YTState.BUFFERING) {
              setState((previous) => ({ ...previous, status: "loading" }));
            } else if (event.data === YTState.CUED) {
              setState((previous) => ({ ...previous, status: "cued" }));
              startAtRandomTrack(autoplayOnLoad);
            }
          },
          onError: () => {
            const activePlayer = playerRef.current;
            const list = readPlaylist(activePlayer);

            // An empty playlist here does not mean an empty playlist: when the
            // track a playlist opens on is blocked from embedding, YouTube fails
            // the whole request rather than moving past it, and reports nothing
            // loaded. Re-cueing one further in recovers the rest of the tracks.
            if (list.length === 0) {
              if (blockedHeadRef.current < MAX_HEAD_SKIPS) {
                blockedHeadRef.current += 1;
                try {
                  activePlayer?.cuePlaylist({
                    // The closed-over playlistId belongs to whichever mood was
                    // active when this player was built, which is not necessarily
                    // this one.
                    list: loadedPlaylistRef.current ?? playlistId,
                    listType: "playlist",
                    index: blockedHeadRef.current,
                  });
                } catch {
                  /* player not ready */
                }
                return;
              }
            } else if (trackSkipsRef.current < MAX_TRACK_SKIPS) {
              // Mid-playlist, a single blocked track should cost a moment, not
              // the rest of the session.
              trackSkipsRef.current += 1;
              try {
                activePlayer?.nextVideo();
              } catch {
                /* player not ready */
              }
              return;
            }

            setState((previous) => ({
              ...previous,
              status: "error",
              errorMessage: "This video is unavailable — skipping ahead may help.",
            }));
          },
        },
      });

      playerRef.current = player;
    });

    return () => {
      cancelled = true;
      stopPolling();
      try {
        player?.destroy();
      } catch {
        /* already destroyed */
      }
      playerRef.current = null;
      loadedPlaylistRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  useEffect(() => {
    const player = playerRef.current;
    if (!enabled || !player || loadedPlaylistRef.current === playlistId) return;
    loadedPlaylistRef.current = playlistId;
    setState((previous) => ({
      ...previous,
      status: "loading",
      title: null,
      artist: null,
      artworkUrl: null,
      positionSeconds: 0,
      durationSeconds: 0,
      errorMessage: null,
    }));
    needsRandomStartRef.current = true;
    blockedHeadRef.current = 0;
    trackSkipsRef.current = 0;
    try {
      // Always cue, never load: cueing does not start audio, so the random
      // jump that follows the CUED event is silent rather than a stutter
      // through the first track.
      player.cuePlaylist({ list: playlistId, listType: "playlist", index: 0 });
    } catch {
      /* player not ready */
    }
  }, [playlistId, enabled]);

  const controls: PlaybackControls = {
    play: useCallback(() => {
      try {
        playerRef.current?.playVideo();
      } catch {
        /* ignore */
      }
    }, []),
    pause: useCallback(() => {
      try {
        playerRef.current?.pauseVideo();
      } catch {
        /* ignore */
      }
    }, []),
    togglePlay: useCallback(() => {
      const player = playerRef.current;
      if (!player) return;
      try {
        const currentState = player.getPlayerState();
        if (currentState === window.YT.PlayerState.PLAYING) {
          player.pauseVideo();
        } else {
          player.playVideo();
        }
      } catch {
        /* ignore */
      }
    }, []),
    next: useCallback(() => {
      try {
        playerRef.current?.nextVideo();
      } catch {
        /* ignore */
      }
    }, []),
    previous: useCallback(() => {
      try {
        playerRef.current?.previousVideo();
      } catch {
        /* ignore */
      }
    }, []),
    seek: useCallback((seconds: number) => {
      try {
        playerRef.current?.seekTo(seconds, true);
      } catch {
        /* ignore */
      }
    }, []),
  };

  return { containerRef, state, controls };
}
