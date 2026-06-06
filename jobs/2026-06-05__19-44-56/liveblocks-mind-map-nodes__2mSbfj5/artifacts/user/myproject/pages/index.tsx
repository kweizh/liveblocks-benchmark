import { ClientSideSuspense } from "@liveblocks/react";
import MindMap from "../components/MindMap";

export default function Page() {
  return (
    <ClientSideSuspense fallback={<div>Loading...</div>}>
      {() => <MindMap />}
    </ClientSideSuspense>
  );
}
