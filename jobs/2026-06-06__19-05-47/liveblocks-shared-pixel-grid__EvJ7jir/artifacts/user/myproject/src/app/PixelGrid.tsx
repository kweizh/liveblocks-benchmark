"use client";

import { useStorage, useMutation } from "@liveblocks/react/suspense";
import { LiveMap } from "@liveblocks/client";
import { useState } from "react";

const ROWS = 8;
const COLS = 8;

export default function PixelGrid() {
  const pixels = useStorage((root) => root.pixels) as unknown as LiveMap<string, string>;
  const [color, setColor] = useState("#ff0000");

  const paintPixel = useMutation(
    ({ storage }, key: string, color: string) => {
      const pixels = storage.get("pixels") as LiveMap<string, string>;
      pixels.set(key, color);
    },
    []
  );

  const clearGrid = useMutation(({ storage }) => {
    const pixels = storage.get("pixels") as LiveMap<string, string>;
    const keys = Array.from(pixels.keys());
    for (const key of keys) {
      pixels.delete(key);
    }
  }, []);

  return (
    <div>
      <input
        id="pixel-color"
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
      />
      <button id="clear-grid" onClick={clearGrid}>
        Clear
      </button>
      <div
        id="pixel-grid"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${COLS}, 40px)`,
          gap: "2px",
        }}
      >
        {Array.from({ length: ROWS }, (_, r) =>
          Array.from({ length: COLS }, (_, c) => {
            const key = `${r},${c}`;
            const cellColor = pixels.get(key) || "";
            return (
              <button
                key={key}
                data-pixel={key}
                data-color={cellColor}
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: cellColor || "#ffffff",
                  border: "1px solid #ccc",
                  padding: 0,
                }}
                onClick={() => paintPixel(key, color)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}