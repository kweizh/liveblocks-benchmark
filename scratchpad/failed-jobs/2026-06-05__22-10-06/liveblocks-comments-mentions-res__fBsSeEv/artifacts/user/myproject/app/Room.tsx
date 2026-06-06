"use client";

import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { CommentsPanel } from "./CommentsPanel";

// NOTE (executor): The LiveblocksProvider below is intentionally minimal.
// The Composer will not yet show @mention suggestions, and submitted comments
// will render raw user IDs (e.g. `user-alice`) instead of display names.
// Add the missing resolver callbacks here, backed by /api/users.
export function Room({ roomId }: { roomId: string }) {
  return (
    <LiveblocksProvider
      authEndpoint="/api/liveblocks-auth"
      resolveUsers={async ({ userIds }) => {
        const response = await fetch("/api/users");
        if (!response.ok) return [];
        const users = await response.json();
        return userIds.map((userId) => {
          const user = users.find((u: any) => u.id === userId);
          return user ? { name: user.name, avatar: user.avatar } : undefined;
        });
      }}
      resolveMentionSuggestions={async ({ text }) => {
        const response = await fetch("/api/users");
        if (!response.ok) return [];
        const users = await response.json();

        if (!text) {
          return users.map((user: any) => user.id);
        }

        const lowerText = text.toLowerCase();
        return users
          .filter(
            (user: any) =>
              user.name.toLowerCase().startsWith(lowerText) ||
              user.id.toLowerCase().startsWith(lowerText)
          )
          .map((user: any) => user.id);
      }}
    >
      <RoomProvider id={roomId}>
        <ClientSideSuspense fallback={<div>Loading comments…</div>}>
          <CommentsPanel />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
