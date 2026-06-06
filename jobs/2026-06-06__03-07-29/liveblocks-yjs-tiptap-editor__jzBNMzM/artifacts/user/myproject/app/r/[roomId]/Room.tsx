"use client";

import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react/suspense";
import Editor from "./Editor";

function getUsername(): string {
  if (typeof window === "undefined") return "Anonymous";
  const stored = localStorage.getItem("liveblocks-username");
  if (stored) return stored;
  const name = `User ${Math.floor(Math.random() * 10000)}`;
  localStorage.setItem("liveblocks-username", name);
  return name;
}

export default function Room({ roomId }: { roomId: string }) {
  return (
    <LiveblocksProvider
      authEndpoint={async (room) => {
        const username = getUsername();
        const response = await fetch("/api/liveblocks-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: room, username }),
        });
        return response.json();
      }}
    >
      <RoomProvider id={roomId} initialPresence={{ cursor: null }}>
        <ClientSideSuspense fallback={<div>Loading room…</div>}>
          {() => <Editor />}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}