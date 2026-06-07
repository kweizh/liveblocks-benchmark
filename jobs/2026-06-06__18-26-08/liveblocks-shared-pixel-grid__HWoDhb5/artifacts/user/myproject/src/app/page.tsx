"use client";

import { useState } from "react";
import { LiveMap } from "@liveblocks/client";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
  useStorage,
  useMutation,
} from "@liveblocks/react/suspense";

function Grid() {
  const [color, setColor] = useState("#000000");

  // useStorage to read the LiveMap snapshot
  const pixels = useStorage((root) => root.pixels);

  // useMutation to mutate the LiveMap
  const paintPixel = useMutation(({ storage }, r: number, c: number) => {
    const key = `${r},${c}`;
    const pixelsMap = storage.get("pixels");
    pixelsMap.set(key, color);
  }, [color]);

  const clearGrid = useMutation(({ storage }) => {
    const pixelsMap = storage.get("pixels");
    const keys = Array.from(pixelsMap.keys());
    for (const key of keys) {
      pixelsMap.delete(key);
    }
  }, []);

  if (!pixels) {
    return <div className="text-gray-500">Loading pixels...</div>;
  }

  // Generate 64 buttons (8x8 grid) in row-major order (r from 0..7, c from 0..7)
  const buttons = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const key = `${r},${c}`;
      const pixelColor = pixels[key] || "";
      buttons.push(
        <button
          key={key}
          data-pixel={key}
          data-color={pixelColor}
          onClick={() => paintPixel(r, c)}
          style={{ backgroundColor: pixelColor || undefined }}
          className="w-10 h-10 border border-gray-200 focus:outline-none transition-colors duration-150"
        />
      );
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4 bg-gray-50 text-gray-900">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Collaborative Pixel Grid</h1>
        <p className="mt-2 text-sm text-gray-500">Paint on the grid and see changes in real-time!</p>
      </div>

      <div className="flex items-center gap-6 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Brush Color:</span>
          <input
            id="pixel-color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-10 h-10 p-0 border border-gray-300 rounded cursor-pointer"
          />
        </div>

        <button
          id="clear-grid"
          onClick={() => clearGrid()}
          className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md shadow hover:bg-red-700 transition"
        >
          Clear Grid
        </button>
      </div>

      <div
        id="pixel-grid"
        className="grid grid-cols-8 gap-1 p-2 bg-gray-100 border border-gray-300 rounded-lg shadow-md"
      >
        {buttons}
      </div>
    </div>
  );
}

export default function Page() {
  const roomId = `pixel-grid-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "dev"}`;

  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialStorage={{
          pixels: new LiveMap<string, string>(),
        }}
      >
        <ClientSideSuspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500">Loading collaborative room...</div>}>
          <Grid />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
