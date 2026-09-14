export type PlaybackMode = 0 | 1 | 2 | 3;

type TrackLike = {
  id?: number | string;
  title?: string;
  name?: string;
  [key: string]: any;
};

export const shuffleTracks = <T>(tracks: T[]): T[] => {
  const shuffled = [...tracks];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
};

const isSameTrack = (candidate: TrackLike, current: TrackLike) =>
  (candidate.id !== undefined && candidate.id === current.id) ||
  (candidate.title ?? candidate.name) === (current.title ?? current.name);

/**
 * Mode 0: current track only, with no automatic continuation.
 * Mode 1: ordered continuation.
 * Mode 2: shuffled continuation.
 * Mode 3: current track only, repeated by the player state handler.
 */
export const buildPlaybackQueue = <T extends TrackLike>(
  tracks: T[],
  mode: PlaybackMode,
  currentTrack?: T | null,
): T[] => {
  if (!Array.isArray(tracks) || tracks.length === 0) return [];

  const currentIndex = currentTrack
    ? tracks.findIndex((track) => isSameTrack(track, currentTrack))
    : -1;

  if (mode === 0 || mode === 3) {
    return currentTrack ? [] : [tracks[0]];
  }

  const remaining = currentIndex >= 0 ? tracks.slice(currentIndex + 1) : tracks;
  return mode === 2 ? shuffleTracks(remaining) : remaining;
};
