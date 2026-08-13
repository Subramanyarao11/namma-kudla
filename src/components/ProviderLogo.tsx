import type { ProviderId } from "@/data/stations";

interface ProviderLogoProps {
  provider: ProviderId;
  className?: string;
  /**
   * Both brands allow their icon in full colour, or flattened to a single solid
   * colour where colour is not available. Pass "mono" on a coloured pill, where
   * brand green on brand green would vanish.
   */
  tone?: "brand" | "mono";
}

const SPOTIFY_GREEN = "#1ED760";
const YOUTUBE_RED = "#FF0033";

/**
 * The real marks, drawn from each brand's official icon geometry.
 *
 * Spotify's design guidelines require attribution to be the actual icon, unaltered
 * in shape and either in Spotify Green or a single flat colour, so an approximation
 * would be both worse looking and non-compliant.
 */
export function ProviderLogo({ provider, className, tone = "brand" }: ProviderLogoProps) {
  if (provider === "spotify") {
    return (
      <svg viewBox="0 0 24 24" className={className} role="img" aria-label="Spotify">
        <path
          fill={tone === "mono" ? "currentColor" : SPOTIFY_GREEN}
          d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.24-.899-.6-.12-.421.24-.781.6-.901 4.561-1.021 8.52-.6 11.64 1.32.42.18.479.659.241 1.082zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label="YouTube Music">
      <path
        fill={tone === "mono" ? "currentColor" : YOUTUBE_RED}
        d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.104c-3.924 0-7.104-3.18-7.104-7.104S8.076 4.896 12 4.896s7.104 3.18 7.104 7.104-3.18 7.104-7.104 7.104zm0-13.332c-3.432 0-6.228 2.796-6.228 6.228S8.568 18.228 12 18.228s6.228-2.796 6.228-6.228S15.432 5.772 12 5.772zM9.684 15.54V8.46L15.876 12l-6.192 3.54z"
      />
    </svg>
  );
}
