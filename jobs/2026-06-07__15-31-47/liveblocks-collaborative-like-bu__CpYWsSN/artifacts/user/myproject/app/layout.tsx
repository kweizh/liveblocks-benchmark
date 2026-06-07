export const metadata = {
  title: "Liveblocks Like Button",
  description: "Collaborative like button using Liveblocks Storage",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
