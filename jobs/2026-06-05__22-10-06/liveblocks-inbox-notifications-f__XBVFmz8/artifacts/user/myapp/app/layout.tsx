import "@liveblocks/react-ui/styles.css";
import { Providers } from "./Providers";

export const metadata = {
  title: "Inbox",
  description: "Liveblocks inbox notifications feed",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
