"use client";

import { useParams } from "next/navigation";
import { useOthers, useSelf } from "@liveblocks/react/suspense";
import { Room } from "./Room";

// Deterministic HSL color generator based on connectionId
function getBadgeColor(connectionId: number): string {
  const hue = (connectionId * 137.5) % 360; // golden angle distribution
  return `hsl(${hue}, 70%, 60%)`;
}

function ActiveUsersView() {
  const others = useOthers();
  const self = useSelf();

  const count = others.length + (self ? 1 : 0);

  // Combine self and others into one list
  const allUsers = [];
  if (self) {
    allUsers.push(self);
  }
  allUsers.push(...others);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Active Users</h1>
      <p>
        Total active users: <strong id="user-count">{count}</strong>
      </p>

      <div id="users-list" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {allUsers.map((user) => {
          const isSelf = self && user.connectionId === self.connectionId;
          const color = getBadgeColor(user.connectionId);

          return (
            <div
              key={user.connectionId}
              data-testid="user-row"
              data-connection-id={user.connectionId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "8px 12px",
                border: "1px solid #eaeaea",
                borderRadius: 6,
                maxWidth: 400,
              }}
            >
              <span
                data-testid="user-badge"
                style={{
                  display: "inline-block",
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: color,
                }}
              />
              <span>
                User {user.connectionId} {isSelf ? "(You)" : ""}
              </span>
            </div>
          );
        })}
      </div>
    </main>
  );
}

export default function UsersPage() {
  const params = useParams<{ room: string }>();
  const roomId =
    (Array.isArray(params?.room) ? params?.room[0] : params?.room) ||
    "default-room";

  return (
    <Room roomId={roomId}>
      <ActiveUsersView />
    </Room>
  );
}
