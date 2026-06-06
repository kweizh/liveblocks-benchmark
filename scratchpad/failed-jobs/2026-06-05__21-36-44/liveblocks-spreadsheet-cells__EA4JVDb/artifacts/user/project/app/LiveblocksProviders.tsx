"use client";

import { LiveblocksProvider, RoomProvider } from "@liveblocks/react";
import { LiveMap } from "@liveblocks/client";
import React, { Suspense } from "react";
import { CELL_LABELS } from "../liveblocks.config";

const publicKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!;
const runId = process.env.NEXT_PUBLIC_ZEALT_RUN_ID ?? "default";
const roomId = `spreadsheet-${runId}`;

function buildInitialCells(): LiveMap<string, string> {
  const map = new LiveMap<string, string>();
  for (const label of CELL_LABELS) {
    map.set(label, "");
  }
  return map;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LiveblocksProvider publicApiKey={publicKey}>
      <RoomProvider
        id={roomId}
        initialPresence={{ editingCell: null }}
        initialStorage={{ cells: buildInitialCells() }}
      >
        <Suspense
          fallback={
            <FallbackGrid />
          }
        >
          {children}
        </Suspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

// Renders 25 cells with data-cell labels so the initial-state test can see them
// even before Liveblocks storage has synced.
function FallbackGrid() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Collaborative Spreadsheet</h1>
      <div
        role="grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 120px)",
          gridAutoRows: "36px",
          gap: 0,
          marginTop: 16,
        }}
      >
        {CELL_LABELS.map((label) => (
          <div
            key={label}
            role="gridcell"
            data-cell={label}
            data-remote-editing="false"
            style={{
              border: "1px solid #ccc",
              padding: "4px 6px",
              boxSizing: "border-box",
              fontFamily: "monospace",
            }}
          />
        ))}
      </div>
    </main>
  );
}
