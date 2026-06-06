import type { LiveList, LiveObject } from "@liveblocks/client";

declare global {
  interface Liveblocks {
    Presence: Record<string, never>;
    Storage: {
      todos: LiveList<LiveObject<{ id: string; text: string; done: boolean }>>;
    };
    UserMeta: {
      id: string;
      info: { name: string };
    };
    RoomEvent: Record<string, never>;
    ThreadMetadata: Record<string, never>;
    RoomInfo: Record<string, never>;
  }
}

export {};
