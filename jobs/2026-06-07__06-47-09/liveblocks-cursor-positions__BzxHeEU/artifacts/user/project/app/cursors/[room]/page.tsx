"use client";

import { useParams } from "next/navigation";
import { Room } from "./Room";
import { useMyPresence, useOthers } from "@liveblocks/react/suspense";
import { useRef } from "react";

function CursorsCanvas() {
  const [{ cursor }, updateMyPresence] = useMyPresence();
  const others = useOthers();
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    updateMyPresence({
      cursor: {
        x: Math.round(e.clientX - rect.left),
        y: Math.round(e.clientY - rect.top),
      },
    });
  };

  const handlePointerLeave = () => {
    updateMyPresence({ cursor: null });
  };

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
          touchAction: "none",
        }}
      >
        {others.map(({ connectionId, presence }) => {
          if (!presence.cursor) return null;

          return (
            <div
              key={connectionId}
              data-cursor-user={connectionId}
              data-x={presence.cursor.x}
              data-y={presence.cursor.y}
              style={{
                position: "absolute",
                left: presence.cursor.x,
                top: presence.cursor.y,
                pointerEvents: "none",
                transform: "translate(-50%, -50%)",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="8" cy="8" r="6" fill={getCursorColor(connectionId)} />
              </svg>
            </div>
          );
        })}
      </div>
    </main>
  );
}

function getCursorColor(connectionId: number) {
  const colors = ["#E91E63", "#9C27B0", "#673AB7", "#3F51B5", "#2196F3", "#03A9F4", "#00BCD4", "#009688", "#4CAF50", "#8BC34A", "#CDDC39", "#FFEB3B", "#FFC107", "#FF9800", "#FF5722"];
  return colors[connectionId % colors.length];
}

export default function CursorsPage() {
  const params = useParams<{ room: string }>();
  const roomSegment =
    (Array.isArray(params?.room) ? params?.room[0] : params?.room) ||
    "default-room";

  const runId = process.env.NEXT_PUBLIC_ZEALT_RUN_ID;
  const roomId = runId ? `cursor-positions-${runId}` : `cursor-positions-${roomSegment}`;

  return (
    <Room roomId={roomId}>
      <CursorsCanvas />
    </Room>
  );
}
