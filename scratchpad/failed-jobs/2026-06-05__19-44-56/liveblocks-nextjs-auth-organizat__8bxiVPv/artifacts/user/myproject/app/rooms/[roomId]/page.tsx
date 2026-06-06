"use client";

import { useSearchParams } from "next/navigation";
import { LiveblocksProvider, RoomProvider, useStorage, useStatus } from "@liveblocks/react";

function RoomContent() {
  const status = useStatus();
  const counter = useStorage((root) => root.counter);

  return (
    <main>
      <h1>Room page</h1>
      <p>Connection status: <span data-testid="connection-status">{status}</span></p>
      <p>Counter: <span data-testid="counter-value">{counter !== null && counter !== undefined ? String(counter) : "..."}</span></p>
    </main>
  );
}

export default function RoomPage({ params }: { params: { roomId: string } }) {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const orgId = searchParams.get("orgId");

  if (!userId || !orgId) {
    return (
      <main>
        <h1>Room page</h1>
        <p>Missing userId or orgId</p>
        <span data-testid="connection-status">disconnected</span>
        <span data-testid="counter-value">0</span>
      </main>
    );
  }

  const authEndpoint = async (room?: string) => {
    const response = await fetch("/api/liveblocks-auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ room, userId, orgId }),
    });
    
    if (!response.ok) {
      throw new Error("Authentication failed");
    }
    
    return await response.json();
  };

  return (
    <LiveblocksProvider authEndpoint={authEndpoint}>
      <RoomProvider id={params.roomId} initialStorage={{ counter: 0 }}>
        <RoomContent />
      </RoomProvider>
    </LiveblocksProvider>
  );
}
