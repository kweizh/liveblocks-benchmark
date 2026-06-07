"use client";

import { useParams } from "next/navigation";
import { useState, useCallback } from "react";
import {
  useBroadcastEvent,
  useEventListener,
} from "@liveblocks/react/suspense";
import { Room } from "./Room";

const EMOJIS = ["🎉", "❤️", "🔥"] as const;

type Toast = { id: string; emoji: string };

function ReactionsBoard() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const broadcast = useBroadcastEvent();

  const appendToast = useCallback((emoji: string) => {
    setToasts((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, emoji },
    ]);
  }, []);

  useEventListener(({ event }) => {
    if (event.type === "EMOJI") {
      appendToast(event.emoji);
    }
  });

  const handleClick = useCallback(
    (emoji: string) => {
      broadcast({ type: "EMOJI", emoji });
      appendToast(emoji);
    },
    [broadcast, appendToast]
  );

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Emoji Reactions</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            data-emoji={emoji}
            type="button"
            onClick={() => handleClick(emoji)}
            style={{ fontSize: 24, padding: "8px 12px" }}
          >
            {emoji}
          </button>
        ))}
      </div>

      <p>
        Lifetime received reactions in this session:{" "}
        <span id="reactions-total-count">{toasts.length}</span>
      </p>

      <div
        id="reactions-feed"
        style={{
          minHeight: 60,
          padding: 8,
          border: "1px dashed #ccc",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="emoji-toast"
            data-emoji={toast.emoji}
            style={{ fontSize: 20 }}
          >
            {toast.emoji}
          </div>
        ))}
      </div>
    </main>
  );
}

export default function ReactionsPage() {
  const params = useParams<{ room: string }>();
  const roomId =
    (Array.isArray(params?.room) ? params?.room[0] : params?.room) ||
    "default-room";

  return (
    <Room roomId={roomId}>
      <ReactionsBoard />
    </Room>
  );
}
