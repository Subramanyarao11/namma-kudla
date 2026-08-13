"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { getSceneVideoPath, SCENES_WITH_VIDEO } from "@/lib/scene-media";

interface SceneMediaProps {
  image: string;
  alt: string;
  objectPosition: string;
  /** Focal point used on portrait viewports; falls back to objectPosition. */
  objectPositionPortrait?: string;
  priority?: boolean;
  /** Defaults to the full-bleed case; pass a narrower hint when boxed in a panel. */
  sizes?: string;
  /**
   * Render the illustration only, never the video. Used for the outgoing mood
   * during a crossfade: loading a clip that is about to unmount wastes the
   * download, and two videos dissolving into each other looks like mush. Also
   * used while a scene is fully covered by an overlay, where a multi-megabyte
   * clip would be downloaded and decoded for nobody.
   */
  stillOnly?: boolean;
  /**
   * Fires once the illustration has painted. Lets a caller hold the outgoing
   * scene until the incoming one is actually on screen, instead of dissolving
   * into a half-loaded image.
   */
  onStillReady?: () => void;
}

/** navigator.connection is still non-standard, so it is typed locally. */
function prefersToSaveData(): boolean {
  if (typeof navigator === "undefined") return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return connection?.saveData === true;
}

/**
 * A mood scene, painted as the illustration first and then upgraded to its
 * looping animated version once that can play without stuttering.
 *
 * The still is always underneath, so the video layer is purely additive: if the
 * download is declined, autoplay is refused, or decoding fails, the scene still
 * looks correct and nothing flashes black. This only reads as an upgrade rather
 * than a jolt because the two are framed identically — see
 * scripts/frame-scene-stills.mjs, which crops each still to its video's frame.
 */
export function SceneMedia({
  image,
  alt,
  objectPosition,
  objectPositionPortrait,
  priority,
  sizes = "100vw",
  stillOnly = false,
  onStillReady,
}: SceneMediaProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const stillRef = useRef<HTMLImageElement>(null);
  // Storing which source is playing, rather than a bare boolean, means a change
  // of scene invalidates it for free — no effect needed just to reset a flag.
  const [playingSrc, setPlayingSrc] = useState<string | null>(null);

  const wantsVideo = !stillOnly && !prefersReducedMotion && SCENES_WITH_VIDEO.includes(image);
  const videoSrc = wantsVideo ? getSceneVideoPath(image) : null;
  const isPlaying = videoSrc !== null && playingSrc === videoSrc;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc || prefersToSaveData()) return;

    let cancelled = false;
    let fallbackTimer: number | undefined;

    const play = () => {
      video.play().catch(() => {
        // Autoplay refused (iOS Low Power Mode, for instance). The still is
        // already correct; try again on the first interaction the user makes.
        const retry = () => void video.play().catch(() => {});
        document.addEventListener("pointerdown", retry, { once: true });
      });
    };

    // Reveal on `playing` rather than `canplay` so we never fade up onto a
    // black or half-decoded frame.
    const handlePlaying = () => {
      if (!cancelled) setPlayingSrc(videoSrc);
    };
    const handleError = () => {
      if (!cancelled) setPlayingSrc(null);
    };

    video.addEventListener("playing", handlePlaying);
    video.addEventListener("error", handleError);

    // Waiting for canplaythrough matters: starting while the file is still
    // streaming means playback races the network, and every buffer underrun
    // reads as the loop stuttering or restarting.
    video.addEventListener("canplaythrough", play, { once: true });

    // Defer the download so the illustration, fonts and player get the
    // connection first; the video fades in whenever it is ready.
    const start = () => {
      if (cancelled) return;
      video.preload = "auto";
      video.src = videoSrc;
      video.load();
      fallbackTimer = window.setTimeout(() => {
        if (!cancelled && video.paused) play();
      }, 12000);
    };

    const idle = window.setTimeout(start, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(idle);
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("error", handleError);
      video.removeEventListener("canplaythrough", play);
      video.removeAttribute("src");
      video.load();
    };
  }, [videoSrc]);

  // A picture that is already decoded — reused across a crossfade, or straight
  // out of cache — fires no load event, so readiness has to be checked as well
  // as waited for. Without this, returning to a recent mood waits on a timeout.
  //
  // `complete` alone is not the question: it also reads true for an image whose
  // request has not started yet, which is exactly the state a freshly mounted
  // one is in. Only naturalWidth proves there are pixels to show.
  useEffect(() => {
    const still = stillRef.current;
    if (still?.complete && still.naturalWidth > 0) onStillReady?.();
  }, [image, onStillReady]);

  // Decoding video for a tab nobody is looking at is pure battery cost.
  useEffect(() => {
    if (!videoSrc) return;
    const handleVisibility = () => {
      const video = videoRef.current;
      if (!video || !video.src) return;
      if (document.hidden) video.pause();
      else void video.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [videoSrc]);

  const framing = {
    "--scene-pos": objectPosition,
    "--scene-pos-portrait": objectPositionPortrait ?? objectPosition,
  } as CSSProperties;

  return (
    <div className="absolute inset-0">
      {/*
       * The still is always painted underneath. It only drifts when no video is
       * coming: drifting under a video that is about to fade in would dissolve
       * two copies of the same art at different zoom levels, then snap back to
       * 1.0 the moment the video takes over.
       */}
      <div className={videoSrc ? "absolute inset-0" : "animate-scene-drift motion-reduce:scale-105 absolute inset-0"}>
        <Image
          ref={stillRef}
          src={image}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className="scene-framing object-cover"
          style={framing}
          onLoad={onStillReady}
          // A scene that will not load is still better reported as "arrived"
          // than left holding up whatever is waiting on it.
          onError={onStillReady}
        />
      </div>

      {videoSrc && (
        <video
          ref={videoRef}
          className="scene-framing absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out"
          style={{ ...framing, opacity: isPlaying ? 1 : 0 }}
          // Deliberately no `poster`: the still above is the poster, already
          // painted and already optimised. Pointing poster at the same path
          // would fetch the raw multi-megabyte PNG a second time.
          muted
          loop
          playsInline
          preload="none"
          disablePictureInPicture
          aria-hidden="true"
        />
      )}
    </div>
  );
}
