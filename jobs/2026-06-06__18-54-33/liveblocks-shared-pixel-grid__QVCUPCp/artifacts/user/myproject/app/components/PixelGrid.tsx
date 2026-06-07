"use client";

import { useRef } from "react";
import { LiveMap } from "@liveblocks/client";
import { ClientSideSuspense } from "@liveblocks/react";
import { RoomProvider, useStorage, useMutation } from "../../liveblocks.config";

const ROOM_ID = `pixel-grid-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID}`;
const GRID_SIZE = 8;

// Build all coordinate keys upfront
const KEYS: string[] = [];
for (let r = 0; r < GRID_SIZE; r++) {
  for (let c = 0; c < GRID_SIZE; c++) {
    KEYS.push(`${r},${c}`);
  }
}

function Grid() {
  const colorPickerRef = useRef<HTMLInputElement>(null);

  const pixelMap = useStorage((root) => {
    const result: Record<string, string> = {};
    const lm = root.pixels as unknown as Map<string, string>;
    lm.forEach((v, k) => { result[k] = v; });
    return result;
  });

  const paintPixel = useMutation(({ storage }, row: number, col: number) => {
    const color = colorPickerRef.current?.value ?? "#000000";
    storage.get("pixels").set(`${row},${col}`, color);
  }, []);

  const clearGrid = useMutation(({ storage }) => {
    const map = storage.get("pixels");
    const keys = Array.from(map.keys());
    for (const key of keys) {
      map.delete(key);
    }
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "24px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Collaborative Pixel Grid</h1>
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <label htmlFor="pixel-color">Color:</label>
        <input
          id="pixel-color"
          type="color"
          defaultValue="#ff0000"
          ref={colorPickerRef}
        />
        <button
          id="clear-grid"
          onClick={clearGrid}
          style={{
            padding: "8px 16px",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Clear Grid
        </button>
      </div>
      <div
        id="pixel-grid"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${GRID_SIZE}, 48px)`,
          gap: "2px",
          border: "2px solid #374151",
          padding: "4px",
          backgroundColor: "#374151",
        }}
      >
        {KEYS.map((key) => {
          const color = (pixelMap && pixelMap[key]) || "";
          return (
            <button
              key={key}
              data-pixel={key}
              data-color={color}
              onClick={() => {
                const [r, c] = key.split(",").map(Number);
                paintPixel(r, c);
              }}
              style={{
                backgroundColor: color || "#ffffff",
                width: "48px",
                height: "48px",
                border: "1px solid #ccc",
                cursor: "pointer",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function PixelGrid() {
  return (
    <RoomProvider
      id={ROOM_ID}
      initialPresence={{}}
      initialStorage={{ pixels: new LiveMap<string, string>() }}
    >
      <ClientSideSuspense fallback={<div>Loading...</div>}>
        <Grid />
      </ClientSideSuspense>
    </RoomProvider>
  );
}
