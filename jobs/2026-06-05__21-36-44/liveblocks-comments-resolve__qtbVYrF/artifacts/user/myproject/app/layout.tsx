import type { ReactNode } from "react";
import "@liveblocks/react-ui/styles.css";

export const metadata = {
  title: "Liveblocks Comments Resolve",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
