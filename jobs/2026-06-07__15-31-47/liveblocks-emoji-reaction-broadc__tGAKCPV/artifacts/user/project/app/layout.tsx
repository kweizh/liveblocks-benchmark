import React from "react";

export const metadata = {
  title: "Liveblocks Emoji Reactions",
  description: "Ephemeral emoji reactions via Liveblocks broadcast events"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
