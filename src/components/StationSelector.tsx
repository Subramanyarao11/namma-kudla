"use client";

import { useEffect, useRef } from "react";
import { STATIONS, type Station } from "@/data/stations";
import { SelectorBackdrop } from "./SelectorBackdrop";
import { StationIcon } from "./scene/StationIcon";

interface StationSelectorProps {
  isOpen: boolean;
  activeStationId: string;
  onSelect: (station: Station) => void;
  onClose: () => void;
}

export function StationSelector({ isOpen, activeStationId, onSelect, onClose }: StationSelectorProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    firstButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 animate-overlay-fade bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Choose a mood station"
        className="animate-sheet-enter fixed inset-x-0 bottom-0 z-50 max-h-[78vh] overflow-x-hidden overflow-y-auto thin-scrollbar rounded-t-3xl border-t border-white/15 shadow-[0_-20px_60px_rgba(0,0,0,0.5)] sm:animate-panel-enter sm:bottom-[168px] sm:left-1/2 sm:inset-x-auto sm:w-[92vw] sm:max-w-[680px] sm:-translate-x-1/2 sm:rounded-3xl sm:border"
      >
        <SelectorBackdrop variant="sheet" />
        <div className="relative z-10 p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-5 sm:pb-5">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
          <div className="mb-3 flex items-center justify-between">
            {/* REVIEW (Tulu): intended as "choose a mood". */}
            <h2 className="font-kannada kn-optical text-base font-semibold text-amber-50">ಮೂಡ್ ಆಯ್ಕೆ ಮಲ್ಪುಲೆ</h2>
            {/* Pulled out by half the button's slack so the glyph, not the
                invisible tap target, lines up with the cards' right edge. */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close mood selector"
              className="-mr-2.5 flex h-9 w-9 items-center justify-center rounded-full text-amber-100/70 transition-colors hover:bg-white/10 hover:text-amber-50"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {STATIONS.map((station, index) => {
              const isActive = station.id === activeStationId;
              return (
                <button
                  key={station.id}
                  ref={index === 0 ? firstButtonRef : undefined}
                  type="button"
                  onClick={() => onSelect(station)}
                  aria-pressed={isActive}
                  className={`group flex min-h-[44px] items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all ${
                    isActive
                      ? "border-white/30"
                      : "border-white/10 hover:-translate-y-0.5 hover:border-white/25"
                  }`}
                  style={{
                    // Each card carries a hint of its own mood colour, so the
                    // list reads as three places rather than three grey rows.
                    backgroundImage: `linear-gradient(135deg, ${station.theme.accent}${isActive ? "30" : "1c"} 0%, rgba(255,255,255,0.03) 65%)`,
                    boxShadow: isActive
                      ? `0 0 0 1.5px ${station.theme.accent}80, 0 10px 28px -10px ${station.theme.accent}66`
                      : undefined,
                  }}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${station.theme.accent}26`, color: station.theme.accent }}
                  >
                    <StationIcon variant={station.backgroundVariant} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-sm">
                      <span className="font-kannada truncate font-semibold text-amber-50">
                        {station.nameTulu}
                      </span>
                      {isActive && (
                        <span
                          className="kn-optical-icon inline-flex h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: station.theme.accent }}
                          aria-hidden="true"
                        />
                      )}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-amber-100/65 line-clamp-2" lang="en">
                      {station.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
