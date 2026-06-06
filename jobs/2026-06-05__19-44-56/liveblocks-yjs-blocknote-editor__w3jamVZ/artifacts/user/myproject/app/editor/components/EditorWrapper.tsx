"use client";

import { useEffect, useState } from "react";
import { LiveblocksProvider, RoomProvider, useRoom, ClientSideSuspense } from "@liveblocks/react/suspense";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import * as Y from "yjs";

function BlockNote({ doc, provider, roomId }: { doc: Y.Doc, provider: any, roomId: string }) {
  // get random name and color
  const [name] = useState(() => "User " + Math.floor(Math.random() * 100));
  const [color] = useState(() => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));

  const editor = useCreateBlockNote({
    collaboration: {
      provider,
      fragment: doc.getXmlFragment("document-store"),
      user: {
        name,
        color,
      },
    },
  });

  const saveSnapshot = async () => {
    const blocks = editor.document;
    const res = await fetch("/api/snapshots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, blocks }),
    });
    const data = await res.json();
    console.log("Snapshot saved:", data);
  };

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <button onClick={saveSnapshot} style={{ padding: "8px 16px", background: "#0070f3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          Save snapshot
        </button>
      </div>
      <BlockNoteView editor={editor} />
    </div>
  );
}

function Editor({ roomId }: { roomId: string }) {
  const room = useRoom();
  const [doc, setDoc] = useState<Y.Doc>();
  const [provider, setProvider] = useState<any>();

  useEffect(() => {
    const yDoc = new Y.Doc();
    const yProvider = new LiveblocksYjsProvider(room, yDoc);
    setDoc(yDoc);
    setProvider(yProvider);

    return () => {
      yDoc.destroy();
      yProvider.destroy();
    };
  }, [room]);

  if (!doc || !provider) {
    return <div>Loading Yjs...</div>;
  }

  return <BlockNote doc={doc} provider={provider} roomId={roomId} />;
}

export default function EditorWrapper({ roomId, liveblocksPublicKey }: { roomId: string, liveblocksPublicKey: string }) {
  // We use NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY for client side auth
  return (
    <LiveblocksProvider publicApiKey={liveblocksPublicKey}>
      <RoomProvider id={roomId}>
        <ClientSideSuspense fallback={<div>Loading room...</div>}>
          <Editor roomId={roomId} />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
