import React from "react";

export const metadata = {
  title: "Liveblocks Collaborative Form",
  description: "Collaborative form backed by Liveblocks Storage"
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
