"use client";

import { useParams, useSearchParams } from "next/navigation";
import {
  LiveblocksProvider,
  RoomProvider,
  useStorage,
  useStatus,
} from "@liveblocks/react";

function RoomContent() {
  const counter = useStorage((root) => root.counter) as number;
  const status = useStatus();

  return (
    <main>
      <h1>Room</h1>
      <div>
        Connection status:{" "}
        <span data-testid="connection-status">{status}</span>
      </div>
      <div>
        Counter value:{" "}
        <span data-testid="counter-value">{counter}</span>
      </div>
    </main>
  );
}

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const userId = searchParams.get("userId") ?? "";
  const orgId = searchParams.get("orgId") ?? "";

  return (
    <LiveblocksProvider
      authEndpoint={async (room) => {
        const response = await fetch("/api/liveblocks-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room, userId, orgId }),
        });
        return response.json();
      }}
    >
      <RoomProvider id={roomId} initialStorage={{ counter: 0 }}>
        <RoomContent />
      </RoomProvider>
    </LiveblocksProvider>
  );
}