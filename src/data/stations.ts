/**
 * Single source of truth for every mood station and its playlists.
 * Never hardcode a playlist URL/ID anywhere else in the app — import from here.
 *
 * Tulu is written in Kannada script here, which is what Tulu speakers actually
 * use. The Tulu-Tigalari Unicode block exists but has effectively no font
 * support, so `font-kannada` throughout the app names the script, not the
 * language.
 *
 * REVIEW: every Tulu string in this file was written by a non-speaker and needs
 * a native check before this ships. The names are the ones most worth getting
 * right — they are the first words anyone reads.
 *   nameTulu "ತುಳುನಾಡ್‌ದ ಪೊರ್ಲು"  — intended: "the beauty of Tulu Nadu"
 *   nameTulu "ದೈವದ ನೇಮ"        — intended: the daiva ritual/nema
 *   nameTulu "ಯಕ್ಷಗಾನ ರಾತ್ರೆ"    — intended: "Yakshagana night"
 */

export type ProviderId = "spotify" | "youtube";

export type BackgroundVariant = "tulunad-porlu" | "daivada-nema" | "yakshagana-ratri";

export interface StationTheme {
  /** Primary accent used for active states, glows and icon strokes. */
  accent: string;
  /** Secondary accent used for gradients / softer fills. */
  accentSoft: string;
  /** Sky gradient (top -> bottom) shown briefly behind the scene while it loads / crossfades. */
  sky: [string, string];
  /** Warm light-glow colour cast near lamps, torches and windows. */
  glow: string;
  /** Overlay tint applied across the scene illustration to unify its mood. */
  overlay: string;
  /** Overlay blend mode for the tint layer. */
  overlayBlend: "multiply" | "color" | "soft-light" | "overlay" | "screen" | "hard-light";
  /** Overlay opacity, tuned per station so the illustration still reads well. */
  overlayOpacity: number;
  /** The full-bleed scene illustration unique to this mood. */
  backgroundImage: string;
  /** object-position for the scene image, tuned per illustration. */
  backgroundPosition: string;
  /**
   * object-position used on portrait viewports. A phone crops a 16:9 scene down
   * to roughly a quarter of its width, so each mood names the part of the
   * illustration worth keeping instead of defaulting to dead centre.
   */
  backgroundPositionPortrait: string;
}

export interface Station {
  id: string;
  /** Tulu name, in Kannada script. See the REVIEW note at the top of this file. */
  nameTulu: string;
  nameEnglish: string;
  description: string;
  /**
   * The aside in the bottom-left corner, written for this mood's scene.
   *
   * One line per station rather than one for the site: it sits on the artwork,
   * so a single line has to be vague enough to suit a sunset, a torchlit grove
   * and a night stage at once, and vague is the one thing this kind of line
   * cannot be.
   *
   * REVIEW: Tulu, written by a non-speaker. See the note at the top.
   */
  footerNote: string;
  backgroundVariant: BackgroundVariant;
  theme: StationTheme;
  /**
   * Omitted where a mood has no Spotify counterpart. Spotify carries Tulu
   * compilations but no mood playlists worth pointing at, so today every
   * station here is YouTube-only and the provider switch stays hidden — see
   * hasSpotify below and SITE.hasAnySpotify.
   */
  spotifyPlaylistUrl?: string;
  spotifyPlaylistId?: string;
  youtubePlaylistUrl: string;
  youtubePlaylistId: string;
  /**
   * Keeps a station out of everything that publishes the site's catalogue — the
   * JSON-LD graph, the meta copy and the outbound "open the playlist" link.
   * Nothing here sets it: these are community playlists, and linking back to
   * the source is the right way to carry someone else's curation.
   */
  unlisted?: boolean;
}

/** A station that can actually be played through Spotify. */
export type SpotifyStation = Station & {
  spotifyPlaylistUrl: string;
  spotifyPlaylistId: string;
};

export function hasSpotify(station: Station): station is SpotifyStation {
  return Boolean(station.spotifyPlaylistId && station.spotifyPlaylistUrl);
}

export const STATIONS: Station[] = [
  {
    id: "tulunad-porlu",
    nameTulu: "ತುಳುನಾಡ್‌ದ ಪೊರ್ಲು",
    nameEnglish: "Tulu Nadu Beauty",
    description: "Coast road, coconut palms, the songs everyone here knows.",
    footerNote: "ಗಟ್ಟದ ರೋಡ್‌ಡ್ ಜಾಗ್ರತೆ. ಪಾಟ್ ಮಾತ್ರ unlimited.",
    backgroundVariant: "tulunad-porlu",
    theme: {
      accent: "#EFA637",
      accentSoft: "#1E6F73",
      sky: ["#1b4b57", "#f0b968"],
      glow: "#ffd79a",
      overlay: "linear-gradient(180deg, #ffd79a 0%, #e09a4a 45%, #1e6f73 100%)",
      overlayBlend: "soft-light",
      overlayOpacity: 0.16,
      backgroundImage: "/images/scenes/tulunad-porlu.png",
      backgroundPosition: "center 44%",
      backgroundPositionPortrait: "46% 48%",
    },
    youtubePlaylistUrl: "https://www.youtube.com/playlist?list=PLZ840zjql5kI",
    youtubePlaylistId: "PLZ840zjql5kI",
  },
  {
    id: "daivada-nema",
    nameTulu: "ದೈವದ ನೇಮ",
    nameEnglish: "Daiva Nema",
    description: "Torchlight in the grove, drums from somewhere behind you.",
    footerNote: "ಚೆಂಡೆ ಬೊಳ್ಪು ಮುಟ್ಟ. ಪಾಟ್ ಮಾತ್ರ unlimited.",
    backgroundVariant: "daivada-nema",
    theme: {
      accent: "#E2703A",
      accentSoft: "#2E3B2A",
      sky: ["#0a1410", "#2f4030"],
      glow: "#ffb066",
      overlay: "linear-gradient(180deg, #e8a05e 0%, #3c5138 50%, #060d09 100%)",
      overlayBlend: "multiply",
      overlayOpacity: 0.2,
      backgroundImage: "/images/scenes/daivada-nema.png",
      backgroundPosition: "center 46%",
      backgroundPositionPortrait: "50% 50%",
    },
    youtubePlaylistUrl: "https://www.youtube.com/playlist?list=PLNr3raUkHS2aFMO7viUE2SwugOQcsGWy0",
    youtubePlaylistId: "PLNr3raUkHS2aFMO7viUE2SwugOQcsGWy0",
  },
  {
    id: "yakshagana-ratre",
    nameTulu: "ಯಕ್ಷಗಾನ ರಾತ್ರೆ",
    nameEnglish: "Yakshagana Night",
    description: "An all-night stage in a field, and nobody goes home early.",
    footerNote: "ಗದ್ದೆಡ್ ಇಡೀ ಊರು. ಪಾಟ್ ಮಾತ್ರ unlimited.",
    backgroundVariant: "yakshagana-ratri",
    theme: {
      accent: "#E0A33C",
      accentSoft: "#7A2436",
      sky: ["#0d0a1c", "#3a2352"],
      glow: "#ffd27a",
      overlay: "linear-gradient(180deg, #6b4a86 0%, #2a1c44 52%, #08060f 100%)",
      overlayBlend: "multiply",
      overlayOpacity: 0.22,
      backgroundImage: "/images/scenes/yakshagana-ratri.png",
      backgroundPosition: "center 45%",
      backgroundPositionPortrait: "48% 46%",
    },
    youtubePlaylistUrl: "https://www.youtube.com/playlist?list=PLOqWzKL-YrUbaTFGLDC_0Ahigk59XKILQ",
    youtubePlaylistId: "PLOqWzKL-YrUbaTFGLDC_0Ahigk59XKILQ",
  },
];

export const DEFAULT_STATION_ID = STATIONS[0].id;

/**
 * The stations the site publishes as its own — what the JSON-LD graph and the
 * meta copy describe. Everything the listener can actually pick lives in
 * STATIONS; this is the narrower set we hand to crawlers.
 */
export const LISTED_STATIONS = STATIONS.filter((station) => !station.unlisted);

/**
 * Whether the provider switch is worth rendering at all. With no Spotify
 * playlist on any mood, a permanently dimmed Spotify pill is just clutter that
 * invites a click it can never satisfy.
 */
export const HAS_ANY_SPOTIFY = STATIONS.some(hasSpotify);

export function getStationById(id: string | null | undefined): Station | undefined {
  if (!id) return undefined;
  return STATIONS.find((station) => station.id === id);
}

export function getSpotifyEmbedUrl(station: SpotifyStation): string {
  return `https://open.spotify.com/embed/playlist/${station.spotifyPlaylistId}?utm_source=generator&theme=0`;
}

export function getYoutubeEmbedSrc(station: Station, origin: string): string {
  const params = new URLSearchParams({
    listType: "playlist",
    list: station.youtubePlaylistId,
    enablejsapi: "1",
    playsinline: "1",
    modestbranding: "1",
    rel: "0",
    origin,
  });
  return `https://www.youtube.com/embed?${params.toString()}`;
}

export function getYoutubeMusicUrl(station: Station): string {
  return `https://music.youtube.com/playlist?list=${station.youtubePlaylistId}`;
}
