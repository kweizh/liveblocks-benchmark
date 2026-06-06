"use client";

import { useSearchParams } from "next/navigation";
import { LiveblocksProvider, RoomProvider, useSelf } from "@liveblocks/react";
import { getYjsProviderForRoom } from "@liveblocks/yjs";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import * as Y from "yjs";
import { useEffect, useState, useMemo } from "react";
import "@blocknote/mantine/style.css";

function Editor({ roomId }: { roomId: string }) {
  const [provider, setProvider] = useState<any>(null);
  const self = useSelf();

  useEffect(() => {
    const yDoc = new Y.Doc();
    const yProvider = getYjsProviderForRoom(yDoc);
    setProvider(yProvider);

    return () => {
      yDoc.destroy();
      yProvider.destroy();
    };
  }, []);

  if (!provider || !self) {
    return <div>Loading...</div>;
  }

  return <BlockNoteEditor roomId={roomId} provider={provider} user={self.info} />;
}

function BlockNoteEditor({
  roomId,
  provider,
  user,
}: {
  roomId: string;
  provider: any;
  user: any;
}) {
  const editor = useCreateBlockNote({
    collaboration: {
      provider,
      fragment: provider.getYDoc().getXmlFragment("document-store"),
      user: {
        name: user.name,
        color: user.color,
      },
    },
  });

  const saveSnapshot = async () => {
    const blocks = editor.document;
    const response = await fetch("/api/snapshots", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ roomId, blocks }),
    });

    if (response.ok) {
      const result = await response.json();
      alert(`Snapshot saved! Block count: ${result.blockCount}`);
    } else {
      alert("Failed to save snapshot");
    }
  };

  return (
    <main style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2>BlockNote editor ({roomId})</h2>
        <button 
          onClick={saveSnapshot}
          style={{
            padding: "8px 16px",
            backgroundColor: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Save snapshot
        </button>
      </div>
      <BlockNoteView editor={editor} />
    </main>
  );
}

export default function EditorPage() {
  const searchParams = useSearchParams();
  const room = searchParams.get("room") || "blocknote-default";

  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id={room}>
        <Editor roomId={room} />
      </RoomProvider>
    </LiveblocksProvider>
  );
}
