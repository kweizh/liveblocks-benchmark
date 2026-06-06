import React from "react";

export const metadata = {
  title: "Liveblocks Collaborative Spreadsheet",
  description: "A 5x5 collaborative spreadsheet powered by Liveblocks Storage"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui", margin: 0 }}>{children}</body>
    </html>
  );
}
