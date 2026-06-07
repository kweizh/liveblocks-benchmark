"use client";

import { Providers, Room } from "./Providers";
import { useMyPresence, useOthers, useSelf } from "@liveblocks/react";
import { Suspense } from "react";

function ColorPicker() {
  const [myPresence, updateMyPresence] = useMyPresence();
  const others = useOthers();
  const self = useSelf();

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateMyPresence({ color: e.target.value });
  };

  if (!self) {
    return null;
  }

  const myColor = (myPresence.color as string) || "#000000";

  return (
    <main className="p-8">
      <h1 className="text-2xl mb-4">Liveblocks Collaborative Color Picker</h1>
      
      <div className="mb-8">
        <label htmlFor="color-input" className="block mb-2">Pick your color:</label>
        <input 
          id="color-input" 
          type="color" 
          value={myColor} 
          onChange={handleColorChange} 
        />
      </div>

      <h2 className="text-xl mb-4">Users</h2>
      <ul id="user-colors" className="flex gap-4 flex-wrap">
        <li
          data-connection-id={self.connectionId}
          data-color={myColor}
          style={{ backgroundColor: myColor }}
          className="w-16 h-16 rounded-full border border-gray-300 flex items-center justify-center text-xs"
        >
          Me
        </li>
        
        {others.map((other) => {
          const color = (other.presence?.color as string) || "#000000";
          return (
            <li
              key={other.connectionId}
              data-connection-id={other.connectionId}
              data-color={color}
              style={{ backgroundColor: color }}
              className="w-16 h-16 rounded-full border border-gray-300 flex items-center justify-center text-xs"
            >
              User {other.connectionId}
            </li>
          );
        })}
      </ul>
    </main>
  );
}

export default function Home() {
  return (
    <Providers>
      <Room>
        <Suspense fallback={<div>Loading...</div>}>
          <ColorPicker />
        </Suspense>
      </Room>
    </Providers>
  );
}
