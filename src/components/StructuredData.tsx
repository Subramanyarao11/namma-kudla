import { LISTED_STATIONS } from "@/data/stations";
import { AUTHOR, AUTHOR_PROFILES, SITE } from "@/lib/site";
import { getSiteUrl } from "@/lib/site-url";

/**
 * A single JSON-LD graph describing the site, its author and the mood
 * playlists. The author node carries every profile under `sameAs`, which is
 * what lets search engines tie this page to the same person as the GitHub,
 * LinkedIn, X and Hashnode accounts.
 *
 * Server-rendered on purpose: it reads the deployment URL from the environment.
 */
export function StructuredData() {
  const siteUrl = getSiteUrl();
  const authorId = `${siteUrl}/#author`;
  const siteId = `${siteUrl}/#website`;

  const graph = [
    {
      "@type": "Person",
      "@id": authorId,
      name: AUTHOR.name,
      url: AUTHOR.url,
      jobTitle: AUTHOR.jobTitle,
      homeLocation: { "@type": "Place", name: AUTHOR.location },
      sameAs: AUTHOR_PROFILES.map((profile) => profile.href),
    },
    {
      "@type": "WebSite",
      "@id": siteId,
      url: `${siteUrl}/`,
      name: `${SITE.nameTulu} — ${SITE.nameLatin}`,
      alternateName: [SITE.nameLatin, SITE.nameTulu],
      description: SITE.description,
      /* Tulu (tcy) in Kannada script, plus the English copy on the page. */
      inLanguage: ["tcy-Knda", "en-IN"],
      author: { "@id": authorId },
      creator: { "@id": authorId },
      publisher: { "@id": authorId },
      copyrightHolder: { "@id": authorId },
      about: { "@type": "Place", name: "Tulu Nadu, coastal Karnataka, India" },
    },
    {
      "@type": "WebApplication",
      "@id": `${siteUrl}/#app`,
      name: `${SITE.nameTulu} — ${SITE.nameLatin}`,
      url: `${siteUrl}/`,
      applicationCategory: "MultimediaApplication",
      browserRequirements: "Requires JavaScript",
      operatingSystem: "Any",
      isPartOf: { "@id": siteId },
      author: { "@id": authorId },
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
    },
    {
      "@type": "ItemList",
      "@id": `${siteUrl}/#moods`,
      name: "Mood stations",
      numberOfItems: LISTED_STATIONS.length,
      itemListElement: LISTED_STATIONS.map((station, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "MusicPlaylist",
          name: `${station.nameTulu} — ${station.nameEnglish}`,
          description: station.description,
          inLanguage: "tcy-Knda",
          /* Whichever provider the mood actually has. Naming the Spotify URL
             unconditionally emitted `undefined` for YouTube-only moods. */
          url: station.spotifyPlaylistUrl ?? station.youtubePlaylistUrl,
          sameAs: [station.spotifyPlaylistUrl, station.youtubePlaylistUrl].filter(Boolean),
        },
      })),
    },
  ];

  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
