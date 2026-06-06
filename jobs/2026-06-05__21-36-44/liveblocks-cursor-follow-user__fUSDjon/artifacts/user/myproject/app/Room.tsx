"use client";

import { ReactNode, useEffect } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
  useSelf,
} from "@liveblocks/react/suspense";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY ?? "";
const RUN_ID =
  process.env.NEXT_PUBLIC_ZEALT_RUN_ID ?? process.env.ZEALT_RUN_ID ?? "dev";
const ROOM_ID = `cursor-follow-${RUN_ID}`;

function ExposeSelfConnectionId() {
  const connectionId = useSelf((me) => me.connectionId);
  useEffect(() => {
    if (typeof window !== "undefined" && typeof connectionId === "number") {
      (window as any).__LIVEBLOCKS_SELF_CONNECTION_ID__ = connectionId;
    }
  }, [connectionId]);
  return null;
}

export function Room({ children }: { children: ReactNode }) {
  return (
    <LiveblocksProvider
      authEndpoint="/api/liveblocks-auth"
      publicApiKey={PUBLIC_KEY || undefined}
    >
      <RoomProvider
        id={ROOM_ID}
        initialPresence={{ cursor: null }}
      >
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          {() => (
            <>
              <ExposeSelfConnectionId />
              {children}
            </>
          )}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
