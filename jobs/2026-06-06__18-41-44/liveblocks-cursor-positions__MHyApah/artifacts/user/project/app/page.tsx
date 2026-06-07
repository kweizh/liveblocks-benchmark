import Link from "next/link";

export default function Home() {
  // Use the run ID to generate the room name, fallback to demo
  const runId = process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "demo";
  const roomName = process.env.NEXT_PUBLIC_ZEALT_RUN_ID ? `cursor-positions-${runId}` : "demo";
  
  return (
    <main style={{ padding: 24 }}>
      <h1>Liveblocks Live Cursors</h1>
      <p>
        Open <Link href={`/cursors/${roomName}`}>/cursors/{roomName}</Link> in two browser
        windows to see each other&apos;s cursors live.
      </p>
    </main>
  );
}
