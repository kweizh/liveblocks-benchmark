"use client";

import { LiveblocksProvider, RoomProvider } from "@liveblocks/react/suspense";
import { LiveList } from "@liveblocks/client";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const roomId = `shopping-cart-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID}`;

  return (
    <LiveblocksProvider publicApiKey={process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!}>
      <RoomProvider
        id={roomId}
        initialPresence={{}}
        initialStorage={{
          cart: new LiveList([]),
        }}
      >
        {children}
      </RoomProvider>
    </LiveblocksProvider>
  );
}
