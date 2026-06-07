import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

export const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY || "",
});

export type Storage = {
  count: number;
};

export const {
  RoomProvider,
  useStorage,
  useMutation,
} = createRoomContext<any, Storage, any, any>(client);
