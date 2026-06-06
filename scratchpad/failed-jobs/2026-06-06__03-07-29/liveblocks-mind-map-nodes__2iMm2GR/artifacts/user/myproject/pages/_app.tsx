import type { AppProps } from "next/app";
import { LiveblocksProvider } from "@liveblocks/react";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <Component {...pageProps} />
    </LiveblocksProvider>
  );
}