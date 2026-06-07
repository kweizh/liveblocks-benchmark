"use client";

import { useParams } from "next/navigation";
import { Room } from "./Room";
import { useBroadcastEvent, useEventListener } from "@liveblocks/react/suspense";
import { useState, useCallback } from "react";

// TODO: wire up Liveblocks broadcast / event listening per instruction.md.
// - Broadcast { type: "EMOJI", emoji } when a button is clicked.
// - Receive events from OTHER clients and append
//   <div class="emoji-toast" data-emoji="..."> to #reactions-feed.
// - Locally append the toast for the SENDER too (the listener does not
//   fire for self-broadcasts).
// - Keep a running count inside #reactions-total-count.

const EMOJIS = ["🎉", "❤️", "🔥"] as const;

type Reaction = {
  emoji: string;
  id: number;
};

function ReactionsBoard() {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const broadcast = useBroadcastEvent();

  const addReaction = useCallback((emoji: string) => {
    setReactions((prev) => [...prev, { emoji, id: Date.now() + Math.random() }]);
  }, []);

  useEventListener(({ event }) => {
    if (event.type === "EMOJI") {
      addReaction(event.emoji);
    }
  });

  const handleEmojiClick = (emoji: string) => {
    // 1. Broadcast to others
    broadcast({ type: "EMOJI", emoji });
    // 2. Add locally for sender
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
            onClick={() => handleEmojiClick(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>

      <p>
        Lifetime received reactions in this session:{" "}
        <span id="reactions-total-count">{reactions.length}</span>
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
  const roomIdSegment =
    (Array.isArray(params?.room) ? params?.room[0] : params?.room) ||
    "default-room";

  // The room name during verification MUST be derived from NEXT_PUBLIC_ZEALT_RUN_ID
  const runId = process.env.NEXT_PUBLIC_ZEALT_RUN_ID;
  const roomId = runId ? `emoji-reactions-${runId}` : roomIdSegment;

  return (
    <Room roomId={roomId}>
      <ReactionsBoard />
    </Room>
  );
}
