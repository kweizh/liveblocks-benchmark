export default function RoomPage({ params }: { params: { roomId: string } }) {
  return (
    <main style={{ padding: 24 }}>
      <h1>Room {params.roomId}</h1>
      <p>Thread page placeholder.</p>
    </main>
  );
}
