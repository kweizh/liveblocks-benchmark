import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div style={{ margin: 0, padding: 0, overflow: "hidden" }}>
      <Component {...pageProps} />
    </div>
  );
}
