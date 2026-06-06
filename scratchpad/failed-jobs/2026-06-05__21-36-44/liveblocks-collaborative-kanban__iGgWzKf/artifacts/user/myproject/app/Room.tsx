"use client";

import { ReactNode } from "react";
import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import { RoomProvider } from "../liveblocks.config";

const runId =
  process.env.NEXT_PUBLIC_ZEALT_RUN_ID ||
  process.env.ZEALT_RUN_ID ||
  "local";

const ROOM_ID = `kanban-${runId}`;

export function Room({ children }: { children: ReactNode }) {
  return (
    <RoomProvider
      id={ROOM_ID}
      initialPresence={{}}
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
      {children}
    </RoomProvider>
  );
}
