"use client";

import { Composer } from "@liveblocks/react-ui";

// TODO (executor): Extend this sidebar to show two tabs ("Active" / "Resolved"),
// list threads from useThreads() filtered by metadata.resolved, and add a
// Resolve button per thread that calls useEditThreadMetadata to set
// { resolved: true } on the thread.
export function CommentsSidebar() {
  return (
    <div style={{ width: 360, padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 18, marginBottom: 12 }}>Comments</h1>
      <Composer />
    </div>
  );
}
