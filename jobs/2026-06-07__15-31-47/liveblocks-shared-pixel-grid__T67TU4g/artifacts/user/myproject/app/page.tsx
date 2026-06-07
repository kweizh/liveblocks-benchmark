"use client";

import { LiveMap } from "@liveblocks/client";
import { ClientSideSuspense } from "@liveblocks/react";
import { RoomProvider } from "../liveblocks.config";
import PixelGrid from "./PixelGrid";

const runId = process.env.NEXT_PUBLIC_ZEALT_RUN_ID;
const roomId = `pixel-grid-${runId}`;

export default function Home() {
  return (
    <RoomProvider
      id={roomId}
      initialPresence={{}}
      initialStorage={{
        pixels: new LiveMap<string, string>(),
      }}
    >
      <ClientSideSuspense fallback={<div>Loading...</div>}>
        {() => <PixelGrid />}
      </ClientSideSuspense>
    </RoomProvider>
  );
}
