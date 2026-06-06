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
        try {
          const response = await fetch("/api/users");
          const users = await response.json();
          return userIds.map((userId) => {
            const user = users.find((u: any) => u.id === userId);
            return user ? { name: user.name, avatar: user.avatar } : undefined;
          });
        } catch (error) {
          console.error(error);
          return userIds.map(() => undefined);
        }
      }}
      resolveMentionSuggestions={async ({ text }) => {
        try {
          const response = await fetch("/api/users");
          const users = await response.json();
          
          if (!text) {
            return users.map((u: any) => u.id);
          }

          const lowerText = text.toLowerCase();
          return users
            .filter((u: any) => 
              u.name.toLowerCase().startsWith(lowerText) || 
              u.id.toLowerCase().startsWith(lowerText)
            )
            .map((u: any) => u.id);
        } catch (error) {
          console.error(error);
          return [];
        }
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
