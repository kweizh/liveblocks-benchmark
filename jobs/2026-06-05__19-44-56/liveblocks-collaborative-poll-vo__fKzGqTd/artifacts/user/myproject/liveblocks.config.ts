import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";

export type Option = LiveObject<{
  id: string;
  label: string;
}>;

export type Poll = LiveObject<{
  question: string;
  options: LiveList<Option>;
}>;

export type Presence = {};

export type Storage = {
  poll: Poll;
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

export type ThreadMetadata = never;

declare module "@liveblocks/react" {
  interface Liveblocks {
    Presence: Presence;
    Storage: Storage;
    UserMeta: UserMeta;
    RoomEvent: RoomEvent;
    ThreadMetadata: ThreadMetadata;
  }
}
