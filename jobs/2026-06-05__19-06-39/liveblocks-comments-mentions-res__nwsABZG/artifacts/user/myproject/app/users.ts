// Hardcoded in-memory user directory.
export type DirectoryUser = {
  id: string;
  name: string;
  avatar: string;
};

export const USERS: DirectoryUser[] = [
  { id: "user-alice",   name: "Alice",   avatar: "https://liveblocks.io/avatars/avatar-1.png" },
  { id: "user-bob",     name: "Bob",     avatar: "https://liveblocks.io/avatars/avatar-2.png" },
  { id: "user-charlie", name: "Charlie", avatar: "https://liveblocks.io/avatars/avatar-3.png" },
  { id: "user-dave",    name: "Dave",    avatar: "https://liveblocks.io/avatars/avatar-4.png" },
  { id: "user-eve",     name: "Eve",     avatar: "https://liveblocks.io/avatars/avatar-5.png" },
];
