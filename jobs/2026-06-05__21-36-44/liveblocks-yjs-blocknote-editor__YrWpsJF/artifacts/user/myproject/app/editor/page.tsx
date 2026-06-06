"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

// The run-id is used to namespace the default room so each test run is isolated.
const RUN_ID = process.env.NEXT_PUBLIC_ZEALT_RUN_ID ?? "";
const DEFAULT_ROOM = RUN_ID ? `blocknote-default-${RUN_ID}` : "blocknote-default";

// Dynamically import the heavy collaborative editor with SSR disabled.
// This avoids "document is not defined" errors from prosemirror / Yjs during SSR.
const CollaborativeEditorRoot = dynamic(
  () => import("./CollaborativeEditorRoot"),
  {
    ssr: false,
    loading: () => <p>Loading editor…</p>,
  }
);

function EditorInner() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("room") ?? DEFAULT_ROOM;

  return <CollaborativeEditorRoot roomId={roomId} />;
}

export default function EditorPage() {
  return (
    <main style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 12 }}>BlockNote × Liveblocks Yjs</h2>
      <Suspense fallback={<p>Loading editor…</p>}>
        <EditorInner />
      </Suspense>
    </main>
  );
}
