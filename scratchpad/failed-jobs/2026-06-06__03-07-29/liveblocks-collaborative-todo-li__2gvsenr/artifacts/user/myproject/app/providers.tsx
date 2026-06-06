"use client";

import { LiveList } from "@liveblocks/client";
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react/suspense";
import { ReactNode } from "react";

function roomId(): string {
  const runId =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_ZEALT_RUN_ID) || "local";
  return `harbor-todo-${runId}`;
}

export function Providers({ children }: { children: ReactNode }) {
  const publicKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY;
  const providerProps = publicKey
    ? { publicApiKey: publicKey }
    : { authEndpoint: "/api/liveblocks-auth" as const };

  return (
    <LiveblocksProvider {...(providerProps as any)}>
      <RoomProvider
        id={roomId()}
        initialStorage={{
          todos: new LiveList([]),
        }}
      >
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
