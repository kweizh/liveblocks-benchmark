import { createClient, LiveObject, LiveMap } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

export type MindMapNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  parentId: string | null;
};

type Storage = {
  nodes: LiveMap<string, LiveObject<MindMapNode>>;
};

type Presence = {
  // cursor?: { x: number; y: number };
};

export const {
  RoomProvider,
  useStorage,
  useMutation,
  useOthers,
  useSelf,
} = createRoomContext<Presence, Storage>(client);
