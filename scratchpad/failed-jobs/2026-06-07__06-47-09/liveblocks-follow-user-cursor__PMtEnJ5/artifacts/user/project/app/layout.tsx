import React from "react";

export const metadata = {
  title: "Liveblocks Follow User Cursor",
  description: "Click another user's avatar to follow their cursor"
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
