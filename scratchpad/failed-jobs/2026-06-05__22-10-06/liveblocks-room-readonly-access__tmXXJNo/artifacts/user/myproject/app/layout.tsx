import type { ReactNode } from "react";

export const metadata = {
  title: "Liveblocks Read-Only Room Demo",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
