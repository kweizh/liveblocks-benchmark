"use client";

import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { CommentsPanel } from "./CommentsPanel";

async function resolveMentionSuggestions({ text }: { text: string }) {
  const response = await fetch("/api/users");
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  const users = await response.json();
  if (!text) {
    return users.map((user: any) => user.id);
  }
  const query = text.toLowerCase();
  return users
    .filter((user: any) => 
      user.name.toLowerCase().startsWith(query) || 
      user.id.toLowerCase().startsWith(query)
    )
    .map((user: any) => user.id);
}

async function resolveUsers({ userIds }: { userIds: string[] }) {
  const response = await fetch("/api/users");
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  const users = await response.json();
  return userIds.map((id) => {
    const user = users.find((u: any) => u.id === id);
    return user ? { name: user.name, avatar: user.avatar } : undefined;
  });
}

// NOTE (executor): The LiveblocksProvider below is intentionally minimal.
// The Composer will not yet show @mention suggestions, and submitted comments
// will render raw user IDs (e.g. `user-alice`) instead of display names.
// Add the missing resolver callbacks here, backed by /api/users.
export function Room({ roomId }: { roomId: string }) {
  return (
    <LiveblocksProvider
      authEndpoint="/api/liveblocks-auth"
      resolveMentionSuggestions={resolveMentionSuggestions}
      resolveUsers={resolveUsers}
    >
      <RoomProvider id={roomId}>
        <ClientSideSuspense fallback={<div>Loading comments…</div>}>
          <CommentsPanel />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
