import type { ReactNode } from "react";

export const metadata = {
  title: "Liveblocks Like Button",
  description: "Collaborative like button demo",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
