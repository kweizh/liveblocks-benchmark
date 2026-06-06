"use client";

import { LiveblocksProvider, RoomProvider, useStatus, useStorage } from "@liveblocks/react";
import { useSearchParams } from "next/navigation";
import { ReactNode } from "react";

export default function RoomPage({ params }: { params: { roomId: string } }) {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const orgId = searchParams.get("orgId");

  if (!userId || !orgId) {
    return <div>Missing userId or orgId query parameters</div>;
  }

  return (
    <LiveblocksProvider
      authEndpoint={async (room) => {
        const response = await fetch("/api/liveblocks-auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            room,
            userId,
            orgId,
          }),
        });
        return await response.json();
      }}
    >
      <RoomProvider id={params.roomId} initialStorage={{ counter: 0 }}>
        <RoomContent />
      </RoomProvider>
    </LiveblocksProvider>
  );
}

function RoomContent() {
  const status = useStatus();
  const counter = useStorage((root) => root.counter);

  return (
    <main>
      <h1>Room page</h1>
      <div>
        Connection Status: <span data-testid="connection-status">{status}</span>
      </div>
      <div>
        Counter: <span data-testid="counter-value">{counter}</span>
      </div>
    </main>
  );
}
