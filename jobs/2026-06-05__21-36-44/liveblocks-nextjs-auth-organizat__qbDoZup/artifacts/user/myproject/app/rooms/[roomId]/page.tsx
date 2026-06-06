"use client";

import { LiveblocksProvider, RoomProvider, useStatus, useStorage } from "@liveblocks/react";
import { useSearchParams } from "next/navigation";

type Storage = {
  counter: number;
};

function RoomContent() {
  const status = useStatus();
  const counter = useStorage((root: Storage) => root.counter);

  return (
    <main>
      <span data-testid="connection-status">{status}</span>
      <span data-testid="counter-value">{counter ?? 0}</span>
    </main>
  );
}

export default function RoomPage({
  params,
}: {
  params: { roomId: string };
}) {
  const { roomId } = params;
  const searchParams = useSearchParams();
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
      <RoomProvider
        id={roomId}
        initialStorage={{ counter: 0 } as Storage}
      >
        <RoomContent />
      </RoomProvider>
    </LiveblocksProvider>
  );
}
