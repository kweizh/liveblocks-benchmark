/**
 * Liveblocks types for the emoji-reaction broadcast task.
 *
 * The executor must broadcast and receive `RoomEvent` payloads of shape
 * `{ type: "EMOJI"; emoji: string }` using `useBroadcastEvent` and
 * `useEventListener` from `@liveblocks/react/suspense`.
 */
export type Presence = Record<string, never>;

export type Storage = Record<string, never>;

export type UserMeta = {
  id?: string;
  info?: { name?: string };
};

export type RoomEvent =
  | { type: "EMOJI"; emoji: string };

declare global {
  interface Liveblocks {
    Presence: Presence;
    Storage: Storage;
    UserMeta: UserMeta;
    RoomEvent: RoomEvent;
  }
}
