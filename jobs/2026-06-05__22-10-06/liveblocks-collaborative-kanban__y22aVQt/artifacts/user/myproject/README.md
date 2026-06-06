# Liveblocks Collaborative Kanban (Scaffold)

This is a starter scaffold for a Liveblocks-powered Kanban board. The empty
columns are already rendered; the executor must implement add/edit/delete and
drag-and-drop between columns using `useMutation`, `LiveList`, `LiveObject`, and
`LiveMap`.

## Required environment variables

- `LIVEBLOCKS_SECRET_KEY` — server-side secret used by `/api/liveblocks-auth`.
- `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` — public key for the browser client.
- `ZEALT_RUN_ID` — used to derive the room id (`kanban-${id}`). The harness only
  provides `ZEALT_RUN_ID`; the agent must mirror it into the client by setting
  `NEXT_PUBLIC_ZEALT_RUN_ID` (e.g. in `next.config.js` `env`) so the browser
  bundle can read it as `process.env.NEXT_PUBLIC_ZEALT_RUN_ID`.

## Scripts

- `npm run dev` — development server.
- `npm run build && npm run start` — production build & start on port 3000.
