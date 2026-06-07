"use client";

import { useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useUpdateMyPresence, useOthers } from "@liveblocks/react/suspense";
import { Room } from "./Room";

// Deterministic color palette for remote cursors based on connectionId
const COLORS = [
  "#E57373", "#81C784", "#64B5F6", "#FFD54F", "#BA68C8",
  "#4DB6AC", "#FF8A65", "#90A4AE", "#F06292", "#AED581",
];

function getColor(connectionId: number): string {
  return COLORS[connectionId % COLORS.length];
}

function CursorsCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const updateMyPresence = useUpdateMyPresence();
  const others = useOthers();

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.round(event.clientX - rect.left);
      const y = Math.round(event.clientY - rect.top);
      updateMyPresence({ cursor: { x, y } });
    },
    [updateMyPresence]
  );

  const handlePointerLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Live Cursors</h1>
      <div
        id="cursors-container"
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{
          position: "relative",
          width: 800,
          height: 600,
          background: "#f8f8f8",
          border: "1px solid #ccc",
          overflow: "hidden",
        }}
      >
        {others.map(({ connectionId, presence }) => {
          if (!presence.cursor) return null;
          const { x, y } = presence.cursor;
          const color = getColor(connectionId);
          return (
            <div
              key={connectionId}
              data-cursor-user={String(connectionId)}
              data-x={String(x)}
              data-y={String(y)}
              style={{
                position: "absolute",
                left: x,
                top: y,
                pointerEvents: "none",
                transform: "translate(-50%, -50%)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16">
                <circle cx="8" cy="8" r="6" fill={color} />
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
  const roomId =
    (Array.isArray(params?.room) ? params?.room[0] : params?.room) ||
    "default-room";

  return (
    <Room roomId={roomId}>
      <CursorsCanvas />
    </Room>
  );
}
