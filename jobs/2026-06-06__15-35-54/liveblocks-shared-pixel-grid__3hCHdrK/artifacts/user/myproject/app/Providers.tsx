"use client";

import { ReactNode } from "react";
import { LiveblocksProvider, RoomProvider } from "@liveblocks/react";
import { ClientSideSuspense } from "@liveblocks/react/suspense";
import { LiveMap } from "@liveblocks/client";

export function Providers({ children }: { children: ReactNode }) {
  const runId = process.env.NEXT_PUBLIC_ZEALT_RUN_ID;
  const roomId = `pixel-grid-${runId}`;

  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialStorage={{
          pixels: new LiveMap<string, string>(),
        }}
      >
        <ClientSideSuspense fallback={<div className="flex items-center justify-center min-h-screen">Loading grid...</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
