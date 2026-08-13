"use client";

import { useCallback, useState } from "react";
import { STATIONS, getStationById, hasSpotify, type ProviderId, type Station } from "@/data/stations";
import { STORAGE_KEYS, usePersistedValue, writePersistedValue } from "@/hooks/useLocalStorage";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { recordPlay, useVisitOnce } from "@/hooks/useStats";
import { SceneBackground } from "./scene/SceneBackground";
import { Header } from "./Header";
import { BrandTitle } from "./BrandTitle";
import { Footer } from "./Footer";
import { FirstVisitOverlay } from "./FirstVisitOverlay";
import { StationSelector } from "./StationSelector";
import { Player } from "./player/Player";

export function RadioApp() {
  const persistedStationId = usePersistedValue(STORAGE_KEYS.station);
  const persistedProvider = usePersistedValue(STORAGE_KEYS.provider);

  const [manualStationId, setManualStationId] = useState<string | null>(null);
  const [manualProvider, setManualProvider] = useState<ProviderId | null>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  const resolvedStationId =
    manualStationId ?? (persistedStationId && getStationById(persistedStationId) ? persistedStationId : null);
  const activeStation = getStationById(resolvedStationId ?? undefined) ?? STATIONS[0];

  /**
   * YouTube Music is the default rather than the fallback here: no mood in the
   * Tulu catalogue has a Spotify counterpart. The preference is still read and
   * honoured so that adding one Spotify playlist to stations.ts is the only
   * change needed to bring the switch back.
   */
  const preferredProvider: ProviderId =
    manualProvider ?? (persistedProvider === "spotify" ? "spotify" : "youtube");
  /**
   * A mood with no Spotify counterpart can only play on YouTube Music. The
   * listener's own preference is left untouched while that mood is on, so it
   * applies again the moment they pick one that does have both.
   */
  const isSpotifyAvailable = hasSpotify(activeStation);
  const activeProvider: ProviderId = isSpotifyAvailable ? preferredProvider : "youtube";

  useDocumentMeta(activeStation, hasEntered);
  useVisitOnce();

  const handleProviderChange = useCallback((provider: ProviderId) => {
    setManualProvider(provider);
    writePersistedValue(STORAGE_KEYS.provider, provider);
  }, []);

  const handleStationSelect = useCallback(
    (station: Station) => {
      setManualStationId(station.id);
      writePersistedValue(STORAGE_KEYS.station, station.id);
      setIsSelectorOpen(false);
      setHasEntered(true);
      // Counted here rather than in the player: this is the point where someone
      // chose the mood, which is the thing worth knowing. The player mounting is
      // a consequence, and remounts for reasons that are not a new play.
      recordPlay(station.id, hasSpotify(station) ? preferredProvider : "youtube");
    },
    [preferredProvider],
  );

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden">
      <SceneBackground station={activeStation} isCovered={!hasEntered} />
      <BrandTitle />
      <Header
        activeProvider={activeProvider}
        isSpotifyAvailable={isSpotifyAvailable}
        onProviderChange={handleProviderChange}
        listeningStationId={hasEntered ? activeStation.id : null}
      />

      {hasEntered && (
        <Player
          station={activeStation}
          provider={activeProvider}
          isSelectorOpen={isSelectorOpen}
          onOpenSelector={() => setIsSelectorOpen(true)}
        />
      )}

      <Footer station={activeStation} />

      <StationSelector
        isOpen={hasEntered && isSelectorOpen}
        activeStationId={activeStation.id}
        onSelect={handleStationSelect}
        onClose={() => setIsSelectorOpen(false)}
      />

      <FirstVisitOverlay
        isOpen={!hasEntered}
        lastStationId={resolvedStationId}
        onSelect={handleStationSelect}
      />
    </main>
  );
}
