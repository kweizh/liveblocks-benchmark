The Liveblocks Comments API provides ready-to-use components for threads, but often requires custom metadata to support specific workflows like resolving a discussion.

You need to extend a default Liveblocks `Thread` component to include a "Resolve" button that updates the thread's state. 

**Constraints:**
- Must update a custom `metadata` field on the thread to mark `resolved: true`.
- The custom metadata must be correctly typed in `liveblocks.config.ts` under the `ThreadMetadata` type.
- Do not build a custom thread UI from scratch; utilize the provided Liveblocks Comments API and modify its metadata.