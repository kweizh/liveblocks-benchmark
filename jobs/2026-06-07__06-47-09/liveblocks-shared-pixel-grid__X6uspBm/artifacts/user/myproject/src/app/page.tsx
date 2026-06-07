"use client";

import { useState } from "react";
import { useStorage, useMutation } from "../liveblocks.config";
import { Room } from "./Room";

function Grid() {
  const pixels = useStorage((root) => root.pixels);
  const [color, setColor] = useState("#000000");

  const setPixel = useMutation(({ storage }, r: number, c: number, color: string) => {
    const pixelsMap = storage.get("pixels");
    pixelsMap.set(`${r},${c}`, color);
  }, []);

  const clearGrid = useMutation(({ storage }) => {
    const pixelsMap = storage.get("pixels");
    const keys = Array.from(pixelsMap.keys());
    for (const key of keys) {
      pixelsMap.delete(key);
    }
  }, []);

  const gridItems = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const pixelKey = `${r},${c}`;
      // @ts-ignore
      const pixelColor = pixels?.get?.(pixelKey) || "";
      gridItems.push(
        <button
          key={pixelKey}
          data-pixel={pixelKey}
          data-color={pixelColor}
          onClick={() => setPixel(r, c, color)}
          style={{
            backgroundColor: pixelColor || "transparent",
            width: "40px",
            height: "40px",
            border: "1px solid #ddd",
          }}
        />
      );
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div
        id="pixel-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(8, 40px)",
          gap: "2px",
        }}
      >
        {gridItems}
      </div>
      <div className="flex items-center gap-4">
        <input
          id="pixel-color"
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <button
          id="clear-grid"
          onClick={() => clearGrid()}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Clear Grid
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Room>
      <Grid />
    </Room>
  );
}
