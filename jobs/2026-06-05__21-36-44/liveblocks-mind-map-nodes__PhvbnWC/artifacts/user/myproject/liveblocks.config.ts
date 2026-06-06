import { createClient, LiveMap, LiveObject } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

export type MindMapNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  parentId: string | null;
};

type Presence = {
  cursor: { x: number; y: number } | null;
};

type Storage = {
  nodes: LiveMap<string, LiveObject<MindMapNode>>;
};

type UserMeta = {
  id?: string;
  info?: {
    name?: string;
  };
};

type RoomEvent = never;

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useUpdateMyPresence,
  useStorage,
  useMutation,
  useOthers,
  useOthersMapped,
  useSelf,
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client);
