import Link from "next/link";

export default function Home() {
  const roomId = process.env.ZEALT_RUN_ID ? `palette-room-${process.env.ZEALT_RUN_ID}` : "demo";
  return (
    <main style={{ padding: 24 }}>
      <h1>Liveblocks Color Palette</h1>
      <p>
        Open <Link href={`/palette/${roomId}`}>/palette/{roomId}</Link> to try the
        collaborative palette with undo/redo.
      </p>
    </main>
  );
}
