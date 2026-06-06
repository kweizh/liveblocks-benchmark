"use client";

import { ReactNode } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";

// PUBLIC_KEY is kept for completeness (the env var must remain exported).
// We use the auth endpoint exclusively so that userInfo is attached server-side.
export const _NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY ?? "";

// Forward the ?user= query param from the page URL to the auth endpoint
// so the server can identify which mock user this client is.
function buildAuthEndpoint(): string {
  if (typeof window === "undefined") return "/api/liveblocks-auth";
  const params = new URLSearchParams(window.location.search);
  const user = params.get("user");
  if (user !== null) return `/api/liveblocks-auth?user=${encodeURIComponent(user)}`;
  return "/api/liveblocks-auth";
}

export function Room({ roomId, children }: { roomId: string; children: ReactNode }) {
  return (
    <LiveblocksProvider authEndpoint={buildAuthEndpoint()}>
      <RoomProvider id={roomId} initialPresence={{}}>
        <ClientSideSuspense fallback={<div>Connecting…</div>}>
          {() => <>{children}</>}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
