"use client";

import { LiveblocksProvider, RoomProvider } from "@liveblocks/react/suspense";
import { LiveList } from "@liveblocks/client";
import type { ReactNode } from "react";

const roomId = `shopping-cart-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID}`;

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LiveblocksProvider
      publicApiKey={process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!}
    >
      <RoomProvider
        id={roomId}
        initialStorage={() => ({
          cart: new LiveList([]),
        })}
      >
        {children}
      </RoomProvider>
    </LiveblocksProvider>
  );
}