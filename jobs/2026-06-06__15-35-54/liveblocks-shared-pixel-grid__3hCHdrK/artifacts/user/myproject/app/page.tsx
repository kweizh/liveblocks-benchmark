"use client";

import { useStorage, useMutation } from "@liveblocks/react";

export default function Home() {
  const pixels = useStorage((root) => root.pixels) as any;

  const handleCellClick = useMutation(({ storage }, cellId: string) => {
    const pixelsMap = storage.get("pixels") as any;
    if (!pixelsMap) return;

    const currentColor = pixelsMap.get(cellId);
    const palette = ["red", "blue", "green", "yellow"];

    let nextColor: string;
    if (!currentColor) {
      nextColor = "red";
    } else {
      const currentIndex = palette.indexOf(currentColor);
      if (currentIndex === -1) {
        nextColor = "red";
      } else {
        nextColor = palette[(currentIndex + 1) % palette.length];
      }
    }

    pixelsMap.set(cellId, nextColor);
  }, []);

  const cells = Array.from({ length: 100 }, (_, i) => {
    const r = Math.floor(i / 10);
    const c = i % 10;
    const cellId = `${r}-${c}`;
    return { r, c, cellId };
  });

  return (
    <main className="flex flex-col items-center justify-center">
      <h1 className="title">Collaborative Pixel Grid</h1>
      <div className="grid-container">
        {cells.map(({ cellId }) => {
          // Retrieve color from the immutable Map
          const color = pixels instanceof Map ? pixels.get(cellId) : pixels?.[cellId];
          return (
            <button
              key={cellId}
              data-cell={cellId}
              className={`cell ${color || ""}`}
              onClick={() => handleCellClick(cellId)}
              aria-label={`Cell ${cellId}`}
            />
          );
        })}
      </div>
    </main>
  );
}
