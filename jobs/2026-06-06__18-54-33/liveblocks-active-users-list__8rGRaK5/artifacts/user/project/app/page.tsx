import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Liveblocks Active Users List</h1>
      <p>
        Open <Link href="/active-users">/active-users</Link> in multiple
        browser windows to collaborate.
      </p>
    </main>
  );
}
