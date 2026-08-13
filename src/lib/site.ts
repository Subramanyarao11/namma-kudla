/**
 * Brand, author and canonical-URL facts. Anything that ends up in a <title>,
 * a meta tag, the manifest, JSON-LD or the Open Graph image reads from here.
 *
 * The name follows the naming convention of the wider playlist-site scene:
 * a short, place-anchored phrase in the local script rather than a descriptive
 * English label. ಕುಡ್ಲ is what Tulu speakers call Mangaluru — the name locals
 * use among themselves, which is the register this whole site is written in.
 *
 * REVIEW: the Tulu strings below need a native check. Best-effort intent:
 *   heroTitleTulu "ತುಳುನಾಡ್‌ದ ರೇಡಿಯೋ"            — "Tulu Nadu Radio"
 *   taglineTulu   "ಒಂಜೊಂಜಿ ಮೂಡ್‌ಗ್ ಒಂಜಿ ಪಾಟ್"  — "for each mood, one song"
 *   descriptionTulu                            — the meta description, same sense as `description`
 */

import { hasSpotify, type Station } from "@/data/stations";

export const SITE = {
  nameTulu: "ನಮ್ಮ ಕುಡ್ಲ",
  nameLatin: "Namma Kudla",
  /** Used where a single ASCII-safe string is needed (manifest short_name, PWA). */
  shortName: "Namma Kudla",
  /**
   * What the scene itself says. Deliberately not the brand name: the hero is
   * part of the illustration and describes the thing you are listening to,
   * while ನಮ್ಮ ಕುಡ್ಲ is how the site is titled, shared and found.
   */
  heroTitleTulu: "ತುಳುನಾಡ್‌ದ ರೇಡಿಯೋ",
  taglineTulu: "ಒಂಜೊಂಜಿ ಮೂಡ್‌ಗ್ ಒಂಜಿ ಪಾಟ್",
  taglineEnglish: "A song for every Tulu Nadu mood",
  /**
   * "From Tulu Nadu", not "in Tulu". Two of the three moods are Tulu-language
   * throughout, but Yakshagana is sung in Kannada — it belongs to this coast
   * without belonging to the language, and claiming otherwise would be wrong
   * about the music the site actually plays.
   */
  description:
    "Three moods from Tulu Nadu — the coast road, a torchlit daiva nema and an all-night Yakshagana stage — each with its own playlist on YouTube Music.",
  descriptionTulu:
    "ತುಳುನಾಡ್‌ದ ಮೂಜಿ ಮೂಡ್, ಒಂಜೊಂಜಿಗ್ ಒಂಜಿ ಪಾಟ್‌ದ ಪಟ್ಟಿ. YouTube Music‌ಡ್ ಕೇನುಲೆ.",
  /**
   * The page is Tulu (tcy) written in Kannada script, and tcy-Knda is what it
   * should say. It doesn't, deliberately: no browser can do anything with tcy.
   * Chrome's translator reports `unavailable` for both tcy and tcy-Knda while
   * kn is `downloadable`, so declaring the accurate tag costs a reader the
   * translate prompt entirely and buys nothing — and no screen reader has a
   * Tulu voice either, so a Kannada one reading Kannada glyphs is as close as
   * this text can get to being pronounced correctly.
   *
   * So the browser-facing tags say Kannada and the machine-readable claim stays
   * honest: StructuredData still publishes inLanguage: tcy-Knda, which is the
   * signal search engines actually index. Revisit if Chrome ever ships tcy.
   */
  locale: "kn_IN",
  htmlLang: "kn-IN",
  altLocale: "en_IN",
  themeColor: "#0d2a30",
  backgroundColor: "#071a1f",
  keywords: [
    "Namma Kudla",
    "ನಮ್ಮ ಕುಡ್ಲ",
    "Kudla",
    "Tulu songs",
    "Tulu playlist",
    "ತುಳು ಪಾಟ್",
    "Tulunad",
    "Mangaluru",
    "Mangalore music",
    "Yakshagana",
    "daiva nema",
    "Udupi",
    "mood radio",
  ],
} as const;

export const AUTHOR = {
  name: "Subramanya Rao",
  jobTitle: "Software developer",
  location: "Bengaluru, Karnataka, India",
  /** Primary identity URL used as the author's canonical `@id` in JSON-LD. */
  url: "https://subramanyarao.hashnode.dev",
  twitterHandle: "@Subramanya11rao",
  links: {
    linkedin: "https://www.linkedin.com/in/subramanya11/",
    github: "https://github.com/Subramanyarao11",
    hashnode: "https://subramanyarao.hashnode.dev",
    x: "https://x.com/Subramanya11rao",
  },
} as const;

/** Every profile, in the order search engines like to see them listed. */
export const AUTHOR_PROFILES = [
  { label: "GitHub", href: AUTHOR.links.github },
  { label: "LinkedIn", href: AUTHOR.links.linkedin },
  { label: "X", href: AUTHOR.links.x },
  { label: "Hashnode", href: AUTHOR.links.hashnode },
] as const;

export const DEFAULT_TITLE = `${SITE.nameTulu} — ${SITE.nameLatin} · Tulu Nadu mood radio`;

/**
 * The tab title tracks the mood the listener picked, in both scripts, so a
 * pinned tab or a shared link says which corner of Tulu Nadu it opens on.
 */
export function titleForStation(station: Station): string {
  return `${station.nameTulu} — ${station.nameEnglish} · ${SITE.nameTulu}`;
}

export function descriptionForStation(station: Station): string {
  const providers = hasSpotify(station) ? "Spotify and YouTube Music" : "YouTube Music";
  return `${station.description} ${station.nameEnglish} is one of the mood stations on ${SITE.nameTulu} (${SITE.nameLatin}) — playlists from the Tulu Nadu coast on ${providers}.`;
}
