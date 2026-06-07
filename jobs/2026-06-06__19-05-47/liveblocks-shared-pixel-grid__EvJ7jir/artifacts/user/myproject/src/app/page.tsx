"use client";

import { RoomProvider, ClientSideSuspense } from "@liveblocks/react";
import { LiveMap } from "@liveblocks/client";
import PixelGrid from "./PixelGrid";

const roomId = `pixel-grid-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID}`;

export default function Home() {
  return (
    <RoomProvider
      id={roomId}
      initialStorage={{ pixels: new LiveMap() }}
    >
      <ClientSideSuspense fallback={<div>Loading...</div>}>
        {() => <PixelGrid />}
      </ClientSideSuspense>
    </RoomProvider>
  );
}