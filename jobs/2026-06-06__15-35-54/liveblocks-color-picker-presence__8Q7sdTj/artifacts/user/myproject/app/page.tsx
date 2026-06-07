"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  LiveblocksProvider,
  RoomProvider,
  useUpdateMyPresence,
  useOthers,
  useSelf,
} from "@liveblocks/react";

type Presence = {
  userId: string;
  color: string;
};

const COLORS = ["red", "blue", "green", "yellow", "purple"] as const;

const COLOR_MAP: Record<string, string> = {
  red: "#ef4444",
  blue: "#3b82f6",
  green: "#22c55e",
  yellow: "#eab308",
  purple: "#a855f7",
};

function ColorPicker() {
  const self = useSelf();
  const others = useOthers();
  const updateMyPresence = useUpdateMyPresence();

  // Selected color of the current user
  const selfPresence = self?.presence as unknown as Presence | undefined;
  const currentColor = selfPresence?.color || "none";

  const handleColorSelect = (color: string) => {
    updateMyPresence({ color });
  };

  // Combine self and others to show all connected users
  const allUsers = [];
  if (self) {
    allUsers.push(self);
  }
  allUsers.push(...others);

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Multiplayer Color Picker</h1>
      
      {/* Color Palette Grid */}
      <div style={{ display: "flex", gap: "10px", margin: "20px 0" }}>
        {COLORS.map((color) => {
          const isSelected = currentColor === color;
          return (
            <button
              key={color}
              data-testid={`swatch-${color}`}
              onClick={() => handleColorSelect(color)}
              style={{
                width: "50px",
                height: "50px",
                backgroundColor: COLOR_MAP[color],
                border: isSelected ? "4px solid black" : "2px solid #ccc",
                borderRadius: "8px",
                cursor: "pointer",
                boxShadow: isSelected ? "0 0 10px rgba(0,0,0,0.5)" : "none",
                outline: "none",
              }}
              title={color}
            />
          );
        })}
      </div>

      {/* Avatars Row */}
      <h2>Connected Users</h2>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {allUsers.map((user) => {
          const presence = user.presence as unknown as Presence | undefined;
          const userId = presence?.userId;
          const userColor = presence?.color || "none";
          const bg = COLOR_MAP[userColor] || "#e2e8f0"; // light gray, non-palette hex

          if (!userId) return null;

          return (
            <div
              key={user.connectionId}
              data-testid={`avatar-${userId}`}
              data-color={userColor}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                color: "#fff",
                textShadow: "0 1px 2px rgba(0,0,0,0.6)",
                border: "2px solid #fff",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              {userId}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RoomWrapper() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");

  if (!userId) {
    return (
      <div style={{ padding: "2rem", color: "red" }}>
        <h1>Error</h1>
        <p>Missing required query parameter: userId</p>
      </div>
    );
  }

  const runId = process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "";
  const roomId = `color-picker-${runId}`;
  const publicApiKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY || "";

  return (
    <LiveblocksProvider publicApiKey={publicApiKey}>
      <RoomProvider
        id={roomId}
        initialPresence={{ userId, color: "none" }}
      >
        <ColorPicker />
      </RoomProvider>
    </LiveblocksProvider>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RoomWrapper />
    </Suspense>
  );
}
