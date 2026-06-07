"use client";

import { LiveblocksProvider, RoomProvider } from "@liveblocks/react";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  // The prompt mentions using NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY on the client,
  // but Liveblocks createClient throws if both authEndpoint and publicApiKey are provided.
  // We'll prioritize authEndpoint as it's the standard for authentication.
  const publicKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY;
  
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      {children}
    </LiveblocksProvider>
  );
}

export function Room({ children }: { children: ReactNode }) {
  const roomId = `color-picker-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID}`;
  return (
    <RoomProvider id={roomId} initialPresence={{ color: "#000000" }}>
      {children}
    </RoomProvider>
  );
}
