/**
 * Minimal Liveblocks types for the active-users-list task. The room only
 * tracks presence (which is empty by default) and per-user info — the page
 * does not write any Storage state.
 */
export type Presence = Record<string, never>;

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
