"use client";

import { useEffect } from "react";
import type { Station } from "@/data/stations";
import { DEFAULT_TITLE, SITE, descriptionForStation, titleForStation } from "@/lib/site";

const MIRRORED = [
  'meta[name="description"]',
  'meta[property="og:title"]',
  'meta[property="og:description"]',
  'meta[name="twitter:title"]',
  'meta[name="twitter:description"]',
] as const;

function write(selector: string, value: string) {
  const tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (tag) tag.content = value;
}

/**
 * Retitles the tab for the mood the listener picked, in Tulu and English, so a
 * pinned tab or a copied link names the corner of the coast it opens on.
 * The server-rendered defaults stay untouched until someone chooses — crawlers
 * and link unfurlers only ever see those.
 */
export function useDocumentMeta(station: Station, hasChosen: boolean) {
  useEffect(() => {
    const title = hasChosen ? titleForStation(station) : DEFAULT_TITLE;
    const description = hasChosen ? descriptionForStation(station) : SITE.description;

    document.title = title;
    for (const selector of MIRRORED) {
      write(selector, selector.includes("description") ? description : title);
    }
  }, [station, hasChosen]);
}
