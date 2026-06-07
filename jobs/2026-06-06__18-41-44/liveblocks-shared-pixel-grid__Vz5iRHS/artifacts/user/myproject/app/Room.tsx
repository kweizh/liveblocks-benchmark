"use client";

import { ReactNode } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { LiveMap } from "@liveblocks/client";
import { PixelGrid } from "./PixelGrid";

export function Room() {
  const roomId = `pixel-grid-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "default"}`;

  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{}}
        initialStorage={{
          pixels: new LiveMap<string, string>(),
        }}
      >
        <ClientSideSuspense fallback={<div>Loading...</div>}>
          <PixelGrid />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
