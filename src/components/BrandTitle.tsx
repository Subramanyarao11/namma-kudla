import { SITE } from "@/lib/site";

export function BrandTitle() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-[16%] z-10 w-full max-w-[94vw] -translate-x-1/2 px-4 text-center sm:top-[18%] sm:max-w-[680px] md:top-[19%]">
      <h1
        className="font-kannada text-[7.4vw] font-bold leading-[1.12] tracking-tight text-[#fffaf0] sm:text-[2.9rem] md:text-[3.4rem]"
        style={{ textShadow: "0 2px 4px rgba(0,0,0,0.55), 0 10px 30px rgba(0,0,0,0.55), 0 1px 0 rgba(0,0,0,0.4)" }}
      >
        {SITE.heroTitleTulu}
      </h1>
      <p
        className="font-kannada mt-2 text-[3.6vw] font-medium text-[#ffe9bc] sm:text-base md:text-lg"
        style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6), 0 6px 18px rgba(0,0,0,0.5)" }}
      >
        {SITE.taglineTulu}
      </p>
    </div>
  );
}
