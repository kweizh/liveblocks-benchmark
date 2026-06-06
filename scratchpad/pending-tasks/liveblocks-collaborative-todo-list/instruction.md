# Collaborative Todo List with Liveblocks Storage

## Background
A Next.js skeleton with Liveblocks already wired up exists at `/home/user/myproject`. The `liveblocks.config.ts` defines a `Storage` type with `todos: LiveList<LiveObject<{ id: string; text: string; done: boolean }>>`, and a `RoomProvider` mounts the page with the initial storage `{ todos: new LiveList([]) }`. The Next.js auth endpoint and the `LiveblocksProvider` are already configured to use the real Liveblocks cloud via the `LIVEBLOCKS_SECRET_KEY` and `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` environment variables.

Your job is to build the realtime collaborative todo list on top of this skeleton. The rendered page must reflect every change made by every user in the same room within at most a few seconds, with no manual reload.

## Requirements
Implement the following behaviors inside the existing Next.js app:

1. **Render the todo list** using a `useStorage` selector. Each row must display the todo text, a checkbox bound to `done`, and a delete control.
2. **Add todo**: an input field plus an "Add" button (and Enter-key submit) that pushes a new `LiveObject` `{ id, text, done: false }` onto the `todos` `LiveList`. `id` must be a freshly generated unique string (e.g. `crypto.randomUUID()`). The input must clear after a successful add and empty text must be rejected.
3. **Toggle done**: clicking a row's checkbox must flip the `done` flag on the underlying `LiveObject` so every client in the room sees the change.
4. **Delete todo**: clicking the row's delete control must remove that item from the `todos` `LiveList`.
5. **Clear completed**: a single "Clear completed" button that removes every todo whose `done` is `true` from the `LiveList` inside a **single batched mutation** (one `useMutation` callback invocation), so other clients see all removals atomically rather than one-by-one.
6. **Room scoping**: the page must mount the `RoomProvider` with the room id `harbor-todo-${ZEALT_RUN_ID}`. The evaluation harness only injects `ZEALT_RUN_ID` (server-side); the browser bundle cannot read it directly. You **MUST** re-export it as `NEXT_PUBLIC_ZEALT_RUN_ID` through `next.config.js` (e.g. `env.NEXT_PUBLIC_ZEALT_RUN_ID = process.env.ZEALT_RUN_ID`) or by writing it into `.env`/`.env.local` during build so `NEXT_PUBLIC_ZEALT_RUN_ID` mirrors `ZEALT_RUN_ID` exactly. Both browser tabs join the same room id.

## Implementation Hints
- Read todos with the `useStorage` hook and a selector that maps the `LiveList` into a plain array suitable for rendering.
- Use `useMutation` for every write so that updates are batched and sent over the network as a single op when appropriate.
- The clear-completed action should iterate the `LiveList` and call `LiveList.delete` (or equivalent) for each completed item **inside one `useMutation` callback** so they ship as one batched op.
- The room id must include `run-id` (from `ZEALT_RUN_ID`) so concurrent evaluation runs do not collide on the same Liveblocks room.
- Do not introduce a separate database or mock layer: all state lives in Liveblocks Storage.

## Acceptance Criteria
- Project path: /home/user/myproject
- Start command: npm run dev
- Port: 3000
- Route to verify: `/` (the home page renders the collaborative todo list).
- Required DOM contracts for verification (use the listed `data-testid` attributes):
  - `data-testid="new-todo-input"`: the text input for new todos.
  - `data-testid="add-todo-button"`: the button that adds the typed todo.
  - `data-testid="clear-completed-button"`: the button that clears all completed todos in one batched mutation.
  - `data-testid="todo-list"`: the container element that holds every todo row.
  - For each todo, a row element with `data-testid="todo-item"` and attribute `data-todo-text="<text>"`. The row must contain:
    - `data-testid="todo-checkbox"`: an `<input type="checkbox">` whose `checked` state mirrors `done`.
    - `data-testid="todo-text"`: an element whose text content is the todo text.
    - `data-testid="delete-todo-button"`: the button that deletes that row.
- Room id used by `RoomProvider`: `harbor-todo-${ZEALT_RUN_ID}` (where `ZEALT_RUN_ID` is read from the environment).
- The page must use the real Liveblocks cloud (no mocks). The provided `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` and `LIVEBLOCKS_SECRET_KEY` must remain the source of credentials.
- Realtime contract: an action performed in one browser tab (add / toggle / delete / clear-completed) must become visible in a second independent browser tab (different Playwright `BrowserContext`) that joined the same room id, without reload, within a reasonable wait window (the verifier waits up to ~15 seconds per assertion).
- All four CRUD-style behaviors above must be implemented; the `clear completed` action must be performed inside a single `useMutation` callback so it is batched as one op.

