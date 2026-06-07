import type { ReactNode } from "react";

export const metadata = {
  title: "Liveblocks Collaborative Poll",
  description: "Collaborative poll demo using Liveblocks LiveMap",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
