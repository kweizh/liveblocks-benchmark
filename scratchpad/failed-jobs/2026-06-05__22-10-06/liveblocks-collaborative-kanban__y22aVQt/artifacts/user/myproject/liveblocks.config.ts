import { createClient, LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

export const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

type Card = {
  id: string;
  title: string;
  description: string;
  assignee: string;
};

type Column = {
  id: string;
  title: string;
  cardIds: LiveList<string>;
};

type Storage = {
  columns: LiveList<LiveObject<Column>>;
  cards: LiveMap<string, LiveObject<Card>>;
};

export const {
  RoomProvider,
  useStorage,
  useMutation,
  useSelf,
  useOthers,
  /* ...all other hooks you may need */
} = createRoomContext<never, Storage>(client);
