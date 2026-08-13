import "server-only";

/**
 * Canonical origin for canonical tags, Open Graph URLs, the sitemap and robots.
 *
 * Set NEXT_PUBLIC_SITE_URL once a custom domain exists; until then every Vercel
 * deployment, preview included, describes itself correctly on its own URL.
 *
 * Server-only by design: the Vercel variables are not exposed to the browser,
 * so calling this during client render would silently fall back to localhost.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}
