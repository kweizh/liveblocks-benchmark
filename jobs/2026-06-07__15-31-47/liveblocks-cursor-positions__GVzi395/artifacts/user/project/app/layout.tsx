import React from "react";

export const metadata = {
  title: "Liveblocks Live Cursors",
  description: "Live cursor positions broadcast through Liveblocks Presence"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
