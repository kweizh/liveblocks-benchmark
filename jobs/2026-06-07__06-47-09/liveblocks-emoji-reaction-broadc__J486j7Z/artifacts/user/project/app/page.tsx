import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Liveblocks Emoji Reactions</h1>
      <p>
        Open <Link href="/reactions/demo">/reactions/demo</Link> to try the
        ephemeral emoji broadcast page.
      </p>
    </main>
  );
}
