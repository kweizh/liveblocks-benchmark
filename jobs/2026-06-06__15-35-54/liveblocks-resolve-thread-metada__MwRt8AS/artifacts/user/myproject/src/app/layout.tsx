import "@liveblocks/react-ui/styles.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Liveblocks Comments Sidebar",
  description: "Liveblocks Comments Sidebar with Resolvable Threads",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
