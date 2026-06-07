"use client";

import { ClientSideSuspense, RoomProvider, LiveblocksProvider } from "@liveblocks/react";
import { ReactNode } from "react";

const roomId = `color-picker-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID}`;

export function LiveblocksRoom({ children }: { children: ReactNode }) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id={roomId} initialPresence={{ color: "#000000" }}>
        <ClientSideSuspense fallback={null}>
          {() => children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}