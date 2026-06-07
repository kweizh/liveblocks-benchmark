"use client";

import { useRef } from "react";
import type { ReactElement } from "react";
import { useStorage, useMutation } from "../liveblocks.config";

export default function PixelGrid() {
  const colorPickerRef = useRef<HTMLInputElement>(null);

  // useStorage with LiveMap returns a readonly Map snapshot
  const pixels = useStorage((root) => root.pixels);

  const paintPixel = useMutation(({ storage }, key: string, color: string) => {
    storage.get("pixels").set(key, color);
  }, []);

  const clearGrid = useMutation(({ storage }) => {
    const pixelsMap = storage.get("pixels");
    const keys = Array.from(pixelsMap.keys());
    for (const key of keys) {
      pixelsMap.delete(key);
    }
  }, []);

  const handlePixelClick = (row: number, col: number) => {
    const color = colorPickerRef.current?.value ?? "#000000";
    paintPixel(`${row},${col}`, color);
  };

  const cells: ReactElement[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const key = `${r},${c}`;
      const color = pixels?.[key] ?? "";
      cells.push(
        <button
          key={key}
          data-pixel={key}
          data-color={color}
          onClick={() => handlePixelClick(r, c)}
          style={{
            width: "60px",
            height: "60px",
            backgroundColor: color || "#ffffff",
            border: "1px solid #ccc",
            cursor: "pointer",
          }}
        />
      );
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "24px" }}>
      <h1>Collaborative Pixel Grid</h1>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
          style={{ padding: "8px 16px", cursor: "pointer" }}
        >
          Clear Grid
        </button>
      </div>
      <div
        id="pixel-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(8, 60px)",
          gap: "2px",
        }}
      >
        {cells}
      </div>
    </div>
  );
}
