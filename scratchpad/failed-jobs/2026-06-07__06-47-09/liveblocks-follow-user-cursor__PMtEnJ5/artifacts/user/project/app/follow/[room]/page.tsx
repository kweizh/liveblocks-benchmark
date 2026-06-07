"use client";

import { useParams } from "next/navigation";
import { Room } from "./Room";

// TODO: implement the follow-user-cursor page here.
//
// Required behaviour (see instruction.md for full details):
//   - Broadcast the local user's `presence.name` and `presence.cursor`.
//     Update `presence.cursor` on `onPointerMove`; clear it on
//     `onPointerLeave`.
//   - Render a panel `<div id="avatars">` containing one button per OTHER
//     connected user: `<button data-follow-user="<connectionId>">{name}</button>`.
//   - Render a scrollable `<div id="viewport">` (with an inner spacer so
//     `scrollLeft`/`scrollTop` can take effect). When following a remote
//     user, expose `data-follow-x` / `data-follow-y` on the viewport with
//     the rounded integer values of that user's `presence.cursor.x` /
//     `cursor.y`, and scroll the viewport to match.
//   - Render `<span id="following-name">` containing the followed user's
//     `presence.name` (empty when nobody is being followed).
//   - Provide a `<input data-testid="identity-input" />` for editing the
//     local user's display name (persist to `localStorage`).

function FollowPage() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Follow User Cursor</h1>
      <p>TODO: build the follow-cursor UI per the task instructions.</p>
    </main>
  );
}

export default function FollowRoutePage() {
  const params = useParams<{ room: string }>();
  const roomId =
    (Array.isArray(params?.room) ? params?.room[0] : params?.room) ||
    "default-room";

  return (
    <Room roomId={roomId} initialName="anonymous">
      <FollowPage />
    </Room>
  );
}
