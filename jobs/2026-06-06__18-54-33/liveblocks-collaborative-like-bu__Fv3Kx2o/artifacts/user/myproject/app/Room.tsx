"use client";

import { RoomProvider } from "../liveblocks.config";
import { ClientSideSuspense } from "@liveblocks/react";
import LikeButton from "./LikeButton";

const roomId = `like-button-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID}`;

export default function Room() {
  return (
    <RoomProvider id={roomId} initialStorage={{ likes: 0 }}>
      <ClientSideSuspense fallback={<div>Loading…</div>}>
        <LikeButton />
      </ClientSideSuspense>
    </RoomProvider>
  );
}
