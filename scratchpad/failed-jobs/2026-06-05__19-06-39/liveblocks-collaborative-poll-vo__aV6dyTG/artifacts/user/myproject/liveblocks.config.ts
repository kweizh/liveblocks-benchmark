import { createClient, LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

export type Presence = {
  // Add user presence if needed, but not strictly required by spec
};

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

export type RoomEvent = {};

export type ThreadMetadata = {};

export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useUpdateMyPresence,
  useSelf,
  useOthers,
  useStorage,
  useMutation,
  suspense: {
    RoomProvider: SuspenseRoomProvider,
    useRoom: useSuspenseRoom,
    useMyPresence: useSuspenseMyPresence,
    useUpdateMyPresence: useSuspenseUpdateMyPresence,
    useSelf: useSuspenseSelf,
    useOthers: useSuspenseOthers,
    useStorage: useSuspenseStorage,
    useMutation: useSuspenseMutation,
  }
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent, ThreadMetadata>(client);
