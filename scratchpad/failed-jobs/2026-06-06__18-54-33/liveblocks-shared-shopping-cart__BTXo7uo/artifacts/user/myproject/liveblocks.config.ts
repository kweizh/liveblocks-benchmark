import { createClient, LiveList, LiveObject } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!,
});

export type CartItem = {
  id: string;
  name: string;
  qty: number;
};

type Storage = {
  cart: LiveList<LiveObject<CartItem>>;
};

type Presence = Record<string, never>;
type UserMeta = Record<string, never>;
type RoomEvent = never;

export const {
  RoomProvider,
  useStorage,
  useMutation,
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client);
