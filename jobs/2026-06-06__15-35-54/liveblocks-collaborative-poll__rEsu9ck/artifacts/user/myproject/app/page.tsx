import { Poll } from "./Poll";

export const dynamic = "force-dynamic";

export default function Home() {
  const publicApiKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY || "";
  const roomId = process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "default-room";

  return <Poll publicApiKey={publicApiKey} roomId={roomId} />;
}
