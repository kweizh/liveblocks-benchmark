"use client";

import { useParams } from "next/navigation";
import { Room } from "./Room";
import { useState } from "react";
import { useBroadcastEvent, useEventListener } from "@liveblocks/react/suspense";

// TODO: wire up Liveblocks broadcast / event listening per instruction.md.
// - Broadcast { type: "EMOJI", emoji } when a button is clicked.
// - Receive events from OTHER clients and append
//   <div class="emoji-toast" data-emoji="..."> to #reactions-feed.
// - Locally append the toast for the SENDER too (the listener does not
//   fire for self-broadcasts).
// - Keep a running count inside #reactions-total-count.

const EMOJIS = ["🎉", "❤️", "🔥"] as const;

function ReactionsBoard() {
  const [reactions, setReactions] = useState<{ id: string; emoji: string }[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const broadcast = useBroadcastEvent();

  useEventListener(({ event }) => {
    if (event.type === "EMOJI") {
      setReactions((prev) => [...prev, { id: Math.random().toString(), emoji: event.emoji }]);
      setTotalCount((prev) => prev + 1);
    }
  });

  const handleClick = (emoji: string) => {
    broadcast({ type: "EMOJI", emoji });
    setReactions((prev) => [...prev, { id: Math.random().toString(), emoji }]);
    setTotalCount((prev) => prev + 1);
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
        {reactions.map((r) => (
          <div key={r.id} className="emoji-toast" data-emoji={r.emoji}>
            {r.emoji}
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
