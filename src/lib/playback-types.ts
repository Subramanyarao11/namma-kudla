export type PlaybackStatus =
  | "idle"
  | "loading"
  | "cued"
  | "playing"
  | "paused"
  | "ended"
  | "error";

export interface TrackInfo {
  title: string | null;
  artist: string | null;
  artworkUrl: string | null;
}

export interface PlaybackState extends TrackInfo {
  status: PlaybackStatus;
  positionSeconds: number;
  durationSeconds: number;
  canSkipNext: boolean;
  canSkipPrevious: boolean;
  errorMessage: string | null;
}

export interface PlaybackControls {
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
}

export const IDLE_PLAYBACK_STATE: PlaybackState = {
  status: "idle",
  positionSeconds: 0,
  durationSeconds: 0,
  title: null,
  artist: null,
  artworkUrl: null,
  canSkipNext: false,
  canSkipPrevious: false,
  errorMessage: null,
};
