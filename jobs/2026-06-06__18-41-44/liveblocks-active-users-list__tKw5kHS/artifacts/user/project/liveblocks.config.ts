/**
 * Liveblocks v2 type declarations for the active-users-list task.
 *
 * Each connected user sets a Presence `name` field shaped as
 * `User-<connectionId>`. UserMeta is unused; the auth endpoint mints
 * anonymous sessions.
 */
export type Presence = {
  name: string | null;
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
