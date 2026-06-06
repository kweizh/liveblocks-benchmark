declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      // The viewport field MUST be filled in by the executor as part of the task.
      viewport?: { scrollX: number; scrollY: number };
    };
    Storage: {};
    UserMeta: { id: string; info: { name: string; color: string } };
    RoomEvent: {};
    ThreadMetadata: {};
    RoomInfo: {};
  }
}

export {};
