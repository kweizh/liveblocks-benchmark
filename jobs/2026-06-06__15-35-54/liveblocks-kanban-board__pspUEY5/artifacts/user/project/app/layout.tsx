export const metadata = {
  title: "Kanban Board",
  description: "Collaborative 3-column Kanban board powered by Liveblocks.",
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
