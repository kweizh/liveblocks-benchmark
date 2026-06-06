import Room from "./Room";

export default function RoomPage({ params }: { params: { roomId: string } }) {
  return <Room roomId={params.roomId} />;
}
