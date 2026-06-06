"use client";

import { LiveblocksProvider, RoomProvider, useStorage, useMutation, useStatus, ClientSideSuspense } from "@liveblocks/react";

function RoomContent({ role }: { role: string }) {
  const status = useStatus();
  const counter = useStorage((root: any) => root.counter);
  const increment = useMutation(({ storage }) => {
    const current = (storage.get("counter") as number) || 0;
    storage.set("counter", current + 1);
  }, []);

  return (
    <main>
      <h1>Room page</h1>
      <p>
        Connection: <span data-testid="connection-status">{status}</span>
      </p>
      <p>
        Role: <span data-testid="role-label">{role}</span>
      </p>
      <p>
        Counter: <span data-testid="counter-value">{counter ?? 0}</span>
      </p>
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

export default function RoomPage({ params, searchParams }: { params: { roomId: string }, searchParams: { userId?: string, role?: string } }) {
  const { roomId } = params;
  const { userId, role } = searchParams;

  if (!userId || !role) {
    return <div>Missing userId or role in query params</div>;
  }

  return (
    <LiveblocksProvider
      authEndpoint={async (room) => {
        const res = await fetch("/api/liveblocks-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room, userId, role }),
        });
        return await res.json();
      }}
    >
      <RoomProvider id={roomId} initialStorage={{ counter: 0 }}>
        <ClientSideSuspense fallback={
          <main>
            <h1>Room page</h1>
            <p>
              Connection: <span data-testid="connection-status">connecting</span>
            </p>
            <p>
              Role: <span data-testid="role-label">{role}</span>
            </p>
            <p>
              Counter: <span data-testid="counter-value">0</span>
            </p>
            <button 
              data-testid="increment-button" 
              disabled={role === "viewer"}
            >
              Increment
            </button>
          </main>
        }>
          {() => <RoomContent role={role} />}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
