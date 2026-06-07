import type { LiveList, LiveObject } from "@liveblocks/client";

export type Shape = LiveObject<{
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
}>;

declare global {
  interface Liveblocks {
    // Per-user transient state for multi-user selection.
    Presence: {
      selectedShapeId: string | null;
      color: string;
    };
    // The Storage tree for the room.
    Storage: {
      shapes: LiveList<LiveObject<{ id: string; x: number; y: number; width: number; height: number; fill: string }>>;
    };
    // Per-user info (color, name, ...).
    UserMeta: {
      id?: string;
      info?: {
        color?: string;
      };
    };
  }
}

export {};
