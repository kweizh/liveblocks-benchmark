"use client";

import { useParams } from "next/navigation";
import { Room } from "./Room";
import { useUpdateMyPresence, useOthers } from "@liveblocks/react/suspense";

const COLORS = [
  "#E57373", "#9575CD", "#4FC3F7", "#81C784", "#FFF176", "#FF8A65",
  "#F06292", "#7986CB", "#4DD0E1", "#AED581", "#FFD54F", "#D4E157"
];

function CursorsCanvas() {
  const updateMyPresence = useUpdateMyPresence();
  const others = useOthers();

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
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
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{
          position: "relative",
          width: 800,
          height: 600,
          background: "#f8f8f8",
          border: "1px solid #ccc",
          overflow: "hidden",
          touchAction: "none"
        }}
      >
        {others.map(({ connectionId, presence }) => {
          if (!presence.cursor) return null;
          return (
            <svg
              key={connectionId}
              data-cursor-user={connectionId}
              data-x={presence.cursor.x}
              data-y={presence.cursor.y}
              style={{
                position: "absolute",
                left: presence.cursor.x,
                top: presence.cursor.y,
                transform: "translate(-50%, -50%)",
                width: 24,
                height: 24,
                pointerEvents: "none"
              }}
              viewBox="0 0 24 24"
            >
              <circle
                cx="12"
                cy="12"
                r="6"
                fill={COLORS[connectionId % COLORS.length]}
              />
            </svg>
          );
        })}
      </div>
    </main>
  );
}

export default function CursorsPage() {
  const params = useParams<{ room: string }>();
  const roomId =
    (Array.isArray(params?.room) ? params?.room[0] : params?.room) ||
    "default-room";

  return (
    <Room roomId={roomId}>
      <CursorsCanvas />
    </Room>
  );
}
