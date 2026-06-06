### 1. Library Overview

*   **Description**: Liveblocks is a real-time collaboration infrastructure that provides developers with the primitives needed to build multiplayer experiences like collaborative whiteboards, text editors, and forms. It handles WebSocket management, state synchronization (via CRDTs), and presence tracking.
*   **Ecosystem Role**: It acts as the "collaboration layer" in the tech stack, sitting between the frontend (React, Vue, JS) and the backend (Node.js). It integrates deeply with rich-text editors like Lexical, Tiptap, and BlockNote.
*   **Project Setup**:
    1.  Install core packages: `npm install @liveblocks/client @liveblocks/react @liveblocks/react-ui`
    2.  Initialize configuration: `npx create-liveblocks-app@latest --init --framework react`
    3.  Configure `liveblocks.config.ts` with types for Presence and Storage.
    4.  Wrap the application with `LiveblocksProvider` and `RoomProvider`.

### 2. Core Primitives & APIs

*   **Presence**: Temporary state that disappears when a user leaves (e.g., cursor positions, typing indicators).
    *   `useMyPresence`, `useUpdateMyPresence`: Manage the current user's temporary state.
    *   `useOthers`: Subscribe to other users' presence in the room.
*   **Storage**: Persistent, conflict-free state (CRDTs) that remains in the room after users leave.
    *   `LiveObject`, `LiveList`, `LiveMap`: Core data structures for nested collaborative state.
    *   `useStorage`: Hook to read storage state using a selector (returns immutable data).
    *   `useMutation`: Hook to modify storage; provides access to the mutable root and automatically batches updates.
*   **Comments & Notifications**: Ready-to-use UI components and hooks for threads, mentions, and inbox notifications.
    *   `useThreads`, `Thread`, `Composer`, `InboxNotification`.

**Code Snippet: Collaborative Counter & Cursors**
```tsx
// liveblocks.config.ts
export type Presence = { cursor: { x: number, y: number } | null };
export type Storage = { counter: number };

// App.tsx
import { useMyPresence, useUpdateMyPresence, useStorage, useMutation } from "./liveblocks.config";

function Scene() {
  const counter = useStorage((root) => root.counter);
  const updateMyPresence = useUpdateMyPresence();

  const increment = useMutation(({ storage }) => {
    const root = storage.get("counter");
    storage.set("counter", counter + 1);
  }, [counter]);

  return (
    <div onPointerMove={(e) => updateMyPresence({ cursor: { x: e.clientX, y: e.clientY } })}>
      <button onClick={() => increment()}>Count: {counter}</button>
    </div>
  );
}
```
*   **Links**: [React API Reference](https://liveblocks.io/docs/api-reference/liveblocks-react), [Storage Guide](https://liveblocks.io/docs/guides/how-to-use-liveblocks-storage-with-react), [Comments API](https://liveblocks.io/docs/api-reference/liveblocks-react-ui#Comments)

### 3. Real-World Use Cases & Templates

*   **Collaborative Whiteboard**: Using `LiveList` for layers and `Presence` for cursors. [Example](https://liveblocks.io/examples/collaborative-whiteboard/nextjs)
*   **Rich-Text Editing**: Integration with Yjs and Tiptap/Lexical for Notion-like experiences. [Example](https://liveblocks.io/examples/collaborative-text-editor-advanced/nextjs)
*   **Multiplayer Forms**: Real-time sync of input fields and "Someone is typing" indicators. [Example](https://liveblocks.io/examples/multiplayer-form/nextjs)
*   **Next.js Starter Kit**: A comprehensive SaaS template with auth, dashboard, and multiple collab tools. [GitHub](https://github.com/liveblocks/liveblocks/tree/main/starter-kits/nextjs-starter-kit)

### 4. Developer Friction Points

*   **Authentication Complexity**: Setting up the `api/liveblocks-auth` endpoint correctly with `identifyUser` (ID tokens) vs `prepareSession` (Access tokens) is a common hurdle for beginners. [Auth Docs](https://liveblocks.io/docs/authentication)
*   **React 18 vs 17 Batching**: In React 17, developers must manually pass `unstable_batchedUpdates` to `RoomProvider` to avoid sync issues. [Troubleshooting](https://liveblocks.io/docs/api-reference/troubleshooting)
*   **TypeScript Declarations**: Liveblocks relies on global type declarations in `liveblocks.config.ts`. If these are defined as `interface` instead of `type`, it can lead to confusing merge errors. [Docs](https://liveblocks.io/docs/api-reference/liveblocks-react#liveblocks-config-ts)
*.  **SDK/API Version**: The liveblocks API has rewrite and use v2 version, please make sure to use the latest version of the SDK/API.

### 5. Evaluation Ideas

*   **Simple**: Implement a "Someone is typing..." indicator using `useMyPresence` and `useOthers`.
*   **Simple**: Create a collaborative "Like" button that syncs a count across all users using `useMutation`.
*   **Medium**: Build a shared Todo list where items can be added, toggled, and deleted using `LiveList`.
*   **Medium**: Implement a "Follow" feature where clicking a user's avatar snaps your view to their cursor position.
*   **Complex**: Set up a Next.js auth endpoint that restricts room access based on a mock "Organization ID" in the user's metadata.
*   **Complex**: Build a comment sidebar that allows users to "Resolve" threads, updating a custom `metadata` field on the thread.
*   **Complex**: Implement a "Selection" system for a whiteboard where multiple users can see who has selected which shape.

### 6. Sources

1.  [Liveblocks Documentation Index (llms.txt)](https://liveblocks.io/llms.txt) - Structured overview of all documentation.
2.  [Liveblocks Full Documentation (llms-full.txt)](https://liveblocks.io/llms-full.txt) - Deep technical details and API references.
3.  [React API Reference](https://liveblocks.io/docs/api-reference/liveblocks-react) - Hooks and component details.
4.  [Authentication Guide](https://liveblocks.io/docs/authentication) - Details on ID tokens and Access tokens.
5.  [Liveblocks Examples Gallery](https://liveblocks.io/examples) - Source of real-world patterns and templates.
6.  [GitHub Troubleshooting Page](https://liveblocks.io/docs/api-reference/troubleshooting) - Common issues and solutions.