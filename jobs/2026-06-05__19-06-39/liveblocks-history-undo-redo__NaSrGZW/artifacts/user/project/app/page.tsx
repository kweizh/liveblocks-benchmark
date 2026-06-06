import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Liveblocks Color Palette</h1>
      <p>
        Open <Link href="/palette/demo">/palette/demo</Link> to try the
        collaborative palette with undo/redo.
      </p>
    </main>
  );
}
