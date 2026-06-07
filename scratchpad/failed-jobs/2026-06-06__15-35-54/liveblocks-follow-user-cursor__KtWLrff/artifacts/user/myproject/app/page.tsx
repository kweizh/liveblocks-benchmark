"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  useUpdateMyPresence,
  useOthers,
} from "@liveblocks/react";

type Presence = {
  cursor: { x: number; y: number } | null;
};

const getColor = (connectionId: number) => {
  const colors = [
    "#E57373",
    "#F06292",
    "#BA68C8",
    "#9575CD",
    "#7986CB",
    "#64B5F6",
    "#4FC3F7",
    "#4DB6AC",
    "#81C784",
    "#AED581",
    "#FFD54F",
    "#FFB74D",
  ];
  return colors[connectionId % colors.length];
};

function Whiteboard() {
  const updateMyPresence = useUpdateMyPresence();
  const others = useOthers();
  const whiteboardRef = useRef<HTMLDivElement>(null);

  const [followedId, setFollowedId] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1000,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    setDimensions({ width: window.innerWidth, height: window.innerHeight });

    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const followedUser = others.find((user) => user.connectionId === followedId);
  const followedCursor = followedUser?.presence?.cursor as { x: number; y: number } | null | undefined;

  let tx = 0;
  let ty = 0;
  let transformStyle = "none";

  if (followedId !== null && followedCursor) {
    tx = dimensions.width / 2 - followedCursor.x;
    ty = dimensions.height / 2 - followedCursor.y;
    transformStyle = `translate(${tx}px, ${ty}px)`;
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!whiteboardRef.current) return;
    const rect = whiteboardRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Calculate coordinates in canvas space
    const canvasX = clientX - tx;
    const canvasY = clientY - ty;

    updateMyPresence({
      cursor: { x: canvasX, y: canvasY },
    });
  };

  const handlePointerLeave = () => {
    updateMyPresence({
      cursor: null,
    });
  };

  const handleAvatarClick = (connectionId: number) => {
    setFollowedId((prev) => (prev === connectionId ? null : connectionId));
  };

  return (
    <div
      ref={whiteboardRef}
      data-testid="whiteboard-area"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#fafafa",
        userSelect: "none",
        touchAction: "none",
      }}
    >
      {/* Canvas Wrapper */}
      <div
        data-testid="canvas-pan"
        style={{
          transform: transformStyle,
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          backgroundImage: "radial-gradient(#ccc 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          transition: "transform 0.1s ease-out",
        }}
      >
        {/* Instructions inside canvas so they pan as well */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            textAlign: "center",
            color: "#aaa",
          }}
        >
          <h1 style={{ margin: "0 0 8px 0", fontSize: "2.5rem" }}>
            Liveblocks Whiteboard
          </h1>
          <p style={{ margin: "0 0 4px 0" }}>
            Move your mouse to broadcast your cursor.
          </p>
          <p style={{ margin: "0" }}>
            Click on another user's avatar in the sidebar to follow them.
          </p>
        </div>

        {/* Other Users' Cursors */}
        {others.map(({ connectionId, presence }) => {
          const cursor = presence?.cursor as { x: number; y: number } | null | undefined;
          if (!cursor) return null;
          const { x, y } = cursor;
          const color = getColor(connectionId);
          return (
            <div
              key={connectionId}
              style={{
                position: "absolute",
                left: x,
                top: y,
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                zIndex: 5,
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.3))" }}
              >
                <path
                  d="M5.65376 12.3825L19.5605 4.51343C21.1141 3.6331 22.9515 4.96213 22.6101 6.72147L19.5583 22.4514C19.2435 24.0739 17.0694 24.3419 16.3776 22.8893L12.4414 14.6169L5.1633 14.6021C3.51834 14.5988 2.62884 12.6074 3.75452 11.4054L5.65376 12.3825Z"
                  fill={color}
                  stroke="white"
                  strokeWidth="2"
                />
              </svg>
              <span
                style={{
                  background: color,
                  color: "white",
                  fontSize: "12px",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  whiteSpace: "nowrap",
                  fontWeight: "bold",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                }}
              >
                User {connectionId}
              </span>
            </div>
          );
        })}
      </div>

      {/* Sidebar - fixed on top of the whiteboard area */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          background: "rgba(255, 255, 255, 0.95)",
          padding: "16px",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          zIndex: 10,
          maxHeight: "80vh",
          overflowY: "auto",
          width: "220px",
          border: "1px solid #eaeaea",
        }}
      >
        <h3
          style={{
            margin: "0 0 4px 0",
            fontSize: "14px",
            color: "#333",
            fontWeight: "bold",
            letterSpacing: "0.5px",
          }}
        >
          Active Users
        </h3>
        {others.length === 0 ? (
          <div style={{ fontSize: "12px", color: "#888", fontStyle: "italic" }}>
            No other users connected
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {others.map((user) => {
              const isFollowing = followedId === user.connectionId;
              const color = getColor(user.connectionId);
              return (
                <button
                  key={user.connectionId}
                  data-testid="follow-avatar"
                  data-connection-id={String(user.connectionId)}
                  data-following={isFollowing ? "true" : "false"}
                  onClick={() => handleAvatarClick(user.connectionId)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    background: isFollowing ? `${color}15` : "transparent",
                    border: isFollowing ? `2px solid ${color}` : "1px solid #e0e0e0",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    transition: "all 0.2s ease",
                    outline: "none",
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: color,
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: "bold",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    U
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: isFollowing ? "bold" : "500",
                        color: "#333",
                      }}
                    >
                      User {user.connectionId}
                    </span>
                    <span style={{ fontSize: "10px", color: "#888" }}>
                      {isFollowing ? "Following" : "Click to follow"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  const publicApiKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY || "";
  const roomId = `whiteboard-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "local-dev"}`;

  return (
    <LiveblocksProvider publicApiKey={publicApiKey}>
      <RoomProvider id={roomId} initialPresence={{ cursor: null }}>
        <Whiteboard />
      </RoomProvider>
    </LiveblocksProvider>
  );
}
