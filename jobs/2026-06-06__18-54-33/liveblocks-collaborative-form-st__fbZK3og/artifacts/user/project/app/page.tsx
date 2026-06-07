"use client";

import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react";
import { LiveObject } from "@liveblocks/client";
import { CollaborativeForm } from "./CollaborativeForm";

const roomId = `form-storage-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID}`;

export default function Page() {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{}}
        initialStorage={{
          form: new LiveObject({
            name: "",
            email: "",
            message: "",
            lastUpdate: "",
          }),
        }}
      >
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          <CollaborativeForm />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
