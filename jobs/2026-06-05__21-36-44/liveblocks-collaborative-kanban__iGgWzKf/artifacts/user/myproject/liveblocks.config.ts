import { createClient, LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

// Storage shape
type Column = LiveObject<{
  id: string;
  title: string;
  cardIds: LiveList<string>;
}>;

type Card = LiveObject<{
  id: string;
  title: string;
  description: string;
  assignee: string;
}>;

type Storage = {
  columns: LiveList<Column>;
  cards: LiveMap<string, Card>;
};

type Presence = Record<string, never>;
type UserMeta = Record<string, never>;
type RoomEvent = never;
type ThreadMetadata = never;

export const {
  RoomProvider,
  useStorage,
  useMutation,
  useRoom,
  useMyPresence,
  useOthers,
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent, ThreadMetadata>(client);
