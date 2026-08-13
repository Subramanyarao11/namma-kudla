"use client";

import { useCallback, useSyncExternalStore } from "react";

export function readPersistedValue(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

type Listener = () => void;
const keyListeners = new Map<string, Set<Listener>>();

function notify(key: string): void {
  keyListeners.get(key)?.forEach((listener) => listener());
}

export function writePersistedValue(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* localStorage may be unavailable (private mode, quota) — fail silently */
  }
  notify(key);
}

export const STORAGE_KEYS = {
  station: "nbr:station",
  provider: "nbr:provider",
} as const;

/**
 * Reactively reads a persisted value via useSyncExternalStore, so the server-rendered
 * default and the client's first paint stay in sync without a hydration mismatch —
 * React reconciles the difference right after hydration automatically.
 */
export function usePersistedValue(key: string): string | null {
  const subscribe = useCallback(
    (callback: Listener) => {
      if (!keyListeners.has(key)) keyListeners.set(key, new Set());
      keyListeners.get(key)!.add(callback);

      const handleStorageEvent = (event: StorageEvent) => {
        if (event.key === key) callback();
      };
      window.addEventListener("storage", handleStorageEvent);

      return () => {
        keyListeners.get(key)?.delete(callback);
        window.removeEventListener("storage", handleStorageEvent);
      };
    },
    [key],
  );

  const getSnapshot = useCallback(() => readPersistedValue(key), [key]);
  const getServerSnapshot = useCallback(() => null, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
