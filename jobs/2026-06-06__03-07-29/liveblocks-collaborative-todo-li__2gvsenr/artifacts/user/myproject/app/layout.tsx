import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "Liveblocks Collaborative Todo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
