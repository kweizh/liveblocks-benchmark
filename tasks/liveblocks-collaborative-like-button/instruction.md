# Liveblocks Collaborative Like Button

## Background
You are building a real-time collaborative Like button using **Liveblocks v2** with the **Next.js App Router**. Multiple users connected to the same room must see the like count update instantly when any user clicks the button. The count must persist after a page reload because it lives in Liveblocks Storage (not Presence).

## Requirements
- Build a Next.js (App Router) page at the route `/` that renders a single page containing the collaborative Like button.
- Use Liveblocks v2 React Storage to store a single shared field `likes: number` at the root of the room storage.
- Each click of the Like button increments `likes` by 1 atomically using `useMutation`.
- Render the button as `<button id="like-button">` and the count as `<span id="like-count">N</span>` where `N` is the current value of `likes`.
- Multiple browser tabs joined to the same room must observe the same up-to-date count without manual reload.
- The count must persist across page reloads (Storage persistence).

## Implementation Hints
- Use the public Liveblocks Cloud (no self-hosting). Use the official **v2** React API (`@liveblocks/client`, `@liveblocks/react`).
- Authenticate the client with the **public key** from the environment variable `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` (frontend env) using `<LiveblocksProvider publicApiKey=...>`.
- Wrap the page in a `RoomProvider` with `initialStorage={{ likes: 0 }}` and a `ClientSideSuspense` fallback for storage loading.
- Read the count with `useStorage((root) => root.likes)` and increment using `useMutation(({ storage }) => storage.set("likes", (storage.get("likes") ?? 0) + 1), [])`.
- The room id MUST include the current `run-id` so concurrent evaluation runs don't share state. Read `run-id` from the `NEXT_PUBLIC_ZEALT_RUN_ID` environment variable and build the room id as `like-button-${NEXT_PUBLIC_ZEALT_RUN_ID}`.
- `ZEALT_RUN_ID` is provided in the environment; you MUST re-export it as `NEXT_PUBLIC_ZEALT_RUN_ID` (e.g., `export NEXT_PUBLIC_ZEALT_RUN_ID="$ZEALT_RUN_ID"`) before building or starting the Next.js app so the value is available to client-side code.
- Mark Liveblocks-using components with the `"use client"` directive — they cannot be Server Components.
- After verifying your implementation works locally, KILL any running dev server. The verifier will start the production server itself.

## Acceptance Criteria
- Project path: /home/user/myproject
- Start command: `npm run build && npm run start`
- Port: 3000
- Route `/` renders a page that includes:
  - A button element with `id="like-button"`.
  - A `<span id="like-count">` whose text content is the current integer value of the `likes` field from Liveblocks Storage.
- Clicking `#like-button` increments the shared `likes` counter in Liveblocks Storage by exactly 1 per click.
- All connected browser sessions in the same room observe the latest count without a manual reload.
- The counter value persists after a hard page reload (loaded from Liveblocks Storage).
- The Liveblocks room id used by the page MUST follow the pattern `like-button-${NEXT_PUBLIC_ZEALT_RUN_ID}`.
- The frontend uses the public key from `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY`.

