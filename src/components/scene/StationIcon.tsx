import type { BackgroundVariant } from "@/data/stations";

interface StationIconProps {
  variant: BackgroundVariant;
  className?: string;
}

/** Small original line-icons representing each mood station — no copied artwork. */
export function StationIcon({ variant, className }: StationIconProps) {
  const common = {
    className,
    viewBox: "0 0 40 40",
    fill: "none",
    "aria-hidden": true,
  } as const;

  switch (variant) {
    // A coconut palm leaning over the water, which is the coast road in one shape.
    case "tulunad-porlu":
      return (
        <svg {...common}>
          <path d="M17 33C18 26 19 20 21 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M21 15C16.5 12 12.5 12 9.5 14" />
            <path d="M21 15C18.5 10.5 18.5 7.5 20 4.5" />
            <path d="M21 15C25 11.5 29 11.5 32 13.5" />
            <path d="M21 15C25 17 27.5 19.5 29 22.5" opacity="0.7" />
            <path d="M21 15C17 17 14.5 19 13 21.5" opacity="0.7" />
          </g>
          <path
            d="M4 35.5q4.5-3 9 0t9 0t9 0"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    // A torch rather than the daiva itself: the ritual is living religious
    // practice, and the firelight is what a listener actually stands in.
    case "daivada-nema":
      return (
        <svg {...common}>
          <path
            d="M20 5c3.6 4.3 4.7 7.6 3.3 10.4-1 2-3.1 3.1-3.3 3.1s-2.3-1.1-3.3-3.1C15.3 12.6 16.4 9.3 20 5z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M20 11.5c1.4 1.8 1.9 3.2 1.3 4.4-.4.9-1.3 1.3-1.3 1.3s-.9-.4-1.3-1.3c-.6-1.2-.1-2.6 1.3-4.4z"
            fill="currentColor"
            opacity="0.65"
          />
          <path d="M16 21h8l-1.3 2.6h-5.4z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M20 23.6V35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    // The chende and its sticks — the sound that carries an all-night stage.
    case "yakshagana-ratri":
      return (
        <svg {...common}>
          <ellipse cx="20" cy="15" rx="9" ry="3.2" stroke="currentColor" strokeWidth="2" />
          <path
            d="M11 15v11c0 1.8 4 3.2 9 3.2s9-1.4 9-3.2V15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M11.4 20.5c3.2 1.6 14 1.6 17.2 0" stroke="currentColor" strokeWidth="1.6" opacity="0.6" />
          <path d="M6 8l5 4.2M34 8l-5 4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
