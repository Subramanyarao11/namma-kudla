import { AUTHOR } from "@/lib/site";

/**
 * One byline, not a link farm. Every profile is still claimed for search
 * engines through the `rel="me"` links in the document head and the author's
 * `sameAs` array in the JSON-LD graph — none of which needs to crowd the
 * corner of the artwork to count.
 */
export function Footer() {
  return (
    <footer className="pointer-events-none fixed bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-[max(0.75rem,env(safe-area-inset-left))] z-10 hidden max-w-[240px] sm:block lg:max-w-[280px]">
      {/* REVIEW (Tulu): intended as "careful on the ghat road. Only the songs
          are unlimited." */}
      <p className="font-kannada text-[10px] leading-snug text-amber-100/40">
        ಗಟ್ಟದ ರೋಡ್‌ಡ್ ಜಾಗ್ರತೆ. ಪಾಟ್ ಮಾತ್ರ unlimited.
      </p>
      <a
        href={AUTHOR.links.x}
        target="_blank"
        rel="author me noopener noreferrer"
        className="pointer-events-auto mt-1 inline-block text-[10px] text-amber-100/50 underline decoration-amber-100/25 underline-offset-[3px] transition-colors hover:text-amber-50 hover:decoration-amber-100/60"
        lang="en"
      >
        Built by {AUTHOR.name}
      </a>
    </footer>
  );
}
