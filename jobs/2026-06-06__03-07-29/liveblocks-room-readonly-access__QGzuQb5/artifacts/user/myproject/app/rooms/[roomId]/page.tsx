"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, Suspense } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  useStorage,
  useMutation,
  useStatus,
} from "@liveblocks/react";

function Counter({ role }: { role: string }) {
  const counter = useStorage((root) => root.counter);
  const status = useStatus();

  const increment = useMutation(({ storage }) => {
    const current = storage.get("counter") as number;
    storage.set("counter", current + 1);
  }, []);

  return (
    <div>
      <div data-testid="connection-status">{status}</div>
      <div data-testid="counter-value">{String(counter ?? 0)}</div>
      <div data-testid="role-label">{role}</div>
      <button
        data-testid="increment-button"
        disabled={role === "viewer"}
        onClick={() => increment()}
      >
        Increment
      </button>
    </div>
  );
}

function RoomInner({ roomId, userId, role }: { roomId: string; userId: string; role: string }) {
  const authEndpoint = useMemo(
    () =>
      async (room?: string) => {
        const response = await fetch("/api/liveblocks-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room, userId, role }),
        });
        return await response.json();
      },
    [userId, role]
  );

  return (
    <LiveblocksProvider authEndpoint={authEndpoint}>
      <RoomProvider
        id={roomId}
        initialStorage={{ counter: 0 } as any}
      >
        <Counter role={role} />
      </RoomProvider>
    </LiveblocksProvider>
  );
}

export default function RoomPage({
  params,
}: {
  params: { roomId: string };
}) {
  return (
    <Suspense>
      <RoomPageInner params={params} />
    </Suspense>
  );
}

function RoomPageInner({
  params,
}: {
  params: { roomId: string };
}) {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") ?? "";
  const role = searchParams.get("role") ?? "viewer";

  return <RoomInner roomId={params.roomId} userId={userId} role={role} />;
}