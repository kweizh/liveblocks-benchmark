# Liveblocks Active Users List Page

## Background
You are completing a Next.js 14 (App Router) starter application that joins a Liveblocks v2 room and must show the list of currently connected users in real time. The starter ships with the Liveblocks SDK and an `/api/liveblocks-auth` route wired up, but the page at `/active-users` is a placeholder. Your job is to make that page render every connected user as a list item with their Liveblocks `connectionId`, and render the total number of connected users (including the current user) as an integer count.

## Requirements
- The page lives at the App Router route `/active-users`. Visiting `http://localhost:3000/active-users` must join a single shared Liveblocks v2 room and render the live participant list.
- Each connected user must set a `name` field in **Liveblocks Presence** equal to `User-<connectionId>` (e.g. `User-12`). Use the current user's own `connectionId` from Liveblocks (e.g. `useSelf()?.connectionId`).
- The page must render a `<ul id="active-users">` whose direct children are `<li>` elements — one per connected user (current user + all others).
  - Each `<li>` must have the attribute `data-connection-id` set to the user's Liveblocks `connectionId` (as a string).
  - Each `<li>`'s visible text content must be the user's presence `name`, i.e. `User-<connectionId>`.
- The page must also render a `<span id="active-users-count">` whose text content is the integer count of currently connected users in the room (current user included). This must equal `useOthers().length + 1`.
- Use **real** Liveblocks v2 cloud — never mock the client, never stub presence, never fake the WebSocket. The browser must connect through the official `@liveblocks/react` provider, authenticated by the existing `/api/liveblocks-auth` route which uses `LIVEBLOCKS_SECRET_KEY` and the `@liveblocks/node` SDK.
- The Liveblocks room id used by the page MUST be derived from the `NEXT_PUBLIC_ZEALT_RUN_ID` environment variable so concurrent trials do not collide. Use the literal pattern `active-users-${NEXT_PUBLIC_ZEALT_RUN_ID}`. Because Next.js only embeds variables prefixed with `NEXT_PUBLIC_` into the client bundle, you MUST re-export `NEXT_PUBLIC_ZEALT_RUN_ID="$ZEALT_RUN_ID"` in your shell before building/starting the app.

## Implementation Hints
- Use the Liveblocks v2 React hooks from `@liveblocks/react` (or `@liveblocks/react/suspense`): `useSelf`, `useOthers`, and `useMyPresence`/`useUpdateMyPresence` for updating the `name` field.
- Set the presence `name` once the current user's `connectionId` is known. `useSelf` returns `null` until the room is connected, so update presence in an effect that depends on `connectionId`.
- Build the rendered list by combining `useSelf()` (the current user) and `useOthers()` (all other connected users). The order of `<li>` elements does not matter — only the set of `data-connection-id` values and their text content does.
- The count `<span id="active-users-count">` must be the integer length of `useOthers().length + 1`, rendered as plain text (e.g. `3`, not `"3 users"`).
- The route must run as a Client Component (or wrap a Client Component) because Liveblocks hooks require the client runtime.
- Authentication is already implemented at `/api/liveblocks-auth` using `@liveblocks/node`. You only need to make sure the React provider points at that endpoint.

## Acceptance Criteria
- Project path: `/home/user/project`
- Before final verification, **KILL any `next dev` or `npm run dev` process you started** — the verifier launches the production server itself on port `3000`.
- Start command (used by the verifier): `npm run build && npm run start -- -p 3000`
- Port: `3000`
- Route `/active-users`:
  - Renders exactly one element matching the CSS selector `ul#active-users`.
  - Renders one `li` per connected user as a direct child of `ul#active-users`.
  - Each such `li` exposes a `data-connection-id` attribute whose value is the connected user's Liveblocks `connectionId`, and whose visible text content is `User-<connectionId>`.
  - Renders exactly one element matching the CSS selector `span#active-users-count` whose text content is the integer count of connected users (current user included). It must equal the number of `li` elements under `ul#active-users`.
- Auth endpoint: `POST /api/liveblocks-auth` returns a JSON body that includes a `token` field (status 200). This is provided by the starter; do not break it.
- The Liveblocks room id used by the client MUST be `active-users-${NEXT_PUBLIC_ZEALT_RUN_ID}` where `NEXT_PUBLIC_ZEALT_RUN_ID` is the same value as the runtime `ZEALT_RUN_ID` environment variable. The agent is responsible for re-exporting `NEXT_PUBLIC_ZEALT_RUN_ID="$ZEALT_RUN_ID"` so the value is embedded in the Next.js client bundle at build time.
- Real Liveblocks v2 cloud only — do not stub the Liveblocks client, do not write a fake WebSocket server, do not replace `@liveblocks/react`/`@liveblocks/client`/`@liveblocks/node` with mocks.

