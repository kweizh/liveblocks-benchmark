"use client";

import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
  useStorage,
  useMutation,
  useUndo,
  useRedo,
} from "@liveblocks/react";

export const dynamic = "force-dynamic";

const publicApiKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY || "pk_dev_dummy";

function Counter() {
  const count = useStorage((root) => root.count);
  const undo = useUndo();
  const redo = useRedo();

  const increment = useMutation(({ storage }) => {
    const current = storage.get("count") ?? 0;
    storage.set("count", current + 1);
  }, []);

  const decrement = useMutation(({ storage }) => {
    const current = storage.get("count") ?? 0;
    storage.set("count", current - 1);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Collaborative Counter</h1>
      <div 
        data-testid="count" 
        style={{ fontSize: "4rem", fontWeight: "bold", marginBottom: "2rem" }}
      >
        {count ?? 0}
      </div>
      <div style={{ display: "flex", gap: "1rem" }}>
        <button 
          data-testid="increment" 
          onClick={increment}
          style={{ padding: "0.5rem 1rem", fontSize: "1rem", cursor: "pointer" }}
        >
          Increment
        </button>
        <button 
          data-testid="decrement" 
          onClick={decrement}
          style={{ padding: "0.5rem 1rem", fontSize: "1rem", cursor: "pointer" }}
        >
          Decrement
        </button>
        <button 
          data-testid="undo" 
          onClick={undo}
          style={{ padding: "0.5rem 1rem", fontSize: "1rem", cursor: "pointer" }}
        >
          Undo
        </button>
        <button 
          data-testid="redo" 
          onClick={redo}
          style={{ padding: "0.5rem 1rem", fontSize: "1rem", cursor: "pointer" }}
        >
          Redo
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  const runId = process.env.NEXT_PUBLIC_ZEALT_RUN_ID || process.env.ZEALT_RUN_ID || "local";
  const roomId = `zealt-undo-redo-counter-${runId}`;

  return (
    <LiveblocksProvider publicApiKey={publicApiKey}>
      <RoomProvider 
        id={roomId} 
        initialStorage={{ count: 0 }}
      >
        <ClientSideSuspense fallback={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif" }}>
            Loading...
          </div>
        }>
          <Counter />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
