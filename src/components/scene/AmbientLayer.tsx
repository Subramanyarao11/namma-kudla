"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type { BackgroundVariant } from "@/data/stations";

interface AmbientLayerProps {
  variant: BackgroundVariant;
}

/**
 * Every coordinate in this file is measured on the illustration itself, so a
 * glow lands on the torch that casts it and the birds stay in the sky. That
 * needs one correction to be true on screen: the scenes are 16:9 and are drawn
 * with object-fit: cover, so on any narrower viewport — which is all of them —
 * the sides are cropped and a percentage of the *container* is not a percentage
 * of the *painting*. `anchorX` converts between the two.
 */
const SCENE_ASPECT = 16 / 9;

/**
 * Publishes the crop factors as custom properties.
 *
 * A viewport narrower than the scene is covered by matching heights, which
 * leaves vertical positions exact and squeezes horizontal ones toward the
 * centre; a wider one is the other way round. Written to the DOM rather than
 * held in state because it changes only on resize and nothing renders from it.
 */
function useSceneProjection(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const apply = () => {
      const node = ref.current;
      if (!node) return;
      const aspect = window.innerWidth / Math.max(1, window.innerHeight);
      const isWiderThanScene = aspect > SCENE_ASPECT;
      node.style.setProperty("--scene-fx", String(isWiderThanScene ? 1 : SCENE_ASPECT / aspect));
      node.style.setProperty("--scene-fy", String(isWiderThanScene ? aspect / SCENE_ASPECT : 1));
    };

    apply();
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);
    return () => {
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
    };
  }, [ref]);
}

/**
 * A horizontal position in the painting, expressed on screen.
 *
 * Only for effects that belong to something painted — a torch's glow, the sun's
 * reflection. Those must move off-screen when the crop excludes the thing they
 * belong to, which this does. Effects that belong to no particular feature
 * (stars, insects, cloud, birds) are positioned in screen space instead, so a
 * phone's much tighter crop still gets a sky and a field with something in them.
 */
const anchorX = (percent: number) => `calc(50% + (${percent}% - 50%) * var(--scene-fx, 1))`;
/** A vertical position in the painting, expressed on screen. */
const anchorY = (percent: number) => `calc(50% + (${percent}% - 50%) * var(--scene-fy, 1))`;
/** A width measured on the painting, which has to shrink with the same crop. */
const spanX = (percent: number) => `calc(${percent}% * var(--scene-fx, 1))`;

/* --- ತುಳುನಾಡ್‌ದ ಪೊರ್ಲು: the coast road at sunset -------------------------- */

/**
 * Glints on the swell. Held to the left of frame because that is where the sea
 * is in this painting — the right half is road, wall and house, and a full-width
 * spread would put highlights on all three.
 */
const SEA_GLINTS = Array.from({ length: 14 }, (_, index) => ({
  left: 2 + ((index * 7.7) % 34),
  top: 56 + ((index * 4.3) % 18),
  width: 3 + (index % 4),
  delay: (index * 0.45) % 5,
  duration: 2.8 + ((index * 0.6) % 2.6),
}));

/** Bands across the water, offset so the two never crest together. */
const WATER_BANDS = [
  { left: 0, width: 42, top: 57, height: 9, duration: 13, delay: 0 },
  { left: 0, width: 40, top: 66, height: 8, duration: 17, delay: -6 },
];

/** Faint veils of cloud. The long delays keep the sky from feeling scheduled. */
const CLOUDS = [
  { top: 11, height: 9, width: 46, peak: 0.13, duration: 90, delay: 0 },
  { top: 23, height: 7, width: 34, peak: 0.1, duration: 124, delay: -48 },
];

/** Three birds, loosely staggered rather than in formation. */
const BIRDS = [
  { top: 21, scale: 1, duration: 52, delay: -4, flap: 0.42 },
  { top: 25, scale: 0.82, duration: 58, delay: -19, flap: 0.5 },
  { top: 18, scale: 0.7, duration: 64, delay: -33, flap: 0.36 },
];

/* --- ದೈವದ ನೇಮ: torchlight in the grove --------------------------------- */

/** The two torch heads, and the light each one throws. */
const TORCHES = [
  { left: 12, top: 20, size: 26, duration: 4.1, delay: 0 },
  { left: 27, top: 36, size: 21, duration: 3.4, delay: -1.6 },
];

/** Smoke leaving each torch head. */
const SMOKE = [
  { left: 11.5, top: 13, width: 13, duration: 9, delay: 0, x: 26, peak: 0.15 },
  { left: 27, top: 29, width: 10, duration: 11, delay: -5, x: -20, peak: 0.12 },
];

/** Oil lamps set out on the ground, read off the painting one by one. */
const GROUND_LAMPS = [
  { left: 22.5, top: 82, size: 7, duration: 3.2, delay: 0 },
  { left: 29, top: 89, size: 8, duration: 2.7, delay: -1.1 },
  { left: 40, top: 90, size: 8, duration: 3.6, delay: -2.2 },
  { left: 30, top: 76, size: 6, duration: 2.9, delay: -0.6 },
  { left: 43, top: 76, size: 6, duration: 3.4, delay: -1.8 },
  { left: 54, top: 78, size: 6, duration: 3.05, delay: -2.6 },
];

/** Embers off the torches: warm, rising, and few enough to stay believable. */
const EMBERS = Array.from({ length: 9 }, (_, index) => ({
  left: 9 + ((index * 5.3) % 21),
  top: 15 + ((index * 7) % 27),
  size: 2 + (index % 2),
  duration: 5.5 + ((index * 1.1) % 4),
  delay: (index * 0.8) % 6,
  driftX: index % 2 === 0 ? 18 + (index % 3) * 7 : -(18 + (index % 3) * 7),
}));

/* --- ಯಕ್ಷಗಾನ ರಾತ್ರೆ: an all-night stage in a field ---------------------- */

/** Stars, kept above the treeline. Screen space: these are additive, not painted. */
const STARS = Array.from({ length: 16 }, (_, index) => ({
  left: 3 + ((index * 6.1) % 94),
  top: 2 + ((index * 9.7) % 34),
  size: 1 + (index % 2),
  delay: (index * 0.35) % 4,
  duration: 2.4 + ((index * 0.5) % 2.5),
}));

/** Lamps hung along the canopy valance, three each side of the stage. */
const CANOPY_LAMPS = [
  { left: 30, top: 54, size: 9, duration: 3.1, delay: 0, sway: 5.5 },
  { left: 33, top: 56, size: 8, duration: 2.6, delay: -0.9, sway: 6.4 },
  { left: 39, top: 53, size: 8, duration: 3.5, delay: -1.7, sway: 5.9 },
  { left: 67, top: 54, size: 8, duration: 2.9, delay: -2.3, sway: 6.1 },
  { left: 71, top: 56, size: 9, duration: 3.3, delay: -1.2, sway: 5.2 },
  { left: 73, top: 57, size: 7, duration: 2.75, delay: -0.4, sway: 6.8 },
];

/** Hurricane lamps down in the audience. */
const CROWD_LAMPS = [
  { left: 10, top: 87, size: 10, duration: 3.4, delay: 0 },
  { left: 42, top: 93, size: 9, duration: 2.8, delay: -1.5 },
  { left: 76, top: 87, size: 9, duration: 3.7, delay: -2.4 },
];

/** Insects over the stubble field. Screen space, for the same reason as the stars. */
const FIREFLIES = Array.from({ length: 6 }, (_, index) => ({
  left: 8 + ((index * 15.7) % 84),
  top: 63 + ((index * 3.7) % 11),
  duration: 9 + ((index * 2.3) % 7),
  delay: (index * 1.9) % 11,
  driftX: index % 2 === 0 ? 22 + (index % 3) * 8 : -(22 + (index % 3) * 8),
}));

/** Shared shell: clips the effects and carries the crop factors they all read. */
function Ambient({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useSceneProjection(ref);
  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {children}
    </div>
  );
}

/**
 * Always-on ambient motion, one composition per mood: sea and sky on the coast
 * road, firelight and smoke at the nema, lamps and insects at the night stage.
 * It runs without any pointer input, so the scene keeps breathing while someone
 * just listens — which is most of the time.
 *
 * All of it is CSS on transform and opacity, so it runs on the compositor and
 * costs no JavaScript per frame. A canvas or a WebGL layer would buy finer
 * control over a still that never changes, in exchange for a render loop
 * running behind an audio player for as long as the tab stays open.
 */
export function AmbientLayer({ variant }: AmbientLayerProps) {
  if (variant === "tulunad-porlu") {
    return (
      <Ambient>
        {/* The sun's own reflection, widening and narrowing on the swell. */}
        <div
          className="animate-sun-column motion-reduce:hidden absolute blur-[6px]"
          style={{
            left: anchorX(13),
            top: anchorY(53),
            width: spanX(10),
            height: "29%",
            animationDuration: "8s",
            background: "linear-gradient(180deg, rgba(255,236,190,0.85), rgba(255,214,140,0))",
          }}
        />

        {WATER_BANDS.map((band, index) => (
          <div
            key={index}
            className="animate-water-shimmer motion-reduce:hidden absolute blur-[1.5px]"
            style={{
              left: anchorX(band.left),
              top: anchorY(band.top),
              width: spanX(band.width),
              height: `${band.height}%`,
              animationDuration: `${band.duration}s`,
              animationDelay: `${band.delay}s`,
              background:
                "repeating-linear-gradient(90deg, rgba(255,240,205,0) 0px, rgba(255,240,205,0.5) 2px, rgba(255,240,205,0) 9px)",
            }}
          />
        ))}

        {SEA_GLINTS.map((glint, index) => (
          <span
            key={index}
            className="animate-twinkle motion-reduce:hidden absolute h-[2px] rounded-full bg-amber-50/80 blur-[0.5px]"
            style={{
              left: anchorX(glint.left),
              top: anchorY(glint.top),
              width: glint.width,
              animationDuration: `${glint.duration}s`,
              animationDelay: `-${glint.delay}s`,
            }}
          />
        ))}

        {/* Clouds cross the whole frame, so these stay in screen space. */}
        {CLOUDS.map((cloud, index) => (
          <div
            key={index}
            className="animate-cloud-drift motion-reduce:hidden absolute rounded-full blur-[18px]"
            style={
              {
                left: 0,
                top: anchorY(cloud.top),
                width: `${cloud.width}%`,
                height: `${cloud.height}%`,
                animationDuration: `${cloud.duration}s`,
                animationDelay: `${cloud.delay}s`,
                "--cloud-peak": cloud.peak,
                background: "radial-gradient(ellipse at center, rgba(255,248,232,0.9), rgba(255,248,232,0))",
              } as CSSProperties
            }
          />
        ))}

        {BIRDS.map((bird, index) => (
          <div
            key={index}
            className="animate-bird-cross motion-reduce:hidden absolute"
            style={{
              left: 0,
              top: anchorY(bird.top),
              animationDuration: `${bird.duration}s`,
              animationDelay: `${bird.delay}s`,
            }}
          >
            <svg
              viewBox="0 0 12 5"
              className="animate-bird-flap block"
              style={{
                width: 12 * bird.scale,
                animationDuration: `${bird.flap}s`,
                color: "rgba(60,40,30,0.75)",
              }}
              fill="none"
            >
              <path
                d="M0.6 3.6c2-.4 3.6-2.4 5.4-2.4s3.4 2 5.4 2.4"
                stroke="currentColor"
                strokeWidth="1.1"
                strokeLinecap="round"
              />
            </svg>
          </div>
        ))}
      </Ambient>
    );
  }

  if (variant === "daivada-nema") {
    return (
      <Ambient>
        {/* The light each torch throws, rather than the flame itself: the painted
            flame is already there, and this is what it does to the air around it.
            Centring lives on the wrapper because the flicker animates transform
            and would otherwise overwrite it. */}
        {TORCHES.map((torch, index) => (
          <div
            key={index}
            className="motion-reduce:hidden absolute"
            style={{
              left: anchorX(torch.left),
              top: anchorY(torch.top),
              width: spanX(torch.size),
              height: `${torch.size}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div
              className="animate-flame h-full w-full rounded-full blur-[12px]"
              style={{
                animationDuration: `${torch.duration}s`,
                animationDelay: `${torch.delay}s`,
                background: "radial-gradient(circle, rgba(255,168,64,0.5), rgba(255,120,30,0))",
              }}
            />
          </div>
        ))}

        {SMOKE.map((plume, index) => (
          <div
            key={index}
            className="animate-smoke motion-reduce:hidden absolute rounded-full blur-[9px]"
            style={
              {
                left: anchorX(plume.left),
                top: anchorY(plume.top),
                width: spanX(plume.width),
                height: "16%",
                animationDuration: `${plume.duration}s`,
                animationDelay: `${plume.delay}s`,
                "--smoke-x": `${plume.x}px`,
                "--smoke-peak": plume.peak,
                background: "radial-gradient(ellipse at bottom, rgba(226,214,198,0.75), rgba(226,214,198,0))",
              } as CSSProperties
            }
          />
        ))}

        {GROUND_LAMPS.map((lamp, index) => (
          <span
            key={index}
            className="animate-flame motion-reduce:hidden absolute rounded-full blur-[3px]"
            style={{
              left: anchorX(lamp.left),
              top: anchorY(lamp.top),
              width: lamp.size,
              height: lamp.size,
              animationDuration: `${lamp.duration}s`,
              animationDelay: `${lamp.delay}s`,
              background: "radial-gradient(circle, rgba(255,222,150,0.95), rgba(255,150,50,0))",
            }}
          />
        ))}

        {EMBERS.map((ember, index) => (
          <span
            key={index}
            className="animate-dust motion-reduce:hidden absolute rounded-full bg-orange-300/70 blur-[1px]"
            style={
              {
                left: anchorX(ember.left),
                top: anchorY(ember.top),
                width: ember.size,
                height: ember.size,
                animationDuration: `${ember.duration}s`,
                animationDelay: `-${ember.delay}s`,
                "--dust-x": `${ember.driftX}px`,
              } as CSSProperties
            }
          />
        ))}
      </Ambient>
    );
  }

  if (variant === "yakshagana-ratri") {
    return (
      <Ambient>
        {STARS.map((star, index) => (
          <span
            key={index}
            className="animate-twinkle motion-reduce:hidden absolute rounded-full bg-amber-100 shadow-[0_0_5px_1px_rgba(255,240,210,0.5)]"
            style={{
              left: `${star.left}%`,
              top: anchorY(star.top),
              width: star.size,
              height: star.size,
              animationDuration: `${star.duration}s`,
              animationDelay: `-${star.delay}s`,
            }}
          />
        ))}

        {/* The stage's own warmth, breathing on the slowest clock here so it
            reads as the room rather than as an effect. */}
        <div
          className="motion-reduce:hidden absolute"
          style={{
            left: anchorX(50),
            top: anchorY(56),
            width: spanX(44),
            height: "22%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            className="animate-flame h-full w-full rounded-full blur-[26px]"
            style={{
              animationDuration: "11s",
              background: "radial-gradient(ellipse at center, rgba(255,196,110,0.34), rgba(255,170,80,0))",
            }}
          />
        </div>

        {/* Hung on wire, so each one swings as well as flickers. The wrapper is
            the wire: it needs a real width for `transform-origin: top center` to
            pivot from the knot rather than from the lamp's own edge. */}
        {CANOPY_LAMPS.map((lamp, index) => (
          <div
            key={index}
            className="animate-lamp-sway motion-reduce:hidden absolute flex items-end justify-center"
            style={{
              left: anchorX(lamp.left),
              top: anchorY(lamp.top - 4),
              height: "4%",
              width: lamp.size,
              animationDuration: `${lamp.sway}s`,
              animationDelay: `${lamp.delay}s`,
            }}
          >
            <span
              className="animate-flame rounded-full blur-[2.5px]"
              style={{
                width: lamp.size,
                height: lamp.size,
                animationDuration: `${lamp.duration}s`,
                animationDelay: `${lamp.delay}s`,
                background: "radial-gradient(circle, rgba(255,228,160,0.95), rgba(255,160,60,0))",
              }}
            />
          </div>
        ))}

        {CROWD_LAMPS.map((lamp, index) => (
          <span
            key={index}
            className="animate-flame motion-reduce:hidden absolute rounded-full blur-[3px]"
            style={{
              left: anchorX(lamp.left),
              top: anchorY(lamp.top),
              width: lamp.size,
              height: lamp.size,
              animationDuration: `${lamp.duration}s`,
              animationDelay: `${lamp.delay}s`,
              background: "radial-gradient(circle, rgba(255,214,140,0.9), rgba(255,150,50,0))",
            }}
          />
        ))}

        {FIREFLIES.map((fly, index) => (
          <span
            key={index}
            className="animate-firefly motion-reduce:hidden absolute h-[3px] w-[3px] rounded-full bg-amber-200 shadow-[0_0_5px_2px_rgba(255,210,130,0.5)]"
            style={
              {
                left: `${fly.left}%`,
                top: anchorY(fly.top),
                animationDuration: `${fly.duration}s`,
                animationDelay: `-${fly.delay}s`,
                "--fly-x": `${fly.driftX}px`,
              } as CSSProperties
            }
          />
        ))}
      </Ambient>
    );
  }

  return null;
}
