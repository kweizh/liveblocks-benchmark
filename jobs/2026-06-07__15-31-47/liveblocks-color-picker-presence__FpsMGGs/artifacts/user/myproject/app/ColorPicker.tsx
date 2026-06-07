"use client";

import { useMyPresence, useOthers, useSelf } from "../liveblocks.config";

export function ColorPicker() {
  const [myPresence, updateMyPresence] = useMyPresence();
  const others = useOthers();
  const self = useSelf();

  // Build the full list: current user + all others
  const allUsers: Array<{ connectionId: number; color: string }> = [];

  if (self) {
    allUsers.push({
      connectionId: self.connectionId,
      color: myPresence.color ?? "#000000",
    });
  }

  for (const other of others) {
    if (other.presence?.color) {
      allUsers.push({
        connectionId: other.connectionId,
        color: other.presence.color,
      });
    }
  }

  return (
    <div>
      <input
        id="color-input"
        type="color"
        value={myPresence.color ?? "#000000"}
        onChange={(e) => {
          updateMyPresence({ color: e.target.value });
        }}
      />
      <ul id="user-colors">
        {allUsers.map(({ connectionId, color }) => (
          <li
            key={connectionId}
            data-connection-id={connectionId}
            data-color={color}
            style={{ backgroundColor: color, width: 40, height: 40, listStyle: "none" }}
          />
        ))}
      </ul>
    </div>
  );
}
