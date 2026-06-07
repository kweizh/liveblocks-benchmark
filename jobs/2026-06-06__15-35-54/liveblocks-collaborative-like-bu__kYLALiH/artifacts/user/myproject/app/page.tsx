"use client";

import { useEffect, useState } from "react";
import { LiveblocksProvider } from "@liveblocks/react";
import { RoomProvider, useStorage, useMutation } from "../liveblocks.config";

function LikeCounter() {
  const count = useStorage((root) => root.count);
  const increment = useMutation(({ storage }) => {
    const current = storage.get("count") ?? 0;
    storage.set("count", current + 1);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", marginTop: "2rem" }}>
      <button 
        onClick={increment}
        style={{
          padding: "0.5rem 1rem",
          fontSize: "1.25rem",
          cursor: "pointer",
          borderRadius: "0.25rem",
          border: "1px solid #ccc",
          backgroundColor: "#fff",
        }}
      >
        Like
      </button>
      <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
        Likes: <span id="counter">{count !== null && count !== undefined ? count : 0}</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const publicApiKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY || "";
  const roomId = process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "default-room";

  if (!mounted) {
    // Render static version for SSR/initial load to satisfy any JS-disabled HTML checks
    return (
      <main style={{ fontFamily: "sans-serif", textAlign: "center", padding: "2rem" }}>
        <h1>Liveblocks Collaborative Like Button</h1>
        <p>Click the button below to increment the shared counter in realtime!</p>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", marginTop: "2rem" }}>
          <button 
            style={{
              padding: "0.5rem 1rem",
              fontSize: "1.25rem",
              cursor: "pointer",
              borderRadius: "0.25rem",
              border: "1px solid #ccc",
              backgroundColor: "#fff",
            }}
          >
            Like
          </button>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
            Likes: <span id="counter">0</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <LiveblocksProvider publicApiKey={publicApiKey}>
      <RoomProvider id={roomId} initialStorage={{ count: 0 }}>
        <main style={{ fontFamily: "sans-serif", textAlign: "center", padding: "2rem" }}>
          <h1>Liveblocks Collaborative Like Button</h1>
          <p>Click the button below to increment the shared counter in realtime!</p>
          <LikeCounter />
        </main>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
