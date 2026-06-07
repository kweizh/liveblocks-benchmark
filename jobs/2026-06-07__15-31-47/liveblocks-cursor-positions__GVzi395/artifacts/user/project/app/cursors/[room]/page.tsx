"use client";

import { useParams } from "next/navigation";
import { Room } from "./Room";

// TODO: implement live cursor broadcasting per instruction.md.
//
// You must:
//   1. Wire pointer events on `#cursors-container` into the current user's
//      Presence (`cursor: { x, y } | null`) using the Liveblocks v2 React API.
//   2. Render every remote user's cursor as a colored SVG dot positioned at
//      that user's broadcast coordinates. Each rendered cursor element must
//      carry the connection-id and integer pixel coordinates as data
//      attributes (see instruction.md for the exact attribute names).
//   3. When the pointer leaves the container, set the current user's cursor
//      back to `null` so other clients stop seeing your dot.

function CursorsCanvas() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Live Cursors</h1>
      <div
        id="cursors-container"
        style={{
          position: "relative",
          width: 800,
          height: 600,
          background: "#f8f8f8",
          border: "1px solid #ccc",
          overflow: "hidden"
        }}
      >
        {/* TODO: render remote cursors here (see instruction.md). */}
      </div>
    </main>
  );
}

export default function CursorsPage() {
  const params = useParams<{ room: string }>();
  const roomId =
    (Array.isArray(params?.room) ? params?.room[0] : params?.room) ||
    "default-room";

  return (
    <Room roomId={roomId}>
      <CursorsCanvas />
    </Room>
  );
}
