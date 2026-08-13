"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { Station } from "@/data/stations";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { SCENES_WITH_VIDEO } from "@/lib/scene-media";
import { AmbientLayer } from "./AmbientLayer";
import { GrainOverlay } from "./GrainOverlay";
import { SceneMedia } from "./SceneMedia";

interface SceneBackgroundProps {
  station: Station;
  /**
   * True while a full-screen overlay hides the scene completely. The scene then
   * costs whatever it downloads and returns nothing, so it drops its claim on
   * the connection: no preload priority, no video.
   */
  isCovered?: boolean;
}

/** How long the incoming scene may stall before it is shown regardless. */
const REVEAL_TIMEOUT_MS = 3500;
const CROSSFADE_MS = 1200;

/**
 * The full-viewport scene: a distinct, story-specific illustration per mood
 * (the coast road, a torchlit nema, an all-night Yakshagana stage), crossfading
 * between them on mood change instead of tinting one shared image.
 */
export function SceneBackground({ station, isCovered = false }: SceneBackgroundProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const parallaxRef = useRef<HTMLDivElement>(null);

  const [current, setCurrent] = useState(station);
  const [previous, setPrevious] = useState<Station | null>(null);
  const [hasArrived, setHasArrived] = useState(true);
  const [isRevealed, setIsRevealed] = useState(true);

  // Adjusting state during render is React's own answer to "a prop changed, so
  // derived state must change": it re-renders before committing, where an effect
  // would paint the stale scene first and then correct it.
  if (station.id !== current.id) {
    setPrevious(current);
    setCurrent(station);
    setHasArrived(false);
    setIsRevealed(false);
  }

  const handleArrived = useCallback(() => setHasArrived(true), []);

  // Crossfading to an image that has not downloaded yet dissolves the old mood
  // into an empty frame and then pops the new one in. Holding the outgoing scene
  // until the incoming one has painted turns that into one clean dissolve.
  useEffect(() => {
    if (hasArrived) return;
    const timeout = setTimeout(() => setHasArrived(true), REVEAL_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [hasArrived]);

  // Two frames, not one: the incoming layer must be painted at opacity 0 before
  // the change to 1 can be a transition rather than a jump cut.
  useEffect(() => {
    if (!hasArrived || isRevealed) return;
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsRevealed(true));
    });
    return () => cancelAnimationFrame(raf);
  }, [hasArrived, isRevealed]);

  // Tied to the reveal, not to the mood change, so a slow incoming image cannot
  // retire the outgoing scene while it is still the only one on screen.
  useEffect(() => {
    if (!previous || !isRevealed) return;
    const timeout = setTimeout(() => setPrevious(null), CROSSFADE_MS);
    return () => clearTimeout(timeout);
  }, [previous, isRevealed]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    let frameId = 0;

    const handlePointerMove = (event: PointerEvent) => {
      if (frameId) return;
      frameId = requestAnimationFrame(() => {
        frameId = 0;
        const node = parallaxRef.current;
        if (!node) return;
        const x = (event.clientX / window.innerWidth - 0.5) * 2;
        const y = (event.clientY / window.innerHeight - 0.5) * 2;
        node.style.setProperty("--parallax-x", `${x * 10}px`);
        node.style.setProperty("--parallax-y", `${y * 7}px`);
      });
    };

    window.addEventListener("pointermove", handlePointerMove);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [prefersReducedMotion]);

  const { theme } = current;
  const rootStyle = { "--parallax-x": "0px", "--parallax-y": "0px" } as CSSProperties;
  // Nothing here ships a video today, but the hook stays: an ambient video
  // carries its own motion, so the CSS ambient layer would double up on it.
  const hasLiveVideo = !prefersReducedMotion && SCENES_WITH_VIDEO.includes(current.theme.backgroundImage);

  return (
    <div ref={parallaxRef} className="fixed inset-0 z-0 overflow-hidden bg-[#071a1f]" style={rootStyle}>
      <div
        className="absolute inset-0 transition-[background] duration-[1400ms] ease-out"
        style={{ background: `linear-gradient(180deg, ${theme.sky[0]} 0%, ${theme.sky[1]} 100%)` }}
      />

      <div
        className="absolute inset-0"
        style={{ transform: "translate3d(calc(var(--parallax-x) * 0.6), calc(var(--parallax-y) * 0.6), 0)" }}
      >
        {/*
         * Keyed by mood, and ordered outgoing-then-incoming so the incoming one
         * stacks on top. The key is what makes the crossfade work at all: the
         * outgoing mood keeps the very DOM node — and so the decoded image — it
         * was already showing, where reconciling by position would tear it down
         * and mount a fresh one, blanking the scene to a bare gradient until the
         * browser had re-decoded a picture it already had.
         */}
        {(previous ? [previous, current] : [current]).map((scene) => {
          const isIncoming = scene.id === current.id;
          return (
            <div
              key={scene.id}
              className="absolute inset-0 transition-opacity duration-[1200ms] ease-out"
              style={{ opacity: isIncoming && !isRevealed ? 0 : 1 }}
            >
              <SceneMedia
                image={scene.theme.backgroundImage}
                alt={
                  isIncoming
                    ? `Illustrated scene for the ${scene.nameEnglish} mood: ${scene.description}`
                    : ""
                }
                objectPosition={scene.theme.backgroundPosition}
                objectPositionPortrait={scene.theme.backgroundPositionPortrait}
                priority={isIncoming && !isCovered}
                stillOnly={!isIncoming || isCovered}
                onStillReady={isIncoming ? handleArrived : undefined}
              />
            </div>
          );
        })}
      </div>

      <div
        className="absolute inset-0 transition-opacity duration-[1200ms] ease-out"
        style={{
          background: theme.overlay,
          mixBlendMode: theme.overlayBlend,
          opacity: theme.overlayOpacity,
        }}
      />

      {!hasLiveVideo && <AmbientLayer variant={current.backgroundVariant} />}

      <div
        className="absolute inset-x-0 bottom-0 h-[58%] animate-flicker transition-[background] duration-[1200ms]"
        style={{ background: `radial-gradient(60% 75% at 50% 100%, ${theme.glow}33, transparent 72%)` }}
      />

      {/* Scrim so the title stays legible over a busy, story-specific photo */}
      <div
        className="absolute inset-x-0 top-0 h-[48%]"
        style={{ background: "linear-gradient(180deg, rgba(6,4,10,0.62) 0%, rgba(6,4,10,0.32) 55%, transparent 100%)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/65" />

      {!prefersReducedMotion && (
        <div className="absolute inset-0 animate-passing-shadow bg-gradient-to-r from-transparent via-black/25 to-transparent" />
      )}

      <GrainOverlay />
    </div>
  );
}
