export const metadata = {
  title: 'Liveblocks Undo/Redo Counter',
  description: 'Collaborative storage counter with undo/redo history',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
