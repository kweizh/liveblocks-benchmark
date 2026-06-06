"use client";

import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react/suspense";
import Editor from "./Editor";

export default function Room({ roomId }: { roomId: string }) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id={roomId}>
        <ClientSideSuspense fallback={<div>Loading room…</div>}>
          {() => <Editor />}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
