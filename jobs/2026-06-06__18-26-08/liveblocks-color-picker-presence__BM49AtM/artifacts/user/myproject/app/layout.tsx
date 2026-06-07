import React from "react";

export const metadata = {
  title: "Liveblocks Collaborative Color Picker",
  description: "A collaborative color picker using Liveblocks presence",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
