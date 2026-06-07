import type { LiveObject } from "@liveblocks/client";

/**
 * Storage layout for the collaborative form.
 *
 * `form` is a LiveObject of three text fields plus a `lastUpdate` ISO
 * timestamp. The executor must wire useStorage/useMutation on top so each
 * <input>/<textarea> is bound to its matching LiveObject field.
 */
export type Storage = {
  form: LiveObject<{
    name: string;
    email: string;
    message: string;
    lastUpdate: string;
  }>;
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
