"use client";

import { useMemo } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  useRoom,
} from "@liveblocks/react";
import { getYjsProviderForRoom } from "@liveblocks/yjs";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";

// ─── Collaborative editor — lives inside a RoomProvider ──────────────────────
function CollaborativeEditor({ roomId }: { roomId: string }) {
  const room = useRoom();

  // getYjsProviderForRoom is idempotent — same instance is returned each render.
  const provider = useMemo(() => getYjsProviderForRoom(room), [room]);

  // Shared Y.Doc XML fragment that BlockNote stores its blocks in.
  const ydoc = provider.getYDoc();
  const fragment = ydoc.getXmlFragment("document-store");

  // Generate stable per-session user identity (name + cursor color).
  const userInfo = useMemo(() => {
    const COLORS = [
      "#E57373", "#F06292", "#BA68C8", "#7986CB",
      "#64B5F6", "#4DB6AC", "#81C784", "#FFD54F",
    ];
    const NAMES = [
      "Alice", "Bob", "Carol", "Dave",
      "Eve", "Frank", "Grace", "Heidi",
    ];
    return {
      name: NAMES[Math.floor(Math.random() * NAMES.length)],
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally stable per session

  const editor = useCreateBlockNote({
    collaboration: {
      provider,
      fragment,
      user: {
        name: userInfo.name,
        color: userInfo.color,
      },
    },
  });

  async function handleSave() {
    try {
      const res = await fetch("/api/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, blocks: editor.document }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Snapshot saved! ${data.blockCount} block(s) stored.`);
      } else {
        alert("Failed to save snapshot.");
      }
    } catch (err) {
      alert(`Error saving snapshot: ${err}`);
    }
  }

  return (
    <div>
      <div
        style={{
          marginBottom: 8,
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <span style={{ fontWeight: 600 }}>Room:</span>
        <code
          style={{
            background: "#f3f4f6",
            padding: "2px 8px",
            borderRadius: 4,
          }}
        >
          {roomId}
        </code>
        <button
          onClick={handleSave}
          style={{
            marginLeft: "auto",
            padding: "6px 16px",
            background: "#4F46E5",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Save snapshot
        </button>
      </div>
      <BlockNoteView editor={editor} />
    </div>
  );
}

// ─── Root component exported for dynamic() import ────────────────────────────
export default function CollaborativeEditorRoot({ roomId }: { roomId: string }) {
  return (
    <LiveblocksProvider
      publicApiKey={process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!}
    >
      <RoomProvider id={roomId} initialPresence={{}}>
        <CollaborativeEditor roomId={roomId} />
      </RoomProvider>
    </LiveblocksProvider>
  );
}
