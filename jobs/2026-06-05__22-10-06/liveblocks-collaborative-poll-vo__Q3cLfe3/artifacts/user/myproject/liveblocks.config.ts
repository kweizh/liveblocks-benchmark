import { createClient, LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

export type Storage = {
  poll: LiveObject<{
    question: string;
    options: LiveList<LiveObject<{ id: string; label: string }>>;
  }>;
  votes: LiveMap<string, string>;
};

export type UserMeta = {
  id: string;
  info: {
    name: string;
    color: string;
    role: "owner" | "voter";
  };
};

export const {
  RoomProvider,
  useStorage,
  useMutation,
  useSelf,
  useOthers,
  /* ... */
} = createRoomContext<never, Storage, UserMeta, never>(client);
