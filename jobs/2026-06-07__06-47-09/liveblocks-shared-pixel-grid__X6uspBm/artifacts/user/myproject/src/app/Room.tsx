"use client";

import { ReactNode } from "react";
import { RoomProvider } from "../liveblocks.config";
import { LiveMap } from "@liveblocks/client";
import { ClientSideSuspense } from "@liveblocks/react";

export function Room({ children }: { children: ReactNode }) {
  const roomId = `pixel-grid-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID}`;

  return (
    <RoomProvider
      id={roomId}
      initialStorage={{
        pixels: new LiveMap<string, string>(),
      }}
    >
      <ClientSideSuspense fallback={<div>Loading…</div>}>
        {children}
      </ClientSideSuspense>
    </RoomProvider>
  );
}
