"use client";

import { ReactNode } from "react";
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react/suspense";

export function Providers({ children }: { children: ReactNode }) {
  const roomId = `color-picker-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID}`;
  const publicKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY;

  return (
    <LiveblocksProvider 
      authEndpoint="/api/liveblocks-auth"
    >
      <RoomProvider id={roomId} initialPresence={{ color: "#000000" }}>
        <ClientSideSuspense fallback={<div>Loading...</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
