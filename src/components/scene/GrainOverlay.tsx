/** Subtle animated film-grain texture layered above the illustration. Purely decorative. */
export function GrainOverlay() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-[-10%] h-[120%] w-[120%] animate-grain opacity-[0.05] mix-blend-overlay"
    >
      <filter id="nbrGrain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="noise" />
        <feColorMatrix in="noise" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#nbrGrain)" />
    </svg>
  );
}
