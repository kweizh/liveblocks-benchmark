"use client";

import { Room } from "./Room";
import { useUpdateMyPresence, useOthers } from "@liveblocks/react/suspense";
import { useCallback, useRef } from "react";

function CursorsCanvas() {
  const updateMyPresence = useUpdateMyPresence();
  const others = useOthers();
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);
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
        {others.map((other) => {
          if (other.presence.cursor == null) return null;
          const { x, y } = other.presence.cursor;
          return (
            <div
              key={other.connectionId}
              data-cursor-user={other.connectionId}
              data-x={String(x)}
              data-y={String(y)}
              style={{
                position: "absolute",
                left: x,
                top: y,
                pointerEvents: "none",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16">
                <circle cx="8" cy="8" r="8" fill="red" />
              </svg>
            </div>
          );
        })}
      </div>
    </main>
  );
}

export default function CursorsPage() {
  const roomId = `cursor-positions-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID}`;

  return (
    <Room roomId={roomId}>
      <CursorsCanvas />
    </Room>
  );
}