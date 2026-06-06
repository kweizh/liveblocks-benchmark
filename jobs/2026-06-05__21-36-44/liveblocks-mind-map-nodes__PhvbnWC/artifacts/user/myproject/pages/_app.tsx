import type { AppProps } from "next/app";
import { LiveMap } from "@liveblocks/client";
import { RoomProvider } from "../liveblocks.config";

const RUN_ID = process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "local";
const ROOM_ID = `mind-map-${RUN_ID}`;

export default function App({ Component, pageProps }: AppProps) {
  return (
    <RoomProvider
      id={ROOM_ID}
      initialPresence={{ cursor: null }}
      initialStorage={{ nodes: new LiveMap() }}
    >
      <Component {...pageProps} />
    </RoomProvider>
  );
}
