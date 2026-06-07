import { createClient, LiveObject } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

// Storage shape
type Storage = {
  form: LiveObject<{
    name: string;
    email: string;
    bio: string;
  }>;
};

// Presence shape
type Presence = {
  typing: "name" | "email" | "bio" | null;
  info: {
    name: string;
  };
};

type UserMeta = {
  id?: string;
  info?: {
    name?: string;
  };
};

type RoomEvent = never;
type ThreadMetadata = never;

const {
  RoomProvider,
  suspense: {
    useStorage,
    useMutation,
    useOthers,
    useUpdateMyPresence,
  },
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client);

export {
  RoomProvider,
  useStorage,
  useMutation,
  useOthers,
  useUpdateMyPresence,
};
