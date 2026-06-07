# Liveblocks Collaborative Color Picker (Next.js App Router)

## Background
Build a small Next.js (App Router) application that uses Liveblocks **presence** to share each connected user's chosen color across a shared room in real time. Every user picks a color with a native HTML color input, and the page renders a list of swatches showing the color chosen by every user currently connected to the room (including the current user).

## Requirements
- A Next.js App Router project that integrates Liveblocks (`@liveblocks/client`, `@liveblocks/react`) using the v2 React presence API.
- A single page at `/` that:
  - Renders a native color input: `<input id="color-input" type="color">`.
  - Renders a swatch list: `<ul id="user-colors">` containing one `<li>` per connected user (including the current user) with attributes `data-connection-id="<connectionId>"` and `data-color="<#RRGGBB>"`. The list item's CSS `background-color` must match its color.
- Each user's chosen color is broadcast via Liveblocks presence as `presence.color = "#RRGGBB"` and the swatch list reflects everyone's current presence color in real time.
- The room id must be derived from the runtime environment variable `NEXT_PUBLIC_ZEALT_RUN_ID` so concurrent trials do not collide.
- An authenticated Liveblocks setup using the secret key on the server (`/api/liveblocks-auth`) and the public key on the client.

## Implementation Hints
- Use the official Liveblocks Next.js App Router pattern: a `LiveblocksProvider` (client component) and a `RoomProvider` wrapping the page, plus a route handler at `app/api/liveblocks-auth/route.ts` that issues access tokens with `Liveblocks` server SDK.
- Use `useMyPresence` / `useUpdateMyPresence` to publish the current user's color and `useOthers` / `useSelf` to render the combined list of swatches.
- Read the public key from `process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` (must be exposed with the `NEXT_PUBLIC_` prefix because it is used client-side) and the secret from `process.env.LIVEBLOCKS_SECRET_KEY` on the server.
- Build the room id as `color-picker-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID}` (re-export the variable in your shell before running the build/start commands).
- Make sure the initial presence has a sensible default color (e.g. `#000000`) so that the current user appears in the list immediately, then update it whenever the color input changes.
- Before the verifier runs, ensure the dev server is **not** running (the verifier starts its own server using the start command below).

## Acceptance Criteria
- Project path: `/home/user/myproject`
- Build command: `npm run build`
- Start command: `npm run start`
- Port: `3000`
- Route `/` renders:
  - `<input id="color-input" type="color">`
  - `<ul id="user-colors">` containing one `<li data-connection-id="<id>" data-color="<#RRGGBB>">` per connected user. Each `<li>` must have its CSS `background-color` set to the same color.
- Changing the value of `#color-input` updates the current user's `presence.color` to that hex value, and other tabs/users in the same room observe the update in their `<ul id="user-colors">`.
- The Liveblocks room id is `color-picker-${NEXT_PUBLIC_ZEALT_RUN_ID}`.
- Authentication uses `/api/liveblocks-auth` with `LIVEBLOCKS_SECRET_KEY` on the server; the client uses `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` (no hard-coded keys).

