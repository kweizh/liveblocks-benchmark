"use client";

import { Composer, Thread } from "@liveblocks/react-ui";
import { useThreads } from "@liveblocks/react/suspense";

export function CommentsPanel() {
  const { threads } = useThreads();
  return (
    <div style={{ maxWidth: 560, margin: "32px auto", padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 18, marginBottom: 12 }}>Comments</h1>
      <Composer />
      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        {threads.map((thread) => (
          <Thread key={thread.id} thread={thread} />
        ))}
      </div>
    </div>
  );
}
