"use client";

import { ReactNode } from "react";
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react";
import { LiveList, LiveObject } from "@liveblocks/client";

const publicApiKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY as string;
if (!publicApiKey) {
  throw new Error("NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY is not defined");
}

const runId = process.env.NEXT_PUBLIC_ZEALT_RUN_ID;
const roomId = `shopping-cart-${runId}`;

export type CartItem = {
  id: string;
  name: string;
  qty: number;
};

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LiveblocksProvider publicApiKey={publicApiKey}>
      <RoomProvider
        id={roomId}
        initialStorage={{
          cart: new LiveList<LiveObject<CartItem>>([]),
        }}
      >
        <ClientSideSuspense fallback={<div>Loading...</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
