"use client";

import React from "react";
import { useMyPresence, useOthers, useSelf } from "@liveblocks/react";

export default function ColorPicker() {
  const [myPresence, updateMyPresence] = useMyPresence();
  const self = useSelf();
  const others = useOthers();

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateMyPresence({ color: e.target.value });
  };

  // Get the current color of the user. It should default to "#000000" if not set.
  const currentColor = (myPresence as any)?.color || "#000000";

  // Combine self and others to show all connected users
  const allUsers = [];
  if (self) {
    allUsers.push(self);
  }
  for (const other of others) {
    allUsers.push(other);
  }

  // Sort them by connectionId for a stable list order
  allUsers.sort((a, b) => a.connectionId - b.connectionId);

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Collaborative Color Picker</h1>
      
      <div style={{ marginBottom: "1.5rem" }}>
        <label htmlFor="color-input" style={{ marginRight: "0.5rem", fontWeight: "bold" }}>
          Choose your color:
        </label>
        <input
          id="color-input"
          type="color"
          value={currentColor}
          onChange={handleColorChange}
        />
      </div>

      <h2>Connected Users</h2>
      <ul id="user-colors" style={{ listStyle: "none", padding: 0, display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {allUsers.map((user) => {
          const color = (user.presence as any)?.color || "#000000";
          return (
            <li
              key={user.connectionId}
              data-connection-id={user.connectionId}
              data-color={color}
              style={{
                backgroundColor: color,
                width: "50px",
                height: "50px",
                borderRadius: "4px",
                display: "inline-block",
                border: "1px solid #ccc",
                transition: "background-color 0.2s ease"
              }}
              title={`User ${user.connectionId}: ${color}`}
            />
          );
        })}
      </ul>
    </div>
  );
}
