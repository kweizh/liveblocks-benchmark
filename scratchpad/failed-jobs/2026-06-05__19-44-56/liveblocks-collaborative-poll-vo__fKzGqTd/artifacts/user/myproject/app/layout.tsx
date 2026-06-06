export const metadata = {
  title: "Liveblocks Poll",
  description: "Collaborative poll voting",
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
