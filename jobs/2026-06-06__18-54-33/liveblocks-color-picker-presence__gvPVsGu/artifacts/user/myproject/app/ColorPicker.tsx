"use client";

import { useUpdateMyPresence, useOthers, useSelf } from "../liveblocks.config";

export function ColorPicker() {
  const updateMyPresence = useUpdateMyPresence();
  const self = useSelf();
  const others = useOthers();

  // Build the combined list: current user first, then others
  const allUsers = [
    ...(self ? [{ connectionId: self.connectionId, color: self.presence.color ?? "#000000" }] : []),
    ...others.map((other) => ({
      connectionId: other.connectionId,
      color: other.presence.color ?? "#000000",
    })),
  ];

  function handleColorChange(e: React.ChangeEvent<HTMLInputElement>) {
    updateMyPresence({ color: e.target.value });
  }

  return (
    <div>
      <input
        id="color-input"
        type="color"
        defaultValue="#000000"
        onChange={handleColorChange}
      />
      <ul id="user-colors">
        {allUsers.map((user) => (
          <li
            key={user.connectionId}
            data-connection-id={user.connectionId}
            data-color={user.color}
            style={{ backgroundColor: user.color, width: 40, height: 40, listStyle: "none" }}
          />
        ))}
      </ul>
    </div>
  );
}
