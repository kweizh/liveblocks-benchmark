import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Liveblocks Follow User Cursor</h1>
      <p>
        Open <Link href="/follow/demo">/follow/demo</Link> in two browser
        windows to collaborate.
      </p>
    </main>
  );
}
