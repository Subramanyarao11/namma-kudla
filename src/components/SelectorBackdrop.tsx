import { SceneMedia } from "./scene/SceneMedia";

interface SelectorBackdropProps {
  /**
   * "overlay" is the full-screen first-visit picker, where the radio is the
   * hero and only needs enough wash to keep the headline readable. "sheet" is
   * the compact mood-change panel, where dense small text sits directly on the
   * art and needs a much heavier scrim.
   */
  variant: "overlay" | "sheet";
  /**
   * Set where this art is what the visitor actually sees first. Without it the
   * mood scene underneath — which nobody can see through this — wins the
   * preload race, and the picker paints over it a beat later.
   */
  priority?: boolean;
}

/**
 * Shared "tuning a radio at night" backdrop behind both the first-visit picker
 * and the mood-change sheet, so choosing a mood feels like its own dedicated
 * moment rather than a plain dark blur over whatever scene was already showing.
 *
 * The dial needle and the skyline windows animate inside the clip itself, so
 * there are no CSS sparkles layered on top; everything above this is scrim.
 */
export function SelectorBackdrop({ variant, priority }: SelectorBackdropProps) {
  const isSheet = variant === "sheet";

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <SceneMedia
        image="/images/scenes/mood-selector.png"
        alt=""
        objectPosition="center 45%"
        sizes={isSheet ? "(max-width: 640px) 100vw, 680px" : "100vw"}
        priority={priority}
        // In the sheet this art sits under a near-opaque scrim inside a small
        // panel, where the clip's motion cannot be read at all — so it is a
        // second video decoding behind the mood scene for no visible gain.
        stillOnly={isSheet}
      />
      {isSheet ? (
        <>
          <div className="absolute inset-0 backdrop-blur-[3px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0510]/88 via-[#0a0510]/80 to-[#0a0510]/95" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0510]/55 via-[#0a0510]/45 to-[#0a0510]/75" />
          {/* Pooled darkness behind the headline and cards only, so the dial
              and skyline stay visible out at the edges. */}
          <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_42%,rgba(6,3,12,0.72),transparent_78%)]" />
        </>
      )}
    </div>
  );
}
