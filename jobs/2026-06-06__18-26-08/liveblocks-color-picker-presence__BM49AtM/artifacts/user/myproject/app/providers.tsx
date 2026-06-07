"use client";

import React from "react";
import { LiveblocksProvider, RoomProvider } from "@liveblocks/react";

export function Providers({
  children,
  roomId,
  useAuth,
}: {
  children: React.ReactNode;
  roomId: string;
  useAuth: boolean;
}) {
  const publicApiKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY;

  // If the server has the secret key, we use the authenticated setup.
  // Otherwise, we use publicApiKey if available.
  const providerProps = useAuth
    ? { authEndpoint: "/api/liveblocks-auth" }
    : { publicApiKey: publicApiKey || "" };

  return (
    <LiveblocksProvider {...providerProps}>
      <RoomProvider id={roomId} initialPresence={{ color: "#000000" }}>
        {children}
      </RoomProvider>
    </LiveblocksProvider>
  );
}
