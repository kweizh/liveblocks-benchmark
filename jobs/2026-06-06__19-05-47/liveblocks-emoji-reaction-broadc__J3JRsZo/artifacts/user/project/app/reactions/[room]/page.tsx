"use client";

import { useParams } from "next/navigation";
import { useBroadcastEvent, useEventListener } from "@liveblocks/react/suspense";
import { useCallback, useState } from "react";
import { Room } from "./Room";

const EMOJIS = ["🎉", "❤️", "🔥"] as const;

function ReactionsBoard() {
  const broadcast = useBroadcastEvent();
  const [reactions, setReactions] = useState<{ emoji: string; id: number }[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const addReaction = useCallback((emoji: string) => {
    setReactions((prev) => [...prev, { emoji, id: Date.now() + Math.random() }]);
    setTotalCount((prev) => prev + 1);
  }, []);

  // Listen for emoji broadcasts from OTHER clients
  useEventListener(({ event }) => {
    if (event.type === "EMOJI") {
      addReaction(event.emoji);
    }
  });

  const handleClick = (emoji: string) => {
    // Broadcast to other clients
    broadcast({ type: "EMOJI", emoji });
    // Also append locally since useEventListener doesn't fire for self-broadcasts
    addReaction(emoji);
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
            style={{ fontSize: 24, padding: "8px 12px" }}
            onClick={() => handleClick(emoji)}
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
          gap: 4
        }}
      >
        {reactions.map((reaction) => (
          <div
            key={reaction.id}
            className="emoji-toast"
            data-emoji={reaction.emoji}
          >
            {reaction.emoji}
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