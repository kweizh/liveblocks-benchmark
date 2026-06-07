"use client";

import { useState } from "react";
import { useStorage, useMutation } from "@liveblocks/react/suspense";
import { LiveMap } from "@liveblocks/client";

export function PixelGrid() {
  const [color, setColor] = useState("#000000");
  
  // Read the entire LiveMap
  const pixels = useStorage((root: any) => root.pixels);

  const updatePixel = useMutation(({ storage }, r: number, c: number, color: string) => {
    const pixelsMap = storage.get("pixels") as LiveMap<string, string>;
    if (pixelsMap) {
      pixelsMap.set(`${r},${c}`, color);
    }
  }, []);

  const clearGrid = useMutation(({ storage }) => {
    const pixelsMap = storage.get("pixels") as LiveMap<string, string>;
    if (pixelsMap) {
      const keys = Array.from(pixelsMap.keys());
      for (const key of keys) {
        pixelsMap.delete(key);
      }
    }
  }, []);

  const rows = 8;
  const cols = 8;
  const cells = [];
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`;
      const pixelColor = pixels?.get(key) || "";
      
      cells.push(
        <button
          key={key}
          data-pixel={key}
          data-color={pixelColor}
          onClick={() => updatePixel(r, c, color)}
          style={{
            width: "30px",
            height: "30px",
            backgroundColor: pixelColor || "#ffffff",
            border: "1px solid #ccc",
          }}
        />
      );
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-4 items-center">
        <input
          id="pixel-color"
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <button
          id="clear-grid"
          onClick={clearGrid}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Clear
        </button>
      </div>
      
      <div
        id="pixel-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(8, 1fr)",
          gap: "1px",
          backgroundColor: "#ccc",
          border: "1px solid #ccc",
        }}
      >
        {cells}
      </div>
    </div>
  );
}
