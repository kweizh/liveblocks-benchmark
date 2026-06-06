"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { LiveblocksProvider, RoomProvider, useRoom } from "@liveblocks/react";
import { getYjsProviderForRoom } from "@liveblocks/yjs";

// Random color generator for user cursors
const CURSOR_COLORS = [
  "#f472b6", // pink
  "#fb923c", // orange
  "#facc15", // yellow
  "#4ade80", // green
  "#22d3ee", // cyan
  "#818cf8", // indigo
  "#c084fc", // purple
  "#f87171", // red
  "#34d399", // emerald
  "#60a5fa", // blue
];

const CURSOR_NAMES = [
  "Alice",
  "Bob",
  "Carol",
  "Dave",
  "Eve",
  "Frank",
  "Grace",
  "Hank",
  "Ivy",
  "Jack",
];

// Persist the random user for this browser session
let cachedUser: { name: string; color: string } | null = null;
function getSessionUser() {
  if (!cachedUser) {
    const idx = Math.floor(Math.random() * CURSOR_NAMES.length);
    cachedUser = {
      name: CURSOR_NAMES[idx],
      color: CURSOR_COLORS[idx],
    };
  }
  return cachedUser;
}

function EditorContent({ roomId }: { roomId: string }) {
  const room = useRoom();
  const user = getSessionUser();

  // Create the Yjs provider for the room
  const provider = useMemo(() => {
    return getYjsProviderForRoom(room as any);
  }, [room]);

  // Get the Y.Doc from the provider
  const doc = useMemo(() => {
    return provider.getYDoc();
  }, [provider]);

  // Get the XML fragment for BlockNote
  const fragment = useMemo(() => {
    return doc.getXmlFragment("document-store");
  }, [doc]);

  // Create the BlockNote editor with collaboration
  const editor = useCreateBlockNote({
    collaboration: {
      fragment,
      user: {
        name: user.name,
        color: user.color,
      },
      provider,
    },
  } as any);

  const [saving, setSaving] = useState(false);

  const handleSaveSnapshot = useCallback(async () => {
    if (!editor) return;
    setSaving(true);
    try {
      const blocks = editor.document;
      const response = await fetch("/api/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, blocks }),
      });
      const result = await response.json();
      if (result.ok) {
        alert(`Snapshot saved! ${result.blockCount} blocks.`);
      } else {
        alert("Failed to save snapshot.");
      }
    } catch (err) {
      console.error("Failed to save snapshot", err);
      alert("Failed to save snapshot.");
    } finally {
      setSaving(false);
    }
  }, [editor, roomId]);

  return (
    <div style={{ padding: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <h2 style={{ margin: 0 }}>BlockNote Collaborative Editor</h2>
        <button
          onClick={handleSaveSnapshot}
          disabled={saving}
          style={{
            padding: "8px 16px",
            backgroundColor: "#0d9488",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: saving ? "not-allowed" : "pointer",
            fontSize: 14,
            fontWeight: 600,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Saving..." : "Save snapshot"}
        </button>
      </div>
      <p style={{ margin: "0 0 8px 0", fontSize: 13, color: "#666" }}>
        Room: <code>{roomId}</code> &middot; User:{" "}
        <span style={{ color: user.color }}>{user.name}</span>
      </p>
      <BlockNoteView editor={editor} />
    </div>
  );
}

function EditorWithRoom({ roomId }: { roomId: string }) {
  return (
    <RoomProvider id={roomId}>
      <EditorContent roomId={roomId} />
    </RoomProvider>
  );
}

function EditorPageInner() {
  const searchParams = useSearchParams();
  const roomId =
    searchParams.get("room") ||
    process.env.NEXT_PUBLIC_DEFAULT_ROOM ||
    "blocknote-default";

  return (
    <LiveblocksProvider
      authEndpoint={async (room) => {
        const user = getSessionUser();
        const response = await fetch("/api/liveblocks-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            room,
            userInfo: { name: user.name, color: user.color },
          }),
        });
        return response.json();
      }}
    >
      <EditorWithRoom roomId={roomId} />
    </LiveblocksProvider>
  );
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 16 }}>Loading editor...</div>
      }
    >
      <EditorPageInner />
    </Suspense>
  );
}