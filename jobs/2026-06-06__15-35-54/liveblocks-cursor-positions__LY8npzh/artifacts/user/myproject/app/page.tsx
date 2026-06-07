"use client";

import {
  LiveblocksProvider,
  RoomProvider,
  useUpdateMyPresence,
  useOthers,
} from "@liveblocks/react";

const COLORS = [
  "#E57373", "#F06292", "#BA68C8", "#9575CD", "#7986CB",
  "#64B5F6", "#4FC3F7", "#4DD0E1", "#4DB6AC", "#81C784",
  "#AED581", "#D4E157", "#FFD54F", "#FFB74D", "#FF8A65"
];

const CursorIcon = ({ color }: { color: string }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill={color}
    style={{
      display: "block",
      marginLeft: "-4.5px",
      marginTop: "-3px",
    }}
  >
    <path d="M4.5 3v15.2l3.8-3.8 4.7 9 2.5-1.3-4.7-9h6.2z" />
  </svg>
);

function CursorPage() {
  const updateMyPresence = useUpdateMyPresence();
  const others = useOthers((others) => others);

  const handlePointerMove = (event: React.PointerEvent) => {
    updateMyPresence({
      cursor: {
        x: Math.round(event.clientX),
        y: Math.round(event.clientY),
      },
    });
  };

  const handlePointerLeave = () => {
    updateMyPresence({ cursor: null });
  };

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#fafafa",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ padding: 24, pointerEvents: "none", userSelect: "none" }}>
        <h1>Liveblocks Cursor Positions</h1>
        <p>Move your mouse around to see other connected users' cursors.</p>
      </div>

      {others.map(({ connectionId, presence }) => {
        if (!presence || !presence.cursor) {
          return null;
        }

        const { x, y } = presence.cursor;
        const color = COLORS[connectionId % COLORS.length];

        return (
          <div
            key={connectionId}
            className="cursor"
            data-cursor={connectionId}
            style={{
              position: "absolute",
              left: `${x}px`,
              top: `${y}px`,
              pointerEvents: "none",
            }}
          >
            <CursorIcon color={color} />
          </div>
        );
      })}
    </div>
  );
}

export default function Page() {
  const publicApiKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY || "";
  const roomId = process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "default-room";

  return (
    <LiveblocksProvider publicApiKey={publicApiKey}>
      <RoomProvider id={roomId} initialPresence={{ cursor: null }}>
        <CursorPage />
      </RoomProvider>
    </LiveblocksProvider>
  );
}
