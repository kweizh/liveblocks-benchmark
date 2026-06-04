Liveblocks Storage allows you to persist conflict-free state (CRDTs) that remains in the room even after all users disconnect. 

You need to create a collaborative "Like" button in a React application that syncs a global counter across all connected clients in real-time. 

**Constraints:**
- Must use the `useStorage` hook to read the current `likesCount` from the storage root.
- Must use the `useMutation` hook to increment the counter to ensure updates are automatically batched and conflict-free.
- Do NOT use standard React `useState` for the counter value.