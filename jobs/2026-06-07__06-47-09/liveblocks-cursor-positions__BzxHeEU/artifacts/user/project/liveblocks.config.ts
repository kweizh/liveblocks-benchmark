/**
 * Presence layout for the live-cursors page.
 *
 * Each connected user broadcasts a `cursor` value through Liveblocks Presence.
 * The cursor is either `null` (pointer not inside the cursors container) or
 * an object `{ x: number; y: number }` of integer pixel coordinates measured
 * in the local space of the cursors container.
 */
export type Presence = {
  cursor: { x: number; y: number } | null;
};

export type Storage = Record<string, never>;

export type UserMeta = {
  id?: string;
  info?: { name?: string };
};

declare global {
  interface Liveblocks {
    Presence: Presence;
    Storage: Storage;
    UserMeta: UserMeta;
  }
}

export {};
