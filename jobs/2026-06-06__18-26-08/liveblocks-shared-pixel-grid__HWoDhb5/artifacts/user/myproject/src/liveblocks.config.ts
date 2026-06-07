import { LiveMap } from "@liveblocks/client";

declare global {
  interface Liveblocks {
    Presence: {};
    Storage: {
      pixels: LiveMap<string, string>;
    };
    UserMeta: {
      id: string;
      info: {};
    };
    RoomEvent: {};
    ThreadMetadata: {};
    RoomInfo: {};
  }
}

export {};
