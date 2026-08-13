"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PlaybackControls, PlaybackState } from "@/lib/playback-types";
import { IDLE_PLAYBACK_STATE } from "@/lib/playback-types";

/** Minimal typing for Spotify's official (undocumented-in-npm) iFrame API. */
interface SpotifyPlaybackUpdatePayload {
  playingURI: string | null;
  isPaused: boolean;
  isBuffering: boolean;
  duration: number;
  position: number;
}

interface SpotifyEmbedController {
  addListener: (
    event: "ready" | "playback_started" | "playback_update",
    callback: (event: { data: SpotifyPlaybackUpdatePayload }) => void,
  ) => void;
  removeListener: (event: string) => void;
  loadUri: (uri: string) => void;
  play: () => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  destroy: () => void;
}

interface SpotifyIFrameAPI {
  createController: (
    element: HTMLElement,
    options: { uri: string; width?: string | number; height?: string | number },
    callback: (controller: SpotifyEmbedController) => void,
  ) => void;
}

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIFrameAPI) => void;
    __spotifyIframeApi?: SpotifyIFrameAPI;
  }
}

let spotifyApiPromise: Promise<SpotifyIFrameAPI> | null = null;

function loadSpotifyApi(): Promise<SpotifyIFrameAPI> {
  if (window.__spotifyIframeApi) return Promise.resolve(window.__spotifyIframeApi);
  if (spotifyApiPromise) return spotifyApiPromise;

  spotifyApiPromise = new Promise((resolve) => {
    window.onSpotifyIframeApiReady = (api) => {
      window.__spotifyIframeApi = api;
      resolve(api);
    };
    if (document.querySelector('script[data-spotify-iframe-api="true"]')) return;
    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    script.dataset.spotifyIframeApi = "true";
    document.head.appendChild(script);
  });

  return spotifyApiPromise;
}

interface UseSpotifyEmbedOptions {
  playlistId: string;
  enabled: boolean;
}

interface UseSpotifyEmbedResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  state: PlaybackState;
  controls: PlaybackControls;
}

export function useSpotifyEmbed({ playlistId, enabled }: UseSpotifyEmbedOptions): UseSpotifyEmbedResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SpotifyEmbedController | null>(null);
  const loadedPlaylistRef = useRef<string | null>(null);
  // This hook is only ever mounted client-side (after the user has entered the
  // experience), so it's safe to seed the initial status without an effect.
  const [state, setState] = useState<PlaybackState>(() => ({ ...IDLE_PLAYBACK_STATE, status: "loading" }));

  useEffect(() => {
    if (!enabled || !containerRef.current) return;
    let cancelled = false;

    loadSpotifyApi().then((api) => {
      if (cancelled || !containerRef.current) return;
      api.createController(
        containerRef.current,
        { uri: `spotify:playlist:${playlistId}`, width: "100%", height: "152" },
        (controller) => {
          if (cancelled) {
            controller.destroy();
            return;
          }
          controllerRef.current = controller;
          loadedPlaylistRef.current = playlistId;

          controller.addListener("ready", () => {
            setState((previous) => ({ ...previous, status: "cued" }));
          });

          controller.addListener("playback_started", () => {
            setState((previous) => ({ ...previous, status: "playing" }));
          });

          controller.addListener("playback_update", (event) => {
            const { isPaused, isBuffering, duration, position } = event.data;
            setState((previous) => ({
              ...previous,
              status: isBuffering ? "loading" : isPaused ? "paused" : "playing",
              durationSeconds: duration / 1000,
              positionSeconds: position / 1000,
            }));
          });
        },
      );
    });

    return () => {
      cancelled = true;
      try {
        controllerRef.current?.destroy();
      } catch {
        /* already destroyed */
      }
      controllerRef.current = null;
      loadedPlaylistRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !controllerRef.current || loadedPlaylistRef.current === playlistId) return;
    loadedPlaylistRef.current = playlistId;
    setState((previous) => ({
      ...previous,
      status: "loading",
      positionSeconds: 0,
      durationSeconds: 0,
    }));
    try {
      controllerRef.current.loadUri(`spotify:playlist:${playlistId}`);
    } catch {
      /* controller not ready */
    }
  }, [playlistId, enabled]);

  const controls: PlaybackControls = {
    play: useCallback(() => {
      try {
        controllerRef.current?.play();
      } catch {
        /* ignore */
      }
    }, []),
    pause: useCallback(() => {
      try {
        controllerRef.current?.pause();
      } catch {
        /* ignore */
      }
    }, []),
    togglePlay: useCallback(() => {
      try {
        controllerRef.current?.togglePlay();
      } catch {
        /* ignore */
      }
    }, []),
    // Track skipping within a playlist is not exposed by Spotify's iFrame API —
    // the embed's own controls (rendered below) handle that honestly instead.
    next: useCallback(() => {}, []),
    previous: useCallback(() => {}, []),
    seek: useCallback(() => {}, []),
  };

  return { containerRef, state, controls };
}
