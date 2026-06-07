import { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Liveblocks Shared Shopping Cart",
  description: "A real-time shared shopping cart",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
