# Liveblocks Follow-User-Cursor Page

## Background
You are extending a Next.js (App Router) starter that is already wired to Liveblocks. The page must let multiple connected users see each other in a sidebar and, by clicking another user's avatar button, snap a local viewport to that user's live cursor position. The starter has a placeholder page with no presence logic yet — your job is to implement presence broadcasting (cursor + name), avatar buttons for every connected user, and the local follow behaviour that scrolls the viewport to mirror the followed user's cursor.

## Requirements
- The follow page lives at the dynamic route `/follow/[room]` (App Router). Visiting `/follow/foo` joins a Liveblocks room named `foo`.
- Presence layout (must match exactly): `Presence = { name: string; cursor: { x: number; y: number } | null }`.
- A `RoomProvider` declared with `initialPresence={{ name: "<current identity>", cursor: null }}` and `autoConnect`.
- A text input lets the user set their display name; the name is persisted client-side (e.g., in `localStorage`) and is written into `presence.name`. Default to `anonymous` if no identity is set.
- On `onPointerMove` over the canvas/page, the page must call the React presence updater so that `presence.cursor = { x: e.clientX, y: e.clientY }`. Pointer leave (or any `onPointerLeave`) should set `presence.cursor = null`.
- A panel `<div id="avatars">` must list every OTHER connected user as a button:
  - Each button has `data-follow-user="<connectionId>"` where `<connectionId>` is the Liveblocks `connectionId` of that other user.
  - The visible label is that user's `presence.name`.
- Local follow behaviour:
  - Maintain local React state `followingId` (initially `null`).
  - Clicking an avatar button sets `followingId` to that connection id.
  - When `followingId` is set, the viewport `<div id="viewport">` must have `data-follow-x` and `data-follow-y` attributes whose VALUES (as strings) are the rounded integer values of the followed user's latest `cursor.x` / `cursor.y`. The viewport must also be scrolled so that `scrollLeft = round(cursor.x)` and `scrollTop = round(cursor.y)`. When the followed user has `cursor === null`, both attributes must be removed (or absent) and no scroll update must happen.
  - When `followingId` is set, a `<span id="following-name">` must render the followed user's `presence.name`. When `followingId` is `null`, the span should still exist but be empty.
- Use **real** Liveblocks cloud — never mock the client, never stub presence, never fake the WebSocket. Authentication must go through a server route at `/api/liveblocks-auth` that uses `LIVEBLOCKS_SECRET_KEY` to mint a session via `@liveblocks/node`. The browser must access the room via the official `@liveblocks/react` provider configured to use that auth endpoint. `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` may be used as a fallback `publicApiKey`, but the auth endpoint route MUST be present and functional.

## Implementation Hints
- Use the Liveblocks v2 React API: `useMyPresence` / `useUpdateMyPresence` for the local user, and `useOthers` to read other users' presence + `connectionId`.
- Read the room name from the `[room]` route segment and pass it down as the `RoomProvider id`.
- Keep the page a Client Component because Liveblocks hooks require the client runtime.
- The viewport must be a scrollable element — give it an explicit `width`, `height`, and `overflow: auto`, plus an inner spacer (e.g., `width: 4000px; height: 4000px`) so `scrollLeft` / `scrollTop` can actually take effect.
- Update `data-follow-x` / `data-follow-y` via React attributes (not direct DOM mutation) so the values stay in sync with the followed user's presence and React re-renders.
- Before running the verifier, KILL any dev server you started — the verifier starts its own production server.
- Re-export the run id so it is available in the browser environment: `export NEXT_PUBLIC_ZEALT_RUN_ID="$ZEALT_RUN_ID"` before building.

## Acceptance Criteria
- Project path: `/home/user/project`
- Start command: `npm run start` (after `npm run build`)
- Port: `3000`
- Route: `/follow/[room]` renders the follow-cursor page for the given `room` segment.
- Auth endpoint: `POST /api/liveblocks-auth` returns HTTP 200 with a JSON body containing a non-empty `token` string when called with a JSON body shaped like `{ "room": "<room>" }`.
- Presence schema observable from any connected client: `presence.name` (string) and `presence.cursor` (`{ x: number, y: number } | null`).
- DOM contract for verification (per follow page):
  - Identity input has `data-testid="identity-input"`.
  - The avatars panel is rendered as `<div id="avatars">` containing one `<button data-follow-user="<connectionId>">` per OTHER connected user.
  - The viewport element is rendered as `<div id="viewport">` and is a scrollable container (must have an inner spacer so `scrollLeft`/`scrollTop` can change).
  - When following a user with a non-null cursor, the viewport element exposes both `data-follow-x` and `data-follow-y` attributes whose string values equal the rounded integer values of the followed user's `cursor.x` / `cursor.y`.
  - The followed user's name is rendered inside `<span id="following-name">`.
- Real Liveblocks cloud only — do not stub the Liveblocks client, do not write a fake WebSocket server, do not replace `@liveblocks/react` or `@liveblocks/client` with mocks.
- The room name used during verification MUST be derived from the `ZEALT_RUN_ID` environment variable. The agent MUST re-export it as `NEXT_PUBLIC_ZEALT_RUN_ID` so it is embedded in the client bundle, and the room id MUST follow the pattern `follow-cursor-${NEXT_PUBLIC_ZEALT_RUN_ID}`.
- Before the final test runs, KILL any dev/production server you started — the verifier starts its own server.

