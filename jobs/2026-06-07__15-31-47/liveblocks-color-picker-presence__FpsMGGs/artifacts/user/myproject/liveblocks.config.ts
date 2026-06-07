import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

export type Presence = {
  color: string;
};

type Storage = Record<string, never>;
type UserMeta = Record<string, never>;
type RoomEvent = never;

export const {
  RoomProvider,
  useMyPresence,
  useUpdateMyPresence,
  useOthers,
  useSelf,
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client);
