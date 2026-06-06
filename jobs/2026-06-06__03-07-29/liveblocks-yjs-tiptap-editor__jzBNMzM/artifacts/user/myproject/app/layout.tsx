import "./globals.css";

export const metadata = {
  title: "Liveblocks Yjs Tiptap Editor",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
