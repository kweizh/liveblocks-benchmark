"use client";

import { LiveObject } from "@liveblocks/client";
import { RoomProvider } from "../liveblocks.config";
import { ReactNode } from "react";

const ROOM_ID =
  process.env.NEXT_PUBLIC_ROOM_ID || "harbor-typing-form-local";

function getDisplayName(): string {
  if (typeof window === "undefined") return "Anonymous";
  const params = new URLSearchParams(window.location.search);
  return params.get("name") || "Anonymous";
}

export function Room({ children }: { children: ReactNode }) {
  // Read display name synchronously (client-side only, component is "use client")
  const displayName = getDisplayName();

  return (
    <RoomProvider
      id={ROOM_ID}
      initialPresence={{
        typing: null,
        info: { name: displayName },
      }}
      initialStorage={{
        form: new LiveObject({ name: "", email: "", bio: "" }),
      }}
    >
      {children}
    </RoomProvider>
  );
}
