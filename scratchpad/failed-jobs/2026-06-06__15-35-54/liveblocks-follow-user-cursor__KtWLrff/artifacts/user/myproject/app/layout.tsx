import React from "react";

export const metadata = {
  title: "Liveblocks Whiteboard",
  description: "Collaborative whiteboard with follow-user-cursor mode",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, overflow: "hidden", fontFamily: "sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
