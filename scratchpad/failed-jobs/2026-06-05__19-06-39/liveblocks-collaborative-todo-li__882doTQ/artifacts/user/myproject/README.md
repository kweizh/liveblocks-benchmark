# Collaborative Todo List (Liveblocks)

This skeleton is wired up with Liveblocks (LiveblocksProvider, RoomProvider,
liveblocks.config.ts Storage type, and an /api/liveblocks-auth route handler).

Required environment variables:

- `LIVEBLOCKS_SECRET_KEY` — server-side secret for the /api/liveblocks-auth route.
- `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` — exposed to the browser for direct cloud connection.

The room id is `harbor-todo-${ZEALT_RUN_ID}`; the value of `ZEALT_RUN_ID` is exposed
to the browser via `NEXT_PUBLIC_ZEALT_RUN_ID`.

Run `npm run dev` to start the app on port 3000.
