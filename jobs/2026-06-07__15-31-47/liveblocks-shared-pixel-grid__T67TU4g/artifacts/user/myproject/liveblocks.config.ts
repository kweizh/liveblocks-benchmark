import { createClient, LiveMap } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

type Presence = {};

type Storage = {
  pixels: LiveMap<string, string>;
};

type UserMeta = {};
type RoomEvent = never;
type ThreadMetadata = never;

export const {
  suspense: {
    RoomProvider,
    useStorage,
    useMutation,
  },
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client);
