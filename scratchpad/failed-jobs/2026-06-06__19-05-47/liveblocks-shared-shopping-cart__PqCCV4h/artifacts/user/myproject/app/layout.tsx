import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shared Shopping Cart",
  description: "Real-time multiplayer shopping cart with Liveblocks",
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