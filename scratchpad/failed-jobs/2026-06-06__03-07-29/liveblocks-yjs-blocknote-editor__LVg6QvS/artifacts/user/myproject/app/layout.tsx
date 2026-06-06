import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";

export const metadata = {
  title: "BlockNote Liveblocks Editor",
  description: "Collaborative BlockNote editor with Liveblocks Yjs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}