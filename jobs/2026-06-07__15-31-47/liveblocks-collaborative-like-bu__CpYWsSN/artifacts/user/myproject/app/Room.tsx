"use client";

import { ReactNode } from "react";
import { RoomProvider } from "../liveblocks.config";
import { ClientSideSuspense } from "@liveblocks/react";

const roomId = `like-button-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID}`;

export function Room({ children }: { children: ReactNode }) {
  return (
    <RoomProvider id={roomId} initialPresence={{}} initialStorage={{ likes: 0 }}>
      <ClientSideSuspense fallback={<div>Loading…</div>}>
        {children}
      </ClientSideSuspense>
    </RoomProvider>
  );
}
