"use client";

import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { CommentsPanel } from "./CommentsPanel";

type DirectoryUser = {
  id: string;
  name: string;
  avatar: string;
};

async function fetchUsers(): Promise<DirectoryUser[]> {
  const res = await fetch("/api/users");
  return res.json();
}

async function resolveMentionSuggestions({
  text,
}: {
  text: string;
}): Promise<string[]> {
  const users = await fetchUsers();
  if (text === "") {
    return users.map((u) => u.id);
  }
  const lower = text.toLowerCase();
  return users
    .filter(
      (u) =>
        u.name.toLowerCase().startsWith(lower) ||
        u.id.toLowerCase().startsWith(lower)
    )
    .map((u) => u.id);
}

async function resolveUsers({
  userIds,
}: {
  userIds: string[];
}): Promise<Array<{ name: string; avatar: string } | undefined>> {
  const users = await fetchUsers();
  const byId = new Map<string, DirectoryUser>();
  for (const u of users) {
    byId.set(u.id, u);
  }
  return userIds.map((id) => {
    const user = byId.get(id);
    if (!user) return undefined;
    return { name: user.name, avatar: user.avatar };
  });
}

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
