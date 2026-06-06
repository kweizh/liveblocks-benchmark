import type { AppProps } from "next/app";
import { LiveblocksProvider, RoomProvider } from "@liveblocks/react";
import { LiveMap } from "@liveblocks/client";

const RUN_ID = process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "local";
const ROOM_ID = `mind-map-${RUN_ID}`;

export default function App({ Component, pageProps }: AppProps) {
  const publicKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY || "";
  return (
    <LiveblocksProvider publicApiKey={publicKey}>
      <RoomProvider
        id={ROOM_ID}
        initialPresence={{}}
        initialStorage={{
          nodes: new LiveMap(),
        }}
      >
        <Component {...pageProps} />
      </RoomProvider>
    </LiveblocksProvider>
  );
}
