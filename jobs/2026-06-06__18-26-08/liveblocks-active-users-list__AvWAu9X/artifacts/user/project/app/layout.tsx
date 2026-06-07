import React from "react";

export const metadata = {
  title: "Liveblocks Active Users List",
  description: "Realtime active-users list backed by Liveblocks v2 presence"
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
