import EditorWrapper from "./components/EditorWrapper";

export default function EditorPage({ searchParams }: { searchParams: { room?: string } }) {
  const roomId = searchParams.room || process.env.ZEALT_RUN_ID || "blocknote-default";
  const liveblocksPublicKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY || "";
  
  return (
    <main style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>BlockNote Liveblocks Editor</h2>
      <EditorWrapper roomId={roomId} liveblocksPublicKey={liveblocksPublicKey} />
    </main>
  );
}
