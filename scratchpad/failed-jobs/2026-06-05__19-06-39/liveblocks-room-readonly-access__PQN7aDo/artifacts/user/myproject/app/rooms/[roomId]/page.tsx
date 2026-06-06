"use client";

import { useParams, useSearchParams } from "next/navigation";
import { LiveblocksProvider, RoomProvider, useStorage, useMutation, useStatus } from "@liveblocks/react";

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const roomId = (params?.roomId as string) || "";
  const userId = searchParams?.get("userId") || "";
  const role = searchParams?.get("role") || "";

  const authEndpoint = async (room?: string) => {
    const response = await fetch("/api/liveblocks-auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ room: room || roomId, userId, role }),
    });
    if (!response.ok) {
      throw new Error("Authentication failed");
    }
    return await response.json();
  };

  return (
    <LiveblocksProvider authEndpoint={authEndpoint}>
      <RoomProvider id={roomId} initialStorage={{ counter: 0 }}>
        <RoomContent role={role} />
      </RoomProvider>
    </LiveblocksProvider>
  );
}

function RoomContent({ role }: { role: string }) {
  const connectionStatus = useStatus();
  const counter = useStorage((root: any) => root?.counter);

  const increment = useMutation(({ storage }: any) => {
    const current = (storage.get("counter") as number) ?? 0;
    storage.set("counter", current + 1);
  }, []);

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Collaborative Dashboard</h1>
      <div>
        <p>
          <strong>Role:</strong> <span data-testid="role-label">{role}</span>
        </p>
        <p>
          <strong>Connection Status:</strong> <span data-testid="connection-status">{connectionStatus}</span>
        </p>
        <p>
          <strong>Counter Value:</strong> <span data-testid="counter-value">{counter !== null && counter !== undefined ? counter : 0}</span>
        </p>
      </div>
      <button
        data-testid="increment-button"
        disabled={role === "viewer"}
        onClick={increment}
        style={{
          padding: "0.5rem 1rem",
          fontSize: "1rem",
          cursor: role === "viewer" ? "not-allowed" : "pointer",
        }}
      >
        Increment
      </button>
    </main>
  );
}
