import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import { LiveList, LiveObject, LiveMap } from "@liveblocks/client";

export const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

// Storage types
export type Column = {
  id: string;
  title: string;
  cardIds: LiveList<string>;
};

export type Card = {
  id: string;
  title: string;
  description: string;
  assignee: string;
};

export type Storage = {
  columns: LiveList<LiveObject<Column>>;
  cards: LiveMap<string, LiveObject<Card>>;
};

export const initialStorage: Storage = {
  columns: new LiveList([
    new LiveObject({ id: "todo", title: "To Do", cardIds: new LiveList<string>([]) }),
    new LiveObject({
      id: "in-progress",
      title: "In Progress",
      cardIds: new LiveList<string>([]),
    }),
    new LiveObject({ id: "done", title: "Done", cardIds: new LiveList<string>([]) }),
  ]),
  cards: new LiveMap(),
};

// Presence types
export type Presence = {
  // No presence state needed for this app
};

export const {
  RoomProvider,
  useStorage,
  useMutation,
} = createRoomContext<Presence, Storage>(client);