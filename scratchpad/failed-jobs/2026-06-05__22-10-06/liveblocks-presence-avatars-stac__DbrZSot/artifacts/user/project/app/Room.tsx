"use client";

import { ReactNode } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY ?? "";

export function Room({ roomId, children }: { roomId: string; children: ReactNode }) {
  return (
    <LiveblocksProvider
      authEndpoint="/api/liveblocks-auth"
      publicApiKey={PUBLIC_KEY || undefined}
    >
      <RoomProvider id={roomId} initialPresence={{}}>
        <ClientSideSuspense fallback={<div>Connecting…</div>}>
          {() => <>{children}</>}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
