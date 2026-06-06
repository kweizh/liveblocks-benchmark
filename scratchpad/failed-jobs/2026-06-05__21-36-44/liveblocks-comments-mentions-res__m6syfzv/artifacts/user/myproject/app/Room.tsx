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
  if (!res.ok) return [];
  return res.json();
}

async function resolveMentionSuggestions({
  text,
}: {
  text: string;
  roomId: string;
}): Promise<string[]> {
  const users = await fetchUsers();
  const query = text.toLowerCase();
  if (!query) {
    return users.map((u) => u.id);
  }
  return users
    .filter(
      (u) =>
        u.name.toLowerCase().startsWith(query) ||
        u.id.toLowerCase().startsWith(query)
    )
    .map((u) => u.id);
}

async function resolveUsers({
  userIds,
}: {
  userIds: string[];
}): Promise<({ name: string; avatar: string } | undefined)[]> {
  const users = await fetchUsers();
  const map = new Map(users.map((u) => [u.id, u]));
  return userIds.map((id) => {
    const u = map.get(id);
    if (!u) return undefined;
    return { name: u.name, avatar: u.avatar };
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
