import type { CSSProperties } from "react";
import type { BackgroundVariant } from "@/data/stations";

interface AmbientLayerProps {
  variant: BackgroundVariant;
}

/**
 * Sun glinting off the water, kept to a narrow horizontal band so the
 * highlights sit on the sea instead of floating over the sky and the sand.
 */
const SEA_GLINTS = Array.from({ length: 12 }, (_, index) => ({
  left: 5 + ((index * 8.3) % 90),
  top: 52 + ((index * 3.1) % 9),
  width: 3 + (index % 3),
  delay: (index * 0.45) % 5,
  duration: 2.8 + ((index * 0.6) % 2.6),
}));

/** Embers off the torches: warm, rising, and few enough to stay believable. */
const EMBERS = Array.from({ length: 9 }, (_, index) => ({
  left: 12 + ((index * 9.1) % 76),
  bottom: 12 + ((index * 8) % 26),
  size: 2 + (index % 2),
  duration: 5.5 + ((index * 1.1) % 4),
  delay: (index * 0.8) % 6,
  driftX: index % 2 === 0 ? 22 + (index % 3) * 9 : -(22 + (index % 3) * 9),
}));

/** Oil lamps and phone screens around a night stage, catching and losing the light. */
const TWINKLES = Array.from({ length: 14 }, (_, index) => ({
  left: 4 + ((index * 7.3) % 92),
  top: 3 + ((index * 11.1) % 40),
  size: 2 + (index % 2),
  delay: (index * 0.35) % 4,
  duration: 2.4 + ((index * 0.5) % 2.5),
}));

/**
 * Small always-on ambient motion per mood (sea glint, embers, twinkling lamps)
 * so the scene keeps breathing even without any pointer movement.
 */
export function AmbientLayer({ variant }: AmbientLayerProps) {
  if (variant === "tulunad-porlu") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {SEA_GLINTS.map((glint, index) => (
          <span
            key={index}
            className="animate-twinkle motion-reduce:hidden absolute h-[2px] rounded-full bg-amber-50/80 blur-[0.5px]"
            style={{
              left: `${glint.left}%`,
              top: `${glint.top}%`,
              width: glint.width,
              animationDuration: `${glint.duration}s`,
              animationDelay: `-${glint.delay}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === "daivada-nema") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {EMBERS.map((ember, index) => (
          <span
            key={index}
            className="animate-dust motion-reduce:hidden absolute rounded-full bg-orange-300/70 blur-[1px]"
            style={
              {
                left: `${ember.left}%`,
                bottom: `${ember.bottom}%`,
                width: ember.size,
                height: ember.size,
                animationDuration: `${ember.duration}s`,
                animationDelay: `-${ember.delay}s`,
                "--dust-x": `${ember.driftX}px`,
              } as CSSProperties
            }
          />
        ))}
      </div>
    );
  }

  if (variant === "yakshagana-ratri") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {TWINKLES.map((lamp, index) => (
          <span
            key={index}
            className="animate-twinkle motion-reduce:hidden absolute rounded-full bg-amber-200 shadow-[0_0_6px_2px_rgba(255,200,120,0.6)]"
            style={{
              left: `${lamp.left}%`,
              top: `${lamp.top}%`,
              width: lamp.size,
              height: lamp.size,
              animationDuration: `${lamp.duration}s`,
              animationDelay: `-${lamp.delay}s`,
            }}
          />
        ))}
      </div>
    );
  }

  return null;
}
