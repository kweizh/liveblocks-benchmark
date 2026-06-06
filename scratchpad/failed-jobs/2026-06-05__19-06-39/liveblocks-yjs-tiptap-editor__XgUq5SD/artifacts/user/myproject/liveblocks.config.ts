declare global {
  interface Liveblocks {
    Presence: Record<string, never>;
    Storage: Record<string, never>;
    UserMeta: {
      id: string;
      info: {
        name: string;
        color: string;
      };
    };
    RoomEvent: Record<string, never>;
    ThreadMetadata: Record<string, never>;
    RoomInfo: Record<string, never>;
  }
}

export {};
