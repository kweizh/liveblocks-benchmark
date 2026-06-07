import type { AppProps } from "next/app";
import { LiveblocksProvider, RoomProvider } from "@liveblocks/react";
import { LiveList } from "@liveblocks/client";
import "../liveblocks.config";

const RUN_ID = process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "local";
const ROOM_ID = `whiteboard-${RUN_ID}`;

// Derive user color from the ?user=<n> query param.
// n=1 → red, n=2 → blue, default → green
function getUserColor(): string {
  if (typeof window === "undefined") return "#059669";
  const params = new URLSearchParams(window.location.search);
  const n = params.get("user");
  if (n === "1") return "#DC2626";
  if (n === "2") return "#2563EB";
  return "#059669";
}

export default function App({ Component, pageProps }: AppProps) {
  const publicKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY || "";
  const userColor = getUserColor();

  return (
    <LiveblocksProvider publicApiKey={publicKey}>
      <RoomProvider
        id={ROOM_ID}
        initialPresence={{ selectedShapeId: null, color: userColor }}
        initialStorage={{ shapes: new LiveList([]) }}
      >
        <Component {...pageProps} />
      </RoomProvider>
    </LiveblocksProvider>
  );
}
