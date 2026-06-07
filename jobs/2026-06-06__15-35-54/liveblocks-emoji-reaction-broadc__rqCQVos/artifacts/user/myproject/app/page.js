"use client";

import React, { useState, useCallback } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  useBroadcastEvent,
  useEventListener,
} from "@liveblocks/react";

function EmojiReactionApp() {
  const [reactions, setReactions] = useState([]);
  const broadcast = useBroadcastEvent();

  const addReaction = useCallback((emoji) => {
    const id = `${Date.now()}-${Math.random()}`;
    // Random position between 10% and 90% of the screen width
    const left = Math.floor(Math.random() * 80) + 10;

    setReactions((prev) => [...prev, { id, emoji, left }]);

    // Remove the reaction after 2200ms (ensuring it is visible for at least 2 seconds)
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2200);
  }, []);

  // Listen for broadcasted reactions from other clients
  useEventListener(({ event }) => {
    if (event && event.type === "REACTION" && event.emoji) {
      addReaction(event.emoji);
    }
  });

  const handleEmojiClick = useCallback(
    (emoji) => {
      // 1. Broadcast to other room members
      broadcast({ type: "REACTION", emoji });
      // 2. Display on local screen for immediate feedback
      addReaction(emoji);
    },
    [broadcast, addReaction]
  );

  const emojis = ["👍", "❤️", "🎉", "😂"];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "16px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
          maxWidth: "450px",
          width: "100%",
        }}
      >
        <h1 style={{ fontSize: "24px", marginBottom: "10px", color: "#333" }}>
          Liveblocks Emoji Reactions
        </h1>
        <p style={{ fontSize: "14px", color: "#666", marginBottom: "30px" }}>
          Click any emoji below to send a floating reaction to everyone in the room!
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "15px",
            flexWrap: "wrap",
          }}
        >
          {emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              style={{
                fontSize: "2.5rem",
                padding: "12px 20px",
                border: "2px solid #e2e8f0",
                borderRadius: "12px",
                background: "white",
                cursor: "pointer",
                transition: "transform 0.1s, border-color 0.2s, box-shadow 0.2s",
                boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#3b82f6";
                e.currentTarget.style.transform = "scale(1.1)";
                e.currentTarget.style.boxShadow = "0 6px 12px rgba(59, 130, 246, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.02)";
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="reactions-container">
        {reactions.map((r) => (
          <div
            key={r.id}
            className="reaction"
            data-testid="floating-reaction"
            style={{ left: `${r.left}%` }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      <style>{`
        .reactions-container {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          pointer-events: none;
          overflow: hidden;
          z-index: 9999;
        }

        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(0.8);
            opacity: 0;
          }
          15% {
            opacity: 1;
            transform: translateY(-20vh) scale(1.2);
          }
          85% {
            opacity: 1;
          }
          100% {
            transform: translateY(-95vh) scale(1);
            opacity: 0;
          }
        }

        .reaction {
          position: absolute;
          bottom: 0;
          font-size: 3.5rem;
          pointer-events: none;
          user-select: none;
          animation: floatUp 2.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default function Page() {
  const publicApiKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY;
  const runId = process.env.NEXT_PUBLIC_ZEALT_RUN_ID;
  const roomId = `harbor-emoji-reaction-${runId || "default"}`;

  if (!publicApiKey) {
    return (
      <div
        style={{
          padding: "40px",
          fontFamily: "-apple-system, sans-serif",
          textAlign: "center",
        }}
      >
        <h1 style={{ color: "#ef4444" }}>Configuration Error</h1>
        <p>Missing NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY environment variable.</p>
      </div>
    );
  }

  return (
    <LiveblocksProvider publicApiKey={publicApiKey}>
      <RoomProvider id={roomId}>
        <EmojiReactionApp />
      </RoomProvider>
    </LiveblocksProvider>
  );
}
