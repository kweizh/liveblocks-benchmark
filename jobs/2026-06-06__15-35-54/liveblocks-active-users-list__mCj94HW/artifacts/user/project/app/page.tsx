import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Liveblocks Active Users</h1>
      <p>
        Open <Link href="/users/demo">/users/demo</Link> to see who is
        connected to the demo room.
      </p>
    </main>
  );
}
