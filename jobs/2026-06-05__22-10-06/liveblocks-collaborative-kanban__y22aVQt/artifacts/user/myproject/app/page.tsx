"use client";

import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import { RoomProvider } from "../liveblocks.config";
import KanbanBoard from "./KanbanBoard";

const runId = process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "local";
const roomId = `kanban-${runId}`;

export default function KanbanPage() {
  return (
    <RoomProvider
      id={roomId}
      initialStorage={{
        columns: new LiveList([
          new LiveObject({
            id: "todo",
            title: "To Do",
            cardIds: new LiveList<string>([]),
          }),
          new LiveObject({
            id: "in-progress",
            title: "In Progress",
            cardIds: new LiveList<string>([]),
          }),
          new LiveObject({
            id: "done",
            title: "Done",
            cardIds: new LiveList<string>([]),
          }),
        ]),
        cards: new LiveMap(),
      }}
    >
      <KanbanBoard />
    </RoomProvider>
  );
}
