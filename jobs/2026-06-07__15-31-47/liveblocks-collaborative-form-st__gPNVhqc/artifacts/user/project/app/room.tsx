"use client";

import { ReactNode } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";
import { LiveObject } from "@liveblocks/client";

const roomId = `form-storage-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID}`;

export function Room({ children }: { children: ReactNode }) {
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
        {children}
      </RoomProvider>
    </LiveblocksProvider>
  );
}
