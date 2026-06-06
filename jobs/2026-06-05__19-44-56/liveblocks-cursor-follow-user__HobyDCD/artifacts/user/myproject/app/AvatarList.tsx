"use client";

import { useOthers } from "@liveblocks/react/suspense";

// Initial scaffold:
//  - Renders one avatar per other user with [data-testid="avatar"] and data-connection-id.
//  - The avatars are NOT clickable; wiring follow-mode is part of the executor's task.
export function AvatarList() {
  const others = useOthers();
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        padding: 8,
        background: "#fff",
        borderBottom: "1px solid #eee",
      }}
    >
      {others.map((user) => (
        <div
          key={user.connectionId}
          data-testid="avatar"
          data-connection-id={user.connectionId}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            background: "#ddd",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            userSelect: "none",
          }}
          title={`connectionId=${user.connectionId}`}
        >
          {user.connectionId}
        </div>
      ))}
    </div>
  );
}
