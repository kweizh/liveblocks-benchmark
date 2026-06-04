Liveblocks relies heavily on global type declarations in `liveblocks.config.ts` for strictly typed hooks. Defining these as `interface` instead of `type` causes internal TypeScript merge errors.

You need to debug and fix a provided `liveblocks.config.ts` file that is failing to compile due to incorrect type declarations for `Presence` and `Storage`. 

**Constraints:**
- You MUST change any `interface` declarations for `Presence` and `Storage` to `type` aliases.
- Do not alter the actual data structure or variable names inside the types (e.g., keep `cursor: { x: number, y: number } | null` intact).
- Ensure the file successfully exports the types for the global `Liveblocks` module augmentation.