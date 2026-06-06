import { createClient, LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

export const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

export type Column = {
  id: string;
  title: string;
  cardIds: LiveList<string>;
};

export type Card = {
  id: string;
  title: string;
  description: string;
  assignee: string;
};

export type Storage = {
  columns: LiveList<LiveObject<Column>>;
  cards: LiveMap<string, LiveObject<Card>>;
};

export const {
  RoomProvider,
  useRoom,
  useStorage,
  useMutation,
  useOthers,
} = createRoomContext<
  {}, // Presence
  Storage, // Storage
  {}, // UserMeta
  {}, // RoomEvent
  {}  // ThreadMetadata
>(client);
