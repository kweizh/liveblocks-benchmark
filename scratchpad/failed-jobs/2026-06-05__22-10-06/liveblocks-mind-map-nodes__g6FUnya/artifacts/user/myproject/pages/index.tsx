import React from "react";
import { RoomProvider } from "../liveblocks.config";
import MindMap from "../components/MindMap";
import { LiveMap } from "@liveblocks/client";

const ZEALT_RUN_ID = process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "local";
const ROOM_ID = `mind-map-${ZEALT_RUN_ID}`;

export default function Home() {
  return (
    <RoomProvider
      id={ROOM_ID}
      initialStorage={{
        nodes: new LiveMap(),
      }}
    >
      <MindMap />
    </RoomProvider>
  );
}
