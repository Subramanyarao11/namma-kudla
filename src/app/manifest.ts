import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.nameTulu} — ${SITE.nameLatin}`,
    short_name: SITE.shortName,
    description: SITE.description,
    lang: SITE.htmlLang,
    dir: "auto",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: SITE.backgroundColor,
    theme_color: SITE.themeColor,
    categories: ["music", "entertainment"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
