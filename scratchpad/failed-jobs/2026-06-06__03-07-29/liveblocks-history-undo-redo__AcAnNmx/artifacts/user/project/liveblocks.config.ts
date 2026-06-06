import type { LiveList } from "@liveblocks/client";

/**
 * Storage layout for the collaborative color palette.
 *
 * `palette` is a LiveList of CSS-color strings. The executor must use this
 * type together with `useStorage`/`useMutation` to read and write the list,
 * and wire up history (undo / redo / pause / resume) on top.
 */
export type Storage = {
  palette: LiveList<string>;
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
