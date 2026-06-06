import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>BlockNote Liveblocks Editor</h1>
      <p>
        Open the editor at{" "}
        <Link href="/editor?room=demo">/editor?room=demo</Link>.
      </p>
    </main>
  );
}