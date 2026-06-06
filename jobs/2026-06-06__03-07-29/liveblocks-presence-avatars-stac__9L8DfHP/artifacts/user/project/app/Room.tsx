"use client";

import { ReactNode, useEffect } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";

export function Room({ roomId, children }: { roomId: string; children: ReactNode }) {
  // Set the mockUser cookie from the ?user= query param so the auth
  // endpoint can identify which mock user to authenticate.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const userParam = params.get("user");
      if (userParam !== null) {
        document.cookie = `mockUser=${encodeURIComponent(userParam)};path=/;SameSite=Lax`;
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id={roomId} initialPresence={{}}>
        <ClientSideSuspense fallback={<div>Connecting…</div>}>
          {() => <>{children}</>}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}