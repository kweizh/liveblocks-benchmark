import { Room } from "./Room";

export default function Page() {
  const runId = process.env.ZEALT_RUN_ID || "default";
  const roomId = `comments-resolve-${runId}`;
  return <Room roomId={roomId} />;
}
