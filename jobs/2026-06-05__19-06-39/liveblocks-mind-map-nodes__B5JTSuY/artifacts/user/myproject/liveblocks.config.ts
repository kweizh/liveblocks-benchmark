import { LiveMap, LiveObject } from "@liveblocks/client";

export type MindMapNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  parentId: string | null;
};

declare global {
  interface Liveblocks {
    Presence: {};
    Storage: {
      nodes: LiveMap<string, LiveObject<MindMapNode>>;
    };
  }
}
