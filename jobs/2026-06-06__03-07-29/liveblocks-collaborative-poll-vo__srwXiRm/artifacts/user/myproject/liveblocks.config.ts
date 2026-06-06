// Type definitions for the Liveblocks storage and user meta.
// These are for reference only — the app uses @liveblocks/react/suspense directly.

export type UserMeta = {
  id: string;
  info: {
    name: string;
    color: string;
    role: "owner" | "voter";
  };
};

export type PollOption = {
  id: string;
  label: string;
};

export type Storage = {
  poll: {
    question: string;
    options: PollOption[];
  };
  votes: Record<string, string>;
};