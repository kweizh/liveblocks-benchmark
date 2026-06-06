import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import { createClient } from "@liveblocks/client";

// ──────────────────────────────────────────────────────────────────────────
// Storage shape
// ──────────────────────────────────────────────────────────────────────────
export type PollOption = LiveObject<{ id: string; label: string }>;

export type Storage = {
  poll: LiveObject<{
    question: string;
    options: LiveList<PollOption>;
  }>;
  votes: LiveMap<string, string>; // userId -> optionId
};

// ──────────────────────────────────────────────────────────────────────────
// Presence & UserMeta types
// ──────────────────────────────────────────────────────────────────────────
export type Presence = Record<string, never>;

export type UserMeta = {
  id: string;
  info: {
    name: string;
    color: string;
    role: "owner" | "voter";
  };
};

// ──────────────────────────────────────────────────────────────────────────
// Create a module-level client.
// The authEndpoint function reads userId/name from a shared mutable ref
// that the page component sets before mounting the provider.
// ──────────────────────────────────────────────────────────────────────────
export const userRef = { userId: "anonymous", name: "anonymous" };

const client = createClient({
  authEndpoint: async (_room?: string) => {
    const res = await fetch("/api/liveblocks-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userRef.userId,
        name: userRef.name,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.token) {
      return {
        error: "forbidden" as const,
        reason: (data as { error?: string }).error ?? "Auth failed",
      };
    }
    return { token: data.token as string };
  },
});

// ──────────────────────────────────────────────────────────────────────────
// Typed hooks
// ──────────────────────────────────────────────────────────────────────────
const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useUpdateMyPresence,
  useSelf,
  useOthers,
  useOthersMapped,
  useOthersConnectionIds,
  useOther,
  useBroadcastEvent,
  useEventListener,
  useErrorListener,
  useStorage,
  useBatch,
  useHistory,
  useUndo,
  useRedo,
  useCanUndo,
  useCanRedo,
  useStorageRoot,
  useMutation,
  useStatus,
  useLostConnectionListener,
  suspense: {
    RoomProvider: RoomProviderSuspense,
    useRoom: useRoomSuspense,
    useSelf: useSelfSuspense,
    useStorage: useStorageSuspense,
    useMutation: useMutationSuspense,
    useOthers: useOthersSuspense,
    useStatus: useStatusSuspense,
  },
} = createRoomContext<Presence, Storage, UserMeta>(client);

export {
  RoomProvider,
  useRoom,
  useMyPresence,
  useUpdateMyPresence,
  useSelf,
  useOthers,
  useOthersMapped,
  useOthersConnectionIds,
  useOther,
  useBroadcastEvent,
  useEventListener,
  useErrorListener,
  useStorage,
  useBatch,
  useHistory,
  useUndo,
  useRedo,
  useCanUndo,
  useCanRedo,
  useStorageRoot,
  useMutation,
  useStatus,
  useLostConnectionListener,
  // Suspense variants
  RoomProviderSuspense,
  useRoomSuspense,
  useSelfSuspense,
  useStorageSuspense,
  useMutationSuspense,
  useOthersSuspense,
  useStatusSuspense,
};

export { LiveList, LiveMap, LiveObject };
