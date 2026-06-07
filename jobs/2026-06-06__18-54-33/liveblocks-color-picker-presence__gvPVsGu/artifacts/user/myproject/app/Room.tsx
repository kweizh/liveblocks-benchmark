"use client";

import { ReactNode } from "react";
import { RoomProvider } from "../liveblocks.config";

const roomId = `color-picker-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID}`;

export function Room({ children }: { children: ReactNode }) {
  return (
    <RoomProvider
      id={roomId}
      initialPresence={{ color: "#000000" }}
    >
      {children}
    </RoomProvider>
  );
}
