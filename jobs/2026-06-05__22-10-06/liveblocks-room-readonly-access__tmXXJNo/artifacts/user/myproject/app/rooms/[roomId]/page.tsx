"use client";

import {
  LiveblocksProvider,
  RoomProvider,
  useStatus,
  useStorage,
  useMutation,
} from "@liveblocks/react";
import { LiveObject } from "@liveblocks/client";
import { useSearchParams } from "next/navigation";

export default function RoomPage({ params }: { params: { roomId: string } }) {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const role = searchParams.get("role") as "editor" | "viewer" | null;

  if (!userId || !role || (role !== "editor" && role !== "viewer")) {
    return <div>Missing or invalid userId or role in query parameters.</div>;
  }

  return (
    <LiveblocksProvider
      authEndpoint={async (room) => {
        const response = await fetch("/api/liveblocks-auth", {
          method: "POST",
          body: JSON.stringify({ room, userId, role }),
        });
        return await response.json();
      }}
    >
      <RoomProvider
        id={params.roomId}
        initialStorage={{
          counter: 0,
        }}
      >
        <RoomContent role={role} />
      </RoomProvider>
    </LiveblocksProvider>
  );
}

function RoomContent({ role }: { role: "editor" | "viewer" }) {
  const status = useStatus();
  const counter = useStorage((root) => root.counter as number);

  const increment = useMutation(({ storage }) => {
    const root = storage.get("counter");
    if (typeof root === "number") {
      storage.set("counter", root + 1);
    }
  }, []);

  return (
    <main>
      <h1>Room Page</h1>
      <div>
        Connection Status: <span data-testid="connection-status">{status}</span>
      </div>
      <div>
        Counter Value: <span data-testid="counter-value">{counter}</span>
      </div>
      <div>
        Role: <span data-testid="role-label">{role}</span>
      </div>
      <button
        data-testid="increment-button"
        onClick={() => increment()}
        disabled={role === "viewer"}
      >
        Increment
      </button>
    </main>
  );
}
