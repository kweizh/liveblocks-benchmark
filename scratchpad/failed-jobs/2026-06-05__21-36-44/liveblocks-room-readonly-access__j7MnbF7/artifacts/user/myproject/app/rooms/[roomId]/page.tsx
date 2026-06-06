"use client";

import { useSearchParams } from "next/navigation";
import { LiveblocksProvider, RoomProvider, useStorage, useMutation, useStatus } from "@liveblocks/react";

type RoomPageParams = {
  params: { roomId: string };
};

export default function RoomPage({ params }: RoomPageParams) {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") ?? "anonymous";
  const role = (searchParams.get("role") ?? "viewer") as "editor" | "viewer";
  const roomId = params.roomId;

  return (
    <LiveblocksProvider
      authEndpoint={async (room) => {
        const res = await fetch("/api/liveblocks-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room, userId, role }),
        });
        return res.json();
      }}
    >
      <RoomProvider
        id={roomId}
        initialStorage={{ counter: 0 }}
      >
        <RoomContent role={role} />
      </RoomProvider>
    </LiveblocksProvider>
  );
}

function RoomContent({ role }: { role: "editor" | "viewer" }) {
  const counter = useStorage((root) => root.counter);
  const status = useStatus();

  const increment = useMutation(({ storage }) => {
    const current = storage.get("counter") as number;
    storage.set("counter", current + 1);
  }, []);

  return (
    <main>
      <span data-testid="connection-status">{status}</span>
      <span data-testid="counter-value">{counter as number}</span>
      <span data-testid="role-label">{role}</span>
      <button
        data-testid="increment-button"
        onClick={increment}
        disabled={role === "viewer"}
      >
        Increment
      </button>
    </main>
  );
}
