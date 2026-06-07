"use client";

import { useParams } from "next/navigation";
import { useOthers, useUpdateMyPresence } from "@liveblocks/react/suspense";
import { Room } from "./Room";

const COLORS = [
  "#E57373", "#F06292", "#BA68C8", "#9575CD", "#7986CB",
  "#64B5F6", "#4FC3F7", "#4DB6AC", "#81C784", "#D4E157",
  "#FFD54F", "#FFB74D", "#FF8A65"
];

function getColor(connectionId: number) {
  return COLORS[connectionId % COLORS.length];
}

function CursorsCanvas() {
  const others = useOthers();
  const updateMyPresence = useUpdateMyPresence();

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(event.clientX - rect.left);
    const y = Math.round(event.clientY - rect.top);
    updateMyPresence({ cursor: { x, y } });
  };

  const handlePointerLeave = () => {
    updateMyPresence({ cursor: null });
  };

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Live Cursors</h1>
      <div
        id="cursors-container"
        style={{
          position: "relative",
          width: 800,
          height: 600,
          background: "#f8f8f8",
          border: "1px solid #ccc",
          overflow: "hidden"
        }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        {others.map(({ connectionId, presence }) => {
          if (!presence || !presence.cursor) {
            return null;
          }

          const { x, y } = presence.cursor;
          const color = getColor(connectionId);

          return (
            <div
              key={connectionId}
              data-cursor-user={connectionId}
              data-x={x}
              data-y={y}
              style={{
                position: "absolute",
                left: `${x}px`,
                top: `${y}px`,
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="6"
                  fill={color}
                  stroke="white"
                  strokeWidth="2"
                />
              </svg>
            </div>
          );
        })}
      </div>
    </main>
  );
}

export default function CursorsPage() {
  const params = useParams<{ room: string }>();
  
  // Read the room name from the [room] route segment
  let roomId = (Array.isArray(params?.room) ? params?.room[0] : params?.room) || "";

  // Derive the room ID using the NEXT_PUBLIC_ZEALT_RUN_ID environment variable
  const runId = process.env.NEXT_PUBLIC_ZEALT_RUN_ID;
  if (!roomId || roomId === "default-room") {
    roomId = runId ? `cursor-positions-${runId}` : "default-room";
  }

  return (
    <Room roomId={roomId}>
      <CursorsCanvas />
    </Room>
  );
}
