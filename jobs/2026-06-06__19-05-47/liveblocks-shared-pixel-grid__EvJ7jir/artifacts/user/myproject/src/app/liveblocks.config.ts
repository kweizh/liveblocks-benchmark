import { LiveMap } from "@liveblocks/client";
import { createClient } from "@liveblocks/client";

const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!,
});

export type Presence = {};

export type Storage = {
  pixels: LiveMap<string, string>;
};

export type UserMeta = {};

export type RoomEvent = {};

export type ThreadMetadata = {};

declare module "@liveblocks/react" {
  interface LiveblocksProviderProps {
    // Using public API key instead
  }
}