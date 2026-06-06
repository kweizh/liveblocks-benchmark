declare global {
  interface Liveblocks {
    Presence: { [key: string]: any };
    Storage: { [key: string]: any };
    UserMeta: {
      id: string;
      info: {
        name: string;
        color: string;
      };
    };
    RoomEvent: {};
    ThreadMetadata: {};
    RoomInfo: {};
  }
}

export {};
