import React from "react";

export const metadata = {
  title: "Liveblocks Color Palette",
  description: "Collaborative color palette with history (undo/redo)"
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
