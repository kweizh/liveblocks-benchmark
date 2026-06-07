export const metadata = {
  title: "Shared Todo List",
  description: "Collaborative todo list powered by Liveblocks.",
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
