import { createClient, LiveMap } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

type Presence = Record<string, never>;

type Storage = {
  pixels: LiveMap<string, string>;
};

type UserMeta = {
  id?: string;
  info?: Record<string, never>;
};

type RoomEvent = never;

export const {
  suspense: {
    RoomProvider,
    useStorage,
    useMutation,
  },
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client);
