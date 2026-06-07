import type { LiveObject } from "@liveblocks/client";

/**
 * Storage layout for the shared stopwatch.
 *
 *   root.stopwatch: LiveObject<{
 *     running: boolean;
 *     startedAt: number | null;   // ms epoch when the stopwatch was started
 *     accumulatedMs: number;      // accumulated runtime across stop/start
 *   }>
 *
 * The executor must use this type together with `useMutation` / `useStorage`
 * from `@liveblocks/react` to read and write Storage.
 */
export type StopwatchState = {
  running: boolean;
  startedAt: number | null;
  accumulatedMs: number;
};

export type Storage = {
  stopwatch: LiveObject<StopwatchState>;
};

export type Presence = Record<string, never>;

export type UserMeta = {
  id?: string;
  info?: { name?: string };
};

declare global {
  interface Liveblocks {
    Storage: Storage;
    Presence: Presence;
    UserMeta: UserMeta;
  }
}
