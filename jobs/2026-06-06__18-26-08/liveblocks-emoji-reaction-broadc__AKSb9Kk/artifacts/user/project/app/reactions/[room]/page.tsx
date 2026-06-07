"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useBroadcastEvent, useEventListener } from "@liveblocks/react/suspense";
import { Room } from "./Room";

const EMOJIS = ["🎉", "❤️", "🔥"] as const;

function ReactionsBoard() {
  const [toasts, setToasts] = useState<Array<{ id: string; emoji: string }>>([]);
  const broadcast = useBroadcastEvent();

  useEventListener(({ event }) => {
    if (event.type === "EMOJI") {
      setToasts((prev) => [
        ...prev,
        { id: `${prev.length}-${event.emoji}`, emoji: event.emoji }
      ]);
    }
  });

  const handleEmojiClick = (emoji: string) => {
    broadcast({ type: "EMOJI", emoji });
    setToasts((prev) => [
      ...prev,
      { id: `${prev.length}-${emoji}`, emoji }
    ]);
  };

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
          gap: 4
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="emoji-toast"
            data-emoji={toast.emoji}
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
