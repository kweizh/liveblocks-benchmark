"use client";

// TODO: Implement the real-time room UI.
// The executor must:
//   * Mount <LiveblocksProvider authEndpoint={...callback...}> using a callback that POSTs
//     { room, userId, orgId } to /api/liveblocks-auth.
//   * Mount <RoomProvider id={params.roomId} initialStorage={{ counter: 0 }}>.
//   * Render the connection status in an element with data-testid="connection-status".
//   * Render the counter value in an element with data-testid="counter-value".

export default function RoomPageStub() {
  return (
    <main>
      <h1>Room page stub</h1>
      <p>Not implemented yet.</p>
      <span data-testid="connection-status">stub</span>
      <span data-testid="counter-value">stub</span>
    </main>
  );
}
