"use client";

import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { LiveList } from "@liveblocks/client";
import { ReactNode } from "react";

const publicApiKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!;
const roomId = `shopping-cart-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID}`;

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LiveblocksProvider publicApiKey={publicApiKey}>
      <RoomProvider
        id={roomId}
        initialStorage={{
          cart: new LiveList([]),
        }}
      >
        <ClientSideSuspense fallback={<div>Loading...</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
