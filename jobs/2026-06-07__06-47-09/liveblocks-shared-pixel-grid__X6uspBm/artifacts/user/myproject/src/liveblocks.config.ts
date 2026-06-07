import { createClient, LiveMap } from "@liveblocks/client";
import { createRoomContext, createLiveblocksContext } from "@liveblocks/react";

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

type Presence = {};

type Storage = {
  pixels: LiveMap<string, string>;
};

type UserMeta = {};

type RoomEvent = {};

export const {
  suspense: {
    RoomProvider,
    useStorage,
    useMutation,
  },
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client);

export const {
  LiveblocksProvider,
} = createLiveblocksContext(client);
