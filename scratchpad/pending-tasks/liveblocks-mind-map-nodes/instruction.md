# Collaborative Mind Map with Liveblocks Storage

## Background
Build a real-time collaborative mind-map editor with Next.js and Liveblocks. Multiple users join the same room and edit a tree of nodes (a parent node and any number of child nodes). Every operation — creating, moving, renaming, and deleting nodes — must propagate to every other connected client in real time through Liveblocks Storage (CRDT-backed `LiveMap`/`LiveObject`).

This task uses the **real Liveblocks cloud** for state synchronization. Do **NOT** mock Liveblocks or implement a local fake; the running application must authenticate with the Liveblocks cloud using the provided keys and connect over WebSockets.

## Requirements
Implement a single Next.js application that provides a collaborative SVG mind-map canvas with the following features:

1. **Storage shape**: persistent state is stored under `Storage.nodes` as a `LiveMap<string, LiveObject<MindMapNode>>` where each `MindMapNode` has `{ id: string, label: string, x: number, y: number, parentId: string | null }`. The room starts with no nodes (empty `LiveMap`).
2. **Canvas rendering**: render the mind map inside an SVG element. Each node is drawn as an SVG `<circle>` with its `label` displayed as text. For every node whose `parentId` is not `null`, draw an SVG `<line>` connecting the node to its parent.
3. **Create a new node by clicking empty canvas**: when the user clicks on empty canvas area (not on an existing node), a new node is added at the clicked `(x, y)` coordinates. If there is no root yet (i.e. the map is empty), the new node becomes the root with `parentId = null`. Otherwise the new node is added as a child of the root (or of the currently selected node — either policy is acceptable as long as a parent/child link is created and visible).
4. **Drag a node to move it**: pressing the mouse on a node and dragging it must update its `x`/`y` in Liveblocks Storage in real time so other clients see the position move while dragging. The drag handler must use a throttled `useMutation` (Liveblocks' built-in throttling via `useMutation` dependency batching is acceptable) so that the network is not flooded with one mutation per pixel.
5. **Double-click to rename**: double-clicking a node opens an inline text input (or `prompt`-style dialog) that lets the user change the node's `label`. The new label must be persisted in Liveblocks Storage and become visible to all connected users.
6. **Delete key removes a node and all its descendants**: when a node is selected (e.g. by single-click) and the user presses the `Delete` (or `Backspace`) key, the selected node is removed together with **all of its descendants, recursively**. The deletion must be applied to the shared `LiveMap` so every connected client sees the same removal.
7. **Real Liveblocks authentication**: the app must read `LIVEBLOCKS_SECRET_KEY` from the server environment and `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` from the client environment. Either an `/api/liveblocks-auth` route (using `Liveblocks` server client + ID tokens / access tokens) or the public-key flow is acceptable, as long as a real cloud connection is established at runtime.
8. **Room name**: the canvas must join a room whose name is derived from `ZEALT_RUN_ID`, namely `mind-map-${ZEALT_RUN_ID}`. This is required to avoid cross-trial conflicts when many trials share the same Liveblocks project. The evaluation harness only injects `ZEALT_RUN_ID` (server-side); the browser bundle cannot read it directly. You **MUST** re-export it as `NEXT_PUBLIC_ZEALT_RUN_ID` through `next.config.js` (e.g. `env.NEXT_PUBLIC_ZEALT_RUN_ID = process.env.ZEALT_RUN_ID`) or by writing it into `.env`/`.env.local` during build so `NEXT_PUBLIC_ZEALT_RUN_ID` mirrors `ZEALT_RUN_ID` exactly.

## Implementation Hints
- Use `@liveblocks/client` and `@liveblocks/react` (App Router + `"use client"` is recommended).
- Define your Storage and Presence types via `liveblocks.config.ts` (or the global `Liveblocks` type augmentation).
- Read `Storage.nodes` with `useStorage((root) => root.nodes)`; mutate it with `useMutation`.
- For drag updates, attach pointer-move handlers to the SVG and call a `useMutation` that calls `node.update({ x, y })` on the appropriate `LiveObject`.
- For recursive deletion, walk the in-memory copy of `nodes` to collect every descendant whose chain of `parentId`s leads back to the target, then call `nodes.delete(id)` for each one.
- Read the room id from `process.env.NEXT_PUBLIC_ZEALT_RUN_ID` after forwarding `ZEALT_RUN_ID` to the client via `NEXT_PUBLIC_ZEALT_RUN_ID` in `next.config.js` (the harness only provides `ZEALT_RUN_ID`; you are responsible for the re-export).
- Do **NOT** wrap Liveblocks in any local stub or mock — the verification opens two real browser contexts and expects state to sync through the cloud.

## Acceptance Criteria
- Project path: /home/user/myproject
- Start command: npm run dev
- Port: 3000
- Routes:
  - `GET /` — renders the collaborative mind-map page. The page must contain an `<svg>` element with `data-testid="mind-map-canvas"` covering the visible canvas area.
  - Each node circle in the SVG must have `data-testid="mind-map-node"` and `data-node-id="<node-id>"` attributes.
  - Each node's label text must be rendered inside the SVG with `data-testid="mind-map-label"` and `data-node-id="<node-id>"`.
  - Each parent/child connector line must be rendered as an `<line>` (or `<path>`) with `data-testid="mind-map-edge"` and `data-parent-id="<parent-id>"` and `data-child-id="<child-id>"`.
- Behavior:
  - Clicking the empty canvas adds a new node visible to all connected clients.
  - Dragging a node updates its `x`/`y` in Liveblocks Storage and is reflected on all connected clients.
  - Double-clicking a node lets the user rename it; the new label appears on all connected clients.
  - Selecting a node and pressing the `Delete` key removes the node and all of its descendants on all connected clients.
- Environment:
  - The app **must** connect to the real Liveblocks cloud using `LIVEBLOCKS_SECRET_KEY` and `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY`.
  - The room name must be `mind-map-${ZEALT_RUN_ID}` where `ZEALT_RUN_ID` is read from the environment.

