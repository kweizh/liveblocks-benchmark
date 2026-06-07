import React from "react";

export const metadata = {
  title: "Liveblocks Shared Stopwatch",
  description: "Collaborative stopwatch built on Liveblocks Storage"
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
