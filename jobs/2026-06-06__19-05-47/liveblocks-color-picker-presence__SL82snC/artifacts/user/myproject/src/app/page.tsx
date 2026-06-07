"use client";

import { useUpdateMyPresence, useOthers, useSelf } from "@liveblocks/react";
import { useCallback } from "react";

function ColorPicker() {
  const updateMyPresence = useUpdateMyPresence();
  const others = useOthers();
  const self = useSelf();

  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateMyPresence({ color: e.target.value });
    },
    [updateMyPresence]
  );

  const allUsers = self ? [self, ...others] : [...others];

  return (
    <div>
      <input
        id="color-input"
        type="color"
        onChange={handleColorChange}
        defaultValue={String(self?.presence?.color ?? "#000000")}
      />
      <ul id="user-colors">
        {allUsers.map((user) => {
          const color = String(user.presence?.color ?? "#000000");
          return (
            <li
              key={user.connectionId}
              data-connection-id={user.connectionId}
              data-color={color}
              style={{ backgroundColor: color }}
            >
              User {user.connectionId}: {color}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Page() {
  return <ColorPicker />;
}