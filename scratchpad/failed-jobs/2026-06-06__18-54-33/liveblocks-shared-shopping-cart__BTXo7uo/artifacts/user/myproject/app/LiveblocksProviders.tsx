"use client";

import { LiveList, LiveObject } from "@liveblocks/client";
import { RoomProvider } from "../liveblocks.config";

const ROOM_ID = `shopping-cart-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID}`;

export function LiveblocksProviders({ children }: { children: React.ReactNode }) {
  return (
    <RoomProvider
      id={ROOM_ID}
      initialStorage={{
        cart: new LiveList([]),
      }}
    >
      {children}
    </RoomProvider>
  );
}
