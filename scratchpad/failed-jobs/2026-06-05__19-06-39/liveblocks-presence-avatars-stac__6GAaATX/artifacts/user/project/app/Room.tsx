"use client";

import { ReactNode } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";

export function Room({ roomId, children }: { roomId: string; children: ReactNode }) {
  return (
    <LiveblocksProvider
      authEndpoint="/api/liveblocks-auth"
    >
      <RoomProvider id={roomId} initialPresence={{}}>
        {children}
      </RoomProvider>
    </LiveblocksProvider>
  );
}
