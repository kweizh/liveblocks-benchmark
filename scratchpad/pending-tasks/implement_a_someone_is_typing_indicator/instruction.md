Liveblocks Presence is designed for temporary state that disappears when a user leaves the room, making it perfect for typing indicators.

You need to build a React component that shows when other users in the room are currently typing in a text input field. 

**Constraints:**
- Must use the `useMyPresence` hook to set an `isTyping` boolean when the input field changes.
- Must use the `useOthers` hook to filter and display the number of other users currently typing.
- Do NOT use Liveblocks Storage (`useStorage` or `useMutation`) for this task, as typing status is ephemeral.