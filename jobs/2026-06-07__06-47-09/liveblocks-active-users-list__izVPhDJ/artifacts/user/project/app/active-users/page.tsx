"use client";

import { Room } from "./Room";

// TODO: implement the active-users list and count here.
//
// Requirements (see instruction.md for the full spec):
//   - Each connected client must publish a Presence `name` equal to
//     `User-<connectionId>` (use useSelf()?.connectionId + useUpdateMyPresence).
//   - Render <ul id="active-users"> with one <li data-connection-id="<id>">
//     per connected user (current user included). The visible text content
//     of each <li> must be that user's presence `name`.
//   - Render <span id="active-users-count"> with the integer count of
//     connected users, equal to useOthers().length + 1.
//   - The room id must come from process.env.NEXT_PUBLIC_ZEALT_RUN_ID
//     (literal pattern: `active-users-${NEXT_PUBLIC_ZEALT_RUN_ID}`).

function ActiveUsers() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Active users</h1>
      <p>TODO: build the active-users list and count per the task instructions.</p>
    </main>
  );
}

export default function ActiveUsersPage() {
  const runId = process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "local";
  const roomId = `active-users-${runId}`;

  return (
    <Room roomId={roomId}>
      <ActiveUsers />
    </Room>
  );
}
