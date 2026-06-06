"use client";

import React, { ReactNode } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { LiveMap } from "@liveblocks/client";

export function Providers({ children }: { children: ReactNode }) {
  const publicApiKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY;
  if (!publicApiKey) {
    throw new Error("NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY is not defined");
  }

  const roomId = `spreadsheet-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "dev"}`;

  return (
    <LiveblocksProvider publicApiKey={publicApiKey}>
      <RoomProvider
        id={roomId}
        initialPresence={{ editingCell: null }}
        initialStorage={{
          cells: new LiveMap<string, string>(),
        }}
      >
        <ClientSideSuspense fallback={<LoadingGrid />}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

const CELL_LABELS = [
  "A1", "A2", "A3", "A4", "A5",
  "B1", "B2", "B3", "B4", "B5",
  "C1", "C2", "C3", "C4", "C5",
  "D1", "D2", "D3", "D4", "D5",
  "E1", "E2", "E3", "E4", "E5"
];

function LoadingGrid() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Collaborative Spreadsheet</h1>
      <div
        role="grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 80px)",
          gridAutoRows: "32px",
          gap: 0,
          marginTop: 16
        }}
      >
        {CELL_LABELS.map((label) => (
          <div
            key={label}
            role="gridcell"
            data-cell={label}
            style={{
              border: "1px solid #ccc",
              padding: "4px 6px",
              boxSizing: "border-box",
              fontFamily: "monospace"
            }}
          >
            ...
          </div>
        ))}
      </div>
    </main>
  );
}
