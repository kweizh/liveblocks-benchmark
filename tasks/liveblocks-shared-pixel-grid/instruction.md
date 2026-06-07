# Liveblocks Shared Pixel Grid (Next.js + LiveMap)

## Background
Build a real-time collaborative 8x8 pixel-art grid using Next.js (App Router) and Liveblocks v2 Storage. All connected clients see the same grid, and any pixel painted by one user appears instantly on all other clients. The grid state is persisted in Liveblocks Storage as a `LiveMap<string, string>` where each key is the coordinate `"r,c"` (for example, `"3,5"`) and each value is a CSS hex color string (for example, `"#ff0000"`).

## Requirements
- Build a Next.js App Router project that renders a single page using `LiveblocksProvider` and `RoomProvider` from `@liveblocks/react/suspense` (or `@liveblocks/react`).
- Use a server-side auth route at `/api/liveblocks-auth` that creates a Liveblocks session with the v2 server SDK using the `LIVEBLOCKS_SECRET_KEY` environment variable, OR connect via the public API key on the client. (Either authentication strategy is acceptable as long as the room connects.)
- Persist the grid state in Liveblocks Storage as `pixels: LiveMap<string, string>` where keys are `"r,c"` strings and values are hex color strings.
- Render the following UI on the page:
  - A container element `<div id="pixel-grid">` laid out as an 8-column CSS grid.
  - Exactly 64 child buttons, one for each cell, of the form `<button data-pixel="r,c" data-color="<#hex or empty>">`. The `data-pixel` attribute encodes the row and column (`r` from 0..7 and `c` from 0..7). The `data-color` attribute reflects the current color stored for that cell, or the empty string when the cell has no entry in the LiveMap.
  - A color picker `<input id="pixel-color" type="color">` whose current value is used as the paint color when a cell is clicked.
  - A `<button id="clear-grid">` that clears every entry in the LiveMap.
- Clicking a pixel button must write the current color picker value into the LiveMap via `useMutation` using `pixels.set("r,c", color)` so the change is broadcast to all clients. Clicking `#clear-grid` must remove every key from the LiveMap so all cells return to the empty state.

## Implementation Hints
- Initialize the project with `npx create-next-app@latest` using the App Router and TypeScript or JavaScript.
- Install `@liveblocks/client`, `@liveblocks/react`, and (if you choose server authentication) `@liveblocks/node`.
- Configure Liveblocks types (Presence, Storage) and pass an `initialStorage` containing `pixels: new LiveMap()` to `RoomProvider`.
- Use `useStorage` to read the LiveMap snapshot and `useMutation` to mutate it.
- The `data-color` attribute should be the empty string when the LiveMap has no entry for that coordinate.
- Read the run id from the `ZEALT_RUN_ID` environment variable and re-export it as a build-time public variable (for example, by adding `NEXT_PUBLIC_ZEALT_RUN_ID=$ZEALT_RUN_ID` to `.env.local` before running the build). Use it to construct a unique room id of the form `pixel-grid-${NEXT_PUBLIC_ZEALT_RUN_ID}` so concurrent evaluation runs do not share state.
- After verifying your implementation works locally, you MUST kill any running `next dev` / `next start` process before signaling completion. The verifier will start the production server itself.

## Acceptance Criteria
- Project path: /home/user/myproject
- Start command: npm run start (the verifier will run `npm run build` first, then start the server on port 3000)
- Port: 3000
- Route `/` renders the page with:
  - `<div id="pixel-grid">` containing exactly 64 `<button data-pixel="r,c" data-color="...">` elements, one for each `(r, c)` with `r in 0..7` and `c in 0..7`.
  - `<input id="pixel-color" type="color">`.
  - `<button id="clear-grid">`.
- Clicking a pixel button writes `pixel-color` value to `LiveMap` key `"r,c"` and updates the button's `data-color` attribute on every connected client.
- Clicking `#clear-grid` removes all entries from the LiveMap so every button's `data-color` becomes the empty string on every connected client.
- Room id used by the client is `pixel-grid-${NEXT_PUBLIC_ZEALT_RUN_ID}`.
- The agent MUST stop the development server (and any other server it started for manual testing) before completing the task.

