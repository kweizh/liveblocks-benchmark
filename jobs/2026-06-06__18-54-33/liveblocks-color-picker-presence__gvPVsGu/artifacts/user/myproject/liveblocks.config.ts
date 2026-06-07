import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

// Presence shape for each connected user
export type Presence = {
  color: string;
};

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

const {
  RoomProvider,
  useMyPresence,
  useUpdateMyPresence,
  useOthers,
  useSelf,
} = createRoomContext<Presence>(client);

export {
  RoomProvider,
  useMyPresence,
  useUpdateMyPresence,
  useOthers,
  useSelf,
};
