import { ReactNode } from "react";
import { Providers } from "./Providers";
import "./globals.css";

export const metadata = {
  title: "Liveblocks Shared Pixel Grid",
  description: "A real-time collaborative pixel grid built with Next.js and Liveblocks v2",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
