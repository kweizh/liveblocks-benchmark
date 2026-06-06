export type MockUser = {
  userId: string;
  name: string;
  avatar: string;
  color: string;
};

// A fixed roster of 6 mock users used by the presence-avatars task.
// The executor MUST NOT rename or reorder this list; the verifier
// asserts on the names of mock user 0 and mock user 1.
export const MOCK_USERS: MockUser[] = [
  {
    userId: "user-0",
    name: "Charlie Cloud",
    avatar: "https://liveblocks.io/avatars/avatar-1.png",
    color: "#E11D48",
  },
  {
    userId: "user-1",
    name: "Dakota Drift",
    avatar: "https://liveblocks.io/avatars/avatar-2.png",
    color: "#2563EB",
  },
  {
    userId: "user-2",
    name: "Echo Everest",
    avatar: "https://liveblocks.io/avatars/avatar-3.png",
    color: "#16A34A",
  },
  {
    userId: "user-3",
    name: "Fox Falcon",
    avatar: "https://liveblocks.io/avatars/avatar-4.png",
    color: "#D97706",
  },
  {
    userId: "user-4",
    name: "Gale Garnet",
    avatar: "https://liveblocks.io/avatars/avatar-5.png",
    color: "#7C3AED",
  },
  {
    userId: "user-5",
    name: "Harper Halo",
    avatar: "https://liveblocks.io/avatars/avatar-6.png",
    color: "#0EA5E9",
  },
];

export function getMockUserByIndex(index: number): MockUser {
  const i = ((index % MOCK_USERS.length) + MOCK_USERS.length) % MOCK_USERS.length;
  return MOCK_USERS[i];
}

export function pickMockUserFromRequest(req: Request): MockUser {
  // Prefer ?user=<n> in the request URL, falling back to the mockUser cookie.
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("user");
    if (q !== null) return getMockUserByIndex(parseInt(q, 10) || 0);
  } catch {
    // ignore
  }
  const cookieHeader = req.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)mockUser=([^;]+)/);
  if (match) {
    const n = parseInt(decodeURIComponent(match[1]), 10);
    if (!Number.isNaN(n)) return getMockUserByIndex(n);
  }
  return getMockUserByIndex(0);
}
