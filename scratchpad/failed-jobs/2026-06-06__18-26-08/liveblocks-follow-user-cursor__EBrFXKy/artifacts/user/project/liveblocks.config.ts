/**
 * Presence layout for the follow-user-cursor page.
 *
 * The executor must use these types together with `useMyPresence` /
 * `useUpdateMyPresence` to broadcast their own cursor + name and with
 * `useOthers` to read the other users' presence and connectionId.
 */
export type Cursor = { x: number; y: number };

export type Presence = {
  name: string;
  cursor: Cursor | null;
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
