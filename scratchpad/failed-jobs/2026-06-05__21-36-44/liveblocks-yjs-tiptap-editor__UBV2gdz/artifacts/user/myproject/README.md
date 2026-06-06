# Liveblocks + Yjs + Tiptap Collaborative Editor

A Next.js (App Router) scaffold for a realtime collaborative rich-text editor.
The scaffold currently renders a single-user Tiptap editor with StarterKit.

You must finish wiring up:

- The `@liveblocks/yjs` provider (Y.Doc sync via Liveblocks cloud).
- Tiptap's `Collaboration` + `CollaborationCursor` extensions.
- A formatting toolbar (Bold / Italic / H1 / H2 / Bullet List).
- A connected-users indicator using `useSelf()` + `useOthers()`.
- The `POST /api/liveblocks-auth` route (currently returns 501) — it must
  return a real Liveblocks ID-token session with the user's display name
  and color stored as `UserMeta.info`.

Required env vars (already provided in the container):

- `LIVEBLOCKS_SECRET_KEY`
- `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY`

Run `npm run dev` to start the app on port 3000.
