import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!,
});

type Presence = {};

type Storage = {
  likes: number;
};

type UserMeta = {};
type RoomEvent = {};
type ThreadMetadata = {};

export const {
  suspense: {
    RoomProvider,
    useStorage,
    useMutation,
  },
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent, ThreadMetadata>(client);
