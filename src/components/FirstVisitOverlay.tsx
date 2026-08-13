"use client";

import { useEffect, useRef } from "react";
import { STATIONS, type Station } from "@/data/stations";
import { SelectorBackdrop } from "./SelectorBackdrop";
import { StationIcon } from "./scene/StationIcon";

interface FirstVisitOverlayProps {
  isOpen: boolean;
  lastStationId: string | null;
  onSelect: (station: Station) => void;
}

export function FirstVisitOverlay({ isOpen, lastStationId, onSelect }: FirstVisitOverlayProps) {
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) firstButtonRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose a mood to begin"
      className="animate-overlay-fade fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-5"
    >
      <SelectorBackdrop variant="overlay" priority />
      <div className="relative z-10 w-full max-w-2xl text-center">
        <p
          className="font-kannada mb-2 text-3xl font-semibold text-amber-50 sm:text-4xl"
          style={{ textShadow: "0 2px 24px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.9)" }}
        >
          ಒಂಜಿ mood ಆಯ್ಕೆ ಮಲ್ಪುಲೆ.
        </p>
        <p
          className="mb-8 text-xs text-amber-100/70 sm:text-sm"
          lang="en"
          style={{ textShadow: "0 1px 12px rgba(0,0,0,0.8)" }}
        >
          Pick a mood to start listening
        </p>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {STATIONS.map((station, index) => {
            const isLast = station.id === lastStationId;
            return (
              <button
                key={station.id}
                ref={index === 0 ? firstButtonRef : undefined}
                type="button"
                onClick={() => onSelect(station)}
                className="group flex min-h-[44px] items-center gap-3.5 rounded-2xl border border-white/15 px-4 py-4 text-left backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-white/30"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${station.theme.accent}2e 0%, rgba(10,5,16,0.55) 70%)`,
                  boxShadow: `inset 0 0 0 1px ${station.theme.accent}26, 0 10px 30px -12px rgba(0,0,0,0.7)`,
                }}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${station.theme.accent}33`, color: station.theme.accent }}
                >
                  <StationIcon variant={station.backgroundVariant} className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-kannada block truncate text-[15px] font-semibold text-amber-50">
                    {station.nameTulu}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-amber-100/60 line-clamp-2" lang="en">
                    {isLast ? "Continue where you left off" : station.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
