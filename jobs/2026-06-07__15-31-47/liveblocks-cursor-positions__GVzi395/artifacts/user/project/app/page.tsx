import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Liveblocks Live Cursors</h1>
      <p>
        Open <Link href="/cursors/demo">/cursors/demo</Link> in two browser
        windows to see each other&apos;s cursors live.
      </p>
    </main>
  );
}
