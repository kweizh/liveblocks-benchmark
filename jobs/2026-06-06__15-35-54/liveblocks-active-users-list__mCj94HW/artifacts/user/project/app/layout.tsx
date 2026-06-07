import React from "react";

export const metadata = {
  title: "Liveblocks Active Users",
  description: "Live list of users connected to a Liveblocks room"
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
