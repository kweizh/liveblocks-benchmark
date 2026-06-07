"use client";

import { useParams } from "next/navigation";
import { useState, useCallback } from "react";
import {
  useBroadcastEvent,
  useEventListener,
} from "@liveblocks/react/suspense";
import { Room } from "./Room";

const EMOJIS = ["🎉", "❤️", "🔥"] as const;

type Toast = {
  id: string;
  emoji: string;
};

function ReactionsBoard() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const broadcast = useBroadcastEvent();

  const appendToast = useCallback((emoji: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, emoji }]);
    setTotalCount((prev) => prev + 1);
  }, []);

  // Listen for events from OTHER clients
  useEventListener(({ event }) => {
    if (event.type === "EMOJI") {
      appendToast(event.emoji);
    }
  });

  const handleEmojiClick = useCallback(
    (emoji: string) => {
      // Broadcast to other clients
      broadcast({ type: "EMOJI", emoji });
      // Also append locally (useEventListener doesn't fire for sender's own events)
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
            onClick={() => handleEmojiClick(emoji)}
            style={{ fontSize: 24, padding: "8px 12px" }}
          >
            {emoji}
          </button>
        ))}
      </div>

      <p>
        Lifetime received reactions in this session:{" "}
        <span id="reactions-total-count">{totalCount}</span>
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
