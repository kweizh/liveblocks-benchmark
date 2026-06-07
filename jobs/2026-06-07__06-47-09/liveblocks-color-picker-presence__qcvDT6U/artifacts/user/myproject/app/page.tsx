"use client";

import { useMyPresence, useOthers, useSelf, useUpdateMyPresence } from "@liveblocks/react/suspense";

export default function Home() {
  const [{ color }] = useMyPresence();
  const updateMyPresence = useUpdateMyPresence();
  const others = useOthers();
  const self = useSelf();

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateMyPresence({ color: e.target.value });
  };

  // Combine self and others. Self should be included in the list.
  const allUsers = [];
  if (self) {
    allUsers.push(self);
  }
  allUsers.push(...others);

  return (
    <main style={{ padding: "20px" }}>
      <h1>Collaborative Color Picker</h1>
      
      <div style={{ marginBottom: "20px" }}>
        <label htmlFor="color-input">Choose your color: </label>
        <input 
          id="color-input" 
          type="color" 
          value={color || "#000000"} 
          onChange={handleColorChange} 
        />
      </div>

      <h2>User Colors</h2>
      <ul id="user-colors" style={{ display: "flex", flexWrap: "wrap", gap: "10px", padding: 0 }}>
        {allUsers.map((user) => (
          <li 
            key={user.connectionId} 
            data-connection-id={user.connectionId} 
            data-color={user.presence?.color || "#000000"}
            style={{ 
              backgroundColor: user.presence?.color || "#000000",
              width: "50px",
              height: "50px",
              listStyle: "none",
              border: "1px solid #ccc",
              borderRadius: "4px"
            }}
          />
        ))}
      </ul>
    </main>
  );
}
