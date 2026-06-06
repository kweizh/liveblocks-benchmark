declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
    };
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